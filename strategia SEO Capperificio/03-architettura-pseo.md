# 03 — Architettura della Programmatic SEO

> Come trasformare 7 prodotti + dataset in centinaia di pagine di valore,
> senza cadere nel duplicate/thin content.

## Principio: Template + Dataset = Pagine

```
TEMPLATE (struttura fissa, ottimizzata)  ×  DATASET (righe = varianti)  =  N pagine uniche
```

La chiave per non essere penalizzati: **ogni riga del dataset porta contenuto realmente
diverso** (dato, foto, consiglio, abbinamento, calibro consigliato), non solo la sostituzione
di una parola.

---

## I 6 tipi di pagina (page types)

### TIPO A — Pillar (1 pagina)
**URL**: `/cappero-di-racale`
Pagina madre dell'intero ecosistema. ~1.500–2.500 parole. Collega a tutto: calibri, ricette,
conservazione, storia, prodotti. È l'hub centrale dell'internal linking.

### TIPO B — Schede prodotto (7+ pagine)
**URL**: `/prodotti/{slug}` (es. `/prodotti/cappero-lilliput-sale-marino`)
Le 7 schede già esistenti, ottimizzate SEO+AEO (vedi [04](04-template-pagine.md) e [06](06-dati-strutturati-schema.md)).

### TIPO C — Hub tematici (4–6 pagine)
Pagine di raccolta che organizzano i cluster e distribuiscono link.
- `/calibri-del-cappero` — guida + tabella comparativa (dataset unico!)
- `/ricette-con-i-capperi` — indice di tutte le ricette
- `/come-usare-i-capperi` — guida usi + abbinamenti
- `/capperi-conservazione` — sotto sale, dissalare, conservare
- `/horeca-capperi-ingrosso` — landing B2B

### TIPO D — Pagine ricetta (PROGRAMMATICHE, 30→150 pagine)
**URL**: `/ricette/{slug}` (es. `/ricette/spaghetti-alla-puttanesca-con-capperi`)
Generate da un **dataset ricette**. È il motore principale di traffico longtail.

### TIPO E — Pagine "uso/abbinamento" (PROGRAMMATICHE, 10–30 pagine)
**URL**: `/abbinamenti/capperi-e-{ingrediente}` (es. `/abbinamenti/capperi-e-pesce`)
Generate da un **dataset abbinamenti**.

### TIPO F — SA informazionali (10–20 pagine)
**URL**: `/guide/{slug}` (es. `/guide/come-dissalare-i-capperi`)
Articoli di conoscenza che catturano top-funnel e alimentano l'AEO.

---

## Struttura URL (regole)

- ✅ Tutto minuscolo, parole separate da `-`, senza accenti/caratteri speciali.
- ✅ Brevi e descrittive, keyword principale nello slug.
- ✅ Cartelle coerenti per tipo: `/ricette/`, `/guide/`, `/abbinamenti/`, `/prodotti/`.
- ❌ Niente parametri inutili, niente ID, niente date nello slug.
- ❌ Evita query string per contenuti indicizzabili (la SPA React deve servire URL reali — vedi [08](08-technical-seo.md)).

---

## DATASET 1 — Ricette (motore principale)

Struttura dati suggerita (`ricette.json` o tabella Strapi/CMS):

```json
{
  "slug": "spaghetti-alla-puttanesca-con-capperi",
  "titolo": "Spaghetti alla Puttanesca con Capperi di Racale",
  "h1": "Spaghetti alla puttanesca: la ricetta autentica con i capperi",
  "intro": "...",
  "calibro_consigliato": "CAP-LACRIMELLA-250",
  "perche_questo_calibro": "La Lacrimella ha polpa carnosa che regge la cottura nel sugo...",
  "ingredienti": ["spaghetti 320g", "capperi 30g", "olive 50g", "..."],
  "preparazione": ["...", "..."],
  "tempo_minuti": 25,
  "porzioni": 4,
  "difficolta": "facile",
  "abbinamento_vino": "...",
  "varianti": ["senza acciughe", "piccante"],
  "faq": [
    {"q": "Si possono usare capperi sotto sale?", "a": "Sì, vanno dissalati..."},
    {"q": "Quale cappero è meglio per la puttanesca?", "a": "Il Lacrimella o il Capperone..."}
  ],
  "prodotti_correlati": ["CAP-LACRIMELLA-250", "CAP-CAPPERONE-250"],
  "immagine": "/img/ricette/puttanesca.jpg"
}
```

