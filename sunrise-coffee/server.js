import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env'), override: true });

// ── Stato poller persistito su disco ─────────────────────────────────────────
const POLLER_STATE_FILE = join(__dirname, '.poller-state.json');

function loadPollerState() {
  try {
    const raw = readFileSync(POLLER_STATE_FILE, 'utf8');
    const { shipped = [], cancelled = [] } = JSON.parse(raw);
    return { shipped: new Set(shipped), cancelled: new Set(cancelled) };
  } catch {
    return { shipped: new Set(), cancelled: new Set() };
  }
}

function savePollerState(shipped, cancelled) {
  try {
    writeFileSync(POLLER_STATE_FILE, JSON.stringify({
      shipped: [...shipped],
      cancelled: [...cancelled],
      savedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('Poller: impossibile salvare lo stato su disco:', e.message);
  }
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';
import {
  getCartTotal, placeOrder, registerGuestIfNeeded,
  setShippingMethod, markTransactionPaid, adminConfigured,
  fetchOrderDetails, savePacklinkReference,
  fetchOrdersInDeliveryState, fetchOrdersInOrderState,
  fetchLowStockProducts, findOrderByPaymentIntentId, markTransactionRefunded,
  swFetch,
} from './api/_shopware.js';
import { createShipmentForOrder, packlinkConfigured } from './api/_packlink.js';
import {
  sendOrderConfirmation, sendOrderShipped, sendOrderCancelled,
  sendMerchantAlert, sendReviewRequest, sendMerchantLowStock, sendRefundIssued, resendConfigured,
} from './api/_resend.js';

// ── Validazione env vars obbligatorie ────────────────────────────────────────
const REQUIRED_ENV = ['STRIPE_SECRET_KEY', 'SHOPWARE_API_URL', 'SHOPWARE_ACCESS_KEY'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌  Variabile d'ambiente mancante: ${key}`);
    process.exit(1);
  }
}

const app = express();

// Trust nginx reverse proxy — required for express-rate-limit to read the real client IP
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // gestita interamente da nginx (vedi nginx.conf)
}));

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));

// ── Webhook Stripe: richiede il body GREZZO → registrato PRIMA di express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(500).json({ error: 'Webhook non configurato' });
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], webhookSecret);
  } catch (err) {
    console.error('Firma webhook non valida:', err.message);
    return res.status(400).json({ error: 'Webhook signature error' });
  }
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const token = pi.metadata?.contextToken;
    if (token) {
      try {
        // Backup di fulfillment: se il client non ha completato il confirm
        // (es. ha chiuso il browser), l'ordine viene creato comunque qui.
        // Sotto lock: se /api/checkout/confirm sta già creando l'ordine per
        // questo stesso carrello, qui si attende e si trova il carrello vuoto.
        await withOrderLock(token, async () => {
          const cart = await getCartTotal(token);
          if (pi.amount === cart.amountInCents && pi.currency === cart.currency) {
            const order = await placeOrder(token);
            const orderId = order?.id;
            const result = await markTransactionPaid(orderId, pi.id);
            if (!result.ok) console.log('Webhook: mark paid non riuscito:', result.reason);
            // Background: Packlink + email (best-effort, non blocca la risposta)
            fulfillOrderInBackground(orderId, { label: 'Webhook' });
          }
        });
      } catch (e) {
        // Carrello vuoto = ordine già creato dal confirm lato client (idempotente)
        console.log('Webhook: ordine già creato o carrello vuoto:', e.message);
      }
    }
  } else if (event.type === 'charge.refunded') {
    // Rete di sicurezza per i rimborsi fatti direttamente dalla Dashboard Stripe
    // (bypassano /api/admin/refund): aggiorna comunque lo stato su Shopware e
    // invia l'email. markTransactionRefunded è idempotente, quindi è sicuro anche
    // se il rimborso è già stato gestito da /api/admin/refund.
    const charge = event.data.object;
    const paymentIntentId = charge.payment_intent;
    try {
      const order = await findOrderByPaymentIntentId(paymentIntentId);
      if (!order) {
        console.log('Webhook charge.refunded: nessun ordine trovato per PI', paymentIntentId);
      } else {
        const partial = !charge.refunded;
        const refundId = charge.refunds?.data?.[0]?.id;
        const result = await markTransactionRefunded(order.id, refundId, { partial });
        if (!result.ok) console.log('Webhook: mark refunded non riuscito:', result.reason);
        else if (result.reason !== 'già rimborsato (idempotente)' && resendConfigured()) {
          await sendRefundIssued(order, charge.amount_refunded / 100);
        }
      }
    } catch (e) {
      console.warn('Webhook charge.refunded:', e.message);
    }
  }
  res.status(200).json({ received: true });
});

