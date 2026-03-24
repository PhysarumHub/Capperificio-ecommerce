#!/usr/bin/env python3
"""
Configura l'area B2B su Shopware 6.

Operazioni:
  1. Crea il customer group "B2B" (prezzi netti, displayGross=False)
  2. Crea la categoria "B2B Ingrosso"
  3. Crea i prodotti in formati industriali (500g, 1kg, 3kg, 5kg)
  4. Crea la regola prezzi B2B (sconto 20% rispetto al listino)
  5. Applica prezzi B2B ai prodotti esistenti

Uso:
  python scripts/setup-b2b.py
  python scripts/setup-b2b.py --base http://localhost:8080 --pass mia_password
  python scripts/setup-b2b.py --base http://127.0.0.1 --user admin --pass shopware
"""

import urllib.request, urllib.error, urllib.parse, json, uuid, sys, math

# ── Configurazione ────────────────────────────────────────────────────────────
_args      = dict(zip(sys.argv[1::2], sys.argv[2::2]))
_base_raw  = _args.get('--base', 'http://SHOPWARE_HOST_REDACTED:8090').rstrip('/')
BASE       = _base_raw + '/api' if not _base_raw.endswith('/api') else _base_raw
ADMIN_USER = _args.get('--user', 'admin')
ADMIN_PASS = _args.get('--pass', 'shopware')

# Prodotti B2B (formati industriali)
B2B_SIZES = ['500g', '1kg', '3kg', '5kg']

B2B_PRODUCTS = [
    {
        'name':        'Cappero di Racale al Sale — Industriale',
        'num_prefix':  'B2B-SAL',
        'sizes':       ['500g', '1kg', '3kg', '5kg'],
        'prices':      {  # prezzi netti B2B
            '500g': 7.90,
            '1kg':  13.90,
            '3kg':  36.90,
            '5kg':  55.90,
        },
    },
    {
        'name':        "Cappero di Racale all'Aceto — Industriale",
        'num_prefix':  'B2B-ACE',
        'sizes':       ['500g', '1kg', '3kg'],
        'prices':      {
            '500g': 7.90,
            '1kg':  13.90,
            '3kg':  36.90,
        },
    },
    {
        'name':        'Mix Capperi di Racale — Industriale',
        'num_prefix':  'B2B-MIX',
        'sizes':       ['1kg', '3kg', '5kg'],
        'prices':      {
            '1kg':  14.90,
            '3kg':  38.90,
            '5kg':  59.90,
        },
    },
]

_h_get  = {}
_h_post = {}


# ── Auth & API helpers ────────────────────────────────────────────────────────
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


def _step(n, msg):
    print(f'\n{"═" * 62}\n[{n}] {msg}\n{"═" * 62}')

def _ok(msg):
    print(f'  ✓ {msg}')

def _warn(msg):
    print(f'  ⚠  {msg}')

def _fail(msg):
    print(f'  ✗ {msg}', file=sys.stderr)


# ── STEP 1: Customer Group B2B ────────────────────────────────────────────────
def setup_customer_group():
    _step(1, 'Customer Group "B2B"')

    existing = api('GET', '/customer-group', params='?filter[name]=B2B')
    if existing.get('data'):
        group_id = existing['data'][0]['id']
        _ok(f'Gruppo B2B già presente: {group_id}')
        return group_id

    group_id = uid()
    r = api('POST', '/customer-group', {
        'id':           group_id,
        'name':         'B2B',
        'displayGross': False,   # mostra prezzi NETTI agli utenti B2B
        'hasGlobalDiscount': False,
    })
    if 'error' in r:
        _fail(f'Creazione gruppo B2B: {r["msg"][:300]}')
        return None

    _ok(f'Customer group B2B creato: {group_id}')
    _ok('displayGross=False → il canale restituirà prezzi netti ai clienti B2B')
    return group_id


