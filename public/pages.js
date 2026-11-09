/* =====================================================================
   Canting AI: pages + router
   ===================================================================== */
const pages = {};

/* small kawung flower used by the loader and process cards */
const kawungAt = (x,y,r,cls='') => `<g class="${cls}">${[[0,-1,0],[0,1,0],[-1,0,90],[1,0,90]].map(([dx,dy,rot])=>`<ellipse cx="${x+dx*r*.55}" cy="${y+dy*r*.55}" rx="${r*.3}" ry="${r*.5}" transform="rotate(${rot} ${x+dx*r*.55} ${y+dy*r*.55})"/>`).join('')}<circle cx="${x}" cy="${y}" r="${r*.13}"/></g>`;
const procLoader = label => {
  const pts=[[25,25],[75,25],[25,75],[75,75]];
  return `<div class="proc"><svg viewBox="0 0 100 100" aria-hidden="true">
    <g class="fill">${pts.map(([x,y])=>kawungAt(x,y,34)).join('')}</g>
    <g class="wax">${pts.map(([x,y])=>kawungAt(x,y,34)).join('')}</g></svg>
    <div class="dye"></div><span class="lbl2">${label}</span></div>`;
};
const GEN_STEPS = () => [
  L('Nyorek · menyusun pola dari deskripsimu…','Nyorek · composing the pattern from your description…'),
  L('Nglowong · menggoreskan garis malam…','Nglowong · tracing the wax outlines…'),
  L('Nembok · menutup bidang dengan malam…','Nembok · blocking areas with wax…'),
  L('Medel · mencelup warna…','Medel · dyeing the cloth…'),
  L('Nglorod · meluruhkan malam…','Nglorod · melting the wax away…')
];
const GUNUNGAN = `<svg class="gunungan" viewBox="0 0 400 480" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="M200 8C262 78 332 160 342 300C348 384 300 440 200 472C100 440 52 384 58 300C68 160 138 78 200 8Z"/><path d="M200 472V170M200 250C170 230 140 200 128 160M200 250C230 230 260 200 272 160M200 320C160 300 118 280 100 240M200 320C240 300 282 280 300 240M200 200C185 185 175 165 172 140M200 200C215 185 225 165 228 140"/><path d="M150 472V410H250V472M170 410V380H230V410"/></svg>`;

/* ---------- landing ---------- */
pages[''] = {
  public:true,
  html(){
    const mk=(style,pal,o={})=>({style,colors:{...PALETTES[pal].c},scale:1,rotation:0,seed:5,wobble:true,...o});
    const a=mk('kawung','indigo',{seed:7}), b=mk('parang','soga',{seed:12}), c=mk('sekar','pesisir',{seed:5,scale:.9});
    const m=['mendung','truntum','ceplok'].map((s,i)=>mk(s,['pesisir','hijau','soga'][i],{seed:i+3}));
    const proc=[
      ['Nyorek',L('Mulai dari ide','Start from an idea'),L('Pilih template motif, tulis deskripsi, unggah foto, atau gambar sketsa dengan marker.','Pick a motif template, describe it, upload a photo, or draw a marker sketch.'),mk('kawung','soga',{wobble:false,scale:.7})],
      ['Nglowong',L('AI membuat variasi','AI makes variations'),L('Gemini menghasilkan hingga 4 variasi motif batik seamless dalam gaya pilihanmu.','Gemini generates up to 4 seamless batik motif variations in your chosen style.'),mk('parang','indigo',{scale:.7})],
      ['Medel',L('Sunting & tandai','Edit & mark'),L('Minta perubahan dengan kalimat biasa, atau lingkari bagian yang ingin diubah.','Ask for changes in plain words, or circle the part you want changed.'),mk('mendung','pesisir',{scale:.7})],
      ['Nglorod',L('Lindungi & jual','Protect & sell'),L('Beri watermark, lihat di kemeja/tas/kain, dan buat caption siap posting.','Add a watermark, preview on shirts/bags/cloth, and get a ready-to-post caption.'),mk('sekar','hijau',{scale:.7})]
    ];
    return `
    ${lnav('home')}
    <div class="band">${bandSVG()}</div>
    <div class="wrap"><section class="hero">
      <div>
        <div class="eyebrow">${ico('sparkle',16)} ${L('Generative AI untuk UMKM batik Indonesia','Generative AI for Indonesian batik small businesses (UMKM)')}</div>
        <h1>${L('Dari ide ke motif batik <em>dalam hitungan menit.</em>','From idea to batik motif <em>in minutes.</em>')}</h1>
        <p class="lead">${L('Canting AI membantu pengrajin dan pemilik UMKM batik merancang motif baru dari template, deskripsi, foto, atau sketsa tangan, lalu menyunting, melindungi, dan melihatnya langsung di atas produk.','Canting AI helps artisans and batik business owners design new motifs from templates, descriptions, photos or hand sketches, then edit, protect, and preview them on real products.')}</p>
        <div class="row wrap"><a class="btn primary" href="#/studio">${ico('sparkle')} ${L('Coba Studio Desain','Try the Design Studio')}</a><a class="btn ghost" href="#/templates">${ico('layers')} ${L('Lihat template motif','Browse motif templates')}</a></div>
        <div class="ticks"><span>${ico('check',16)} ${L('Motif pakem dihormati','Traditional motifs respected')}</span><span>${ico('check',16)} ${L('Bisa dari sketsa tangan','Works from hand sketches')}</span><span>${ico('check',16)} ${L('Ditenagai Gemini','Powered by Gemini')}</span></div>
      </div>
      <div class="collage">${GUNUNGAN}
        <div class="frame f1">${batikSVG(a,{size:420})}</div>
        <div class="frame f2">${batikSVG(b,{size:300})}</div>
        <div class="frame f3">${batikSVG(c,{size:300})}</div>
        <div class="bubble">${ico('wand',20)}<span>${L('“kawung indigo dengan sentuhan bunga melati untuk kemeja pria”','“indigo kawung with a touch of jasmine flowers for a men’s shirt”')}</span></div>
      </div>
    </section></div>
    <div class="tumpal"></div>

    <section class="sec alt" id="masalah"><div class="wrap">
      <h2>${L('Tiga masalah yang dihadapi UMKM batik','Three problems batik UMKM face')}</h2>
      <p class="sub">${L('Pengrajin punya keterampilan luar biasa, tetapi sering terhambat di sisi desain, perlindungan, dan pemasaran.','Artisans have extraordinary skill, but are often held back by design, protection, and marketing.')}</p>
      <div class="g3">
        <div class="card pain"><div class="n">01</div><h3>${L('Desain baru mahal & lambat','New designs are slow & costly')}</h3><p>${L('Menyewa desainer atau menggambar motif memakan waktu berhari-hari, sementara selera pasar berubah cepat.','Hiring a designer or drawing motifs takes days, while market tastes change fast.')}</p></div>
        <div class="card pain"><div class="n">02</div><h3>${L('Motif mudah dijiplak','Motifs are easily copied')}</h3><p>${L('Desain yang dibagikan di media sosial kerap ditiru tanpa atribusi, dan pengrajin kecil sulit membuktikan kepemilikannya.','Designs shared on social media are often copied without credit, and small artisans struggle to prove ownership.')}</p></div>
        <div class="card pain"><div class="n">03</div><h3>${L('Tampil profesional itu mahal','Looking professional is expensive')}</h3><p>${L('Foto produk dan katalog butuh biaya. Banyak UMKM belum punya visual konsisten untuk berjualan online.','Product photos and catalogues cost money. Many UMKM lack a consistent visual identity for selling online.')}</p></div>
      </div></div></section>

    <section class="sec" id="fitur"><div class="wrap">
      <h2>${L('Satu alur kerja, dari ide sampai etalase','One workflow, from idea to storefront')}</h2>
      <p class="sub">${L('Desain yang dibuat di satu langkah langsung terbawa ke langkah berikutnya.','A design made in one step carries straight into the next.')}</p>
      <div class="g4">
        <div class="card feat"><div class="ic">${ico('layers',22)}</div><h3>${L('Template & gaya baru','Templates & new styles')}</h3><p>${L('Mulai dari Kawung, Parang, Mega Mendung… atau buat template motif daerahmu sendiri.','Start from Kawung, Parang, Mega Mendung… or create a template for your own regional motif.')}</p><a href="#/templates">${L('Buka Template','Open Templates')} ${ico('arrow',16)}</a></div>
        <div class="card feat"><div class="ic">${ico('brush',22)}</div><h3>${L('Teks, foto, atau sketsa','Text, photo, or sketch')}</h3><p>${L('Tulis deskripsi, unggah foto acuan, atau gambar dengan marker. AI menyusun variasi motif seamless.','Describe it, upload a reference photo, or draw with a marker. The AI composes seamless motif variations.')}</p><a href="#/studio">${L('Buka Studio','Open Studio')} ${ico('arrow',16)}</a></div>
        <div class="card feat"><div class="ic">${ico('shield',22)}</div><h3>${L('Edit & watermark','Edit & watermark')}</h3><p>${L('“Ganti bunga yang dilingkari jadi melati”: tandai area, AI mengeditnya. Lalu beri watermark.','“Replace the circled flowers with jasmine”: mark the area and the AI edits it. Then add a watermark.')}</p><a href="#/editor">${L('Buka Editor','Open Editor')} ${ico('arrow',16)}</a></div>
        <div class="card feat"><div class="ic">${ico('shirt',22)}</div><h3>${L('Mockup produk','Product mockup')}</h3><p>${L('Lihat motif di atas kemeja, dress, tote bag, dan kain, lengkap dengan caption buatan AI.','See the motif on shirts, dresses, tote bags and fabric, with an AI-written caption.')}</p><a href="#/mockup">${L('Lihat mockup','View mockups')} ${ico('arrow',16)}</a></div>
      </div></div></section>

    <section class="sec alt" id="cara"><div class="wrap">
      <h2>${L('Cara kerja, seperti membatik','How it works, like making batik')}</h2><p class="sub">${L('Setiap langkah di aplikasi mengikuti tahap membatik tulis.','Every step in the app follows a stage of hand-drawn batik.')}</p>
      <div class="process stagger">${proc.map(([jw,t,p,d],i)=>`<div class="card pstep">${batikSVG(d,{size:300})}<i>${i+1} · ${jw}</i><b>${t}</b><p>${p}</p></div>`).join('')}</div>
    </div></section>

    <section class="sec" id="budaya"><div class="wrap"><div class="ethics">
      <div>
        <h2>${L('Menghormati warisan budaya','Respecting cultural heritage')}</h2>
        <p>${L('Batik diakui UNESCO sebagai Warisan Budaya Takbenda sejak 2009. Canting AI dirancang sebagai alat bantu pengrajin, bukan pengganti: tangan dan canting tetap menjadi pusatnya.','UNESCO recognised batik as an Intangible Cultural Heritage in 2009. Canting AI is built to support artisans, not replace them: the hand and the canting stay at the centre.')}</p>
        <div class="pts">
          <div>${ico('check',18)}<span>${L('Setiap motif pakem disertai catatan asal-usul dan maknanya, sebagai panduan, bukan jaminan keaslian.','Every canonical motif comes with notes on its origin and meaning, as guidance, not a guarantee of authenticity.')}</span></div>
          <div>${ico('check',18)}<span>${L('Pengrajin tetap menilai dan memutuskan hasil akhir.','Artisans still judge and decide on the final result.')}</span></div>
          <div>${ico('check',18)}<span>${L('Desain pengguna tidak dipakai melatih model tanpa persetujuan.','User designs are never used to train models without consent.')}</span></div>
        </div>
      </div>
      <div class="mosaic">${m.concat([a,b,c]).map(d=>`<div>${batikSVG(d,{size:200,wobble:false})}</div>`).join('')}</div>
    </div></div></section>

    <section class="cta wrap"><h2>${L('Siap membuat koleksi batik berikutnya?','Ready to create your next batik collection?')}</h2>
      <p class="sub" style="margin:0 auto 26px">${L('Pilih template, tulis satu kalimat atau gambar sketsa, dan lihat motif pertamamu muncul.','Pick a template, write one sentence or draw a sketch, and watch your first motif appear.')}</p>
      <a class="btn soga" href="#/studio">${ico('sparkle')} ${L('Mulai di Studio Desain','Start in the Design Studio')}</a></section>
    <div class="band">${bandSVG()}</div>
    ${footer()}`;
  }
};

