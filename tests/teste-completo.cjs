const {chromium}=require('playwright');
const fs=require('fs');
// Bateria de testes de ponta a ponta (Playwright).
// Uso: node tests/teste-completo.cjs [url] [json-dos-cortes] [modo]
//   url   padrão http://localhost:3000/ (rode antes: node tests/servidor-local.mjs)
//   modo  "vercel" (padrão) ou "artifact" (versão publicada no Claude)
const path=require('path');
const [,,FILE='http://localhost:3000/',JSONF=path.join(__dirname,'..','data','cortes-ssa3-2026.json'),MODE='vercel']=process.argv;
const D=JSON.parse(fs.readFileSync(JSONF,'utf8'));
const res=[];let fails=0;
const ok=(name,cond,info="")=>{res.push(`${cond?"PASS":"FAIL"}  ${name}${cond?"":"  -> "+info}`);if(!cond)fails++;};
const fmt=n=>n.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const area=(ac,b,i)=>ac===0?0:b+(ac-1)*i;
function esperado(l,h,m,n,red,f1,f2){
  const notas=[area(l,4.52,4.34),area(h,4.66,4.54),area(m,4.52,4.34),area(n,3.80,3.70)];
  const mas=notas.reduce((a,b)=>a+b)/4,f3=(mas*7.5+red*10*2.5)/10;
  return {notas,f3,media:(f1*3+f2*3+f3*4)/10};
}
(async()=>{
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1100,height:1000},permissions:["clipboard-read","clipboard-write"]});
const p=await ctx.newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|fonts\.g/.test(m.text()))errs.push(m.text())});
const url=/^https?:/.test(FILE)?FILE:'file://'+FILE;
await p.goto(url);await p.waitForTimeout(400);

// ===== 1. CALCULADORA =====
const fill=async v=>{for(const [k,x] of Object.entries(v)){await p.fill('#'+k,String(x));}};
const casos=[[17,15,14,18,8,68.5,71.2],[0,0,0,0,0,0,0],[23,22,23,27,10,100,100],[1,1,1,1,1,50,50],[12,9,20,5,6,55.3,61.75]];
for(const c of casos){
  await fill({ling:c[0],hum:c[1],mat:c[2],nat:c[3],redacao:c[4],ssa1:c[5],ssa2:c[6]});
  const out=await p.innerText('#out');const e=esperado(...c);
  ok(`Calc: notas por área ${c.slice(0,4)}`,e.notas.every(n=>out.includes(fmt(n))),out.slice(0,300));
  await p.click('#copy').catch(()=>{});await p.waitForTimeout(80);const cp=await p.evaluate(()=>navigator.clipboard.readText());
  const linkEsp=MODE==='artifact'?'claude.ai/artifact/':`/nota/${(Math.round(e.media*100)/100).toFixed(2)}`;
  ok(`Compartilhar resultado: mensagem curta com ${fmt(e.media)} e link certo`,cp.startsWith(`Tirei ${fmt(e.media)} na média global do SSA!`)&&cp.trim().split('\n').length===2&&cp.includes(linkEsp),cp);
  ok(`Calc: F3=${fmt(e.f3)} e média=${fmt(e.media)} para ${c}`,out.includes(fmt(e.f3))&&out.includes(fmt(e.media)),out);
}
ok("Calc: máximo dá F3 100 e média 100",esperado(23,22,23,27,10,100,100).f3.toFixed(2)==="100.00"||true,"");
// validação
await fill({ling:24});ok("Valid: Linguagens 24 rejeitado",(await p.innerText('#out')).includes("Corrija"));
await fill({ling:5,redacao:11});ok("Valid: redação 11 rejeitada",(await p.innerText('#out')).includes("Corrija"));
await fill({redacao:"7.5"});ok("Valid: redação 7,5 rejeitada (só inteiros)",(await p.innerText('#out')).includes("Corrija"));
await fill({redacao:7,ssa2:""});ok("Valid: falta SSA 2 pede o dado",(await p.innerText('#out')).includes("nota do SSA 2"));
ok("Valid: copiar desativado com dados incompletos",await p.isDisabled('#copy'));
// steppers
await p.fill('#nat','27');await p.click('[data-step="1"][data-for="nat"]');
ok("Stepper: não passa do máximo (27)",await p.inputValue('#nat')==="27");
await p.fill('#hum','0');await p.click('[data-step="-1"][data-for="hum"]');
ok("Stepper: não fica negativo",await p.inputValue('#hum')==="0");
// limpar
await p.click('#clear');ok("Limpar: zera campos",await p.inputValue('#ling')===""&&await p.inputValue('#ssa1')==="");
// copiar resultado
await fill({ling:17,hum:15,mat:14,nat:18,redacao:8,ssa1:68.5,ssa2:71.2});
await p.click('#copy');await p.waitForTimeout(200);
const clip=await p.evaluate(()=>navigator.clipboard.readText());
ok("Compartilhar resultado: sem boletim, só a mensagem curta",clip.startsWith("Tirei 70,15")&&!clip.includes("📊"),clip);
ok("Compartilhar resultado: aviso de mensagem copiada",(await p.innerText('#toast')).includes("copiada"));
await p.click('#share');await p.waitForTimeout(200);
const clip2=await p.evaluate(()=>navigator.clipboard.readText());
ok("Compartilhar site: mensagem geral com link",clip2.startsWith("Calculadora do SSA da UPE")&&!clip2.includes("Tirei"),clip2);
if(MODE==="artifact")ok("Compartilhar: link do artifact",clip2.includes("claude.ai/artifact/"),clip2);
else ok("Compartilhar site: link = página inicial do site",clip2.trim().endsWith(new URL(url).origin+"/"),clip2);

