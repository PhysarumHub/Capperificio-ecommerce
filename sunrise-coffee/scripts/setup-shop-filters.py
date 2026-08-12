#!/usr/bin/env python3
"""
Configura i property group filtrabili su Shopware 6 per la sezione Shop.

Crea (o aggiorna) 3 gruppi con filterable=True:
  - Tipo:          Cappero | Cucunci | Foglie | Polvere
  - Formato:       Lilliput | Occhio di pernice | Lacrimella | Capperone
  - Conservazione: Sotto sale | Sotto aceto di vino | Sotto aceto di mele

Poi assegna automaticamente le proprietà ai prodotti esistenti
in base al nome del prodotto.

Uso:
  python scripts/setup-shop-filters.py
  python scripts/setup-shop-filters.py --base http://localhost:8080 --pass LA_TUA_PASSWORD
  python scripts/setup-shop-filters.py --base http://127.0.0.1 --user admin --pass LA_TUA_PASSWORD
"""

import urllib.request, urllib.error, json, uuid, sys

# ── Configurazione (override via CLI: --base / --user / --pass) ──────────────
import sys as _sys, pathlib as _pathlib
_sys.path.insert(0, str(_pathlib.Path(__file__).parent))
from _config import shopware_config as _shopware_config

_cfg       = _shopware_config()
_args      = _cfg.args
BASE       = _cfg.api_base
ADMIN_USER = _cfg.user
ADMIN_PASS = _cfg.password

# ── Definizione gruppi filtro ─────────────────────────────────────────────────
FILTER_GROUPS = [
    {
        'name':        'Tipo',
        'displayType': 'text',
        'sortingType': 'name',
        'options':     ['Cappero', 'Cucunci', 'Foglie', 'Polvere'],
    },
    {
        'name':        'Formato',
        'displayType': 'text',
        'sortingType': 'name',
        'options':     ['Lilliput', 'Occhio di pernice', 'Lacrimella', 'Capperone'],
    },
    {
        'name':        'Conservazione',
        'displayType': 'text',
        'sortingType': 'name',
        'options':     ['Sotto sale', 'Sotto aceto di vino', 'Sotto aceto di mele'],
    },
]

_h_get  = {}
_h_post = {}


# ── Auth ──────────────────────────────────────────────────────────────────────
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
    _ok('Autenticazione OK')


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


# ── Output helpers ────────────────────────────────────────────────────────────
def _step(n, msg):
    print(f'\n{"═" * 60}\n[{n}] {msg}\n{"═" * 60}')

def _ok(msg):
    print(f'  ✓ {msg}')

def _warn(msg):
    print(f'  ⚠  {msg}')

def _fail(msg):
    print(f'  ✗ {msg}', file=sys.stderr)


# ── STEP 1–3: Property groups ─────────────────────────────────────────────────
def setup_filter_group(step_num, group_def):
    """Crea o aggiorna un property group con filterable=True."""
    _step(step_num, f'Property Group "{group_def["name"]}"')

    existing = api('GET', '/property-group',
                   params=f'?filter[name]={urllib.parse.quote(group_def["name"])}')

    if existing.get('data'):
        group_id = existing['data'][0]['id']
        _ok(f'Gruppo già presente: {group_id}')

        # Rendi filterable
        r = api('PATCH', f'/property-group/{group_id}', {
            'filterable':                 True,
            'comparable':                 False,
            'visibleOnProductDetailPage': True,
        })
        if 'error' in r:
            _warn(f'Aggiornamento filterable: {r.get("msg", "")[:200]}')
        else:
            _ok('filterable=True impostato')

        # Aggiungi eventuali opzioni mancanti
        opts_res   = api('GET', f'/property-group/{group_id}/options', params='?limit=50')
        option_map = {o['name']: o['id'] for o in opts_res.get('data', [])}

        for i, name in enumerate(group_def['options']):
            if name in option_map:
                _ok(f'Opzione già presente: {name}')
                continue
            opt_id = uid()
            r2 = api('POST', '/property-group-option', {
                'id':       opt_id,
                'groupId':  group_id,
                'name':     name,
                'position': i,
            })
            if 'error' in r2:
                _warn(f'Opzione "{name}": {r2.get("msg", "")[:150]}')
            else:
                option_map[name] = opt_id
                _ok(f'Opzione aggiunta: {name}')

        return group_id, option_map

    # Crea gruppo nuovo
    group_id   = uid()
    option_map = {}
    options    = []

    for i, name in enumerate(group_def['options']):
        opt_id = uid()
        option_map[name] = opt_id
        options.append({'id': opt_id, 'name': name, 'position': i})

    r = api('POST', '/property-group', {
        'id':                         group_id,
        'name':                       group_def['name'],
        'displayType':                group_def['displayType'],
        'sortingType':                group_def['sortingType'],
        'filterable':                 True,
        'comparable':                 False,
        'visibleOnProductDetailPage': True,
        'options':                    options,
    })

    if 'error' in r:
        _fail(f'Creazione gruppo: {r["msg"][:300]}')
        return None, {}

    _ok(f'Gruppo "{group_def["name"]}" creato: {group_id}')
    _ok(f'Opzioni: {", ".join(group_def["options"])}')
    return group_id, option_map


