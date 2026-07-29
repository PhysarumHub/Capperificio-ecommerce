# 06 — Dati Strutturati (Schema.org) — pronti da implementare

> JSON-LD copia-incolla, da adattare ai dati reali. I dati strutturati sono fondamentali
> sia per i rich result Google sia per la comprensione delle entità da parte degli LLM ([05](05-aeo-ai-search.md)).
> Valida sempre con **Rich Results Test** e **Schema Markup Validator**.

## Dove va il JSON-LD
In un tag `<script type="application/ld+json">` nel `<head>` o nel body della pagina.
In React: renderizzato server-side / pre-render (vedi [08](08-technical-seo.md)), non solo client-side.

---

## 1. Organization (sito-wide, in homepage)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Capperificio Caro",
  "url": "https://www.capperificiocaro.it",
  "logo": "https://www.capperificiocaro.it/logo.png",
  "description": "Produttore di capperi di Racale (Salento, Puglia), gli unici classificati per calibro: Lilliput, Occhio di Pernice, Lacrimella, Capperone.",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Racale",
    "addressRegion": "Puglia",
    "addressCountry": "IT"
  },
  "sameAs": [
    "https://www.instagram.com/...",
    "https://www.facebook.com/...",
    "https://www.google.com/maps/place/..."
  ]
}
```

> Aggiungi `@type: "FoodEstablishment"` o `"GroceryStore"`/`"Brand"` se opportuno.
> Compila `sameAs` con tutti i profili reali: rafforza l'entità per gli LLM.

---

## 2. Product + Offer (ogni scheda prodotto)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Cappero di Racale Lilliput al Sale Marino",
  "image": ["https://www.capperificiocaro.it/img/lilliput.jpg"],
  "description": "Il calibro più piccolo e pregiato (Ø 4–6 mm): fragrante e persistente, la firma del Capperificio Caro. Perfetto per cucina gourmet e crudi.",
  "sku": "CAP-LILLIPUT-75",
  "brand": { "@type": "Brand", "name": "Capperificio Caro" },
  "category": "Capperi sotto sale",
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "Calibro", "value": "Lilliput · Ø 4–6 mm" },
    { "@type": "PropertyValue", "name": "Origine", "value": "Racale (Salento, Puglia)" },
    { "@type": "PropertyValue", "name": "Peso netto", "value": "75 g" },
    { "@type": "PropertyValue", "name": "Ingredienti", "value": "Capperi 80% – Sale marino integrale 20%" }
  ],
  "offers": {
    "@type": "Offer",
    "url": "https://www.capperificiocaro.it/prodotti/cappero-lilliput-sale-marino",
    "priceCurrency": "EUR",
    "price": "0.00",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition"
  }
}
```

> Inserisci il **prezzo reale** (il catalogo lo segna `DA DEFINIRE`). `AggregateRating` e
> `review` vanno aggiunti **solo** quando hai recensioni vere (no markup di recensioni inventate → penalizzazione).

### AggregateRating (quando avrai recensioni reali)
```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.8",
  "reviewCount": "37"
}
```

---

## 3. Recipe (ogni pagina ricetta) — alto valore per rich result e AI

```json
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "Spaghetti alla puttanesca con capperi di Racale",
  "image": ["https://www.capperificiocaro.it/img/ricette/puttanesca.jpg"],
  "author": { "@type": "Organization", "name": "Capperificio Caro" },
  "datePublished": "2026-07-01",
  "description": "La ricetta autentica della puttanesca con il cappero Lacrimella: polpa carnosa che regge la cottura nel sugo.",
  "recipeCuisine": "Italiana",
  "recipeCategory": "Primo piatto",
  "keywords": "puttanesca, capperi, cappero di Racale, Lacrimella",
  "prepTime": "PT10M",
  "cookTime": "PT15M",
  "totalTime": "PT25M",
  "recipeYield": "4 porzioni",
  "recipeIngredient": [
    "320 g di spaghetti",
    "30 g di capperi di Racale Lacrimella",
    "50 g di olive nere",
    "4 filetti di acciuga",
    "400 g di pomodorini",
    "aglio, peperoncino, olio EVO"
  ],
  "recipeInstructions": [
    { "@type": "HowToStep", "text": "Soffriggi aglio e peperoncino nell'olio." },
    { "@type": "HowToStep", "text": "Aggiungi acciughe, olive e capperi dissalati." },
    { "@type": "HowToStep", "text": "Unisci i pomodorini e cuoci 10 minuti." },
    { "@type": "HowToStep", "text": "Manteca gli spaghetti nel sugo e servi." }
  ],
  "nutrition": { "@type": "NutritionInformation", "calories": "520 kcal" }
}
```

---

## 4. FAQPage (pillar, hub, prodotti, guide, ricette)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Qual è la differenza tra i calibri dei capperi?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Il calibro è il diametro del bocciolo. I più piccoli (Lilliput 4–6 mm, Occhio di Pernice 6–9 mm) sono fragranti e adatti a crudi e insalate; i più grandi (Lacrimella 9–11 mm, Capperone 12–15 mm) sono carnosi e ideali per sughi e cotture."
      }
    },
    {
      "@type": "Question",
      "name": "Come si dissalano i capperi sotto sale?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sciacquali sotto acqua corrente e lasciali in ammollo in acqua fredda 10–15 minuti, cambiando l'acqua un paio di volte. Assaggia e regola in base alla sapidità desiderata."
      }
    }
  ]
}
```

---

## 5. HowTo (guide procedurali, es. «come dissalare i capperi»)

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Come dissalare i capperi sotto sale",
  "totalTime": "PT15M",
  "step": [
    { "@type": "HowToStep", "name": "Sciacqua", "text": "Sciacqua i capperi sotto acqua corrente per rimuovere il sale in superficie." },
    { "@type": "HowToStep", "name": "Ammolla", "text": "Mettili in ammollo in acqua fredda per 10–15 minuti." },
    { "@type": "HowToStep", "name": "Cambia l'acqua", "text": "Cambia l'acqua una o due volte." },
    { "@type": "HowToStep", "name": "Assaggia", "text": "Assaggia e scola quando la sapidità è giusta." }
  ]
}
```

---

## 6. BreadcrumbList (tutte le pagine interne)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.capperificiocaro.it" },
    { "@type": "ListItem", "position": 2, "name": "Ricette", "item": "https://www.capperificiocaro.it/ricette" },
    { "@type": "ListItem", "position": 3, "name": "Spaghetti alla puttanesca con capperi" }
  ]
}
```

---

## Mappa schema → tipo di pagina

| Tipo pagina | Schema obbligatori |
|-------------|--------------------|
| Homepage | Organization, WebSite (con SearchAction) |
| Pillar | FAQPage, BreadcrumbList |
| Scheda prodotto | Product, Offer, BreadcrumbList, (AggregateRating) |
| Hub calibri | FAQPage, BreadcrumbList, ItemList |
| Ricetta | Recipe, FAQPage, BreadcrumbList |
| Abbinamento | FAQPage, BreadcrumbList |
| Guida/SA | FAQPage, (HowTo se procedurale), BreadcrumbList |
| Landing Ho.Re.Ca | Organization/Service, FAQPage |

## Errori da evitare
- ❌ Markup di recensioni/rating non reali → violazione linee guida Google.
- ❌ Schema non corrispondente al contenuto visibile in pagina.
- ❌ JSON-LD solo lato client mai renderizzato → invisibile ai crawler che non eseguono JS.
- ✅ Valida ogni template una volta, poi genera in serie dal dataset.
