# Enterprise Roadmap — Capperificio E-commerce
> **Audit del:** 2026-06-29 · Branch analizzato: `feature/shopware-integration`
> **Stack:** React 19 + Vite 7 · Express.js · Shopware 6 (headless) · Strapi · Stripe · Docker + nginx

---

## Stato attuale — Punti di forza

Il progetto è già a un livello solido per un MVP, ma mancano le fondamenta per uno stack enterprise:

| Già presente | Stato |
|---|---|
| Pagamento lato server (Stripe, importo verificato server-side) | ✅ |
| Rate limiting sui payment endpoint | ✅ |
| Webhook Stripe fallback (idempotente) | ✅ |
| Email transazionali via Resend (conferma, spedizione, annullo) | ✅ |
| Packlink shipping integration | ✅ |
| Docker multi-stage build | ✅ |
| Security headers (Helmet + nginx) | ✅ |
| Cookie consent con Consent Mode v2 | ✅ |
| Gestione availability varianti | ✅ |
| Shopware Admin API per transizioni ordine | ✅ |

---

## Legenda priorità

| Etichetta | Significato |
|---|---|
| 🔴 **CRITICO** | Blocca il go-live o è una falla di sicurezza attiva |
| 🟠 **ALTO** | Obbligatorio entro le prime 2 settimane dal lancio |
| 🟡 **MEDIO** | Da completare entro il primo mese |
| 🟢 **BASSO** | Ottimizzazioni e nice-to-have |

---

## 1. SICUREZZA

### 1.1 Vulnerabilità infrastrutturali critiche

- [ ] 🔴 **Chiudere Adminer dalla rete pubblica** — porta 8891 (`http://IP:8891`) espone l'intera MySQL di Shopware senza autenticazione robusta. Rimuovere la porta dai `ports:` in `docker-compose.yml` o limitarla con `127.0.0.1:8891:8888` e accedere solo tramite SSH tunnel.
- [ ] 🔴 **Sostituire `dockware/dev:latest` con un'immagine production** — `dockware/dev` include Mailcatcher, Adminer, tool di sviluppo. Usare `dockware/prod:latest` o un'immagine Shopware ufficiale production-ready.
- [ ] 🔴 **Cambiare credenziali di default Shopware** — password `shopware` ancora attiva (admin/shopware). Ruotare immediatamente da `http://IP:8090/admin → My Profile → Change Password`.
- [ ] 🔴 **Rinnovare la Shopware Access Key** — l'attuale chiave potrebbe essere stata esposta nel git history. Rigenerare da `Shopware Admin → Sales Channels → Headless → API Access → Regenerate`.
- [ ] 🔴 **Bloccare la porta 8090 dal pubblico** — Shopware admin è raggiungibile da qualsiasi IP. Aggiungere firewall regola `ufw deny 8090` e accedere solo via VPN o SSH tunnel.
- [ ] 🔴 **Bloccare la porta 1337 (Strapi) dal pubblico** — l'admin Strapi non deve essere esposto su internet senza autenticazione a due fattori.

### 1.2 Sicurezza applicativa

- [ ] 🟠 **Content Security Policy (CSP) header** — `contentSecurityPolicy: false` in Helmet è un rischio. Definire CSP restrittiva che permetta solo Stripe, Shopware, Strapi e Resend come sorgenti esterne:
  ```nginx
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' js.stripe.com; frame-src js.stripe.com; img-src 'self' data: *.shopware.com; connect-src 'self' api.stripe.com;" always;
  ```
