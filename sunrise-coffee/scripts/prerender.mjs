/**
 * Pre-render delle pagine di contenuto (eseguito dopo `vite build`).
 *
 * Perché: il sito è una SPA. Senza questo, ogni URL riceve lo stesso HTML
 * vuoto (stesso <title>, stessa description, nessun testo): Google deve
 * eseguire il JavaScript per vedere qualcosa, mentre i crawler delle AI
 * (ChatGPT, Perplexity, Claude…) e le anteprime social non lo eseguono affatto.
 *
 * Cosa fa: apre ogni pagina in Chromium, aspetta che React l'abbia disegnata,
 * e salva l'HTML risultante in dist/<percorso>/index.html con:
 *   - title, description, canonical, Open Graph, JSON-LD della pagina;
 *   - il contenuto già renderizzato dentro #root;
 *   - i fogli di stile della pagina bloccanti (niente flash senza stili) e i
 *     chunk JS precaricati.
 * Il browser mostra subito l'HTML; poi React lo sostituisce con la stessa
 * pagina (main.jsx precarica il chunk prima del primo render).
 *
 * La home è speciale: barra, header e hero restano lo shell statico già
 * ottimizzato per l'LCP (index.html); il resto della home viene aggiunto
 * sotto, invisibile finché il CSS non è arrivato.
 *
 * Schede prodotto e collezioni NON passano di qui: hanno prezzi e
 * disponibilità live, le genera Express a ogni richiesta (api/_ssr.js).
 *
 * Uso:  node scripts/prerender.mjs
 * Env:  PRERENDER_ORIGIN  sito da cui leggere Store API e immagini Shopware
 *                         (default https://www.capperificiocaro.com)
 *       PRERENDER_ONLY    elenco di percorsi separati da virgola (debug)
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { helpSitemapPaths } from '../src/data/assistenza.js';
import { guideSitemapPaths } from '../src/data/guide.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const ORIGIN = (process.env.PRERENDER_ORIGIN || 'https://www.capperificiocaro.com').replace(/\/$/, '');
const SITE = 'https://www.capperificiocaro.com';

const STATIC_ROUTES = [
  '/',
  '/storia', '/territorio', '/processo-produttivo', '/b2b',
  '/contatti', '/faq', '/box-di-natale',
  '/privacy-policy', '/cookie-policy', '/termini-e-condizioni',
];

const ROUTES = process.env.PRERENDER_ONLY
  ? process.env.PRERENDER_ONLY.split(',').map((s) => s.trim()).filter(Boolean)
  : [...new Set([...STATIC_ROUTES, ...guideSitemapPaths(), ...helpSitemapPaths()])];

/* ── Server statico locale (dist/ + proxy Shopware) ─────────────────── */

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json',
  '.ico': 'image/x-icon', '.txt': 'text/plain', '.mp4': 'video/mp4',
};

const SHELL = readFileSync(join(DIST, '_shell.html'), 'utf8');

