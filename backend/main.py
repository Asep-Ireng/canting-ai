"""Canting AI backend: FastAPI app that serves the frontend and the /api routes.

Run (from the backend folder):  python -m uvicorn main:app --reload --port 8000
"""
import base64
import io
import os
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def _load_env():
    """Minimal .env loader. Values in backend/.env win over system env vars."""
    f = ROOT / ".env"
    if not f.exists():
        return
    for line in f.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip().strip('"').strip("'")


_load_env()

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.responses import FileResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

import db  # noqa: E402
import prompts  # noqa: E402
from gemini import IMAGE_MODELS, SIZE_PX, AIError, GeminiAI  # noqa: E402

app = FastAPI(title="Canting AI")
ai = GeminiAI()
db.init()


@app.middleware("http")
async def no_stale_frontend(request, call_next):
    """Always revalidate the frontend files so code changes show up without a hard refresh."""
    resp = await call_next(request)
    if not request.url.path.startswith(("/images/", "/api/")):
        resp.headers["Cache-Control"] = "no-cache"
    return resp

MAX_IMAGE_BYTES = 8 * 1024 * 1024


def decode_data_url(s: str) -> bytes:
    """'data:image/png;base64,....' -> bytes"""
    try:
        b = base64.b64decode(s.split(",", 1)[1] if s.startswith("data:") else s)
    except Exception:
        raise HTTPException(400, "Gambar tidak valid.")
    if len(b) > MAX_IMAGE_BYTES:
        raise HTTPException(413, "Gambar terlalu besar (maks 8 MB).")
    return b


def image_url(iid: str) -> str:
    return f"/images/{iid}.png"


def image_info(iid: str, png: bytes, **extra) -> dict:
    from PIL import Image
    w, h = Image.open(io.BytesIO(png)).size
    return {"image_id": iid, "url": image_url(iid), "w": w, "h": h, **extra}


SUPPORTED_ASPECTS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]


def nearest_size(png: bytes) -> str:
    """The 1K/2K/4K step matching an existing image's long side, so an edit keeps its resolution."""
    from PIL import Image
    long_side = max(Image.open(io.BytesIO(png)).size)
    return min(SIZE_PX, key=lambda s: abs(SIZE_PX[s] - long_side))


def nearest_aspect(png: bytes) -> str:
    """Pick the Gemini aspect ratio closest to an existing image's shape (so edits keep it)."""
    from PIL import Image
    w, h = Image.open(io.BytesIO(png)).size
    return min(SUPPORTED_ASPECTS, key=lambda a: abs(int(a.split(":")[0]) / int(a.split(":")[1]) - w / h))


# ---------------------------------------------------------------- status
@app.get("/api/status")
def status():
    return {"mock": ai.mock, "image_model": ai.image_model, "text_model": ai.text_model,
            "image_models": [{"id": k, **v} for k, v in IMAGE_MODELS.items()], **db.stats()}


# ---------------------------------------------------------------- generate
class GenerateIn(BaseModel):
    prompt: str = ""
    template_id: str | None = None
    palette: str | None = None          # palette key or None = auto
    density: str = "medium"
    variation: int = 0                  # 0..3, the frontend fires one request per variation
    format: str = "tile"                # tile | kain | selendang | pinggiran (see prompts.FORMATS)
    model: str | None = None            # one of gemini.IMAGE_MODELS; None = IMAGE_MODEL from .env
    size: str = "1K"                    # 1K | 2K | 4K, clamped to what the model accepts
    references: list[str] = Field(default_factory=list, max_length=3)  # data URLs
    sketch: str | None = None           # data URL


@app.post("/api/generate")
async def generate(body: GenerateIn):
    tpl = db.get_template(body.template_id) if body.template_id else None
    if not (body.prompt.strip() or tpl or body.references or body.sketch):
        raise HTTPException(400, "Isi deskripsi, pilih template, unggah gambar, atau buat sketsa dulu.")

    images: list[tuple[str, bytes]] = []
    tpl_refs = (tpl or {}).get("ref_images", [])[:3]
    for iid in tpl_refs:
        try:
            images.append(("template reference", db.load_image(iid)))
        except FileNotFoundError:
            pass
    for r in body.references:
        images.append(("user reference", decode_data_url(r)))
    if body.sketch:
        images.append(("user sketch", decode_data_url(body.sketch)))

    text = prompts.generate_prompt(
        user_prompt=body.prompt, template=tpl, palette=body.palette, density=body.density,
        variation=body.variation, n_template_refs=len(tpl_refs), n_user_refs=len(body.references),
        has_sketch=bool(body.sketch), format=body.format)

    t0 = time.perf_counter()
    try:
        png = await ai.image(text, images, palette=body.palette or (tpl or {}).get("palette"),
                             aspect=prompts.fmt(body.format)["aspect"], model=body.model, size=body.size)
    except AIError as e:
        db.log_gen("generate", int((time.perf_counter() - t0) * 1000), False, ai.mock)
        raise HTTPException(502, str(e))
    ms = int((time.perf_counter() - t0) * 1000)
    db.log_gen("generate", ms, True, ai.mock)
    iid = db.save_image(png)
    return image_info(iid, png, ms=ms, mock=ai.mock, variation=body.variation, format=body.format,
                      model=body.model if body.model in IMAGE_MODELS else ai.image_model)


