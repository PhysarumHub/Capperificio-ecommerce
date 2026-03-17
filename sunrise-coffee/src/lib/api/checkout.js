import { storeApiGet, storeApiPost } from '../shopware-client';

/**
 * Get available payment methods.
 */
export async function getPaymentMethods() {
  return storeApiGet('/payment-method', { onlyAvailable: true });
}

/**
 * Get available shipping methods.
 */
export async function getShippingMethods() {
  return storeApiGet('/shipping-method', { onlyAvailable: true });
}

/**
 * Place an order from the current cart.
 */
export async function placeOrder() {
  return storeApiPost('/checkout/order');
}
