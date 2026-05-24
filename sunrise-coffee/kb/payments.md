# Pagamenti — Stripe e PayPal

## Architettura

```
Browser → POST /api/stripe/create-payment-intent → server.js (Express)
                                                  → Stripe API (server-side, secret key)
                                                  ← { clientSecret }
Browser → Stripe.js (Elements) → conferma pagamento client-side
```

Il backend Express (`server.js`) gira su porta 3001.
In dev: `npm run dev` avvia sia Vite (5173) che Express (3001) in parallelo via `concurrently`.
In produzione: Express è servito dallo stesso container Docker del frontend.

## Express Backend (`server.js`)

**Unico endpoint:**
```
POST /api/stripe/create-payment-intent
Body: { amount: number, currency?: string }  // amount in EUR (non centesimi)
Response: { clientSecret: string }
```

Il server converte in centesimi: `Math.round(amount * 100)`.
`automatic_payment_methods: { enabled: true, allow_redirects: 'never' }` — metodi automatici senza redirect.

## Env vars pagamenti

```env
STRIPE_SECRET_KEY=sk_live_...         # lato server (non VITE_)
VITE_STRIPE_PUBLIC_KEY=pk_live_...    # lato client (embedded nel bundle)
VITE_PAYPAL_CLIENT_ID=...             # lato client
```

## Componente Stripe (`src/components/checkout/StripePaymentForm.jsx`)

Usa `@stripe/react-stripe-js` + `@stripe/stripe-js`.
Riceve `clientSecret` come prop e renderizza `PaymentElement`.

## PayPal

Package: `@paypal/react-paypal-js`
Client ID via `VITE_PAYPAL_CLIENT_ID`.

## Flow checkout completo

```
1. Utente va su /checkout
2. CheckoutPage chiama:
   a. getPaymentMethods() → lista metodi Shopware
   b. getShippingMethods() → lista spedizioni
3. Utente seleziona metodo
4. updateContext({ paymentMethodId, shippingMethodId }) → aggiorna contesto Shopware
5. Per Stripe:
   a. POST /api/stripe/create-payment-intent { amount: cart.price.totalPrice }
   b. Ritorna clientSecret
   c. Stripe Elements conferma pagamento
6. placeOrder() → crea ordine in Shopware
```

## Cors

```js
// server.js
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
```
