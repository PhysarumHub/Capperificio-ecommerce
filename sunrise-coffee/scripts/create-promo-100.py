#!/usr/bin/env python3
"""
Crea in Shopware una promozione con codice a sconto 100% (ordine gratuito).

Di default crea il codice TEST100 con **un solo utilizzo globale**: un 100% di
sconto su uno shop live non deve poter essere riusato se il codice gira.

Lo sconto viene applicato su due scope:
  - cart     → azzera il valore dei prodotti
  - delivery → azzera il costo di spedizione
così il totale del carrello diventa 0,00 € e il checkout passa dal percorso
"ordine gratuito" (senza Stripe, che non accetta pagamenti da 0 €).

Uso:
  python scripts/create-promo-100.py
  python scripts/create-promo-100.py --code REGALO100 --max 5
  python scripts/create-promo-100.py --no-shipping        # solo prodotti
  python scripts/create-promo-100.py --base http://127.0.0.1:8090 --pass LA_TUA_PASSWORD

Se il codice esiste già lo script non crea un duplicato: riporta l'ID esistente.
"""

import urllib.request, urllib.error, json, uuid, sys

# ── Config ────────────────────────────────────────────────────────────────────
import sys as _sys, pathlib as _pathlib
_sys.path.insert(0, str(_pathlib.Path(__file__).parent))
from _config import shopware_config as _shopware_config

_cfg       = _shopware_config()
_args      = _cfg.args
BASE       = _cfg.api_base
ADMIN_USER = _cfg.user
ADMIN_PASS = _cfg.password
_flags     = [a for a in sys.argv[1:] if not a.startswith('--') or a in ('--no-shipping',)]

CODE       = _args.get('--code', 'TEST100')
MAX_GLOBAL = int(_args.get('--max', '1'))          # 0 = illimitato
SALES_KEY  = _args.get('--access-key', 'SWSCBKVQOTHEMMNHDWLJVJLKNQ')  # sales channel headless
WITH_SHIPPING = '--no-shipping' not in sys.argv


def req(method, path, token=None, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode()
        raise SystemExit(f'❌  {method} {path} → HTTP {e.code}\n{detail}')


def login():
    res = req('POST', '/oauth/token', body={
        'grant_type': 'password',
        'client_id': 'administration',
        'username': ADMIN_USER,
        'password': ADMIN_PASS,
        'scopes': 'write',
    })
    return res['access_token']


def main():
    token = login()
    print(f'✓  Autenticato su {BASE}')

    # ── Sales channel di destinazione (quello usato dal frontend headless) ────
    sc = req('POST', '/search/sales-channel', token, {
        'filter': [{'type': 'equals', 'field': 'accessKey', 'value': SALES_KEY}],
        'limit': 1,
    })
    if not sc.get('data'):
        raise SystemExit(f'❌  Nessun sales channel con accessKey {SALES_KEY}')
    sc_row = sc['data'][0]
    sc_id = sc_row['id']
    sc_name = sc_row.get('attributes', sc_row).get('name', '—')
    print(f'✓  Sales channel: {sc_name} ({sc_id})')

    # ── Il codice esiste già? ────────────────────────────────────────────────
    existing = req('POST', '/search/promotion', token, {
        'filter': [{'type': 'equals', 'field': 'code', 'value': CODE}],
        'limit': 1,
    })
    if existing.get('data'):
        pid = existing['data'][0]['id']
        print(f'⚠  Il codice {CODE} esiste già (promotion {pid}). Nessuna modifica.')
        return

    # ── Creazione promozione ─────────────────────────────────────────────────
    discounts = [{
        'id': uuid.uuid4().hex,
        'scope': 'cart',
        'type': 'percentage',
        'value': 100.0,
        'considerAdvancedRules': False,
    }]
    if WITH_SHIPPING:
        discounts.append({
            'id': uuid.uuid4().hex,
            'scope': 'delivery',
            'type': 'percentage',
            'value': 100.0,
            'considerAdvancedRules': False,
        })

    promo_id = uuid.uuid4().hex
    req('POST', '/promotion', token, {
        'id': promo_id,
        'name': f'Sconto 100% — {CODE}',
        'active': True,
        'useCodes': True,
        'useIndividualCodes': False,
        'code': CODE,
        'maxRedemptionsGlobal': MAX_GLOBAL,       # 0 = illimitato
        'maxRedemptionsPerCustomer': 1,
        'exclusive': True,                        # non si somma ad altre promozioni
        'preventCombination': True,
        'priority': 100,
        'salesChannels': [{'salesChannelId': sc_id, 'priority': 1}],
        'discounts': discounts,
    })

    limite = 'illimitato' if MAX_GLOBAL == 0 else f'{MAX_GLOBAL} utilizzo/i totali'
    scope = 'prodotti + spedizione' if WITH_SHIPPING else 'solo prodotti'
    print(f'✓  Promozione creata: {CODE} — 100% su {scope} — {limite}')
    print(f'   ID: {promo_id}')
    print(f'   Admin → Marketing → Promozioni → "Sconto 100% — {CODE}"')


if __name__ == '__main__':
    main()
