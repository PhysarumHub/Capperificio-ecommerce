# Strapi (blog CMS)

Strapi 5 (`sunrise-coffee/strapi/`), Postgres come DB. Gestisce solo il blog,
niente a che fare con prodotti/ordini (quelli sono in Shopware).

## Non è esposto a internet

Il container `strapi` bind-a la porta 1337 solo su `127.0.0.1` del VPS
(vedi `docker-compose.yml`). L'admin è raggiungibile solo via tunnel SSH. Il
frontend pubblico non parla mai direttamente con Strapi:

- **Dati articoli**: il browser chiama `/api/strapi/articles*` su Express,
  che fa da proxy whitelisted verso `http://strapi:1337/api/*` (hostname
  interno Docker) allegando `Authorization: Bearer STRAPI_TOKEN` — token che
  non lascia mai il server. Vedi [backend-api.md](./backend-api.md).
- **Immagini cover**: servite via nginx, `location /uploads` → proxy verso
  `strapi:1337` (non passano da Express).

## Content type: `Article`

`strapi/src/api/article/content-types/article/schema.json`:

| Campo | Tipo | Note |
|---|---|---|
| `title` | string, required | |
| `slug` | uid (da `title`), required | usato nell'URL articolo lato frontend |
| `excerpt` | text | riassunto per liste/anteprime |
| `content` | blocks | rich text strutturato (Strapi Blocks editor) |
| `cover` | media (singola immagine) | opzionale |
| `category` | string | libera, non una relazione |

`draftAndPublish: true` → gli articoli hanno stato bozza/pubblicato; solo i
pubblicati devono comparire lato frontend (query Strapi filtrata di
conseguenza, controlla `src/lib/api/*` se aggiungi nuove chiamate).

## Variabili d'ambiente rilevanti

`VITE_STRAPI_URL` — se vuota, il blog è considerato disattivato lato
frontend. `STRAPI_URL` (server, hostname interno `http://strapi:1337`),
`STRAPI_TOKEN` (server-only), `STRAPI_PUBLIC_URL` (solo per raggiungere
l'admin via tunnel SSH, non usato in runtime pubblico). Vedi
`.env.example` sezione "Strapi CMS (blog)".

## Seed/contenuto

`scripts/seed_strapi_articles.py` popola articoli via Admin API/REST Strapi —
vedi [scripts.md](./scripts.md).
