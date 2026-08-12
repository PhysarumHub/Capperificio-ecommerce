#!/usr/bin/env python3
"""
Seed COMPLETO Capperificio Caro — Shopware 6
============================================
Crea / aggiorna i 5 prodotti della linea Caro con la struttura
padre+varianti descritta nel catalogo operativo.

Prodotti:
  CAP-SALE      → Capperi al Sale (4 varianti calibro)
  CAP-ACETO     → Capperi all'Aceto (4 varianti calibro)
  CUC-ACETO     → Cucunci all'Aceto (3 varianti tipo aceto)
  CAP-POLVERE-50 → Polvere di Cappero (prodotto singolo)
  CAP-FOGLIE    → Foglie di Cappero (2 varianti formato)

Idempotente: rieseguire non duplica nulla.
Non sovrascrive i prezzi dei prodotti già esistenti.

Prerequisiti:
  python scripts/setup-custom-fields.py --base URL --pass PWD

Uso:
  python scripts/seed-caro-completo.py --base http://localhost:8080 --pass LA_TUA_PASSWORD
  python scripts/seed-caro-completo.py --base URL --pass PWD --dry-run
  python scripts/seed-caro-completo.py --base URL --pass PWD --no-create
"""

import urllib.request, urllib.error, urllib.parse, json, uuid, sys

# ── CLI ────────────────────────────────────────────────────────────────────────
import sys as _sys, pathlib as _pathlib
_sys.path.insert(0, str(_pathlib.Path(__file__).parent))
from _config import shopware_config as _shopware_config

_cfg       = _shopware_config()
_args      = _cfg.args
BASE       = _cfg.api_base
ADMIN_USER = _cfg.user
ADMIN_PASS = _cfg.password
_flags = {a for a in sys.argv[1:] if a.startswith('--') and a in ('--dry-run', '--no-create')}
DRY_RUN   = '--dry-run' in _flags
NO_CREATE = '--no-create' in _flags

# ── Catalogo prodotti ──────────────────────────────────────────────────────────

