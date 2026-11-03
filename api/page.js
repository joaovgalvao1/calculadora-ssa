// Serve a calculadora (app.html) com as etiquetas de preview (Open Graph).
// /             → preview geral do site
// /nota/70.15   → título com a média global de quem compartilhou (a imagem é a mesma)
import { lerNota, fmt } from "./_comum.js";

export const config = { runtime: "edge" };

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function etiquetas(origin, m) {
  const titulo = m == null ? "Calculadora de notas do SSA · Redação com Léo" : `Tirei ${fmt(m)} na média global do SSA`;
  const desc = m == null
    ? "Corrija o gabarito do SSA 3, calcule sua média global e compare com as notas de corte por curso e cota. Por Redação com Léo."
    : "Calcule a sua com a Redação com Léo: corrija seu gabarito e veja sua média global em segundos.";
  // Imagem fixa (img/preview.png) em todos os links: o título já traz a nota; a imagem convida a pessoa a calcular a sua.
  const img = `${origin}/img/preview.png`;
  const url = m == null ? `${origin}/` : `${origin}/nota/${m.toFixed(2)}`;
  return [
    ["og:type", "website"], ["og:site_name", "Redação com Léo"], ["og:locale", "pt_BR"],
    ["og:title", titulo], ["og:description", desc], ["og:url", url],
    ["og:image", img], ["og:image:width", "1200"], ["og:image:height", "630"], ["og:image:alt", titulo],
  ].map(([p, c]) => `<meta property="${p}" content="${esc(c)}">`).concat([
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(titulo)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    `<meta name="twitter:image" content="${esc(img)}">`,
  ]).join("\n");
}

export default async function handler(req) {
  const origin = new URL(req.url).origin;
  const m = lerNota(req.url);
  const res = await fetch(new URL("/app.html", origin));
  if (!res.ok) return Response.redirect(new URL("/app.html", origin), 302);
  // <base href="/"> mantém css/, js/ e data/ funcionando também em /nota/70.15
  const html = (await res.text()).replace("<!--OG-->", `<base href="/">\n${etiquetas(origin, m)}`);
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=300" },
  });
}
