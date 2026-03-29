# Integrazione Strapi CMS per il Blog

## Architettura

```
[Browser]
   │
   ├── React Frontend (porta 3001)
   │       ├── Shopware Store API  → prodotti, ordini, utenti
   │       └── Strapi REST API     → articoli blog, media
   │
[Docker Compose]
   ├── capperificio-frontend   (React + nginx)
   ├── capperificio-shopware   (Shopware 6)
   ├── capperificio-strapi     (Strapi v5)  ← NUOVO
   └── capperificio-strapi-db  (PostgreSQL) ← NUOVO
```

---

## 1. Aggiungere Strapi al docker-compose.yml

Aggiungi questi due servizi al `docker-compose.yml` esistente, dentro `services:`:

```yaml
  # ── PostgreSQL per Strapi ────────────────────────────────
  strapi-db:
    image: postgres:16-alpine
    container_name: capperificio-strapi-db
    environment:
      POSTGRES_DB: strapi
      POSTGRES_USER: strapi
      POSTGRES_PASSWORD: ${STRAPI_DB_PASSWORD}
    volumes:
      - strapi_db_data:/var/lib/postgresql/data
    networks:
      - capperificio_net
    restart: unless-stopped

  # ── Strapi CMS ───────────────────────────────────────────
  strapi:
    image: node:20-alpine
    container_name: capperificio-strapi
    working_dir: /app
    command: sh -c "npm install && npm run build && npm start"
    ports:
      - "1337:1337"
    environment:
      NODE_ENV: production
      DATABASE_CLIENT: postgres
      DATABASE_HOST: strapi-db
      DATABASE_PORT: 5432
      DATABASE_NAME: strapi
      DATABASE_USERNAME: strapi
      DATABASE_PASSWORD: ${STRAPI_DB_PASSWORD}
      APP_KEYS: ${STRAPI_APP_KEYS}
      API_TOKEN_SALT: ${STRAPI_API_TOKEN_SALT}
      ADMIN_JWT_SECRET: ${STRAPI_ADMIN_JWT_SECRET}
      JWT_SECRET: ${STRAPI_JWT_SECRET}
      URL: http://${SERVER_DOMAIN}:1337
    volumes:
      - ./strapi:/app
      - strapi_uploads:/app/public/uploads
    depends_on:
      - strapi-db
    networks:
      - capperificio_net
    restart: unless-stopped
```

Aggiungi i volumi nella sezione `volumes:`:

```yaml
  strapi_db_data:
    driver: local
  strapi_uploads:
    driver: local
```

---

## 2. Variabili d'ambiente (.env)

Aggiungi al `.env`:

```env
# Strapi
STRAPI_DB_PASSWORD=una_password_sicura
STRAPI_APP_KEYS=chiave1,chiave2,chiave3,chiave4
STRAPI_API_TOKEN_SALT=un_salt_random_32chars
STRAPI_ADMIN_JWT_SECRET=un_secret_random_32chars
STRAPI_JWT_SECRET=un_secret_random_32chars
SERVER_DOMAIN=tuo-dominio.com   # o IP del server

# Lato frontend (embedded nel build Vite)
VITE_STRAPI_URL=http://tuo-dominio.com:1337
VITE_STRAPI_TOKEN=il_token_api_generato_da_strapi
```

Genera valori sicuri con:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 3. Creare il progetto Strapi

Sul server (o in locale, poi copi la cartella):

```bash
npx create-strapi-app@latest strapi \
  --dbclient=postgres \
  --dbhost=localhost \
  --dbname=strapi \
  --dbusername=strapi \
  --dbpassword=la_tua_password \
  --no-run
```

Questo crea la cartella `strapi/` accanto a `sunrise-coffee/`.
**Nota:** committa la cartella `strapi/` escludendo `node_modules/` e `.env`.

---

## 4. Modellare il contenuto in Strapi

Accedi all'admin Strapi (`http://server:1337/admin`) e crea il **Content Type** `article`:

