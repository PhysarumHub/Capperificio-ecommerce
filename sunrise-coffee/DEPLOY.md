# 🚀 Deploy su Vercel — capperificiocaro.com

> Progetto: **React + Vite** · API serverless Stripe · Repo: `PhysarumHub/Capperificio-ecommerce`

---

## Indice

1. [Prepara il branch](#1-prepara-il-branch)
2. [Crea il progetto su Vercel](#2-crea-il-progetto-su-vercel)
3. [Configura build e root directory](#3-configura-build-e-root-directory)
4. [Imposta le variabili d'ambiente](#4-imposta-le-variabili-dambiente)
5. [Primo deploy](#5-primo-deploy)
6. [Aggiungi il dominio capperificiocaro.com](#6-aggiungi-il-dominio-capperificiocароcom)
7. [Configura i DNS](#7-configura-i-dns)
8. [Aggiornamenti post-deploy](#8-aggiornamenti-post-deploy)
9. [Passare a Stripe LIVE](#9-passare-a-stripe-live)
10. [Workflow deploy futuro](#10-workflow-deploy-futuro)

---

## 1. Prepara il branch

Il codice è sul branch `feature/shopware-integration`. Prima di andare live **mergia su `main`**:

```bash
git checkout main
git merge feature/shopware-integration
git push origin main
```

> Vercel di default deploya il branch `main` in produzione. Puoi anche deployare direttamente `feature/shopware-integration` (vedi step 2), ma per la produzione è buona pratica usare `main`.

---

## 2. Crea il progetto su Vercel

1. Vai su **[vercel.com](https://vercel.com)** → accedi o crea un account gratuito
2. Dashboard → **"Add New…" → "Project"**
3. Clicca **"Import Git Repository"**
4. Seleziona **GitHub** e autorizza Vercel ad accedere ai tuoi repo
5. Trova e seleziona **`PhysarumHub/Capperificio-ecommerce`**
6. Clicca **"Import"**

---

## 3. Configura build e root directory

⚠️ **Passaggio critico** — il progetto non è nella root del repo, ma nella sottocartella `sunrise-coffee`.

Nella schermata di configurazione del progetto:

| Campo | Valore |
|---|---|
| **Root Directory** | `sunrise-coffee` |
| **Framework Preset** | `Vite` |
| **Build Command** | `vite build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

Per impostare la Root Directory:
- Clicca su **"Edit"** accanto a *Root Directory*
- Digita `sunrise-coffee`
- Spunta **"Include source files outside of the Root Directory in the Build Step"** → **NO** (lascia deselezionato)

---

## 4. Imposta le variabili d'ambiente

Sempre nella schermata di configurazione, sezione **"Environment Variables"**.

Aggiungi **una per una** le seguenti variabili (copia i valori reali dal tuo `.env` locale):

### Shopware

| Nome | Valore |
|---|---|
| `VITE_SHOPWARE_API_URL` | `https://TUO-SHOPWARE.com/store-api` |
| `VITE_SHOPWARE_ACCESS_KEY` | `SWSC...` (la tua chiave headless) |
| `VITE_SHOPWARE_STOREFRONT_URL` | `https://capperificiocaro.com` ← metti il dominio finale |

### Stripe (inizia con le chiavi TEST, poi passa a LIVE — vedi step 9)

| Nome | Valore |
|---|---|
| `VITE_STRIPE_PUBLIC_KEY` | `pk_test_...` |
| `STRIPE_SECRET_KEY` | `sk_test_...` ⚠️ questa è **segreta** — non condividerla mai |

> `STRIPE_SECRET_KEY` (senza `VITE_`) è usata solo lato server dalla serverless function e non viene mai esposta al browser.

### PayPal

| Nome | Valore |
|---|---|
| `VITE_PAYPAL_CLIENT_ID` | `AXxx...` |

### Strapi CMS (blog) — solo se hai un'istanza attiva

| Nome | Valore |
|---|---|
| `VITE_STRAPI_URL` | `https://TUO-STRAPI.com` |
| `VITE_STRAPI_TOKEN` | il token read-only da Strapi Admin |

### B2B — opzionale

| Nome | Valore |
|---|---|
| `VITE_B2B_CATEGORY_ID` | l'ID categoria B2B da Shopware |
| `VITE_B2B_GROUP_NAME` | `B2B` |

---

## 5. Primo deploy

1. Dopo aver inserito tutte le variabili → clicca **"Deploy"**
2. Vercel builderà il progetto (circa 1-2 minuti)
3. Se il build va a buon fine vedrai **"Congratulations!"** con un URL tipo:
   `https://capperificio-ecommerce.vercel.app`
4. Testa l'URL temporaneo prima di collegare il dominio

### ❌ Se il build fallisce

Clicca su **"View Build Logs"** e cerca righe rosse. Gli errori più comuni:

- **`Cannot find module`** → una dipendenza manca dal `package.json`
- **Env var undefined** → hai dimenticato una variabile d'ambiente
- **Root directory errata** → ricontrolla che sia `sunrise-coffee`

---

## 6. Aggiungi il dominio capperificiocaro.com

1. Nel progetto Vercel → tab **"Settings"** → sezione **"Domains"**
2. Clicca **"Add"**
3. Digita `capperificiocaro.com` → **"Add"**
4. Aggiungi anche `www.capperificiocaro.com` → Vercel configurerà automaticamente il redirect `www → apex`
5. Vercel ti mostrerà i record DNS da configurare (vedi step 7)

---

## 7. Configura i DNS

Accedi al pannello del tuo registrar/DNS (es. Aruba, Register.it, GoDaddy, Cloudflare…) e aggiungi questi record:

### Opzione A — Dominio apex su Vercel (consigliata)

| Tipo | Nome | Valore | TTL |
|---|---|---|---|
| `A` | `@` | `76.76.21.21` | 3600 |
| `CNAME` | `www` | `cname.vercel-dns.com` | 3600 |

> **Nota:** Vercel mostra l'IP esatto nella schermata Domains — usa quello se diverso da `76.76.21.21`.

### Opzione B — Se usi Cloudflare

| Tipo | Nome | Valore | Proxy |
|---|---|---|---|
| `A` | `@` | `76.76.21.21` | ☁️ **DNS only** (nuvola grigia) |
| `CNAME` | `www` | `cname.vercel-dns.com` | ☁️ **DNS only** |

⚠️ Con Cloudflare la modalità **Proxy (arancione) va disabilitata** — Vercel gestisce già CDN e SSL.

### ⏱ Propagazione DNS

I DNS possono impiegare da **5 minuti a 48 ore** per propagarsi globalmente.  
Puoi controllare lo stato su [dnschecker.org](https://dnschecker.org) cercando `capperificiocaro.com`.

Quando Vercel vede i DNS corretti, attiva automaticamente il **certificato SSL gratuito (HTTPS)** tramite Let's Encrypt.

---

## 8. Aggiornamenti post-deploy

### 8a. Aggiorna VITE_SHOPWARE_STOREFRONT_URL

In Shopware Admin → **Canali di vendita → Headless → Domini**, assicurati che il dominio sia `https://capperificiocaro.com`.

Su Vercel → **Settings → Environment Variables** aggiorna:
```
VITE_SHOPWARE_STOREFRONT_URL = https://capperificiocaro.com
```
Poi fai un **Redeploy** (Settings → Deployments → "Redeploy").

### 8b. Aggiorna CORS su Shopware

In Shopware Admin → **Sales Channel → Headless → Allowed Origins** aggiungi:
```
https://capperificiocaro.com
https://www.capperificiocaro.com
```

---

## 9. Passare a Stripe LIVE

Quando sei pronto per i pagamenti reali:

1. Vai su [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) (sezione **Live**, non Test)
2. Su Vercel → **Settings → Environment Variables** aggiorna:

| Variabile | Da | A |
|---|---|---|
| `VITE_STRIPE_PUBLIC_KEY` | `pk_test_...` | `pk_live_...` |
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |

3. Fai un **Redeploy**
4. Testa un pagamento reale con importo minimo (es. €0.50) per verificare

> ⚠️ **Non committare mai** le chiavi `sk_live_` su GitHub. Esistono solo come variabili d'ambiente su Vercel.

---

## 10. Workflow deploy futuro

Ogni volta che fai modifiche al codice:

```bash
# Lavori sul branch feature
git add -A
git commit -m "feat: descrizione modifica"
git push origin feature/shopware-integration

# Quando sei pronto per la produzione
git checkout main
git merge feature/shopware-integration
git push origin main
```

**Vercel deploya automaticamente** ogni push su `main` → in pochi secondi il sito è aggiornato.

### Preview deployments

Ogni push su un branch diverso da `main` crea automaticamente un **URL di preview** (es. `https://capperificio-ecommerce-git-feature-shopware.vercel.app`) — utile per testare prima di mandare in produzione.

---

## Checklist finale

- [ ] Branch `feature/shopware-integration` mergiato su `main`
- [ ] Root Directory impostata a `sunrise-coffee` su Vercel
- [ ] Tutte le variabili d'ambiente inserite
- [ ] Build completato senza errori
- [ ] DNS configurati sul registrar
- [ ] SSL attivo (HTTPS verde sul browser)
- [ ] `VITE_SHOPWARE_STOREFRONT_URL` aggiornato a `capperificiocaro.com`
- [ ] CORS aggiornato su Shopware
- [ ] Chiavi Stripe LIVE inserite quando pronto

---

*Generato il 26/05/2026 — progetto Capperificio Caro*
