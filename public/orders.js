/* =====================================================================
   Canting AI: custom orders
   - Order assistant (chatbot) that helps a customer explain what they want → an order brief
   - AI previews from the brief, an approval sheet to send on WhatsApp, revision history
   - Tracing pattern (pola nyorek): line art printed at real size over A4/A3 sheets
   Orders are saved in this browser (IndexedDB 'orders'), like designs.
   ===================================================================== */

/* ---------- shop settings (name + WhatsApp number), also passed to the customer link ---------- */
const SHOP_LS = 'canting-shop';
function hashParams(){ const q=(location.hash.split('?')[1]||''); return Object.fromEntries(new URLSearchParams(q)); }
function shopInfo(fromLink=false){
  let s={}; try{ s=JSON.parse(localStorage.getItem(SHOP_LS)||'{}'); }catch(e){}
  const q = fromLink ? hashParams() : {};
  return {name: q.toko || s.name || UMKM, wa: String(q.wa || s.wa || '').replace(/\D/g,'')};
}
function saveShop(info){ try{ localStorage.setItem(SHOP_LS, JSON.stringify(info)); }catch(e){} }
const customerLink = () => { const s=shopInfo(); const q=new URLSearchParams({toko:s.name, ...(s.wa?{wa:s.wa}:{})});
  return `${location.origin}${location.pathname}#/pesan?${q}`; };
const waLink = (number, text) => `https://wa.me/${number||''}?text=${encodeURIComponent(text)}`;

/* ---------- order data ---------- */
const ORD_STATUS = {
  chat:    {id:'Sedang chat',en:'Chatting', cls:''},
  preview: {id:'Pratinjau siap',en:'Previews ready', cls:''},
  sent:    {id:'Menunggu persetujuan',en:'Awaiting approval', cls:'mock'},
  revision:{id:'Revisi',en:'Revision', cls:'mock'},
  approved:{id:'Disetujui',en:'Approved', cls:'ok'},
};
const BRIEF_ROWS = () => [['purpose',L('Keperluan','Purpose')],['product',L('Produk','Product')],['motif','Motif'],['colours',L('Warna','Colours')],
  ['dye',L('Pewarna','Dye')],['size',L('Ukuran','Size')],['quantity',L('Jumlah','Quantity')],['deadline',L('Tenggat','Deadline')],['notes',L('Catatan','Notes')]];
const dyeText = v => v==='alam' ? L('Alam','Natural') : v==='sintetis' ? L('Sintetis','Synthetic') : (v||'');
const emptyBrief = () => ({purpose:'',product:'',motif:'',colours:'',dye:'',size:'',quantity:'',deadline:'',notes:'',format:'tile',palette:'',image_prompt:''});
function newOrder(source='maker'){
  return {id:newId('ord'), code:'PSN-'+Date.now().toString(36).slice(-5).toUpperCase(), customer:'', phone:'',
    created:Date.now(), updated:Date.now(), status:'chat', messages:[], brief:emptyBrief(), ready:false, suggestions:[],
    previews:[], chosen:null, revisions:[], source};
}
async function saveOrder(o){
  o.updated=Date.now();
  try{ await idbPut('orders', structuredClone(o)); }catch(e){ toast(e.message,true); }
  const i=state.orders.findIndex(x=>x.id===o.id); if(i>=0) state.orders[i]=o; else state.orders.unshift(o);
}
const motifKey = b => Object.keys(STYLES).find(k=>(b.motif||'').toLowerCase().includes(STYLES[k].label.toLowerCase())) || null;
const productKind = b => b.format==='kain' ? 'kain' : /dress|gaun/i.test(b.product||'') ? 'dress' : /tas|tote|bag/i.test(b.product||'') ? 'tote' : 'kaos';
function orderDesign(o, p){
  const b=o.brief||emptyBrief(), k=motifKey(b);
  return {id:null, name:`${o.code} · ${b.motif||'Batik'}`, image:p.image, format:p.format||b.format||'tile', w:p.w, h:p.h,
    template_id:k, style:k, pal:b.palette||'auto', scale:1, rotation:0, mirror:false, adjust:{...DEFAULT_ADJ}, protected:false,
    date:today(), prompt:b.image_prompt, versions:[{image:p.image,w:p.w,h:p.h}], vi:0, mock:p.mock, order_id:o.id};
}

/* ---------- chat ---------- */
const ORD = {sel:null, busy:false, gen:false, pending:null, pub:null};
const mdLite = s => esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
const msgHTML = m => `<div class="msg ${m.role==='user'?'me':'ai'}">${m.image?`<img src="${esc(m.image)}" alt="">`:''}${m.text?`<p>${mdLite(m.text)}</p>`:''}</div>`;
const typingHTML = `<div class="msg ai typing"><p><i></i><i></i><i></i></p></div>`;

