# Script (`scripts/`)

Script one-off/amministrativi, eseguiti a mano quando serve — non fanno parte
del runtime dell'app. Due famiglie: Python (Shopware Admin API + Strapi) e
Node (Google Tag Manager). Nessuno viene eseguito automaticamente in deploy,
tranne backup/restore richiamabili via `npm run backup` / `npm run restore`.

## Configurazione condivisa (Python)

`_config.py` centralizza host/credenziali per tutti gli script Shopware:
legge da `scripts/.env` (mai committato — vedi `scripts/.env.example`),
sovrascrivibile da CLI (`--base`/`--user`/`--pass`). Deliberatamente **senza
default per la password**: in passato uno script distratto poteva tentare
l'autenticazione con la password di default di Shopware
(`--pass shopware`) se non configurato — ora si ferma se manca la config.

## Audit / diagnosi

- **`audit-shopware.py`**, **`audit2-shopware.py`** — audit read-only del
  backend Shopware via Admin API (stato configurazione, dati presenti).

## Setup iniziale / configurazione shop

- **`setup-capperificio.py`** — setup completo: lingua IT, paesi Europa,
  spedizioni, prodotti con varianti.
- **`setup_shopware_shipping.py`** — metodo di spedizione "Standard Europa",
  prezzi per zona (Italia / Europa Ovest / Europa Est).
- **`setup-custom-fields.py`** — custom field set usati dalla product page
  frontend (`capperificio_prodotto`: calibro + bullet; `capperificio_ricette`:
  metodi di preparazione).
- **`setup-shop-filters.py`** — property group filtrabili nello Shop (Tipo,
  Formato, Conservazione), con assegnazione automatica ai prodotti in base al
  nome.
- **`setup-b2b.py`** — area B2B: customer group prezzi netti, categoria
  ingrosso, formati industriali (500g–5kg), regola sconto 20%.
- **`setup_it.py`** — variante minimale di setup via OAuth password grant
  diretto (non passa da `_config.shopware_config()` per il token, solo per
  base URL).
- **`setup-mock-data.py`** — popola custom field prodotto con dati mock
  realistici (per demo/staging).

## Fix mirati

- **`fix-sales-channel-countries.py`** / **`fix-sales-channels-countries.py`**
  — associano tutti i paesi attivi (IT + EU) al Sales Channel: senza questo
  la Store API `/country` mostra solo UK/DE (default Shopware) e il checkout
  perde l'Italia dalla tendina paese. (Due varianti quasi omonime: verificare
  quale sia quella attualmente in uso prima di modificarne una.)
- **`fix-shopware-production.py`** — fix multiplo per produzione: IVA 22%,
  metodo pagamento, spedizione prezzata sul canale Headless, rimozione
  regole duplicate, prezzi mancanti Italia/Europa Est, dominio frontend in
  CORS. Nota: menziona PayPal — verificare se ancora rilevante dato che
  l'integrazione PayPal è stata rimossa lato frontend/Stripe (vedi
  [frontend.md](./frontend.md)).
- **`update-prices-soldout.py`** — aggiorna prezzi per categoria prodotto e
  marca sold-out (stock 0, `isCloseout=True`) su prodotti/varianti.

## Seed catalogo prodotti

- **`seed-capperificio.py`** — upsert prodotti da `src/data/capperificioCatalog.json`
  (stessa fonte dati del frontend): nome, descrizione, proprietà, custom
  field, varianti Foglie/Ho.Re.Ca.
- **`seed-caro-completo.py`** — seed completo linea Caro (5 prodotti,
  struttura padre+varianti): Capperi al Sale, Capperi all'Aceto, Cucunci
  all'Aceto, Polvere di Cappero.
- **`seed-calibri.py`** — aggiorna CAP-001 con varianti per calibro
  (Lilliput, Occhio di pernice, Lacrimella, Capperone).
- **`create-promo-100.py`** — crea un codice sconto 100% (default `TEST100`,
  un solo utilizzo globale) su scope cart+delivery, per testare il percorso
  "ordine gratuito" (checkout senza Stripe, vedi [backend-api.md](./backend-api.md)).

## Strapi

- **`seed_strapi_articles.py`** — crea articoli di test sul blog.

## Google Tag Manager (Node)

- **`gtm-auth.js`** — login OAuth locale (apre browser), richiede
  `.gtm-auth/client_secret.json` (OAuth Client "Desktop app").
- **`gtm-auth-exchange.js`** — scambia un authorization code con
  access/refresh token, salva in `.gtm-auth/token.json`.
- **`gtm-setup.js`** — provisioning idempotente del container GTM
  (`GTM-P96KXJR5`): variabili built-in/custom, trigger, tag GA4 + Meta Pixel.
  Non pubblica nulla in automatico — lascia le modifiche in workspace per
  revisione manuale.

## Custom fields / properties (Node, Shopware)

- **`create-brew-custom-fields.js`**, **`create-shopware-properties.js`** —
  equivalenti Node di alcuni setup Python sopra (custom field e property
  group) — verificare quale versione (Python o Node) sia quella
  effettivamente mantenuta prima di usarle.

## Backup/restore

- **`backup-shopware.sh`** / **`restore-shopware.sh`** — richiamati da
  `npm run backup` / `npm run restore` (vedi `package.json`). Output in
  `backups/` (non versionato, vedi `.gitignore`).
