"""Canting AI backend: a stateless FastAPI app for the /api routes.

Nothing is stored on the server: generated images are returned in the response, and designs
and templates are saved in the visitor's own browser. A visitor can bring their own Gemini key
(sent per request in the X-Gemini-Key header); without one the app runs in free mock mode.

Run locally (from the project root):  python -m uvicorn app:app --reload --port 8000
"""
import base64
import io
import os
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def _load_env():
    """Minimal .env loader for local development. Values in backend/.env win over system env vars."""
    f = ROOT / ".env"
    if not f.exists():
        return
    for line in f.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip().strip('"').strip("'")


_load_env()

from fastapi import FastAPI, Header, HTTPException  # noqa: E402
from fastapi.responses import FileResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402
from PIL import Image  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

import prompts  # noqa: E402
from gemini import IMAGE_MODELS, SIZE_PX, AIError, GeminiAI  # noqa: E402

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
        has_sketch=bool(body.sketch), format=body.format)

    t0 = time.perf_counter()
    try:
        png = await ai.image(text, images, palette=body.palette or (tpl or {}).get("palette"),
                             aspect=prompts.fmt(body.format)["aspect"], model=body.model, size=body.size,
                             api_key=x_gemini_key)
    except AIError as e:
        raise HTTPException(502, str(e))
    ms = int((time.perf_counter() - t0) * 1000)
    return image_out(png, ms=ms, mock=ai.is_mock(x_gemini_key), variation=body.variation,
                     format=body.format, model=model_used(body.model))


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


# ---------------------------------------------------------------- static (local only; on Vercel the CDN serves public/)
if not os.getenv("VERCEL") and PUBLIC.exists():
    @app.get("/")
    def index():
        return FileResponse(PUBLIC / "index.html")

    app.mount("/", StaticFiles(directory=PUBLIC), name="public")