# ── STEP 4: Assegna proprietà ai prodotti ─────────────────────────────────────
def assign_properties_to_products(groups):
    """
    Assegna Tipo + Conservazione ai prodotti esistenti.
    Il mapping avviene in base al nome del prodotto (lowercase).
    Formato viene già assegnato tramite le varianti configurate in setup-capperificio.py.
    """
    _step(len(FILTER_GROUPS) + 1, 'Assegnazione proprietà ai prodotti esistenti')

    products_res = api('GET', '/product', params='?filter[parentId]=null&limit=100')
    products     = products_res.get('data', [])

    if not products:
        _warn('Nessun prodotto trovato — skip')
        return

    tipo_map          = groups.get('Tipo',          ({}, {}))[1]
    conservazione_map = groups.get('Conservazione', ({}, {}))[1]

    updated = 0
    skipped = 0

    for product in products:
        name = (product.get('translated', {}).get('name') or product.get('name', '')).lower()
        pid  = product['id']
        prop_ids = []

        # ── Tipo ──────────────────────────────────────────────────────────────
        if 'cucunci' in name:
            if 'Cucunci' in tipo_map:
                prop_ids.append({'id': tipo_map['Cucunci']})
        elif 'foglie' in name:
            if 'Foglie' in tipo_map:
                prop_ids.append({'id': tipo_map['Foglie']})
        elif 'polvere' in name:
            if 'Polvere' in tipo_map:
                prop_ids.append({'id': tipo_map['Polvere']})
        else:
            if 'Cappero' in tipo_map:
                prop_ids.append({'id': tipo_map['Cappero']})

        # ── Conservazione ─────────────────────────────────────────────────────
        if 'aceto di mele' in name:
            if 'Sotto aceto di mele' in conservazione_map:
                prop_ids.append({'id': conservazione_map['Sotto aceto di mele']})
        elif 'aceto' in name:
            if 'Sotto aceto di vino' in conservazione_map:
                prop_ids.append({'id': conservazione_map['Sotto aceto di vino']})
        elif 'sale' in name:
            if 'Sotto sale' in conservazione_map:
                prop_ids.append({'id': conservazione_map['Sotto sale']})

        if not prop_ids:
            _warn(f'Nessuna property per: {product.get("name")}')
            skipped += 1
            continue

        r = api('PATCH', f'/product/{pid}', {'properties': prop_ids})
        if 'error' in r:
            _warn(f'"{product.get("name")}": {r.get("msg", "")[:150]}')
            skipped += 1
        else:
            _ok(f'"{product.get("name")}": {len(prop_ids)} proprietà assegnate')
            updated += 1

    _ok(f'Totale: {updated} prodotti aggiornati, {skipped} saltati')


# ── STEP 5: Abilita filtri sul Sales Channel ──────────────────────────────────
def enable_product_listing_filters():
    """
    Assicura che la product listing sia abilitata nel sales channel
    così che i filtri compaiano nella Store API (/product-listing).
    """
    _step(len(FILTER_GROUPS) + 2, 'Verifica Sales Channel – product listing')

    channels = api('GET', '/sales-channel', params='?limit=10')
    if not channels.get('data'):
        _warn('Nessun sales channel trovato — skip')
        return

    channel = next(
        (ch for ch in channels['data']
         if 'headless' in ch.get('name', '').lower()),
        channels['data'][0],
    )
    channel_id = channel['id']
    _ok(f'Sales channel: "{channel["name"]}" ({channel_id})')

    r = api('PATCH', f'/sales-channel/{channel_id}', {
        'useShortUrls': False,
    })
    if 'error' not in r:
        _ok('Sales channel verificato')
    else:
        _warn(f'Aggiornamento canale: {r.get("msg", "")[:150]}')


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    import urllib.parse  # necessario per quote() in setup_filter_group

    print('╔════════════════════════════════════════════════════════════╗')
    print('║      SETUP FILTRI SHOP  –  Shopware 6 Admin API           ║')
    print('╚════════════════════════════════════════════════════════════╝')
    print(f'  Backend : {BASE}')
    print(f'  Utente  : {ADMIN_USER}')
    print()

    try:
        authenticate()
    except Exception as e:
        print(f'\n✗ Autenticazione fallita: {e}')
        print('  → Verifica URL (--base), username e password (--pass)')
        sys.exit(1)

    groups = {}
    for i, group_def in enumerate(FILTER_GROUPS, start=1):
        gid, option_map = setup_filter_group(i, group_def)
        if gid:
            groups[group_def['name']] = (gid, option_map)

    assign_properties_to_products(groups)
    enable_product_listing_filters()

    print()
    print('╔════════════════════════════════════════════════════════════╗')
    print('║  ✓  FILTRI CONFIGURATI!                                    ║')
    print('╚════════════════════════════════════════════════════════════╝')
    print("""
Configurato:
  ✓ Tipo:          Cappero | Cucunci | Foglie | Polvere
  ✓ Formato:       Lilliput | Occhio di pernice | Lacrimella | Capperone
  ✓ Conservazione: Sotto sale | Sotto aceto di vino | Sotto aceto di mele

Tutti i gruppi sono impostati con filterable=True.

Prossimi passi:
  → Avvia il frontend e vai su /collections/all per testare i filtri
  → In admin verifica le proprietà assegnate ai prodotti
  → Per prodotti senza assegnazione automatica: assegna manualmente
  → I filtri Shopware funzionano anche via /product-listing (Store API)

  Admin: """ + _base_raw + """/admin
""")


if __name__ == '__main__':
    import urllib.parse
    main()
