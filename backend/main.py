"""Canting AI backend: a stateless FastAPI app for the /api routes.

Nothing is stored on the server: generated images are returned in the response, and designs
and templates are saved in the visitor's own browser. A visitor can bring their own Gemini key
(sent per request in the X-Gemini-Key header); without one the app runs in free mock mode.

Run locally (from the project root):  python -m uvicorn app:app --reload --port 8000
"""
import asyncio
import base64
import io
import os
import re
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def _load_env():
    """Minimal .env loader for local development. Values in backend/.env win over system env vars,
    except MOCK_AI when it is set on the command line (so a mock test server can run next to a real one)."""
    f = ROOT / ".env"
    if not f.exists():
        return
    for line in f.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            if k.strip() == "MOCK_AI" and "MOCK_AI" in os.environ:
                continue
            os.environ[k.strip()] = v.strip().strip('"').strip("'")


_load_env()

from fastapi import FastAPI, Header, HTTPException  # noqa: E402
from fastapi.responses import FileResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402
from PIL import Image  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

import prompts  # noqa: E402
from gemini import IMAGE_MODELS, SIZE_PX, AIError, GeminiAI, mock_lineart  # noqa: E402

app = FastAPI(title="Canting AI")
ai = GeminiAI()
PUBLIC = ROOT.parent / "public"

MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_RESPONSE_BYTES = 3_200_000   # Vercel caps a function response at 4.5 MB; base64 adds a third
SUPPORTED_ASPECTS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]


@app.middleware("http")
async def no_stale_frontend(request, call_next):
    """Always revalidate the frontend files so code changes show up without a hard refresh."""
    resp = await call_next(request)
    if not request.url.path.startswith("/api/"):
        resp.headers["Cache-Control"] = "no-cache"
    return resp


def decode_data_url(s: str) -> bytes:
    """'data:image/png;base64,....' -> bytes"""
    try:
        b = base64.b64decode(s.split(",", 1)[1] if s.startswith("data:") else s)
    except Exception:
        raise HTTPException(400, "Gambar tidak valid.")
    if len(b) > MAX_IMAGE_BYTES:
        raise HTTPException(413, "Gambar terlalu besar (maks 8 MB).")
    return b


def image_out(png: bytes, **extra) -> dict:
    """The generated image as a WebP data URL (much smaller than PNG), plus its pixel size."""
    img = Image.open(io.BytesIO(png)).convert("RGB")
    for quality in (90, 82, 72, 60):
        buf = io.BytesIO()
        img.save(buf, "WEBP", quality=quality, method=4)
        if buf.tell() <= MAX_RESPONSE_BYTES:
            break
    data = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
    return {"data": data, "w": img.width, "h": img.height, **extra}


def nearest_size(png: bytes) -> str:
    """The 1K/2K/4K step matching an existing image's long side, so an edit keeps its resolution."""
    long_side = max(Image.open(io.BytesIO(png)).size)
    return min(SIZE_PX, key=lambda s: abs(SIZE_PX[s] - long_side))


def nearest_aspect(png: bytes) -> str:
    """Pick the Gemini aspect ratio closest to an existing image's shape (so edits keep it)."""
    w, h = Image.open(io.BytesIO(png)).size
    return min(SUPPORTED_ASPECTS, key=lambda a: abs(int(a.split(":")[0]) / int(a.split(":")[1]) - w / h))


def model_used(model: str | None) -> str:
    return model if model in IMAGE_MODELS else ai.image_model


# ---------------------------------------------------------------- status + key check
@app.get("/api/status")
def status():
    return {"mock": ai.mock, "server_key": bool(ai.api_key) and not ai.force_mock,
            "image_model": ai.image_model, "text_model": ai.text_model,
            "image_models": [{"id": k, **v} for k, v in IMAGE_MODELS.items()]}


@app.post("/api/check-key")
async def check_key(x_gemini_key: str | None = Header(default=None)):
    if not (x_gemini_key or "").strip():
        raise HTTPException(400, "Masukkan API key dulu.")
    try:
        await ai.check_key(x_gemini_key)
    except AIError as e:
        raise HTTPException(401, str(e))
    return {"ok": True}


