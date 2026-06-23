import Stripe from 'stripe';
import { getCartTotal, placeOrder } from '../_shopware.js';

/**
 * Vercel Serverless Function — Webhook Stripe.
 * POST /api/stripe/webhook
 *
 * 🔒 Rete di sicurezza: se il cliente paga ma chiude il browser prima che il
 *    frontend chiami /confirm-and-order, qui l'ordine viene comunque creato.
 *    La firma è verificata con STRIPE_WEBHOOK_SECRET: senza, le richieste sono rifiutate.
 *
 *  Configurazione (Stripe Dashboard → Developers → Webhooks):
 *    - URL:    https://capperificiocaro.com/api/stripe/webhook
 *    - Evento: payment_intent.succeeded
 *    - Copia il "Signing secret" (whsec_...) in STRIPE_WEBHOOK_SECRET
 */

// Stripe richiede il body GREZZO per verificare la firma → disabilita il parser
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    console.error('Stripe webhook non configurato (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET)');
    return res.status(500).json({ error: 'Webhook non configurato' });
  }

  const stripe = new Stripe(secretKey);

  let event;
  try {
    const raw = await readRawBody(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret); // verifica firma
  } catch (err) {
    console.error('Firma webhook non valida:', err.message);
    return res.status(400).json({ error: `Webhook signature error` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const contextToken = pi.metadata?.contextToken;

    if (contextToken) {
      try {
        const cartInfo = await getCartTotal(contextToken);
        // Crea l'ordine solo se importo e valuta combaciano col carrello
        if (pi.amount === cartInfo.amountInCents && pi.currency === cartInfo.currency) {
          await placeOrder(contextToken);
          console.log('Ordine creato via webhook per PI', pi.id);
        } else {
          console.warn('Webhook: importo non combacia, ordine non creato', pi.id);
        }
      } catch (err) {
        // Carrello vuoto = ordine già creato da /confirm-and-order → ok, ignora
        console.log('Webhook: ordine probabilmente già creato o carrello vuoto:', err.message);
      }
    }
  }

  // Rispondi sempre 200 agli eventi gestiti per evitare retry inutili di Stripe
  return res.status(200).json({ received: true });
}
