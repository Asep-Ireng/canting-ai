# Canting AI: functional prototype

Batik motif design platform for UMKM, built with a FastAPI backend and the Gemini API.
It grew out of `../canting-ai-mockup.html` (the old all-simulated mockup); see `../PLAN.md` for the plan.

## Run it

Requires Python 3.10+.

```bash
cd canting-ai/backend
pip install -r requirements.txt
copy .env.example .env      # macOS/Linux: cp .env.example .env
```

Open `backend/.env` and set your key (from https://aistudio.google.com/apikey):

```
GEMINI_API_KEY=your-key-here
MOCK_AI=0
```

Then start the server (still inside `backend/`):

```bash
python -m uvicorn main:app --reload --port 8000
```

Open http://localhost:8000.

**Mock mode:** with `MOCK_AI=1`, or with no key, the app never calls Gemini. It draws simple fake patterns locally instead, which is useful for testing the UI for free. The sidebar shows which mode is active.

## What works

| Feature | How |
|---|---|
| Generate from a **template** (Kawung, Parang, Mega Mendung, Truntum, Sekar Jagad, Ceplok, or your own) | Gemini image model, 1–4 variations in parallel, each with a different composition hint |
| Generate from **text**, a **reference photo**, and/or a **marker sketch** | All sent to Gemini as labelled images + a structured prompt (`backend/prompts.py`) |
| **Formats** | Ubin / tile (1:1 seamless repeat), Kain panjang (16:9 full cloth with tumpal end panel), Selendang (9:16 shawl with a central motif), Pinggiran (21:9 border strip that repeats sideways). Sent to Gemini as the aspect ratio + a layout rule. Edits keep the original shape; the editor, marker canvas, watermark, export and mockups all follow the image's shape. |
| **Templates** | Create (name, description, palette, origin, meaning, up to 3 reference images or sketches), edit, delete, "New style" from a built-in, "Make template" from any design |
| **Edit with AI** | Gemini image editing; full version history |
| **Mark what to change** | Draw on the design with a marker. The marked copy + the clean original are sent so only that area changes. |
| Colour / scale / rotation / mirror | In the browser (SVG filters + pattern tiling) |
| Watermark + PNG export | In the browser (canvas). The certificate shows a real SHA-256 fingerprint of the image file. |
| Product mockups | The generated tile on a shirt, dress, tote and cloth |
| Captions | Gemini text model ("Write with AI"), with a local template as fallback |
| Collection | SQLite (`data/canting.db`) + PNG files (`data/images/`) |
| Metrics | Each generation/edit is timed and logged; the dashboard shows the count and average time (for the "waktu penyelesaian tugas" evaluation) |

**Still simulated:** the invisible watermark and copy detection (marked "planned" / "simulation" in the UI).

## Layout

```
backend/
  main.py       FastAPI routes + serves the frontend
  gemini.py     every Gemini call (+ the mock)
  prompts.py    motif descriptions + prompt templates (tune quality here)
  db.py         SQLite: templates, designs, generation log
frontend/
  index.html  styles.css  core.js (rendering, API, drawing pad, modals)  pages.js (pages + router)
data/           created on first run, gitignored
```

## Changing models

The Studio and Editor have a **Model AI** picker with the image models listed in `IMAGE_MODELS` in `backend/gemini.py`:

| Model | ID | Resolutions | Measured (1 tile) |
|---|---|---|---|
| Nano Banana 2.1 | `gemini-nano-banana-2.1` | 1K, 2K, 4K | 1K ~17 s, 2K ~20 s, 4K ~40 s; best batik detail |
| Nano Banana 2 | `gemini-3.1-flash-image` | 1K, 2K, 4K | 1K ~12 s, 2K ~21 s, 4K ~31 s; clearly batik |
| Nano Banana 2 Lite | `gemini-3.1-flash-lite-image` | 1K only | ~4 s; looks more like a generic tile |

The Studio's **Resolution** picker (1K / 2K / 4K) greys out sizes the chosen model can't do. AI edits keep the resolution of the image being edited. Input images bigger than 1536 px are shrunk before they are sent to Gemini.

`IMAGE_MODEL` in `backend/.env` sets the default; `TEXT_MODEL` sets the caption model. To offer another model, add it to `IMAGE_MODELS`.

## Cost note

Every variation is one paid image call, so "Generate 4 variations" = 4 calls. Use the 1/2/4 selector in the Studio, and mock mode while working on the UI.
