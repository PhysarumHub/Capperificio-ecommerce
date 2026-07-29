# 04 — Template delle Pagine (wireframe + on-page SEO)

> Struttura testuale di ogni tipo di pagina, con indicazioni su title, meta, H1-H2,
> elementi obbligatori per SEO e AEO. Da passare a dev/content come specifica.

## Regole on-page comuni a TUTTE le pagine

| Elemento | Regola |
|----------|--------|
| `<title>` | 50–60 caratteri, keyword principale all'inizio, brand alla fine: `Keyword principale | Capperificio Caro` |
| `meta description` | 140–160 caratteri, include keyword + beneficio + leggera CTA |
| `H1` | uno solo, contiene la keyword principale, diverso dal title |
| `H2/H3` | gerarchici, includono keyword secondarie e domande (utile per AEO) |
| Primo paragrafo | **risponde subito** alla query in 2–3 frasi (formato "answer-first" per AI) |
| Immagini | `alt` descrittivo con keyword, nome file parlante, formato WebP, lazy-load |
| Dati strutturati | vedi [06](06-dati-strutturati-schema.md) |
| CTA | sempre presente un link al prodotto pertinente |
| Internal link | 3–6 link interni contestuali |
| Lunghezza | sufficiente a coprire l'intent (non riempitivo) |

---

## TEMPLATE A — Pillar «Cappero di Racale»

```
TITLE: Cappero di Racale: calibri, usi e tradizione del Salento | Capperificio Caro
H1:    Il Cappero di Racale: la guida completa

[Intro answer-first 3 righe: cos'è, da dove viene, perché è unico]

H2 — Cos'è il cappero di Racale
H2 — I calibri del cappero (siamo gli unici a classificarli)
     → tabella comparativa + link a /calibri-del-cappero e alle 7 schede
H2 — Come si usano i capperi in cucina
     → link a hub ricette e abbinamenti
H2 — Capperi sotto sale: lavorazione e conservazione
     → link a guida conservazione + dissalatura
H2 — La nostra storia: da Racale, dal 19xx (Nonno Quintino, Lilliput)
H2 — I nostri prodotti
     → griglia 7 prodotti
H2 — Domande frequenti sul cappero di Racale
     → 5-8 FAQ con schema FAQPage

[CTA: Scopri tutti i capperi → /prodotti]
```

---

## TEMPLATE B — Scheda Prodotto (ottimizzata)

> Le schede esistono già in React. Da arricchire con i blocchi SEO/AEO sotto.

```
TITLE: {Nome prodotto} — Capperi di Racale {calibro} | Capperificio Caro
H1:    {Nome prodotto}

[Galleria immagini con alt]   [Prezzo, formato, CTA "Aggiungi al carrello"]

[Descrizione breve answer-first]
[Bullet di vendita — già nel catalogo: capperificio_bullet_1/2/3]

H2 — Scheda tecnica
     → tabella Proprietà (Origine, Ingredienti, Calibro, Peso, Note di gusto, Ideale per)
H2 — In cucina / Abbinamenti / Conservazione / Lo sapevi?
     → accordion (già nel catalogo)
H2 — Ricette con {calibro}
     → 2-4 link a pagine ricetta che usano questo calibro
H2 — Domande frequenti
     → FAQ specifiche del prodotto (es. "Va dissalato?", "Quanto dura una volta aperto?")

Schema: Product + Offer + AggregateRating (quando avrai recensioni) + BreadcrumbList
```

**SEO fix critico**: oggi i placeholder "caffè" (Tasting notes, Pour-over) vanno sostituiti coi
campi capperi reali — già documentato in [CATALOGO-PRODOTTI.md](../CATALOGO-PRODOTTI.md) → *Nota tecnica*.

---

## TEMPLATE C — Hub «Calibri del cappero»

