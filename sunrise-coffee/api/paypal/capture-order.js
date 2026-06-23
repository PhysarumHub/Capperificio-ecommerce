import { getCartTotal, placeOrder } from '../_shopware.js';
import { paypalConfigured, paypalFetch } from './_client.js';
import { clientIp, isRateLimited } from '../_ratelimit.js';

/**
 * Vercel Serverless Function — cattura il pagamento PayPal e piazza l'ordine.
 * POST /api/paypal/capture-order
 * Body: { orderId: string, contextToken: string }
 * Response: { orderNumber, orderId }
 *
 * 🔒 La cattura avviene lato server. Prima di creare l'ordine su Shopware:
 *    - verifica che la cattura sia COMPLETED
 *    - verifica che l'importo catturato == totale REALE del carrello
 *    - verifica che l'ordine PayPal sia legato a questa sessione (custom_id)
 */
export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (isRateLimited(clientIp(req))) {
    return res.status(429).json({ error: 'Troppe richieste. Riprova tra poco.' });
  }
  if (!paypalConfigured()) {
    return res.status(500).json({ error: 'PayPal non configurato sul server' });
  }

  const { orderId, contextToken } = req.body || {};
  if (!orderId || !contextToken) return res.status(400).json({ error: 'Dati pagamento mancanti' });

  // Totale reale del carrello PRIMA della cattura
  let cartInfo;
  try {
    cartInfo = await getCartTotal(contextToken);
  } catch {
    return res.status(409).json({ error: 'Carrello non più valido. Aggiorna la pagina.' });
  }

  // 1) Cattura il pagamento su PayPal
  let capture;
  try {
    capture = await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, { method: 'POST' });
  } catch (err) {
    console.error('PayPal capture error:', err.message);
    return res.status(402).json({ error: 'Cattura pagamento PayPal fallita' });
  }

  // 2) Verifica esito + importo + binding sessione
  const pu = capture?.purchase_units?.[0];
  const cap = pu?.payments?.captures?.[0];
  const paidValue = cap?.amount?.value;
  const paidCurrency = (cap?.amount?.currency_code || '').toLowerCase();
  const customId = pu?.custom_id || cap?.custom_id;

  if (capture?.status !== 'COMPLETED' || cap?.status !== 'COMPLETED') {
    return res.status(402).json({ error: 'Pagamento PayPal non completato' });
  }
  if (customId && customId !== contextToken) {
    return res.status(403).json({ error: 'Pagamento non valido per questa sessione' });
  }
  if (paidValue !== cartInfo.total.toFixed(2) || paidCurrency !== cartInfo.currency) {
    console.warn('PayPal amount mismatch', { paidValue, expected: cartInfo.total.toFixed(2) });
    return res.status(409).json({ error: 'Importo pagato non corrisponde al carrello. Contatta l’assistenza.' });
  }

  // 3) Tutto verificato → piazza l'ordine
  try {
    const order = await placeOrder(contextToken);
    return res.status(200).json({
      orderNumber: order?.orderNumber || order?.id || null,
      orderId: order?.id || null,
    });
  } catch (err) {
    console.error('placeOrder error (paypal):', err.message);
    return res.status(500).json({
      error: 'Pagamento riuscito ma creazione ordine fallita. Ti contatteremo: nessun doppio addebito.',
    });
  }
}
