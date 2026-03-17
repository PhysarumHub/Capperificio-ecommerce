# Capperificio E-commerce

Frontend React/Vite per il sito e-commerce del Capperificio, con integrazione headless Shopware 6.

## Requisiti

- **Node.js** >= 18
- **npm** >= 9
- (Opzionale) **Shopware 6** instance con Store API abilitata

## Setup locale

```bash
# 1. Clona il repository
git clone https://github.com/PhysarumHub/Capperificio-ecommerce.git
cd Capperificio-ecommerce/sunrise-coffee

# 2. Installa le dipendenze
npm install

# 3. Configura le variabili d'ambiente
cp .env.example .env
# Modifica .env con i tuoi dati Shopware (vedi sezione sotto)

# 4. Avvia il server di sviluppo
npm run dev
```

Il sito sarà disponibile su **http://localhost:5173**

## Variabili d'ambiente

Crea un file `.env` nella cartella `sunrise-coffee/` con:

```env
VITE_SHOPWARE_API_URL=https://your-shop.com/store-api
VITE_SHOPWARE_ACCESS_KEY=SWSC...your-access-key
```

### Senza Shopware

Se non hai un'istanza Shopware configurata, il sito funziona comunque con **dati di fallback hardcoded**. Puoi semplicemente avviare `npm run dev` senza configurare il `.env`.

### Con Shopware

Per collegare un'istanza Shopware 6:

1. Vai nel pannello admin Shopware > **Settings > System > Integrations**
2. Crea una nuova integrazione e copia l'**Access Key** (inizia con `SWSC`)
3. L'URL API è il dominio del tuo shop + `/store-api`
4. Inserisci entrambi nel file `.env`

## Comandi disponibili

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Avvia il server di sviluppo con hot-reload |
| `npm run build` | Build di produzione nella cartella `dist/` |
| `npm run preview` | Anteprima della build di produzione |

## Struttura del progetto

```
sunrise-coffee/
├── public/images/          # Immagini statiche
├── src/
│   ├── components/         # Componenti React riutilizzabili
│   │   ├── AboutSection/
│   │   ├── BlogGrid/
│   │   ├── CategoryBanner/
│   │   ├── Hero/
│   │   ├── Layout/         # Header, Footer, Newsletter, ShippingBar
│   │   ├── ProductCard/
│   │   ├── ProductDetail/
│   │   └── ProductSlider/
│   ├── context/            # React Context (ShopwareContext)
│   ├── hooks/              # Custom hooks (useCart, useCustomer, useProducts)
│   ├── lib/
│   │   ├── api/            # Chiamate API Shopware (cart, categories, checkout, customer, products)
│   │   ├── utils/          # Utility (image, price formatting)
│   │   └── shopware-client.js  # Client HTTP per Shopware Store API
│   ├── pages/              # Pagine (Home, Collection, Product, Cart, Checkout, Account)
│   ├── styles/global.css   # Stili globali
│   ├── App.jsx             # Router e layout principale
│   └── main.jsx            # Entry point
├── .env.example            # Template variabili d'ambiente
├── package.json
└── vite.config.js          # Configurazione Vite con proxy per Shopware
```

## Proxy API (sviluppo)

In sviluppo, Vite è configurato per fare proxy delle chiamate a Shopware:

- `/store-api/*` → Shopware Store API
- `/media/*` → Media files Shopware
- `/thumbnail/*` → Thumbnail Shopware

Questo evita problemi CORS durante lo sviluppo locale.

## Branch

- `main` — Versione base del sito
- `feature/shopware-integration` — Integrazione completa con Shopware 6 headless

## Stack tecnologico

- **React 19** — UI framework
- **Vite 7** — Build tool e dev server
- **React Router 7** — Routing client-side
- **@shopware/api-client** — Client ufficiale Shopware
- **CSS Modules** — Stili scoped per componente
