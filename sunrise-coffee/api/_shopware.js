// ─────────────────────────────────────────────────────────────────────────────
//  Helper SERVER per Shopware 6 (Store API + Admin API).
//
//  Usato dagli endpoint di pagamento per:
//    1. registrare il guest e preparare il contesto (spedizione) → token autoritativo
//    2. leggere il totale REALE del carrello (mai fidarsi dell'importo dal client)
//    3. piazzare l'ordine SOLO dopo aver verificato il pagamento
//    4. segnare la transazione come "paid" via Admin API
//
//  ⚠ Env var (lato server, SENZA prefisso VITE_):
//     SHOPWARE_API_URL          es. http://shopware/store-api
//     SHOPWARE_ACCESS_KEY       chiave del sales channel headless (SWSC...)
//     SHOPWARE_ADMIN_API_URL    es. http://shopware/api               (opzionale)
//     SHOPWARE_ADMIN_CLIENT_ID  integration client_id                 (opzionale)
//     SHOPWARE_ADMIN_CLIENT_SECRET integration client_secret          (opzionale)
//     SHOPWARE_ADMIN_USERNAME / SHOPWARE_ADMIN_PASSWORD  fallback dev  (opzionale)
// ─────────────────────────────────────────────────────────────────────────────

const SW_URL = (process.env.SHOPWARE_API_URL || '').replace(/\/$/, '');
const SW_KEY = process.env.SHOPWARE_ACCESS_KEY || '';

const ADMIN_URL = (process.env.SHOPWARE_ADMIN_API_URL || '').replace(/\/$/, '');
const ADMIN_CLIENT_ID = process.env.SHOPWARE_ADMIN_CLIENT_ID || '';
const ADMIN_CLIENT_SECRET = process.env.SHOPWARE_ADMIN_CLIENT_SECRET || '';
const ADMIN_USERNAME = process.env.SHOPWARE_ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.SHOPWARE_ADMIN_PASSWORD || '';

export function shopwareConfigured() {
  return Boolean(SW_URL && SW_KEY);
}

/** True se sono presenti credenziali per l'Admin API (integration o user/pass). */
export function adminConfigured() {
  return Boolean(ADMIN_URL && ((ADMIN_CLIENT_ID && ADMIN_CLIENT_SECRET) || (ADMIN_USERNAME && ADMIN_PASSWORD)));
}

// ── Store API ────────────────────────────────────────────────────────────────

/**
 * Chiamata generica alla Store API di Shopware lato server.
 * Inoltra il context token del cliente (lo stesso del cookie sw-context-token)
 * così opera sullo stesso carrello/sessione del browser.
 * Ritorna { data, contextToken } dove contextToken è quello aggiornato dagli header.
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
    signal: AbortSignal.timeout(10_000),
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
 * Registra il guest (se non già loggato) sullo stesso contesto del carrello.
 * Shopware migra automaticamente il carrello sul nuovo token di sessione.
 * Ritorna il context token aggiornato (quello che possiede il carrello).
 * Tollera "customer already exists" (riprova dell'utente nella stessa sessione).
 */
export async function registerGuestIfNeeded(contextToken, { email, customer, billingAddress }) {
  if (!contextToken) throw new Error('contextToken mancante');

  // Se la sessione è già di un cliente (loggato o guest registrato), salta.
  try {
    const { data: ctx } = await swFetch('/context', { method: 'GET', contextToken });
    if (ctx?.customer?.id) return contextToken;
  } catch {
    // /context senza cliente può rispondere comunque; proseguiamo con la registrazione
  }

  if (!email) throw new Error('Email cliente mancante per la registrazione');

  try {
    const { contextToken: newToken } = await swFetch('/account/register', {
      method: 'POST',
      contextToken,
      body: {
        guest: true,
        email,
        firstName: customer?.firstName,
        lastName: customer?.lastName,
        salutationId: customer?.salutationId,
        storefrontUrl: customer?.storefrontUrl,
        billingAddress,
      },
    });
    return newToken || contextToken;
  } catch (e) {
    if (/already|exist/i.test(e?.message || '')) return contextToken;
    throw e;
  }
}

/** Campi che identificano un indirizzo: se cambia uno di questi, cambia la consegna. */
const ADDRESS_FIELDS = ['firstName', 'lastName', 'street', 'zipcode', 'city', 'countryId', 'phoneNumber', 'company'];

/** True se l'indirizzo inviato dal client differisce da quello attivo sul contesto. */
function addressDiffers(current, next) {
  if (!current) return true;
  return ADDRESS_FIELDS.some((field) => {
    // Un campo assente nella richiesta non è una modifica: non lo confrontiamo.
    if (next[field] === undefined || next[field] === null) return false;
    return String(next[field]).trim() !== String(current[field] ?? '').trim();
  });
}

