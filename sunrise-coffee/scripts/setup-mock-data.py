#!/usr/bin/env python3
"""
Popola i custom fields dei prodotti Capperificio con dati mock realistici.
Uso: python scripts/setup-mock-data.py
     python scripts/setup-mock-data.py --base http://127.0.0.1:8090 --pass LA_TUA_PASSWORD
"""

import urllib.request, urllib.error, json, sys

import sys as _sys, pathlib as _pathlib
_sys.path.insert(0, str(_pathlib.Path(__file__).parent))
from _config import shopware_config as _shopware_config

_cfg       = _shopware_config()
_args      = _cfg.args
BASE       = _cfg.api_base
ADMIN_USER = _cfg.user
ADMIN_PASS = _cfg.password

# ── Mock data per prodotto ────────────────────────────────────────────────────
# chiave = productNumber
MOCK_DATA = {
    'CAP-001': {
        'description': '<p>I capperi di Racale al sale marino sono il fiore della pianta <em>Capparis spinosa</em>, raccolti a mano nelle campagne di Racale, nel Salento. Conservati sotto sale marino integrale di Sicilia, mantengono intatto il loro profumo floreale e la nota piccante tipica del cappero pugliese IGP. Un presidio gastronomico del territorio.</p>',
        'customFields': {
            'capperificio_calibro':    'Sale marino integrale',
            'capperificio_bullet_1':   'Raccolto a mano nella campagna di Racale, Lecce',
            'capperificio_bullet_2':   'Conservato sotto sale marino integrale di Sicilia',
            'capperificio_bullet_3':   'Senza conservanti, coloranti o additivi',
            'capperificio_brew_pour_over': '<strong>In cucina</strong><br>Sciacquare in acqua fredda per 10 minuti prima dell\'uso. Perfetto per pasta, pizza, bruschette e condimenti. Irrinunciabile nella classica pasta alla puttanesca.',
            'capperificio_brew_drip':      '<strong>Abbinamenti</strong><br>Ottimo con pesce azzurro, tonno, acciughe e baccalà. Si abbina perfettamente a carni bianche, formaggi freschi e insalate estive.',
            'capperificio_brew_aeropress': '<strong>Conservazione</strong><br>Tenere in luogo fresco e asciutto. Una volta aperto, coprire bene di sale e conservare in frigorifero. Si conserva fino a 24 mesi.',
            'capperificio_brew_plunger':   '<strong>Lo sapevi?</strong><br>Il cappero sotto sale conserva meglio aromi e sapori rispetto a quello sott\'aceto. Il sale di conservazione può essere riutilizzato come condimento aromatico.',
        },
    },
    'CAP-002': {
        'description': '<p>I capperi di Racale all\'aceto di vino sono pronti all\'uso, senza necessità di risciacquo. Conservati in aceto di vino bianco selezionato, mantengono la loro consistenza e il profumo caratteristico del cappero salentino. Ideali per chi cerca praticità senza rinunciare alla qualità.</p>',
        'customFields': {
            'capperificio_calibro':    "Aceto di vino bianco",
            'capperificio_bullet_1':   'Pronti all\'uso, nessun risciacquo necessario',
            'capperificio_bullet_2':   'Marinati in aceto di vino bianco selezionato',
            'capperificio_bullet_3':   'Raccolta manuale selettiva in Puglia',
            'capperificio_brew_pour_over': '<strong>In cucina</strong><br>Pronti all\'uso direttamente dal barattolo. Aggiungere a fine cottura per preservare l\'aroma. Ideali per condire pizze, focacce e antipasti misti.',
            'capperificio_brew_drip':      '<strong>Abbinamenti</strong><br>Si abbinano con mozzarella, pomodori secchi e olive. Ottimi nelle insalate di riso, nei piatti di mare e sulle tartine gourmet.',
            'capperificio_brew_aeropress': '<strong>Conservazione</strong><br>Conservare al riparo dalla luce. Dopo l\'apertura tenere in frigorifero immersi nel liquido. Si conserva fino a 18 mesi.',
            'capperificio_brew_plunger':   '<strong>Lo sapevi?</strong><br>L\'aceto di vino bianco esalta la nota floreale tipica del cappero di Racale, preservandone il caratteristico profumo mediterraneo.',
        },
    },
    'CAP-003': {
        'description': '<p>I cucunci sono i frutti maturi della pianta del cappero, raccolti quando il fiore non ha ancora avuto modo di aprirsi. Conservati in aceto di vino bianco, hanno un sapore più delicato e dolce rispetto al cappero classico. Un ingrediente raro che sorprende per la sua versatilità.</p>',
        'customFields': {
            'capperificio_calibro':    'Frutto del cappero',
            'capperificio_bullet_1':   'I frutti maturi della pianta del cappero',
            'capperificio_bullet_2':   'Conservati in aceto di vino bianco',
            'capperificio_bullet_3':   'Sapore più delicato e dolce del cappero classico',
            'capperificio_brew_pour_over': '<strong>In cucina</strong><br>Ottimi interi come decorazione di antipasti e piatti di pesce. Ideali tritati per arricchire salse, condimenti e marinature.',
            'capperificio_brew_drip':      '<strong>Abbinamenti</strong><br>Perfetti con affettati, formaggi stagionati e carpacci. Ideali in insalate estive, contorni di verdure arrostite e bruschette gourmet.',
            'capperificio_brew_aeropress': '<strong>Conservazione</strong><br>Conservare al riparo dalla luce. Dopo l\'apertura tenere in frigorifero immersi nel liquido di conservazione. Durata: fino a 18 mesi.',
            'capperificio_brew_plunger':   '<strong>Lo sapevi?</strong><br>Il cucuncio è considerato una rarità gastronomica. Viene raccolto prima che il fiore si apra, in un brevissimo arco di tempo, rendendolo un prodotto di nicchia.',
        },
    },
    'CAP-004': {
        'description': '<p>I cucunci all\'aceto di mele sono i frutti della pianta del cappero conservati in aceto di mele biologico. L\'aceto di mele regala note fruttate e un\'acidità più morbida, rendendo questi cucunci ideali per chi preferisce sapori meno decisi. Un prodotto unico nel panorama dei conservati pugliesi.</p>',
        'customFields': {
            'capperificio_calibro':    'Aceto di mele bio',
            'capperificio_bullet_1':   'Conservati in aceto di mele biologico',
            'capperificio_bullet_2':   'Acidità più morbida con note fruttate',
            'capperificio_bullet_3':   'Ideali per chi ama sapori delicati',
            'capperificio_brew_pour_over': '<strong>In cucina</strong><br>Perfetti crudi in insalate e antipasti. Il loro sapore delicato si sposa con ricette che non vogliono note acide troppo marcate.',
            'capperificio_brew_drip':      '<strong>Abbinamenti</strong><br>Ottimi con formaggi freschi, salmone affumicato e avocado. Ideali per bowl estive, tartare e piatti fusion.',
            'capperificio_brew_aeropress': '<strong>Conservazione</strong><br>Conservare al riparo dalla luce. Dopo l\'apertura tenere in frigorifero. Il liquido di governo può essere riutilizzato come condimento. Durata: fino a 18 mesi.',
            'capperificio_brew_plunger':   '<strong>Lo sapevi?</strong><br>L\'aceto di mele biologico usato nella conservazione è prodotto da mele biologiche non trattate, senza solfiti aggiunti. Un\'alternativa naturale all\'aceto di vino tradizionale.',
        },
    },
    'CAP-005': {
        'description': '<p>Le foglie di cappero all\'aceto sono un prodotto raro e pregiato, ottenuto dalle foglie più giovani e tenere della pianta del cappero di Racale. Conservate in aceto di vino bianco, hanno un sapore erbaceo e leggermente amarognolo, con la caratteristica nota piccante del cappero. Un ingrediente gourmet quasi introvabile.</p>',
        'customFields': {
            'capperificio_calibro':    'Foglie giovani selezionate',
            'capperificio_bullet_1':   'Le foglie più giovani della pianta del cappero',
            'capperificio_bullet_2':   'Rare e pregiata — raccolta limitata',
            'capperificio_bullet_3':   'Sapore erbaceo con nota piccante tipica',
            'capperificio_brew_pour_over': '<strong>In cucina</strong><br>Usare intere per decorare piatti di pesce e antipasti. Tritate finemente arricchiscono salse verdi, hummus e pesti aromatici.',
            'capperificio_brew_drip':      '<strong>Abbinamenti</strong><br>Si abbinano perfettamente con ricotta, feta e formaggi caprini. Ottime in insalate miste, su crostini di pane di Altamura e con carpaccio di pesce.',
            'capperificio_brew_aeropress': '<strong>Conservazione</strong><br>Conservare al riparo dalla luce. Dopo l\'apertura tenere in frigorifero immerso nel liquido. Durata: fino a 18 mesi.',
            'capperificio_brew_plunger':   '<strong>Lo sapevi?</strong><br>Le foglie di cappero venivano usate nella medicina popolare salentina come rimedio naturale. Oggi sono riscoperte dall\'alta cucina italiana come ingrediente gourmet di nicchia.',
        },
    },
    'CAP-006': {
        'description': '<p>La polvere di cappero di Racale è ottenuta dall\'essiccazione e macinazione dei migliori capperi IGP di Racale. Il risultato è una spezia dall\'aroma intenso e concentrato, che porta il profumo del Mediterraneo direttamente in cucina. Versatile e innovativa, rivoluziona l\'uso del cappero in ogni ricetta.</p>',
        'customFields': {
            'capperificio_calibro':    'Polvere finissima — essiccata',
            'capperificio_bullet_1':   'Capperi di Racale IGP essiccati e macinati',
            'capperificio_bullet_2':   'Aroma intenso e concentrato',
            'capperificio_bullet_3':   'Versatile come spezia in ogni ricetta',
            'capperificio_brew_pour_over': '<strong>In cucina</strong><br>Usare come spezia: un pizzico su pasta, riso, carne e pesce. Sostituisce il sale arricchendo i piatti con il caratteristico aroma del cappero. Ottima sulla pizza prima della cottura.',
            'capperificio_brew_drip':      '<strong>Abbinamenti</strong><br>Perfetta nei condimenti per barbecue, nei rub per carni e nel pane artigianale. Si abbina con origano, timo e peperoncino per mix di spezie mediterranei.',
            'capperificio_brew_aeropress': '<strong>Conservazione</strong><br>Conservare in luogo fresco, asciutto e al riparo dalla luce in contenitore ermetico. Non esporre a umidità. Durata: fino a 12 mesi.',
            'capperificio_brew_plunger':   '<strong>Lo sapevi?</strong><br>La polvere di cappero nasce dalla ricerca gastronomica del territorio. Concentra in pochi grammi tutto il sapore di 100g di capperi freschi. Ideale per chi vuole il gusto senza la consistenza.',
        },
    },
}

