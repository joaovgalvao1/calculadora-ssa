/* ===== Notas de corte (SSA 3/2026) ===== */
let CORTES=null; // montado a partir de data/cortes-ssa3-2026.json (ver montarCortes)

// Converte o JSON do levantamento (uma linha por etapa/curso/turno/entrada/modalidade)
// na estrutura usada pela aba: uma oferta por curso+campus+turno.
function montarCortes(d){
  const R=d.registros,V=d.vagas_por_bloco,F=d.resumo_final,mods=Object.keys(d.metadata.modalidades);
  const k=r=>`${r.curso}|${r.campus}|${r.turno}`;
  const chaves=[...new Set(R.map(k))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  const ofertas=chaves.map(ch=>{
    const [c,cp,t]=ch.split("|"),rr=R.filter(r=>k(r)===ch);
    const o={c,cp,t,cr:{},rem:{},remTot:[],fin:null};
    ["1ª","2ª"].forEach(ent=>{
      const x=rr.filter(r=>r.etapa==="Chamada Regular"&&r.entrada===ent);
      if(!x.length)return;
      const vg=V.find(v=>k(v)===ch&&v.etapa==="Chamada Regular"&&v.entrada===ent);
      o.cr[ent[0]]={v:vg?vg.total:x.reduce((s,r)=>s+r.quantidade,0),m:Object.fromEntries(x.map(r=>[r.modalidade,[r.corte,r.quantidade]]))};
    });
    for(let i=1;i<=10;i++){const v=V.find(v=>k(v)===ch&&v.etapa===`Remanejamento ${i}`);o.remTot.push(v?v.total:0);}
    mods.forEach(m=>{o.rem[m]=Array.from({length:10},(_,i)=>{const r=rr.find(r=>r.etapa===`Remanejamento ${i+1}`&&r.modalidade===m);return r?[r.corte,r.quantidade]:[null,0];});});
    const f=F.find(f=>k(f)===ch);
    o.fin={c:f?f.corte_final:{},t:f?f.total_remanejados:0};
    return o;
  });
  return {mods:d.metadata.modalidades,ofertas};
}
const MOD_CURTO={UNI:"Universal (ampla concorrência)",A1:"A1 · Escola pública, renda até 1 SM",A2:"A2 · Escola pública, qualquer renda",
  A3:"A3 · Escola pública, PPI, renda até 1 SM",A4:"A4 · Escola pública, PPI, qualquer renda"};
const modNome=m=>m==="UNI"?"Universal":m;
const ofKey=o=>`${o.c}|${o.cp}|${o.t}`;
let mediaCalc=null,mediaManual=false,selOf=null,selMod="UNI",cortesProntos=false;

function initCortes(){
  try{const s=JSON.parse(localStorage.getItem("ssa-cortes-sel")||"null");if(s){selOf=s.of;selMod=s.mod||"UNI";}}catch(e){}
  if(!CORTES.ofertas.some(o=>ofKey(o)===selOf))selOf=ofKey(CORTES.ofertas.find(o=>o.c==="Medicina"&&o.cp==="Santo Amaro")||CORTES.ofertas[0]);
  $("cCurso").innerHTML=CORTES.ofertas.map(o=>`<option value="${ofKey(o)}">${o.c} · ${o.cp} · ${o.t}</option>`).join("");
  $("cMod").innerHTML=Object.keys(CORTES.mods).map(m=>`<option value="${m}">${MOD_CURTO[m]||m}</option>`).join("");
  if(!CORTES.mods[selMod])selMod="UNI";
  $("cCurso").value=selOf;$("cMod").value=selMod;
  $("cCurso").addEventListener("change",e=>{selOf=e.target.value;salvarSel();renderCortes();});
  $("cMod").addEventListener("change",e=>{selMod=e.target.value;salvarSel();renderCortes();});
  $("cMedia").addEventListener("input",()=>{mediaManual=true;mediaHint();renderCortes();});
  $("cUseCalc").addEventListener("click",()=>{mediaManual=false;syncMedia();});
  const wrap=$("cChartWrap");
  document.addEventListener("click",e=>{if(!wrap.contains(e.target))esconderTip();});
  let rz;window.addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(renderCortes,150);});
  cortesProntos=true;
}
function salvarSel(){try{localStorage.setItem("ssa-cortes-sel",JSON.stringify({of:selOf,mod:selMod}));}catch(e){}}
function syncMedia(){
  if(!cortesProntos)return;
  if(!mediaManual)$("cMedia").value=mediaCalc==null?"":(Math.round(mediaCalc*100)/100).toFixed(2);
  mediaHint();renderCortes();
}
function mediaHint(){
  const ex=!$("sampleTag").hidden;
  $("cUseCalc").hidden=!(mediaManual&&mediaCalc!=null);
  $("cMediaHint").textContent=mediaManual?"Valor digitado por você."
    :mediaCalc!=null?(ex?"Vem da aba Calculadora, ainda com os dados de exemplo.":"Vem da aba Calculadora.")
    :"Preencha a Calculadora ou digite sua média aqui.";
}
function mediaUsada(){
  const raw=$("cMedia").value.trim().replace(",",".");
  if(raw==="")return null;
  const n=Number(raw);
  $("cMedia").classList.toggle("invalid",!(isFinite(n)&&n>=0&&n<=100));
  return isFinite(n)&&n>=0&&n<=100?Math.round(n*100)/100:null;
}
function situacao(m,c){
  if(c==null)return {cls:"na",t:"Sem convocados nesta modalidade",s:"Não há nota de corte para comparar."};
  if(m==null)return {cls:"na",t:"Informe sua média",s:"Digite sua média global para comparar."};
  const d=Math.round((m-c)*100)/100;
  return d>=0?{cls:"ok",t:"✓ Você passaria",s:`+${fmt(d)} acima do corte`}:{cls:"no",t:"✗ Abaixo do corte",s:`Faltam ${fmt(-d)} pontos`};
}
const stHTML=st=>`<div class="status ${st.cls}">${st.t}<small>${st.s}</small></div>`;

