"""All calls to the Gemini API live here.

If no API key is configured (or MOCK_AI=1), a local mock is used instead so
the app can be demoed and tested without spending credits.
"""
import asyncio
import html
import io
import math
import os
import random
import re

from PIL import Image, ImageDraw, ImageFilter

from prompts import PALETTES


# Image models the UI may pick from. Anything else falls back to IMAGE_MODEL.
# sizes = output resolutions the model accepts (tested 2026-11-04: Lite rejects 2K with a 400).
IMAGE_MODELS = {
    # grounding: accepts the Google Search tool (web + image search); Lite rejects it
    "gemini-nano-banana-2.1": {"label": "Nano Banana 2.1", "sizes": ["1K", "2K", "4K"], "grounding": True},
    "gemini-3.1-flash-image": {"label": "Nano Banana 2", "sizes": ["1K", "2K", "4K"], "grounding": True},
    "gemini-3.1-flash-lite-image": {"label": "Nano Banana 2 Lite", "sizes": ["1K"], "grounding": False},
}
SIZE_PX = {"1K": 1024, "2K": 2048, "4K": 4096}
MAX_INPUT_PX = 1536  # input images are shrunk to this before sending, so 4K results never blow the request size


def size_for(model: str, size: str | None) -> str | None:
    """The requested size if the model accepts it, else the largest it accepts below it (None = model default)."""
    sizes = IMAGE_MODELS.get(model, {}).get("sizes", [])
    if not size or size not in SIZE_PX or not sizes:
        return None
    ok = [s for s in sizes if SIZE_PX[s] <= SIZE_PX[size]]
    return ok[-1] if ok else None


class AIError(Exception):
    """Error with a message that is safe to show in the UI."""


