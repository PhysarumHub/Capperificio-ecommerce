/**
 * Rewrite Shopware absolute URLs to relative paths so they go through the Vite proxy.
 * e.g. "https://localhost/media/..." → "/media/..."
 */
function proxyUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    // If the image comes from the Shopware backend, strip the origin
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
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
    // Remove leading slashes and 'detail/' prefix
    return seo.seoPathInfo?.replace(/^\/?(detail\/)?/, '') || product.id;
  }
  // Fallback: slugify the name
  const name = product?.translated?.name || product?.name || '';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || product?.id;
}
