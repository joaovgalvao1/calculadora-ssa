// Serve app.html com as etiquetas de preview (Open Graph). Usado pelas rotas / e /nota/<média>.
import { lerNota } from "../api/_comum.js";
import { etiquetas } from "../api/page.js";

export async function servirPagina({ request, env }) {
  const origin = new URL(request.url).origin;
  const m = lerNota(request.url);
  const res = await env.ASSETS.fetch(new URL("/app.html", origin));
  if (!res.ok) return Response.redirect(new URL("/app.html", origin), 302);
  // <base href="/"> mantém css/, js/ e data/ funcionando também em /nota/70.15
  const html = (await res.text()).replace("<!--OG-->", `<base href="/">\n${etiquetas(origin, m)}`);
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=300" },
  });
}
