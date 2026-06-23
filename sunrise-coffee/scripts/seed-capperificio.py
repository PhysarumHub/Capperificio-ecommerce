#!/usr/bin/env python3
"""
Seed contenuti Capperificio Caro su Shopware 6 dal catalogo unico.

Sorgente dati: src/data/capperificioCatalog.json (stesso file usato dal frontend).
Per ogni prodotto fa UPSERT per productNumber:
  • trova → aggiorna       • manca → crea (a meno di --no-create)
e imposta:
  - nome + descrizione
  - Proprietà (scheda tecnica = primo screen: Origine, Ingredienti, ...)
  - Custom field (calibro, bullet, accordion = secondo screen "Suggerimenti d'uso")
  - Varianti per Foglie e Ho.Re.Ca (property group "Formato")

È IDEMPOTENTE: rilanciarlo non duplica nulla. Non sovrascrive MAI i prezzi
dei prodotti già esistenti (i prezzi non sono nel catalogo).

Prerequisito (per vedere i campi nell'admin): lanciare prima
  python scripts/setup-custom-fields.py --base ... --pass ...
I valori dei custom field vengono comunque scritti anche senza le definizioni.

Uso:
  python scripts/seed-capperificio.py --base http://localhost:8080 --pass shopware
  python scripts/seed-capperificio.py --base ... --pass ... --dry-run     # anteprima, non scrive
  python scripts/seed-capperificio.py --base ... --pass ... --no-create   # solo arricchimento, non crea prodotti
  python scripts/seed-capperificio.py --base ... --pass ... --price 12.90 # prezzo placeholder per i NUOVI prodotti
"""

import urllib.request, urllib.error, urllib.parse, json, uuid, sys, os

# ── Config (override via CLI) ───────────────────────────────────────────────
_flags = {a for a in sys.argv[1:] if a.startswith('--') and a in ('--dry-run', '--no-create')}
_argv  = [a for a in sys.argv[1:] if a not in _flags]
_args  = dict(zip(_argv[0::2], _argv[1::2]))

_base_raw   = _args.get('--base', 'http://localhost:8080').rstrip('/')
BASE        = _base_raw + '/api' if not _base_raw.endswith('/api') else _base_raw
ADMIN_USER  = _args.get('--user', 'admin')
ADMIN_PASS  = _args.get('--pass', 'shopware')
DRY_RUN     = '--dry-run' in _flags
NO_CREATE   = '--no-create' in _flags
PLACEHOLDER_PRICE = float(_args.get('--price', '9.90'))

CATALOG_JSON = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'capperificioCatalog.json')

# Mappa accordion (ordine JSON) → custom field HTML del frontend
BREW_KEYS = [
    'capperificio_brew_pour_over',
    'capperificio_brew_drip',
    'capperificio_brew_aeropress',
    'capperificio_brew_plunger',
]

# ── Auth + API ──────────────────────────────────────────────────────────────
_h_get, _h_post = {}, {}


def authenticate():
    global _h_get, _h_post
    req = urllib.request.Request(
        f'{BASE}/oauth/token',
        data=json.dumps({
            'client_id': 'administration',
            'grant_type': 'password',
            'scopes': 'write',
            'username': ADMIN_USER,
            'password': ADMIN_PASS,
        }).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req) as r:
        token = json.loads(r.read())['access_token']
    _h_get = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
    _h_post = {**_h_get, 'Content-Type': 'application/json'}
    _ok('Autenticazione OK')


