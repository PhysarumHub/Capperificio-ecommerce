#!/usr/bin/env python3
"""
Crea i primi 3 articoli di test su Strapi.
Uso: python seed_strapi_articles.py
"""

import urllib.request
import urllib.error
import json

STRAPI_URL = "http://SHOPWARE_HOST_REDACTED:1337"
STRAPI_TOKEN = "INCOLLA_QUI_IL_TOKEN_FULL_ACCESS"

ARTICLES = [
    {
        "title": "Come conservare i capperi sotto sale: guida pratica",
        "slug": "conservare-capperi-sotto-sale",
        "category": "Guide",
        "excerpt": (
            "Il sale marino è il metodo di conservazione più antico e migliore per i capperi. "
            "Scopri come mantenerli fragranti e saporiti a lungo, direttamente in dispensa."
        ),
        "content": [
            {
                "type": "paragraph",
                "children": [{"type": "text", "text": (
                    "I capperi sotto sale sono uno dei prodotti più preziosi della cucina mediterranea. "
                    "Conservarli nel modo giusto significa preservarne il profumo, la consistenza e il sapore intenso "
                    "che li rende indispensabili in cucina."
                )}]
            },
            {
                "type": "heading",
                "level": 2,
                "children": [{"type": "text", "text": "Perché il sale è il metodo migliore"}]
            },
            {
                "type": "paragraph",
                "children": [{"type": "text", "text": (
                    "A differenza dell'aceto, che tende a coprire il sapore naturale del cappero, "
                    "il sale marino grosso disidrata lentamente il prodotto mantenendo intatti gli oli essenziali "
                    "e i composti aromatici. Il risultato è un cappero che sa ancora di cappero: floreale, pungente, "
                    "con quella nota di macchia mediterranea che nessun altro ingrediente sa dare."
                )}]
            },
            {
                "type": "heading",
                "level": 2,
                "children": [{"type": "text", "text": "Come conservarli in casa"}]
            },
            {
                "type": "list",
                "format": "ordered",
                "children": [
                    {"type": "list-item", "children": [{"type": "text", "text": "Usa un barattolo di vetro a chiusura ermetica."}]},
                    {"type": "list-item", "children": [{"type": "text", "text": "Alterna strati di capperi e sale marino grosso, iniziando e finendo con il sale."}]},
                    {"type": "list-item", "children": [{"type": "text", "text": "Chiudi ermeticamente e conserva in luogo fresco e asciutto, lontano dalla luce diretta."}]},
                    {"type": "list-item", "children": [{"type": "text", "text": "Prima di usarli, sciacquali abbondantemente sotto acqua fredda per eliminare il sale in eccesso."}]},
                ],
            },
            {
                "type": "heading",
                "level": 2,
                "children": [{"type": "text", "text": "Quanto durano?"}]
            },
            {
                "type": "paragraph",
                "children": [{"type": "text", "text": (
                    "Conservati correttamente sotto sale, i capperi durano fino a 12 mesi senza perdere qualità. "
                    "Controlla periodicamente che il sale non si sia eccessivamente umidificato: "
                    "in quel caso puoi aggiungerne altro fresco. "
                    "I capperi del Capperificio di Racale vengono confezionati già sotto sale marino delle saline salentine, "
                    "pronti per essere conservati direttamente nel barattolo originale."
                )}]
            },
        ],
    },
    {
        "title": "Capperi in cucina: 5 abbinamenti da provare",
        "slug": "capperi-in-cucina-5-abbinamenti",
        "category": "Ricette",
        "excerpt": (
            "Dal pesce spada alla pasta alla Norma, i capperi di Racale esaltano ogni piatto. "
            "Ecco cinque ricette della tradizione pugliese e siciliana da mettere in tavola."
        ),
        "content": [
            {
                "type": "paragraph",
                "children": [{"type": "text", "text": (
                    "Il cappero è uno di quegli ingredienti che trasformano un piatto semplice in qualcosa di memorabile. "
                    "Piccolo, intenso, capace di bilanciare grassi e dolci con la sua acidità naturale. "
                    "Ecco i cinque abbinamenti che ogni appassionato di cucina dovrebbe conoscere."
                )}]
            },
            {
                "type": "heading",
                "level": 2,
                "children": [{"type": "text", "text": "1. Pesce spada alla ghiotta"}]
            },
            {
                "type": "paragraph",
                "children": [{"type": "text", "text": (
                    "Classico della tradizione siciliana: pesce spada in padella con pomodorini, olive nere, capperi e origano. "
                    "I capperi bilanciano la dolcezza del pomodoro e la grassezza del pesce con una nota sapida e floreale. "
                    "Usa i capperi più piccoli, come il Lilliput, per non sovrastare gli altri sapori."
                )}]
            },
            {
                "type": "heading",
                "level": 2,
                "children": [{"type": "text", "text": "2. Pasta alla puttanesca"}]
            },
            {
                "type": "paragraph",
                "children": [{"type": "text", "text": (
                    "Uno dei sughi più rapidi e soddisfacenti della cucina italiana. "
                    "Aglio, olio, pomodoro, olive, acciughe e capperi: cinque minuti di cottura, "
                    "un risultato che sa di Sud. I capperi qui sono protagonisti quanto le acciughe."
                )}]
            },
            {
                "type": "heading",
                "level": 2,
                "children": [{"type": "text", "text": "3. Vitello tonnato"}]
            },
            {
                "type": "paragraph",
                "children": [{"type": "text", "text": (
                    "La salsa tonnata tradizionale prevede i capperi sia nell'impasto che come guarnizione. "
                    "Donano un contrappunto acido e profumato alla cremosità del tonno e della maionese. "
                    "Un piatto estivo, elegante, perfetto per il buffet."
                )}]
            },
            {
                "type": "heading",
                "level": 2,
                "children": [{"type": "text", "text": "4. Bruschetta con ricotta e capperi"}]
            },
            {
                "type": "paragraph",
                "children": [{"type": "text", "text": (
                    "Pane casereccio tostato, ricotta fresca, qualche cappero dissalato e un filo d'olio extravergine. "
                    "Semplice, veloce, sorprendente. I capperi rompono la dolcezza della ricotta con una nota salata e aromatica."
                )}]
            },
            {
                "type": "heading",
                "level": 2,
                "children": [{"type": "text", "text": "5. Insalata di rinforzo"}]
            },
            {
                "type": "paragraph",
                "children": [{"type": "text", "text": (
                    "Tipica della tradizione napoletana natalizia: cavolfiore lessato, olive, peperoni sott'aceto e capperi. "
                    "Un piatto povero e ricchissimo di carattere, in cui i capperi legano tutti i sapori forti in un unico insieme armonioso."
                )}]
            },
        ],
    },
    {
        "title": "Lilliput, Lacrimella, Capperone: le differenze",
        "slug": "lilliput-lacrimella-capperone-differenze",
        "category": "Prodotti",
        "excerpt": (
            "Non tutti i capperi sono uguali. La dimensione incide su sapore, consistenza e uso ideale in cucina. "
            "Una piccola guida per scegliere il formato giusto."
        ),
        "content": [
            {
                "type": "paragraph",
                "children": [{"type": "text", "text": (
                    "Quando si parla di capperi, la dimensione conta davvero. "
                    "Non si tratta solo di estetica: ogni calibro ha un profilo aromatico diverso, "
                    "una consistenza diversa e un uso ideale in cucina. "
                    "Ecco la guida ai tre formati principali che trovi nel nostro shop."
                )}]
            },
            {
                "type": "heading",
                "level": 2,
                "children": [{"type": "text", "text": "Lilliput — il più piccolo e pregiato"}]
            },
            {
                "type": "paragraph",
                "children": [{"type": "text", "text": (
                    "Il Lilliput è il cappero più piccolo, con un diametro inferiore a 7 mm. "
                    "È considerato il top di gamma: ha la buccia sottilissima, la polpa compatta "
                    "e un profumo intensissimo. In bocca esplode subito, lasciando una scia floreale e sapida. "
                    "Ideale su carpacci, tartare, bruschette e pizza gourmet, dove la piccola dimensione "
                    "non disturba visivamente ma arricchisce ogni boccone."
                )}]
            },
            {
                "type": "heading",
                "level": 2,
                "children": [{"type": "text", "text": "Lacrimella — equilibrio perfetto"}]
            },
            {
                "type": "paragraph",
                "children": [{"type": "text", "text": (
                    "La Lacrimella è il formato medio, tra 7 e 10 mm. "
                    "È il cappero più versatile: abbastanza grande da sentirsi in ogni boccone, "
                    "abbastanza piccolo da non sovrastare gli altri ingredienti. "
                    "È il formato più usato nella cucina domestica e professionale: "
                    "perfetto per sughi, secondi di pesce, salse e contorni."
                )}]
            },
            {
                "type": "heading",
                "level": 2,
                "children": [{"type": "text", "text": "Capperone — il grande, sapido e carnoso"}]
            },
            {
                "type": "paragraph",
                "children": [{"type": "text", "text": (
                    "Il Capperone supera i 13 mm di diametro. "
                    "Ha una consistenza più carnosa, una buccia più spessa e un sapore più deciso e meno floreale rispetto ai formati piccoli. "
                    "Viene spesso tagliato a metà o tritato. "
                    "Ottimo nelle preparazioni più rustiche: caponata, olive ascolane, ripieni, focacce."
                )}]
            },
            {
                "type": "heading",
                "level": 2,
                "children": [{"type": "text", "text": "Come scegliere?"}]
            },
            {
                "type": "list",
                "format": "unordered",
                "children": [
                    {"type": "list-item", "children": [{"type": "text", "text": "Piatti freddi e presentazioni eleganti → Lilliput"}]},
                    {"type": "list-item", "children": [{"type": "text", "text": "Cucina di tutti i giorni, sughi e secondi → Lacrimella"}]},
                    {"type": "list-item", "children": [{"type": "text", "text": "Preparazioni rustiche e ripieni → Capperone"}]},
                ],
            },
        ],
    },
]


def create_article(article: dict) -> dict:
    payload = json.dumps({"data": article}).encode("utf-8")
    req = urllib.request.Request(
        f"{STRAPI_URL}/api/articles",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {STRAPI_TOKEN}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def main():
    if STRAPI_TOKEN == "INCOLLA_QUI_IL_TOKEN_FULL_ACCESS":
        print("❌ Sostituisci STRAPI_TOKEN con il tuo token Full Access di Strapi.")
        return

    print(f"Connessione a {STRAPI_URL}...\n")
    for article in ARTICLES:
        try:
            result = create_article(article)
            print(f"✅ Creato: {article['title']}")
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"❌ Errore per '{article['title']}': {e.code} — {body}")
        except Exception as e:
            print(f"❌ Errore per '{article['title']}': {e}")

    print("\nFatto. Vai su Strapi Admin → Content Manager → Articles per vederli.")


if __name__ == "__main__":
    main()