app.use(express.json());

// ── Rate limiting — max 20 richieste / 15 min per IP ─────────────────────────
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppe richieste. Riprova tra poco.' },
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const MAX_ORDER_TOTAL = 5000; // tetto di sicurezza anti-frode (€)
const STRIPE_MIN_CENTS = 50;  // importo minimo accettato da Stripe in EUR (0,50 €)

// ── Lock per context token ───────────────────────────────────────────────────
// Il webhook Stripe e /api/checkout/confirm possono arrivare in parallelo per lo
// stesso pagamento: senza serializzazione entrambi leggerebbero un carrello
// ancora pieno e creerebbero DUE ordini a fronte di un solo incasso.
// Accodandoli sullo stesso contextToken, il secondo trova il carrello già
// svuotato e cade nel ramo idempotente ("ordine già creato").
// Un lock in-process basta: il backend Express gira in un unico container.
const orderLocks = new Map();

function withOrderLock(token, fn) {
  const previous = orderLocks.get(token) || Promise.resolve();
  // .catch() sulla catena precedente: un errore a monte non deve impedire
  // l'esecuzione delle richieste accodate dopo.
  const current = previous.catch(() => {}).then(fn);
  orderLocks.set(token, current);
  // Rimuove la voce solo se nel frattempo non si è accodata un'altra richiesta.
  current.catch(() => {}).then(() => {
    if (orderLocks.get(token) === current) orderLocks.delete(token);
  });
  return current;
}

/**
 * Post-ordine: spedizione Packlink + email di conferma.
 * Fire-and-forget — non deve mai bloccare (né far fallire) la risposta HTTP.
 */
function fulfillOrderInBackground(orderId, { label = 'order' } = {}) {
  if (!orderId || (!packlinkConfigured() && !resendConfigured())) return;
  fetchOrderDetails(orderId).then(async (fullOrder) => {
    if (!fullOrder) return;
    let packlinkRef = null;
    if (packlinkConfigured()) {
      packlinkRef = await createShipmentForOrder(fullOrder);
      if (packlinkRef) await savePacklinkReference(orderId, packlinkRef);
    }
    if (resendConfigured()) {
      await Promise.all([
        sendOrderConfirmation(fullOrder),
        sendMerchantAlert(fullOrder, packlinkRef),
      ]);
    }
  }).catch(e => console.warn(`${label} background:`, e.message));
}

