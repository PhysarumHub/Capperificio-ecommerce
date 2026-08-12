#!/usr/bin/env python3
"""
Configura le spedizioni Shopware 6 per tutta Europa.
- Crea o aggiorna un metodo di spedizione "Spedizione Standard Europa"
- Aggiunge tutte le nazioni europee alla regola di spedizione
- Imposta prezzi base per zona (Italia, Europa Ovest, Europa Est)

Uso: python setup_shopware_shipping.py

Prerequisiti:
- pip install requests
"""

import sys
try:
    import requests
except ImportError:
    print("Installa requests: pip install requests")
    sys.exit(1)

import json

# ── Configurazione ──────────────────────────────────────────────────────────
# Credenziali da scripts/.env (o --base/--user/--pass). Vedi scripts/_config.py.
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _config import shopware_config

_cfg          = shopware_config(api_suffix=False)
SHOPWARE_URL  = _cfg.base_url
ADMIN_USER    = _cfg.user
ADMIN_PASS    = _cfg.password

# ── Paesi europei divisi per zona ───────────────────────────────────────────
EUROPA_OVEST = [
    "IT", "DE", "FR", "ES", "PT", "AT", "BE", "NL", "LU", "CH",
    "IE", "GB", "DK", "SE", "NO", "FI", "IS",
]

EUROPA_EST = [
    "PL", "CZ", "SK", "HU", "RO", "BG", "HR", "SI", "RS", "BA",
    "ME", "MK", "AL", "GR", "CY", "MT", "EE", "LV", "LT", "BY",
    "UA", "MD",
]

TUTTI_EUROPA = EUROPA_OVEST + EUROPA_EST

# ── Prezzi spedizione ───────────────────────────────────────────────────────
PREZZO_ITALIA       = 4.90
PREZZO_EUROPA_OVEST = 9.90
PREZZO_EUROPA_EST   = 14.90
SOGLIA_GRATUITA     = 59.00   # Spedizione gratuita sopra questa cifra

# ── Helpers ─────────────────────────────────────────────────────────────────
session = requests.Session()

def get_token():
    resp = session.post(f"{SHOPWARE_URL}/api/oauth/token", json={
        "grant_type": "password",
        "client_id": "administration",
        "username": ADMIN_USER,
        "password": ADMIN_PASS,
        "scope": "write",
    })
    resp.raise_for_status()
    token = resp.json()["access_token"]
    session.headers.update({"Authorization": f"Bearer {token}"})
    print("✅ Autenticazione riuscita")

def get_all(endpoint, filters=None):
    body = {"limit": 500}
    if filters:
        body["filter"] = filters
    resp = session.post(f"{SHOPWARE_URL}/api/search/{endpoint}", json=body)
    resp.raise_for_status()
    return resp.json().get("data", [])

def get_country_ids():
    countries = get_all("country")
    mapping = {c["attributes"]["iso"]: c["id"] for c in countries}
    return mapping

def get_sales_channel_id():
    channels = get_all("sales-channel")
    for ch in channels:
        if ch["attributes"].get("typeId") == "8a243080f92e4c719546314b577cf82b":
            return ch["id"]
    # Fallback: primo canale disponibile
    return channels[0]["id"] if channels else None

def create_rule(name, description, priority=1):
    """Crea una regola vuota — le condizioni vengono aggiunte dopo."""
    resp = session.post(f"{SHOPWARE_URL}/api/rule", json={
        "name": name,
        "description": description,
        "priority": priority,
        "conditions": [],
    })
    if resp.status_code in (200, 204):
        return resp.headers.get("Location", "").split("/")[-1]
    resp.raise_for_status()

def get_delivery_time_id():
    times = get_all("delivery-time")
    if times:
        return times[0]["id"]
    # Crea un delivery time se non esiste
    resp = session.post(f"{SHOPWARE_URL}/api/delivery-time", json={
        "name": "3-7 giorni",
        "min": 3,
        "max": 7,
        "unit": "day",
    })
    resp.raise_for_status()
    return resp.json()["data"]["id"]

def create_shipping_method(name, description, delivery_time_id, active=True):
    technical_name = name.lower().replace(" ", "_").replace("à", "a").replace("è", "e").replace("ì", "i").replace("ò", "o").replace("ù", "u")
    resp = session.post(f"{SHOPWARE_URL}/api/shipping-method", json={
        "name": name,
        "technicalName": technical_name,
        "description": description,
        "active": active,
        "trackingUrl": None,
        "deliveryTimeId": delivery_time_id,
    })
    if resp.status_code in (200, 201, 204):
        # 204 = creato senza body, recupera l'ID cercando per nome
        if resp.status_code == 204 or not resp.text.strip():
            methods = get_all("shipping-method")
            for m in methods:
                if m["attributes"]["name"] == name:
                    return m["id"]
            return None
        return resp.json().get("data", {}).get("id")
    print(f"  ❌ Errore {resp.status_code}: {resp.text}")
    resp.raise_for_status()

def get_existing_shipping_methods():
    methods = get_all("shipping-method")
    return {m["attributes"]["name"]: m["id"] for m in methods}

def get_tax_id():
    taxes = get_all("tax")
    # Prende la prima aliquota disponibile (di solito 22% per IT)
    return taxes[0]["id"] if taxes else None

def set_shipping_price(method_id, rule_id, price, currency_id, tax_id):
    resp = session.post(f"{SHOPWARE_URL}/api/shipping-method/{method_id}/prices", json={
        "shippingMethodId": method_id,
        "ruleId": rule_id,
        "calculation": 1,  # 1 = prezzo fisso
        "quantityStart": 1,
        "price": [{
            "currencyId": currency_id,
            "net": round(price / 1.22, 4),
            "gross": price,
            "linked": True,
        }],
        "taxId": tax_id,
    })
    if resp.status_code in (200, 204):
        return True
    print(f"  ⚠ Errore prezzo: {resp.status_code} {resp.text[:200]}")
    return False