/* ---------- architecture (one screen) ---------- */
pages.architecture = {
  public:true,
  html(){
    const base = {style:'kawung',colors:PALETTES.indigo.c,seed:7,rotation:0,scale:1};
    const v2 = batikSVG({...base,scale:2.1},{size:300});
    const v3 = batikSVG({...base,scale:.55},{size:300});
    const v4 = batikSVG({...base,colors:PALETTES.soga.c,scale:.55},{size:300});
    const wmx = `<defs><pattern id="wmA${++uid}" width="120" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)"><text x="60" y="34" text-anchor="middle" font-family="DM Sans,Arial" font-weight="700" font-size="17" fill="#fff" fill-opacity=".75" stroke="#000" stroke-opacity=".3" stroke-width="2" paint-order="stroke">© ${UMKM}</text></pattern></defs><rect width="300" height="300" fill="url(#wmA${uid})"/>`;
    const v5 = batikSVG({...base,colors:PALETTES.soga.c,scale:.55},{size:300,extra:wmx});
    const S = [
      {vis:`<div class="vis txt">${L('Template + teks + foto + sketsa','Template + text + photo + sketch')}</div>`,
       t:L('Masukan & template','Input & template'), tech:L('Frontend → FastAPI (Vercel) · template di browser','Frontend → FastAPI (Vercel) · templates in the browser'),
       b:[L('Template bawaan + buatan pengguna','Built-in + user-made templates'),L('Gambar acuan & sketsa marker (canvas)','Reference images & marker sketch (canvas)'),L('Prompt terstruktur per motif & palet','Structured prompt per motif & palette')],
       use:['studio',L('Studio AI','AI Studio')]},
      {vis:`<div class="vis">${v2}</div>`,
       t:L('Generate motif','Generate the motif'), tech:`Gemini · ${esc(state.status.image_model||'gemini-2.5-flash-image')}`,
       b:[L('Teks/gambar/sketsa → gambar motif','Text/image/sketch → motif image'),L('Hingga 4 variasi paralel, gaya berbeda','Up to 4 parallel variations, different styles'),L('Waktu tiap permintaan dicatat (metrik uji)','Time per request logged (test metric)')],
       use:['studio',L('Studio AI','AI Studio')]},
      {vis:`<div class="vis">${v3}</div>`,
       t:L('Ubin seamless','Seamless tiling'), tech:L('Pola SVG di browser','SVG pattern in the browser'),
       b:[L('Gambar diulang sebagai ubin','The image is repeated as a tile'),L('Skala, rotasi, cermin, warna','Scale, rotation, mirror, colour'),L('Rencana: perbaikan sambungan (offset & blend)','Planned: seam repair (offset & blend)')],
       use:['editor','Editor']},
      {vis:`<div class="vis">${v4}</div>`,
       t:L('Edit & tandai','Edit & mark'), tech:L('Gemini edit gambar + anotasi marker','Gemini image editing + marker annotation'),
       b:[L('Perintah bahasa natural → edit','Natural-language command → edit'),L('Area yang dilingkari dikirim sebagai gambar bertanda','Circled areas sent as a marked image'),L('Riwayat versi','Version history')],
       use:['editor','Editor']},
      {vis:`<div class="vis">${v5}</div>`,
       t:L('Lindungi & pasarkan','Protect & market'), tech:L('Canvas · SHA-256 · Gemini teks','Canvas · SHA-256 · Gemini text'),
       b:[L('Watermark terlihat + ekspor PNG','Visible watermark + PNG export'),L('Sidik jari SHA-256 dari file gambar','SHA-256 fingerprint of the image file'),L('Caption pemasaran oleh Gemini','Marketing caption by Gemini')],
       use:['watermark','Watermark']}
    ];
    return `
    ${lnav('arch')}
    <div class="wrap arch">
      <div class="arch-head"><div><h1>${L('Arsitektur teknis','Technical architecture')}</h1>
        <p>${L('Dari template, kalimat, foto, atau sketsa sampai desain yang terlindungi dan siap dijual. Lima tahap, masing-masing terhubung ke halaman di prototipe.','From a template, sentence, photo or sketch to a protected, ready-to-sell design. Five stages, each linked to a page in the prototype.')}</p></div></div>
      <div class="io in"><b>${L('Masukan','Input')}</b><span>${L('Template motif · Prompt teks · Foto acuan · Sketsa marker · Palet & kerapatan','Motif template · Text prompt · Reference photo · Marker sketch · Palette & density')}</span></div>
      <div class="vlink"></div>
      <div class="flow">${S.map((s,i)=>`
        <div class="stage">${s.vis}
          <div class="top"><span class="no">${i+1}</span><h3>${s.t}</h3></div>
          <div class="tech">${s.tech}</div>
          <ul>${s.b.map(x=>`<li>${x}</li>`).join('')}</ul>
          <a class="used" href="#/${s.use[0]}">${ico('arrow',13)} ${L('Di prototipe:','In the prototype:')} ${s.use[1]}</a>
        </div>`).join('')}</div>
      <div class="vlink"></div>
      <div class="io out"><b>${L('Keluaran','Output')}</b><span>${L('Ubin motif PNG · Template baru · Mockup produk · Caption pemasaran · Sidik jari kepemilikan','Motif tile PNG · New templates · Product mockups · Marketing caption · Ownership fingerprint')}</span></div>
      <div class="arch-2" style="margin-top:14px">
        <div class="card box"><h4>${L('Stack saat ini','Current stack')}</h4>
          <div class="pillrow">
            <span class="pill now">HTML · CSS · JavaScript</span><span class="pill now">Python · FastAPI</span>
            <span class="pill now">Gemini API (google-genai)</span><span class="pill now">IndexedDB ${L('(penyimpanan browser)','(browser storage)')}</span><span class="pill now">Vercel</span>
            <span class="pill">${L('Rencana: watermark tak terlihat, deteksi jiplakan, LoRA/ControlNet','Planned: invisible watermark, copy detection, LoRA/ControlNet')}</span>
          </div></div>
        <div class="card box"><h4>${L('Pagar etika','Guardrails')}</h4>
          <div class="pillrow">
            <span class="pill g">${ico('check',13)} ${L('Catatan budaya = panduan','Cultural notes = guidance')}</span>
            <span class="pill g">${ico('check',13)} ${L('API key milik pengguna, tidak disimpan di server','Users bring their own API key; nothing stored on the server')}</span>
            <span class="pill g">${ico('check',13)} ${L('Pengrajin tetap pengambil keputusan','The artisan stays the decision-maker')}</span>
          </div></div>
      </div>
      <p class="arch-note">${ico('info',16)} ${L('Tahap 1, 2, 4 dan caption sudah memanggil Gemini API. Watermark tak terlihat dan deteksi jiplakan masih simulasi.','Stages 1, 2, 4 and captions call the Gemini API. The invisible watermark and copy detection are still simulated.')}</p>
    </div>
    ${footer()}`;
  }
};

