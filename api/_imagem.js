// Desenho das imagens de preview (compartilhado entre Vercel e Cloudflare). Sem dependências.
import { fmt } from "./_comum.js";

// Cores da calculadora (identidade Redação com Léo)
const C = { bg: "#f7f4f4", ink: "#2b3333", muted: "#5d6767", line: "#e3dadc", accent: "#8a5b64", soft: "#f3e7e9", mark: "#e0a93e" };

// Monta elementos sem JSX
const h = (type, style, ...children) => ({
  type,
  props: { style: { display: "flex", ...style }, children: children.length === 1 ? children[0] : children },
});

export function imagem(m, logo) {
  const topo = h("div", { fontFamily: "Mono", fontSize: 24, letterSpacing: 3, color: C.accent }, "REDAÇÃO COM LÉO · CALCULADORA DO SSA");
  const marca = logo
    ? { type: "img", props: { src: logo, width: 230, height: 101, style: { display: "flex" } } }
    : h("div", { fontFamily: "Sans", fontWeight: 600, fontSize: 26, color: C.ink }, "Redação com Léo");

  if (m == null) {
    const chip = (t) => h("div", { padding: "12px 22px", borderRadius: 999, background: C.soft, color: C.accent, fontFamily: "Sans", fontWeight: 600, fontSize: 26 }, t);
    const logoGrande = logo ? { type: "img", props: { src: logo, width: 420, height: 184, style: { display: "flex" } } } : null;
    return h("div", { width: "100%", height: "100%", background: C.bg, flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", borderBottom: `16px solid ${C.accent}` },
      topo,
      h("div", { justifyContent: "space-between", alignItems: "center", gap: 40 },
        h("div", { flexDirection: "column", gap: 20, maxWidth: 600 },
          h("div", { fontFamily: "Display", fontSize: 82, lineHeight: 1.05, color: C.ink }, "Quanto você tirou no SSA?"),
          h("div", { fontFamily: "Sans", fontWeight: 500, fontSize: 29, color: C.muted, lineHeight: 1.35 },
            "Corrija o gabarito do SSA 3, calcule sua média global e compare com as notas de corte do seu curso.")),
        logoGrande),
      h("div", { gap: 12 }, chip("Gabarito 2027"), chip("Média global"), chip("Competências"), chip("Notas de corte")));
  }

  return h("div", { width: "100%", height: "100%", background: C.bg, flexDirection: "column", justifyContent: "space-between", padding: "60px 72px" },
    topo,
    h("div", { flexDirection: "column", gap: 4 },
      h("div", { fontFamily: "Sans", fontWeight: 600, fontSize: 40, color: C.ink }, "Minha média global no SSA"),
      h("div", { fontFamily: "Display", fontSize: 230, lineHeight: 1, color: C.accent, letterSpacing: -6 }, fmt(m)),
      h("div", { width: 1056, height: 18, borderRadius: 9, background: C.line, marginTop: 18 },
        h("div", { width: Math.max(18, Math.round(1056 * m / 100)), height: 18, borderRadius: 9, background: C.accent }))),
    h("div", { justifyContent: "space-between", alignItems: "center" },
      h("div", { fontFamily: "Sans", fontWeight: 500, fontSize: 32, color: C.muted }, "Calcule a sua com a Redação com Léo."),
      marca));
}

// buscar("arquivo.woff") devolve os bytes da fonte (cada plataforma busca do seu jeito).
export async function carregarFontes(buscar) {
  const [disp, s5, s6, mono] = await Promise.all([buscar("baloo2-700.woff"), buscar("nunito-sans-500.woff"), buscar("nunito-sans-600.woff"), buscar("plex-mono-500.woff")]);
  return [
    { name: "Display", data: disp, weight: 700, style: "normal" },
    { name: "Sans", data: s5, weight: 500, style: "normal" },
    { name: "Sans", data: s6, weight: 600, style: "normal" },
    { name: "Mono", data: mono, weight: 500, style: "normal" },
  ];
}
