#!/usr/bin/env python3
"""
Setup completo Capperificio ecommerce su Shopware 6.
Configura: lingua IT, paesi Europa, spedizioni, prodotti con varianti.

Uso:
  python scripts/setup-capperificio.py
  python scripts/setup-capperificio.py --base http://localhost:8080 --pass mia_password
  python scripts/setup-capperificio.py --base http://127.0.0.1 --user admin --pass shopware
"""

import urllib.request, urllib.error, json, uuid, sys

# ── Configurazione (override via CLI: --base / --user / --pass) ──────────────
_args = dict(zip(sys.argv[1::2], sys.argv[2::2]))
_base_raw = _args.get('--base', 'http://SHOPWARE_HOST_REDACTED:8090').rstrip('/')
BASE       = _base_raw + '/api' if not _base_raw.endswith('/api') else _base_raw
ADMIN_USER = _args.get('--user', 'admin')
ADMIN_PASS = _args.get('--pass', 'shopware')

# Paesi UE (esclusa IT) – ISO 3166-1 alpha-2
EU_ISO = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL',
    'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]

# Varianti formato cappero
FORMATO_OPTIONS = ['Lilliput', 'Occhio di pernice', 'Lacrimella', 'Capperone']

# Prodotti: (nome, ha_varianti_formato)
PRODUCTS = [
    ('Cappero di Racale al sale marino',       True),
    ("Cappero di Racale all'aceto di vino",    True),
    ("Cucunci all'aceto di vino",              False),
    ("Cucunci all'aceto di mele",              False),
    ("Foglie di cappero all'aceto",            False),
    ('Polvere di cappero di Racale',           False),
]

# ID locale it-IT in Shopware (costante del sistema)
LOCALE_IT_ID = '01994d2399a971cabca0b9da924e3ab7'

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
    print(f'\n{"═" * 58}\n[{n}] {msg}\n{"═" * 58}')

def _ok(msg):
    print(f'  ✓ {msg}')

def _warn(msg):
    print(f'  ⚠  {msg}')

def _fail(msg):
    print(f'  ✗ {msg}', file=sys.stderr)


# ── STEP 1: Lingua Italiana ───────────────────────────────────────────────────
def setup_language():
    _step(1, 'Lingua Italiana')

    langs = api('GET', '/language', params='?filter[name]=English')
    if not langs.get('data'):
        _fail('Lingua English (parent) non trovata')
        return None
    parent_id = langs['data'][0]['id']

    existing = api('GET', '/language', params='?filter[name]=Italiano')
    if existing.get('data'):
        lang_id = existing['data'][0]['id']
        _ok(f'Italiano già presente: {lang_id}')
        return lang_id

    lang_id = uid()
    r = api('POST', '/language', {
        'id':       lang_id,
        'name':     'Italiano',
        'localeId': LOCALE_IT_ID,
        'parentId': parent_id,
    })
    if 'error' in r:
        _fail(f'Creazione lingua: {r["msg"][:300]}')
        return None

    _ok(f'Lingua Italiano creata: {lang_id}')
    return lang_id


# ── STEP 2: Paesi IT + Europa ─────────────────────────────────────────────────
def setup_countries():
    _step(2, 'Abilitazione paesi IT + Europa (27 paesi UE)')

    it_id  = None
    eu_ids = []

    for iso in ['IT'] + EU_ISO:
        res = api('GET', '/country', params=f'?filter[iso]={iso}')
        if not res.get('data'):
            _warn(f'Paese {iso} non trovato nel DB Shopware')
            continue
        cid = res['data'][0]['id']
        api('PATCH', f'/country/{cid}', {'active': True, 'shippingAvailable': True})
        if iso == 'IT':
            it_id = cid
        else:
            eu_ids.append(cid)

    if it_id:
        _ok(f'Italia abilitata: {it_id}')
    _ok(f'{len(eu_ids)} paesi UE abilitati')
    return it_id, eu_ids


# ── STEP 3: Regole spedizione (Rule Engine) ───────────────────────────────────
def _create_rule(name, priority, root_condition):
    """Crea una rule Shopware con condizioni annidate."""
    rule_id = uid()
    r = api('POST', '/rule', {
        'id':          rule_id,
        'name':        name,
        'priority':    priority,
        'moduleTypes': {'types': ['shipping']},
    })
    if 'error' in r:
        _fail(f'Rule "{name}": {r["msg"][:300]}')
        return None

    def add_condition(cond, parent_id=None, pos=0):
        cid     = uid()
        payload = {
            'id':       cid,
            'ruleId':   rule_id,
            'type':     cond['type'],
            'position': pos,
        }
        if parent_id:
            payload['parentId'] = parent_id
        if 'value' in cond:
            payload['value'] = cond['value']

        cr = api('POST', '/rule-condition', payload)
        if 'error' in cr:
            _fail(f'Condizione {cond["type"]}: {cr.get("msg", "")[:200]}')
            return None

        for i, child in enumerate(cond.get('children', [])):
            add_condition(child, cid, i)
        return cid

    add_condition(root_condition)
    _ok(f'Rule "{name}": {rule_id}')
    return rule_id