/* ---------- dashboard ---------- */
pages.dashboard = {
  html(){
    const st=state.status, prot=state.designs.filter(d=>d.protected).length, mine=state.templates.filter(t=>!t.builtin);
    return `
    <div class="ph"><div><h1>${L('Sugeng rawuh','Welcome')}, ${UMKM}</h1><p>${L('Ringkasan studio desain kamu.','Your design studio at a glance.')}</p></div><div class="sp"></div><a class="btn primary" href="#/studio">${ico('sparkle')} ${L('Desain baru','New design')}</a></div>
    <div class="stats stagger">
      <div class="card stat"><small>${L('Tersimpan di koleksi','Saved in collection')}</small><b>${state.designs.length}</b><span class="d">${prot} ${L('dilindungi','protected')}</span></div>
      <div class="card stat"><small>${L('Template milikmu','Your templates')}</small><b>${mine.length}</b><span class="d" style="color:var(--muted)">+ ${state.templates.length-mine.length} ${L('bawaan','built-in')}</span></div>
      <div class="card stat"><small>${L('Gambar AI dibuat','AI images made')}</small><b>${st.images}</b><span class="d" style="color:${st.failed?'var(--warn)':'var(--muted)'}">${st.failed||0} ${L('gagal','failed')}</span></div>
      <div class="card stat"><small>${L('Rata-rata waktu generate','Avg. generation time')}</small><b>${st.avg_ms?(st.avg_ms/1000).toFixed(1)+'s':'–'}</b><span class="d" style="color:var(--muted)">${aiMode()==='mock'?L('mode mock','mock mode'):'Gemini'}</span></div>
    </div>
    <div class="dash2">
      <div>
        <div class="sechead"><h3>${L('Desain terbaru','Latest designs')}</h3><div class="sp"></div><a class="btn ghost sm" href="#/gallery">${L('Lihat semua','View all')}</a></div>
        ${state.designs.length ? `<div class="dgrid stagger">${state.designs.slice(0,4).map(designCard).join('')}</div>`
          : `<div class="empty-sm">${L('Belum ada desain tersimpan. Buat desain pertamamu di Studio AI.','No saved designs yet. Create your first one in the AI Studio.')}<br><a class="btn primary sm" style="margin-top:12px" href="#/studio">${ico('sparkle',15)} ${L('Buka Studio','Open Studio')}</a></div>`}
        <div class="parang-rule"></div>
        <div class="sechead"><h3>${L('Template','Templates')}</h3><div class="sp"></div><a class="btn ghost sm" href="#/templates">${L('Kelola','Manage')}</a></div>
        <div class="dgrid stagger">${state.templates.slice(0,4).map(t=>`<a class="card dcard" href="#/studio" data-usetpl="${esc(t.id)}">${tplThumb(t,240)}<b>${esc(t.name)}</b><small>${t.builtin?L('Bawaan','Built-in'):L('Milikmu','Yours')}</small></a>`).join('')}</div>
      </div>
      <div>
        <div class="sechead"><h3>${L('Mulai cepat','Quick start')}</h3></div>
        <div class="quick stagger">
          <a class="card qa" href="#/studio"><div class="ic">${ico('sparkle',22)}</div><div><b>${L('Generate motif baru','Generate a new motif')}</b><small>${L('Dari template, teks, foto, atau sketsa','From a template, text, photo or sketch')}</small></div></a>
          <a class="card qa" href="#/templates" data-newtpl><div class="ic">${ico('layers',22)}</div><div><b>${L('Buat template motif','Create a motif template')}</b><small>${L('Misalnya motif khas daerahmu','e.g. your regional motif')}</small></div></a>
          <a class="card qa" href="#/editor"><div class="ic">${ico('edit',22)}</div><div><b>${L('Sunting desain terakhir','Edit your latest design')}</b><small>${esc(dn(state.current))}</small></div></a>
          <a class="card qa" href="#/mockup"><div class="ic">${ico('shirt',22)}</div><div><b>${L('Buat mockup produk','Create a product mockup')}</b><small>${L('Kemeja, dress, tote, kain','Shirt, dress, tote, cloth')}</small></div></a>
        </div>
        <div class="card" style="padding:18px;margin-top:20px">
          <h3 style="font-size:18px;margin-bottom:8px">${L('Tips','Tip')}</h3>
          <ul class="kawung hint" style="font-size:14px">
            <li>${L('Pakai <b>sketsa</b> kalau sulit menjelaskan bentuk motif dengan kata-kata.','Use a <b>sketch</b> when the motif shape is hard to describe in words.')}</li>
            <li>${L('Di Editor, <b>lingkari</b> bagian yang ingin diubah agar AI tidak mengubah semuanya.','In the Editor, <b>circle</b> the part to change so the AI doesn’t change everything.')}</li>
            <li>${L('Hasil yang kamu suka bisa dijadikan <b>template</b> untuk satu koleksi.','A result you like can become a <b>template</b> for a whole collection.')}</li>
          </ul>
        </div>
      </div>
    </div>`;
  },
  bind(){
    bindOpen();
    $$('[data-usetpl]').forEach(a=>a.addEventListener('click',()=>{ state.studio.mode='template'; state.studio.template_id=a.dataset.usetpl; }));
    $('[data-newtpl]').addEventListener('click',()=>setTimeout(()=>templateModal({},{onSaved:()=>go()}),50));
  }
};