**Campi che garantiscono unicità per pagina**: `perche_questo_calibro`, `faq`, `varianti`,
`abbinamento_vino`, immagine propria. Questi NON devono essere boilerplate ripetuto.

### Seed ricette (lista di partenza — 40 voci)

Primi · Secondi di pesce · Secondi di carne · Antipasti · Salse · Insalate · Lievitati

```
PRIMI:
spaghetti alla puttanesca · pasta con capperi e pomodorini · pasta alla siciliana ·
spaghetti con acciughe e capperi · pasta fredda con capperi · risotto al limone e capperi ·
linguine al pesto di capperi · pasta con tonno e capperi

SECONDI PESCE:
pesce spada alla ghiotta · baccalà con capperi · branzino al forno con capperi ·
tonno in agrodolce · alici marinate con capperi · polpo con capperi e olive

SECONDI CARNE:
vitello tonnato · pollo alla piccata (ai capperi) · involtini con capperi ·
polpette al sugo con capperi · scaloppine ai capperi

ANTIPASTI/SALSE:
salsa tartara · salsa gribiche · pesto di capperi · tapenade · burrata e capperi ·
crostini con capperi · bruschetta capperi e pomodoro · vitello tonnato (salsa)

INSALATE:
insalata pantesca · insalata di riso con capperi · insalata di polpo ·
caponata siciliana · panzanella con capperi

LIEVITATI:
pizza con capperi · focaccia barese con capperi · pane cunzato · sfincione palermitano

FOGLIE/POLVERE (prodotti rari → poca concorrenza):
tartare con foglie di cappero · insalata con foglie di cappero fritte ·
come usare la polvere di capperi · finitura piatti con polvere di cappero
```

---

## DATASET 2 — Abbinamenti

```json
{
  "slug": "capperi-e-pesce",
  "ingrediente": "pesce",
  "titolo": "Capperi e pesce: gli abbinamenti perfetti",
  "calibri_consigliati": ["Lilliput", "Lacrimella", "Capperone"],
  "spiegazione": "...",
  "ricette_collegate": ["pesce-spada-alla-ghiotta", "baccala-con-capperi"]
}
```

Seed: pesce · carne bianca · formaggi · verdure · uova · crostacei · pomodoro · limone · olive · acciughe.

---

## DATASET 3 — Calibri (già esistente nel catalogo!)

Sfrutta [capperificioCatalog.json](../sunrise-coffee/src/data/capperificioCatalog.json):
ogni calibro ha già `calibro`, `properties`, `accordion` → genera la **tabella comparativa**
e le micro-pagine «quando usare il calibro X».

---

## Anti-pattern da evitare (penalizzazioni)

| Rischio | Mitigazione |
|---------|-------------|
| Pagine doorway/thin | minimo 1 elemento unico forte per pagina; soglia ~400+ parole utili |
| Contenuto duplicato tra ricette simili | testo `perche_questo_calibro` e FAQ sempre specifici |
| Cannibalizzazione keyword | 1 intent = 1 pagina; mappa keyword→URL in [02](02-keyword-research.md) |
| Indicizzazione di pagine deboli | pubblica a ondate, monitora in Search Console, `noindex` le scarse |
| Pagine orfane (no link interni) | ogni pagina linkata da hub + pillar + ricette correlate |

## Internal linking (regola d'oro)

```
Pillar  ⇄  Hub tematici  ⇄  Pagine programmatiche  →  Schede prodotto (conversione)
```

Ogni ricetta linka: il **calibro consigliato** (prodotto), 2–3 ricette correlate, l'hub ricette.
Ogni scheda prodotto linka: 2–3 ricette che lo usano + la guida calibri. Vedi [08](08-technical-seo.md).