# ── Auth ──────────────────────────────────────────────────────────────────────
_h_get = {}
_h_post = {}

def authenticate():
    global _h_get, _h_post
    req = urllib.request.Request(
        f'{BASE}/oauth/token',
        data=json.dumps({'client_id': 'administration', 'grant_type': 'password',
                         'scopes': 'write', 'username': ADMIN_USER, 'password': ADMIN_PASS}).encode(),
        headers={'Content-Type': 'application/json'}, method='POST',
    )
    with urllib.request.urlopen(req) as r:
        token = json.loads(r.read())['access_token']
    _h_get  = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
    _h_post = {**_h_get, 'Content-Type': 'application/json'}
    print('  ✓ Autenticazione OK')

def api(method, path, data=None, params=''):
    url  = f'{BASE}{path}{params}'
    body = json.dumps(data).encode() if data is not None else None
    req  = urllib.request.Request(url, data=body,
                                   headers=_h_post if body is not None else _h_get,
                                   method=method)
    try:
        with urllib.request.urlopen(req) as r:
            txt = r.read()
            return json.loads(txt) if txt else {}
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'msg': e.read().decode()}

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print('╔══════════════════════════════════════════════════════════╗')
    print('║       MOCK DATA PRODOTTI  –  Capperificio Shopware 6     ║')
    print('╚══════════════════════════════════════════════════════════╝')
    print(f'  Backend : {BASE}\n')

    try:
        authenticate()
    except Exception as e:
        print(f'✗ Autenticazione fallita: {e}')
        sys.exit(1)

    for product_num, data in MOCK_DATA.items():
        # Trova il prodotto per productNumber
        res = api('GET', '/product', params=f'?filter[productNumber]={product_num}&limit=1')
        if not res.get('data'):
            print(f'  ✗ {product_num} non trovato — saltato')
            continue

        product_id   = res['data'][0]['id']
        product_name = res['data'][0].get('name', product_num)

        # Aggiorna description + customFields
        patch = {}
        if 'description' in data:
            patch['description'] = data['description']
        if 'customFields' in data:
            patch['customFields'] = data['customFields']

        r = api('PATCH', f'/product/{product_id}', patch)
        if 'error' in r:
            print(f'  ✗ {product_name}: {r.get("msg", "")[:200]}')
        else:
            print(f'  ✓ {product_name} ({product_num})')

    print('\n✓ Mock data applicati a tutti i prodotti!')
    print('  Verifica su: http://127.0.0.1:8090/admin → Catalogo → Prodotti')

if __name__ == '__main__':
    main()
