# Canting AI: functional prototype

Batik motif design platform for UMKM, built with a FastAPI backend and the Gemini API.

**Bring your own key:** the app has no API key of its own. Each visitor enters their own Gemini key in the
"API key" dialog; it is kept only in their browser (localStorage) and sent with each request to call Gemini,
never stored or logged on the server. Without a key everything runs in **mock mode** (free sample images).
Designs and custom templates are saved in the visitor's browser (IndexedDB), so the server is stateless.

## Run locally

Requires Python 3.10+.

```bash
cd canting-ai
pip install -r backend/requirements.txt
python -m uvicorn app:app --reload --port 8000
```

Open http://localhost:8000 and click **Masukkan API key** to add your key (from https://aistudio.google.com/apikey).

Optional for local development: put `GEMINI_API_KEY=...` in `backend/.env` (copy `backend/.env.example`) so the
server uses it when a visitor has not entered one. `MOCK_AI=1` forces mock mode. Never commit `.env`; it is gitignored.

## Deploy to Vercel

The repo is ready for Vercel's FastAPI support: `app.py` is the entry point, `public/` is served by the CDN,
`requirements.txt` lists the dependencies, and `vercel.json` raises the function time limit to 120 s (a 4K image
takes about 40 s).

1. Import the GitHub repo in Vercel (New Project), framework preset FastAPI, root directory = this folder.
2. Do **not** add `GEMINI_API_KEY`: visitors bring their own key. (`IMAGE_MODEL` / `TEXT_MODEL` are optional.)
3. Deploy.

Limits: a Vercel function response is at most 4.5 MB, so images are returned as WebP (quality drops automatically
for very large 4K results), and inputs are shrunk in the browser before sending.

## What works

| Feature | How |
|---|---|
| Generate from a **template** (Kawung, Parang, Mega Mendung, Truntum, Sekar Jagad, Ceplok, or your own) | Gemini image model, 1–4 variations in parallel, each with a different composition hint |
| Generate from **text**, a **reference photo**, and/or a **marker sketch** | All sent to Gemini as labelled images + a structured prompt (`backend/prompts.py`) |
| **Formats** | Ubin / tile (1:1 seamless repeat), Kain panjang (16:9 full cloth with tumpal end panel), Selendang (9:16 shawl with a central motif), Pinggiran (21:9 border strip that repeats sideways). Sent to Gemini as the aspect ratio + a layout rule. Edits keep the original shape. |
| **Model and resolution** | Nano Banana 2.1 / 2 / 2 Lite, 1K / 2K / 4K; sizes a model can't do are greyed out |
| **Templates** | Create, edit, delete, "New style" from a built-in, "Make template" from any design; saved in the browser |
| **Edit with AI** + **mark what to change** | Gemini image editing; marker strokes limit the change to the marked area; version history |
| Colour / scale / rotation / mirror, watermark, PNG export, product mockups | In the browser (SVG + canvas); SHA-256 fingerprint of the image |
| Captions | Gemini text model, with a local template as fallback |
| Dashboard metrics | Generation count and average time, kept per browser |

**Still simulated:** the invisible watermark and copy detection.

## Layout

```
app.py          entry point (Vercel and local); loads backend/main.py
backend/
  main.py       FastAPI routes (stateless)
  gemini.py     every Gemini call, per-request keys, the mock, model list
  prompts.py    motif descriptions + prompt templates (tune quality here)
public/         index.html, styles.css, core.js (rendering, API, storage, modals), pages.js
vercel.json     function time limit, "/" -> index.html
docs/screenshots/
```

## Models

| Model | ID | Resolutions | Measured (1 tile) |
|---|---|---|---|
| Nano Banana 2.1 | `gemini-nano-banana-2.1` | 1K, 2K, 4K | 1K ~17 s, 2K ~20 s, 4K ~40 s; best batik detail |
| Nano Banana 2 | `gemini-3.1-flash-image` | 1K, 2K, 4K | 1K ~12 s, 2K ~21 s, 4K ~31 s; clearly batik |
| Nano Banana 2 Lite | `gemini-3.1-flash-lite-image` | 1K only | ~4–7 s; looks more like a generic tile |

To offer another model, add it to `IMAGE_MODELS` in `backend/gemini.py`.
