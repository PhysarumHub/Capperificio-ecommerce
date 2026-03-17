import { useState, useEffect } from 'react';
import { getProducts, getProductBySlug } from '../lib/api/products';
import { isShopwareConfigured } from '../lib/shopware-client';

/**
 * Hook to fetch a list of products with loading/error state.
 * @param {object} options - { page, limit, filters, sort, categoryId }
 */
export function useProducts(options = {}) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { page = 1, limit = 24, filters = [], sort = [], categoryId } = options;
  const depsKey = JSON.stringify({ page, limit, filters, sort, categoryId });

  useEffect(() => {
    if (!isShopwareConfigured()) {
      setLoading(false);
      setError('Shopware API not configured. Set VITE_SHOPWARE_API_URL and VITE_SHOPWARE_ACCESS_KEY in .env');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const allFilters = [...filters];
    if (categoryId) {
      allFilters.push({
        type: 'equals',
        field: 'categoryTree',
        value: categoryId,
      });
    }

    getProducts({ page, limit, filters: allFilters, sort })
      .then((result) => {
        if (cancelled) return;
        setProducts(result?.elements || []);
        setTotal(result?.total || 0);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load products');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [depsKey]);

  return { products, total, loading, error };
}

/**
 * Hook to fetch a single product by slug.
 */
export function useProduct(slug) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    if (!isShopwareConfigured()) {
      setLoading(false);
      setError('Shopware API not configured');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getProductBySlug(slug)
      .then((result) => {
        if (cancelled) return;
        setProduct(result);
        if (!result) setError('Product not found');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load product');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  return { product, loading, error };
}
