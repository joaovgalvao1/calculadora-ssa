// "/instagram?de=rodape" → conta o clique e leva a pessoa ao Instagram do professor.
// A contagem usa o banco D1 da Cloudflare (binding "DB"). Sem o banco, ou se der erro, só redireciona:
// o link nunca deixa de funcionar por causa do contador.
const DESTINO = "https://www.instagram.com/redacaocomleo/";
const ORIGENS = ["rodape", "resultado"]; // de onde veio o clique; qualquer outro valor vira "outro"
const ROBO = /bot|crawl|spider|preview|facebookexternalhit|whatsapp/i;

export async function onRequest({ request, env, waitUntil }) {
  const resposta = new Response(null, { status: 302, headers: { location: DESTINO, "cache-control": "no-store" } });
  if (request.method !== "GET" || !env.DB || ROBO.test(request.headers.get("user-agent") || "")) return resposta;

  const de = new URL(request.url).searchParams.get("de");
  const origem = ORIGENS.includes(de) ? de : "outro";
  const dia = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }); // AAAA-MM-DD no horário de Brasília
  waitUntil(
    env.DB.batch([
      env.DB.prepare("CREATE TABLE IF NOT EXISTS cliques (origem TEXT NOT NULL, dia TEXT NOT NULL, total INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (origem, dia))"),
      env.DB.prepare("INSERT INTO cliques (origem, dia, total) VALUES (?, ?, 1) ON CONFLICT (origem, dia) DO UPDATE SET total = total + 1").bind(origem, dia),
    ]).catch(() => {}),
  );
  return resposta;
}
