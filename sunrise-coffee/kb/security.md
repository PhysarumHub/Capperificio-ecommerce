# Sicurezza

## Superficie pubblica reale

Solo il container `frontend` è esposto (via Traefik). Tutto il resto —
admin Shopware, admin Strapi, Adminer, Mailcatcher, Postgres — è bindato su
`127.0.0.1` del VPS, raggiungibile solo con accesso SSH al server. Vedi
[architecture.md](./architecture.md) e [deploy.md](./deploy.md).

Dentro al container `frontend`, `/api` (Express) **non** è ristretto a
`127.0.0.1` in nginx come invece lo sono gli admin panel — è raggiungibile
da internet. La sicurezza degli endpoint sensibili lì dentro dipende
interamente dalla logica applicativa (vedi sotto), non dal networking.

## Nessun pannello admin/login custom

Non esiste autenticazione utente/sessione per operazioni amministrative in
questo backend. L'unica azione "admin" è `POST /api/admin/refund`, protetta
da un header condiviso (`x-admin-key` deve combaciare `ADMIN_API_KEY`, env
var). Trattare `ADMIN_API_KEY` con la stessa cura di `STRIPE_SECRET_KEY`
(secret lungo e casuale, es. `openssl rand -hex 32`, mai in `VITE_*`, mai
committato).

## Il server non si fida mai del client per gli importi

Ogni endpoint di checkout ricalcola il totale dal carrello reale su Shopware
prima di creare un PaymentIntent o un ordine (`getCartTotal` in
`api/_shopware.js`). Dettaglio completo in [backend-api.md](./backend-api.md).
`MAX_ORDER_TOTAL` (€5000) è un tetto anti-frode hardcoded in `server.js`.

## Rate limiting

- **Store API** (`nginx.conf`, zona `storeapi`): 10 richieste/secondo per IP,
  burst 20. Copre `/store-api` per intero, quindi anche login/registrazione
  cliente e applicazione codici sconto (che passano diretti dal browser a
  Shopware via nginx, non da Express) — senza questo limite un codice promo
  sarebbe forzabile a tentativi.
- **Endpoint Express sensibili** (`paymentLimiter` in `server.js`): 20
  richieste / 15 minuti / IP, su tutti gli endpoint `/api/checkout/*`,
  `/api/admin/refund`, `/api/newsletter/subscribe`.

## Idempotenza / anti-doppio-ordine

`withOrderLock` in `server.js` serializza webhook Stripe e `confirm` sullo
stesso context token — vedi [backend-api.md](./backend-api.md). Le chiamate
Stripe usano `idempotencyKey` (PaymentIntent legato a token+importo, refund
legato a orderId).

## Header di sicurezza (`nginx.conf`)

CSP, HSTS (`max-age=31536000; includeSubDomains`), `X-Frame-Options:
SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo
disabilitati, payment solo same-origin). La CSP whitelista esplicitamente
Stripe (`js.stripe.com`, `hooks.stripe.com`) e Google Tag Manager/Maps come
uniche fonti esterne per script/frame.

Nota: `helmet` lato Express ha `contentSecurityPolicy: false` — la CSP è
gestita **interamente** da nginx, non duplicata in Express. Se cambi la CSP,
il posto giusto è `nginx.conf`.

## Redirect canonico e SPA fallback

`nginx.conf` forza `capperificiocaro.com` → `https://www.capperificiocaro.com`
(evita contenuto duplicato). Le rotte SPA sconosciute ricevono un 404 reale
(non un finto 200 su qualunque path), tramite la mappa `$is_spa_route` — va
tenuta allineata a `src/App.jsx` (vedi [architecture.md](./architecture.md)).

## Segreti — cosa NON deve mai avere prefisso `VITE_`

Chiavi Stripe secret (`sk_`), `STRAPI_TOKEN`, credenziali Admin API Shopware
(`SHOPWARE_ADMIN_CLIENT_SECRET`, `SHOPWARE_ADMIN_PASSWORD`), `ADMIN_API_KEY`,
`PACKLINK_API_KEY`, `RESEND_API_KEY`, password DB Strapi. `.env.example`
documenta la distinzione riga per riga — usalo come checklist quando si
aggiunge una nuova integrazione.

`.gitignore` (root e `sunrise-coffee/`) blocca pattern comuni per segreti
(`*chiave*`, `*secret*`, `*token*`, `*.key`, `*.pem`, `.env*` tranne
`.env.example`) — non è un sostituto della disciplina su cosa finisce in
`VITE_*`, ma una rete di sicurezza contro commit accidentali.