class GeminiAI:
    """Each request may bring its own key (the visitor's, from the X-Gemini-Key header).
    Without one it falls back to GEMINI_API_KEY from the environment, and without that to the free mock."""

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.image_model = os.getenv("IMAGE_MODEL", "gemini-nano-banana-2.1")
        self.text_model = os.getenv("TEXT_MODEL", "gemini-2.5-flash")
        self.force_mock = os.getenv("MOCK_AI", "0") == "1"
        self.mock = self.force_mock or not self.api_key  # mode for requests that bring no key
        self._server_client = None

    def is_mock(self, api_key: str | None) -> bool:
        return self.force_mock or not ((api_key or "").strip() or self.api_key)

    def _client(self, api_key: str | None):
        from google import genai
        from google.genai import types
        # system_instruction is only accepted on v1beta; pin it so SDK defaults can't switch us to v1
        http = types.HttpOptions(api_version="v1beta")
        key = (api_key or "").strip()
        if key:  # a visitor's key: a fresh client per request, never stored
            return genai.Client(api_key=key, http_options=http)
        if self._server_client is None:
            self._server_client = genai.Client(api_key=self.api_key, http_options=http)
        return self._server_client

    async def check_key(self, api_key: str) -> None:
        """Cheap validity check (lists models, no generation cost). Raises AIError on a bad key."""
        try:
            client = self._client(api_key)  # keep a reference: a garbage-collected client cancels its own request
            pager = await client.aio.models.list(config={"page_size": 1})
            async for _ in pager:
                break
        except Exception as e:
            raise AIError(_friendly(e)) from e

    # ---------- images ----------
    async def image(self, prompt: str, labelled_images: list[tuple[str, bytes]], palette: str | None = None,
                    aspect: str = "1:1", model: str | None = None, size: str | None = None,
                    api_key: str | None = None, temperature: float | None = None, grounding: bool = False,
                    info: dict | None = None) -> bytes:
        """labelled_images: [(label, png_or_jpeg_bytes), ...] sent before the prompt.
        grounding: let the model look things up with Google Search (web + images) first; ignored by models without it.
        info: if given, filled with {"grounding": {"queries": [...], "sources": [...]}} when search was used."""
        model = model if model in IMAGE_MODELS else self.image_model
        size = size_for(model, size)
        if self.is_mock(api_key):
            return await asyncio.to_thread(_mock_image, prompt, labelled_images, palette, aspect, size)

        from google.genai import types
        contents = []
        for label, data in labelled_images:
            data = _shrink(data)
            contents.append(f"[{label}]")
            contents.append(types.Part.from_bytes(data=data, mime_type=_mime(data)))
        contents.append(prompt)

        config = types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"])
        if temperature is not None:
            config.temperature = temperature
        if grounding and IMAGE_MODELS[model].get("grounding"):
            config.tools = [types.Tool(google_search=types.GoogleSearch(search_types=types.SearchTypes(
                web_search=types.WebSearch(), image_search=types.ImageSearch())))]
        try:
            config.image_config = types.ImageConfig(aspect_ratio=aspect, **({"image_size": size} if size else {}))
        except Exception:  # older SDKs / models without image_config
            pass

        client = self._client(api_key)  # keep a reference for the whole call (see check_key)
        try:
            resp = await client.aio.models.generate_content(model=model, contents=contents, config=config)
        except Exception as e:  # network, quota, invalid key, bad model id …
            raise AIError(_friendly(e)) from e

        if info is not None and resp.candidates:
            g = _grounding(resp.candidates[0])
            if g:
                info["grounding"] = g
        for cand in resp.candidates or []:
            for part in (cand.content.parts if cand.content else []) or []:
                if getattr(part, "inline_data", None) and part.inline_data.data:
                    return _to_png(part.inline_data.data)
        reason = getattr(getattr(resp, "prompt_feedback", None), "block_reason", None)
        if reason:
            raise AIError(f"Permintaan diblokir oleh filter keamanan ({reason}). Coba ubah deskripsinya.")
        raise AIError("Model tidak mengembalikan gambar. Coba ulangi atau ubah deskripsinya.")

    # ---------- text ----------
    async def text(self, prompt: str, api_key: str | None = None) -> str:
        if self.is_mock(api_key):
            await asyncio.sleep(0.6)
            return ("✨ [MOCK] Caption contoh ✨\n\nIni teks contoh karena mode mock aktif. "
                    "Masukkan API key Gemini (tombol API key) untuk caption asli dari Gemini.\n\n#batik #umkm #mock")
        client = self._client(api_key)
        try:
            resp = await client.aio.models.generate_content(model=self.text_model, contents=prompt)
        except Exception as e:
            raise AIError(_friendly(e)) from e
        return (resp.text or "").strip()

    async def chat(self, system: str, messages: list[tuple[str, str, bytes | None]], schema, api_key: str | None = None):
        """Multi-turn chat that answers with JSON matching `schema` (a pydantic model).
        messages: [(role 'user'|'model', text, optional image bytes), ...]. Returns the parsed model."""
        from google.genai import types
        contents = []
        for role, text, img in messages:
            parts = []
            if img:
                img = _shrink(img)
                parts.append(types.Part.from_bytes(data=img, mime_type=_mime(img)))
            parts.append(types.Part.from_text(text=text or "(gambar)"))
            contents.append(types.Content(role="model" if role == "model" else "user", parts=parts))
        config = types.GenerateContentConfig(system_instruction=system, response_mime_type="application/json",
                                             response_schema=schema, temperature=0.6)
        client = self._client(api_key)
        try:
            resp = await client.aio.models.generate_content(model=self.text_model, contents=contents, config=config)
        except Exception as e:
            raise AIError(_friendly(e)) from e
        if getattr(resp, "parsed", None) is not None:
            return resp.parsed
        try:
            return schema.model_validate_json(resp.text or "")
        except Exception as e:
            raise AIError("Jawaban asisten tidak terbaca. Coba kirim ulang pesannya.") from e

    async def buddy(self, system: str, messages: list[tuple[str, str, bytes | None]], api_key: str | None = None,
                    grounding: bool = True) -> tuple[str, dict | None]:
        """Free-form design discussion (Tanya Canting). Can look things up with Google Search.
        Returns (reply text, grounding info or None)."""
        from google.genai import types
        contents = []
        for role, text, img in messages:
            parts = []
            if img:
                img = _shrink(img)
                parts.append(types.Part.from_bytes(data=img, mime_type=_mime(img)))
            parts.append(types.Part.from_text(text=text or "(gambar)"))
            contents.append(types.Content(role="model" if role == "model" else "user", parts=parts))
        config = types.GenerateContentConfig(system_instruction=system)
        if grounding:
            config.tools = [types.Tool(google_search=types.GoogleSearch())]
        client = self._client(api_key)
        try:
            resp = await client.aio.models.generate_content(model=self.text_model, contents=contents, config=config)
        except Exception as e:
            raise AIError(_friendly(e)) from e
        cand = (resp.candidates or [None])[0]
        return (resp.text or "").strip(), (_grounding(cand) if cand else None)


def _grounding(cand) -> dict | None:
    """Search queries and source pages from a grounded answer, for attribution in the UI."""
    gm = getattr(cand, "grounding_metadata", None)
    if not gm:
        return None
    clean = lambda t: html.unescape(re.sub(r"<[^>]+>", "", t or "")).strip()
    sources, seen = [], set()
    for ch in gm.grounding_chunks or []:
        src = ch.web or ch.image
        if not src:
            continue
        url = getattr(src, "uri", None) or getattr(src, "source_uri", None)
        if not url or url in seen:
            continue
        seen.add(url)
        sources.append({"title": clean(src.title) or src.domain or url, "url": url, "domain": src.domain or ""})
    queries = list(dict.fromkeys((gm.web_search_queries or []) + (gm.image_search_queries or [])))
    if not (sources or queries):
        return None
    return {"queries": queries[:6], "sources": sources[:8]}


def _shrink(data: bytes) -> bytes:
    """Downscale big inputs (e.g. a 4K design being edited) so the request stays small; small ones pass untouched."""
    img = Image.open(io.BytesIO(data))
    if max(img.size) <= MAX_INPUT_PX:
        return data
    img = img.convert("RGB")
    img.thumbnail((MAX_INPUT_PX, MAX_INPUT_PX))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=92)
    return buf.getvalue()


