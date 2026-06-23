import Stripe from 'stripe';
import { getCartTotal } from '../_shopware.js';
import { clientIp, isRateLimited } from '../_ratelimit.js';

/**
 * Vercel Serverless Function — crea un PaymentIntent Stripe.
 * POST /api/stripe/create-payment-intent
 * Body: { contextToken: string }   ← token sessione Shopware del cliente
 * Response: { clientSecret, amount }
 *
 * 🔒 L'importo NON arriva più dal client: viene letto dal carrello reale su
 *    Shopware lato server. Così è impossibile manipolare il prezzo (price tampering).
 */
export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isRateLimited(clientIp(req))) {
    return res.status(429).json({ error: 'Troppe richieste. Riprova tra poco.' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY non configurata');
    return res.status(500).json({ error: 'Stripe non configurato sul server' });
  }

  const { contextToken } = req.body || {};
  if (!contextToken || typeof contextToken !== 'string') {
    return res.status(400).json({ error: 'Sessione carrello mancante' });
  }

  let cartInfo;
  try {
    cartInfo = await getCartTotal(contextToken); // legge il totale REALE dal server
  } catch (err) {
    console.error('Errore lettura carrello:', err.message);
    return res.status(err.status === 400 ? 400 : 502).json({
      error: err.status === 400 ? 'Carrello vuoto o non valido' : 'Impossibile leggere il carrello',
    });
  }

  // Cap di sicurezza (anti-errore, non sostituisce la verifica del carrello)
  if (cartInfo.total > 5000) {
    return res.status(400).json({ error: 'Importo superiore al massimo consentito (€5.000)' });
  }

  const stripe = new Stripe(secretKey);
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: cartInfo.amountInCents,          // ← dal carrello, non dal client
      currency: cartInfo.currency,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: { contextToken },              // lega il pagamento alla sessione carrello
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: cartInfo.total,
    });
  } catch (err) {
    console.error('Stripe PaymentIntent error:', err.message);
    return res.status(400).json({ error: 'Impossibile inizializzare il pagamento' });
  }
}
