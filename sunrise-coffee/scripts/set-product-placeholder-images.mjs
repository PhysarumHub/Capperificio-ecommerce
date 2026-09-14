/**
 * One-shot: carica l'immagine placeholder (usata come mock nelle card prodotto
 * del frontend, public/images/PRODUCTSTILL.jpg) nella media library di Shopware
 * e la assegna come cover ai prodotti di QUESTO shop (Capperificio Caro).
 *
 * ⚠ L'istanza Shopware è condivisa con altri progetti sullo stesso dockware
 * (es. un catalogo frutta/verdura di un altro sito). L'Admin API `/search/product`
 * NON è filtrata per sales channel: interrogarla senza filtro restituisce TUTTI
 * i prodotti dell'istanza, di qualunque shop. Per questo qui si opera solo sugli
 * ID espliciti sotto — presi dalla Store API con l'access key di questo sales
 * channel — invece che su "tutti i prodotti trovati". Non rimuovere questo filtro.
 *
 * Uso: node scripts/set-product-placeholder-images.mjs
 * Richiede SHOPWARE_ADMIN_CLIENT_ID/SECRET (o USERNAME/PASSWORD) in .env.
 */
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const BASE = 'http://127.0.0.1:8090/api';
const IMAGE_PATH = join(__dirname, '..', 'public', 'images', 'PRODUCTSTILL.jpg');
const MEDIA_NAME = 'placeholder-prodotto-capperificio-caro';

async function getToken() {
  const clientId = process.env.SHOPWARE_ADMIN_CLIENT_ID;
  const clientSecret = process.env.SHOPWARE_ADMIN_CLIENT_SECRET;
  const user = process.env.SHOPWARE_ADMIN_USERNAME;
  const pass = process.env.SHOPWARE_ADMIN_PASSWORD;
  const body = clientId && clientSecret
    ? { grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }
    : { grant_type: 'password', client_id: 'administration', username: user, password: pass };
  const r = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function api(token, method, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status}: ${JSON.stringify(data).slice(0, 500)}`);
  return data;
}

async function findExistingMedia(token) {
  const res = await api(token, 'POST', '/search/media', {
    limit: 1,
    filter: [{ type: 'equals', field: 'fileName', value: MEDIA_NAME }],
  });
  return res?.data?.[0]?.id || null;
}

async function uploadMedia(token) {
  const existing = await findExistingMedia(token);
  if (existing) {
    console.log('Media già presente, riuso id:', existing);
    return existing;
  }

  const mediaId = randomUUID().replace(/-/g, '');
  await api(token, 'POST', '/media', { id: mediaId });

  const fileBuffer = readFileSync(IMAGE_PATH);
  const r = await fetch(
    `${BASE}/_action/media/${mediaId}/upload?extension=jpg&fileName=${encodeURIComponent(MEDIA_NAME)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
        Authorization: `Bearer ${token}`,
      },
      body: fileBuffer,
    }
  );
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Upload fallito: ${r.status} ${errText.slice(0, 500)}`);
  }
  console.log('Media caricato, id:', mediaId);
  return mediaId;
}

async function setProductCover(token, productId, mediaId) {
  const existingAssoc = await api(token, 'POST', '/search/product-media', {
    limit: 1,
    filter: [
      { type: 'equals', field: 'productId', value: productId },
      { type: 'equals', field: 'mediaId', value: mediaId },
    ],
  });

  let productMediaId = existingAssoc?.data?.[0]?.id;
  if (!productMediaId) {
    productMediaId = randomUUID().replace(/-/g, '');
    await api(token, 'POST', '/product-media', {
      id: productMediaId,
      productId,
      mediaId,
    });
  }

  await api(token, 'PATCH', `/product/${productId}`, {
    coverId: productMediaId,
  });
}

// Catalogo Capperificio Caro — 5 prodotti padre + 10 varianti figlie (15 totali).
// Presi dalla Store API con VITE_SHOPWARE_ACCESS_KEY (sales channel di questo
// shop), NON dall'Admin API /search/product che vede l'istanza intera.
const CAPPERIFICIO_PRODUCT_IDS = [
  'f2eb033836bb4b7b80a394af74b92400', '2d823c6efde349fea871061955e354e3',
  '323d7a8478814316a9682b8b19f28448', '75b45eff623a425a87147d0711d148f6',
  '45a2ec3463ab4ac78f3c750e511893b5', '323c54bd9b8d43e1bf0af7469571e22b',
  'b26be0a35afc46af950983fe62654103', 'ec3479a23c2242ecbc7f6f97f96e28f0',
  '89de42b518684e25a322fd3070521c89', '12f1e4522ab54227acdf6d463d0c6e7a',
  '910d84e613834553ab12f8d664182519', '9797e02e14f84b4bb0f2ca605305f533',
  '80f38a5d8e4e48ada0dfdc3f21c22c19', 'eb1678610e984f3ab2beb16a91b87075',
  'e6c7fcfbda6a41e7b34b13d4342f7606',
];

async function main() {
  const token = await getToken();
  const mediaId = await uploadMedia(token);

  console.log(`Assegno la cover a ${CAPPERIFICIO_PRODUCT_IDS.length} prodotti Capperificio Caro...`);

  for (const id of CAPPERIFICIO_PRODUCT_IDS) {
    try {
      await setProductCover(token, id, mediaId);
      console.log('OK  ', id);
    } catch (e) {
      console.error('FAIL', id, e.message);
    }
  }
}

main().catch((e) => {
  console.error('Errore:', e.message);
  process.exit(1);
});
