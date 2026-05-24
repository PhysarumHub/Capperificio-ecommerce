#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix completo Shopware per produzione:
  1. Crea aliquota IVA 22% (standard IT)
  2. Crea metodo pagamento PayPal (+ assegna a Headless)
  3. Assegna "Spedizione Standard" (già prezzata) al canale Headless
  4. Rimuove spedizioni senza prezzi dal canale Headless
  5. Imposta "Spedizione Standard" come default del canale
  6. Rimuove regole duplicate
  7. Aggiunge prezzi mancanti su Italia + Europa Est
  8. Aggiunge dominio frontend al Sales Channel (CORS)
  9. Aggiorna stock dei prodotti a 0
"""

import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
import requests, json, uuid

BASE     = "http://SHOPWARE_HOST_REDACTED:8090"
ACCESS_KEY = "VITE_SHOPWARE_ACCESS_KEY_REDACTED"

# ── Auth ────────────────────────────────────────────────────────────────
r = requests.post(f"{BASE}/api/oauth/token", json={
    "grant_type": "password", "client_id": "administration",
    "username": "admin", "password": "SHOPWARE_ADMIN_PASS", "scope": "write"
})
r.raise_for_status()
token = r.json()["access_token"]
h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def search(ep, body=None):
    b = {"limit": 200, **(body or {})}
    r = requests.post(f"{BASE}/api/search/{ep}", headers=h, json=b)
    return r.json().get("data", []) if r.ok else []

def post(ep, data):
    r = requests.post(f"{BASE}/api/{ep}", headers=h, json=data)
    if r.status_code not in (200, 201, 204):
        print(f"  !! POST /{ep} → {r.status_code}: {r.text[:200]}")
    return r

def patch(ep, data):
    r = requests.patch(f"{BASE}/api/{ep}", headers=h, json=data)
    if r.status_code not in (200, 204):
        print(f"  !! PATCH /{ep} → {r.status_code}: {r.text[:200]}")
    return r

def delete(ep):
    r = requests.delete(f"{BASE}/api/{ep}", headers=h)
    return r

def make_uuid():
    return uuid.uuid4().hex  # 32 hex chars, no dashes

SEP = "-" * 60

print("=" * 60)
print("FIX SHOPWARE PRODUZIONE")
print("=" * 60)

# ════════════════════════════════════════════════════════════════
# 0. Raccolta dati base
# ════════════════════════════════════════════════════════════════
print("\n[0] Raccolta dati base...")

# Valuta EUR
currencies = search("currency")
eur_id = next((c["id"] for c in currencies if c["attributes"].get("isoCode") == "EUR"), None)
print(f"  EUR currency id: {eur_id[:8] if eur_id else 'NON TROVATA'}")

# Delivery time (primo disponibile)
delivery_times = search("delivery-time")
delivery_time_id = delivery_times[0]["id"] if delivery_times else None
print(f"  Delivery time: {delivery_time_id[:8] if delivery_time_id else 'NESSUNO'}")

# Sales Channel Headless
channels = search("sales-channel")
headless = next((c for c in channels if "eadless" in c.get("attributes", {}).get("name", "")), None)
headless_id = headless["id"] if headless else None
print(f"  Headless SC id: {headless_id[:8] if headless_id else 'NON TROVATO'}")

# Payment methods esistenti
payments = search("payment-method")
pay_map = {p.get("attributes", {}).get("name", ""): p["id"] for p in payments}
print(f"  Metodi pagamento: {list(pay_map.keys())}")

# Shipping methods
shipping = search("shipping-method")
ship_map = {s.get("attributes", {}).get("name", ""): s["id"] for s in shipping}
print(f"  Metodi spedizione: {list(ship_map.keys())}")

# "Spedizione Standard" id (già prezzata)
spedizione_standard_id = ship_map.get("Spedizione Standard")
spedizione_italia_id   = ship_map.get("Spedizione Standard Italia")
spedizione_europa_est_id = ship_map.get("Spedizione Europa Est")
print(f"  Spedizione Standard: {spedizione_standard_id[:8] if spedizione_standard_id else 'NON TROVATA'}")
print(f"  Spedizione Standard Italia: {spedizione_italia_id[:8] if spedizione_italia_id else 'NON TROVATA'}")

# Tax IDs
taxes = search("tax")
tax_map = {t["attributes"].get("taxRate"): t["id"] for t in taxes}
tax_22_id = tax_map.get(22.0)
tax_10_id = tax_map.get(10.0)
tax_4_id  = tax_map.get(4.0)
print(f"  IVA 22%: {tax_22_id[:8] if tax_22_id else 'MANCANTE'}")
print(f"  IVA 10%: {tax_10_id[:8] if tax_10_id else 'MANCANTE'}")
print(f"  IVA 4%:  {tax_4_id[:8] if tax_4_id else 'MANCANTE'}")

# Paesi
countries = search("country")
country_map = {c["attributes"].get("iso"): c["id"] for c in countries}

# Regole
rules = search("rule")
rule_name_to_ids = {}
for r in rules:
    name = r.get("attributes", {}).get("name", "")
    rule_name_to_ids.setdefault(name, []).append(r["id"])

# Prezzi spedizione
shipping_prices = search("shipping-method-price")

# ════════════════════════════════════════════════════════════════
# 1. Crea aliquota IVA 22% se mancante
# ════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("[1] Aliquota IVA 22% (standard italiana)")
print(SEP)

if tax_22_id:
    print("  OK - Già esistente")
else:
    r = post("tax", {
        "name": "Aliquota standard 22%",
        "taxRate": 22.0,
        "position": 1,
    })
    if r.status_code in (200, 201):
        resp_data = r.json()
        tax_22_id = resp_data.get("data", {}).get("id", "")
        print(f"  CREATA IVA 22% [{tax_22_id[:8]}]")
    elif r.status_code == 204:
        taxes = search("tax")
        tax_22_id = next((t["id"] for t in taxes if t["attributes"].get("taxRate") == 22.0), None)
        print(f"  CREATA IVA 22% [{tax_22_id[:8] if tax_22_id else '?'}]")
    else:
        print(f"  ERRORE: {r.text[:200]}")

# ════════════════════════════════════════════════════════════════
# 2. Crea metodo di pagamento PayPal
# ════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("[2] Metodo di pagamento PayPal")
print(SEP)

paypal_id = pay_map.get("PayPal")
if paypal_id:
    print(f"  OK - Già esistente [{paypal_id[:8]}]")
else:
    r = post("payment-method", {
        "name": "PayPal",
        "active": True,
        "description": "Paga in modo sicuro con PayPal. Accettiamo anche le principali carte di credito tramite PayPal.",
        "position": 2,
        "handlerIdentifier": "Shopware\\Core\\Checkout\\Payment\\Cart\\PaymentHandler\\DefaultPayment",
        "translations": {
            "it-IT": {
                "name": "PayPal",
                "description": "Paga in modo sicuro con PayPal.",
            },
            "en-GB": {
                "name": "PayPal",
                "description": "Pay securely with PayPal.",
            },
        }
    })
    if r.status_code in (200, 201):
        paypal_id = r.json().get("data", {}).get("id", "")
        print(f"  CREATO PayPal [{paypal_id[:8] if paypal_id else '?'}]")
    elif r.status_code == 204:
        # Rileggi
        payments = search("payment-method")
        paypal_id = next((p["id"] for p in payments if p.get("attributes",{}).get("name") == "PayPal"), None)
        print(f"  CREATO PayPal [{paypal_id[:8] if paypal_id else '?'}]")

# Aggiorna Stripe per assicurarci che sia attivo e abbia il nome giusto
stripe_id = pay_map.get("Stripe")
if stripe_id:
    patch(f"payment-method/{stripe_id}", {
        "active": True,
        "translations": {
            "it-IT": {
                "name": "Carta di credito / debito",
                "description": "Paga con carta Visa, Mastercard, American Express e altre carte.",
            },
            "en-GB": {
                "name": "Credit / Debit Card",
                "description": "Pay with Visa, Mastercard, American Express and more.",
            },
        }
    })
    print(f"  Stripe [{stripe_id[:8]}] → aggiornato nome italiano")

# ════════════════════════════════════════════════════════════════
# 3. Crea spedizione Europa Ovest se mancante + prezzi
# ════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("[3] Metodi spedizione con prezzi corretti")
print(SEP)

# Controlla se "Spedizione Standard" ha già i prezzi giusti
std_prices = [p for p in shipping_prices
              if p.get("attributes", {}).get("shippingMethodId") == spedizione_standard_id]

print(f"  'Spedizione Standard' ha {len(std_prices)} prezzi configurati")
for p in std_prices:
    a = p.get("attributes", {})
    cp = (a.get("currencyPrice") or [{}])[0] if a.get("currencyPrice") else {}
    gross = cp.get("gross", "?")
    rule = a.get("ruleId", "NESSUNA")[:8] if a.get("ruleId") else "NESSUNA"
    print(f"    → EUR {gross} | rule: {rule}")

# Verifica la disponibilità di una regola "sempre attiva" per "Spedizione Standard"
always_valid_rule = rule_name_to_ids.get("Always valid (Default)", [None])[0]
if not always_valid_rule:
    always_valid_rule = rule_name_to_ids.get("Cart >= 0", [None])[0]
print(f"  Regola 'sempre attiva': {always_valid_rule[:8] if always_valid_rule else 'NON TROVATA'}")

# Crea Europa Ovest se mancante
spedizione_europa_ovest_id = ship_map.get("Spedizione Europa Ovest")
if not spedizione_europa_ovest_id and delivery_time_id:
    print("  Creazione 'Spedizione Europa Ovest'...")
    r = post("shipping-method", {
        "name": "Spedizione Europa Ovest",
        "technicalName": "spedizione_europa_ovest",
        "active": True,
        "description": "Consegna in 5-8 giorni verso Francia, Germania, Spagna e altri paesi dell'Europa Occidentale.",
        "deliveryTimeId": delivery_time_id,
        "availabilityRuleId": always_valid_rule,
        "translations": {
            "it-IT": {
                "name": "Spedizione Europa Ovest",
                "description": "5-8 giorni lavorativi. Francia, Germania, Spagna, Portogallo, Belgio, Olanda e altri.",
            },
        }
    })
    if r.status_code in (200, 201, 204):
        shipping = search("shipping-method")
        ship_map = {s.get("attributes",{}).get("name",""): s["id"] for s in shipping}
        spedizione_europa_ovest_id = ship_map.get("Spedizione Europa Ovest")
        print(f"  CREATA Spedizione Europa Ovest [{spedizione_europa_ovest_id[:8] if spedizione_europa_ovest_id else '?'}]")

# ════════════════════════════════════════════════════════════════
# 4. Aggiungi prezzi a Italia e Europa Est (se vuoti)
# ════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("[4] Prezzi spedizione Italia + Europa Est + Europa Ovest")
print(SEP)

use_tax_id = tax_22_id or tax_10_id or (list(tax_map.values())[0] if tax_map else None)

def has_prices(method_id):
    return any(
        p.get("attributes", {}).get("shippingMethodId") == method_id
        and (p.get("attributes", {}).get("currencyPrice") or [{}])[0].get("gross") is not None
        for p in shipping_prices
    )

def add_price(method_id, gross, rule_id, label):
    if not method_id or not eur_id:
        print(f"  SKIP {label} — metodo o valuta mancanti")
        return
    net = round(gross / 1.22, 4)
    r = post(f"shipping-method/{method_id}/prices", {
        "shippingMethodId": method_id,
        "ruleId": rule_id,
        "calculation": 1,
        "quantityStart": 1,
        "currencyPrice": [{
            "currencyId": eur_id,
            "net": net,
            "gross": gross,
            "linked": True,
        }],
        "taxId": use_tax_id,
    })
    if r.status_code in (200, 201, 204):
        print(f"  OK  {label} → EUR {gross}")
    else:
        print(f"  ERR {label}: {r.text[:150]}")

# Ottieni/crea regole per i paesi
def get_or_create_rule(name, description, country_isos):
    """Usa il primo match esistente o crea la regola."""
    ids = rule_name_to_ids.get(name, [])
    if ids:
        return ids[0]

    # Crea regola
    r = post("rule", {
        "name": name,
        "description": description,
        "priority": 10,
        "conditions": [],
    })
    if r.status_code not in (200, 201, 204):
        print(f"  ERR creazione regola '{name}': {r.text[:100]}")
        return None

    rule_id = None
    if r.status_code in (200, 201):
        rule_id = r.json().get("data", {}).get("id")
    if not rule_id:
        fresh_rules = search("rule", {"filter": [{"type": "equals", "field": "name", "value": name}]})
        rule_id = fresh_rules[0]["id"] if fresh_rules else None

    if rule_id and country_isos:
        country_ids = [country_map[iso] for iso in country_isos if iso in country_map]
        post("rule-condition", {
            "ruleId": rule_id,
            "type": "customerShippingCountry",
            "value": {"operator": "=", "countryIds": country_ids},
            "position": 0,
        })

    return rule_id

EUROPA_OVEST_ISO = ["DE", "FR", "ES", "PT", "AT", "BE", "NL", "LU", "CH",
                    "IE", "GB", "DK", "SE", "NO", "FI", "IS"]
EUROPA_EST_ISO   = ["PL", "CZ", "SK", "HU", "RO", "BG", "HR", "SI", "RS",
                    "ME", "MK", "AL", "GR", "CY", "MT", "EE", "LV", "LT"]

# Regola "always valid" per il prezzo base
rule_always = always_valid_rule

# Aggiungi prezzi a Europa Ovest se mancanti
if spedizione_europa_ovest_id and not has_prices(spedizione_europa_ovest_id):
    add_price(spedizione_europa_ovest_id, 9.90, rule_always, "Europa Ovest base €9.90")
else:
    print(f"  Prezzi Europa Ovest: {'GIA OK' if spedizione_europa_ovest_id else 'METODO MANCANTE'}")

# Aggiungi prezzi a Europa Est se mancanti
if spedizione_europa_est_id and not has_prices(spedizione_europa_est_id):
    add_price(spedizione_europa_est_id, 12.90, rule_always, "Europa Est base €12.90")
else:
    print(f"  Prezzi Europa Est: {'GIA OK' if spedizione_europa_est_id else 'METODO MANCANTE'}")

# Per la spedizione Italia: crea i prezzi con regole carrello
# Prezzo standard IT
rule_it_gratuita_name = "Italia - Spedizione Gratuita sopra 50"
rule_it_gratuita = get_or_create_rule(rule_it_gratuita_name,
    "Carrello IT >= EUR 50 — spedizione gratuita", [])

# Aggiungi prezzi a Spedizione Italia se vuoti
if spedizione_italia_id and not has_prices(spedizione_italia_id):
    print("  Aggiunta prezzi a 'Spedizione Standard Italia'...")
    add_price(spedizione_italia_id, 4.90, rule_always, "Italia standard €4.90")
    add_price(spedizione_italia_id, 0.00, rule_it_gratuita, "Italia gratuita sopra €50")
else:
    print(f"  Prezzi Italia: {'GIA OK' if spedizione_italia_id else 'METODO MANCANTE'}")

# ════════════════════════════════════════════════════════════════
# 5. Assegna metodi al Headless Sales Channel
# ════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("[5] Assegnazione al canale Headless")
print(SEP)

if not headless_id:
    print("  ERRORE: Headless channel non trovato!")
else:
    # Recupera lo stato attuale del canale
    ch_r = requests.get(
        f"{BASE}/api/sales-channel/{headless_id}?"
        "associations[shippingMethods][]=&associations[paymentMethods][]=",
        headers=h
    )
    ch_data = ch_r.json().get("data", {})
    ch_rel = ch_data.get("relationships", {})
    current_ship = [s["id"] for s in ch_rel.get("shippingMethods", {}).get("data", [])]
    current_pay  = [p["id"] for p in ch_rel.get("paymentMethods", {}).get("data", [])]

    print(f"  Spedizioni attuali: {[s[:8] for s in current_ship]}")
    print(f"  Pagamenti attuali:  {[p[:8] for p in current_pay]}")

    # Spedizioni da assegnare
    new_shipping = list(set(current_ship))

    # Rimuovi spedizioni senza prezzi (Spedizione Standard Italia se non ha prezzi)
    methods_without_prices = []
    for mid in current_ship:
        has_p = any(
            p.get("attributes", {}).get("shippingMethodId") == mid
            for p in shipping_prices
        )
        if not has_p:
            methods_without_prices.append(mid)

    for mid in methods_without_prices:
        name = next((s.get("attributes",{}).get("name","?") for s in shipping if s["id"] == mid), "?")
        print(f"  Rimovendo senza prezzi: {name} [{mid[:8]}]")
        new_shipping = [s for s in new_shipping if s != mid]

    # Aggiungi spedizioni richieste
    for mid, name in [
        (spedizione_standard_id, "Spedizione Standard"),
        (spedizione_italia_id, "Spedizione Standard Italia"),
        (spedizione_europa_ovest_id, "Spedizione Europa Ovest"),
        (spedizione_europa_est_id, "Spedizione Europa Est"),
    ]:
        if mid and mid not in new_shipping:
            new_shipping.append(mid)
            print(f"  + Aggiunto: {name} [{mid[:8]}]")

    # Aggiorna shipping del canale
    r_ch = patch(f"sales-channel/{headless_id}", {
        "shippingMethods": [{"id": mid} for mid in new_shipping if mid],
        **({"shippingMethodId": spedizione_italia_id or spedizione_standard_id} if (spedizione_italia_id or spedizione_standard_id) else {}),
    })
    if r_ch.status_code in (200, 204):
        print(f"  OK Spedizioni aggiornate: {len(new_shipping)} metodi")

    # Pagamenti da assegnare
    new_payments = list(set(current_pay))
    for pid, name in [
        (paypal_id, "PayPal"),
        (stripe_id, "Stripe/Carta"),
    ]:
        if pid and pid not in new_payments:
            new_payments.append(pid)
            print(f"  + Aggiunto pagamento: {name} [{pid[:8]}]")

    r_ch2 = patch(f"sales-channel/{headless_id}", {
        "paymentMethods": [{"id": pid} for pid in new_payments if pid],
    })
    if r_ch2.status_code in (200, 204):
        print(f"  OK Pagamenti aggiornati: {len(new_payments)} metodi")

# ════════════════════════════════════════════════════════════════
# 6. Rimuovi regole duplicate
# ════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("[6] Pulizia regole duplicate")
print(SEP)

for name, ids in rule_name_to_ids.items():
    if len(ids) > 1:
        # Tieni il primo, elimina i duplicati
        to_delete = ids[1:]
        for rid in to_delete:
            r = delete(f"rule/{rid}")
            if r.status_code in (200, 204):
                print(f"  RIMOSSA regola duplicata '{name}' [{rid[:8]}]")
            else:
                print(f"  SKIP '{name}' [{rid[:8]}] → {r.status_code} (probabilmente in uso)")

# ════════════════════════════════════════════════════════════════
# 7. Stock dei prodotti a 0
# ════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("[7] Prodotti con stock = 0 (impostazione stock a 50)")
print(SEP)

zero_stock = search("product", {
    "filter": [
        {"type": "equals", "field": "stock", "value": 0},
        {"type": "equals", "field": "active", "value": True},
        {"type": "equals", "field": "parentId", "value": None},
    ],
    "includes": {"product": ["id", "name", "stock", "active"]},
})

if not zero_stock:
    print("  Nessun prodotto attivo con stock 0")
else:
    for p in zero_stock:
        a = p.get("attributes", {}) or {}
        name = a.get("name") or "(variante)"
        pid = p["id"]
        r = patch(f"product/{pid}", {"stock": 50})
        if r.status_code in (200, 204):
            print(f"  OK  {str(name)[:45]} → stock: 50")
        else:
            print(f"  ERR {str(name)[:45]}: {r.text[:80]}")

# ════════════════════════════════════════════════════════════════
# 8. Dominio / CORS - aggiungi frontend Vercel
# ════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("[8] Dominio per CORS")
print(SEP)

if headless_id:
    # Recupera i domini attuali
    domains_r = requests.get(f"{BASE}/api/sales-channel/{headless_id}/domains", headers=h)
    domains = domains_r.json().get("data", []) if domains_r.ok else []
    existing_urls = [d.get("attributes", {}).get("url", "") for d in domains]
    print(f"  Domini attuali: {existing_urls}")

    # Linguaggi
    langs_r = search("language")
    it_lang = next((l for l in langs_r if "talio" in l.get("attributes",{}).get("name","")), None)
    en_lang = next((l for l in langs_r if l.get("attributes",{}).get("name","") == "English"), None)
    lang_id = (it_lang or en_lang or langs_r[0])["id"] if langs_r else None

    to_add = [
        "https://capperificiocaro.vercel.app",
        "http://localhost:5173",
    ]
    for url in to_add:
        if any(url in eu for eu in existing_urls):
            print(f"  GIA OK {url}")
        else:
            r = post("sales-channel-domain", {
                "salesChannelId": headless_id,
                "url": url,
                "languageId": lang_id,
                "currencyId": eur_id,
                "snippetSetId": None,
            })
            if r.status_code in (200, 201, 204):
                print(f"  AGGIUNTO {url}")
            else:
                # Prova senza snippetSetId come null
                snippet_sets = search("snippet-set")
                snippet_id = snippet_sets[0]["id"] if snippet_sets else None
                r2 = post("sales-channel-domain", {
                    "salesChannelId": headless_id,
                    "url": url,
                    "languageId": lang_id,
                    "currencyId": eur_id,
                    "snippetSetId": snippet_id,
                })
                if r2.status_code in (200, 201, 204):
                    print(f"  AGGIUNTO {url}")
                else:
                    print(f"  WARN {url}: {r2.text[:150]}")

# ════════════════════════════════════════════════════════════════
# 9. Verifica finale via Store API
# ════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("[9] VERIFICA FINALE — Store API (vista checkout)")
print(SEP)

sh = {"sw-access-key": ACCESS_KEY, "Content-Type": "application/json"}

r_pay = requests.post(f"{BASE}/store-api/payment-method",
    headers=sh,
    json={"onlyAvailable": True,
          "includes": {"payment_method": ["id", "name", "handlerIdentifier", "active"]}})
r_ship = requests.post(f"{BASE}/store-api/shipping-method",
    headers=sh,
    json={"onlyAvailable": True,
          "includes": {"shipping_method": ["id", "name", "active", "prices"]}})

pay_list  = r_pay.json().get("elements", []) if r_pay.ok else []
ship_list = r_ship.json().get("elements", []) if r_ship.ok else []

print(f"  Metodi PAGAMENTO visibili ({len(pay_list)}):")
stripe_ok = False
paypal_ok = False
for p in pay_list:
    name = p.get("name") or p.get("translated", {}).get("name") or "?"
    handler = p.get("handlerIdentifier", "") or ""
    is_stripe = "stripe" in name.lower() or "carta" in name.lower() or "card" in name.lower()
    is_paypal = "paypal" in name.lower()
    if is_stripe: stripe_ok = True
    if is_paypal: paypal_ok = True
    flag = " [STRIPE]" if is_stripe else (" [PAYPAL]" if is_paypal else "")
    print(f"    - {name} [{p.get('id','')[:8]}]{flag}")

print(f"  Metodi SPEDIZIONE visibili ({len(ship_list)}):")
for s in ship_list:
    name = s.get("name") or s.get("translated", {}).get("name") or "?"
    print(f"    - {name} [{s.get('id','')[:8]}]")

# ════════════════════════════════════════════════════════════════
# Riepilogo
# ════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("RIEPILOGO FINALE")
print("=" * 60)

ok  = []
err = []

if stripe_ok:   ok.append("Stripe/Carta visibile nel checkout")
else:           err.append("Stripe NON visibile nel checkout")

if paypal_ok:   ok.append("PayPal visibile nel checkout")
else:           err.append("PayPal NON visibile nel checkout (potrebbe richiedere riavvio cache)")

if len(ship_list) >= 1: ok.append(f"{len(ship_list)} metodo/i spedizione visibile/i")
else:                   err.append("NESSUNA spedizione visibile nel checkout!")

if tax_22_id:   ok.append("IVA 22% presente")
else:           err.append("IVA 22% non creata")

for item in ok:
    print(f"  OK  {item}")
for item in err:
    print(f"  !!  {item}")

if not err:
    print("\n  Shopware pronto per ricevere ordini!")
else:
    print("\n  Verifica i punti con !! e ri-esegui lo script se necessario.")
