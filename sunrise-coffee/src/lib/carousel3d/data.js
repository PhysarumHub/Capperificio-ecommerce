// Immagini di scena per il carosello 3D.
// I file /img/imgN.svg sono placeholder generati: sostituirli con le foto
// definitive non richiede modifiche al componente.

const placeholders = Array.from({ length: 12 }, (_, i) => `/img/img${i + 1}.svg`);

const photos = [
  '/images/CAPPERI.jpg',
  '/images/capperi-al-sale.webp',
  '/images/20250611_CapperificioCaro_Capperi___-3635%20(1).webp',
  '/images/PRODUCTSTILL.jpg',
  '/images/dalcampoallatavola2.webp',
  '/images/giannelli.webp',
];

const pool = [...photos, ...placeholders];

/** Sei immagini a partire da `offset`, ciclando sul pool. */
const pick = (offset, count = 6) =>
  Array.from({ length: count }, (_, i) => pool[(offset + i) % pool.length]);

export const scenes = [
  {
    id: 'raccolta',
    title: 'Raccolta a mano, uno a uno',
    description: 'Tra luglio e agosto, quando il bocciolo è chiuso al punto giusto. Nei campi di Racale si raccoglie ogni giorno, senza fretta — il cappero non aspetta.',
    radius: 500,
    radiusMobile: 230,
    cards: pick(0),
  },
  {
    id: 'cernita',
    title: 'La selezione, calibro dopo calibro',
    description: 'Ogni cappero viene scelto a mano per dimensione, i più piccoli da un lato, i più grandi dall’altro. È qui che si decide la qualità del vasetto.',
    radius: 500,
    radiusMobile: 230,
    cards: pick(3),
  },
  {
    id: 'sale',
    title: 'Sotto sale, come da sempre',
    description: 'Il sale toglie acqua e amaro, lentamente. Si riposa a strati, si gira, si lascia lavorare dal tempo: nessuna scorciatoia.',
    radius: 500,
    radiusMobile: 230,
    cards: pick(6),
  },
  {
    id: 'cucunci',
    title: 'Il frutto, non solo il bocciolo',
    description: 'Quando il cappero non viene colto, fiorisce e diventa cucuncio: il frutto della pianta, croccante, da gustare sott’aceto. Niente si scarta.',
    radius: 500,
    radiusMobile: 230,
    cards: pick(9),
  },
  {
    id: 'polvere',
    title: 'Anche la pianta trova voce',
    description: 'Foglie essiccate, polvere macinata: dal cappero nasce altro, per chi vuole portare il Salento anche in cucina, in dosi diverse.',
    radius: 500,
    radiusMobile: 230,
    cards: pick(12),
  },
];