/* ---------- studio ---------- */
const EXAMPLES = [
  {id:'Kawung indigo dengan bunga melati untuk kemeja pria', en:'Indigo kawung with jasmine flowers for a men’s shirt'},
  {id:'Parang soga klasik untuk kain panjang pernikahan', en:'Classic soga parang for a wedding long cloth'},
  {id:'Daun cengkeh dan burung merak, khas Trenggalek', en:'Clove leaves and peacocks, Trenggalek style'},
  {id:'Mega mendung merah pesisir untuk tote bag', en:'Red coastal mega mendung for a tote bag'}
];
function resultDesign(r, i){
  const s=state.studio, tpl = s.mode==='template' ? tplById(s.template_id) : null;
  const palLabel = s.pal!=='auto' ? tr(PALETTES[s.pal].label).split(' ')[0] : '';
  const base = tpl ? tpl.name : (s.sketch ? L('Sketsa','Sketch') : L('Desain baru','New design'));
  const fl = s.format!=='tile' ? ' '+tr(FORMATS[s.format].label) : '';
  return {id:null, name:`${base}${fl}${palLabel?' '+palLabel:''} · ${'ABCD'[i]}`, image:r.data, format:s.format, w:r.w, h:r.h,
    template_id: tpl ? tpl.id : null, style: tpl && STYLES[tpl.id] ? tpl.id : null, pal:s.pal,
    scale:1, rotation:0, mirror:false, adjust:{...DEFAULT_ADJ}, protected:false, date:today(), prompt:s.prompt,
    versions:[{image:r.data, w:r.w, h:r.h}], vi:0, ms:r.ms, mock:r.mock, model:r.model};
}
pages.studio = {
  html(){
    const s=state.studio, tplMode = s.mode==='template';
    return `
    <div class="ph"><div><h1>${L('Studio Desain AI','AI Design Studio')}</h1><p>${L('Mulai dari template atau dari nol: deskripsi, foto acuan, atau sketsa tangan.','Start from a template or from scratch: a description, a reference photo, or a hand sketch.')}</p></div></div>
    <div class="studio-grid">
      <section class="card panel">
        <div class="seg" id="mode"><button data-v="template" class="${tplMode?'on':''}">${ico('layers',16)} ${L('Dari template','From template')}</button><button data-v="new" class="${!tplMode?'on':''}">${ico('plus',16)} ${L('Desain baru','New design')}</button></div>
        ${tplMode ? `
        <label class="lbl">${L('Template','Template')}</label>
        <div class="tpl-grid">${state.templates.map(t=>`<button class="tpl-opt ${s.template_id===t.id?'on':''}" data-tpl="${esc(t.id)}" title="${esc(t.description)}">${t.builtin?'':`<i class="mine"></i><span class="tdel" data-tdel="${esc(t.id)}" role="button" aria-label="${L('Hapus template','Delete template')}">×</span>`}${tplThumb(t,120)}${esc(t.name)}</button>`).join('')}
          <button class="tpl-opt add" id="new-tpl">${ico('plus',22)}<span>${L('Buat template','New template')}</span></button></div>` : ''}
        <label class="lbl" for="prompt">${tplMode ? L('Apa yang ingin dibuat / diubah?','What should be made / changed?') : L('Deskripsi motif','Motif description')}</label>
        <textarea id="prompt" placeholder="${esc(tplMode ? L('Contoh: untuk dress wanita, lebih banyak bunga, nuansa pastel','Example: for a women’s dress, more flowers, pastel mood') : L('Contoh: batik kawung warna indigo dengan sentuhan bunga melati untuk kemeja pria modern','Example: kawung batik in indigo with a touch of jasmine flowers for a modern men’s shirt'))}">${esc(s.prompt)}</textarea>
        <div class="chips" style="margin-top:10px">${EXAMPLES.map((e,i)=>`<button class="chip" data-ex="${i}">${esc(tr(e).split(/ untuk | for a | for |, /)[0])}</button>`).join('')}</div>
        <label class="lbl">${L('Masukan gambar (opsional)','Image input (optional)')}</label>
        <div class="inputs">
          <label class="drop" id="drop">${ico('upload',20)} ${L('Foto acuan','Reference photo')}<small>${L('klik / seret, maks 2','click / drop, max 2')}</small><input type="file" accept="image/*" multiple hidden id="file"></label>
          <button class="drop" id="sketch">${ico('brush',20)} ${s.sketch?L('Ubah sketsa','Edit sketch'):L('Gambar sketsa','Draw a sketch')}<small>${L('pakai marker','with a marker')}</small></button>
        </div>
        <div class="attach">${s.refs.map((r,i)=>`<div class="th"><img src="${r}" alt=""><b>${L('acuan','ref')}</b><button data-rmref="${i}" aria-label="${L('Hapus','Remove')}">×</button></div>`).join('')}${s.sketch?`<div class="th"><img src="${s.sketch}" alt=""><b>${L('sketsa','sketch')}</b><button id="rmsketch" aria-label="${L('Hapus','Remove')}">×</button></div>`:''}</div>
        <label class="lbl">${L('Format','Format')}</label>
        <div class="fmt-list">${Object.entries(FORMATS).map(([k,f])=>`<button class="fmt ${s.format===k?'on':''}" data-fmt="${k}">${fmtIcon(f.ar,22)}<span><b>${tr(f.label)}</b><small>${tr(f.sub)}</small></span></button>`).join('')}</div>
        <label class="lbl">${L('Palet warna','Colour palette')}</label>
        <div class="pal-list"><button class="pal ${s.pal==='auto'?'on':''}" data-pal="auto"><span class="sw auto"></span>${tplMode?L('Ikuti template','Follow template'):L('Otomatis','Automatic')}</button>${Object.entries(PALETTES).map(([k,v])=>`<button class="pal ${s.pal===k?'on':''}" data-pal="${k}"><span class="sw">${['bg','primary','secondary','accent'].map(x=>`<i style="background:${v.c[x]}"></i>`).join('')}</span>${tr(v.label)}</button>`).join('')}</div>
        <div class="mgrid" style="gap:10px">
          <div><label class="lbl">${L('Kerapatan','Density')}</label><div class="seg" id="density">${[['sparse',L('Jarang','Sparse')],['medium',L('Sedang','Medium')],['dense',L('Rapat','Dense')]].map(([v,l])=>`<button data-v="${v}" class="${s.density===v?'on':''}">${l}</button>`).join('')}</div></div>
          <div><label class="lbl">${L('Jumlah variasi','Variations')}</label><div class="seg" id="count">${[1,2,4].map(n=>`<button data-v="${n}" class="${s.count===n?'on':''}">${n}</button>`).join('')}</div></div>
        </div>
        ${imageModels().length ? `<label class="lbl">${L('Model AI','AI model')}</label>${modelSelect()}
          <label class="lbl">${L('Resolusi','Resolution')}</label>${sizePicker()}
          <p class="hint" style="margin-top:6px">${L('1K untuk layar; 2K/4K untuk cetak kain. Makin besar makin lama (4K sekitar 30–40 dtk) dan biasanya makin mahal.','1K for screens; 2K/4K for printing cloth. Bigger takes longer (4K about 30–40 s) and usually costs more.')}</p>` : ''}
        <button class="btn primary block" id="gen" style="margin-top:22px" ${s.status==='loading'?'disabled':''}>${ico('sparkle')} ${L(`Generate ${s.count} variasi`,`Generate ${s.count} variation${s.count>1?'s':''}`)}</button>
        <p class="hint" style="margin-top:8px;text-align:center">${aiMode()==='mock'?L('Mode mock: gambar contoh, tanpa biaya. Masukkan API key untuk hasil asli.','Mock mode: sample images, no cost. Add an API key for real results.'):L(`Memakai ${s.count} panggilan gambar Gemini.`,`Uses ${s.count} Gemini image call${s.count>1?'s':''}.`)}</p>
      </section>
      <section class="results" id="results"></section>
    </div>`;
  },
  bind(){
    const s=state.studio;
    const keep = () => { s.prompt = $('#prompt').value; };
    const rerender = () => { keep(); go(); };
    $('#prompt').addEventListener('input',e=>{ s.prompt=e.target.value; });
    $$('#mode button').forEach(b=>b.addEventListener('click',()=>{ s.mode=b.dataset.v; rerender(); }));
    $$('[data-tpl]').forEach(b=>b.addEventListener('click',async e=>{
      if(e.target.closest('[data-tdel]')){ keep(); if(await deleteTemplate(b.dataset.tpl)) go(); return; }
      s.template_id=b.dataset.tpl; rerender(); }));
    $('#new-tpl')?.addEventListener('click',()=>{ keep(); templateModal({},{onSaved:t=>{ s.template_id=t.id; go(); }}); });
    $$('[data-ex]').forEach(b=>b.addEventListener('click',()=>{ s.prompt=tr(EXAMPLES[+b.dataset.ex]); go(); }));
    $$('[data-pal]').forEach(b=>b.addEventListener('click',()=>{ s.pal=b.dataset.pal; rerender(); }));
    $$('[data-fmt]').forEach(b=>b.addEventListener('click',()=>{ s.format=b.dataset.fmt; rerender(); }));
    $$('#density button').forEach(b=>b.addEventListener('click',()=>{ s.density=b.dataset.v; rerender(); }));
    $$('#count button').forEach(b=>b.addEventListener('click',()=>{ s.count=+b.dataset.v; rerender(); }));
    const addFiles=async files=>{
      keep();
      for(const f of files){ if(s.refs.length>=2){ toast(L('Maksimal 2 foto acuan.','Max 2 reference photos.'),true); break; }
        try{ s.refs.push(await fileToDataURL(f)); }catch(e){ toast(e.message,true); } }
      go();
    };
    $('#file').addEventListener('change',e=>addFiles([...e.target.files]));
    const drop=$('#drop');
    ['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{ e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave','drop'].forEach(t=>drop.addEventListener(t,()=>drop.classList.remove('over')));
    drop.addEventListener('drop',e=>{ e.preventDefault(); addFiles([...e.dataTransfer.files]); });
    $$('[data-rmref]').forEach(b=>b.addEventListener('click',()=>{ keep(); s.refs.splice(+b.dataset.rmref,1); go(); }));
    $('#rmsketch')?.addEventListener('click',()=>{ keep(); s.sketch=null; s.sketchStrokes=null; go(); });
    $('#sketch').addEventListener('click',async()=>{ keep(); const r=await sketchModal(s.sketchStrokes); if(r){ s.sketch=r.dataURL; s.sketchStrokes=r.strokes; go(); } });
    bindModelSelect(); bindSizePicker();
    $('#gen').addEventListener('click',()=>{ keep(); runGenerate(); });
    renderResults();
  }
};
async function runGenerate(){
  const s=state.studio;
  const tpl = s.mode==='template' ? tplById(s.template_id) : null;
  if(!s.prompt.trim() && !tpl && !s.refs.length && !s.sketch){
    toast(L('Tulis deskripsi, unggah foto, atau gambar sketsa dulu.','Write a description, upload a photo, or draw a sketch first.'),true); return;
  }
  s.status='loading'; s.used=s.prompt; s.t0=performance.now(); s.usedTpl=tpl?tpl.id:null;
  s.results=Array.from({length:s.count},()=>({status:'pending'}));
  const btn=$('#gen'); if(btn) btn.disabled=true;
  renderResults();
  const body={prompt:s.prompt, template_id:tpl&&tpl.builtin?tpl.id:null,
    template: tpl&&!tpl.builtin ? {name:tpl.name, description:tpl.description, palette:tpl.palette||null, refs:(tpl.ref_images||[]).slice(0,3)} : null, palette:s.pal==='auto'?null:s.pal, density:s.density, format:s.format, references:s.refs, sketch:s.sketch, model:state.aiModel, size:state.aiSize};
  await Promise.all(s.results.map(async (slot,i)=>{
    try{ const r=await api('/api/generate',{...body, variation:i}); slot.status='done'; slot.d=resultDesign(r,i); logGen(r.ms, true); }
    catch(e){ slot.status='error'; slot.error=e.message; logGen(0, false); }
    renderSlot(i, true);
  }));
  s.status='done'; s.elapsed=(performance.now()-s.t0)/1000;
  await refreshStatus();
  if(route==='studio') go();
  const ok=s.results.filter(x=>x.status==='done').length;
  if(!ok) toast(s.results[0].error||L('Gagal membuat gambar.','Failed to create images.'),true);
}
function renderResults(){
  const el=$('#results'); if(!el) return;
  const s=state.studio;
  if(s.status==='idle' || !s.results.length){
    el.innerHTML=`<div class="empty"><div><svg class="em-ic" viewBox="0 0 40 40"><ellipse cx="20" cy="11" rx="5" ry="8.5"/><ellipse cx="29" cy="20" rx="8.5" ry="5"/><ellipse cx="20" cy="29" rx="5" ry="8.5"/><ellipse cx="11" cy="20" rx="8.5" ry="5"/></svg><h3>${L('Variasi desain akan muncul di sini','Design variations will appear here')}</h3><p>${L('Pilih template atau tulis deskripsi di samping,<br>lalu tekan <b>Generate</b>.','Pick a template or write a description on the left,<br>then press <b>Generate</b>.')}</p></div></div>`;
    return;
  }
  const tpl=tplById(s.usedTpl), q=s.used.length>46?s.used.slice(0,46)+'…':s.used, loading=s.status==='loading';
  el.innerHTML=`
    <div class="res-head"><h3 style="font-size:22px">${s.results.length} ${L('variasi','variation'+(s.results.length>1?'s':''))}${q?` ${L('untuk','for')} “${esc(q)}”`:''}</h3><div class="sp"></div>
      ${loading ? `<span class="stp" id="stp">${ico('clock',16)} ${GEN_STEPS()[0]}</span>`
        : `<span class="tag ok">${ico('check',14)} ${L('Selesai','Done')} · ${s.elapsed.toFixed(1)} ${L('dtk','s')}</span><button class="btn ghost sm" id="regen">${ico('refresh',15)} ${L('Ulangi','Redo')}</button>`}</div>
    <div class="res-grid">${s.results.map((_,i)=>`<div class="card rcard" id="slot${i}"></div>`).join('')}</div>
    ${tpl && (tpl.meaning||tpl.origin) ? `<div class="note">${ico('info',22)}<div><b>${L('Catatan budaya','Cultural note')} · ${esc(tpl.name)}${tpl.origin?` (${esc(tr(tpl.origin))})`:''}</b><p>${esc(tr(tpl.meaning)||'')} <i>${L('Catatan ini panduan, bukan jaminan keaslian; tetap libatkan penilaian pengrajin.','This note is guidance, not a guarantee of authenticity; keep the artisan’s judgement involved.')}</i></p></div></div>` : ''}`;
  s.results.forEach((_,i)=>renderSlot(i,false));
  if(loading){
    let k=0; clearInterval(renderResults._iv);
    renderResults._iv=setInterval(()=>{ const e=$('#stp'); if(!e || state.studio.status!=='loading'){ clearInterval(renderResults._iv); return; } k=(k+1)%GEN_STEPS().length; e.innerHTML=ico('clock',16)+' '+GEN_STEPS()[k]; },1900);
  }
  $('#regen')?.addEventListener('click',runGenerate);
}
function renderSlot(i, fresh){
  const el=$('#slot'+i); if(!el) return;
  const slot=state.studio.results[i], letter='ABCD'[i];
  el.classList.toggle('err', slot.status==='error');
  if(slot.status==='pending'){ el.innerHTML=`${procLoader(L('Variasi ','Variation ')+letter)}<h4 style="margin-top:12px">${L('Sedang dibuat…','Creating…')}</h4><div class="meta">${L('Biasanya 5–20 detik','Usually 5–20 seconds')}</div>`; return; }
  if(slot.status==='error'){ el.innerHTML=`<div class="svgbox">${ico('info',26)}<br>${esc(slot.error)}</div><h4>${L('Variasi','Variation')} ${letter}</h4><div class="meta">${L('Gagal dibuat','Failed')}</div>`; return; }
  const d=slot.d;
  const natural = d.w && d.h ? ` style="aspect-ratio:${d.w}/${d.h};max-height:460px;object-fit:contain;background:#efe3c6"` : '';
  el.innerHTML=`<div class="svgbox ${fresh?'reveal':''}"><img src="${esc(d.image)}" alt="${esc(dn(d))}"${natural}></div>
    <h4>${esc(dn(d))}</h4><div class="meta">${isTile(d)?'':tr(FORMATS[d.format].label)+' · '}${d.model&&!d.mock?esc(modelLabel(d.model))+' · ':''}${d.w&&d.h?`${d.w}×${d.h} · `:''}${(d.ms/1000).toFixed(1)} ${L('dtk','s')}${d.mock?' · mock':''}${d.id?' · '+L('tersimpan','saved'):''}</div>
    <div class="row"><button class="btn primary sm" data-act="edit">${ico('edit',15)} Edit</button><button class="btn ghost sm" data-act="save">${ico('save',15)} ${L('Simpan','Save')}</button><button class="btn ghost sm" data-act="mock">${ico('shirt',15)} Mockup</button><button class="btn ghost sm" data-act="tpl" title="${L('Jadikan template untuk gaya baru','Make it a template for a new style')}">${ico('layers',15)} ${L('Jadikan template','Make template')}</button></div>`;
  $$('[data-act]',el).forEach(b=>b.addEventListener('click',async()=>{
    const a=b.dataset.act;
    if(a==='edit') openEditor(d);
    if(a==='save'){ await saveDesign(d); renderSlot(i,false); }
    if(a==='mock'){ state.current=structuredClone(d); nav('mockup'); }
    if(a==='tpl') saveAsTemplate(d);
  }));
}