# ---------------------------------------------------------------- templates (built-ins only; custom ones live in the browser)
@app.get("/api/templates")
def templates():
    return [{"id": k, "name": m["name"], "description": m["description"], "palette": m["palette"],
             "origin": m["origin"], "meaning": m["meaning"], "builtin": True, "ref_images": []}
            for k, m in prompts.MOTIFS.items()]


class TemplateRef(BaseModel):
    """A custom template sent along with the request (it is stored in the visitor's browser)."""
    name: str = Field(max_length=80)
    description: str = Field(max_length=1200)
    palette: str | None = None
    refs: list[str] = Field(default_factory=list, max_length=3)  # reference images as data URLs


def resolve_template(template_id: str | None, template: TemplateRef | None):
    """(template dict for the prompt, its reference images)"""
    if template:
        return {"name": template.name, "description": template.description, "palette": template.palette}, \
            [decode_data_url(r) for r in template.refs]
    if template_id in prompts.MOTIFS:
        m = prompts.MOTIFS[template_id]
        return {"name": m["name"], "description": m["description"], "palette": m["palette"]}, []
    return None, []


# ---------------------------------------------------------------- generate
class GenerateIn(BaseModel):
    prompt: str = ""
    template_id: str | None = None      # a built-in motif …
    template: TemplateRef | None = None  # … or a custom template from the browser
    palette: str | None = None          # palette key or None = auto
    density: str = "medium"
    variation: int = 0                  # 0..3, the frontend fires one request per variation
    format: str = "tile"                # tile | kain | selendang | pinggiran (see prompts.FORMATS)
    model: str | None = None            # one of gemini.IMAGE_MODELS; None = IMAGE_MODEL
    size: str = "1K"                    # 1K | 2K | 4K, clamped to what the model accepts
    references: list[str] = Field(default_factory=list, max_length=3)  # data URLs
    sketch: str | None = None           # data URL
    dye: str | None = None              # "alam" (natural) | "sintetis" (synthetic) | None = from the palette
    creativity: int = Field(default=50, ge=0, le=100)  # 0 = faithful to the template … 100 = wild; sets temperature + prompt
    grounding: bool = False             # let Gemini look things up with Google Search (web + images) first


@app.post("/api/generate")
async def generate(body: GenerateIn, x_gemini_key: str | None = Header(default=None)):
    tpl, tpl_refs = resolve_template(body.template_id, body.template)
    if not (body.prompt.strip() or tpl or body.references or body.sketch):
        raise HTTPException(400, "Isi deskripsi, pilih template, unggah gambar, atau buat sketsa dulu.")

    images = [("template reference", r) for r in tpl_refs]
    images += [("user reference", decode_data_url(r)) for r in body.references]
    if body.sketch:
        images.append(("user sketch", decode_data_url(body.sketch)))

    text = prompts.generate_prompt(
        user_prompt=body.prompt, template=tpl, palette=body.palette, density=body.density,
        variation=body.variation, n_template_refs=len(tpl_refs), n_user_refs=len(body.references),
        has_sketch=bool(body.sketch), format=body.format, dye=body.dye,
        creativity=body.creativity, grounding=body.grounding)

    info: dict = {}
    t0 = time.perf_counter()
    try:
        png = await ai.image(text, images, palette=body.palette or (tpl or {}).get("palette"),
                             aspect=prompts.fmt(body.format)["aspect"], model=body.model, size=body.size,
                             api_key=x_gemini_key, temperature=round(0.3 + body.creativity * 0.014, 2),
                             grounding=body.grounding, info=info)
    except AIError as e:
        raise HTTPException(502, str(e))
    ms = int((time.perf_counter() - t0) * 1000)
    return image_out(png, ms=ms, mock=ai.is_mock(x_gemini_key), variation=body.variation,
                     format=body.format, model=model_used(body.model), **info)


# ---------------------------------------------------------------- edit
class EditIn(BaseModel):
    instruction: str
    image_data: str                     # the design to edit, as a data URL
    annotation: str | None = None       # data URL of the design with marker strokes drawn on it
    format: str = "tile"
    model: str | None = None
    size: str | None = None             # resolution to return; default = match the original


