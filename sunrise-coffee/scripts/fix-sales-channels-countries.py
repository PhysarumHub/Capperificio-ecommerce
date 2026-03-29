#!/usr/bin/env python3
"""
Quick-fix: associa tutti i paesi attivi (IT + EU) al Sales Channel.
Shopware Store API /country restituisce solo i paesi assegnati al Sales Channel,
quindi senza questa associazione nel checkout appare solo UK e DE (default Shopware).

Uso:
  python scripts/fix-sales-channel-countries.py
  python scripts/fix-sales-channel-countries.py --base http://localhost:8080 --pass mia_password
"""

import urllib.request, urllib.error, json, sys

_args      = dict(zip(sys.argv[1::2], sys.argv[2::2]))
BASE       = _args.get('--base', 'http://SHOPWARE_HOST_REDACTED:8090').rstrip('/') + '/api'
ADMIN_USER = _args.get('--user', 'admin')
ADMIN_PASS = _args.get('--pass', 'shopware')

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


def main():
    print('\n' + '═' * 58)
    print('  Fix: associazione paesi al Sales Channel')
    print('═' * 58)

    try:
        authenticate()
    except Exception as e:
        print(f'\n✗ Autenticazione fallita: {e}')
        sys.exit(1)

    # Trova il Sales Channel (preferisce Headless)
    channels = api('GET', '/sales-channel', params='?limit=10')
    if not channels.get('data'):
        print('✗ Nessun sales channel trovato')
        sys.exit(1)
    channel = next(
        (ch for ch in channels['data'] if 'headless' in ch.get('name', '').lower()),
        channels['data'][0]
    )
    channel_id = channel['id']
    print(f'  ✓ Sales channel: "{channel["name"]}" ({channel_id})')

    # Recupera tutti i paesi attivi
    res = api('GET', '/country', params='?filter[active]=1&limit=200')
    countries = res.get('data', [])
    if not countries:
        print('✗ Nessun paese trovato')
        sys.exit(1)
    print(f'  ✓ Paesi attivi trovati: {len(countries)}')

    # Associa ogni paese al Sales Channel
    added = skipped = errors = 0
    for c in countries:
        r = api('POST', f'/sales-channel/{channel_id}/countries', {'id': c['id']})
        if 'error' not in r:
            added += 1
        elif r.get('error') == 409:
            skipped += 1  # già associato
        else:
            errors += 1
            print(f'  ⚠  {c.get("iso", "?")} – {r.get("msg", "")[:80]}')

    print(f'\n  ✓ Aggiunti: {added}  |  Già presenti: {skipped}  |  Errori: {errors}')
    print('\n  Ricarica il checkout — ora tutti i paesi saranno disponibili.')


if __name__ == '__main__':
    main()
