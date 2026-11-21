/* Regole della Cassetta in Legno e traduzione dello stato in scena 3D.
   Funzioni pure: la pagina tiene solo `picked` ({ id: quantità }). */

import { PRODUCTS, PRODUCT_BY_ID, TOKENS_TOTAL, MIN_SPECIALITA } from '../../data/natalBox';

/* Vasetti del Capperificio: contano per il minimo di tre. */
export const isSpec = (p) => p.sect === 'capperi' || p.sect === 'caro';

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export const tokens = (n) => plural(n, 'gettone', 'gettoni');

/* Scarta dagli stati salvati i prodotti che non esistono più. */
export const cleanPicked = (picked) => Object.fromEntries(
  Object.entries(picked || {}).filter(([id, n]) => PRODUCT_BY_ID[id] && n > 0),
);

export function summarize(picked) {
  const qty = (p) => picked[p.id] || 0;
  const used = PRODUCTS.reduce((n, p) => n + qty(p) * p.cost, 0);
  const spec = PRODUCTS.filter(isSpec).reduce((n, p) => n + qty(p), 0);
  const left = TOKENS_TOTAL - used;
  const missing = Math.max(0, MIN_SPECIALITA - spec);
  const complete = left === 0 && missing === 0;
  const chosen = PRODUCTS.filter((p) => qty(p) > 0).map((p) => ({ p, qty: qty(p) }));
  const items = chosen.reduce((n, c) => n + c.qty, 0);
  return { used, left, spec, missing, complete, chosen, items };
}

/* Stato di una card: si può aggiungere? Se no, perché.
   Tiene sempre da parte i gettoni che servono per i vasetti mancanti, così
   il cliente non si blocca. */
export function itemState(p, picked, sum) {
  const qty = picked[p.id] || 0;
  const keep = isSpec(p) ? Math.max(0, sum.missing - 1) : sum.missing;
  const tooCostly = p.cost > sum.left;
  const starves = !tooCostly && sum.left - p.cost < keep;

  let reason = '';
  if (tooCostly) reason = sum.left > 0 ? `Vale ${tokens(p.cost)}, te ne resta ${sum.left}` : 'Gettoni finiti';
  else if (starves) reason = `Tieni ${tokens(sum.missing)} per i vasetti del Capperificio`;
  return { qty, canAdd: !tooCostly && !starves, reason };
}

export function addPick(picked, p) {
  return { ...picked, [p.id]: (picked[p.id] || 0) + 1 };
}

export function removePick(picked, id) {
  const next = { ...picked };
  const n = (next[id] || 0) - 1;
  if (n <= 0) delete next[id]; else next[id] = n;
  return next;
}

/* Quali step si possono aprire e quali sono completi.
   Olio e vino sono facoltativi: lo step 2 è "fatto" appena i vasetti ci sono. */
export function stepStatus(sum) {
  const specOk = sum.missing === 0;
  return [
    { reach: true, done: specOk },
    { reach: specOk, done: specOk },
    { reach: specOk, done: sum.complete },
    { reach: sum.complete, done: false },
  ];
}

/* ── Scena 3D ─────────────────────────────────────────────── */
function to3d(p, col, row, key) {
  const m = p.m3;
  return { key, id: p.id, col, row, span: 1, kind: m[0], fill: m[1], title: m[2], sub: m[3], foot: m[4], weight: m[5], glass: m[6], tin: m[7], tag: m[7] };
}

const keyer = (prefix) => {
  const seen = {};
  return (id) => { const k = seen[id] || 0; seen[id] = k + 1; return `${prefix}${id}#${k}`; };
};

/* Cassetta di legno 6×2 (12 posti, ne servono al massimo 11): i primi tre
   vasetti vanno nei vani timbrati davanti a sinistra, il resto riempie prima
   la fila davanti e poi quella dietro. Bottiglie e sacchetti stanno in piedi. */
export const CRATE_COLS = 6;
function layoutCrate(specIds, otherIds, prefix) {
  const FRONT = 1;
  const occ = [Array(CRATE_COLS).fill(0), Array(CRATE_COLS).fill(0)];
  const keyOf = keyer(prefix);
  const out = [];
  for (let c = 0; c < 3; c++) {
    occ[FRONT][c] = 1;
    if (specIds[c]) out.push(to3d(PRODUCT_BY_ID[specIds[c]], c, FRONT, keyOf(specIds[c])));
  }
  specIds.slice(3).concat(otherIds).forEach((id) => {
    for (const r of [FRONT, 0]) for (let c = 0; c < CRATE_COLS; c++) {
      if (!occ[r][c]) { occ[r][c] = 1; out.push(to3d(PRODUCT_BY_ID[id], c, r, keyOf(id))); return; }
    }
  });
  return out;
}

const expand = (picked, pred) => PRODUCTS.filter(pred).flatMap((p) => Array(picked[p.id] || 0).fill(p.id));

const DEMO_SPEC = ['sale-lilliput', 'aceto-lilliput', 'powder'];
const DEMO_REST = ['olio', 'vino-rosso', 'leaves', 'pf-friselle', 'pf-tarallini-vino', 'tn-lenticchie', 'pf-cantucci'];

/* view: 'intro' | 'racale' | 'tokens' | 'done'
   step: indice 0..3 (solo per 'tokens'); added: tipo di box appena messa nel carrello
   giftItems: i vasetti della Box Racale (scatola in lino a 3 finestre) */
export function sceneFor({ view, step, picked, giftItems, added }) {
  if (view === 'racale' || (view === 'done' && added === 'racale')) {
    return { mode: 'gift', gift: giftItems.map((id, i) => to3d(PRODUCT_BY_ID[id], 0, 0, `gift-${id}-${i}`)), items: [], reserved: 0, bow: false, lid: false, wine: null };
  }
  if (view === 'intro') {
    return { mode: 'crate', items: layoutCrate(DEMO_SPEC, DEMO_REST, 'demo-'), gift: [], reserved: 0, bow: true, lid: false, wine: null };
  }
  const sum = summarize(picked);
  const items = layoutCrate(expand(picked, isSpec), expand(picked, (p) => !isSpec(p)), '');
  const review = view === 'done' || step === 3;
  return {
    mode: 'crate',
    items,
    gift: [],
    reserved: review ? 0 : Math.max(0, 3 - Math.min(3, sum.spec)),
    bow: review && sum.complete,
    lid: false,
    wine: null,
  };
}