def setup_rules(it_id, eu_ids):
    _step(3, 'Regole del Rule Engine per le spedizioni')

    all_ids = [it_id] + eu_ids

    # ── Regola disponibilità: shipping method visibile solo a IT + EU
    r_avail = _create_rule('Spedizione IT + Europa (disponibilità)', 1, {
        'type': 'orContainer',
        'children': [{
            'type': 'andContainer',
            'children': [{
                'type':  'customerShippingCountry',
                'value': {'operator': '=', 'countryIds': all_ids},
            }],
        }],
    })

    # ── IT con carrello < 50€ → 5€
    r_it_lt50 = _create_rule('Italia - sotto 50€', 10, {
        'type': 'orContainer',
        'children': [{
            'type': 'andContainer',
            'children': [
                {
                    'type':  'customerShippingCountry',
                    'value': {'operator': '=', 'countryIds': [it_id]},
                },
                {
                    'type':  'cartTotalPrice',
                    'value': {'operator': '<', 'amount': 50},
                },
            ],
        }],
    })

    # ── IT con carrello ≥ 50€ → 0€ (gratuita)
    r_it_gte50 = _create_rule('Italia - 50€ o più (gratuita)', 10, {
        'type': 'orContainer',
        'children': [{
            'type': 'andContainer',
            'children': [
                {
                    'type':  'customerShippingCountry',
                    'value': {'operator': '=', 'countryIds': [it_id]},
                },
                {
                    'type':  'cartTotalPrice',
                    'value': {'operator': '>=', 'amount': 50},
                },
            ],
        }],
    })

    # ── Europa (esclusa IT) → sempre 10€
    r_eu = _create_rule('Europa (esclusa Italia) - 10€', 10, {
        'type': 'orContainer',
        'children': [{
            'type': 'andContainer',
            'children': [{
                'type':  'customerShippingCountry',
                'value': {'operator': '=', 'countryIds': eu_ids},
            }],
        }],
    })

    return r_avail, r_it_lt50, r_it_gte50, r_eu


# ── STEP 4: Metodo di spedizione + prezzi ─────────────────────────────────────
def setup_shipping(r_avail, r_it_lt50, r_it_gte50, r_eu):
    _step(4, 'Metodo di spedizione "Spedizione Standard"')

    # EUR
    cur = api('GET', '/currency', params='?filter[isoCode]=EUR')
    if not cur.get('data'):
        _fail('Valuta EUR non trovata')
        return None, None
    eur_id = cur['data'][0]['id']
    _ok(f'EUR currency: {eur_id}')

    # Delivery time (usa il primo esistente o ne crea uno)
    dt = api('GET', '/delivery-time', params='?limit=1')
    if dt.get('data'):
        dt_id = dt['data'][0]['id']
        _ok(f'Delivery time esistente: {dt["data"][0].get("name", dt_id)}')
    else:
        dt_id = uid()
        api('POST', '/delivery-time', {
            'id':   dt_id,
            'name': '3-5 giorni lavorativi',
            'min':  3,
            'max':  5,
            'unit': 'day',
        })
        _ok(f'Delivery time creato: {dt_id}')

    # Shipping method
    method_id = uid()
    r = api('POST', '/shipping-method', {
        'id':                 method_id,
        'name':               'Spedizione Standard',
        'technicalName':      'spedizione_standard',
        'active':             True,
        'deliveryTimeId':     dt_id,
        'availabilityRuleId': r_avail,
        'description':        'Spedizione in Italia e in tutti i paesi UE.',
        'trackingUrl':        '',
    })
    if 'error' in r:
        _fail(f'Shipping method: {r["msg"][:400]}')
        return None, None
    _ok(f'Metodo spedizione creato: {method_id}')

    # Prezzi – IVA 22% sui servizi di spedizione
    def add_price(rule_id, gross, label):
        net = round(gross / 1.22, 4) if gross > 0 else 0.0
        rr  = api('POST', '/shipping-method-price', {
            'id':               uid(),
            'shippingMethodId': method_id,
            'ruleId':           rule_id,
            'calculation':      1,      # 1 = prezzo fisso
            'quantityStart':    1,
            'currencyPrice': [{
                'currencyId': eur_id,
                'gross':      gross,
                'net':        net,
                'linked':     True,
            }],
        })
        if 'error' in rr:
            _fail(f'Prezzo "{label}": {rr.get("msg", "")[:300]}')
        else:
            _ok(f'Prezzo "{label}": {gross:.2f}€ (net {net:.4f}€)')

    add_price(r_it_lt50,  5.0,  'Italia < 50€ → 5€')
    add_price(r_it_gte50, 0.0,  'Italia ≥ 50€ → GRATUITA')
    add_price(r_eu,       10.0, 'Europa → 10€')

    return method_id, eur_id