/* ---------- templates page ---------- */
pages.templates = {
  html(){
    const builtin=state.templates.filter(t=>t.builtin), mine=state.templates.filter(t=>!t.builtin);
    const card=t=>`<div class="card tcard">${tplThumb(t,300)}
      ${t.ref_images.length>1?`<div class="refs">${t.ref_images.slice(1).map(src=>`<img src="${esc(src)}" alt="">`).join('')}</div>`:''}
      <h4>${esc(t.name)} ${t.builtin?`<span class="tag">${L('Bawaan','Built-in')}</span>`:''}</h4>
      <p>${esc(t.builtin && t.meaning ? tr(t.meaning) : t.description)}</p>
      <div class="row"><button class="btn primary sm" data-use="${esc(t.id)}">${ico('sparkle',15)} ${L('Pakai','Use')}</button>
        ${t.builtin ? `<button class="btn ghost sm" data-dup="${esc(t.id)}" title="${L('Salin jadi template baru yang bisa diubah','Copy into a new editable template')}">${ico('copy',15)} ${L('Buat gaya baru','New style')}</button>`
          : `<button class="btn ghost sm" data-edit="${esc(t.id)}">${ico('edit',15)} Edit</button><button class="btn danger sm" data-delt="${esc(t.id)}">${ico('trash',15)} ${L('Hapus','Delete')}</button>`}</div></div>`;
    return `
    <div class="ph"><div><h1>${L('Template Motif','Motif Templates')}</h1><p>${L('Titik awal untuk setiap desain. Buat template dari motif daerahmu, dari foto, sketsa, atau dari hasil desain yang kamu suka.','The starting point for every design. Make templates from your regional motifs, photos, sketches, or designs you like.')}</p></div><div class="sp"></div>
      <button class="btn soga" id="create">${ico('plus')} ${L('Buat template','Create template')}</button></div>
    <div class="sechead"><h3>${L('Template milikmu','Your templates')}</h3></div>
    ${mine.length ? `<div class="gal stagger">${mine.map(card).join('')}</div>`
      : `<div class="empty-sm">${L('Belum ada template buatanmu. Klik <b>Buat template</b>, atau tekan <b>Jadikan template</b> pada hasil desain di Studio.','No templates of your own yet. Click <b>Create template</b>, or press <b>Make template</b> on a design in the Studio.')}</div>`}
    <div class="parang-rule"></div>
    <div class="sechead"><h3>${L('Motif pakem (bawaan)','Classic motifs (built-in)')}</h3></div>
    <div class="gal stagger">${builtin.map(card).join('')}</div>`;
  },
  bind(){
    $('#create').addEventListener('click',()=>templateModal({},{onSaved:()=>go()}));
    $$('[data-use]').forEach(b=>b.addEventListener('click',()=>{ Object.assign(state.studio,{mode:'template',template_id:b.dataset.use}); nav('studio'); }));
    $$('[data-dup]').forEach(b=>b.addEventListener('click',()=>{ const t=tplById(b.dataset.dup);
      templateModal({name:`${t.name} ${L('Gaya Baru','New Style')}`, description:`${t.description}\n${L('Variasi','Twist')}: `, palette:t.palette, origin:tr(t.origin)||'', meaning:tr(t.meaning)||''},{onSaved:()=>go()}); }));
    $$('[data-edit]').forEach(b=>b.addEventListener('click',()=>{ const t=tplById(b.dataset.edit);
      templateModal({id:t.id, name:t.name, description:t.description, palette:t.palette||'', origin:tr(t.origin)||'', meaning:tr(t.meaning)||'', ref_images:t.ref_images},{onSaved:()=>go()}); }));
    $$('[data-delt]').forEach(b=>b.addEventListener('click',async()=>{ if(await deleteTemplate(b.dataset.delt)) go(); }));
  }
};

