import { storeApiGet, storeApiPost, storeApiPatch, storeApiDelete } from '../shopware-client';

/**
 * Get the current cart.
 */
export async function getCart() {
  return storeApiGet('/checkout/cart');
}

/**
 * Add a product to the cart.
 */
export async function addToCart(productId, quantity = 1) {
  return storeApiPost('/checkout/cart/line-item', {
    items: [
      {
        type: 'product',
        referencedId: productId,
        quantity,
      },
    ],
  });
}

/**
 * Apply a promotion code to the cart.
 * Shopware risponde 200 anche per un codice inesistente: l'esito va letto dagli
 * `errors` del carrello restituito (vedi `promotionResult` in utils/promotion.js).
 */
export async function addPromotionCode(code) {
  return storeApiPost('/checkout/cart/line-item', {
    items: [
      {
        type: 'promotion',
        referencedId: code,
      },
    ],
  });
}

/**
 * Update a cart line item quantity.
 */
export async function updateCartItem(lineItemId, quantity) {
  return storeApiPatch('/checkout/cart/line-item', {
    items: [
      {
        id: lineItemId,
        quantity,
      },
    ],
  });
}

/**
 * Remove a line item from the cart.
 */
export async function removeCartItem(lineItemId) {
  // Shopware Store API accepts line-item IDs as query params for DELETE
  return storeApiDelete(`/checkout/cart/line-item?ids[]=${lineItemId}`);
}

/**
 * Delete / clear the entire cart.
 */
export async function deleteCart() {
  return storeApiDelete('/checkout/cart');
}