// ── Checkout: prepara contesto + crea PaymentIntent unico (carta/wallet) ──────
// Il server registra il guest, imposta la spedizione, legge il totale REALE dal
// carrello e crea il PaymentIntent. Ritorna il context token autoritativo: niente
// più gestione del token lato client (elimina le race condition).
app.post('/api/checkout/create-intent', paymentLimiter, async (req, res) => {
  try {
    const { contextToken, customer, billingAddress, shippingMethodId } = req.body || {};
    if (!contextToken) return res.status(400).json({ error: 'Sessione carrello mancante' });

    // 1. Registra guest (se serve) → il carrello migra sul nuovo token
    let token = await registerGuestIfNeeded(contextToken, {
      email: customer?.email,
      customer,
      billingAddress,
    });

    // 2. Imposta la spedizione scelta (Shopware ricalcola eventuale costo/gratuità)
    token = await setShippingMethod(token, shippingMethodId);

    // 3. Totale reale del carrello (mai dal client)
    const cart = await getCartTotal(token);
    if (cart.total > MAX_ORDER_TOTAL)
      return res.status(400).json({ error: `Importo superiore al massimo (€${MAX_ORDER_TOTAL})` });

    // 3b. Totale 0 (es. codice sconto 100%): Stripe non accetta pagamenti da 0 €.
    //     Nessun PaymentIntent: il client conferma via /api/checkout/confirm-free,
    //     che ri-verifica il totale prima di creare l'ordine.
    if (cart.amountInCents === 0)
      return res.json({ free: true, contextToken: token, amount: 0 });

    // 3c. Importo sotto il minimo Stripe ma > 0: non è pagabile online.
    if (cart.amountInCents < STRIPE_MIN_CENTS)
      return res.status(400).json({ error: 'Importo troppo basso per il pagamento online (minimo 0,50 €).' });

    // 4. PaymentIntent unico: automatic_payment_methods abilita carta + wallet +
    //    e gli altri metodi attivi nella Dashboard Stripe.
    //    Idempotency key legata al token+importo per evitare doppioni alle riprove.
    const pi = await stripe.paymentIntents.create(
      {
        amount: cart.amountInCents,
        currency: cart.currency,
        automatic_payment_methods: { enabled: true },
        metadata: { contextToken: token },
      },
      { idempotencyKey: `pi_${token}_${cart.amountInCents}` }
    );

    res.json({ clientSecret: pi.client_secret, contextToken: token, amount: cart.total });
  } catch (err) {
    console.error('create-intent:', err.message);
    res.status(err.status === 400 ? 400 : 502).json({ error: 'Impossibile inizializzare il pagamento' });
  }
});

// ── Checkout: verifica il pagamento, crea l'ordine e lo segna pagato ──────────
app.post('/api/checkout/confirm', paymentLimiter, async (req, res) => {
  try {
    const { paymentIntentId, contextToken } = req.body || {};
    if (!paymentIntentId || !contextToken) return res.status(400).json({ error: 'Dati pagamento mancanti' });

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') return res.status(402).json({ error: 'Pagamento non completato' });
    if (pi.metadata?.contextToken !== contextToken)
      return res.status(403).json({ error: 'Pagamento non valido per questa sessione' });

    // Sotto lock: serializza con il webhook Stripe, che può creare lo stesso
    // ordine in parallelo (vedi withOrderLock).
    const result = await withOrderLock(contextToken, async () => {
      const cart = await getCartTotal(contextToken);
      if (pi.amount !== cart.amountInCents || pi.currency !== cart.currency)
        return { mismatch: true };

      const order = await placeOrder(contextToken);
      const orderId = order?.id;

      // Segna la transazione come pagata (best-effort: non blocca se l'Admin API manca)
      const paid = await markTransactionPaid(orderId, pi.id);
      if (!paid.ok) console.warn('confirm: ordine creato ma non segnato pagato:', paid.reason);

      return { order, orderId, paid };
    });

    if (result.mismatch)
      return res.status(409).json({ error: 'Importo pagato non corrisponde al carrello' });

    const { order, orderId, paid } = result;
    res.json({ orderNumber: order?.orderNumber || orderId || null, paid: paid.ok });

    // Background: Packlink + email — fire-and-forget, non blocca la risposta
    fulfillOrderInBackground(orderId, { label: 'confirm' });
  } catch (err) {
    // Se il carrello è vuoto qui, l'ordine è già stato creato (es. dal webhook):
    // trattiamo come idempotente per non mostrare un errore all'utente.
    if (err.status === 400) {
      console.log('confirm: carrello già svuotato (ordine probabilmente già creato)');
      return res.status(409).json({ error: 'Ordine già elaborato' });
    }
    console.error('confirm:', err.message);
    res.status(500).json({ error: 'Errore nel completamento ordine' });
  }
});

