// ─────────────────────────────────────────────────────────────────────────────
//  Proxy READ-ONLY verso Strapi.
//
//  🔒 Il token Strapi resta SOLO sul server (STRAPI_TOKEN, senza VITE_) e non
//     finisce più nel bundle JavaScript pubblico.
//  Espone solo le risorse in allowlist (articoli del blog), in sola lettura.
//
//  ⚠ Env var richieste (lato server):
//     STRAPI_URL    es. https://cms.tuo-dominio.com
//     STRAPI_TOKEN  token read-only (opzionale se gli articoli sono pubblici)
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED = [/^articles(\/|\?|$)/]; // sola lettura articoli

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const STRAPI_URL = (process.env.STRAPI_URL || '').replace(/\/$/, '');
  const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';
  if (!STRAPI_URL) return res.status(500).json({ error: 'Strapi non configurato sul server' });

  const parts = req.query.path || [];
  const subPath = (Array.isArray(parts) ? parts.join('/') : parts);
  if (!ALLOWED.some((re) => re.test(subPath))) {
    return res.status(403).json({ error: 'Risorsa non consentita' });
  }

  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const target = `${STRAPI_URL}/api/${subPath}${qs}`;

  try {
    const r = await fetch(target, {
      headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
    });
    const text = await r.text();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
    return res.status(r.status).send(text);
  } catch (err) {
    console.error('Strapi proxy error:', err.message);
    return res.status(502).json({ error: 'Strapi non raggiungibile' });
  }
}
