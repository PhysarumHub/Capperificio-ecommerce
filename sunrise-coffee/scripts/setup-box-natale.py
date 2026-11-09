#!/usr/bin/env python3
"""
Crea (o aggiorna) in Shopware i tre prodotti-box usati da /box-di-natale:

  XMAS-BOX-RACALE-3   Box Racale · 3 vasetti    → VITE_XMAS_BOX_FIXED_ID
  XMAS-BOX-RACALE-2   Box Racale · 2 vasetti    → VITE_XMAS_BOX_FIXED2_ID
  XMAS-BOX-GETTONI    Box a Gettoni             → VITE_XMAS_BOX_TOKENS_ID

UPSERT per productNumber: rilanciarlo non crea duplicati e riallinea
nome/prezzo/visibilità. Visibilità "solo link" (10): i prodotti non compaiono
in listing e ricerca, si aggiungono al carrello solo dalla pagina della box.
L'IVA è quella del primo prodotto Capperificio trovato (CAP-SALE-LILLIPUT),
da verificare col commercialista: la Box a Gettoni può contenere vino.

Alla fine stampa le righe da incollare nel .env del frontend (sono VITE_*:
servono al build, quindi dopo averle impostate va rifatto il build).

Uso:
  python3 scripts/setup-box-natale.py                       # scripts/.env
  python3 scripts/setup-box-natale.py --base http://127.0.0.1:8090 --pass ...
  python3 scripts/setup-box-natale.py --dry-run
"""

import json, os, pathlib, sys, urllib.error, urllib.parse, urllib.request, uuid

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _config import shopware_config

cfg = shopware_config()
BASE, USER, PASS = cfg.api_base, cfg.user, cfg.password
DRY = '--dry-run' in sys.argv
COVER = pathlib.Path(__file__).resolve().parent.parent / 'public/images/box-natale/box-poster.webp'

# Prezzi lordi. [Gettoni e Racale 2 vasetti: DA CONFERMARE]
BOXES = [
    {'number': 'XMAS-BOX-RACALE-3', 'env': 'VITE_XMAS_BOX_FIXED_ID', 'gross': 20.00,
     'name': 'Box di Natale Racale · 3 vasetti',
     'desc': 'Confezione regalo in tela verde con finestre e fiocco: germogli di cappero, polvere di cappero e capperi Lilliput.'},
    {'number': 'XMAS-BOX-RACALE-2', 'env': 'VITE_XMAS_BOX_FIXED2_ID', 'gross': 14.00,
     'name': 'Box di Natale Racale · 2 vasetti',
     'desc': 'Confezione regalo in tela verde con finestre e fiocco: capperi Lilliput e polvere di cappero.'},
    {'number': 'XMAS-BOX-GETTONI', 'env': 'VITE_XMAS_BOX_TOKENS_ID', 'gross': 45.00,
     'name': 'Box di Natale a Gettoni',
     'desc': 'Scatola composta dal cliente con 10 gettoni: specialità del Capperificio Caro, vino o olio e dolci del Salento. La composizione è nella riga d’ordine.'},
]

_h = {}