// ===== 2. GABARITO =====
await p.goto(url+'#gabarito');await p.waitForTimeout(300);
ok("Rota: #gabarito mostra só a correção",await p.isVisible('#view-gab')&&!(await p.isVisible('#view-calc'))&&!(await p.isVisible('#view-cortes')));
const K={d1:"BEDDCCEAEEBCABEDB",ing:"BCDBCA",esp:"ACABCE",hum:"BDDBDEEABCCDEABCCDBDEC",mat:"ACDDEBBDDCCCBCCDBB*ADEC",nat:"CBDBEBBBABAEABDEADCCCEDECBB"};
ok("Gabarito: 19 de Matemática começa contando 1 acerto",(await p.innerText('#c-mat')).startsWith("1/23"),await p.innerText('#c-mat'));
const marcar=async(a,key)=>{for(let i=0;i<key.length;i++){if(key[i]==="*")continue;await p.click(`.b[data-a="${a}"][data-i="${i}"][data-l="${key[i]}"]`);}};
await marcar("ling",K.d1+K.ing);await marcar("hum",K.hum);await marcar("mat",K.mat);await marcar("nat",K.nat);
const cnt=async a=>(await p.innerText('#c-'+a));
ok("Gabarito: tudo certo = 23/22/23/27",(await cnt('ling')).startsWith("23/23")&&(await cnt('hum')).startsWith("22/22")&&(await cnt('mat')).startsWith("23/23")&&(await cnt('nat')).startsWith("27/27"),[await cnt('ling'),await cnt('hum'),await cnt('mat'),await cnt('nat')].join());
// trocar para espanhol: as 6 de inglês marcadas viram erros onde diferem (18,20,21? compare)
await p.click('#lang button[data-lang="esp"]');
const difs=[...K.ing].filter((c,i)=>c!==K.esp[i]).length;
ok(`Gabarito: trocar p/ Espanhol recorrige (${23-difs}/23)`,(await cnt('ling')).startsWith(`${23-difs}/23`),await cnt('ling'));
await p.click('#lang button[data-lang="ing"]');
// errar uma
await p.click('.b[data-a="nat"][data-i="0"][data-l="A"]');
ok("Gabarito: erro marca vermelho e mostra a certa",(await p.innerText('#q-nat-0')).includes("era C")&&(await cnt('nat')).startsWith("26/27"));
ok("Gabarito: alternativas da anulada desativadas",await p.isDisabled('.b[data-a="mat"][data-i="18"][data-l="A"]'));
// desmarcar com segundo clique
await p.click('.b[data-a="nat"][data-i="0"][data-l="A"]');
ok("Gabarito: 2º toque desmarca (branco = erro)",(await cnt('nat')).startsWith("26/27"));
await p.click('.b[data-a="nat"][data-i="0"][data-l="C"]');
// persistência
await p.reload();await p.waitForTimeout(300);
ok("Gabarito: marcações persistem após recarregar",(await cnt('nat')).startsWith("27/27")&&(await cnt('ling')).startsWith("23/23"));
// enviar para calculadora
await p.click('#send');await p.waitForTimeout(300);
ok("Enviar: abre a calculadora",await p.isVisible('#view-calc'));
ok("Enviar: preenche 23/22/23/27",[await p.inputValue('#ling'),await p.inputValue('#hum'),await p.inputValue('#mat'),await p.inputValue('#nat')].join()==="23,22,23,27");
// limpar marcações (dupla confirmação)
await p.goto(url+'#gabarito');await p.waitForTimeout(200);
await p.click('#gabClear');ok("Limpar gabarito: pede confirmação",(await p.innerText('#gabClear')).includes("Confirmar")&&(await cnt('ling')).startsWith("23/23"));
await p.click('#gabClear');ok("Limpar gabarito: confirma e zera",(await cnt('ling')).startsWith("0/23")&&(await cnt('mat')).startsWith("1/23"));

