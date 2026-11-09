"""Motif knowledge + prompt templates sent to Gemini.

Descriptions are written in English for the model; the cultural notes
(origin/meaning) are bilingual because they are shown in the UI.
"""

# Built-in templates. Keys match the procedural SVG styles in the frontend.
MOTIFS = {
    "kawung": {
        "name": "Kawung",
        "description": "Kawung: four plump oval petals (shaped like halved aren palm fruit) arranged in a cross around a small center dot, repeated in a strict symmetric diagonal grid; small isen-isen dots and a tiny four-pointed star filling the gaps.",
        "origin": {"id": "Jawa Tengah & Yogyakarta", "en": "Central Java & Yogyakarta"},
        "meaning": {"id": "Susunan elips yang simetris, sering dikaitkan dengan kesucian, keadilan, dan pengendalian diri.",
                    "en": "Symmetrically arranged ellipses, often associated with purity, justice, and self-restraint."},
        "palette": "indigo",
    },
    "parang": {
        "name": "Parang",
        "description": "Parang: continuous diagonal bands of interlocking S-shaped knife/wave forms running at 45 degrees, separated by thin lines of small diamond 'mlinjon' dots; strong rhythmic diagonal flow.",
        "origin": {"id": "Keraton Yogyakarta & Surakarta", "en": "Yogyakarta & Surakarta courts"},
        "meaning": {"id": "Garis diagonal bergelombang yang tak terputus melambangkan keteguhan dan kesinambungan. Parang Rusak dahulu hanya dikenakan bangsawan keraton.",
                    "en": "Unbroken diagonal wave lines symbolise perseverance and continuity. The Parang Rusak variant was once reserved for the royal court."},
        "palette": "soga",
    },
    "mendung": {
        "name": "Mega Mendung",
        "description": "Mega Mendung: stylised Chinese-influenced cloud forms with many concentric outlines in graded shades of one colour (light to dark, 5-7 bands), rounded spiral cloud tips, scattered over a plain ground.",
        "origin": {"id": "Cirebon", "en": "Cirebon"},
        "meaning": {"id": "Awan bergradasi warna; melambangkan kesabaran dan ketenangan, awan pembawa hujan yang menyejukkan.",
                    "en": "Colour-graded clouds symbolising patience and calm, the rain-bearing cloud that brings relief."},
        "palette": "pesisir",
    },
    "truntum": {
        "name": "Truntum",
        "description": "Truntum: many small eight-petal star-flowers (like jasmine buds or stars in the night sky) scattered evenly on a dark ground, with tiny dots between them; delicate and dense.",
        "origin": {"id": "Surakarta", "en": "Surakarta"},
        "meaning": {"id": "Bintang-bintang kecil yang bertebaran; melambangkan cinta yang tumbuh kembali, lazim dipakai orang tua mempelai.",
                    "en": "Small scattered stars symbolising love that blossoms anew; traditionally worn by the parents of the bride and groom."},
        "palette": "soga",
    },
    "sekar": {
        "name": "Sekar Jagad",
        "description": "Sekar Jagad: a patchwork map of irregular rounded 'islands', each island filled with a different small floral or geometric batik motif, separated by fine outlines; rich and varied.",
        "origin": {"id": "Jawa", "en": "Java"},
        "meaning": {"id": "\"Bunga dunia\": keragaman bentuk flora yang dirangkai dalam satu kain, melambangkan keindahan dan keberagaman.",
                    "en": "\"Flower of the world\": diverse flora gathered on a single cloth, symbolising beauty and diversity."},
        "palette": "modern",
    },
    "ceplok": {
        "name": "Ceplok",
        "description": "Ceplok: repeating geometric medallions (rosettes, stars or four-fold flowers inside squares or circles) on a regular grid, each medallion filled with fine isen-isen line and dot patterns.",
        "origin": {"id": "Jawa", "en": "Java"},
        "meaning": {"id": "Susunan geometris berulang berbentuk bunga atau bintang; melambangkan keteraturan dan keseimbangan.",
                    "en": "Repeating geometric arrangements of flowers or stars, symbolising order and balance."},
        "palette": "mono",
    },
}

