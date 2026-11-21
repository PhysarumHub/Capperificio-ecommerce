/**
 * BOX DI NATALE — catalogo e regole
 * ─────────────────────────────────────────────────────────────
 * Due confezioni:
 *   1. "Box Natalizia" (25 €) — olio EVO BIO 500 ml (OP ACLI Racale),
 *      vino 1 L della Cantina Torre Ospina (rosso, rosato o bianco, a scelta)
 *      e 3 vasetti del Capperificio scelti dal cliente.
 *   2. "Cassetta in Legno" (50 €) — 11 gettoni da distribuire come si vuole.
 *      Unica regola fissa: almeno 3 vasetti del Capperificio. L'olio vale
 *      2 gettoni, tutto il resto 1.
 *
 * Le foto ci sono solo per i vasetti del Capperificio: gli altri prodotti
 * (e per ora cucunci, germogli e pomodori) compaiono senza immagine.
 * I prezzi mostrati sono informativi: il totale vero lo calcola Shopware dal
 * prodotto-box nel carrello.
 */

const IMG = '/images/box-natale';

/* ID dei prodotti-box Shopware (admin → Cataloghi → Prodotti). Senza ID la
   pagina funziona in anteprima: il pulsante finale non scrive nel carrello.
   Il prodotto "racale3" (numero XMAS-BOX-RACALE-3) è la Box Natalizia. */
export const BOX_PRODUCT_IDS = {
  racale3: import.meta.env.VITE_XMAS_BOX_FIXED_ID || '',
  tokens: import.meta.env.VITE_XMAS_BOX_TOKENS_ID || '',
};

export const TOKENS_TOTAL = 11;
export const MIN_SPECIALITA = 3;

/* ── Le due confezioni ─────────────────────────────────────── */
export const BOXES = {
  racale: {
    key: 'racale',
    name: 'Box Natalizia',
    kicker: 'Pronta da regalare',
    lead: 'Un olio EVO biologico, un litro di vino salentino e tre vasetti del Capperificio scelti da te.',
    price: 25,
    productKey: 'racale3',
    jars: 3,
    oil: 'olio',
    wines: ['vino-rosso', 'vino-rosato', 'vino-bianco'],
  },
  tokens: {
    key: 'tokens',
    name: 'Cassetta in Legno',
    kicker: 'Componila tu',
    lead: 'Undici gettoni da distribuire come preferisci tra capperi, olio, vino, forno e legumi del Salento.',
    price: 50,
    productKey: 'tokens',
  },
};

/* ── Prodotti ──────────────────────────────────────────────────
   sect:   'capperi' | 'caro' (vasetti del Capperificio, contano per il minimo)
           'orto' (Capperificio, non è un vasetto) | 'olio' | 'vino' | 'forno' | 'legumi'
   cost:   gettoni per unità
   image:  solo per i vasetti del Capperificio con foto; null = card senza foto
   tile:   parola nella tessera quando manca la foto
   m3:     aspetto nella scena 3D [forma, contenuto, titolo, sottotitolo, piede, peso, vetro, colore etichetta] */
const PF = 'Pane è Fantasie';
const TN = 'Terra Nera';

