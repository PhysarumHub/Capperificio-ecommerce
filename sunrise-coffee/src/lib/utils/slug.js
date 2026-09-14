/**
 * Slug leggibile da un nome prodotto (o altra stringa) italiano: minuscolo,
 * senza accenti, apostrofi e spazi normalizzati in trattini.
 * Zero dipendenze: usata sia dal frontend (Vite) sia da server.js (Node puro).
 */
const DIACRITICS_RE = new RegExp('[\\u0300-\\u036f]', 'g');

export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')   // rimuove gli accenti isolati da NFD (e.g. e + ´ -> e)
    .toLowerCase()
    .replace(/[’']/g, '-')        // apostrofi (dritti e tipografici) -> trattino
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