/**
 * Allinea l'indirizzo del contesto a quello inserito nel checkout.
 *
 * Serve perché `registerGuestIfNeeded` esce subito quando il contesto ha già un
 * cliente: dopo la prima registrazione l'indirizzo non veniva più aggiornato,
 * quindi correggere via o città prima di pagare non cambiava nulla e il pacco
 * partiva verso il vecchio indirizzo.
 *
 * Invece di riscrivere l'indirizzo esistente ne crea uno nuovo e ci punta il
 * contesto: un cliente registrato non si vede così modificare l'indirizzo salvato
 * in rubrica solo perché ha spedito una volta altrove.
 *
 * Se nulla è cambiato non fa alcuna chiamata, quindi il percorso normale (utente
 * che non torna indietro a correggere) resta identico a prima.
 *
 * @returns {Promise<{ contextToken: string, changed: boolean }>}
 */
export async function syncCheckoutAddress(contextToken, { billingAddress }) {
  if (!contextToken || !billingAddress) return { contextToken, changed: false };

  const { data: ctx } = await swFetch('/context', { method: 'GET', contextToken });
  const customer = ctx?.customer;
  if (!customer?.id) return { contextToken, changed: false };

  const active = customer.activeBillingAddress || customer.defaultBillingAddress;
  if (!addressDiffers(active, billingAddress)) return { contextToken, changed: false };

  const { data: created, contextToken: afterCreate } = await swFetch('/account/address', {
    method: 'POST',
    contextToken,
    body: billingAddress,
  });

  const addressId = created?.id;
  if (!addressId) return { contextToken: afterCreate || contextToken, changed: false };

  const { contextToken: afterPatch } = await swFetch('/context', {
    method: 'PATCH',
    contextToken: afterCreate || contextToken,
    body: { billingAddressId: addressId, shippingAddressId: addressId },
  });

  return { contextToken: afterPatch || afterCreate || contextToken, changed: true };
}

/** Imposta il metodo di spedizione sul contesto. Ritorna il token aggiornato. */
export async function setShippingMethod(contextToken, shippingMethodId) {
  if (!shippingMethodId) return contextToken;
  const { contextToken: t } = await swFetch('/context', {
    method: 'PATCH',
    contextToken,
    body: { shippingMethodId },
  });
  return t || contextToken;
}

/**
 * Legge il totale REALE del carrello dal server.
 * Questo è l'unico importo di cui fidarsi per creare un pagamento.
 *
 * Un totale di 0 è legittimo (promozione al 100%): il carrello è "vuoto" solo
 * se non contiene prodotti. Chi crea il pagamento deve quindi gestire il caso
 * `amountInCents === 0` (ordine gratuito, nessun PaymentIntent).
 */
export async function getCartTotal(contextToken) {
  if (!contextToken) throw new Error('contextToken mancante');
  const { data: cart } = await swFetch('/checkout/cart', { method: 'GET', contextToken });

  const hasProducts = (cart?.lineItems ?? []).some((i) => i.type === 'product');
  const total = cart?.price?.totalPrice;
  if (!hasProducts || typeof total !== 'number' || total < 0) {
    const err = new Error('Carrello vuoto o totale non valido');
    err.status = 400;
    throw err;
  }
  // Shop a valuta singola (EUR). Importo in centesimi: unica unità con cui confrontare Stripe.
  return {
    cart,
    total,
    amountInCents: Math.round(total * 100),
    currency: 'eur',
  };
}

/**
 * Piazza l'ordine dal carrello corrente.
 * Va chiamata SOLO dopo aver verificato che il pagamento è andato a buon fine
 * e che l'importo pagato coincide con il totale del carrello.
 */
export async function placeOrder(contextToken) {
  const { data } = await swFetch('/checkout/order', { method: 'POST', contextToken, body: {} });
  return data; // contiene orderNumber, id, transactions, ecc.
}

// ── Admin API (per segnare la transazione "paid") ────────────────────────────

let _adminToken = null;
let _adminTokenExp = 0;

