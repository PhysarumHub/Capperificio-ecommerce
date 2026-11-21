/**
 * HTML lato server per le pagine con dati live (schede prodotto, collezioni)
 * e i file per i motori di risposta AI (llms.txt, llms-full.txt).
 *
 * Le pagine di contenuto (guide, assistenza, storia…) sono pre-renderizzate
 * alla build (scripts/prerender.mjs). Prodotti e collezioni no: prezzo e
 * disponibilità cambiano, quindi Express parte dalla shell della SPA
 * (dist/_shell.html) e ci inietta a ogni richiesta:
 *   - title, description, canonical, Open Graph, JSON-LD (Product con
 *     offerta live, CollectionPage + ItemList, BreadcrumbList);
 *   - un'anteprima semantica del contenuto (nome, prezzo, descrizione,
 *     immagine) che React sostituisce appena parte.
 * Gli id dei JSON-LD sono quelli di useSEO (jsonld-page, jsonld-breadcrumb):
 * il client li sovrascrive invece di duplicarli.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { slugify } from '../src/lib/utils/slug.js';
import { isProductAvailable } from '../src/lib/utils/availability.js';
import { COMPANY } from '../src/data/company.js';
import { COLLECTIONS } from '../src/data/collections.js';
import { GUIDES, GUIDE_GROUPS, guidePath } from '../src/data/guide.js';
import {
  HELP_FACTS, HELP_CATEGORIES, HELP_ARTICLES, helpArticlePath, getHelpCategory,
} from '../src/data/assistenza.js';

const SITE = COMPANY.siteUrl;
const SITE_NAME = 'Capperificio di Racale';
const DEFAULT_IMAGE = `${SITE}/images/capperificio-caro-capperi-racale.webp`;
const HIDDEN_PREFIXES = ['XMAS-'];
const B2B_CATEGORY_ID = process.env.B2B_CATEGORY_ID || process.env.VITE_B2B_CATEGORY_ID || '';

/* ── Utilità ─────────────────────────────────────────────────────────── */

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** JSON dentro <script>: niente "</script>" o "<!--" che chiudano il tag. */
const jsonScript = (id, data) =>
  `<script type="application/ld+json" id="${id}">${JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c')}</script>`;

const plain = (html) => String(html || '')
  .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();

function truncate(text, max = 155) {
  if (!text || text.length <= max) return text;
  const cut = text.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > 40 ? cut.slice(0, sp) : cut).trim()}…`;
}

/** HTML descrizione da Shopware (scritto in admin): via script, stili ed eventi. */
const sanitize = (html) => String(html || '')
  .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, '')
  .replace(/<(script|style|iframe|object|embed)[^>]*\/?>/gi, '')
  .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '');

const formatPrice = (n) => `€ ${Number(n).toFixed(2).replace('.', ',')}`;

/* ── Shell ───────────────────────────────────────────────────────────── */

let shellCache = null;
function shell() {
  // In produzione la shell non cambia finché il container gira.
  if (!shellCache || process.env.NODE_ENV !== 'production') {
    shellCache = readFileSync(join(process.cwd(), 'dist', '_shell.html'), 'utf8');
  }
  return shellCache;
}

const SEO_TAGS = [
  /<title>[\s\S]*?<\/title>\s*/,
  /<meta name="description"[^>]*>\s*/,
  /<meta name="robots"[^>]*>\s*/,
  /<link rel="canonical"[^>]*>\s*/,
  /<meta property="og:(title|description|image|url|type|site_name)"[^>]*>\s*/g,
  /<meta name="twitter:(card|title|description|image)"[^>]*>\s*/g,
  /<link rel="alternate" hreflang="[^"]*"[^>]*>\s*/g,
];

/**
 * Shell della SPA con i meta della pagina e un'anteprima in #root.
 * Stessi tag che produce useSEO nel browser.
 */
export function renderPage({
  title, description, path, image = DEFAULT_IMAGE, type = 'website',
  jsonLd = null, breadcrumbs = null, noindex = false, body = '', preloadImage = null,
}) {
  let html = shell();
  for (const re of SEO_TAGS) html = html.replace(re, '');

  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const url = `${SITE}${path}`;
  const img = image?.startsWith('http') ? image : `${SITE}${image}`;
  const head = [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<link rel="alternate" hreflang="it" href="${esc(url)}">`,
    `<link rel="alternate" hreflang="x-default" href="${esc(url)}">`,
    `<meta property="og:title" content="${esc(fullTitle)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(img)}">`,
    `<meta property="og:type" content="${esc(type)}">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(fullTitle)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${esc(img)}">`,
    `<style>${SSR_CSS}</style>`,
  ];
  if (jsonLd) head.push(jsonScript('jsonld-page', jsonLd));
  if (breadcrumbs?.length) {
    head.push(jsonScript('jsonld-breadcrumb', {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, i) => ({
        '@type': 'ListItem', position: i + 1, name: b.name, item: `${SITE}${b.path}`,
      })),
    }));
  }
  // L'hero della home non serve qui; l'immagine principale della pagina sì.
  html = html.replace(/<link rel="preload" as="image"[^>]*hero-[^>]*>\s*/, '');
  if (preloadImage) head.push(`<link rel="preload" as="image" href="${esc(preloadImage)}" fetchpriority="high">`);

  const start = html.indexOf('<div id="root">');
  const end = html.indexOf('<script>', start);
  if (start >= 0 && end > start) {
    html = `${html.slice(0, start)}<div id="root" data-ssr>${body}</div>\n    ${html.slice(end)}`;
  }
  return html.replace('</head>', `    ${head.join('\n    ')}\n  </head>`);
}