# ── STEP 2: Categoria "B2B Ingrosso" ─────────────────────────────────────────
def setup_b2b_category():
    _step(2, 'Categoria "B2B Ingrosso"')

    existing = api('GET', '/category', params='?filter[name]=B2B%20Ingrosso&limit=1')
    if existing.get('data'):
        cat_id = existing['data'][0]['id']
        _ok(f'Categoria già presente: {cat_id}')
        return cat_id

    # Trova la root category
    root_res = api('GET', '/category', params='?filter[parentId]=null&limit=1')
    if not root_res.get('data'):
        _fail('Root category non trovata')
        return None
    root_id = root_res['data'][0]['id']
    _ok(f'Root category: {root_id}')

    cat_id = uid()
    r = api('POST', '/category', {
        'id':       cat_id,
        'name':     'B2B Ingrosso',
        'parentId': root_id,
        'type':     'page',
        'active':   True,
        'visible':  False,   # non visibile nel nav pubblico
    })
    if 'error' in r:
        _fail(f'Creazione categoria: {r["msg"][:300]}')
        return None

    _ok(f'Categoria "B2B Ingrosso" creata: {cat_id}')
    _ok('La categoria è nascosta dal nav pubblico (visible=False)')
    return cat_id


# ── STEP 3: Property group "Formato B2B" ─────────────────────────────────────
def setup_formato_b2b_group():
    _step(3, 'Property Group "Formato B2B"')

    existing = api('GET', '/property-group', params='?filter[name]=Formato%20B2B')
    if existing.get('data'):
        group_id   = existing['data'][0]['id']
        opts_res   = api('GET', f'/property-group/{group_id}/options', params='?limit=50')
        option_map = {o['name']: o['id'] for o in opts_res.get('data', [])}

        for i, name in enumerate(B2B_SIZES):
            if name not in option_map:
                opt_id = uid()
                api('POST', '/property-group-option', {
                    'id': opt_id, 'groupId': group_id,
                    'name': name, 'position': i,
                })
                option_map[name] = opt_id
                _ok(f'Opzione aggiunta: {name}')
            else:
                _ok(f'Opzione già presente: {name}')
        return group_id, option_map

    group_id   = uid()
    option_map = {}
    options    = []

    for i, name in enumerate(B2B_SIZES):
        opt_id = uid()
        option_map[name] = opt_id
        options.append({'id': opt_id, 'name': name, 'position': i})

    r = api('POST', '/property-group', {
        'id':          group_id,
        'name':        'Formato B2B',
        'displayType': 'text',
        'sortingType': 'name',
        'options':     options,
    })
    if 'error' in r:
        _fail(f'Creazione property group: {r["msg"][:300]}')
        return None, {}

    _ok(f'Gruppo "Formato B2B" creato: {group_id}')
    _ok(f'Opzioni: {", ".join(B2B_SIZES)}')
    return group_id, option_map


# ── STEP 4: Prodotti B2B ──────────────────────────────────────────────────────
def setup_b2b_products(eur_id, tax_id, tax_rate, channel_id, cat_id, option_map):
    _step(4, 'Prodotti B2B (formati industriali)')

    for i, prod in enumerate(B2B_PRODUCTS):
        prefix    = prod['num_prefix']
        parent_id = uid()

        sizes_for_product = prod['sizes']
        options_payload   = [
            {'optionId': option_map[s]}
            for s in sizes_for_product
            if s in option_map
        ]

        # Prezzo base = primo formato disponibile
        first_size      = sizes_for_product[0]
        first_net       = prod['prices'][first_size]
        first_gross_raw = first_net * (1 + tax_rate / 100)
        first_gross     = round(first_gross_raw, 2)

        parent_payload = {
            'id':            parent_id,
            'name':          prod['name'],
            'productNumber': f'{prefix}-000',
            'stock':         999,
            'taxId':         tax_id,
            'active':        True,
            'price': [{
                'currencyId': eur_id,
                'gross':      first_gross,
                'net':        round(first_net, 4),
                'linked':     True,
            }],
            'categories': [{'id': cat_id}],
            'visibilities': [{'salesChannelId': channel_id, 'visibility': 30}],
            'configuratorSettings': options_payload,
        }

        r = api('POST', '/product', parent_payload)
        if 'error' in r:
            _fail(f'"{prod["name"]}": {r.get("msg", "")[:300]}')
            continue

        errors = 0
        for j, size in enumerate(sizes_for_product):
            net   = prod['prices'].get(size, first_net)
            gross = round(net * (1 + tax_rate / 100), 2)

            vr = api('POST', '/product', {
                'id':            uid(),
                'parentId':      parent_id,
                'productNumber': f'{prefix}-{j + 1:02d}',
                'stock':         999,
                'options':       [{'id': option_map[size]}] if size in option_map else [],
                'price': [{
                    'currencyId': eur_id,
                    'gross':      gross,
                    'net':        round(net, 4),
                    'linked':     True,
                }],
            })
            if 'error' in vr:
                errors += 1
                _warn(f'Variante "{size}": {vr.get("msg", "")[:150]}')

        ok_variants = len(sizes_for_product) - errors
        size_list   = ', '.join(f'{s}={prod["prices"][s]}€' for s in sizes_for_product)
        _ok(f'"{prod["name"]}" → {ok_variants}/{len(sizes_for_product)} varianti [{size_list}]')