@app.post("/api/edit")
async def edit(body: EditIn, x_gemini_key: str | None = Header(default=None)):
    if not body.instruction.strip():
        raise HTTPException(400, "Tulis instruksi edit dulu.")
    original = decode_data_url(body.image_data)
    images = [("original design", original)]
    if body.annotation:
        images.append(("marked design", decode_data_url(body.annotation)))

    t0 = time.perf_counter()
    try:
        png = await ai.image(prompts.edit_prompt(body.instruction, bool(body.annotation), body.format), images,
                             aspect=nearest_aspect(original), model=body.model,
                             size=body.size or nearest_size(original), api_key=x_gemini_key)
    except AIError as e:
        raise HTTPException(502, str(e))
    ms = int((time.perf_counter() - t0) * 1000)
    return image_out(png, ms=ms, mock=ai.is_mock(x_gemini_key), model=model_used(body.model))


# ---------------------------------------------------------------- caption
class CaptionIn(BaseModel):
    name: str
    motif: str = "batik"
    origin: str = ""
    meaning: str = ""
    product: str
    brand: str = "Batik UMKM"
    lang: str = "id"


@app.post("/api/caption")
async def caption(body: CaptionIn, x_gemini_key: str | None = Header(default=None)):
    lang = "en" if body.lang == "en" else "id"
    text = prompts.caption_prompt(name=body.name, motif=body.motif, origin=body.origin, meaning=body.meaning,
                                  product=body.product, brand=body.brand, lang=lang)
    try:
        return {"text": await ai.text(text, api_key=x_gemini_key), "mock": ai.is_mock(x_gemini_key)}
    except AIError as e:
        raise HTTPException(502, str(e))


# ---------------------------------------------------------------- order assistant (chatbot)
class Brief(BaseModel):
    """The order brief the assistant fills in. No defaults: Gemini's response_schema does not accept them."""
    purpose: str
    product: str
    motif: str
    colours: str
    dye: str
    size: str
    quantity: str
    deadline: str
    notes: str
    format: str
    palette: str
    image_prompt: str


class ChatReply(BaseModel):
    reply: str
    ready: bool
    brief: Brief
    suggestions: list[str]


class ChatMsg(BaseModel):
    role: str                           # "user" (the customer) | "model" (the assistant)
    text: str = Field(default="", max_length=2000)
    image: str | None = None            # data URL of a sketch / photo the customer attached


class ChatIn(BaseModel):
    messages: list[ChatMsg] = Field(default_factory=list, max_length=40)
    shop: str = Field(default="Batik UMKM", max_length=80)
    lang: str = "id"


def _empty_brief(**kw) -> dict:
    return {**{k: "" for k in Brief.model_fields}, "format": "tile", **kw}


def _clean_brief(b: dict) -> dict:
    b = {**_empty_brief(), **{k: (v or "").strip() if isinstance(v, str) else v for k, v in b.items()}}
    b["format"] = b["format"] if b["format"] in prompts.FORMATS else "tile"
    b["palette"] = b["palette"] if b["palette"] in prompts.PALETTES else ""
    b["dye"] = b["dye"] if b["dye"] in prompts.DYE_RULES else ""
    return b


