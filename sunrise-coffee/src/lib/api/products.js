import { storeApiPost } from '../shopware-client';

/**
 * Fetch a paginated list of products.
 */
export async function getProducts({ page = 1, limit = 24, filters = [], sort = [] } = {}) {
  const body = {
    page,
    limit,
    associations: {
      cover: { associations: { media: {} } },
      seoUrls: {},
      categories: {},
    },
  };

  if (filters.length) body.filter = filters;
  if (sort.length) body.sort = sort;

  return storeApiPost('/product', body);
}

/**
 * Fetch a single product by its SEO slug or ID.
 */
export async function getProductBySlug(slug) {
  // First try to find the product via filter on seoUrls
  const result = await storeApiPost('/product', {
    limit: 1,
    filter: [
      {
        type: 'contains',
        field: 'seoUrls.seoPathInfo',
        value: slug,
      },
    ],
    associations: {
      cover: { associations: { media: {} } },
      media: {},
      seoUrls: {},
      categories: {},
      properties: { associations: { group: {} } },
      crossSellings: {
        associations: {
          assignedProducts: {
            associations: {
              product: {
                associations: {
                  cover: { associations: { media: {} } },
                  seoUrls: {},
                },
              },
            },
          },
        },
      },
    },
    includes: {
      product: [
        'id', 'name', 'description', 'translated', 'calculatedPrice',
        'cover', 'media', 'seoUrls', 'categories', 'properties',
        'crossSellings', 'customFields', 'availableStock',
      ],
    },
  });

  if (result?.elements?.length) {
    return result.elements[0];
  }

  // Fallback: search by product name slugified
  const fallback = await storeApiPost('/product', {
    limit: 1,
    filter: [
      {
        type: 'equals',
        field: 'productNumber',
        value: slug,
      },
    ],
    associations: {
      cover: { associations: { media: {} } },
      media: {},
      seoUrls: {},
      categories: {},
      properties: { associations: { group: {} } },
    },
  });

  return fallback?.elements?.[0] || null;
}

/**
 * Fetch products belonging to a specific category.
 */
export async function getProductsByCategory(categoryId, { page = 1, limit = 24, sort = [] } = {}) {
  const body = {
    page,
    limit,
    filter: [
      {
        type: 'equals',
        field: 'categoryTree',
        value: categoryId,
      },
    ],
    associations: {
      cover: { associations: { media: {} } },
      seoUrls: {},
    },
  };

  if (sort.length) body.sort = sort;

  return storeApiPost('/product', body);
}

/**
 * Full-text search for products.
 */
export async function searchProducts(term, { page = 1, limit = 24 } = {}) {
  return storeApiPost('/search', {
    search: term,
    page,
    limit,
    associations: {
      cover: { associations: { media: {} } },
      seoUrls: {},
    },
  });
}
