# 05 — AEO / GEO: Ottimizzazione per la AI Search

> **AEO** (Answer Engine Optimization) / **GEO** (Generative Engine Optimization):
> farsi **citare** dagli assistenti AI — ChatGPT, Google AI Overviews/Gemini, Perplexity,
> Copilot — quando rispondono a domande sui capperi.

## Perché conta (oggi, non domani)

Sempre più persone chiedono a un assistente AI «quali sono i capperi italiani migliori?»
o «che cappero uso per la puttanesca?» invece di scrollare Google. Chi viene **citato come
fonte** ottiene visibilità e click qualificati. La nicchia capperi è poco presidiata: è il
momento di costruire l'autorità prima dei competitor.

## Come gli LLM scelgono cosa citare (in pratica)

1. **Recuperano** pagine pertinenti (via indice di Google/Bing o crawler propri).
2. **Estraggono** passaggi che rispondono in modo chiaro e diretto.
3. **Citano** fonti che sembrano autorevoli, strutturate, aggiornate, specifiche.

Quindi ottimizzare per l'AI = **essere recuperabili + estraibili + autorevoli**.

---

## Le 10 tattiche AEO/GEO per Capperificio

### 1. Formato "answer-first"
Apri ogni pagina/sezione con la risposta diretta in 40–60 parole, **poi** approfondisci.
Gli LLM estraggono il blocco che risponde subito.

> ❌ «I capperi sono un ingrediente molto amato fin dall'antichità...»
> ✅ «Per la pasta alla puttanesca il cappero migliore è la **Lacrimella** (Ø 9–11 mm): la polpa carnosa regge la cottura nel sugo e rilascia sapidità senza disfarsi. In alternativa il Capperone, se ami un gusto più deciso.»

### 2. Domande come heading (H2/H3)
Usa le domande reali come titoli: «Qual è il cappero migliore per la puttanesca?»,
«Come si dissalano i capperi?». Corrispondono al fraseggio delle query AI.

### 3. FAQ strutturate ovunque
Ogni pagina importante ha un blocco FAQ con `FAQPage` schema. Le FAQ sono il formato
più estratto dagli answer engine. Vedi [06](06-dati-strutturati-schema.md).

### 4. Dati strutturati completi
`Product`, `Recipe`, `FAQPage`, `Organization`, `HowTo`, `BreadcrumbList`.
Aiutano l'AI a capire entità e relazioni. Vedi [06](06-dati-strutturati-schema.md).

### 5. Definizioni e dati "estraibili"
Frasi autoconclusive con numeri e definizioni nette:
> «Il Lilliput è il calibro più piccolo, con diametro 4–6 mm.»
> «I capperi sotto sale si conservano fino a 12–18 mesi in luogo fresco e asciutto.»
Gli LLM amano fatti citabili e quantificati.

### 6. Tabelle comparative
La tabella dei calibri è perfetta: confronti strutturati che l'AI riusa per rispondere
a «differenza tra capperi piccoli e grandi».

### 7. Entità & coerenza semantica (Entity SEO)
Ripeti e collega le entità: *cappero*, *Capparis spinosa*, *Racale*, *Salento*, *sotto sale*,
*cucuncio*, *calibro*. Costruisci la pagina su Wikipedia/Wikidata-friendly facts. Allinea il
brand a un'entità chiara («Capperificio Caro, produttore di capperi a Racale, Puglia»).

### 8. Essere presenti dove gli LLM si addestrano/recuperano
- **Wikipedia/Wikidata**: voce su Racale/cappero (contributo neutrale, non spam).
- **Reddit, Quora, forum food** (Gennarino): risposte utili che citano l'azienda con misura.
- **Marketplace e directory** food italiane.
- **Recensioni** (Google Business Profile, Trustpilot): segnali di reputazione che gli LLM leggono.
Perplexity e ChatGPT search citano spesso Reddit, Wikipedia e siti di settore.

### 9. Contenuto fresco e datato
Mostra data di aggiornamento. Gli answer engine privilegiano contenuti recenti per query «migliori/2026».