# ── STEP 5: Regola prezzo B2B + advanced prices ───────────────────────────────
def setup_b2b_price_rule(b2b_group_id, eur_id):
    _step(5, 'Regola prezzi B2B (sconto 20% su prodotti esistenti)')

    # Crea rule
    rule_id = uid()
    r = api('POST', '/rule', {
        'id':          rule_id,
        'name':        'Cliente B2B',
        'priority':    100,
        'moduleTypes': {'types': ['price']},
    })
    if 'error' in r:
        # Potrebbe già esistere
        existing = api('GET', '/rule', params='?filter[name]=Cliente%20B2B&limit=1')
        if existing.get('data'):
            rule_id = existing['data'][0]['id']
            _ok(f'Regola già presente: {rule_id}')
        else:
            _warn(f'Creazione regola: {r.get("msg", "")[:200]}')
            rule_id = None
    else:
        _ok(f'Regola "Cliente B2B" creata: {rule_id}')

        # Aggiungi condizione: customerGroup.id = b2b_group_id
        cond_id = uid()
        rc = api('POST', '/rule-condition', {
            'id':     cond_id,
            'ruleId': rule_id,
            'type':   'customerGroup',
            'value':  {'operator': '=', 'customerGroupIds': [b2b_group_id]},
            'position': 0,
        })
        if 'error' in rc:
            _warn(f'Condizione gruppo: {rc.get("msg", "")[:200]}')
        else:
            _ok('Condizione "customerGroup = B2B" aggiunta')

    if not rule_id:
        _warn('Prezzi avanzati non applicati — configura manualmente in admin')
        return

    # Applica prezzi B2B (-20%) ai prodotti esistenti NON già B2B
    products_res = api('GET', '/product', params='?filter[parentId]=null&limit=100')
    products     = [
        p for p in products_res.get('data', [])
        if not any(c.get('name') == 'B2B Ingrosso' for c in p.get('categories', []))
        and 'B2B' not in (p.get('name') or '')
    ]

    if not products:
        _warn('Nessun prodotto esistente da aggiornare')
        return

    updated = 0
    for product in products:
        pid  = product['id']
        name = product.get('translated', {}).get('name') or product.get('name', '')

        # Recupera prezzo attuale
        prices = product.get('price', [])
        if not prices:
            _warn(f'Nessun prezzo per: {name}')
            continue

        gross     = prices[0].get('gross', 0)
        net       = prices[0].get('net',   0)
        b2b_gross = round(gross * 0.80, 2)
        b2b_net   = round(net   * 0.80, 4)

        rr = api('POST', '/product-price', {
            'id':           uid(),
            'ruleId':       rule_id,
            'productId':    pid,
            'quantityStart': 1,
            'price': [{
                'currencyId': eur_id,
                'gross':      b2b_gross,
                'net':        b2b_net,
                'linked':     True,
            }],
        })
        if 'error' in rr:
            _warn(f'"{name}": {rr.get("msg", "")[:150]}')
        else:
            _ok(f'"{name}": {gross:.2f}€ → B2B {b2b_gross:.2f}€ (-20%)')
            updated += 1

    _ok(f'Totale: {updated}/{len(products)} prodotti aggiornati')