/* Stili dell'anteprima: stessi colori e font del sito, barra e header
   riusano le classi .boot-* già definite nella shell. */
const SSR_CSS = [
  '.ssr{background:#FCF3DF;color:#2C4A2C;font:300 16px/1.6 Paralucent,system-ui,sans-serif;padding:24px 32px 64px;max-width:1280px;margin:0 auto}',
  '.ssr a{color:#547054}',
  '.ssr-crumbs{font-size:13px;margin:0 0 24px;color:#6B8A6B}.ssr-crumbs a{color:inherit;text-decoration:none}',
  '.ssr h1{font:italic 400 clamp(34px,5vw,56px)/1.05 "PP Editorial Old",Georgia,serif;margin:0 0 16px;color:#2C4A2C}',
  '.ssr-pdp{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:48px;align-items:start}',
  '.ssr-pdp img{width:100%;height:auto;aspect-ratio:1;object-fit:cover;border-radius:10px;background:#EAF0E5}',
  '.ssr-price{font:500 22px/1.2 Paralucent,system-ui,sans-serif;margin:0 0 6px}',
  '.ssr-stock{font-size:14px;margin:0 0 24px;color:#6B8A6B}',
  '.ssr-desc{max-width:60ch}',
  '.ssr-lead{max-width:60ch;margin:0 0 32px}',
  '.ssr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px;list-style:none;padding:0;margin:0}',
  '.ssr-grid a{display:block;text-decoration:none;color:#2C4A2C}',
  '.ssr-grid img{width:100%;height:auto;aspect-ratio:1;object-fit:cover;border-radius:10px;background:#EAF0E5;display:block;margin-bottom:10px}',
  '.ssr-grid span{display:block}.ssr-grid .n{font-weight:500}',
  '@media (max-width:768px){.ssr{padding:16px 16px 48px}.ssr-pdp{grid-template-columns:1fr;gap:24px}}',
].join('');

const SSR_TOP = [
  `<div class="boot-bar"><span>Spedizione gratuita sopra €${HELP_FACTS.freeShippingFrom}</span></div>`,
  '<div class="boot-header"><a href="/" aria-label="Capperificio di Racale, home"><img src="/images/Logo_icona.svg" alt="" width="44" height="44"></a></div>',
].join('');

function crumbsHtml(items) {
  return `<nav class="ssr-crumbs" aria-label="Percorso">${items
    .map((b, i) => (i < items.length - 1 ? `<a href="${esc(b.path)}">${esc(b.name)}</a> › ` : `<span>${esc(b.name)}</span>`))
    .join('')}</nav>`;
}

/* ── Catalogo da Shopware (cache in memoria) ─────────────────────────── */

const CACHE_MS = 10 * 60 * 1000;
const MIN_REFRESH_MS = 60 * 1000;
let catalog = { at: 0, products: [], bySlug: new Map(), byId: new Map() };
let inflight = null;

