#!/usr/bin/env python3
"""
Seed di TEST: aggiunge 4 sotto-varianti calibro (Lilliput, Occhio di Pernice,
Lacrimella, Capperone) al prodotto REALE già esistente "Capperi al Sale"
(CAPRACALE-SALE-01), per testare in locale badge calibro, scheda tecnica,
bullet e la sezione "Guida al calibro".

Riusa gli stessi dati di scripts/seed-caro-completo.py (variante CAP-SALE),
ma li applica al productNumber già presente in questa istanza Shopware
invece di crearne uno nuovo — evita di duplicare il catalogo.

Idempotente: rieseguire non duplica nulla.

Uso:
  python scripts/seed-test-calibro-subvarianti.py --base http://localhost:8090 --pass shopware
  python scripts/seed-test-calibro-subvarianti.py --base URL --pass PWD --dry-run
"""

import sys, pathlib, urllib.request, urllib.error, urllib.parse, json, uuid

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _config import shopware_config

_cfg = shopware_config()
BASE, ADMIN_USER, ADMIN_PASS = _cfg.api_base, _cfg.user, _cfg.password
DRY_RUN = '--dry-run' in sys.argv

PARENT_PRODUCT_NUMBER = 'CAPRACALE-SALE-01'
VARIANT_GROUP = 'Calibro'

VARIANTS = [
    {
        'productNumber': 'CAP-SALE-LILLIPUT',
        'option': 'Lilliput',
        'price': 5.50,
        'stock': 100,
        'shippingWeight': 0.20,
        'properties': [
            ('Calibro', 'Lilliput · Ø 4–6 mm'),
            ('Peso netto', '75 g'),
            ('Note di gusto', ['Intenso', 'Fragrante', 'Persistente', 'Floreale']),
            ('Ideale per', 'Cucina gourmet, crudi, finger food'),
        ],
        'customFields': {
            'capperificio_calibro': 'Lilliput · Ø 4–6 mm',
            'capperificio_bullet_1': '**Lilliput** (Ø 4–6 mm): il calibro più piccolo e pregiato, la firma del Capperificio Caro',
            'capperificio_bullet_2': 'Selezionato uno per uno a mano nei campi di Racale',
            'capperificio_bullet_3': 'Concentrato di aromi mediterranei, non di sale',
            'capperificio_brew_pour_over': '<p>Aggiungilo crudo a fine cottura: su carpacci, tartare, burrata o crema di fave.</p>',
            'capperificio_brew_drip': '<p>Perfetto con pesce crudo, burrata pugliese e formaggi freschi.</p>',
            'capperificio_brew_plunger': '<p>Fu Nonno Quintino a valorizzare questi boccioli minuscoli, battezzandoli "Lilliput": il nome racconta tutto.</p>',
        },
    },
    {
        'productNumber': 'CAP-SALE-OCCHIO',
        'option': 'Occhio di Pernice',
        'price': 5.50,
        'stock': 100,
        'shippingWeight': 0.30,
        'properties': [
            ('Calibro', 'Occhio di Pernice · Ø 7–9 mm'),
            ('Peso netto', '150 g'),
            ('Note di gusto', ['Sapido', 'Equilibrato', 'Floreale', 'Erbaceo']),
            ('Ideale per', 'Insalate, primi piatti, salse, uso quotidiano'),
        ],
        'customFields': {
            'capperificio_calibro': 'Occhio di Pernice · Ø 7–9 mm',
            'capperificio_bullet_1': '**Occhio di Pernice** (Ø 7–9 mm): il più versatile della selezione',
            'capperificio_bullet_2': 'Sapidità fine, mai invadente — il punto di partenza ideale',
            'capperificio_bullet_3': 'Ottimo intero, tritato o in infusione nell\'olio extravergine',
            'capperificio_brew_pour_over': '<p>Versatile ovunque: intero nelle insalate, tritato nelle salse, in infusione nell\'olio.</p>',
            'capperificio_brew_drip': '<p>Con pesce al forno, verdure grigliate e pasta alla puttanesca.</p>',
            'capperificio_brew_plunger': '<p>A Racale classifichiamo i capperi per calibro uno per uno: una precisione che non esiste altrove in Italia.</p>',
        },
    },
    {
        'productNumber': 'CAP-SALE-LACRIMELLA',
        'option': 'Lacrimella',
        'price': 5.50,
        'stock': 100,
        'shippingWeight': 0.42,
        'properties': [
            ('Calibro', 'Lacrimella · Ø 9–11 mm'),
            ('Peso netto', '250 g'),
            ('Note di gusto', ['Pieno', 'Carnoso', 'Morbido', 'Leggermente dolce']),
            ('Ideale per', 'Caponata, ragù di pesce, pasta fredda'),
        ],
        'customFields': {
            'capperificio_calibro': 'Lacrimella · Ø 9–11 mm',
            'capperificio_bullet_1': '**Lacrimella** (Ø 9–11 mm): polpa carnosa, gusto pieno e rotondo',
            'capperificio_bullet_2': 'Regge la cottura senza perdere struttura né aroma',
            'capperificio_bullet_3': 'Il cappero che convince anche chi credeva di non amarli',
            'capperificio_brew_pour_over': '<p>Perfetta in caponata, ragù di pesce e pasta alla Norma. La polpa carnosa regge la cottura.</p>',
            'capperificio_brew_drip': '<p>Con melanzane, pomodori secchi, tonno sott\'olio e acciughe.</p>',
            'capperificio_brew_plunger': '<p>La polpa più spessa del calibro medio trattiene meglio i succhi durante la cottura.</p>',
        },
    },
    {
        'productNumber': 'CAP-SALE-CAPPERONE',
        'option': 'Capperone',
        'price': 5.50,
        'stock': 100,
        'shippingWeight': 0.42,
        'properties': [
            ('Calibro', 'Capperone · Ø 12–15 mm'),
            ('Peso netto', '250 g'),
            ('Note di gusto', ['Marcato', 'Carnoso', 'Aromatico', 'Persistente']),
            ('Ideale per', 'Sughi lunghi, tritato, disidratato, secondi'),
        ],
        'customFields': {
            'capperificio_calibro': 'Capperone · Ø 12–15 mm',
            'capperificio_bullet_1': '**Capperone** (Ø 12–15 mm): il più grande e audace, resiste alle cotture lunghe',
            'capperificio_bullet_2': 'Alta concentrazione di oli essenziali: sprigiona aroma a lungo',
            'capperificio_bullet_3': 'Perfetto tritato in sugo o disidratato come insaporitore',
            'capperificio_brew_pour_over': '<p>Ideale nei sughi lunghi e nelle cotture in casseruola. Ottimo tritato su bruschette con pomodoro e origano.</p>',
            'capperificio_brew_drip': '<p>Con carni saporite, pesce azzurro e piatti della cucina salentina tradizionale.</p>',
            'capperificio_brew_plunger': '<p>Il Capperone viene raccolto pochi giorni prima che il bocciolo diventi cucuncio.</p>',
        },
    },
]

