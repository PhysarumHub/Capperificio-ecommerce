# Catalogo Prodotti — Capperificio Caro

> Schede prodotto estratte da **CATALOGO CAPPERIFICIO CARO.pdf** e mappate sui campi di
> Shopware 6 e del frontend React (`sunrise-coffee`).
> Usare questo file come fonte unica per popolare l'admin Shopware e verificare la resa nella product page.

## Come leggere questo documento

Ogni scheda contiene quattro blocchi:

1. **Campi standard Shopware** → *Admin → Cataloghi → Prodotti* (`name`, `productNumber`, `description`, prezzo, peso).
2. **Scheda tecnica (Proprietà)** → la tabella label/valore in alto nella product page. In Shopware sono **Proprietà** (gruppo = etichetta riga, opzione = valore).
3. **Custom field Capperificio** → badge calibro, bullet descrittivi e accordion utilizzi.
4. **Resa nel frontend** → dove ogni campo appare in [`ProductDetail.jsx`](sunrise-coffee/src/components/ProductDetail/ProductDetail.jsx).

### Mappatura campi → frontend

| Campo Shopware | Tipo | Dove appare nel frontend |
|----------------|------|--------------------------|
| **Proprietà** (gruppi + opzioni) | property | **Tabella tecnica** in alto |
| `capperificio_calibro` | text | Badge sotto il titolo |
| `capperificio_bullet_1/2/3` | text | Lista puntata |
| `capperificio_brew_pour_over` | html | Accordion **"In cucina"** |
| `capperificio_brew_drip` | html | Accordion **"Abbinamenti"** |
| `capperificio_brew_aeropress` | html | Accordion **"Conservazione"** |
| `capperificio_brew_plunger` | html | Accordion **"Lo sapevi?"** |

### Prezzi (IVA 4%)

| Linea | Prezzo |
|-------|--------|
| Capperi al sale marino integrale | **5,50 €** |
| Capperi all'aceto | **6,50 €** |
| Cucunci all'aceto | **7,00 €** |
| Polvere di Cappero Extrafine | **10,00 €** |
| Foglie di Cappero al Sale | **5,00 €** |

### Dati comuni a tutti i prodotti

- **Produttore / Brand**: Capperificio Caro
- **Origine**: Racale (Salento, Puglia) — raccolta manuale, classificazione per calibro
- **IVA**: 4% (prodotto alimentare)
- **Confezione/Box (solo B2B/ingrosso)**: 6 pezzi — *non* mostrare nella scheda B2C

---

# CATEGORIA A — Capperi di Racale al Sale Marino Integrale · 5,50 €

> Boccioli raccolti a mano uno per uno, sotto sale marino integrale pugliese, rimescolati per almeno 25 giorni. Nessun additivo, nessuna cottura.

---

