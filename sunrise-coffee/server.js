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
  fetchLowStockProducts,
} from './api/_shopware.js';
import { createShipmentForOrder, packlinkConfigured } from './api/_packlink.js';
import {
  sendOrderConfirmation, sendOrderShipped, sendOrderCancelled,
  sendMerchantAlert, sendReviewRequest, sendMerchantLowStock, resendConfigured,
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
  contentSecurityPolicy: false, // gestita da Vercel/nginx
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
        const cart = await getCartTotal(token);
        if (pi.amount === cart.amountInCents && pi.currency === cart.currency) {
          const order = await placeOrder(token);
          const orderId = order?.id;
          const result = await markTransactionPaid(orderId, pi.id);
          if (!result.ok) console.log('Webhook: mark paid non riuscito:', result.reason);
          // Background: Packlink + email (best-effort, non blocca la risposta)
          if (packlinkConfigured() || resendConfigured()) {
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
            }).catch(e => console.warn('Webhook background:', e.message));
          }
        }
      } catch (e) {
        // Carrello vuoto = ordine già creato dal confirm lato client (idempotente)
        console.log('Webhook: ordine già creato o carrello vuoto:', e.message);
      }
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

// ── Checkout: prepara contesto + crea PaymentIntent unico (carta/wallet/PayPal) ─
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

    // 4. PaymentIntent unico: automatic_payment_methods abilita carta + wallet +
    //    PayPal (in base a ciò che è attivo nella Dashboard Stripe).
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

    const cart = await getCartTotal(contextToken);
    if (pi.amount !== cart.amountInCents || pi.currency !== cart.currency)
      return res.status(409).json({ error: 'Importo pagato non corrisponde al carrello' });

    const order = await placeOrder(contextToken);
    const orderId = order?.id;

    // Segna la transazione come pagata (best-effort: non blocca se l'Admin API manca)
    const paid = await markTransactionPaid(orderId, pi.id);
    if (!paid.ok) console.warn('confirm: ordine creato ma non segnato pagato:', paid.reason);

    res.json({ orderNumber: order?.orderNumber || orderId || null, paid: paid.ok });

    // Background: Packlink + email — fire-and-forget, non blocca la risposta
    if (packlinkConfigured() || resendConfigured()) {
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
      }).catch(e => console.warn('confirm background:', e.message));
    }
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
// Aggrega: pagine statiche + prodotti Shopware (con SEO URL) + articoli Strapi.
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
    { path: '/blog',                  priority: '0.7', changefreq: 'weekly'  },
    { path: '/b2b',                   priority: '0.6', changefreq: 'monthly' },
    { path: '/privacy-policy',        priority: '0.3', changefreq: 'yearly'  },
    { path: '/cookie-policy',         priority: '0.3', changefreq: 'yearly'  },
    { path: '/termini-e-condizioni',  priority: '0.3', changefreq: 'yearly'  },
  ];

  // Fetch prodotti da Shopware Store API (senza contextToken — lettura pubblica)
  async function fetchShopwareProducts() {
    const SW_URL = (process.env.SHOPWARE_API_URL || '').replace(/\/$/, '');
    const SW_KEY = process.env.SHOPWARE_ACCESS_KEY || '';
    if (!SW_URL || !SW_KEY) return [];
    try {
      const res = await fetch(`${SW_URL}/product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'sw-access-key': SW_KEY },
        body: JSON.stringify({
          limit: 500,
          filter: [{ type: 'equals', field: 'active', value: true }],
          associations: { seoUrls: {} },
          includes: { product: ['id', 'updatedAt', 'createdAt', 'seoUrls', 'productNumber'] },
        }),
        signal: AbortSignal.timeout(8_000),
      });
      const data = await res.json().catch(() => ({}));
      return data?.elements || [];
    } catch (e) {
      console.warn('Sitemap: fetch prodotti Shopware fallita:', e.message);
      return [];
    }
  }

  // Fetch articoli da Strapi
  async function fetchStrapiArticles() {
    const STRAPI_URL = (process.env.STRAPI_URL || '').replace(/\/$/, '');
    const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';
    if (!STRAPI_URL) return [];
    try {
      const res = await fetch(`${STRAPI_URL}/api/articles?fields[0]=slug&fields[1]=updatedAt&pagination[pageSize]=200`, {
        headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
        signal: AbortSignal.timeout(6_000),
      });
      const data = await res.json().catch(() => ({}));
      return data?.data || [];
    } catch (e) {
      console.warn('Sitemap: fetch articoli Strapi fallita:', e.message);
      return [];
    }
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
    const [products, articles] = await Promise.all([fetchShopwareProducts(), fetchStrapiArticles()]);

    const productUrls = products.map(p => {
      // Usa la SEO URL se disponibile, altrimenti l'ID
      const seo = p.seoUrls?.find(s => s.isCanonical)?.seoPathInfo || p.seoUrls?.[0]?.seoPathInfo;
      const path = seo ? `/product/${seo.replace(/\/$/, '')}` : `/product/${p.id}`;
      const lastmod = (p.updatedAt || p.createdAt || '').split('T')[0] || now;
      return xmlUrl({ loc: `${SITE}${path}`, lastmod, changefreq: 'monthly', priority: '0.7' });
    });

    const articleUrls = articles.map(a => {
      const slug = a.attributes?.slug || a.slug;
      if (!slug) return null;
      const lastmod = (a.attributes?.updatedAt || a.updatedAt || '').split('T')[0] || now;
      return xmlUrl({ loc: `${SITE}/blog/${slug}`, lastmod, changefreq: 'weekly', priority: '0.6' });
    }).filter(Boolean);

    const staticUrls = STATIC_PAGES.map(p =>
      xmlUrl({ loc: `${SITE}${p.path}`, lastmod: now, changefreq: p.changefreq, priority: p.priority })
    );

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...staticUrls,
      ...productUrls,
      ...articleUrls,
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