def auth():
    r = urllib.request.Request(f'{BASE}/oauth/token', method='POST',
        data=json.dumps({'client_id': 'administration', 'grant_type': 'password', 'scopes': 'write',
                         'username': USER, 'password': PASS}).encode(),
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(r) as resp:
        _h['Authorization'] = 'Bearer ' + json.loads(resp.read())['access_token']


def api(method, path, data=None, raw=None, ctype='application/json'):
    if DRY and method != 'GET' and not path.startswith('/search'):
        print(f'    [dry-run] {method} {path}')
        return {}
    body = raw if raw is not None else (json.dumps(data).encode() if data is not None else None)
    headers = {**_h, 'Accept': 'application/json'}
    if body is not None:
        headers['Content-Type'] = ctype
    r = urllib.request.Request(f'{BASE}{path}', data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            txt = resp.read()
            return json.loads(txt) if txt else {}
    except urllib.error.HTTPError as e:
        sys.exit(f'❌  {method} {path} → HTTP {e.code}\n{e.read().decode()[:800]}')


def search(entity, filters, limit=1, assoc=None):
    body = {'limit': limit, 'filter': filters}
    if assoc:
        body['associations'] = assoc
    return api('POST', f'/search/{entity}', body).get('data', [])


def _frontend_env(name):
    env = pathlib.Path(__file__).resolve().parent.parent / '.env'
    if env.exists():
        for line in env.read_text(encoding='utf-8').splitlines():
            if line.startswith(name + '='):
                return line.split('=', 1)[1].strip().strip('"\'')
    return ''


def uid():
    return uuid.uuid4().hex


def main():
    auth()
    print('✓ autenticato su', BASE)

    eur = search('currency', [{'type': 'equals', 'field': 'isoCode', 'value': 'EUR'}])[0]['id']
    # il canale giusto è quello della access key usata dal frontend
    key = os.environ.get('VITE_SHOPWARE_ACCESS_KEY') or _frontend_env('VITE_SHOPWARE_ACCESS_KEY')
    ch = search('sales-channel', [{'type': 'equals', 'field': 'accessKey', 'value': key}]) if key else []
    if not ch:
        sys.exit('❌  Sales channel non trovato: imposta VITE_SHOPWARE_ACCESS_KEY (quella del frontend) in scripts/.env')
    channel = ch[0]['id']

    ref = search('product', [{'type': 'equals', 'field': 'productNumber', 'value': 'CAP-SALE-LILLIPUT'}])
    tax_id = ref[0].get('taxId') if ref else None
    if ref and not tax_id and ref[0].get('parentId'):   # variante: IVA ereditata dal padre
        tax_id = api('GET', f'/product/{ref[0]["parentId"]}')['data'].get('taxId')
    if not tax_id:
        tax_id = api('GET', '/tax?limit=1')['data'][0]['id']
    tax = api('GET', f'/tax/{tax_id}')['data']
    rate = tax['taxRate']
    print(f'✓ IVA {rate}% ({tax["name"]}) — sales channel {channel}')

    # copertina condivisa (poster della scatola chiusa)
    media_id = None
    if COVER.exists():
        found = search('media', [{'type': 'equals', 'field': 'fileName', 'value': 'box-natale-poster'}])
        if found:
            media_id = found[0]['id']
        elif not DRY:
            media_id = uid()
            api('POST', '/media', {'id': media_id})
            api('POST', f'/_action/media/{media_id}/upload?extension=webp&fileName=box-natale-poster',
                raw=COVER.read_bytes(), ctype='image/webp')
        print('✓ copertina', media_id or '(dry-run)')

    lines = []
    for b in BOXES:
        net = round(b['gross'] / (1 + rate / 100), 4)
        payload = {
            'name': b['name'],
            'description': f'<p>{b["desc"]}</p>',
            'productNumber': b['number'],
            'taxId': tax_id,
            'active': True,
            'stock': 500,
            'isCloseout': False,
            'shippingFree': False,
            'weight': 1.2,
            'price': [{'currencyId': eur, 'gross': b['gross'], 'net': net, 'linked': True}],
        }
        existing = search('product', [{'type': 'equals', 'field': 'productNumber', 'value': b['number']}],
                          assoc={'visibilities': {}, 'media': {}})
        if existing:
            pid = existing[0]['id']
            vis = (existing[0].get('visibilities') or [])
            if not any(v.get('salesChannelId') == channel for v in vis):
                payload['visibilities'] = [{'salesChannelId': channel, 'visibility': 10}]
            api('PATCH', f'/product/{pid}', payload)
            action = 'aggiornato'
        else:
            pid = uid()
            payload.update({'id': pid, 'visibilities': [{'salesChannelId': channel, 'visibility': 10}]})
            if media_id:
                pm = uid()
                payload.update({'media': [{'id': pm, 'mediaId': media_id, 'position': 0}], 'coverId': pm})
            api('POST', '/product', payload)
            action = 'creato'
        print(f'✓ {action}: {b["number"]} — {b["name"]} @ {b["gross"]:.2f} € → {pid}')
        lines.append(f'{b["env"]}={pid}')

    print('\nRighe per il .env del frontend (poi rifare il build):\n' + '\n'.join(lines))


if __name__ == '__main__':
    main()
