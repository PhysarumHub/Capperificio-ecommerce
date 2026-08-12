// Provisioning idempotente del container GTM-P96KXJR5: variabili built-in,
// variabili custom, trigger custom event, tag GA4 e Meta Pixel.
// Non crea versioni né pubblica: lascia tutto nel workspace per revisione.
//
// Uso: node scripts/gtm-setup.js

import fs from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';

const ROOT = path.resolve(import.meta.dirname, '..');
const CREDENTIALS_PATH = path.join(ROOT, '.gtm-auth', 'client_secret.json');
const TOKEN_PATH = path.join(ROOT, '.gtm-auth', 'token.json');

const ACCOUNT_ID = '6304794416';
const CONTAINER_ID = '225396435';
const PARENT = `accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/4`;
const ALL_PAGES_TRIGGER_ID = '2147479553';

const GA4_MEASUREMENT_ID = 'G-BMB46XYCX7';
const META_PIXEL_ID = '1844504073045571';

const { installed } = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
const oauth2Client = new google.auth.OAuth2(installed.client_id, installed.client_secret, 'http://localhost');
oauth2Client.setCredentials(token);
const tm = google.tagmanager({ version: 'v2', auth: oauth2Client });

function log(...args) {
  console.log(...args);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Ogni chiamata scrittura passa da qui: piccolo delay fisso + retry con
// backoff sui 429 (quota "queries per minute" del progetto GCP appena creato).
async function withRetry(fn, { retries = 6, baseDelay = 4000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      await sleep(600);
      return await fn();
    } catch (e) {
      const isRateLimited = e?.code === 429 || e?.response?.status === 429;
      if (!isRateLimited || attempt >= retries) throw e;
      const wait = baseDelay * Math.pow(1.6, attempt);
      log(`  (429, retry tra ${Math.round(wait / 1000)}s...)`);
      await sleep(wait);
    }
  }
}

// ── Built-in variables ──────────────────────────────────────────────────────
async function enableBuiltInVariables() {
  const types = [
    'clickElement', 'clickClasses', 'clickId', 'clickTarget', 'clickUrl', 'clickText',
    'formElement', 'formClasses', 'formId', 'formTarget', 'formUrl', 'formText',
    'newHistoryFragment', 'oldHistoryFragment', 'newHistoryState', 'oldHistoryState', 'historySource',
    'containerId', 'containerVersion', 'debugMode', 'randomNumber', 'environmentName',
  ];
  const existing = await withRetry(() => tm.accounts.containers.workspaces.built_in_variables.list({ parent: PARENT }));
  const already = new Set((existing.data.builtInVariable || []).map(v => v.type));
  const toEnable = types.filter(t => !already.has(t));
  if (toEnable.length === 0) {
    log('Built-in variables: già tutte abilitate.');
    return;
  }
  await withRetry(() => tm.accounts.containers.workspaces.built_in_variables.create({ parent: PARENT, type: toEnable }));
  log('Built-in variables abilitate:', toEnable.join(', '));
}

// ── Variables (constants + DLV) ─────────────────────────────────────────────
let variablesCache = null;
async function upsertVariable(def) {
  if (!variablesCache) {
    const list = await withRetry(() => tm.accounts.containers.workspaces.variables.list({ parent: PARENT }));
    variablesCache = list.data.variable || [];
  }
  const existing = variablesCache.find(v => v.name === def.name);
  if (existing) {
    await withRetry(() => tm.accounts.containers.workspaces.variables.update({
      path: existing.path,
      requestBody: { ...def },
    }));
    log('Variable aggiornata:', def.name);
  } else {
    await withRetry(() => tm.accounts.containers.workspaces.variables.create({ parent: PARENT, requestBody: def }));
    log('Variable creata:', def.name);
  }
}

function constVar(name, value) {
  return { name, type: 'c', parameter: [{ type: 'template', key: 'value', value }] };
}

function dlv(name, key) {
  return {
    name,
    type: 'v',
    parameter: [
      { type: 'integer', key: 'dataLayerVersion', value: '2' },
      { type: 'template', key: 'name', value: key },
    ],
  };
}

