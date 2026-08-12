#!/usr/bin/env python3
"""
Aggiorna CAP-001 (capperi al sale) in Shopware con i dati del catalogo locale.

CAP-001 è un prodotto con varianti per calibro:
  CAP-001-01 → Lilliput
  CAP-001-02 → Occhio di pernice
  CAP-001-03 → Lacrimella
  CAP-001-04 → Capperone

Il padre riceve: descrizione generale, proprietà condivise (Origine, Ingredienti),
  bullets generali, accordion generali.
Ogni variante riceve: calibro, bullets e accordion specifici per quel calibro.

Uso:
  python scripts/seed-calibri.py --base http://HOST:8090 --pass LA_TUA_PASSWORD
  python scripts/seed-calibri.py --base http://HOST:8090 --pass LA_TUA_PASSWORD --dry-run
"""

import urllib.request, urllib.error, urllib.parse, json, uuid, sys, os

_flags = {a for a in sys.argv[1:] if a.startswith('--') and a in ('--dry-run',)}
_argv  = [a for a in sys.argv[1:] if a not in _flags]
_args  = dict(zip(_argv[0::2], _argv[1::2]))

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _config import shopware_config

_cfg       = shopware_config()
BASE       = _cfg.api_base
ADMIN_USER = _cfg.user
ADMIN_PASS = _cfg.password
DRY_RUN    = '--dry-run' in _flags

# ── Dati catalogo inline (da capperificioCatalog.json) ────────────────────────

PARENT_DATA = {
    'description': (
        'I Capperi di Racale al Sale Marino, classificati artigianalmente per calibro: '
        'dal minuscolo <strong>Lilliput</strong> al pregiato <strong>Occhio di Pernice</strong>, '
        'alla carnosa <strong>Lacrimella</strong> fino al deciso <strong>Capperone</strong>. '
        'Ogni calibro rispecchia una fase diversa di raccolta e un profilo aromatico unico. '
        'Raccolti a mano nel cuore del Salento, conservati con il solo sale marino integrale '
        'senza additivi né conservanti. A Racale siamo gli unici a selezionarli uno per uno, '
        'calibro per calibro: un gesto di precisione che valorizza ogni sfumatura di gusto.'
    ),
    'bullets': [
        'Raccolti a mano e classificati per calibro a Racale, nel cuore del Salento',
        'Conservati solo con sale marino integrale — nessun additivo né conservante',
        'Scegli il calibro: dal minuto Lilliput al carnoso Capperone',
    ],
    'properties': [
        ['Origine', 'Racale (Salento, Puglia)'],
        ['Ingredienti', 'Capperi 80% – Sale marino integrale 20%'],
    ],
    'accordion': [
        {'name': 'In cucina', 'html': '<p>Versatili in cucina: esalta insalate, primi piatti, salse e preparazioni dove il cappero deve profumare senza coprire gli altri ingredienti.</p>'},
        {'name': 'Conservazione', 'html': '<p>Conservare in luogo fresco e asciutto. Mantenere i capperi coperti dal sale dopo l\'apertura.</p>'},
        {'name': 'Lo sapevi?', 'html': '<p>A Racale siamo gli unici a classificare i capperi per calibro, uno per uno: un gesto artigianale che trasforma un semplice cappero in un\'esperienza di gusto.</p>'},
    ],
}

