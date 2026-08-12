// Login OAuth per Google Tag Manager API (flow "installed app" con redirect su localhost).
// Va lanciato dall'utente in locale (apre il browser reale): `node scripts/gtm-auth.js`
// Richiede .gtm-auth/client_secret.json (OAuth Client ID di tipo "Desktop app").
// Salva il token risultante in .gtm-auth/token.json, riusato dagli altri script gtm-*.

import { authenticate } from '@google-cloud/local-auth';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CREDENTIALS_PATH = path.join(ROOT, '.gtm-auth', 'client_secret.json');
const TOKEN_PATH = path.join(ROOT, '.gtm-auth', 'token.json');

const SCOPES = [
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
  'https://www.googleapis.com/auth/tagmanager.publish',
  'https://www.googleapis.com/auth/tagmanager.readonly',
];

if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error(`Manca ${CREDENTIALS_PATH}.
Scaricalo da Google Cloud Console → APIs & Services → Credentials
(OAuth Client ID, tipo "Desktop app") e salvalo con questo nome esatto.`);
  process.exit(1);
}

const client = await authenticate({
  scopes: SCOPES,
  keyfilePath: CREDENTIALS_PATH,
});

fs.writeFileSync(TOKEN_PATH, JSON.stringify(client.credentials, null, 2));
console.log(`Token salvato in ${TOKEN_PATH}. Ora posso usare l'API GTM in questa sessione.`);
