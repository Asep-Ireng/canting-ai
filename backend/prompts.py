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
    # natural-dye palettes (pewarna alam)
    "mahoni":  ("natural mahogany-bark dye: warm beige ground, reddish brown, dusty rose-brown, dark brown lines", ["#E8D6BC", "#3B1F17", "#8C3F2B", "#B97A62", "#F1E4CE"]),
    "tegeran": ("natural tegeran / jelawe dye: unbleached ground, mustard yellow, olive brown, dark umber lines", ["#EFE2BF", "#3A2C14", "#B8902C", "#7D6A32", "#F7EED6"]),
    "tingi":   ("natural tingi-bark and indigo overdye: pale ecru ground, deep brown-black, rusty red-brown, faded blue", ["#ECE1CB", "#1E1612", "#7E3A22", "#4F6688", "#F5EDDC"]),
    # synthetic-dye palette (naptol / remazol)
    "cerah":   ("bright synthetic remazol: white ground, magenta, turquoise, orange, deep purple lines", ["#FFF8F2", "#3E1A4F", "#D6267A", "#16A6A0", "#F28C28"]),
}

# Which dye family each palette belongs to (customers mostly ask "pewarna alam atau sintetis?").
DYE_OF = {"soga": "alam", "indigo": "alam", "mahoni": "alam", "tegeran": "alam", "tingi": "alam",
          "pesisir": "sintetis", "hijau": "sintetis", "modern": "sintetis", "cerah": "sintetis", "mono": "sintetis"}
DYE_RULES = {
    "alam": "Natural dyes (pewarna alam): muted, earthy, slightly uneven dye tones with soft colour bleeding; no neon or saturated colours.",
    "sintetis": "Synthetic dyes (naptol / remazol): clean, even, saturated colours are fine.",
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

# At high creativity the 4 variations take bolder, more different directions.
WILD_VARIATIONS = [
    "An unexpected composition: break the regular grid with a diagonal or radial flow, while keeping a clean repeat.",
    "Mix in a second, contrasting batik tradition (e.g. coastal pesisir flora with court motifs) in one design.",
    "Play with scale: one oversized hero motif with tiny isen-isen worlds inside it.",
    "A bold contemporary take: abstracted, geometric shapes and daring colour placement, still hand-drawn batik.",
]


def creativity_text(c: int) -> str:
    if c <= 30:
        return ("Creativity: LOW. Stay close to the classic pakem of the template: traditional proportions, "
                "familiar motif shapes, no experimental elements.")
    if c >= 70:
        return ("Creativity: HIGH. Take bold creative liberties: surprising compositions, inventive motif combinations "
                "and fresh details nobody has seen before, while staying recognisably batik tulis.")
    return "Creativity: balanced. Respect the tradition but add a fresh, original touch."


GROUNDING_RULE = (
    "Before drawing, use Google Search (web and images) to look up real references for what is named above: authentic "
    "examples of the batik motif and the real appearance of any flower, animal, place or object mentioned. Base shapes and "
    "details on what you find so they are accurate, but create an ORIGINAL batik design; never copy a found image."
)

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
                    variation: int, n_template_refs: int, n_user_refs: int, has_sketch: bool, format: str = "tile",
                    dye: str | None = None, creativity: int = 50, grounding: bool = False) -> str:
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
    dye = dye if dye in DYE_RULES else DYE_OF.get(palette or "")
    if dye:
        parts.append(DYE_RULES[dye])
    parts.append(f"Density: {DENSITY.get(density, DENSITY['medium'])}.")
    hints = WILD_VARIATIONS if creativity >= 70 else VARIATIONS
    parts.append(f"Variation style: {hints[variation % len(hints)]}")
    parts.append(creativity_text(creativity))
    if grounding:
        parts.append(GROUNDING_RULE)
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


# ---------------------------------------------------------------- order assistant (chatbot for customers)
ORDER_FIELDS = ["purpose", "product", "motif", "colours", "dye", "size", "quantity", "deadline", "notes"]


