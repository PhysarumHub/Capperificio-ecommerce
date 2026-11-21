import { storeApiPost, storeApiPatch } from '../shopware-client';

/** Legge il context token corrente della sessione Shopware. */
export { getContextToken } from '../shopware-client';

async function postJson(url, body, { retries = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Errore di rete');
      return data;
    } catch (e) {
      lastErr = e;
      // Ritenta solo sugli errori di RETE (fetch che rifiuta con TypeError: la
      // connessione keep-alive muore mentre l'utente è sul passaggio carta di
      // Stripe). Gli errori applicativi del server — incluso il 409 "ordine già
      // elaborato" — non sono TypeError e non vanno ritentati.
      const isNetworkError = e instanceof TypeError;
      if (!isNetworkError || attempt === retries) throw e;
      await new Promise((resolve) => { setTimeout(resolve, 500 * (attempt + 1)); });
    }
  }
  throw lastErr;
}

// ── Pagamento unificato (importo, registrazione e verifica lato server) ─────────

/**
 * Prepara il checkout e crea il PaymentIntent Stripe unico (carta/wallet).
 * Il server registra il guest, imposta la spedizione, calcola il totale reale e
 * ritorna il context token autoritativo da usare per la conferma.
 *
 * @param {object} payload - { contextToken, customer, billingAddress, shippingMethodId }
 * @returns {Promise<{ clientSecret: string, contextToken: string, amount: number }>}
 */
export function createCheckoutIntent(payload) {
  return postJson('/api/checkout/create-intent', payload);
}

/** Finalizza l'ordine: il server verifica il pagamento, crea l'ordine e lo segna pagato. */
export function confirmCheckout({ paymentIntentId, contextToken }) {
  return postJson('/api/checkout/confirm', { paymentIntentId, contextToken });
}

/**
 * Finalizza un ordine a totale 0,00 € (es. codice sconto 100%): non c'è nessun
 * pagamento da verificare, ma il server ricontrolla che il totale sia davvero 0
 * prima di creare l'ordine (mai fidarsi del client).
 */
export function confirmFreeCheckout({ contextToken }) {
  return postJson('/api/checkout/confirm-free', { contextToken });
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
