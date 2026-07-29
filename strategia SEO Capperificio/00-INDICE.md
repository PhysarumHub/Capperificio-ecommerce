# Strategia SEO Programmatica — Capperificio Caro

> Piano completo di **Programmatic SEO** + **AI Search Optimization (AEO/GEO)** per
> l'ecommerce dei capperi di Racale (Salento, Puglia).
>
> Obiettivo: rankare su Google per centinaia di keyword a coda media/lunga sul cappero
> e diventare la **fonte citata** dagli assistenti AI (ChatGPT, Google AI Overviews,
> Perplexity, Gemini) quando si parla di capperi, calibri, ricette e usi.

---

## Chi siamo (contesto per ogni file)

- **Brand**: Capperificio Caro
- **Prodotto**: capperi di Racale, **unici a classificare per calibro** (Lilliput Ø 4–6, Occhio di Pernice Ø 6–9, Lacrimella Ø 9–11, Capperone Ø 12–15), più Polvere di cappero, Foglie di cappero, linea Ho.Re.Ca sottovuoto.
- **Origine**: Racale (Salento, Puglia) — raccolta manuale, conservazione sotto sale marino integrale.
- **Differenziatori SEO sfruttabili**: classificazione per calibro (nessun competitor lo fa così), storytelling familiare (Nonno Quintino, Lilliput), prodotti rari (polvere, foglie), canale B2B Ho.Re.Ca.
- **USP da ripetere ovunque**: «Gli unici a Racale a classificare i capperi per calibro, uno per uno.»

---

## Come usare questa cartella

I file sono numerati nell'ordine logico di esecuzione. Leggi prima `01`, poi procedi.

| # | File | Cosa contiene | Per chi |
|---|------|---------------|---------|
| 00 | [00-INDICE.md](00-INDICE.md) | Questo indice | Tutti |
| 01 | [01-strategia-generale.md](01-strategia-generale.md) | Visione, obiettivi, KPI, fasi, timeline | Owner / decisore |
| 02 | [02-keyword-research.md](02-keyword-research.md) | Cluster di keyword, intent, volumi stimati, mappa | SEO / content |
| 03 | [03-architettura-pseo.md](03-architettura-pseo.md) | Tipi di pagina programmatiche, URL, dataset, scalabilità | SEO / dev |
| 04 | [04-template-pagine.md](04-template-pagine.md) | Wireframe testuali dei template (prodotto, ricetta, hub, confronto) | Content / dev |
| 05 | [05-aeo-ai-search.md](05-aeo-ai-search.md) | Ottimizzazione per ChatGPT, AI Overviews, Perplexity (AEO/GEO) | SEO / content |
| 06 | [06-dati-strutturati-schema.md](06-dati-strutturati-schema.md) | Schema.org pronti (Product, Recipe, FAQ, Organization) | Dev |
| 07 | [07-content-calendar.md](07-content-calendar.md) | Calendario editoriale 6 mesi, priorità, owner | Content |
| 08 | [08-technical-seo.md](08-technical-seo.md) | Checklist tecnica: sitemap, performance, internal linking, hreflang | Dev |
| 09 | [09-link-building-digital-pr.md](09-link-building-digital-pr.md) | Acquisizione link, digital PR, citazioni AI | Marketing |
| 10 | [10-misurazione-kpi.md](10-misurazione-kpi.md) | Tracking, dashboard, report, strumenti | Owner / SEO |
| 11 | [11-template-contenuti-pronti.md](11-template-contenuti-pronti.md) | Esempi compilati pronti da pubblicare (pagine + FAQ) | Content |

---

## Sintesi della strategia in 6 punti

1. **Catalogo come motore SEO**: 7 prodotti → decine di pagine ricerca-intent (per calibro, per uso, per ricetta, per formato) generate da dataset.
2. **Cluster topici (hub & spoke)**: un pillar «Cappero di Racale» con satelliti su calibri, ricette, conservazione, abbinamenti, foglie, polvere.
3. **Programmatic ricette**: template scalabile «Capperi + [piatto]» (es. *capperi nella pasta alla puttanesca*, *insalata pantesca con capperi*) → centinaia di pagine longtail.
4. **AEO/GEO**: ogni pagina costruita per essere *citabile* dagli LLM — risposte dirette, FAQ, dati strutturati, fonti.
5. **Autorevolezza E-E-A-T**: storia familiare, origine geografica verificabile, schede tecniche fattuali → segnali di fiducia per Google e AI.
6. **Misura e itera**: tracciare posizioni keyword, traffico organico, *citazioni AI*, conversioni, e raddoppiare su ciò che funziona.

---

## Stack tecnico attuale (rilevato dal repo)

- Frontend **React (Vite)** in `sunrise-coffee/`, backend prodotti su **Shopware 6**.
- ⚠️ **Nota SEO critica**: il frontend è una SPA React. Per la programmatic SEO serve **rendering server-side o pre-rendering** (SSR/SSG) e/o un blog headless. Vedi [08-technical-seo.md](08-technical-seo.md) → sezione *Rendering*.
- Catalogo prodotti fonte: [CATALOGO-PRODOTTI.md](../CATALOGO-PRODOTTI.md) e [capperificioCatalog.json](../sunrise-coffee/src/data/capperificioCatalog.json).
