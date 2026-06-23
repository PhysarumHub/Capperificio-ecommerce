# Catalogo Prodotti — Capperificio Caro

> Schede prodotto estratte da **CATALOGO CAPPERIFICIO CARO.pdf** e mappate sui campi di
> Shopware 6 e del frontend React (`sunrise-coffee`).
> Usare questo file come fonte unica per popolare l'admin Shopware e verificare la resa nella product page.

## Come leggere questo documento

Ogni scheda contiene quattro blocchi:

1. **Campi standard Shopware** → *Admin → Cataloghi → Prodotti* (`name`, `productNumber`, `description`, prezzo, peso).
2. **Scheda tecnica (Proprietà)** → la tabella label/valore in alto nella product page (Origine, Ingredienti, ecc.). In Shopware sono **Proprietà** (gruppo = etichetta riga, opzione = valore).
3. **Custom field Capperificio** → badge calibro, bullet descrittivi e accordion utilizzi. Già creati da [`scripts/setup-custom-fields.py`](sunrise-coffee/scripts/setup-custom-fields.py).
4. **Resa nel frontend** → dove ogni campo appare in [`ProductDetail.jsx`](sunrise-coffee/src/components/ProductDetail/ProductDetail.jsx).

### Mappatura campi → frontend

| Campo Shopware | Tipo | Dove appare nel frontend |
|----------------|------|--------------------------|
| **Proprietà** (gruppi + opzioni) | property | **Tabella tecnica** in alto (label a sx, valore a dx) |
| `capperificio_calibro` | text | Badge sotto il titolo (solo prodotti senza varianti) |
| `capperificio_bullet_1/2/3` | text | Lista puntata (frasi **descrittive**, non dati tecnici) |
| `capperificio_brew_pour_over` | html | Accordion **"In cucina"** |
| `capperificio_brew_drip` | html | Accordion **"Abbinamenti"** |
| `capperificio_brew_aeropress` | html | Accordion **"Conservazione"** |
| `capperificio_brew_plunger` | html | Accordion **"Lo sapevi?"** |

> 🔎 Le diciture caffè che si vedono ora ("Tasting notes", "Pour-over"…) **sono placeholder**:
> spariscono appena il prodotto ha Proprietà reali e custom field compilati.

### Divisione del contenuto: bullet vs scheda tecnica

- I **dati fattuali** (origine, ingredienti, peso, calibro, confezione, ideale per) vanno nella
  **Scheda tecnica (Proprietà)** — la tabella label/valore. **Non** nei bullet.
- I **bullet** restano per le **frasi descrittive / di vendita** (il carattere del calibro, i punti di forza).

### Proprietà da creare in Shopware (righe della tabella tecnica)

