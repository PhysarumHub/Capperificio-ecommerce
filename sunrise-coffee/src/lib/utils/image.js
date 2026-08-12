/**
 * Riscrive gli URL assoluti di Shopware in path relativi (/media, /thumbnail)
 * così vengono serviti dal reverse-proxy davanti al frontend:
 *   - in sviluppo  → proxy di Vite  (vite.config.js)
 *   - in produzione → nginx         (nginx.conf: location /media, /thumbnail)
 *
 * È necessario perché Shopware genera gli URL media in base al suo SHOP_DOMAIN
 * (es. localhost:8090 nello stack Docker), che NON è raggiungibile dal browser
 * del visitatore. Riscrivendoli relativi, le immagini passano per lo stesso
 * dominio del sito e nginx le inoltra al container Shopware.
 *
 * Nota: richiede un reverse-proxy che inoltri /media e /thumbnail a Shopware.
 * Su un hosting statico senza questo proxy va invece configurato
 * Shopware con il dominio pubblico e gli URL vanno lasciati assoluti.
 */

// Ricava l'hostname Shopware dalla env var per proxare solo i path di quel server
const _shopwareApiUrl = import.meta.env.VITE_SHOPWARE_API_URL || '';
const _shopwareHost   = _shopwareApiUrl
  ? (() => { try { return new URL(_shopwareApiUrl).hostname; } catch { return ''; } })()
  : '';

function _shouldProxy(url) {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === 'localhost'   ||
      hostname === '127.0.0.1'  ||
      (_shopwareHost && hostname === _shopwareHost)
    );
  } catch {
    return false;
  }
}

export function proxyUrl(url) {
  if (!url) return url;

  // Strip origin so the paths go through the reverse-proxy (/media, /thumbnail)
  // — solo per URL che puntano al server Shopware configurato (o a localhost)
  if (!_shouldProxy(url)) return url;

  try {
    const u = new URL(url);
    if (u.pathname.startsWith('/media/') || u.pathname.startsWith('/thumbnail/')) {
      return u.pathname + u.search;
    }
  } catch {
    // Not a valid URL, return as-is
  }
  return url;
}

/**
 * Extract the best product image URL from a Shopware product entity.
 * Falls back to a placeholder if no image is available.
 *
 * @param {object} product - Shopware product entity
 * @param {'small'|'medium'|'large'} [size='medium'] - Desired thumbnail size
 * @returns {string} Image URL
 */
export function getProductImage(product, size = 'medium') {
  const media = product?.cover?.media || product?.media?.[0]?.media;

  if (!media) return '/images/PRODUCTSTILL.jpg';

  // Try to find a matching thumbnail
  if (media.thumbnails?.length) {
    const sizeMap = { small: 280, medium: 600, large: 1920 };
    const targetWidth = sizeMap[size] || 600;

    const sorted = [...media.thumbnails].sort(
      (a, b) => Math.abs(a.width - targetWidth) - Math.abs(b.width - targetWidth)
    );

    if (sorted[0]?.url) return proxyUrl(sorted[0].url);
  }

  return proxyUrl(media.url) || '/images/PRODUCTSTILL.jpg';
}

/**
 * Get the product slug from SEO URLs or generate from name.
 */
export function getProductSlug(product) {
  if (product?.seoUrls?.length) {
    const seo = product.seoUrls.find((u) => u.isCanonical) || product.seoUrls[0];
    return seo.seoPathInfo?.replace(/^\/?(detail\/)?/, '') || product.id;
  }
  // Use the product ID as slug — always findable, no dependency on seoUrls
  return product?.id || '';
}