# ---------------------------------------------------------------- edit
class EditIn(BaseModel):
    instruction: str
    image_id: str | None = None         # an existing generated image …
    image_data: str | None = None       # … or a data URL (e.g. a rasterised built-in SVG design)
    annotation: str | None = None       # data URL of the design with marker strokes drawn on it
    format: str = "tile"
    model: str | None = None


@app.post("/api/edit")
async def edit(body: EditIn):
    if not body.instruction.strip():
        raise HTTPException(400, "Tulis instruksi edit dulu.")
    if body.image_id:
        try:
            original = db.load_image(body.image_id)
        except FileNotFoundError:
            raise HTTPException(404, "Gambar asli tidak ditemukan.")
    elif body.image_data:
        original = decode_data_url(body.image_data)
    else:
        raise HTTPException(400, "Tidak ada gambar untuk diedit.")

    images = [("original design", original)]
    if body.annotation:
        images.append(("marked design", decode_data_url(body.annotation)))

    t0 = time.perf_counter()
    try:
        png = await ai.image(prompts.edit_prompt(body.instruction, bool(body.annotation), body.format), images,
                             aspect=nearest_aspect(original), model=body.model, size=nearest_size(original))
    except AIError as e:
        db.log_gen("edit", int((time.perf_counter() - t0) * 1000), False, ai.mock)
        raise HTTPException(502, str(e))
    ms = int((time.perf_counter() - t0) * 1000)
    db.log_gen("edit", ms, True, ai.mock)
    iid = db.save_image(png)
    return image_info(iid, png, ms=ms, mock=ai.mock, model=body.model if body.model in IMAGE_MODELS else ai.image_model)


# ---------------------------------------------------------------- upload (store an image, e.g. a rasterised design)
class UploadIn(BaseModel):
    data: str


@app.post("/api/images")
def upload_image(body: UploadIn):
    png = decode_data_url(body.data)
    return image_info(db.save_image(png), png)


# ---------------------------------------------------------------- caption
class CaptionIn(BaseModel):
    name: str
    template_id: str | None = None
    product: str
    brand: str = "Batik UMKM"
    lang: str = "id"


@app.post("/api/caption")
async def caption(body: CaptionIn):
    tpl = db.get_template(body.template_id) if body.template_id else None
    lang = "en" if body.lang == "en" else "id"
    origin = ((tpl or {}).get("origin") or {}).get(lang, "") if tpl else ""
    meaning = ((tpl or {}).get("meaning") or {}).get(lang, "") if tpl else ""
    text = prompts.caption_prompt(name=body.name, motif=(tpl or {}).get("name", "batik"), origin=origin,
                                  meaning=meaning, product=body.product, brand=body.brand, lang=lang)
    try:
        return {"text": await ai.text(text), "mock": ai.mock}
    except AIError as e:
        raise HTTPException(502, str(e))


# ---------------------------------------------------------------- templates
class TemplateIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1, max_length=1200)
    palette: str | None = None
    origin: str | None = None
    meaning: str | None = None
    ref_image_ids: list[str] = Field(default_factory=list)   # already stored images
    ref_image_data: list[str] = Field(default_factory=list)  # new uploads / sketches (data URLs)


def _save_template(body: TemplateIn, tid: str | None):
    refs = [i for i in body.ref_image_ids if (db.IMAGES / f"{Path(i).name}.png").exists()]
    refs += [db.save_image(decode_data_url(d)) for d in body.ref_image_data]
    if len(refs) > 3:
        raise HTTPException(400, "Maksimal 3 gambar acuan per template.")
    t = {"id": tid, "name": body.name.strip(), "description": body.description.strip(), "palette": body.palette,
         "origin": {"id": body.origin, "en": body.origin} if body.origin else None,
         "meaning": {"id": body.meaning, "en": body.meaning} if body.meaning else None,
         "ref_images": refs}
    try:
        return db.upsert_template(t)
    except PermissionError:
        raise HTTPException(403, "Template bawaan tidak bisa diubah.")


@app.get("/api/templates")
def templates():
    return db.list_templates()


@app.post("/api/templates")
def create_template(body: TemplateIn):
    return _save_template(body, None)


@app.put("/api/templates/{tid}")
def update_template(tid: str, body: TemplateIn):
    if not db.get_template(tid):
        raise HTTPException(404, "Template tidak ditemukan.")
    return _save_template(body, tid)


@app.delete("/api/templates/{tid}")
def remove_template(tid: str):
    t = db.get_template(tid)
    if t and t["builtin"]:
        raise HTTPException(403, "Template bawaan tidak bisa dihapus.")
    db.delete_template(tid)
    return {"ok": True}


# ---------------------------------------------------------------- designs
@app.get("/api/designs")
def designs():
    return db.list_designs()


@app.post("/api/designs")
def save_design(d: dict):
    return db.upsert_design(d)


@app.delete("/api/designs/{did}")
def remove_design(did: str):
    db.delete_design(did)
    return {"ok": True}


# ---------------------------------------------------------------- static
app.mount("/images", StaticFiles(directory=db.IMAGES), name="images")
FRONTEND = ROOT.parent / "frontend"


@app.get("/")
def index():
    return FileResponse(FRONTEND / "index.html")


app.mount("/", StaticFiles(directory=FRONTEND), name="frontend")