function renderCortes(){
  if(!cortesProntos||$("view-cortes").hidden)return;
  const o=CORTES.ofertas.find(x=>ofKey(x)===selOf),m=selMod,media=mediaUsada();
  $("cModDesc").textContent=CORTES.mods[m];
  // chamada regular
  $("cEntries").innerHTML=["1","2"].map(e=>{
    const b=o.cr[e];
    if(!b)return `<article class="entry"><div class="entry-h"><strong>${e}ª entrada</strong></div><p class="empty">Este curso não teve oferta de ${e}ª entrada no SSA 2026.</p></article>`;
    const [c,q]=b.m[m]||[null,0];
    return `<article class="entry">
      <div class="entry-h"><strong>${e}ª entrada</strong><span class="num">${b.v} vagas</span></div>
      <div class="cut"><span class="lbl">Nota de corte</span><span class="v">${c==null?"—":fmt(c)}</span></div>
      <span class="meta">${q} ${q===1?"classificado":"classificados"} na modalidade ${modNome(m)}</span>
      ${stHTML(situacao(media,c))}</article>`;
  }).join("");
  renderChart(o,m,media);
  // corte final
  const cf=o.fin.c[m],totMod=o.rem[m].reduce((s,x)=>s+x[1],0);
  $("cFinal").innerHTML=`<span class="lbl">Corte final 2026</span>
    <span class="v">${cf==null?"—":fmt(cf)}</span>
    <p>Menor nota convocada até o 10º remanejamento, na modalidade ${modNome(m)}.</p>
    ${stHTML(situacao(media,cf))}
    <div class="tot"><span>Remanejados (${modNome(m)})</span><span class="num">${totMod}</span></div>
    <div class="tot"><span>Remanejados no curso</span><span class="num">${o.fin.t}</span></div>`;
}

