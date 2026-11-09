/**
 * BOX DI NATALE — catalogo e regole
 * ─────────────────────────────────────────────────────────────
 * Due confezioni:
 *   1. "Box Racale" — confezione regalo in lino verde a finestre, contenuto
 *      fisso. Formato da 3 vasetti (20 €) o da 2 vasetti.
 *   2. "Box a Gettoni" — scatola verde con finestra, 10 gettoni:
 *        step 1  almeno 3 specialità del Capperificio (1 gettone l'una)
 *        step 2  vino (1 gettone, nel portabottiglia accanto) OPPURE
 *                olio (2 gettoni, occupa un posto nella scatola) — obbligatorio
 *        step 3  dolci del Salento fino a esaurire i gettoni
 *      La scatola è una griglia 3×3: col vino ci stanno 9 prodotti, con
 *      l'olio 8 + la bottiglia.
 *
 * I valori tra [parentesi quadre] sono SEGNAPOSTO da confermare (produttori,
 * prezzi, dolci). I prezzi mostrati sono informativi: il totale vero lo
 * calcola Shopware dal prodotto-box nel carrello.
 */

const IMG = '/images/box-natale';

/* ID dei prodotti-box Shopware (admin → Cataloghi → Prodotti). Senza ID la
   pagina funziona in anteprima: il pulsante finale non scrive nel carrello. */
export const BOX_PRODUCT_IDS = {
  racale3: import.meta.env.VITE_XMAS_BOX_FIXED_ID || '',
  racale2: import.meta.env.VITE_XMAS_BOX_FIXED2_ID || '',
  tokens: import.meta.env.VITE_XMAS_BOX_TOKENS_ID || '',
};

export const TOKENS_TOTAL = 10;
export const MIN_SPECIALITA = 3;

/* ── Le due confezioni ─────────────────────────────────────── */
export const BOXES = {
  racale: {
    key: 'racale',
    name: 'Box Racale',
    kicker: 'Pronta da regalare',
    lead: 'Le specialità firmate Capperificio Caro nella confezione in lino a finestre, chiusa con il fiocco.',
    sizes: [
      { n: 3, label: '3 vasetti', price: 20, productKey: 'racale3', items: ['shoots', 'powder', 'sale-lilliput'] },
      // [PREZZO e contenuto da confermare]
      { n: 2, label: '2 vasetti', price: 14, priceTbc: true, productKey: 'racale2', items: ['sale-lilliput', 'powder'] },
    ],
  },
  tokens: {
    key: 'tokens',
    name: 'Box a Gettoni',
    kicker: 'Componila tu',
    lead: 'Dieci gettoni da spendere tra le nostre specialità, un vino o un olio e i dolci delle pasticcerie salentine.',
    price: 45, // [PREZZO da confermare] — vale quello del prodotto Shopware
    priceTbc: true,
    productKey: 'tokens',
  },
};

