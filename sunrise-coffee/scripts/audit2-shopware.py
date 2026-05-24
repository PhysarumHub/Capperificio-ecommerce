#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
import requests, json

BASE = "http://SHOPWARE_HOST_REDACTED:8090"
ACCESS_KEY = "VITE_SHOPWARE_ACCESS_KEY_REDACTED"

# Auth admin
r = requests.post(f"{BASE}/api/oauth/token", json={
    "grant_type": "password", "client_id": "administration",
    "username": "admin", "password": "SHOPWARE_ADMIN_PASS", "scope": "write"
})
token = r.json()["access_token"]
h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def search(ep, body=None):
    b = {"limit": 200, **(body or {})}
    r = requests.post(f"{BASE}/api/search/{ep}", headers=h, json=b)
    return r.json().get("data", []) if r.ok else []

def get_api(ep):
    r = requests.get(f"{BASE}/api/{ep}", headers=h)
    return r.json()

SEP = "-" * 60

# ── A. PREZZI SPEDIZIONE (raw) ───────────────────────────────────────
print("\n=== A. PREZZI SPEDIZIONE (raw JSON) ===")
prices = search("shipping-method-price")
for p in prices:
    a = p.get("attributes", {})
    raw_price = a.get("currencyPrice") or a.get("price") or a.get("prices") or "VUOTO"
    print(f"  [{p['id'][:8]}] method:{a.get('shippingMethodId','')[:8]} | "
          f"calculation:{a.get('calculation')} | quantityStart:{a.get('quantityStart')} | "
          f"currencyPrice:{json.dumps(raw_price)[:80]}")

# ── B. SHIPPING METHODS con associazioni ─────────────────────────────
print("\n=== B. METODI SPEDIZIONE + SALES CHANNEL ===")
# Verifica quali metodi sono assegnati al canale Headless
headless_r = requests.get(
    f"{BASE}/api/sales-channel/98432def-acbc-4a77-9e14-18f979899ca7?"
    "associations[shippingMethods][]=&associations[paymentMethods][]=",
    headers=h
)
if not headless_r.ok:
    # prova a trovare il canale Headless
    channels = search("sales-channel")
    headless = next((c for c in channels if "eadless" in c.get("attributes",{}).get("name","")), None)
    if headless:
        headless_r = requests.get(
            f"{BASE}/api/sales-channel/{headless['id']}?"
            "associations[shippingMethods][]=&associations[paymentMethods][]=",
            headers=h
        )

hdata = headless_r.json().get("data", {})
hrel = hdata.get("relationships", {})
sc_shipping = hrel.get("shippingMethods", {}).get("data", [])
sc_payments = hrel.get("paymentMethods", {}).get("data", [])
print(f"  Headless SC - Spedizioni assegnate: {len(sc_shipping)}")
for s in sc_shipping:
    print(f"    [{s['id'][:8]}]")
print(f"  Headless SC - Pagamenti assegnati: {len(sc_payments)}")
for p in sc_payments:
    print(f"    [{p['id'][:8]}]")

# ── C. STORE API - cosa vede il checkout ────────────────────────────
print("\n=== C. STORE API (vista del checkout) ===")
sh = {"sw-access-key": ACCESS_KEY, "Content-Type": "application/json"}

r_pay = requests.post(f"{BASE}/store-api/payment-method",
    headers=sh, json={"onlyAvailable": True})
r_ship = requests.post(f"{BASE}/store-api/shipping-method",
    headers=sh, json={"onlyAvailable": True})

pay_elements = r_pay.json().get("elements", []) if r_pay.ok else []
ship_elements = r_ship.json().get("elements", []) if r_ship.ok else []

