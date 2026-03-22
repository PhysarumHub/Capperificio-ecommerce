import { useState, useCallback } from 'react';
import * as cartApi from '../lib/api/cart';
import { isShopwareConfigured } from '../lib/shopware-client';

export function useCart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const configured = isShopwareConfigured();

  // ── Fetch current cart ──────────────────────────────────
  const fetchCart = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch (err) {
      setError(err.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [configured]);

  // ── Helper: run API call and use its response as new cart state ──
  // Shopware returns the updated cart on every mutation — no need for a second getCart()
  const mutateCart = useCallback(async (apiFn) => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await apiFn();
      if (updated?.lineItems !== undefined) {
        setCart(updated);
      } else {
        // Fallback: only fetch if the response isn't a cart object
        const fresh = await cartApi.getCart();
        setCart(fresh);
      }
    } catch (err) {
      setError(err.message || 'Cart operation failed');
      try {
        const fresh = await cartApi.getCart();
        setCart(fresh);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [configured]);

  const addItem = useCallback((productId, quantity = 1) =>
    mutateCart(() => cartApi.addToCart(productId, quantity)),
  [mutateCart]);

  const updateQuantity = useCallback((lineItemId, quantity) =>
    mutateCart(() => cartApi.updateCartItem(lineItemId, quantity)),
  [mutateCart]);

  const removeItem = useCallback((lineItemId) =>
    mutateCart(() => cartApi.removeCartItem(lineItemId)),
  [mutateCart]);

  // Update primary item + remove duplicates, use last response as cart
  const mergeUpdate = useCallback(async (primaryId, newQty, duplicateIds = []) => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await cartApi.updateCartItem(primaryId, newQty);
      let last = updated;
      for (const id of duplicateIds) {
        last = await cartApi.removeCartItem(id);
      }
      if (last?.lineItems !== undefined) {
        setCart(last);
      } else {
        const fresh = await cartApi.getCart();
        setCart(fresh);
      }
    } catch (err) {
      setError(err.message || 'Cart operation failed');
      try { const fresh = await cartApi.getCart(); setCart(fresh); } catch {}
    } finally {
      setLoading(false);
    }
  }, [configured]);

  // Remove multiple items, use last response as cart
  const removeItems = useCallback(async (ids) => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      let last;
      for (const id of ids) {
        last = await cartApi.removeCartItem(id);
      }
      if (last?.lineItems !== undefined) {
        setCart(last);
      } else {
        const fresh = await cartApi.getCart();
        setCart(fresh);
      }
    } catch (err) {
      setError(err.message || 'Cart operation failed');
      try { const fresh = await cartApi.getCart(); setCart(fresh); } catch {}
    } finally {
      setLoading(false);
    }
  }, [configured]);

  const clearCart = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      await cartApi.deleteCart();
      const fresh = await cartApi.getCart();
      setCart(fresh);
    } catch (err) {
      setError(err.message || 'Failed to clear cart');
    } finally {
      setLoading(false);
    }
  }, [configured]);

  const itemCount = cart?.lineItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const totalPrice = cart?.price?.totalPrice ?? 0;

  return {
    cart,
    loading,
    error,
    itemCount,
    totalPrice,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    mergeUpdate,
    removeItems,
    clearCart,
  };
}
