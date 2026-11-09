"""All calls to the Gemini API live here.

If no API key is configured (or MOCK_AI=1), a local mock is used instead so
the app can be demoed and tested without spending credits.
"""
import asyncio
import io
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

from prompts import PALETTES


# Image models the UI may pick from. Anything else falls back to IMAGE_MODEL.
# sizes = output resolutions the model accepts (tested 2026-11-04: Lite rejects 2K with a 400).
IMAGE_MODELS = {
    "gemini-nano-banana-2.1": {"label": "Nano Banana 2.1", "sizes": ["1K", "2K", "4K"]},
    "gemini-3.1-flash-image": {"label": "Nano Banana 2", "sizes": ["1K", "2K", "4K"]},
    "gemini-3.1-flash-lite-image": {"label": "Nano Banana 2 Lite", "sizes": ["1K"]},
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
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.image_model = os.getenv("IMAGE_MODEL", "gemini-2.5-flash-image")
        self.text_model = os.getenv("TEXT_MODEL", "gemini-2.5-flash")
        self.mock = os.getenv("MOCK_AI", "0") == "1" or not self.api_key
        self.client = None
        if not self.mock:
            from google import genai
            self.client = genai.Client(api_key=self.api_key)

    # ---------- images ----------
    async def image(self, prompt: str, labelled_images: list[tuple[str, bytes]], palette: str | None = None,
                    aspect: str = "1:1", model: str | None = None, size: str | None = None) -> bytes:
        """labelled_images: [(label, png_or_jpeg_bytes), ...] sent before the prompt."""
        model = model if model in IMAGE_MODELS else self.image_model
        size = size_for(model, size)
        if self.mock:
            return await asyncio.to_thread(_mock_image, prompt, labelled_images, palette, aspect, size)

        from google.genai import types
        contents = []
        for label, data in labelled_images:
            data = _shrink(data)
            contents.append(f"[{label}]")
            contents.append(types.Part.from_bytes(data=data, mime_type=_mime(data)))
        contents.append(prompt)

        config = types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"])
        try:
            config.image_config = types.ImageConfig(aspect_ratio=aspect, **({"image_size": size} if size else {}))
        except Exception:  # older SDKs / models without image_config
            pass

        try:
            resp = await self.client.aio.models.generate_content(model=model, contents=contents, config=config)
        except Exception as e:  # network, quota, invalid key, bad model id …
            raise AIError(_friendly(e)) from e

        for cand in resp.candidates or []:
            for part in (cand.content.parts if cand.content else []) or []:
                if getattr(part, "inline_data", None) and part.inline_data.data:
                    return _to_png(part.inline_data.data)
        reason = getattr(getattr(resp, "prompt_feedback", None), "block_reason", None)
        if reason:
            raise AIError(f"Permintaan diblokir oleh filter keamanan ({reason}). Coba ubah deskripsinya.")
        raise AIError("Model tidak mengembalikan gambar. Coba ulangi atau ubah deskripsinya.")

    # ---------- text ----------
    async def text(self, prompt: str) -> str:
        if self.mock:
            await asyncio.sleep(0.6)
            return ("✨ [MOCK] Caption contoh ✨\n\nIni teks contoh karena mode mock aktif. "
                    "Isi GEMINI_API_KEY di backend/.env untuk caption asli dari Gemini.\n\n#batik #umkm #mock")
        try:
            resp = await self.client.aio.models.generate_content(model=self.text_model, contents=prompt)
        except Exception as e:
            raise AIError(_friendly(e)) from e
        return (resp.text or "").strip()


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
        return "API key Gemini tidak valid. Periksa GEMINI_API_KEY di backend/.env."
    if "RESOURCE_EXHAUSTED" in msg or "429" in msg:
        return "Kuota / batas permintaan Gemini habis. Tunggu sebentar lalu coba lagi."
    if "NOT_FOUND" in msg or "404" in msg:
        return "Model Gemini tidak ditemukan. Periksa IMAGE_MODEL / TEXT_MODEL di backend/.env."
    return f"Gagal menghubungi Gemini: {msg[:200]}"


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
