# Guida installazione su Linux — Capperificio E-commerce

Questo progetto usa **Docker Compose**: non devi installare Shopware manualmente.
Docker scarica e avvia tutto in automatico.

---

## 1. Installa Docker su Linux

```bash
# Installa Docker
curl -fsSL https://get.docker.com | sh

# Aggiungi il tuo utente al gruppo docker (per non usare sudo ogni volta)
sudo usermod -aG docker $USER
newgrp docker

# Installa il plugin Docker Compose
sudo apt-get install docker-compose-plugin   # Debian / Ubuntu
# oppure
sudo dnf install docker-compose-plugin       # Fedora / RHEL
```

Verifica che funzioni:
```bash
docker --version
docker compose version
```

---

## 2. Copia il progetto sul server Linux

Puoi copiare la cartella `sunrise-coffee` tramite `scp`, USB, o clonare il repository git.
Assicurati che nella cartella ci sia il file `.env` (non viene incluso nei commit git per sicurezza).

---

## 3. Configura il file `.env`

Nella root del progetto c'è già un file `.env` quasi completo.
Aprilo e controlla questi valori:

```env
# URL dell'API Shopware — non cambiare in locale
VITE_SHOPWARE_API_URL=http://localhost:5173/store-api

# Chiave di accesso API del canale headless (la ottieni dopo il primo avvio, vedi Step 5)
VITE_SHOPWARE_ACCESS_KEY=SWSC...tuachiave

# URL del canale storefront configurato in Shopware
VITE_SHOPWARE_STOREFRONT_URL=default.headless0

# Stripe — chiavi di TEST già presenti, sostituisci con quelle live in produzione
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Google Tag Manager — lascia vuoto per non caricare GTM affatto
VITE_GTM_ID=GTM-XXXXXXX
```

> L'elenco completo e commentato delle variabili è in [.env.example](.env.example).

---

## 4. Avvia lo stack

```bash
cd sunrise-coffee
docker compose up -d --build
```

**La prima volta ci vogliono 10-20 minuti** perché:
- scarica l'immagine Shopware (`dockware/dev`, circa 2-3 GB)
- installa e configura Shopware automaticamente

Controlla che tutto stia partendo:
```bash
docker compose logs -f shopware
```

Aspetta finché nei log vedi qualcosa tipo `[OK] Shopware is ready`.

---

## 5. Configura Shopware (una sola volta)

Apri il pannello admin di Shopware:

**http://localhost:8080/admin**
- utente: `admin`
- password: `shopware`

### Ottieni la chiave API del canale headless

1. Vai su **Impostazioni → Canali di vendita**
2. Clicca sul canale chiamato **Headless** (o creane uno nuovo di tipo Headless)
3. Copia il valore **Chiave di accesso API** (inizia con `SWSC...`)
4. Incollala nel file `.env`:
   ```
   VITE_SHOPWARE_ACCESS_KEY=SWSC...tuachiave
   ```
5. Ricostruisci il frontend per applicare la nuova chiave:
   ```bash
   docker compose up -d --build frontend
   ```

---

## 6. Apri il sito

| Cosa | URL | Credenziali |
|---|---|---|
| **Frontend (il sito)** | http://localhost:3000 | — |
| **Admin Shopware** | http://localhost:8080/admin | admin / shopware |
| **Database (Adminer)** | http://localhost:8888 | — |
| **Email di test (Mailcatcher)** | http://localhost:9999 | — |

---

## 7. Aggiungi prodotti

Il frontend mostra i prodotti presi da Shopware in tempo reale.
Se il sito è vuoto, devi creare i prodotti nel pannello admin:

1. **http://localhost:8080/admin** → **Catalogo → Prodotti → Aggiungi prodotto**
2. Compila nome, prezzo, immagine, stock
3. Assegna il prodotto al canale di vendita **Headless**
4. Salva — appare subito sul frontend

---

## Comandi utili

```bash
# Avvia tutto in background
docker compose up -d --build

# Vedi i log in tempo reale
docker compose logs -f
docker compose logs -f shopware    # solo Shopware
docker compose logs -f frontend    # solo il frontend React

# Ferma tutto (i dati restano salvati)
docker compose down

# Ferma tutto e cancella tutti i dati (reset completo)
docker compose down -v

# Ricostruisci solo il frontend (dopo modifiche al codice o al .env)
docker compose up -d --build frontend
```

---

## Checklist prima di andare in produzione

La checklist completa di go-live è in [DEPLOY.md](DEPLOY.md). In sintesi:

- [ ] Sostituisci le chiavi Stripe test (`pk_test_...`) con quelle live
- [ ] Cambia `SHOP_DOMAIN` con il tuo dominio
- [ ] Valorizza `SITE_URL` con l'host canonico (`https://www.capperificiocaro.com`)
- [ ] Cambia la password admin di Shopware (non lasciare `shopware`)
- [ ] Imposta `APP_ENV=prod` per il container Shopware
- [ ] Configura il webhook Stripe e `STRIPE_WEBHOOK_SECRET`
- [ ] Verifica che HTTPS sia attivo (Traefik + Let's Encrypt)

---

## Problemi comuni

**Il sito è vuoto / non carica prodotti**
→ Controlla che `VITE_SHOPWARE_ACCESS_KEY` nel `.env` sia corretto e che i prodotti siano assegnati al canale Headless.

**Shopware non parte**
→ Aspetta qualche minuto in più e controlla i log: `docker compose logs -f shopware`

**Porta già in uso (es. 8080 o 3000)**
→ Cambia le porte nel `docker-compose.yml`, es. `"8081:80"` al posto di `"8080:80"`

**Errore permessi Docker**
→ Esegui `sudo usermod -aG docker $USER` e poi `newgrp docker` o riavvia il terminale
