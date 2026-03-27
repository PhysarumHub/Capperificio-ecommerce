import { useState, useEffect } from 'react';

const STRAPI_URL   = import.meta.env.VITE_STRAPI_URL;
const STRAPI_TOKEN = import.meta.env.VITE_STRAPI_TOKEN;

export function useBlogPost(slug) {
  const [post, setPost]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!STRAPI_URL || !slug) {
      setLoading(false);
      return;
    }

    const url = `${STRAPI_URL}/api/articles?filters[slug][$eq]=${slug}&populate=cover`;

    fetch(url, {
      headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
    })
      .then(r => {
        if (!r.ok) throw new Error(`Strapi ${r.status}`);
        return r.json();
      })
      .then(({ data }) => {
        const item = data?.[0];
        if (!item) throw new Error('Articolo non trovato');
        setPost({
          id:       item.id,
          title:    item.title,
          slug:     item.slug,
          excerpt:  item.excerpt,
          content:  item.content,
          image:    item.cover?.formats?.large?.url
                      ? `${STRAPI_URL}${item.cover.formats.large.url}`
                      : item.cover?.url
                        ? `${STRAPI_URL}${item.cover.url}`
                        : null,
          date:     item.publishedAt,
          category: item.category,
        });
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [slug]);

  return { post, loading, error };
}