def _mime(data: bytes) -> str:
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return "image/png"


def _to_png(data: bytes) -> bytes:
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return data
    buf = io.BytesIO()
    Image.open(io.BytesIO(data)).convert("RGB").save(buf, "PNG")
    return buf.getvalue()


def _friendly(e: Exception) -> str:
    msg = str(e)
    if "API_KEY_INVALID" in msg or "API key not valid" in msg:
        return "API key Gemini tidak valid. Periksa kembali kunci yang dimasukkan."
    if "RESOURCE_EXHAUSTED" in msg or "429" in msg:
        return "Kuota / batas permintaan Gemini habis. Tunggu sebentar lalu coba lagi."
    if "NOT_FOUND" in msg or "404" in msg:
        return "Model Gemini tidak ditemukan. Periksa IMAGE_MODEL / TEXT_MODEL di backend/.env."
    return f"Gagal menghubungi Gemini: {msg[:200]}"


def mock_lineart(data: bytes) -> bytes:
    """Free local tracing pattern for mock mode: edge detection -> black lines on white."""
    img = Image.open(io.BytesIO(data)).convert("L")
    img = img.filter(ImageFilter.GaussianBlur(1.1)).filter(ImageFilter.FIND_EDGES)
    img = img.point(lambda v: 0 if v > 28 else 255).filter(ImageFilter.MinFilter(3))
    buf = io.BytesIO()
    img.convert("RGB").save(buf, "PNG")
    return buf.getvalue()


# ---------- mock image: a simple procedural batik-ish tile ----------
def _mock_image(prompt: str, labelled_images, palette: str | None, aspect: str = "1:1", size: str | None = None) -> bytes:
    import time
    time.sleep(random.uniform(1.2, 2.6))  # feel like a real call
    rnd = random.Random(hash(prompt) ^ random.getrandbits(16))
    cols = PALETTES.get(palette or "", PALETTES[rnd.choice(list(PALETTES))])[1]
    bg, dark, prim, sec, acc = cols
    aw, ah = (int(x) for x in aspect.split(":"))
    W, H = (1024, round(1024 * ah / aw)) if aw >= ah else (round(1024 * aw / ah), 1024)
    n = rnd.choice([3, 4, 5])
    cell = min(W, H) // n
    img = Image.new("RGB", (W, H), bg)

    # editing: start from the original so the result is visibly "an edit"
    originals = [d for (lbl, d) in labelled_images if lbl in ("original design",)]
    if originals:
        img = Image.open(io.BytesIO(originals[0])).convert("RGB").resize((W, H))
        img = img.filter(ImageFilter.GaussianBlur(1.2))
        overlay = Image.new("RGB", (W, H), prim)
        img = Image.blend(img, overlay, 0.18)

    d = ImageDraw.Draw(img)
    shape = rnd.choice(["kawung", "star", "diamond"])
    for gy in range(H // cell + 1):
        for gx in range(W // cell + 1):
            cx, cy = gx * cell, gy * cell
            r = cell * 0.38
            if shape == "kawung":
                for a in range(4):
                    ang = a * math.pi / 2
                    ox, oy = math.cos(ang) * r * .55, math.sin(ang) * r * .55
                    rx, ry = (r * .5, r * .3) if a % 2 == 0 else (r * .3, r * .5)
                    d.ellipse([cx + ox - rx, cy + oy - ry, cx + ox + rx, cy + oy + ry], fill=prim if (gx + gy) % 2 else sec, outline=dark, width=4)
            elif shape == "star":
                for a in range(8):
                    ang = a * math.pi / 4
                    d.line([cx, cy, cx + math.cos(ang) * r, cy + math.sin(ang) * r], fill=prim, width=10)
            else:
                d.polygon([(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)], fill=prim, outline=dark)
                d.polygon([(cx, cy - r * .5), (cx + r * .5, cy), (cx, cy + r * .5), (cx - r * .5, cy)], fill=sec, outline=dark)
            d.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], fill=acc, outline=dark, width=2)
            for _ in range(6):  # isen-isen dots
                px, py = cx + cell / 2 + rnd.uniform(-cell * .3, cell * .3), cy + cell / 2 + rnd.uniform(-cell * .3, cell * .3)
                d.ellipse([px - 3, py - 3, px + 3, py + 3], fill=dark)

    sketches = [dt for (lbl, dt) in labelled_images if lbl == "user sketch"]
    if sketches:
        sk = Image.open(io.BytesIO(sketches[0])).convert("L").resize((W, H))
        mask = sk.point(lambda v: 255 if v < 128 else 0)
        img.paste(Image.new("RGB", (W, H), dark), (0, 0), mask)

    d.rectangle([0, 0, 190, 44], fill=dark)
    d.text((14, 14), "MOCK AI", fill=acc)
    k = SIZE_PX.get(size or "1K", 1024) / 1024  # drawn at 1K, scaled up so 2K/4K come back at the real size
    if k != 1:
        img = img.resize((round(W * k), round(H * k)))
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return buf.getvalue()