PALETTES = {
    "soga":    ("classic sogan: warm cream ground, soga brown, dark chocolate lines, light tan accents", ["#EBD9B4", "#3A2216", "#7A4426", "#C08A4F", "#F6EBD0"]),
    "indigo":  ("indigo (nila) cloth: deep indigo ground, mid blue, pale blue, cream accents", ["#16294A", "#08122B", "#3C6BB0", "#9BBDE6", "#F4EEDC"]),
    "pesisir": ("Lasem coastal: cream ground, bright red, teal, dark maroon lines, saffron accents", ["#F3E6CF", "#4A0F14", "#B3262B", "#1F7A7A", "#E0A63A"]),
    "hijau":   ("forest green: pale ground, leaf green, olive gold, dark green lines, rust accents", ["#EFE8CF", "#16301F", "#3E7A52", "#B89A3E", "#8A4B2A"]),
    "modern":  ("modern pastel: blush ground, dusty pink, powder blue, butter yellow, plum lines", ["#FBEFEA", "#4F3F5F", "#E39AA3", "#9FB8D9", "#F4D58D"]),
    "mono":    ("monochrome: off-white ground, black and charcoal, soft grey", ["#F4F1EA", "#111111", "#2B2B2B", "#8D8D8D", "#D6D1C6"]),
}

DENSITY = {
    "sparse": "large motifs with generous open ground between them",
    "medium": "medium-sized motifs with balanced spacing",
    "dense": "small, tightly packed motifs with very little empty ground",
}

# One composition hint per variation so the 4 results differ from each other.
VARIATIONS = [
    "Faithful, classic interpretation; balanced and symmetrical.",
    "Smaller motif scale with more repeats and finer isen-isen detail.",
    "Bolder, larger main motif with a secondary filler motif in between.",
    "A contemporary reinterpretation: simplified shapes, stronger contrast, still clearly batik.",
]

STYLE_RULES = (
    "Look like real Javanese batik tulis: hand-drawn wax-resist lines made with a canting, slightly irregular line weight, "
    "fine isen-isen fills (dots, short lines), and subtle dye crackle texture. Flat cloth viewed straight from above, "
    "filling the whole frame edge to edge. No fabric folds, no shadows, no perspective, no text, no watermark, no people, no mockup."
)

# Output formats: Gemini aspect ratio + the layout the model must produce.
FORMATS = {
    "tile": {
        "aspect": "1:1",
        "layout": "Output: ONE square image that is a seamless, tileable repeat (left edge continues into right edge, top into "
                  "bottom), an all-over pattern with no borders or frame.",
        "edit": "It is a square, seamless repeat tile: keep it square and seamless.",
        "ref": "Even if the reference is one big centred composition, the result must be an all-over cloth pattern where the "
               "motif repeats several times across the frame.",
    },
    "kain": {
        "aspect": "16:9",
        "layout": "Output: ONE complete kain panjang (long batik cloth) laid out horizontally. A main field (badan) of repeating "
                  "motif fills most of the cloth; one short end has a decorative kepala panel with a row of tumpal triangles; "
                  "a thin pinggiran border runs along the top and bottom edges.",
        "edit": "It is a complete horizontal kain panjang with a main field, a tumpal end panel and edge borders: keep that layout and its wide shape.",
        "ref": "Arrange the borrowed shapes into the kain panjang layout described below.",
    },
    "selendang": {
        "aspect": "9:16",
        "layout": "Output: ONE complete selendang (batik shawl) in portrait orientation. A single strong central motif or medallion "
                  "as the focal point, surrounded by a field of smaller supporting motifs, framed by a decorative border on all four sides.",
        "edit": "It is a complete portrait selendang with a central focal motif and a border on all sides: keep that layout and its tall shape.",
        "ref": "A centred composition in the reference is welcome here: build the selendang's central motif from it.",
    },
    "pinggiran": {
        "aspect": "21:9",
        "layout": "Output: ONE long horizontal border strip (pinggiran) that repeats seamlessly left-to-right: a continuous band "
                  "of motif framed by thin parallel lines along the top and bottom edges. It only needs to tile horizontally.",
        "edit": "It is a wide border strip that repeats horizontally: keep it a wide, horizontally seamless band.",
        "ref": "Turn the reference shapes into a continuous band that repeats left to right.",
    },
}


