import { useEffect } from 'react';

const SITE_NAME = 'Capperificio di Racale';
const BASE_URL = 'https://capperificiocaro.com';
const DEFAULT_IMAGE = `${BASE_URL}/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp`;
const DEFAULT_DESCRIPTION = 'Capperi, cucunci e foglie di Racale: prodotti artigianali dal Salento, raccolti a mano e conservati secondo tradizione.';

function setMeta(name, content) {
  if (!content) return;
  // og:* usa 'property', tutto il resto (name=, twitter:*) usa 'name'
  const isOGProperty = name.startsWith('og:');
  let el = isOGProperty
    ? document.querySelector(`meta[property="${name}"]`)
    : document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(isOGProperty ? 'property' : 'name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

function setJsonLd(id, data) {
  const scriptId = `jsonld-${id}`;
  let el = document.getElementById(scriptId);
  if (!el) {
    el = document.createElement('script');
    el.id = scriptId;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id) {
  const el = document.getElementById(`jsonld-${id}`);
  if (el) el.remove();
}

/**
 * Hook SEO per pagine React — zero dipendenze esterne.
 *
 * @param {Object} options
 * @param {string} options.title        - Titolo della pagina
 * @param {string} [options.description] - Meta description
 * @param {string} [options.path]       - Path relativo (es. '/collections/all')
 * @param {string} [options.image]      - URL immagine OG/Twitter
 * @param {string} [options.type]       - og:type (default 'website')
 * @param {Object} [options.jsonLd]     - Dati JSON-LD extra (con @type)
 * @param {boolean} [options.noindex]   - Se true, aggiunge noindex
 * @param {Array}  [options.breadcrumbs] - Array di {name, path} per BreadcrumbList
 * @param {string} [options.twitterCard] - Tipo di Twitter Card (default 'summary_large_image')
 */
export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  image = DEFAULT_IMAGE,
  type = 'website',
  jsonLd = null,
  noindex = false,
  breadcrumbs = null,
  twitterCard = 'summary_large_image',
} = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
    const fullUrl = `${BASE_URL}${path}`;
    const fullImage = image?.startsWith('http') ? image : `${BASE_URL}${image}`;

    // Title
    document.title = fullTitle;

    // Standard meta
    setMeta('description', description);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph
    setMeta('og:title', fullTitle);
    setMeta('og:description', description);
    setMeta('og:url', fullUrl);
    setMeta('og:image', fullImage);
    setMeta('og:type', type);
    setMeta('og:site_name', SITE_NAME);

    // Twitter Card
    setMeta('twitter:card', twitterCard);
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', fullImage);

    // Canonical
    setCanonical(fullUrl);

    // JSON-LD per pagina
    if (jsonLd) {
      setJsonLd('page', { '@context': 'https://schema.org', ...jsonLd });
    }

    // Breadcrumb JSON-LD
    if (breadcrumbs?.length) {
      setJsonLd('breadcrumb', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: `${BASE_URL}${item.path}`,
        })),
      });
    }

    return () => {
      removeJsonLd('page');
      removeJsonLd('breadcrumb');
    };
  }, [title, description, path, image, type, noindex, jsonLd, breadcrumbs, twitterCard]);
}