/* ---------- editor ---------- */
const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
function shade(hex,f){ // f -1..1  (negative = darker)
  const n=parseInt(hex.slice(1),16); let r=n>>16,g=n>>8&255,b=n&255;
  const t=f<0?0:255, p=Math.abs(f);
  r=clamp(r+(t-r)*p); g=clamp(g+(t-g)*p); b=clamp(b+(t-b)*p);
  return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
}
const ed = {mark:false, pad:null, busy:false};
/* tall designs (selendang) would be huge at full width, so cap them to the viewport height */
const artStyle = d => { const ar=d.image?arOf(d):1; return ar<1 ? `max-width:min(600px, calc(70vh * ${ar.toFixed(4)}))` : (ar>1.2 ? 'max-width:860px' : ''); };
pages.editor = {
  html(){
    const d=state.current, img=!!d.image, a=d.adjust||DEFAULT_ADJ;
    const CK=[['bg',L('Latar','Back')],['dark',L('Garis','Line')],['primary',L('Utama','Main')],['secondary',L('Kedua','Second')],['accent',L('Aksen','Accent')]];
    const chips=[L('Lebih gelap dan kontras','Darker and more contrast'),L('Tambah bunga melati kecil','Add small jasmine flowers'),L('Ganti ke palet indigo','Switch to an indigo palette'),L('Garis lebih halus seperti batik tulis','Finer lines like hand-drawn batik'),L('Tambah efek remukan (retak lilin)','Add wax crackle effect')];
    const vers=d.versions||[];
    return `
    <div class="ph"><div><h1>${L('Editor Desain','Design Editor')}</h1><p>${L('Minta AI mengubah desain, tandai bagian tertentu dengan marker, atau atur warna dan skala.','Ask the AI to change the design, mark specific parts with a marker, or adjust colour and scale.')}</p></div><div class="sp"></div>
      <button class="btn ghost" id="png">${ico('download')} PNG</button>
      <button class="btn ghost" id="astpl">${ico('layers')} ${L('Jadikan template','Make template')}</button>
      <button class="btn ghost" id="save">${ico('save')} ${L('Simpan','Save')}</button>
      <a class="btn primary" href="#/watermark">${L('Lanjut ke Watermark','Continue to Watermark')} ${ico('arrow')}</a></div>
    <div class="ed-grid">
      <div class="board"><div class="art" id="canvas" style="${artStyle(d)}"></div>
        <div class="btools">
          <button class="btn ${ed.mark?'soga':'ghost'} sm" id="mark">${ico('marker',15)} ${ed.mark?L('Selesai menandai','Done marking'):L('Tandai area','Mark an area')}</button>
          <span id="padbar"></span>
          ${!ed.mark ? `<span class="tag dark">${esc(designLabel(d))}</span>${d.mock?'<span class="tag mock">mock</span>':''}` : ''}
        </div></div>
      <aside class="card insp">
        <section><h4>${L('Nama desain','Design name')}</h4><input type="text" id="name" value="${esc(dn(d))}"></section>
        <section><h4>${ico('wand',18)} ${L('Edit dengan AI','Edit with AI')}</h4>
          <div class="ai-box">
            ${ed.mark ? `<div class="marknote">${ico('marker',16)} ${L('Coretan marker akan dikirim ke AI: hanya area bertanda yang diubah.','Your marker strokes are sent to the AI: only marked areas change.')}</div>` : ''}
            <textarea id="ai-text" placeholder="${esc(ed.mark ? L('Contoh: ganti bunga yang dilingkari jadi melati','Example: replace the circled flowers with jasmine') : L('Contoh: buat lebih gelap dan tambahkan bunga melati','Example: make it darker and add jasmine flowers'))}"></textarea>
            <div class="chips">${chips.map(x=>`<button class="chip" data-ai="${esc(x)}">${x}</button>`).join('')}</div>
            ${imageModels().length ? `<div class="row" style="margin-bottom:10px"><span class="hint" style="flex:none">${L('Model','Model')}</span>${modelSelect()}</div>` : ''}
            <button class="btn primary sm block" id="ai-go" ${ed.busy?'disabled':''}>${ico('sparkle',15)} ${ed.busy?L('AI sedang mengedit…','AI is editing…'):L('Terapkan','Apply')}</button>
          </div></section>
        ${vers.length>1 ? `<section><h4>${ico('clock',18)} ${L('Riwayat versi','Version history')}</h4><div class="hist">${vers.map((v,i)=>`<button class="${i===d.vi?'on':''}" data-ver="${i}" title="v${i+1}"><img src="${esc(v.image)}" alt="v${i+1}"></button>`).join('')}</div></section>` : ''}
        ${img ? `<section><h4>${ico('palette',18)} ${L('Warna','Colour')}</h4>
          <div class="slider"><div class="t"><span>${L('Rona (hue)','Hue')}</span><span id="hu-v"></span></div><input type="range" id="hu" min="-180" max="180" step="1" value="${a.hue}"></div>
          <div class="slider"><div class="t"><span>${L('Saturasi','Saturation')}</span><span id="sa-v"></span></div><input type="range" id="sa" min="0" max="2" step=".05" value="${a.sat}"></div>
          <div class="slider"><div class="t"><span>${L('Kecerahan','Brightness')}</span><span id="br-v"></span></div><input type="range" id="br" min=".5" max="1.5" step=".02" value="${a.bright}"></div>
          <button class="btn ghost xs" id="adj-reset">${ico('undo',13)} ${L('Reset warna','Reset colour')}</button></section>`
        : `<section><h4>${ico('palette',18)} ${L('Warna','Colours')}</h4>
          <div class="colors">${CK.map(([k,l])=>`<label>${l}<input type="color" data-c="${k}" value="${d.colors[k]}"></label>`).join('')}</div>
          <div class="chips" style="margin-top:12px">${Object.entries(PALETTES).map(([k,v])=>`<button class="chip" data-p="${k}">${tr(v.label).split(' ')[0]}</button>`).join('')}</div></section>`}
        <section><h4>${L('Transformasi','Transform')}</h4>
          <div class="slider"><div class="t"><span>${L('Skala motif','Motif scale')}</span><span id="sc-v"></span></div><input type="range" id="sc" min="${img?.25:.5}" max="2" step=".05" value="${d.scale}"></div>
          <div class="slider"><div class="t"><span>${L('Rotasi','Rotation')}</span><span id="rt-v"></span></div><input type="range" id="rt" min="-90" max="90" step="1" value="${d.rotation||0}"></div>
          <div class="row wrap">
            <label class="switch"><input type="checkbox" id="mir" ${d.mirror?'checked':''}><span class="trk"></span><span><b>${L('Cermin','Mirror')}</b></span></label>
            ${img?'':`<label class="switch" style="margin-left:14px"><input type="checkbox" id="wob" ${d.wobble!==false?'checked':''}><span class="trk"></span><span><b>${L('Efek canting','Canting effect')}</b></span></label>`}
          </div>
          ${img?`<p class="hint" style="margin-top:8px">${L('Skala < 1 menampilkan pengulangan ubin, untuk mengecek sambungannya.','Scale < 1 shows the tile repeating, to check the seams.')}</p>`:''}</section>
      </aside>
    </div>`;
  },
  bind(){
    const d=state.current, a=d.adjust=d.adjust||{...DEFAULT_ADJ};
    const draw=()=>{
      const art=$('#canvas');
      if(ed.mark){
        // marking happens on the un-transformed image so strokes line up with what the AI receives
        art.innerHTML=rawSVG(d,640)+`<canvas class="marks" width="1024" height="${Math.round(1024/arOf(d))}"></canvas>`;
        const old=ed.pad; ed.pad=new DrawPad($('canvas',art),{color:'#E5262B',size:9});
        if(old){ ed.pad.strokes=old.strokes; ed.pad.redraw(); }
      } else art.innerHTML=batikSVG(d,{size:640,natural:true});
      $('#sc-v').textContent=(+d.scale).toFixed(2)+'×'; $('#rt-v').textContent=(d.rotation||0)+'°';
      if($('#hu-v')){ $('#hu-v').textContent=a.hue+'°'; $('#sa-v').textContent=Math.round(a.sat*100)+'%'; $('#br-v').textContent=Math.round(a.bright*100)+'%'; }
    };
    const redrawArt=()=>{ if(ed.mark) $('#canvas svg').outerHTML=rawSVG(d,640); else $('#canvas').innerHTML=batikSVG(d,{size:640,natural:true}); $('#sc-v').textContent=(+d.scale).toFixed(2)+'×'; $('#rt-v').textContent=(d.rotation||0)+'°'; if($('#hu-v')){ $('#hu-v').textContent=a.hue+'°'; $('#sa-v').textContent=Math.round(a.sat*100)+'%'; $('#br-v').textContent=Math.round(a.bright*100)+'%'; } };
    draw();
    if(ed.mark){ $('#padbar').innerHTML=padTools(['#E5262B','#F2C230','#1C8BD6']).replace('<div class="pad-tools">','<div class="pad-tools" style="margin:0">'); bindPadTools($('#padbar'),ed.pad); }
    $('#mark').addEventListener('click',()=>{ ed.mark=!ed.mark; if(!ed.mark) ed.pad=null; keepText(); go(); });
    const keepText=()=>{ pages.editor._txt=$('#ai-text').value; };
    if(pages.editor._txt){ $('#ai-text').value=pages.editor._txt; pages.editor._txt=''; }
    $('#name').addEventListener('input',e=>{ d.name=e.target.value; });
    $$('[data-c]').forEach(i=>i.addEventListener('input',()=>{ d.colors[i.dataset.c]=i.value; redrawArt(); }));
    $$('[data-p]').forEach(b=>b.addEventListener('click',()=>{ d.colors={...PALETTES[b.dataset.p].c}; d.pal=b.dataset.p; go(); }));
    $('#hu')?.addEventListener('input',e=>{ a.hue=+e.target.value; redrawArt(); });
    $('#sa')?.addEventListener('input',e=>{ a.sat=+e.target.value; redrawArt(); });
    $('#br')?.addEventListener('input',e=>{ a.bright=+e.target.value; redrawArt(); });
    $('#adj-reset')?.addEventListener('click',()=>{ Object.assign(a,DEFAULT_ADJ); go(); });
    $('#sc').addEventListener('input',e=>{ d.scale=+e.target.value; redrawArt(); });
    $('#rt').addEventListener('input',e=>{ d.rotation=+e.target.value; redrawArt(); });
    $('#mir').addEventListener('change',e=>{ d.mirror=e.target.checked; redrawArt(); });
    $('#wob')?.addEventListener('change',e=>{ d.wobble=e.target.checked; redrawArt(); });
    $$('[data-ver]').forEach(b=>b.addEventListener('click',()=>{ const v=d.versions[+b.dataset.ver]; d.vi=+b.dataset.ver; d.image=v.image; if(v.w){ d.w=v.w; d.h=v.h; } go(); }));
    $$('[data-ai]').forEach(b=>b.addEventListener('click',()=>{ $('#ai-text').value=b.dataset.ai; }));
    bindModelSelect();
    $('#ai-go').addEventListener('click',()=>aiEdit($('#ai-text').value));
    $('#save').addEventListener('click',()=>saveDesign(d));
    $('#astpl').addEventListener('click',()=>saveAsTemplate(d));
    $('#png').addEventListener('click',()=>exportPNG(batikSVG(d,{size:640,natural:true}),(dn(d)||'design')+'.png',1400,arOf(d)));
  }
};
async function aiEdit(txt){
  const d=state.current;
  if(!txt.trim()){ toast(L('Tulis perintah dulu, atau pilih salah satu saran.','Write a command first, or pick a suggestion.'),true); return; }
  const marked = ed.mark && ed.pad && !ed.pad.isEmpty();
  if(ed.mark && !marked){ toast(L('Belum ada tanda. Coret area yang ingin diubah, atau matikan mode tandai.','Nothing marked yet. Mark the area to change, or turn marking off.'),true); return; }
  ed.busy=true; pages.editor._txt=txt;
  const btn=$('#ai-go'); btn.disabled=true; btn.innerHTML=ico('sparkle',15)+' '+L('AI sedang mengedit…','AI is editing…');
  $('#canvas').classList.add('busy');
  try{
    // what the AI sees = the raw design with colour adjustments baked in
    const baked = !d.image || hasAdj(d.adjust);
    let image_data;
    if(baked){
      const cv=await svgToCanvas(rawSVG(d,1024),1024,Math.round(1024/arOf(d)));
      image_data=cv.toDataURL('image/jpeg',.92);
      if(!d.versions || !d.versions.length){ d.versions=[{image:image_data, w:cv.width, h:cv.height}]; d.vi=0; }
    } else image_data=await shrinkDataURL(d.image, 1536, .92);  // the server shrinks inputs anyway; this keeps the request small
    let annotation=null;
    if(marked){
      const cv=await svgToCanvas(rawSVG(d,1024),1024,ed.pad.cv.height);
      cv.getContext('2d').drawImage(ed.pad.cv,0,0,cv.width,cv.height);
      annotation=cv.toDataURL('image/jpeg',.9);
    }
    const long = Math.max(d.w||1024, d.h||1024), size = long>=3000 ? '4K' : long>=1500 ? '2K' : '1K';  // keep the original resolution
    const r=await api('/api/edit',{instruction:txt,image_data,annotation,format:d.format||'tile',model:state.aiModel,size});
    logGen(r.ms, true);
    if(!d.image){ d.scale=1; d.rotation=0; d.mirror=false; }  // procedural transforms are baked into the edited image
    d.versions=(d.versions||[]).slice(0,(d.vi??0)+1).concat({image:r.data,w:r.w,h:r.h}); d.vi=d.versions.length-1;
    d.image=r.data; d.w=r.w; d.h=r.h; d.adjust={...DEFAULT_ADJ}; d.mock=r.mock; d.model=r.model;
    ed.mark=false; ed.pad=null; pages.editor._txt='';
    toast(L(`AI selesai mengedit (${(r.ms/1000).toFixed(1)} dtk)`,`AI edit done (${(r.ms/1000).toFixed(1)} s)`));
    refreshStatus();
  }catch(e){ toast(e.message,true); }
  finally{ ed.busy=false; if(route==='editor') go(); }
}

