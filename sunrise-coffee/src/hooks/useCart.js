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

  // ── Helper: run an API call then refresh the cart ───────
  const mutateCart = useCallback(async (apiFn) => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      await apiFn();
      // Always re-fetch so the UI reflects the real server state
      const fresh = await cartApi.getCart();
      setCart(fresh);
    } catch (err) {
      setError(err.message || 'Cart operation failed');
      // Still try to refresh so we show the current real state
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

  // Update primary item + remove duplicates in one single cart refresh
  const mergeUpdate = useCallback(async (primaryId, newQty, duplicateIds = []) => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      await cartApi.updateCartItem(primaryId, newQty);
      for (const id of duplicateIds) await cartApi.removeCartItem(id);
      const fresh = await cartApi.getCart();
      setCart(fresh);
    } catch (err) {
      setError(err.message || 'Cart operation failed');
      try { const fresh = await cartApi.getCart(); setCart(fresh); } catch {}
    } finally {
      setLoading(false);
    }
  }, [configured]);

  // Remove multiple items in one single cart refresh
  const removeItems = useCallback(async (ids) => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      for (const id of ids) await cartApi.removeCartItem(id);
      const fresh = await cartApi.getCart();
      setCart(fresh);
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
      // After delete Shopware creates a fresh empty cart on next GET
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
