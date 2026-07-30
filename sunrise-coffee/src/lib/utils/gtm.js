/**
 * Google Tag Manager / GA4 e-commerce event helpers.
 * All functions are no-ops when dataLayer is not available (GTM not loaded).
 *
 * Usage: import { gtmPurchase, gtmAddToCart } from '../lib/utils/gtm';
 */

function push(event) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

function mapItem(product, quantity = 1) {
  return {
    item_id:       product.id || product.productNumber || '',
    item_name:     product.name || '',
    item_category: product.categoryName || '',
    price:         product.price ?? 0,
    quantity,
  };
}

// ── View a product detail page ────────────────────────────────────────────────
export function gtmViewItem(product) {
  push({ ecommerce: null });
  push({
    event: 'view_item',
    ecommerce: {
      currency: 'EUR',
      value: product.price ?? 0,
      items: [mapItem(product)],
    },
  });
}

// ── Add to cart ───────────────────────────────────────────────────────────────
export function gtmAddToCart(product, quantity = 1) {
  push({ ecommerce: null });
  push({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'EUR',
      value: (product.price ?? 0) * quantity,
      items: [mapItem(product, quantity)],
    },
  });
}

// ── Remove from cart ──────────────────────────────────────────────────────────
export function gtmRemoveFromCart(product, quantity = 1) {
  push({ ecommerce: null });
  push({
    event: 'remove_from_cart',
    ecommerce: {
      currency: 'EUR',
      value: (product.price ?? 0) * quantity,
      items: [mapItem(product, quantity)],
    },
  });
}

// ── View cart (on cart open) ──────────────────────────────────────────────────
export function gtmViewCart(lineItems = [], total = 0) {
  push({ ecommerce: null });
  push({
    event: 'view_cart',
    ecommerce: {
      currency: 'EUR',
      value: total,
      items: lineItems.map(i => ({
        item_id:   i.referencedId || i.id,
        item_name: i.label || '',
        price:     i.price?.unitPrice ?? 0,
        quantity:  i.quantity ?? 1,
      })),
    },
  });
}

// ── Begin checkout ────────────────────────────────────────────────────────────
export function gtmBeginCheckout(lineItems = [], total = 0) {
  push({ ecommerce: null });
  push({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'EUR',
      value: total,
      items: lineItems.map(i => ({
        item_id:   i.referencedId || i.id,
        item_name: i.label || '',
        price:     i.price?.unitPrice ?? 0,
        quantity:  i.quantity ?? 1,
      })),
    },
  });
}

// ── Add shipping info (step address completed) ────────────────────────────────
export function gtmAddShippingInfo(shippingMethodName, total = 0) {
  push({ ecommerce: null });
  push({
    event: 'add_shipping_info',
    ecommerce: {
      currency: 'EUR',
      value: total,
      shipping_tier: shippingMethodName || '',
    },
  });
}

// ── Purchase (call after order confirmed) ────────────────────────────────────
export function gtmPurchase({ orderNumber, total, tax = 0, shipping = 0, lineItems = [] }) {
  push({ ecommerce: null });
  push({
    event: 'purchase',
    ecommerce: {
      transaction_id: String(orderNumber),
      currency:       'EUR',
      value:          total,
      tax,
      shipping,
      items: lineItems.map(i => ({
        item_id:   i.referencedId || i.id,
        item_name: i.label || '',
        price:     i.price?.unitPrice ?? 0,
        quantity:  i.quantity ?? 1,
      })),
    },
  });
}
