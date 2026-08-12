#!/usr/bin/env python3
"""
Crea tutti i custom fields in Shopware usati dalla product page del frontend.

Custom Field Sets creati:
  1. capperificio_prodotto   → calibro (badge), bullet_1/2/3 (punti salienti)
  2. capperificio_ricette    → brew_pour_over/drip/aeropress/plunger (sezione utilizzi)

Uso:
  python scripts/setup-custom-fields.py
  python scripts/setup-custom-fields.py --base http://127.0.0.1:8090 --pass LA_TUA_PASSWORD
"""

import urllib.request, urllib.error, json, uuid, sys

# ── Config ────────────────────────────────────────────────────────────────────
import sys as _sys, pathlib as _pathlib
_sys.path.insert(0, str(_pathlib.Path(__file__).parent))
from _config import shopware_config as _shopware_config

_cfg       = _shopware_config()
_args      = _cfg.args
BASE       = _cfg.api_base
ADMIN_USER = _cfg.user
ADMIN_PASS = _cfg.password

# ── Definizione campi ─────────────────────────────────────────────────────────

# Set 1: info generali prodotto
SET_PRODOTTO = {
    'name':   'capperificio_prodotto',
    'label':  'Capperificio – Info Prodotto',
    'fields': [
        {
            'name':  'capperificio_calibro',
            'label': 'Calibro / Tipo (badge)',
            'type':  'text',
            'component': 'sw-field',           # input testo semplice
        },
        {
            'name':  'capperificio_bullet_1',
            'label': 'Punto saliante 1',
            'type':  'text',
            'component': 'sw-field',
        },
        {
            'name':  'capperificio_bullet_2',
            'label': 'Punto saliante 2',
            'type':  'text',
            'component': 'sw-field',
        },
        {
            'name':  'capperificio_bullet_3',
            'label': 'Punto saliante 3',
            'type':  'text',
            'component': 'sw-field',
        },
    ],
}

# Set 2: sezione ricette / suggerimenti utilizzo (HTML editor — accordion in pagina prodotto)
SET_RICETTE = {
    'name':   'capperificio_brew_recipes',
    'label':  'Capperificio – Ricette / Utilizzi',
    'fields': [
        {
            'name':  'capperificio_brew_pour_over',
            'label': 'Ricetta / Utilizzo 1',
            'type':  'html',
            'component': 'sw-text-editor',
        },
        {
            'name':  'capperificio_brew_drip',
            'label': 'Ricetta / Utilizzo 2',
            'type':  'html',
            'component': 'sw-text-editor',
        },
        {
            'name':  'capperificio_brew_aeropress',
            'label': 'Ricetta / Utilizzo 3',
            'type':  'html',
            'component': 'sw-text-editor',
        },
        {
            'name':  'capperificio_brew_plunger',
            'label': 'Ricetta / Utilizzo 4',
            'type':  'html',
            'component': 'sw-text-editor',
        },
    ],
}

# ── Auth ──────────────────────────────────────────────────────────────────────
_h_get  = {}
_h_post = {}

def authenticate():
    global _h_get, _h_post
    req = urllib.request.Request(
        f'{BASE}/oauth/token',
        data=json.dumps({
            'client_id': 'administration',
            'grant_type': 'password',
            'scopes':     'write',
            'username':   ADMIN_USER,
            'password':   ADMIN_PASS,
        }).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req) as r:
        token = json.loads(r.read())['access_token']
    _h_get  = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
    _h_post = {**_h_get, 'Content-Type': 'application/json'}
    print('  ✓ Autenticazione OK')

def api(method, path, data=None, params=''):
    url  = f'{BASE}{path}{params}'
    body = json.dumps(data).encode() if data is not None else None
    req  = urllib.request.Request(
        url, data=body,
        headers=_h_post if body is not None else _h_get,
        method=method,
    )
    try:
        with urllib.request.urlopen(req) as r:
            txt = r.read()
            return json.loads(txt) if txt else {}
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'msg': e.read().decode()}

