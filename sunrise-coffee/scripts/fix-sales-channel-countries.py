#!/usr/bin/env python3
import urllib.request, urllib.error, json, sys

_args      = dict(zip(sys.argv[1::2], sys.argv[2::2]))
BASE       = _args.get('--base', 'http://157.90.241.97:8090').rstrip('/') + '/api'
ADMIN_USER = _args.get('--user', 'admin')
ADMIN_PASS = _args.get('--pass', 'shopware')

_h_get  = {}
_h_post = {}

def authenticate():
    global _h_get, _h_post
    req = urllib.request.Request(
        f'{BASE}/oauth/token',
        data=json.dumps({'client_id':'administration','grant_type':'password','scopes':'write','username':ADMIN_USER,'password':ADMIN_PASS}).encode(),
        headers={'Content-Type': 'application/json'}, method='POST',
    )
    with urllib.request.urlopen(req) as r:
        token = json.loads(r.read())['access_token']
    _h_get  = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
    _h_post = {**_h_get, 'Content-Type': 'application/json'}
    print('  v Autenticazione OK')

def api(method, path, data=None, params=''):
    url  = f'{BASE}{path}{params}'
    body = json.dumps(data).encode() if data is not None else None
    req  = urllib.request.Request(url, data=body, headers=_h_post if body else _h_get, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            txt = r.read()
            return json.loads(txt) if txt else {}
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'msg': e.read().decode()}

def main():
    try: authenticate()
    except Exception as e: print(f'Autenticazione fallita: {e}'); sys.exit(1)
    channels = api('GET', '/sales-channel', params='?limit=10')
    channel = next((ch for ch in channels.get('data',[]) if 'headless' in ch.get('name','').lower()), channels['data'][0])
    channel_id = channel['id']
    print(f'  v Sales channel: "{channel["name"]}"')
    res = api('GET', '/country', params='?filter[active]=1&limit=200')
    countries = res.get('data', [])
    print(f'  v Paesi attivi trovati: {len(countries)}')
    added = skipped = errors = 0
    for c in countries:
        r = api('POST', f'/sales-channel/{channel_id}/countries', {'id': c['id']})
        if 'error' not in r: added += 1
        elif r.get('error') == 409: skipped += 1
        else: errors += 1; print(f'  ! {c.get("iso","?")} - {r.get("msg","")[:80]}')
    print(f'\n  v Aggiunti: {added}  |  Gia presenti: {skipped}  |  Errori: {errors}')

if __name__ == '__main__': main()
