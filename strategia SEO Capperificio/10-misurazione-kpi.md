# 10 — Misurazione, KPI & Iterazione

> «Ciò che non si misura non si migliora.» Qui: cosa tracciare, con quali strumenti,
> con che cadenza, e come decidere dove raddoppiare.

## Strumenti (stack minimo, gran parte gratuito)

| Strumento | A cosa serve | Costo |
|-----------|--------------|-------|
| **Google Search Console** | Posizioni, impression, CTR, query, copertura, indicizzazione | Gratis |
| **Bing Webmaster Tools** | Indice Bing (alimenta ChatGPT/Copilot search) | Gratis |
| **Google Analytics 4** | Sessioni, sorgenti, conversioni, ecommerce, segmento AI | Gratis |
| **Google Business Profile** | Local, recensioni | Gratis |
| **Ahrefs / Semrush** | Keyword tracking, backlink, audit (anche trial) | A pagamento |
| **Keyword tracker** (anche Ahrefs Lite/Semrush) | Posizioni nel tempo | A pagamento |
| **Screaming Frog** | Audit tecnico on-site (500 URL gratis) | Free/Pay |
| **Test prompt AI** (manuale o Otterly/Profound/Peec) | Citazioni in AI search | Manuale gratis / tool a pagamento |

---

## KPI principali (Nord)

| KPI | Strumento | Target trend |
|-----|-----------|--------------|
| Sessioni organiche/mese | GA4 / GSC | ↗ crescita costante |
| Keyword in top 3 / top 10 | GSC / tracker | ↗ |
| Ricavo da organico | GA4 ecommerce | ↗ |
| Conversion rate organico | GA4 | stabile/↗ |
| Lead B2B Ho.Re.Ca da organico | form/GA4 | ↗ |
| **Citazioni in AI search** | test prompt | presenti → ricorrenti |
| Referring domains | Ahrefs/Semrush | ↗ |
| Pagine indicizzate "utili" | GSC | ↗ controllato |

---

## KPI secondari / diagnostici

- **CTR per query** (GSC): title/meta da ottimizzare se CTR basso con buona posizione.
- **Impression senza click**: spesso AI Overview attivo → ottimizza per esserci dentro.
- **Pagine con impression ma posizione 11–20**: i «quasi in prima pagina» → priorità di miglioramento.
- **Core Web Vitals** (GSC → Esperienza): LCP/INP/CLS.
- **Indicizzazione**: pagine inviate vs indicizzate (scopri pagine thin escluse).
- **Bounce/engagement** sulle ricette: se altissimo, contenuto da migliorare.

---

## Tracciare la AI Search (metodo pratico)

### A. Segmento "AI referral" in GA4
Crea un segmento/esplorazione che filtra sorgenti/referrer:
```
chatgpt.com · chat.openai.com · perplexity.ai · gemini.google.com ·
copilot.microsoft.com · bing.com (con AI) · claude.ai
```
Monitora sessioni e conversioni da questi referrer mese su mese.

### B. Test prompt mensile (foglio di tracking)
Ogni mese poni le 20 domande-bersaglio ([05](05-aeo-ai-search.md)) ai 4 assistenti e compila:

| Domanda | ChatGPT | Gemini/AIO | Perplexity | Copilot | Note |
|---------|---------|------------|------------|---------|------|
| Migliori capperi italiani? | brand citato? S/N | | | | |
| Cappero per puttanesca? | pagina citata? | | | | |
| ... | | | | | |

Scoring semplice: 0 = assente · 1 = menzionato · 2 = citato come fonte con link.
Obiettivo: aumentare il punteggio totale ogni mese.

### C. Log dei crawler AI
Controlla nei log server / GSC se passano `GPTBot`, `PerplexityBot`, `OAI-SearchBot`,
`Google-Extended`, `ClaudeBot`. Se non passano → problema di rendering/robots ([08](08-technical-seo.md)).

---

## Cadenza di reporting

| Frequenza | Cosa guardi | Azione |
|-----------|-------------|--------|
| **Settimanale** | Indicizzazione nuove pagine, errori GSC, posizioni keyword chiave | fix rapidi |
| **Mensile** | KPI principali, test prompt AI, nuovi link, top/flop contenuti | report + decisioni |
| **Trimestrale** | Keyword research aggiornata, audit tecnico, potatura thin content, ricalibro target | revisione strategia |

---

## Framework decisionale: dove raddoppiare

Dopo 2–3 mesi di dati, classifica ogni cluster/pagina:

```
ALTA performance + ALTO intent  → RADDOPPIA (più pagine simili, più link, più FAQ)
ALTA performance + BASSO intent → mantieni, aggiungi CTA per monetizzare
BASSA performance + ALTO intent → MIGLIORA (contenuto, link interni, schema, answer-first)
BASSA performance + BASSO intent→ POTA o consolida (noindex/redirect/merge)
```

### Segnali di pagina da potare/consolidare
- Pagina indicizzata ma 0 click in 90 giorni e 0 conversioni.
- Cannibalizza un'altra pagina (stessa query, posizioni che si rubano).
- Thin content che non risponde a un intent reale.
→ Azione: migliora, accorpa (301), o `noindex`. Meno pagine ma più forti = ranking migliore.

---

## Dashboard minima (cosa avere sott'occhio)
1. Sessioni organiche (trend 12 mesi) — GA4.
2. Top 20 query per impression e posizione media — GSC.
3. Keyword in top 10 (conteggio) — tracker.
4. Ricavo + lead B2B da organico — GA4.
5. Referring domains (trend) — Ahrefs/Semrush.
6. Punteggio AI citation (trend) — foglio test prompt.
7. Core Web Vitals — GSC.

## Aspettative di tempo (importante)
La SEO programmatica e l'autorevolezza richiedono **3–6 mesi** per i primi risultati solidi e
**6–12 mesi** per maturare. Le pagine longtail a bassa concorrenza possono rankare prima
(settimane). Non valutare l'investimento prima di 90 giorni di dati.
