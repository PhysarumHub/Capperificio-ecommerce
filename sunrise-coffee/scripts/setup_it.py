import urllib.request, urllib.error, json, uuid, sys, os

# Credenziali da scripts/.env (o --base/--user/--pass). Vedi scripts/_config.py.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _config import shopware_config

_cfg = shopware_config()
BASE = _cfg.api_base

req = urllib.request.Request(
    f'{BASE}/oauth/token',
    data=json.dumps({'client_id':'administration','grant_type':'password','scopes':'write','username':_cfg.user,'password':_cfg.password}).encode(),
    headers={'Content-Type':'application/json'},
    method='POST'
)
with urllib.request.urlopen(req) as r:
    token = json.loads(r.read())['access_token']

h_get  = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
h_post = {**h_get, 'Content-Type': 'application/json'}

def api(method, path, data=None):
    url = f'{BASE}{path}'
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=h_post if data else h_get, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            txt = r.read()
            return json.loads(txt) if txt else {}
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'msg': e.read().decode()[:500]}

LOCALE_IT = '01994d2399a971cabca0b9da924e3ab7'

# 1. Trova la lingua padre (English)
langs = api('GET', '/language?filter[name]=English')
parent_id = langs['data'][0]['id']
print(f'Parent lang (English): {parent_id}')

# 2. Crea lingua Italiano (se non esiste)
existing = api('GET', '/language?filter[name]=Italiano')
if existing.get('data'):
    lang_id = existing['data'][0]['id']
    print(f'Italiano gia presente: {lang_id}')
else:
    lang_id = str(uuid.uuid4()).replace('-', '')
    result = api('POST', '/language', {
        'id': lang_id,
        'name': 'Italiano',
        'localeId': LOCALE_IT,
        'parentId': parent_id
    })
    if 'error' in result:
        print(f'Errore creazione lingua: {result}')
    else:
        print(f'Lingua Italiano creata: {lang_id}')

# 3. Abilita Italia come paese di spedizione
countries = api('GET', '/country?filter[iso]=IT')
if countries.get('data'):
    italy = countries['data'][0]
    italy_id = italy['id']
    print(f'Italia trovata (id: {italy_id}, active: {italy["active"]})')
    result = api('PATCH', f'/country/{italy_id}', {
        'active': True,
        'shippingAvailable': True
    })
    if 'error' in result:
        print(f'Errore abilitazione Italia: {result}')
    else:
        print('Italia abilitata come paese di spedizione OK')
else:
    print('Paese IT non trovato')
