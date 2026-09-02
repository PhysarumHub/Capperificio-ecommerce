# Deploy

VPS self-hosted con Docker Compose (`docker-compose.yml`), Traefik davanti
per TLS/routing dominio (non in questo repo — gira sul server).

## Comandi operativi (dal top del file `docker-compose.yml`)

```bash
# Primo avvio
cp .env.example .env.production   # poi compila i valori reali
docker compose --env-file .env.production up -d --build

# Avvio standard (usa .env)
docker compose up -d --build

# Rebuild forzato dopo modifiche al codice
docker compose build --no-cache && docker compose up -d

# Log in tempo reale
docker compose logs -f

# Stop completo (mantiene i volumi)
docker compose down
```

## Accesso ai pannelli admin (non pubblici)

Shopware, Strapi, Adminer e Mailcatcher sono bindati solo su `127.0.0.1` del
server. Per raggiungerli dal proprio computer, tunnel SSH:

```bash
ssh -N -L 8090:localhost:8090 \
       -L 1337:localhost:1337 \
       -L 8891:localhost:8891 \
       -L 9998:localhost:9998 root@SERVER
```

Poi: Shopware admin `localhost:8090/admin`, Strapi admin `localhost:1337/admin`,
Adminer `localhost:8891`, Mailcatcher `localhost:9998`.

## Build immagine frontend (`Dockerfile`)

Multi-stage:

1. **builder** (`node:20-alpine`): `npm ci`, poi `vite build`. Le variabili
   `VITE_*` sono passate come build `ARG` e vengono **bakate nel bundle JS**
   in questo stage — non sono runtime, un cambio richiede un rebuild
   dell'immagine, non solo un restart.
2. **runtime** (`node:20-alpine` + nginx installato via apk): installa solo
   dipendenze di produzione (`npm ci --omit=dev`), copia `server.js`, `api/`,
   il build Vite (`dist/`) dallo stage builder, `nginx.conf`, e l'entrypoint.

`docker-entrypoint.sh` avvia sia nginx che `node server.js` nello stesso
container.

## Variabili d'ambiente — dove finiscono

Riferimento completo e commentato: `.env.example`. Regola guida (ripetuta
anche lì): **tutto ciò che ha prefisso `VITE_` finisce nel bundle JS
pubblico** — mai un segreto lì. I segreti veri (`STRIPE_SECRET_KEY`,
`STRAPI_TOKEN`, credenziali Admin API Shopware, `ADMIN_API_KEY`,
`PACKLINK_API_KEY`, `RESEND_API_KEY`) sono solo runtime env del container
`frontend`, letti da `server.js`/`api/*`.

Variabile critica da non dimenticare in produzione Docker: **`SITE_URL`**
(non `FRONTEND_URL`) — `docker-compose.yml` fa
`FRONTEND_URL: ${SITE_URL:-http://localhost}`, quindi legge `SITE_URL` e
ignora `FRONTEND_URL`. Se `SITE_URL` è vuota, l'origine CORS di Express resta
`http://localhost` e il browser blocca tutte le chiamate `/api` dal dominio
pubblico — il checkout smette di funzionare silenziosamente. Deve combaciare
esattamente con l'host canonico (`www.capperificiocaro.com`).

Gruppi principali in `.env.example`:

- Shopware (browser + server, vedi [shopware.md](./shopware.md))
- Stripe (`VITE_STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- `ADMIN_API_KEY` — secret per `POST /api/admin/refund`
- Strapi (vedi [strapi.md](./strapi.md))
- Packlink PRO — se `PACKLINK_API_KEY` è vuota, le spedizioni vengono
  saltate senza errori e l'ordine va comunque a buon fine (fail-open by
  design, non blocca le vendite in assenza di configurazione)
- Resend — email transazionali, richiede dominio verificato
- B2B (`VITE_B2B_CATEGORY_ID`, `VITE_B2B_GROUP_NAME`)
- Google Tag Manager (`VITE_GTM_ID`) — vuoto per default: nessuna richiesta a
  googletagmanager.com finché non valorizzata, sito cookie-free out of the box
  (consenso già gestito da Consent Mode v2 in `index.html`)
- Server Express (`SITE_URL`, `PORT`, `NODE_ENV`)

## Backup/restore Shopware

`scripts/backup-shopware.sh` e `restore-shopware.sh` (`npm run backup` /
`npm run restore`), output in `backups/` (non versionato). Vedi
[scripts.md](./scripts.md).

## Rete Docker

Un'unica bridge network (`capperificio_net`) condivisa da tutti i servizi.
Il frontend dipende da `shopware` **healthy** e da `strapi` almeno
**started** (nginx risolve l'hostname `strapi` all'avvio per la location
`/uploads`: se il container non esiste ancora, nginx non parte).

## Limiti risorse

Il servizio `frontend` ha un limite deploy di 512MB RAM / 1 CPU
(`docker-compose.yml`, sezione `deploy.resources.limits`).