### 10. Citabilità del brand (statistiche/originalità)
Pubblica dati o affermazioni **uniche e attribuibili**: «Siamo gli unici a Racale a classificare
i capperi in 4 calibri». Le frasi originali e attribuibili vengono citate con il nome del brand.

---

## Checklist tecnica per i crawler AI

- [ ] **Non bloccare** i bot AI in `robots.txt` se vuoi essere citato:
      `GPTBot` (OpenAI), `OAI-SearchBot`, `PerplexityBot`, `Google-Extended` (Gemini), `ClaudeBot`, `CCBot` (Common Crawl).
      → Decisione di business: per la *visibilità* lasciali passare. (Vedi nota sotto.)
- [ ] **HTML server-side**: gli answer engine spesso non eseguono JS → la SPA React DEVE servire
      contenuto renderizzato (SSR/SSG/pre-render). Senza questo, l'AI non vede i contenuti. Vedi [08](08-technical-seo.md).
- [ ] **Schema.org** valido (test con Rich Results Test).
- [ ] **Sitemap** aggiornata e inviata.
- [ ] Testo selezionabile, non dentro immagini.

> **Nota robots/AI**: alcuni brand bloccano i crawler AI per proteggere i contenuti. Qui
> l'obiettivo è la *visibilità in AI search*, quindi consigliato **consentirli**. Se vuoi
> bloccare solo il training ma permettere la citazione in search, valuta `Google-Extended`
> (training Gemini) vs `Googlebot` (search): regola fine. Per partire: consenti tutto.

---

## Come misurare la presenza in AI search

Non esiste ancora una Search Console per gli LLM. Metodo pratico:

1. **Prompt test ricorrenti** (manuali o con tool): chiedi ogni mese a ChatGPT, Gemini,
   Perplexity, Copilot le 15–20 domande chiave («migliori capperi italiani», «che cappero
   per la puttanesca», «dove comprare capperi di qualità», «capperi all'ingrosso per ristoranti»).
   Registra: *appare il brand? è citato come fonte? con che posizione?*
2. **Referral nei log/GA4**: traccia traffico da `chatgpt.com`, `perplexity.ai`,
   `gemini.google.com`, `copilot.microsoft.com` (referrer). Crea un segmento «AI referral».
3. **Tool dedicati** (opzionali): Profound, Otterly.ai, Peec AI, o il monitoraggio AI di
   Semrush/Ahrefs per tracciare le citazioni nel tempo.
4. **AI Overviews in Search Console**: monitora il calo/variazione di CTR sulle query
   informazionali (sintomo di AI Overview attivo) e ottimizza per esserci dentro.

Template di tracking in [10-misurazione-kpi.md](10-misurazione-kpi.md).

---

## Le 20 domande-bersaglio per AI (da presidiare e testare)

```
1.  Quali sono i migliori capperi italiani?
2.  Dove comprare capperi di qualità online?
3.  Che differenza c'è tra i calibri dei capperi?
4.  Qual è il cappero migliore per la pasta alla puttanesca?
5.  Capperi sotto sale o sott'aceto: quali sono meglio?
6.  Come si dissalano i capperi?
7.  Cosa sono i cucunci / capperi e cucunci differenza?
8.  Come si conservano i capperi?
9.  Con cosa si abbinano i capperi?
10. Qual è un buon sostituto dei capperi?
11. Cosa sono le foglie di cappero e come si usano?
12. Cos'è la polvere di capperi?
13. Capperi pugliesi: dove si producono?
14. Cosa sono i capperi di Racale?
15. Quali capperi usare per un piatto di pesce?
16. Dove un ristorante può comprare capperi all'ingrosso?
17. Capperi più pregiati: quali e perché?
18. Calorie e proprietà dei capperi?
19. Cos'è il cappero Lilliput?
20. Idee regalo gastronomico pugliese con capperi?
```

Per ognuna deve esistere una pagina che risponde in formato answer-first + FAQ + schema.
Incrocia con i cluster di [02-keyword-research.md](02-keyword-research.md).