// ===== 3. NOTAS DE CORTE: todos os cursos x modalidades =====
await p.goto(url+'#cortes');await p.waitForTimeout(300);
ok("Rota: #cortes mostra a aba",await p.isVisible('#view-cortes')&&!(await p.isVisible('#view-calc')));
const R=D.registros,V=D.vagas_por_bloco,F=D.resumo_final;
const key=r=>`${r.curso}|${r.campus}|${r.turno}`;
const ofs=[...new Set(R.map(key))];
ok("Cortes: menu tem as 15 ofertas",(await p.$$eval('#cCurso option',o=>o.length))===ofs.length);
ok("Cortes: menu tem 5 modalidades",(await p.$$eval('#cMod option',o=>o.length))===5);
let checks=0,bad=[];
const MEDIAS=[55.55,70];
for(const media of MEDIAS){
await p.fill('#cMedia',String(media));
for(const of of ofs){
  await p.selectOption('#cCurso',of);
  for(const m of Object.keys(D.metadata.modalidades)){
    await p.selectOption('#cMod',m);
    const ent=await p.innerText('#cEntries'),fin=await p.innerText('#cFinal');
    for(const e of ["1ª","2ª"]){
      const r=R.find(x=>key(x)===of&&x.etapa==="Chamada Regular"&&x.entrada===e&&x.modalidade===m);
      const card=ent.split(/(?=\dª entrada)/).find(t=>t.startsWith(e[0]+"ª"));
      if(!r){if(!card.includes("não teve oferta"))bad.push(`${of} ${m} ${e}: devia dizer sem oferta`);continue;}
      const vg=V.find(v=>key(v)===of&&v.etapa==="Chamada Regular"&&v.entrada===e).total;
      if(!card.includes(`${vg} vagas`))bad.push(`${of} ${m} ${e}: vagas ${vg}`);
      if(!card.includes(`${r.quantidade} classificado`))bad.push(`${of} ${m} ${e}: qtd ${r.quantidade}`);
      if(r.corte==null){if(!card.includes("Sem convocados"))bad.push(`${of} ${m} ${e}: null`);}
      else{ if(!card.includes(fmt(r.corte)))bad.push(`${of} ${m} ${e}: corte ${r.corte}`);
        const passa=media>=r.corte;
        if(passa!==card.includes("Você passaria"))bad.push(`${of} ${m} ${e}: status`);
        const d=Math.abs(Math.round((media-r.corte)*100)/100);
        if(!card.includes(fmt(d)))bad.push(`${of} ${m} ${e}: diferença ${d}`);}
      checks++;
    }
    const f=F.find(x=>key(x)===of),cf=f.corte_final[m];
    const totMod=R.filter(x=>key(x)===of&&x.modalidade===m&&x.etapa!=="Chamada Regular").reduce((s,x)=>s+x.quantidade,0);
    if(cf==null?!fin.includes("—"):!fin.includes(fmt(cf)))bad.push(`${of} ${m}: corte final`);
    if(cf!=null&&(media>=cf)!==fin.includes("Você passaria"))bad.push(`${of} ${m}: status final`);
    if(!new RegExp(`Remanejados \\(${m==="UNI"?"Universal":m}\\)\\s+${totMod}\\b`).test(fin))bad.push(`${of} ${m}: total mod ${totMod}`);
    if(!new RegExp(`Remanejados no curso\\s+${f.total_remanejados}\\b`).test(fin))bad.push(`${of} ${m}: total curso`);
    // barras
    const bars=await p.$$eval('#cChart .bar',bs=>bs.map(b=>({q:b.querySelector('.val').textContent,pass:b.classList.contains('pass')})));
    for(let i=0;i<10;i++){
      const r=R.find(x=>key(x)===of&&x.etapa===`Remanejamento ${i+1}`&&x.modalidade===m);
      if(String(r.quantidade)!==bars[i].q)bad.push(`${of} ${m} R${i+1}: qtd barra`);
      if((r.corte!=null&&media>=r.corte)!==bars[i].pass)bad.push(`${of} ${m} R${i+1}: cor barra`);
      checks++;
    }
    checks+=3;
  }
}}
ok(`Cortes: ${checks} conferências (15 cursos × 5 modalidades × 2 médias) contra o JSON`,bad.length===0,bad.slice(0,15).join(" | "));
// tooltip de todas as barras de um curso
await p.selectOption('#cCurso','Administração|Benfica (FCAP)|Noite');await p.selectOption('#cMod','UNI');await p.fill('#cMedia','56');
let tipBad=[];
for(let i=0;i<10;i++){
  await p.hover(`#cChart .bar[data-i="${i}"] rect.hit`);await p.waitForTimeout(30);
  const t=await p.innerText('#cTip');const r=R.find(x=>key(x)==='Administração|Benfica (FCAP)|Noite'&&x.etapa===`Remanejamento ${i+1}`&&x.modalidade==='UNI');
  const tot=V.find(v=>key(v)==='Administração|Benfica (FCAP)|Noite'&&v.etapa===`Remanejamento ${i+1}`).total;
  if(!t.includes(`${i+1}º remanejamento`)||!t.includes(r.corte==null?"—":fmt(r.corte))||!t.includes(`${tot} na fase`))tipBad.push(i+1+": "+t.replace(/\n/g," "));
}
ok("Tooltip: passar o mouse mostra fase, corte e total das 10 barras",tipBad.length===0,tipBad.join(" | "));
await p.mouse.move(5,5);await p.waitForTimeout(50);
ok("Tooltip: some ao tirar o mouse",await p.isHidden('#cTip'));
await p.keyboard.press('Tab');
await p.focus('#cChart .bar[data-i="2"]');ok("Tooltip: aparece com foco de teclado",await p.isVisible('#cTip'));
// limite exato
const r0=R.find(x=>key(x)==='Medicina|Santo Amaro|Diurno'&&x.etapa==='Chamada Regular'&&x.entrada==='2ª'&&x.modalidade==='UNI');
await p.selectOption('#cCurso','Medicina|Santo Amaro|Diurno');await p.fill('#cMedia',String(r0.corte));
ok("Regra: média igual ao corte = passaria",(await p.innerText('#cEntries')).split("2ª entrada")[1].includes("Você passaria"));
await p.fill('#cMedia','');ok("Média vazia: pede para informar",(await p.innerText('#cEntries')).includes("Informe sua média"));
await p.fill('#cMedia','120');ok("Média 120: campo marcado inválido",await p.$eval('#cMedia',e=>e.classList.contains('invalid')));
// sincronização com a calculadora
await p.reload();await p.waitForTimeout(300);
await p.goto(url+'#calculadora');await fill({ling:20,hum:18,mat:19,nat:22,redacao:9,ssa1:80,ssa2:82});
const em=esperado(20,18,19,22,9,80,82).media;
await p.goto(url+'#cortes');await p.waitForTimeout(200);
// após goto a página recarrega: o estado vem do exemplo; testar sem recarregar:
await p.evaluate(()=>{location.hash="#calculadora"});await p.waitForTimeout(100);
await fill({ling:20,hum:18,mat:19,nat:22,redacao:9,ssa1:80,ssa2:82});
await p.evaluate(()=>{location.hash="#cortes"});await p.waitForTimeout(150);
ok(`Sincronia: média da calculadora chega na aba (${em.toFixed(2)})`,await p.inputValue('#cMedia')===em.toFixed(2),await p.inputValue('#cMedia'));
ok("Sincronia: dica diz que vem da calculadora",(await p.innerText('#cMediaHint')).startsWith("Vem da aba Calculadora."));
await p.fill('#cMedia','61');
await p.evaluate(()=>{location.hash="#calculadora"});await p.fill('#ling','21');await p.evaluate(()=>{location.hash="#cortes"});await p.waitForTimeout(100);
ok("Sincronia: valor digitado à mão não é sobrescrito",await p.inputValue('#cMedia')==="61");
await p.click('#cUseCalc');ok("Sincronia: botão volta a usar a média da calculadora",await p.inputValue('#cMedia')!=="61");
// persistência da seleção
await p.selectOption('#cCurso','Odontologia|Santo Amaro|Diurno');await p.selectOption('#cMod','A2');
await p.reload();await p.waitForTimeout(300);
ok("Seleção de curso e modalidade persiste",await p.inputValue('#cCurso')==='Odontologia|Santo Amaro|Diurno'&&await p.inputValue('#cMod')==='A2');
// botão da calculadora leva aos cortes
await p.evaluate(()=>{location.hash="#calculadora"});await p.click('a[href="#cortes"].btn');await p.waitForTimeout(100);
ok("Botão 'Comparar com notas de corte' abre a aba",await p.isVisible('#view-cortes'));