- [ ] 🟠 **HSTS (HTTP Strict Transport Security)** — aggiungere in nginx: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`
- [ ] 🟠 **Permissions-Policy header** — aggiungere a nginx: `add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(self)"` 
- [ ] 🟠 **CSRF protection** — il server Express non ha protezione CSRF. Aggiungere `csurf` o CSRF token sui form di checkout (i payment endpoint sono già protetti dal Stripe signature, ma il PATCH context token no).
- [ ] 🟡 **Input sanitization** sul proxy Strapi — la whitelist regex è corretta ma aggiungere un limite di dimensione sulla query string (es. max 500 chars).
- [ ] 🟡 **Secrets management** — le variabili d'ambiente sono in `.env` a livello filesystem. In produzione usare Docker Secrets o un vault (HashiCorp Vault, AWS Secrets Manager, o almeno `docker secret create`).
- [ ] 🟡 **Audit log degli endpoint pagamento** — loggare ogni richiesta a `/api/checkout/*` con IP, timestamp, importo, esito in formato strutturato (non solo `console.log`).
- [ ] 🟢 **Dependency vulnerability scanning** — aggiungere `npm audit` in CI e integrare Snyk o Dependabot per aggiornamenti automatici delle dipendenze con CVE.
- [ ] 🟢 **Web Application Firewall (WAF)** — se self-hosted, integrare Cloudflare (free tier) davanti all'IP del server per protezione DDoS e bot filtering.

### 1.3 Order poller — rischio duplicati email

- [ ] 🟠 **Persistere lo stato del poller** — gli `Set` `sentShipped` e `sentCancelled` in `server.js` sono in memoria: al riavvio vengono azzerati e le email per ordini già spediti verranno reinviate. Soluzione: al boot del poller, pre-popolare i Set con gli ordini degli ultimi 30 giorni (già fatto ✅) ma aggiungere un file di stato o Redis per sopravvivere ai crash. Alternativa rapida: scrivere un file JSON locale con gli ID già inviati.

---

## 2. INFRASTRUTTURA E DEVOPS

### 2.1 Docker e deployment

- [ ] 🔴 **Aggiungere health check al container frontend** — il container manca di health check. Aggiungere in `docker-compose.yml`:
  ```yaml
  frontend:
    healthcheck:
      test: ["CMD", "curl", "-sf", "http://localhost/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
  ```
- [ ] 🔴 **Aggiungere endpoint `/api/health`** in `server.js` — risponde `{ status: "ok", uptime: process.uptime() }`. Usato da Docker health check, load balancer e uptime monitoring.
- [ ] 🟠 **Resource limits sui container** — senza `mem_limit` e `cpus` i container possono consumare tutte le risorse del host. Aggiungere:
  ```yaml
  deploy:
    resources:
      limits:
        memory: 512m
        cpus: '0.5'
  ```
- [ ] 🟠 **Separare nginx da Express in container distinti** — l'entrypoint attuale avvia nginx in background e Express in foreground: se uno dei due crasha l'altro continua a girare invisibilmente. Usare due container separati o `supervisord`.
- [ ] 🟡 **CI/CD pipeline** — nessuna pipeline di build automatica. Implementare GitHub Actions:
  - `on: push to main` → `npm install && npm run build` → build Docker image → push to registry → deploy
  - `on: PR` → `npm run build` + linting + test
- [ ] 🟡 **Ambiente di staging** — non esiste uno staging separato. Creare branch `staging` con env vars separate (Stripe test keys, Shopware staging instance).
- [ ] 🟡 **Log rotation** — i log di nginx e Express crescono indefinitamente. Configurare `logrotate` o usare `--log-opt max-size=100m --log-opt max-file=3` in `docker-compose.yml`.
- [ ] 🟡 **Backup automatico Shopware MySQL** — gli script `backup-shopware.sh` esistono ma non sono schedulati. Aggiungere un cron job che esegua backup giornaliero e lo copi su S3/Backblaze B2.
- [ ] 🟢 **Dockerfile non-root user** — il processo node gira come root nel container. Aggiungere `USER node` prima di `ENTRYPOINT` per principio di least privilege.
- [ ] 🟢 **Multi-arch build** — il Dockerfile non specifica la piattaforma. Aggiungere `--platform linux/amd64` o build matrix per ARM/x86.

### 2.2 nginx