function chatHTML(o, pub){
  const s=shopInfo(pub);
  return `<div class="card ochat">
    <div class="oc-head">${logoMark(30)}<div><b>${L('Asisten Pesanan','Order Assistant')}</b><small>${esc(s.name)} · ${aiMode()==='mock'?L('mode mock','mock mode'):'Gemini'}</small></div></div>
    <div class="oc-thread" id="oc-thread">${o.messages.map(msgHTML).join('')}${ORD.busy?typingHTML:''}</div>
    <div class="oc-sugg">${ORD.busy?'':(o.suggestions||[]).map((x,i)=>`<button class="chip" data-sg="${i}">${esc(x)}</button>`).join('')}</div>
    ${ORD.pending?`<div class="attach" style="padding:0 14px"><div class="th"><img src="${esc(ORD.pending)}" alt=""><b>${L('lampiran','attached')}</b><button id="oc-rmimg" aria-label="${L('Hapus','Remove')}">×</button></div></div>`:''}
    <form class="oc-input" id="oc-form" autocomplete="off">
      <label class="btn ghost sm" title="${L('Kirim foto sketsa / contoh','Send a sketch / example photo')}">${ico('upload',16)}<input type="file" accept="image/*" hidden id="oc-file"></label>
      <button type="button" class="btn ghost sm" id="oc-draw" title="${L('Gambar sketsa','Draw a sketch')}">${ico('brush',16)}</button>
      <input type="text" id="oc-text" maxlength="600" placeholder="${L('Tulis pesan…','Type a message…')}">
      <button class="btn primary sm" id="oc-send" ${ORD.busy?'disabled':''} aria-label="${L('Kirim','Send')}">${ico('send',16)}</button>
    </form></div>`;
}
function briefHTML(o){
  const b=o.brief||emptyBrief();
  const filled=BRIEF_ROWS().filter(([k])=>b[k]).length;
  return `<div class="card obrief">
    <div class="row" style="margin-bottom:10px"><h3 style="font-size:19px">${L('Ringkasan pesanan','Order brief')}</h3><div class="sp"></div><span class="tag ${o.ready?'ok':''}">${o.ready?ico('check',12)+' '+L('Siap pratinjau','Ready for previews'):`${filled}/${BRIEF_ROWS().length}`}</span></div>
    <p class="hint" style="margin-bottom:10px">${L('Diisi otomatis dari chat. Boleh dikoreksi langsung.','Filled in from the chat. You can correct it here.')}</p>
    <div class="bf">${BRIEF_ROWS().map(([k,l])=>`<label><span>${l}</span>${k==='dye'
      ? `<select data-bf="dye"><option value="">–</option><option value="alam" ${b.dye==='alam'?'selected':''}>${L('Alam','Natural')}</option><option value="sintetis" ${b.dye==='sintetis'?'selected':''}>${L('Sintetis','Synthetic')}</option></select>`
      : `<input type="text" data-bf="${k}" value="${esc(b[k])}" placeholder="–">`}</label>`).join('')}
      <label><span>${L('Bentuk','Shape')}</span><select data-bf="format">${Object.entries(FORMATS).map(([k,f])=>`<option value="${k}" ${b.format===k?'selected':''}>${tr(f.label)} (${tr(f.sub)})</option>`).join('')}</select></label>
    </div>
    <button class="btn primary block" id="o-prev" style="margin-top:14px" ${ORD.gen?'disabled':''}>${ico('sparkle')} ${ORD.gen?L('Membuat pratinjau…','Making previews…'):o.previews.length?L('Buat 2 pratinjau lagi','Make 2 more previews'):L('Lihat pratinjau AI','Show AI previews')}</button>
    <p class="hint" style="margin-top:6px;text-align:center">${L('Pratinjau hanya gambaran. Batik tetap digambar tangan oleh pengrajin.','Previews are only a guide. The batik is still drawn by hand by the maker.')}</p>
  </div>`;
}
function previewsHTML(o, pub){
  if(!o.previews.length && !ORD.gen) return '';
  return `<div class="card oprev">
    <div class="row" style="margin-bottom:10px"><h3 style="font-size:19px">${L('Pratinjau desain','Design previews')}</h3><div class="sp"></div><span class="hint">${L('Pilih satu untuk disetujui','Pick one to approve')}</span></div>
    <div class="op-grid">${ORD.gen?[0,1].map(i=>`<div class="op">${procLoader(L('Pratinjau ','Preview ')+'AB'[i])}</div>`).join(''):''}
      ${o.previews.map((p,i)=>`<div class="op ${o.chosen===i?'on':''}"><div class="svgbox"><img src="${esc(p.image)}" alt="" style="aspect-ratio:${p.w}/${p.h};object-fit:contain;background:#efe3c6"></div>
        <div class="row" style="margin-top:8px"><small class="hint">#${i+1}${p.mock?' · mock':''}${p.rev?` · ${L('revisi','revision')} ${p.rev}`:''}</small><div class="sp"></div>
        ${o.chosen===i?`<span class="tag ok">${ico('check',12)} ${L('Dipilih','Chosen')}</span>`:`<button class="btn ghost xs" data-pick="${i}">${L('Pilih ini','Pick this')}</button>`}</div></div>`).join('')}</div>
  </div>`;
}
function approvalHTML(o, pub){
  if(o.chosen==null || !o.previews[o.chosen]) return '';
  const st=ORD_STATUS[o.status]||ORD_STATUS.chat, s=shopInfo(pub);
  return `<div class="card oappr">
    <div class="row wrap" style="margin-bottom:12px"><h3 style="font-size:19px">${L('Persetujuan','Approval')}</h3><span class="tag ${st.cls}">${tr(st)}</span><div class="sp"></div><span class="hint">${o.revisions.length} ${L('revisi','revision(s)')}</span></div>
    <div class="oa-grid"><div class="svgbox" id="o-sheet"><div class="hint" style="padding:40px;text-align:center">${L('Menyiapkan lembar…','Preparing the sheet…')}</div></div>
    <div>
      <p class="hint" style="margin-bottom:12px">${pub
        ? L('Kirim pilihanmu ke pengrajin. Lembar persetujuan berisi pratinjau ber-watermark dan ringkasan pesanan.','Send your pick to the maker. The approval sheet has a watermarked preview and the order brief.')
        : L('Kirim lembar ini ke pelanggan lewat WhatsApp. Revisi dilakukan di pratinjau, sebelum mulai mencanting.','Send this sheet to the customer on WhatsApp. Revisions happen on the preview, before the canting work starts.')}</p>
      <div class="oa-btns">
        <button class="btn ghost sm" id="o-dl">${ico('download',15)} ${L('Unduh lembar','Download sheet')}</button>
        <a class="btn gold sm" id="o-wa" target="_blank" rel="noopener" href="#">${ico('send',15)} ${pub?L('Kirim ke pengrajin (WA)','Send to the maker (WA)'):L('Kirim ke pelanggan (WA)','Send to the customer (WA)')}</a>
        ${pub ? '' : `
        <button class="btn primary sm" id="o-ok">${ico('check',15)} ${L('Tandai disetujui','Mark approved')}</button>
        <button class="btn danger sm" id="o-rev">${ico('refresh',15)} ${L('Pelanggan minta revisi','Customer wants changes')}</button>
        <button class="btn ghost sm" id="o-edit">${ico('edit',15)} ${L('Ubah di Editor','Change in the Editor')}</button>
        <button class="btn ghost sm" id="o-pola">${ico('ruler',15)} ${L('Pola nyorek','Tracing pattern')}</button>`}
      </div>
      ${!pub && !s.wa && !o.phone ? `<p class="hint" style="margin-top:8px">${L('Isi nomor WhatsApp pelanggan di atas agar tombol WA langsung membuka chatnya.','Fill in the customer’s WhatsApp number above so the WA button opens their chat.')}</p>` : ''}
      ${o.revisions.length ? `<div class="orevs"><b>${L('Riwayat revisi','Revision history')}</b>${o.revisions.map((r,i)=>`<div><span class="tag ${r.done?'ok':'mock'}">${i+1}</span><p>${esc(r.note)}<small>${esc(fmtDate(r.date))}${r.done?' · '+L('sudah diubah','changed'):''}</small></p></div>`).join('')}</div>` : ''}
    </div></div>
  </div>`;
}
const briefText = o => { const b=o.brief||emptyBrief();
  return [`*${L('Pesanan batik','Batik order')} ${o.code}*`, ...BRIEF_ROWS().filter(([k])=>b[k]).map(([k,l])=>`${l}: ${k==='dye'?dyeText(b[k]):b[k]}`),
    `${L('Bentuk','Shape')}: ${tr(FORMATS[b.format]?.label)||b.format}`, o.revisions.length?`${L('Revisi ke-','Revision ')}${o.revisions.length}`:''].filter(Boolean).join('\n'); };

