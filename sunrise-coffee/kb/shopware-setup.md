# Shopware — Setup e Configurazione Admin

## Docker — avvio stack

```bash
docker compose up -d --build     # primo avvio (build immagini)
docker compose up -d             # avvii successivi
docker compose down              # stop
docker compose logs shopware -f  # log in tempo reale
```

**Admin Shopware:** http://localhost:8090/admin → user: `admin` / pass: `shopware`
**Adminer (DB):** http://localhost:8891
**Mailcatcher:** http://localhost:9998

## Script di setup (`scripts/`)

> Tutti gli script usano l'Admin API di Shopware (`http://localhost:8090/api`) con credenziali admin.
> Si eseguono una volta sola dopo aver avviato lo stack.

| Script | Cosa fa |
|--------|---------|
| `setup-capperificio.py` | Setup iniziale: categorie, prodotti, media brand |
| `setup-b2b.py` | Crea gruppo cliente B2B, categoria B2B nascosta, prezzi speciali |
| `setup-custom-fields.py` | Aggiunge custom fields ai prodotti (es. origine, intensità) |
| `setup-shop-filters.py` | Crea le property groups per i filtri (formato, stagione, ...) |
| `create-shopware-properties.js` | Alternativa JS per le proprietà prodotto |
| `create-brew-custom-fields.js` | Custom fields specifici per metodo di preparazione |
| `setup-mock-data.py` | Dati di test per sviluppo |
| `setup_shopware_shipping.py` | Metodi spedizione (corriere, ritiro, ...) |
| `fix-sales-channels-countries.py` | Abilita paesi nel sales channel (fix 403 su checkout) |
| `setup_it.py` | Localizzazione italiana (lingua, valuta, fuso orario) |
| `seed_strapi_articles.py` | Popola Strapi con articoli blog di esempio |

**Esecuzione tipica (primo setup):**
```bash
python scripts/setup-capperificio.py
python scripts/setup_it.py
python scripts/setup-b2b.py
python scripts/setup-custom-fields.py
python scripts/setup-shop-filters.py
python scripts/fix-sales-channels-countries.py
python scripts/setup_shopware_shipping.py
```

## Backup e Restore

```bash
npm run backup    # → scripts/backup-shopware.sh
npm run restore   # → scripts/restore-shopware.sh
# Backups salvati in: backups/
```

## Shopware Admin API — pattern autenticazione

```python
# Python — ottieni bearer token
import requests

resp = requests.post('http://localhost:8090/api/oauth/token', json={
    'grant_type': 'password',
    'client_id': 'administration',
    'username': 'admin',
    'password': 'SHOPWARE_ADMIN_PASS',
    'scopes': 'write'
})
token = resp.json()['access_token']
headers = { 'Authorization': f'Bearer {token}', 'Content-Type': 'application/json' }
```

## Shopware — configurazioni chiave in Admin UI

### Sales Channel
- Admin > Sales Channels > Headless
- Copia l'Access Key (SWSC...) → `VITE_SHOPWARE_ACCESS_KEY`
- Abilita: Countries, Payment Methods, Shipping Methods

### SEO
- Admin > Settings > System > SEO → abilita URL SEO per i prodotti
- Senza SEO URL: i prodotti vengono trovati per UUID

### Payment Methods
- Admin > Settings > Shop > Payment Methods
- Per checkout: abilitare almeno un metodo nel Sales Channel

### Custom Fields
- Admin > Settings > Custom Fields
- Grup: `capperificio_product` → campi su `product`

## B2B Setup

1. Esegui `python scripts/setup-b2b.py` → ottieni `VITE_B2B_CATEGORY_ID` dall'output
2. Aggiungi nel `.env`: `VITE_B2B_CATEGORY_ID=<uuid>`
3. Il gruppo si chiama `B2B` (sovrascrivibile con `VITE_B2B_GROUP_NAME`)
4. Frontend controlla `customer.group.name === 'B2B'` → mostra prezzi/contenuti B2B

## Sales Channel — Access Key

```
Admin > Settings > System > Integrations > Add Integration
→ Copia Access Key (SWSC...) → .env VITE_SHOPWARE_ACCESS_KEY
```

oppure via Sales Channel diretto:
```
Admin > Sales Channels > [tuo canale] > API Access
```
