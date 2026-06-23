import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env'), override: true });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';
import { getCartTotal, placeOrder } from './api/_shopware.js';
import { paypalConfigured, paypalFetch } from './api/paypal/_client.js';

// ── Validazione env vars obbligatorie ────────────────────────────────────────
const REQUIRED_ENV = ['STRIPE_SECRET_KEY', 'SHOPWARE_API_URL', 'SHOPWARE_ACCESS_KEY'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌  Variabile d'ambiente mancante: ${key}`);
    process.exit(1);
  }
}

const app = express();

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
        const cart = await getCartTotal(token);
        if (pi.amount === cart.amountInCents && pi.currency === cart.currency) await placeOrder(token);
      } catch (e) { console.log('Webhook: ordine già creato o carrello vuoto:', e.message); }
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

// ── Stripe: crea PaymentIntent con importo dal carrello reale (anti tampering) ─
app.post('/api/stripe/create-payment-intent', paymentLimiter, async (req, res) => {
  try {
    const { contextToken } = req.body || {};
    if (!contextToken) return res.status(400).json({ error: 'Sessione carrello mancante' });
    const cart = await getCartTotal(contextToken);
    if (cart.total > 5000) return res.status(400).json({ error: 'Importo superiore al massimo (€5.000)' });
    const pi = await stripe.paymentIntents.create({
      amount: cart.amountInCents,
      currency: cart.currency,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: { contextToken },
    });
    res.json({ clientSecret: pi.client_secret, amount: cart.total });
  } catch (err) {
    console.error('create-payment-intent:', err.message);
    res.status(err.status === 400 ? 400 : 502).json({ error: 'Impossibile inizializzare il pagamento' });
  }
});

// ── Stripe: verifica pagamento poi crea l'ordine ─────────────────────────────
app.post('/api/stripe/confirm-and-order', paymentLimiter, async (req, res) => {
  try {
    const { paymentIntentId, contextToken } = req.body || {};
    if (!paymentIntentId || !contextToken) return res.status(400).json({ error: 'Dati pagamento mancanti' });
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') return res.status(402).json({ error: 'Pagamento non completato' });
    if (pi.metadata?.contextToken !== contextToken) return res.status(403).json({ error: 'Pagamento non valido per questa sessione' });
    const cart = await getCartTotal(contextToken);
    if (pi.amount !== cart.amountInCents || pi.currency !== cart.currency)
      return res.status(409).json({ error: 'Importo pagato non corrisponde al carrello' });
    const order = await placeOrder(contextToken);
    res.json({ orderNumber: order?.orderNumber || order?.id || null });
  } catch (err) {
    console.error('confirm-and-order:', err.message);
    res.status(500).json({ error: 'Errore nel completamento ordine' });
  }
});

// ── PayPal: crea ordine con importo dal carrello ─────────────────────────────
app.post('/api/paypal/create-order', paymentLimiter, async (req, res) => {
  try {
    if (!paypalConfigured()) return res.status(500).json({ error: 'PayPal non configurato' });
    const { contextToken } = req.body || {};
    if (!contextToken) return res.status(400).json({ error: 'Sessione carrello mancante' });
    const cart = await getCartTotal(contextToken);
    if (cart.total > 5000) return res.status(400).json({ error: 'Importo superiore al massimo (€5.000)' });
    const order = await paypalFetch('/v2/checkout/orders', {
      method: 'POST',
      body: {
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: 'EUR', value: cart.total.toFixed(2) }, custom_id: contextToken }],
      },
    });
    res.json({ id: order.id });
  } catch (err) {
    console.error('paypal create-order:', err.message);
    res.status(502).json({ error: 'Impossibile creare l’ordine PayPal' });
  }
});

// ── PayPal: cattura + verifica + crea l'ordine ───────────────────────────────
app.post('/api/paypal/capture-order', paymentLimiter, async (req, res) => {
  try {
    if (!paypalConfigured()) return res.status(500).json({ error: 'PayPal non configurato' });
    const { orderId, contextToken } = req.body || {};
    if (!orderId || !contextToken) return res.status(400).json({ error: 'Dati pagamento mancanti' });
    const cart = await getCartTotal(contextToken);
    const capture = await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, { method: 'POST' });
    const pu = capture?.purchase_units?.[0];
    const cap = pu?.payments?.captures?.[0];
    if (capture?.status !== 'COMPLETED' || cap?.status !== 'COMPLETED')
      return res.status(402).json({ error: 'Pagamento PayPal non completato' });
    if ((pu?.custom_id || cap?.custom_id) && (pu?.custom_id || cap?.custom_id) !== contextToken)
      return res.status(403).json({ error: 'Pagamento non valido per questa sessione' });
    if (cap?.amount?.value !== cart.total.toFixed(2) || (cap?.amount?.currency_code || '').toLowerCase() !== cart.currency)
      return res.status(409).json({ error: 'Importo pagato non corrisponde al carrello' });
    const order = await placeOrder(contextToken);
    res.json({ orderNumber: order?.orderNumber || order?.id || null });
  } catch (err) {
    console.error('paypal capture-order:', err.message);
    res.status(500).json({ error: 'Errore nel completamento ordine PayPal' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Backend pagamenti attivo su http://0.0.0.0:${PORT}`));