/* the order area: chat + brief + previews + approval (customer page and maker page share it) */
function orderBodyHTML(o, pub){
  return `<div class="ord-grid"><div class="ord-col">${chatHTML(o,pub)}</div>
    <div class="ord-col">${briefHTML(o)}${previewsHTML(o,pub)}${approvalHTML(o,pub)}</div></div>`;
}
function renderOrder(o, pub){
  const el=$('#order-body'); if(!el) return;
  const txt=$('#oc-text')?.value||'', focus=document.activeElement?.id==='oc-text';
  el.innerHTML=orderBodyHTML(o,pub);
  const t=$('#oc-text'); t.value=txt; if(focus) t.focus();
  const th=$('#oc-thread'); th.scrollTop=th.scrollHeight;
  bindOrder(o,pub);
}
function bindOrder(o, pub){
  const rr=()=>renderOrder(o,pub);
  $('#oc-form').addEventListener('submit',e=>{ e.preventDefault(); sendChat(o,pub,$('#oc-text').value); });
  $$('[data-sg]').forEach(b=>b.addEventListener('click',()=>sendChat(o,pub,o.suggestions[+b.dataset.sg])));
  $('#oc-file').addEventListener('change',async e=>{ const f=e.target.files[0]; if(!f) return; try{ ORD.pending=await fileToDataURL(f,1024); rr(); }catch(err){ toast(err.message,true); } });
  $('#oc-draw').addEventListener('click',async()=>{ const r=await sketchModal(); if(r){ ORD.pending=await shrinkDataURL(r.dataURL,1024); rr(); } });
  $('#oc-rmimg')?.addEventListener('click',()=>{ ORD.pending=null; rr(); });
  $$('[data-bf]').forEach(i=>i.addEventListener('change',()=>{ o.brief[i.dataset.bf]=i.value; if(o.brief.motif && o.brief.colours) o.ready=true; saveOrder(o); if(i.tagName==='SELECT') rr(); }));
  $('#o-prev').addEventListener('click',()=>orderPreviews(o,pub));
  $$('[data-pick]').forEach(b=>b.addEventListener('click',async()=>{ o.chosen=+b.dataset.pick; if(o.status==='chat') o.status='preview'; await saveOrder(o); rr(); }));
  if(o.chosen!=null && o.previews[o.chosen]) bindApproval(o,pub);
}
async function sendChat(o, pub, text){
  text=(text||'').trim();
  if(ORD.busy || (!text && !ORD.pending)) return;
  o.messages.push({role:'user', text, ...(ORD.pending?{image:ORD.pending}:{})});
  ORD.pending=null; ORD.busy=true; const inp=$('#oc-text'); if(inp) inp.value='';
  renderOrder(o,pub);
  // only the last two attached images are sent again, to keep the request small
  const imgIdx=o.messages.map((m,i)=>m.image?i:-1).filter(i=>i>=0).slice(-2);
  const messages=o.messages.map((m,i)=>({role:m.role, text:m.text, image:imgIdx.includes(i)?m.image:null}));
  try{
    const r=await api('/api/chat',{messages, shop:shopInfo(pub).name, lang});
    o.messages.push({role:'model', text:r.reply});
    o.brief={...emptyBrief(), ...Object.fromEntries(Object.entries(r.brief||{}).filter(([k,v])=>v))};
    o.ready=r.ready || o.ready; o.suggestions=r.suggestions||[];
  }catch(e){  // put the message back in the input so it can be sent again
    toast(e.message,true); const m=o.messages.pop(); ORD.busy=false; ORD.pending=m.image||null;
    renderOrder(o,pub); $('#oc-text').value=m.text; return;
  }
  ORD.busy=false; await saveOrder(o); renderOrder(o,pub);
}
async function startChat(o, pub){
  if(o.messages.length) return;
  try{ const r=await api('/api/chat',{messages:[], shop:shopInfo(pub).name, lang}); o.messages.push({role:'model',text:r.reply}); o.suggestions=r.suggestions||[]; renderOrder(o,pub); }
  catch(e){ toast(e.message,true); }
}

/* ---------- previews ---------- */
async function orderPreviews(o, pub){
  const b=o.brief||emptyBrief();
  const imgs=o.messages.filter(m=>m.role==='user' && m.image).map(m=>m.image).slice(-2);
  const prompt=[b.image_prompt || [b.motif, b.colours, b.purpose && `for ${b.purpose}`].filter(Boolean).join(', '), b.notes].filter(Boolean).join('. ');
  if(!prompt && !imgs.length){ toast(L('Ceritakan dulu motif atau warnanya di chat.','Describe the motif or colours in the chat first.'),true); return; }
  const k=motifKey(b);
  const body={prompt, template_id:k, palette:b.palette||null, dye:b.dye||null, density:'medium', format:b.format||'tile',
    references:imgs, sketch:null, model:state.aiModel, size:'1K'};
  ORD.gen=true; renderOrder(o,pub);
  const res=await Promise.allSettled([0,1].map(i=>api('/api/generate',{...body, variation:i})));
  ORD.gen=false;
  const fresh=res.filter(r=>r.status==='fulfilled').map(r=>({image:r.value.data, w:r.value.w, h:r.value.h, format:r.value.format, mock:r.value.mock, ms:r.value.ms}));
  res.forEach(r=>logGen(r.status==='fulfilled'?r.value.ms:0, r.status==='fulfilled'));
  if(!fresh.length) toast(res[0].reason?.message||L('Gagal membuat pratinjau.','Could not make previews.'),true);
  // keep the chosen one, drop the oldest unchosen previews beyond 8
  const chosen = o.chosen!=null ? o.previews[o.chosen] : null;
  let list=[...o.previews, ...fresh];
  while(list.length>8){ const i=list.findIndex(p=>p!==chosen); list.splice(i,1); }
  o.previews=list; o.chosen=chosen ? list.indexOf(chosen) : null;
  if(o.status==='chat') o.status='preview';
  await saveOrder(o); refreshStatus(); renderOrder(o,pub);
  $('.oprev')?.scrollIntoView({behavior:'smooth',block:'nearest'});
}