VARIANT_DATA = {
    'Lilliput': {
        'calibro': 'Lilliput · Ø 4–6 mm',
        'bullets': [
            'Lilliput (Ø 4–6 mm): il calibro più piccolo e pregiato, la nostra firma — fragrante e persistente',
            'Selezionato uno per uno, l\'eccellenza per la cucina gourmet',
            'L\'essenza del Mediterraneo in ogni bocciolo',
        ],
        'accordion': [
            {'name': 'In cucina', 'html': '<p>Perfetto crudo o a fine cottura su carpacci, tartare, primi piatti e finger food gourmet.</p>'},
            {'name': 'Abbinamenti', 'html': '<p>Eccelle con pesce crudo, burrata, ricci di mare e piatti della ristorazione raffinata.</p>'},
            {'name': 'Conservazione', 'html': '<p>Conservare in luogo fresco e asciutto. Mantenere i capperi coperti dal sale dopo l\'apertura.</p>'},
            {'name': 'Lo sapevi?', 'html': '<p>Fu Nonno Quintino a ideare per primo questo calibro minuscolo, poi battezzato dalla famiglia "Lilliput": dimensioni ridottissime ma un concentrato di sapore straordinario.</p>'},
        ],
        'properties': [
            ['Calibro', 'Lilliput · Ø 4–6 mm'],
            ['Note di gusto', ['Intenso', 'Fragrante', 'Persistente']],
            ['Ideale per', 'Cucina gourmet, crudi, finger food'],
        ],
    },
    'Occhio di pernice': {
        'calibro': 'Occhio di Pernice · Piccolo · Ø 6–9 mm',
        'bullets': [
            'Occhio di Pernice (calibro Piccolo, Ø 6–9 mm): il più versatile ed equilibrato della selezione',
            'Raccolto e selezionato a mano a Racale',
            'Esalta i piatti senza coprirli',
        ],
        'accordion': [
            {'name': 'In cucina', 'html': '<p>Ideale per insalate, primi piatti e salse: esalta senza coprire gli altri ingredienti.</p>'},
            {'name': 'Abbinamenti', 'html': '<p>Equilibrato e armonioso, si sposa con pesce, verdure e formaggi freschi.</p>'},
            {'name': 'Conservazione', 'html': '<p>Conservare in luogo fresco e asciutto. Mantenere i capperi coperti dal sale dopo l\'apertura.</p>'},
            {'name': 'Lo sapevi?', 'html': '<p>A Racale siamo gli unici a classificare i capperi per calibro, uno per uno.</p>'},
        ],
        'properties': [
            ['Calibro', 'Occhio di Pernice (Piccolo) · Ø 6–9 mm'],
            ['Note di gusto', ['Sapido', 'Equilibrato', 'Floreale']],
            ['Ideale per', 'Insalate, primi piatti, salse'],
        ],
    },
    'Lacrimella': {
        'calibro': 'Lacrimella · Medio · Ø 9–11 mm',
        'bullets': [
            'Lacrimella (calibro Medio, Ø 9–11 mm): polpa carnosa, gusto pieno ma non invadente',
            'Morbido e leggermente dolce, versatile in cucina',
            'Perfetto per i piatti di tutti i giorni',
        ],
        'accordion': [
            {'name': 'In cucina', 'html': '<p>Ottimo nel riso e nelle paste fredde: si fonde con gli altri ingredienti esaltandoli. Perfetto anche per ragù di pesce, caponata, farciture e salse agrodolci.</p>'},
            {'name': 'Abbinamenti', 'html': '<p>Si abbina a pesce, verdure agrodolci, paste fresche, antipasti e farciture.</p>'},
            {'name': 'Conservazione', 'html': '<p>Conservare in luogo fresco e asciutto. Mantenere i capperi coperti dal sale dopo l\'apertura.</p>'},
            {'name': 'Lo sapevi?', 'html': '<p>Con la maturazione il cappero medio diventa più morbido e leggermente più dolce dei calibri piccoli.</p>'},
        ],
        'properties': [
            ['Calibro', 'Lacrimella (Medio) · Ø 9–11 mm'],
            ['Note di gusto', ['Pieno', 'Morbido', 'Leggermente dolce']],
            ['Ideale per', 'Risi, paste fredde, salse agrodolci'],
        ],
    },
    'Capperone': {
        'calibro': 'Capperone · Ø 12–15 mm',
        'bullets': [
            'Capperone (Ø 12–15 mm): il calibro più grande, carnoso e dal sapore marcato',
            'Mantiene l\'aroma anche dopo la cottura',
            'Ottimo tritato o disidratato',
        ],
        'accordion': [
            {'name': 'In cucina', 'html': '<p>Perfetto tritato o disidratato, in piatti cotti, sughi e secondi: rilascia aroma anche a fine cottura.</p>'},
            {'name': 'Abbinamenti', 'html': '<p>Ideale con carni, sughi corposi e preparazioni che richiedono un cappero deciso.</p>'},
            {'name': 'Conservazione', 'html': '<p>Conservare in luogo fresco e asciutto. Mantenere i capperi coperti dal sale dopo l\'apertura.</p>'},
            {'name': 'Lo sapevi?', 'html': '<p>Quello che nasce nel terreno racalino non è una semplice variante di qualcosa di già noto, ma un prodotto che trasuda autenticità, carattere e appartenenza.</p>'},
        ],
        'properties': [
            ['Calibro', 'Capperone · Ø 12–15 mm'],
            ['Note di gusto', ['Marcato', 'Carnoso', 'Aromatico']],
            ['Ideale per', 'Cotture, sughi, tritato o disidratato'],
        ],
    },
}

BREW_KEYS = [
    'capperificio_brew_pour_over',
    'capperificio_brew_drip',
    'capperificio_brew_aeropress',
    'capperificio_brew_plunger',
]

# ── Auth + API ────────────────────────────────────────────────────────────────

_h_get, _h_post = {}, {}

def authenticate():
    global _h_get, _h_post
    req = urllib.request.Request(
        f'{BASE}/oauth/token',
        data=json.dumps({'client_id': 'administration', 'grant_type': 'password',
                         'scopes': 'write', 'username': 'admin', 'password': ADMIN_PASS}).encode(),
        headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as r:
        token = json.loads(r.read())['access_token']
    _h_get  = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
    _h_post = {**_h_get, 'Content-Type': 'application/json'}
    print('  ✓ Autenticazione OK')


def api(method, path, data=None, params=''):
    url = f'{BASE}{path}{params}'
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body,
                                 headers=_h_post if body else _h_get, method=method)
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


