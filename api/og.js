// Gera a imagem de preview (1200×630) mostrada no WhatsApp e nas redes.
// /api/og          → preview geral do site
// /api/og?m=70.15  → preview com a média global do candidato
import { ImageResponse } from "@vercel/og";
import { lerNota, fmt } from "./_comum.js";

export const config = { runtime: "edge" };

// Cores da calculadora
const C = { bg: "#f3f5f4", ink: "#14211f", muted: "#5b6b68", line: "#d6dfdc", accent: "#0f6b5c", soft: "#e1f0ec", mark: "#e8a317" };

// Monta elementos sem JSX
const h = (type, style, ...children) => ({
  type,
  props: { style: { display: "flex", ...style }, children: children.length === 1 ? children[0] : children },
});

export function imagem(m) {
  const topo = h("div", { fontFamily: "Mono", fontSize: 24, letterSpacing: 3, color: C.accent }, "SISTEMA SERIADO DE AVALIAÇÃO · UPE");
  const marca = h("div", { alignItems: "center", gap: 12 },
    h("div", { width: 18, height: 18, borderRadius: 9, background: C.mark }),
    h("div", { fontFamily: "Sans", fontWeight: 600, fontSize: 26, color: C.ink }, "Calculadora de notas do SSA"));

  if (m == null) {
    const chip = (t) => h("div", { padding: "12px 22px", borderRadius: 999, background: C.soft, color: C.accent, fontFamily: "Sans", fontWeight: 600, fontSize: 26 }, t);
    return h("div", { width: "100%", height: "100%", background: C.bg, flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", borderBottom: `16px solid ${C.accent}` },
      topo,
      h("div", { flexDirection: "column", gap: 22 },
        h("div", { fontFamily: "Display", fontSize: 104, lineHeight: 1, color: C.ink, letterSpacing: -2 }, "Quanto você tirou no SSA?"),
        h("div", { fontFamily: "Sans", fontWeight: 500, fontSize: 34, color: C.muted, maxWidth: 980, lineHeight: 1.35 },
          "Corrija o gabarito do SSA 3, calcule sua média global e compare com as notas de corte do seu curso.")),
      h("div", { justifyContent: "space-between", alignItems: "center" },
        h("div", { gap: 12 }, chip("Gabarito 2027"), chip("Média global"), chip("Notas de corte")),
        marca));
  }

  return h("div", { width: "100%", height: "100%", background: C.bg, flexDirection: "column", justifyContent: "space-between", padding: "60px 72px" },
    topo,
    h("div", { flexDirection: "column", gap: 4 },
      h("div", { fontFamily: "Sans", fontWeight: 600, fontSize: 40, color: C.ink }, "Minha média global no SSA"),
      h("div", { fontFamily: "Display", fontSize: 230, lineHeight: 1, color: C.accent, letterSpacing: -6 }, fmt(m)),
      h("div", { width: 1056, height: 18, borderRadius: 9, background: C.line, marginTop: 18 },
        h("div", { width: Math.max(18, Math.round(1056 * m / 100)), height: 18, borderRadius: 9, background: C.accent }))),
    h("div", { justifyContent: "space-between", alignItems: "center" },
      h("div", { fontFamily: "Sans", fontWeight: 500, fontSize: 32, color: C.muted }, "E você? Calcule a sua em segundos."),
      marca));
}

export async function fontes(origin) {
  const get = (f) => fetch(new URL(`/fonts/${f}`, origin)).then((r) => r.arrayBuffer());
  const [disp, s5, s6, mono] = await Promise.all([get("bricolage-800.woff"), get("plex-sans-500.woff"), get("plex-sans-600.woff"), get("plex-mono-500.woff")]);
  return [
    { name: "Display", data: disp, weight: 800, style: "normal" },
    { name: "Sans", data: s5, weight: 500, style: "normal" },
    { name: "Sans", data: s6, weight: 600, style: "normal" },
    { name: "Mono", data: mono, weight: 500, style: "normal" },
  ];
}

export default async function handler(req) {
  const m = lerNota(req.url);
  return new ImageResponse(imagem(m), {
    width: 1200,
    height: 630,
    fonts: await fontes(new URL(req.url).origin),
    headers: { "cache-control": "public, max-age=86400, s-maxage=31536000, immutable" },
  });
}