PRODUCTS = [

  # ────────────────────────────────────────────────────────────────────────────
  # 1. Capperi di Racale al Sale Marino Integrale
  # ────────────────────────────────────────────────────────────────────────────
  {
    'productNumber': 'CAP-SALE',
    'name': 'Capperi di Racale al Sale Marino Integrale',
    'descriptionShort': (
      'Capperi di Racale selezionati a mano, classificati per calibro e conservati '
      'sotto sale marino integrale pugliese per almeno 25 giorni. Nessun additivo, nessuna cottura.'
    ),
    'description': (
      'I capperi del Capperificio Caro nascono a Racale, nel cuore del Salento, dove la famiglia '
      'li raccoglie e classifica a mano per calibro — un gesto di precisione artigianale che non '
      'esiste altrove. Ogni bocciolo viene subito stratificato con sale marino integrale delle '
      'saline pugliesi e rimescolato quotidianamente per almeno 25 giorni secondo la tradizione '
      'di famiglia. Scegli il calibro che preferisci: ogni formato ha un carattere diverso, tutte '
      'le varianti condividono la stessa origine e lo stesso processo.'
    ),
    'category': 'Capperi al Sale',
    'taxRate': 4,
    'properties': [
      ('Origine', 'Racale (Salento, Puglia)'),
      ('Ingredienti', 'Capperi 80% – Sale marino integrale 20%'),
    ],
    'customFields': {
      'capperificio_brew_aeropress': '<p>Conservare in luogo fresco e asciutto. Dopo l\'apertura tenere i capperi coperti dal sale; non necessitano di refrigerazione.</p>',
    },
    'variantGroup': 'Calibro',
    'variants': [
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
    ],
  },

  # ────────────────────────────────────────────────────────────────────────────
  # 2. Capperi di Racale all'Aceto
  # ────────────────────────────────────────────────────────────────────────────
  {
    'productNumber': 'CAP-ACETO',
    'name': 'Capperi di Racale all\'Aceto',
    'descriptionShort': (
      'Gli stessi calibri della linea al sale, conservati in aceto di vino bianco. '
      'Pronti all\'uso — nessuna dissalatura, nessun ammollo.'
    ),
    'description': (
      'I capperi di Racale classificati per calibro, marinati in aceto di vino bianco selezionato '
      'anziché sotto sale. La marinatura li rende pronti all\'uso immediato: si aggiungono '
      'direttamente nel piatto preservando la vivacità aromatica e aggiungendo una nota acidula '
      'che bilancia la sapidità naturale del cappero. Scegli il calibro: ogni variante ha un '
      'carattere diverso.'
    ),
    'category': 'Capperi all\'Aceto',
    'taxRate': 4,
    'properties': [
      ('Origine', 'Racale (Salento, Puglia)'),
      ('Ingredienti', 'Capperi, aceto di vino bianco, sale'),
    ],
    'customFields': {
      'capperificio_brew_aeropress': '<p>Luogo fresco e asciutto. Dopo l\'apertura tenere in frigorifero immersi nel liquido di governo.</p>',
    },
    'variantGroup': 'Calibro',
    'variants': [
      {
        'productNumber': 'CAP-ACETO-LILLIPUT',
        'option': 'Lilliput',
        'price': 6.50,
        'stock': 100,
        'shippingWeight': 0.20,
        'properties': [
          ('Calibro', 'Lilliput · Ø 4–6 mm'),
          ('Peso netto', '75 g'),
          ('Note di gusto', ['Intenso', 'Floreale', 'Acidulo']),
          ('Ideale per', 'Uso diretto, crudi, finger food, aperitivi'),
        ],
        'customFields': {
          'capperificio_calibro': 'Lilliput · Ø 4–6 mm · all\'Aceto',
          'capperificio_bullet_1': '**Lilliput all\'Aceto** (Ø 4–6 mm): pronto all\'uso, intenso e vivace',
          'capperificio_bullet_2': 'Nessuna dissalatura: direttamente dal barattolo al piatto',
          'capperificio_bullet_3': 'L\'aceto esalta le note floreali del bocciolo più piccolo',
          'capperificio_brew_pour_over': '<p>Direttamente dal barattolo su carpacci, crudi di pesce e finger food.</p>',
          'capperificio_brew_drip': '<p>Con ostriche, gamberi crudi, burrata e ovunque serva una nota acida brillante.</p>',
          'capperificio_brew_plunger': '<p>Il liquido di governo è ottimo in vinaigrette o per degassare la padella: non buttarlo.</p>',
        },
      },
      {
        'productNumber': 'CAP-ACETO-OCCHIO',
        'option': 'Occhio di Pernice',
        'price': 6.50,
        'stock': 100,
        'shippingWeight': 0.30,
        'properties': [
          ('Calibro', 'Occhio di Pernice · Ø 7–9 mm'),
          ('Peso netto', '150 g'),
          ('Note di gusto', ['Sapido', 'Acidulo', 'Floreale', 'Equilibrato']),
          ('Ideale per', 'Insalate, salse fredde, pasta, formaggi'),
        ],
        'customFields': {
          'capperificio_calibro': 'Occhio di Pernice · Ø 7–9 mm · all\'Aceto',
          'capperificio_bullet_1': '**Occhio di Pernice all\'Aceto** (Ø 7–9 mm): versatile e pronto all\'uso',
          'capperificio_bullet_2': 'Sapidità fine e acidità vivace, mai aggressiva',
          'capperificio_bullet_3': 'Dal barattolo al piatto: nessuna preparazione',
          'capperificio_brew_pour_over': '<p>Direttamente in insalate, salse fredde, pasta saltata o su formaggi.</p>',
          'capperificio_brew_drip': '<p>Con tonno, acciughe, uova sode e pomodori freschi.</p>',
          'capperificio_brew_plunger': '<p>Il liquido di governo è un condimento pronto: usalo in vinaigrette o per aromatizzare marinature.</p>',
        },
      },
      {
        'productNumber': 'CAP-ACETO-LACRIMELLA',
        'option': 'Lacrimella',
        'price': 6.50,
        'stock': 100,
        'shippingWeight': 0.42,
        'properties': [
          ('Calibro', 'Lacrimella · Ø 9–11 mm'),
          ('Peso netto', '250 g'),
          ('Note di gusto', ['Pieno', 'Carnoso', 'Acidulo', 'Rotondo']),
          ('Ideale per', 'Pasta, secondi, salse, caponata'),
        ],
        'customFields': {
          'capperificio_calibro': 'Lacrimella · Ø 9–11 mm · all\'Aceto',
          'capperificio_bullet_1': '**Lacrimella all\'Aceto** (Ø 9–11 mm): polpa carnosa, pronta all\'uso',
          'capperificio_bullet_2': 'In cottura l\'aceto evapora, il cappero resta integro e profumato',
          'capperificio_bullet_3': 'La più versatile della linea aceto',
          'capperificio_brew_pour_over': '<p>In padella a metà cottura: l\'aceto evapora e la polpa rimane intatta. Perfetta in puttanesca e caponata.</p>',
          'capperificio_brew_drip': '<p>Con melanzane, tonno, acciughe e olive nere.</p>',
          'capperificio_brew_plunger': '<p>Il liquido di governo ridotto con miele diventa una salsa agrodolce pronta in 2 minuti.</p>',
        },
      },
      {
        'productNumber': 'CAP-ACETO-CAPPERONE',
        'option': 'Capperone',
        'price': 6.50,
        'stock': 100,
        'shippingWeight': 0.42,
        'properties': [
          ('Calibro', 'Capperone · Ø 12–15 mm'),
          ('Peso netto', '250 g'),
          ('Note di gusto', ['Audace', 'Selvatico', 'Persistente']),
          ('Ideale per', 'Sughi lunghi, secondi, cucina pugliese'),
        ],
        'customFields': {
          'capperificio_calibro': 'Capperone · Ø 12–15 mm · all\'Aceto',
          'capperificio_bullet_1': '**Capperone all\'Aceto** (Ø 12–15 mm): audace e persistente',
          'capperificio_bullet_2': 'Struttura carnosa che regge le cotture lunghe',
          'capperificio_bullet_3': 'Un ingrediente strutturale, non un semplice condimento',
          'capperificio_brew_pour_over': '<p>Protagonista in sughi lunghi, coniglio alla cacciatora e triglie alla livornese.</p>',
          'capperificio_brew_drip': '<p>Con carni saporite, pesce azzurro, \'nduja e formaggi stagionati.</p>',
          'capperificio_brew_plunger': '<p>Stesso calibro del cucuncio, pochi giorni prima della trasformazione in frutto: esperienze di gusto completamente diverse.</p>',
        },
      },
    ],
  },

  # ────────────────────────────────────────────────────────────────────────────
  # 3. Cucunci all'Aceto
  # ────────────────────────────────────────────────────────────────────────────
  {
    'productNumber': 'CUC-ACETO',
    'name': 'Cucunci di Racale all\'Aceto',
    'descriptionShort': (
      'I frutti della pianta del cappero di Racale, marinati in tre aceti diversi. '
      'Polpa carnosa, semi croccanti, gusto più morbido e fruttato del cappero. '
      'Scegli il tipo di aceto.'
    ),
    'description': (
      'I cucunci sono i boccioli che non vengono raccolti in tempo: fioriscono e si '
      'trasformano in frutti allungati, con polpa più sviluppata e semi croccanti. '
      'Il gusto è diverso dal cappero — più morbido, fruttato, con una nota selvatica '
      'unica. A Racale vengono marinati in tre aceti differenti, ciascuno con un profilo '
      'aromatico ben distinto: scegli quello che si abbina meglio alla tua cucina.'
    ),
    'category': 'Cucunci',
    'taxRate': 4,
    'properties': [
      ('Origine', 'Racale (Salento, Puglia)'),
      ('Peso netto', '200 g'),
    ],
    'customFields': {
      'capperificio_brew_aeropress': '<p>Luogo fresco. Dopo l\'apertura tenere in frigorifero immersi nel liquido di governo. Il liquido è un ottimo condimento: non buttarlo.</p>',
    },
    'variantGroup': 'Tipo di Aceto',
    'variants': [
      {
        'productNumber': 'CUC-ACETO-MELE',
        'option': 'Aceto di Mele',
        'price': 7.00,
        'stock': 100,
        'shippingWeight': 0.35,
        'properties': [
          ('Ingredienti', 'Cucunci di cappero, aceto di mele biologico, sale'),
          ('Note di gusto', ['Fruttato', 'Morbido', 'Dolce', 'Rotondo']),
          ('Ideale per', 'Taglieri, crostini, formaggi freschi, carni bianche'),
        ],
        'customFields': {
          'capperificio_calibro': 'Cucunci · all\'Aceto di Mele',
          'capperificio_bullet_1': 'In aceto di mele biologico: dolcezza fruttata e acidità morbida',
          'capperificio_bullet_2': 'La versione più accessibile — il punto di partenza per chi scopre i cucunci',
          'capperificio_bullet_3': 'Polpa carnosa, semi croccanti, retrogusto di mela matura',
          'capperificio_brew_pour_over': '<p>In un tagliere di salumi e formaggi, su crostini con stracciatella e miele.</p>',
          'capperificio_brew_drip': '<p>Con formaggi freschi, prosciutto crudo e frutta secca. Ottimi in insalata con rucola, pere e noci.</p>',
          'capperificio_brew_plunger': '<p>Il cucuncio nasce dal bocciolo che sfugge alla raccolta: invece di diventare cappero, fiorisce e si trasforma in frutto.</p>',
        },
      },
      {
        'productNumber': 'CUC-ACETO-RISO',
        'option': 'Aceto di Riso',
        'price': 7.00,
        'stock': 100,
        'shippingWeight': 0.35,
        'properties': [
          ('Ingredienti', 'Cucunci di cappero, aceto di riso, sale'),
          ('Note di gusto', ['Pulito', 'Delicato', 'Floreale', 'Erbaceo']),
          ('Ideale per', 'Cucina fusion, carpacci, crudi'),
        ],
        'customFields': {
          'capperificio_calibro': 'Cucunci · all\'Aceto di Riso',
          'capperificio_bullet_1': 'In aceto di riso: l\'aceto più delicato, lascia parlare il frutto',
          'capperificio_bullet_2': 'Gusto pulito e floreale, texture quasi seta con semi croccanti',
          'capperificio_bullet_3': 'La versione più raffinata — ispirazione fusion Salento-Oriente',
          'capperificio_brew_pour_over': '<p>Su carpacci di pesce spada, tartare di tonno e insalate con finocchio.</p>',
          'capperificio_brew_drip': '<p>Con pesce crudo, ceviche mediterraneo e formaggi freschi a pasta molle.</p>',
          'capperificio_brew_plunger': '<p>L\'aceto di riso è usato in Giappone da oltre 2.000 anni per preservare senza coprire.</p>',
        },
      },
      {
        'productNumber': 'CUC-ACETO-MELOGRANO',
        'option': 'Aceto di Melograno',
        'price': 7.00,
        'stock': 100,
        'shippingWeight': 0.35,
        'properties': [
          ('Ingredienti', 'Cucunci di cappero, aceto di melograno, sale'),
          ('Note di gusto', ['Intenso', 'Vinoso', 'Fruttato amaro', 'Persistente']),
          ('Ideale per', 'Carni rosse, formaggi stagionati, cucina creativa'),
        ],
        'customFields': {
          'capperificio_calibro': 'Cucunci · all\'Aceto di Melograno',
          'capperificio_bullet_1': 'In aceto di melograno: note vinose, retrogusto fruttato amaro',
          'capperificio_bullet_2': 'Il liquido tinge la polpa di rosa rubino — bello nel piatto, straordinario al palato',
          'capperificio_bullet_3': 'La versione più intensa e complessa della linea',
          'capperificio_brew_pour_over': '<p>Con carni rosse marinate, selvaggina e piatti mediorientali. Ottimi in un risotto con melograno fresco.</p>',
          'capperificio_brew_drip': '<p>Con formaggi stagionati, salumi di maiale e piatti agrodolci.</p>',
          'capperificio_brew_plunger': '<p>Il melograno e il cappero crescono nel bacino del Mediterraneo da millenni: questi cucunci sono il loro primo incontro.</p>',
        },
      },
    ],
  },

  # ────────────────────────────────────────────────────────────────────────────
  # 4. Polvere di Cappero Extrafine (prodotto singolo)
  # ────────────────────────────────────────────────────────────────────────────
  {
    'productNumber': 'CAP-POLVERE-50',
    'name': 'Polvere di Cappero di Racale Extrafine',
    'descriptionShort': (
      'Capperi di Racale dissalati, essiccati a bassa temperatura e ridotti in polvere extrafine. '
      'Un insaporitore naturale concentratissimo. 100% naturale, senza additivi.'
    ),
    'description': (
      'La Polvere di Cappero Extrafine nasce dall\'essiccazione lenta a meno di 40°C dei capperi '
      'di Racale: una temperatura che preserva intatti gli oli essenziali della pianta. Il risultato '
      'è una polvere verde salvia, profumatissima e concentratissima. Un cucchiaino basta per '
      'trasformare fondi, salse e finiture. 100% naturale, senza conservanti né additivi.'
    ),
    'category': 'Polvere',
    'taxRate': 4,
    'price': 10.00,
    'stock': 100,
    'shippingWeight': 0.12,
    'properties': [
      ('Origine', 'Racale (Salento, Puglia)'),
      ('Ingredienti', 'Capperi disidratati, sale marino integrale — 100% naturale'),
      ('Calibro', 'Polvere extrafine'),
      ('Peso netto', '50 g'),
      ('Note di gusto', ['Concentrato', 'Sapido', 'Persistente', 'Aromatico']),
      ('Ideale per', 'Fondi, brodi, salse, finitura a crudo, burro aromatico'),
    ],
    'customFields': {
      'capperificio_calibro': 'Polvere Extrafine',
      'capperificio_bullet_1': 'Essiccazione lenta a < 40°C: tutti gli oli essenziali del cappero preservati',
      'capperificio_bullet_2': '100% naturale — solo cappero di Racale e sale marino',
      'capperificio_bullet_3': 'Un cucchiaino trasforma fondi, salse e finiture',
      'capperificio_brew_pour_over': '<p>Si scioglie in fondi e salse; spolverata a crudo su pasta o carpaccio; mischiata al burro per un condimento intenso. Dosare con parsimonia.</p>',
      'capperificio_brew_drip': '<p>Insaporitore universale per primi, secondi e marinature. Eccellente nel burro per bistecche.</p>',
      'capperificio_brew_aeropress': '<p>Luogo fresco, asciutto e al riparo dalla luce. Richiudere bene dopo ogni uso.</p>',
      'capperificio_brew_plunger': '<p>Nasce dal recupero dei capperi imperfetti per la conservazione intera: uno scarto nobilitato dalla lentezza dell\'essiccazione.</p>',
    },
    'variantGroup': None,
    'variants': [],
  },

  # ────────────────────────────────────────────────────────────────────────────
  # 5. Foglie di Cappero al Sale Marino
  # ────────────────────────────────────────────────────────────────────────────
  {
    'productNumber': 'CAP-FOGLIE',
    'name': 'Foglie di Cappero di Racale al Sale Marino',
    'descriptionShort': (
      'Le foglie giovani della pianta del cappero: gusto fresco, minerale, consistenza croccante. '
      'Raccolte tra maggio e settembre, solo le più tenere.'
    ),
    'description': (
      'Le Foglie di Cappero (Capparis spinosa) sono la parte meno conosciuta della pianta, ma '
      'sempre più apprezzata in cucina. Gusto fresco e minerale con un lieve amarognolo, '
      'consistenza croccante. Si raccolgono tra maggio e settembre, solo le foglie giovani e '
      'tenere — quelle più vecchie vengono scartate. Perfette fritte in pastella, in involtini '
      'o tritate fresche su tartare.'
    ),
    'category': 'Foglie',
    'taxRate': 4,
    'properties': [
      ('Origine', 'Racale (Salento, Puglia)'),
      ('Ingredienti', 'Foglie di cappero 80% – Sale marino integrale 20%'),
      ('Calibro', 'Foglie giovani e tenere, raccolta maggio–settembre'),
      ('Note di gusto', ['Fresco', 'Minerale', 'Erbaceo', 'Lieve amaro']),
      ('Ideale per', 'Frittura in pastella, involtini, insalate, tartare'),
    ],
    'customFields': {
      'capperificio_brew_aeropress': '<p>Luogo fresco e asciutto. Tenere le foglie coperte dal sale dopo l\'apertura.</p>',
    },
    'variantGroup': 'Formato',
    'variants': [
      {
        'productNumber': 'CAP-FOGLIE-50',
        'option': '50 g',
        'price': 5.00,
        'stock': 100,
        'shippingWeight': 0.15,
        'properties': [
          ('Peso netto', '50 g'),
        ],
        'customFields': {
          'capperificio_calibro': 'Foglie di Cappero · 50 g',
          'capperificio_bullet_1': 'Foglie giovani e tenere: fresche, minerali, croccanti',
          'capperificio_bullet_2': 'Raccolte a mano tra maggio e settembre, solo le più giovani',
          'capperificio_bullet_3': 'Fritte in pastella, in involtini o fresche su tartare',
          'capperificio_brew_pour_over': '<p>Dopo breve dissalatura: fritte in pastella, come foglie di vite per involtini, o tritate su tartare.</p>',
          'capperificio_brew_drip': '<p>Con pesce crudo e carpacci. Fritte in pastella sono irresistibili con salsa allo yogurt e menta.</p>',
          'capperificio_brew_plunger': '<p>Nella tradizione salentina tutto della pianta ha valore: le foglie non si buttavano. Oggi le cuciniamo.</p>',
        },
      },
      {
        'productNumber': 'CAP-FOGLIE-150',
        'option': '150 g',
        'price': 5.00,
        'stock': 100,
        'shippingWeight': 0.30,
        'properties': [
          ('Peso netto', '150 g'),
        ],
        'customFields': {
          'capperificio_calibro': 'Foglie di Cappero · 150 g',
          'capperificio_bullet_1': 'Foglie giovani e tenere: fresche, minerali, croccanti',
          'capperificio_bullet_2': 'Raccolte a mano tra maggio e settembre, solo le più giovani',
          'capperificio_bullet_3': 'Fritte in pastella, in involtini o fresche su tartare',
          'capperificio_brew_pour_over': '<p>Dopo breve dissalatura: fritte in pastella, come foglie di vite per involtini, o tritate su tartare.</p>',
          'capperificio_brew_drip': '<p>Con pesce crudo e carpacci. Fritte in pastella sono irresistibili con salsa allo yogurt e menta.</p>',
          'capperificio_brew_plunger': '<p>Nella tradizione salentina tutto della pianta ha valore: le foglie non si buttavano. Oggi le cuciniamo.</p>',
        },
      },
    ],
  },

]


