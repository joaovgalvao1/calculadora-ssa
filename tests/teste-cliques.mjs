// Testa o contador de cliques (functions/instagram.js) e o painel privado (functions/cliques.js).
// Só roda na Cloudflare (precisa do wrangler). Uso:
//   npx wrangler pages dev . --port 8788 --binding PAINEL_CHAVE=chave-de-teste --d1 DB=teste-local &
//   node tests/teste-cliques.mjs http://localhost:8788 chave-de-teste
const [,, BASE = "http://localhost:8788", CHAVE = "chave-de-teste"] = process.argv;
const UA = { "user-agent": "Mozilla/5.0 Firefox" };
const res = [];
let falhas = 0;
const ok = (nome, cond, info = "") => { res.push(`${cond ? "PASS" : "FAIL"}  ${nome}${cond ? "" : "  -> " + info}`); if (!cond) falhas++; };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const total = async () => {
  const r = await fetch(`${BASE}/cliques?k=${CHAVE}`, { headers: UA });
  const m = (await r.text()).match(/<b>([\d.]+)<\/b>/);
  return { status: r.status, n: m ? Number(m[1].replace(/\./g, "")) : NaN, r };
};

const semChave = await fetch(`${BASE}/cliques`, { headers: UA });
ok("Painel: sem chave responde 404", semChave.status === 404, semChave.status);
const errada = await fetch(`${BASE}/cliques?k=errada`, { headers: UA });
ok("Painel: chave errada responde 404", errada.status === 404, errada.status);

const antes = await total();
ok("Painel: chave certa abre (200) sem cache e sem indexação",
  antes.status === 200 && antes.r.headers.get("cache-control") === "no-store" && /noindex/.test(antes.r.headers.get("x-robots-tag") || ""),
  `${antes.status} ${antes.r.headers.get("cache-control")} ${antes.r.headers.get("x-robots-tag")}`);

for (const de of ["rodape", "rodape", "resultado"]) {
  const r = await fetch(`${BASE}/instagram?de=${de}`, { headers: UA, redirect: "manual" });
  ok(`Contador: /instagram?de=${de} redireciona (302) ao perfil`, r.status === 302 && r.headers.get("location") === "https://www.instagram.com/redacaocomleo/", `${r.status} ${r.headers.get("location")}`);
}
await fetch(`${BASE}/instagram?de=rodape`, { headers: { "user-agent": "WhatsApp/2.23" }, redirect: "manual" });
await fetch(`${BASE}/instagram?de=rodape`, { method: "HEAD", headers: UA, redirect: "manual" });
await esperar(800);

const depois = await total();
ok("Contador: 3 cliques de pessoas somam +3 (robô do WhatsApp e HEAD não contam)", depois.n - antes.n === 3, `${antes.n} -> ${depois.n}`);
const html = await (await fetch(`${BASE}/cliques?k=${CHAVE}`, { headers: UA })).text();
ok("Painel: mostra as origens e o total", html.includes("Rodapé (todas as abas)") && html.includes("Chamada abaixo do resultado") && html.includes("Cliques no Instagram"));

console.log(res.join("\n"));
console.log(`\n${res.length - falhas}/${res.length} testes passaram`);
process.exit(falhas ? 1 : 0);
