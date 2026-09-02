/**
 * Google Tag Manager / GA4 e-commerce event helpers.
 * All functions are no-ops when dataLayer is not available (GTM not loaded).
 *
 * Usage: import { gtmPurchase, gtmAddToCart } from '../lib/utils/gtm';
 */

const CONSENT_STORAGE_KEY = 'capperificio_consent';
const MAX_PENDING_EVENTS = 20;

function hasStoredConsent() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return false;
  }
}

// Finché l'utente non ha ancora scelto, i tag consent-gated (GA4, Meta Pixel)
// scartano l'evento al momento del trigger e non lo ripescano da soli: per
// evitare di perdere il primo page_view/view_item bisogna ripushare noi
// stessi gli stessi eventi non appena arriva il consenso, così GTM li
// rivaluta da capo (senza bisogno di un reload della pagina).
let consentDecided = hasStoredConsent();
let pendingEvents = [];

function push(event) {
  if (typeof window === 'undefined') return;

  // Il tag Meta Pixel (via GTM) legge `value` e `currency` dal livello top del
  // dataLayer, non da `ecommerce.*` come GA4: senza questo rispecchiamento gli
  // eventi Purchase/AddToCart ecc. arrivavano a Meta senza 'value'.
  if (event && event.ecommerce && typeof event.ecommerce === 'object') {
    if (event.value === undefined && event.ecommerce.value !== undefined) {
      event.value = event.ecommerce.value;
    }
    if (event.currency === undefined && event.ecommerce.currency !== undefined) {
      event.currency = event.ecommerce.currency;
    }
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);

  if (!consentDecided) {
    pendingEvents.push(event);
    if (pendingEvents.length > MAX_PENDING_EVENTS) pendingEvents.shift();
  }
}

// Chiamata dal banner cookie subito dopo gtag('consent', 'update', ...):
// ripropone gli eventi accumulati prima della scelta dell'utente. GTM
// rivaluta il consenso per ciascun tag al momento del (ri)trigger, quindi
// non serve sapere qui quali categorie sono state concesse.
export function gtmReplayPendingEvents() {
  consentDecided = true;
  if (pendingEvents.length === 0) return;
  const toReplay = pendingEvents;
  pendingEvents = [];
  window.dataLayer = window.dataLayer || [];
  toReplay.forEach((event) => window.dataLayer.push(event));
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

// ── SPA pageview (su ogni cambio rotta) ────────────────────────────────────────
export function gtmPageView({ location, path, title }) {
  push({
    event: 'page_view',
    page_location: location,
    page_path: path,
    page_title: title,
  });
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

// ── Add payment info (payment method selected/confirmed) ─────────────────────
export function gtmAddPaymentInfo(paymentMethodName, lineItems = [], total = 0) {
  push({ ecommerce: null });
  push({
    event: 'add_payment_info',
    ecommerce: {
      currency: 'EUR',
      value: total,
      payment_type: paymentMethodName || '',
      items: lineItems.map(i => ({
        item_id:   i.referencedId || i.id,
        item_name: i.label || '',
        price:     i.price?.unitPrice ?? 0,
        quantity:  i.quantity ?? 1,
      })),
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
