import Stripe from 'stripe';

/**
 * Vercel Serverless Function — crea un PaymentIntent Stripe.
 * Endpoint: POST /api/stripe/create-payment-intent
 *
 * Body: { amount: number (in euro), currency?: string }
 * Response: { clientSecret: string }
 */
export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY non configurata');
    return res.status(500).json({ error: 'Stripe non configurato sul server' });
  }

  const stripe = new Stripe(secretKey);

  try {
    const { amount, currency = 'eur' } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Importo non valido' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa i centesimi
      currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // evita redirect per carte 3D Secure
      },
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe PaymentIntent error:', err.message);
    return res.status(400).json({ error: err.message });
  }
}