# ── STEP 6: Sales channel ─────────────────────────────────────────────────────
def get_sales_channel_and_currency():
    _step(6, 'Sales channel e valuta EUR')

    channels = api('GET', '/sales-channel', params='?limit=10')
    if not channels.get('data'):
        _fail('Nessun sales channel trovato')
        return None, None, None, None

    channel = next(
        (ch for ch in channels['data'] if 'headless' in ch.get('name', '').lower()),
        channels['data'][0],
    )
    channel_id = channel['id']
    _ok(f'Sales channel: "{channel["name"]}"')

    cur = api('GET', '/currency', params='?filter[isoCode]=EUR')
    if not cur.get('data'):
        _fail('Valuta EUR non trovata')
        return channel_id, None, None, None
    eur_id = cur['data'][0]['id']
    _ok(f'EUR: {eur_id}')

    taxes = api('GET', '/tax', params='?limit=20')
    if not taxes.get('data'):
        _fail('Nessuna aliquota IVA')
        return channel_id, eur_id, None, None

    tax_id   = taxes['data'][0]['id']
    tax_rate = taxes['data'][0].get('taxRate', 22)
    for t in taxes.get('data', []):
        if t.get('taxRate') == 4:
            tax_id, tax_rate = t['id'], 4
            break

    _ok(f'IVA: {tax_rate}%')
    return channel_id, eur_id, tax_id, tax_rate


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print('╔══════════════════════════════════════════════════════════════╗')
    print('║        SETUP AREA B2B  –  Shopware 6 Admin API              ║')
    print('╚══════════════════════════════════════════════════════════════╝')
    print(f'  Backend : {BASE}')
    print(f'  Utente  : {ADMIN_USER}')
    print()

    try:
        authenticate()
    except Exception as e:
        print(f'\n✗ Autenticazione fallita: {e}')
        print('  → Verifica URL (--base), username e password (--pass)')
        sys.exit(1)

    b2b_group_id = setup_customer_group()
    if not b2b_group_id:
        _fail('Setup customer group fallito')
        sys.exit(1)

    b2b_cat_id = setup_b2b_category()
    if not b2b_cat_id:
        _fail('Setup categoria B2B fallita')
        sys.exit(1)

    channel_id, eur_id, tax_id, tax_rate = get_sales_channel_and_currency()
    if not eur_id or not tax_id:
        _fail('Impossibile ottenere sales channel / valuta / IVA')
        sys.exit(1)

    _, option_map = setup_formato_b2b_group()
    setup_b2b_products(eur_id, tax_id, tax_rate, channel_id, b2b_cat_id, option_map)
    setup_b2b_price_rule(b2b_group_id, eur_id)

    print()
    print('╔══════════════════════════════════════════════════════════════╗')
    print('║  ✓  SETUP B2B COMPLETATO!                                    ║')
    print('╚══════════════════════════════════════════════════════════════╝')
    print(f"""
Configurato:
  ✓ Customer group "B2B" (prezzi netti, ID: {b2b_group_id})
  ✓ Categoria "B2B Ingrosso" (ID: {b2b_cat_id})
  ✓ Prodotti industriali: {len(B2B_PRODUCTS)} prodotti con varianti 500g/1kg/3kg/5kg
  ✓ Regola prezzi B2B: sconto 20% applicato ai prodotti esistenti

══════════════════════════════════════════════════════════════════
IMPORTANTE — aggiungi al file .env del frontend:
  VITE_B2B_CATEGORY_ID={b2b_cat_id}
  VITE_B2B_GROUP_NAME=B2B
══════════════════════════════════════════════════════════════════

Prossimi passi:
  → Crea un cliente di test in admin e assegnalo al gruppo B2B
  → Accedi con quel cliente su /b2b per verificare i prezzi netti
  → In admin: Impostazioni > Gruppi clienti > B2B > verifica displayGross=Off
  → Per approvare un cliente B2B: admin > Clienti > modifica > Gruppo = B2B

  Admin: """ + _base_raw + """/admin
""")


if __name__ == '__main__':
    main()
