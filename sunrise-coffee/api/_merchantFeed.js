/**
 * Feed prodotti per Google Merchant Center (RSS 2.0 + namespace g:).
 * Servito da server.js su /feeds/google-merchant.xml, letto da Google a
 * intervalli regolari: prezzi, disponibilità e immagini arrivano live da
 * Shopware, quindi non c'è nulla da aggiornare a mano.
 *
 * Regole:
 * - un item per prodotto acquistabile: i "genitori" con varianti non sono
 *   acquistabili, vanno in feed le varianti (legate da item_group_id);
 * - il link della variante apre la scheda già su quella variante
 *   (ProductDetail legge ?variant=<nome opzione>);
 * - esclusi i prodotti con prezzo 0 e quelli in EXCLUDE_PREFIXES
 *   (es. le Box di Natale finché la pagina è nascosta);
 * - nessun EAN in Shopware: identifier_exists=no + mpn = codice prodotto.
 */
import { slugify } from '../src/lib/utils/slug.js';
import { COMPANY } from '../src/data/company.js';

const SITE = COMPANY.siteUrl;
const PAGE_SIZE = 100;   // MAX_LIMIT della Store API
const MAX_PAGES = 50;

// Prodotti tenuti fuori dal feed (prefisso del codice prodotto).
const EXCLUDE_PREFIXES = ['XMAS-'];

// Categoria Google (tassonomia ufficiale, in inglese) e tipo prodotto interno.
function classify(name) {
  const n = name.toLowerCase();
  if (n.includes('polvere')) {
    return { gpc: 'Food, Beverages & Tobacco > Food Items > Seasonings & Spices', type: 'Capperi > Polvere di cappero' };
  }
  const gpc = 'Food, Beverages & Tobacco > Food Items > Condiments & Sauces';
  if (n.includes('foglie')) return { gpc, type: 'Capperi > Foglie di cappero' };
  if (n.includes('cucunci')) return { gpc, type: 'Capperi > Cucunci' };
  if (n.includes('germogli')) return { gpc, type: 'Capperi > Germogli' };
  if (n.includes('aceto')) return { gpc, type: 'Capperi > All’aceto di vino' };
  return { gpc, type: 'Capperi > Al sale marino' };
}

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const plain = (html) => String(html || '')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();

/* Le URL media di Shopware arrivano con l'host interno o in http e con nomi
   file "sporchi" (spazi, virgole): Google vuole https e un URL valido. Il
   sito pubblica /media e /thumbnail tramite nginx. */
function imageUrl(raw) {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (!u.pathname.startsWith('/media/') && !u.pathname.startsWith('/thumbnail/')) return null;
    const path = u.pathname.split('/').map((seg) => encodeURIComponent(decodeURIComponent(seg))).join('/');
    return `${SITE}${path}${u.search}`;
  } catch {
    return null;
  }
}

