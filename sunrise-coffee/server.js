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

// ── Validazione env vars obbligatorie ────────────────────────────────────────
const REQUIRED_ENV = ['STRIPE_SECRET_KEY'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌  Variabile d'ambiente mancante: ${key}`);
    process.exit(1);
  }
}

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // permette font/immagini esterni
  contentSecurityPolicy: false,                          // gestita da Vercel/nginx
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── Rate limiting — max 20 tentativi ogni 15 minuti per IP ───────────────────
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppe richieste. Riprova tra poco.' },
  skip: (req) => process.env.NODE_ENV !== 'production', // disabilitato in dev
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ── Endpoint pagamento ───────────────────────────────────────────────────────
app.post('/api/stripe/create-payment-intent', paymentLimiter, async (req, res) => {
  try {
    const { amount, currency = 'eur' } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Importo non valido' });
    }
    if (amount > 5000) {
      return res.status(400).json({ error: 'Importo superiore al massimo consentito (€5.000)' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe vuole i centesimi
      currency,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Backend pagamenti attivo su http://0.0.0.0:${PORT}`));
