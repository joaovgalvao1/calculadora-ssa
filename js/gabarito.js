/* ===== Correção do gabarito (preliminar SSA 3 2027) — "*" = anulada ===== */
let KEYS=null; // carregado de data/gabarito-ssa3-2027.json (ver main.js)
const GAREAS=[{id:"ling",dia:1,start:1},{id:"hum",dia:1,start:24},{id:"mat",dia:2,start:1},{id:"nat",dia:2,start:24}];
const CURTO={ling:"Linguagens",hum:"Humanas",mat:"Matemática",nat:"Natureza"};
let lang="ing",marks={};
try{const s=JSON.parse(localStorage.getItem("ssa3-2027-gabarito")||"null");if(s){marks=s.marks||{};lang=s.lang==="esp"?"esp":"ing";}}catch(e){}
const salvar=()=>{try{localStorage.setItem("ssa3-2027-gabarito",JSON.stringify({marks,lang}));}catch(e){}};
const keyOf=id=>id==="ling"?KEYS.d1+KEYS[lang]:KEYS[id];
const nomeArea=id=>AREAS.find(a=>a.id===id).nome;
const contar=id=>[...keyOf(id)].reduce((c,k,i)=>c+((k==="*"||marks[`${id}-${i}`]===k)?1:0),0);

function renderGab(){
  $("days").innerHTML=[1,2].map(d=>`<div class="day"><h3>${d}º dia</h3>${
    GAREAS.filter(g=>g.dia===d).map(g=>`<div class="group">
      <div class="area-head"><strong>${nomeArea(g.id)}</strong><span class="num" id="c-${g.id}"></span></div>
      <div class="qs">${[...keyOf(g.id)].map((_,i)=>{const n=g.start+i;
        const lab=g.id==="ling"&&n>=18?`<span class="sub">${lang==="ing"?"ING":"ESP"}</span>`:"";
        return `<div class="q" id="q-${g.id}-${i}"><span class="n">${String(n).padStart(2,"0")}${lab}</span>
          <div class="bubbles" role="group" aria-label="Questão ${n} de ${CURTO[g.id]}">${[..."ABCDE"].map(l=>
            `<button type="button" class="b" data-a="${g.id}" data-i="${i}" data-l="${l}" aria-label="Alternativa ${l}">${l}</button>`).join("")}</div>
          <span class="st"></span></div>`;}).join("")}</div></div>`).join("")}</div>`).join("");
  GAREAS.forEach(g=>[...keyOf(g.id)].forEach((_,i)=>pintar(g.id,i)));
  atualizarContagem();
}
function pintar(a,i){
  const row=$(`q-${a}-${i}`),key=keyOf(a)[i],m=marks[`${a}-${i}`];
  row.className="q"+(key==="*"?" nula":m?(m===key?" ok":" bad"):"");
  row.querySelectorAll(".b").forEach(b=>{const l=b.dataset.l;
    b.classList.toggle("sel",l===m);b.classList.toggle("key",l===key);
    b.setAttribute("aria-pressed",String(l===m));b.disabled=key==="*";});
  row.querySelector(".st").textContent=key==="*"?"Anulada":!m?"":m===key?"✓ certa":`✗ era ${key}`;
}
function atualizarContagem(){
  GAREAS.forEach(g=>$(`c-${g.id}`).textContent=`${contar(g.id)}/${keyOf(g.id).length} acertos`);
  $("counts").innerHTML=GAREAS.map(g=>`<span>${CURTO[g.id]} <b>${contar(g.id)}</b></span>`).join("");
}
$("days").addEventListener("click",e=>{
  const b=e.target.closest(".b");if(!b||b.disabled)return;
  const k=`${b.dataset.a}-${b.dataset.i}`;
  if(marks[k]===b.dataset.l)delete marks[k];else marks[k]=b.dataset.l;
  pintar(b.dataset.a,+b.dataset.i);atualizarContagem();salvar();
});
function langUI(){document.querySelectorAll("#lang button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.lang===lang)));}
$("lang").addEventListener("click",e=>{const b=e.target.closest("button");if(!b||b.dataset.lang===lang)return;
  lang=b.dataset.lang;langUI();renderGab();salvar();});
let limparPendente=null;
$("gabClear").addEventListener("click",()=>{
  const btn=$("gabClear");
  if(!limparPendente){btn.textContent="Confirmar limpeza";limparPendente=setTimeout(()=>{btn.textContent="Limpar marcações";limparPendente=null;},4000);return;}
  clearTimeout(limparPendente);limparPendente=null;btn.textContent="Limpar marcações";
  marks={};renderGab();salvar();
});
$("send").addEventListener("click",()=>{
  const eraExemplo=!$("sampleTag").hidden;
  GAREAS.forEach(g=>$(g.id).value=contar(g.id));
  if(eraExemplo)["redacao","ssa1","ssa2"].forEach(k=>$(k).value="");
  $("sampleTag").hidden=true;calcular();
  location.hash="#calculadora";window.scrollTo(0,0);
  $("importToast").textContent="Acertos importados da correção do gabarito."+(eraExemplo?" Agora informe a redação e as notas do SSA 1 e SSA 2.":"");
});
