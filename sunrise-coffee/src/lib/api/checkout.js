import Cookies from 'js-cookie';
import { storeApiPost, storeApiPatch } from '../shopware-client';

const CONTEXT_TOKEN_COOKIE = 'sw-context-token';

/** Legge il context token corrente della sessione Shopware (cookie). */
export function getContextToken() {
  return Cookies.get(CONTEXT_TOKEN_COOKIE) || '';
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Errore di rete');
  return data;
}

// ── Pagamenti sicuri (importo e verifica lato server) ──────────────────────────

/** Crea il PaymentIntent Stripe; l'importo è calcolato dal server sul carrello reale. */
export function createStripePaymentIntent(contextToken) {
  return postJson('/api/stripe/create-payment-intent', { contextToken });
}

/** Finalizza l'ordine Stripe: il server verifica il pagamento prima di crearlo. */
export function confirmStripeOrder(paymentIntentId, contextToken) {
  return postJson('/api/stripe/confirm-and-order', { paymentIntentId, contextToken });
}

/** Crea l'ordine PayPal con importo dal server. */
export function createPaypalOrder(contextToken) {
  return postJson('/api/paypal/create-order', { contextToken });
}

/** Cattura PayPal + crea l'ordine, con verifica importo lato server. */
export function capturePaypalOrder(orderId, contextToken) {
  return postJson('/api/paypal/capture-order', { orderId, contextToken });
}

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

// NB: l'ordine NON viene più creato lato client.
// La creazione passa SEMPRE dal server (confirm-and-order / capture-order),
// che verifica il pagamento prima di chiamare /checkout/order su Shopware.