/* ---------- approval sheet (one portrait image, made to be sent on WhatsApp) ---------- */
const loadImg = src => new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; });
function wrapText(c, text, x, y, maxW, lh, maxLines=3){
  const words=String(text).split(/\s+/); let line='', n=0;
  for(let i=0;i<words.length;i++){
    const test=line?line+' '+words[i]:words[i];
    if(c.measureText(test).width>maxW && line){ c.fillText(n===maxLines-1?line+'…':line,x,y); y+=lh; line=words[i]; if(++n>=maxLines) return y; }
    else line=test;
  }
  if(line){ c.fillText(line,x,y); y+=lh; }
  return y;
}
async function approvalSheet(o, pub){
  const W=1080, H=1520, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
  const c=cv.getContext('2d'), b=o.brief||emptyBrief(), p=o.previews[o.chosen], shop=shopInfo(pub).name;
  c.fillStyle='#FFFAF0'; c.fillRect(0,0,W,H);
  for(let x=0;x<W;x+=60){ c.fillStyle='#7A4426'; c.beginPath(); c.moveTo(x,0); c.lineTo(x+60,0); c.lineTo(x+30,32); c.fill();
    c.fillStyle='#B8862F'; c.beginPath(); c.moveTo(x+14,0); c.lineTo(x+46,0); c.lineTo(x+30,17); c.fill(); }
  c.fillStyle='#1C2D54'; c.font='600 50px Fraunces, Georgia, serif'; c.fillText(shop,60,108);
  c.fillStyle='#6E5F4B'; c.font='500 27px "DM Sans", Arial, sans-serif';
  c.fillText(`${L('Lembar persetujuan desain','Design approval sheet')} · ${o.code}`,60,150);
  c.fillText(`${fmtDate(today())}${o.revisions.length?` · ${L('revisi ke-','revision ')}${o.revisions.length}`:''}`,60,186);
  // preview, letterboxed, with a tiled "PRATINJAU" watermark so it can't be used as the final file
  const bx=60, by=216, bw=960, bh=660, img=await loadImg(p.image);
  c.fillStyle='#EFE3C6'; c.fillRect(bx,by,bw,bh);
  const k=Math.min(bw/img.width, bh/img.height), iw=img.width*k, ih=img.height*k, ix=bx+(bw-iw)/2, iy=by+(bh-ih)/2;
  c.drawImage(img,ix,iy,iw,ih);
  c.save(); c.beginPath(); c.rect(ix,iy,iw,ih); c.clip(); c.translate(bx+bw/2,by+bh/2); c.rotate(-0.42);
  c.font='700 30px "DM Sans", Arial, sans-serif'; c.textAlign='center'; c.lineWidth=3;
  for(let y=-700;y<=700;y+=120) for(let x=-900;x<=900;x+=420){ const t=`${L('PRATINJAU','PREVIEW')} · ${shop}`;
    c.globalAlpha=.32; c.strokeStyle='#000'; c.strokeText(t,x+(y/120%2?210:0),y); c.fillStyle='#fff'; c.fillText(t,x+(y/120%2?210:0),y); }
  c.restore();
  // product mockup
  const d=orderDesign(o,p), kind=productKind(b);
  try{ const mk=await svgToCanvas(productSVG(kind,d,'#F3E9D2',1),300);
    c.fillStyle='#F3E9D2'; c.beginPath(); c.roundRect(740,906,280,280,22); c.fill(); c.drawImage(mk,750,916,260,260); }catch(e){}
  // brief
  let y=930; c.textAlign='left';
  for(const [key,l] of BRIEF_ROWS()){
    if(!b[key] || y>1290) continue;
    c.fillStyle='#6E5F4B'; c.font='700 19px "DM Sans", Arial, sans-serif'; c.fillText(l.toUpperCase(),60,y);
    c.fillStyle='#2A1D14'; c.font='500 27px "DM Sans", Arial, sans-serif';
    y=wrapText(c, key==='dye'?dyeText(b[key]):b[key], 60, y+32, 640, 33, 2)+14;
  }
  // footer
  c.fillStyle='#1C2D54'; c.fillRect(0,H-190,W,190);
  c.fillStyle='#fff'; c.font='700 30px "DM Sans", Arial, sans-serif';
  c.fillText(L('Balas SETUJU, atau tulis bagian yang ingin diubah.','Reply APPROVED, or write what should change.'),60,H-122);
  c.fillStyle='#cdd6ea'; c.font='400 22px "DM Sans", Arial, sans-serif';
  wrapText(c, L('Pratinjau dibuat dengan bantuan AI sebagai gambaran. Batik digambar tangan oleh pengrajin, jadi hasil akhir bisa sedikit berbeda. Harga dan waktu dikonfirmasi pengrajin.',
    'The preview is AI-assisted and only a guide. The batik is drawn by hand by the maker, so the result may differ slightly. The maker confirms price and time.'), 60, H-80, 960, 30, 2);
  return cv;
}
async function bindApproval(o, pub){
  const s=shopInfo(pub), num = pub ? s.wa : (o.phone||'').replace(/\D/g,'').replace(/^0/,'62');
  const msg = pub
    ? `${L('Halo','Hello')} ${s.name}, ${L('saya mau pesan batik. Lembar persetujuan saya lampirkan.','I would like to order a batik. I attach my approval sheet.')}\n\n${briefText(o)}`
    : `${L('Halo','Hello')}${o.customer?' '+o.customer:''}, ${L('ini pratinjau desain batik pesanan Kakak. Balas SETUJU, atau tulis bagian yang ingin diubah ya.','here is the preview of your batik order. Reply APPROVED, or tell us what to change.')}\n\n${briefText(o)}`;
  $('#o-wa').href=waLink(num,msg);
  $('#o-wa').addEventListener('click',async()=>{ toast(L('Lampirkan lembar yang sudah diunduh di chat WhatsApp','Attach the downloaded sheet in the WhatsApp chat'));
    if(!pub && (o.status==='preview' || o.status==='revision')){ o.status='sent'; await saveOrder(o); renderOrder(o,pub); } });
  let sheet=null;
  try{ sheet=await approvalSheet(o,pub); const box=$('#o-sheet'); if(box) box.innerHTML=`<img src="${sheet.toDataURL('image/jpeg',.88)}" alt="" style="aspect-ratio:1080/1520">`; }
  catch(e){ const box=$('#o-sheet'); if(box) box.innerHTML=`<div class="hint" style="padding:30px">${esc(e.message||'')}</div>`; }
  $('#o-dl').addEventListener('click',()=>{ if(!sheet) return; sheet.toBlob(bl=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(bl); a.download=`${o.code}-persetujuan.jpg`; a.click(); }, 'image/jpeg', .9);
    toast(L('Mengunduh lembar persetujuan','Downloading the approval sheet')); });
  if(pub) return;
  $('#o-ok').addEventListener('click',async()=>{ o.status='approved'; o.revisions.forEach(r=>r.done=true); await saveOrder(o); renderOrder(o,pub); toast(L('Pesanan disetujui. Saatnya nyorek!','Order approved. Time to start drawing!')); });
  $('#o-rev').addEventListener('click',()=>revisionModal(o));
  $('#o-edit').addEventListener('click',()=>{ const last=o.revisions.filter(r=>!r.done).at(-1); state.current=orderDesign(o,o.previews[o.chosen]); pages.editor._txt=last?last.note:''; nav('editor'); });
  $('#o-pola').addEventListener('click',()=>tracingModal(orderDesign(o,o.previews[o.chosen])));
}
function revisionModal(o){
  const m=openModal(L('Catat permintaan revisi','Record a change request'), `
    <p class="hint" style="margin-bottom:10px">${L('Tulis apa kata pelanggan. Catatan ini disimpan di riwayat dan langsung jadi perintah edit AI di Editor.','Write what the customer said. It is kept in the history and becomes the AI edit instruction in the Editor.')}</p>
    <textarea id="rv-note" placeholder="${L('Contoh: bunganya lebih kecil, warna dasar lebih terang','e.g. smaller flowers, a lighter background colour')}"></textarea>
    <div class="row" style="margin-top:14px"><div class="sp"></div><button class="btn ghost" data-c>${L('Batal','Cancel')}</button><button class="btn primary" data-s>${ico('edit')} ${L('Simpan & ubah di Editor','Save & change in the Editor')}</button></div>`);
  $('[data-c]',m.root).addEventListener('click',m.close);
  $('[data-s]',m.root).addEventListener('click',async()=>{
    const note=$('#rv-note',m.root).value.trim(); if(!note){ toast(L('Tulis catatannya dulu.','Write the note first.'),true); return; }
    o.revisions.push({date:today(), note, done:false}); o.status='revision'; await saveOrder(o); m.close();
    state.current=orderDesign(o,o.previews[o.chosen]); pages.editor._txt=note; nav('editor');
    toast(L('Perintah revisi sudah diisi. Tandai area bila perlu, lalu Terapkan.','The change request is filled in. Mark an area if needed, then Apply.'));
  });
  setTimeout(()=>$('#rv-note',m.root).focus(),50);
}
/* from the Editor: put the edited design back into its order as the new chosen preview */
async function useInOrder(d){
  const o=state.orders.find(x=>x.id===d.order_id); if(!o) return;
  if(!d.image){ toast(L('Desain ini belum berupa gambar.','This design is not an image yet.'),true); return; }
  let image=d.image;
  if(hasAdj(d.adjust)){ const cv=await svgToCanvas(rawSVG(d,1024),1024,Math.round(1024/arOf(d))); image=cv.toDataURL('image/jpeg',.92); }
  o.previews.push({image, w:d.w, h:d.h, format:d.format, mock:d.mock, rev:o.revisions.length||undefined});
  o.chosen=o.previews.length-1; o.revisions.forEach(r=>r.done=true);
  if(o.status!=='approved') o.status='preview';
  await saveOrder(o); ORD.sel=o.id; nav('orders');
  toast(L('Desain baru dipakai di pesanan ','New design used in order ')+o.code);
}

