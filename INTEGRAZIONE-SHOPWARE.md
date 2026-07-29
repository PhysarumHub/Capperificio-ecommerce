# Integrazione Shopware 6 — Capperificio Caro

> Guida operativa completa. Seguire i passaggi nell'ordine indicato.
> I calibri e le tipologie di aceto sono **varianti** del prodotto padre, non prodotti separati.

---

## Struttura prodotti

| # | Prodotto padre | Gruppo variante | Varianti | Prezzo |
|---|----------------|-----------------|----------|--------|
| 1 | Capperi di Racale al Sale Marino Integrale | Calibro | Lilliput / Occhio di Pernice / Lacrimella / Capperone | 5,50 € |
| 2 | Capperi di Racale all'Aceto | Calibro | Lilliput / Occhio di Pernice / Lacrimella / Capperone | 6,50 € |
| 3 | Cucunci all'Aceto | Tipo di Aceto | Aceto di Mele / Aceto di Riso / Aceto di Melograno | 7,00 € |
| 4 | Polvere di Cappero Extrafine | *(prodotto singolo)* | — | 10,00 € |
| 5 | Foglie di Cappero al Sale Marino | Formato | 50 g / 150 g | 5,00 € |

---

## FASE 1 — Setup iniziale

### 1.1 Script setup (una sola volta)

```bash
python sunrise-coffee/scripts/setup-custom-fields.py
```

Crea i custom field `capperificio_*` nell'admin Shopware. Verificare in
*Admin → Impostazioni → Sistema → Custom field*.

### 1.2 Creare i Gruppi di Proprietà

*Admin → Cataloghi → Proprietà → Crea gruppo*

Creare i seguenti gruppi nell'ordine (l'ordine influenza la tabella tecnica in frontend):

| Gruppo | Tipo di visualizzazione |
|--------|------------------------|
| Origine | Testo |
| Ingredienti | Testo |
| Calibro | Testo |
| Peso netto | Testo |
| Note di gusto | Testo |
| Ideale per | Testo |

> Le singole **opzioni** (es. "Racale (Salento, Puglia)") si creano all'interno di ogni gruppo
> oppure direttamente durante la compilazione del prodotto.

### 1.3 Creare le categorie

*Admin → Cataloghi → Categorie*

```
Capperificio Caro (root)
├── Capperi al Sale
├── Capperi all'Aceto
├── Cucunci
├── Polvere
└── Foglie
```

### 1.4 Aggiornare PROPERTY_ORDER nel frontend

