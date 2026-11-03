/* Modo claro/escuro. Sem escolha salva, segue o tema do sistema; ao clicar no botão, a escolha é guardada. */
(function(){
  const KEY="ssa-tema",raiz=document.documentElement,mq=window.matchMedia("(prefers-color-scheme: dark)");
  const ler=()=>{try{const t=localStorage.getItem(KEY);return t==="light"||t==="dark"?t:null;}catch(e){return null;}};
  const gravar=t=>{try{localStorage.setItem(KEY,t);}catch(e){}};
  const atual=()=>ler()||(mq.matches?"dark":"light");
  const ICONES={
    dark:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    light:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
  };
  function aplicar(){
    const t=atual(),escuro=t==="dark",salvo=ler();
    if(salvo)raiz.setAttribute("data-theme",salvo);else raiz.removeAttribute("data-theme");
    const cor=document.querySelector('meta[name="theme-color"]');if(cor)cor.content=escuro?"#1d1a1b":"#8a5b64";
    const b=document.getElementById("theme");
    if(b){b.innerHTML=ICONES[t];b.setAttribute("aria-label",escuro?"Mudar para o modo claro":"Mudar para o modo escuro");b.title=escuro?"Modo claro":"Modo escuro";}
  }
  aplicar();
  document.addEventListener("DOMContentLoaded",()=>{
    aplicar();
    document.getElementById("theme").addEventListener("click",()=>{gravar(atual()==="dark"?"light":"dark");aplicar();});
  });
  if(mq.addEventListener)mq.addEventListener("change",aplicar);
})();