export const PRODUCTS = [
  // Capperi di Racale — sotto sale
  { id: 'sale-lilliput', sect: 'capperi', cost: 1, name: 'Capperi Lilliput', detail: 'Al sale marino · 75 g', note: 'Ø 4–6 mm, il calibro più pregiato', image: `${IMG}/sale-lilliput.webp`,
    m3: ['squat', 'capers', 'Cappero di Racale', 'Al sale marino', 'Calibro: Lilliput', '75g'] },
  { id: 'sale-occhio', sect: 'capperi', cost: 1, name: 'Occhio di Pernice', detail: 'Al sale marino · 150 g', note: 'Ø 7–9 mm, intenso e floreale', image: `${IMG}/sale-occhio.webp`,
    m3: ['tall', 'capers', 'Cappero di Racale', 'Al sale marino', 'Calibro: Occhio di pernice', '150g'] },
  { id: 'sale-lacrimella', sect: 'capperi', cost: 1, name: 'Lacrimella', detail: 'Al sale marino · 250 g', note: 'Ø 9–11 mm, il più versatile', image: `${IMG}/sale-lacrimella.webp`,
    m3: ['tall', 'capers', 'Cappero di Racale', 'Al sale marino', 'Calibro: Lacrimella', '250g'] },
  { id: 'sale-capperone', sect: 'capperi', cost: 1, name: 'Capperone', detail: 'Al sale marino · 250 g', note: 'Ø 12–15 mm, carnoso', image: `${IMG}/sale-capperone.webp`,
    m3: ['tall', 'capers', 'Cappero di Racale', 'Al sale marino', 'Calibro: Capperone', '250g'] },
  // Capperi di Racale — all'aceto
  { id: 'aceto-lilliput', sect: 'capperi', cost: 1, name: 'Capperi Lilliput', detail: 'All’aceto di vino · 75 g', note: 'Pronti da usare', image: `${IMG}/aceto.webp`,
    m3: ['squat', 'capers', 'Cappero di Racale', 'All’aceto di vino', 'Calibro: Lilliput', '75g'] },
  { id: 'aceto-occhio', sect: 'capperi', cost: 1, name: 'Occhio di Pernice', detail: 'All’aceto di vino · 150 g', note: 'Acidità brillante', image: `${IMG}/aceto.webp`,
    m3: ['tall', 'capers', 'Cappero di Racale', 'All’aceto di vino', 'Calibro: Occhio di pernice', '150g'] },
  { id: 'aceto-lacrimella', sect: 'capperi', cost: 1, name: 'Lacrimella', detail: 'All’aceto di vino · 250 g', note: 'Per aperitivi e crudi', image: `${IMG}/aceto.webp`,
    m3: ['tall', 'capers', 'Cappero di Racale', 'All’aceto di vino', 'Calibro: Lacrimella', '250g'] },
  { id: 'aceto-capperone', sect: 'capperi', cost: 1, name: 'Capperone', detail: 'All’aceto di vino · 250 g', note: 'Carnoso e croccante', image: `${IMG}/aceto.webp`,
    m3: ['tall', 'capers', 'Cappero di Racale', 'All’aceto di vino', 'Calibro: Capperone', '250g'] },
  // Altre specialità (cucunci e germogli: foto in arrivo)
  { id: 'cuc-aceto', sect: 'caro', cost: 1, name: 'Cucunci', detail: 'All’aceto di vino · 200 g', note: 'Il frutto del cappero', image: null, tile: 'Cucunci',
    m3: ['tall', 'cucunci', 'Cucunci di Racale', 'All’aceto di vino', '', '200g'] },
  { id: 'shoots', sect: 'caro', cost: 1, name: 'Germogli di cappero', detail: 'All’aceto di vino bianco', note: 'Croccanti ed erbacei', image: null, tile: 'Germogli',
    m3: ['squat', 'leaves', 'Germogli di cappero', 'All’aceto', '', ''] },
  { id: 'powder', sect: 'caro', cost: 1, name: 'Polvere di cappero', detail: 'Extrafine · 50 g', note: 'Un cucchiaino su salse e crudi', image: `${IMG}/powder.webp`,
    m3: ['squat', 'powder', 'Polvere di cappero', 'di Racale', 'Extrafine', '50g'] },
  { id: 'leaves', sect: 'caro', cost: 1, name: 'Foglie di cappero', detail: 'Al sale marino · 50 g', note: 'Fresche e minerali', image: `${IMG}/leaves.webp`,
    m3: ['squat', 'leaves', 'Foglie di cappero', 'Al sale marino', '', '50g'] },
  // Dall'orto del Capperificio (non è un vasetto: non conta per il minimo)
  { id: 'pomodori', sect: 'orto', cost: 1, name: 'Pomodori essiccati al sole', detail: '500 g', producer: 'Capperificio Caro', image: null, tile: 'Orto',
    m3: ['pouch', '', 'Pomodori secchi', 'Capperificio Caro', '', '', 0, 0x8c1c24] },
  // Olio e vino
  { id: 'olio', sect: 'olio', cost: 2, name: 'Olio EVO biologico', detail: '500 ml', producer: 'OP ACLI Racale', image: null, tile: 'Olio',
    m3: ['bottle', '', 'Olio EVO BIO', 'OP ACLI Racale', '', '500ml', 0x4a5a22] },
  { id: 'vino-rosso', sect: 'vino', cost: 1, name: 'Vino rosso', detail: '1 L', producer: 'Cantina Torre Ospina', image: null, tile: 'Rosso', color: 'Rosso',
    m3: ['bottle', '', 'Vino rosso', 'Torre Ospina', '', '1L', 0x2e1014] },
  { id: 'vino-rosato', sect: 'vino', cost: 1, name: 'Vino rosato', detail: '1 L', producer: 'Cantina Torre Ospina', image: null, tile: 'Rosato', color: 'Rosato',
    m3: ['bottle', '', 'Vino rosato', 'Torre Ospina', '', '1L', 0x8e3a46] },
  { id: 'vino-bianco', sect: 'vino', cost: 1, name: 'Vino bianco', detail: '1 L', producer: 'Cantina Torre Ospina', image: null, tile: 'Bianco', color: 'Bianco',
    m3: ['bottle', '', 'Vino bianco', 'Torre Ospina', '', '1L', 0x8f9a5a] },
  // Forno — Pane è Fantasie
  { id: 'pf-purciddhuzzi', sect: 'forno', cost: 1, name: 'Purciddhuzzi', detail: '250 g', producer: PF, image: null, tile: 'Forno', m3: ['pouch', '', 'Purciddhuzzi', PF, '', '', 0, 0x8c1c24] },
  { id: 'pf-pitteddhe', sect: 'forno', cost: 1, name: 'Pitteddhe', detail: '250 g', producer: PF, image: null, tile: 'Forno', m3: ['pouch', '', 'Pitteddhe', PF, '', '', 0, 0x8c1c24] },
  { id: 'pf-mustazzere', sect: 'forno', cost: 1, name: 'Mustazzere', detail: '250 g', producer: PF, image: null, tile: 'Forno', m3: ['pouch', '', 'Mustazzere', PF, '', '', 0, 0x8c1c24] },
  { id: 'pf-cantucci', sect: 'forno', cost: 1, name: 'Cantucci', detail: '250 g', producer: PF, image: null, tile: 'Forno', m3: ['pouch', '', 'Cantucci', PF, '', '', 0, 0x8c1c24] },
  { id: 'pf-tarallini-vino', sect: 'forno', cost: 1, name: 'Tarallini al vino', detail: '250 g', producer: PF, image: null, tile: 'Forno', m3: ['pouch', '', 'Tarallini al vino', PF, '', '', 0, 0x8c1c24] },
  { id: 'pf-tarallini-zucchero', sect: 'forno', cost: 1, name: 'Tarallini zuccherati', detail: '250 g', producer: PF, image: null, tile: 'Forno', m3: ['pouch', '', 'Tarallini zuccherati', PF, '', '', 0, 0x8c1c24] },
  { id: 'pf-friselle', sect: 'forno', cost: 1, name: 'Friselle', detail: '250 g', producer: PF, image: null, tile: 'Forno', m3: ['pouch', '', 'Friselle', PF, '', '', 0, 0x8c1c24] },
  // Legumi — Terra Nera
  { id: 'tn-pisello', sect: 'legumi', cost: 1, name: 'Pisello nano di Zollino', detail: '500 g', producer: TN, image: null, tile: 'Legumi', m3: ['pouch', '', 'Pisello nano', TN, '', '', 0, 0x2c4a2c] },
  { id: 'tn-lenticchie', sect: 'legumi', cost: 1, name: 'Lenticchie multicolore di Zollino', detail: '500 g', producer: TN, image: null, tile: 'Legumi', m3: ['pouch', '', 'Lenticchie', TN, '', '', 0, 0x2c4a2c] },
  { id: 'tn-cicerchia', sect: 'legumi', cost: 1, name: 'Cicerchia di Uggiano', detail: '500 g', producer: TN, image: null, tile: 'Legumi', m3: ['pouch', '', 'Cicerchia', TN, '', '', 0, 0x2c4a2c] },
];

