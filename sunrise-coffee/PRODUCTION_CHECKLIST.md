# Production Deployment Checklist

Analisi di production-readiness per deployment su server Linux privato.

---

## Stato generale: ⚠️ NON PRONTO

| Categoria | Stato | Critici | Importanti | Minori |
|---|---|---|---|---|
| Build System | ✅ Pronto | 0 | 0 | 0 |
| Secrets Management | ❌ Non pronto | 2 | 0 | 0 |
| Server Configuration | ❌ Non pronto | 1 | 3 | 2 |
| Environment Variables | ⚠️ Parziale | 0 | 1 | 1 |
| HTTPS / Security | ❌ Non pronto | 0 | 3 | 2 |
| Error Handling | ⚠️ Parziale | 0 | 1 | 0 |
| Process Management | ❌ Non pronto | 0 | 0 | 1 |

---

## 🔴 Problemi Critici

### 1. Chiavi API esposte — ruotarle subito
Le chiavi Stripe usate in sviluppo sono state condivise. Prima del deploy:
- Vai su [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys) → **Roll key**
- Genera nuove chiavi **live** (non test) per produzione
- Non mettere mai `STRIPE_SECRET_KEY` in un file versionato

### 2. `server.js` fa bind solo su `127.0.0.1`
Su Linux il server Express non sarà raggiungibile dall'esterno.

**Fix in `server.js`:**
```js
// Da:
app.listen(PORT, () => console.log(...))

// A:
app.listen(PORT, '0.0.0.0', () => console.log(...))
```

### 3. Nessuna validazione delle variabili d'ambiente
Se una chiave manca, il server parte lo stesso e fallisce silenziosamente al primo pagamento.

**Fix in `server.js` (aggiungere all'avvio):**
```js
const required = ['STRIPE_SECRET_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Env var mancante: ${key}`);
}
```

### 4. `.env.example` incompleto
Mancano le variabili necessarie per il deploy.

**Contenuto corretto per `.env.example`:**
```
VITE_SHOPWARE_API_URL=https://your-shop.com/store-api
VITE_SHOPWARE_ACCESS_KEY=SWSC...
VITE_SHOPWARE_STOREFRONT_URL=your-storefront-domain.com
VITE_STRIPE_PUBLIC_KEY=pk_live_...
VITE_PAYPAL_CLIENT_ID=...
STRIPE_SECRET_KEY=sk_live_...   # Solo server — mai nel client
FRONTEND_URL=https://your-domain.com
PORT=3001
NODE_ENV=production
```

---

## 🟡 Problemi Importanti

### 5. Nessun HTTPS
Tutti i dati di pagamento viaggiano in chiaro. In produzione serve un reverse proxy.

**Soluzione consigliata: nginx + Let's Encrypt**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend (file statici da `npm run build`)
    location / {
        root /var/www/sunrise-coffee/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend pagamenti
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

### 6. CORS hardcoded su `localhost:5173`
Se `FRONTEND_URL` non è impostato nel server di produzione, le richieste dal dominio reale vengono bloccate.

**Assicurarsi che nel `.env` di produzione ci sia:**
```
FRONTEND_URL=https://your-domain.com
```

### 7. Nessun rate limiting sull'endpoint Stripe
`POST /api/stripe/create-payment-intent` è esposto ad abusi.

**Fix — installare e usare `express-rate-limit`:**
```bash
npm install express-rate-limit
```
```js
import rateLimit from 'express-rate-limit';

app.use('/api/stripe', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 20,                   // max 20 richieste per IP
  message: { error: 'Troppe richieste. Riprova tra poco.' },
}));
```

### 8. Nessun security header
Il server è vulnerabile ad attacchi comuni (XSS, clickjacking, ecc.).

**Fix — installare `helmet`:**
```bash
npm install helmet
```
```js
import helmet from 'helmet';
app.use(helmet());
```

### 9. Nessun process manager
Se `server.js` crasha su Linux, non si riavvia da solo.

**Opzione A — PM2:**
```bash
npm install -g pm2
pm2 start server.js --name "sunrise-payment-api"
pm2 startup   # genera il comando systemd
pm2 save
```

**Opzione B — systemd service (`/etc/systemd/system/sunrise-payment.service`):**
```ini
[Unit]
Description=Sunrise Coffee Payment API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/sunrise-coffee
EnvironmentFile=/etc/sunrise-coffee/.env.production
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```
```bash
systemctl enable sunrise-payment
systemctl start sunrise-payment
```

### 10. `image.js` controlla `localhost` hardcoded
In produzione le immagini Shopware arrivano dall'URL reale, non da localhost.

**Fix in `src/lib/utils/image.js`:**
```js
// Aggiungere l'hostname Shopware alla lista dei proxy
const shopwareHost = new URL(import.meta.env.VITE_SHOPWARE_API_URL || 'http://localhost').hostname;

function shouldProxy(url) {
  const u = new URL(url);
  return u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === shopwareHost;
}
```

---

## 🟢 Già OK

- ✅ `npm run build` produce un bundle ottimizzato pronto per il deploy
- ✅ `.env` è in `.gitignore` — le chiavi non sono versionate
- ✅ Il frontend usa solo variabili `VITE_*` — nessuna chiave segreta nel client
- ✅ React Router gestisce il routing client-side senza URL hardcoded
- ✅ I proxy Vite sono solo in sviluppo e non impattano il build

---

## 📋 Passi per il deploy

```
1. [ ] Ruotare tutte le chiavi API (Stripe, Shopware)
2. [ ] Generare chiavi live Stripe + PayPal per produzione
3. [ ] Creare /etc/sunrise-coffee/.env.production sul server (chmod 600)
4. [ ] Eseguire `npm run build` → copiare dist/ su /var/www/sunrise-coffee/dist/
5. [ ] Configurare nginx con SSL (Let's Encrypt: certbot --nginx)
6. [ ] Avviare server.js con PM2 o systemd
7. [ ] Fix: bind 0.0.0.0 in server.js
8. [ ] Fix: rate limiting + helmet in server.js
9. [ ] Fix: validazione env vars all'avvio
10. [ ] Testare checkout completo in produzione con carta Stripe test
```

---

*Generato il 2026-03-19*
