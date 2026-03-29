# Checklist Go-Live — Capperificio Ecommerce

> Stato: **Feature branch `feature/shopware-integration`** — da mergiare su `main` e deployare su Vercel.
> Stack: React 19 + Vite · Shopware 6 (headless) · Strapi (blog) · Stripe + PayPal · Vercel

---

## 0. Prima di tutto — Prerequisiti tecnici

- [ ] Merge `feature/shopware-integration` → `main` (risolvi eventuali conflitti)
- [ ] Verifica che tutte le variabili d'ambiente siano configurate su Vercel (Production)
  - `VITE_SHOPWARE_URL`
  - `VITE_SHOPWARE_ACCESS_KEY`
  - `VITE_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY` (server-side Express)
  - `VITE_PAYPAL_CLIENT_ID`
  - `VITE_STRAPI_URL`
- [ ] Shopware: Sales Channel configurato per dominio produzione (non localhost)
- [ ] Stripe: passa da modalità **Test** a **Live** (chiavi live nel pannello Stripe)
- [ ] PayPal: passa da **Sandbox** a **Live** nel developer dashboard
- [ ] Dominio acquistato e puntato su Vercel (DNS propagato)
- [ ] SSL attivo su Vercel (automatico, verifica che sia verde)

---

## 1. SEO — Fondamenta

### 1.1 Meta tags dinamici per pagina

Attualmente `index.html` ha un titolo statico "Sunrise Coffee Co" e nessun meta description.
Installa `react-helmet-async` e aggiungi SEO head per ogni pagina:

```bash
npm install react-helmet-async
```

**Pagine da coprire con titolo + description + OG tags:**
- [ ] `HomePage` — brand statement + keyword principale (es. "cappelli artigianali italiani")
- [ ] `ProductPage` — nome prodotto + descrizione breve + prezzo (OG)
- [ ] `CollectionPage` — nome collezione + descrizione
- [ ] `BlogArticlePage` — titolo articolo + excerpt + OG image
- [ ] `BlogPage` — "Blog — Capperificio Artigianale"
- [ ] `CartPage` / `CheckoutPage` — `noindex, nofollow`
- [ ] `AccountPage` — `noindex, nofollow`
- [ ] `B2BPage` — titolo dedicato + description per ricerche B2B

**Template minimo per ogni pagina:**
```html
<title>{nomeProdotto} — Capperificio | Cappelli Artigianali Italiani</title>
<meta name="description" content="..." />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta property="og:url" content="https://tuodominio.it/..." />
<meta property="og:type" content="product" /> <!-- o article per blog -->
<link rel="canonical" href="https://tuodominio.it/..." />
```

### 1.2 Structured Data (JSON-LD)

- [ ] **Product schema** su `ProductPage` (nome, prezzo, disponibilità, immagine, brand, SKU)
- [ ] **BreadcrumbList** su Product + Collection page
- [ ] **Article schema** su `BlogArticlePage`
- [ ] **Organization schema** in `index.html` (una volta sola, globale)
- [ ] **WebSite schema** con SearchAction per sitelinks search box Google

**Esempio Product schema minimo:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{{nomeProdotto}}",
  "image": ["{{url_immagine}}"],
  "description": "{{descrizione}}",
  "brand": { "@type": "Brand", "name": "Capperificio" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "EUR",
    "price": "{{prezzo}}",
    "availability": "https://schema.org/InStock",
    "url": "{{url_prodotto}}"
  }
}
```

### 1.3 Sitemap XML

L'app è una SPA — Vite non genera sitemap automaticamente.
- [ ] Installa `vite-plugin-sitemap` oppure genera sitemap lato server Express
- [ ] Includi: tutte le pagine statiche + URL prodotti (da Shopware API) + URL collezioni + articoli blog
- [ ] Registra sitemap su **Google Search Console** e **Bing Webmaster Tools**
- [ ] Aggiorna sitemap automaticamente ad ogni deploy (script o webhook)

### 1.4 robots.txt

- [ ] Crea `sunrise-coffee/public/robots.txt`:
```txt
User-agent: *
Allow: /
Disallow: /checkout
Disallow: /cart
Disallow: /account