/* ── Prodotti ──────────────────────────────────────────────────
   sect:   'capperi' | 'caro' (= specialità del Capperificio) | 'vo' | 'dolci'
   cost:   gettoni per unità
   max:    pezzi massimi per scatola (assente = nessun limite oltre ai gettoni)
   m3:     aspetto nella scena 3D [forma, contenuto, titolo, sottotitolo, piede, peso, vetro, latta] */
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
  // Altre specialità
  { id: 'cuc-aceto', sect: 'caro', cost: 1, name: 'Cucunci', detail: 'All’aceto di vino · 200 g', note: 'Il frutto del cappero', image: `${IMG}/cucunci.webp`,
    m3: ['tall', 'cucunci', 'Cucunci di Racale', 'All’aceto di vino', '', '200g'] },
  { id: 'shoots', sect: 'caro', cost: 1, name: 'Germogli di cappero', detail: 'All’aceto di vino bianco', note: 'Croccanti ed erbacei', image: `${IMG}/germogli.webp`,
    m3: ['squat', 'leaves', 'Germogli di cappero', 'All’aceto', '', ''] },
  { id: 'powder', sect: 'caro', cost: 1, name: 'Polvere di cappero', detail: 'Extrafine · 50 g', note: 'Un cucchiaino su salse e crudi', image: `${IMG}/powder.webp`,
    m3: ['squat', 'powder', 'Polvere di cappero', 'di Racale', 'Extrafine', '50g'] },
  { id: 'leaves', sect: 'caro', cost: 1, name: 'Foglie di cappero', detail: 'Al sale marino · 50 g', note: 'Fresche e minerali', image: `${IMG}/leaves.webp`,
    m3: ['squat', 'leaves', 'Foglie di cappero', 'Al sale marino', '', '50g'] },
  // Vino o olio (uno dei due, obbligatorio)
  { id: 't-vino', sect: 'vo', cost: 1, max: 1, name: 'Vino rosso del Salento', detail: '75 cl · nel portabottiglia', producer: '[Cantina da confermare]', note: 'Viaggia accanto alla scatola: lascia 9 posti liberi', image: `${IMG}/vino.webp`,
    m3: ['bottle', '', 'Vino rosso', 'Salento', 'Cantina', '75cl', 0x2e1014] },
  { id: 't-olio', sect: 'vo', cost: 2, max: 1, name: 'Olio extravergine', detail: '500 ml', producer: '[Frantoio da confermare]', note: 'Sta nella scatola: lascia 8 posti liberi', image: `${IMG}/olio.webp`,
    m3: ['bottle', '', 'Olio extravergine', 'Salento', 'Frantoio', '500ml', 0x4a5a22] },
  // Dolci del Salento [nomi, pasticcerie e gettoni da confermare]
  { id: 'd-most', sect: 'dolci', cost: 1, name: 'Mostaccioli', detail: '200 g', producer: '[Pasticceria da confermare]', note: 'Mandorle, cacao e vincotto', image: `${IMG}/mostaccioli.webp`,
    m3: ['tin', '', 'Mostaccioli salentini', '', '', '', 0, 0x6b2a1c] },
  { id: 'd-fichi', sect: 'dolci', cost: 1, name: 'Fichi mandorlati', detail: '200 g', producer: '[Azienda agricola da confermare]', note: 'Fichi secchi al forno con mandorla', image: `${IMG}/fichi.webp`,
    m3: ['tin', '', 'Fichi mandorlati', '', '', '', 0, 0x2f5a3e] },
  { id: 'd-coto', sect: 'dolci', cost: 1, name: 'Cotognata leccese', detail: '150 g', producer: '[Pasticceria da confermare]', note: 'Mela cotogna, ricetta di famiglia', image: `${IMG}/cotognata.webp`,
    m3: ['tin', '', 'Cotognata leccese', '', '', '', 0, 0xb8892e] },
  { id: 'd-purc', sect: 'dolci', cost: 1, name: 'Purceddhruzzi', detail: '200 g', producer: '[Pasticceria da confermare]', note: 'Fritti, al miele e confettini', image: `${IMG}/purceddhruzzi.webp`,
    m3: ['tin', '', 'Purceddhruzzi al miele', '', '', '', 0, 0x8c1c24] },
];

export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

/* ── Step del percorso Box a Gettoni ───────────────────────── */
export const STEPS = [
  { key: 'caro',  short: 'Capperificio', title: 'Le specialità del Capperificio', lead: 'Almeno tre, raccolte e lavorate a mano a Racale. Ogni vasetto vale un gettone.' },
  { key: 'vo',    short: 'Vino o olio',  title: 'Un vino o un olio del Salento', lead: 'Scegline uno: il vino viaggia nel suo portabottiglia accanto alla scatola, l’olio sta dentro e vale due gettoni.' },
  { key: 'dolci', short: 'Dolci',        title: 'I dolci di Natale', lead: 'Spendi i gettoni rimasti tra i dolci delle pasticcerie salentine.' },
  { key: 'chiudi', short: 'Chiudi',      title: 'La tua scatola è pronta', lead: 'Controlla il contenuto: la chiudiamo con il nastro e la spediamo da Racale.' },
];

export const STEP_GROUPS = {
  caro: [
    { title: 'Capperi al sale marino', sub: 'Da sciacquare prima dell’uso', filter: (p) => p.sect === 'capperi' && p.id.startsWith('sale-') },
    { title: 'Capperi all’aceto di vino', sub: 'Pronti da usare', filter: (p) => p.sect === 'capperi' && p.id.startsWith('aceto-') },
    { title: 'Altre specialità', sub: 'Cucunci, germogli, polvere e foglie', filter: (p) => p.sect === 'caro' },
  ],
  vo: [{ title: null, sub: null, filter: (p) => p.sect === 'vo' }],
  dolci: [{ title: null, sub: null, filter: (p) => p.sect === 'dolci' }],
};
