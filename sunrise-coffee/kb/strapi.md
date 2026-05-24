# Strapi v5 — Blog CMS

## Architettura

```
Browser → React hooks (useBlogPosts, useBlogPost)
        → Strapi REST API (http://localhost:1337/api)
        → PostgreSQL 16 (capperificio-strapi-db)
```

Strapi gestisce solo il blog — tutto il resto (prodotti, ordini, utenti) è Shopware.

## Avvio (Docker)

```bash
docker compose up -d strapi strapi-db
```
**Admin Strapi:** http://localhost:1337/admin

## Env vars Strapi

```env
# Lato server (docker-compose)
STRAPI_DB_PASSWORD=
STRAPI_APP_KEYS=key1,key2,key3,key4
STRAPI_API_TOKEN_SALT=
STRAPI_ADMIN_JWT_SECRET=
STRAPI_JWT_SECRET=
STRAPI_URL=http://localhost:1337

# Lato client (Vite)
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_TOKEN=<api-token-readonly>
```

Genera i secret con:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## API Token (Read-only)

1. Admin Strapi > Settings > API Tokens > Create
2. Type: Read-only
3. Copia il token → `VITE_STRAPI_TOKEN`

## REST API Endpoints

```
GET /api/articles?populate=*              # lista articoli
GET /api/articles/:id?populate=*          # articolo per ID
GET /api/articles?filters[slug][$eq]=...  # articolo per slug
```

Headers richiesti:
```
Authorization: Bearer <VITE_STRAPI_TOKEN>
```

## Hooks (`src/hooks/`)

### `useBlogPosts(options)`
```js
const { posts, total, loading, error } = useBlogPosts({ page=1, limit=10 });
```

### `useBlogPost(slug)`
```js
const { post, loading, error } = useBlogPost('nome-articolo');
```

## Content Type — Article

Campi tipici (configurati in Strapi Admin > Content-Types Builder):
```
title       String
slug        String (unique)
content     RichText / Blocks
excerpt     Text
cover       Media (immagine)
publishedAt DateTime
tags        Relation
author      Relation
```

## Seed dati di test

```bash
python scripts/seed_strapi_articles.py
```

Popola Strapi con articoli di esempio sul tema capperi.

## Strapi in locale (senza Docker)

```bash
cd strapi/
npm install
npm run develop    # dev con hot-reload → http://localhost:1337
```

## Struttura cartella `strapi/`

```
strapi/
├── src/
│   ├── api/
│   │   └── article/         # Content type Article
│   └── extensions/
├── config/
│   ├── database.js
│   ├── server.js
│   └── plugins.js
└── package.json
```