function swConfig() {
  return {
    url: (process.env.SHOPWARE_API_URL || '').replace(/\/$/, ''),
    key: process.env.SHOPWARE_ACCESS_KEY || '',
  };
}

async function fetchCatalog() {
  const { url, key } = swConfig();
  if (!url || !key) throw new Error('Shopware non configurato');
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const resp = await fetch(`${url}/product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'sw-access-key': key },
      body: JSON.stringify({
        limit: 100,
        page,
        filter: [
          { type: 'equals', field: 'active', value: true },
          { type: 'equals', field: 'parentId', value: null },
        ],
        associations: { cover: { associations: { media: { associations: { thumbnails: {} } } } }, media: {} },
        'total-count-mode': 'none',
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(`Store API ${resp.status}`);
    const batch = data?.elements || [];
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

async function getCatalog({ force = false } = {}) {
  const age = Date.now() - catalog.at;
  if (!force && age < CACHE_MS && catalog.products.length) return catalog;
  if (force && age < MIN_REFRESH_MS && catalog.products.length) return catalog;
  if (!inflight) {
    inflight = fetchCatalog()
      .then((products) => {
        const bySlug = new Map();
        const byId = new Map();
        for (const p of products) {
          byId.set(p.id, p);
          const slug = slugify(p.translated?.name || p.name);
          if (slug && !bySlug.has(slug)) bySlug.set(slug, p);
        }
        catalog = { at: Date.now(), products, bySlug, byId };
        return catalog;
      })
      .finally(() => { inflight = null; });
  }
  try {
    return await inflight;
  } catch (e) {
    if (catalog.products.length) return catalog; // dati vecchi meglio di niente
    throw e;
  }
}

const isHidden = (p) => HIDDEN_PREFIXES.some((x) => String(p?.productNumber || '').startsWith(x));
const isB2B = (p) => B2B_CATEGORY_ID && (p.categoryTree || []).includes(B2B_CATEGORY_ID);
const productName = (p) => p.translated?.name || p.name || '';
const productSlug = (p) => slugify(productName(p)) || p.id;

/** URL immagine pubblico (Shopware genera host interni: si tiene solo il path). */
function mediaPath(raw) {
  if (!raw) return null;
  try {
    const u = new URL(raw, SITE);
    if (!/^\/(media|thumbnail)\//.test(u.pathname)) return null;
    return u.pathname.split('/').map((s) => encodeURIComponent(decodeURIComponent(s))).join('/') + u.search;
  } catch {
    return null;
  }
}

function productImage(p, width = 1920) {
  const media = p.cover?.media || p.media?.[0]?.media;
  if (!media) return '/images/PRODUCTSTILL.jpg';
  const thumbs = [...(media.thumbnails || [])].sort((a, b) => Math.abs(a.width - width) - Math.abs(b.width - width));
  return mediaPath(thumbs[0]?.url) || mediaPath(media.url) || '/images/PRODUCTSTILL.jpg';
}

function productPrice(p) {
  const v = p.calculatedPrice?.unitPrice || p.calculatedCheapestPrice?.unitPrice || p.price?.[0]?.gross;
  return typeof v === 'number' && v > 0 ? v : null;
}

/* ── Scheda prodotto ─────────────────────────────────────────────────── */

/**
 * Risultato per /prodotti/:slug:
 *   { status: 200, html } | { status: 301, location } | { status: 404, html }
 */
export async function renderProduct(slug) {
  let cat = await getCatalog();
  let p = cat.bySlug.get(slug) || cat.byId.get(slug.replace(/-/g, ''));
  if (!p) {
    cat = await getCatalog({ force: true }); // prodotto appena creato?
    p = cat.bySlug.get(slug) || cat.byId.get(slug.replace(/-/g, ''));
  }
  if (!p) return { status: 404, html: renderNotFound(`/prodotti/${slug}`) };
  if (isHidden(p)) return { status: 301, location: '/box-di-natale' };
  const canonicalSlug = productSlug(p);
  if (canonicalSlug !== slug) return { status: 301, location: `/prodotti/${canonicalSlug}` };

  const name = productName(p);
  const descHtml = p.translated?.description || p.description || '';
  const description = truncate(plain(descHtml)) || `Scopri ${name} — capperi artigianali dal Salento.`;
  const path = `/prodotti/${slug}`;
  const image = productImage(p, 1920);
  const imageCard = productImage(p, 800);
  const price = productPrice(p);
  const inStock = isProductAvailable(p);
  const sku = p.productNumber || p.id;
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Tutti i Prodotti', path: '/collections/all' },
    { name, path },
  ];

  // Stesso schema di ProductPage.jsx (prezzo e disponibilità live).
  const jsonLd = {
    '@type': 'Product',
    name,
    description: plain(descHtml).slice(0, 5000) || description,
    image: `${SITE}${image}`,
    sku,
    mpn: sku,
    ...(p.ean ? { gtin13: p.ean } : {}),
    brand: { '@type': 'Brand', name: COMPANY.brand },
    manufacturer: { '@id': `${SITE}/#organization` },
    countryOfOrigin: { '@type': 'Country', name: 'IT' },
    offers: {
      '@type': 'Offer',
      url: `${SITE}${path}`,
      ...(price != null ? { price: price.toFixed(2) } : {}),
      priceCurrency: 'EUR',
      priceValidUntil: `${new Date().getFullYear()}-12-31`,
      itemCondition: 'https://schema.org/NewCondition',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: COMPANY.legalNameShort },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IT' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' },
        },
        freeShippingThreshold: { '@type': 'MonetaryAmount', value: HELP_FACTS.freeShippingFrom, currency: 'EUR' },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IT',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: HELP_FACTS.withdrawalDays,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/ReturnShippingFees',
      },
    },
  };

  const body = `${SSR_TOP}<main id="main-content" class="ssr">${crumbsHtml(breadcrumbs)}
<article class="ssr-pdp">
<img src="${esc(imageCard)}" alt="${esc(name)}" width="800" height="800" fetchpriority="high">
<div>
<h1>${esc(name)}</h1>
${price != null ? `<p class="ssr-price">${p.childCount > 0 ? 'da ' : ''}${formatPrice(price)}</p>` : ''}
<p class="ssr-stock">${inStock ? 'Disponibile · spedito da Racale in ' + esc(HELP_FACTS.prepDays) : 'Al momento esaurito'}</p>
<div class="ssr-desc">${sanitize(descHtml)}</div>
<p><a href="/guide/quale-calibro-scegliere">Quale calibro scegliere</a> · <a href="/guide/come-dissalare-i-capperi">Come dissalare i capperi</a> · <a href="/spedizioni-e-resi">Spedizioni e resi</a></p>
</div>
</article></main>`;

  return {
    status: 200,
    html: renderPage({
      title: name, description, path, image, type: 'product', jsonLd, breadcrumbs, body, preloadImage: imageCard,
    }),
  };
}

