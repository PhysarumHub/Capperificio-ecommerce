#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Audit completo del backend Shopware via Admin API"""

import sys
import io
import os
import pathlib
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import requests

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

SHOPWARE_URL = os.environ.get('SHOPWARE_URL', '').rstrip('/')
ADMIN_USER   = os.environ.get('SHOPWARE_ADMIN_USER', 'admin')
ADMIN_PASS   = os.environ.get('SHOPWARE_ADMIN_PASS', '')
ACCESS_KEY   = os.environ.get('VITE_SHOPWARE_ACCESS_KEY', '')

if not SHOPWARE_URL:
    sys.exit("❌  SHOPWARE_URL non impostata. Crea scripts/.env (vedi scripts/.env.example)")
if not ADMIN_PASS:
    sys.exit("❌  SHOPWARE_ADMIN_PASS non impostata. Crea scripts/.env (vedi scripts/.env.example)")
if not ACCESS_KEY:
    sys.exit("❌  VITE_SHOPWARE_ACCESS_KEY non impostata. Crea scripts/.env (vedi scripts/.env.example)")

BASE = SHOPWARE_URL

# ── Auth ─────────────────────────────────────────────────────────────────────
r = requests.post(f"{BASE}/api/oauth/token", json={
    "grant_type": "password", "client_id": "administration",
    "username": ADMIN_USER, "password": ADMIN_PASS, "scope": "write"
})
r.raise_for_status()
token = r.json()["access_token"]
h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def search(endpoint, body=None):
    b = {"limit": 200, **(body or {})}
    r = requests.post(f"{BASE}/api/search/{endpoint}", headers=h, json=b)
    if r.status_code != 200:
        return []
    return r.json().get("data", [])

SEP = "-" * 60

# 1. SALES CHANNELS
print("\n" + "=" * 60)
print("1. SALES CHANNELS")
print(SEP)
channels = search("sales-channel")
channel_ids = {}
for c in channels:
    a = c.get("attributes", {})
    cid = c['id']
    channel_ids[cid] = a.get('name', '?')
    print(f"  [{cid[:8]}] {a.get('name')} | active:{a.get('active')}")

# 2. PAYMENT METHODS
print("\n" + "=" * 60)
print("2. METODI DI PAGAMENTO")
print(SEP)
payments = search("payment-method")
if not payments:
    print("  NESSUN METODO DI PAGAMENTO")
else:
    for p in payments:
        a = p.get("attributes", {})
        handler = a.get("handlerIdentifier", "") or ""
        print(f"  [{p['id'][:8]}] {a.get('name')} | active:{a.get('active')} | handler:{handler[:70]}")

# 3. SHIPPING METHODS
print("\n" + "=" * 60)
print("3. METODI DI SPEDIZIONE")
print(SEP)
shipping = search("shipping-method")
if not shipping:
    print("  NESSUN METODO DI SPEDIZIONE")
else:
    for s in shipping:
        a = s.get("attributes", {})
        print(f"  [{s['id'][:8]}] {a.get('name')} | active:{a.get('active')}")

# 4. SHIPPING PRICES
print("\n" + "=" * 60)
print("4. PREZZI SPEDIZIONE")
print(SEP)
prices = search("shipping-method-price")
if not prices:
    print("  NESSUN PREZZO SPEDIZIONE CONFIGURATO")
else:
    for p in prices:
        a = p.get("attributes", {})
        price_list = a.get("price", [{}])
        gross = price_list[0].get("gross", "?") if price_list else "?"
        rule = a.get("ruleId", None)
        print(f"  [{p['id'][:8]}] shipping:[{a.get('shippingMethodId','')[:8]}] gross:EUR {gross} | rule:{rule[:8] if rule else 'NESSUNA'}")

# 5. COUNTRIES per sales channel
print("\n" + "=" * 60)
print("5. PAESI ABILITATI PER SALES CHANNEL")
print(SEP)
for cid, cname in channel_ids.items():
    r2 = requests.get(f"{BASE}/api/sales-channel/{cid}?associations[countries][]=", headers=h)
    data2 = r2.json().get("data", {})
    rel = data2.get("relationships", {}).get("countries", {}).get("data", [])
    print(f"  '{cname}': {len(rel)} paesi")

