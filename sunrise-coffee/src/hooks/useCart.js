import { useState, useCallback } from 'react';
import * as cartApi from '../lib/api/cart';
import { isShopwareConfigured } from '../lib/shopware-client';

/**
 * Hook for cart state management.
 * Returns cart data and methods to manipulate it.
 */
export function useCart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const configured = isShopwareConfigured();

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

  const addItem = useCallback(async (productId, quantity = 1) => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cartApi.addToCart(productId, quantity);
      setCart(data);
    } catch (err) {
      setError(err.message || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  }, [configured]);

  const updateQuantity = useCallback(async (lineItemId, quantity) => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cartApi.updateCartItem(lineItemId, quantity);
      setCart(data);
    } catch (err) {
      setError(err.message || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  }, [configured]);

  const removeItem = useCallback(async (lineItemId) => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cartApi.removeCartItem(lineItemId);
      setCart(data);
    } catch (err) {
      setError(err.message || 'Failed to remove item');
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
      setCart(null);
    } catch (err) {
      setError(err.message || 'Failed to clear cart');
    } finally {
      setLoading(false);
    }
  }, [configured]);

  const itemCount = cart?.lineItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalPrice = cart?.price?.totalPrice || 0;

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
    clearCart,
  };
}