def api(method, path, data=None, params=''):
    url = f'{BASE}{path}{params}'
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(
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


def write(method, path, data=None, params='', label=''):
    """Wrapper che rispetta --dry-run per le sole operazioni di scrittura."""
    if DRY_RUN:
        print(f'    [dry-run] {method} {path} {label}'.rstrip())
        return {}
    return api(method, path, data, params)


def uid():
    return str(uuid.uuid4()).replace('-', '')


def _step(n, msg):
    print(f'\n{"═" * 60}\n[{n}] {msg}\n{"═" * 60}')

def _ok(msg):   print(f'  ✓ {msg}')
def _warn(msg): print(f'  ⚠  {msg}')
def _fail(msg): print(f'  ✗ {msg}', file=sys.stderr)


# ── Lookup risorse di base (tax, currency, sales channel) ────────────────────
def get_tax_id():
    taxes = api('GET', '/tax', params='?limit=50')
    chosen = None
    for t in taxes.get('data', []):
        if t.get('taxRate') == 4:           # alimentari
            return t['id'], 4
        chosen = chosen or t
    if chosen:
        _warn(f'IVA 4% non trovata, uso {chosen.get("taxRate")}% — correggere in admin')
        return chosen['id'], chosen.get('taxRate', 22)
    return None, None


def get_currency_id():
    cur = api('GET', '/currency', params='?filter[isoCode]=EUR')
    return cur['data'][0]['id'] if cur.get('data') else None


def get_sales_channel_id():
    chs = api('GET', '/sales-channel', params='?limit=20')
    data = chs.get('data', [])
    if not data:
        return None
    ch = next((c for c in data if 'headless' in c.get('name', '').lower()), data[0])
    return ch['id']


# ── Property group / option (cache) ──────────────────────────────────────────
_group_cache = {}   # name -> group_id
_option_cache = {}  # (group_id, value) -> option_id


def ensure_group(name):
    if name in _group_cache:
        return _group_cache[name]
    existing = api('GET', '/property-group', params=f'?filter[name]={urllib.parse.quote(name)}')
    if existing.get('data'):
        gid = existing['data'][0]['id']
    else:
        gid = uid()
        r = write('POST', '/property-group', {
            'id': gid, 'name': name, 'displayType': 'text', 'sortingType': 'position',
        }, label=f'(gruppo "{name}")')
        if isinstance(r, dict) and 'error' in r:
            _fail(f'Gruppo "{name}": {r["msg"][:200]}')
            return None
        if not DRY_RUN:
            _ok(f'Gruppo proprietà creato: {name}')
    _group_cache[name] = gid
    return gid


def ensure_option(group_id, value):
    key = (group_id, value)
    if key in _option_cache:
        return _option_cache[key]
    # cerca opzione esistente nel gruppo
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


def property_option_ids(properties):
    """Da [[label, value|list], ...] → lista di optionId (ensure group+option)."""
    ids = []
    for label, value in properties:
        gid = ensure_group(label)
        if not gid:
            continue
        values = value if isinstance(value, list) else [value]
        for v in values:
            oid = ensure_option(gid, v)
            if oid:
                ids.append(oid)
    return ids


# ── Prodotti ──────────────────────────────────────────────────────────────────
def find_product(number):
    r = api('GET', '/product', params=f'?filter[productNumber]={urllib.parse.quote(number)}&limit=1')
    return r['data'][0] if r.get('data') else None


def build_custom_fields(entry):
    cf = {'capperificio_calibro': entry.get('calibro', '')}
    for i, b in enumerate(entry.get('bullets', [])[:3], start=1):
        cf[f'capperificio_bullet_{i}'] = b
    for i, sec in enumerate(entry.get('accordion', [])[:4]):
        cf[BREW_KEYS[i]] = sec['html']
    return cf


def create_product(entry, ctx):
    """Crea il prodotto (e le varianti se presenti). Ritorna l'id del padre."""
    tax_id, _ = ctx['tax']
    eur, channel = ctx['eur'], ctx['channel']
    gross = PLACEHOLDER_PRICE
    net = round(gross / (1 + (ctx['tax'][1] or 4) / 100), 4)
    pid = uid()

    payload = {
        'id': pid,
        'name': entry['name'],
        'productNumber': entry['productNumber'],
        'taxId': tax_id,
        'active': True,
        'stock': 0 if entry.get('variants') else 100,
        'price': [{'currencyId': eur, 'gross': gross, 'net': net, 'linked': True}],
        'visibilities': [{'salesChannelId': channel, 'visibility': 30}],
    }

    variants = entry.get('variants')
    if variants:
        gid = ensure_group(variants['group'])
        opt_ids = [ensure_option(gid, o) for o in variants['options']]
        payload['configuratorSettings'] = [{'optionId': o} for o in opt_ids if o]

    r = write('POST', '/product', payload, label=f'(crea {entry["productNumber"]} @ {gross:.2f}€)')
    if isinstance(r, dict) and 'error' in r:
        _fail(f'Creazione "{entry["name"]}": {r["msg"][:300]}')
        return None
    _ok(f'Creato: {entry["productNumber"]} — {entry["name"]} (prezzo placeholder {gross:.2f}€)')

    if variants:
        for sku, opt in zip(variants['skus'], variants['options']):
            oid = ensure_option(ensure_group(variants['group']), opt)
            vr = write('POST', '/product', {
                'id': uid(), 'parentId': pid, 'productNumber': sku,
                'stock': 100, 'options': [{'id': oid}],
            }, label=f'(variante {sku} = {opt})')
            if isinstance(vr, dict) and 'error' in vr:
                _warn(f'Variante {sku}: {vr["msg"][:160]}')
            else:
                _ok(f'  variante {sku} ({opt})')

    return pid


def enrich_product(pid, entry):
    """Imposta nome, descrizione, custom field e proprietà (idempotente)."""
    # 1) nome + descrizione + custom fields (PATCH sostituisce customFields per intero)
    write('PATCH', f'/product/{pid}', {
        'name': entry['name'],
        'description': entry['description'],
        'customFields': build_custom_fields(entry),
    }, label='(nome + descrizione + custom field)')

    # 2) proprietà (scheda tecnica) — link additivo, idempotente
    for oid in property_option_ids(entry['properties']):
        rr = write('POST', f'/product/{pid}/properties', {'id': oid}, label='(link proprietà)')
        if isinstance(rr, dict) and 'error' in rr and rr['error'] not in (400, 409):
            _warn(f'Link proprietà {oid}: {rr["msg"][:120]}')


def main():
    print('╔══════════════════════════════════════════════════════════╗')
    print('║   SEED CONTENUTI CAPPERIFICIO  –  Shopware 6             ║')
    print('╚══════════════════════════════════════════════════════════╝')
    print(f'  Backend  : {BASE}')
    print(f'  Catalogo : {os.path.relpath(CATALOG_JSON)}')
    print(f'  Modalità : {"DRY-RUN (nessuna scrittura)" if DRY_RUN else "SCRITTURA"}'
          f'{" · no-create" if NO_CREATE else ""}')
    print()

    with open(CATALOG_JSON, encoding='utf-8') as f:
        catalog = json.load(f)

    try:
        authenticate()
    except Exception as e:
        _fail(f'Autenticazione fallita: {e}')
        print('  → Verifica --base, --user, --pass')
        sys.exit(1)

    ctx = {
        'tax': get_tax_id(),
        'eur': get_currency_id(),
        'channel': get_sales_channel_id(),
    }
    if not all([ctx['tax'][0], ctx['eur'], ctx['channel']]):
        _fail('Risorse base mancanti (tax / EUR / sales channel). Configura Shopware prima.')
        sys.exit(1)
    _ok(f'IVA={ctx["tax"][1]}%  EUR ok  SalesChannel ok')

    _step('PRODOTTI', f'{len(catalog)} prodotti dal catalogo')
    created, enriched, skipped = 0, 0, 0

    for entry in catalog:
        num = entry['productNumber']
        print(f'\n  ── {num} · {entry["name"]}')
        existing = find_product(num)

        if existing:
            pid = existing['id']
            enrich_product(pid, entry)
            enriched += 1
            if not DRY_RUN:
                _ok('Aggiornato (contenuti)')
        elif NO_CREATE:
            _warn('Non trovato e --no-create attivo → skip')
            skipped += 1
        else:
            pid = create_product(entry, ctx)
            if pid:
                enrich_product(pid, entry)
                created += 1

    print()
    print('╔══════════════════════════════════════════════════════════╗')
    print(f'║  {"DRY-RUN COMPLETATO" if DRY_RUN else "SEED COMPLETATO"}'.ljust(59) + '║')
    print('╚══════════════════════════════════════════════════════════╝')
    print(f'  Creati: {created}   Aggiornati: {enriched}   Saltati: {skipped}')
    if not DRY_RUN:
        print("""
Prossimi passi:
  → Imposta i PREZZI reali in admin (IVA 4%) — i nuovi prodotti hanno un placeholder.
  → Carica le immagini e imposta la cover di ogni prodotto.
  → Per la linea Ho.Re.Ca: assegna la categoria/canale B2B (scripts/setup-b2b.py).
  → Se non l'hai fatto: python scripts/setup-custom-fields.py  (per editare i campi in admin).
  → Verifica la product page: scheda tecnica, badge calibro, bullet, accordion.
""")


if __name__ == '__main__':
    main()