Crea questi **Gruppi di proprietà** (*Admin → Cataloghi → Proprietà*); l'ordine in pagina segue la
costante `PROPERTY_ORDER` in [ProductDetail.jsx:272](sunrise-coffee/src/components/ProductDetail/ProductDetail.jsx#L272)
(da aggiornare — vedi *Nota tecnica* in fondo):

| Gruppo proprietà (riga tabella) | Resa |
|---------------------------------|------|
| **Origine**       | riga singola |
| **Ingredienti**   | riga singola |
| **Calibro**       | riga singola (per Polvere/Foglie/Ho.Re.Ca = tipo/formato) |
| **Peso netto**    | riga singola |
| **Note di gusto** | va a capo per ogni descrittore (multi-riga) |
| **Ideale per**    | riga singola |

> ⚠️ **Prezzi**: il catalogo PDF **non riporta prezzi**. Tutti i prezzi qui sotto sono `DA DEFINIRE`. Inserirli in admin (campo *Prezzo lordo*, IVA alimentari **4%**).

### Dati comuni a tutti i prodotti

- **Produttore / Brand**: Capperificio Caro
- **Origine**: Racale (Salento, Puglia) — raccolta manuale, classificazione per calibro
- **Lavorazione**: sotto sale marino integrale, rimescolati ≥ 25 giorni (tradizione)
- **Composizione standard**: Capperi 80% – Sale Marino 20% (salvo diversa indicazione)
- **Confezione/Box (solo B2B/ingrosso)**: 6 pezzi dello stesso prodotto e peso — *non* mostrare nella scheda B2C, è logica di vendita all'ingrosso
- **IVA**: 4% (prodotto alimentare)
- **Conservazione**: luogo fresco e asciutto; dopo apertura mantenere il prodotto coperto dal sale

---

## 1. Cappero di Racale — Occhio di Pernice (Piccolo) al Sale Marino

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Cappero di Racale Occhio di Pernice al Sale Marino |
| `productNumber`  | `CAP-OCCHIO-150` |
| Peso netto       | 150 g |
| `weight` (spediz.)| 0.30 kg (vaso + prodotto, indicativo) |
| Prezzo lordo     | `DA DEFINIRE` € (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Occhio di Pernice, il calibro Piccolo (Ø 6–9 mm): il più versatile della selezione, gusto equilibrato e sapidità fine. Perfetto per insalate, primi piatti e salse.

**Descrizione lunga (`description`)**
> Nel cuore di Racale siamo gli unici a classificare i capperi per calibro: un gesto di precisione che valorizza ogni sfumatura di gusto. L'**Occhio di Pernice** è il nostro calibro Piccolo, con un diametro che va dal 6 al 9 mm: il più versatile della nostra selezione, con un gusto equilibrato e adatto a ogni tipo di palato. Racchiude tutta l'intensità del cappero, ma con una sapidità più fine e armoniosa. Compatto e profumato, è perfetto per insalate, primi piatti, salse e preparazioni dove il cappero deve esaltare senza coprire.

### Scheda tecnica (Proprietà → tabella prodotto)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi 80% – Sale marino integrale 20% |
| Calibro | Occhio di Pernice (Piccolo) · Ø 6–9 mm |
| Peso netto | 150 g |
| Note di gusto | Sapido · Equilibrato · Floreale |
| Ideale per | Insalate, primi piatti, salse |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Occhio di Pernice · Piccolo · Ø 6–9 mm |
| `capperificio_bullet_1` | **Occhio di Pernice** (calibro Piccolo, Ø 6–9 mm): il più versatile ed equilibrato della selezione |
| `capperificio_bullet_2` | Raccolto e selezionato a mano a Racale |
| `capperificio_bullet_3` | Esalta i piatti senza coprirli |
| `capperificio_brew_pour_over` (In cucina) | `<p>Ideale per insalate, primi piatti e salse: esalta senza coprire gli altri ingredienti.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Equilibrato e armonioso, si sposa con pesce, verdure e formaggi freschi.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Conservare in luogo fresco e asciutto. Mantenere i capperi coperti dal sale dopo l'apertura.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>A Racale siamo gli unici a classificare i capperi per calibro, uno per uno.</p>` |

---

## 2. Cappero di Racale — Lilliput al Sale Marino

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Cappero di Racale Lilliput al Sale Marino |
| `productNumber`  | `CAP-LILLIPUT-75` |
| Peso netto       | 75 g |
| `weight` (spediz.)| 0.20 kg (indicativo) |
| Prezzo lordo     | `DA DEFINIRE` € (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Il calibro Lilliput (Ø 4–6 mm): la firma del Capperificio Caro. Compatto, fragrante e persistente, l'essenza del Mediterraneo in ogni bocciolo. Perfetto per la ristorazione gourmet.

**Descrizione lunga (`description`)**
> Il calibro **Lilliput** è il nostro orgoglio, il simbolo della cura e dell'identità che ci distingue. Unico nel suo genere, selezionato con meticolosa attenzione, rappresenta la nostra firma sul cappero di Racale. Con un diametro tra 4 e 6 mm, è il formato che meglio bilancia intensità e finezza. Compatti, fragranti e persistenti, questi capperi sprigionano l'essenza del Mediterraneo in ogni bocciolo. Ideali per chi cerca l'eccellenza: perfetti nella ristorazione gourmet, ma sorprendenti anche nelle preparazioni quotidiane. Lilliput non è solo un calibro: è il cuore del nostro lavoro, la nostra unicità in ogni vaso.

### Scheda tecnica (Proprietà → tabella prodotto)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi 80% – Sale marino integrale 20% |
| Calibro | Lilliput · Ø 4–6 mm |
| Peso netto | 75 g |
| Note di gusto | Intenso · Fragrante · Persistente |
| Ideale per | Cucina gourmet, crudi, finger food |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Lilliput · Ø 4–6 mm |
| `capperificio_bullet_1` | **Lilliput** (Ø 4–6 mm): il calibro più piccolo e pregiato, la nostra firma — fragrante e persistente |
| `capperificio_bullet_2` | Selezionato uno per uno, l'eccellenza per la cucina gourmet |
| `capperificio_bullet_3` | L'essenza del Mediterraneo in ogni bocciolo |
| `capperificio_brew_pour_over` (In cucina) | `<p>Perfetto crudo o a fine cottura su carpacci, tartare, primi piatti e finger food gourmet.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Eccelle con pesce crudo, burrata, ricci di mare e piatti della ristorazione raffinata.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Conservare in luogo fresco e asciutto. Mantenere i capperi coperti dal sale dopo l'apertura.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>Fu Nonno Quintino a ideare per primo questo calibro minuscolo, poi battezzato dalla famiglia "Lilliput": dimensioni ridottissime ma un concentrato di sapore straordinario.</p>` |

---

## 3. Cappero di Racale — Lacrimella (Medio) al Sale Marino

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Cappero di Racale Lacrimella al Sale Marino |
| `productNumber`  | `CAP-LACRIMELLA-250` |
| Peso netto       | 250 g |
| `weight` (spediz.)| 0.42 kg (indicativo) |
| Prezzo lordo     | `DA DEFINIRE` € (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Lacrimella, il calibro Medio (Ø 9–11 mm): armonia perfetta tra intensità aromatica e struttura. Polpa carnosa, gusto pieno ma non invadente, estremamente versatile in cucina.

**Descrizione lunga (`description`)**
> La **Lacrimella** è il nostro calibro medio (Ø 9–11 mm) e rappresenta l'armonia perfetta tra intensità aromatica e struttura. Più grande dei piccoli boccioli (come i Lilliput e l'Occhio di Pernice), ma non ancora completamente sviluppato come i capperoni, conserva una polpa carnosa, un gusto pieno ma non invadente e una consistenza che lo rende estremamente versatile in cucina. Con la maturazione diventa più morbido e leggermente più dolce rispetto ai calibri più piccoli. Questa evoluzione lo rende ideale anche per piatti quotidiani, dove si cerca equilibrio senza rinunciare al sapore.

### Scheda tecnica (Proprietà → tabella prodotto)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi 80% – Sale marino integrale 20% |
| Calibro | Lacrimella (Medio) · Ø 9–11 mm |
| Peso netto | 250 g |
| Note di gusto | Pieno · Morbido · Leggermente dolce |
| Ideale per | Risi, paste fredde, salse agrodolci |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Lacrimella · Medio · Ø 9–11 mm |
| `capperificio_bullet_1` | **Lacrimella** (calibro Medio, Ø 9–11 mm): polpa carnosa, gusto pieno ma non invadente |
| `capperificio_bullet_2` | Morbido e leggermente dolce, versatile in cucina |
| `capperificio_bullet_3` | Perfetto per i piatti di tutti i giorni |
| `capperificio_brew_pour_over` (In cucina) | `<p>Ottimo nel riso e nelle paste fredde: a questo livello di maturazione si fonde con gli altri ingredienti esaltandoli. Perfetto anche per ragù di pesce, caponata, farciture, paste fresche e salse agrodolci.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Si abbina a pesce, verdure agrodolci, paste fresche, antipasti e farciture.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Conservare in luogo fresco e asciutto. Mantenere i capperi coperti dal sale dopo l'apertura.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>Con la maturazione il cappero medio diventa più morbido e leggermente più dolce dei calibri piccoli.</p>` |

---

## 4. Capperone di Racale — al Sale Marino

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Capperone di Racale al Sale Marino |
| `productNumber`  | `CAP-CAPPERONE-250` |
| Peso netto       | 250 g |
| `weight` (spediz.)| 0.42 kg (indicativo) |
| Prezzo lordo     | `DA DEFINIRE` € (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Il più grande tra i capperi (Ø 12–15 mm): consistenza carnosa e sapore marcato. Mantiene l'aroma anche dopo la cottura. Perfetto tritato o disidratato.

**Descrizione lunga (`description`)**
> Il più grande tra i capperi, dall'audace consistenza carnosa e dal sapore marcato. Perfetto per essere tritato o disidratato. La sua peculiarità principale è quella di mantenere l'aroma anche dopo la cottura, grazie alla struttura più sviluppata e alla maggiore concentrazione di oli essenziali nella polpa. Questo tipo di cappero, noto come **capperone**, ha un diametro tra i 12 e i 15 mm. Viene raccolto in una fase più avanzata del bocciolo, poco prima che si trasformi in frutto.

### Scheda tecnica (Proprietà → tabella prodotto)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi 80% – Sale marino integrale 20% |
| Calibro | Capperone · Ø 12–15 mm |
| Peso netto | 250 g |
| Note di gusto | Marcato · Carnoso · Aromatico |
| Ideale per | Cotture, sughi, tritato o disidratato |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Capperone · Ø 12–15 mm |
| `capperificio_bullet_1` | **Capperone** (Ø 12–15 mm): il calibro più grande, carnoso e dal sapore marcato |
| `capperificio_bullet_2` | Mantiene l'aroma anche dopo la cottura |
| `capperificio_bullet_3` | Ottimo tritato o disidratato |
| `capperificio_brew_pour_over` (In cucina) | `<p>Perfetto tritato o disidratato, in piatti cotti, sughi e secondi: rilascia aroma anche a fine cottura.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Ideale con carni, sughi corposi e preparazioni che richiedono un cappero deciso.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Conservare in luogo fresco e asciutto. Mantenere i capperi coperti dal sale dopo l'apertura.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>Quello che nasce nel terreno racalino non è una semplice variante di qualcosa di già noto, ma un prodotto che trasuda autenticità, carattere e appartenenza.</p>` |

---

## 5. Polvere di Cappero — Extrafine

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Polvere di Cappero Extrafine |
| `productNumber`  | `CAP-POLVERE-50` |
| Peso netto       | 50 g |
| `weight` (spediz.)| 0.12 kg (indicativo) |
| Prezzo lordo     | `DA DEFINIRE` € (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 |

**Descrizione breve**
> Capperi selezionati, dissalati, essiccati e ridotti in polvere. Un insaporitore naturale dal profumo intenso e dalla lunga persistenza aromatica. 100% naturale.

**Descrizione lunga (`description`)**
> Capperi selezionati, dissalati, essiccati e ridotti in polvere. Un insaporitore naturale dal profumo intenso, sapido e dalla lunga persistenza aromatica, capace di richiamare tutta la complessità del cappero fresco in una forma più pratica e dosabile. Tutto il gusto del cappero in una forma concentrata e soprattutto 100% naturale, senza conservanti né additivi. Si scioglie facilmente in fondi, brodi e salse: un cucchiaino basta per trasformare un piatto semplice in un'esperienza complessa e intensa, grazie alla naturale concentrazione aromatica ottenuta con un processo lento di essiccazione a bassa temperatura che preserva gli oli essenziali del cappero.

### Scheda tecnica (Proprietà → tabella prodotto)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi disidratati e sale marino integrale — 100% naturale, senza conservanti né additivi |
| Tipo | Polvere extrafine |
| Peso netto | 50 g |
| Note di gusto | Concentrato · Sapido · Persistente |
| Ideale per | Fondi, brodi, salse, marinature |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Polvere Extrafine |
| `capperificio_bullet_1` | Tutto il gusto del cappero in forma concentrata e dosabile |
| `capperificio_bullet_2` | 100% naturale, senza conservanti né additivi |
| `capperificio_bullet_3` | Un cucchiaino basta per insaporire |
| `capperificio_brew_pour_over` (In cucina) | `<p>Si scioglie in fondi, brodi e salse: un cucchiaino trasforma un piatto semplice in un'esperienza intensa.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Insaporitore versatile per primi, secondi, marinature e finiture a crudo.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Conservare in luogo fresco e asciutto, al riparo dall'umidità; richiudere bene dopo l'uso.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>Nasce dal recupero di capperi troppo grandi o imperfetti per la conservazione intera: uno scarto che diventa prelibatezza grazie a essiccazione e macinatura.</p>` |

---

## 6. Foglie di Cappero — al Sale Marino

> Disponibile in **due formati** (50 g e 150 g). Modellare come prodotto con variante di
> **Peso/Formato**, oppure come due prodotti separati con SKU distinti.

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Foglie di Cappero al Sale Marino |
| `productNumber`  | `CAP-FOGLIE` (padre) — varianti `CAP-FOGLIE-50`, `CAP-FOGLIE-150` |
| Pesi netti       | 50 g · 150 g |
| Prezzo lordo     | `DA DEFINIRE` € per formato (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 per variante |

**Descrizione breve**
> Le foglie della pianta del cappero: gusto fresco, minerale e consistenza croccante. Una rarità mediterranea, perfetta nella gastronomia gourmet.

**Descrizione lunga (`description`)**
> Le foglie della pianta del cappero, dal gusto fresco, minerale e dalla consistenza croccante. Una rarità mediterranea. Le foglie di cappero (*Capparis spinosa*) sono una parte meno conosciuta ma sempre più apprezzata della pianta. Non sono solo commestibili, ma anche estremamente versatili in cucina, soprattutto nella gastronomia mediterranea contemporanea e nella ristorazione gourmet. Vengono raccolte durante la stagione vegetativa, generalmente tra maggio e settembre, prima che diventino troppo coriacee: si scelgono le foglie giovani e tenere, dalla consistenza più delicata e dal gusto equilibrato, leggermente sapido.

### Scheda tecnica (Proprietà → tabella prodotto)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Foglie di cappero 80% – Sale marino integrale 20% |
| Tipo | Foglie giovani e tenere |
| Peso netto | 50 g / 150 g |
| Note di gusto | Fresco · Minerale · Amarognolo |
| Ideale per | Tartare, insalate, involtini, fritture |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Foglie · 50 g / 150 g |
| `capperificio_bullet_1` | Foglie di cappero: fresche, minerali e croccanti |
| `capperificio_bullet_2` | Una rarità mediterranea, perfetta in cucina gourmet |
| `capperificio_bullet_3` | Solo foglie giovani e tenere, raccolte a mano |
| `capperificio_brew_pour_over` (In cucina) | `<p>Ideali per arricchire tartare di pesce, involtini di carne, insalate di stagione o persino da friggere.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Perfette con pesce crudo, carni delicate e insalate estive; un tocco amarognolo e fresco.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Conservare in luogo fresco e asciutto. Mantenere le foglie coperte dal sale dopo l'apertura.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>Si raccolgono tra maggio e settembre, scegliendo solo le foglie giovani e tenere prima che diventino coriacee.</p>` |

> **Nota varianti**: se usi un prodotto unico con varianti, crea il property group **"Formato"** con opzioni `50 g` e `150 g` e imposta un prezzo per variante. Vedi [`scripts/setup-capperificio.py`](sunrise-coffee/scripts/setup-capperificio.py) (funzione `setup_property_group`).

---

## 7. Linea Ho.Re.Ca — Capperi sottovuoto (canale professionale)

> Pensata per chef e ristoratori. Confezioni in **busta sottovuoto** ad alta barriera (no vetro), in due
> formati. Assegnare alla categoria/canale **B2B / Ho.Re.Ca** (vedi [`scripts/setup-b2b.py`](sunrise-coffee/scripts/setup-b2b.py)).

### Campi standard Shopware
| Campo            | Valore |
|------------------|--------|
| `name`           | Capperi di Racale Ho.Re.Ca — Busta Sottovuoto |
| `productNumber`  | `CAP-HORECA` (padre) — varianti `CAP-HORECA-500`, `CAP-HORECA-1000` |
| Pesi netti       | 500 g · 1000 g |
| Prezzo lordo     | `DA DEFINIRE` € per formato (IVA 4%) |
| Aliquota IVA     | 4% |
| Stock iniziale   | 100 per variante |

**Descrizione breve**
> La linea Ho.Re.Ca porta il cappero di Racale nelle cucine professionali: capperi in buste sottovuoto da 500 g e 1000 g, per chef e ristoratori.

**Descrizione lunga (`description`)**
> La nostra linea Ho.Re.Ca nasce per portare il cappero di Racale nelle mani di chi ogni giorno crea esperienze di gusto: chef e ristoratori, veri ambasciatori del territorio. Per questo confezioniamo i nostri capperi in **buste sottovuoto da 500 g e 1000 g**, realizzate con plastiche alimentari ad alta barriera che proteggono il prodotto da ossigeno e umidità. L'aria viene aspirata durante il confezionamento sottovuoto: un processo che impedisce lo sviluppo microbico, prolunga la shelf life e preserva struttura e gusto originale. Le buste riducono inoltre l'impatto ambientale grazie al minor peso degli imballaggi rispetto al vetro, facilitando logistica e stoccaggio.

### Scheda tecnica (Proprietà → tabella prodotto)
| Proprietà | Valore |
|-----------|--------|
| Origine | Racale (Salento, Puglia) |
| Ingredienti | Capperi 80% – Sale marino integrale 20% |
| Formato | 500 g / 1000 g |
| Note di gusto | Sapido · Mediterraneo |
| Ideale per | Uso professionale, tutto il menu |

### Custom field Capperificio
| Campo | Valore |
|-------|--------|
| `capperificio_calibro` | Ho.Re.Ca · 500 g / 1000 g |
| `capperificio_bullet_1` | Formati professionali da 500 g e 1000 g per chef e ristoratori |
| `capperificio_bullet_2` | Buste sottovuoto ad alta barriera: gusto e struttura preservati |
| `capperificio_bullet_3` | Meno imballaggio, logistica più semplice |
| `capperificio_brew_pour_over` (In cucina) | `<p>Formato professionale per un uso intensivo: dosaggio libero secondo le esigenze del servizio.</p>` |
| `capperificio_brew_drip` (Abbinamenti) | `<p>Versatile su tutta la linea di menu, dagli antipasti ai secondi.</p>` |
| `capperificio_brew_aeropress` (Conservazione) | `<p>Sottovuoto ad alta barriera contro ossigeno e umidità; una volta aperta, conservare in frigo e consumare in tempi brevi.</p>` |
| `capperificio_brew_plunger` (Lo sapevi?) | `<p>La busta sottovuoto pesa meno del vetro: meno imballaggio, logistica più semplice e minore impatto ambientale.</p>` |

---

## Riepilogo SKU e formati

| # | Prodotto                              | SKU proposto         | Formato/i      | Calibro / Ø     | Confezione   |
|---|---------------------------------------|----------------------|----------------|-----------------|--------------|
| 1 | Cappero Lilliput al Sale Marino       | `CAP-LILLIPUT-75`    | 75 g           | Ø 4–6 mm        | Box 6        |
| 2 | Cappero Occhio di Pernice (Piccolo)   | `CAP-OCCHIO-150`     | 150 g          | Ø 6–9 mm        | Box 6        |
| 3 | Cappero Lacrimella (Medio)            | `CAP-LACRIMELLA-250` | 250 g          | Ø 9–11 mm       | Box 6        |
| 4 | Capperone al Sale Marino              | `CAP-CAPPERONE-250`  | 250 g          | Ø 12–15 mm      | Box 6        |
| 5 | Polvere di Cappero Extrafine          | `CAP-POLVERE-50`     | 50 g           | polvere         | Box 6        |
| 6 | Foglie di Cappero al Sale Marino      | `CAP-FOGLIE-50/150`  | 50 g / 150 g   | foglie          | Box 6        |
| 7 | Ho.Re.Ca Busta Sottovuoto             | `CAP-HORECA-500/1000`| 500 g / 1000 g | misti           | Busta vuoto  |

---

## Checklist operativa

- [ ] Eseguire [`scripts/setup-custom-fields.py`](sunrise-coffee/scripts/setup-custom-fields.py) (crea i custom field se mancanti).
- [ ] Creare i **Gruppi di proprietà**: Origine, Ingredienti, Calibro, Peso netto, Note di gusto, Ideale per.
- [ ] Creare/aggiornare i 7 prodotti con i campi standard di questa guida.
- [ ] Assegnare a ogni prodotto le **Proprietà** dalla rispettiva *Scheda tecnica*.
- [ ] Per i prodotti multi-formato (Foglie, Ho.Re.Ca) decidere: variante singola o prodotti separati.
- [ ] Inserire i **prezzi reali** (non presenti nel catalogo) — IVA 4%.
- [ ] Compilare i custom field `capperificio_*` (badge, bullet, accordion).
- [ ] Caricare le immagini prodotto e impostare la cover.
- [ ] Assegnare la linea Ho.Re.Ca al canale/categoria B2B.
- [ ] Verificare la resa nella product page (tabella tecnica, badge calibro, bullet, accordion).

> **Allineamento script**: in [`scripts/setup-capperificio.py`](sunrise-coffee/scripts/setup-capperificio.py)
> la lista `PRODUCTS` e `FORMATO_OPTIONS` **non coincide** con questo catalogo (contiene prodotti all'aceto/cucunci e calibri diversi).
> Aggiornare quello script ai 7 prodotti reali sopra prima di rilanciare il seed automatico.

---

## Nota tecnica — far funzionare la tabella tecnica in italiano

Le sezioni *tabella tecnica* e *accordion* restano nel frontend così come sono: basta popolarle
con dati reali e i placeholder caffè spariscono. Due ritocchi opzionali al codice rendono la
tabella perfettamente italiana (oggi i nomi di default e l'ordinamento sono pensati per il caffè).

In [`ProductDetail.jsx`](sunrise-coffee/src/components/ProductDetail/ProductDetail.jsx):

1. **Ordine righe** — riga 272:
   ```js
   // da:
   const PROPERTY_ORDER = ['Tasting notes', 'Region', 'Type', 'Best for', 'Process'];
   // a:
   const PROPERTY_ORDER = ['Origine', 'Ingredienti', 'Calibro', 'Peso netto', 'Note di gusto', 'Ideale per'];
   ```
2. **Multi-riga note di gusto** — riga ~427: il `group === 'Tasting notes'` va cambiato in
   `group === 'Note di gusto'` per andare a capo a ogni descrittore.
3. **Fallback tabella** — righe ~438-442: i valori caffè di esempio (Vanilla/Caramel…) si possono
   sostituire con valori capperi generici, così anche un prodotto senza proprietà non mostra il caffè.

Senza queste modifiche le righe funzionano comunque, ma compaiono in ordine d'inserimento e i nomi
gruppo restano quelli che imposti tu in Shopware.

> 💡 **Nota Shopware**: le *Proprietà* sono pensate come attributi riutilizzabili/filtrabili. Inserendo
> valori unici per prodotto (es. ingredienti) si creano molte opzioni "usa e getta" nell'elenco proprietà.
> Funziona ed è il modo più rapido per popolare la tabella senza toccare il codice; se in futuro l'elenco
> proprietà diventa troppo affollato, si può spostare la *Scheda tecnica* su custom field dedicati con una
> piccola modifica al frontend.
