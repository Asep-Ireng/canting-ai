/* =====================================================================
   Canting AI: shared core (helpers, rendering, API, drawing pad, modals)
   i18n: L(idText, enText) picks by the current language.
   ===================================================================== */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let uid = 0;

/* ---------- language ---------- */
let lang = 'id';
try{
  const saved = localStorage.getItem('canting-lang');
  lang = saved==='id'||saved==='en' ? saved : ((navigator.language||'id').toLowerCase().startsWith('id') ? 'id' : 'en');
}catch(e){ lang = (navigator.language||'id').toLowerCase().startsWith('id') ? 'id' : 'en'; }
document.documentElement.lang = lang;
const L = (id,en) => lang==='id' ? id : en;
const tr = o => (o && typeof o==='object') ? (o[lang] ?? o.id ?? o.en) : o;
const MONTHS = {id:['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'], en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']};
const today = () => new Date().toISOString().slice(0,10);
const fmtDate = iso => { if(!iso) return ''; const [y,m,d]=iso.split('-').map(Number); return `${d} ${MONTHS[lang][m-1]} ${y}`; };
const langSwitch = () => `<div class="lang" role="group" aria-label="Language"><button data-lang="id" class="${lang==='id'?'on':''}">ID</button><button data-lang="en" class="${lang==='en'?'on':''}">EN</button></div>`;

/* ---------- icons ---------- */
const IC = {
  layout:'<rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/>',
  sparkle:'<path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z"/><path d="M19 15l.7 2.1 2.1.7-2.1.7L19 21l-.7-2.1-2.1-.7 2.1-.7z"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  shirt:'<path d="M8 3L3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7"/>',
  download:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  upload:'<path d="M12 20V9M7 13l5-5 5 5M5 4h14"/>',
  save:'<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  wand:'<path d="M4 20L16 8"/><path d="M15 3l1.1 2.4L18.5 6.5l-2.4 1.1L15 10l-1.1-2.4L11.5 6.5l2.4-1.1z"/>',
  brush:'<path d="M18.4 2.6a2 2 0 0 1 2.9 2.9L12 14.8 9.2 12z"/><path d="M8.5 13.5c-2 0-3.5 1.5-3.5 3.5 0 1.5-1 2.5-2 3 3 1 7 0 7.9-3.2z"/>',
  marker:'<path d="M15 4l5 5-9 9H6v-5z"/><path d="M4 21h16"/>',
  eraser:'<path d="M7 21h10"/><path d="M5.5 14.5l7-7 6 6-5 5H9z"/>',
  undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  share:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 11l7.6-4M8.2 13l7.6 4"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  palette:'<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-1.8 0-1.2-1-1.5-1-2.7 0-1 .8-1.5 1.8-1.5H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/>',
  scan:'<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M7 12h10"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>',
  cpu:'<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
};
const ico = (n, s=18) => `<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||''}</svg>`;

/* ---------- palettes & built-in motif metadata (procedural SVG fallback) ---------- */
const PALETTES = {
  soga:   {label:{id:'Soga Klasik',en:'Classic Soga'},     c:{bg:'#EBD9B4', dark:'#3A2216', primary:'#7A4426', secondary:'#C08A4F', accent:'#F6EBD0'}},
  indigo: {label:{id:'Indigo Wastra',en:'Indigo Cloth'},   c:{bg:'#16294A', dark:'#08122B', primary:'#3C6BB0', secondary:'#9BBDE6', accent:'#F4EEDC'}},
  pesisir:{label:{id:'Pesisir Lasem',en:'Lasem Coast'},    c:{bg:'#F3E6CF', dark:'#4A0F14', primary:'#B3262B', secondary:'#1F7A7A', accent:'#E0A63A'}},
  hijau:  {label:{id:'Hijau Rimba',en:'Forest Green'},     c:{bg:'#EFE8CF', dark:'#16301F', primary:'#3E7A52', secondary:'#B89A3E', accent:'#8A4B2A'}},
  modern: {label:{id:'Pastel Modern',en:'Modern Pastel'},  c:{bg:'#FBEFEA', dark:'#4F3F5F', primary:'#E39AA3', secondary:'#9FB8D9', accent:'#F4D58D'}},
  mono:   {label:{id:'Monokrom',en:'Monochrome'},          c:{bg:'#F4F1EA', dark:'#111111', primary:'#2B2B2B', secondary:'#8D8D8D', accent:'#D6D1C6'}}
};
const STYLES = {
  kawung:{label:'Kawung', rot:0, tag:'batikkawung'},
  parang:{label:'Parang', rot:-35, tag:'batikparang'},
  mendung:{label:'Mega Mendung', rot:0, tag:'megamendung'},
  truntum:{label:'Truntum', rot:0, tag:'batiktruntum'},
  sekar:{label:'Sekar Jagad', rot:0, tag:'sekarjagad'},
  ceplok:{label:'Ceplok', rot:0, tag:'batikceplok'}
};

/* ---------- procedural batik tiles ---------- */
const petal = (x,y,rx,ry,rot,fill,c,sw=1.1) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="${fill}" stroke="${c.dark}" stroke-width="${sw}"/>`;
const flower5 = (x,y,r,fill,ctr,c) => {
  let s='';
  for(let k=0;k<5;k++){
    const a=(-90+k*72)*Math.PI/180;
    s+=`<circle cx="${(x+Math.cos(a)*r*.55).toFixed(1)}" cy="${(y+Math.sin(a)*r*.55).toFixed(1)}" r="${(r*.45).toFixed(1)}" fill="${fill}" stroke="${c.dark}" stroke-width="1"/>`;
  }
  return s+`<circle cx="${x}" cy="${y}" r="${(r*.27).toFixed(1)}" fill="${ctr}" stroke="${c.dark}" stroke-width="1"/>`;
};
const leaf = (x,y,rot,len,fill,c) => petal(x,y,len,len*.36,rot,fill,c,1);
const star = (x,y,r,fill,ctr,c) =>
  [0,45,90,135].map(a=>`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${(r*.24).toFixed(1)}" transform="rotate(${a} ${x} ${y})" fill="${fill}"/>`).join('')
  + `<circle cx="${x}" cy="${y}" r="${(r*.24).toFixed(1)}" fill="${ctr}"/>`;

const PATTERNS = {
  kawung: c => {
    const f=(x,y,fill)=>[[0,-12,0],[0,12,0],[-12,0,90],[12,0,90]].map(([dx,dy,r])=>petal(x+dx,y+dy,7,12,r,fill,c)).join('')
      +`<circle cx="${x}" cy="${y}" r="3.4" fill="${c.accent}" stroke="${c.dark}" stroke-width="1"/>`;
    return {w:100,h:100,body:
      f(25,25,c.primary)+f(75,25,c.secondary)+f(25,75,c.secondary)+f(75,75,c.primary)+
      `<path d="M50 40l8 10-8 10-8-10z" fill="${c.accent}" stroke="${c.dark}" stroke-width="1"/>`+
      `<circle cx="50" cy="8" r="2" fill="${c.accent}"/><circle cx="50" cy="92" r="2" fill="${c.accent}"/><circle cx="8" cy="50" r="2" fill="${c.accent}"/><circle cx="92" cy="50" r="2" fill="${c.accent}"/>`};
  },
  parang: c => {
    const w='M-40 20C-27 40 -13 40 0 20C13 0 27 0 40 20C53 40 67 40 80 20C93 0 107 0 120 20';
    return {w:80,h:40,body:
      `<path d="${w}" fill="none" stroke="${c.primary}" stroke-width="10"/>`+
      `<path d="${w}" fill="none" stroke="${c.dark}" stroke-width="1.2" transform="translate(0,-6)"/>`+
      `<path d="${w}" fill="none" stroke="${c.dark}" stroke-width="1.2" transform="translate(0,6)"/>`+
      `<path d="${w}" fill="none" stroke="${c.accent}" stroke-width="2.4" stroke-dasharray="1 5" stroke-linecap="round"/>`+
      `<circle cx="20" cy="34" r="3.2" fill="${c.secondary}" stroke="${c.dark}" stroke-width="1"/>`+
      `<circle cx="60" cy="6" r="3.2" fill="${c.secondary}" stroke="${c.dark}" stroke-width="1"/>`};
  },
  mendung: c => {
    const cl=(x,y)=>[[40,c.dark],[36,c.primary],[29,c.secondary],[22,c.primary],[15,c.secondary],[8,c.accent]]
      .map(([r,f])=>`<path d="M${x-r} ${y}A${r} ${r} 0 0 1 ${x+r} ${y}Z" fill="${f}" stroke="${c.dark}" stroke-width="1"/>`).join('');
    return {w:120,h:80,body:cl(60,40)+cl(0,80)+cl(120,80)+
      `<circle cx="0" cy="38" r="2.2" fill="${c.secondary}"/><circle cx="120" cy="38" r="2.2" fill="${c.secondary}"/><circle cx="60" cy="78" r="2.2" fill="${c.secondary}"/>`};
  },
  truntum: c => ({w:60,h:60,body:
    star(15,15,10,c.primary,c.accent,c)+star(45,45,10,c.primary,c.accent,c)+
    star(45,15,5.5,c.secondary,c.bg,c)+star(15,45,5.5,c.secondary,c.bg,c)+
    [[30,30],[0,30],[60,30],[30,0],[30,60]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.8" fill="${c.accent}"/>`).join('')}),
  sekar: c => ({w:120,h:120,body:
    leaf(60,18,-25,14,c.secondary,c)+leaf(84,52,30,12,c.secondary,c)+leaf(58,64,40,13,c.dark,c)+leaf(62,104,-20,12,c.secondary,c)+leaf(14,100,60,10,c.dark,c)+
    flower5(30,32,20,c.primary,c.accent,c)+flower5(90,24,13,c.accent,c.primary,c)+
    flower5(88,86,18,c.primary,c.accent,c)+flower5(34,92,14,c.secondary,c.accent,c)+flower5(10,64,9,c.accent,c.primary,c)+
    [[62,38],[104,56],[60,84],[8,12],[108,110]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.2" fill="${c.accent}" stroke="${c.dark}" stroke-width=".8"/>`).join('')}),
  ceplok: c => ({w:60,h:60,body:
    `<path d="M30 3L57 30 30 57 3 30Z" fill="${c.primary}" stroke="${c.dark}" stroke-width="1.4"/>`+
    `<path d="M30 12L48 30 30 48 12 30Z" fill="${c.secondary}" stroke="${c.dark}" stroke-width="1.2"/>`+
    `<circle cx="30" cy="30" r="6" fill="${c.accent}" stroke="${c.dark}" stroke-width="1.2"/>`+
    [[0,0],[60,0],[0,60],[60,60]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="8" fill="${c.accent}" stroke="${c.dark}" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="3" fill="${c.primary}"/>`).join('')})
};

const DEFAULT_ADJ = {hue:0, sat:1, bright:1};
/* Output formats (must match backend/prompts.py FORMATS). ar = width / height. */
const FORMATS = {
  tile:     {label:{id:'Ubin',en:'Tile'},             sub:{id:'1:1 · diulang',en:'1:1 · repeat'},       ar:1},
  kain:     {label:{id:'Kain panjang',en:'Long cloth'}, sub:{id:'16:9 · utuh',en:'16:9 · full piece'},   ar:16/9},
  selendang:{label:{id:'Selendang',en:'Shawl'},        sub:{id:'9:16 · utuh',en:'9:16 · full piece'},    ar:9/16},
  pinggiran:{label:{id:'Pinggiran',en:'Border'},       sub:{id:'21:9 · menyamping',en:'21:9 · sideways'}, ar:21/9}
};
const arOf = d => (d && d.w && d.h) ? d.w/d.h : 1;
const isTile = d => !d.format || d.format==='tile';
const fmtIcon = (ar, s=18) => { const w = ar>=1 ? s : s*ar, h = ar>=1 ? s/ar : s;
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true"><rect x="${(s-w)/2+.75}" y="${(s-h)/2+.75}" width="${w-1.5}" height="${h-1.5}" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`; };
const hasAdj = a => a && (a.hue!==0 || a.sat!==1 || a.bright!==1);

/* A design is either an AI image (d.image) or a procedural SVG motif (d.style + d.colors).
   tile = size in SVG units of one repeat of the image at scale 1. */
function batikDefs(d, id, mul=1, wobble=true, tile=200, ox=0, oy=0){
  const sc = (d.scale||1) * mul;
  if(d.image){
    const th = tile/arOf(d);
    const a = d.adjust||DEFAULT_ADJ;
    const f = hasAdj(a) ? `<filter id="f${id}" color-interpolation-filters="sRGB"><feColorMatrix type="hueRotate" values="${a.hue}"/><feColorMatrix type="saturate" values="${a.sat}"/><feComponentTransfer><feFuncR type="linear" slope="${a.bright}"/><feFuncG type="linear" slope="${a.bright}"/><feFuncB type="linear" slope="${a.bright}"/></feComponentTransfer></filter>` : '';
    return {
      filter: f ? `url(#f${id})` : null,
      defs: `<pattern id="p${id}" x="${ox}" y="${oy}" width="${tile}" height="${th}" patternUnits="userSpaceOnUse" patternTransform="rotate(${d.rotation||0}) scale(${sc})"><image href="${esc(d.image)}" width="${tile}" height="${th}" preserveAspectRatio="none"/></pattern>${f}`
    };
  }
  const P = PATTERNS[d.style||'kawung'](d.colors||PALETTES.indigo.c);
  const rot = ((STYLES[d.style]||{rot:0}).rot + (d.rotation||0));
  const f = `<filter id="f${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="${d.seed||3}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2"/></filter>`;
  return {
    filter: (wobble && d.wobble!==false) ? `url(#f${id})` : null,
    defs: `<pattern id="p${id}" width="${P.w}" height="${P.h}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot}) scale(${sc})"><rect width="${P.w}" height="${P.h}" fill="${(d.colors||PALETTES.indigo.c).bg}"/>${P.body}</pattern>${f}`
  };
}
/* Size + offset so a non-square full-piece image covers a square box (centred), like object-fit:cover. */
function coverTile(size, ar){ const t=size*Math.max(1,ar); return {tile:t, ox:(size-t)/2, oy:(size-t/ar)/2}; }
/* o.natural: draw at the design's own aspect ratio (editor, watermark, export) instead of a square crop. */
function batikSVG(d, o={}){
  const size=o.size||400, id=++uid, ar=d.image?arOf(d):1, nat=o.natural && ar!==1;
  const W=size, H=nat ? Math.round(size/ar) : size;
  let tile=o.tile||size, ox=0, oy=0;
  if(d.image && !isTile(d) && !nat && !o.tile) ({tile,ox,oy}=coverTile(size,ar));
  const B=batikDefs(d,id,o.mul||1,o.wobble!==false,tile,ox,oy);
  const flip = d.mirror ? `transform="translate(${W} 0) scale(-1 1)"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"${nat?` style="aspect-ratio:${W}/${H}"`:''}><defs>${B.defs}</defs>
  <g ${flip}><rect x="-20" y="-20" width="${W+40}" height="${H+40}" fill="url(#p${id})" ${B.filter?`filter="${B.filter}"`:''}/></g>${typeof o.extra==='function'?o.extra(W,H):(o.extra||'')}</svg>`;
}
/* The un-transformed design as the AI should see it (adjustments baked in). */
function rawSVG(d, size){
  return d.image ? batikSVG({...d, scale:1, rotation:0, mirror:false},{size, tile:size, natural:true}) : batikSVG(d,{size});
}

/* ---------- product mockups ---------- */
const PRODUCTS = {
  kaos:  {label:{id:'Kemeja Batik',en:'Batik Shirt'},  short:{id:'Kemeja',en:'Shirt'}, path:'M98 32L58 50 18 108l38 26 20-30v168h148V104l20 30 38-26-40-58-40-18C190 58 110 58 98 32Z', extra:'<path d="M98 32C110 58 190 58 202 32" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2"/>'},
  dress: {label:{id:'Dress Batik',en:'Batik Dress'},   short:{id:'Dress',en:'Dress'},   path:'M112 24h18c10 20 30 20 40 0h18l6 72 50 182c-48 12-140 12-188 0l50-182Z', extra:'<path d="M106 96h88" stroke="rgba(0,0,0,.3)" stroke-width="2"/>'},
  tote:  {label:{id:'Tote Bag',en:'Tote Bag'},         short:{id:'Tote',en:'Tote'},     path:'M62 108h176l12 170q0 6-6 6H56q-6 0-6-6Z', pre:'<path d="M104 110C104 36 196 36 196 110" fill="none" stroke="#3a2a1a" stroke-width="9" stroke-linecap="round"/>', extra:''},
  kain:  {label:{id:'Kain Panjang',en:'Long Cloth'},   short:{id:'Kain',en:'Cloth'},    path:'M36 40H264V252C220 266 180 242 150 256C120 270 80 246 36 260Z', extra:''}
};
function productSVG(kind, d, bg, mul){
  const P=PRODUCTS[kind], id=++uid;
  // repeat tiles are tiled small; full pieces (kain, selendang…) are stretched once over the product
  const c = d.image && !isTile(d) ? coverTile(300, arOf(d)) : null;
  const B = c ? batikDefs(d,id,mul,true,c.tile,c.ox,c.oy) : batikDefs(d,id,.42*mul,true,200);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs>${B.defs}
    <clipPath id="c${id}"><path d="${P.path}"/></clipPath>
    <linearGradient id="g${id}" x1="0" x2=".24" y1="0" y2="0" spreadMethod="repeat"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#000" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="h${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient></defs>
    <ellipse cx="150" cy="${kind==='kain'?286:292}" rx="100" ry="6" fill="#000" opacity=".12"/>
    <g class="cloth">${P.pre||''}
    <g clip-path="url(#c${id})">
      <rect x="-20" y="-20" width="340" height="340" fill="url(#p${id})" ${B.filter?`filter="${B.filter}"`:''}/>
      <rect width="300" height="300" fill="url(#g${id})"/><rect width="300" height="300" fill="url(#h${id})"/>
    </g>
    <path d="${P.path}" fill="none" stroke="rgba(0,0,0,.4)" stroke-width="2" stroke-linejoin="round"/>${P.extra}</g></svg>`;
}

/* ---------- API ---------- */
/* The visitor's own Gemini key: kept only in this browser, sent with each request, never stored on the server. */
const KEY_LS = 'canting-gemini-key';
const getKey = () => { try{ return localStorage.getItem(KEY_LS) || ''; }catch(e){ return ''; } };
const setKey = k => { try{ k ? localStorage.setItem(KEY_LS, k) : localStorage.removeItem(KEY_LS); }catch(e){} };
async function api(path, body, method, key=getKey()){
  const opt = {method: method || (body===undefined ? 'GET' : 'POST'), headers:{}};
  if(key) opt.headers['X-Gemini-Key'] = key;
  if(body!==undefined){ opt.headers['Content-Type']='application/json'; opt.body=JSON.stringify(body); }
  let res;
  try{ res = await fetch(path, opt); }
  catch(e){ throw new Error(L('Server tidak bisa dihubungi. Apakah backend sudah berjalan?','Cannot reach the server. Is the backend running?')); }
  const data = await res.json().catch(()=>({}));
  if(!res.ok){
    const d = data.detail;
    throw new Error(typeof d==='string' ? d : Array.isArray(d) ? d.map(x=>x.msg).join('; ') : `HTTP ${res.status}`);
  }
  return data;
}

/* ---------- browser storage: designs and custom templates stay on this device ---------- */
let _idb;
function idb(){
  return _idb ||= new Promise((res, rej)=>{
    const r = indexedDB.open('canting-ai', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('designs', {keyPath:'id'}); r.result.createObjectStore('templates', {keyPath:'id'}); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function idbDo(store, mode, fn){
  const db = await idb();
  return new Promise((res, rej)=>{ const tx=db.transaction(store, mode), q=fn(tx.objectStore(store)); tx.oncomplete=()=>res(q && q.result); tx.onerror=()=>rej(tx.error); });
}
const idbAll = store => idbDo(store, 'readonly', st=>st.getAll());
const idbPut = (store, obj) => idbDo(store, 'readwrite', st=>st.put(obj));
const idbDel = (store, id) => idbDo(store, 'readwrite', st=>st.delete(id));
const newId = p => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;

/* generation timings, kept per browser for the dashboard (the server keeps nothing) */
const LOG_LS = 'canting-genlog';
function logGen(ms, ok){ try{ const l=JSON.parse(localStorage.getItem(LOG_LS)||'[]'); l.push({ms, ok}); localStorage.setItem(LOG_LS, JSON.stringify(l.slice(-500))); }catch(e){} }
function localStats(){
  let l=[]; try{ l=JSON.parse(localStorage.getItem(LOG_LS)||'[]'); }catch(e){}
  const ok=l.filter(x=>x.ok);
  return {images: ok.length, failed: l.length-ok.length, avg_ms: ok.length ? Math.round(ok.reduce((a,x)=>a+x.ms,0)/ok.length) : 0};
}
/* 'own' = visitor's key, 'server' = key set on the server (local dev), 'mock' = no key, sample images */
const aiMode = () => getKey() ? 'own' : (state.status.server_key ? 'server' : 'mock');

/* ---------- state ---------- */
const UMKM = 'Batik Laras Ayu';
const state = {
  designs: [], templates: [], status: {mock:true, images:0, avg_ms:0},
  current: null,
  studio: {mode:'template', template_id:'kawung', format:'tile', prompt:'', pal:'auto', density:'medium', count:4, refs:[], sketch:null, sketchStrokes:null, status:'idle', results:[], used:''},
  wm: {text:UMKM, pos:'br', opacity:.6, size:1, color:'#ffffff', invisible:true, owner:UMKM},
  mock: {bg:'#F3E9D2', scale:1}
};
const tplById = id => state.templates.find(t=>t.id===id);
const dn = d => tr(d.name) || L('Tanpa nama','Untitled');
function sampleDesign(){
  return {id:null, name:{id:'Kawung Indigo (contoh)',en:'Indigo Kawung (sample)'}, style:'kawung', template_id:'kawung', pal:'indigo', colors:{...PALETTES.indigo.c}, scale:1, rotation:0, mirror:false, wobble:true, seed:7, adjust:{...DEFAULT_ADJ}, protected:false, date:today()};
}
async function refreshStatus(){ try{ state.status = {...await api('/api/status'), ...localStats()}; }catch(e){ Object.assign(state.status, localStats()); } }
/* ---------- image model picker (choices come from the backend's IMAGE_MODELS) ---------- */
const imageModels = () => state.status.image_models || [];
const modelLabel = id => (imageModels().find(m=>m.id===id) || {}).label || id || '';
const modelSizes = id => (imageModels().find(m=>m.id===id) || {}).sizes || ['1K'];
/* keep the chosen resolution valid for the chosen model (sizes are listed small to large) */
function clampSize(){ const ok=modelSizes(state.aiModel); if(!ok.includes(state.aiSize)) state.aiSize=ok.at(-1); }
const sizePicker = () => `<div class="seg" id="size-seg">${['1K','2K','4K'].map(z=>{ const ok=modelSizes(state.aiModel).includes(z);
  return `<button data-size="${z}" class="${state.aiSize===z?'on':''}" ${ok?'':`disabled title="${esc(L('Tidak didukung model ini','Not supported by this model'))}"`}>${z}</button>`; }).join('')}</div>`;
function bindSizePicker(){
  $$('#size-seg [data-size]').forEach(b=>b.addEventListener('click',()=>{
    state.aiSize=b.dataset.size; try{ localStorage.setItem('canting-size',state.aiSize); }catch(e){}
    $$('#size-seg [data-size]').forEach(x=>x.classList.toggle('on',x===b));
  }));
}
function initModel(){
  let saved=null; try{ saved=localStorage.getItem('canting-model'); }catch(e){}
  const ids=imageModels().map(m=>m.id);
  state.aiModel = ids.includes(saved) ? saved : ids.includes(state.status.image_model) ? state.status.image_model : (ids[0] || null);
  try{ state.aiSize=localStorage.getItem('canting-size') || '1K'; }catch(e){ state.aiSize='1K'; }
  clampSize();
}
const modelSelect = () => imageModels().length ? `<select class="model-pick" aria-label="${L('Model AI','AI model')}">${imageModels().map(m=>`<option value="${esc(m.id)}" ${m.id===state.aiModel?'selected':''}>${esc(m.label)}</option>`).join('')}</select>` : '';
function bindModelSelect(root=document){
  $$('.model-pick',root).forEach(s=>s.addEventListener('change',()=>{
    state.aiModel=s.value; try{ localStorage.setItem('canting-model',s.value); }catch(e){}
    $$('.model-pick').forEach(o=>{ o.value=s.value; });
    const side=$('#side-model'); if(side) side.textContent=modelLabel(s.value);
    clampSize(); const seg=$('#size-seg'); if(seg){ seg.outerHTML=sizePicker(); bindSizePicker(); }
    toast(L('Model AI: ','AI model: ')+modelLabel(s.value));
  }));
}
async function loadAll(){
  const [st, tp, mine, ds] = await Promise.allSettled([api('/api/status'), api('/api/templates'), idbAll('templates'), idbAll('designs')]);
  if(st.status==='fulfilled') state.status={...st.value, ...localStats()};
  const builtin = tp.status==='fulfilled' ? tp.value : [];
  const own = mine.status==='fulfilled' ? mine.value.sort((a,b)=>(a.created||0)-(b.created||0)) : [];
  state.templates = [...builtin, ...own];
  if(ds.status==='fulfilled') state.designs = ds.value.sort((a,b)=>(b.updated||0)-(a.updated||0));
  if(st.status==='rejected') toast(st.reason.message, true);
  initModel();
  state.current = state.designs[0] ? structuredClone(state.designs[0]) : sampleDesign();
}

/* ---------- toast ---------- */
const bloomIcon = `<svg class="bloom" viewBox="0 0 20 20"><ellipse cx="10" cy="5" rx="2.4" ry="4" fill="#B8862F"/><ellipse cx="15" cy="10" rx="4" ry="2.4" fill="#B8862F"/><ellipse cx="10" cy="15" rx="2.4" ry="4" fill="#B8862F"/><ellipse cx="5" cy="10" rx="4" ry="2.4" fill="#B8862F"/></svg>`;
function toast(msg, err=false){
  const t=$('#toast'); t.innerHTML = (err ? ico('info',18) : bloomIcon) + `<span>${esc(msg)}</span>`;
  t.classList.toggle('err', !!err); t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'), err?5200:2800);
}

/* ---------- designs ---------- */
async function saveDesign(d, quiet=false){
  const copy = structuredClone(d); copy.date = copy.date || today();
  try{
    copy.id = copy.id || newId('dsn'); copy.updated = Date.now();
    await idbPut('designs', copy);
    const saved = copy;
    d.id = saved.id;
    const i = state.designs.findIndex(x=>x.id===saved.id);
    if(i>=0) state.designs[i]=saved; else state.designs.unshift(saved);
    if(!quiet) toast(L('Tersimpan di Koleksi: ','Saved to Collection: ') + dn(saved));
    return saved;
  }catch(e){ toast(e.message, true); }
}
async function deleteDesign(id){
  await idbDel('designs', id);
  state.designs = state.designs.filter(x=>x.id!==id);
}
function openEditor(d){ state.current = structuredClone(d); nav('editor'); }

/* ---------- image helpers ---------- */
const dataCache = {};
async function urlToDataURL(url){
  if(url.startsWith('data:')) return url;
  if(dataCache[url]) return dataCache[url];
  const b = await (await fetch(url)).blob();
  return dataCache[url] = await new Promise(r=>{ const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(b); });
}
/* SVG -> canvas. Image hrefs must be inlined first: an SVG drawn into a canvas can't load external files. */
async function svgToCanvas(svgStr, px, py=px){
  const urls = [...new Set([...svgStr.matchAll(/href="(\/images\/[^"]+)"/g)].map(m=>m[1]))];
  for(const u of urls){ svgStr = svgStr.split(`href="${u}"`).join(`href="${await urlToDataURL(u)}"`); }
  const s = svgStr.replace('<svg ', `<svg width="${px}" height="${py}" `);
  const url = URL.createObjectURL(new Blob([s],{type:'image/svg+xml;charset=utf-8'}));
  try{
    const img = await new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
    const cv=document.createElement('canvas'); cv.width=px; cv.height=py;
    cv.getContext('2d').drawImage(img,0,0,px,py);
    return cv;
  } finally { URL.revokeObjectURL(url); }
}
async function exportPNG(svgStr, name, px=1400, ar=1){
  try{
    const cv = await svgToCanvas(svgStr, px, Math.round(px/ar));
    cv.toBlob(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=name; a.click(); toast(L('Mengunduh ','Downloading ')+name); });
  }catch(e){ toast(L('Gagal mengekspor PNG di browser ini','Could not export PNG in this browser'), true); }
}
/* read a user-picked file, downscaled to max 1024px to keep requests small */
function fileToDataURL(file, max=1024){
  return new Promise((res,rej)=>{
    if(!file.type.startsWith('image/')) return rej(new Error(L('File harus berupa gambar.','The file must be an image.')));
    const fr=new FileReader();
    fr.onload=()=>{ const img=new Image(); img.onload=()=>{
      const k=Math.min(1, max/Math.max(img.width,img.height));
      const cv=document.createElement('canvas'); cv.width=Math.round(img.width*k); cv.height=Math.round(img.height*k);
      cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
      res(cv.toDataURL('image/jpeg',.9));
    }; img.onerror=rej; img.src=fr.result; };
    fr.onerror=rej; fr.readAsDataURL(file);
  });
}
/* Re-encode an image (data URL) to at most maxPx on its long side, as JPEG, to keep requests small. */
function shrinkDataURL(src, maxPx=1536, quality=.9){
  return new Promise((res, rej)=>{ const img=new Image(); img.onload=()=>{
    const k=Math.min(1, maxPx/Math.max(img.width, img.height));
    const cv=document.createElement('canvas'); cv.width=Math.round(img.width*k); cv.height=Math.round(img.height*k);
    const c=cv.getContext('2d'); c.fillStyle='#fff'; c.fillRect(0,0,cv.width,cv.height); c.drawImage(img,0,0,cv.width,cv.height);
    res(cv.toDataURL('image/jpeg', quality)); }; img.onerror=rej; img.src=src; });
}
async function sha256Hex(data){
  const buf = typeof data==='string' ? new TextEncoder().encode(data) : data;
  const h = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function fingerprint(d){
  if(d.image){ try{ return await sha256Hex(await (await fetch(d.image)).arrayBuffer()); }catch(e){} }
  return sha256Hex(JSON.stringify([d.style,d.colors,d.seed,d.scale,d.rotation]));
}

/* ---------- modal ---------- */
function openModal(title, body, {wide=false}={}){
  const bg=document.createElement('div'); bg.className='modal-bg';
  bg.innerHTML=`<div class="modal" role="dialog" aria-modal="true" style="${wide?'max-width:min(860px,100%)':''}"><div class="tumpal"></div>
    <div class="mh"><h3>${title}</h3><div class="sp"></div><button class="x" aria-label="${L('Tutup','Close')}">×</button></div><div class="mb">${body}</div></div>`;
  document.body.appendChild(bg);
  const close=()=>{ bg.remove(); document.removeEventListener('keydown',onKey); };
  const onKey=e=>{ if(e.key==='Escape' && bg===[...document.querySelectorAll('.modal-bg')].pop()) close(); };
  document.addEventListener('keydown',onKey);
  $('.x',bg).addEventListener('click',close);
  bg.addEventListener('mousedown',e=>{ if(e.target===bg) close(); });
  return {root:bg, close};
}

/* In-app "are you sure?" dialog. window.confirm() is silently blocked in some embedded browsers. */
function confirmModal(message, okLabel){
  return new Promise(resolve=>{
    const m=openModal(L('Yakin?','Are you sure?'), `<p style="margin-bottom:18px">${esc(message)}</p>
      <div class="row"><div class="sp"></div><button class="btn ghost" data-no>${L('Batal','Cancel')}</button><button class="btn danger" data-yes>${ico('trash')} ${esc(okLabel||L('Hapus','Delete'))}</button></div>`);
    let done=false; const finish=v=>{ if(done) return; done=true; m.close(); resolve(v); };
    $('[data-no]',m.root).addEventListener('click',()=>finish(false));
    $('[data-yes]',m.root).addEventListener('click',()=>finish(true));
    new MutationObserver((_,obs)=>{ if(!document.body.contains(m.root)){ obs.disconnect(); finish(false); } }).observe(document.body,{childList:true});
  });
}

/* ---------- drawing pad (sketches + marker annotations) ---------- */
class DrawPad{
  constructor(canvas, {color='#2A1D14', size=10, onchange=()=>{}}={}){
    Object.assign(this,{cv:canvas, ctx:canvas.getContext('2d'), strokes:[], cur:null, color, size, tool:'pen', onchange});
    canvas.addEventListener('pointerdown',e=>this.down(e));
    canvas.addEventListener('pointermove',e=>this.move(e));
    ['pointerup','pointercancel','pointerleave'].forEach(t=>canvas.addEventListener(t,()=>this.up()));
  }
  pos(e){ const r=this.cv.getBoundingClientRect(); return [(e.clientX-r.left)*this.cv.width/r.width, (e.clientY-r.top)*this.cv.height/r.height]; }
  down(e){
    e.preventDefault(); this.cv.setPointerCapture?.(e.pointerId);
    // brush size is relative to a 512px canvas so it looks the same at any resolution
    this.cur={tool:this.tool, color:this.color, w:this.size*this.cv.width/512, pts:[this.pos(e)]};
    this.strokes.push(this.cur); this.drawStroke(this.cur);
  }
  move(e){ if(!this.cur) return; this.cur.pts.push(this.pos(e)); this.drawStroke(this.cur, this.cur.pts.length-2); }
  up(){ if(this.cur){ this.cur=null; this.onchange(); } }
  drawStroke(s, from=0){
    const c=this.ctx, p=s.pts;
    c.globalCompositeOperation = s.tool==='eraser' ? 'destination-out' : 'source-over';
    c.strokeStyle=c.fillStyle=s.color; c.lineWidth=s.w; c.lineCap=c.lineJoin='round';
    if(p.length===1){ c.beginPath(); c.arc(p[0][0],p[0][1],s.w/2,0,Math.PI*2); c.fill(); return; }
    c.beginPath(); c.moveTo(...p[Math.max(0,from)]);
    for(let i=Math.max(1,from+1);i<p.length;i++) c.lineTo(...p[i]);
    c.stroke();
  }
  redraw(){ this.ctx.clearRect(0,0,this.cv.width,this.cv.height); this.strokes.forEach(s=>this.drawStroke(s)); this.ctx.globalCompositeOperation='source-over'; }
  undo(){ this.strokes.pop(); this.redraw(); this.onchange(); }
  clear(){ this.strokes=[]; this.redraw(); this.onchange(); }
  isEmpty(){ return !this.strokes.some(s=>s.tool!=='eraser'); }
  toDataURL(bg){
    if(!bg) return this.cv.toDataURL('image/png');
    const o=document.createElement('canvas'); o.width=this.cv.width; o.height=this.cv.height;
    const c=o.getContext('2d'); c.fillStyle=bg; c.fillRect(0,0,o.width,o.height); c.drawImage(this.cv,0,0);
    return o.toDataURL('image/png');
  }
}
const padTools = (colors) => `<div class="pad-tools">
  <div class="cols">${colors.map((c,i)=>`<button data-col="${c}" class="${i===0?'on':''}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>
  <button class="tb on" data-tool="pen">${ico('brush',15)} ${L('Kuas','Brush')}</button>
  <button class="tb" data-tool="eraser">${ico('eraser',15)} ${L('Hapus','Eraser')}</button>
  <input type="range" data-size min="2" max="40" value="10" aria-label="${L('Ukuran kuas','Brush size')}">
  <div class="sp"></div>
  <button class="tb" data-undo>${ico('undo',15)} Undo</button>
  <button class="tb" data-clear>${ico('trash',15)} ${L('Bersihkan','Clear')}</button></div>`;
function bindPadTools(root, pad){
  $$('[data-col]',root).forEach(b=>b.addEventListener('click',()=>{ pad.color=b.dataset.col; pad.tool='pen'; $$('[data-col]',root).forEach(x=>x.classList.toggle('on',x===b)); $$('[data-tool]',root).forEach(x=>x.classList.toggle('on',x.dataset.tool==='pen')); }));
  $$('[data-tool]',root).forEach(b=>b.addEventListener('click',()=>{ pad.tool=b.dataset.tool; $$('[data-tool]',root).forEach(x=>x.classList.toggle('on',x===b)); }));
  $('[data-size]',root).addEventListener('input',e=>{ pad.size=+e.target.value; });
  $('[data-size]',root).value=pad.size;
  $('[data-undo]',root).addEventListener('click',()=>pad.undo());
  $('[data-clear]',root).addEventListener('click',()=>pad.clear());
}
/* Sketch modal: resolves with {dataURL, strokes} or null if cancelled. */
function sketchModal(prevStrokes){
  return new Promise(resolve=>{
    const m=openModal(L('Gambar sketsa motif','Sketch your motif'), `
      <p class="hint" style="margin-bottom:10px">${L('Gambar bentuk kasarnya saja (bunga, awan, burung, susunan motif). AI akan menggambar ulang dalam gaya batik.','Just draw the rough shapes (a flower, cloud, bird, motif layout). The AI redraws it in batik style.')}</p>
      ${padTools(['#2A1D14','#7A4426','#1C2D54','#B3262B','#2E6B4F'])}
      <div class="pad-wrap"><canvas width="768" height="768"></canvas></div>
      <div class="row" style="margin-top:14px"><div class="sp"></div><button class="btn ghost" data-cancel>${L('Batal','Cancel')}</button><button class="btn primary" data-ok>${ico('check')} ${L('Pakai sketsa','Use sketch')}</button></div>`);
    const pad=new DrawPad($('canvas',m.root));
    if(prevStrokes){ pad.strokes=structuredClone(prevStrokes); pad.redraw(); }
    bindPadTools(m.root,pad);
    let done=false;
    const finish=v=>{ if(done) return; done=true; m.close(); resolve(v); };
    $('[data-cancel]',m.root).addEventListener('click',()=>finish(null));
    $('[data-ok]',m.root).addEventListener('click',()=>{
      if(pad.isEmpty()){ toast(L('Sketsanya masih kosong.','The sketch is empty.'), true); return; }
      finish({dataURL:pad.toDataURL('#ffffff'), strokes:structuredClone(pad.strokes)});
    });
    new MutationObserver((_,obs)=>{ if(!document.body.contains(m.root)){ obs.disconnect(); finish(null); } }).observe(document.body,{childList:true});
  });
}

/* ---------- templates ---------- */
function tplThumb(t, size=160){
  if(!t) return `<div class="svgbox">${batikSVG({style:'kawung',colors:PALETTES.soga.c,scale:.6,seed:3,wobble:false},{size})}</div>`;
  if(t.ref_images && t.ref_images.length) return `<div class="svgbox"><img src="${esc(t.ref_images[0])}" alt="" loading="lazy"></div>`;
  const style = STYLES[t.id] ? t.id : 'kawung';
  const pal = PALETTES[t.palette] ? t.palette : 'soga';
  return `<div class="svgbox">${batikSVG({style,colors:PALETTES[pal].c,scale:.6,rotation:0,seed:3,wobble:false},{size})}</div>`;
}
/* Create / edit template (saved in this browser). prefill: {id?, name, description, palette, origin, meaning, ref_images:[data URLs]} */
function templateModal(prefill={}, {onSaved}={}){
  const editing = !!prefill.id;
  const refs = (prefill.ref_images||[]).map(src=>({src}));
  const m=openModal(editing ? L('Edit template','Edit template') : L('Buat template baru','Create a new template'), `
    <p class="hint" style="margin-bottom:6px">${L('Template adalah titik awal desain: deskripsi gaya + gambar acuan. Desain baru dibuat “dalam gaya” template ini.','A template is a starting point: a style description + reference images. New designs are generated “in the style” of this template.')}</p>
    <label class="lbl">${L('Nama template','Template name')}</label><input type="text" id="t-name" maxlength="80" value="${esc(prefill.name||'')}" placeholder="${L('Contoh: Batik Ngentrong Daun Cengkeh','e.g. Ngentrong Clove Leaf Batik')}">
    <label class="lbl">${L('Deskripsi gaya (dikirim ke AI)','Style description (sent to the AI)')}</label>
    <textarea id="t-desc" maxlength="1200" placeholder="${L('Bentuk motif utama, susunannya, isen-isen, ketebalan garis, suasana…','Main motif shapes, how they are arranged, isen-isen fills, line weight, mood…')}">${esc(prefill.description||'')}</textarea>
    <div class="mgrid">
      <div><label class="lbl">${L('Palet bawaan','Default palette')}</label><select id="t-pal"><option value="">${L('Otomatis','Automatic')}</option>${Object.entries(PALETTES).map(([k,v])=>`<option value="${k}" ${prefill.palette===k?'selected':''}>${tr(v.label)}</option>`).join('')}</select></div>
      <div><label class="lbl">${L('Asal daerah (opsional)','Origin (optional)')}</label><input type="text" id="t-origin" value="${esc(prefill.origin||'')}" placeholder="Trenggalek, Jawa Timur"></div>
    </div>
    <label class="lbl">${L('Makna / catatan budaya (opsional)','Meaning / cultural note (optional)')}</label><input type="text" id="t-mean" value="${esc(prefill.meaning||'')}">
    <label class="lbl">${L('Gambar acuan (maks 3)','Reference images (max 3)')}</label>
    <div class="inputs">
      <label class="drop">${ico('upload',20)} ${L('Unggah gambar','Upload image')}<small>JPG / PNG</small><input type="file" accept="image/*" multiple hidden id="t-file"></label>
      <button class="drop" id="t-sketch">${ico('brush',20)} ${L('Gambar sendiri','Draw it yourself')}<small>${L('sketsa dengan marker','marker sketch')}</small></button>
    </div>
    <div class="attach" id="t-refs"></div>
    <div class="row" style="margin-top:18px">${editing?`<button class="btn danger" id="t-del">${ico('trash')} ${L('Hapus template','Delete template')}</button>`:''}<div class="sp"></div><button class="btn ghost" data-cancel>${L('Batal','Cancel')}</button><button class="btn soga" id="t-save">${ico('save')} ${L('Simpan template','Save template')}</button></div>`);
  const r=m.root;
  const drawRefs=()=>{ $('#t-refs',r).innerHTML=refs.map((x,i)=>`<div class="th"><img src="${esc(x.src)}" alt=""><button data-rm="${i}" aria-label="${L('Hapus','Remove')}">×</button></div>`).join('');
    $$('[data-rm]',r).forEach(b=>b.addEventListener('click',()=>{ refs.splice(+b.dataset.rm,1); drawRefs(); })); };
  drawRefs();
  $('#t-file',r).addEventListener('change',async e=>{
    for(const f of [...e.target.files]){ if(refs.length>=3){ toast(L('Maksimal 3 gambar acuan.','Max 3 reference images.'),true); break; }
      try{ refs.push({src:await fileToDataURL(f)}); }catch(err){ toast(err.message,true); } }
    e.target.value=''; drawRefs();
  });
  $('#t-sketch',r).addEventListener('click',async()=>{
    if(refs.length>=3){ toast(L('Maksimal 3 gambar acuan.','Max 3 reference images.'),true); return; }
    const s=await sketchModal(); if(s){ refs.push({src:s.dataURL}); drawRefs(); }
  });
  $('[data-cancel]',r).addEventListener('click',m.close);
  $('#t-del',r)?.addEventListener('click',async()=>{ if(await deleteTemplate(prefill.id)){ m.close(); onSaved && onSaved(null); } });
  $('#t-save',r).addEventListener('click',async()=>{
    const origin=$('#t-origin',r).value.trim(), meaning=$('#t-mean',r).value.trim();
    const t={id: prefill.id || newId('tpl'), name:$('#t-name',r).value.trim(), description:$('#t-desc',r).value.trim(), palette:$('#t-pal',r).value||null,
      origin: origin ? {id:origin, en:origin} : null, meaning: meaning ? {id:meaning, en:meaning} : null,
      builtin:false, ref_images: refs.map(x=>x.src), created: (tplById(prefill.id)||{}).created || Date.now()};
    if(!t.name || !t.description){ toast(L('Nama dan deskripsi wajib diisi.','Name and description are required.'),true); return; }
    const btn=$('#t-save',r); btn.disabled=true;
    try{
      await idbPut('templates', t);
      const i=state.templates.findIndex(x=>x.id===t.id); if(i>=0) state.templates[i]=t; else state.templates.push(t);
      m.close(); toast(L('Template tersimpan: ','Template saved: ')+t.name); onSaved && onSaved(t);
    }catch(e){ toast(e.message,true); btn.disabled=false; }
  });
}
/* Ask, then delete a user template. Resolves true when it was deleted. */
async function deleteTemplate(id){
  const t=tplById(id); if(!t || t.builtin) return false;
  if(!await confirmModal(L(`Hapus template “${t.name}”? Desain yang sudah dibuat dari template ini tetap ada.`,`Delete the template “${t.name}”? Designs already made from it are kept.`), L('Hapus template','Delete template'))) return false;
  try{
    await idbDel('templates', id);
    state.templates=state.templates.filter(x=>x.id!==id);
    if(state.studio.template_id===id) state.studio.template_id='kawung';
    toast(L('Template dihapus','Template deleted')); return true;
  }catch(e){ toast(e.message,true); return false; }
}
/* "Save as template" from any design: rasterise if needed, then prefill the modal. */
async function saveAsTemplate(d){
  let ref;
  try{ ref = d.image ? await shrinkDataURL(d.image, 1024) : (await svgToCanvas(rawSVG(d,768),768,Math.round(768/arOf(d)))).toDataURL('image/jpeg',.9); }
  catch(e){ toast(e.message,true); return; }
  const base = tplById(d.template_id);
  templateModal({name:dn(d), palette:d.pal&&d.pal!=='auto'?d.pal:(base&&base.palette)||'',
    description: [base ? `${L('Berdasarkan','Based on')} ${base.name}: ${base.description}` : '', d.prompt ? `${L('Arahan','Direction')}: ${d.prompt}` : ''].filter(Boolean).join('\n') || L('Gaya seperti gambar acuan.','Style like the reference image.'),
    origin: base && base.origin ? tr(base.origin) : '', ref_images:[ref]});
}

/* ---------- API key modal: visitors use their own Gemini key ---------- */
function keyModal({onSaved}={}){
  const cur=getKey();
  const m=openModal(L('API key Gemini','Gemini API key'), `
    <p style="margin-bottom:10px">${L('Prototipe ini memakai kunci Gemini milikmu sendiri. Tanpa kunci, aplikasi tetap bisa dicoba dalam <b>mode mock</b> dengan gambar contoh.','This prototype uses your own Gemini key. Without one you can still try everything in <b>mock mode</b> with sample images.')}</p>
    <label class="lbl">API key</label>
    <div class="row"><input type="password" id="k-in" autocomplete="off" spellcheck="false" placeholder="AIza… / AQ.…" value="${esc(cur)}"><button class="btn ghost sm" id="k-show" type="button">${ico('eye',15)}</button></div>
    <p class="hint" style="margin-top:8px">${L('Buat kunci gratis di','Get a key at')} <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--soga);font-weight:600">aistudio.google.com/apikey</a>.</p>
    <ul class="kawung hint" style="margin-top:12px">
      <li>${L('Kunci disimpan hanya di browser ini (localStorage), bukan di server.','The key is stored only in this browser (localStorage), not on the server.')}</li>
      <li>${L('Kunci dikirim bersama setiap permintaan hanya untuk memanggil Gemini, lalu tidak disimpan atau dicatat.','It is sent with each request only to call Gemini, and is never saved or logged.')}</li>
      <li>${L('Biaya pemakaian Gemini masuk ke akun pemilik kunci.','Gemini usage is billed to the key owner.')}</li>
    </ul>
    <div class="row" style="margin-top:18px">${cur?`<button class="btn danger" id="k-del">${ico('trash')} ${L('Hapus kunci','Remove key')}</button>`:''}<div class="sp"></div>
      <button class="btn ghost" data-cancel>${cur?L('Batal','Cancel'):L('Pakai mode mock','Use mock mode')}</button>
      <button class="btn primary" id="k-save">${ico('check')} ${L('Cek & simpan','Check & save')}</button></div>`);
  const r=m.root, inp=$('#k-in',r);
  try{ localStorage.setItem('canting-key-asked','1'); }catch(e){}
  $('#k-show',r).addEventListener('click',()=>{ inp.type = inp.type==='password' ? 'text' : 'password'; });
  $('[data-cancel]',r).addEventListener('click',m.close);
  $('#k-del',r)?.addEventListener('click',()=>{ setKey(''); m.close(); toast(L('Kunci dihapus, kembali ke mode mock','Key removed, back to mock mode')); onSaved && onSaved(); });
  const save=async()=>{
    const k=inp.value.trim(); if(!k){ toast(L('Masukkan API key dulu.','Enter an API key first.'),true); return; }
    const b=$('#k-save',r); b.disabled=true; b.innerHTML=ico('clock')+' '+L('Mengecek…','Checking…');
    try{ await api('/api/check-key', {}, 'POST', k); setKey(k); m.close(); toast(L('Kunci valid, Gemini aktif','Key works, Gemini is on')); onSaved && onSaved(); }
    catch(e){ toast(e.message,true); b.disabled=false; b.innerHTML=ico('check')+' '+L('Cek & simpan','Check & save'); }
  };
  $('#k-save',r).addEventListener('click',save);
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter') save(); });
  setTimeout(()=>inp.focus(),50);
}

/* ---------- shared UI bits ---------- */
const logoMark = (s=30) => `<svg class="logomark" width="${s}" height="${s}" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#B8862F"/><g fill="#1C2D54"><ellipse cx="20" cy="11.5" rx="4.4" ry="7"/><ellipse cx="20" cy="28.5" rx="4.4" ry="7"/><ellipse cx="11.5" cy="20" rx="7" ry="4.4"/><ellipse cx="28.5" cy="20" rx="7" ry="4.4"/></g><circle cx="20" cy="20" r="3" fill="#F5EBD7"/></svg>`;
const logo = () => `<a class="logo" href="#/">${logoMark()}<span>Canting</span><small>AI</small><span class="aksara" title="canting">ꦕꦤ꧀ꦠꦶꦁ</span></a>`;
function bandSVG(){
  const ks=Object.keys(STYLES), cols=[PALETTES.soga.c,PALETTES.indigo.c,PALETTES.pesisir.c];
  let x=''; for(let i=0;i<12;i++){ const d={style:ks[i%ks.length],colors:cols[i%3],scale:.45,rotation:0,seed:i+2,wobble:false}; const id=++uid, B=batikDefs(d,id,1,false);
    x+=`<defs>${B.defs}</defs><rect x="${i*64}" width="64" height="34" fill="url(#p${id})"/>`; }
  const one=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 34" preserveAspectRatio="xMidYMid slice">${x}</svg>`;
  return `<div class="strip">${one}${one}</div>`;
}
const NAV = () => [
  ['dashboard','Dashboard','layout'],
  ['studio',L('Studio AI','AI Studio'),'sparkle'],
  ['templates','Template','layers'],
  ['editor','Editor','edit'],
  ['watermark','Watermark','shield'],
  ['mockup',L('Mockup Produk','Product Mockup'),'shirt'],
  ['gallery',L('Koleksi','Collection'),'grid'],
  ['architecture',L('Arsitektur','Architecture'),'cpu']
];
function shell(route, inner){
  const title = (NAV().find(n=>n[0]===route)||[])[1] || '';
  const st = state.status;
  return `<div class="shell">
  <aside class="side">${logo()}
    ${NAV().map(([r,l,i])=>`<a class="nv ${r===route?'on':''}" href="#/${r}">${ico(i,20)}<span>${l}</span></a>`).join('')}
    <div class="sp"></div>
    <div class="credit"><b><i class="dot ${aiMode()==='mock'?'mock':''}"></i>${aiMode()==='mock' ? L('Mode mock (tanpa AI)','Mock mode (no AI)') : aiMode()==='own' ? L('Gemini · kunci sendiri','Gemini · your key') : 'Gemini API'}</b>
      <span>${aiMode()==='mock' ? L('Masukkan API key Gemini untuk hasil AI asli.','Add a Gemini API key for real AI results.') : `<b id="side-model" style="display:inline;color:#fff">${esc(modelLabel(state.aiModel)||st.image_model)}</b>`}</span>
      <button class="btn gold xs" data-keybtn style="margin-top:8px">${ico('lock',13)} ${getKey()?L('Ganti API key','Change API key'):L('Masukkan API key','Add API key')}</button>
      <span>${st.images} ${L('gambar AI dibuat','AI images made')}${st.avg_ms?` · ${L('rata-rata','avg')} ${(st.avg_ms/1000).toFixed(1)} ${L('dtk','s')}`:''}</span></div>
    <div class="me"><div class="av">LA</div><div>${UMKM}<small>${L('UMKM batik · prototipe','Batik UMKM · prototype')}</small></div></div>
    <div class="tumpal"></div>
  </aside>
  <main class="main">
    <div class="top"><span class="crumbs">Canting AI &nbsp;/&nbsp; <b style="color:var(--ink)">${title}</b></span><div class="sp"></div>${langSwitch()}<button class="tag ${aiMode()==='mock'?'mock':'ok'}" data-keybtn style="border:0;cursor:pointer">${aiMode()==='mock'?L('Mode mock · masukkan API key','Mock mode · add API key'):ico('check',12)+' '+(aiMode()==='own'?L('Gemini · kunci sendiri','Gemini · your key'):'Gemini')}</button></div>
    <div class="content">${inner}</div>
  </main></div>`;
}
function lnav(active){
  const home = active==='home';
  return `<header class="lnav"><div class="in">${logo()}
    <nav>${home
      ? `<a href="#masalah">${L('Masalah','Problem')}</a><a href="#fitur">${L('Fitur','Features')}</a><a href="#cara">${L('Cara kerja','How it works')}</a><a href="#budaya">${L('Etika & budaya','Ethics & culture')}</a>`
      : `<a href="#/">${L('Beranda','Home')}</a>`}
      <a href="#/architecture" class="${active==='arch'?'on':''}">${L('Arsitektur','Architecture')}</a></nav>
    <div class="sp"></div>${langSwitch()}
    <a class="btn ghost sm" href="#/dashboard">${L('Masuk','Sign in')}</a><a class="btn primary sm" href="#/studio">${L('Coba sekarang','Try it now')}</a></div></header>`;
}
const footer = () => `<footer class="foot"><div class="wrap in">${logoMark(24)}<b>Canting AI</b><span>${L('Prototipe fungsional · generate & edit motif memakai Gemini API. Catatan budaya adalah panduan, bukan jaminan keaslian.','Functional prototype · motif generation & editing use the Gemini API. Cultural notes are guidance, not a guarantee of authenticity.')}</span></div></footer>`;

const thumb = (d,o={}) => `<div class="svgbox">${batikSVG(d,o)}</div>`;
const designLabel = d => { const t=tplById(d.template_id); const n = t ? t.name : (STYLES[d.style]?.label || 'AI'); return isTile(d) ? n : `${n} · ${tr(FORMATS[d.format]?.label)||d.format}`; };
const designCard = d => `<div class="card dcard" data-open="${esc(d.id)}">
  <div class="svgw">${thumb(d,{size:300})}${d.protected?`<span class="badge">${ico('shield',12)} ${L('Dilindungi','Protected')}</span>`:''}</div>
  <b>${esc(dn(d))}</b><small>${esc(designLabel(d))} · ${esc(fmtDate(d.date))}</small></div>`;
function bindOpen(root=document){
  $$('[data-open]',root).forEach(el=>el.addEventListener('click',e=>{
    if(e.target.closest('[data-del]')) return;
    const d = state.designs.find(x=>x.id===el.dataset.open);
    if(d) openEditor(d);
  }));
}
