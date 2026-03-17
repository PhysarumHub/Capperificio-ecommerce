import { storeApiPost } from '../shopware-client';

/**
 * Fetch all categories.
 */
export async function getCategories() {
  return storeApiPost('/category', {
    limit: 100,
    associations: {
      seoUrls: {},
      media: {},
    },
  });
}

/**
 * Fetch navigation tree.
 * @param {string} rootId - Root category ID (use 'main-navigation' for the default)
 */
export async function getNavigation(rootId = 'main-navigation') {
  return storeApiPost(`/navigation/${rootId}/${rootId}`, {
    depth: 3,
    associations: {
      seoUrls: {},
      media: {},
    },
  });
}

/**
 * Fetch a single category by slug.
 */
export async function getCategoryBySlug(slug) {
  const result = await storeApiPost('/category', {
    limit: 1,
    filter: [
      {
        type: 'contains',
        field: 'seoUrls.seoPathInfo',
        value: slug,
      },
    ],
    associations: {
      seoUrls: {},
      media: {},
    },
  });

  return result?.elements?.[0] || null;
}
