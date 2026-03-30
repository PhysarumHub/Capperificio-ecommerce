import { storeApiPost, storeApiPatch } from '../shopware-client';

/**
 * Get available payment methods.
 */
export async function getPaymentMethods() {
  const result = await storeApiPost('/payment-method', {
    onlyAvailable: true,
    includes: { payment_method: ['id', 'name', 'translated', 'handlerIdentifier'] },
  });
  return result?.elements || [];
}

/**
 * Get available shipping methods.
 */
export async function getShippingMethods() {
  const result = await storeApiPost('/shipping-method', { onlyAvailable: true });
  return result?.elements || [];
}

/**
 * Update the current sales channel context (payment method, shipping method, etc.)
 */
export async function updateContext(data) {
  return storeApiPatch('/context', data);
}

/**
 * Place an order from the current cart.
 * Context must already have paymentMethodId and shippingMethodId set via updateContext().
 */
export async function placeOrder() {
  return storeApiPost('/checkout/order');
}
