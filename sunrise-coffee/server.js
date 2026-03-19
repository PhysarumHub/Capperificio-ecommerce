import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env'), override: true });
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'eur' } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Importo non valido' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe vuole i centesimi
      currency,
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend pagamenti attivo su http://localhost:${PORT}`));