// ── Checkout: ordine a totale 0,00 € (es. codice sconto 100%) ────────────────
// Non c'è nessun pagamento da verificare, quindi l'unica difesa è ricalcolare il
// totale lato server: se non è esattamente 0, la richiesta viene rifiutata.
app.post('/api/checkout/confirm-free', paymentLimiter, async (req, res) => {
  try {
    const { contextToken } = req.body || {};
    if (!contextToken) return res.status(400).json({ error: 'Sessione carrello mancante' });

    // Stesso lock degli altri percorsi di creazione ordine: due submit ravvicinati
    // dello stesso carrello gratuito non devono generare due ordini.
    const result = await withOrderLock(contextToken, async () => {
      const cart = await getCartTotal(contextToken);
      if (cart.amountInCents !== 0) return { notFree: true };

      const order = await placeOrder(contextToken);
      const orderId = order?.id;

      // Nessun PaymentIntent da tracciare: la transazione è comunque "paid" (0 €)
      const paid = await markTransactionPaid(orderId, null);
      if (!paid.ok) console.warn('confirm-free: ordine creato ma non segnato pagato:', paid.reason);

      return { order, orderId, paid };
    });

    if (result.notFree)
      return res.status(409).json({ error: 'Il totale del carrello non è 0: completa il pagamento.' });

    const { order, orderId, paid } = result;
    res.json({ orderNumber: order?.orderNumber || orderId || null, paid: paid.ok });

    fulfillOrderInBackground(orderId, { label: 'confirm-free' });
  } catch (err) {
    if (err.status === 400) {
      console.log('confirm-free: carrello vuoto (ordine probabilmente già creato)');
      return res.status(409).json({ error: 'Ordine già elaborato' });
    }
    console.error('confirm-free:', err.message);
    res.status(500).json({ error: 'Errore nel completamento ordine' });
  }
});

// ── Admin: rimborso Stripe ────────────────────────────────────────────────────
// Protetto da un secret condiviso (nessun pannello admin/login in questo backend).
// ⚠ /api non è ristretto a 127.0.0.1 in nginx (a differenza di Shopware/Strapi
// admin): questo endpoint è raggiungibile da internet, protetto solo dall'header.
// v1: rimborso TOTALE soltanto (no importo parziale).
function requireAdminKey(req, res, next) {
  const configured = process.env.ADMIN_API_KEY;
  if (!configured) return res.status(503).json({ error: 'Rimborsi non configurati' });
  if (req.headers['x-admin-key'] !== configured) return res.status(401).json({ error: 'Non autorizzato' });
  next();
}

app.post('/api/admin/refund', paymentLimiter, requireAdminKey, async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId mancante' });

    const order = await fetchOrderDetails(orderId);
    const paymentIntentId = order?.customFields?.stripe_payment_intent_id;
    if (!paymentIntentId)
      return res.status(404).json({ error: 'Nessun pagamento Stripe associato a questo ordine' });

    // Stripe prima (azione reale/irreversibile), Shopware dopo: se lo step
    // Shopware fallisce il cliente ha comunque ricevuto il rimborso — recuperabile
    // manualmente. Il contrario (Shopware "refunded" ma soldi mai tornati) sarebbe peggio.
    const refund = await stripe.refunds.create(
      { payment_intent: paymentIntentId },
      { idempotencyKey: `refund_${orderId}_full` }
    );

    const result = await markTransactionRefunded(orderId, refund.id);
    if (!result.ok) console.warn('refund: rimborso Stripe ok ma Shopware non aggiornato:', result.reason);

    if (resendConfigured()) {
      sendRefundIssued(order, refund.amount / 100).catch(e => console.warn('refund: email fallita:', e.message));
    }

    res.json({ refundId: refund.id, amount: refund.amount / 100, status: refund.status, shopwareUpdated: result.ok });
  } catch (err) {
    console.error('refund:', err.message);
    res.status(err.status === 400 ? 400 : 502).json({ error: 'Impossibile elaborare il rimborso' });
  }
});

