#!/usr/bin/env python3
"""
Aggiorna prezzi e mette sold-out tutti i prodotti Capperificio.

Prezzi:
  capperi  (CAP-001, CAP-002)               → 5 €
  cucunci  (CAP-003, CAP-004)               → 7 €
  foglie   (CAP-005)                        → vedi PRICE_MAP
  polvere  (CAP-006)                        → 8 €

Sold-out: stock=0, isCloseout=True su ogni prodotto e variante.

Uso:
  python scripts/update-prices-soldout.py
  python scripts/update-prices-soldout.py --base http://localhost:8090 --pass shopware
"""

import urllib.request, urllib.error, json, sys, os, pathlib

# ── Carica variabili d'ambiente da scripts/.env (se esiste) ──────────────────
def _load_env():
    env_path = pathlib.Path(__file__).parent / '.env'
    if env_path.exists():
        for line in env_path.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, _, v = line.partition('=')
                os.environ.setdefault(k.strip(), v.strip().strip('"\''))

_load_env()

# CLI args hanno la precedenza sulle env vars (utile per override rapido)
_args      = dict(zip(sys.argv[1::2], sys.argv[2::2]))
_base_raw  = _args.get('--base', os.environ.get('SHOPWARE_URL', '')).rstrip('/')
BASE       = _base_raw + '/api' if _base_raw and not _base_raw.endswith('/api') else _base_raw
ADMIN_USER = _args.get('--user', os.environ.get('SHOPWARE_ADMIN_USER', 'admin'))
ADMIN_PASS = _args.get('--pass', os.environ.get('SHOPWARE_ADMIN_PASS', ''))

if not BASE:
    sys.exit("❌  SHOPWARE_URL non impostata. Crea scripts/.env (vedi scripts/.env.example)")
if not ADMIN_PASS:
    sys.exit("❌  SHOPWARE_ADMIN_PASS non impostata. Crea scripts/.env (vedi scripts/.env.example)")

EUR_CURRENCY_ID = 'b7d2554b0ce847cd82f3ac9bd1c0dfca'
TAX_RATE        = 0.22  # IVA 22%

# productNumber → prezzo lordo (€)
PRICE_MAP = {
    'CAP-001': 5.0,
    'CAP-002': 5.0,
    'CAP-003': 7.0,
    'CAP-004': 7.0,
    'CAP-005': 5.0,   # Foglie di cappero — modifica se necessario
    'CAP-006': 8.0,
}

# ── Auth ──────────────────────────────────────────────────────────────────────
_headers = {}

def authenticate():
    global _headers
    data = json.dumps({
        'grant_type': 'password',
        'client_id':  'administration',
        'username':   ADMIN_USER,
        'password':   ADMIN_PASS,
        'scopes':     'write',
    }).encode()
    req = urllib.request.Request(
        f'{BASE}/oauth/token',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req) as r:
        token = json.loads(r.read())['access_token']
    _headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type':  'application/json',
        'Accept':        'application/json',
    }
    print('[OK] Autenticato')

def _req(method, path, body=None):
    data = json.dumps(body).encode() if body else None
    req  = urllib.request.Request(f'{BASE}{path}', data=data, headers=_headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        print(f'  [ERR] {method} {path} -> {e.code}: {e.read().decode()[:200]}')
        return None

def get_all_products():
    result = _req('POST', '/search/product', {
        'limit': 100,
        'filter': [{'type': 'equalsAny', 'field': 'productNumber', 'value': list(PRICE_MAP.keys())}],
        'includes': {'product': ['id', 'productNumber', 'name', 'parentId']},
    })
    return result.get('data', []) if result else []

def make_price(gross):
    net = round(gross / (1 + TAX_RATE), 10)
    return [{'currencyId': EUR_CURRENCY_ID, 'gross': gross, 'net': net, 'linked': True}]

def update_product(product_id, product_number, name):
    gross = PRICE_MAP[product_number]
    payload = {
        'price':       make_price(gross),
        'stock':       0,
        'isCloseout':  True,
    }
    res = _req('PATCH', f'/product/{product_id}', payload)
    if res is not None:
        print(f'  [OK] {name} ({product_number}) -> {gross}EUR, sold-out')
    return res

# ── Main ──────────────────────────────────────────────────────────────────────
authenticate()

print('\nRecupero prodotti...')
products = get_all_products()
print(f'  Trovati {len(products)} prodotti\n')

if not products:
    print('Nessun prodotto trovato. Controlla che i productNumber corrispondano.')
    sys.exit(1)

print('Aggiorno prezzi e stock...')
for p in products:
    pid   = p['id']
    attrs = p.get('attributes', p)  # JSON:API o flat
    pnum  = attrs.get('productNumber', '')
    pname = attrs.get('name', pnum)
    update_product(pid, pnum, pname)

print('\nFatto! Tutti i prodotti aggiornati.')
