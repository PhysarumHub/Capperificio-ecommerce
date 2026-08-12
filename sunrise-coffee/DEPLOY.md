# 🚀 Deploy in produzione — capperificiocaro.com

> **Target: VPS self-hosted con Docker Compose + Traefik.**
> Non si deploya su Vercel: il backend è un server Express persistente
> (`server.js`) e nginx fa da proxy verso i container Shopware e Strapi,
> cose che una piattaforma serverless non può servire.
>
> Prima installazione da zero → [SETUP-LINUX.md](SETUP-LINUX.md).
> Questo documento copre il **go-live** e gli **aggiornamenti successivi**.

---

## Architettura

Un solo container (`frontend`) contiene sia nginx sia il backend Node:

```
Internet
   │
   ▼
Traefik (80/443, TLS Let's Encrypt)
   │
   ▼
container "frontend"
   ├── nginx (porta 80)
   │     ├── /                → SPA React (dist/) — allowlist rotte, 404 reali
   │     ├── /api/*           → 127.0.0.1:3001  (Express)
   │     ├── /sitemap.xml     → 127.0.0.1:3001  (generata con i prodotti live)
   │     ├── /store-api/*     → shopware:80     (rate limit 10 r/s)
   │     ├── /media, /thumbnail → shopware:80
   │     └── /uploads         → strapi:1337
   └── node server.js (porta 3001, solo loopback)
         ├── /api/checkout/create-intent | confirm | confirm-free
         ├── /api/stripe/webhook
         ├── /api/newsletter/subscribe | confirm
         ├── /api/admin/refund     (header x-admin-key)
         ├── /api/strapi/*         (proxy read-only)
         └── order poller → email Resend + spedizioni Packlink

container "shopware"   → 127.0.0.1:8090  (admin via tunnel SSH)
container "strapi"     → 127.0.0.1:1337  (admin via tunnel SSH)
container "strapi-db"  → solo rete Docker
```

Nessuna porta di amministrazione è esposta su internet: si raggiungono
via tunnel SSH (vedi l'intestazione di `docker-compose.yml`).

---

## 1. Prepara il branch

```bash
git checkout main
git merge feature/shopware-integration
git push origin main
```

---

## 2. Configura `.env` sul server

```bash
cp .env.example .env   # poi compila
```

`docker-compose.yml` legge questo file sia per i build arg `VITE_*`
(che finiscono nel bundle JS pubblico) sia per le variabili runtime di
`server.js`. Le voci che **devono** essere corrette prima del go-live:

| Variabile | Perché è bloccante |
|---|---|
| `VITE_SHOPWARE_ACCESS_KEY` | Senza, il catalogo non carica |
| `VITE_STRIPE_PUBLIC_KEY` / `STRIPE_SECRET_KEY` | Chiavi **live** (`pk_live_`/`sk_live_`) |
| `STRIPE_WEBHOOK_SECRET` | Senza, il webhook risponde 500 e si perde la rete di sicurezza sui checkout interrotti |
| `SITE_URL` | Origine CORS di Express. Se sbagliata, il browser blocca `/api` e **il checkout non parte** |
| `SHOPWARE_ADMIN_*` | Senza, gli ordini vengono creati ma **non** segnati "pagati" |
| `ADMIN_API_KEY` | Senza, `/api/admin/refund` resta disabilitato |
| `RESEND_API_KEY` | Senza, nessuna email transazionale |
| `VITE_GTM_ID` | Vuoto = GTM non caricato affatto (sito cookie-free) |

> ⚠️ Regola: tutto ciò che ha prefisso `VITE_` finisce nel bundle JS
> **pubblico**. I segreti (`sk_`, token, password) non devono mai averlo.

---

## 3. Avvia / aggiorna lo stack

```bash
docker compose up -d --build
```

Le variabili `VITE_*` sono baked nel bundle al **build time**: dopo averle
modificate serve sempre un rebuild, non basta un restart.

```bash
# Solo il frontend, dopo una modifica al codice o al .env
docker compose up -d --build frontend

# Log
docker compose logs -f frontend
```

---

## 4. Configura il webhook Stripe

Dashboard Stripe → Developers → Webhooks → **Add endpoint**

- URL: `https://www.capperificiocaro.com/api/stripe/webhook`
- Eventi: `payment_intent.succeeded`, `charge.refunded`
- Copia il signing secret (`whsec_...`) in `STRIPE_WEBHOOK_SECRET`, poi rebuild.

Il webhook è la rete di sicurezza per chi paga e chiude il browser prima
della conferma: senza, quell'ordine non viene mai creato.

---

## 5. Checklist go-live

### Bloccanti

- [ ] Chiavi Stripe **live** (non `pk_test_`/`sk_test_`)
- [ ] `STRIPE_WEBHOOK_SECRET` configurato e webhook attivo
- [ ] `SITE_URL` = host canonico esatto (`https://www.capperificiocaro.com`)
- [ ] Password admin Shopware cambiata (mai lasciare `shopware`)
- [ ] Access Key Shopware rigenerata se mai finita in un repo
- [ ] **`APP_ENV=prod`** per il container Shopware in `docker-compose.yml`
      (attualmente `dev`: espone il profiler e rallenta tutto — vedi sotto)
- [ ] DNS di `www` e apex puntati al server, certificato Let's Encrypt emesso
- [ ] Ordine di prova reale completato: pagamento → ordine su Shopware → email

### Da verificare a mano

- [ ] Container GTM **pubblicato** (i tag creati da `scripts/gtm-setup.js`
      restano in un workspace non pubblicato: gli eventi partono dal sito ma
      non arrivano a GA4/Meta finché non pubblichi la versione)
- [ ] Metodi di spedizione e paesi configurati sul Sales Channel
- [ ] Prezzi IVA inclusa corretti
- [ ] Email transazionali con mittente reale (non `noreply@shopware.com`)

---

## Nota — `APP_ENV=dev` sul container Shopware

`docker-compose.yml` usa l'immagine `dockware/dev` con `APP_ENV=dev`.
In produzione va portato a `prod`: in `dev` Shopware tiene attivi profiler
e debug, è sensibilmente più lento e può esporre informazioni interne.

Il passaggio richiede di rigenerare la cache dentro il container, quindi
va fatto in una finestra in cui il sito può essere brevemente non
disponibile:

```bash
# 1. Cambia APP_ENV=dev → APP_ENV=prod in docker-compose.yml
docker compose up -d shopware
docker compose exec shopware bash -lc \
  "cd /var/www/html && APP_ENV=prod bin/console cache:clear && APP_ENV=prod bin/console theme:compile"
```

Verifica il catalogo subito dopo: se qualcosa si rompe, riportare
`APP_ENV=dev` e ripetere `cache:clear` ripristina lo stato precedente.

---

## Backup

```bash
npm run backup    # dump del DB Shopware in backups/
npm run restore   # ripristino
```

I dump in `backups/*.sql` sono esclusi da git: non committarli mai.

---

## Rollback di un deploy

```bash
git revert <commit>          # oppure git checkout <tag-precedente>
docker compose up -d --build frontend
```

I dati (Shopware, Strapi, Postgres) vivono in volumi Docker e non vengono
toccati dal rebuild del frontend.