/* ---------- watermark ---------- */
function wmOverlay(W, H=W){
  const w=state.wm, id=++uid, fs=Math.round(26*w.size), shadow=w.color.toLowerCase()==='#ffffff'?'#000':'#fff';
  const txt=(x,y,anchor,extra='')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="DM Sans,Arial,sans-serif" font-weight="700" font-size="${fs}" fill="${w.color}" stroke="${shadow}" stroke-opacity=".35" stroke-width="3" paint-order="stroke" ${extra}>© ${esc(w.text||'Brand')}</text>`;
  if(w.pos==='br') return `<g opacity="${w.opacity}">${txt(W-20,H-22,'end')}</g>`;
  if(w.pos==='center') return `<g opacity="${w.opacity}">${txt(W/2,H/2+fs/3,'middle',`transform="rotate(-18 ${W/2} ${H/2})"`)}</g>`;
  const pw=Math.max(150,fs*8.2), ph=Math.max(90,fs*4);
  return `<defs><pattern id="w${id}" width="${pw}" height="${ph}" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)"><g opacity="${w.opacity}">${txt(pw/2,ph/2,'middle')}</g></pattern></defs><rect width="${W}" height="${H}" fill="url(#w${id})"/>`;
}
pages.watermark = {
  html(){
    const w=state.wm;
    return `
    <div class="ph"><div><h1>${L('Watermark & Perlindungan','Watermark & Protection')}</h1><p>${L('Lindungi desain sebelum dibagikan ke media sosial atau marketplace.','Protect your design before sharing it on social media or marketplaces.')}</p></div><div class="sp"></div>
      <a class="btn ghost" href="#/editor">${ico('edit')} ${L('Kembali ke editor','Back to editor')}</a>
      <a class="btn primary" href="#/mockup">${L('Lanjut ke Mockup','Continue to Mockup')} ${ico('arrow')}</a></div>
    <div class="ed-grid">
      <div>
        <div class="board"><div class="art" id="canvas" style="${artStyle(state.current)}"></div>
          <div class="btools">
            <button class="btn ghost" id="dl-wm">${ico('download')} ${L('Unduh pratinjau (watermark)','Download preview (watermarked)')}</button>
            <button class="btn ghost" id="dl-hd">${ico('download')} ${L('Unduh HD bersih','Download clean HD')}</button></div></div>
        <div class="card detect" id="detect"></div>
      </div>
      <aside class="card insp">
        <section><h4>${ico('eye',18)} ${L('Watermark terlihat','Visible watermark')}</h4>
          <label class="lbl" style="margin-top:0">${L('Teks / nama brand','Text / brand name')}</label><input type="text" id="wm-text" value="${esc(w.text)}">
          <label class="lbl">${L('Posisi','Position')}</label>
          <div class="seg" id="wm-pos">${[['br',L('Pojok','Corner')],['center',L('Tengah','Centre')],['tile',L('Berulang','Tiled')]].map(([k,l])=>`<button data-v="${k}" class="${w.pos===k?'on':''}">${l}</button>`).join('')}</div>
          <div class="slider" style="margin-top:14px"><div class="t"><span>${L('Keburaman','Opacity')}</span><span id="op-v"></span></div><input type="range" id="wm-op" min=".15" max="1" step=".05" value="${w.opacity}"></div>
          <div class="slider"><div class="t"><span>${L('Ukuran teks','Text size')}</span><span id="sz-v"></span></div><input type="range" id="wm-sz" min=".6" max="2" step=".1" value="${w.size}"></div>
          <div class="seg" id="wm-col">${[['#ffffff',L('Putih','White')],['#111111',L('Hitam','Black')],['#B8862F',L('Emas','Gold')]].map(([k,l])=>`<button data-v="${k}" class="${w.color===k?'on':''}">${l}</button>`).join('')}</div></section>
        <section><h4>${ico('lock',18)} ${L('Perlindungan tak terlihat','Invisible protection')} <span class="tag">${L('rancangan','planned')}</span></h4>
          <label class="switch"><input type="checkbox" id="wm-inv" ${w.invisible?'checked':''}><span class="trk"></span><span><b>${L('Daftarkan sidik jari desain','Register the design fingerprint')}</b><small>${L('Sidik jari SHA-256 dihitung dari file gambar asli. Penanda tak terlihat yang tahan crop masih tahap rancangan.','A SHA-256 fingerprint is computed from the original image file. A crop-resistant invisible mark is still being designed.')}</small></span></label></section>
        <section><h4>${ico('shield',18)} ${L('Sertifikat digital','Digital certificate')}</h4>
          <div class="cert" id="cert"></div></section>
        <section><button class="btn gold block" id="sim">${ico('scan')} ${L('Simulasikan deteksi jiplakan','Simulate copy detection')}</button>
          <p class="hint" style="margin-top:8px">${L('Simulasi: bagaimana sistem nanti mengenali desain tiruan.','Simulation: how the system will recognise a copied design.')}</p></section>
      </aside>
    </div>`;
  },
  bind(){
    const d=state.current, w=state.wm;
    let fp='';
    const certBox=()=>{
      const cid='CTG-'+new Date().getFullYear()+'-'+(fp||'000000').slice(0,6).toUpperCase();
      $('#cert').innerHTML = w.invisible
        ? `<b>${esc(dn(d))}</b><span class="id">${cid}</span>
           <dl><dt>${L('Pemilik','Owner')}</dt><dd>${esc(w.owner)}</dd><dt>${L('Dibuat','Created')}</dt><dd>${esc(fmtDate(d.date||today()))}</dd><dt>SHA-256</dt><dd style="font-family:ui-monospace,Consolas,monospace;font-size:12px;word-break:break-all">${fp?fp.slice(0,32)+'…':'…'}</dd><dt>Status</dt><dd>${d.id?`<span class="tag ok">${ico('check',12)} ${L('Tersimpan','Saved')}</span>`:`<span class="tag">${L('Simpan desain untuk mendaftarkan','Save the design to register it')}</span>`}</dd></dl>`
        : `<span class="hint">${L('Aktifkan untuk menerbitkan sertifikat digital kepemilikan.','Turn on to issue a digital ownership certificate.')}</span>`;
    };
    const draw=()=>{
      $('#canvas').innerHTML=batikSVG(d,{size:640,natural:true,extra:wmOverlay});
      $('#op-v').textContent=Math.round(w.opacity*100)+'%'; $('#sz-v').textContent=w.size.toFixed(1)+'×';
      certBox();
    };
    draw();
    fingerprint(d).then(h=>{ fp=h; if(route==='watermark') certBox(); });
    $('#wm-text').addEventListener('input',e=>{ w.text=e.target.value; draw(); });
    $$('#wm-pos button').forEach(b=>b.addEventListener('click',()=>{ w.pos=b.dataset.v; $$('#wm-pos button').forEach(x=>x.classList.toggle('on',x===b)); draw(); }));
    $$('#wm-col button').forEach(b=>b.addEventListener('click',()=>{ w.color=b.dataset.v; $$('#wm-col button').forEach(x=>x.classList.toggle('on',x===b)); draw(); }));
    $('#wm-op').addEventListener('input',e=>{ w.opacity=+e.target.value; draw(); });
    $('#wm-sz').addEventListener('input',e=>{ w.size=+e.target.value; draw(); });
    $('#wm-inv').addEventListener('change',async e=>{ w.invisible=e.target.checked; d.protected=w.invisible; draw();
      if(d.id) await saveDesign(d,true);
      if(w.invisible) toast(L('Sidik jari desain didaftarkan','Design fingerprint registered')); });
    $('#dl-wm').addEventListener('click',()=>exportPNG(batikSVG(d,{size:640,natural:true,extra:wmOverlay}),(dn(d)||'design')+'-preview.png',1000,arOf(d)));
    $('#dl-hd').addEventListener('click',()=>exportPNG(batikSVG(d,{size:640,natural:true}),(dn(d)||'design')+'-HD.png',2048,arOf(d)));
    $('#sim').addEventListener('click',()=>{
      const copy=structuredClone(d); copy.rotation=(d.rotation||0)+6; copy.scale=+(d.scale*1.06).toFixed(2); copy.seed=(d.seed||1)+5;
      if(copy.image) copy.adjust={hue:(d.adjust?.hue||0)+12, sat:1.12, bright:1.05};
      else copy.colors={...d.colors, primary:shade(d.colors.primary,.12), bg:shade(d.colors.bg,.08)};
      const box=$('#detect'); box.classList.add('show');
      box.innerHTML=`<div class="row"><h3 style="font-size:19px;display:flex;gap:8px;align-items:center">${ico('scan',20)} ${L('Hasil pemindaian','Scan result')}</h3><div class="sp"></div><span class="tag">${L('Simulasi','Simulation')}</span></div>
        <p class="hint" style="margin-top:4px">${L('Gambar unggahan dari akun “@toko_motif_murah” dibandingkan dengan desain terdaftar.','An image posted by “@toko_motif_murah” compared against the registered design.')}</p>
        <div class="pair"><div><div class="svgbox">${batikSVG(d,{size:260})}</div><p class="hint" style="margin-top:6px;text-align:center">${L('Desain asli','Original design')}</p></div>
          <div class="vs">≈</div>
          <div><div class="svgbox">${batikSVG(copy,{size:260})}</div><p class="hint" style="margin-top:6px;text-align:center">${L('Gambar unggahan','Posted image')}</p></div></div>
        <div class="row"><b>${L('Kemiripan','Similarity')}</b><div class="sp"></div><b id="sim-v" style="color:var(--warn)">0%</b></div>
        <div class="meter"><i id="sim-m"></i></div>
        <div class="note" style="margin-top:12px">${ico('shield',22)}<div><b>${L('Terdeteksi mirip dengan desain terdaftar','Detected as similar to a registered design')}</b><p>${L('Pada versi berikutnya, kemiripan dihitung dengan hash perseptual dan dicocokkan dengan registri desain.','In the next version, similarity is computed with a perceptual hash and matched against the design registry.')}</p></div></div>`;
      const target=w.invisible?94:63;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{ $('#sim-m').style.width=target+'%'; }));
      let n=0; const iv=setInterval(()=>{ n+=3; if(n>=target){n=target;clearInterval(iv);} const el=$('#sim-v'); if(el) el.textContent=n+'%'; },24);
      box.scrollIntoView({behavior:'smooth',block:'nearest'});
    });
  }
};

