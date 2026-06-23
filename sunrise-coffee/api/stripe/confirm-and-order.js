import Stripe from 'stripe';
import { getCartTotal, placeOrder } from '../_shopware.js';
import { clientIp, isRateLimited } from '../_ratelimit.js';

/**
 * Vercel Serverless Function — finalizza l'ordine DOPO aver verificato il pagamento.
 * POST /api/stripe/confirm-and-order
 * Body: { paymentIntentId: string, contextToken: string }
 * Response: { orderNumber, orderId }
 *
 * 🔒 È il "cancello" che impedisce di creare ordini senza pagare:
 *    - recupera il PaymentIntent da Stripe (lato server)
 *    - verifica che sia 'succeeded'
 *    - verifica che sia legato a QUESTA sessione carrello (metadata.contextToken)
 *    - verifica che l'importo pagato == totale REALE del carrello
 *    Solo allora piazza l'ordine su Shopware.
 */
export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
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
  if (!secretKey) return res.status(500).json({ error: 'Stripe non configurato sul server' });

  const { paymentIntentId, contextToken } = req.body || {};
  if (!paymentIntentId || !contextToken) {
    return res.status(400).json({ error: 'Dati pagamento mancanti' });
  }

  const stripe = new Stripe(secretKey);

  // 1) Recupera il PaymentIntent reale da Stripe
  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (err) {
    console.error('PI retrieve error:', err.message);
    return res.status(400).json({ error: 'Pagamento non trovato' });
  }

  // 2) Deve essere effettivamente riuscito
  if (pi.status !== 'succeeded') {
    return res.status(402).json({ error: 'Pagamento non completato' });
  }

  // 3) Deve appartenere a questa sessione carrello
  if (pi.metadata?.contextToken !== contextToken) {
    console.warn('PI/context mismatch', { pi: pi.metadata?.contextToken, contextToken });
    return res.status(403).json({ error: 'Pagamento non valido per questa sessione' });
  }

  // 4) L'importo pagato deve combaciare col totale reale del carrello
  let cartInfo;
  try {
    cartInfo = await getCartTotal(contextToken);
  } catch (err) {
    console.error('Cart read error in confirm:', err.message);
    return res.status(409).json({ error: 'Carrello non più valido. Aggiorna la pagina.' });
  }

  if (pi.amount !== cartInfo.amountInCents || pi.currency !== cartInfo.currency) {
    console.warn('Amount mismatch', { paid: pi.amount, cart: cartInfo.amountInCents });
    return res.status(409).json({ error: 'Importo pagato non corrisponde al carrello. Contatta l’assistenza.' });
  }

  // 5) Tutto verificato → piazza l'ordine
  try {
    const order = await placeOrder(contextToken);
    return res.status(200).json({
      orderNumber: order?.orderNumber || order?.id || null,
      orderId: order?.id || null,
    });
  } catch (err) {
    console.error('placeOrder error:', err.message);
    // Il pagamento è andato a buon fine ma l'ordine no: va gestito manualmente.
    return res.status(500).json({
      error: 'Pagamento riuscito ma creazione ordine fallita. Ti contatteremo: nessun doppio addebito.',
    });
  }
}
