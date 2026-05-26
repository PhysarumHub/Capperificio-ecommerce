# 🔐 Security Fixes — Capperificio Caro

> Registro dei problemi di sicurezza identificati e risolti prima del deploy in produzione.  
> Ultimo aggiornamento: 26/05/2026

---

## ✅ Fix già applicati (codice aggiornato su GitHub)

---

### Fix 1 — Credenziali Shopware hardcoded negli script Python

**Problema:** I file `scripts/audit-shopware.py`, `scripts/audit2-shopware.py`,
`scripts/fix-shopware-production.py` e `scripts/update-prices-soldout.py` contenevano
in chiaro:
- Chiave Shopware `SWSCBKVQOTHEMMNHDWLJVJLKNQ`
- IP del server `http://157.90.241.97:8090`
- Password admin `shopware` (quella di default)

Questi valori erano visibili a chiunque avesse accesso al repository GitHub.

**Fix applicato:**
Tutti e 4 gli script sono stati refactored per leggere le credenziali da variabili
d'ambiente, caricate automaticamente da `scripts/.env` (file escluso da git):

```python
import os, pathlib

def _load_env():
    env_path = pathlib.Path(__file__).parent / '.env'
    if env_path.exists():
        for line in env_path.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, _, v = line.partition('=')
                os.environ.setdefault(k.strip(), v.strip().strip('"\''))

_load_env()

BASE       = os.environ.get('SHOPWARE_URL', '')
ADMIN_PASS = os.environ.get('SHOPWARE_ADMIN_PASS', '')
ACCESS_KEY = os.environ.get('VITE_SHOPWARE_ACCESS_KEY', '')

if not BASE or not ADMIN_PASS or not ACCESS_KEY:
    sys.exit("❌  Crea scripts/.env (vedi scripts/.env.example)")
```

**File aggiunto:** `scripts/.env.example` — template da copiare e compilare localmente.

**⚠️ Azione manuale richiesta:**
1. Crea `scripts/.env` a partire da `scripts/.env.example`
2. **Rigenera la chiave Shopware** (quella vecchia è compromessa):
   Shopware Admin → Sales Channels → Headless → API Access → 🔄 Regenerate
3. **Cambia la password admin** da `shopware` a una password sicura:
   Shopware Admin → My Profile → Change Password

---

### Fix 2 — Storia git conteneva le chiavi in chiaro

**Problema:** La chiave Shopware e l'IP del server erano presenti in commit precedenti
della storia git, visibili tramite `git log -p` anche dopo aver corretto i file.

**Fix applicato:**
Riscrittura completa della storia git con `git filter-repo --replace-text`:
- `SWSCBKVQOTHEMMNHDWLJVJLKNQ` → `VITE_SHOPWARE_ACCESS_KEY_REDACTED`
- `157.90.241.97` → `SHOPWARE_HOST_REDACTED`
- Password admin → `SHOPWARE_ADMIN_PASS`

Tutti i 213 commit sono stati riscritti. Force push su tutti i branch.

**⚠️ Azione manuale richiesta:**
Chiunque abbia clonato il repo in precedenza deve fare `git fetch --all` e resettare
il branch locale, oppure ri-clonare da zero. I vecchi commit locali non sono più validi.

---

### Fix 3 — `.gitignore` non escludeva file sensibili

**Problema:** Il file `cHIAVE STRIPE.txt` (con chiavi Stripe) era nella cartella
del progetto e poteva finire per errore in un commit futuro.

**Fix applicato:** Aggiornato `.gitignore` con le seguenti regole:

```gitignore
# Credenziali script Python
scripts/.env

# File con chiavi/token (esclusione preventiva per nome)
*chiave*
*CHIAVE*
*secret*
*SECRET*
*.key
*.pem
```

---

### Fix 4 — `server.js` faceva bind solo su `127.0.0.1`

**Problema:** Il server Express locale usava `app.listen(PORT, callback)` senza
specificare l'host. Su sistemi Linux (server di produzione), Node.js di default
fa bind su `127.0.0.1`, rendendo il server **irraggiungibile dall'esterno** anche
con la porta aperta nel firewall.

**Fix applicato** in `server.js`:

```js
// Prima (non funzionava su Linux remoto)
app.listen(PORT, () => console.log(...))

// Dopo ✅
app.listen(PORT, '0.0.0.0', () => console.log(...))
```

> Nota: su Vercel questo file non viene usato — lì gira la serverless function
> `api/stripe/create-payment-intent.js`. Il fix serve solo per il dev locale e
> per eventuali deploy self-hosted.

---

### Fix 5 — Nessuna validazione delle variabili d'ambiente

**Problema:** Se `STRIPE_SECRET_KEY` non era impostata, `server.js` partiva lo
stesso con `new Stripe('')` e falliva silenziosamente al primo pagamento, senza
nessun messaggio di errore chiaro.

**Fix applicato** in `server.js` (all'avvio, prima di qualsiasi altra cosa):

```js
const REQUIRED_ENV = ['STRIPE_SECRET_KEY'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌  Variabile d'ambiente mancante: ${key}`);
    process.exit(1);  // il server non parte — errore visibile nei log
  }
}
```

Ora il server si blocca immediatamente con un messaggio chiaro se manca
una variabile obbligatoria, invece di partire rotto.

---

## ⚠️ Azioni manuali ancora da fare

Queste cose **non possono essere risolte con codice** — richiedono accesso ai pannelli:

| # | Cosa fare | Dove | Priorità |
|---|---|---|---|
| 1 | **Cambia password admin Shopware** da `shopware` | Shopware Admin → My Profile | 🔴 URGENTE |
| 2 | **Rigenera Access Key Shopware** (quella vecchia è su GitHub) | Sales Channels → Headless → API Access → 🔄 | 🔴 URGENTE |
| 3 | **Crea `scripts/.env`** con le nuove credenziali | Copia da `scripts/.env.example` | 🔴 Prima di usare gli script |
| 4 | **Aggiorna `.env.local`** con la nuova access key | File locale, non committare | 🟡 Prima di sviluppare |
| 5 | **Aggiorna Vercel env vars** con la nuova access key | Vercel → Settings → Environment Variables | 🟡 Prima del deploy |
| 6 | **Ruota chiavi Stripe** se usate con dati reali | dashboard.stripe.com → API Keys → Roll | 🟡 Consigliato |
| 7 | Considera firewall sulla porta 8090 di Shopware | Hetzner/server provider → Firewall | 🟢 Best practice |

---

## 📁 File modificati in questi fix

| File | Modifica |
|---|---|
| `scripts/audit-shopware.py` | Credenziali → env vars |
| `scripts/audit2-shopware.py` | Credenziali → env vars |
| `scripts/fix-shopware-production.py` | Credenziali → env vars |
| `scripts/update-prices-soldout.py` | Credenziali → env vars |
| `scripts/.env.example` | Nuovo — template credenziali |
| `.gitignore` | Aggiunto `scripts/.env`, `*chiave*`, `*secret*`, `*.key` |
| `server.js` | `0.0.0.0` bind + validazione env vars obbligatorie |

---

*Generato il 26/05/2026 — Capperificio Caro*