def chat_system(shop: str, lang: str) -> str:
    language = "Indonesian (casual, polite, like a friendly shop assistant; use 'Kak')" if lang == "id" else "English"
    motifs = "; ".join(f"{m['name']} ({m['origin']['en']}): {m['meaning']['en']}" for m in MOTIFS.values())
    palettes = ", ".join(f"{k} = {v[0].split(':')[0]}" for k, v in PALETTES.items())
    return f"""You are the order assistant ("Asisten Pesanan") of {shop}, a small hand-made batik tulis business (UMKM).
You chat with a CUSTOMER who wants a custom batik order. Reply in {language}.

Goal: help the customer explain clearly what they want, so the batik maker (pengrajin) can draw it by hand with fewer
revisions. You do not replace the maker: say the maker draws the final batik by hand and confirms price and time.

Ask ONE short question at a time (max 2-3 sentences per reply), in this rough order, skipping what is already known:
1. purpose / occasion (wedding, office uniform, gift, daily wear ...)
2. product (shirt fabric, kain panjang, selendang/shawl, dress, uniform for a group ...)
3. motif or theme (offer 2-3 fitting classic motifs with a one-line meaning, or their own idea / sketch)
4. colours, and natural dye (pewarna alam: softer, earthy) vs synthetic dye (sintetis: brighter, cheaper)
5. size and quantity, 6. deadline.
If the customer attached a sketch or photo, say briefly what you see and use it as the main motif idea.
Never invent prices or promise a finish date; say the maker will confirm them.

Classic motifs you can explain: {motifs}
Palette keys: {palettes}

Set ready=true once purpose, product, motif/theme and colours are known (size/quantity/deadline may stay empty).
When ready, tell the customer you can now show AI previews and they can pick one or ask for changes.
Always fill the brief with everything known so far (empty string if unknown), written in the reply language
(except image_prompt, which is always English).
brief.format: "kain" for kain panjang / long cloth, "selendang" for a shawl, "pinggiran" for a border strip,
otherwise "tile" (a repeat pattern for shirt fabric, dress, uniform).
brief.palette: the closest palette key, or "" if none fits. brief.dye: "alam", "sintetis" or "".
brief.image_prompt: 1-3 English sentences describing the motif, mood and colours for an image generator
(no layout or format words).
suggestions: 2-4 very short reply options the customer can tap (in the reply language)."""


def chat_mock_question(step: int, lang: str) -> tuple[str, list[str]]:
    """Scripted questions for mock mode (no key): (question, quick replies)."""
    id_ = lang == "id"
    qs = [
        ("Halo Kak! 👋 Batiknya untuk acara atau keperluan apa?" if id_ else "Hi! 👋 What is the batik for?",
         ["Pernikahan", "Seragam kantor", "Hadiah", "Dipakai sehari-hari"] if id_ else ["Wedding", "Office uniform", "Gift", "Daily wear"]),
        ("Siap. Mau dibuat jadi apa, Kak?" if id_ else "Great. What will it be made into?",
         ["Kain kemeja", "Kain panjang", "Selendang", "Dress"] if id_ else ["Shirt fabric", "Long cloth", "Shawl", "Dress"]),
        ("Motifnya mau seperti apa? Misalnya Truntum (cinta yang tumbuh kembali, cocok untuk pernikahan), Parang (keteguhan), "
         "atau Kawung (kesucian). Boleh juga kirim sketsa sendiri." if id_ else
         "What kind of motif? For example Truntum (love that blossoms anew, good for weddings), Parang (perseverance) "
         "or Kawung (purity). You can also send your own sketch.",
         ["Truntum", "Parang", "Kawung", "Ide sendiri"] if id_ else ["Truntum", "Parang", "Kawung", "My own idea"]),
        ("Warnanya mau apa, dan pakai pewarna alam (lebih lembut) atau sintetis (lebih cerah)?" if id_ else
         "Which colours, and natural dye (softer) or synthetic (brighter)?",
         ["Soga cokelat, alam", "Biru indigo, alam", "Merah cerah, sintetis"] if id_ else ["Soga brown, natural", "Indigo blue, natural", "Bright red, synthetic"]),
        ("Ukuran dan jumlahnya berapa, Kak? Dan kapan dibutuhkan?" if id_ else "What size and how many? And when do you need it?",
         ["2 meter, 1 lembar", "10 potong seragam", "Belum tahu"] if id_ else ["2 metres, 1 piece", "10 uniform pieces", "Not sure yet"]),
    ]
    return qs[min(step, len(qs) - 1)]