print(f"  Pagamenti visibili al checkout: {len(pay_elements)}")
for p in pay_elements:
    stripe_ok = "stripe" in (p.get("handlerIdentifier","") or "").lower() or "stripe" in (p.get("name","") or "").lower()
    paypal_ok = "paypal" in (p.get("handlerIdentifier","") or "").lower() or "paypal" in (p.get("name","") or "").lower()
    flag = "[STRIPE OK]" if stripe_ok else ("[PAYPAL OK]" if paypal_ok else "")
    print(f"    - {p.get('name')} [{p.get('id','')[:8]}] {flag}")

print(f"  Spedizioni visibili al checkout: {len(ship_elements)}")
for s in ship_elements:
    print(f"    - {s.get('name')} [{s.get('id','')[:8]}] | price:{s.get('prices','N/A')}")

# ── D. PRODOTTI con prezzi ───────────────────────────────────────────
print("\n=== D. PRODOTTI + PREZZI ===")
products = search("product", {
    "limit": 50,
    "includes": {"product": ["id", "name", "price", "stock", "active", "availableStock"]}
})
print(f"  Totale prodotti: {len(products)}")
for p in products:
    a = p.get("attributes", {}) or {}
    name = a.get("name") or "(no name)"
    price_raw = a.get("price") or []
    gross = price_raw[0].get("gross") if price_raw else "?"
    stock = a.get("stock", "?")
    avail = a.get("availableStock", "?")
    active = a.get("active", "?")
    print(f"  [{p['id'][:8]}] {str(name)[:45]} | EUR {gross} | stock:{stock} avail:{avail} active:{active}")

# ── E. IVA - verifica per prodotti ──────────────────────────────────
print("\n=== E. ALIQUOTE IVA + TAX RULES ===")
taxes = search("tax")
for t in taxes:
    a = t.get("attributes", {})
    print(f"  [{t['id'][:8]}] '{a.get('name')}' = {a.get('taxRate')}%")
    # Verifica quanti prodotti usano questa aliquota
    prods_with_tax = search("product", {
        "filter": [{"type": "equals", "field": "taxId", "value": t["id"]}],
        "limit": 1
    })

# ── F. REGOLE duplicate ──────────────────────────────────────────────
print("\n=== F. REGOLE (verifica duplicati) ===")
rules = search("rule")
rule_names = {}
for r in rules:
    name = r.get("attributes", {}).get("name", "")
    rule_names.setdefault(name, []).append(r["id"])

for name, ids in rule_names.items():
    if len(ids) > 1:
        print(f"  [DUPLICATO] '{name}': {len(ids)} copie")
    else:
        print(f"  '{name}': OK")

# ── G. MAIL / ORDINI - configurazione ────────────────────────────────
print("\n=== G. STATO GENERALE NEGOZIO ===")
# Verifica se ci sono ordini esistenti
orders = search("order", {"limit": 5})
print(f"  Ordini esistenti: {len(orders)}")

# Controlla la lingua del negozio
langs = search("language")
for l in langs:
    a = l.get("attributes", {})
    print(f"  Lingua: {a.get('name')} [{l['id'][:8]}]")

print("\n=== RIEPILOGO PROBLEMI TROVATI ===")
print(SEP)

issues = []

# Check payment methods
pay_names = [p.get("name","").lower() for p in pay_elements]
if not any("stripe" in n for n in pay_names):
    issues.append("CRITICO: Nessun metodo 'Stripe' visibile nella Store API")
if not any("paypal" in n for n in pay_names):
    issues.append("CRITICO: Nessun metodo 'PayPal' nella Store API - mancante!")

# Check shipping
if len(ship_elements) == 0:
    issues.append("CRITICO: Nessun metodo di spedizione visibile nella Store API")

# Check prices
zero_prices = [p for p in prices if not (p.get("attributes",{}).get("currencyPrice") or p.get("attributes",{}).get("price"))]
if zero_prices:
    issues.append(f"ATTENZIONE: {len(zero_prices)} prezzi spedizione sembrano vuoti")

if not issues:
    print("  Nessun problema critico trovato!")
else:
    for i in issues:
        print(f"  !! {i}")
