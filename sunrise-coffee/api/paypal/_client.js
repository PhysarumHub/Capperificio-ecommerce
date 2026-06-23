// ─────────────────────────────────────────────────────────────────────────────
//  Helper SERVER per la REST API di PayPal (Orders v2).
//
//  ⚠ Env var richieste (lato server, SENZA prefisso VITE_):
//     PAYPAL_CLIENT_ID
//     PAYPAL_CLIENT_SECRET     ← SEGRETO, non deve mai finire nel bundle
//     PAYPAL_API_BASE          ← https://api-m.paypal.com (live)
//                                 o https://api-m.sandbox.paypal.com (test)
// ─────────────────────────────────────────────────────────────────────────────

const BASE = (process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com').replace(/\/$/, '');
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

export function paypalConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || 'PayPal auth fallita');
  return data.access_token;
}

export async function paypalFetch(path, { method = 'GET', body } = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error(data?.message || data?.details?.[0]?.description || `PayPal HTTP ${res.status}`);
    err.status = res.status;
    err.paypal = data;
    throw err;
  }
  return data;
}