- [ ] 🟠 **Abilitare HTTP/2** — `listen 80` non usa HTTP/2. Su HTTPS aggiungere `listen 443 ssl http2;` (richiede certificato).
- [ ] 🟠 **Brotli compression** — nginx Alpine non include il modulo Brotli di default. Installare `nginx-module-brotli` o usare nginx con `ngx_brotli` per compressione superiore al gzip su browser moderni.
- [ ] 🟡 **Cache delle immagini Shopware** (`/media`, `/thumbnail`) — attualmente vengono proxy-passate senza cache. Aggiungere `proxy_cache_path` e `proxy_cache_valid 200 30d` per questi path.
- [ ] 🟡 **Timeout e buffer** — aggiungere al blocco `location ^~ /api`:
  ```nginx
  proxy_read_timeout 30s;
  proxy_send_timeout 30s;
  proxy_connect_timeout 5s;
  proxy_buffer_size 4k;
  ```
- [ ] 🟢 **Security.txt** — creare `/public/.well-known/security.txt` per vulnerability disclosure responsabile.

---

## 3. MONITORING E OSSERVABILITÀ

### 3.1 Error tracking

- [ ] 🔴 **Installare Sentry** — nessun error tracking è configurato. Qualsiasi errore JavaScript non raggiunge nessuno.
  ```bash
  npm install @sentry/react @sentry/node
  ```
  - Frontend: wrappare `App` con `Sentry.ErrorBoundary`, catturare errori nelle pagine checkout/product
  - Backend: `Sentry.init()` in `server.js`, catturare eccezioni non gestite e rifiuti Promise
  - Configurare alert email per errori critici (es. checkout fallito, webhook fallito)

### 3.2 Logging strutturato

- [ ] 🟠 **Sostituire `console.log` con un logger strutturato** — tutti i log sono testo libero. In produzione serve JSON per aggregazione su Loki/CloudWatch/Datadog:
  ```bash
  npm install pino pino-http
  ```
  - Ogni log deve avere: `timestamp`, `level`, `service`, `orderId/paymentIntentId` dove applicabile
  - Mai loggare dati sensibili (token, carte, email complete)

### 3.3 Uptime e alerting

- [ ] 🟠 **Uptime monitoring** — nessuno strumento monitora se il sito è raggiungibile. Configurare:
  - **BetterUptime** o **UptimeRobot** (gratuiti) per ping ogni 5 minuti su `https://capperificiocaro.com`
  - Alert via email/Telegram se il sito è down > 5 minuti
  - Monitorare sia il frontend che `/api/health` (Express) che Shopware

### 3.4 Metriche

- [ ] 🟡 **Dashboard business** — nessuna visibilità su ordini/fatturato in tempo reale senza accedere a Shopware admin. Configurare:
  - Stripe Dashboard con alert su volume anomalo (fraud detection)
  - Google Analytics 4 con conversioni (vedi sezione Analytics)
  - Eventualmente Metabase connesso a Shopware MySQL per report personalizzati

---

## 4. ANALYTICS E TRACCIAMENTO

### 4.1 Google Analytics 4 + GTM

- [ ] 🔴 **Installare Google Tag Manager** — nessun tag di terze parti è presente. Aggiungere in `index.html`:
  ```html
  <!-- GTM Head snippet (dopo charset, prima di tutto il resto) -->
  <script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
  <!-- GTM noscript (subito dopo <body>) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"...></iframe></noscript>
  ```
  - Aggiungere l'ID GTM in `.env` come `VITE_GTM_ID`
  - Caricare il tag GTM **solo dopo il consenso** (integration con `CookieConsent.jsx`)

- [ ] 🔴 **Implementare e-commerce dataLayer events** — nessun evento di tracciamento è presente nel codice. Creare `src/lib/utils/gtm.js` e implementare:

  | Evento | Dove implementarlo | Dati richiesti |
  |---|---|---|
  | `view_item` | `ProductPage` al mount | id, name, price, category, brand |
  | `add_to_cart` | click "Aggiungi" in `ProductDetail` | id, name, price, quantity |
  | `remove_from_cart` | `CartDrawer` rimozione | id, name, price |
  | `view_cart` | apertura `CartDrawer` | lista items, valore totale |
  | `begin_checkout` | accesso a `/checkout` | lista items |
  | `add_shipping_info` | completamento step indirizzo | shipping method name |
  | `add_payment_info` | visualizzazione Stripe Element | `payment_type: "card"` |
  | `purchase` | dopo `confirmCheckout` riuscito | `transaction_id`, `revenue`, `tax`, items |
  | `view_item_list` | `CollectionPage` / slider home | lista prodotti visibili |

