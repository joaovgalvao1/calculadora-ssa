// Funções compartilhadas pelas rotas /api/page e /api/og.

// Lê a nota da URL: ?m=70.15 ou /nota/70.15. Só aceita de 0 a 100.
export function lerNota(url) {
  const u = new URL(url);
  let raw = u.searchParams.get("m");
  if (raw == null) {
    const p = u.pathname.match(/\/nota\/([^/?#]+)/);
    if (p) raw = decodeURIComponent(p[1]);
  }
  if (raw == null || raw === "") return null;
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n * 100) / 100 : null;
}

export const fmt = (n) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
