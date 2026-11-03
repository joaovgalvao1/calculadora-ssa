// "/cliques?k=CHAVE" → painel privado com os cliques no Instagram (functions/instagram.js grava os números).
// A chave é o segredo PAINEL_CHAVE, guardado na Cloudflare (nunca no código). Sem o segredo, ou com a chave errada,
// a página responde 404, como se não existisse.
const CABECALHOS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
  "referrer-policy": "no-referrer",
};
const NOMES = { rodape: "Rodapé (todas as abas)", resultado: "Chamada abaixo do resultado", outro: "Outros" };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (n) => Number(n).toLocaleString("pt-BR");

// Compara as chaves sem revelar, pelo tempo de resposta, quantos caracteres batem.
async function iguais(a, b) {
  const h = async (s) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  const [x, y] = await Promise.all([h(a), h(b)]);
  let dif = 0;
  for (let i = 0; i < x.length; i++) dif |= x[i] ^ y[i];
  return dif === 0;
}

async function ler(env) {
  try {
    const [porOrigem, porDia] = await env.DB.batch([
      env.DB.prepare("SELECT origem, SUM(total) AS total FROM cliques GROUP BY origem ORDER BY total DESC"),
      env.DB.prepare("SELECT dia, SUM(total) AS total FROM cliques GROUP BY dia ORDER BY dia DESC LIMIT 14"),
    ]);
    return { origens: porOrigem.results, dias: porDia.results };
  } catch (e) {
    return { origens: [], dias: [] }; // ainda não houve nenhum clique (a tabela é criada no primeiro)
  }
}

export async function onRequest({ request, env }) {
  const naoExiste = () => new Response("Not found", { status: 404, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
  const chave = env.PAINEL_CHAVE;
  if (!chave || !(await iguais(new URL(request.url).searchParams.get("k") || "", chave))) return naoExiste();
  if (!env.DB) return new Response("Banco D1 (DB) não configurado.", { status: 503, headers: CABECALHOS });

  const { origens, dias } = await ler(env);
  const total = origens.reduce((s, o) => s + o.total, 0);
  const linhas = (rs, nome) => (rs.length ? rs.map((r) => `<tr><td>${esc(nome(r))}</td><td class="n">${fmt(r.total)}</td></tr>`).join("") : '<tr><td colspan="2" class="vazio">Nenhum clique ainda.</td></tr>');
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>Cliques no Instagram</title>
<style>
:root{--bg:#f7f4f4;--surface:#fff;--ink:#2b3333;--muted:#5d6767;--line:#e3dadc;--accent:#8a5b64;--soft:#f3e7e9}
@media (prefers-color-scheme: dark){:root{--bg:#1d1a1b;--surface:#282425;--ink:#f0eaea;--muted:#b3a9ab;--line:#40393b;--accent:#d9a3ad;--soft:#3c2b30}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif;padding:24px 16px}
main{max-width:560px;margin:0 auto;display:grid;gap:16px}h1{margin:0;font-size:22px}
.total{background:var(--soft);border-radius:14px;padding:16px}.total b{display:block;font-size:44px;line-height:1.1;color:var(--accent)}
section{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px}h2{margin:0 0 8px;font-size:16px}
table{width:100%;border-collapse:collapse}td{padding:8px 0;border-top:1px solid var(--line)}tr:first-child td{border-top:0}
.n{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}.vazio,.nota{color:var(--muted)}.nota{font-size:13px;margin:0}
</style></head><body><main>
<h1>Cliques no Instagram</h1>
<div class="total"><span>Total de cliques</span><b>${fmt(total)}</b></div>
<section><h2>Por origem</h2><table>${linhas(origens, (r) => NOMES[r.origem] || r.origem)}</table></section>
<section><h2>Últimos 14 dias com cliques</h2><table>${linhas(dias, (r) => r.dia.split("-").reverse().join("/"))}</table></section>
<p class="nota">Atualiza ao recarregar a página. Cliques de robôs e da prévia do WhatsApp não são contados. Dias em horário de Brasília.</p>
</main></body></html>`;
  return new Response(html, { headers: CABECALHOS });
}
