# Frontend Map — React Components, Hooks, Pages

## Routing (`src/App.jsx`)

| Route | Componente | Note |
|-------|-----------|------|
| `/` | `HomePage` | Hero, slider prodotti, blog preview |
| `/product/:slug` | `ProductPage` | Dettaglio prodotto, varianti |
| `/collections/:slug` | `CollectionPage` | Griglia prodotti per categoria |
| `/cart` | `CartPage` | Riepilogo carrello |
| `/checkout` | `CheckoutPage` | Stripe Payment Element |
| `/account` | `AccountPage` | Login / Register / Ordini |
| `/account/login` | `AccountPage` | |
| `/account/register` | `AccountPage` | |
| `/b2b` | `B2BPage` | Landing B2B |
| `/blog` | `BlogPage` | Lista articoli Strapi |
| `/blog/:slug` | `BlogArticlePage` | Articolo singolo Strapi |
| `/storia` | `AboutPage` | Brand story con GSAP ScrollTrigger |
| `/test-a`, `/test-b` | `TestPageA/B` | Demo View Transitions (no layout) |

**Layout:** tutte le route (eccetto test) sono wrappate in `<Layout>` che include `Header` + `Footer`.

## Componenti (`src/components/`)

| Componente | Responsabilità |
|-----------|---------------|
| `Layout/Header` | Nav, logo, icone cart/account, drawer menu |
| `Layout/Footer` | Link, newsletter, social |
| `Layout/Layout` | Wrapper con Outlet |
| `Layout/Newsletter` | Form iscrizione newsletter |
| `Layout/ShippingBar` | Barra spedizione gratuita |
| `Hero/Hero` | Hero homepage con immagine fullscreen |
| `ProductCard/ProductCard` | Card prodotto (griglia) |
| `ProductDetail/ProductDetail` | Dettaglio prodotto completo |
| `ProductSlider/ProductSlider` | Slider orizzontale prodotti |
| `CartDrawer/CartDrawer` | Drawer laterale carrello |
| `AuthDrawer/AuthDrawer` | Drawer login/register |
| `AboutSection/AboutSection` | Sezione about homepage |
| `BlogGrid/BlogGrid` | Griglia articoli blog |
| `CategoryBanner/CategoryBanner` | Banner categoria con immagine |
| `FilterTags/FilterTags` | Tag filtro per collezioni |
| `GuidesEditorial/GuidesEditorial` | Sezione editoriale guide |
| `Marquee/Marquee` | Testo scorrevole infinito |
| `SectionHeader/SectionHeader` | Header di sezione (titolo + link) |
| `ShopFilter/ShopFilter` | Filtri avanzati per shop |
| `StorySlider/StorySlider` | Slider brand story con GSAP |
| `AnimateIn` | HOC animazione entrata scroll |
| `Icons` | SVG icon set centralizzato |
| `ScrollToTop` | Reset scroll su navigazione |
| `checkout/StripePaymentForm` | Form pagamento Stripe Elements |

**Pattern CSS:** ogni componente usa `<Name>.module.css` (CSS Modules, classi locali).

## Hooks (`src/hooks/`)

### `useCart` → espone:
```js
{ cart, loading, error, itemCount, totalPrice, positionPrice,
  fetchCart, addItem, updateQuantity, removeItem,
  optimisticMerge, mergeUpdate, removeItems, clearCart }
```
- `optimisticMerge(primaryId, newQty, duplicateIds)` — aggiorna UI istantaneamente senza API
- `mergeUpdate(primaryId, newQty, duplicateIds)` — sincronizza con server (debounced)
- `mutateCart(apiFn)` — helper interno: usa la risposta Shopware come nuovo stato cart

### `useCustomer` → espone:
```js
{ customer, loading, error, isLoggedIn,
  fetchCustomer, login, logout, register }
```

### `useProducts(options)` → espone:
```js
{ products, total, loading, error }
// options: { page, limit, filters, sort, categoryId }
```

### `useBlogPosts(options)` → articoli Strapi
### `useBlogPost(slug)` → articolo singolo Strapi

### `useDrawerDrag` — drag-to-dismiss stile Vaul per drawer mobile
### `useInView` — IntersectionObserver per animazioni scroll
### `useSEO` — gestione meta tag dinamici
### `useViewTransitionNavigate` — navigate con View Transitions API

## Context (`src/context/ShopwareContext.jsx`)

```jsx
// Due context separati per evitare re-render inutili
<CustomerContext.Provider value={{ ...customerState, isB2B }}>
  <CartContext.Provider value={cartState}>
    {children}
  </CartContext.Provider>
</CustomerContext.Provider>
```

```js
// Import nei componenti
import { useCartContext, useCustomerContext } from 'src/context/ShopwareContext';

const { cart, addItem, itemCount } = useCartContext();
const { customer, isLoggedIn, isB2B, login } = useCustomerContext();
```

**`isB2B`:** `true` se `customer.group.name === VITE_B2B_GROUP_NAME` (default: 'B2B')

## Utility (`src/lib/utils/`)

```js
// image.js — costruisce URL immagine da oggetto Shopware media
getImageUrl(media, { width, height })  // usa thumbnails se disponibili

// price.js — formattazione prezzi
formatPrice(amount, currency='EUR')    // → "12,50 €"
```

## CSS Modules — convenzioni

- Classi locali: `.container`, `.title`, `.card`
- File: `ComponentName.module.css` nella stessa cartella del componente
- Animazioni globali: `src/styles/animations.module.css`
- Global reset/font: `src/styles/global.css`

## GSAP + ScrollTrigger

Usato in `StorySlider` e `AboutPage` (`/storia`).
Import: `import gsap from 'gsap'; import { ScrollTrigger } from 'gsap/ScrollTrigger';`
Registrazione: `gsap.registerPlugin(ScrollTrigger);`
