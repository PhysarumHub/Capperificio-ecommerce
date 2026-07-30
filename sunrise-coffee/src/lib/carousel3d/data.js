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
  { id: 'sale', title: 'Capperi al Sale', radius: 500, radiusMobile: 230, cards: pick(0) },
  { id: 'aceto', title: "Capperi all'Aceto", radius: 500, radiusMobile: 230, cards: pick(3) },
  { id: 'cucunci', title: 'Cucunci di Racale', radius: 500, radiusMobile: 230, cards: pick(6) },
  { id: 'polvere', title: 'Polvere & Foglie', radius: 500, radiusMobile: 230, cards: pick(9) },
  { id: 'horeca', title: 'Linea Ho.Re.Ca', radius: 500, radiusMobile: 230, cards: pick(12) },
];
