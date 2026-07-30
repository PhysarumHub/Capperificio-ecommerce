// ─────────────────────────────────────────────────────────────────────────────
//  Client Packlink PRO — creazione automatica spedizioni post-ordine.
//
//  Flusso:
//    1. Ordine pagato → server chiama createShipmentForOrder(order)
//    2. Si interroga /v1/services per trovare il corriere più economico
//       per la rotta mittente→destinatario (o si usa il service_id fisso)
//    3. Si crea la spedizione via POST /v1/shipments
//    4. Il reference Packlink viene salvato sull'ordine Shopware
//    5. Il merchant va su app.packlink.com per stampare l'etichetta
//       (o la riceve per email da Packlink automaticamente)
//
//  Env var richieste:
//    PACKLINK_API_KEY          → chiave API da pro.packlink.com → Impostazioni → API
//
//  Env var opzionali (valori default pronti per Capperificio di Racale):
//    PACKLINK_SENDER_ZIP       default: 73055
//    PACKLINK_SENDER_COUNTRY   default: IT
//    PACKLINK_SENDER_CITY      default: Racale
//    PACKLINK_SENDER_STATE     default: LE
//    PACKLINK_SENDER_STREET    default: da configurare
//    PACKLINK_SENDER_NAME      default: Capperificio di Racale
//    PACKLINK_SENDER_EMAIL     default: info@capperificiocaro.it
//    PACKLINK_SENDER_PHONE     default: da configurare
//    PACKLINK_CONTENT          default: Capperi artigianali di Racale
//    PACKLINK_PKG_WEIGHT_KG    default: 1.5   (peso medio pacco capperi)
//    PACKLINK_PKG_WIDTH_CM     default: 22
//    PACKLINK_PKG_HEIGHT_CM    default: 12
//    PACKLINK_PKG_LENGTH_CM    default: 28
// ─────────────────────────────────────────────────────────────────────────────

const PACKLINK_API = 'https://api.packlink.com/v1';

const API_KEY = process.env.PACKLINK_API_KEY || '';

const SENDER = {
  zip:     process.env.PACKLINK_SENDER_ZIP     || '73055',
  country: process.env.PACKLINK_SENDER_COUNTRY || 'IT',
  city:    process.env.PACKLINK_SENDER_CITY    || 'Racale',
  state:   process.env.PACKLINK_SENDER_STATE   || 'LE',
  street:  process.env.PACKLINK_SENDER_STREET  || 'Via Montesanto 64',
  name:    process.env.PACKLINK_SENDER_NAME    || 'Capperificio di Racale',
  company: process.env.PACKLINK_SENDER_NAME    || 'Capperificio di Racale',
  email:   process.env.PACKLINK_SENDER_EMAIL   || 'info@capperificiocaro.it',
  phone:   process.env.PACKLINK_SENDER_PHONE   || '+390000000000',
};

const DEFAULT_PACKAGE = {
  weight: parseFloat(process.env.PACKLINK_PKG_WEIGHT_KG  || '1.5'),
  width:  parseFloat(process.env.PACKLINK_PKG_WIDTH_CM   || '22'),
  height: parseFloat(process.env.PACKLINK_PKG_HEIGHT_CM  || '12'),
  length: parseFloat(process.env.PACKLINK_PKG_LENGTH_CM  || '28'),
};

export function packlinkConfigured() {
  return Boolean(API_KEY);
}

async function plFetch(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${PACKLINK_API}${path}`, {
    method,
    headers: {
      Authorization: API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const msgs = Array.isArray(data?.messages) ? data.messages.map(m => m.message).join(', ') : '';
    const err = new Error(msgs || `Packlink HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function estimateWeight(lineItems = []) {
  const totalQty = lineItems.reduce((s, i) => s + (i.quantity || 1), 0);
  return Math.max(0.5, +(totalQty * 0.4).toFixed(2));
}

/**
 * Crea una spedizione DRAFT su Packlink PRO per l'ordine Shopware.
 *
 * La spedizione viene creata senza service_id (status: AWAITING_COMPLETION):
 * tutti i dati del destinatario e del pacco sono già precompilati.
 * Il merchant apre il dashboard Packlink PRO (app.packlink.com), seleziona
 * il corriere e stampa l'etichetta in 2 click.
 *
 * L'oggetto `order` deve venire da fetchOrderDetails() con le associations
 * (deliveries → shippingOrderAddress → country, lineItems, orderCustomer).
 *
 * @returns {Promise<string|null>} reference Packlink (es. "IT2026PRO000xxxx") o null
 */
export async function createShipmentForOrder(order) {
  if (!packlinkConfigured()) {
    console.log('Packlink: API key non configurata — spedizione saltata');
    return null;
  }

  const delivery = order.deliveries?.[0]?.shippingOrderAddress;
  if (!delivery) {
    console.warn('Packlink: indirizzo di spedizione mancante per ordine', order.orderNumber);
    return null;
  }

  const toCountry = delivery.country?.iso || '';
  const toZip     = (delivery.zipcode || '').trim();

  if (!toCountry || !toZip) {
    console.warn('Packlink: paese/CAP mancanti per ordine', order.orderNumber);
    return null;
  }

  const customer  = order.orderCustomer || {};
  const firstName = delivery.firstName || customer.firstName || '';
  const lastName  = delivery.lastName  || customer.lastName  || '';
  const weight    = estimateWeight(order.lineItems);

  const body = {
    from: SENDER,
    to: {
      zip:     toZip,
      country: toCountry,
      city:    delivery.city || '',
      street:  [delivery.street, delivery.additionalAddressLine2].filter(Boolean).join(', '),
      name:    `${firstName} ${lastName}`.trim() || 'Cliente',
      company: delivery.company || '',
      phone:   delivery.phoneNumber || customer.phone || SENDER.phone,
      email:   customer.email || SENDER.email,
    },
    // Packlink PRO accetta "parcels" come alias di "packages"
    parcels: [{
      weight,
      width:  DEFAULT_PACKAGE.width,
      height: DEFAULT_PACKAGE.height,
      length: DEFAULT_PACKAGE.length,
    }],
    reference:    order.orderNumber || order.id,
    content:      process.env.PACKLINK_CONTENT || 'Capperi artigianali di Racale',
    contentvalue: order.price?.totalPrice || 0,
    insurance:    { requested: false },
  };

  try {
    const result = await plFetch('/shipments', { method: 'POST', body });
    const ref = result?.reference;
    console.log(`Packlink ✓ draft creato: ${ref} — ordine ${order.orderNumber} (${toCountry} ${toZip}, ${weight}kg)`);
    console.log(`  → Seleziona corriere su: https://pro.packlink.com/shipment/${ref}`);
    return ref || null;
  } catch (e) {
    console.error(`Packlink ✗ ordine ${order.orderNumber}:`, e.message);
    return null;
  }
}

/**
 * Recupera l'URL dell'etichetta per un reference Packlink.
 * Disponibile solo dopo che il merchant ha confermato il corriere nel dashboard.
 *
 * @returns {Promise<string|null>} URL PDF etichetta o null
 */
export async function getLabelUrl(reference) {
  if (!packlinkConfigured() || !reference) return null;
  try {
    const labels = await plFetch(`/shipments/${reference}/labels`);
    return Array.isArray(labels) ? (labels[0] || null) : null;
  } catch {
    return null;
  }
}
