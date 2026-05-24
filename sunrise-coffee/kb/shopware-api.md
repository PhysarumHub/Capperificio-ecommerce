# Shopware Store API — Reference

## Client (`src/lib/shopware-client.js`)

```js
import { storeApiPost, storeApiGet, storeApiPatch, storeApiDelete } from 'src/lib/shopware-client';
```

Tutti i metodi wrappano `apiClient.invoke()` e restituiscono `data` (senza il wrapper `{ data }`).
Il context token viene gestito automaticamente via cookie.

## Endpoints per modulo

### Products (`src/lib/api/products.js`)

```js
// Lista prodotti
getProducts({ page=1, limit=24, filters=[], sort=[] })

// Dettaglio per ID/slug/seoUrl/productNumber (prova nell'ordine)
getProductBySlug(slug)

// Prodotti per categoria
getProductsByCategory(categoryId, { page, limit, sort })

// Varianti di un prodotto configurabile
getProductVariants(parentId)

// Ricerca full-text
searchProducts(term, { page, limit })
```

**Associazioni incluse di default in getProductBySlug:**
`cover, media, seoUrls, categories, properties, configuratorSettings, crossSellings`

**Includes di default (campi restituiti):**
`id, name, description, translated, calculatedPrice, cover, media, seoUrls, categories, properties, configuratorSettings, crossSellings, customFields, availableStock`

### Cart (`src/lib/api/cart.js`)

```js
getCart()                                    // GET /checkout/cart
addToCart(productId, quantity=1)             // POST /checkout/cart/line-item
updateCartItem(lineItemId, quantity)         // PATCH /checkout/cart/line-item
removeCartItem(lineItemId)                   // DELETE /checkout/cart/line-item?ids[]=<id>
deleteCart()                                 // DELETE /checkout/cart
```

> Shopware restituisce il carrello aggiornato su ogni mutazione — non serve un secondo getCart().

### Checkout (`src/lib/api/checkout.js`)

```js
getPaymentMethods()          // POST /payment-method { onlyAvailable: true }
getShippingMethods()         // POST /shipping-method { onlyAvailable: true }
updateContext(data)          // PATCH /context  — imposta paymentMethodId / shippingMethodId
placeOrder()                 // POST /checkout/order
```

**Flow checkout:**
1. `updateContext({ paymentMethodId, shippingMethodId })`
2. `placeOrder()` → ricevi orderId
3. Per Stripe: crea PaymentIntent lato server, poi conferma nel frontend

### Customer (`src/lib/api/customer.js`)

```js
login(email, password)         // POST /account/login
logout()                       // POST /account/logout
register(data)                 // POST /account/register  (pass { guest: true } per guest)
getCustomer()                  // POST /account/customer + associations: { group: {} }
getOrders({ page, limit })     // POST /order — include lineItems, deliveries, transactions
getCountries()                 // POST /country — paginato 100×3 pagine in parallelo
getSalutations()               // GET  /salutation
submitReview(productId, { title, content, points })
```

**B2B check:** `customer.group.name === 'B2B'` (configurabile via `VITE_B2B_GROUP_NAME`)

### Categories (`src/lib/api/categories.js`)

```js
getCategories()                    // POST /category { limit: 100, associations: { seoUrls, media } }
getNavigation(rootId='main-navigation')  // POST /navigation/:id/:id { depth: 3 }
getCategoryBySlug(slug)            // POST /category — filter su seoUrls.seoPathInfo
```

## Sintassi filtri Shopware

```js
// Equals
{ type: 'equals', field: 'id', value: 'abc123' }

// Contains (substring)
{ type: 'contains', field: 'seoUrls.seoPathInfo', value: slug }

// Multi (OR / AND)
{ type: 'multi', operator: 'OR', queries: [ ...filtri ] }

// Range
{ type: 'range', field: 'stock', parameters: { gt: 0 } }
```

## Sintassi sort

```js
sort: [{ field: 'name', order: 'ASC' }]
sort: [{ field: 'createdAt', order: 'DESC' }]
```

## Associations — pattern ricorsivo

```js
associations: {
  cover: {
    associations: {
      media: {
        associations: { thumbnails: {} }
      }
    }
  }
}
```

## Includes — riduce payload

```js
includes: {
  product: ['id', 'name', 'calculatedPrice', 'cover'],
  media: ['url', 'thumbnails'],
}
```

## Errori comuni

| Errore | Causa | Fix |
|--------|-------|-----|
| 401 Unauthorized | Access key errata o mancante | Verifica `VITE_SHOPWARE_ACCESS_KEY` |
| 403 | Sales channel non ha il paese abilitato | Esegui `scripts/fix-sales-channels-countries.py` |
| context token perso | Cookie scaduto/cancellato | Il client riprende automaticamente |
| Prodotto non trovato per slug | Nessuna seoUrl configurata | Usa UUID diretto, oppure configura SEO in admin |

## Custom Fields

Acceduti via `product.customFields.<nome_campo>`.
Configurati con `scripts/setup-custom-fields.py` o via Shopware Admin > Settings > Custom Fields.

## Store API vs Admin API

| | Store API | Admin API |
|-|----------|----------|
| Auth | Access Key (SWSC...) | Bearer token (oauth) |
| Base URL | `/store-api` | `/api` |
| Uso | Frontend cliente | Script setup/admin |
| Client | `@shopware/api-client` | fetch diretto con token |

Gli script in `scripts/` usano direttamente l'Admin API con credenziali admin.