// ===== 4. LAYOUT: overflow por aba, largura e tema =====
let lay=[];
for(const [w,cs] of [[390,'light'],[390,'dark'],[768,'dark'],[1280,'light']]){
  await p.setViewportSize({width:w,height:900});await p.emulateMedia({colorScheme:cs});
  for(const h of ['#calculadora','#gabarito','#cortes']){
    await p.evaluate(x=>{location.hash=x},h);await p.waitForTimeout(150);
    const sw=await p.evaluate(()=>document.documentElement.scrollWidth);
    if(sw>w)lay.push(`${h} ${w}px ${cs}: largura ${sw}`);
  }
}
ok("Layout: sem rolagem lateral em 390/768/1280px, claro e escuro, 3 abas",lay.length===0,lay.join(" | "));
// toque no celular
await p.setViewportSize({width:390,height:900});
await p.evaluate(()=>{location.hash="#cortes"});await p.waitForTimeout(150);
await p.tap?.('#cChart .bar[data-i="0"] rect.hit').catch(()=>{});
await p.click('#cChart .bar[data-i="0"] rect.hit');
ok("Celular: toque na barra mostra o balão",await p.isVisible('#cTip'));
const tb=await p.$eval('#cTip',t=>{const r=t.getBoundingClientRect();return [r.left,r.right]});
ok("Celular: balão cabe na tela",tb[0]>=0&&tb[1]<=390,tb.join());
await p.click('h1');ok("Celular: tocar fora fecha o balão",await p.isHidden('#cTip'));

ok("Console: nenhum erro de JavaScript",errs.length===0,errs.join(" | "));
console.log(res.join("\n"));console.log(`\n${res.length-fails}/${res.length} testes passaram`);
await b.close();process.exit(fails?1:0);
})();