# Full pieces tend to come back as "a photo of a cloth on a table"; this keeps them flat and edge to edge.
for _k in ("kain", "selendang", "pinggiran"):
    FORMATS[_k]["layout"] += (" The cloth itself IS the whole image: its edges are the image edges, with no background, "
                              "table, margin or shadow visible around it.")


def fmt(key: str | None) -> dict:
    return FORMATS.get(key or "tile", FORMATS["tile"])


def palette_text(key: str | None) -> str:
    if not key or key not in PALETTES:
        return "Choose a harmonious traditional batik palette that fits the description (or follows the reference image colours)."
    desc, hexes = PALETTES[key]
    return f"Colour palette: {desc} ({', '.join(hexes)})."


def generate_prompt(*, user_prompt: str, template: dict | None, palette: str | None, density: str,
                    variation: int, n_template_refs: int, n_user_refs: int, has_sketch: bool, format: str = "tile") -> str:
    f = fmt(format)
    parts = ["You are a master Javanese batik designer creating a new design for a small batik business (UMKM)."]
    if template:
        parts.append(f"Base style / template: {template['name']}. {template['description']}")
        if n_template_refs:
            parts.append("The first image(s) labelled 'template reference' show this style: keep its motif vocabulary, line quality "
                         "and character, but create a NEW design, do not copy it.")
    if n_user_refs:
        parts.append("The image(s) labelled 'user reference' are what the user wants to start from or be inspired by: "
                     "borrow their motif shapes, line quality and mood, but do NOT copy their overall layout. " + f["ref"])
    if has_sketch:
        parts.append("The image labelled 'user sketch' is a rough hand drawing by the user. Use its shapes and layout as the main "
                     "motif, redrawn cleanly in batik style (the sketch's line colours are only markers, not the final palette).")
    if user_prompt.strip():
        parts.append(f"User request: \"{user_prompt.strip()}\"")
    parts.append(palette_text(palette))
    parts.append(f"Density: {DENSITY.get(density, DENSITY['medium'])}.")
    parts.append(f"Variation style: {VARIATIONS[variation % len(VARIATIONS)]}")
    parts.append(f["layout"])
    parts.append(STYLE_RULES)
    return "\n".join(parts)


def edit_prompt(instruction: str, has_annotation: bool, format: str = "tile") -> str:
    p = ["Edit the batik image labelled 'original design'.", f"Instruction: \"{instruction.strip()}\"."]
    if has_annotation:
        p.append("The image labelled 'marked design' is the same design with the user's hand-drawn marker strokes "
                 "(circles, arrows, scribbles) showing WHERE to apply the change. Apply the change only in the marked areas, "
                 "keep everything else identical, and do NOT draw the marker strokes in the output.")
    else:
        p.append("Keep the overall motif, composition and style unless the instruction says otherwise.")
    p.append("Anything new you add must be drawn in the SAME flat batik tulis style as the rest: stylised, hand-drawn wax "
             "outlines, isen-isen fills, limited dye colours. Never photorealistic, no shading or 3D, no painted look.")
    p.append(fmt(format)["edit"] + " Return the full edited design as one flat batik textile image. No text, no mockup.")
    return "\n".join(p)


def caption_prompt(*, name: str, motif: str, origin: str, meaning: str, product: str, brand: str, lang: str) -> str:
    language = "Indonesian (casual, friendly UMKM seller tone)" if lang == "id" else "English"
    return (
        f"Write a short social media / marketplace caption in {language} for a batik product.\n"
        f"Brand: {brand}\nProduct: {product}\nDesign name: {name}\nMotif: {motif}\n"
        f"Origin: {origin}\nMeaning: {meaning}\n"
        "Structure: an eye-catching first line with 1-2 emoji, 2-3 sentences about the motif's meaning and the product, "
        "a line on how to order (DM / WhatsApp), then 4-6 relevant hashtags. Max 90 words. "
        "Do not invent prices, materials or claims you were not given. Output only the caption."
    )
