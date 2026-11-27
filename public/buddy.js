/* =====================================================================
   Tanya Canting: a floating design discussion friend (Gemini + Google Search)
   Lives outside #app so it survives page changes. Chat history stays in this browser.
   ===================================================================== */
const BUD = {open:false, busy:false, msgs:[], withDesign:true, auto:false};
try{ BUD.msgs = JSON.parse(localStorage.getItem('canting-buddy')||'[]').slice(-30); }catch(e){ BUD.msgs = []; }
try{ BUD.auto = localStorage.getItem('canting-buddy-auto')==='1'; }catch(e){}
BUD.msgs.forEach(m=>(m.actions||[]).forEach(a=>{ if(a.applied==='running') a.applied='failed'; delete a.prevVi; }));
const budSave = () => { try{ localStorage.setItem('canting-buddy', JSON.stringify(BUD.msgs.slice(-30))); }catch(e){} };

const BUD_DESIGN_PAGES = ['editor','mockup','watermark'];
const budDesign = () => BUD_DESIGN_PAGES.includes(route) && state.current ? state.current : null;
const budMd = s => esc(s)
  .replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')
  .replace(/^\s*[*-]\s+/gm,'• ')
  .replace(/\*([^*\n]+)\*/g,'<i>$1</i>')
  .replace(/\n/g,'<br>');

function budStarters(){
  return budDesign()
    ? [L('Apa pendapatmu tentang desain ini?','What do you think of this design?'), L('Cocok untuk produk apa?','What product does it suit?'), L('Warna apa yang lebih pas?','Which colours would work better?')]
    : [L('Ide motif untuk seragam kantor','Motif ideas for an office uniform'), L('Apa makna motif Parang?','What does the Parang motif mean?'), L('Tren batik yang lagi ramai?','What batik trends are popular now?')];
}

function budMsgHTML(m, i){
  if(m.role==='user') return `<div class="msg me"><p>${esc(m.text)}</p></div>`;
  const acts = (m.actions||[]).map((a,k)=>{
    const id=`${i}:${k}`;
    if(a.type==='studio') return `<button class="btn primary sm" data-bact="${id}" title="${esc(a.text)}">${ico('sparkle',14)} ${L('Coba di Studio','Try in Studio')}</button>`;
    if(a.applied==='running') return `<span class="bud-st run">${ico('clock',14)} ${L('Canting sedang mengedit…','Canting is editing…')}</span>`;
    if(a.applied==='done') return `<span class="bud-st ok" title="${esc(a.text)}">${ico('check',14)} ${a.auto?L('Diedit otomatis','Edited automatically'):L('Edit diterapkan','Edit applied')}</span>`
      + (a.undone ? `<span class="bud-st">${ico('undo',14)} ${L('Dibatalkan','Undone')}</span>`
        : a.prevVi!=null ? `<button class="btn ghost sm" data-bundo="${id}">${ico('undo',14)} ${L('Batalkan','Undo')}</button>` : '');
    return `<button class="btn ghost sm" data-bact="${id}" title="${esc(a.text)}">${ico('wand',14)} ${a.applied==='failed'?L('Coba terapkan lagi','Try applying again'):L('Terapkan sebagai edit','Apply as edit')}</button>`;
  }).join('');
  const what = (m.actions||[]).find(a=>a.type==='edit' && a.applied);
  const editNote = what ? `<div class="bud-edit">${L('Perintah edit','Edit instruction')}: “${esc(what.text)}”</div>` : '';
  return `<div class="msg ai"><p>${budMd(m.text)}</p>${editNote}${acts?`<div class="bud-acts">${acts}</div>`:''}${typeof sourcesHTML==='function'?sourcesHTML(m.grounding):''}</div>`;
}

