import { createContext, useContext, useEffect, useMemo } from 'react';
import { useCart } from '../hooks/useCart';
import { useCustomer } from '../hooks/useCustomer';
import { isShopwareConfigured } from '../lib/shopware-client';

const B2B_GROUP_NAME = import.meta.env.VITE_B2B_GROUP_NAME || 'B2B';

const CartContext = createContext(null);
const CustomerContext = createContext(null);

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used within ShopwareProvider');
  return ctx;
}

export function useCustomerContext() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomerContext must be used within ShopwareProvider');
  return ctx;
}

export default function ShopwareProvider({ children }) {
  const cartState = useCart();
  const customerState = useCustomer();
  const isB2B = customerState.customer?.group?.name === B2B_GROUP_NAME;

  // Initialize cart and customer session on mount
  useEffect(() => {
    if (!isShopwareConfigured()) return;
    cartState.fetchCart();
    customerState.fetchCustomer();
  }, []);

  return (
    <CustomerContext.Provider value={{ ...customerState, isB2B }}>
      <CartContext.Provider value={cartState}>
        {children}
      </CartContext.Provider>
    </CustomerContext.Provider>
  );
}