## A1. Cappero di Racale — Lilliput al Sale Marino

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Cappero di Racale Lilliput al Sale Marino |
| `productNumber`  | `CAP-SALE-LILLIPUT` |
| Peso netto       | 75 g |
| `weight` (spediz.)| 0.20 kg (indicativo) |
| Prezzo lordo     | **5,50 €** (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Il calibro più piccolo e pregiato (Ø 4–6 mm): la firma del Capperificio Caro. Fragrante, persistente, concentratissimo. L'eccellenza del cappero di Racale in ogni bocciolo.

**Descrizione lunga (`description`)**
> Il **Lilliput** (Ø 4–6 mm) è il calibro più piccolo della nostra selezione e il nostro orgoglio. Fu Nonno Quintino a valorizzare per primo questi boccioli minuscoli, battezzandoli "Lilliput": dimensioni ridottissime, concentrazione di sapore straordinaria. Sotto sale marino integrale sviluppano note floreali, erbacee e una persistenza aromatica che i calibri più grandi non raggiungono. Ideali crudi a fine cottura su carpacci, burrata o tartare di tonno.

### Scheda tecnica (Proprietà)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi 80% – Sale marino integrale 20% |
| Calibro | Lilliput · Ø 4–6 mm |
| Peso netto | 75 g |
| Note di gusto | Intenso · Fragrante · Persistente · Floreale |
| Ideale per | Cucina gourmet, crudi, finger food |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Lilliput · Ø 4–6 mm |
| `capperificio_bullet_1` | **Lilliput** (Ø 4–6 mm): il calibro più piccolo e pregiato, la firma del Capperificio Caro |
| `capperificio_bullet_2` | Selezionato uno per uno a mano nei campi di Racale |
| `capperificio_bullet_3` | Concentrato di aromi mediterranei, non di sale |
| `capperificio_brew_pour_over` (In cucina) | `<p>Aggiungilo crudo a fine cottura: su carpacci, tartare, burrata o crema di fave. Il calore lo esalta, non lo cuoce.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Perfetto con pesce crudo, burrata pugliese, formaggi freschi e finger food gourmet.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Luogo fresco e asciutto. Dopo l'apertura tenere coperti dal sale; non necessita di refrigerazione.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>Fu Nonno Quintino a inventare questo calibro, valorizzando i boccioli più piccoli che altri scartavano. Li chiamò "Lilliput": il nome racconta tutto.</p>` |

---

## A2. Cappero di Racale — Occhio di Pernice al Sale Marino

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Cappero di Racale Occhio di Pernice al Sale Marino |
| `productNumber`  | `CAP-SALE-OCCHIO` |
| Peso netto       | 150 g |
| `weight` (spediz.)| 0.30 kg (indicativo) |
| Prezzo lordo     | **5,50 €** (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Occhio di Pernice (Ø 7–9 mm): il più versatile della selezione. Gusto equilibrato, sapidità fine, aroma floreale. Il punto di partenza ideale per scoprire il cappero di Racale.

**Descrizione lunga (`description`)**
> L'**Occhio di Pernice** (Ø 7–9 mm) è il nostro calibro più richiesto: abbastanza piccolo da essere elegante, abbastanza grande da farsi sentire in ogni preparazione. Il gusto è pieno senza essere invadente, l'aroma floreale con una nota erbacea che ricorda la macchia mediterranea. Si usa intero, tritato o in infusione nell'olio. Il cappero di Racale che consigliamo a chi non lo ha mai assaggiato.

### Scheda tecnica (Proprietà)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi 80% – Sale marino integrale 20% |
| Calibro | Occhio di Pernice · Ø 7–9 mm |
| Peso netto | 150 g |
| Note di gusto | Sapido · Equilibrato · Floreale · Erbaceo |
| Ideale per | Insalate, primi piatti, salse, uso quotidiano |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Occhio di Pernice · Ø 7–9 mm |
| `capperificio_bullet_1` | **Occhio di Pernice** (Ø 7–9 mm): equilibrio tra intensità e finezza — il più versatile della selezione |
| `capperificio_bullet_2` | Il cappero di Racale da scoprire per la prima volta: sapidità fine, mai invadente |
| `capperificio_bullet_3` | Ottimo intero, tritato o in infusione nell'olio extravergine |
| `capperificio_brew_pour_over` (In cucina) | `<p>Versatile ovunque: intero nelle insalate e nei secondi di pesce, tritato nelle salse, in infusione nell'olio per un condimento straordinario.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Con pesce al forno, verdure grigliate, pasta alla puttanesca e pizza. Un classico della cucina mediterranea.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Luogo fresco e asciutto. Dopo l'apertura tenere coperti dal sale; non necessita di refrigerazione.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>A Racale classifichiamo i capperi per calibro uno per uno: una precisione artigianale che non esiste altrove in Italia.</p>` |

---

## A3. Cappero di Racale — Lacrimella al Sale Marino

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Cappero di Racale Lacrimella al Sale Marino |
| `productNumber`  | `CAP-SALE-LACRIMELLA` |
| Peso netto       | 250 g |
| `weight` (spediz.)| 0.42 kg (indicativo) |
| Prezzo lordo     | **5,50 €** (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Lacrimella (Ø 9–11 mm): polpa carnosa, gusto pieno e rotondo. Il cappero generoso della cucina di tutti i giorni, che regge la cottura senza perdere aroma.

**Descrizione lunga (`description`)**
> La **Lacrimella** (Ø 9–11 mm) è il calibro medio della nostra selezione: più grande e carnoso dell'Occhio di Pernice, con una polpa che trattiene meglio i succhi durante la cottura. Il gusto è pieno, con note di macchia mediterranea e una dolcezza sottile che emerge col calore. Perfetta nella caponata, nel ragù di pesce e nelle paste fredde estive. Il cappero che convince anche chi pensava di non amarli.

### Scheda tecnica (Proprietà)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi 80% – Sale marino integrale 20% |
| Calibro | Lacrimella · Ø 9–11 mm |
| Peso netto | 250 g |
| Note di gusto | Pieno · Carnoso · Morbido · Leggermente dolce |
| Ideale per | Caponata, ragù di pesce, pasta fredda, farciture |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Lacrimella · Ø 9–11 mm |
| `capperificio_bullet_1` | **Lacrimella** (Ø 9–11 mm): polpa carnosa, gusto pieno — il cappero per la cucina di tutti i giorni |
| `capperificio_bullet_2` | Regge la cottura senza perdere struttura né aroma |
| `capperificio_bullet_3` | Il cappero che convince anche chi credeva di non amarli |
| `capperificio_brew_pour_over` (In cucina) | `<p>Perfetta in caponata, ragù di pesce, pasta alla Norma e farciture. La polpa carnosa mantiene struttura e aroma anche dopo la cottura.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Con melanzane, pomodori secchi, tonno sott'olio e acciughe. Un classico della tradizione salentina e siciliana.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Luogo fresco e asciutto. Dopo l'apertura tenere coperti dal sale; si conservano per molti mesi.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>La polpa più spessa del calibro medio trattiene meglio i succhi durante la cottura: per questo molti chef la preferiscono per le preparazioni a caldo.</p>` |

---

## A4. Capperone di Racale — al Sale Marino

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Capperone di Racale al Sale Marino |
| `productNumber`  | `CAP-SALE-CAPPERONE` |
| Peso netto       | 250 g |
| `weight` (spediz.)| 0.42 kg (indicativo) |
| Prezzo lordo     | **5,50 €** (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Il Capperone (Ø 12–15 mm): il più grande e audace. Sapore marcato e persistente, mantiene l'aroma anche nelle cotture lunghe. Per chi non vuole compromessi.

**Descrizione lunga (`description`)**
> Il **Capperone** (Ø 12–15 mm) è raccolto poco prima che il bocciolo si trasformi in frutto. Struttura carnosa, alta concentrazione di oli essenziali: regge sughi lunghi, forni e casseruole senza perdere il suo carattere deciso. Il sapore è marcato, quasi selvatico, con un retrogusto persistente che ricorda la macchia mediterranea d'agosto. Eccellente tritato in sughi corposi o disidratato come insaporitore estremo.

### Scheda tecnica (Proprietà)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi 80% – Sale marino integrale 20% |
| Calibro | Capperone · Ø 12–15 mm |
| Peso netto | 250 g |
| Note di gusto | Marcato · Carnoso · Aromatico · Persistente |
| Ideale per | Sughi lunghi, tritato, disidratato, secondi |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Capperone · Ø 12–15 mm |
| `capperificio_bullet_1` | **Capperone** (Ø 12–15 mm): il più grande e audace, sapore marcato che resiste alle cotture lunghe |
| `capperificio_bullet_2` | Alta concentrazione di oli essenziali: sprigiona aroma a lungo |
| `capperificio_bullet_3` | Perfetto tritato in sugo o disidratato come insaporitore |
| `capperificio_brew_pour_over` (In cucina) | `<p>Ideale nelle cotture lunghe: sughi corposi, secondi in casseruola, agnello al forno. Ottimo anche tritato su bruschette con pomodoro e origano.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Con carni saporite, pesce azzurro, olive nere e piatti della cucina salentina tradizionale.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Luogo fresco e asciutto. Dopo l'apertura coprire col sale residuo; la struttura spessa lo rende particolarmente longevo.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>Il Capperone viene raccolto pochi giorni prima che il bocciolo diventi cucuncio: una differenza di raccolta minima che separa due prodotti completamente diversi.</p>` |

---

# CATEGORIA B — Capperi di Racale all'Aceto · 6,50 €

> Gli stessi calibri della linea sale, conservati in aceto di vino bianco. Pronti all'uso, senza dissalatura.

---

## B1. Cappero di Racale — Lilliput all'Aceto

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Cappero di Racale Lilliput all'Aceto |
| `productNumber`  | `CAP-ACETO-LILLIPUT` |
| Peso netto       | 75 g |
| `weight` (spediz.)| 0.20 kg (indicativo) |
| Prezzo lordo     | **6,50 €** (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Lilliput (Ø 4–6 mm) in aceto: pronto all'uso, fragrante e vivace. L'intensità del bocciolo più piccolo con una punta acidula che apre il palato.

**Descrizione lunga (`description`)**
> Il nostro calibro più pregiato in versione aceto di vino bianco. Il **Lilliput all'Aceto** (Ø 4–6 mm) è pronto all'uso direttamente dal barattolo: l'aceto ammorbidisce leggermente il bocciolo esaltandone le note floreali e aggiungendo una vivacità acidula immediata. Ideale per chi predilige la praticità senza rinunciare alla profondità aromatica del cappero di Racale.

### Scheda tecnica (Proprietà)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi, aceto di vino bianco, sale |
| Calibro | Lilliput · Ø 4–6 mm |
| Peso netto | 75 g |
| Note di gusto | Intenso · Floreale · Acidulo |
| Ideale per | Uso diretto, crudi, finger food, aperitivi |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Lilliput · Ø 4–6 mm · all'Aceto |
| `capperificio_bullet_1` | **Lilliput all'Aceto** (Ø 4–6 mm): pronto all'uso, intenso e vivace |
| `capperificio_bullet_2` | Nessuna dissalatura: direttamente dal barattolo al piatto |
| `capperificio_bullet_3` | L'aceto esalta le note floreali del bocciolo più piccolo |
| `capperificio_brew_pour_over` (In cucina) | `<p>Direttamente dal barattolo su carpacci, crudi di pesce, insalate fresche e finger food. Aggiungilo all'ultimo momento.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Con ostriche, gamberi crudi, burrata e ricotta fresca. Ovunque serva una nota acida brillante.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Luogo fresco. Dopo l'apertura tenere in frigorifero immerso nel liquido di governo.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>Il liquido di governo è ottimo in vinaigrette o per degassare la padella: non buttarlo.</p>` |

---

## B2. Cappero di Racale — Occhio di Pernice all'Aceto

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Cappero di Racale Occhio di Pernice all'Aceto |
| `productNumber`  | `CAP-ACETO-OCCHIO` |
| Peso netto       | 150 g |
| `weight` (spediz.)| 0.30 kg (indicativo) |
| Prezzo lordo     | **6,50 €** (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Occhio di Pernice all'Aceto (Ø 7–9 mm): equilibrio tra sapidità e acidità, pronto all'uso. Il cappero di Racale per la cucina moderna e senza sforzo.

**Descrizione lunga (`description`)**
> L'**Occhio di Pernice all'Aceto** (Ø 7–9 mm) porta la versatilità del calibro più amato in una versione immediata. Marinato in aceto di vino bianco, si aggiunge direttamente nella preparazione senza trattamento preliminare. Aroma floreale ed erbaceo, sapidità fine, acidità vivace ma mai aggressiva. Il cappero di Racale per chi cucina veloce senza rinunciare alla qualità.

### Scheda tecnica (Proprietà)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi, aceto di vino bianco, sale |
| Calibro | Occhio di Pernice · Ø 7–9 mm |
| Peso netto | 150 g |
| Note di gusto | Sapido · Acidulo · Floreale · Equilibrato |
| Ideale per | Insalate, salse fredde, pasta, formaggi |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Occhio di Pernice · Ø 7–9 mm · all'Aceto |
| `capperificio_bullet_1` | **Occhio di Pernice all'Aceto** (Ø 7–9 mm): versatile e pronto all'uso |
| `capperificio_bullet_2` | Sapidità fine e acidità vivace, mai aggressiva |
| `capperificio_bullet_3` | Dal barattolo al piatto: nessuna preparazione |
| `capperificio_brew_pour_over` (In cucina) | `<p>Direttamente in insalate, salse fredde, pasta saltata o su formaggi. Si presta anche frullato in maionesi aromatiche.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Con tonno, acciughe, uova sode e pomodori freschi. Ottimo anche in una tapenade con olive taggiasche.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Luogo fresco. Dopo l'apertura tenere in frigorifero immerso nel liquido di governo.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>Il liquido di governo è un condimento pronto: usalo in vinaigrette o per aromatizzare una marinatura.</p>` |

---

## B3. Cappero di Racale — Lacrimella all'Aceto

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Cappero di Racale Lacrimella all'Aceto |
| `productNumber`  | `CAP-ACETO-LACRIMELLA` |
| Peso netto       | 250 g |
| `weight` (spediz.)| 0.42 kg (indicativo) |
| Prezzo lordo     | **6,50 €** (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Lacrimella all'Aceto (Ø 9–11 mm): polpa carnosa, gusto pieno e nota acidula bilanciata. Pronta all'uso, ottima sia in cottura che a crudo.

**Descrizione lunga (`description`)**
> La **Lacrimella all'Aceto** (Ø 9–11 mm) unisce la polpa carnosa del calibro medio alla vivacità dell'aceto di vino bianco. In cottura l'aceto evapora sprigionando aroma mentre la polpa rimane intatta; a crudo aggiunge una freschezza acidula immediata. Pronta all'uso, è il cappero all'aceto più versatile della nostra selezione.

### Scheda tecnica (Proprietà)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi, aceto di vino bianco, sale |
| Calibro | Lacrimella · Ø 9–11 mm |
| Peso netto | 250 g |
| Note di gusto | Pieno · Carnoso · Acidulo · Rotondo |
| Ideale per | Pasta, secondi, salse, caponata |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Lacrimella · Ø 9–11 mm · all'Aceto |
| `capperificio_bullet_1` | **Lacrimella all'Aceto** (Ø 9–11 mm): polpa carnosa, pronta all'uso |
| `capperificio_bullet_2` | In cottura l'aceto evapora, il cappero resta integro e profumato |
| `capperificio_bullet_3` | La più versatile della linea aceto: funziona in ogni preparazione |
| `capperificio_brew_pour_over` (In cucina) | `<p>In padella a metà cottura: l'aceto evapora e la polpa rimane intatta. Perfetta in pasta alla puttanesca, caponata e coniglio alla cacciatora.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Con melanzane, tonno, acciughe e olive nere. Un filo di olio extravergine completa il quadro.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Luogo fresco. Dopo l'apertura tenere in frigorifero nel liquido di governo.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>Il liquido di governo ridotto in padella con un goccio di miele diventa una salsa agrodolce pronta in 2 minuti.</p>` |

---

## B4. Capperone di Racale — all'Aceto

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Capperone di Racale all'Aceto |
| `productNumber`  | `CAP-ACETO-CAPPERONE` |
| Peso netto       | 250 g |
| `weight` (spediz.)| 0.42 kg (indicativo) |
| Prezzo lordo     | **6,50 €** (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Capperone all'Aceto (Ø 12–15 mm): sapore audace, struttura carnosa. Regge le cotture lunghe e si fa sentire in ogni piatto. Per chi cucina senza compromessi.

**Descrizione lunga (`description`)**
> Il **Capperone all'Aceto** (Ø 12–15 mm) porta il carattere deciso del calibro più grande in una versione pronta all'uso. La pelle spessa ammorbidita dall'aceto mantiene intatta la struttura carnosa; il sapore è selvatico e persistente, con note di macchia mediterranea e acidità vibrante. Protagonista nei sughi lunghi, nei secondi tradizionali pugliesi e ovunque serva un cappero che non si perda nella cottura.

### Scheda tecnica (Proprietà)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi, aceto di vino bianco, sale |
| Calibro | Capperone · Ø 12–15 mm |
| Peso netto | 250 g |
| Note di gusto | Audace · Selvatico · Persistente |
| Ideale per | Sughi lunghi, secondi, piatti tradizionali pugliesi |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Capperone · Ø 12–15 mm · all'Aceto |
| `capperificio_bullet_1` | **Capperone all'Aceto** (Ø 12–15 mm): audace e persistente, per chi non vuole compromessi |
| `capperificio_bullet_2` | Struttura carnosa che regge le cotture lunghe |
| `capperificio_bullet_3` | Sapore selvatico e deciso: un ingrediente strutturale, non un condimento |
| `capperificio_brew_pour_over` (In cucina) | `<p>Protagonista in sughi lunghi, coniglio alla cacciatora e triglie alla livornese. Ottimo tritato su bruschette con pomodoro bruciato.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Con carni saporite, pesce azzurro, 'nduja e formaggi stagionati.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Luogo fresco. Dopo l'apertura tenere in frigorifero nel liquido; la struttura spessa lo rende longevo.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>Il Capperone all'aceto e il cucuncio hanno la stessa origine: stesso bocciolo, pochi giorni di differenza nella raccolta, esperienze di gusto completamente diverse.</p>` |

---

# CATEGORIA C — Cucunci all'Aceto · 7,00 €

> I **cucunci** sono i frutti della pianta del cappero: boccioli non raccolti in tempo che si trasformano in frutto allungato, con polpa carnosa e semi croccanti. Gusto più morbido e fruttato del cappero, con una nota selvatica unica. A Racale vengono marinati in tre aceti diversi, ciascuno con un profilo aromatico differente.

---

## C1. Cucunci — all'Aceto di Mele

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Cucunci all'Aceto di Mele |
| `productNumber`  | `CUC-ACETO-MELE` |
| Peso netto       | 200 g |
| `weight` (spediz.)| 0.35 kg (indicativo) |
| Prezzo lordo     | **7,00 €** (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Frutti del cappero in aceto di mele biologico: dolcezza fruttata, acidità morbida, semi croccanti. Il cucuncio più accessibile per chi scopre questo prodotto per la prima volta.

**Descrizione lunga (`description`)**
> I **Cucunci all'Aceto di Mele** nascono dall'incontro tra il frutto selvatico del cappero di Racale e l'aceto di mele biologico, dai sentori di frutta gialla e acidità rotonda. Il profilo è morbido e fruttato: polpa carnosa, semi croccanti, retrogusto lungo. La versione più gentile della nostra linea cucunci — il punto di partenza perfetto per chi non li conosce ancora.

### Scheda tecnica (Proprietà)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Cucunci di cappero, aceto di mele biologico, sale |
| Tipo | Frutto del cappero (Capparis spinosa) |
| Peso netto | 200 g |
| Note di gusto | Fruttato · Morbido · Dolce · Rotondo |
| Ideale per | Taglieri, crostini, formaggi freschi, carni bianche |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Cucunci · all'Aceto di Mele |
| `capperificio_bullet_1` | Frutti del cappero di Racale in aceto di mele: dolcezza fruttata e acidità morbida |
| `capperificio_bullet_2` | La versione più accessibile — ideale per scoprire i cucunci per la prima volta |
| `capperificio_bullet_3` | Polpa carnosa, semi croccanti, retrogusto lungo di mela matura |
| `capperificio_brew_pour_over` (In cucina) | `<p>In un tagliere di salumi e formaggi o su crostini con stracciatella e miele. La dolcezza dell'aceto contrasta perfettamente con i formaggi stagionati.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Con formaggi freschi (stracchino, caprino), prosciutto crudo e frutta secca. Ottimi in un'insalata con rucola, pere e noci.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Luogo fresco. Dopo l'apertura tenere in frigorifero immersi nel liquido di governo.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>Il cucuncio nasce dal bocciolo che sfugge alla raccolta del cappero: invece di diventare cappero, fiorisce e si trasforma in frutto.</p>` |

---

## C2. Cucunci — all'Aceto di Riso

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Cucunci all'Aceto di Riso |
| `productNumber`  | `CUC-ACETO-RISO` |
| Peso netto       | 200 g |
| `weight` (spediz.)| 0.35 kg (indicativo) |
| Prezzo lordo     | **7,00 €** (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Cucunci in aceto di riso: acidità delicata, gusto pulito. L'aceto più neutro che esiste esalta il sapore selvatico del frutto senza coprirlo. La versione più raffinata della linea.

**Descrizione lunga (`description`)**
> I **Cucunci all'Aceto di Riso** sono l'incontro tra Salento e Oriente. L'aceto di riso, noto per la sua acidità quasi impercettibile, lascia parlare il cucuncio di Racale senza aggiungere note dominanti: il profilo è pulito, floreale, con semi croccanti e una texture quasi setosa. La scelta dei palati più esigenti e dei cuochi più curiosi.

### Scheda tecnica (Proprietà)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Cucunci di cappero, aceto di riso, sale |
| Tipo | Frutto del cappero (Capparis spinosa) |
| Peso netto | 200 g |
| Note di gusto | Pulito · Delicato · Floreale · Erbaceo |
| Ideale per | Cucina fusion, sushi, carpacci, crudi |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Cucunci · all'Aceto di Riso |
| `capperificio_bullet_1` | Cucunci in aceto di riso: l'aceto più delicato che esalta senza coprire |
| `capperificio_bullet_2` | Gusto pulito e floreale, texture quasi seta con semi croccanti |
| `capperificio_bullet_3` | La versione più raffinata della linea — ispirazione fusion Salento-Oriente |
| `capperificio_brew_pour_over` (In cucina) | `<p>Su sushi di tonno mediterraneo, carpacci di pesce spada con zenzero, o in insalate con finocchio e alghe.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Con pesce crudo, tartare, ceviche mediterraneo e formaggi freschi a pasta molle.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Luogo fresco. Dopo l'apertura tenere in frigorifero nel liquido di governo: delicato, ottimo per marinature leggere.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>L'aceto di riso è usato in Giappone da oltre 2.000 anni per preservare senza coprire. Applicarlo al cucuncio di Racale è stata la nostra scoperta più sorprendente.</p>` |

---

## C3. Cucunci — all'Aceto di Melograno

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Cucunci all'Aceto di Melograno |
| `productNumber`  | `CUC-ACETO-MELOGRANO` |
| Peso netto       | 200 g |
| `weight` (spediz.)| 0.35 kg (indicativo) |
| Prezzo lordo     | **7,00 €** (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Cucunci in aceto di melograno: note vinose, acidità intensa, retrogusto fruttato amaro. La versione più coraggiosa e complessa — per i palati che amano l'intensità.

**Descrizione lunga (`description`)**
> I **Cucunci all'Aceto di Melograno** sono la versione più intensa della linea. L'aceto di melograno porta note vinose e rosse, una tannicità morbida e un retrogusto fruttato amaro che si fonde con la polpa selvatica del cucuncio. Il liquido di governo tinge la polpa di rosa rubino: bello nel piatto, straordinario al palato. Per chi ama le sfide gastronomiche.

### Scheda tecnica (Proprietà)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Cucunci di cappero, aceto di melograno, sale |
| Tipo | Frutto del cappero (Capparis spinosa) |
| Peso netto | 200 g |
| Note di gusto | Intenso · Vinoso · Fruttato amaro · Persistente |
| Ideale per | Cucina creativa, carni rosse, formaggi stagionati |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Cucunci · all'Aceto di Melograno |
| `capperificio_bullet_1` | Cucunci in aceto di melograno: note vinose e retrogusto fruttato amaro |
| `capperificio_bullet_2` | Il liquido di governo tinge la polpa di rosa rubino — bello nel piatto, straordinario al palato |
| `capperificio_bullet_3` | La versione più intensa: per i palati coraggiosi |
| `capperificio_brew_pour_over` (In cucina) | `<p>Straordinari con carni rosse marinate, selvaggina e piatti della cucina mediorientale. Ottimi anche in un risotto con melograno fresco.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Con formaggi stagionati a pasta dura, salumi di maiale e piatti agrodolci.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Luogo fresco. Dopo l'apertura tenere in frigorifero. Il liquido di governo non va buttato: è un condimento pronto.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>Il melograno e il cappero crescono entrambi nel bacino del Mediterraneo da millenni. Questi cucunci sono il punto di incontro di due tradizioni antichissime.</p>` |

---

# CATEGORIA D — Polvere di Cappero Extrafine · 10,00 €

---

## D1. Polvere di Cappero Extrafine

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Polvere di Cappero Extrafine |
| `productNumber`  | `CAP-POLVERE-50` |
| Peso netto       | 50 g |
| `weight` (spediz.)| 0.12 kg (indicativo) |
| Prezzo lordo     | **10,00 €** (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Capperi di Racale dissalati, essiccati a bassa temperatura e ridotti in polvere extrafine. Un insaporitore naturale concentratissimo. 100% naturale, senza additivi.

**Descrizione lunga (`description`)**
> La **Polvere di Cappero Extrafine** nasce dall'essiccazione lenta a meno di 40°C dei capperi di Racale: una temperatura che preserva intatti gli oli essenziali della pianta. Il risultato è una polvere verde salvia, profumatissima e concentratissima — tutto il gusto del cappero in forma dosabile. Un cucchiaino basta per trasformare fondi, salse e finiture. 100% naturale, senza conservanti né additivi.

### Scheda tecnica (Proprietà)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi disidratati, sale marino integrale — 100% naturale |
| Tipo | Polvere extrafine, essiccazione a bassa temperatura |
| Peso netto | 50 g |
| Note di gusto | Concentrato · Sapido · Persistente · Aromatico |
| Ideale per | Fondi, brodi, salse, finitura a crudo, burro aromatico |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Polvere Extrafine |
| `capperificio_bullet_1` | Essiccazione lenta a < 40°C: tutti gli oli essenziali del cappero preservati |
| `capperificio_bullet_2` | 100% naturale — solo cappero di Racale e sale marino |
| `capperificio_bullet_3` | Un cucchiaino trasforma fondi, salse e finiture in qualcosa di straordinario |
| `capperificio_brew_pour_over` (In cucina) | `<p>Si scioglie in fondi e salse; spolverata a crudo su pasta o carpaccio; mischiata al burro morbido per un condimento intenso. Dosare con parsimonia.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Insaporitore universale per primi, secondi, marinature e finiture. Eccellente nel burro per bistecche.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Luogo fresco, asciutto e al riparo dalla luce. Richiudere bene dopo ogni uso.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>Nasce dal recupero dei capperi imperfetti per la conservazione intera: uno scarto nobilitato dalla lentezza dell'essiccazione.</p>` |

---

# CATEGORIA E — Foglie di Cappero al Sale Marino · 5,00 €

> Disponibile in **due formati** (50 g e 150 g).

---

## E1. Foglie di Cappero al Sale Marino

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Foglie di Cappero al Sale Marino |
| `productNumber`  | `CAP-FOGLIE` (padre) — varianti `CAP-FOGLIE-50`, `CAP-FOGLIE-150` |
| Pesi netti       | 50 g · 150 g |
| Prezzo lordo     | **5,00 €** per formato (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 per variante |

**Descrizione breve**
> Le foglie giovani della pianta del cappero: gusto fresco, minerale, consistenza croccante. Una rarità mediterranea, raccolta tra maggio e settembre solo nelle settimane giuste.

**Descrizione lunga (`description`)**
> Le **Foglie di Cappero** (*Capparis spinosa*) sono la parte meno conosciuta della pianta, ma sempre più apprezzata. Gusto fresco e minerale con un lieve amarognolo, consistenza croccante: portano in cucina qualcosa che non assomiglia a nient'altro. Si raccolgono tra maggio e settembre, solo le foglie giovani e tenere — quelle più vecchie vengono scartate. Perfette fritte in pastella, in involtini o tritate fresche su tartare.

### Scheda tecnica (Proprietà)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Foglie di cappero 80% – Sale marino integrale 20% |
| Tipo | Foglie giovani e tenere, raccolta maggio–settembre |
| Peso netto | 50 g / 150 g |
| Note di gusto | Fresco · Minerale · Erbaceo · Lieve amaro |
| Ideale per | Frittura in pastella, involtini, insalate, tartare |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Foglie di Cappero · 50 g / 150 g |
| `capperificio_bullet_1` | Foglie giovani e tenere: fresche, minerali, croccanti — una rarità della macchia mediterranea |
| `capperificio_bullet_2` | Raccolte a mano tra maggio e settembre, solo le più giovani |
| `capperificio_bullet_3` | Fritte in pastella, in involtini o fresche su tartare: ogni preparazione sorprende |
| `capperificio_brew_pour_over` (In cucina) | `<p>Dopo breve dissalatura: fritte in pastella leggera, usate come foglie di vite per involtini, o tritate su tartare e carpacci.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Con pesce crudo, carpacci di carne e insalate estive. Fritte in pastella sono irresistibili con salsa allo yogurt e menta.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Luogo fresco e asciutto. Tenere le foglie coperte dal sale dopo l'apertura.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>Nella tradizione salentina le foglie di cappero non si buttavano: tutto della pianta ha valore. Oggi le cuciniamo — ma il principio è lo stesso.</p>` |

---

## Riepilogo SKU, prezzi e formati

| # | Categoria | Prodotto | SKU | Formato | Prezzo |
|---|-----------|----------|-----|---------|--------|
| A1 | Sale | Cappero Lilliput al Sale | `CAP-SALE-LILLIPUT` | 75 g | 5,50 € |
| A2 | Sale | Cappero Occhio di Pernice al Sale | `CAP-SALE-OCCHIO` | 150 g | 5,50 € |
| A3 | Sale | Cappero Lacrimella al Sale | `CAP-SALE-LACRIMELLA` | 250 g | 5,50 € |
| A4 | Sale | Capperone al Sale | `CAP-SALE-CAPPERONE` | 250 g | 5,50 € |
| B1 | Aceto | Cappero Lilliput all'Aceto | `CAP-ACETO-LILLIPUT` | 75 g | 6,50 € |
| B2 | Aceto | Cappero Occhio di Pernice all'Aceto | `CAP-ACETO-OCCHIO` | 150 g | 6,50 € |
| B3 | Aceto | Cappero Lacrimella all'Aceto | `CAP-ACETO-LACRIMELLA` | 250 g | 6,50 € |
| B4 | Aceto | Capperone all'Aceto | `CAP-ACETO-CAPPERONE` | 250 g | 6,50 € |
| C1 | Cucunci | Cucunci Aceto di Mele | `CUC-ACETO-MELE` | 200 g | 7,00 € |
| C2 | Cucunci | Cucunci Aceto di Riso | `CUC-ACETO-RISO` | 200 g | 7,00 € |
| C3 | Cucunci | Cucunci Aceto di Melograno | `CUC-ACETO-MELOGRANO` | 200 g | 7,00 € |
| D1 | Polvere | Polvere di Cappero Extrafine | `CAP-POLVERE-50` | 50 g | 10,00 € |
| E1 | Foglie | Foglie di Cappero al Sale | `CAP-FOGLIE-50/150` | 50 g / 150 g | 5,00 € |

---

## Checklist operativa

- [ ] Eseguire [`scripts/setup-custom-fields.py`](sunrise-coffee/scripts/setup-custom-fields.py).
- [ ] Creare i **Gruppi di proprietà**: Origine, Ingredienti, Calibro/Tipo, Peso netto, Note di gusto, Ideale per.
- [ ] Creare i **13 prodotti** (A1–E1) con i campi standard di questa guida.
- [ ] Assegnare le **Proprietà** dalla rispettiva Scheda tecnica.
- [ ] Per le Foglie (multi-formato) decidere: variante singola o prodotti separati.
- [ ] Compilare i custom field `capperificio_*` (badge, bullet, accordion).
- [ ] Caricare le immagini prodotto e impostare la cover.
- [ ] Aggiornare [`scripts/setup-capperificio.py`](sunrise-coffee/scripts/setup-capperificio.py) con la lista dei 13 prodotti.
- [ ] Verificare la resa nella product page.

---

## Nota tecnica — tabella tecnica in italiano

In [`ProductDetail.jsx`](sunrise-coffee/src/components/ProductDetail/ProductDetail.jsx):

1. **Ordine righe** — riga 272:
   ```js
   const PROPERTY_ORDER = ['Origine', 'Ingredienti', 'Calibro', 'Peso netto', 'Note di gusto', 'Ideale per'];
   ```
2. **Multi-riga note di gusto** — riga ~427: `group === 'Tasting notes'` → `group === 'Note di gusto'`.
3. **Fallback tabella** — righe ~438-442: sostituire i valori caffè con valori capperi generici.
