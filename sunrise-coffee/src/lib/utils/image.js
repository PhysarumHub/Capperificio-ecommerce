/**
 * Rewrite Shopware absolute URLs to relative paths so they go through the Vite proxy.
 * e.g. "https://localhost/media/..." → "/media/..."
 */
export function proxyUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    // Strip origin for any Shopware media URL so it goes through the nginx proxy
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