async function proxy(req, res) {
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const headers = {};
    for (const h of ['content-type', 'accept', 'sw-access-key', 'sw-context-token', 'sw-language-id']) {
      if (req.headers[h]) headers[h] = req.headers[h];
    }
    const r = await fetch(ORIGIN + req.url, {
      method: req.method,
      headers,
      body: chunks.length ? Buffer.concat(chunks) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
    const body = Buffer.from(await r.arrayBuffer());
    res.writeHead(r.status, { 'content-type': r.headers.get('content-type') || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(502).end();
  }
}

const server = createServer((req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  if (/^\/(store-api|media|thumbnail)\//.test(path)) return proxy(req, res);
  if (path.startsWith('/api/')) return res.writeHead(404, { 'content-type': 'application/json' }).end('{}');

  const file = join(DIST, path);
  if (file.startsWith(DIST) && existsSync(file) && statSync(file).isFile() && path !== '/index.html') {
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    return res.end(readFileSync(file));
  }
  // Sempre la shell vuota: mai una pagina già pre-renderizzata come sorgente.
  res.writeHead(200, { 'content-type': MIME['.html'] }).end(SHELL);
});

/* ── Cattura di una pagina ──────────────────────────────────────────── */

async function capture(page, base, route) {
  await page.goto(base + route, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.waitForSelector('#main-content h1, #main-content h2', { timeout: 15_000 });

  // Scorre fino in fondo: fa scattare animazioni allo scroll e lazy content,
  // così nel testo salvato non restano sezioni "in attesa".
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(900);

  return page.evaluate((isHome) => {
    const q = (sel) => [...document.head.querySelectorAll(sel)];
    const head = [
      `<title>${document.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>`,
      ...q('meta[name="description"], meta[name="robots"], link[rel="canonical"]').map((el) => el.outerHTML),
      ...q('meta[property^="og:"], meta[name^="twitter:"]').map((el) => el.outerHTML),
      ...q('script[type="application/ld+json"][id^="jsonld-"]').map((el) => el.outerHTML),
    ];
    const css = q('link[rel="stylesheet"]')
      .map((el) => el.getAttribute('href'))
      .filter((h) => h && h.startsWith('/assets/'));
    const js = performance.getEntriesByType('resource')
      .map((e) => new URL(e.name).pathname)
      .filter((p) => p.startsWith('/assets/') && p.endsWith('.js'));

    const root = document.getElementById('root').cloneNode(true);
    // Elementi solo-runtime: dialoghi aperti, fallback di caricamento.
    root.querySelectorAll('[aria-busy="true"], dialog[open], [role="dialog"]').forEach((el) => el.remove());
    root.querySelectorAll('script').forEach((el) => el.remove());

    let body;
    if (isHome) {
      // Barra, header e hero sono già nello shell statico: si aggiunge il resto.
      const main = root.querySelector('#main-content');
      const heroImg = main?.querySelector('img[src*="hero-"]');
      let hero = heroImg;
      while (hero && hero.parentElement !== main) hero = hero.parentElement;
      const rest = [];
      for (let n = hero?.nextElementSibling; n; n = n.nextElementSibling) rest.push(n);
      for (let n = main?.nextElementSibling; n; n = n.nextElementSibling) rest.push(n);
      rest.forEach((n) => n.querySelectorAll('img').forEach((img) => {
        img.setAttribute('loading', 'lazy');
        img.removeAttribute('fetchpriority');
      }));
      body = rest.map((n) => n.outerHTML).join('');
    } else {
      body = root.innerHTML;
    }
    const busy = !!document.querySelector('#root [aria-busy="true"]');
    return { head, css: [...new Set(css)], js: [...new Set(js)], body, busy };
  }, route === '/');
}

/* ── Composizione dell'HTML finale ──────────────────────────────────── */

const SEO_TAGS = [
  /<title>[\s\S]*?<\/title>\s*/,
  /<meta name="description"[^>]*>\s*/,
  /<meta name="robots"[^>]*>\s*/,
  /<link rel="canonical"[^>]*>\s*/,
  /<meta property="og:(title|description|image|url|type|site_name)"[^>]*>\s*/g,
  /<meta name="twitter:(card|title|description|image)"[^>]*>\s*/g,
  /<link rel="alternate" hreflang="[^"]*"[^>]*>\s*/g,
];

function compose(route, data) {
  let html = SHELL;
  for (const re of SEO_TAGS) html = html.replace(re, '');

  const url = SITE + (route === '/' ? '/' : route);
  const head = [
    ...data.head,
    `<link rel="alternate" hreflang="it" href="${url}" />`,
    `<link rel="alternate" hreflang="x-default" href="${url}" />`,
  ];

  const entryCss = html.match(/<link id="entry-css"[^>]*href="([^"]+)"[^>]*>(<noscript>[\s\S]*?<\/noscript>)?/);
  if (!entryCss) throw new Error('entry-css non trovato in _shell.html');
  const routeCss = data.css.filter((h) => h !== entryCss[1]);
  const preloadJs = data.js.filter((p) => !html.includes(p));

  if (route === '/') {
    // Home: CSS d'ingresso resta non bloccante (shell LCP); il contenuto sotto
    // l'hero si mostra quando il foglio è arrivato.
    html = html.replace(`onload="this.media='all'"`, `onload="this.media='all';document.documentElement.classList.add('css-ready')"`);
    head.push(
      '<style>html:not(.css-ready) .pr-rest{visibility:hidden}</style>',
      '<noscript><style>.pr-rest{visibility:visible!important}</style></noscript>',
    );
    html = html.replace(/(<div id="boot-shell"[\s\S]*?<\/div>\s*<\/div>)(<\/div>)/, (_, shell, close) =>
      `${shell}<div class="pr-rest">${data.body}</div>${close}`);
    if (!html.includes('class="pr-rest"')) throw new Error('home: shell non trovato');
  } else {
    // Pagine di contenuto: stili bloccanti (il testo arriva già impaginato),
    // niente preload dell'hero della home.
    html = html.replace(entryCss[0], `<link id="entry-css" rel="stylesheet" crossorigin href="${entryCss[1]}">`);
    html = html.replace(/<link rel="preload" as="image"[^>]*hero-[^>]*>\s*/, '');
    const start = html.indexOf('<div id="root">');
    const end = html.indexOf('<script>', start);
    if (start < 0 || end < 0) throw new Error('#root non trovato in _shell.html');
    html = `${html.slice(0, start)}<div id="root" data-prerendered>${data.body}</div>\n    ${html.slice(end)}`;
    head.push(...routeCss.map((h) => `<link rel="stylesheet" crossorigin href="${h}">`));
  }
  head.push(...preloadJs.map((p) => `<link rel="modulepreload" crossorigin href="${p}">`));

  return html.replace('</head>', `    ${head.join('\n    ')}\n  </head>`);
}

function outFile(route) {
  return route === '/' ? join(DIST, 'index.html') : join(DIST, route.replace(/^\//, ''), 'index.html');
}

/* ── Main ───────────────────────────────────────────────────────────── */

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: 'it-IT',
  reducedMotion: 'reduce',
  userAgent: 'Mozilla/5.0 (compatible; CapperificioPrerender/1.0)',
});
// Consenso già espresso (solo necessari): il banner cookie non finisce nell'HTML.
await context.addInitScript(() => {
  try {
    localStorage.setItem('capperificio_consent', JSON.stringify({ necessary: true, analytics: false, marketing: false }));
  } catch { /* ignore */ }
});
// Niente tracciamenti o risorse esterne durante il pre-render.
await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());

const failed = [];
const skipped = [];
let done = 0;
const queue = [...ROUTES];
async function worker() {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  if (process.env.PRERENDER_DEBUG) {
    page.on('console', (m) => console.log('  [console]', m.type(), m.text().slice(0, 300)));
    page.on('requestfailed', (r) => console.log('  [failed]', r.url().slice(0, 150)));
  }
  // Chiamate ai prodotti fallite → la pagina mostrerebbe i prodotti di riserva
  // (segnaposto): meglio non pre-renderizzarla che darli ai crawler.
  const catalogFailures = [];
  page.on('response', (r) => {
    if (/\/store-api\/(product|product-listing|search|category)/.test(r.url()) && !r.ok()) catalogFailures.push(r.status());
  });
  page.on('requestfailed', (r) => {
    if (/\/store-api\/(product|product-listing|search|category)/.test(r.url())) catalogFailures.push('rete');
  });
  for (let route = queue.shift(); route; route = queue.shift()) {
    errors.length = 0;
    catalogFailures.length = 0;
    try {
      const data = await capture(page, base, route);
      if (data.busy) throw new Error('pagina ancora in caricamento (aria-busy)');
      if (catalogFailures.length) {
        skipped.push(route);
        console.warn(`⚠ ${route}: catalogo Shopware non raggiungibile (${catalogFailures[0]}), pagina lasciata alla SPA`);
        continue;
      }
      const file = outFile(route);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, compose(route, data));
      done++;
      const kb = (Buffer.byteLength(data.body) / 1024).toFixed(0);
      console.log(`✓ ${route}  (${kb} KB${errors.length ? `, ${errors.length} errori JS` : ''})`);
    } catch (e) {
      failed.push(route);
      console.error(`✗ ${route}: ${e.message}${errors.length ? ` | JS: ${errors[0]}` : ''}`);
    }
  }
  await page.close();
}
await Promise.all([worker(), worker(), worker(), worker()]);

await browser.close();
server.close();

console.log(`\nPre-render: ${done}/${ROUTES.length} pagine${skipped.length ? ` (saltate senza catalogo: ${skipped.join(', ')})` : ''}.`);
if (failed.length) {
  console.error(`Pagine non generate: ${failed.join(', ')}`);
  process.exit(1);
}
