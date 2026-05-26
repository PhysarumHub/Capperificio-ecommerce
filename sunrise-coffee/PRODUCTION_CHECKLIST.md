# Production Deployment Checklist

> **Aggiornata il 26/05/2026** — Deploy target: **Vercel** + dominio `capperificiocaro.com`

---

## Stato generale: ✅ PRONTO PER IL DEPLOY

| Categoria | Stato | Note |
|---|---|---|
| Build System | ✅ Pronto | Vite, bundle ottimizzato |
| Secrets Management | ✅ Risolto | Storia git ripulita, credenziali in env vars |
| Server Configuration | ✅ Risolto | 0.0.0.0 bind, validazione env vars, rate limit |
| Environment Variables | ✅ Completo | `.env.example` production-ready |
| HTTPS / Security | ✅ Risolto | Security headers in `vercel.json` + helmet |
| Error Handling | ✅ Risolto | Validazione input, max amount, currency check |
| Process Management | ✅ N/A su Vercel | Vercel gestisce uptime e restart |

---

## ✅ Problemi risolti

### 1. Chiavi API esposte
**Risolto.** Storia git riscritta con `git-filter-repo`. Credenziali rimosse da tutti i 213 commit.
Script Python refactored per leggere da `scripts/.env` (in `.gitignore`).
> ⚠️ **Azione manuale richiesta:** ruotare la chiave Shopware e cambiare la password admin.
> Vedere [SECURITY_FIXES.md](SECURITY_FIXES.md).

---

### 2. `server.js` bind solo su `127.0.0.1`
**Risolto.** `server.js` ora usa `'0.0.0.0'`:
```js
app.listen(PORT, '0.0.0.0', () => console.log(...))
```
> Nota: su **Vercel** questo file non viene usato — le API girano come serverless functions.
> Il fix serve per deploy self-hosted o sviluppo locale in rete.

---

### 3. Nessuna validazione delle variabili d'ambiente
**Risolto.** `server.js` ora usa `process.exit(1)` se manca `STRIPE_SECRET_KEY`:
```js
const REQUIRED_ENV = ['STRIPE_SECRET_KEY'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) { console.error(`❌ Mancante: ${key}`); process.exit(1); }
}
```

---

### 4. `.env.example` incompleto
**Risolto.** Riscritto con tutte le variabili, commenti esplicativi e avvisi sicurezza.
Aggiunte: `FRONTEND_URL`, `PORT`, `NODE_ENV`.
File: [.env.example](.env.example)

---

### 5. Nessun HTTPS
**N/A su Vercel.** Vercel gestisce HTTPS automaticamente con certificati Let's Encrypt.
Il sito sarà raggiungibile via `https://capperificiocaro.com` senza configurazione aggiuntiva.

> Per deploy self-hosted su Linux, usare nginx + certbot:
> ```bash
> sudo apt install certbot python3-certbot-nginx
> sudo certbot --nginx -d capperificiocaro.com -d www.capperificiocaro.com
> ```

---

### 6. CORS hardcoded su `localhost:5173`
**Risolto.** `server.js` legge `FRONTEND_URL` dall'env:
```js
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
```
Su Vercel, il CORS per le API è configurato in `vercel.json` con il dominio reale.

---

### 7. Nessun rate limiting sull'endpoint Stripe
**Risolto in entrambi i contesti:**

**`server.js` (locale/self-hosted)** — `express-rate-limit`:
```js
import rateLimit from 'express-rate-limit';
const paymentLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.post('/api/stripe/create-payment-intent', paymentLimiter, handler);
```

**`api/stripe/create-payment-intent.js` (Vercel serverless)** — rate limiter in-memory per cold start + cap importo massimo (€5.000).

---

### 8. Nessun security header
**Risolto in entrambi i contesti:**

**`server.js`** — `helmet`:
```js
import helmet from 'helmet';
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
```

**`vercel.json`** — headers per tutte le route:
```json
"X-Content-Type-Options: nosniff"
"X-Frame-Options: DENY"
"X-XSS-Protection: 1; mode=block"
"Referrer-Policy: strict-origin-when-cross-origin"
"Permissions-Policy: camera=(), microphone=(), geolocation=()"
```
Cache-Control ottimizzato per gli asset statici (`/assets/*`).

---

### 9. Nessun process manager
**N/A su Vercel.** Vercel gestisce uptime, restart e scaling automaticamente.

> Per deploy self-hosted su Linux:
> ```bash
> npm install -g pm2
> pm2 start server.js --name "sunrise-payment-api"
> pm2 startup && pm2 save
> ```

---

### 10. `image.js` controlla `localhost` hardcoded
**Risolto.** `proxyUrl` ora rileva l'hostname Shopware da `VITE_SHOPWARE_API_URL`
e fa il proxy solo per URL che puntano a quel server:
```js
const _shopwareHost = new URL(import.meta.env.VITE_SHOPWARE_API_URL).hostname;

function _shouldProxy(url) {
  const { hostname } = new URL(url);
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === _shopwareHost;
}
```
In production (`import.meta.env.DEV === false`) le immagini vengono sempre restituite
come URL assoluti — nessun proxy, nessun problema.

---

## ✅ Già OK dall'inizio

- ✅ `npm run build` produce un bundle ottimizzato pronto per il deploy
- ✅ `.env` e `.env.local` sono in `.gitignore`
- ✅ Il frontend usa solo variabili `VITE_*` — nessuna chiave segreta nel client
- ✅ `STRIPE_SECRET_KEY` senza `VITE_` — mai inclusa nel bundle JS
- ✅ React Router gestisce il routing client-side, `vercel.json` ha il rewrite corretto
- ✅ PayPal: SDK React ufficiale, auto-detect live/sandbox dal Client ID
- ✅ Stripe: PaymentIntent lato server, 3D Secure gestito con `redirect: 'if_required'`

---

## 📋 Passi manuali da fare TU

Questi non si possono automatizzare — richiedono accesso ai pannelli:

### Obbligatori prima di andare live

- [ ] **Cambia password admin Shopware** da `shopware` → una password sicura
      → `http://157.90.241.97:8090/admin` → My Profile → Change Password

- [ ] **Rigenera la Access Key Shopware**
      → Shopware Admin → Sales Channels → Headless → API Access → 🔄 Regenerate

- [ ] **Crea `scripts/.env`** con le nuove credenziali
      → `cp scripts/.env.example scripts/.env` e compila

- [ ] **Crea `.env.local`** con le credenziali aggiornate
      → `cp .env.example .env.local` e compila

- [ ] **Imposta le env vars su Vercel**
      → Vercel → Settings → Environment Variables
      → Copia i valori da `.env.local` (vedi [DEPLOY.md](DEPLOY.md))

- [ ] **Genera chiavi Stripe LIVE**
      → [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
      → Inserisci `pk_live_...` e `sk_live_...` su Vercel

### Consigliati

- [ ] Verifica chiavi PayPal live su developer.paypal.com
- [ ] Aggiungi firewall sulla porta 8090 del server Shopware (ora esposta pubblicamente)
- [ ] Testa checkout completo con carta Stripe `4242 4242 4242 4242` (modalità test)
- [ ] Testa checkout PayPal in modalità sandbox prima di andare live

---

*Aggiornata il 26/05/2026 — tutti i problemi tecnici risolti nel codice.*
