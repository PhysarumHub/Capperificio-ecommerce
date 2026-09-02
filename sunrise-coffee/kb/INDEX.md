# Knowledge base — Capperificio di Racale (sunrise-coffee)

Punto d'ingresso per orientarsi nel progetto. Ogni file qui dentro copre un'area
specifica; leggi prima questo indice per capire dove trovare cosa.

## Cos'è il progetto

E-commerce headless per **Capperificio di Racale** (brand di FARM & TECH AGRICOLA
S.r.l.s.), dominio `capperificiocaro.com`. Stack:

- **Frontend**: React 19 + Vite, SPA client-side (react-router-dom), niente SSR.
- **Commerce backend**: Shopware 6 (headless, Store API + Admin API).
- **CMS blog**: Strapi 5, non esposto pubblicamente (proxato dal backend Express).
- **Backend pagamenti**: Express (`server.js`), unico processo Node lato server,
  gestisce Stripe, invio email, spedizioni, sitemap dinamica.
- **Deploy**: Docker Compose su VPS, nginx come reverse proxy interno,
  Traefik davanti per TLS/routing dominio.

## File in questa cartella

| File | Contenuto |
|---|---|
| [architecture.md](./architecture.md) | Vista d'insieme dei servizi, come comunicano, chi è pubblico e chi no |
| [frontend.md](./frontend.md) | Struttura `src/`: routing, componenti, hook, stato (carrello/cliente) |
| [backend-api.md](./backend-api.md) | `server.js`: endpoint checkout, webhook Stripe, rimborsi, sitemap |
| [shopware.md](./shopware.md) | Store API vs Admin API, context token, variabili d'ambiente |
| [strapi.md](./strapi.md) | Blog CMS: content type Article, proxy `/api/strapi`, immagini |
| [deploy.md](./deploy.md) | Docker Compose, variabili `.env`, Traefik, comandi operativi |
| [security.md](./security.md) | Superficie esposta, secret, rate limiting, header di sicurezza |
| [scripts.md](./scripts.md) | Catalogo degli script one-off in `scripts/` (setup, audit, backup) |

## Convenzioni rapide

- Tutte le variabili con prefisso `VITE_` finiscono nel bundle JS **pubblico**:
  mai metterci un segreto. I segreti veri (chiavi Stripe `sk_`, token Strapi,
  credenziali Admin API Shopware) sono solo lato server, lette da `server.js`.
- Il carrello Shopware vive in un `sw-context-token` (cookie), gestito da
  `src/lib/shopware-client.js`. Il server non si fida mai del totale mandato
  dal client: lo ricalcola sempre dal carrello reale prima di creare un
  PaymentIntent o un ordine.
- Non esiste un pannello admin custom in questo repo: l'unica azione
  "amministrativa" lato server è `POST /api/admin/refund`, protetta da un
  secret header (`ADMIN_API_KEY`), non da login.
- Gestione prodotti/catalogo, prezzi, spedizioni e clienti avviene **in
  Shopware admin**, non nel codice frontend: il codice legge sempre dati live
  dalla Store API, non ha un catalogo statico salvo `src/data/capperificioCatalog.*`
  (dati di fallback/seed, verificane l'uso reale prima di considerarli fonte di verità).
