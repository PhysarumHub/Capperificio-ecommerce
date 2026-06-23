import { getCartTotal } from '../_shopware.js';
import { paypalConfigured, paypalFetch } from './_client.js';
import { clientIp, isRateLimited } from '../_ratelimit.js';

/**
 * Vercel Serverless Function — crea un ordine PayPal con importo dal SERVER.
 * POST /api/paypal/create-order
 * Body: { contextToken: string }
 * Response: { id }   ← PayPal order id, passato a PayPalButtons.onApprove
 *
 * 🔒 L'importo è calcolato dal carrello reale, non dal client.
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

  const { contextToken } = req.body || {};
  if (!contextToken) return res.status(400).json({ error: 'Sessione carrello mancante' });

  let cartInfo;
  try {
    cartInfo = await getCartTotal(contextToken);
  } catch (err) {
    return res.status(err.status === 400 ? 400 : 502).json({ error: 'Carrello non valido' });
  }
  if (cartInfo.total > 5000) {
    return res.status(400).json({ error: 'Importo superiore al massimo consentito (€5.000)' });
  }

  try {
    const order = await paypalFetch('/v2/checkout/orders', {
      method: 'POST',
      body: {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'EUR',
            value: cartInfo.total.toFixed(2), // ← dal carrello server
          },
          custom_id: contextToken,            // lega l'ordine PayPal alla sessione
        }],
      },
    });
    return res.status(200).json({ id: order.id });
  } catch (err) {
    console.error('PayPal create-order error:', err.message);
    return res.status(502).json({ error: 'Impossibile creare l’ordine PayPal' });
  }
}