all_countries = search("country")
active_countries = [c for c in all_countries if c.get("attributes", {}).get("active")]
print(f"  Totale paesi in Shopware: {len(all_countries)} | attivi: {len(active_countries)}")

# 6. IVA
print("\n" + "=" * 60)
print("6. ALIQUOTE IVA")
print(SEP)
taxes = search("tax")
if not taxes:
    print("  NESSUNA ALIQUOTA IVA")
else:
    for t in taxes:
        a = t.get("attributes", {})
        print(f"  [{t['id'][:8]}] {a.get('name')} | {a.get('taxRate')}%")

# 7. CURRENCIES
print("\n" + "=" * 60)
print("7. VALUTE")
print(SEP)
currencies = search("currency")
for c in currencies:
    a = c.get("attributes", {})
    print(f"  [{c['id'][:8]}] {a.get('isoCode')} | {a.get('name')} | default:{a.get('isSystemDefault')}")

# 8. RULES
print("\n" + "=" * 60)
print("8. REGOLE ATTIVE")
print(SEP)
rules = search("rule")
if not rules:
    print("  NESSUNA REGOLA")
else:
    for r in rules:
        a = r.get("attributes", {})
        print(f"  [{r['id'][:8]}] {a.get('name')}")

# 9. CUSTOMER GROUPS
print("\n" + "=" * 60)
print("9. GRUPPI CLIENTI")
print(SEP)
groups = search("customer-group")
for g in groups:
    a = g.get("attributes", {})
    print(f"  [{g['id'][:8]}] {a.get('name')} | displayGross:{a.get('displayGross')}")

# 10. DELIVERY TIMES
print("\n" + "=" * 60)
print("10. TEMPI DI CONSEGNA")
print(SEP)
times = search("delivery-time")
if not times:
    print("  NESSUN TEMPO DI CONSEGNA")
else:
    for t in times:
        a = t.get("attributes", {})
        print(f"  [{t['id'][:8]}] {a.get('name')} | {a.get('min')}-{a.get('max')} {a.get('unit')}")

# 11. PRODUCTS (sample)
print("\n" + "=" * 60)
print("11. PRODOTTI (campione)")
print(SEP)
products = search("product", {"limit": 10})
if not products:
    print("  NESSUN PRODOTTO")
else:
    print(f"  Trovati {len(products)} prodotti (max 10 mostrati)")
    for p in products[:10]:
        a = p.get("attributes", {})
        price_raw = a.get("price", [{}])
        gross = price_raw[0].get("gross", "?") if price_raw else "?"
        stock = a.get("stock", "?")
        print(f"  [{p['id'][:8]}] {a.get('name','?')[:50]} | EUR {gross} | stock:{stock} | active:{a.get('active')}")

# 12. EMAILS / MAIL TEMPLATES
print("\n" + "=" * 60)
print("12. TEMPLATE EMAIL")
print(SEP)
mails = search("mail-template")
print(f"  Totale template email: {len(mails)}")

# 13. STORE API - Payment & Shipping (come li vede il checkout)
print("\n" + "=" * 60)
print("13. STORE API - Metodi visibili al checkout")
print(SEP)
sh = {"sw-access-key": ACCESS_KEY, "Content-Type": "application/json"}
r_pay  = requests.post(f"{BASE}/store-api/payment-method",  headers=sh, json={"onlyAvailable": True})
r_ship = requests.post(f"{BASE}/store-api/shipping-method", headers=sh, json={"onlyAvailable": True})

pay_list  = r_pay.json().get("elements", [])
ship_list = r_ship.json().get("elements", [])

print(f"  Metodi pagamento disponibili: {len(pay_list)}")
for p in pay_list:
    print(f"    - {p.get('name')} [{p.get('id','')[:8]}] handler:{p.get('handlerIdentifier','')[:60]}")

print(f"  Metodi spedizione disponibili: {len(ship_list)}")
for s in ship_list:
    print(f"    - {s.get('name')} [{s.get('id','')[:8]}]")

print("\n" + "=" * 60)
print("AUDIT COMPLETATO")
print("=" * 60)