// ── Newsletter: iscrizione + conferma double opt-in ───────────────────────────
// Il form in Newsletter.jsx chiama /subscribe; Shopware invia una email con un
// link a {SITE_URL}/newsletter-subscribe?em=...&hash=... (o iscrive subito, in
// base alla configurazione "double opt-in" del sales channel). NewsletterConfirmPage
// legge quei parametri e chiama /confirm per completare l'iscrizione.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/newsletter/subscribe', paymentLimiter, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Email non valida' });

    await swFetch('/newsletter/subscribe', {
      method: 'POST',
      body: {
        email,
        option: 'subscribe',
        storefrontUrl: process.env.FRONTEND_URL || process.env.SITE_URL || 'https://www.capperificiocaro.com',
      },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('newsletter/subscribe:', err.message);
    res.status(err.status === 400 ? 400 : 502).json({ error: 'Iscrizione non riuscita. Riprova più tardi.' });
  }
});

app.post('/api/newsletter/confirm', async (req, res) => {
  try {
    const { em, hash } = req.body || {};
    if (!em || !hash) return res.status(400).json({ error: 'Link di conferma non valido' });
    await swFetch('/newsletter/confirm', { method: 'POST', body: { em, hash } });
    res.json({ ok: true });
  } catch (err) {
    console.error('newsletter/confirm:', err.message);
    res.status(err.status === 400 ? 400 : 502).json({ error: 'Conferma non riuscita: il link potrebbe essere scaduto o già usato.' });
  }
});

// ── Strapi proxy: GET /api/strapi/* → Strapi CMS ─────────────────────────────
const STRAPI_ALLOWED = [/^articles(\/|\?|$)/, /^articles$/];
app.get('/api/strapi/*path', async (req, res) => {
  const STRAPI_URL = (process.env.STRAPI_URL || '').replace(/\/$/, '');
  const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';
  if (!STRAPI_URL) return res.status(500).json({ error: 'Strapi non configurato' });
  const subPath = (Array.isArray(req.params.path) ? req.params.path.join('/') : req.params.path) || '';
  if (!STRAPI_ALLOWED.some(re => re.test(subPath)))
    return res.status(403).json({ error: 'Risorsa non consentita' });
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const target = `${STRAPI_URL}/api/${subPath}${qs}`;
  try {
    const r = await fetch(target, {
      headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
      signal: AbortSignal.timeout(8_000),
    });
    const text = await r.text();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
    return res.status(r.status).send(text);
  } catch (err) {
    console.error('Strapi proxy error:', err.message);
    return res.status(502).json({ error: 'Strapi non raggiungibile' });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: Math.floor(process.uptime()) });
});

