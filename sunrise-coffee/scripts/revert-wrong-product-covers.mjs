/**
 * REVERT: scripts/set-product-placeholder-images.mjs è stato lanciato senza
 * filtrare per sales channel e ha impostato l'immagine placeholder come cover
 * anche su 32 prodotti che NON appartengono a questo progetto (Capperificio
 * Caro ha solo 15 prodotti: 5 padri + 10 varianti figlie). I 32 prodotti sotto
 * appartengono a un catalogo diverso (frutta/verdura — nomi tipo "Anguria",
 * "Box Estivo") che condivide la stessa istanza Shopware/dockware.
 *
 * Questo script:
 *  1. Rimuove coverId dai 32 prodotti sbagliati (torna a NULL).
 *  2. Cancella la riga product-media creata per loro (che punta al media
 *     placeholder "placeholder-prodotto-capperificio-caro").
 * NON tocca i 15 prodotti reali di questo shop, né cancella il media stesso
 * (resta assegnato correttamente a quelli).
 *
 * Uso: node scripts/revert-wrong-product-covers.mjs
 */
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const BASE = 'http://127.0.0.1:8090/api';
const WRONG_MEDIA_ID = '86a63f46e9634b328096232072d82b90'; // placeholder-prodotto-capperificio-caro

const WRONG_PRODUCT_IDS = [
  ['019f1e895b0e714e9cdafa503910f22f', 'Anguria'],
  ['019f1e895d7c717b927c42fc1e20612c', 'Melone Cantalupo'],
  ['019f1e895fa270158b092d938d515f73', 'Pesche'],
  ['019f1e8961bd729dbf6ede89e7189210', 'Nettarine'],
  ['019f1e8963a073afbb2b2d1066fa42bf', 'Albicocche'],
  ['019f1e8965a670f19254cf5e3a810387', 'Susine Stanley'],
  ['019f1e8967d4724dbf6195c58a7ab176', 'Fichi Verdi'],
  ['019f1e8969e5734ab2f0929613ec6a03', 'More di Rovo'],
  ['019f1e896be67127b2f2225e3f44f06b', 'Lamponi'],
  ['019f1e896dcd70e7985f3e92dcac6160', 'Mirtilli'],
  ['019f1e89702f70cd96b564a4b7aad19a', 'Pomodori Rossi'],
  ['019f1e897245739f943e484e94c8e7f4', 'Pomodori Cherry'],
  ['019f1e89744073ecb92689e33e9a7ffe', 'Pomodoro Cuore di Bue'],
  ['019f1e8976087073bf2c830c1871f26b', 'Zucchine Chiare'],
  ['019f1e8977ea73238db331cf7556ccbc', 'Melanzane Viola'],
  ['019f1e8979e1734b8c510d1360948701', 'Peperoni Rossi'],
  ['019f1e897bbb70c09afce158daf09def', 'Peperoni Gialli'],
  ['019f1e897e12729186d07deb375ee7a5', 'Cetrioli'],
  ['019f1e89802871a7a1c6220f6aa58417', 'Fagiolini Fini'],
  ['019f1e898225712ea0d1b13cce8ca71b', 'Mais Dolce'],
  ['019f1e89843771c393b787e3af54f629', 'Patate Novelle'],
  ['019f1e89867671e8bb800638ac9b9d5a', 'Cipolle Bianche Tropea'],
  ['019f1e89889372abb27d67c9c02d694e', 'Basilico Genovese'],
  ['019f1e898abe711baa9f2dd450e99f3a', 'Prezzemolo'],
  ['019f1e898cb470fc8caed5486e00a000', 'Menta Piperita'],
  ['019f1e898ee273c6913a0853f1c89e3c', 'Rosmarino'],
  ['019f1e89910b73dbb373c208246151d2', 'Timo'],
  ['019f1e89932c708f89451707a651536d', 'Fagiolini Borlotti'],
  ['019f1e89952a7053901b1641c304d99e', 'Piselli Freschi'],
  ['019f1e89979b718889ac9f68cf03af2c', 'Box Estivo — Frutta e Verdura Misto'],
  ['019f1e899a6d722c9d2d025bdfaf74f5', 'Box Solo Verdure'],
  ['019f1e899ceb7123956c62cfc7993368', 'Box Solo Frutta'],
];

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
  const text = await r.text();
  if (!r.ok) throw new Error(`Auth failed (${r.status}): ${text.slice(0, 300)}`);
  return JSON.parse(text).access_token;
}

async function api(token, method, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok && r.status !== 204) throw new Error(`${method} ${path} -> ${r.status}: ${JSON.stringify(data).slice(0, 400)}`);
  return data;
}

async function main() {
  const token = await getToken();
  console.log('Autenticato. Avvio revert su', WRONG_PRODUCT_IDS.length, 'prodotti...');

  for (const [id, name] of WRONG_PRODUCT_IDS) {
    try {
      // 1. Stacca il cover prima di cancellare la riga product-media (FK).
      await api(token, 'PATCH', `/product/${id}`, { coverId: null });

      // 2. Trova ed elimina la riga product-media creata per errore.
      const assoc = await api(token, 'POST', '/search/product-media', {
        limit: 10,
        filter: [
          { type: 'equals', field: 'productId', value: id },
          { type: 'equals', field: 'mediaId', value: WRONG_MEDIA_ID },
        ],
      });
      const rows = assoc?.data || [];
      for (const row of rows) {
        await api(token, 'DELETE', `/product-media/${row.id}`);
      }
      console.log('OK  ', name, id, `(${rows.length} riga/e rimossa/e)`);
    } catch (e) {
      console.error('FAIL', name, id, e.message);
    }
  }
}

main().catch((e) => {
  console.error('Errore:', e.message);
  process.exit(1);
});
