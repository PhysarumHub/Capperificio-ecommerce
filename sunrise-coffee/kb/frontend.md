# Frontend (`src/`)

React 19 + Vite, SPA client-side con `react-router-dom` v7. Nessun SSR/SSG:
tutta la SEO passa da meta tag dinamici (`useSEO`) e dalla sitemap generata da
Express (vedi [backend-api.md](./backend-api.md)).

## Routing (`src/App.jsx`)

Route eager (caricate subito, sono le landing organiche — home, PDP,
collezione — per non aggiungere un round-trip al miglior LCP): `HomePage`,
`ProductPage` (`/product/:slug`), `CollectionPage` (`/collections/:slug`),
`NotFoundPage`.

Route lazy (code-split, caricate on-demand): carrello, checkout, account, B2B,
pagine legali, contatti/FAQ, newsletter, pagine di test, e le due esperienze
fullscreen GSAP/WebGL (`/territorio` → `Carousel3D`, `/processo-produttivo` →
`CylinderCarousel`) — queste ultime **fuori** dal layout con header/footer.

Ogni rotta qui deve avere un corrispettivo in `nginx.conf` (`$is_spa_route`),
altrimenti nginx la tratta come 404 vero invece di servire la SPA — vedi
[architecture.md](./architecture.md).

## Stato globale: carrello e cliente

`src/context/ShopwareContext.jsx` espone due context separati via
`ShopwareProvider`:

- `useCartContext()` → wraps `src/hooks/useCart.js`
- `useCustomerContext()` → wraps `src/hooks/useCustomer.js`, più un flag
  derivato `isB2B` (confronta `customer.group.name` con `VITE_B2B_GROUP_NAME`,
  default `"B2B"`)

Al mount, se Shopware è configurato (`isShopwareConfigured()`), il provider
carica carrello e cliente in parallelo. Il login/logout invalida e ricarica il
carrello (`onAuthChange: cartState.fetchCart`).

## Client Shopware (`src/lib/shopware-client.js`)

Wrapper su `@shopware/api-client` (SDK ufficiale). Punti chiave:

- Il **context token** (`sw-context-token`) identifica la sessione
  carrello/cliente lato Shopware. Viene letto/scritto da un cookie
  (`js-cookie`, 365 giorni, `SameSite=Lax`) e tenuto anche in memoria
  (`_latestToken`) per essere sempre accurato anche a metà di un giro di
  richieste concorrenti.
- Due hook dell'SDK tengono cookie e stato in sync automaticamente:
  `onContextChanged` e `onSuccessResponse` (quest'ultimo intercetta il
  redirect/patch del token nella risposta anche quando non è un cambio
  esplicito).
- `setContextToken(token)` è usato per **adottare** un token deciso dal
  server: succede nel checkout, dove `server.js` registra il guest e può far
  migrare il carrello su un nuovo token (vedi [backend-api.md](./backend-api.md)).
- `storeApiGet/Post/Patch/Delete` sono helper generici per chiamare
  endpoint Store API custom non coperti da metodi dedicati dell'SDK.

## Checkout (`src/components/checkout/`, `src/hooks/useCheckoutForm.js`, `src/lib/api/checkout.js`)

Pagina unica (`CheckoutPage`), non wizard multi-step a route separate.
Punti da sapere:

- **Il carrello/ordine non viene mai creato dal client.** `src/lib/api/checkout.js`
  chiama solo `/api/checkout/create-intent`, poi `/api/checkout/confirm` (o
  `/confirm-free` per ordini a 0€, es. sconto 100%). L'ordine Shopware nasce
  sempre lato server, dopo verifica del pagamento — vedi
  [backend-api.md](./backend-api.md) per il perché.
- `useCheckoutForm` persiste i valori del form in **`sessionStorage`** (non
  `localStorage`): sono dati personali, devono sparire alla chiusura scheda ma
  sopravvivere a refresh/background su mobile. `clearStorage()` va chiamato a
  ordine concluso.
- Paese preselezionato: **Italia** (`countryIso: 'IT'`) di default — scelta
  esplicita, non dedotta dalla lingua browser (in passato causava spedizioni
  estere/CAP sbagliati per utenti con OS in inglese).
- Precompilazione da cliente loggato (`customer.defaultShippingAddress`)
  **non sovrascrive** campi già scritti a mano dall'utente (login a metà
  checkout non deve cancellare l'indirizzo appena inserito).
- Pagamento tramite **Stripe Payment Element unico** (`StripePaymentForm.jsx`):
  un solo widget copre carta, Apple/Google Pay, Link e altri metodi attivati
  dalla Dashboard Stripe — non ci sono integrazioni separate per wallet.
  PayPal non è integrato (va abilitato, se richiesto, come metodo dentro lo
  stesso Payment Element, non come modulo a parte).

## Prodotti e categorie

`src/hooks/useProducts.js` + `src/lib/api/products.js` e `categories.js`
leggono direttamente dalla Store API (via `shopware-client.js`). Filtri
prodotto lato UI in `src/components/ShopFilter/` e `FilterTags/`.

`src/data/capperificioCatalog.js` / `.json` esiste nel repo come dato
statico — verificane l'uso reale prima di trattarlo come fonte dati primaria:
il catalogo vivo è in Shopware, questo file è probabilmente seed/fallback.

## Contenuto/legale

`src/data/company.js` è la fonte unica per ragione sociale, P.IVA, indirizzo,
contatti — usata da footer, pagine legali (`LegalLayout`, `CompanyData`) e
markup JSON-LD. `LEGAL_LAST_UPDATE` va aggiornata a mano quando cambiano i
testi legali.

## Blog

Le pagine che consumano Strapi chiamano `/api/strapi/articles` (proxy
server-side, vedi [strapi.md](./strapi.md)) — mai l'URL Strapi diretto.

## Struttura cartelle

```
src/
├── components/     # UI riutilizzabile, organizzata per feature/dominio
│   └── checkout/    # form, payment element, riepilogo ordine
├── context/        # ShopwareProvider (cart + customer)
├── data/           # dati statici (company.js, catalogo seed)
├── hooks/          # logica stato/side-effect riutilizzabile
├── lib/
│   ├── api/         # wrapper chiamate Store API / backend Express
│   ├── cylinder/     # dati/shader per l'esperienza WebGL /processo-produttivo
│   ├── carousel3d/   # dati per /territorio
│   ├── utils/        # helper puri (prezzo, spedizione, indirizzo, varianti…)
│   └── shopware-client.js
├── pages/          # una entry per route
└── styles/         # CSS globale + CSS Modules per componente
```
