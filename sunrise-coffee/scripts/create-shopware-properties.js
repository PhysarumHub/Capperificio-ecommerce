/**
 * Script one-shot: crea i Property Groups in Shopware via Admin API.
 * Uso: node scripts/create-shopware-properties.js
 *
 * Configura le variabili SHOPWARE_ADMIN_URL, SHOPWARE_USER, SHOPWARE_PASSWORD
 * oppure passale come env vars:
 *   SHOPWARE_ADMIN_URL=http://localhost:8080 SHOPWARE_USER=admin SHOPWARE_PASSWORD=xxx node scripts/create-shopware-properties.js
 */

const SHOPWARE_ADMIN_URL = process.env.SHOPWARE_ADMIN_URL || 'http://127.0.0.1:8090';
const SHOPWARE_USER      = process.env.SHOPWARE_USER     || 'admin';
const SHOPWARE_PASSWORD  = process.env.SHOPWARE_PASSWORD;

// Nessun fallback sulla password di default di Shopware: senza credenziale
// esplicita lo script si ferma invece di tentare l'accesso con 'shopware'.
if (!SHOPWARE_PASSWORD) {
  console.error('❌  SHOPWARE_PASSWORD non impostata.\n' +
    '    SHOPWARE_PASSWORD=xxx node scripts/create-shopware-properties.js');
  process.exit(1);
}

// Property groups da creare: { nome gruppo: [opzioni...] }
const PROPERTY_GROUPS = {
  'Tasting notes': ['Vanilla', 'Caramel', 'Fruity', 'Chocolate', 'Nutty', 'Floral', 'Citrus', 'Berry', 'Spicy', 'Earthy'],
  'Region':        ['Ethiopia', 'Colombia', 'Brazil', 'Guatemala', 'Kenya', 'Peru', 'Indonesia', 'Vietnam', 'Various'],
  'Type':          ['Blend', 'Single Origin'],
  'Best for':      ['Filter', 'Espresso', 'Both', 'Stovetop', 'Cold Brew'],
  'Process':       ['Washed', 'Natural', 'Honey', 'Anaerobic', 'Washed & Natural'],
};

async function getAdminToken() {
  const res = await fetch(`${SHOPWARE_ADMIN_URL}/api/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'password',
      client_id:  'administration',
      username:   SHOPWARE_USER,
      password:   SHOPWARE_PASSWORD,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Auth failed (${res.status}): ${err}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function createPropertyGroupWithOptions(token, name, optionNames) {
  const res = await fetch(`${SHOPWARE_ADMIN_URL}/api/property-group`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      displayType: 'text',
      sortingType:  'name',
      options: optionNames.map((optName) => ({ name: optName })),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create group "${name}" (${res.status}): ${err}`);
  }
}

async function main() {
  console.log(`Connecting to ${SHOPWARE_ADMIN_URL} as "${SHOPWARE_USER}"...`);
  const token = await getAdminToken();
  console.log('Authenticated.\n');

  for (const [groupName, options] of Object.entries(PROPERTY_GROUPS)) {
    process.stdout.write(`Creating group "${groupName}" with ${options.length} options... `);
    await createPropertyGroupWithOptions(token, groupName, options);
    console.log('OK');
  }

  console.log('\nDone! Ora puoi assegnare le properties ai prodotti dall\'admin Shopware.');
}

main().catch((err) => {
  console.error('\nErrore:', err.message);
  process.exit(1);
});
