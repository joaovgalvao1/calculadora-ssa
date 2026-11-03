// Gera a imagem de preview (1200×630) mostrada no WhatsApp e nas redes.
// /api/og          → preview geral do site
// /api/og?m=70.15  → preview com a média global do candidato
import { ImageResponse } from "@vercel/og";
import { lerNota } from "./_comum.js";
import { imagem, carregarFontes } from "./_imagem.js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const origin = new URL(req.url).origin;
  const m = lerNota(req.url);
  return new ImageResponse(imagem(m, `${origin}/img/logo.png`), {
    width: 1200,
    height: 630,
    fonts: await carregarFontes((f) => fetch(new URL(`/fonts/${f}`, origin)).then((r) => r.arrayBuffer())),
    headers: { "cache-control": "public, max-age=86400, s-maxage=31536000, immutable" },
  });
}
