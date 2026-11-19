/* Regole della Box a Gettoni e traduzione dello stato in scena 3D.
   Funzioni pure: la pagina tiene solo `picked` ({ id: quantità }). */

import { PRODUCTS, PRODUCT_BY_ID, TOKENS_TOTAL, MIN_SPECIALITA } from '../../data/natalBox';

export const isSpec = (p) => p.sect === 'capperi' || p.sect === 'caro';

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export const tokens = (n) => plural(n, 'gettone', 'gettoni');

export function summarize(picked) {
  const qty = (p) => picked[p.id] || 0;
  const used = PRODUCTS.reduce((n, p) => n + qty(p) * p.cost, 0);
  const spec = PRODUCTS.filter(isSpec).reduce((n, p) => n + qty(p), 0);
  const vo = PRODUCTS.find((p) => p.sect === 'vo' && qty(p) > 0) || null;
  const left = TOKENS_TOTAL - used;
  const missing = Math.max(0, MIN_SPECIALITA - spec);
  const complete = left === 0 && missing === 0 && !!vo;
  const chosen = PRODUCTS.filter((p) => qty(p) > 0).map((p) => ({ p, qty: qty(p) }));
  const items = chosen.reduce((n, c) => n + c.qty, 0);
  return { used, left, spec, missing, vo, needVo: vo ? 0 : 1, complete, chosen, items };
}

/* Stato di una card: si può aggiungere? Se no, perché.
   Le regole evitano che il cliente si blocchi: tiene sempre da parte i
   gettoni che servono per le specialità mancanti e per il vino/olio. */
export function itemState(p, picked, sum) {
  const qty = picked[p.id] || 0;
  const isVo = p.sect === 'vo';
  // il vino/olio è esclusivo: il gettone dell'altro già scelto torna libero
  const otherVo = isVo
    ? PRODUCTS.filter((o) => o.sect === 'vo' && o.id !== p.id).reduce((n, o) => n + (picked[o.id] || 0) * o.cost, 0)
    : 0;
  const budget = sum.left + otherVo;
  const keep = isVo ? sum.missing : (isSpec(p) ? Math.max(0, sum.missing - 1) : sum.missing) + sum.needVo;
  const atMax = p.max != null && qty >= p.max;
  const tooCostly = p.cost > budget;
  const starves = !isVo && sum.left - p.cost < keep;

  let reason = '';
  if (atMax) reason = isVo ? 'Nella tua scatola' : 'Massimo raggiunto';
  else if (tooCostly) reason = budget > 0 ? `Vale ${tokens(p.cost)}, te ne resta ${budget}` : 'Gettoni finiti';
  else if (starves) {
    if (sum.needVo && !isSpec(p)) reason = `Tieni ${tokens(keep)} per specialità e vino/olio`;
    else if (sum.needVo) reason = 'Tieni 1 gettone per il vino o l’olio';
    else reason = `Tieni ${tokens(sum.missing)} per le specialità`;
  }
  const swap = isVo && !qty && otherVo > 0;
  return { qty, canAdd: !atMax && !tooCostly && !starves, reason, isVo, swap };
}

export function addPick(picked, p) {
  const next = { ...picked };
  if (p.sect === 'vo') {
    PRODUCTS.filter((o) => o.sect === 'vo').forEach((o) => delete next[o.id]);
    next[p.id] = 1;
    return next;
  }
  next[p.id] = (next[p.id] || 0) + 1;
  return next;
}

export function removePick(picked, id) {
  const next = { ...picked };
  const n = (next[id] || 0) - 1;
  if (n <= 0) delete next[id]; else next[id] = n;
  return next;
}

/* Quali step si possono aprire e quali sono completi. */
export function stepStatus(sum) {
  const specOk = sum.missing === 0;
  return [
    { reach: true, done: specOk },
    { reach: specOk, done: !!sum.vo },
    { reach: specOk && !!sum.vo, done: sum.complete },
    { reach: sum.complete, done: false },
  ];
}

/* ── Scena 3D ─────────────────────────────────────────────── */
function to3d(p, col, row, key) {
  const m = p.m3;
  return { key, id: p.id, col, row, span: 1, kind: m[0], fill: m[1], title: m[2], sub: m[3], foot: m[4], weight: m[5], glass: m[6], tin: m[7] };
}

/* Scatola 3×3: la fila davanti è riservata alle prime tre specialità (i vani
   con il timbro), poi le altre specialità, l'olio e i dolci riempiono i posti
   liberi. Il vino non entra: va nel portabottiglia. */
export function layoutBox(specIds, otherIds, prefix = '') {
  const occ = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const seen = {};
  const keyOf = (id) => { const k = seen[id] || 0; seen[id] = k + 1; return `${prefix}${id}#${k}`; };
  const out = [];
  for (let c = 0; c < 3; c++) {
    occ[0][c] = 1;
    if (specIds[c]) out.push(to3d(PRODUCT_BY_ID[specIds[c]], c, 0, keyOf(specIds[c])));
  }
  specIds.slice(3).concat(otherIds).forEach((id) => {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      if (!occ[r][c]) { occ[r][c] = 1; out.push(to3d(PRODUCT_BY_ID[id], c, r, keyOf(id))); return; }
    }
  });
  return out;
}

const expand = (picked, pred) => PRODUCTS.filter(pred).flatMap((p) => Array(picked[p.id] || 0).fill(p.id));

const DEMO_SPEC = ['sale-lilliput', 'aceto-lilliput', 'powder'];
const DEMO_REST = ['leaves', 'sale-occhio', 'd-most', 'd-fichi', 'd-purc', 'd-coto'];

/* view: 'intro' | 'racale' | 'tokens' | 'done'
   step: indice 0..3 (solo per 'tokens') */
export function sceneFor({ view, step, picked, giftItems, added }) {
  const wine = (key) => to3d(PRODUCT_BY_ID['t-vino'], 0, 0, key);
  if (view === 'racale' || (view === 'done' && added === 'racale')) {
    return { mode: 'gift', gift: giftItems.map((id, i) => to3d(PRODUCT_BY_ID[id], 0, 0, `gift-${id}-${i}`)), items: [], reserved: 0, bow: false, lid: false, wine: null };
  }
  if (view === 'intro') {
    return { mode: 'box', items: layoutBox(DEMO_SPEC, DEMO_REST, 'demo-'), gift: [], reserved: 0, bow: true, lid: true, wine: wine('demo-wine') };
  }
  const sum = summarize(picked);
  const items = layoutBox(expand(picked, isSpec), expand(picked, (p) => !isSpec(p) && p.id !== 't-vino'));
  const review = view === 'done' || step === 3;
  return {
    mode: 'box',
    items,
    gift: [],
    reserved: review ? 0 : Math.max(0, 3 - Math.min(3, sum.spec)),
    bow: review && sum.complete,
    lid: review,
    wine: picked['t-vino'] ? wine('wine') : null,
  };
}
