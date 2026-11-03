# Testes

Testes de ponta a ponta com Playwright. Eles não fazem parte do site publicado.

```bash
npm install                                   # instala @vercel/og (usado pelo servidor local)
npm install --no-save playwright              # navegador de testes, fora do package.json
npx playwright install chromium
node tests/servidor-local.mjs &               # simula o Vercel em http://localhost:3000
node tests/teste-completo.cjs                  # roda a bateria (61 testes)
```

O que a bateria cobre: fórmulas da calculadora, validações, correção do gabarito (incluindo anulada e Inglês/Espanhol),
envio dos acertos, todas as combinações curso × modalidade das notas de corte contra o JSON, gráfico e balões,
compartilhamento (mensagens e links), persistência no navegador e layout sem rolagem lateral em 390/768/1280 px.
