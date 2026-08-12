# 🔐 Sicurezza — Capperificio Caro

> Stato verificato leggendo il codice il **2026-08-12**.
> Sostituisce `SECURITY-AUDIT.md`, `SECURITY_FIXES.md`, `PRODUCTION_CHECKLIST.md`
> e `docs/PRODUCTION-CHECKLIST.md`: erano quattro documenti sovrapposti,
> scritti per un deploy su Vercel mai realizzato, e diverse cose che
> dichiaravano "risolte" nel frattempo erano regredite. Restano nella
> storia git se servono.

---

## Modello di deploy

**VPS self-hosted, Docker Compose + Traefik.** Vedi [DEPLOY.md](DEPLOY.md).
Non c'è nessun deploy serverless: il codice Vercel (`api/stripe/`,
`api/paypal/`, `api/strapi/`, `api/_ratelimit.js`, `vercel.json`) è stato
rimosso perché non veniva eseguito da nessuna parte pur duplicando — in
versioni più vecchie e incomplete — la logica di pagamento.

`api/` contiene ora solo i tre moduli che `server.js` importa davvero:
`_shopware.js`, `_packlink.js`, `_resend.js`.

---

## Controlli attivi sul flusso di pagamento

| Controllo | Dove |
|---|---|
| Importo calcolato **sempre** dal carrello reale Shopware, mai dal client | `api/_shopware.js` → `getCartTotal` |
| Ordine creato solo dopo `payment_intent.status === 'succeeded'` | `server.js` `/api/checkout/confirm` |
| PaymentIntent legato alla sessione (`metadata.contextToken`) | `server.js` |
| Importo e valuta ri-verificati prima di creare l'ordine | `server.js` |
| Firma del webhook verificata (`stripe.webhooks.constructEvent`) | `server.js` `/api/stripe/webhook` |
| Tetto anti-frode €5.000 per ordine | `server.js` `MAX_ORDER_TOTAL` |
| Ordini a €0 (sconto 100%) ri-verificati server-side | `server.js` `/api/checkout/confirm-free` |
| Lock per `contextToken`: webhook e confirm non possono creare due ordini | `server.js` `withOrderLock` |
| Idempotency key su PaymentIntent e rimborsi | `server.js` |
| Rate limit 20 req/15 min sugli endpoint di pagamento | `server.js` `paymentLimiter` |
| Rate limit 10 r/s sulla Store API (anti brute-force codici sconto) | `nginx.conf` `limit_req_zone` |
| `/api/admin/refund` protetto da secret condiviso | `server.js` `requireAdminKey` |

---

## Gestione dei segreti

- `.env`, `scripts/.env`, `backups/*.sql` e `.gtm-auth/` sono in `.gitignore`
  e **non risultano presenti nella storia git** (verificato).
- Nessun segreto ha prefisso `VITE_`: quel prefisso finisce nel bundle JS
  pubblico. `VITE_STRAPI_TOKEN` era stato reintrodotto nel build Docker ed è
  stato rimosso — il token Strapi vive solo lato server (`STRAPI_TOKEN`),
  usato dal proxy read-only `/api/strapi/*`.
- Gli script di amministrazione leggono le credenziali da `scripts/.env`
  tramite `scripts/_config.py`. **Nessuno script ha più un fallback sulla
  password di default `shopware`**: senza configurazione si fermano con un
  errore esplicito.

---

## Superficie di rete

Esposto su internet solo il container `frontend`, dietro Traefik (HTTPS):

- Shopware admin (`8090`), Strapi (`1337`), Adminer (`8891`), Mailcatcher
  (`9998`) sono bound su `127.0.0.1` → raggiungibili solo via tunnel SSH.
- Anche la porta `3001` del frontend è ora bound su `127.0.0.1`: prima era
  esposta su `0.0.0.0` e serviva l'intero sito in **HTTP in chiaro**,
  aggirando il redirect HTTPS e l'header HSTS.
- CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`
  sono impostati in `nginx.conf` (helmet in `server.js` non duplica la CSP).

---

## ⚠️ Da fare a mano prima del go-live

Queste non si possono risolvere da codice:

| # | Cosa | Dove |
|---|---|---|
| 1 | Password admin Shopware diversa da `shopware` | Shopware Admin → My Profile |
| 2 | Access Key Shopware rigenerata se è mai finita in un repo | Sales Channels → Headless → API Access |
| 3 | `APP_ENV=prod` sul container Shopware (ora `dev`) | `docker-compose.yml` — vedi DEPLOY.md |
| 4 | Chiavi Stripe **live** + `STRIPE_WEBHOOK_SECRET` | Dashboard Stripe |
| 5 | `ADMIN_API_KEY` generata (`openssl rand -hex 32`) | `.env` |
| 6 | Firewall del provider: chiudere tutto tranne 22/80/443 | Pannello Hetzner |

---

## Limiti noti accettati

- **Nessun error monitoring**: `src/components/ErrorBoundary.jsx` logga solo
  in console. Un errore React in produzione non genera nessun alert.
- **SEO lato client**: i meta tag per prodotto/collezione sono applicati da
  `useSEO` dopo il mount. Senza SSR/prerendering, un crawler che non esegue
  JS vede i meta di default di `index.html`.
- **Rate limit in-memory**: `paymentLimiter` vive nel processo Express. Con
  un solo container va bene; scalando a più repliche serve uno store condiviso.
- **`dangerouslySetInnerHTML`** in `ProductDetail.jsx` su descrizioni prodotto
  controllate dall'admin Shopware. Basso rischio, ma resta non sanitizzato.