```
TITLE: I calibri dei capperi: guida e differenze (Lilliput, Capperone...) | Capperificio Caro
H1:    I calibri del cappero: quale scegliere

[Intro answer-first: cos'è il calibro, perché conta sul sapore]

H2 — Cos'è il calibro di un cappero
H2 — Tabella comparativa dei calibri
     | Calibro | Ø | Gusto | Ideale per | Prodotto |
     | Lilliput | 4-6mm | intenso, fragrante | crudi, gourmet | → scheda |
     | Occhio di Pernice | 6-9mm | equilibrato | insalate, primi | → scheda |
     | Lacrimella | 9-11mm | pieno, morbido | risi, salse | → scheda |
     | Capperone | 12-15mm | marcato, carnoso | cotture, sughi | → scheda |
H2 — Quale calibro per quale piatto
     → link alle ricette per calibro
H2 — Perché noi classifichiamo per calibro (storytelling + E-E-A-T)
H2 — FAQ calibri

Schema: FAQPage + (eventuale) ItemList
```

---

## TEMPLATE D — Pagina Ricetta (programmatica)

```
TITLE: {Piatto} con capperi: ricetta {tradizionale/facile} | Capperificio Caro
H1:    {Piatto} con capperi di Racale

[Intro answer-first: cos'è il piatto + perché i capperi giusti fanno la differenza]

H2 — Ingredienti (per {porzioni})
     → lista; nei capperi: link al CALIBRO consigliato (CTA prodotto)
H2 — Preparazione passo passo
     → lista ordinata
H2 — Quale cappero usare per {piatto}
     → testo "perche_questo_calibro" (UNICO) + CTA prodotto
H2 — Consigli e varianti
H2 — Abbinamento (vino/contorno)
H2 — Domande frequenti
     → FAQ specifiche

Schema: Recipe (con tempi, ingredienti, step, immagine) + FAQPage + BreadcrumbList
Box CTA fisso: "Usa i capperi {calibro} di Racale → [Acquista]"
Link interni: hub ricette + 2-3 ricette correlate + calibro consigliato
```

> Il blocco «Quale cappero usare» è il differenziatore competitivo: nessuna ricetta online
> spiega *quale calibro* serve. È anche ciò che rende ogni pagina unica e citabile dall'AI.

---

## TEMPLATE E — Pagina Abbinamento (programmatica)

```
TITLE: Capperi e {ingrediente}: come abbinarli | Capperificio Caro
H1:    Capperi e {ingrediente}: l'abbinamento perfetto

[Answer-first: sì/come funziona l'abbinamento]
H2 — Perché capperi e {ingrediente} funzionano
H2 — Quali capperi scegliere (calibro)
H2 — Ricette con capperi e {ingrediente}  → link
H2 — FAQ
Schema: FAQPage
```

---

## TEMPLATE F — Guida / SA informazionale

```
TITLE: {Domanda/keyword} | Capperificio Caro
H1:    {Domanda riformulata}

[Answer-first: la risposta diretta nei primi 40-60 parole — CRUCIALE per AI Overviews]
H2 — [Approfondimento per sottodomande]
H2 — [Passi pratici / lista]
H2 — Errori comuni / consigli
H2 — FAQ correlate
[CTA soft a prodotto pertinente]
Schema: FAQPage (+ HowTo se è una procedura, es. dissalare)
```

Esempio già pronto e compilato: vedi [11-template-contenuti-pronti.md](11-template-contenuti-pronti.md).

---

## Checklist pubblicazione (per ogni pagina)

- [ ] Title 50-60 char con keyword + brand
- [ ] Meta description 140-160 char con CTA
- [ ] H1 unico con keyword
- [ ] Primo paragrafo answer-first
- [ ] ≥ 1 elemento unico forte (dato/foto/consiglio calibro)
- [ ] 3-6 link interni contestuali
- [ ] ≥ 1 CTA a prodotto
- [ ] Immagini con alt + WebP
- [ ] Schema.org corretto (vedi [06](06-dati-strutturati-schema.md))
- [ ] FAQ con ≥ 3 domande reali
- [ ] URL pulito secondo regole [03](03-architettura-pseo.md)
- [ ] Mobile-friendly e veloce
