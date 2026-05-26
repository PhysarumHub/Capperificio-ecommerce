#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io, os, pathlib
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
import requests, json

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

BASE       = os.environ.get('SHOPWARE_URL', '').rstrip('/')
ADMIN_USER = os.environ.get('SHOPWARE_ADMIN_USER', 'admin')
ADMIN_PASS = os.environ.get('SHOPWARE_ADMIN_PASS', '')
ACCESS_KEY = os.environ.get('VITE_SHOPWARE_ACCESS_KEY', '')

if not BASE:
    sys.exit("❌  SHOPWARE_URL non impostata. Crea scripts/.env (vedi scripts/.env.example)")
if not ADMIN_PASS:
    sys.exit("❌  SHOPWARE_ADMIN_PASS non impostata. Crea scripts/.env (vedi scripts/.env.example)")
if not ACCESS_KEY:
    sys.exit("❌  VITE_SHOPWARE_ACCESS_KEY non impostata. Crea scripts/.env (vedi scripts/.env.example)")

# ── Auth ─────────────────────────────────────────────────────────────────────
r = requests.post(f"{BASE}/api/oauth/token", json={
    "grant_type": "password", "client_id": "administration",
    "username": ADMIN_USER, "password": ADMIN_PASS, "scope": "write"
})
r.raise_for_status()
token = r.json()["access_token"]
h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def search(ep, body=None):
    b = {"limit": 200, **(body or {})}
    r = requests.post(f"{BASE}/api/search/{ep}", headers=h, json=b)
    return r.json().get("data", []) if r.ok else []

SEP = "-" * 60

# ── A. PREZZI SPEDIZIONE (raw) ───────────────────────────────────────────────
print("\n=== A. PREZZI SPEDIZIONE (raw JSON) ===")
prices = search("shipping-method-price")
for p in prices:
    a = p.get("attributes", {})
    raw_price = a.get("currencyPrice") or a.get("price") or a.get("prices") or "VUOTO"
    print(f"  [{p['id'][:8]}] method:{a.get('shippingMethodId','')[:8]} | "
          f"calculation:{a.get('calculation')} | quantityStart:{a.get('quantityStart')} | "
          f"currencyPrice:{json.dumps(raw_price)[:80]}")

# ── B. SHIPPING METHODS + SALES CHANNEL ─────────────────────────────────────
print("\n=== B. METODI SPEDIZIONE + SALES CHANNEL ===")
channels = search("sales-channel")
headless = next((c for c in channels if "eadless" in c.get("attributes", {}).get("name", "")), None)
if headless:
    headless_r = requests.get(
        f"{BASE}/api/sales-channel/{headless['id']}?"
        "associations[shippingMethods][]=&associations[paymentMethods][]=",
        headers=h
    )
    hdata = headless_r.json().get("data", {})
    hrel  = hdata.get("relationships", {})
    sc_shipping = hrel.get("shippingMethods", {}).get("data", [])
    sc_payments = hrel.get("paymentMethods",  {}).get("data", [])
    print(f"  Headless SC - Spedizioni assegnate: {len(sc_shipping)}")
    for s in sc_shipping:
        print(f"    [{s['id'][:8]}]")
    print(f"  Headless SC - Pagamenti assegnati: {len(sc_payments)}")
    for p in sc_payments:
        print(f"    [{p['id'][:8]}]")
else:
    print("  Headless channel non trovato")

# ── C. STORE API ─────────────────────────────────────────────────────────────
print("\n=== C. STORE API (vista del checkout) ===")
sh = {"sw-access-key": ACCESS_KEY, "Content-Type": "application/json"}
r_pay  = requests.post(f"{BASE}/store-api/payment-method",  headers=sh, json={"onlyAvailable": True})
r_ship = requests.post(f"{BASE}/store-api/shipping-method", headers=sh, json={"onlyAvailable": True})