/** Ottiene (e cache-a) un access token Admin API. */
async function adminToken() {
  if (!adminConfigured()) throw new Error('Admin API non configurata');
  const now = Date.now();
  if (_adminToken && now < _adminTokenExp - 30_000) return _adminToken;

  const body = ADMIN_CLIENT_ID && ADMIN_CLIENT_SECRET
    ? { grant_type: 'client_credentials', client_id: ADMIN_CLIENT_ID, client_secret: ADMIN_CLIENT_SECRET }
    : { grant_type: 'password', client_id: 'administration', username: ADMIN_USERNAME, password: ADMIN_PASSWORD, scopes: 'write' };

  const res = await fetch(`${ADMIN_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(data?.errors?.[0]?.detail || 'Admin OAuth fallita');
  }
  _adminToken = data.access_token;
  _adminTokenExp = now + (Number(data.expires_in || 600) * 1000);
  return _adminToken;
}

/** Chiamata generica all'Admin API con bearer token. */
async function adminFetch(endpoint, { method = 'GET', body } = {}) {
  const token = await adminToken();
  const res = await fetch(`${ADMIN_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error(data?.errors?.[0]?.detail || `Admin HTTP ${res.status}`);
    err.status = res.status;
    err.admin = data;
    throw err;
  }
  return data;
}

/**
 * Recupera i dettagli completi di un ordine via Admin API, con tutte le
 * associations necessarie per creare la spedizione su Packlink.
 * Best-effort: ritorna null se Admin API non configurata o l'ordine non esiste.
 */
export async function fetchOrderDetails(orderId) {
  if (!orderId || !adminConfigured()) return null;
  try {
    const data = await adminFetch('/search/order', {
      method: 'POST',
      body: {
        limit: 1,
        filter: [{ type: 'equals', field: 'id', value: orderId }],
        associations: {
          deliveries: {
            associations: {
              shippingOrderAddress: {
                associations: { country: {} },
              },
            },
          },
          lineItems: {},
          orderCustomer: {},
        },
      },
    });
    return data?.data?.[0] || null;
  } catch (e) {
    console.warn('fetchOrderDetails fallita:', e.message);
    return null;
  }
}

// ── Polling stati ordine (per email automatiche) ─────────────────────────────

const FULL_ORDER_ASSOCIATIONS = {
  deliveries: {
    associations: {
      shippingOrderAddress: { associations: { country: {} } },
      shippingMethod: {},
      stateMachineState: {},
    },
  },
  lineItems: {},
  orderCustomer: {},
  stateMachineState: {},
};

function thirtyDaysAgo() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Restituisce gli ordini con la consegna nello stato richiesto (es. "shipped")
 * creati negli ultimi 30 giorni. Include trackingCodes e shippingMethod.
 */
export async function fetchOrdersInDeliveryState(stateTechnicalName, limit = 50) {
  if (!adminConfigured()) return [];
  try {
    const data = await adminFetch('/search/order', {
      method: 'POST',
      body: {
        limit,
        filter: [
          { type: 'equals', field: 'deliveries.stateMachineState.technicalName', value: stateTechnicalName },
          { type: 'range', field: 'createdAt', parameters: { gte: thirtyDaysAgo() } },
        ],
        associations: FULL_ORDER_ASSOCIATIONS,
      },
    });
    return data?.data || [];
  } catch (e) {
    console.warn(`fetchOrdersInDeliveryState(${stateTechnicalName}):`, e.message);
    return [];
  }
}

/**
 * Restituisce gli ordini nello stato richiesto (es. "cancelled")
 * creati negli ultimi 30 giorni.
 */
export async function fetchOrdersInOrderState(stateTechnicalName, limit = 50) {
  if (!adminConfigured()) return [];
  try {
    const data = await adminFetch('/search/order', {
      method: 'POST',
      body: {
        limit,
        filter: [
          { type: 'equals', field: 'stateMachineState.technicalName', value: stateTechnicalName },
          { type: 'range', field: 'createdAt', parameters: { gte: thirtyDaysAgo() } },
        ],
        associations: FULL_ORDER_ASSOCIATIONS,
      },
    });
    return data?.data || [];
  } catch (e) {
    console.warn(`fetchOrdersInOrderState(${stateTechnicalName}):`, e.message);
    return [];
  }
}

/**
 * Prodotti con stock sotto la soglia — per alert merchant.
 */
export async function fetchLowStockProducts(threshold = 5) {
  if (!adminConfigured()) return [];
  try {
    const data = await adminFetch('/search/product', {
      method: 'POST',
      body: {
        limit: 50,
        filter: [
          { type: 'range', field: 'availableStock', parameters: { lte: threshold } },
          { type: 'equals', field: 'active', value: true },
          { type: 'equals', field: 'parentId', value: null },
        ],
        includes: { product: ['id', 'name', 'productNumber', 'availableStock'] },
      },
    });
    return data?.data || [];
  } catch (e) {
    console.warn('fetchLowStockProducts:', e.message);
    return [];
  }
}

/**
 * Salva il reference Packlink sull'ordine Shopware (customFields) e aggiunge
 * un tag "Packlink" per filtrare rapidamente gli ordini nella lista admin.
 * Best-effort: non lancia mai, loggha gli errori.
 */
export async function savePacklinkReference(orderId, packlinkRef) {
  if (!orderId || !packlinkRef || !adminConfigured()) return;
  try {
    await adminFetch(`/order/${orderId}`, {
      method: 'PATCH',
      body: {
        customFields: {
          packlink_reference: packlinkRef,
        },
        tags: [{ name: 'Packlink' }],
      },
    });
  } catch (e) {
    console.warn(`savePacklinkReference: impossibile salvare ${packlinkRef} su ordine ${orderId}:`, e.message);
  }
}

/**
 * Segna come "paid" la transazione di pagamento dell'ordine via Admin API.
 * Best-effort: se l'Admin API non è configurata o la chiamata fallisce, NON lancia
 * (l'ordine resta creato); ritorna { ok, reason } per il logging del chiamante.
 */
export async function markTransactionPaid(orderId, paymentIntentId) {
  if (!orderId) return { ok: false, reason: 'orderId mancante' };
  if (!adminConfigured()) return { ok: false, reason: 'Admin API non configurata' };
  try {
    const search = await adminFetch('/search/order-transaction', {
      method: 'POST',
      body: {
        filter: [{ type: 'equals', field: 'orderId', value: orderId }],
        limit: 1,
      },
    });
    const txId = search?.data?.[0]?.id;
    if (!txId) return { ok: false, reason: 'transazione non trovata' };

    await adminFetch(`/_action/order_transaction/${txId}/state/paid`, { method: 'POST' });

    // Traccia il PaymentIntent Stripe sull'ordine (best-effort, ignora errori)
    if (paymentIntentId) {
      try {
        await adminFetch(`/order/${orderId}`, {
          method: 'PATCH',
          body: { customFields: { stripe_payment_intent_id: paymentIntentId } },
        });
      } catch { /* custom field assente: non bloccante */ }
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

/**
 * Trova l'ordine Shopware a partire dal PaymentIntent Stripe collegato
 * (customFields.stripe_payment_intent_id, salvato da markTransactionPaid).
 * Serve al webhook `charge.refunded`, che riceve solo il PaymentIntent id
 * (l'ordine è già stato creato in precedenza, il context token non esiste più).
 * Best-effort: ritorna null se non configurato o non trovato.
 */
export async function findOrderByPaymentIntentId(paymentIntentId) {
  if (!paymentIntentId || !adminConfigured()) return null;
  try {
    const data = await adminFetch('/search/order', {
      method: 'POST',
      body: {
        limit: 1,
        filter: [{ type: 'equals', field: 'customFields.stripe_payment_intent_id', value: paymentIntentId }],
        associations: {
          deliveries: { associations: { shippingOrderAddress: { associations: { country: {} } } } },
          lineItems: {},
          orderCustomer: {},
        },
      },
    });
    return data?.data?.[0] || null;
  } catch (e) {
    console.warn('findOrderByPaymentIntentId fallita:', e.message);
    return null;
  }
}

/**
 * Segna come "refunded" (o "refunded_partially") la transazione di pagamento
 * dell'ordine via Admin API. Idempotente: se la transazione è già in uno stato
 * di rimborso non fa nulla — questo protegge sia da doppie chiamate webhook
 * sia dal caso in cui /api/admin/refund e il webhook `charge.refunded` per lo
 * stesso rimborso arrivino entrambi.
 * Best-effort: se l'Admin API non è configurata o la chiamata fallisce, NON lancia;
 * ritorna { ok, reason } per il logging del chiamante.
 *
 * ⚠ v1: pensata per un SOLO rimborso totale per ordine. Un secondo rimborso
 * parziale distinto sullo stesso ordine non verrebbe distinto da questo guard
 * (la transazione risulterebbe già "refunded_partially") — non gestito in questa
 * versione, richiede tracciare i singoli refund id.
 */
export async function markTransactionRefunded(orderId, refundId, { partial = false } = {}) {
  if (!orderId) return { ok: false, reason: 'orderId mancante' };
  if (!adminConfigured()) return { ok: false, reason: 'Admin API non configurata' };
  try {
    const search = await adminFetch('/search/order-transaction', {
      method: 'POST',
      body: {
        filter: [{ type: 'equals', field: 'orderId', value: orderId }],
        associations: { stateMachineState: {} },
        limit: 1,
      },
    });
    const tx = search?.data?.[0];
    if (!tx?.id) return { ok: false, reason: 'transazione non trovata' };

    const currentState = tx.stateMachineState?.technicalName;
    if (currentState === 'refunded' || currentState === 'refunded_partially') {
      return { ok: true, reason: 'già rimborsato (idempotente)' };
    }

    const transition = partial ? 'refund_partially' : 'refund';
    await adminFetch(`/_action/order_transaction/${tx.id}/state/${transition}`, { method: 'POST' });

    if (refundId) {
      try {
        await adminFetch(`/order/${orderId}`, {
          method: 'PATCH',
          body: { customFields: { stripe_refund_id: refundId } },
        });
      } catch { /* custom field assente: non bloccante */ }
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}
