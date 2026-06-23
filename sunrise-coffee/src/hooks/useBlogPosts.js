import { useState, useEffect } from 'react';

// URL pubblico (solo per costruire i src delle immagini). Il token NON è qui:
// le chiamate API passano dal proxy server /api/strapi che lo tiene segreto.
const STRAPI_URL = import.meta.env.VITE_STRAPI_URL;

export function useBlogPosts({ limit = 3, page = 1 } = {}) {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!STRAPI_URL) {
      setLoading(false);
      return;
    }

    const url = `/api/strapi/articles?populate=cover&pagination[pageSize]=${limit}&pagination[page]=${page}&sort=publishedAt:desc`;

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`Strapi ${r.status}`);
        return r.json();
      })
      .then(({ data }) => {
        setPosts(
          (data || []).map(item => ({
            id:      item.id,
            title:   item.title,
            slug:    item.slug,
            excerpt: item.excerpt,
            image:   item.cover?.formats?.medium?.url
                       ? `${STRAPI_URL}${item.cover.formats.medium.url}`
                       : item.cover?.url
                         ? `${STRAPI_URL}${item.cover.url}`
                         : null,
            date:    item.publishedAt,
            category: item.category,
          }))
        );
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [limit, page]);

  return { posts, loading, error };
}