def uid():
    return str(uuid.uuid4()).replace('-', '')

# ── Logica ────────────────────────────────────────────────────────────────────

def get_or_create_set(set_def):
    """Crea il custom field set se non esiste, ritorna il suo ID."""
    name = set_def['name']

    existing = api('GET', '/custom-field-set', params=f'?filter[name]={name}')
    if existing.get('data'):
        set_id = existing['data'][0]['id']
        print(f'  ~ Set "{name}" già presente: {set_id}')
        return set_id

    set_id = uid()
    r = api('POST', '/custom-field-set', {
        'id':        set_id,
        'name':      name,
        'config':    {'label': {'en-GB': set_def['label'], 'it-IT': set_def['label']}},
        'relations': [{'entityName': 'product'}],
    })
    if 'error' in r:
        print(f'  ✗ Errore creazione set "{name}": {r["msg"][:300]}')
        return None

    print(f'  ✓ Set "{name}" creato: {set_id}')
    return set_id


def get_existing_field_names(set_id):
    """Ritorna i nomi dei campi già presenti nel set."""
    r = api('GET', '/custom-field', params=f'?filter[customFieldSetId]={set_id}&limit=50')
    return {f['name'] for f in r.get('data', [])}


def create_field(set_id, field):
    """Crea un singolo custom field (salta se già esiste)."""
    name      = field['name']
    label     = field['label']
    ftype     = field['type']
    component = field['component']

    # Config base
    config = {
        'label':           {'en-GB': label, 'it-IT': label},
        'customFieldType': 'text' if ftype == 'text' else 'textEditor',
        'componentName':   component,
    }

    r = api('POST', '/custom-field', {
        'id':               uid(),
        'name':             name,
        'type':             ftype,
        'customFieldSetId': set_id,
        'config':           config,
    })
    if 'error' in r:
        print(f'    ✗ "{name}": {r["msg"][:200]}')
    else:
        print(f'    ✓ "{name}"  ({label})')


def process_set(set_def):
    print(f'\n{"═" * 58}')
    print(f'  Set: {set_def["name"]}')
    print(f'{"═" * 58}')

    set_id = get_or_create_set(set_def)
    if not set_id:
        return

    existing_names = get_existing_field_names(set_id)

    for field in set_def['fields']:
        if field['name'] in existing_names:
            print(f'    ~ "{field["name"]}" già presente — skip')
        else:
            create_field(set_id, field)


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print('╔══════════════════════════════════════════════════════════╗')
    print('║       SETUP CUSTOM FIELDS  –  Capperificio Shopware 6   ║')
    print('╚══════════════════════════════════════════════════════════╝')
    print(f'  Backend : {BASE}\n')

    try:
        authenticate()
    except Exception as e:
        print(f'\n✗ Autenticazione fallita: {e}')
        sys.exit(1)

    process_set(SET_PRODOTTO)
    process_set(SET_RICETTE)

    print('\n╔══════════════════════════════════════════════════════════╗')
    print('║  ✓  CUSTOM FIELDS CREATI!                                ║')
    print('╚══════════════════════════════════════════════════════════╝')
    print("""
Campi disponibili nell'admin Shopware → Prodotti → [prodotto] → scroll in fondo:

  Capperificio – Info Prodotto:
    • capperificio_calibro     → badge sotto il titolo (es. "Lilliput", "DOP")
    • capperificio_bullet_1    → primo punto saliante (es. "Raccolto a mano")
    • capperificio_bullet_2    → secondo punto saliante
    • capperificio_bullet_3    → terzo punto saliante

  Capperificio – Ricette / Utilizzi:
    • capperificio_brew_pour_over  → Ricetta / Utilizzo 1 (HTML)
    • capperificio_brew_drip       → Ricetta / Utilizzo 2 (HTML)
    • capperificio_brew_aeropress  → Ricetta / Utilizzo 3 (HTML)
    • capperificio_brew_plunger    → Ricetta / Utilizzo 4 (HTML)
""")


if __name__ == '__main__':
    main()
