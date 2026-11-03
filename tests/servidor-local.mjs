// Simula o Vercel localmente: rewrites de vercel.json + funções em /api + arquivos estáticos.
// Uso (na raiz do projeto): npm install && node tests/servidor-local.mjs   → http://localhost:3000
import http from 'http';import fs from 'fs';import path from 'path';
import {fileURLToPath} from 'url';
const D=process.argv[2]||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),PORT=+(process.argv[3]||3000);
const realFetch=globalThis.fetch;
globalThis.fetch=async(u,o)=>{const x=new URL(u);if(x.host===`localhost:${PORT}`){const f=path.join(D,x.pathname);return fs.existsSync(f)?new Response(fs.readFileSync(f)):new Response('nf',{status:404});}return realFetch(u,o);};
const page=(await import(D+'/api/page.js')).default, og=(await import(D+'/api/og.js')).default;
const cfg=JSON.parse(fs.readFileSync(D+'/vercel.json'));
http.createServer(async(req,res)=>{
  let u=new URL(req.url,`http://localhost:${PORT}`);let p=u.pathname;
  if(p==='/instagram'){res.writeHead(302,{location:'https://www.instagram.com/redacaocomleo/'});return res.end();} // simula functions/instagram.js (sem contador)
  const f=path.join(D,p);
  if(p!=='/'&&fs.existsSync(f)&&fs.statSync(f).isFile()&&!p.startsWith('/api/')){
    const ct={'.html':'text/html; charset=utf-8','.woff':'font/woff','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png'}[path.extname(f)]||'application/octet-stream';
    res.writeHead(200,{'content-type':ct});return res.end(fs.readFileSync(f));}
  for(const r of cfg.rewrites){const re=new RegExp('^'+r.source.replace(/:(\w+)/g,'(?<$1>[^/]+)')+'$');const mm=p.match(re);
    if(mm){let d=r.destination;for(const [k,v] of Object.entries(mm.groups||{}))d=d.replace(':'+k,v);const nu=new URL(d,u);for(const [k,v] of u.searchParams)nu.searchParams.set(k,v);
      // Vercel entrega à função a URL original; lerNota aceita ?m= e /nota/<m>
      u=new URL(req.url,`http://localhost:${PORT}`);p=nu.pathname;u.search=nu.search;break;}}
  const fn=p==='/api/page'?page:p==='/api/og'?og:null;
  if(!fn){res.writeHead(404);return res.end('404');}
  const r=await fn(new Request(u.href));const buf=Buffer.from(await r.arrayBuffer());
  res.writeHead(r.status,Object.fromEntries(r.headers));res.end(buf);
}).listen(PORT,()=>console.log('ok '+PORT));
