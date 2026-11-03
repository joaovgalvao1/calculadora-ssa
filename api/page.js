// Serve a calculadora (app.html) com as etiquetas de preview (Open Graph).
// /             → preview geral do site
// /nota/70.15   → preview com a média global de quem compartilhou
import { lerNota, fmt } from "./_comum.js";

export const config = { runtime: "edge" };

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function etiquetas(origin, m) {
  const titulo = m == null ? "Calculadora de notas do SSA · UPE" : `Tirei ${fmt(m)} na média global do SSA`;
  const desc = m == null
    ? "Corrija o gabarito do SSA 3, calcule sua média global e compare com as notas de corte por curso e cota."
    : "E você? Corrija seu gabarito e calcule sua média global em segundos.";
  const img = `${origin}/api/og${m == null ? "" : `?m=${m.toFixed(2)}`}`;
  const url = m == null ? `${origin}/` : `${origin}/nota/${m.toFixed(2)}`;
  return [
    ["og:type", "website"], ["og:site_name", "Calculadora de notas do SSA"], ["og:locale", "pt_BR"],
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