function budRender(scroll){
  const el=$('#bud'); if(!el) return;
  const keep=$('#bud-in')?.value||'';
  if(!BUD.open){
    el.innerHTML=`<button class="bud-fab" id="bud-fab" aria-label="${L('Buka Tanya Canting','Open Tanya Canting')}">${ico('chat',20)}<span>${L('Tanya Canting','Ask Canting')}</span></button>`;
    $('#bud-fab').addEventListener('click',()=>{ BUD.open=true; budRender(true); setTimeout(()=>$('#bud-in')?.focus(),50); });
    return;
  }
  const d=budDesign(), mock=aiMode()==='mock';
  el.innerHTML=`<section class="bud-panel" role="dialog" aria-label="Tanya Canting">
    <header><div class="bud-av">${logoMark(26)}</div><div><b>Tanya Canting</b><small>${L('Teman diskusi desain','Design discussion friend')}${mock?' · mock':''}</small></div><div class="sp"></div>
      <button class="bud-ib" id="bud-new" title="${L('Obrolan baru','New chat')}" aria-label="${L('Obrolan baru','New chat')}">${ico('refresh',16)}</button>
      <button class="bud-ib" id="bud-x" aria-label="${L('Tutup','Close')}">×</button></header>
    <div class="bud-thread" id="bud-thread">
      <div class="msg ai"><p>${L('Halo Kak! 👋 Mau ngobrolin ide motif, minta pendapat soal desain, atau tanya makna motif? Aku bisa cari referensi di Google juga.','Hi! 👋 Want to talk through motif ideas, get feedback on a design, or ask what a motif means? I can look things up on Google too.')}</p></div>
      ${BUD.msgs.map(budMsgHTML).join('')}
      ${BUD.busy?`<div class="msg ai typing"><p><i></i><i></i><i></i></p></div>`:''}
    </div>
    ${!BUD.msgs.length && !BUD.busy ? `<div class="bud-sugg">${budStarters().map(s=>`<button class="chip" data-bs="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}
    <footer>
      ${d?`<label class="bud-ctx"><input type="checkbox" id="bud-wd" ${BUD.withDesign?'checked':''}> ${ico('layers',14)} ${L('Sertakan desain','Include design')}: <b>${esc(dn(d))}</b></label>`:''}
      <label class="bud-ctx bud-auto ${BUD.auto?'on':''}" title="${L('Kalau aktif, Canting langsung menerapkan edit yang ia usulkan ke desain yang terbuka. Selalu bisa dibatalkan.','When on, Canting applies the edits it proposes to the open design by itself. You can always undo.')}"><input type="checkbox" id="bud-auto" ${BUD.auto?'checked':''}> ${ico('wand',14)} ${L('Izinkan Canting mengedit langsung','Let Canting edit directly')}${BUD.auto?` <i>${L('aktif','on')}</i>`:''}</label>
      <div class="bud-row"><textarea id="bud-in" rows="1" placeholder="${L('Tulis pesan…','Type a message…')}"></textarea>
        <button class="btn primary sm" id="bud-send" ${BUD.busy?'disabled':''} aria-label="${L('Kirim','Send')}">${ico('send',16)}</button></div>
    </footer></section>`;
  const inp=$('#bud-in'); inp.value=keep;
  const grow=()=>{ inp.style.height='40px'; if(inp.scrollHeight>40) inp.style.height=Math.min(120,inp.scrollHeight)+'px'; }; grow();
  inp.addEventListener('input',grow);
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); budSend(inp.value); } });
  $('#bud-send').addEventListener('click',()=>budSend(inp.value));
  $('#bud-x').addEventListener('click',()=>{ BUD.open=false; budRender(); });
  $('#bud-new').addEventListener('click',()=>{ if(BUD.busy) return; BUD.msgs=[]; budSave(); budRender(); });
  $('#bud-wd')?.addEventListener('change',e=>{ BUD.withDesign=e.target.checked; });
  $('#bud-auto').addEventListener('change',e=>{ BUD.auto=e.target.checked; try{ localStorage.setItem('canting-buddy-auto',BUD.auto?'1':'0'); }catch(err){}
    toast(BUD.auto?L('Canting boleh mengedit langsung. Setiap edit bisa dibatalkan.','Canting may now edit directly. Every edit can be undone.'):L('Canting hanya mengusulkan edit; kamu yang menekan Terapkan.','Canting only suggests edits; you press Apply.'));
    budRender(); });
  $$('[data-bundo]',el).forEach(b=>b.addEventListener('click',()=>{ const [i,k]=b.dataset.bundo.split(':').map(Number); budUndo(BUD.msgs[i].actions[k]); }));
  $$('[data-bs]',el).forEach(b=>b.addEventListener('click',()=>budSend(b.dataset.bs)));
  $$('[data-bact]',el).forEach(b=>b.addEventListener('click',()=>{ const [i,k]=b.dataset.bact.split(':').map(Number); budAction(BUD.msgs[i].actions[k], false); }));
  if(scroll){ const t=$('#bud-thread'); t.scrollTop=t.scrollHeight; }
}