/* ---------- mockup ---------- */
const BGS=['#F3E9D2','#E4ECF5','#F4DFDA','#E1EBDD','#ECE6F2','#2A2F45'];
function makeCaption(d,kind){
  const t=tplById(d.template_id), pr=PRODUCTS[kind];
  const first = t && t.meaning ? tr(t.meaning).split('.')[0] + '.' : '';
  const motif = t ? t.name : 'batik';
  const tag = STYLES[d.template_id]?.tag || 'batiktulis';
  return lang==='id'
    ? `✨ ${dn(d)} ✨\n\n${tr(pr.label)} dengan motif ${motif}${t&&t.origin?` dari ${tr(t.origin)}`:''}. ${first}\n\n📍 ${UMKM}\n🛒 Pesan via DM / WhatsApp\n\n#batik #batikindonesia #umkmbatik #${tag}`
    : `✨ ${dn(d)} ✨\n\n${tr(pr.label)} with the ${motif} motif${t&&t.origin?` from ${tr(t.origin)}`:''}. ${first}\n\n📍 ${UMKM}\n🛒 Order via DM / WhatsApp\n\n#batik #indonesianbatik #umkm #${tag}`;
}
pages.mockup = {
  html(){
    const d=state.current, m=state.mock;
    return `
    <div class="ph"><div><h1>${L('Mockup Produk','Product Mockup')}</h1><p>${L('Lihat','See')} “${esc(dn(d))}” ${L('di atas produk sebelum diproduksi.','on products before production.')}</p></div><div class="sp"></div>
      <a class="btn ghost" href="#/watermark">${ico('shield')} Watermark</a>
      <button class="btn ghost" id="save">${ico('save')} ${L('Simpan desain','Save design')}</button></div>
    <div class="card mk-ctrl">
      <div><label class="lbl">${L('Desain','Design')}</label><select id="pick">${state.designs.map(x=>`<option value="${esc(x.id)}" ${x.id===d.id?'selected':''}>${esc(dn(x))}</option>`).join('')}${state.designs.some(x=>x.id===d.id)?'':`<option value="" selected>${esc(dn(d))} ${L('(belum disimpan)','(unsaved)')}</option>`}</select></div>
      <div><label class="lbl">${L('Latar etalase','Showcase background')}</label><div class="swatches">${BGS.map(c=>`<button data-bg="${c}" class="${m.bg===c?'on':''}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div></div>
      <div><label class="lbl">${L('Skala motif pada produk','Motif scale on product')}</label><input type="range" id="msc" min=".3" max="2" step=".1" value="${m.scale}"></div>
    </div>
    <div class="mk-grid stagger" id="grid"></div>
    <div class="card cap">
      <div><div class="row wrap" style="margin-bottom:10px"><h3 style="font-size:20px">Caption</h3><div class="sp"></div>
        <div class="seg" id="ck" style="min-width:230px">${Object.keys(PRODUCTS).map((k,i)=>`<button data-k="${k}" class="${i===0?'on':''}">${tr(PRODUCTS[k].short)}</button>`).join('')}</div></div>
        <textarea id="cap-t" spellcheck="false"></textarea>
        <div class="row wrap" style="margin-top:12px"><button class="btn primary sm" id="cap-gen">${ico('sparkle',15)} ${L('Tulis dengan AI','Write with AI')}</button><button class="btn ghost sm" id="cap-cp">${ico('copy',15)} ${L('Salin','Copy')}</button>
          <button class="btn ghost sm" id="mk-dl">${ico('download',15)} ${L('Unduh gambar','Download image')}</button></div></div>
      <div class="phone"><div class="ph-top"><i></i>${esc(UMKM.toLowerCase().replace(/ /g,'_'))}</div><div class="svgbox" id="ph-img"></div><p id="ph-cap"></p></div>
    </div>`;
  },
  bind(){
    const d=state.current, m=state.mock; let kind='kaos';
    const drawGrid=()=>{
      $('#grid').innerHTML=Object.entries(PRODUCTS).map(([k,p])=>`<div class="card pcard"><div class="stage-bg" style="background:${m.bg}">${productSVG(k,d,m.bg,m.scale)}</div><div class="inf"><b>${tr(p.label)}</b><small>${esc(dn(d))}</small></div></div>`).join('');
      $('#ph-img').innerHTML=`<div style="background:${m.bg};aspect-ratio:1">${productSVG(kind,d,m.bg,m.scale)}</div>`;
    };
    const cap=()=>{ const t=makeCaption(d,kind); $('#cap-t').value=t; $('#ph-cap').textContent=t; };
    drawGrid(); cap();
    $('#pick').addEventListener('change',e=>{ const x=state.designs.find(y=>y.id===e.target.value); if(x){ state.current=structuredClone(x); go(); } });
    $$('[data-bg]').forEach(b=>b.addEventListener('click',()=>{ m.bg=b.dataset.bg; $$('[data-bg]').forEach(x=>x.classList.toggle('on',x===b)); drawGrid(); }));
    $('#msc').addEventListener('input',e=>{ m.scale=+e.target.value; drawGrid(); });
    $$('#ck button').forEach(b=>b.addEventListener('click',()=>{ kind=b.dataset.k; $$('#ck button').forEach(x=>x.classList.toggle('on',x===b)); drawGrid(); cap(); }));
    $('#cap-t').addEventListener('input',e=>{ $('#ph-cap').textContent=e.target.value; });
    $('#cap-gen').addEventListener('click',async()=>{
      const b=$('#cap-gen'); b.disabled=true; b.innerHTML=ico('sparkle',15)+' '+L('Menulis…','Writing…');
      try{ const t=tplById(d.template_id||d.style);
        const r=await api('/api/caption',{name:dn(d), motif:t?t.name:'batik', origin:t&&t.origin?tr(t.origin):'', meaning:t&&t.meaning?tr(t.meaning):'', product:tr(PRODUCTS[kind].label), brand:UMKM, lang});
        $('#cap-t').value=r.text; $('#ph-cap').textContent=r.text; toast(L('Caption ditulis oleh AI','Caption written by AI')); }
      catch(e){ toast(e.message,true); }
      finally{ b.disabled=false; b.innerHTML=ico('sparkle',15)+' '+L('Tulis dengan AI','Write with AI'); }
    });
    $('#cap-cp').addEventListener('click',()=>{ const t=$('#cap-t').value; (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast(L('Caption disalin','Caption copied')),()=>{ $('#cap-t').select(); toast(L('Tekan Ctrl+C untuk menyalin','Press Ctrl+C to copy')); }); });
    $('#mk-dl').addEventListener('click',()=>exportPNG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="${m.bg}"/>${productSVG(kind,d,m.bg,m.scale).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg>`,`${dn(d)}-${kind}.png`,1200));
    $('#save').addEventListener('click',()=>saveDesign(d));
  }
};

/* ---------- gallery ---------- */
pages.gallery = {
  filter:'all',
  html(){
    const f=this.filter, list=state.designs.filter(d=>f==='all'||(f==='prot'?d.protected:!d.protected));
    return `
    <div class="ph"><div><h1>${L('Koleksi','Collection')}</h1><p>${state.designs.length} ${L('desain tersimpan. Klik desain untuk membuka di editor.','designs saved. Click a design to open it in the editor.')}</p></div><div class="sp"></div>
      <div class="chips">${[['all',L('Semua','All')],['prot',L('Dilindungi','Protected')],['draft',L('Belum dilindungi','Unprotected')]].map(([k,l])=>`<button class="chip ${f===k?'on':''}" data-f="${k}">${l}</button>`).join('')}</div>
      <a class="btn primary" href="#/studio">${ico('sparkle')} ${L('Desain baru','New design')}</a></div>
    ${list.length ? `<div class="gal stagger">${list.map(d=>designCard(d).replace('</div>\n  <b>',`</div><button class="del" data-del="${esc(d.id)}" aria-label="${L('Hapus','Delete')}">${ico('trash',16)}</button>\n  <b>`)).join('')}</div>`
      : `<div class="empty-sm">${state.designs.length ? L('Belum ada desain di filter ini.','No designs in this filter yet.') : L('Koleksi masih kosong. Simpan hasil dari Studio atau Editor.','The collection is empty. Save results from the Studio or Editor.')}</div>`}`;
  },
  bind(){
    bindOpen();
    $$('[data-f]').forEach(b=>b.addEventListener('click',()=>{ pages.gallery.filter=b.dataset.f; go(); }));
    $$('[data-del]').forEach(b=>b.addEventListener('click',async e=>{ e.stopPropagation();
      const d=state.designs.find(x=>x.id===b.dataset.del);
      if(!await confirmModal(L(`Hapus “${dn(d)}” dari koleksi?`,`Delete “${dn(d)}” from the collection?`))) return;
      try{ await deleteDesign(d.id); toast(L('Desain dihapus','Design deleted')); go(); }catch(err){ toast(err.message,true); } }));
  }
};

/* =====================================================================
   ROUTER
   ===================================================================== */
let route = (location.hash.match(/^#\/(\w*)/)||[])[1] || '';
function go(){
  if(!pages[route]) route='';
  const page = pages[route];
  $('#app').innerHTML = page.public ? page.html() : shell(route, page.html());
  // the entrance animation only plays when arriving on a page, not on every re-render
  if(go._last===route) $('.content')?.classList.add('still');
  go._last = route;
  page.bind && page.bind();
  let asked=true; try{ asked=!!localStorage.getItem('canting-key-asked'); }catch(e){}
  if(!page.public && !asked && aiMode()==='mock' && !$('.modal-bg')) keyModal({onSaved:()=>refreshStatus().then(go)});
}
function nav(r){
  route = r;
  try{ if(location.hash!=='#/'+r) location.hash = '#/'+r; }catch(e){}
  go(); window.scrollTo(0,0);
}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-keybtn]')){ keyModal({onSaved:()=>refreshStatus().then(go)}); return; }
  const lb=e.target.closest('[data-lang]');
  if(lb){
    lang=lb.dataset.lang; document.documentElement.lang=lang;
    try{ localStorage.setItem('canting-lang',lang); }catch(err){}
    const y=window.scrollY; go(); window.scrollTo(0,y);
    return;
  }
  const a=e.target.closest('a[href^="#/"]'); if(!a) return;
  e.preventDefault(); nav(a.getAttribute('href').slice(2));
});
window.addEventListener('hashchange',()=>{
  const m=location.hash.match(/^#\/(\w*)/);
  if(m && m[1]!==route){ route=m[1]; go(); window.scrollTo(0,0); }
});
loadAll().then(go);