In [`ProductDetail.jsx:272`](sunrise-coffee/src/components/ProductDetail/ProductDetail.jsx#L272):

```js
const PROPERTY_ORDER = ['Origine', 'Ingredienti', 'Calibro', 'Peso netto', 'Note di gusto', 'Ideale per'];
```

In [`ProductDetail.jsx:427`](sunrise-coffee/src/components/ProductDetail/ProductDetail.jsx#L427):
```js
// da:   group === 'Tasting notes'
// a:    group === 'Note di gusto'
```

---

## FASE 2 — Prodotto 1: Capperi di Racale al Sale Marino Integrale

### 2.1 Prodotto padre

*Admin → Cataloghi → Prodotti → Crea prodotto*

| Campo | Valore |
|-------|--------|
| Nome | Capperi di Racale al Sale Marino Integrale |
| Numero prodotto (padre) | `CAP-SALE` |
| Categoria | Capperi al Sale |
| Produttore | Capperificio Caro |
| Aliquota IVA | 4% |
| Attivo | Sì |

**Descrizione breve**
```
Capperi di Racale selezionati a mano, classificati per calibro e conservati sotto sale marino integrale pugliese per almeno 25 giorni. Nessun additivo, nessuna cottura.
```

**Descrizione lunga**
```
I capperi del Capperificio Caro nascono a Racale, nel cuore del Salento, dove la famiglia li raccoglie e classifica a mano per calibro — un gesto di precisione artigianale che non esiste altrove. Ogni bocciolo viene subito stratificato con sale marino integrale delle saline pugliesi e rimescolato quotidianamente per almeno 25 giorni secondo la tradizione di famiglia. Scegli il calibro che preferisci: ogni formato ha un carattere diverso, tutte le varianti condividono la stessa origine e lo stesso processo.
```

**Custom field (sul padre — valori condivisi da tutte le varianti):**

| Custom field | Valore |
|---|---|
| `capperificio_brew_aeropress` *(Conservazione)* | `<p>Conservare in luogo fresco e asciutto. Dopo l'apertura tenere i capperi coperti dal sale; non necessitano di refrigerazione.</p>` |

**Proprietà (sul padre — comuni a tutte le varianti):**

| Gruppo | Opzione |
|--------|---------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi 80% – Sale marino integrale 20% |

---

### 2.2 Configuratore varianti

*Tab "Varianti" → "Configurazione variante" → Aggiungi gruppo*

**Gruppo:** `Calibro`

| Opzione | Valore visualizzato |
|---------|---------------------|
| `lilliput` | Lilliput |
| `occhio-di-pernice` | Occhio di Pernice |
| `lacrimella` | Lacrimella |
| `capperone` | Capperone |

→ **Genera varianti** (Shopware creerà 4 varianti figlio)

---

### 2.3 Varianti figlio — dati comuni

Ogni variante eredita dal padre nome, descrizione e proprietà comuni.
Compilare per ciascuna variante i campi qui sotto.

---

#### Variante A — Lilliput

| Campo | Valore |
|-------|--------|
| Numero prodotto | `CAP-SALE-LILLIPUT` |
| Prezzo lordo | **5,50 €** |
| Stock | 100 |
| Peso spedizione | 0,20 kg |

**Proprietà aggiuntive (specifiche della variante):**

| Gruppo | Opzione |
|--------|---------|
| Calibro | Lilliput · Ø 4–6 mm |
| Peso netto | 75 g |
| Note di gusto | Intenso · Fragrante · Persistente · Floreale |
| Ideale per | Cucina gourmet, crudi, finger food |

**Custom field:**

| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Lilliput · Ø 4–6 mm |
| `capperificio_bullet_1` | **Lilliput** (Ø 4–6 mm): il calibro più piccolo e pregiato, la firma del Capperificio Caro |
| `capperificio_bullet_2` | Selezionato uno per uno a mano nei campi di Racale |
| `capperificio_bullet_3` | Concentrato di aromi mediterranei, non di sale |
| `capperificio_brew_pour_over` *(In cucina)* | `<p>Aggiungilo crudo a fine cottura: su carpacci, tartare, burrata o crema di fave.</p>` |
| `capperificio_brew_drip` *(Abbinamenti)* | `<p>Perfetto con pesce crudo, burrata pugliese e formaggi freschi.</p>` |
| `capperificio_brew_plunger` *(Lo sapevi?)* | `<p>Fu Nonno Quintino a valorizzare questi boccioli minuscoli, battezzandoli "Lilliput": il nome racconta tutto.</p>` |

---

#### Variante B — Occhio di Pernice

| Campo | Valore |
|-------|--------|
| Numero prodotto | `CAP-SALE-OCCHIO` |
| Prezzo lordo | **5,50 €** |
| Stock | 100 |
| Peso spedizione | 0,30 kg |

**Proprietà aggiuntive:**

| Gruppo | Opzione |
|--------|---------|
| Calibro | Occhio di Pernice · Ø 7–9 mm |
| Peso netto | 150 g |
| Note di gusto | Sapido · Equilibrato · Floreale · Erbaceo |
| Ideale per | Insalate, primi piatti, salse, uso quotidiano |

**Custom field:**

| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Occhio di Pernice · Ø 7–9 mm |
| `capperificio_bullet_1` | **Occhio di Pernice** (Ø 7–9 mm): il più versatile della selezione |
| `capperificio_bullet_2` | Sapidità fine, mai invadente — il punto di partenza ideale |
| `capperificio_bullet_3` | Ottimo intero, tritato o in infusione nell'olio extravergine |
| `capperificio_brew_pour_over` *(In cucina)* | `<p>Versatile ovunque: intero nelle insalate, tritato nelle salse, in infusione nell'olio.</p>` |
| `capperificio_brew_drip` *(Abbinamenti)* | `<p>Con pesce al forno, verdure grigliate e pasta alla puttanesca.</p>` |
| `capperificio_brew_plunger` *(Lo sapevi?)* | `<p>A Racale classifichiamo i capperi per calibro uno per uno: una precisione che non esiste altrove in Italia.</p>` |

---

#### Variante C — Lacrimella

| Campo | Valore |
|-------|--------|
| Numero prodotto | `CAP-SALE-LACRIMELLA` |
| Prezzo lordo | **5,50 €** |
| Stock | 100 |
| Peso spedizione | 0,42 kg |

**Proprietà aggiuntive:**

| Gruppo | Opzione |
|--------|---------|
| Calibro | Lacrimella · Ø 9–11 mm |
| Peso netto | 250 g |
| Note di gusto | Pieno · Carnoso · Morbido · Leggermente dolce |
| Ideale per | Caponata, ragù di pesce, pasta fredda |

**Custom field:**

| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Lacrimella · Ø 9–11 mm |
| `capperificio_bullet_1` | **Lacrimella** (Ø 9–11 mm): polpa carnosa, gusto pieno e rotondo |
| `capperificio_bullet_2` | Regge la cottura senza perdere struttura né aroma |
| `capperificio_bullet_3` | Il cappero che convince anche chi credeva di non amarli |
| `capperificio_brew_pour_over` *(In cucina)* | `<p>Perfetta in caponata, ragù di pesce e pasta alla Norma. La polpa carnosa regge la cottura.</p>` |
| `capperificio_brew_drip` *(Abbinamenti)* | `<p>Con melanzane, pomodori secchi, tonno sott'olio e acciughe.</p>` |
| `capperificio_brew_plunger` *(Lo sapevi?)* | `<p>La polpa più spessa del calibro medio trattiene meglio i succhi durante la cottura.</p>` |

---

#### Variante D — Capperone

| Campo | Valore |
|-------|--------|
| Numero prodotto | `CAP-SALE-CAPPERONE` |
| Prezzo lordo | **5,50 €** |
| Stock | 100 |
| Peso spedizione | 0,42 kg |

**Proprietà aggiuntive:**

| Gruppo | Opzione |
|--------|---------|
| Calibro | Capperone · Ø 12–15 mm |
| Peso netto | 250 g |
| Note di gusto | Marcato · Carnoso · Aromatico · Persistente |
| Ideale per | Sughi lunghi, tritato, disidratato, secondi |

**Custom field:**

| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Capperone · Ø 12–15 mm |
| `capperificio_bullet_1` | **Capperone** (Ø 12–15 mm): il più grande e audace, resiste alle cotture lunghe |
| `capperificio_bullet_2` | Alta concentrazione di oli essenziali: sprigiona aroma a lungo |
| `capperificio_bullet_3` | Perfetto tritato in sugo o disidratato come insaporitore |
| `capperificio_brew_pour_over` *(In cucina)* | `<p>Ideale nei sughi lunghi e nelle cotture in casseruola. Ottimo tritato su bruschette con pomodoro e origano.</p>` |
| `capperificio_brew_drip` *(Abbinamenti)* | `<p>Con carni saporite, pesce azzurro e piatti della cucina salentina tradizionale.</p>` |
| `capperificio_brew_plunger` *(Lo sapevi?)* | `<p>Il Capperone viene raccolto pochi giorni prima che il bocciolo diventi cucuncio.</p>` |

---

## FASE 3 — Prodotto 2: Capperi di Racale all'Aceto

### 3.1 Prodotto padre

| Campo | Valore |
|-------|--------|
| Nome | Capperi di Racale all'Aceto |
| Numero prodotto (padre) | `CAP-ACETO` |
| Categoria | Capperi all'Aceto |
| Produttore | Capperificio Caro |
| Aliquota IVA | 4% |

**Descrizione breve**
```
Gli stessi calibri della linea al sale, conservati in aceto di vino bianco. Pronti all'uso — nessuna dissalatura, nessun ammollo.
```

**Descrizione lunga**
```
I capperi di Racale classificati per calibro, marinati in aceto di vino bianco selezionato anziché sotto sale. La marinatura li rende pronti all'uso immediato: si aggiungono direttamente nel piatto preservando la vivacità aromatica e aggiungendo una nota acidula che bilancia la sapidità naturale del cappero. Scegli il calibro: ogni variante ha un carattere diverso.
```

**Custom field (padre — conservazione condivisa):**

| Custom field | Valore |
|---|---|
| `capperificio_brew_aeropress` *(Conservazione)* | `<p>Luogo fresco e asciutto. Dopo l'apertura tenere in frigorifero immersi nel liquido di governo.</p>` |

**Proprietà comuni (padre):**

| Gruppo | Opzione |
|--------|---------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi, aceto di vino bianco, sale |

---

### 3.2 Configuratore varianti

**Gruppo:** `Calibro` *(stesso gruppo creato per il prodotto 1 — riutilizzabile)*

| Opzione |
|---------|
| Lilliput |
| Occhio di Pernice |
| Lacrimella |
| Capperone |

→ **Genera varianti** (4 varianti figlio)

---

### 3.3 Varianti figlio

#### Variante A — Lilliput all'Aceto

| Campo | Valore |
|-------|--------|
| Numero prodotto | `CAP-ACETO-LILLIPUT` |
| Prezzo lordo | **6,50 €** |
| Stock | 100 |
| Peso spedizione | 0,20 kg |

**Proprietà aggiuntive:**

| Gruppo | Opzione |
|--------|---------|
| Calibro | Lilliput · Ø 4–6 mm |
| Peso netto | 75 g |
| Note di gusto | Intenso · Floreale · Acidulo |
| Ideale per | Uso diretto, crudi, finger food, aperitivi |

**Custom field:**

| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Lilliput · Ø 4–6 mm · all'Aceto |
| `capperificio_bullet_1` | **Lilliput all'Aceto** (Ø 4–6 mm): pronto all'uso, intenso e vivace |
| `capperificio_bullet_2` | Nessuna dissalatura: direttamente dal barattolo al piatto |
| `capperificio_bullet_3` | L'aceto esalta le note floreali del bocciolo più piccolo |
| `capperificio_brew_pour_over` *(In cucina)* | `<p>Direttamente dal barattolo su carpacci, crudi di pesce e finger food.</p>` |
| `capperificio_brew_drip` *(Abbinamenti)* | `<p>Con ostriche, gamberi crudi, burrata e ovunque serva una nota acida brillante.</p>` |
| `capperificio_brew_plunger` *(Lo sapevi?)* | `<p>Il liquido di governo è ottimo in vinaigrette o per degassare la padella: non buttarlo.</p>` |

---

#### Variante B — Occhio di Pernice all'Aceto

| Campo | Valore |
|-------|--------|
| Numero prodotto | `CAP-ACETO-OCCHIO` |
| Prezzo lordo | **6,50 €** |
| Stock | 100 |
| Peso spedizione | 0,30 kg |

**Proprietà aggiuntive:**

| Gruppo | Opzione |
|--------|---------|
| Calibro | Occhio di Pernice · Ø 7–9 mm |
| Peso netto | 150 g |
| Note di gusto | Sapido · Acidulo · Floreale · Equilibrato |
| Ideale per | Insalate, salse fredde, pasta, formaggi |

**Custom field:**

| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Occhio di Pernice · Ø 7–9 mm · all'Aceto |
| `capperificio_bullet_1` | **Occhio di Pernice all'Aceto** (Ø 7–9 mm): versatile e pronto all'uso |
| `capperificio_bullet_2` | Sapidità fine e acidità vivace, mai aggressiva |
| `capperificio_bullet_3` | Dal barattolo al piatto: nessuna preparazione |
| `capperificio_brew_pour_over` *(In cucina)* | `<p>Direttamente in insalate, salse fredde, pasta saltata o su formaggi.</p>` |
| `capperificio_brew_drip` *(Abbinamenti)* | `<p>Con tonno, acciughe, uova sode e pomodori freschi.</p>` |
| `capperificio_brew_plunger` *(Lo sapevi?)* | `<p>Il liquido di governo è un condimento pronto: usalo in vinaigrette o per aromatizzare marinature.</p>` |

---

#### Variante C — Lacrimella all'Aceto

| Campo | Valore |
|-------|--------|
| Numero prodotto | `CAP-ACETO-LACRIMELLA` |
| Prezzo lordo | **6,50 €** |
| Stock | 100 |
| Peso spedizione | 0,42 kg |

**Proprietà aggiuntive:**

| Gruppo | Opzione |
|--------|---------|
| Calibro | Lacrimella · Ø 9–11 mm |
| Peso netto | 250 g |
| Note di gusto | Pieno · Carnoso · Acidulo · Rotondo |
| Ideale per | Pasta, secondi, salse, caponata |

**Custom field:**

| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Lacrimella · Ø 9–11 mm · all'Aceto |
| `capperificio_bullet_1` | **Lacrimella all'Aceto** (Ø 9–11 mm): polpa carnosa, pronta all'uso |
| `capperificio_bullet_2` | In cottura l'aceto evapora, il cappero resta integro e profumato |
| `capperificio_bullet_3` | La più versatile della linea aceto |
| `capperificio_brew_pour_over` *(In cucina)* | `<p>In padella a metà cottura: l'aceto evapora e la polpa rimane intatta. Perfetta in puttanesca e caponata.</p>` |
| `capperificio_brew_drip` *(Abbinamenti)* | `<p>Con melanzane, tonno, acciughe e olive nere.</p>` |
| `capperificio_brew_plunger` *(Lo sapevi?)* | `<p>Il liquido di governo ridotto con miele diventa una salsa agrodolce pronta in 2 minuti.</p>` |

---

#### Variante D — Capperone all'Aceto

| Campo | Valore |
|-------|--------|
| Numero prodotto | `CAP-ACETO-CAPPERONE` |
| Prezzo lordo | **6,50 €** |
| Stock | 100 |
| Peso spedizione | 0,42 kg |

**Proprietà aggiuntive:**

| Gruppo | Opzione |
|--------|---------|
| Calibro | Capperone · Ø 12–15 mm |
| Peso netto | 250 g |
| Note di gusto | Audace · Selvatico · Persistente |
| Ideale per | Sughi lunghi, secondi, cucina pugliese |

**Custom field:**

| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Capperone · Ø 12–15 mm · all'Aceto |
| `capperificio_bullet_1` | **Capperone all'Aceto** (Ø 12–15 mm): audace e persistente |
| `capperificio_bullet_2` | Struttura carnosa che regge le cotture lunghe |
| `capperificio_bullet_3` | Un ingrediente strutturale, non un semplice condimento |
| `capperificio_brew_pour_over` *(In cucina)* | `<p>Protagonista in sughi lunghi, coniglio alla cacciatora e triglie alla livornese.</p>` |
| `capperificio_brew_drip` *(Abbinamenti)* | `<p>Con carni saporite, pesce azzurro, 'nduja e formaggi stagionati.</p>` |
| `capperificio_brew_plunger` *(Lo sapevi?)* | `<p>Stesso calibro del cucuncio, pochi giorni prima della trasformazione in frutto: esperienze di gusto completamente diverse.</p>` |

---

## FASE 4 — Prodotto 3: Cucunci all'Aceto

### 4.1 Prodotto padre

| Campo | Valore |
|-------|--------|
| Nome | Cucunci all'Aceto |
| Numero prodotto (padre) | `CUC-ACETO` |
| Categoria | Cucunci |
| Produttore | Capperificio Caro |
| Aliquota IVA | 4% |

**Descrizione breve**
```
I frutti della pianta del cappero di Racale, marinati in tre aceti diversi. Polpa carnosa, semi croccanti, gusto più morbido e fruttato del cappero. Scegli il tipo di aceto.
```

**Descrizione lunga**
```
I cucunci sono i boccioli che non vengono raccolti in tempo: fioriscono e si trasformano in frutti allungati, con polpa più sviluppata e semi croccanti. Il gusto è diverso dal cappero — più morbido, fruttato, con una nota selvatica unica. A Racale vengono marinati in tre aceti differenti, ciascuno con un profilo aromatico ben distinto: scegli quello che si abbina meglio alla tua cucina.
```

**Custom field (padre):**

| Custom field | Valore |
|---|---|
| `capperificio_brew_aeropress` *(Conservazione)* | `<p>Luogo fresco. Dopo l'apertura tenere in frigorifero immersi nel liquido di governo. Il liquido è un ottimo condimento: non buttarlo.</p>` |

**Proprietà comuni (padre):**

| Gruppo | Opzione |
|--------|---------|
| Origine | Racale (Salento, Puglia) |
| Peso netto | 200 g |

---

### 4.2 Configuratore varianti

*Nuovo gruppo:* `Tipo di Aceto`

| Opzione |
|---------|
| Aceto di Mele |
| Aceto di Riso |
| Aceto di Melograno |

→ **Genera varianti** (3 varianti figlio)

---

### 4.3 Varianti figlio

#### Variante A — Aceto di Mele

| Campo | Valore |
|-------|--------|
| Numero prodotto | `CUC-ACETO-MELE` |
| Prezzo lordo | **7,00 €** |
| Stock | 100 |
| Peso spedizione | 0,35 kg |

**Proprietà aggiuntive:**

| Gruppo | Opzione |
|--------|---------|
| Ingredienti | Cucunci di cappero, aceto di mele biologico, sale |
| Note di gusto | Fruttato · Morbido · Dolce · Rotondo |
| Ideale per | Taglieri, crostini, formaggi freschi, carni bianche |

**Custom field:**

| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Cucunci · all'Aceto di Mele |
| `capperificio_bullet_1` | In aceto di mele biologico: dolcezza fruttata e acidità morbida |
| `capperificio_bullet_2` | La versione più accessibile — il punto di partenza per chi scopre i cucunci |
| `capperificio_bullet_3` | Polpa carnosa, semi croccanti, retrogusto di mela matura |
| `capperificio_brew_pour_over` *(In cucina)* | `<p>In un tagliere di salumi e formaggi, su crostini con stracciatella e miele.</p>` |
| `capperificio_brew_drip` *(Abbinamenti)* | `<p>Con formaggi freschi, prosciutto crudo e frutta secca. Ottimi in insalata con rucola, pere e noci.</p>` |
| `capperificio_brew_plunger` *(Lo sapevi?)* | `<p>Il cucuncio nasce dal bocciolo che sfugge alla raccolta: invece di diventare cappero, fiorisce e si trasforma in frutto.</p>` |

---

#### Variante B — Aceto di Riso

| Campo | Valore |
|-------|--------|
| Numero prodotto | `CUC-ACETO-RISO` |
| Prezzo lordo | **7,00 €** |
| Stock | 100 |
| Peso spedizione | 0,35 kg |

**Proprietà aggiuntive:**

| Gruppo | Opzione |
|--------|---------|
| Ingredienti | Cucunci di cappero, aceto di riso, sale |
| Note di gusto | Pulito · Delicato · Floreale · Erbaceo |
| Ideale per | Cucina fusion, carpacci, crudi |

**Custom field:**

| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Cucunci · all'Aceto di Riso |
| `capperificio_bullet_1` | In aceto di riso: l'aceto più delicato, lascia parlare il frutto |
| `capperificio_bullet_2` | Gusto pulito e floreale, texture quasi seta con semi croccanti |
| `capperificio_bullet_3` | La versione più raffinata — ispirazione fusion Salento-Oriente |
| `capperificio_brew_pour_over` *(In cucina)* | `<p>Su carpacci di pesce spada, tartare di tonno e insalate con finocchio.</p>` |
| `capperificio_brew_drip` *(Abbinamenti)* | `<p>Con pesce crudo, ceviche mediterraneo e formaggi freschi a pasta molle.</p>` |
| `capperificio_brew_plunger` *(Lo sapevi?)* | `<p>L'aceto di riso è usato in Giappone da oltre 2.000 anni per preservare senza coprire.</p>` |

---

#### Variante C — Aceto di Melograno

| Campo | Valore |
|-------|--------|
| Numero prodotto | `CUC-ACETO-MELOGRANO` |
| Prezzo lordo | **7,00 €** |
| Stock | 100 |
| Peso spedizione | 0,35 kg |

**Proprietà aggiuntive:**

| Gruppo | Opzione |
|--------|---------|
| Ingredienti | Cucunci di cappero, aceto di melograno, sale |
| Note di gusto | Intenso · Vinoso · Fruttato amaro · Persistente |
| Ideale per | Carni rosse, formaggi stagionati, cucina creativa |

**Custom field:**

| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Cucunci · all'Aceto di Melograno |
| `capperificio_bullet_1` | In aceto di melograno: note vinose, retrogusto fruttato amaro |
| `capperificio_bullet_2` | Il liquido tinge la polpa di rosa rubino — bello nel piatto, straordinario al palato |
| `capperificio_bullet_3` | La versione più intensa e complessa della linea |
| `capperificio_brew_pour_over` *(In cucina)* | `<p>Con carni rosse marinate, selvaggina e piatti mediorientali. Ottimi in un risotto con melograno fresco.</p>` |
| `capperificio_brew_drip` *(Abbinamenti)* | `<p>Con formaggi stagionati, salumi di maiale e piatti agrodolci.</p>` |
| `capperificio_brew_plunger` *(Lo sapevi?)* | `<p>Il melograno e il cappero crescono nel bacino del Mediterraneo da millenni: questi cucunci sono il loro primo incontro.</p>` |

---

## FASE 5 — Prodotto 4: Polvere di Cappero Extrafine *(prodotto singolo)*

### 5.1 Prodotto (nessuna variante)

| Campo | Valore |
|-------|--------|
| Nome | Polvere di Cappero Extrafine |
| Numero prodotto | `CAP-POLVERE-50` |
| Prezzo lordo | **10,00 €** |
| Stock | 100 |
| Peso netto | 50 g |
| Peso spedizione | 0,12 kg |
| Categoria | Polvere |
| Aliquota IVA | 4% |

**Descrizione breve**
```
Capperi di Racale dissalati, essiccati a bassa temperatura e ridotti in polvere extrafine. Un insaporitore naturale concentratissimo. 100% naturale, senza additivi.
```

**Descrizione lunga**
```
La Polvere di Cappero Extrafine nasce dall'essiccazione lenta a meno di 40°C dei capperi di Racale: una temperatura che preserva intatti gli oli essenziali della pianta. Il risultato è una polvere verde salvia, profumatissima e concentratissima. Un cucchiaino basta per trasformare fondi, salse e finiture. 100% naturale, senza conservanti né additivi.
```

**Proprietà:**

| Gruppo | Opzione |
|--------|---------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi disidratati, sale marino integrale — 100% naturale |
| Calibro | Polvere extrafine |
| Peso netto | 50 g |
| Note di gusto | Concentrato · Sapido · Persistente · Aromatico |
| Ideale per | Fondi, brodi, salse, finitura a crudo, burro aromatico |

**Custom field:**

| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Polvere Extrafine |
| `capperificio_bullet_1` | Essiccazione lenta a < 40°C: tutti gli oli essenziali del cappero preservati |
| `capperificio_bullet_2` | 100% naturale — solo cappero di Racale e sale marino |
| `capperificio_bullet_3` | Un cucchiaino trasforma fondi, salse e finiture |
| `capperificio_brew_pour_over` *(In cucina)* | `<p>Si scioglie in fondi e salse; spolverata a crudo su pasta o carpaccio; mischiata al burro per un condimento intenso. Dosare con parsimonia.</p>` |
| `capperificio_brew_drip` *(Abbinamenti)* | `<p>Insaporitore universale per primi, secondi e marinature. Eccellente nel burro per bistecche.</p>` |
| `capperificio_brew_aeropress` *(Conservazione)* | `<p>Luogo fresco, asciutto e al riparo dalla luce. Richiudere bene dopo ogni uso.</p>` |
| `capperificio_brew_plunger` *(Lo sapevi?)* | `<p>Nasce dal recupero dei capperi imperfetti per la conservazione intera: uno scarto nobilitato dalla lentezza dell'essiccazione.</p>` |

---

## FASE 6 — Prodotto 5: Foglie di Cappero al Sale Marino

### 6.1 Prodotto padre

| Campo | Valore |
|-------|--------|
| Nome | Foglie di Cappero al Sale Marino |
| Numero prodotto (padre) | `CAP-FOGLIE` |
| Categoria | Foglie |
| Produttore | Capperificio Caro |
| Aliquota IVA | 4% |

**Descrizione breve**
```
Le foglie giovani della pianta del cappero: gusto fresco, minerale, consistenza croccante. Raccolte tra maggio e settembre, solo le più tenere.
```

**Descrizione lunga**
```
Le Foglie di Cappero (Capparis spinosa) sono la parte meno conosciuta della pianta, ma sempre più apprezzata in cucina. Gusto fresco e minerale con un lieve amarognolo, consistenza croccante. Si raccolgono tra maggio e settembre, solo le foglie giovani e tenere — quelle più vecchie vengono scartate. Perfette fritte in pastella, in involtini o tritate fresche su tartare.
```

**Custom field (padre):**

| Custom field | Valore |
|---|---|
| `capperificio_brew_aeropress` *(Conservazione)* | `<p>Luogo fresco e asciutto. Tenere le foglie coperte dal sale dopo l'apertura.</p>` |

**Proprietà comuni (padre):**

| Gruppo | Opzione |
|--------|---------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Foglie di cappero 80% – Sale marino integrale 20% |
| Calibro | Foglie giovani e tenere, raccolta maggio–settembre |
| Note di gusto | Fresco · Minerale · Erbaceo · Lieve amaro |
| Ideale per | Frittura in pastella, involtini, insalate, tartare |

---

### 6.2 Configuratore varianti

*Nuovo gruppo:* `Formato`

| Opzione |
|---------|
| 50 g |
| 150 g |

→ **Genera varianti** (2 varianti figlio)

---

### 6.3 Varianti figlio

#### Variante A — 50 g

| Campo | Valore |
|-------|--------|
| Numero prodotto | `CAP-FOGLIE-50` |
| Prezzo lordo | **5,00 €** |
| Stock | 100 |
| Peso spedizione | 0,15 kg |

**Proprietà aggiuntiva:**

| Gruppo | Opzione |
|--------|---------|
| Peso netto | 50 g |

**Custom field:**

| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Foglie di Cappero · 50 g |
| `capperificio_bullet_1` | Foglie giovani e tenere: fresche, minerali, croccanti |
| `capperificio_bullet_2` | Raccolte a mano tra maggio e settembre, solo le più giovani |
| `capperificio_bullet_3` | Fritte in pastella, in involtini o fresche su tartare |
| `capperificio_brew_pour_over` *(In cucina)* | `<p>Dopo breve dissalatura: fritte in pastella, come foglie di vite per involtini, o tritate su tartare.</p>` |
| `capperificio_brew_drip` *(Abbinamenti)* | `<p>Con pesce crudo e carpacci. Fritte in pastella sono irresistibili con salsa allo yogurt e menta.</p>` |
| `capperificio_brew_plunger` *(Lo sapevi?)* | `<p>Nella tradizione salentina tutto della pianta ha valore: le foglie non si buttavano. Oggi le cuciniamo.</p>` |

---

#### Variante B — 150 g

| Campo | Valore |
|-------|--------|
| Numero prodotto | `CAP-FOGLIE-150` |
| Prezzo lordo | **5,00 €** |
| Stock | 100 |
| Peso spedizione | 0,30 kg |

**Proprietà aggiuntiva:**

| Gruppo | Opzione |
|--------|---------|
| Peso netto | 150 g |

**Custom field:** *(stessi valori della variante 50 g — solo `capperificio_calibro` cambia)*

| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Foglie di Cappero · 150 g |

*(tutti gli altri custom field: identici alla variante 50 g)*

---

## Riepilogo SKU

| Prodotto padre | SKU padre | Variante | SKU variante | Prezzo |
|----------------|-----------|----------|--------------|--------|
| Capperi al Sale | `CAP-SALE` | Lilliput | `CAP-SALE-LILLIPUT` | 5,50 € |
| | | Occhio di Pernice | `CAP-SALE-OCCHIO` | 5,50 € |
| | | Lacrimella | `CAP-SALE-LACRIMELLA` | 5,50 € |
| | | Capperone | `CAP-SALE-CAPPERONE` | 5,50 € |
| Capperi all'Aceto | `CAP-ACETO` | Lilliput | `CAP-ACETO-LILLIPUT` | 6,50 € |
| | | Occhio di Pernice | `CAP-ACETO-OCCHIO` | 6,50 € |
| | | Lacrimella | `CAP-ACETO-LACRIMELLA` | 6,50 € |
| | | Capperone | `CAP-ACETO-CAPPERONE` | 6,50 € |
| Cucunci all'Aceto | `CUC-ACETO` | Aceto di Mele | `CUC-ACETO-MELE` | 7,00 € |
| | | Aceto di Riso | `CUC-ACETO-RISO` | 7,00 € |
| | | Aceto di Melograno | `CUC-ACETO-MELOGRANO` | 7,00 € |
| Polvere | *(singolo)* | — | `CAP-POLVERE-50` | 10,00 € |
| Foglie | `CAP-FOGLIE` | 50 g | `CAP-FOGLIE-50` | 5,00 € |
| | | 150 g | `CAP-FOGLIE-150` | 5,00 € |

---

## Checklist operativa

### Setup (una sola volta)
- [ ] Eseguire `setup-custom-fields.py`
- [ ] Creare i 6 Gruppi di Proprietà (Origine, Ingredienti, Calibro, Peso netto, Note di gusto, Ideale per)
- [ ] Creare le 5 categorie
- [ ] Aggiornare `PROPERTY_ORDER` e `Tasting notes` → `Note di gusto` in `ProductDetail.jsx`

### Per ogni prodotto padre
- [ ] Creare il prodotto con nome, descrizione, categoria, IVA 4%
- [ ] Assegnare le proprietà comuni (Origine, Ingredienti)
- [ ] Compilare il custom field Conservazione
- [ ] Configurare il gruppo variante e generare le varianti

### Per ogni variante figlio
- [ ] Impostare SKU, prezzo, stock, peso spedizione
- [ ] Assegnare le proprietà specifiche (Calibro, Peso netto, Note di gusto, Ideale per)
- [ ] Compilare tutti i custom field specifici (calibro, bullet 1/2/3, in cucina, abbinamenti, lo sapevi?)
- [ ] Caricare immagine specifica della variante (opzionale)

### Verifica finale
- [ ] Aprire ogni product page e verificare: tabella tecnica, badge calibro, bullet, accordion
- [ ] Verificare che il selettore variante mostri le opzioni corrette
- [ ] Verificare i prezzi per ogni variante
