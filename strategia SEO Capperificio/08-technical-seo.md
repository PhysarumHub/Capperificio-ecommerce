# 08 — SEO Tecnica (checklist + nodo critico React)

> La parte tecnica è la fondamenta: senza, la programmatic SEO e l'AEO non funzionano.
> Stack rilevato: **React + Vite (SPA)** in `sunrise-coffee/`, prodotti su **Shopware 6**.

---

## 🔴 NODO CRITICO #1 — Rendering (da risolvere PRIMA di tutto)

Il frontend è una **SPA React (Vite)**: il contenuto è generato lato client con JavaScript.
Problema: molti crawler — soprattutto i **bot AI** (GPTBot, PerplexityBot, ecc.) e in parte
Bing — **non eseguono JS** o lo eseguono male. Risultato: vedono una pagina vuota → niente
indicizzazione, niente citazioni AI. Googlebot esegue JS ma con ritardo e budget limitato:
per centinaia di pagine programmatiche è inaffidabile.

### Soluzioni (in ordine di preferenza)

| Opzione | Descrizione | Quando |
|---------|-------------|--------|
| **A. Migrare a Next.js** (SSR/SSG) | Rendi le pagine SEO (pillar, ricette, guide, prodotti) server-rendered o statiche | Migliore a lungo termine. C'è già `nextjs-expert` nel progetto |
| **B. Pre-rendering / SSG layer** | Genera HTML statico per le rotte SEO (es. `vite-plugin-ssr`/`vite-react-ssg`, o prerender in build) | Se vuoi restare su Vite |
| **C. Blog/contenuti headless separati** | Mette ricette/guide su un CMS SSR (Strapi+Next, o un'istanza Next dedicata) sotto lo stesso dominio | Pragmatico: il negozio resta SPA, i contenuti SEO sono server-side |
| **D. Prerender.io / dynamic rendering** | Servi HTML pre-renderizzato ai bot | Soluzione tampone, non ideale ma rapida |

> Nel repo esistono già progetti **Next.js** (`masseria-arnoni-next`) e riferimenti Strapi
> (`seed_strapi_articles.py`). La strada più solida: **i contenuti SEO (ricette, guide, pillar)
> su Next.js/SSG**, l'ecommerce può restare SPA ma le **schede prodotto vanno renderizzate
> server-side** per indicizzazione e schema. Consulta lo skill `nextjs-expert`.

**Verifica veloce dello stato attuale**: apri una scheda prodotto, `Ctrl+U` (view source).
Se NON vedi il testo del prodotto nell'HTML grezzo → sei in trouble SEO, serve rendering server-side.

---

## 🔴 NODO CRITICO #2 — Indicizzabilità delle pagine programmatiche

- Ogni pagina programmatica deve avere un **URL reale** (`/ricette/...`), non solo uno stato JS.
- Deve restituire **HTTP 200** con contenuto nel sorgente.
- Deve essere **linkata** internamente e nella **sitemap**.

---

## Checklist tecnica completa

### Crawling & indicizzazione
- [ ] `robots.txt` presente, non blocca le sezioni SEO. **Consenti i bot AI** (vedi [05](05-aeo-ai-search.md)).
- [ ] **Sitemap XML** generata automaticamente dal dataset (prodotti + ricette + guide + hub), inviata in Search Console e referenziata in `robots.txt`.
- [ ] Sitemap segmentata se cresce (sitemap index): `/sitemap-prodotti.xml`, `/sitemap-ricette.xml`, ecc.
- [ ] **Canonical** corretto su ogni pagina (auto-referenziale; gestisci varianti/filtri per evitare duplicati).
- [ ] `noindex` sulle pagine non utili (carrello, checkout, account, filtri infiniti).
- [ ] Niente catene di redirect; 301 per URL cambiati.
- [ ] Gestione 404 pulita + pagina 404 utile con link.

### Performance (Core Web Vitals)
- [ ] **LCP < 2.5s**, **INP < 200ms**, **CLS < 0.1**.
- [ ] Immagini **WebP/AVIF**, dimensionate, `lazy-load`, `width/height` impostati (no CLS).
- [ ] ⚠️ Attenzione all'**image proxy Shopware** (citato nei commit `image-proxy`): assicurati che non rallenti LCP né blocchi il crawling delle immagini. Servi immagini con URL stabili e cacheabili.
- [ ] Code splitting, preconnect ai domini critici, font ottimizzati.
- [ ] CDN per asset statici.

### Mobile & accessibilità
- [ ] Mobile-first, responsive, tap target adeguati.
- [ ] HTML semantico (`<h1>` unico, heading gerarchici, `<nav>`, `<main>`, `<article>`).
- [ ] `alt` su tutte le immagini.

### Internal linking (struttura)
```
Home
 └─ Pillar "Cappero di Racale"
     ├─ Hub Calibri ─→ 7 schede prodotto
     ├─ Hub Ricette ─→ N pagine ricetta ─→ scheda prodotto (calibro consigliato)
     ├─ Hub Abbinamenti ─→ pagine abbinamento ─→ ricette
     ├─ Guide (AEO) ─→ prodotti pertinenti
     └─ Landing Ho.Re.Ca (B2B)
```
- [ ] Breadcrumb visibili + schema BreadcrumbList.
- [ ] Nessuna pagina orfana (ogni pagina ha ≥ 2 link interni entranti).
- [ ] Anchor text descrittivi (no «clicca qui»).

### Internazionalizzazione (se/quando)
- [ ] Se vendi all'estero: `hreflang` per lingue/paesi. Per ora (IT) non necessario.

### Sicurezza & infra (già parzialmente fatto nei commit recenti)
- [ ] HTTPS ovunque, HSTS.
- [ ] Header di sicurezza già introdotti (vedi commit `security-headers`) — verifica non blocchino i crawler.
- [ ] Rate limiting non deve bloccare Googlebot/bot legittimi (whitelist user-agent/IP noti).

### Misurazione tecnica
- [ ] **Google Search Console** verificata, sitemap inviata, copertura monitorata.
- [ ] **Bing Webmaster Tools** (alimenta anche ChatGPT/Copilot search).
- [ ] **GA4** con eventi ecommerce + segmento «AI referral».
- [ ] Log server o GSC per vedere cosa crawlano i bot.

---

## Generazione automatica (programmatic, lato dev)

```
DATASET (json/CMS)  →  build/SSG  →  HTML statico per ogni rotta  →  sitemap auto  →  deploy
        │                                      │
        └─ schema.org generato per riga         └─ internal links generati per regole
```

- Una **build template** per tipo di pagina (vedi [04](04-template-pagine.md)).
- I dataset ricette/abbinamenti in JSON o in CMS headless (Strapi già nel repo).
- Lo schema.org ([06](06-dati-strutturati-schema.md)) generato dai campi del dataset.
- La sitemap rigenerata ad ogni build dal dataset.

## Ordine operativo tech (Fase 0)
1. Decidi la strategia di rendering (raccomandato: Next.js/SSG per i contenuti SEO).
2. Imposta GSC + Bing + GA4.
3. Genera sitemap dinamica.
4. Implementa schema base (Organization, Product).
5. View-source test su prodotto e su una pagina di prova.
6. Solo dopo, parti con la pubblicazione di [07](07-content-calendar.md).