/* ── Collezioni ──────────────────────────────────────────────────────── */

export async function renderCollection(slug) {
  if (!COLLECTIONS[slug]) return { status: 301, location: '/collections/all' };
  const collection = COLLECTIONS[slug];
  const path = `/collections/${slug}`;
  const breadcrumbs = [{ name: 'Home', path: '/' }, { name: collection.title, path }];

  let products = [];
  try {
    products = (await getCatalog()).products.filter((p) => !isHidden(p) && !isB2B(p));
  } catch { /* senza Shopware: solo intestazione */ }

  const items = products.map((p) => ({
    name: productName(p), url: `/prodotti/${productSlug(p)}`, image: productImage(p, 600), price: productPrice(p),
  }));

  const jsonLd = {
    '@type': 'CollectionPage',
    name: collection.title,
    description: collection.description,
    isPartOf: { '@id': `${SITE}/#website` },
    ...(items.length ? {
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: items.length,
        itemListElement: items.map((it, i) => ({
          '@type': 'ListItem', position: i + 1, url: `${SITE}${it.url}`, name: it.name,
        })),
      },
    } : {}),
  };

  const body = `${SSR_TOP}<main id="main-content" class="ssr">${crumbsHtml(breadcrumbs)}
<h1>${esc(collection.title)}</h1>
<p class="ssr-lead">${esc(collection.description)}</p>
<ul class="ssr-grid">${items.map((it, i) => `<li><a href="${esc(it.url)}">
<img src="${esc(it.image)}" alt="${esc(it.name)}" width="600" height="600"${i > 3 ? ' loading="lazy"' : ''}>
<span class="n">${esc(it.name)}</span>${it.price != null ? `<span>${formatPrice(it.price)}</span>` : ''}</a></li>`).join('')}</ul>
</main>`;

  return {
    status: 200,
    html: renderPage({ title: collection.title, description: collection.description, path, jsonLd, breadcrumbs, body }),
  };
}

