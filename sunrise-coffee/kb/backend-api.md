# Backend pagamenti (`server.js`)

Unico processo Express del progetto. Gira dentro al container `frontend`,
dietro nginx (`location /api` → `127.0.0.1:3001`). File di supporto in `api/`:
`_shopware.js` (Store/Admin API), `_resend.js` (email transazionali),
`_packlink.js` (spedizioni).

All'avvio valida che `STRIPE_SECRET_KEY`, `SHOPWARE_API_URL`,
`SHOPWARE_ACCESS_KEY` esistano — altrimenti esce subito (`process.exit(1)`).

## Perché il checkout passa sempre dal server

Il client non crea mai un ordine Shopware direttamente e non decide mai
l'importo pagato. `server.js` ricalcola sempre il totale dal carrello reale
prima di creare un PaymentIntent o un ordine — impedisce la manipolazione
prezzo lato client. Flusso:

1. **`POST /api/checkout/create-intent`** (rate-limited: 20 req / 15 min / IP)
   - registra il guest su Shopware se serve (`registerGuestIfNeeded`) — il
     carrello può migrare su un nuovo context token
   - allinea l'indirizzo di fatturazione se l'utente l'ha corretto dopo la
     registrazione (`syncCheckoutAddress`, no-op se non cambiato)
   - imposta il metodo di spedizione scelto (`setShippingMethod`)
   - legge il totale reale del carrello (`getCartTotal`) — rifiuta se supera
     `MAX_ORDER_TOTAL` (€5000, tetto anti-frode) o se è sotto il minimo
     Stripe (`STRIPE_MIN_CENTS`, 0,50€) ma non zero
   - se il totale è **0€** (es. sconto 100%) non crea PaymentIntent, ritorna
     `{ free: true }` → il client chiama `confirm-free` invece di pagare
   - altrimenti crea il PaymentIntent Stripe (`automatic_payment_methods`,
     idempotency key legata a token+importo) e ritorna `clientSecret` +
     il context token **autoritativo** (il client deve adottarlo, vedi
     `setContextToken` in [frontend.md](./frontend.md))

2. **`POST /api/checkout/confirm`** — verifica che il PaymentIntent sia
   `succeeded` e che il `contextToken` combaci coi metadata del pagamento,
   poi crea l'ordine (`placeOrder`) e lo segna pagato su Shopware
   (`markTransactionPaid`, best-effort: non blocca se l'Admin API non è
   configurata). Risponde subito, poi lancia in background
   `fulfillOrderInBackground` (Packlink + email).

3. **`POST /api/checkout/confirm-free`** — stesso schema ma per carrelli a
   0€: nessun pagamento da verificare, ma il server ricontrolla comunque che
   il totale sia davvero 0 prima di creare l'ordine.

### Lock anti-doppio-ordine (`withOrderLock`)

Il webhook Stripe (`payment_intent.succeeded`) e `/api/checkout/confirm`
possono arrivare **in parallelo** per lo stesso pagamento (es. client che non
completa il confirm perché chiude il browser, ma il webhook arriva comunque).
Senza serializzazione entrambi leggerebbero un carrello ancora pieno e
creerebbero due ordini per un solo incasso. `withOrderLock(contextToken, fn)`
accoda le operazioni sullo stesso token: chi arriva secondo trova il carrello
già svuotato e cade nel ramo idempotente ("ordine già creato"). Lock
in-process (va bene perché Express gira in un solo container/processo).

## Webhook Stripe — `POST /api/stripe/webhook`

Registrato **prima** di `express.json()` perché richiede il body grezzo per
verificare la firma (`express.raw`). Due eventi gestiti:

- `payment_intent.succeeded` → rete di sicurezza: se il client non ha
  completato `confirm` (browser chiuso), l'ordine viene creato comunque qui,
  sotto lo stesso `withOrderLock`.
- `charge.refunded` → rete di sicurezza per rimborsi fatti a mano dalla
  Dashboard Stripe (bypassano `/api/admin/refund`): aggiorna comunque lo
  stato su Shopware. `markTransactionRefunded` è idempotente, quindi non fa
  danni se il rimborso è già stato gestito dall'endpoint admin.

## Rimborsi — `POST /api/admin/refund`

**Non c'è un pannello admin/login** in questo backend: l'endpoint è protetto
solo da un header condiviso (`x-admin-key` deve combaciare con
`ADMIN_API_KEY`). `/api` **non** è ristretto a `127.0.0.1` in nginx (a
differenza di Shopware/Strapi admin), quindi questo endpoint è raggiungibile
da internet — la sicurezza sta tutta nel secret. v1: solo rimborso totale.
Ordine delle operazioni: Stripe prima (azione reale/irreversibile), Shopware
dopo — se lo step Shopware fallisce il cliente ha comunque i soldi indietro
(recuperabile a mano); il contrario sarebbe peggio.

## Newsletter — `/api/newsletter/subscribe`, `/api/newsletter/confirm`

Double opt-in via Shopware: `subscribe` fa partire l'email con link di
conferma (`{SITE_URL}/newsletter-subscribe?em=...&hash=...`), letta da
`NewsletterConfirmPage.jsx` che chiama `confirm`.

## Proxy Strapi — `GET /api/strapi/*`

Whitelist esplicita (`STRAPI_ALLOWED`, solo path che iniziano per `articles`)
— il proxy non è un pass-through generico. Allega `Authorization: Bearer
STRAPI_TOKEN` lato server (mai esposto al browser). Risposta cacheable
(`Cache-Control: public, max-age=300, s-maxage=600`).

## Sitemap dinamica — `GET /sitemap.xml`

Genera XML combinando pagine statiche (hardcoded, va tenuta sincronizzata con
le rotte reali) + prodotti attivi letti live dalla Store API, paginati a 100
(la Store API rifiuta `limit > 100`), fino a 50 pagine di sicurezza. Usa la
SEO URL canonica se presente, altrimenti l'ID prodotto.

## Poller ordini → email automatiche

Se Resend e l'Admin API Shopware sono entrambi configurati, al boot parte un
poller (`startOrderPoller`, primo giro dopo 60s, poi ogni 2 minuti) che:

- rileva ordini appena **spediti** o **cancellati** e invia l'email
  corrispondente (stato persistito su disco in `.poller-state.json`, così
  sopravvive ai riavvii e non rimanda email retroattive per ordini già
  esistenti prima del deploy)
- manda una **richiesta di recensione** ~10 giorni dopo la spedizione
  (finestra di tolleranza tra 10 e 10.3 giorni, per non spammare a ogni poll)
- controlla **stock basso** (soglia 5 unità) una volta all'ora (throttle via
  bucket orario nel Set di stato)

## Variabili d'ambiente lette da `server.js`

Vedi `.env.example` (commentato riga per riga) e [deploy.md](./deploy.md) per
l'elenco completo e il significato di ciascuna.