async function setupVariables() {
  const defs = [
    constVar('GA4 - Measurement ID', GA4_MEASUREMENT_ID),
    constVar('Meta - Pixel ID', META_PIXEL_ID),
    dlv('DLV - page_location', 'page_location'),
    dlv('DLV - page_path', 'page_path'),
    dlv('DLV - page_title', 'page_title'),
    dlv('DLV - ecommerce.value', 'ecommerce.value'),
    dlv('DLV - ecommerce.currency', 'ecommerce.currency'),
    dlv('DLV - ecommerce.transaction_id', 'ecommerce.transaction_id'),
    dlv('DLV - ecommerce.items', 'ecommerce.items'),
    dlv('DLV - ecommerce.shipping_tier', 'ecommerce.shipping_tier'),
  ];
  for (const def of defs) await upsertVariable(def);
}

// ── Triggers (custom event) ─────────────────────────────────────────────────
let triggersCache = null;
async function upsertTrigger(def) {
  if (!triggersCache) {
    const list = await withRetry(() => tm.accounts.containers.workspaces.triggers.list({ parent: PARENT }));
    triggersCache = list.data.trigger || [];
  }
  const existing = triggersCache.find(t => t.name === def.name);
  if (existing) {
    const res = await withRetry(() => tm.accounts.containers.workspaces.triggers.update({
      path: existing.path,
      requestBody: { ...def },
    }));
    log('Trigger aggiornato:', def.name);
    return res.data;
  }
  const res = await withRetry(() => tm.accounts.containers.workspaces.triggers.create({ parent: PARENT, requestBody: def }));
  log('Trigger creato:', def.name);
  return res.data;
}

function customEventTrigger(name, eventName) {
  return {
    name,
    type: 'customEvent',
    customEventFilter: [{
      type: 'equals',
      parameter: [
        { type: 'template', key: 'arg0', value: '{{_event}}' },
        { type: 'template', key: 'arg1', value: eventName },
      ],
    }],
  };
}

const EVENT_NAMES = ['page_view', 'view_item', 'add_to_cart', 'remove_from_cart', 'view_cart', 'begin_checkout', 'add_shipping_info', 'purchase'];

async function setupTriggers() {
  const triggers = {};
  for (const evt of EVENT_NAMES) {
    const data = await upsertTrigger(customEventTrigger(`CE - ${evt}`, evt));
    triggers[evt] = data.triggerId;
  }
  return triggers;
}

// ── Tags ─────────────────────────────────────────────────────────────────────
let tagsCache = null;
async function upsertTag(def) {
  if (!tagsCache) {
    const list = await withRetry(() => tm.accounts.containers.workspaces.tags.list({ parent: PARENT }));
    tagsCache = list.data.tag || [];
  }
  const existing = tagsCache.find(t => t.name === def.name);
  if (existing) {
    const res = await withRetry(() => tm.accounts.containers.workspaces.tags.update({
      path: existing.path,
      requestBody: { ...def },
    }));
    log('Tag aggiornato:', def.name);
    return res.data;
  }
  const res = await withRetry(() => tm.accounts.containers.workspaces.tags.create({ parent: PARENT, requestBody: def }));
  log('Tag creato:', def.name);
  return res.data;
}

