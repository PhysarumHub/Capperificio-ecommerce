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
      tags: {},
      options: { associations: { group: {} } },
      properties: { associations: { group: {} } },
      configuratorSettings: {
        associations: { option: { associations: { group: {} } } },
      },
    },
  };

  if (filters.length) body.filter = filters;
  if (sort.length) body.sort = sort;

  return storeApiPost('/product', body);
}

const PRODUCT_DETAIL_ASSOCIATIONS = {
  cover: { associations: { media: {} } },
  media: { associations: { media: {} } },
  seoUrls: {},
  categories: {},
  properties: { associations: { group: {} } },
  configuratorSettings: {
    associations: { option: { associations: { group: {} } } },
  },
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
};

const PRODUCT_DETAIL_INCLUDES = {
  product: [
    'id', 'name', 'description', 'translated', 'calculatedPrice',
    'cover', 'media', 'seoUrls', 'categories', 'properties',
    'configuratorSettings', 'crossSellings', 'customFields', 'availableStock',
  ],
};

/**
 * Fetch a single product by its ID or SEO slug.
 * Priority: ID (UUID) → seoUrl → productNumber
 */
export async function getProductBySlug(slug) {
  if (!slug) return null;

  const isUuid = /^[0-9a-f]{32}$/.test(slug.replace(/-/g, ''));

  // 1. Fetch by ID if slug looks like a UUID (most common case when no seoUrls)
  if (isUuid) {
    const byId = await storeApiPost('/product', {
      limit: 1,
      filter: [{ type: 'equals', field: 'id', value: slug }],
      associations: PRODUCT_DETAIL_ASSOCIATIONS,
      includes: PRODUCT_DETAIL_INCLUDES,
    });
    if (byId?.elements?.length) return byId.elements[0];
  }

  // 2. Try by seoUrl path
  const bySeo = await storeApiPost('/product', {
    limit: 1,
    filter: [{ type: 'contains', field: 'seoUrls.seoPathInfo', value: slug }],
    associations: PRODUCT_DETAIL_ASSOCIATIONS,
    includes: PRODUCT_DETAIL_INCLUDES,
  });
  if (bySeo?.elements?.length) return bySeo.elements[0];

  // 3. Try by productNumber
  const byNumber = await storeApiPost('/product', {
    limit: 1,
    filter: [{ type: 'equals', field: 'productNumber', value: slug }],
    associations: PRODUCT_DETAIL_ASSOCIATIONS,
    includes: PRODUCT_DETAIL_INCLUDES,
  });
  return byNumber?.elements?.[0] || null;
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
 * Fetch variant children of a configurable product.
 */
export async function getProductVariants(parentId) {
  return storeApiPost('/product', {
    limit: 50,
    filter: [{ type: 'equals', field: 'parentId', value: parentId }],
    associations: {
      options: { associations: { group: {} } },
    },
    includes: {
      product: ['id', 'productNumber', 'options', 'calculatedPrice', 'availableStock'],
    },
  });
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