| Campo | Tipo | Note |
|-------|------|-------|
| `title` | Short Text | required |
| `slug` | UID (da title) | required, unique |
| `excerpt` | Text | breve descrizione |
| `content` | Rich Text (Blocks) | corpo articolo |
| `cover` | Media (single) | immagine copertina |
| `publishedAt` | gestito da Strapi | bozza/pubblicato |
| `category` | Short Text | es. "Ricette", "News" |

### Configurare i permessi

In **Settings → API Tokens** crea un token `Read-only` e copialo nel `.env` come `VITE_STRAPI_TOKEN`.

In **Settings → Users & Permissions → Public**, abilita `find` e `findOne` su `Article` se preferisci senza token.

---

## 5. Integrare il frontend React

### Hook `useBlogPosts`

Crea `src/hooks/useBlogPosts.js`:

```js
import { useState, useEffect } from 'react';

const STRAPI_URL  = import.meta.env.VITE_STRAPI_URL;
const STRAPI_TOKEN = import.meta.env.VITE_STRAPI_TOKEN;

export function useBlogPosts({ limit = 6, page = 1 } = {}) {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const url = `${STRAPI_URL}/api/articles?populate=cover&pagination[pageSize]=${limit}&pagination[page]=${page}&sort=publishedAt:desc`;

    fetch(url, {
      headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
    })
      .then(r => r.json())
      .then(({ data }) => {
        setPosts(
          (data || []).map(item => ({
            id:      item.id,
            title:   item.title,
            slug:    item.slug,
            excerpt: item.excerpt,
            image:   item.cover?.formats?.medium?.url
                       ? `${STRAPI_URL}${item.cover.formats.medium.url}`
                       : null,
            date:    item.publishedAt,
          }))
        );
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [limit, page]);

  return { posts, loading, error };
}
```

### Aggiornare BlogGrid

In `BlogGrid.jsx`, sostituisci i dati hardcoded con `useBlogPosts`:

```jsx
import { useBlogPosts } from '../../hooks/useBlogPosts';

export default function BlogGrid() {
  const { posts, loading } = useBlogPosts({ limit: 3 });

  if (loading) return <div>Caricamento...</div>;

  return (
    <div className={styles.grid}>
      {posts.map(post => (
        <article key={post.id} className={styles.card}>
          <div className={styles.img}>
            {post.image
              ? <img src={post.image} alt={post.title} className={styles.postImg} />
              : <div className={styles.imgPlaceholder} />}
          </div>
          <div className={styles.body}>
            <h3 className={styles.title}>{post.title}</h3>
            <p className={styles.excerpt}>{post.excerpt}</p>
            <a href={`/blog/${post.slug}`} className={styles.link}>Leggi →</a>
          </div>
        </article>
      ))}
    </div>
  );
}
```

---

## 6. Workflow di deploy

```bash
# Prima volta — costruisce e avvia tutto
docker compose up -d --build

# Aggiornamenti Strapi (dopo modifiche ai content type)
docker compose restart strapi

# Aggiornamenti frontend (dopo modifiche al codice React)
docker compose up -d --build frontend
```

L'admin Strapi è raggiungibile su `http://server:1337/admin`.
Per esporlo pubblicamente in HTTPS metti un **reverse proxy Nginx/Caddy** davanti.

---

## 7. Best practice

- **Non esporre la porta 1337 pubblicamente** senza HTTPS — usa un reverse proxy
- **Backup automatici**: il volume `strapi_db_data` contiene tutto; fai `pg_dump` periodico
- **Media su oggetto esterno** (es. Cloudinary, S3) in produzione, per non saturare il disco del server — configurabile nelle impostazioni Strapi `config/plugins.js`
- **Bozze**: Strapi gestisce nativo bozza/pubblicato — sfruttalo per scrivere articoli in anticipo
- **Webhook**: Strapi può chiamare il frontend alla pubblicazione di un articolo (utile per ISR/cache invalidation)
