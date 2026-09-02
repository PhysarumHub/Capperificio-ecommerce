# Shopware 6

Commerce backend headless (immagine `dockware/dev` in dev/staging). Gestisce
catalogo, prezzi, stock, carrello, ordini, clienti, spedizioni. Non c'è
nessun pannello admin custom nel repo: tutta la gestione business avviene
nell'admin Shopware stesso.

## Due API, due scopi diversi

- **Store API** (`/store-api`) — pubblica, usata dal browser via
  `@shopware/api-client` ([frontend.md](./frontend.md)) e da `server.js` per
  leggere/modificare il carrello. Autenticata con `sw-access-key` (chiave
  Sales Channel headless, pubblica, `VITE_SHOPWARE_ACCESS_KEY`) + un
  `sw-context-token` per sessione.
- **Admin API** (`/api`) — privata, usata **solo lato server** (`api/_shopware.js`,
  funzioni `adminFetch`/`adminToken`) per: segnare una transazione come
  pagata/rimborsata dopo Stripe, leggere dettagli ordine completi, cercare
  ordini per stato o per `payment_intent_id`, leggere prodotti sotto scorta.
  Autenticata via OAuth (Integration `client_id`/`client_secret`, consigliato)
  o fallback utente/password admin (solo dev). Se non configurata, gli ordini
  vengono comunque creati ma **non** segnati "pagati" (`adminConfigured()`
  false → warning al boot in `server.js`).

## Context token (sessione carrello/cliente)

Identifica un carrello/cliente lato Shopware. Lato browser vive in un cookie
`sw-context-token` (gestito da `shopware-client.js`). Lato server, ogni
funzione in `api/_shopware.js` lo riceve come parametro esplicito — **non**
c'è stato condiviso lato server tra richieste diverse, ogni chiamata è
autocontenuta.

Punti dove il token può cambiare a metà flusso:

- `registerGuestIfNeeded` — quando un guest si registra durante il checkout,
  il carrello può migrare su un nuovo token; il client deve adottarlo
  (`setContextToken`) per continuare a operare sullo stesso carrello.
- Il client SDK aggiorna il cookie automaticamente leggendo l'header
  `sw-context-token` da ogni risposta Store API riuscita.

## `api/_shopware.js` — mappa delle funzioni principali

| Funzione | Cosa fa |
|---|---|
| `swFetch` | fetch generico verso Store API con `contextToken` opzionale |
| `registerGuestIfNeeded` | registra un guest customer se il contesto non ne ha già uno |
| `syncCheckoutAddress` | aggiorna l'indirizzo di fatturazione se differisce da quello salvato |
| `setShippingMethod` | imposta il metodo di spedizione scelto nel carrello |
| `getCartTotal` | totale reale del carrello (fonte di verità per gli importi) |
| `placeOrder` | crea l'ordine da carrello — **chiamata solo da `server.js`** |
| `adminToken` / `adminFetch` | autenticazione e chiamate Admin API |
| `fetchOrderDetails` | dettagli ordine completi (per email, rimborsi, Packlink) |
| `fetchOrdersInDeliveryState` / `fetchOrdersInOrderState` | usate dal poller per rilevare cambi di stato |
| `fetchLowStockProducts` | prodotti sotto soglia stock (alert merchant) |
| `markTransactionPaid` / `markTransactionRefunded` | transizioni di stato pagamento, idempotenti |
| `findOrderByPaymentIntentId` | usata dal webhook `charge.refunded` per risalire all'ordine |
| `savePacklinkReference` | salva il riferimento spedizione Packlink sull'ordine |

## Variabili d'ambiente

Vedi `.env.example`, sezioni "Shopware 6 (browser)" e "Shopware 6 (server)".
Regola generale: `VITE_SHOPWARE_*` finisce nel bundle pubblico (solo dati non
sensibili: URL e access key del Sales Channel headless), le equivalenti
`SHOPWARE_*` senza prefisso sono lette solo da `server.js` e in Docker
puntano all'hostname interno (`http://shopware/store-api`), più veloce e
senza passare da nginx.

## B2B

Non è un modulo separato: è un **customer group** Shopware. Il frontend lo
riconosce confrontando `customer.group.name` con `VITE_B2B_GROUP_NAME`
(default `"B2B"`) in `ShopwareContext.jsx`. `VITE_B2B_CATEGORY_ID` seleziona
la categoria prodotti dedicata mostrata in `B2BPage.jsx`.