def get_currency_id():
    currencies = get_all("currency")
    for c in currencies:
        if c["attributes"]["isoCode"] == "EUR":
            return c["id"]
    return currencies[0]["id"] if currencies else None

def add_country_rule_condition(rule_id, country_ids):
    """Aggiunge una condizione 'paese in lista' alla regola."""
    resp = session.post(f"{SHOPWARE_URL}/api/rule-condition", json={
        "ruleId": rule_id,
        "type": "customerShippingCountry",
        "value": {
            "operator": "=",
            "countryIds": country_ids,
        },
        "position": 0,
    })
    if resp.status_code in (200, 204):
        return True
    print(f"  ⚠ Errore condizione: {resp.status_code} {resp.text[:300]}")
    return False

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    if ADMIN_PASS == "INSERISCI_PASSWORD_ADMIN":
        print("❌ Sostituisci ADMIN_PASS con la password di Shopware Admin.")
        return

    print(f"Connessione a {SHOPWARE_URL}...\n")
    get_token()

    # Dati di base
    country_map  = get_country_ids()
    currency_id  = get_currency_id()
    tax_id       = get_tax_id()

    print(f"  Trovate {len(country_map)} nazioni")
    print(f"  Valuta EUR: {currency_id}")
    print(f"  Aliquota fiscale: {tax_id}\n")

    # Filtra i country_id disponibili
    def ids_for(iso_list):
        result = []
        missing = []
        for iso in iso_list:
            if iso in country_map:
                result.append(country_map[iso])
            else:
                missing.append(iso)
        if missing:
            print(f"  ⚠ Nazioni non trovate in Shopware: {missing}")
        return result

    it_ids   = ids_for(["IT"])
    west_ids = ids_for([c for c in EUROPA_OVEST if c != "IT"])
    east_ids = ids_for(EUROPA_EST)

    delivery_time_id = get_delivery_time_id()
    print(f"  Delivery time ID: {delivery_time_id}\n")

    existing = get_existing_shipping_methods()

    # ── Metodo 1: Italia ───────────────────────────────────────────────────
    print("📦 Creazione metodo: Spedizione Standard Italia...")
    if "Spedizione Standard Italia" in existing:
        method_it_id = existing["Spedizione Standard Italia"]
        print(f"  → Già esistente: {method_it_id}")
    else:
        method_it_id = create_shipping_method(
            "Spedizione Standard Italia",
            f"Consegna in 3-5 giorni lavorativi. Gratuita sopra €{SOGLIA_GRATUITA:.0f}.",
            delivery_time_id,
        )
        print(f"  → Creato: {method_it_id}")

    # ── Metodo 2: Europa Ovest ─────────────────────────────────────────────
    print("📦 Creazione metodo: Spedizione Europa Ovest...")
    if "Spedizione Europa Ovest" in existing:
        method_west_id = existing["Spedizione Europa Ovest"]
        print(f"  → Già esistente: {method_west_id}")
    else:
        method_west_id = create_shipping_method(
            "Spedizione Europa Ovest",
            f"Consegna in 5-7 giorni lavorativi verso Francia, Germania, Spagna e altri paesi dell'Europa Occidentale.",
            delivery_time_id,
        )
        print(f"  → Creato: {method_west_id}")

    # ── Metodo 3: Europa Est ───────────────────────────────────────────────
    print("📦 Creazione metodo: Spedizione Europa Est...")
    if "Spedizione Europa Est" in existing:
        method_east_id = existing["Spedizione Europa Est"]
        print(f"  → Già esistente: {method_east_id}")
    else:
        method_east_id = create_shipping_method(
            "Spedizione Europa Est",
            f"Consegna in 7-10 giorni lavorativi verso Polonia, Romania, Ungheria e altri paesi dell'Europa Orientale.",
            delivery_time_id,
        )
        print(f"  → Creato: {method_east_id}")

    # ── Prezzi ─────────────────────────────────────────────────────────────
    print("\n💶 Configurazione prezzi...")

    methods = [
        (method_it_id,   "Italia",       PREZZO_ITALIA,       it_ids),
        (method_west_id, "Europa Ovest", PREZZO_EUROPA_OVEST, west_ids),
        (method_east_id, "Europa Est",   PREZZO_EUROPA_EST,   east_ids),
    ]

    for method_id, label, price, country_ids in methods:
        if not method_id:
            print(f"  ⚠ Metodo {label} non disponibile, salto.")
            continue

        # Crea regola per i paesi
        rule_id = create_rule(
            f"Paesi — {label}",
            f"Regola automatica per spedizioni verso {label}",
        )
        if rule_id:
            add_country_rule_condition(rule_id, country_ids)
            print(f"  ✅ Regola creata per {label} ({len(country_ids)} paesi)")
        else:
            rule_id = None
            print(f"  ⚠ Impossibile creare regola per {label}")

        ok = set_shipping_price(method_id, rule_id, price, currency_id, tax_id)
        if ok:
            print(f"  ✅ Prezzo {label}: €{price:.2f}")

    print(f"""
✅ Configurazione completata!

Riepilogo metodi di spedizione creati:
  • Spedizione Standard Italia    → €{PREZZO_ITALIA:.2f}
  • Spedizione Europa Ovest       → €{PREZZO_EUROPA_OVEST:.2f}
  • Spedizione Europa Est         → €{PREZZO_EUROPA_EST:.2f}
  • Spedizione gratuita sopra     → €{SOGLIA_GRATUITA:.2f}

Vai su Shopware Admin → Impostazioni → Spedizione per verificare.
""")

if __name__ == "__main__":
    main()