async function budSend(text){
  text=(text||'').trim(); if(!text || BUD.busy) return;
  BUD.msgs.push({role:'user', text}); BUD.busy=true;
  const inp=$('#bud-in'); if(inp) inp.value='';
  budRender(true);
  const d=budDesign(), ctx={page:route, auto_edit:!!(BUD.auto && d && BUD.withDesign)};
  if(d && BUD.withDesign){
    ctx.design_name=dn(d);
    const t=tplById(d.template_id); if(t) ctx.motif=t.name;
    try{ ctx.design_image=await shrinkDataURL(await designSource(d), 768, .85); }catch(e){}
  }
  try{
    const r=await api('/api/buddy',{messages:BUD.msgs.slice(-20).map(m=>({role:m.role, text:m.text})), context:ctx, lang, shop:UMKM});
    BUD.msgs.push({role:'model', text:r.reply, actions:r.actions||[], grounding:r.grounding||null});
  }catch(e){
    toast(e.message,true); BUD.msgs.pop();
    BUD.busy=false; budRender(true); const i2=$('#bud-in'); if(i2) i2.value=text; return;
  }
  BUD.busy=false; budSave(); budRender(true);
  const edit=(BUD.msgs.at(-1).actions||[]).find(a=>a.type==='edit');
  if(edit && ctx.auto_edit) budAction(edit, true);
}

function budAction(a, auto){
  if(!a) return;
  if(a.type==='studio'){
    Object.assign(state.studio,{prompt:a.text});
    nav('studio');
    toast(L('Deskripsi diisi di Studio. Atur pilihan lalu tekan Generate.','Description filled in the Studio. Adjust the options, then press Generate.'));
    return;
  }
  if(a.type==='edit') budApplyEdit(a, auto);
}

/* run an edit on the open design (by the user's click, or automatically when allowed); remember the version to undo to */
async function budApplyEdit(a, auto){
  const d0=budDesign()||state.current;
  if(!d0){ toast(L('Buka desain dulu di Editor.','Open a design in the Editor first.'),true); return; }
  if(typeof ed!=='undefined' && ed.busy){ toast(L('Editor masih mengerjakan edit lain.','The Editor is still busy with another edit.'),true); return; }
  if(route!=='editor') openEditor(d0);
  const d=state.current, before=d.image, prevVi=d.vi??0, key=d.id||dn(d);
  a.applied='running'; a.auto=!!auto; delete a.undone; budRender(true);
  const t=$('#ai-text'); if(t) t.value=a.text;
  await aiEdit(a.text);
  const cur=state.current, ok=cur && cur.image && cur.image!==before;
  a.applied = ok ? 'done' : 'failed';
  if(ok){ a.prevVi=prevVi; a.key=key; }
  budSave(); budRender(true);
}
function budUndo(a){
  const d=state.current;
  if(!d || a.prevVi==null || (d.id||dn(d))!==a.key || !d.versions || !d.versions[a.prevVi]){
    toast(L('Tidak bisa dibatalkan dari sini lagi. Pakai riwayat versi di Editor.','Can’t undo from here any more. Use the version history in the Editor.'),true); return; }
  const v=d.versions[a.prevVi];
  d.vi=a.prevVi; d.image=v.image; if(v.w){ d.w=v.w; d.h=v.h; }
  a.undone=true; budSave();
  if(route==='editor') go(); else budRender();
  toast(L('Edit dibatalkan. Versi sebelumnya dipulihkan.','Edit undone. The previous version is back.'));
}

function buddySync(){
  let el=$('#bud');
  if(!el){ el=document.createElement('div'); el.id='bud'; document.body.appendChild(el); }
  el.hidden = !!(pages[route] && pages[route].public);
  budRender();
}