/* ---------- maker page: list of orders + the selected one ---------- */
pages.orders = {
  html(){
    const s=shopInfo(), o=state.orders.find(x=>x.id===ORD.sel);
    return `
    <div class="ph"><div><h1>${L('Pesanan Khusus','Custom Orders')}</h1><p>${L('Asisten chat membantu pelanggan menjelaskan pesanannya, lalu pratinjau disetujui sebelum mulai mencanting.','A chat assistant helps customers explain their order; a preview is approved before the canting starts.')}</p></div><div class="sp"></div>
      <button class="btn ghost" id="o-shop">${ico('share')} ${L('Link untuk pelanggan','Customer link')}</button>
      <button class="btn primary" id="o-new">${ico('plus')} ${L('Pesanan baru','New order')}</button></div>
    <div class="ord-layout">
      <aside class="ord-list">${state.orders.length ? state.orders.map(x=>{ const st=ORD_STATUS[x.status]||ORD_STATUS.chat, p=x.chosen!=null?x.previews[x.chosen]:x.previews.at(-1);
        return `<button class="card oli ${x.id===ORD.sel?'on':''}" data-o="${esc(x.id)}">${p?`<img src="${esc(p.image)}" alt="">`:`<span class="ph-ic">${ico('chat',20)}</span>`}
          <span><b>${esc(x.customer||x.brief?.purpose||L('Pelanggan baru','New customer'))}</b><small>${esc(x.code)} · ${esc(x.brief?.motif||x.brief?.product||'…')}</small><span class="tag ${st.cls}">${tr(st)}</span>${x.source==='customer'?`<small>${L('dari link pelanggan','from the customer link')}</small>`:''}</span></button>`; }).join('')
        : `<div class="empty-sm">${L('Belum ada pesanan. Tekan <b>Pesanan baru</b> untuk mencoba asisten chat, atau bagikan link pelanggan.','No orders yet. Press <b>New order</b> to try the chat assistant, or share the customer link.')}</div>`}</aside>
      <section>${o ? `
        <div class="card ohead">
          <div><label class="lbl">${L('Nama pelanggan','Customer name')}</label><input type="text" id="o-cust" value="${esc(o.customer)}" placeholder="Bu Sari"></div>
          <div><label class="lbl">${L('WhatsApp pelanggan','Customer WhatsApp')}</label><input type="tel" id="o-phone" value="${esc(o.phone)}" placeholder="0812…"></div>
          <div class="row" style="align-self:end"><span class="tag dark">${esc(o.code)}</span><button class="btn danger sm" id="o-del">${ico('trash',15)} ${L('Hapus','Delete')}</button></div>
        </div>
        <div id="order-body"></div>` : `<div class="empty"><div><svg class="em-ic" viewBox="0 0 40 40"><ellipse cx="20" cy="11" rx="5" ry="8.5"/><ellipse cx="29" cy="20" rx="8.5" ry="5"/><ellipse cx="20" cy="29" rx="5" ry="8.5"/><ellipse cx="11" cy="20" rx="8.5" ry="5"/></svg>
          <h3>${L('Pilih atau buat pesanan','Pick or create an order')}</h3><p>${L('Asisten akan menanyakan keperluan, produk, motif, warna, pewarna, ukuran dan tenggat,<br>lalu membuat ringkasan dan pratinjau untuk disetujui pelanggan.','The assistant asks about purpose, product, motif, colours, dye, size and deadline,<br>then writes a brief and previews for the customer to approve.')}</p></div></div>`}</section>
    </div>`;
  },
  bind(){
    $('#o-new').addEventListener('click',async()=>{ const o=newOrder('maker'); await saveOrder(o); ORD.sel=o.id; ORD.pending=null; go(); });
    $('#o-shop').addEventListener('click',shopModal);
    $$('[data-o]').forEach(b=>b.addEventListener('click',()=>{ ORD.sel=b.dataset.o; ORD.pending=null; go(); }));
    const o=state.orders.find(x=>x.id===ORD.sel); if(!o) return;
    $('#o-cust').addEventListener('change',e=>{ o.customer=e.target.value.trim(); saveOrder(o).then(go); });
    $('#o-phone').addEventListener('change',e=>{ o.phone=e.target.value.trim(); saveOrder(o).then(()=>renderOrder(o,false)); });
    $('#o-del').addEventListener('click',async()=>{ if(!await confirmModal(L(`Hapus pesanan ${o.code}?`,`Delete order ${o.code}?`))) return;
      await idbDel('orders',o.id); state.orders=state.orders.filter(x=>x.id!==o.id); ORD.sel=null; go(); });
    renderOrder(o,false); startChat(o,false);
  }
};
function shopModal(){
  const s=shopInfo();
  const m=openModal(L('Link pesanan untuk pelanggan','Order link for customers'), `
    <p class="hint" style="margin-bottom:6px">${L('Pelanggan membuka link ini di HP, ngobrol dengan asisten, memilih pratinjau, lalu mengirim pesanannya ke WhatsApp toko.','Customers open this link on their phone, chat with the assistant, pick a preview, then send the order to the shop’s WhatsApp.')}</p>
    <div class="mgrid"><div><label class="lbl">${L('Nama toko','Shop name')}</label><input type="text" id="s-name" value="${esc(s.name)}"></div>
      <div><label class="lbl">${L('WhatsApp toko','Shop WhatsApp')}</label><input type="tel" id="s-wa" value="${esc(s.wa)}" placeholder="6281234567890"></div></div>
    <label class="lbl">Link</label><div class="row"><input type="text" id="s-link" readonly><button class="btn ghost sm" id="s-copy">${ico('copy',15)} ${L('Salin','Copy')}</button><a class="btn primary sm" id="s-open" target="_blank" rel="noopener">${ico('eye',15)} ${L('Buka','Open')}</a></div>
    <p class="hint" style="margin-top:8px">${L('Catatan prototipe: tanpa API key di HP pelanggan, asisten berjalan dalam mode mock. Pesanan dari pelanggan sampai ke toko lewat WhatsApp, bukan lewat server.','Prototype note: without an API key on the customer’s phone the assistant runs in mock mode. Customer orders reach the shop through WhatsApp, not through a server.')}</p>
    <div class="row" style="margin-top:16px"><div class="sp"></div><button class="btn primary" data-c>${ico('check')} ${L('Selesai','Done')}</button></div>`);
  const r=m.root, upd=()=>{ const wa=$('#s-wa',r).value.replace(/\D/g,'').replace(/^0/,'62'); saveShop({name:$('#s-name',r).value.trim()||UMKM, wa}); $('#s-link',r).value=customerLink(); $('#s-open',r).href=customerLink(); };
  upd(); $('#s-name',r).addEventListener('input',upd); $('#s-wa',r).addEventListener('input',upd);
  $('#s-copy',r).addEventListener('click',()=>{ (navigator.clipboard?navigator.clipboard.writeText($('#s-link',r).value):Promise.reject()).then(()=>toast(L('Link disalin','Link copied')),()=>{ $('#s-link',r).select(); toast(L('Tekan Ctrl+C untuk menyalin','Press Ctrl+C to copy')); }); });
  $('[data-c]',r).addEventListener('click',m.close);
}

