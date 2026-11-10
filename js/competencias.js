/* ===== Competências da redação: estimativa feita pelo próprio aluno =====
   Só soma as notas que o aluno marca (0 a 10, de 0,5 em 0,5) e permite levar o valor para a calculadora.
   Não é correção: a nota real é dada pela banca. */
const COMP_IDS=["A","B","C","D","E"];
const f1=n=>n.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1});
let niveis={},estimativa=null;
const COMP_KEY="ssa-competencias-v1";
const salvarComp=()=>{try{if(Object.keys(niveis).length)localStorage.setItem(COMP_KEY,JSON.stringify(niveis));else localStorage.removeItem(COMP_KEY);}catch(e){}};
function restaurarComp(){
  try{
    const s=JSON.parse(localStorage.getItem(COMP_KEY)||"null");
    if(!s||typeof s!=="object")return;
    COMP_IDS.forEach(c=>{
      const b=document.querySelector(`#view-red button[data-c="${c}"][data-n="${s[c]}"]`); // só aceita notas que existem nos botões
      if(b){niveis[c]=+b.dataset.n;b.setAttribute("aria-pressed","true");}
    });
  }catch(e){}
}

function renderEstimativa(){
  const falta=COMP_IDS.filter(c=>niveis[c]==null);
  estimativa=falta.length?null:COMP_IDS.reduce((s,c)=>s+niveis[c],0);
  $("redUse").disabled=estimativa==null;
  $("redOut").innerHTML=estimativa==null
    ?`<div class="pending">Marque a nota de cada competência para ver sua estimativa (faltam: ${falta.join(", ")}).</div>`
    :`<div class="final"><span class="label">Sua estimativa</span><span class="big">${f1(estimativa)}</span><span class="hint">de 0 a 10 · simulação feita por você, não é uma correção</span></div>`;
}

$("view-red").addEventListener("click",e=>{
  const b=e.target.closest("button[data-c]");if(!b)return;
  const c=b.dataset.c,n=+b.dataset.n,ja=niveis[c]===n;
  document.querySelectorAll(`#view-red button[data-c="${c}"]`).forEach(x=>x.setAttribute("aria-pressed","false"));
  if(ja)delete niveis[c];else{niveis[c]=n;b.setAttribute("aria-pressed","true");}
  renderEstimativa();salvarComp();
});
$("redClear").addEventListener("click",()=>{
  niveis={};document.querySelectorAll("#view-red button[data-c]").forEach(x=>x.setAttribute("aria-pressed","false"));renderEstimativa();salvarComp();
});
$("redUse").addEventListener("click",()=>{
  if(estimativa==null)return;
  const eraExemplo=!$("sampleTag").hidden;
  if(eraExemplo){AREAS.forEach(a=>$(a.id).value="");["ssa1","ssa2"].forEach(k=>$(k).value="");}
  $("redacao").value=String(estimativa);
  $("sampleTag").hidden=true;calcular();
  location.hash="#calculadora";window.scrollTo(0,0);
  $("importToast").textContent=`Estimativa da redação importada (${f1(estimativa)}).`+(eraExemplo?" Agora informe os acertos e as notas do SSA 1 e SSA 2.":"");
});
restaurarComp();
renderEstimativa();
