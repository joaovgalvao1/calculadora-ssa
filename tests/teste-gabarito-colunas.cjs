// Confere a ordem das questões do gabarito (descendo cada coluna) no Chromium e no Firefox.
// Uso: node tests/teste-gabarito-colunas.cjs [url]   (precisa de: npx playwright install chromium firefox)
const {chromium,firefox}=require('playwright');
const URL_=process.argv[2]||'http://localhost:3000/';
const res=[];let falhas=0;
const ok=(n,c,i="")=>{res.push(`${c?"PASS":"FAIL"}  ${n}${c?"":"  -> "+i}`);if(!c)falhas++;};
const seq=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
(async()=>{
for(const [nome,tipo] of [['Chromium',chromium],['Firefox',firefox]]){
  const b=await tipo.launch();
  for(const [w,esperado] of [[1100,{ling:[seq(1,8),seq(9,16),seq(17,23)],nat:[seq(24,32),seq(33,41),seq(42,50)]}],[700,{ling:[seq(1,12),seq(13,23)],nat:[seq(24,37),seq(38,50)]}],[390,{ling:[seq(1,23)],nat:[seq(24,50)]}]]){
    const p=await (await b.newContext({viewport:{width:w,height:900}})).newPage();
    await p.goto(URL_+'#gabarito');await p.waitForTimeout(500);
    for(const area of ['ling','nat']){
      const cols=await p.$$eval(`[id^="q-${area}-"]`,qs=>{const m=new Map();qs.forEach(q=>{const r=q.getBoundingClientRect(),x=Math.round(r.left);if(!m.has(x))m.set(x,[]);m.get(x).push([r.top,+q.querySelector('.n').firstChild.textContent])});return [...m.entries()].sort((a,c)=>a[0]-c[0]).map(([,v])=>v.sort((a,c)=>a[0]-c[0]).map(e=>e[1]))});
      ok(`${nome} ${w}px: ${area==='ling'?'Linguagens':'Natureza'} desce cada coluna em ordem`,JSON.stringify(cols)===JSON.stringify(esperado[area]),JSON.stringify(cols));
    }
    const estilo=await p.$eval('#days .qs',e=>({disp:getComputedStyle(e).display,colunas:getComputedStyle(e).columnCount}));
    ok(`${nome} ${w}px: usa grade (sem colunas CSS, que cortavam a primeira linha da 3ª coluna no Firefox)`,estilo.disp==='grid'&&estilo.colunas==='auto',JSON.stringify(estilo));
    ok(`${nome} ${w}px: sem rolagem lateral`,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await p.context().close();
  }
  await b.close();
}
console.log(res.join("\n"));console.log(`\n${res.length-falhas}/${res.length} testes passaram`);process.exit(falhas?1:0);
})();