Sitemap: https://tuodominio.it/sitemap.xml
```

### 1.5 Internazionalizzazione SEO

- [ ] `<html lang="it">` in `index.html` (ora è `lang="en"`)
- [ ] Se hai versioni multilingua: hreflang tags
- [ ] URL in italiano: `/collezioni/` invece di `/collections/`, `/prodotto/` invece di `/product/`

### 1.6 Performance SEO (Core Web Vitals)

- [ ] **LCP** — immagine hero con `loading="eager"` + `fetchpriority="high"`, non lazy
- [ ] **CLS** — dimensioni fisse su tutte le immagini prodotto (`width` + `height` espliciti)
- [ ] **INP** — evita re-render pesanti al click, verifica con Lighthouse
- [ ] Font Google: già con `preconnect`, verifica `display=swap` (già presente ✓)
- [ ] Immagini prodotto: usa **WebP** su Shopware (configura il media handler)
- [ ] Verifica con **PageSpeed Insights** su mobile — target score > 80

---

## 2. SEO — Contenuti e Architettura

- [ ] Keyword research assegna una keyword primaria per pagina
- [ ] Testi prodotto su Shopware: almeno 150 parole, keyword naturale, no duplicate content
- [ ] Naming URL prodotti su Shopware: slug SEO-friendly (es. `cappello-fedora-lana-grigio`)
- [ ] Alt text obbligatorio su tutte le immagini prodotto (configuralo in Shopware)
- [ ] Evita contenuto duplicato: se stessa variante su più URL, usa canonical
- [ ] Blog: almeno 1 articolo/settimana per segnali di freschezza a Google
- [ ] Internal linking: dai prodotti al blog correlato e viceversa

---

## 3. Tracciamento — Google Tag Manager

### 3.1 Setup GTM

- [ ] Crea account GTM su tagmanager.google.com — ottieni **GTM-XXXXXXX**
- [ ] Aggiungi snippet GTM in `index.html`:
  - Script nel `<head>` (dopo `<meta charset>`)
  - `<noscript>` iframe subito dopo `<body>`
- [ ] Collega GTM a **Google Analytics 4** (tag GA4 con Measurement ID `G-XXXXXXXXXX`)
- [ ] Configura **Enhanced Measurement** in GA4 (scroll, outbound click, file download, video)

### 3.2 DataLayer — Ecommerce Events

Crea un hook `useGTM.js` o utility `gtm.js` per pushare eventi nel dataLayer:

```js
// utils/gtm.js
export const gtmPush = (event) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
};
```

**Eventi obbligatori da implementare:**

| Evento | Dove | Dati |
|--------|------|------|
| `view_item` | `ProductPage` al mount | product id, name, price, category |
| `add_to_cart` | Click "Aggiungi al carrello" | product, quantity, price |
| `remove_from_cart` | Rimozione da CartDrawer/CartPage | product |
| `view_cart` | Apertura CartDrawer o /cart | lista prodotti, valore totale |
| `begin_checkout` | Click "Vai al checkout" | lista prodotti |
| `add_shipping_info` | Step indirizzo completato | shipping method |
| `add_payment_info` | Selezione metodo pagamento | payment_type |
| `purchase` | Ordine confermato (dopo Stripe success) | transaction_id, revenue, items |
| `view_item_list` | `CollectionPage` / homepage slider | lista prodotti visibili |

- [ ] Implementa tutti gli eventi sopra nel codice React
- [ ] Verifica in GTM Preview Mode che gli eventi arrivino correttamente
- [ ] Pubblica container GTM dopo validazione

### 3.3 Google Analytics 4

- [ ] Crea proprietà GA4 — collega a GTM
- [ ] Configura Conversioni in GA4: segna `purchase` come conversione principale
- [ ] Collega **Google Search Console** a GA4 per dati organici
- [ ] Configura **Audience** per remarketing (utenti che hanno visto prodotti, abbandonato carrello)
- [ ] Verifica DebugView in GA4 in tempo reale

### 3.4 Google Ads (se applicabile)

- [ ] Tag di conversione Google Ads per `purchase`
- [ ] Remarketing tag (già coperto da GA4 Audience se collegato)
- [ ] Dynamic Remarketing: passa `ecomm_prodid`, `ecomm_pagetype`, `ecomm_totalvalue`

### 3.5 Meta Pixel (Facebook/Instagram)

- [ ] Installa Meta Pixel via GTM (tag Custom HTML)
- [ ] Eventi standard: `ViewContent` (ProductPage), `AddToCart`, `InitiateCheckout`, `Purchase`
- [ ] Configura **Conversions API** lato server per iOS 14+ (passa da Express server)
- [ ] Verifica con **Meta Pixel Helper** Chrome extension

### 3.6 Stripe — Pagina di conferma ordine

- [ ] Dopo pagamento Stripe riuscito: redirect a `/order-confirmation?order_id=XXX`
- [ ] Crea pagina `OrderConfirmationPage` che:
  - Legge `order_id` da query params
  - Chiama Shopware per dettagli ordine
  - Pusha evento `purchase` nel dataLayer con transaction_id reale
- [ ] Aggiungi route in `App.jsx`: `<Route path="/order-confirmation" .../>`

---

## 4. Cookie Banner e GDPR

### 4.1 Cookie Consent (obbligatorio per legge in Italia/UE)

- [ ] Scegli soluzione: **Cookiebot** (più completo, a pagamento) o **Osano** o implementazione custom
- [ ] Oppure usa libreria open source: `react-cookie-consent` o `vanilla-cookieconsent`
- [ ] Il banner deve comparire al primo accesso, PRIMA di caricare GTM/GA4/Meta Pixel
- [ ] Categorie cookie minime:
  - **Necessari** (sempre attivi): carrello, sessione Shopware, autenticazione
  - **Statistiche/Analytics**: Google Analytics — consenso richiesto
  - **Marketing**: Meta Pixel, Google Ads — consenso richiesto
- [ ] GTM configurato con **Consent Mode v2** (Google richiede questo dal 2024):
  - `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`
  - Default: tutto `denied`
  - Update: `granted` solo se utente accetta

**Consent Mode v2 snippet (va in `<head>` PRIMA di GTM):**
```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 500
  });