- [ ] 🟠 **Google Analytics 4** — creare proprietà GA4, collegare a GTM. Configurare `purchase` come conversione principale.
- [ ] 🟡 **Google Search Console** — verificare la proprietà e collegare a GA4 per dati organici.

### 4.2 Meta / Facebook Pixel

- [ ] 🟡 **Meta Pixel** via GTM — installare tramite tag Custom HTML in GTM. Implementare:
  - `ViewContent` su `ProductPage`
  - `AddToCart` su click "Aggiungi al carrello"
  - `InitiateCheckout` su accesso a `/checkout`
  - `Purchase` dopo ordine confermato (con `value` e `currency`)
- [ ] 🟢 **Meta Conversions API (CAPI)** — inviare eventi `Purchase` anche server-side dall'endpoint `/api/checkout/confirm` per aggirare iOS 14+ privacy restrictions. Richiede Meta Business API token.

---

## 5. SEO

### 5.1 Correzioni urgenti

- [ ] 🔴 **`lang="it"` in `index.html`** — attualmente è `lang="en"`. Google usa questo per determinare la lingua del sito.
- [ ] 🟠 **Sitemap XML dinamica** — la sitemap in `dist/sitemap.xml` è statica e non include URL prodotti. Creare endpoint Express `GET /sitemap.xml` che:
  - Interroga Shopware per tutti i prodotti attivi e le loro SEO URL
  - Include URL statiche (/, /storia, /blog, /territorio, /processo-produttivo)
  - Include articoli blog da Strapi
  - Restituisce XML valido con `<lastmod>` e `<priority>`
- [ ] 🟠 **robots.txt aggiornato** — aggiungere `Sitemap: https://capperificiocaro.com/sitemap.xml` al file esistente in `dist/robots.txt`

### 5.2 Structured data (JSON-LD)

- [ ] 🟠 **Product schema su `ProductPage`** — il `useSEO` hook supporta `jsonLd` ma manca il schema Product. Implementare in `ProductPage`:
  ```js
  {
    "@type": "Product",
    "name": product.name,
    "image": product.imageUrl,
    "offers": { "@type": "Offer", "price": product.price, "priceCurrency": "EUR", "availability": "InStock" }
  }
  ```
- [ ] 🟡 **Organization schema** in `index.html` (una volta, globale) con `name`, `url`, `logo`, `contactPoint`
- [ ] 🟡 **BreadcrumbList** su `ProductPage` e `CollectionPage`
- [ ] 🟡 **Article schema** su `BlogArticlePage`

### 5.3 Performance SEO (Core Web Vitals)

- [ ] 🟠 **Immagine hero con `fetchpriority="high"`** — la hero image non ha questo attributo. Il LCP su mobile sarà penalizzato.
- [ ] 🟠 **Dimensioni esplicite sulle immagini prodotto** — nessuna immagine ha `width` e `height` espliciti, causando CLS (Cumulative Layout Shift).
- [ ] 🟡 **Preload dei font critici** — aggiungere `<link rel="preload" as="font">` per i 2 font principali (Paralucent + PPEditorialOld) in `index.html`.
- [ ] 🟡 **Code splitting per le pagine** — verificare che Vite generi chunk separati con `React.lazy()` e `Suspense` per `CheckoutPage`, `AccountPage`, `BlogPage`.

### 5.4 URL e internazionalizzazione

- [ ] 🟢 **URL in italiano** — le route sono in inglese (`/collections/`, `/product/`). Per un sito italiano, valutare `redirect` o alias verso `/collezioni/`, `/prodotto/`.
- [ ] 🟢 **Canonical tag** — verificare che il `useSEO` hook inserisca `<link rel="canonical">` su tutte le pagine (attualmente sembra presente ma verificare sul prodotto con varianti).

---

## 6. LEGAL E COMPLIANCE GDPR

