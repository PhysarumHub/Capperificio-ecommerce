# Implementazione Cookie — Sito Norino

Questa guida documenta l'intero sistema di gestione cookie e consensi GDPR utilizzato nel sito Norino. Può essere riutilizzata come riferimento per implementare lo stesso sistema su altri progetti.

---

## Architettura

Il sistema si compone di **4 livelli**:

```
1. <head>       → Google Consent Mode v2 (default)
2. GTM          → Google Tag Manager (carica in base ai segnali di consenso)
3. JS           → cookie-consent.js (banner + modal + logica)
4. JS           → fb-pixel.js (Facebook Pixel, consent-aware)
```

### Flusso completo

```
Pagina caricata
  │
  ├─ <head>: legge localStorage('norino_consent')
  │    └─ gtag('consent', 'default', { ... })   ← imposta granted/denied
  │
  ├─ GTM si carica, rispetta i segnali di consent
  │
  ├─ cookie-consent.js:
  │    ├─ Consenso già dato? → applica e non mostra banner
  │    └─ Prima visita? → mostra banner dopo 600ms
  │         └─ Utente sceglie → save() → localStorage + gtag('consent','update')
  │              └─ dispatch CustomEvent 'norino:consent'
  │
  └─ fb-pixel.js:
       ├─ Consenso marketing già dato? → inizializza pixel
       └─ Altrimenti → ascolta 'norino:consent' → inizializza se marketing=true
```

---

## 1. Consent Mode v2 nel `<head>`

Questo script va inserito **prima di GTM** e **prima di qualsiasi tag di terze parti**. Legge il consenso salvato in `localStorage` e imposta i default di Google Consent Mode v2.

```html
<script>
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
(function () {
  var c = null;
  try {
    var r = localStorage.getItem('norino_consent');
    if (r) c = JSON.parse(r);
  } catch (e) {}

  var a = c && c.analytics ? 'granted' : 'denied';
  var m = c && c.marketing ? 'granted' : 'denied';

  gtag('consent', 'default', {
    ad_storage:              m,
    ad_user_data:            m,
    ad_personalization:      m,
    analytics_storage:       a,
    personalization_storage: m,
    functionality_storage:   'granted',
    security_storage:        'granted'
  });
})();
</script>
```

### Segnali Consent Mode v2

| Segnale | Tipo | Dipende da |
|---|---|---|
| `analytics_storage` | Analitico | toggle "Analitici" |
| `ad_storage` | Marketing | toggle "Marketing" |
| `ad_user_data` | Marketing | toggle "Marketing" |
| `ad_personalization` | Marketing | toggle "Marketing" |
| `personalization_storage` | Marketing | toggle "Marketing" |
| `functionality_storage` | Necessario | sempre `granted` |
| `security_storage` | Necessario | sempre `granted` |

---

## 2. Google Tag Manager

Subito dopo il consent default:

```html
<!-- <head> -->
<script>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXXXX');
</script>

<!-- <body> (subito dopo l'apertura) -->
<noscript>
  <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXXXX"
  height="0" width="0" style="display:none;visibility:hidden"></iframe>
</noscript>
```

GTM rispetta automaticamente i segnali di Consent Mode: i tag configurati con trigger di consenso non sparano finché il segnale non è `granted`.

---

## 3. Cookie Consent JS (`js/cookie-consent.js`)

File principale. Va caricato con `defer`:

```html
<script src="js/cookie-consent.js" defer></script>
```

### Struttura dati in localStorage

Chiave: `norino_consent`

```json
{
  "necessary": true,
  "analytics": true,
  "marketing": false
}
```

### Funzioni principali

#### `getConsent()` / `setConsent(obj)`
Leggono/scrivono `norino_consent` in `localStorage`. Il formato JSON contiene i boolean per ogni categoria.

#### `purgeTrackingCookies()`
Cancella i cookie di tracciamento se il consenso viene negato:

```js
// Cookie cancellati:
'_ga', '_gid', '_gat',  // Google Analytics
'_fbp', '_fbc',          // Facebook Pixel
'_ga_*'                  // GA4 (pattern matching)
```

Metodo: imposta `expires` al 1970 per ogni cookie.

#### `updateConsentSignals(prefs)`
Aggiorna Google Consent Mode v2 con i nuovi segnali:

```js
gtag('consent', 'update', {
  analytics_storage:       prefs.analytics ? 'granted' : 'denied',
  ad_storage:              prefs.marketing ? 'granted' : 'denied',
  ad_user_data:            prefs.marketing ? 'granted' : 'denied',
  ad_personalization:      prefs.marketing ? 'granted' : 'denied',
  personalization_storage: prefs.marketing ? 'granted' : 'denied',
  functionality_storage:   'granted',
  security_storage:        'granted'
});
```

#### `save(prefs)`
Salva il consenso, applica i segnali, nasconde il banner, e **notifica gli altri script** tramite un CustomEvent:

```js
document.dispatchEvent(new CustomEvent('norino:consent', { detail: prefs }));
```

Questo evento permette a script come `fb-pixel.js` di attivarsi in modo reattivo.

### UI: Banner + Modal

