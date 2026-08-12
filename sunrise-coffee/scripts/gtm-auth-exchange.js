// Scambia un authorization code (preso manualmente dall'URL di redirect dopo il
// consenso OAuth) con access_token + refresh_token, e salva in .gtm-auth/token.json.
// Uso: node scripts/gtm-auth-exchange.js "<code>"

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CREDENTIALS_PATH = path.join(ROOT, '.gtm-auth', 'client_secret.json');
const TOKEN_PATH = path.join(ROOT, '.gtm-auth', 'token.json');

const code = process.argv[2];
if (!code) {
  console.error('Uso: node scripts/gtm-auth-exchange.js "<code>"');
  process.exit(1);
}

const { installed } = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

const body = new URLSearchParams({
  code,
  client_id: installed.client_id,
  client_secret: installed.client_secret,
  redirect_uri: 'http://localhost',
  grant_type: 'authorization_code',
});

const res = await fetch(installed.token_uri, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
});

const data = await res.json();

if (!res.ok) {
  console.error('Errore scambio token:', data);
  process.exit(1);
}

const credentials = {
  access_token: data.access_token,
  refresh_token: data.refresh_token,
  scope: data.scope,
  token_type: data.token_type,
  expiry_date: Date.now() + data.expires_in * 1000,
};

fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
console.log(`Token salvato in ${TOKEN_PATH}`);
console.log('refresh_token presente:', Boolean(data.refresh_token));