/** La shell della SPA così com'è (fallback se Shopware non risponde). */
export const rawShell = () => shell();

export function renderNotFound(path) {
  return renderPage({
    title: 'Pagina non trovata',
    description: 'La pagina che cerchi non esiste più o è stata spostata.',
    path,
    noindex: true,
  });
}

/* ── llms.txt / llms-full.txt (AEO) ──────────────────────────────────── */

const VARS = {
  email: COMPANY.email,
  emailOrdini: COMPANY.emailOrders,
  emailB2B: COMPANY.emailB2B,
  whatsapp: COMPANY.whatsapp,
  soglia: `€ ${HELP_FACTS.freeShippingFrom}`,
  prep: HELP_FACTS.prepDays,
  deliveryIT: HELP_FACTS.deliveryIT,
  deliveryEU: HELP_FACTS.deliveryEU,
};
const fill = (t) => String(t || '').replace(/\{(\w+)\}/g, (m, k) => VARS[k] ?? m);
/** Testo con **grassetto** e [link](/path): link resi assoluti per gli LLM. */
const md = (t) => fill(t).replace(/\]\((\/[^)]*)\)/g, `](${SITE}$1)`);
const mdPlain = (t) => fill(t).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[(.+?)\]\((.+?)\)/g, '$1');

const PAGES = [
  ['La nostra storia', '/storia', 'Tre generazioni di raccoglitori di capperi a Racale, nel Salento.'],
  ['Il territorio', '/territorio', 'Racale, tra la pietra e il mare: perché il cappero cresce qui.'],
  ['Il processo produttivo', '/processo-produttivo', 'Dalla raccolta a mano alla salatura con sale marino integrale, fino al vasetto.'],
  ['Spedizioni e resi', '/spedizioni-e-resi', 'Costi, tempi di consegna, recesso, garanzia.'],
  ['Domande frequenti', '/faq', 'Tutte le risposte del centro assistenza in una pagina.'],
  ['Centro assistenza', '/assistenza', 'Ordini, spedizioni, resi, conservazione, regali, B2B.'],
  ['Ristoranti e rivenditori (B2B)', '/b2b', 'Formati horeca e listino per professionisti.'],
  ['Box di Natale', '/box-di-natale', 'Box regalo con prodotti del Salento.'],
  ['Contatti', '/contatti', 'Email, WhatsApp, sede.'],
];

function facts() {
  return [
    `- Azienda: ${COMPANY.brand} (marchio Capperificio Caro), ${COMPANY.legalNameShort}, P.IVA ${COMPANY.vat}`,
    `- Sede: ${COMPANY.addressLine}`,
    `- Prodotti: capperi di Racale al sale marino integrale e all'aceto in 4 calibri (Lilliput, Occhio di Pernice, Lacrimella, Capperone), cucunci, foglie di cappero, polvere di cappero`,
    `- Spedizione: gratuita in Italia da € ${HELP_FACTS.freeShippingFrom}; preparazione ${HELP_FACTS.prepDays}; consegna Italia ${HELP_FACTS.deliveryIT}, UE ${HELP_FACTS.deliveryEU}`,
    `- Recesso: ${HELP_FACTS.withdrawalDays} giorni; garanzia legale ${HELP_FACTS.warrantyYears} anni`,
    `- Contatti: ${COMPANY.email} · WhatsApp ${COMPANY.whatsapp}`,
  ].join('\n');
}