# ── Auth + API ─────────────────────────────────────────────────────────────────
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
    _h_get  = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
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
    if DRY_RUN:
        print(f'    [dry-run] {method} {path} {label}'.rstrip())
        return {}
    return api(method, path, data, params)


def uid():
    return str(uuid.uuid4()).replace('-', '')


def _step(msg): print(f'\n{"═" * 62}\n  {msg}\n{"═" * 62}')
def _ok(msg):   print(f'  ✓ {msg}')
def _warn(msg): print(f'  ⚠  {msg}')
def _fail(msg): print(f'  ✗ {msg}', file=sys.stderr)


# ── Risorse base ───────────────────────────────────────────────────────────────
def get_tax_id(rate=4):
    taxes = api('GET', '/tax', params='?limit=50')
    chosen = None
    for t in taxes.get('data', []):
        if t.get('taxRate') == rate:
            return t['id'], rate
        chosen = chosen or t
    if chosen:
        _warn(f'IVA {rate}% non trovata, uso {chosen.get("taxRate")}%')
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


# ── Property group / option (cache) ───────────────────────────────────────────
_group_cache  = {}
_option_cache = {}


def ensure_group(name):
    if name in _group_cache:
        return _group_cache[name]
    existing = api('GET', '/property-group',
                   params=f'?filter[name]={urllib.parse.quote(name)}')
    if existing.get('data'):
        gid = existing['data'][0]['id']
    else:
        gid = uid()
        r = write('POST', '/property-group', {
            'id': gid, 'name': name,
            'displayType': 'text', 'sortingType': 'position',
        }, label=f'(gruppo "{name}")')
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