def _ok(msg):   print(f'  ✓ {msg}')
def _warn(msg): print(f'  ⚠  {msg}')
def _fail(msg): print(f'  ✗ {msg}', file=sys.stderr)

# ── Property group / option cache ────────────────────────────────────────────

_group_cache  = {}
_option_cache = {}


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
    res = api('GET', f'/property-group/{group_id}/options',
              params=f'?filter[name]={urllib.parse.quote(value)}&limit=1')
    if res.get('data'):
        oid = res['data'][0]['id']
    else:
        oid = uid()
        r = write('POST', '/property-group-option',
                  {'id': oid, 'groupId': group_id, 'name': value},
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
            rr = write('POST', f'/product/{pid}/properties', {'id': oid},
                       label=f'(link {label}={v})')
            if isinstance(rr, dict) and 'error' in rr and rr['error'] not in (400, 409):
                _warn(f'Link {label}={v}: {rr["msg"][:120]}')


def build_cf(bullets, accordion):
    cf = {}
    for i, b in enumerate(bullets[:3], 1):
        cf[f'capperificio_bullet_{i}'] = b
    for i, sec in enumerate(accordion[:4]):
        cf[BREW_KEYS[i]] = sec['html']
    return cf


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print('╔══════════════════════════════════════════════════════════╗')
    print('║   SEED CALIBRI CAP-001  –  Shopware 6                   ║')
    print('╚══════════════════════════════════════════════════════════╝')
    print(f'  Backend  : {BASE}')
    print(f'  Modalità : {"DRY-RUN" if DRY_RUN else "SCRITTURA"}\n')

    try:
        authenticate()
    except Exception as e:
        _fail(f'Autenticazione fallita: {e}')
        sys.exit(1)

    # ── 1. Trova il padre CAP-001 ─────────────────────────────────────────────
    r = api('GET', '/product', params='?filter[productNumber]=CAP-001&limit=1')
    if not r.get('data'):
        _fail('Prodotto CAP-001 non trovato in Shopware.')
        sys.exit(1)
    parent = r['data'][0]
    pid = parent['id']
    _ok(f'CAP-001 trovato: id={pid}')

    # ── 2. Aggiorna il padre con dati generali ────────────────────────────────
    print('\n  [Padre] aggiorno descrizione, bullets e accordion generali...')
    parent_cf = build_cf(PARENT_DATA['bullets'], PARENT_DATA['accordion'])
    write('PATCH', f'/product/{pid}', {
        'description': PARENT_DATA['description'],
        'customFields': parent_cf,
    }, label='(padre: descrizione + customFields)')
    link_properties(pid, PARENT_DATA['properties'])
    if not DRY_RUN:
        _ok('Padre aggiornato')

    # ── 3. Varianti ───────────────────────────────────────────────────────────
    # Recupera figli con le opzioni
    rv = api('POST', '/search/product', {
        'filter': [{'type': 'equals', 'field': 'parentId', 'value': pid}],
        'associations': {'options': {'associations': {'group': {}}}},
        'limit': 50,
    })
    children = rv.get('data', [])
    print(f'\n  Trovate {len(children)} varianti figlie.')

    for child in children:
        cid  = child['id']
        cnum = child.get('productNumber', '?')
        # Determina il nome del calibro dall'opzione
        calibro_name = None
        for opt in (child.get('options') or []):
            grp = opt.get('group') or {}
            if (grp.get('name') or '').lower() == 'formato':
                calibro_name = opt.get('name') or opt.get('translated', {}).get('name')
                break

        if not calibro_name:
            _warn(f'{cnum}: nessuna opzione "Formato" trovata — skip')
            continue

        data = VARIANT_DATA.get(calibro_name)
        if not data:
            _warn(f'{cnum}: nessun dato per calibro "{calibro_name}" — skip')
            continue

        print(f'\n  [{cnum} · {calibro_name}] aggiorno customFields + proprietà...')
        cf = {'capperificio_calibro': data['calibro']}
        cf.update(build_cf(data['bullets'], data['accordion']))
        write('PATCH', f'/product/{cid}', {'customFields': cf},
              label=f'(variante {calibro_name}: customFields)')
        link_properties(cid, data['properties'])
        if not DRY_RUN:
            _ok(f'{cnum} ({calibro_name}) aggiornato')

    print()
    print('╔══════════════════════════════════════════════════════════╗')
    print(f'║  {"DRY-RUN COMPLETATO" if DRY_RUN else "SEED CALIBRI COMPLETATO"}'.ljust(59) + '║')
    print('╚══════════════════════════════════════════════════════════╝')
    if not DRY_RUN:
        print("""
Prossimi passi:
  → Verifica la product page /product/cappero-di-racale-al-sale-marino
  → Seleziona ogni calibro e verifica badge, bullets e accordion.
""")


if __name__ == '__main__':
    main()
