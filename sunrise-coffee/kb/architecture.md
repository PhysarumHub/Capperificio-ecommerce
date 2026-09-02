# Architettura

## Servizi (docker-compose.yml)

```
                         Traefik (TLS, dominio pubblico)
                                │
                                ▼
                    ┌────────────────────┐
                    │   frontend (nginx)  │  127.0.0.1:3001 → Traefik
                    │   + Express :3001    │
                    └─────────┬───────────┘
              ┌───────────────┼──────────────────┐
              ▼                                   ▼
    ┌──────────────────┐               ┌──────────────────┐
    │ shopware (dockware)│               │  strapi (+ postgres)│
    │ 127.0.0.1:8090      │               │ 127.0.0.1:1337       │
    └──────────────────┘               └──────────────────┘
```

- **`frontend`** è l'unico container esposto pubblicamente (via Traefik). Al suo
  interno gira **nginx** (porta 80) che fa da reverse proxy verso:
  - i file statici del build Vite (`dist/`)
  - `/store-api` → container `shopware` (proxy diretto, con rate limit)
  - `/media`, `/thumbnail` → immagini prodotto Shopware
  - `/api` e `/sitemap.xml` → **Express** in ascolto su `127.0.0.1:3001` nello
    stesso container (vedi [backend-api.md](./backend-api.md))
- **`shopware`** (immagine `dockware/dev`) è il commerce backend: prodotti,
  carrello, ordini, clienti, spedizioni. Le sue porte (admin, DB, mailcatcher)
  sono bindate solo su `127.0.0.1` del server — raggiungibili solo via tunnel
  SSH, mai da internet.
- **`strapi`** + **`strapi-db`** (Postgres) gestiscono il blog. Anche qui,
  porta bindata su `127.0.0.1`: il frontend non ci parla direttamente, passa
  dal proxy `/api/strapi` di Express (che allega il token server-side).
- **Traefik** (esterno a questo repo, gira sul VPS) termina TLS per
  `capperificiocaro.com` / `www.capperificiocaro.com` e instrada verso il
  container `frontend`, unica porta 127.0.0.1:3001 esposta con label Traefik.

## Perché Express dentro al container `frontend` (e non un servizio a parte)

`Dockerfile` fa un build multi-stage: stage 1 builda il bundle Vite, stage 2
mette insieme nginx + Node nello stesso container runtime, avviati da
`docker-entrypoint.sh`. Nginx serve i file statici e fa da reverse proxy verso
Express in locale (`127.0.0.1:3001`, non esposto fuori dal container). Questo
tiene un solo container pubblico invece di due, e nginx fa già da TLS/caching
layer davanti a Express.

## Flusso dati principali

- **Catalogo/carrello**: il browser parla direttamente con Shopware Store API
  tramite `@shopware/api-client` (vedi [frontend.md](./frontend.md) e
  [shopware.md](./shopware.md)), passando dal proxy nginx `/store-api`.
- **Checkout/pagamento**: il browser non crea mai l'ordine da solo. Chiama
  `/api/checkout/*` su Express, che ricalcola il totale dal carrello reale su
  Shopware, crea il PaymentIntent Stripe, e solo dopo verifica del pagamento
  crea l'ordine via Admin API. Dettagli in [backend-api.md](./backend-api.md).
- **Blog**: il browser chiama `/api/strapi/articles*` (mai Strapi
  direttamente); Express fa da proxy autenticato e whitelista solo le rotte
  `articles`.
- **Post-ordine**: un poller interno a Express controlla ogni 2 minuti lo
  stato ordini su Shopware (spedito/cancellato) per inviare email via Resend,
  e crea spedizioni Packlink in background dopo ogni ordine pagato.

## Dove sono le "sorgenti di verità"

- **Prodotti, prezzi, stock, spedizioni, clienti** → Shopware admin (non nel
  codice). Il frontend legge sempre dati live dalla Store API.
- **Rotte valide della SPA** → `src/App.jsx` **e** la `map $uri $is_spa_route`
  in `nginx.conf` devono restare allineate: nginx usa quella mappa per decidere
  se un path sconosciuto è una rotta client-side valida (200 → shell React) o
  un vero 404. Se aggiungi una rotta in `App.jsx` senza aggiornare `nginx.conf`,
  quella pagina risponde 404 anche se il componente esiste.
- **Contenuto blog** → Strapi (content type `Article`, vedi
  [strapi.md](./strapi.md)).
- **Dati legali azienda** (ragione sociale, P.IVA, indirizzo) → `src/data/company.js`,
  fonte unica per footer, pagine legali e JSON-LD.
