// "/" → calculadora com o preview geral do site
import { servirPagina } from "./_pagina.js";

export const onRequest = (ctx) => servirPagina(ctx);
