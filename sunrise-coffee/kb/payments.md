# Pagamenti — Stripe

## Architettura

```
Browser → POST /api/checkout/create-intent  → server.js (Express)
                                             → Shopware (guest + spedizione + totale reale)
                                             → Stripe API (server-side, secret key)
                                             ← { clientSecret, contextToken, amount }
Browser → Stripe.js (Payment Element) → conferma pagamento (carta/wallet/redirect)
Browser → POST /api/checkout/confirm        → server.js verifica il PaymentIntent, crea l'ordine
                                               su Shopware e lo segna "paid"
```

Il backend Express (`server.js`) gira su porta 3001, dietro nginx (`location ^~ /api`).
In dev: `npm run dev` avvia sia Vite (5173) che Express (3001) in parallelo via `concurrently`.
In produzione: Express è servito dallo stesso container Docker del frontend (`docker-compose.yml`).

`server.js` è l'unico backend: le vecchie funzioni serverless Vercel (`api/stripe/`,
`api/paypal/`) sono state rimosse perché duplicavano — in versioni più vecchie e
incomplete — questa logica senza mai essere eseguite.

## Endpoint (`server.js`)

```
POST /api/checkout/create-intent
Body: { contextToken, customer, billingAddress, shippingMethodId }
Response: { clientSecret, contextToken, amount }
```
Registra il guest (se serve), imposta la spedizione, legge il totale REALE dal
carrello Shopware (mai dal client) e crea un PaymentIntent Stripe con
`automatic_payment_methods: { enabled: true }` (redirect NON disabilitati: il
Payment Element può proporre metodi che richiedono un redirect, es. iDEAL/
Bancontact — vedi sezione "Rientro da redirect" sotto). Idempotency key legata a
token+importo. Cap anti-frode: `MAX_ORDER_TOTAL = 5000` EUR.

```
POST /api/checkout/confirm
Body: { paymentIntentId, contextToken }
Response: { orderNumber, paid }
```
Rilegge il PaymentIntent da Stripe, verifica `status === 'succeeded'`, che sia
legato a questo `contextToken` (metadata) e che l'importo combaci col carrello,
poi piazza l'ordine su Shopware e lo segna "paid" via Admin API
(`markTransactionPaid`, in `api/_shopware.js`, salva anche
`customFields.stripe_payment_intent_id` sull'ordine).

```
POST /api/stripe/webhook
```
Rete di sicurezza firmata (`STRIPE_WEBHOOK_SECRET`): se il cliente chiude il
browser dopo aver pagato senza che `/confirm` venga chiamato, l'evento
`payment_intent.succeeded` crea comunque l'ordine qui. Gestisce anche
`charge.refunded` (vedi sotto). Se `STRIPE_WEBHOOK_SECRET` non è configurato
l'endpoint risponde sempre 500 — `server.js` stampa un warning a boot in tal caso.

```
POST /api/admin/refund
Header: x-admin-key: <ADMIN_API_KEY>
Body: { orderId }
Response: { refundId, amount, status, shopwareUpdated }
```
Rimborso TOTALE (v1: nessun importo parziale). Nessun pannello admin/login in
questo backend: autenticato da un secret condiviso nell'header `x-admin-key`.
⚠ `/api` non è ristretto a `127.0.0.1` in nginx (a differenza degli admin panel
di Shopware/Strapi), quindi questo endpoint è raggiungibile da internet — usa
un `ADMIN_API_KEY` lungo e casuale (`openssl rand -hex 32`).
Ordine delle operazioni: rimborso Stripe prima, transizione Shopware dopo (se
lo step Shopware fallisce il cliente ha comunque i soldi indietro — recuperabile
a mano; il contrario sarebbe peggio). Chiama `markTransactionRefunded` in
`api/_shopware.js` (idempotente: se la transazione è già `refunded`/
`refunded_partially` non rifà nulla) e invia l'email `sendRefundIssued`
(`api/_resend.js`).

Il webhook gestisce anche `charge.refunded` con la stessa
`markTransactionRefunded`, come rete di sicurezza per i rimborsi fatti
direttamente dalla Dashboard Stripe (senza passare da `/api/admin/refund`).
Idempotente rispetto a entrambi i percorsi.

## Rientro da redirect (iDEAL/Bancontact/3DS via Stripe)

Poiché i redirect non sono disabilitati, alcuni metodi del Payment Element
portano il cliente fuori dal sito e poi lo riportano su `return_url`
(`/checkout`) con `payment_intent_client_secret` in query string — una
navigazione completa, non un cambio di stato interno alla SPA: `CheckoutPage`
rimonta da zero. Un effect dedicato in `CheckoutPage.jsx` legge il client
secret dall'URL al mount, chiama `stripe.retrievePaymentIntent()` e riprende
il flusso (`succeeded` → completa l'ordine come al solito; `processing` →
schermata di attesa; altro → torna al form di pagamento con errore). Il
context token sopravvive al reload perché persistito nel cookie
(`src/lib/shopware-client.js`), non nello state React.

## Env vars pagamenti

```env
STRIPE_SECRET_KEY=sk_live_...         # lato server (non VITE_)
STRIPE_WEBHOOK_SECRET=whsec_...       # lato server — eventi: payment_intent.succeeded, charge.refunded
ADMIN_API_KEY=...                     # lato server — header x-admin-key per /api/admin/refund
VITE_STRIPE_PUBLIC_KEY=pk_live_...    # lato client (embedded nel bundle)
```

## Componenti frontend

- `src/lib/api/checkout.js` — `createCheckoutIntent()` → `/api/checkout/create-intent`,
  `confirmCheckout()` → `/api/checkout/confirm`.
- `src/pages/CheckoutPage.jsx` — orchestratore: step di checkout, creazione
  dell'intent, gestione del rientro da redirect, schermata di conferma.
- `src/components/checkout/StripePaymentForm.jsx` — usa `@stripe/react-stripe-js`,
  renderizza `PaymentElement`, chiama `stripe.confirmPayment({ redirect: 'if_required' })`.

## Cors

```js
// server.js
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
```