def _mock_chat(msgs: list[ChatMsg], lang: str) -> dict:
    """Scripted assistant for mock mode: asks the next question and fills the brief from the answers in order."""
    answers = [m.text.strip() or "(sketsa)" for m in msgs if m.role == "user"]
    has_sketch = any(m.image for m in msgs if m.role == "user")
    b = _empty_brief()
    for field, ans in zip(["purpose", "product", "motif", "colours", "size"], answers):
        b[field] = ans
    low = " ".join(answers).lower()
    if any(w in low for w in ("panjang", "long cloth", "jarik")):
        b["format"] = "kain"
    elif any(w in low for w in ("selendang", "shawl", "scarf")):
        b["format"] = "selendang"
    for words, key in [(("soga", "cokelat", "coklat", "brown"), "soga"), (("indigo", "biru", "blue", "nila"), "indigo"),
                       (("merah", "red"), "pesisir"), (("hijau", "green"), "hijau"), (("pastel", "pink"), "modern"),
                       (("mahoni",), "mahoni"), (("kuning", "yellow"), "tegeran"), (("hitam", "black"), "mono")]:
        if any(w in b["colours"].lower() for w in words):
            b["palette"] = key
            break
    if any(w in low for w in ("alam", "natural")):
        b["dye"] = "alam"
    elif any(w in low for w in ("sintetis", "synthetic", "cerah", "bright")):
        b["dye"] = "sintetis"
    for k, m in prompts.MOTIFS.items():
        if m["name"].lower() in b["motif"].lower():
            b["motif"] = m["name"]
    b["image_prompt"] = f"{b['motif'] or 'batik'} batik motif for {b['purpose'] or 'daily wear'}, colours: {b['colours'] or 'traditional'}" \
        + (", based on the customer's sketch" if has_sketch else "")
    ready = len(answers) >= 4
    if ready and len(answers) >= 5:
        reply = ("Terima kasih, Kak! Ringkasan pesanan sudah lengkap. Tekan **Lihat pratinjau** untuk melihat contoh desain dari AI. "
                 "Harga dan waktu pengerjaan nanti dikonfirmasi langsung oleh pengrajin." if lang == "id" else
                 "Thank you! The order summary is complete. Press **Show previews** to see AI design examples. "
                 "The maker will confirm price and time.")
        sugg = []
    else:
        reply, sugg = prompts.chat_mock_question(len(answers), lang)
        if ready:
            reply = ("Ringkasannya sudah cukup untuk pratinjau. " if lang == "id" else "That's enough for previews. ") + reply
    return {"reply": reply, "ready": ready, "brief": b, "suggestions": sugg, "mock": True}


@app.post("/api/chat")
async def chat(body: ChatIn, x_gemini_key: str | None = Header(default=None)):
    lang = "en" if body.lang == "en" else "id"
    if not any(m.role == "user" for m in body.messages):  # opening greeting: no AI call needed
        q, sugg = prompts.chat_mock_question(0, lang)
        return {"reply": q, "ready": False, "brief": _empty_brief(), "suggestions": sugg, "mock": ai.is_mock(x_gemini_key)}
    if ai.is_mock(x_gemini_key):
        await asyncio.sleep(0.5)
        return _mock_chat(body.messages, lang)

    msgs = [(m.role, m.text, decode_data_url(m.image) if m.image else None) for m in body.messages]
    if msgs[0][0] == "model":  # Gemini wants the conversation to start with the user
        msgs.insert(0, ("user", "(Pelanggan membuka chat pesanan.)", None))
    try:
        out = await ai.chat(prompts.chat_system(body.shop, lang), msgs, ChatReply, api_key=x_gemini_key)
    except AIError as e:
        raise HTTPException(502, str(e))
    out = out.model_dump() if hasattr(out, "model_dump") else dict(out)
    return {"reply": out["reply"], "ready": bool(out["ready"]), "brief": _clean_brief(out["brief"]),
            "suggestions": [s for s in out.get("suggestions", []) if s][:4], "mock": False}


# ---------------------------------------------------------------- tracing pattern (pola nyorek)
class LineArtIn(BaseModel):
    image_data: str
    model: str | None = None


@app.post("/api/lineart")
async def lineart(body: LineArtIn, x_gemini_key: str | None = Header(default=None)):
    original = decode_data_url(body.image_data)
    t0 = time.perf_counter()
    if ai.is_mock(x_gemini_key):
        png = await asyncio.to_thread(mock_lineart, original)
    else:
        size = "2K" if nearest_size(original) != "1K" else "1K"
        try:
            png = await ai.image(prompts.LINEART_PROMPT, [("original design", original)], aspect=nearest_aspect(original),
                                 model=body.model, size=size, api_key=x_gemini_key)
        except AIError as e:
            raise HTTPException(502, str(e))
    ms = int((time.perf_counter() - t0) * 1000)
    return image_out(png, ms=ms, mock=ai.is_mock(x_gemini_key))