pay_elements  = r_pay.json().get("elements", [])  if r_pay.ok  else []
ship_elements = r_ship.json().get("elements", []) if r_ship.ok else []

print(f"  Pagamenti visibili al checkout: {len(pay_elements)}")
for p in pay_elements:
    stripe_ok = "stripe" in (p.get("handlerIdentifier","") or "").lower() or "stripe" in (p.get("name","") or "").lower()
    paypal_ok = "paypal" in (p.get("name","") or "").lower()
    flag = "[STRIPE OK]" if stripe_ok else ("[PAYPAL OK]" if paypal_ok else "")
    print(f"    - {p.get('name')} [{p.get('id','')[:8]}] {flag}")

print(f"  Spedizioni visibili al checkout: {len(ship_elements)}")
for s in ship_elements:
    print(f"    - {s.get('name')} [{s.get('id','')[:8]}]")

# ── D. PRODOTTI + PREZZI ─────────────────────────────────────────────────────
print("\n=== D. PRODOTTI + PREZZI ===")
products = search("product", {
    "limit": 50,
    "includes": {"product": ["id", "name", "price", "stock", "active", "availableStock"]}
})
print(f"  Totale prodotti: {len(products)}")
for p in products:
    a = p.get("attributes", {}) or {}
    name      = a.get("name") or "(no name)"
    price_raw = a.get("price") or []
    gross     = price_raw[0].get("gross") if price_raw else "?"
    stock     = a.get("stock", "?")
    avail     = a.get("availableStock", "?")
    active    = a.get("active", "?")
    print(f"  [{p['id'][:8]}] {str(name)[:45]} | EUR {gross} | stock:{stock} avail:{avail} active:{active}")

# ── E. ALIQUOTE IVA ──────────────────────────────────────────────────────────
print("\n=== E. ALIQUOTE IVA ===")
taxes = search("tax")
for t in taxes:
    a = t.get("attributes", {})
    print(f"  [{t['id'][:8]}] '{a.get('name')}' = {a.get('taxRate')}%")

# ── F. REGOLE (verifica duplicati) ──────────────────────────────────────────
print("\n=== F. REGOLE (verifica duplicati) ===")
rules = search("rule")
rule_names = {}
for r in rules:
    name = r.get("attributes", {}).get("name", "")
    rule_names.setdefault(name, []).append(r["id"])
for name, ids in rule_names.items():
    tag = "[DUPLICATO]" if len(ids) > 1 else "OK"
    print(f"  {tag} '{name}': {len(ids)} copie")

# ── G. STATO GENERALE ────────────────────────────────────────────────────────
print("\n=== G. STATO GENERALE NEGOZIO ===")
orders = search("order", {"limit": 5})
print(f"  Ordini esistenti: {len(orders)}")
langs = search("language")
for l in langs:
    a = l.get("attributes", {})
    print(f"  Lingua: {a.get('name')} [{l['id'][:8]}]")

# ── RIEPILOGO ────────────────────────────────────────────────────────────────
print("\n=== RIEPILOGO PROBLEMI ===")
print(SEP)
issues = []
pay_names = [p.get("name", "").lower() for p in pay_elements]
if not any("stripe" in n or "carta" in n or "card" in n for n in pay_names):
    issues.append("CRITICO: Nessun metodo Stripe/Carta visibile nella Store API")
if not any("paypal" in n for n in pay_names):
    issues.append("ATTENZIONE: PayPal non visibile nella Store API")
if len(ship_elements) == 0:
    issues.append("CRITICO: Nessun metodo di spedizione visibile nella Store API")
zero_prices = [p for p in prices if not (p.get("attributes", {}).get("currencyPrice") or p.get("attributes", {}).get("price"))]
if zero_prices:
    issues.append(f"ATTENZIONE: {len(zero_prices)} prezzi spedizione sembrano vuoti")
if not issues:
    print("  Nessun problema critico trovato!")
else:
    for i in issues:
        print(f"  !! {i}")