# ── STEP 5: Sales Channel ─────────────────────────────────────────────────────
def setup_sales_channel(method_id, it_id=None, eu_ids=None):
    _step(5, 'Associazione al canale di vendita')

    channels = api('GET', '/sales-channel', params='?limit=10')
    if not channels.get('data'):
        _fail('Nessun sales channel trovato')
        return None

    # Preferisci Headless o prendi il primo
    channel = next(
        (ch for ch in channels['data']
         if 'headless' in ch.get('name', '').lower()),
        channels['data'][0]
    )
    channel_id = channel['id']
    _ok(f'Sales channel: "{channel["name"]}" ({channel_id})')

    # Aggiungi metodo spedizione alla lista del canale
    r = api('POST', f'/sales-channel/{channel_id}/shipping-method', {'id': method_id})
    if 'error' in r and r['error'] != 409:
        _warn(f'Aggiunta al canale: {r.get("msg", "")[:150]}')
    else:
        _ok('Metodo spedizione aggiunto al canale')

    # Imposta come default
    r2 = api('PATCH', f'/sales-channel/{channel_id}', {'shippingMethodId': method_id})
    if 'error' in r2:
        _warn(f'Set default shipping: {r2.get("msg", "")[:150]}')
    else:
        _ok('Impostato come metodo spedizione default')

    # Associa i paesi IT + EU al Sales Channel (necessario per Store API /country)
    if it_id and eu_ids is not None:
        country_ids = [it_id] + eu_ids
        added = 0
        for cid in country_ids:
            r3 = api('POST', f'/sales-channel/{channel_id}/countries', {'id': cid})
            if 'error' not in r3 or r3.get('error') == 409:
                added += 1
        _ok(f'Paesi associati al Sales Channel: {added}/{len(country_ids)}')

    return channel_id


# ── STEP 6: Property Group "Formato" ─────────────────────────────────────────
def setup_property_group():
    _step(6, 'Property Group "Formato" (varianti cappero)')

    existing = api('GET', '/property-group', params='?filter[name]=Formato')
    if existing.get('data'):
        group_id = existing['data'][0]['id']
        _ok(f'Gruppo "Formato" già presente: {group_id}')

        opts_res   = api('GET', f'/property-group/{group_id}/options', params='?limit=50')
        option_map = {o['name']: o['id'] for o in opts_res.get('data', [])}

        for name in FORMATO_OPTIONS:
            if name not in option_map:
                opt_id = uid()
                api('POST', '/property-group-option', {
                    'id':      opt_id,
                    'groupId': group_id,
                    'name':    name,
                })
                option_map[name] = opt_id
                _ok(f'Opzione aggiunta: {name}')

        _ok(f'Opzioni disponibili: {", ".join(option_map.keys())}')
        return group_id, option_map

    group_id   = uid()
    option_map = {}
    options    = []
    for i, name in enumerate(FORMATO_OPTIONS):
        opt_id = uid()
        option_map[name] = opt_id
        options.append({'id': opt_id, 'name': name, 'position': i})

    r = api('POST', '/property-group', {
        'id':          group_id,
        'name':        'Formato',
        'displayType': 'text',
        'sortingType': 'name',
        'options':     options,
    })
    if 'error' in r:
        _fail(f'Creazione property group: {r["msg"][:300]}')
        return None, {}

    _ok(f'Gruppo "Formato" creato: {group_id}')
    _ok(f'Opzioni: {", ".join(FORMATO_OPTIONS)}')
    return group_id, option_map