# ── Prodotti ───────────────────────────────────────────────────────────────────
def find_product(number):
    r = api('GET', '/product',
            params=f'?filter[productNumber]={urllib.parse.quote(number)}&limit=1')
    return r['data'][0] if r.get('data') else None


def seed_product(entry, ctx):
    tax_id, tax_rate = ctx['tax']
    eur, channel = ctx['eur'], ctx['channel']
    is_single = not entry.get('variants')

    print(f'\n  ── {entry["productNumber"]} · {entry["name"]}')

    # ── Prodotto padre / singolo ──────────────────────────────────────────────
    existing = find_product(entry['productNumber'])

    if existing:
        pid = existing['id']
        _ok(f'Trovato id={pid}')
    elif NO_CREATE:
        _warn('Non trovato e --no-create attivo → skip')
        return
    else:
        pid = uid()
        gross = entry.get('price', 9.90)
        net   = round(gross / (1 + tax_rate / 100), 4)
        payload = {
            'id': pid,
            'name': entry['name'],
            'productNumber': entry['productNumber'],
            'taxId': tax_id,
            'active': True,
            'stock': entry.get('stock', 0) if is_single else 0,
            'price': [{'currencyId': eur, 'gross': gross, 'net': net, 'linked': True}],
            'visibilities': [{'salesChannelId': channel, 'visibility': 30}],
        }
        if entry.get('shippingWeight'):
            payload['weight'] = entry['shippingWeight']

        if entry.get('variantGroup') and entry['variants']:
            gid = ensure_group(entry['variantGroup'])
            opt_ids = [ensure_option(gid, v['option']) for v in entry['variants']]
            payload['configuratorSettings'] = [{'optionId': o} for o in opt_ids if o]

        r = write('POST', '/product', payload,
                  label=f'(crea {entry["productNumber"]})')
        if isinstance(r, dict) and 'error' in r:
            _fail(f'Creazione fallita: {r["msg"][:300]}')
            return
        if not DRY_RUN:
            _ok(f'Padre creato (prezzo placeholder {gross:.2f}€)')

    # ── Arricchimento padre (nome + descrizione + custom field + proprietà) ────
    write('PATCH', f'/product/{pid}', {
        'name': entry['name'],
        'description': entry.get('description', ''),
        'customFields': entry.get('customFields', {}),
    }, label='(padre: arricchimento)')
    link_properties(pid, entry.get('properties', []))
    if not DRY_RUN:
        _ok('Padre arricchito')

    # ── Varianti ──────────────────────────────────────────────────────────────
    for variant in entry.get('variants', []):
        vnum = variant['productNumber']
        vexisting = find_product(vnum)

        if vexisting:
            vid = vexisting['id']
            _ok(f'  Variante {vnum} trovata id={vid}')
        elif NO_CREATE:
            _warn(f'  Variante {vnum} non trovata → skip')
            continue
        else:
            vid = uid()
            vgross = variant['price']
            vnet   = round(vgross / (1 + tax_rate / 100), 4)
            gid = ensure_group(entry['variantGroup'])
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
                _warn(f'  Creazione variante {vnum}: {vr["msg"][:160]}')
                continue
            if not DRY_RUN:
                _ok(f'  Variante {vnum} ({variant["option"]}) creata @ {vgross:.2f}€')

        # Arricchimento variante
        write('PATCH', f'/product/{vid}', {
            'customFields': variant.get('customFields', {}),
        }, label=f'(variante {vnum}: custom fields)')
        link_properties(vid, variant.get('properties', []))
        if not DRY_RUN:
            _ok(f'  Variante {vnum} arricchita')


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print('╔══════════════════════════════════════════════════════════════╗')
    print('║   SEED COMPLETO CAPPERIFICIO CARO  –  Shopware 6             ║')
    print('╚══════════════════════════════════════════════════════════════╝')
    print(f'  Backend  : {BASE}')
    print(f'  Prodotti : {len(PRODUCTS)} prodotti padre ({sum(len(p.get("variants",[]))+1 for p in PRODUCTS)} SKU totali)')
    print(f'  Modalità : {"DRY-RUN (nessuna scrittura)" if DRY_RUN else "SCRITTURA"}'
          f'{" · no-create" if NO_CREATE else ""}\n')

    try:
        authenticate()
    except Exception as e:
        _fail(f'Autenticazione fallita: {e}')
        print('  → Verifica --base, --user, --pass')
        sys.exit(1)

    tax   = get_tax_id(10)
    eur   = get_currency_id()
    chan  = get_sales_channel_id()

    if not all([tax[0], eur, chan]):
        _fail('Risorse base mancanti (tax/EUR/sales-channel). Configura Shopware prima.')
        sys.exit(1)
    _ok(f'IVA={tax[1]}%  EUR ok  SalesChannel ok')

    ctx = {'tax': tax, 'eur': eur, 'channel': chan}

    for entry in PRODUCTS:
        _step(f'{entry["productNumber"]} — {entry["name"]}')
        seed_product(entry, ctx)

    print()
    print('╔══════════════════════════════════════════════════════════════╗')
    print(f'║  {"DRY-RUN COMPLETATO" if DRY_RUN else "SEED COMPLETATO"}'.ljust(62) + '║')
    print('╚══════════════════════════════════════════════════════════════╝')
    if not DRY_RUN:
        print("""
Prossimi passi:
  → Verifica in Admin: Catalogo → Prodotti → controlla varianti e proprietà
  → Aggiorna prezzi se necessario (i nuovi hanno il prezzo inserito nello script)
  → Carica le immagini prodotto (cover + varianti) in Admin
  → Per le categorie: assegnale manualmente se non presenti (Admin → Catalogo → Categorie)
  → Apri ogni product page e verifica: scheda tecnica, badge calibro, bullet, accordion
""")


if __name__ == '__main__':
    main()