function productImages(p) {
  const cover = imageUrl(p.cover?.media?.url);
  const others = [...(p.media || [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((m) => imageUrl(m.media?.url))
    .filter((u) => u && u !== cover);
  return { main: cover || others[0] || null, extra: others.filter((u) => u !== cover).slice(0, 10) };
}

const optionName = (o) => o?.translated?.name || o?.name || '';

// Nel titolo vanno solo le opzioni che descrivono il prodotto (calibro,
// formato); il peso netto arriva dalla proprietà "Peso netto".
const TITLE_OPTION_GROUPS = ['Calibro', 'Formato'];

function propertyValue(p, group) {
  const o = (p?.properties || []).find((x) => (x.group?.translated?.name || x.group?.name) === group);
  return o ? optionName(o) : '';
}

/* "75 g" / "1,5 kg" / "500 ml" → "75g" per unit_pricing_measure (null se non leggibile). */
function unitMeasure(text) {
  const m = String(text || '').replace(',', '.').match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l)\b/i);
  return m ? `${m[1]}${m[2].toLowerCase()}` : null;
}
const groupName = (o) => o?.group?.translated?.name || o?.group?.name || '';

async function fetchAll(swUrl, swKey) {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const resp = await fetch(`${swUrl}/product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'sw-access-key': swKey },
      body: JSON.stringify({
        limit: PAGE_SIZE,
        page,
        filter: [{ type: 'equals', field: 'active', value: true }],
        associations: {
          cover: {},
          media: {},
          options: { associations: { group: {} } },
          properties: { associations: { group: {} } },
        },
        'total-count-mode': 'none',
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(`Store API ${resp.status}: ${data?.errors?.[0]?.detail || 'nessun dettaglio'}`);
    const batch = data?.elements || [];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return all;
}

/* Prodotti Shopware → righe del feed (oggetti semplici, testabili). */
export function buildItems(products) {
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const items = [];

  for (const p of products) {
    const number = p.productNumber || p.id;
    if (EXCLUDE_PREFIXES.some((x) => number.startsWith(x))) continue;
    if (!p.parentId && (p.childCount || 0) > 0) continue; // genitore: vanno le varianti

    const parent = p.parentId ? byId[p.parentId] : null;
    if (parent && EXCLUDE_PREFIXES.some((x) => (parent.productNumber || '').startsWith(x))) continue;

    const baseName = p.translated?.name || p.name || parent?.translated?.name || parent?.name;
    const price = p.calculatedPrice?.unitPrice ?? p.calculatedPrices?.[0]?.unitPrice;
    if (!baseName || !price) continue;

    const options = (p.options || []).map((o) => ({ group: groupName(o), name: optionName(o) })).filter((o) => o.name);
    const slug = slugify(parent?.translated?.name || parent?.name || baseName) || (parent?.id || p.id);
    const link = `${SITE}/prodotti/${slug}${parent && options[0] ? `?variant=${encodeURIComponent(options[0].name)}` : ''}`;

    const netWeight = propertyValue(p, 'Peso netto') || propertyValue(parent, 'Peso netto');
    const titleBits = [
      ...options.filter((o) => TITLE_OPTION_GROUPS.includes(o.group)).map((o) => `${o.group} ${o.name}`),
      netWeight,
    ].filter(Boolean);
    const title = titleBits.length ? `${baseName} – ${titleBits.join(', ')}` : baseName;
    const measure = unitMeasure(netWeight);

    const images = productImages((p.cover || p.media?.length) ? p : (parent || p));
    if (!images.main) continue; // Google rifiuta gli articoli senza immagine

    const inStock = p.available !== false && (p.availableStock ?? p.stock ?? 0) > 0;
    const { gpc, type } = classify(baseName);
    const desc = plain(p.translated?.description || p.description || parent?.translated?.description || '') || baseName;

    items.push({
      id: number,
      groupId: parent ? (parent.productNumber || parent.id) : null,
      title: title.slice(0, 150),
      description: desc.slice(0, 5000),
      link,
      image: images.main,
      extraImages: images.extra,
      availability: inStock ? 'in_stock' : 'out_of_stock',
      price: `${Number(price).toFixed(2)} EUR`,
      brand: COMPANY.brand,
      mpn: number,
      gpc,
      type,
      weightKg: p.weight || parent?.weight || null,
      measure,
    });
  }
  return items;
}

export function renderFeed(items) {
  const now = new Date().toUTCString();
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '<channel>',
    `<title>${esc(COMPANY.brand)}</title>`,
    `<link>${SITE}</link>`,
    `<description>Prodotti ${esc(COMPANY.brand)}</description>`,
    `<lastBuildDate>${now}</lastBuildDate>`,
  ];
  for (const it of items) {
    lines.push(
      '<item>',
      `  <g:id>${esc(it.id)}</g:id>`,
      it.groupId ? `  <g:item_group_id>${esc(it.groupId)}</g:item_group_id>` : '',
      `  <g:title>${esc(it.title)}</g:title>`,
      `  <g:description>${esc(it.description)}</g:description>`,
      `  <g:link>${esc(it.link)}</g:link>`,
      `  <g:image_link>${esc(it.image)}</g:image_link>`,
      ...it.extraImages.map((u) => `  <g:additional_image_link>${esc(u)}</g:additional_image_link>`),
      `  <g:availability>${it.availability}</g:availability>`,
      `  <g:price>${it.price}</g:price>`,
      '  <g:condition>new</g:condition>',
      `  <g:brand>${esc(it.brand)}</g:brand>`,
      `  <g:mpn>${esc(it.mpn)}</g:mpn>`,
      '  <g:identifier_exists>no</g:identifier_exists>',
      `  <g:google_product_category>${esc(it.gpc)}</g:google_product_category>`,
      `  <g:product_type>${esc(it.type)}</g:product_type>`,
      it.measure ? `  <g:unit_pricing_measure>${it.measure}</g:unit_pricing_measure>` : '',
      it.measure ? `  <g:unit_pricing_base_measure>${/l$/.test(it.measure) ? '1l' : '1kg'}</g:unit_pricing_base_measure>` : '',
      it.weightKg ? `  <g:shipping_weight>${Number(it.weightKg).toFixed(2)} kg</g:shipping_weight>` : '',
      '</item>',
    );
  }
  lines.push('</channel>', '</rss>');
  return lines.filter(Boolean).join('\n');
}

export async function generateMerchantFeed() {
  const swUrl = (process.env.SHOPWARE_API_URL || '').replace(/\/$/, '');
  const swKey = process.env.SHOPWARE_ACCESS_KEY || '';
  if (!swUrl || !swKey) throw new Error('SHOPWARE_API_URL o SHOPWARE_ACCESS_KEY mancanti');
  const products = await fetchAll(swUrl, swKey);
  const items = buildItems(products);
  return { xml: renderFeed(items), count: items.length };
}