_h_get, _h_post = {}, {}


def authenticate():
    global _h_get, _h_post
    req = urllib.request.Request(
        f'{BASE}/oauth/token',
        data=json.dumps({'client_id': 'administration', 'grant_type': 'password',
                          'scopes': 'write', 'username': ADMIN_USER, 'password': ADMIN_PASS}).encode(),
        headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as r:
        token = json.loads(r.read())['access_token']
    _h_get = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
    _h_post = {**_h_get, 'Content-Type': 'application/json'}
    print('  ✓ Autenticazione OK')


def api(method, path, data=None, params=''):
    url = f'{BASE}{path}{params}'
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=_h_post if body is not None else _h_get, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            txt = r.read()
            return json.loads(txt) if txt else {}
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'msg': e.read().decode()}


def write(method, path, data=None, params='', label=''):
    if DRY_RUN:
        print(f'    [dry-run] {method} {path} {label}'.rstrip())
        return {}
    return api(method, path, data, params)


def uid():
    return str(uuid.uuid4()).replace('-', '')


def _ok(msg): print(f'  ✓ {msg}')
def _warn(msg): print(f'  ⚠  {msg}')
def _fail(msg): print(f'  ✗ {msg}', file=sys.stderr)


_group_cache, _option_cache = {}, {}


def ensure_group(name):
    if name in _group_cache:
        return _group_cache[name]
    existing = api('GET', '/property-group', params=f'?filter[name]={urllib.parse.quote(name)}')
    if existing.get('data'):
        gid = existing['data'][0]['id']
    else:
        gid = uid()
        r = write('POST', '/property-group',
                   {'id': gid, 'name': name, 'displayType': 'text', 'sortingType': 'position'},
                   label=f'(gruppo "{name}")')
        if isinstance(r, dict) and 'error' in r:
            _fail(f'Gruppo "{name}": {r["msg"][:200]}')
            return None
        if not DRY_RUN:
            _ok(f'Gruppo "{name}" creato')
    _group_cache[name] = gid
    return gid


def ensure_option(group_id, value):
    key = (group_id, value)
    if key in _option_cache:
        return _option_cache[key]
    res = api('GET', f'/property-group/{group_id}/options', params=f'?filter[name]={urllib.parse.quote(value)}&limit=1')
    if res.get('data'):
        oid = res['data'][0]['id']
    else:
        oid = uid()
        r = write('POST', '/property-group-option', {'id': oid, 'groupId': group_id, 'name': value},
                   label=f'(opzione "{value}")')
        if isinstance(r, dict) and 'error' in r:
            _fail(f'Opzione "{value}": {r["msg"][:200]}')
            return None
    _option_cache[key] = oid
    return oid


