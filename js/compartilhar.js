/* ===== Compartilhamento =====
   ROTAS_OG fica true quando a página veio com as etiquetas de preview (site no Vercel, via api/page.js):
   aí existem /nota/<média> e o menu de compartilhar do celular. Fora disso, os botões copiam a mensagem. */
const ROTAS_OG=!!document.querySelector('meta[property="og:image"]');
const LINK=CONFIG.linkPublico||location.origin+"/";
// Topo: convite para o site (preview geral)
const SITE_TITULO="Calculadora de notas do SSA · Redação com Léo";
const SITE_TEXTO="Calculadora do SSA da UPE, da Redação com Léo: corrija o gabarito do SSA 3, calcule sua média global e compare com as notas de corte do seu curso.";
// Resultado: mensagem curta com a nota (preview com a média na imagem)
const textoNota=m=>`Tirei ${fmt(m)} na média global do SSA! 🎯 Calcule a sua com a Redação com Léo:`;
const linkNota=m=>ROTAS_OG?`${LINK}nota/${(Math.round(m*100)/100).toFixed(2)}`:LINK;

function copiar(texto,toastEl,msgOk){
  const ok=()=>{toastEl.textContent=msgOk;setTimeout(()=>toastEl.textContent="",3500);};
  const fallback=()=>{const t=document.createElement("textarea");t.value=texto;t.setAttribute("readonly","");t.style.position="fixed";t.style.opacity="0";document.body.appendChild(t);t.select();
    let feito=false;try{feito=document.execCommand("copy");}catch(e){}
    t.remove();if(feito)ok();else toastEl.textContent="Não foi possível copiar. Copie esta mensagem: "+texto;};
  try{navigator.clipboard.writeText(texto).then(ok,fallback);}catch(e){fallback();}
}
// Abre o menu de compartilhar do celular quando existe; senão copia a mensagem.
function compartilhar({title,text,url},toastEl){
  const msg=`${text}\n${url}`;
  const copiarMsg=()=>copiar(msg,toastEl,"Mensagem com o link copiada. É só colar no WhatsApp ou onde quiser.");
  if(ROTAS_OG&&navigator.share){
    navigator.share({title,text,url}).catch(err=>{if(!err||err.name!=="AbortError")copiarMsg();});
  }else copiarMsg();
}
$("share").addEventListener("click",()=>compartilhar({title:SITE_TITULO,text:SITE_TEXTO,url:LINK},$("shareToast")));
$("copy").addEventListener("click",()=>{
  if(mediaCalc==null)return;
  compartilhar({title:SITE_TITULO,text:textoNota(mediaCalc),url:linkNota(mediaCalc)},$("toast"));
});