function renderChart(o,m,media){
  const arr=o.rem[m],W=Math.round(Math.max(300,Math.min(720,$("cChartWrap").clientWidth||560))),H=240,pl=34,pr=6,pt=20,pb=28,ih=H-pt-pb,cw=(W-pl-pr)/10,bw=cw*.58;
  const maxQ=Math.max(1,...arr.map(x=>x[1]));
  const step=maxQ<=5?1:maxQ<=10?2:maxQ<=25?5:10,top=Math.ceil(maxQ/step)*step;
  const y=v=>pt+ih-(v/top)*ih;
  let g='<g class="gl">';
  for(let t=0;t<=top;t+=step)g+=`<line x1="${pl}" x2="${W-pr}" y1="${y(t)}" y2="${y(t)}"/><text class="axis" x="${pl-8}" y="${y(t)+4}" text-anchor="end">${t}</text>`;
  g+="</g>";
  const bars=arr.map(([c,q],i)=>{
    const cx=pl+cw*i+cw/2,h=q?Math.max(2,(q/top)*ih):2,pass=c!=null&&media!=null&&media>=c;
    return `<g class="bar${pass?" pass":""}" data-i="${i}" tabindex="0" role="button" aria-label="${i+1}º remanejamento: ${q} remanejados, corte ${c==null?"sem convocados":fmt(c)}">
      <rect class="hit" x="${cx-cw/2+2}" y="${pt}" width="${cw-4}" height="${ih}" rx="6"/>
      <rect class="bk" x="${cx-bw/2}" y="${pt+ih-h}" width="${bw}" height="${h}" rx="3"/>
      <text class="val" x="${cx}" y="${pt+ih-h-6}" text-anchor="middle">${q}</text>
      <text class="axis" x="${cx}" y="${H-8}" text-anchor="middle">${i+1}º</text></g>`;
  }).join("");
  const svg=$("cChart");
  svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
  svg.innerHTML=g+bars;
  svg.setAttribute("aria-label",`Remanejados por fase na modalidade ${modNome(m)}`);
  esconderTip();
  svg.querySelectorAll(".bar").forEach(el=>{
    const i=+el.dataset.i,show=()=>mostrarTip(o,m,media,i,el);
    el.addEventListener("pointerenter",e=>{if(e.pointerType==="mouse")show();});
    el.addEventListener("pointerleave",e=>{if(e.pointerType==="mouse")esconderTip();});
    el.addEventListener("focus",show);el.addEventListener("blur",esconderTip);
    el.addEventListener("click",e=>{e.stopPropagation();show();});
    el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();show();}});
  });
}
function mostrarTip(o,m,media,i,el){
  const [c,q]=o.rem[m][i],tip=$("cTip"),st=situacao(media,c);
  document.querySelectorAll("#cChart .bar.on").forEach(b=>b.classList.remove("on"));el.classList.add("on");
  tip.innerHTML=`<strong>${i+1}º remanejamento · SSA 2026</strong>
    ${q} ${q===1?"remanejado":"remanejados"} em ${modNome(m)} · ${o.remTot[i]} na fase
    <span class="tc">Corte: ${c==null?"—":fmt(c)}</span>${c==null?"Sem convocados nesta modalidade.":st.t+" · "+st.s}`;
  tip.hidden=false;
  const wrap=$("cChartWrap").getBoundingClientRect(),r=el.querySelector("rect.bk").getBoundingClientRect();
  let left=r.left-wrap.left+r.width/2-tip.offsetWidth/2;
  left=Math.max(0,Math.min(left,wrap.width-tip.offsetWidth));
  let topPx=r.top-wrap.top-tip.offsetHeight-10;
  tip.style.left=left+"px";tip.style.top=topPx+"px";
}
function esconderTip(){const t=$("cTip");if(t)t.hidden=true;document.querySelectorAll("#cChart .bar.on").forEach(b=>b.classList.remove("on"));}