Il banner e la modale vengono **iniettati nel DOM via JS** (non sono nell'HTML statico). Questo evita il flash del banner per gli utenti che hanno già dato il consenso.

#### Banner (3 bottoni)

| Bottone | Azione `data-cc` | Risultato |
|---|---|---|
| "Accetta tutto" | `accept` | `{ necessary: true, analytics: true, marketing: true }` |
| "Rifiuta" | `reject` | `{ necessary: true, analytics: false, marketing: false }` |
| "Personalizza" | `open-settings` | Apre la modale delle preferenze |

#### Modale preferenze (3 categorie)

| Categoria | Toggle | Note |
|---|---|---|
| Necessari | Sempre ON, disabled | Non disattivabile |
| Analitici | Checkbox `#cc-analytics` | Google Analytics |
| Marketing | Checkbox `#cc-marketing` | Facebook Pixel, remarketing |

Il bottone "Salva preferenze" (`data-cc="save"`) legge lo stato dei checkbox e salva.

### Init

```js
function init() {
  var prefs = getConsent();

  if (prefs) {
    // Consent gia' salvato: i default nel <head> sono gia' corretti
    // purge solo se tutto negato
    if (!prefs.analytics && !prefs.marketing) purgeTrackingCookies();
  } else {
    // Prima visita: default denied (gia' nel <head>), mostra banner
    purgeTrackingCookies();
    var ui = injectUI();
    setTimeout(function () { ui.banner.classList.add('is-visible'); }, 600);
  }
}
```

### API pubblica

```js
window.NorinoConsent.openSettings();  // Apri la modale preferenze da qualsiasi punto
```

---

## 4. Facebook Pixel consent-aware (`js/fb-pixel.js`)

```html
<script src="js/fb-pixel.js" defer></script>
```

### Comportamento

1. **Consenso gia' dato**: legge `localStorage`, se `marketing === true` inizializza il pixel subito
2. **Consenso dato dal banner**: ascolta l'evento `norino:consent` e si attiva se `detail.marketing === true`
3. **Coda eventi**: prima dell'inizializzazione, gli eventi vengono accodati e inviati appena il pixel e' pronto

### `fbq_safe()` — wrapper globale

Invece di chiamare `fbq()` direttamente (che fallirebbe se il pixel non e' caricato), usare:

```js
// Da qualsiasi punto del sito:
fbq_safe('track', 'Lead', { value: 100 });
```

Se il pixel non e' ancora pronto, l'evento viene messo in coda. Appena il pixel si inizializza, la coda viene svuotata.

---

## 5. CSS del banner e della modale

Tutti gli stili sono in `css/styles.css`, classi:

### Banner

```css
.cookie-banner              /* container fixed, bottom: 20px, centrato con left:50% + translate */
.cookie-banner.is-visible   /* transform: translate(-50%, 0) — slide up animato */
.cookie-banner__inner       /* flex column, gap 18px */
.cookie-banner__text        /* testo + link a cookie-policy */
.cookie-banner__actions     /* flex row con 3 bottoni */
.cookie-banner__btn         /* stile base: bordo bianco, trasparente */
.cookie-banner__btn--accept /* flex: 1 */
.cookie-banner__btn--reject /* flex: 1 */
.cookie-banner__btn--settings /* piu' piccolo */
```

Design: sfondo `rgba(0,0,0,.92)` con `backdrop-filter: blur(18px)`, bordo sottile semitrasparente, border-radius `var(--radius-lg)`. Animazione ingresso con `transform: translate(-50%, 140%)` → `translate(-50%, 0)`.

### Modale preferenze

```css
.cookie-modal-overlay       /* overlay fullscreen, opacity transition */
.cookie-modal-overlay.is-open /* opacity: 1, pointer-events: auto */
.cookie-modal               /* card bianca centrata, max-width 440px */
.cookie-modal__group        /* sezione per categoria, bordo top */
.cookie-modal__group-head   /* flex: label + toggle */
.cookie-toggle              /* switch custom con track + pallino */
.cookie-toggle__track       /* sfondo grigio/terra se checked */
.cookie-toggle__track::after /* pallino bianco, translateX(18px) se checked */
.cookie-modal__save         /* bottone nero full-width */
```

### Toggle switch

Il toggle e' costruito con `<input type="checkbox">` nascosto + `<span class="cookie-toggle__track">`:
- Track: sfondo `var(--silver-md)`, diventa `var(--terra)` se checked
- Pallino: pseudoelemento `::after`, `translateX(18px)` quando checked
- Disabled: `opacity: 0.5`, `cursor: not-allowed`

### Responsive (< 640px)

- Banner: padding ridotto, bottoni wrap su 2 righe
- Accept/Reject: `flex: 1 1 calc(50% - 4px)` (affiancati)
- Personalizza: `width: 100%` (riga intera sotto)

---

## Checklist per un nuovo progetto

1. [ ] Inserire lo script consent default nel `<head>` PRIMA di GTM
2. [ ] Inserire GTM nel `<head>` (script) e subito dopo `<body>` (noscript)
3. [ ] Copiare `js/cookie-consent.js` e aggiornare il `STORAGE_KEY` se necessario
4. [ ] Copiare `js/fb-pixel.js` e aggiornare il `PIXEL_ID`
5. [ ] Copiare gli stili CSS del banner/modale (`.cookie-banner`, `.cookie-modal`, `.cookie-toggle`)
6. [ ] Aggiornare `GTM-XXXXXXXXX` con il proprio container ID
7. [ ] Creare le pagine `cookie-policy.html` e `privacy-policy.html`
8. [ ] Testare: prima visita → banner → accetta → niente banner al refresh
9. [ ] Testare: rifiuta → cookie GA/FB cancellati → nessun tracking
10. [ ] Testare: `NorinoConsent.openSettings()` da console → modale si apre
11. [ ] Verificare in GTM Debug che i segnali di consent siano corretti
