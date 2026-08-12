# Architettura — Capperificio E-commerce

## Stack

| Layer | Tecnologia | Note |
|-------|-----------|------|
| Frontend | React 19 + Vite 7 | SPA, CSS Modules, React Router 7 |
| Shopware | Shopware 6 (dockware/dev) | Backend headless, Store API |
| Blog CMS | Strapi v5 (node:20-alpine) | PostgreSQL 16 |
| Pagamenti | Stripe (Payment Element) | Express proxy per Stripe secret |
| Animazioni | GSAP 3 + ScrollTrigger | StorySlider, AboutPage |
| Deploy | Docker Compose + nginx + Traefik | VPS self-hosted, no serverless |

## Servizi Docker

```yaml
capperificio-shopware    → dockware/dev:latest
capperificio-frontend    → nginx (build React)
capperificio-strapi      → node:20-alpine
capperificio-strapi-db   → postgres:16-alpine
```

## Porte

| Porta | Servizio |
|-------|---------|
| 5173 | Vite dev server |
| 3001 | Frontend prod (nginx) / Express Stripe backend dev |
| 8090 | Shopware HTTP |
| 8453 | Shopware HTTPS |
| 8891 | Adminer (DB) |
| 9998 | Mailcatcher |
| 1337 | Strapi CMS |

## Variabili d'ambiente (.env)

```env
# Shopware
VITE_SHOPWARE_API_URL=http://localhost:8090/store-api
VITE_SHOPWARE_ACCESS_KEY=SWSC...

# B2B
VITE_B2B_CATEGORY_ID=<uuid>
VITE_B2B_GROUP_NAME=B2B

# Strapi
STRAPI_DB_PASSWORD=
STRAPI_APP_KEYS=key1,key2,key3,key4
STRAPI_API_TOKEN_SALT=
STRAPI_ADMIN_JWT_SECRET=
STRAPI_JWT_SECRET=
STRAPI_URL=http://localhost:1337
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_TOKEN=

# Stripe
STRIPE_SECRET_KEY=sk_...
VITE_STRIPE_PUBLIC_KEY=pk_...
```

> Le variabili `VITE_*` vengono embedded nel bundle Vite al build time.

## Vite Proxy (sviluppo)

```js
// vite.config.js
'/store-api' → http://localhost:8080   // Shopware
'/api'       → http://localhost:3001   // Express backend
'/media'     → http://localhost:8080
'/thumbnail' → http://localhost:8080
```

## Struttura cartelle

```
sunrise-coffee/
├── src/
│   ├── lib/
│   │   ├── shopware-client.js     # createAPIClient + helper storeApiPost/Get/Patch/Delete
│   │   ├── api/
│   │   │   ├── products.js        # getProducts, getProductBySlug, getProductsByCategory, searchProducts, getProductVariants
│   │   │   ├── cart.js            # getCart, addToCart, updateCartItem, removeCartItem, deleteCart
│   │   │   ├── checkout.js        # getPaymentMethods, getShippingMethods, updateContext, placeOrder
│   │   │   ├── customer.js        # login, logout, register, getCustomer, getOrders, getCountries, getSalutations, submitReview
│   │   │   └── categories.js      # getCategories, getNavigation, getCategoryBySlug
│   │   └── utils/
│   │       ├── image.js           # helper URL immagini Shopware
│   │       └── price.js           # formattazione prezzi
│   ├── context/
│   │   └── ShopwareContext.jsx    # CartContext + CustomerContext (ShopwareProvider)
│   ├── hooks/                     # vedi frontend-map.md
│   ├── components/                # vedi frontend-map.md
│   ├── pages/                     # vedi frontend-map.md
│   └── styles/
│       ├── global.css
│       └── animations.module.css
├── scripts/                       # vedi shopware-setup.md
├── strapi/                        # vedi strapi.md
├── server.js                      # Express — solo endpoint Stripe
├── docker-compose.yml
├── nginx.conf
└── kb/                            # questa knowledge base
```

## Comandi npm

```bash
npm run dev      # Express (3001) + Vite (5173) in parallelo
npm run build    # build produzione → dist/
npm run preview  # anteprima build
npm run backup   # backup Shopware (scripts/backup-shopware.sh)
npm run restore  # restore Shopware
```

## Context token (sw-context-token)

Shopware usa un context token salvato in cookie `sw-context-token` (365 giorni, SameSite=Lax).
Il client lo aggiorna automaticamente via hook `onContextChanged`.
Gestisce sessione carrello e utente in un unico token.