// ── Sitemap XML dinamica ──────────────────────────────────────────────────────
// Aggrega: pagine statiche + prodotti Shopware (con SEO URL).
// Cacheable da nginx (1h) e da CDN (2h).
app.get('/sitemap.xml', async (_req, res) => {
  const SITE = 'https://www.capperificiocaro.com';
  const now  = new Date().toISOString().split('T')[0];

  const STATIC_PAGES = [
    { path: '/',                      priority: '1.0', changefreq: 'weekly'  },
    { path: '/collections/all',       priority: '0.9', changefreq: 'weekly'  },
    { path: '/storia',                priority: '0.7', changefreq: 'monthly' },
    { path: '/territorio',            priority: '0.6', changefreq: 'monthly' },
    { path: '/processo-produttivo',   priority: '0.6', changefreq: 'monthly' },
    { path: '/b2b',                   priority: '0.6', changefreq: 'monthly' },
    { path: '/contatti',              priority: '0.5', changefreq: 'yearly'  },
    { path: '/faq',                   priority: '0.5', changefreq: 'monthly' },
    { path: '/privacy-policy',        priority: '0.3', changefreq: 'yearly'  },
    { path: '/cookie-policy',         priority: '0.3', changefreq: 'yearly'  },
    { path: '/termini-e-condizioni',  priority: '0.3', changefreq: 'yearly'  },
  ];

  // Fetch prodotti da Shopware Store API (senza contextToken — lettura pubblica)
  // La Store API rifiuta limit > 100 (MAX_LIMIT): una singola richiesta da 500
  // tornava 400 e, poiché il corpo dell'errore non ha `elements`, la sitemap
  // finiva senza NESSUN prodotto senza che venisse loggato nulla. Qui si pagina
  // a 100 e si controlla esplicitamente lo stato della risposta.
  const SW_PAGE_SIZE = 100;
  const SW_MAX_PAGES = 50; // tetto di sicurezza: 5.000 prodotti

  async function fetchShopwareProducts() {
    const SW_URL = (process.env.SHOPWARE_API_URL || '').replace(/\/$/, '');
    const SW_KEY = process.env.SHOPWARE_ACCESS_KEY || '';
    if (!SW_URL || !SW_KEY) {
      console.warn('Sitemap: SHOPWARE_API_URL o SHOPWARE_ACCESS_KEY mancanti, nessun prodotto in sitemap');
      return [];
    }

    const all = [];
    for (let page = 1; page <= SW_MAX_PAGES; page++) {
      try {
        const resp = await fetch(`${SW_URL}/product`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'sw-access-key': SW_KEY },
          body: JSON.stringify({
            limit: SW_PAGE_SIZE,
            page,
            filter: [{ type: 'equals', field: 'active', value: true }],
            associations: { seoUrls: {} },
            includes: { product: ['id', 'updatedAt', 'createdAt', 'seoUrls', 'productNumber'] },
          }),
          signal: AbortSignal.timeout(8_000),
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          console.warn(`Sitemap: Store API ha risposto ${resp.status} a pagina ${page}:`,
            data?.errors?.[0]?.detail || '(nessun dettaglio)');
          break;
        }

        const batch = data?.elements || [];
        all.push(...batch);
        if (batch.length < SW_PAGE_SIZE) break; // ultima pagina
      } catch (e) {
        console.warn(`Sitemap: fetch prodotti pagina ${page} fallita:`, e.message);
        break;
      }
    }
    return all;
  }

  function xmlUrl({ loc, lastmod, changefreq, priority }) {
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      lastmod   ? `    <lastmod>${lastmod}</lastmod>`       : '',
      changefreq ? `    <changefreq>${changefreq}</changefreq>` : '',
      priority   ? `    <priority>${priority}</priority>`   : '',
      '  </url>',
    ].filter(Boolean).join('\n');
  }

  try {
    const products = await fetchShopwareProducts();

    const productUrls = products.map(p => {
      // Usa la SEO URL se disponibile, altrimenti l'ID
      const seo = p.seoUrls?.find(s => s.isCanonical)?.seoPathInfo || p.seoUrls?.[0]?.seoPathInfo;
      const path = seo ? `/product/${seo.replace(/\/$/, '')}` : `/product/${p.id}`;
      const lastmod = (p.updatedAt || p.createdAt || '').split('T')[0] || now;
      return xmlUrl({ loc: `${SITE}${path}`, lastmod, changefreq: 'monthly', priority: '0.7' });
    });

    const staticUrls = STATIC_PAGES.map(p =>
      xmlUrl({ loc: `${SITE}${p.path}`, lastmod: now, changefreq: p.changefreq, priority: p.priority })
    );

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...staticUrls,
      ...productUrls,
      '</urlset>',
    ].join('\n');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (e) {
    console.error('Sitemap: errore generazione:', e.message);
    res.status(500).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>');
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend pagamenti attivo su http://0.0.0.0:${PORT}`);
  if (!adminConfigured()) {
    console.warn('⚠  Admin API Shopware non configurata: gli ordini verranno creati ma NON segnati "pagati". ' +
      'Imposta SHOPWARE_ADMIN_API_URL + SHOPWARE_ADMIN_CLIENT_ID/SECRET (o ADMIN_USERNAME/PASSWORD).');
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('⚠  STRIPE_WEBHOOK_SECRET non configurato: il webhook Stripe (rete di sicurezza per i checkout ' +
      'interrotti, es. cliente che chiude il browser dopo aver pagato) risponderà 500 a ogni chiamata.');
  }
  if (!process.env.ADMIN_API_KEY) {
    console.warn('⚠  ADMIN_API_KEY non configurata: l\'endpoint di rimborso POST /api/admin/refund è disabilitato.');
  }
  if (resendConfigured() && adminConfigured()) startOrderPoller();
});

