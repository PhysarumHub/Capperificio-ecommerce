# Capperificio E-commerce — Knowledge Base

> Carica solo i file che servono per il task corrente. Ogni file è autonomo.

## File disponibili

| File | Quando caricarlo |
|------|-----------------|
| [architecture.md](architecture.md) | Stack, porte, env vars, struttura Docker |
| [shopware-api.md](shopware-api.md) | Store API endpoints, filtri, body shapes — lavoro lato Shopware |
| [frontend-map.md](frontend-map.md) | Componenti, pagine, hooks, routing — lavoro lato codice React |
| [shopware-setup.md](shopware-setup.md) | Script admin, configurazione Shopware, B2B, custom fields |
| [payments.md](payments.md) | Stripe, PayPal — flow checkout e backend Express |
| [strapi.md](strapi.md) | Blog CMS Strapi v5, API blog, hooks useBlogPosts |

## Snapshot rapido

**Progetto:** Headless e-commerce capperi (Capperificio Caro)
**Stack:** React 19 + Vite 7 → Shopware 6 (Store API) + Strapi v5 (blog)
**Branch attivo:** `feature/shopware-integration`
**Dev:** `npm run dev` → http://localhost:5173
**Shopware:** http://localhost:8090/admin (admin / shopware)
**Strapi:** http://localhost:1337/admin

## Pattern chiave

```
src/lib/api/*.js          → funzioni API pure (products, cart, checkout, customer, categories)
src/hooks/use*.js         → React hooks con stato (useCart, useCustomer, useProducts, ...)
src/context/ShopwareContext.jsx  → Provider globale (CartContext + CustomerContext)
src/components/<Name>/<Name>.jsx → ogni componente ha la sua cartella + CSS Module
src/pages/<Name>Page.jsx  → pagine collegate al router
scripts/*.py / *.js       → setup one-shot Shopware (da eseguire una volta)
```