async function setupGA4(triggerIds) {
  const config = await upsertTag({
    name: 'GA4 - Configuration',
    type: 'gaawc',
    parameter: [
      { type: 'template', key: 'measurementId', value: '{{GA4 - Measurement ID}}' },
      { type: 'boolean', key: 'sendPageView', value: 'false' },
    ],
    firingTriggerId: [ALL_PAGES_TRIGGER_ID],
    consentSettings: {
      consentStatus: 'needed',
      consentType: { type: 'list', list: [{ type: 'template', value: 'analytics_storage' }] },
    },
  });

  const measurementIdOverride = { type: 'template', key: 'measurementIdOverride', value: '{{GA4 - Measurement ID}}' };

  // page_view: unico evento con parametri custom espliciti (no oggetto ecommerce)
  await upsertTag({
    name: 'GA4 - Event - page_view',
    type: 'gaawe',
    parameter: [
      measurementIdOverride,
      { type: 'template', key: 'eventName', value: 'page_view' },
      {
        type: 'list', key: 'eventParameters',
        list: [
          { type: 'map', map: [{ type: 'template', key: 'name', value: 'page_location' }, { type: 'template', key: 'value', value: '{{DLV - page_location}}' }] },
          { type: 'map', map: [{ type: 'template', key: 'name', value: 'page_path' }, { type: 'template', key: 'value', value: '{{DLV - page_path}}' }] },
          { type: 'map', map: [{ type: 'template', key: 'name', value: 'page_title' }, { type: 'template', key: 'value', value: '{{DLV - page_title}}' }] },
        ],
      },
    ],
    firingTriggerId: [triggerIds.page_view],
    consentSettings: {
      consentStatus: 'needed',
      consentType: { type: 'list', list: [{ type: 'template', value: 'analytics_storage' }] },
    },
  });

  // Eventi ecommerce: sendEcommerceData legge automaticamente l'oggetto
  // `ecommerce` più recente pushato in dataLayer da src/lib/utils/gtm.js
  const ecommerceEvents = ['view_item', 'add_to_cart', 'remove_from_cart', 'view_cart', 'begin_checkout', 'add_shipping_info', 'purchase'];
  for (const evt of ecommerceEvents) {
    await upsertTag({
      name: `GA4 - Event - ${evt}`,
      type: 'gaawe',
      parameter: [
        measurementIdOverride,
        { type: 'template', key: 'eventName', value: evt },
        { type: 'boolean', key: 'sendEcommerceData', value: 'true' },
      ],
      firingTriggerId: [triggerIds[evt]],
      consentSettings: {
        consentStatus: 'needed',
        consentType: { type: 'list', list: [{ type: 'template', value: 'analytics_storage' }] },
      },
    });
  }
}

async function setupMeta(triggerIds) {
  const consentSettings = {
    consentStatus: 'needed',
    consentType: { type: 'list', list: [{ type: 'template', value: 'ad_storage' }] },
  };
  const setupTag = [{ tagName: 'Meta Pixel', stopOnSetupFailure: false }];

  const events = [
    { name: 'Meta Pixel - ViewContent', standardEventName: 'ViewContent', evt: 'view_item' },
    { name: 'Meta Pixel - AddToCart', standardEventName: 'AddToCart', evt: 'add_to_cart' },
    { name: 'Meta Pixel - InitiateCheckout', standardEventName: 'InitiateCheckout', evt: 'begin_checkout' },
    { name: 'Meta Pixel - Purchase', standardEventName: 'Purchase', evt: 'purchase' },
  ];

  for (const e of events) {
    await upsertTag({
      name: e.name,
      type: 'cvt_5RM3Q',
      parameter: [
        { type: 'template', key: 'pixelId', value: '{{Meta - Pixel ID}}' },
        { type: 'template', key: 'eventName', value: 'standard' },
        { type: 'template', key: 'standardEventName', value: e.standardEventName },
        { type: 'boolean', key: 'enhancedEcommerce', value: 'true' },
        { type: 'boolean', key: 'disableAutoConfig', value: 'true' },
        { type: 'boolean', key: 'disablePushState', value: 'false' },
        { type: 'boolean', key: 'objectPropertiesFromVariable', value: 'false' },
        { type: 'boolean', key: 'advancedMatching', value: 'false' },
        { type: 'boolean', key: 'dpoLDU', value: 'false' },
        { type: 'boolean', key: 'consent', value: 'true' },
      ],
      firingTriggerId: [triggerIds[e.evt]],
      setupTag,
      consentSettings,
    });
  }
}

async function main() {
  await enableBuiltInVariables();
  await setupVariables();
  const triggerIds = await setupTriggers();
  await setupGA4(triggerIds);
  await setupMeta(triggerIds);
  log('\nFatto. Tutto nel workspace, nessuna versione pubblicata.');
}

main().catch(e => { console.error(e?.response?.data || e); process.exit(1); });