/* ---------- customer page (public, phone-first): #/pesan?toko=…&wa=… ---------- */
pages.pesan = {
  public:true,
  html(){
    const s=shopInfo(true);
    return `<header class="lnav"><div class="in">${logo()}<div class="sp"></div>${langSwitch()}
      <button class="btn ghost sm" data-keybtn>${ico('lock',14)} ${getKey()?L('Kunci AI','AI key'):L('Mode mock','Mock mode')}</button></div></header>
    <div class="wrap pesan">
      <div class="ph" style="margin:18px 0 14px"><div><h1>${L('Pesan batik di','Order batik from')} ${esc(s.name)}</h1>
        <p>${L('Ceritakan batik yang kamu mau. Asisten akan membantu menyusun pesanan dan menunjukkan pratinjau. Batiknya tetap digambar tangan oleh pengrajin.','Tell us the batik you want. The assistant helps write your order and shows previews. The batik is still drawn by hand by the maker.')}</p></div>
        <div class="sp"></div><button class="btn ghost sm" id="p-new">${ico('refresh',15)} ${L('Mulai ulang','Start over')}</button></div>
      <div id="order-body"></div>
    </div>${footer()}`;
  },
  async bind(){
    let o=state.orders.find(x=>x.id===ORD.pub);
    if(!o){ o=state.orders.find(x=>x.source==='customer' && x.status!=='approved' && Date.now()-x.updated<864e5); }
    if(!o){ o=newOrder('customer'); }
    ORD.pub=o.id;
    $('#p-new').addEventListener('click',async()=>{ const n=newOrder('customer'); ORD.pub=n.id; ORD.pending=null; renderOrder(n,true); startChat(n,true); });
    renderOrder(o,true); await startChat(o,true);
    if(!state.orders.includes(o) && o.messages.length) saveOrder(o);
  }
};

/* =====================================================================
   Tracing pattern (pola nyorek): line art at real size, split over printable sheets
   ===================================================================== */
