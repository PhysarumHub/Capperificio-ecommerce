// ─────────────────────────────────────────────────────────────────────────────
//  Helper SERVER per la Store API di Shopware.
//
//  Usato dalle serverless function di pagamento per:
//    1. leggere il totale REALE del carrello (mai fidarsi dell'importo dal client)
//    2. piazzare l'ordine SOLO dopo aver verificato il pagamento
//
//  ⚠ Richiede le env var (lato server, SENZA prefisso VITE_):
//     SHOPWARE_API_URL     es. https://negozio.com/store-api
//     SHOPWARE_ACCESS_KEY  la chiave del sales channel headless (SWSC...)
// ─────────────────────────────────────────────────────────────────────────────

const SW_URL = (process.env.SHOPWARE_API_URL || '').replace(/\/$/, '');
const SW_KEY = process.env.SHOPWARE_ACCESS_KEY || '';

export function shopwareConfigured() {
  return Boolean(SW_URL && SW_KEY);
}

/**
 * Chiamata generica alla Store API di Shopware lato server.
 * Inoltra il context token del cliente (lo stesso del cookie sw-context-token)
 * così opera sullo stesso carrello/sessione del browser.
 */
export async function swFetch(endpoint, { method = 'GET', contextToken, body } = {}) {
  if (!shopwareConfigured()) {
    throw new Error('Shopware non configurato sul server (SHOPWARE_API_URL / SHOPWARE_ACCESS_KEY)');
  }
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'sw-access-key': SW_KEY,
  };
  if (contextToken) headers['sw-context-token'] = contextToken;

  const res = await fetch(`${SW_URL}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const detail = data?.errors?.[0]?.detail || data?.message || `Shopware HTTP ${res.status}`;
    const err = new Error(detail);
    err.status = res.status;
    err.shopware = data;
    throw err;
  }

  // Shopware può restituire un context token aggiornato negli header
  const newToken = res.headers.get('sw-context-token');
  return { data, contextToken: newToken || contextToken };
}

/**
 * Legge il totale REALE del carrello dal server.
 * Questo è l'unico importo di cui fidarsi per creare un pagamento.
 */
export async function getCartTotal(contextToken) {
  if (!contextToken) throw new Error('contextToken mancante');
  const { data: cart } = await swFetch('/checkout/cart', { method: 'GET', contextToken });

  const total = cart?.price?.totalPrice;
  if (typeof total !== 'number' || total <= 0) {
    const err = new Error('Carrello vuoto o totale non valido');
    err.status = 400;
    throw err;
  }
  // Importo in centesimi: l'unica unità con cui confrontare Stripe/PayPal
  return {
    cart,
    total,
    amountInCents: Math.round(total * 100),
    currency: (cart?.price?.currencySymbol ? 'eur' : 'eur'), // shop a valuta singola (EUR)
  };
}

/**
 * Piazza l'ordine dal carrello corrente.
 * Va chiamata SOLO dopo aver verificato che il pagamento è andato a buon fine
 * e che l'importo pagato coincide con il totale del carrello.
 */
export async function placeOrder(contextToken) {
  const { data } = await swFetch('/checkout/order', { method: 'POST', contextToken, body: {} });
  return data; // contiene orderNumber, id, ecc.
}