async function productLines() {
  try {
    const { products } = await getCatalog();
    return products.filter((p) => !isHidden(p) && !isB2B(p)).map((p) => {
      const price = productPrice(p);
      const d = truncate(plain(p.translated?.description || p.description || ''), 140);
      return `- [${productName(p)}](${SITE}/prodotti/${productSlug(p)})${price != null ? ` — ${formatPrice(price)}` : ''}${d ? `: ${d}` : ''}`;
    });
  } catch {
    return [`- [Tutti i prodotti](${SITE}/collections/all)`];
  }
}

export async function renderLlmsTxt() {
  const guides = GUIDE_GROUPS.flatMap((g) => GUIDES.filter((x) => x.group === g.id))
    .map((g) => `- [${g.title}](${SITE}${guidePath(g)}): ${g.short}`);
  const help = HELP_CATEGORIES.map((c) => {
    const qs = HELP_ARTICLES.filter((a) => a.cat === c.slug)
      .map((a) => `- [${a.q}](${SITE}${helpArticlePath(a)}): ${mdPlain(a.short)}`);
    return `### ${c.title}\n\n${qs.join('\n')}`;
  });
  return [
    `# ${COMPANY.brand} — Capperificio Caro`,
    '',
    `> Produttori di capperi a Racale (Lecce, Salento, Puglia). Raccolta a mano, salatura con sale marino integrale, vendita online in Italia e in Europa. Il sito contiene guide pratiche sul cappero (come dissalarlo, conservarlo, scegliere il calibro) scritte da chi lo coltiva.`,
    '',
    facts(),
    '',
    `Testo completo di guide e risposte: ${SITE}/llms-full.txt`,
    '',
    '## Guide',
    '',
    ...guides,
    '',
    '## Prodotti',
    '',
    ...(await productLines()),
    '',
    '## Azienda e servizio',
    '',
    ...PAGES.map(([t, p, d]) => `- [${t}](${SITE}${p}): ${d}`),
    '',
    '## Domande frequenti',
    '',
    help.join('\n\n'),
    '',
  ].join('\n');
}

function guideToMarkdown(g) {
  const out = [`## ${g.title}`, '', `URL: ${SITE}${guidePath(g)}`, '', g.lead, ''];
  for (const b of g.blocks) {
    if (b.title) out.push(`### ${b.title}`, '');
    if (b.text) out.push(md(b.text), '');
    switch (b.type) {
      case 'brief': out.push(...b.items.map((it) => `- **${it.big}**: ${it.small}`), ''); break;
      case 'steps': out.push(...b.steps.map((s, i) => `${i + 1}. **${s.title}** — ${s.text}`), ''); break;
      case 'split': out.push(...b.paras.map((p) => `${md(p)}\n`)); break;
      case 'compare':
        for (const col of b.cols) out.push(`**${col.title}**`, ...col.rows.map(([k, v]) => `- ${k}: ${v}`), '');
        break;
      case 'fact': out.push(`> ${b.big} — ${b.text}`, ''); break;
      case 'cards': out.push(...b.cards.map((c) => `- **${c.title}**: ${md(c.text)}`), ''); break;
      case 'faq': out.push(...b.items.flatMap((it) => [`**${it.q}**`, md(it.a), '']));
        break;
      default: break;
    }
    if (b.note) out.push(`_${b.note}_`, '');
  }
  return out.join('\n');
}

function helpToMarkdown(a) {
  const cat = getHelpCategory(a.cat);
  const body = a.body.map((blk) => {
    if (typeof blk === 'string') return md(blk);
    if (blk.ul) return blk.ul.map((x) => `- ${md(x)}`).join('\n');
    if (blk.ol) return blk.ol.map((x, i) => `${i + 1}. ${md(x)}`).join('\n');
    if (blk.note) return `> ${md(blk.note)}`;
    return '';
  }).filter(Boolean).join('\n\n');
  return `### ${a.q}\n\nArgomento: ${cat?.title || a.cat} · URL: ${SITE}${helpArticlePath(a)}\n\n${body}\n`;
}

export async function renderLlmsFullTxt() {
  return [
    `# ${COMPANY.brand} — guide e risposte complete`,
    '',
    facts(),
    '',
    '# Guide',
    '',
    ...GUIDES.map(guideToMarkdown),
    '# Centro assistenza',
    '',
    ...HELP_ARTICLES.map(helpToMarkdown),
    '# Prodotti',
    '',
    ...(await productLines()),
    '',
  ].join('\n');
}