const PAPERS = {A4:[21,29.7], A3:[29.7,42]};
const PPC = 120/2.54;          // print resolution: 120 dpi, in pixels per cm
const MARGIN = 1.2, OVERLAP = 1;  // cm
const CLOTH_DEFAULT = {tile:[115,200], kain:[250,105], selendang:[50,180], pinggiran:[200,10]};
/* the area actually printed: the whole cloth, or (for repeat tiles) a single repeat */
const area = T => T.area==='satu' && !T.full ? {...T, w:T.rep, h:+(T.rep/(T.ar||1)).toFixed(1)} : T;
function sheetGrid(T){
  const [pw0,ph0]=PAPERS[T.paper], pw=pw0-2*MARGIN, ph=ph0-2*MARGIN;
  const cols=Math.max(1,Math.ceil((T.w-OVERLAP)/(pw-OVERLAP))), rows=Math.max(1,Math.ceil((T.h-OVERLAP)/(ph-OVERLAP)));
  return {pw,ph,cols,rows};
}
async function designSource(d){
  if(d.image) return hasAdj(d.adjust) ? (await svgToCanvas(rawSVG(d,1536),1536,Math.round(1536/arOf(d)))).toDataURL('image/jpeg',.92) : d.image;
  return (await svgToCanvas(rawSVG(d,1024),1024,1024)).toDataURL('image/jpeg',.92);
}
/* draw the cloth area [x0,y0]-[x0+wcm,y0+hcm] (cm) of the pattern into a canvas */
function drawCloth(c, img, T, x0, y0, wcm, hcm, ar){
  c.imageSmoothingEnabled=true; c.imageSmoothingQuality='high';
  c.fillStyle='#fff'; c.fillRect(0,0,wcm*PPC,hcm*PPC);
  c.save(); c.beginPath(); c.rect(0,0,Math.max(0,Math.min(wcm,T.w-x0))*PPC, Math.max(0,Math.min(hcm,T.h-y0))*PPC); c.clip();
  c.translate(-x0*PPC,-y0*PPC);
  if(T.full) c.drawImage(img,0,0,T.w*PPC,T.h*PPC);
  else{
    const tw=Math.max(8,Math.round(T.rep*PPC)), th=Math.max(8,Math.round(T.rep/ar*PPC));
    const tc=document.createElement('canvas'); tc.width=tw; tc.height=th; tc.getContext('2d').drawImage(img,0,0,tw,th);
    c.fillStyle=c.createPattern(tc,'repeat'); c.fillRect(0,0,T.w*PPC,T.h*PPC);
  }
  c.restore();
}
/* line art only: after a smooth upscale, make every pixel pure black or white so lines print crisp, not grey and soft */
function sharpenLines(c, w, h, cut=160){   // below 160 = line; faint compression specks stay white
  const im=c.getImageData(0,0,w,h), a=im.data;
  for(let i=0;i<a.length;i+=4){ const v=(a[i]*.3+a[i+1]*.59+a[i+2]*.11)<cut?0:255; a[i]=a[i+1]=a[i+2]=v; a[i+3]=255; }
  c.putImageData(im,0,0);
}
async function sharpLinePNG(src, maxPx=8192){
  const img=await loadImg(src), k=Math.max(1, Math.min(2, maxPx/Math.max(img.width,img.height)));
  const cv=document.createElement('canvas'); cv.width=Math.round(img.width*k); cv.height=Math.round(img.height*k);
  const c=cv.getContext('2d'); c.imageSmoothingEnabled=true; c.imageSmoothingQuality='high';
  c.drawImage(img,0,0,cv.width,cv.height); sharpenLines(c,cv.width,cv.height);
  return cv.toDataURL('image/png');
}
const bestLineSize = () => { const m=imageModels().find(x=>x.id===state.aiModel); const s=(m&&m.sizes)||['1K']; return s.includes('4K')?'4K':s.at(-1); };
function tracingModal(d){
  const ar=arOf(d), full=!isTile(d), def=CLOTH_DEFAULT[d.format||'tile']||CLOTH_DEFAULT.tile;
  const T={ar, kind:'line', line:lineFor(d), src:null, paper:'A4', area:full?'kain':'satu', full, w:def[0], h:full?Math.round(def[0]/ar):def[1], rep:20, busy:false,
    res:bestLineSize(), sharp:true, px:{}};
  const m=openModal(L('Pola nyorek (cetak ukuran asli)','Tracing pattern (print at real size)'), `
    <p class="hint" style="margin-bottom:12px">${L('Ubah desain jadi garis hitam, cetak sesuai ukuran kain di beberapa lembar kertas, sambung, lalu jiplak ke kain dengan pensil sebelum mencanting. AI membantu pola, tangan pengrajin yang menggambar.','Turn the design into black lines, print it at the cloth’s real size over several sheets, join them, then trace onto the cloth with a pencil before the canting. The AI helps with the pattern; the maker’s hand does the drawing.')}</p>
    <div class="tr-grid"><div class="svgbox tr-prev" id="tr-prev"></div>
      <div>
        <div class="seg" id="tr-kind"><button data-v="line" class="on">${L('Garis pola','Line pattern')}</button><button data-v="color">${L('Warna asli','Original colours')}</button></div>
        <button class="btn soga block sm" id="tr-make" style="margin-top:10px">${ico('wand',15)} ${L('Buat garis pola','Make line pattern')}</button>
        <div class="row" id="tr-opts" style="gap:10px;margin-top:10px;align-items:center;flex-wrap:wrap">
          <span class="lbl" style="margin:0">${L('Resolusi garis','Line resolution')}</span>
          <div class="seg" id="tr-res" style="min-width:150px">${['2K','4K'].map(s=>{ const ok=(imageModels().find(x=>x.id===state.aiModel)?.sizes||[]).includes(s); return `<button data-v="${s}" class="${T.res===s?'on':''}" ${ok?'':'disabled'}>${s}</button>`; }).join('')}</div>
          <label class="tr-sharp"><input type="checkbox" id="tr-sharp" checked> ${L('Pertajam garis saat dicetak','Sharpen lines when printing')}</label></div>
        <p class="hint" style="margin-top:6px" id="tr-note">${aiMode()==='mock'?L('Mode mock: garis dibuat dengan deteksi tepi sederhana.','Mock mode: lines come from simple edge detection.'):L('Gemini menggambar ulang desain sebagai garis bersih.','Gemini redraws the design as clean lines.')}</p>
        <div class="mgrid" style="gap:10px;margin-top:6px">
          <div><label class="lbl">${L('Lebar kain (cm)','Cloth width (cm)')}</label><input type="number" id="tr-w" min="5" max="600" value="${T.w}"></div>
          <div><label class="lbl">${L('Tinggi kain (cm)','Cloth height (cm)')}</label><input type="number" id="tr-h" min="5" max="600" value="${T.h}" ${full?'readonly title="'+L('Mengikuti bentuk desain','Follows the design shape')+'"':''}></div>
          ${full?'':`<div><label class="lbl">${L('Lebar 1 motif (cm)','One repeat (cm)')}</label><input type="number" id="tr-rep" min="2" max="200" value="${T.rep}"></div>`}
          ${full?'':`<div style="grid-column:1/-1"><label class="lbl">${L('Yang dicetak','What to print')}</label><div class="seg" id="tr-area"><button data-v="satu" class="on">${L('1 motif (digeser saat menjiplak)','1 repeat (slide it while tracing)')}</button><button data-v="kain">${L('Seluruh kain','The whole cloth')}</button></div></div>`}
          <div><label class="lbl">${L('Kertas','Paper')}</label><div class="seg" id="tr-paper"><button data-v="A4" class="on">A4</button><button data-v="A3">A3</button></div></div>
        </div>
        <div class="note" id="tr-sum" style="margin-top:14px"></div>
        <div class="row wrap" style="margin-top:14px"><button class="btn primary sm" id="tr-print">${ico('printer',15)} ${L('Cetak / simpan PDF','Print / save PDF')}</button><button class="btn ghost sm" id="tr-png">${ico('download',15)} ${L('Unduh pola (PNG)','Download pattern (PNG)')}</button></div>
      </div></div>`, {wide:true});
  const r=m.root, note0=$('#tr-note',r).innerHTML;
  const cur=()=> T.kind==='line' ? T.line : T.src;
  const preview=()=>{ const src=cur();
    $('#tr-prev',r).innerHTML = src ? `<img src="${esc(src)}" alt="" style="aspect-ratio:${ar};object-fit:contain;background:#fff">` : `<div class="hint" style="padding:40px;text-align:center">${L('Tekan “Buat garis pola”.','Press “Make line pattern”.')}</div>`;
    const E=area(T), g=sheetGrid(E);
    const iw=src && T.px[src], ppc=iw ? iw/(T.full ? T.w : T.rep) : 0;   // a full piece spans the cloth width; a tile spans one repeat
    const sharpTxt = iw ? `<p class="${ppc<16?'tr-warn':''}">${L('Ketajaman sumber','Source sharpness')}: <b>${ppc.toFixed(0)} px/cm</b> (${iw} px) · ${L('dicetak','printed at')} ${PPC.toFixed(0)} px/cm${T.kind==='line'&&T.sharp?' · '+L('garis dipertajam','lines sharpened'):''}.${ppc<16?' '+(T.kind==='line'?L('Garis bisa pecah: buat ulang di 4K, atau cetak 1 motif saja.','Lines may look blocky: remake at 4K, or print just one repeat.'):L('Gambar bisa pecah: cetak 1 motif saja atau kain lebih kecil.','The image may look blocky: print one repeat or a smaller cloth.')):''}</p>` : '';
    if(src && !T.px[src]) loadImg(src).then(im=>{ T.px[src]=im.width; preview(); }).catch(()=>{});
    $('#tr-sum',r).innerHTML=`${ico('ruler',20)}<div><b>${g.cols*g.rows} ${L('lembar','sheets')} ${T.paper} (${g.cols} × ${g.rows})</b><p>${T.area==='satu'?L('Satu motif','One repeat'):L('Kain','Cloth')} ${E.w} × ${E.h} cm${full?'':` · ${L('motif diulang tiap','repeats every')} ${T.rep} cm`} · ${L('tumpukan','overlap')} ${OVERLAP} cm. ${L('Cetak dengan skala 100% (“Ukuran sebenarnya”).','Print at 100% scale (“Actual size”).')}</p>${sharpTxt}</div>`;
    $('#tr-print',r).disabled=$('#tr-png',r).disabled=!src||T.busy;
    $('#tr-make',r).style.display=T.kind==='line'?'':'none'; $('#tr-note',r).style.display=T.kind==='line'?'':'none'; $('#tr-opts',r).style.display=T.kind==='line'?'':'none';
    if(!T.busy) $('#tr-make',r).innerHTML=ico('wand',15)+' '+(T.line?L(`Buat ulang garis pola (${T.res})`,`Remake line pattern (${T.res})`):L(`Buat garis pola (${T.res})`,`Make line pattern (${T.res})`));
    // line art made earlier (here or by "Sketch over") is reused for free; remaking it is optional
    $('#tr-make',r).className = 'btn block sm ' + (T.line ? 'ghost' : 'soga');
    const lw=T.line && T.px[T.line];
    $('#tr-note',r).innerHTML = T.line
      ? L(`${ico('check',13)} Garis pola sudah ada${lw?` (${lw} px)`:''}, dipakai bersama Sketsa ulang, jadi tidak perlu dibuat lagi. Buat ulang hanya kalau ketajamannya kurang.`,`${ico('check',13)} Line art already exists${lw?` (${lw} px)`:''}, shared with Sketch over, so there is no need to make it again. Remake it only if it isn’t sharp enough.`)
      : note0;
  };
  designSource(d).then(s=>{ T.src=s; preview(); });
  preview();
  $$('#tr-kind button',r).forEach(b=>b.addEventListener('click',()=>{ T.kind=b.dataset.v; $$('#tr-kind button',r).forEach(x=>x.classList.toggle('on',x===b)); preview(); }));
  $$('#tr-area button',r).forEach(b=>b.addEventListener('click',()=>{ T.area=b.dataset.v; $$('#tr-area button',r).forEach(x=>x.classList.toggle('on',x===b)); preview(); }));
  $$('#tr-res button',r).forEach(b=>b.addEventListener('click',()=>{ T.res=b.dataset.v; $$('#tr-res button',r).forEach(x=>x.classList.toggle('on',x===b)); preview(); }));
  $('#tr-sharp',r).addEventListener('change',e=>{ T.sharp=e.target.checked; preview(); });
  $$('#tr-paper button',r).forEach(b=>b.addEventListener('click',()=>{ T.paper=b.dataset.v; $$('#tr-paper button',r).forEach(x=>x.classList.toggle('on',x===b)); preview(); }));
  const num=(id,f)=>$(id,r)?.addEventListener('input',e=>{ const v=+e.target.value; if(v>0){ f(v); if(full){ T.h=Math.round(T.w/ar); $('#tr-h',r).value=T.h; } preview(); } });
  num('#tr-w',v=>T.w=Math.min(600,v)); if(!full) num('#tr-h',v=>T.h=Math.min(600,v)); num('#tr-rep',v=>T.rep=v);
  $('#tr-make',r).addEventListener('click',async()=>{
    const b=$('#tr-make',r); T.busy=true; b.disabled=true; b.innerHTML=ico('clock',15)+' '+L('Membuat garis…','Making lines…'); preview();
    try{ const src=T.src||await designSource(d);
      const res=await api('/api/lineart',{image_data:await shrinkDataURL(src,1536,.92), model:state.aiModel, size:T.res});
      T.line=res.data; storeLine(d, res.data); logGen(res.ms,true);
      toast(L(`Garis pola siap (${(res.ms/1000).toFixed(1)} dtk)`,`Line pattern ready (${(res.ms/1000).toFixed(1)} s)`));
    }catch(e){ toast(e.message,true); logGen(0,false); }
    finally{ T.busy=false; b.disabled=false; preview(); }
  });
  $('#tr-png',r).addEventListener('click',async()=>{
    const a=document.createElement('a'); a.download=`${dn(d)}-pola.png`;
    a.href = T.kind==='line' && T.sharp ? await sharpLinePNG(cur()) : cur(); a.click(); });
  $('#tr-print',r).addEventListener('click',()=>printPattern(d,area(T),cur(),{sharp:T.kind==='line'&&T.sharp}));
}
async function printPattern(d, T, src, {sharp=false}={}){
  const g=sheetGrid(T), n=g.cols*g.rows;
  if(n>150){ toast(L('Terlalu banyak lembar (maks 150). Perkecil ukuran kain, pakai A3, atau cetak 1 motif.','Too many sheets (max 150). Use a smaller cloth, A3, or print one repeat.'),true); return; }
  toast(L(`Menyiapkan ${n} lembar…`,`Preparing ${n} sheets…`));
  const img=await loadImg(src), ar=img.width/img.height, [PW,PH]=PAPERS[T.paper];
  const col=i=>String.fromCharCode(65+i), sheets=[];
  for(let j=0;j<g.rows;j++) for(let i=0;i<g.cols;i++){
    const x0=i*(g.pw-OVERLAP), y0=j*(g.ph-OVERLAP);
    const cv=document.createElement('canvas'); cv.width=Math.round(g.pw*PPC); cv.height=Math.round(g.ph*PPC);
    const c=cv.getContext('2d'); drawCloth(c,img,T,x0,y0,g.pw,g.ph,ar);
    if(sharp) sharpenLines(c,cv.width,cv.height);
    // overlap strips (glue here) and the cloth edge
    c.strokeStyle='#1C8BD6'; c.setLineDash([12,10]); c.lineWidth=2;
    if(i<g.cols-1){ const x=(g.pw-OVERLAP)*PPC; c.beginPath(); c.moveTo(x,0); c.lineTo(x,cv.height); c.stroke(); }
    if(j<g.rows-1){ const y=(g.ph-OVERLAP)*PPC; c.beginPath(); c.moveTo(0,y); c.lineTo(cv.width,y); c.stroke(); }
    c.setLineDash([]); c.strokeStyle='#999'; c.lineWidth=1.5; c.strokeRect(-x0*PPC,-y0*PPC,T.w*PPC,T.h*PPC);
    sheets.push({label:`${col(i)}${j+1}`, i, j, url:cv.toDataURL('image/jpeg',.9)});
  }
  // overview: the cloth with the sheet grid, plus a 5 cm bar to check the print scale
  const k=Math.min(900/T.w, 1050/T.h), ov=document.createElement('canvas'); ov.width=Math.round(T.w*k); ov.height=Math.round(T.h*k);
  const oc=ov.getContext('2d'); oc.save(); oc.scale(k/PPC,k/PPC); drawCloth(oc,img,T,0,0,T.w,T.h,ar); oc.restore();
  oc.strokeStyle='#B3262B'; oc.fillStyle='#B3262B'; oc.lineWidth=2; oc.font='700 22px Arial';
  sheets.forEach(s=>{ const x=s.i*(g.pw-OVERLAP)*k, y=s.j*(g.ph-OVERLAP)*k; oc.strokeRect(x,y,g.pw*k,g.ph*k); oc.fillText(s.label,x+8,y+28); });
  const shop=esc(shopInfo().name), title=esc(dn(d));
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${title} · pola</title><style>
    @page{size:${T.paper} portrait;margin:0} *{box-sizing:border-box;margin:0} body{font-family:Arial,sans-serif;color:#222}
    .pg{width:${PW}cm;height:${PH}cm;padding:${MARGIN}cm;position:relative;page-break-after:always;overflow:hidden}
    .pg img.s{width:${g.pw}cm;height:${g.ph}cm;display:block}
    .lb{position:absolute;top:.35cm;left:${MARGIN}cm;right:${MARGIN}cm;font-size:9pt;display:flex;justify-content:space-between}
    .lb b{font-size:12pt} .ov img{display:block;max-width:100%;max-height:15cm;border:1px solid #ccc;margin:.6cm 0} .bar{height:.35cm;width:5cm;background:#000;margin-top:.2cm}
    h1{font-size:18pt;margin-bottom:.2cm} p,li{font-size:10.5pt;line-height:1.45} ol{padding-left:.6cm}</style></head><body>
    <div class="pg ov"><h1>${L('Pola nyorek','Tracing pattern')}: ${title}</h1>
      <p>${shop} · ${L('kain','cloth')} ${T.w} × ${T.h} cm · ${n} ${L('lembar','sheets')} ${T.paper} (${g.cols} × ${g.rows})${T.full?'':` · ${L('motif diulang tiap','repeat every')} ${T.rep} cm`}</p>
      <img src="${ov.toDataURL('image/jpeg',.88)}">
      <ol><li>${L('Cetak dengan skala 100% / “Ukuran sebenarnya”. Ukur garis di bawah: harus tepat 5 cm.','Print at 100% / “Actual size”. Measure the bar below: it must be exactly 5 cm.')}</li>
        <li>${L('Susun lembar sesuai label (A1, B1, …). Garis biru putus-putus = bagian yang ditumpuk dan dilem.','Lay the sheets out by label (A1, B1, …). The blue dashed line marks the overlap to glue.')}</li>
        <li>${L('Letakkan kain di atas pola (di meja kaca / dekat jendela), lalu jiplak dengan pensil.','Put the cloth over the pattern (on a glass table / against a window) and trace it with a pencil.')}</li></ol>
      <div class="bar"></div><p>5 cm</p></div>
    ${sheets.map(s=>`<div class="pg"><div class="lb"><span>${title} · ${shop}</span><b>${s.label}</b><span>${L('kolom','col')} ${s.i+1}/${g.cols} · ${L('baris','row')} ${s.j+1}/${g.rows}</span></div><img class="s" src="${s.url}"></div>`).join('')}
    </body></html>`;
  const fr=document.createElement('iframe'); fr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(fr);
  fr.contentDocument.open(); fr.contentDocument.write(html); fr.contentDocument.close();
  await Promise.all([...fr.contentDocument.images].map(i=>i.decode().catch(()=>{})));
  try{ fr.contentWindow.focus(); fr.contentWindow.print(); }
  catch(e){ toast(L('Browser ini tidak bisa mencetak. Coba di Chrome.','This browser cannot print. Try Chrome.'),true); }
  setTimeout(()=>fr.remove(), 60000);
}