### 6.1 Pagine legali mancanti

- [ ] 🔴 **Privacy Policy** — obbligatoria per legge (GDPR). Creare pagina `/privacy-policy` con:
  - Titolare del trattamento (ragione sociale, P.IVA, indirizzo)
  - Elenco dei cookie e tracker usati (GA4, Meta Pixel, Stripe, Shopware)
  - Diritti dell'interessato: accesso, rettifica, cancellazione, portabilità, opposizione
  - Tempi di conservazione dei dati
  - Contatti per richieste GDPR (email dedicata)
- [ ] 🔴 **Termini e Condizioni di Vendita** — obbligatori per e-commerce. Creare pagina `/termini-condizioni` con:
  - Descrizione dei prodotti e politica di prezzo
  - Modalità di pagamento accettate
  - Tempi di consegna e corrieri
  - **Diritto di recesso** (14 giorni per consumatori EU — Direttiva 2011/83/UE)
  - Politica di reso e rimborso
  - Legge applicabile (Italia) e foro competente
- [ ] 🟠 **Cookie Policy** — creare pagina `/cookie-policy` collegata dal banner (il link già esiste nel banner ma la pagina non esiste). Elencare tutti i cookie con nome, scopo, durata.
- [ ] 🟠 **Aggiungere le route legali in `App.jsx`** — `/privacy-policy`, `/termini-condizioni`, `/cookie-policy` non sono routate.
- [ ] 🟡 **Link legali in Footer** — verificare che Footer contenga link a tutte le pagine legali (Privacy, Cookie, T&C, Recesso).

### 6.2 Form e consensi

- [ ] 🟠 **Checkbox consenso nel form B2B** — il form B2B deve avere un consenso esplicito al trattamento dati con link alla Privacy Policy (non pre-spuntato).
- [ ] 🟠 **Newsletter opt-in esplicito** — il componente `Newsletter.jsx` deve raccogliere consenso con checkbox dedicata e registrarlo nel sistema.
- [ ] 🟡 **Consent Mode v2 snippet prima di GTM** — aggiungere il default `denied` snippet in `index.html` **prima** del tag GTM (già parzialmente gestito da `CookieConsent.jsx` ma il default deve essere in HTML, non JS).

---

## 7. PERFORMANCE

### 7.1 Immagini