</script>
```

### 4.2 Privacy Policy e Cookie Policy

- [ ] Crea pagina `/privacy-policy` con testo legale conforme GDPR
  - Titolare del trattamento, DPO (se necessario)
  - Elenco di tutti i cookie usati (GA4, Meta Pixel, Stripe, Shopware)
  - Diritti dell'interessato (accesso, cancellazione, portabilità)
- [ ] Crea pagina `/cookie-policy` (può essere integrata nella privacy policy)
- [ ] Link a Privacy Policy in Footer (già presente?) — verifica sia cliccabile
- [ ] Link a Cookie Policy nel banner cookie
- [ ] **Termini e Condizioni di vendita** — pagina `/termini-condizioni`
- [ ] **Diritto di recesso** — obbligatorio per ecommerce UE (14 giorni)
- [ ] Aggiorna route in `App.jsx` per le nuove pagine legali

### 4.3 GDPR — Dati utente

- [ ] Form registrazione: checkbox consenso privacy (non pre-spuntata)
- [ ] Form newsletter: consenso esplicito con link a privacy policy
- [ ] Form B2B: idem
- [ ] Shopware: configura conservazione dati (data retention policy)
- [ ] Non inviare dati personali a terze parti senza consenso

---

## 5. Performance e Accessibilità

- [ ] **Lighthouse audit** completo su tutte le pagine principali — target 90+ su desktop
- [ ] **Lazy loading** immagini: `loading="lazy"` su tutte le immagini tranne hero e above-the-fold
- [ ] Code splitting: verifica che Vite generi chunk separati per pagine pesanti
- [ ] **Favicon** aggiornato con logo Capperificio (attualmente mancante in `index.html`)
- [ ] **Apple Touch Icon** e icone PWA in `public/`
- [ ] Accessibilità: tutti i bottoni hanno `aria-label`, immagini hanno `alt`, focus visibile
- [ ] `lang="it"` in `<html>` (vedi punto 1.5)
- [ ] Open Graph image di fallback (1200x630px) per condivisioni social

---

## 6. Funzionalità ecommerce — Verifica finale

- [ ] **Flusso acquisto completo** testato end-to-end: aggiungi prodotto → carrello → checkout → pagamento Stripe → conferma
- [ ] **PayPal flow** testato con credenziali live
- [ ] **Registrazione e login** cliente funzionante
- [ ] **Storico ordini** in Account page
- [ ] **Email transazionali** Shopware configurate:
  - Conferma ordine (con dettaglio prodotti)
  - Conferma pagamento
  - Spedizione (con tracking)
  - Registrazione nuovo cliente
- [ ] **Email mittente**: non usare noreply@shopware.com — configura SMTP reale (es. SendGrid, Mailgun)
- [ ] **Gestione stock**: prodotti esauriti mostrano "Non disponibile" e non si possono aggiungere al carrello
- [ ] **IVA e prezzi**: verifica che i prezzi includano IVA correttamente (configurazione Shopware tax rule)
- [ ] **Metodi di spedizione**: almeno uno configurato con costo corretto
- [ ] **Paesi di spedizione**: Italia obbligatoria, altri EU se applicabile

---

## 7. Error Handling e Monitoring

- [ ] Installa **Sentry** per error tracking frontend:
  ```bash
  npm install @sentry/react
  ```
  - Cattura errori JavaScript + React component errors
  - Integra con Sentry DSN
- [ ] **Pagina 404** personalizzata (attualmente non esiste una route catch-all)
- [ ] **Pagina 500 / errore generico** per fallback
- [ ] Vercel: configura alert email su errori di build/deploy
- [ ] Verifica che errori API Shopware vengano gestiti con messaggi user-friendly (no "undefined" o stack trace)

---

## 8. Deploy e CI/CD

- [ ] Verifica `vercel.json` per rewrites SPA (necessario per React Router):
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- [ ] Preview deploys su PR attivi (già configurato con Vercel GitHub integration?)
- [ ] Branch `main` = produzione, `develop` = staging
- [ ] **Environment separation**: variabili Shopware/Stripe diverse per staging vs production
- [ ] Test build locale prima del merge: `npm run build && npm run preview`

---

## 9. Post-lancio — Primi 30 giorni

- [ ] **Google Search Console**: verifica proprietà, invia sitemap, monitora copertura
- [ ] **Google Analytics 4**: verifica che i dati arrivino correttamente
- [ ] **Bing Webmaster Tools**: registra sito
- [ ] Controlla **Core Web Vitals** in Search Console dopo 28 giorni di dati
- [ ] Verifica che non ci siano **errori di crawl** (pagine bloccate, redirect loops)
- [ ] **Testa da mobile** su dispositivi reali (non solo emulatore)
- [ ] Controlla che il cookie banner funzioni e che il rifiuto blocchi davvero GTM/analytics
- [ ] Prima transazione reale: verifica che `purchase` event arrivi in GA4 e Stripe dashboard

---

## Priorità suggerita

| Priorità | Attività |
|----------|----------|
| **BLOCCANTE** | Variabili env produzione · Stripe/PayPal live · Dominio + SSL · Shopware Sales Channel |
| **Alta** | Cookie banner + Consent Mode v2 · Meta tags + canonical · robots.txt · pagine legali |
| **Media** | GTM + GA4 events · Structured data · Sitemap · `lang="it"` |
| **Normale** | Sentry · 404 page · Performance audit · OrderConfirmation page |
| **Post-lancio** | Blog content · GSC monitoring · A/B test · Remarketing audience |

---

*Documento creato: 2026-03-29 — Aggiornare man mano che le attività vengono completate.*