LINEART_PROMPT = (
    "Convert the batik design labelled 'original design' into a clean tracing pattern (pola) for a batik maker, who will "
    "trace it onto cloth with a pencil before drawing it with a canting. Output: pure black outlines on a pure white "
    "background, every motif shape and isen-isen detail kept as a clear line, consistent line weight, NO colour, NO grey, "
    "NO shading or filled areas, no texture. Keep exactly the same composition, size and positions as the original."
)


def buddy_system(lang: str, shop: str, page: str = "", design: str = "", motif: str = "", auto_edit: bool = False) -> str:
    """System prompt for Tanya Canting, the design discussion friend."""
    language = "Indonesian (warm, casual, like a fellow batik maker; call the user 'Kak')" if lang == "id" else "English (warm and casual)"
    motifs = ", ".join(f"{m['name']} ({m['origin']['en'] if isinstance(m.get('origin'), dict) else m.get('origin', '')})"
                       for m in MOTIFS.values())
    ctx = []
    if page:
        ctx.append(f"The user is on the '{page}' page of the app.")
    if design:
        ctx.append(f"The design they have open is called \"{design}\"" + (f" (motif: {motif})" if motif else "") +
                   ". If an image labelled as the current design is attached, look at it carefully before answering.")
    return "\n".join([
        f"You are Tanya Canting, a friendly discussion partner inside Canting AI, a batik design app for {shop}, a small "
        "Indonesian batik business (UMKM). You think together with the maker: brainstorm motif ideas, give honest, specific "
        "feedback on a design (composition, density, colour, suitability for the product), explain the meaning, origin and "
        "etiquette of motifs (e.g. some Parang variants were historically reserved for the court), suggest colour and dye "
        "choices (natural soga/indigo/mahogany vs synthetic), and help with naming, pricing ideas and selling.",
        f"Built-in motifs in the app: {motifs}.",
        *ctx,
        f"Reply in {language}. Keep replies short: 2 to 5 sentences or a few bullets. Ask a question back when it helps.",
        "Use Google Search when facts matter (history, meaning, trends, real flowers or places) and don't invent facts.",
        "Respect the culture: the AI helps, the artisan decides. Never claim a design is authentic or certified.",
        "When a concrete next step would help, end your reply with at most one of each of these lines, written in the "
        "user's language and specific enough to use directly:\n"
        "[[STUDIO: a full description to generate a new design in the Studio]]\n"
        "[[EDIT: one clear instruction to change the currently open design]]\n"
        "Only use [[EDIT: ...]] when a design is open. Do not mention these markers in the text.",
        ("AUTO-EDIT IS ON: the user allowed you to change the open design yourself. An [[EDIT: ...]] line is applied "
         "IMMEDIATELY, so add one only when the user asks for a change or clearly agrees to your proposal, not while you "
         "are still discussing options. When you add it, say briefly in the text what you are changing; they can undo it."
         if auto_edit else
         "Auto-edit is off: an [[EDIT: ...]] line only shows the user an 'Apply' button; nothing changes until they press it."),
    ])


def upscale_prompt(kind: str = "design") -> str:
    """Redraw an image at a higher resolution without changing it (the paid 'Upscale' button)."""
    what = ("black line art on white (a batik tracing pattern)" if kind == "lineart" else "batik textile design")
    return (
        f"Upscale the {what} labelled 'original image' to a higher resolution. Output the SAME image: identical "
        "composition, every motif, line and isen-isen dot in exactly the same position, same colours and same proportions. "
        "Only make it sharper and cleaner: crisp wax-resist outlines, clean edges, fine details resolved, no blur, no JPEG "
        "artefacts. Do NOT add, remove, move or restyle anything, no new elements, no text, no watermark, no mockup."
    )
