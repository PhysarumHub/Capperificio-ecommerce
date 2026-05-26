import Stripe from 'stripe';

// Semplice rate limiter in-memory per serverless (reset ad ogni cold start)
// Per rate limiting persistente usare Upstash Redis
const ipTimestamps = new Map();
const WINDOW_MS  = 15 * 60 * 1000; // 15 minuti
const MAX_CALLS  = 20;

function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const calls = (ipTimestamps.get(ip) || []).filter((t) => t > windowStart);
  calls.push(now);
  ipTimestamps.set(ip, calls);
  return calls.length > MAX_CALLS;
}

/**
 * Vercel Serverless Function — crea un PaymentIntent Stripe.
 * POST /api/stripe/create-payment-intent
 * Body: { amount: number (euro), currency?: string }
 * Response: { clientSecret: string }
 */
export default async function handler(req, res) {
  // ── Security headers ────────────────────────────────────────────────────────
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // ── CORS preflight ──────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Rate limiting ────────────────────────────────────────────────────────────
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Troppe richieste. Riprova tra poco.' });
  }

  // ── Env var check ────────────────────────────────────────────────────────────
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY non configurata');
    return res.status(500).json({ error: 'Stripe non configurato sul server' });
  }

  // ── Validazione input ────────────────────────────────────────────────────────
  const { amount, currency = 'eur' } = req.body || {};

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Importo non valido' });
  }
  if (amount > 5000) {
    return res.status(400).json({ error: 'Importo superiore al massimo consentito (€5.000)' });
  }
  if (!['eur', 'usd', 'gbp'].includes(currency)) {
    return res.status(400).json({ error: 'Valuta non supportata' });
  }

  // ── Crea PaymentIntent ───────────────────────────────────────────────────────
  const stripe = new Stripe(secretKey);
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa i centesimi
      currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe PaymentIntent error:', err.message);
    return res.status(400).json({ error: err.message });
  }
}
