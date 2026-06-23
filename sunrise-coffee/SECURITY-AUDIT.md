# Security Audit — Capperificio (sunrise-coffee)

Data: 2026-06-22

## Falle risolte in questo intervento

### 🔴 Pagamento aggirabile (CRITICO) — RISOLTO
**Prima:** l'importo del pagamento arrivava dal browser (`amount: totalPrice`) e
l'ordine veniva creato lato client senza verificare il pagamento. Un utente poteva
pagare €0,50 per un ordine da €500, o creare ordini senza pagare affatto.

**Ora:**
- L'importo è **calcolato dal server** leggendo il carrello reale da Shopware
  (`api/_shopware.js → getCartTotal`). Il client non può più manipolare il prezzo.
- L'ordine viene creato **solo dopo verifica del pagamento** lato server:
  - Stripe: `api/stripe/confirm-and-order.js` controlla che il PaymentIntent sia
    `succeeded`, legato alla sessione (`metadata.contextToken`) e con importo == carrello.
  - PayPal: `api/paypal/capture-order.js` cattura e verifica importo/sessione prima di creare l'ordine.
- **Webhook Stripe** (`api/stripe/webhook.js`) con verifica firma: se il cliente paga ma
  chiude il browser, l'ordine viene comunque creato (rete di sicurezza).
- L'endpoint client `placeOrder()` che bypassava tutto è stato **rimosso**.

### 🔴 PayPal con importo dal client (CRITICO) — RISOLTO
Creazione e cattura ordine spostate **interamente sul server** con importo dal carrello.

### 🔴 Token Strapi nel bundle pubblico (ALTO) — RISOLTO
Le chiamate API passano da un **proxy server** (`api/strapi/[...path].js`) che tiene il
token solo lato server e consente in sola lettura gli articoli. Rimosso `VITE_STRAPI_TOKEN`.

### 🟠 Chiave Stripe in chiaro su disco (ALTO) — RISOLTO
File `cHIAVE STRIPE.txt` **eliminato**. `.gitignore` rafforzato (varianti maiuscole/minuscole,
`.env`, `*token*`).

### 🟡 Hardening aggiuntivo — FATTO
- **CSP** aggiunta in `vercel.json` (restringe le origini degli script, blocca object/frame-ancestors).
- Rate limiter con estrazione IP corretta (`api/_ratelimit.js`); `server.js` non disabilita più il limite fuori produzione.
- `server.js` (path locale/Docker) riallineato alla stessa logica sicura.

---

## ⚠️ Azioni manuali ancora da fare (TUE)

### 1. Ruota TUTTE le chiavi (erano esposte / in git history)
- Stripe: rigenera **secret key** (live + test) → Dashboard → Developers → API keys → Roll.
- Shopware: rigenera le **credenziali Admin API** (erano hardcoded negli script, restano nella git history).
- PayPal: rigenera il **client secret**.
- Strapi: rigenera il **token**.

### 2. Imposta le env var su Vercel (Settings → Environment Variables)
Nuove variabili **lato server** richieste (vedi `.env.example`):
```
SHOPWARE_API_URL, SHOPWARE_ACCESS_KEY
STRIPE_WEBHOOK_SECRET
PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_BASE
STRAPI_URL, STRAPI_TOKEN
```

### 3. Configura il webhook Stripe
Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://capperificiocaro.com/api/stripe/webhook`
- Evento: `payment_intent.succeeded`
- Copia il signing secret (`whsec_...`) in `STRIPE_WEBHOOK_SECRET`.

### 4. Bonifica la git history (consigliato)
Le credenziali rimosse con il commit `eba5919` sono ancora nei commit precedenti.
Dopo aver ruotato le chiavi, rimuovile dalla storia con `git filter-repo` (o BFG) e force-push.

---

## Follow-up consigliati (non bloccanti)
- **Rate limiting persistente** con Upstash Redis (l'attuale è in-memory, si azzera ad ogni cold start).
- **Sanitizzare** l'HTML in `ProductDetail.jsx` (`dangerouslySetInnerHTML`) con DOMPurify, anche se il contenuto è admin-controlled.
- Valutare il **plugin di pagamento ufficiale Shopware** (Stripe/PayPal) per gestire nativamente lo stato di pagamento.