# ── STEP 7: Prodotti ──────────────────────────────────────────────────────────
def setup_products(eur_id, channel_id, option_map):
    _step(7, 'Creazione prodotti')

    # Cerca aliquota IVA 4% (alimentari di base) altrimenti usa la prima
    taxes = api('GET', '/tax', params='?limit=20')
    if not taxes.get('data'):
        _fail('Nessuna aliquota IVA trovata – aggiungine una in admin')
        return

    tax_id   = taxes['data'][0]['id']
    tax_rate = taxes['data'][0].get('taxRate', 22)
    for t in taxes.get('data', []):
        if t.get('taxRate') == 4:
            tax_id   = t['id']
            tax_rate = 4
            break

    _ok(f'Aliquota IVA usata: {tax_rate}% (modifica in admin se necessario)')

    base_gross = 9.90
    base_net   = round(base_gross / (1 + tax_rate / 100), 4)

    for i, (name, has_variants) in enumerate(PRODUCTS):
        num       = f'CAP-{i + 1:03d}'
        parent_id = uid()

        payload = {
            'id':            parent_id,
            'name':          name,
            'productNumber': num,
            'stock':         100,
            'taxId':         tax_id,
            'active':        True,
            'price': [{
                'currencyId': eur_id,
                'gross':      base_gross,
                'net':        base_net,
                'linked':     True,
            }],
            'visibilities': [{
                'salesChannelId': channel_id,
                'visibility':     30,  # 10=search, 20=nav, 30=all
            }],
        }

        if has_variants:
            payload['configuratorSettings'] = [
                {'optionId': option_map[v]} for v in FORMATO_OPTIONS
            ]

        r = api('POST', '/product', payload)
        if 'error' in r:
            _fail(f'"{name}": {r.get("msg", "")[:300]}')
            continue

        if has_variants:
            errors = 0
            for j, variant in enumerate(FORMATO_OPTIONS):
                vr = api('POST', '/product', {
                    'id':            uid(),
                    'parentId':      parent_id,
                    'productNumber': f'{num}-{j + 1:02d}',
                    'stock':         100,
                    'options':       [{'id': option_map[variant]}],
                })
                if 'error' in vr:
                    errors += 1
                    _warn(f'Variante "{variant}": {vr.get("msg", "")[:150]}')

            ok_count = len(FORMATO_OPTIONS) - errors
            _ok(f'"{name}" → {ok_count}/{len(FORMATO_OPTIONS)} varianti ({", ".join(FORMATO_OPTIONS)})')
        else:
            _ok(f'"{name}"')


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print('╔══════════════════════════════════════════════════════════╗')
    print('║       SETUP CAPPERIFICIO ECOMMERCE  –  Shopware 6        ║')
    print('╚══════════════════════════════════════════════════════════╝')
    print(f'  Backend : {BASE}')
    print(f'  Utente  : {ADMIN_USER}')
    print()

    try:
        authenticate()
    except Exception as e:
        print(f'\n✗ Autenticazione fallita: {e}')
        print('  → Verifica URL (--base), username e password (--pass)')
        sys.exit(1)

    setup_language()

    it_id, eu_ids = setup_countries()
    if not it_id:
        _fail('Paese IT non trovato – impossibile continuare')
        sys.exit(1)

    r_avail, r_it_lt50, r_it_gte50, r_eu = setup_rules(it_id, eu_ids)

    result = setup_shipping(r_avail, r_it_lt50, r_it_gte50, r_eu)
    if not result[0]:
        _fail('Setup spedizione fallito')
        sys.exit(1)
    method_id, eur_id = result

    channel_id = setup_sales_channel(method_id, it_id=it_id, eu_ids=eu_ids)
    if not channel_id:
        _fail('Sales channel non trovato')
        sys.exit(1)

    group_id, option_map = setup_property_group()

    setup_products(eur_id, channel_id, option_map)

    print()
    print('╔══════════════════════════════════════════════════════════╗')
    print('║  ✓  SETUP COMPLETATO!                                    ║')
    print('╚══════════════════════════════════════════════════════════╝')
    print("""
Configurato:
  ✓ Lingua Italiana
  ✓ Italia + 26 paesi UE abilitati per la spedizione
  ✓ Regole spedizione:
      - Italia <  50€  →  5€
      - Italia ≥  50€  →  GRATIS
      - Europa         →  10€
  ✓ Prodotti:
      - Cappero di Racale al sale marino       (4 varianti)
      - Cappero di Racale all'aceto di vino    (4 varianti)
      - Cucunci all'aceto di vino
      - Cucunci all'aceto di mele
      - Foglie di cappero all'aceto
      - Polvere di cappero di Racale

Prossimi passi:
  → Imposta i prezzi definitivi in admin (default: 9.90€)
  → Verifica l'aliquota IVA (lo script usa 4% se disponibile)
  → Aggiungi immagini ai prodotti
  → Configura Stripe/PayPal nei metodi di pagamento
  → Imposta la lingua italiana come default nel canale di vendita

  Admin: http://localhost:8080/admin
""")


if __name__ == '__main__':
    main()
