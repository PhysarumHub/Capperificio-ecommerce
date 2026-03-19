/**
 * Script one-shot: crea i custom fields per le Brew Recipes in Shopware.
 * Uso: node scripts/create-brew-custom-fields.js
 */

const SHOPWARE_ADMIN_URL = process.env.SHOPWARE_ADMIN_URL || 'http://localhost:8080';
const SHOPWARE_USER      = process.env.SHOPWARE_USER     || 'admin';
const SHOPWARE_PASSWORD  = process.env.SHOPWARE_PASSWORD || 'shopware';

const BREW_FIELDS = [
  { name: 'capperificio_brew_pour_over',  label: 'Brew Recipe: Pour-over' },
  { name: 'capperificio_brew_drip',       label: 'Brew Recipe: Drip' },
  { name: 'capperificio_brew_aeropress',  label: 'Brew Recipe: AeroPress' },
  { name: 'capperificio_brew_plunger',    label: 'Brew Recipe: Plunger / French Press' },
];

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
  if (!res.ok) throw new Error(`Auth failed (${res.status}): ${await res.text()}`);
  return (await res.json()).access_token;
}

async function createCustomFieldSet(token) {
  const res = await fetch(`${SHOPWARE_ADMIN_URL}/api/custom-field-set`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: 'capperificio_brew_recipes',
      config: { label: { 'en-GB': 'Brew Recipes', 'it-IT': 'Ricette di preparazione' } },
      relations: [{ entityName: 'product' }],
    }),
  });
  if (!res.ok) throw new Error(`Failed to create custom field set (${res.status}): ${await res.text()}`);

  // Recupera l'ID del set appena creato
  const listRes = await fetch(`${SHOPWARE_ADMIN_URL}/api/custom-field-set?filter[name]=capperificio_brew_recipes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const list = await listRes.json();
  return list.data[0].id;
}

async function createCustomField(token, setId, field) {
  const res = await fetch(`${SHOPWARE_ADMIN_URL}/api/custom-field`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: field.name,
      type: 'text',
      customFieldSetId: setId,
      config: {
        label: { 'en-GB': field.label, 'it-IT': field.label },
        customFieldType: 'textEditor',
        componentName: 'sw-text-editor',
      },
    }),
  });
  if (!res.ok) throw new Error(`Failed to create field "${field.name}" (${res.status}): ${await res.text()}`);
}

async function main() {
  console.log(`Connecting to ${SHOPWARE_ADMIN_URL}...`);
  const token = await getAdminToken();
  console.log('Authenticated.\n');

  process.stdout.write('Creating custom field set "capperificio_brew_recipes"... ');
  const setId = await createCustomFieldSet(token);
  console.log(`OK (id: ${setId})\n`);

  for (const field of BREW_FIELDS) {
    process.stdout.write(`  + field "${field.name}"... `);
    await createCustomField(token, setId, field);
    console.log('OK');
  }

  console.log('\nDone! Ora puoi compilare le ricette nei prodotti dall\'admin Shopware.');
  console.log('I custom fields si trovano nella sezione "Brew Recipes" in fondo alla pagina prodotto.');
}

main().catch((err) => {
  console.error('\nErrore:', err.message);
  process.exit(1);
});