- [ ] 🟠 **CDN per le immagini Shopware** — le immagini di prodotto vengono servite dal server Shopware via nginx proxy. In produzione configurare Cloudflare o BunnyCDN davanti alle immagini per:
  - Cache edge (vicino all'utente)
  - Conversione automatica in WebP/AVIF
  - Ridimensionamento responsivo
- [ ] 🟠 **Formato WebP obbligatorio in Shopware** — verificare che il media handler di Shopware generi thumbnail in WebP. Configurare in `Administration → Settings → Media`.
- [ ] 🟡 **`loading="lazy"` su tutte le immagini non hero** — verificare che `<img>` nei `ProductCard`, `BlogGrid`, `StorySlider` abbiano `loading="lazy"`.
- [ ] 🟡 **OG Image (1200×630)** — creare un'immagine generica del brand per condivisioni social quando non c'è un'immagine specifica del prodotto.

### 7.2 Bundle e runtime

- [ ] 🟠 **React Error Boundaries** — nessun error boundary è presente. Un errore non catturato in qualsiasi componente crasha l'intera app senza mostrare nulla all'utente. Wrappare almeno `ProductPage`, `CheckoutPage`, `CartDrawer` con ErrorBoundary.
- [ ] 🟡 **Code splitting con `React.lazy`** — le pagine pesanti (Checkout, Account, Blog) vengono caricate nel bundle principale. Implementare lazy loading.
- [ ] 🟡 **Font subsetting** — i file `.otf` di Paralucent includono tutti i glifi. Convertire in WOFF2 con solo il subset di caratteri usato (latino) riduce il peso del 60-80%.
- [ ] 🟢 **Preconnect a domini terzi** — aggiungere `<link rel="preconnect">` per Stripe (`js.stripe.com`), Shopware API, Strapi in `index.html`.

### 7.3 Redis caching (scala)

- [ ] 🟢 **Redis per sessioni e cache** — aggiungere un container Redis in `docker-compose.yml`. Usarlo per:
  - Cache delle risposte Shopware (prodotti, categorie) con TTL di 5 minuti
  - Persistenza del set di ordini già notificati del poller
  - Rate limiting distribuito (invece di in-memory per-process)

---

## 8. TESTING

### 8.1 Test mancanti (Playwright installato ma inutilizzato)

- [ ] 🟠 **E2E test del flusso checkout** — il file di test non esiste nonostante Playwright sia in `dependencies`. Creare almeno:
  - `tests/checkout.spec.js`: aggiungi prodotto → checkout → inserisci dati → pagamento Stripe test card → ordine confermato
  - `tests/cart.spec.js`: aggiungi, modifica quantità, rimuovi prodotto
  - `tests/auth.spec.js`: login, logout, account page
- [ ] 🟡 **Unit test utility functions** — `availability.js`, `price.js`, `image.js` hanno logica testabile. Aggiungere Vitest:
  ```bash
  npm install -D vitest @testing-library/react
  ```
- [ ] 🟡 **Test del backend Express** — nessun test sugli endpoint. Testare almeno:
  - Che `/api/checkout/create-intent` rifiuti richieste senza `contextToken`
  - Che il webhook Stripe rifiuti firme non valide
  - Che importi > 5000€ vengano rifiutati

### 8.2 Qualità del codice

- [ ] 🟡 **ESLint + Prettier** — nessuna configurazione visibile. Aggiungere `.eslintrc.json` e `.prettierrc` e agganciare a pre-commit hook con `husky`:
  ```bash
  npm install -D eslint prettier husky lint-staged
  ```
- [ ] 🟢 **TypeScript** — il progetto usa JS puro. Valutare migrazione incrementale con `@ts-check` e JSDoc come primo step.
- [ ] 🟢 **Rimuovere le TestPage** — `TestPageA` e `TestPageB` sono nelle route di produzione. Rimuoverle da `App.jsx` e dal file system.

---

## 9. FUNZIONALITÀ E-COMMERCE MANCANTI

### 9.1 Pagine e flussi

- [ ] 🟠 **Pagina 404 personalizzata** — non esiste una route catch-all. Aggiungere in `App.jsx`:
  ```jsx
  <Route path="*" element={<NotFoundPage />} />
  ```
- [ ] 🟠 **Order confirmation page** (`/order-confirmation`) — attualmente la conferma ordine è uno stato inline nel `CheckoutPage`. Creare una pagina dedicata a cui redirigere dopo il pagamento, che:
  - Mostri il numero ordine, i prodotti acquistati, l'indirizzo
  - Sia il punto in cui pushare l'evento `purchase` in GA4
  - Sia indicizzabile con `noindex` ma linkabile dall'email di conferma
- [ ] 🟡 **Account page — storico ordini** — `AccountPage` esiste ma verificare che mostri lo storico ordini completo con stato (pagato, spedito) e tracking.
- [ ] 🟡 **Pagina di errore generica** — in caso di errore del server (502, 503) nginx serve il file HTML statico senza contenuto utile. Creare `dist/50x.html` e configurarlo in nginx: `error_page 500 502 503 504 /50x.html`.

### 9.2 Email automatiche non ancora attivate

- [ ] 🟠 **Review request email** — `sendReviewRequest()` è implementato in `_resend.js` ma non viene mai chiamato. Aggiungere al poller un terzo ciclo che, 10 giorni dopo la spedizione (`deliveredAt`), invii la richiesta di recensione.
- [ ] 🟠 **Low stock alert** — `sendMerchantLowStock()` è implementato ma mai chiamato. Aggiungere al poller una query Shopware per prodotti con `availableStock < soglia` (es. 5) e notificare il merchant.

### 9.3 Rimborsi e gestione ordine

- [ ] 🟠 **Endpoint rimborso** — non esiste un endpoint per processare rimborsi via Stripe. Il rimborso va fatto manualmente dalla dashboard Stripe. Implementare `POST /api/stripe/refund` (solo con autenticazione admin) che chiami `stripe.refunds.create()` e invii `sendRefundIssued()`.
- [ ] 🟡 **Webhook per rimborsi Stripe** — aggiungere gestione dell'evento `charge.refunded` nel webhook per aggiornare lo stato ordine in Shopware e inviare email di rimborso automaticamente.

### 9.4 Features aggiuntive (post-lancio)

- [ ] 🟢 **Coupon/codici sconto** — Shopware supporta i coupon code. Aggiungere un campo nel carrello per inserire codici promo.
- [ ] 🟢 **Wishlist** — permettere agli utenti loggati di salvare prodotti preferiti.
- [ ] 🟢 **Abandoned cart recovery** — Shopware può inviare email di recupero carrello abbandonato. Configurare il workflow in Shopware + template email.
- [ ] 🟢 **Newsletter** — il componente `Newsletter.jsx` esiste ma non è collegato a nessun sistema (Mailchimp, Klaviyo, Brevo). Implementare l'integrazione.
- [ ] 🟢 **Live chat / supporto** — integrare Crisp o Tawk.to per supporto clienti in tempo reale (entrambi hanno free tier).

---

## 10. CODE QUALITY E MANUTENIBILITÀ

### 10.1 Frontend

- [ ] 🟡 **Eliminare inline styles da `CheckoutPage`** — `CheckoutPage.jsx` ha ~400 righe di oggetti stile inline. Migrarle in `CheckoutPage.module.css` per leggibilità, manutenibilità e performance (i CSS Modules vengono ottimizzati da Vite).
- [ ] 🟡 **Lista paesi hardcoded** — `ALL_COUNTRIES` in `CheckoutPage.jsx` è una lista statica. I paesi vengono già fetchati da Shopware (`getCountries()`); rimuovere la lista hardcoded e usare solo quella di Shopware come fonte di verità.
- [ ] 🟡 **Estrarre componenti dal CheckoutPage** — il file è 995 righe. Estrarre: `StepBar`, `OrderSummary`, `Field`, `MethodCard`, `CountryPicker` in file separati in `src/components/checkout/`.
- [ ] 🟢 **Design tokens centralizzati** — i colori del brand (`#2C4A2C`, `#547054`, `#FCF3DF`) appaiono in più file (CheckoutPage, _resend.js, CookieConsent). Centralizzarli in `src/styles/tokens.js` e usarli ovunque.

### 10.2 Backend

- [ ] 🟡 **Timeout sulle chiamate fetch a Shopware** — `swFetch()` e `adminFetch()` non hanno timeout. Una risposta lenta di Shopware blocca il server indefinitamente. Usare `AbortSignal.timeout(10000)`.
- [ ] 🟡 **Retry con backoff su Admin API token** — se Shopware è momentaneamente non raggiungibile, il token OAuth fallisce e l'ordine rimane non segnato "pagato". Aggiungere retry con exponential backoff (max 3 tentativi).
- [ ] 🟢 **Strutturare le API in moduli distinti** — `server.js` contiene routing, business logic e setup. Separare in `routes/`, `middleware/`, `services/`.

---

## 11. PAGAMENTI — COMPLETAMENTO

- [ ] 🟠 **Stripe live keys in produzione** — verificare che `STRIPE_SECRET_KEY` e `VITE_STRIPE_PUBLIC_KEY` in produzione usino chiavi `sk_live_` e `pk_live_`, non test.
- [ ] 🟠 **Stripe Radar rules** — configurare regole anti-frode in Stripe Dashboard → Radar:
  - Blocca pagamenti da paesi ad alto rischio (personalizzare in base al mercato)
  - Blocca carta se 3 tentativi falliti in 1 ora
  - Richiedi CVC su tutti i pagamenti
- [ ] 🟠 **Test checkout end-to-end** con carta `4242 4242 4242 4242` (Stripe test) prima del go-live.
- [ ] 🟡 **3D Secure fallback** — verificare che il `StripePaymentForm` gestisca correttamente il redirect 3DS e reinvii la conferma al server.
- [ ] 🟡 **Pulire le variabili PayPal deprecate** — `VITE_PAYPAL_CLIENT_ID` e tutto il codice PayPal diretto sono deprecati (ora passa da Stripe). Rimuovere dalla `docker-compose.yml` e dal `.env.example` per evitare confusione.

---

## 12. SHOPWARE — CONFIGURAZIONE PRODUZIONE

- [ ] 🔴 **Sales Channel configurato per il dominio di produzione** — il Sales Channel Shopware deve avere il dominio `https://capperificiocaro.com` come `storefront URL`, altrimenti la registrazione guest fallirà in produzione.
- [ ] 🟠 **SMTP reale per email Shopware** — Shopware invia email amministrative (conferma registrazione, reset password, fatture) via SMTP. Configurare un provider reale (Resend, SendGrid, Mailgun) in `Administration → Settings → Email`.
- [ ] 🟠 **Tax configuration** — verificare che l'IVA italiana (22%) sia configurata correttamente per tutti i prodotti. Verificare che i prezzi mostrino IVA inclusa per i consumatori (B2C) ed esclusa per i rivenditori (B2B).
- [ ] 🟡 **Shopware SEO URL settings** — verificare che ogni prodotto abbia una SEO URL configurata (slug leggibile) in Shopware, altrimenti le URL saranno UUID.
- [ ] 🟡 **Shopware product alt text** — aggiungere `alt text` a tutte le immagini prodotto in Shopware Admin → Product → Media.
- [ ] 🟡 **Configurare Integration Shopware Admin API** — preferire `client_credentials` (Integration) a `password grant` (username/password admin) per `SHOPWARE_ADMIN_CLIENT_ID/SECRET`. Creare in `Settings → System → Integrations`.

---

## PIANO DI ESECUZIONE — Ordine suggerito

### Settimana 1 — Sicurezza e stabilità (BLOCCANTI)
1. Chiudere Adminer e Shopware dalla rete pubblica (firewall)
2. Cambiare credenziali Shopware + rinnovare Access Key
3. Sostituire `dockware/dev` con immagine production
4. Aggiungere endpoint `/api/health` + health check Docker
5. `lang="it"` in `index.html`
6. Aggiungere pagine legali (Privacy Policy, T&C, Cookie Policy)

### Settimana 2 — Monitoring e Analytics
7. Installare Sentry (frontend + backend)
8. Configurare UptimeRobot per il sito
9. GTM + GA4 setup
10. Implementare dataLayer events (almeno `purchase`)
11. Structured logging con Pino

### Settimana 3 — SEO e Performance
12. Sitemap dinamica in Express
13. Product JSON-LD su ProductPage
14. Error Boundaries in React
15. 404 e order confirmation page
16. Review request email trigger nel poller
17. Low stock alert trigger nel poller

### Settimana 4 — Testing e CI/CD
18. Pipeline GitHub Actions (build + lint + test)
19. E2E test checkout con Playwright
20. Staging environment separato
21. Log rotation + backup automatici

### Post-lancio — Crescita
22. Meta Pixel + Conversions API
23. Newsletter integration (Klaviyo/Brevo)
24. Coupon code UI
25. Abandoned cart recovery (Shopware workflow)
26. Redis caching layer
27. CDN per immagini (Cloudflare)

---

## Metriche di successo

| Metrica | Target attuale | Target enterprise |
|---|---|---|
| Lighthouse Performance (mobile) | ~60 (stimato) | > 85 |
| Lighthouse SEO | ~70 (stimato) | > 95 |
| Core Web Vitals LCP | non misurato | < 2.5s |
| Core Web Vitals CLS | non misurato | < 0.1 |
| Uptime | non monitorato | > 99.5% |
| Checkout completion rate | non tracciato | tracciato via GA4 |
| E-commerce conversion rate | non tracciato | baseline in 30 giorni |
| Mean time to detect (errori) | non misurato | < 5 minuti (Sentry) |

---

*Documento generato: 2026-06-29 — da aggiornare ad ogni sprint*