# ---------------------------------------------------------------- Tanya Canting (design discussion friend)
class BuddyContext(BaseModel):
    page: str = Field(default="", max_length=40)
    design_name: str = Field(default="", max_length=120)
    motif: str = Field(default="", max_length=80)
    design_image: str | None = None     # data URL of the open design, sent with the newest message
    auto_edit: bool = False             # the user allowed Canting to apply [[EDIT]] suggestions by itself


class BuddyIn(BaseModel):
    messages: list[ChatMsg] = Field(default_factory=list, max_length=40)
    context: BuddyContext = Field(default_factory=BuddyContext)
    shop: str = Field(default="Batik UMKM", max_length=80)
    lang: str = "id"


ACTION_RE = re.compile(r"\[\[\s*(STUDIO|EDIT)\s*:\s*(.+?)\s*\]\]", re.S | re.I)


def split_actions(text: str, has_design: bool) -> tuple[str, list[dict]]:
    """Pull the [[STUDIO: …]] / [[EDIT: …]] suggestions out of the reply text."""
    actions, seen = [], set()
    for kind, val in ACTION_RE.findall(text):
        kind = kind.lower()
        if kind in seen or (kind == "edit" and not has_design):
            continue
        seen.add(kind)
        actions.append({"type": kind, "text": val.strip()})
    return ACTION_RE.sub("", text).strip(), actions


@app.post("/api/buddy")
async def buddy(body: BuddyIn, x_gemini_key: str | None = Header(default=None)):
    lang = "en" if body.lang == "en" else "id"
    ctx = body.context
    if not any(m.role == "user" for m in body.messages):
        raise HTTPException(400, "Tulis pesan dulu.")
    if ai.is_mock(x_gemini_key):
        await asyncio.sleep(0.6)
        reply = ("Ide menarik, Kak! (Mode mock: ini jawaban contoh. Masukkan API key untuk ngobrol sungguhan dengan Gemini.) "
                 "Bagaimana kalau dicoba versi Truntum dengan bunga melati kecil dan warna soga yang lembut?"
                 if lang == "id" else
                 "Nice idea! (Mock mode: this is a sample reply. Add an API key to really chat with Gemini.) "
                 "How about trying a Truntum version with small jasmine flowers in soft soga colours?")
        acts = [{"type": "studio", "text": "Truntum dengan bunga melati kecil, warna soga lembut" if lang == "id"
                 else "Truntum with small jasmine flowers in soft soga colours"}]
        return {"reply": reply, "actions": acts, "grounding": None, "mock": True}

    msgs = [(m.role, m.text, decode_data_url(m.image) if m.image else None) for m in body.messages]
    while msgs and msgs[0][0] == "model":  # Gemini wants the conversation to start with the user
        msgs.pop(0)
    has_design = bool(ctx.design_image)
    if has_design:  # attach the open design to the newest message
        role, text, img = msgs[-1]
        label = f"[Current design: {ctx.design_name or 'untitled'}]"
        if img is None:
            msgs[-1] = (role, f"{label}\n{text}", decode_data_url(ctx.design_image))
        else:
            msgs.insert(len(msgs) - 1, ("user", label, decode_data_url(ctx.design_image)))
    system = prompts.buddy_system(lang, body.shop, ctx.page, ctx.design_name if has_design else "", ctx.motif,
                                  auto_edit=ctx.auto_edit and has_design)
    try:
        text, grounding = await ai.buddy(system, msgs, api_key=x_gemini_key)
    except AIError as e:
        raise HTTPException(502, str(e))
    reply, actions = split_actions(text, has_design)
    return {"reply": reply or "…", "actions": actions, "grounding": grounding, "mock": False}


# ---------------------------------------------------------------- static (local only; on Vercel the CDN serves public/)
if not os.getenv("VERCEL") and PUBLIC.exists():
    @app.get("/")
    def index():
        return FileResponse(PUBLIC / "index.html")

    app.mount("/", StaticFiles(directory=PUBLIC), name="public")
