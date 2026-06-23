/**
 * CATALOGO CAPPERIFICIO CARO — accesso dati prodotto (frontend)
 * ─────────────────────────────────────────────────────────────
 * Sorgente unica: ./capperificioCatalog.json
 * Lo stesso JSON è letto dallo script di seeding Shopware
 * (scripts/seed-capperificio.py) → un solo posto da aggiornare.
 *
 * Questo modulo espone i dati come mappa per productNumber e fornisce
 * getCatalogEntry(): usato da ProductDetail.jsx come fallback quando il
 * prodotto Shopware non ha ancora description / properties / customFields.
 * Appena il prodotto Shopware ha i suoi dati reali, quelli hanno la precedenza.
 *
 * Voci JSON (per prodotto):
 *   productNumber, name, match[], calibro, description (HTML),
 *   bullets[], properties[[label, value|string[]]], accordion[{name, html}]
 */

import CATALOG_LIST from './capperificioCatalog.json';

// Mappa per productNumber (chiave normalizzata in maiuscolo)
const CATALOG = CATALOG_LIST.reduce((acc, entry) => {
  acc[entry.productNumber.toUpperCase()] = entry;
  return acc;
}, {});

/**
 * Trova la scheda catalogo per un prodotto Shopware.
 * Strategia: productNumber esatto → SKU base (rimuove il suffisso taglia, es.
 * CAP-FOGLIE-50 → CAP-FOGLIE) → match per parole chiave nel nome.
 */
export function getCatalogEntry(product) {
  if (!product) return null;

  const pn = (product.productNumber || '').toUpperCase().trim();
  if (pn && CATALOG[pn]) return CATALOG[pn];

  const base = pn.replace(/-\d+$/, '');
  if (base && CATALOG[base]) return CATALOG[base];

  const name = (product.translated?.name || product.name || '').toLowerCase();
  if (name) {
    const found = CATALOG_LIST.find((entry) =>
      entry.match?.some((kw) => name.includes(kw))
    );
    if (found) return found;
  }

  return null;
}

export default CATALOG;