def link_properties(pid, properties):
    for label, value in properties:
        gid = ensure_group(label)
        if not gid:
            continue
        values = value if isinstance(value, list) else [value]
        for v in values:
            oid = ensure_option(gid, v)
            if not oid:
                continue
            rr = write('POST', f'/product/{pid}/properties', {'id': oid}, label=f'(link {label}={v})')
            if isinstance(rr, dict) and 'error' in rr and rr['error'] not in (400, 409):
                _warn(f'Link {label}={v}: {rr["msg"][:120]}')


def find_product(number):
    r = api('GET', '/product', params=f'?filter[productNumber]={urllib.parse.quote(number)}&limit=1')
    return r['data'][0] if r.get('data') else None


def main():
    print('╔══════════════════════════════════════════════════════════╗')
    print('║   SEED TEST — sotto-varianti calibro su Capperi al Sale ║')
    print('╚══════════════════════════════════════════════════════════╝')
    print(f'  Backend  : {BASE}')
    print(f'  Modalità : {"DRY-RUN" if DRY_RUN else "SCRITTURA"}\n')

    try:
        authenticate()
    except Exception as e:
        _fail(f'Autenticazione fallita: {e}')
        sys.exit(1)

    parent = find_product(PARENT_PRODUCT_NUMBER)
    if not parent:
        _fail(f'Prodotto padre "{PARENT_PRODUCT_NUMBER}" non trovato.')
        sys.exit(1)
    pid = parent['id']
    _ok(f'Padre "{PARENT_PRODUCT_NUMBER}" trovato: id={pid}')

    # Trova valuta EUR (per il prezzo delle varianti)
    cur = api('GET', '/currency', params='?filter[isoCode]=EUR')
    eur = cur['data'][0]['id'] if cur.get('data') else None
    if not eur:
        _fail('Valuta EUR non trovata.')
        sys.exit(1)
    # Aliquota IVA del padre (le varianti la ereditano di default, ma serve per calcolare il net)
    tax_rate = 10

    gid = ensure_group(VARIANT_GROUP)
    if not gid:
        sys.exit(1)
    opt_ids = []
    for v in VARIANTS:
        oid = ensure_option(gid, v['option'])
        if oid:
            opt_ids.append(oid)

    print(f'\n  [Padre] collego {len(opt_ids)} opzioni "{VARIANT_GROUP}" come configuratore...')
    write('PATCH', f'/product/{pid}', {
        'configuratorSettings': [{'optionId': o} for o in opt_ids],
    }, label='(padre: configuratorSettings)')
    if not DRY_RUN:
        _ok('Configuratore collegato al padre')

    # Proprietà condivise sul padre (Origine, Ingredienti): senza queste, non
    # appena una variante ha le sue properties (Calibro, Peso netto...) quelle
    # del padre spariscono dalla tabella invece di restare accanto.
    link_properties(pid, [
        ('Origine', 'Racale (Salento, Puglia)'),
        ('Ingredienti', 'Capperi 80% – Sale marino integrale 20%'),
    ])
    if not DRY_RUN:
        _ok('Proprietà condivise (Origine, Ingredienti) collegate al padre')

    for variant in VARIANTS:
        vnum = variant['productNumber']
        vexisting = find_product(vnum)
        if vexisting:
            vid = vexisting['id']
            _ok(f'Variante {vnum} già esistente: id={vid}')
        else:
            vid = uid()
            vgross = variant['price']
            vnet = round(vgross / (1 + tax_rate / 100), 4)
            oid = ensure_option(gid, variant['option'])
            vpayload = {
                'id': vid,
                'parentId': pid,
                'productNumber': vnum,
                'stock': variant.get('stock', 100),
                'price': [{'currencyId': eur, 'gross': vgross, 'net': vnet, 'linked': True}],
                'options': [{'id': oid}],
            }
            if variant.get('shippingWeight'):
                vpayload['weight'] = variant['shippingWeight']
            vr = write('POST', '/product', vpayload, label=f'(variante {vnum})')
            if isinstance(vr, dict) and 'error' in vr:
                _warn(f'Creazione variante {vnum}: {vr["msg"][:200]}')
                continue
            if not DRY_RUN:
                _ok(f'Variante {vnum} ({variant["option"]}) creata @ {vgross:.2f}€')

        write('PATCH', f'/product/{vid}', {'customFields': variant.get('customFields', {})},
              label=f'(variante {vnum}: customFields)')
        link_properties(vid, variant.get('properties', []))
        if not DRY_RUN:
            _ok(f'Variante {vnum} arricchita (customFields + properties)')

    print()
    print('╔══════════════════════════════════════════════════════════╗')
    print(f'║  {"DRY-RUN COMPLETATO" if DRY_RUN else "SEED TEST COMPLETATO"}'.ljust(59) + '║')
    print('╚══════════════════════════════════════════════════════════╝')
    if not DRY_RUN:
        print('\nApri http://localhost:5173/prodotti/capperi-al-sale e seleziona ogni calibro.\n')


if __name__ == '__main__':
    main()