export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

/* Vasetti che si possono scegliere nella Box Natalizia. */
export const NATAL_JARS = PRODUCTS.filter((p) => p.sect === 'capperi' || p.sect === 'caro');

/* ── Step del percorso Cassetta in Legno ───────────────────── */
export const STEPS = [
  { key: 'caro',     short: 'Capperificio',   title: 'I vasetti del Capperificio', lead: 'Almeno tre, raccolti e lavorati a mano a Racale. Ogni vasetto vale un gettone.' },
  { key: 'vo',       short: 'Olio e vino',    title: 'Olio e vino del Salento', lead: 'Facoltativi. L’olio EVO biologico vale due gettoni, il vino da un litro uno.' },
  { key: 'dispensa', short: 'Forno e legumi', title: 'Forno e legumi salentini', lead: 'Spendi i gettoni rimasti tra il forno di Pane è Fantasie e i legumi di Terra Nera.' },
  { key: 'chiudi',   short: 'Chiudi',         title: 'La tua cassetta è pronta', lead: 'Controlla il contenuto: la chiudiamo con il nastro e la spediamo da Racale.' },
];

export const STEP_GROUPS = {
  caro: [
    { title: 'Capperi al sale marino', sub: 'Da sciacquare prima dell’uso', filter: (p) => p.sect === 'capperi' && p.id.startsWith('sale-') },
    { title: 'Capperi all’aceto di vino', sub: 'Pronti da usare', filter: (p) => p.sect === 'capperi' && p.id.startsWith('aceto-') },
    { title: 'Altre specialità', sub: 'Cucunci, germogli, polvere e foglie', filter: (p) => p.sect === 'caro' },
    { title: 'Dall’orto', sub: 'Non conta tra i tre vasetti', filter: (p) => p.sect === 'orto' },
  ],
  vo: [
    { title: 'Olio', sub: 'OP ACLI Racale · 2 gettoni', filter: (p) => p.sect === 'olio' },
    { title: 'Vino', sub: 'Cantina Torre Ospina · 1 gettone', filter: (p) => p.sect === 'vino' },
  ],
  dispensa: [
    { title: 'Forno', sub: 'Pane è Fantasie', filter: (p) => p.sect === 'forno' },
    { title: 'Legumi', sub: 'Terra Nera', filter: (p) => p.sect === 'legumi' },
  ],
};