// ── Polling stati ordine → email automatiche ─────────────────────────────────
//
//  Ogni 2 minuti controlla su Shopware se ci sono ordini che hanno cambiato
//  stato (shipped / cancelled) e invia l'email corrispondente.
//
//  Per evitare duplicati usa due Set in memoria, inizializzati al boot con gli
//  ordini già in quello stato (così non si inviano email retroattive per ordini
//  esistenti prima del deploy).

function extractTracking(order) {
  const delivery = order.deliveries?.[0];
  const codes = delivery?.trackingCodes || [];
  return codes.length
    ? { number: codes[0], carrier: delivery?.shippingMethod?.name || '', url: null }
    : {};
}

async function startOrderPoller() {
  // Carica stato persistito da disco (sopravvive ai riavvii del processo).
  const { shipped: sentShipped, cancelled: sentCancelled } = loadPollerState();

  console.log('Order poller: inizializzazione...');
  try {
    const [alreadyShipped, alreadyCancelled] = await Promise.all([
      fetchOrdersInDeliveryState('shipped'),
      fetchOrdersInOrderState('cancelled'),
    ]);
    alreadyShipped.forEach(o => sentShipped.add(o.id));
    alreadyCancelled.forEach(o => sentCancelled.add(o.id));
    console.log(`Order poller: seed ${sentShipped.size} shipped, ${sentCancelled.size} cancelled — pronto.`);
  } catch (e) {
    console.warn('Order poller: seed fallito (continuo comunque):', e.message);
  }

  async function poll() {
    try {
      // ── Ordini spediti
      const shipped = await fetchOrdersInDeliveryState('shipped');
      let dirty = false;
      for (const order of shipped) {
        if (sentShipped.has(order.id)) continue;
        sentShipped.add(order.id);
        dirty = true;
        await sendOrderShipped(order, extractTracking(order));
      }

      // ── Ordini cancellati
      const cancelled = await fetchOrdersInOrderState('cancelled');
      for (const order of cancelled) {
        if (sentCancelled.has(order.id)) continue;
        sentCancelled.add(order.id);
        dirty = true;
        await sendOrderCancelled(order);
      }

      if (dirty) savePollerState(sentShipped, sentCancelled);

      // ── Review request — 10 giorni dopo la spedizione ─────────
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const threeDaysAgo = new Date(Date.now() - 10.3 * 24 * 60 * 60 * 1000).toISOString();
      for (const order of shipped) {
        const shippedAt = order.deliveries?.[0]?.updatedAt;
        if (!shippedAt) continue;
        const isInWindow = shippedAt >= threeDaysAgo && shippedAt <= tenDaysAgo;
        if (!isInWindow) continue;
        const reviewKey = `review_${order.id}`;
        if (sentShipped.has(reviewKey)) continue;
        sentShipped.add(reviewKey);
        await sendReviewRequest(order);
        savePollerState(sentShipped, sentCancelled);
      }

      // ── Low stock alert — ogni ora (throttle via Set) ──────────
      const LOW_STOCK_KEY = `lowstock_${new Date().toISOString().slice(0, 13)}`; // hourly bucket
      if (!sentCancelled.has(LOW_STOCK_KEY)) {
        sentCancelled.add(LOW_STOCK_KEY);
        const lowStock = await fetchLowStockProducts(5);
        for (const p of lowStock) {
          await sendMerchantLowStock({
            name: p.name,
            sku: p.productNumber,
            stock: p.availableStock,
            threshold: 5,
          });
        }
        if (lowStock.length > 0) savePollerState(sentShipped, sentCancelled);
      }
    } catch (e) {
      console.warn('Order poller: errore nel ciclo:', e.message);
    }
  }

  // Prima poll dopo 60s (Shopware potrebbe non essere ancora pronto al boot),
  // poi ogni 2 minuti.
  setTimeout(() => {
    poll();
    setInterval(poll, 2 * 60 * 1000);
  }, 60_000);

  console.log('Order poller: attivo (poll ogni 2 min).');
}
