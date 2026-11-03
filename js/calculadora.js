/* ===== Calculadora: acertos, redação, SSA 1/2/3 e média global ===== */
const AREAS=[
  {id:"ling",nome:"Linguagens e suas Tecnologias",total:23,base:4.52,inc:4.34},
  {id:"hum",nome:"Ciências Humanas e Sociais Aplicadas",total:22,base:4.66,inc:4.54},
  {id:"mat",nome:"Matemática e suas Tecnologias",total:23,base:4.52,inc:4.34},
  {id:"nat",nome:"Ciências da Natureza e suas Tecnologias",total:27,base:3.80,inc:3.70}
];
const EXEMPLO={ling:17,hum:15,mat:14,nat:18,redacao:8,ssa1:68.5,ssa2:71.2};
const notaArea=(a,ac)=>ac===0?0:a.base+(ac-1)*a.inc;

// monta as linhas das áreas
$("areas").innerHTML=AREAS.map(a=>`
  <div class="row" data-row="${a.id}">
    <label for="${a.id}">${a.nome}<span class="sub">${a.total} questões</span></label>
    <div class="stepper">
      <button type="button" data-step="-1" data-for="${a.id}" aria-label="Diminuir acertos">−</button>
      <input type="number" id="${a.id}" inputmode="numeric" min="0" max="${a.total}" step="1">
      <button type="button" data-step="1" data-for="${a.id}" aria-label="Aumentar acertos">+</button>
    </div>
  </div>`).join("");

document.querySelectorAll("[data-step]").forEach(b=>b.addEventListener("click",()=>{
  const inp=$(b.dataset.for),max=+inp.max;
  let v=inp.value===""?0:parseInt(inp.value,10)||0;
  v=Math.min(max,Math.max(0,v+ +b.dataset.step));
  inp.value=v;onEdit();
}));

function setErr(el,msg){
  const row=el.closest(".row");
  el.classList.toggle("invalid",!!msg);
  let e=row.querySelector(".err");
  if(msg){ if(!e){e=document.createElement("div");e.className="err";row.appendChild(e);} e.textContent=msg; }
  else if(e) e.remove();
}

function lerArea(a){
  const el=$(a.id),raw=el.value.trim();
  if(raw===""){setErr(el,"");return {vazio:true};}
  const v=Number(raw);
  if(!Number.isInteger(v)||v<0||v>a.total){setErr(el,`Informe um número inteiro de 0 a ${a.total}.`);return {erro:true};}
  setErr(el,"");return {v};
}
function lerNota(id,max){
  const el=$(id),raw=el.value.trim().replace(",",".");
  if(raw===""){setErr(el,"");return {vazio:true};}
  const v=Number(raw);
  if(!isFinite(v)||v<0||(max!=null&&v>max)){setErr(el,max!=null?`Informe uma nota de 0 a ${max}.`:"Informe uma nota maior ou igual a 0.");return {erro:true};}
  setErr(el,"");return {v};
}

function calcular(){
  const ac=AREAS.map(lerArea);
  const red=lerArea({id:"redacao",total:10}),ssa1=lerNota("ssa1",null),ssa2=lerNota("ssa2",null);
  const faltando=[];
  AREAS.forEach((a,i)=>{if(ac[i].vazio)faltando.push(`acertos em ${a.nome}`)});
  if(red.vazio)faltando.push("nota da redação");
  if(ssa1.vazio)faltando.push("nota do SSA 1");
  if(ssa2.vazio)faltando.push("nota do SSA 2");
  const temErro=[...ac,red,ssa1,ssa2].some(x=>x.erro);

  if(temErro||faltando.length){
    const msg=temErro?"Corrija os campos destacados para ver o cálculo."
      :`Para calcular, informe: ${faltando.join(", ")}.`;
    $("out").innerHTML=`<div class="pending">${msg}</div>`;
    $("copy").disabled=true;mediaCalc=null;syncMedia();return;
  }
  $("copy").disabled=false;

  const notas=AREAS.map((a,i)=>notaArea(a,ac[i].v));
  const mas=notas.reduce((s,n)=>s+n,0)/4;
  const npr=red.v*10;
  const ssa3=((mas*7.5)+(npr*2.5))/10;
  const media=((ssa1.v*3)+(ssa2.v*3)+(ssa3*4))/10;
  mediaCalc=media;syncMedia();

  const fases=[{n:"SSA 1",v:ssa1.v,p:3,c:"s1"},{n:"SSA 2",v:ssa2.v,p:3,c:"s2"},{n:"SSA 3",v:ssa3,p:4,c:"s3"}];
  const pct=v=>Math.max(0,Math.min(100,v));
  $("out").innerHTML=`
    <div class="r-hero">
      <span class="r-label">Média global acumulada</span>
      <span class="r-big">${fmt(media)}</span>
      <div class="comp" role="img" aria-label="Composição da média: ${fases.map(f=>`${f.n} contribui ${fmt(f.v*f.p/10)}`).join(", ")}">
        ${fases.map(f=>`<span class="seg ${f.c}" style="width:${pct(f.v*f.p/10)}%"></span>`).join("")}
      </div>
      <span class="r-cap">Cada fase entra com seu peso: SSA 1 e SSA 2 valem 30% cada, SSA 3 vale 40%.</span>
    </div>
    <div class="phases">
      ${fases.map(f=>`<div class="ph">
        <span class="ph-n"><i class="dot ${f.c}"></i>${f.n}</span>
        <span class="ph-v">${fmt(f.v)}</span>
        <span class="ph-c">peso ${f.p} · +${fmt(f.v*f.p/10)}</span>
      </div>`).join("")}
    </div>
    <div class="r-detail">
      <div class="r-dh"><strong>Composição do SSA 3</strong><span class="num">${fmt(ssa3)}</span></div>
      ${AREAS.map((a,i)=>`<div class="ar">
        <div class="ar-top"><span class="ar-n">${a.nome}</span><span class="num">${fmt(notas[i])}</span></div>
        <div class="meter"><span style="width:${pct(notas[i])}%"></span></div>
        <span class="ar-s">${ac[i].v} de ${a.total} acertos</span>
      </div>`).join("")}
      <div class="ar">
        <div class="ar-top"><span class="ar-n">Redação</span><span class="num">${npr}</span></div>
        <div class="meter"><span style="width:${pct(npr)}%"></span></div>
        <span class="ar-s">Nota ${red.v} de 10, convertida para 0 a 100</span>
      </div>
      <div class="r-sum">
        <div><span>Média das provas (MAS)</span><span class="num">${fmt(mas)} <small>× 75%</small></span></div>
        <div><span>Redação ponderada (NPR)</span><span class="num">${npr} <small>× 25%</small></span></div>
      </div>
    </div>`;
}

function preencher(d){
  AREAS.forEach(a=>$(a.id).value=d?d[a.id]:"");
  ["redacao","ssa1","ssa2"].forEach(k=>$(k).value=d?d[k]:"");
  $("sampleTag").hidden=!d; calcular();
}
function onEdit(){ $("sampleTag").hidden=true; calcular(); }
document.querySelectorAll("#view-calc input").forEach(i=>i.addEventListener("input",onEdit));
$("clear").addEventListener("click",()=>{preencher(null);$("ling").focus();});
$("example").addEventListener("click",()=>preencher(EXEMPLO));