/* ── Prenotazione regalo ───────────────────────────────────────
   Si paga subito, la box parte il lunedì scelto. Ogni settimana ha un numero
   limitato di box (le prepariamo a mano): quando una settimana è piena va
   segnata `status: 'full'` qui. 'low' mostra "Ultimi posti".
   `orderBy` = ultimo giorno utile per prenotare quella spedizione: dopo
   quella data la settimana sparisce dalla scelta. */
export const ORDER_DEADLINE = { label: '16 dicembre', iso: '2026-12-16' };

export const SHIP_WEEKS = [
  { id: '2026-11-30', day: 'Lunedì', date: '30 nov', label: 'lunedì 30 novembre', orderBy: '2026-11-27', status: 'low' },
  { id: '2026-12-07', day: 'Lunedì', date: '7 dic', label: 'lunedì 7 dicembre', orderBy: '2026-12-04', status: 'open' },
  { id: '2026-12-14', day: 'Lunedì', date: '14 dic', label: 'lunedì 14 dicembre', orderBy: '2026-12-11', status: 'open' },
];
export const SHIP_ASAP = { id: 'asap', day: 'Il prima possibile', date: 'Subito', label: 'appena pronta', status: 'open', note: 'Entro 3 giorni lavorativi' };

export const SHIP_STATUS_NOTE = { full: 'Completo', low: 'Ultimi posti', open: 'Disponibile' };

/* Settimane ancora prenotabili oggi (confronto per giorno, ora locale). */
export function openShipWeeks(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const weeks = SHIP_WEEKS.filter((w) => w.orderBy >= today);
  return today <= ORDER_DEADLINE.iso ? [...weeks, SHIP_ASAP] : weeks;
}

export const GIFT_MESSAGE_MAX = 200;

/* "Regala i gettoni" (chi riceve compone la box): non ancora attivo. Finché è
   false la card resta visibile con "In arrivo" e rimanda ai contatti. */
export const EGIFT_ENABLED = false;
