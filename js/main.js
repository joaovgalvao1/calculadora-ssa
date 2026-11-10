/* ===== Inicialização e navegação entre abas ===== */
function rota(){
  const h=["#gabarito","#competencias","#cortes"].includes(location.hash)?location.hash:"#calculadora";
  $("view-gab").hidden=h!=="#gabarito";$("view-red").hidden=h!=="#competencias";$("view-cortes").hidden=h!=="#cortes";$("view-calc").hidden=h!=="#calculadora";
  document.querySelectorAll(".tabs a").forEach(a=>{
    if(a.getAttribute("href")===h)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
  if(h==="#cortes")renderCortes();
}
window.addEventListener("hashchange",rota);

// Links internos (#calculadora, #gabarito, #cortes) só trocam a aba, sem recarregar a página.
document.addEventListener("click",e=>{
  const a=e.target.closest('a[href^="#"]');
  if(!a)return;
  e.preventDefault();
  location.hash=a.getAttribute("href");
});

async function carregarJSON(url){
  const r=await fetch(url);
  if(!r.ok)throw new Error(`Não foi possível carregar ${url} (${r.status})`);
  return r.json();
}

async function iniciar(){
  // A calculadora aparece na hora (sem esperar os dados) e funciona mesmo se as outras abas não carregarem.
  rota();
  if(!restaurarCalc())preencher(EXEMPLO); // volta ao que a pessoa tinha digitado; sem nada salvo, mostra o exemplo
  const [gab,cortes]=await Promise.allSettled([
    carregarJSON("data/gabarito-ssa3-2027.json"),
    carregarJSON("data/cortes-ssa3-2026.json")
  ]);
  if(gab.status==="fulfilled"){KEYS=gab.value.chaves;langUI();renderGab();}
  else $("days").innerHTML='<p class="pending">Não foi possível carregar o gabarito. Recarregue a página.</p>';
  if(cortes.status==="fulfilled"){CORTES=montarCortes(cortes.value);initCortes();}
  else document.querySelector(".cortes").innerHTML='<p class="pending">Não foi possível carregar as notas de corte. Recarregue a página.</p>';
  rota();      // refaz a rota: a aba de notas de corte só desenha depois que os dados chegam
  syncMedia(); // leva a média da calculadora para a aba de notas de corte
}
iniciar();
