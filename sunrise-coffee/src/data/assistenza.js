/**
 * CENTRO ASSISTENZA — fonte unica dei contenuti.
 *
 * Da qui leggono: hub /assistenza, pagine argomento e risposta, /faq (con
 * schema FAQPage) e la sitemap in server.js. File JS puro, senza JSX, così
 * Node lo importa senza build.
 *
 * Formato delle risposte (`body`): array di blocchi.
 *   'testo'            → paragrafo
 *   { ul: [...] }      → elenco puntato
 *   { ol: [...] }      → passaggi numerati
 *   { note: 'testo' }  → riquadro evidenziato
 * Nel testo: **grassetto**, [etichetta](/percorso-interno o https://…),
 * segnaposto {email} {emailOrdini} {emailB2B} {whatsapp} {soglia}.
 */

import { FREE_SHIPPING_THRESHOLD } from '../lib/utils/shipping.js';

export const HELP_FACTS = {
  freeShippingFrom: FREE_SHIPPING_THRESHOLD, // € — fonte unica: lib/utils/shipping.js
  prepDays: '1–2 giorni lavorativi',
  deliveryIT: '2–5 giorni lavorativi',
  deliveryEU: '5–10 giorni lavorativi',
  withdrawalDays: 14,
  warrantyYears: 2,
  defectReportMonths: 2,
  damageReportDays: 7,
};

export const HELP_CATEGORIES = [
  {
    slug: 'scegliere-i-capperi',
    title: 'Scegliere i capperi',
    sub: 'Calibri, sale o aceto, cucunci, foglie, quantità',
  },
  {
    slug: 'ordini-e-pagamenti',
    title: 'Ordini e pagamenti',
    sub: 'Pagare, fattura, codici sconto, modificare un ordine',
  },
  {
    slug: 'spedizioni',
    title: 'Spedizioni',
    sub: 'Costi, tempi, tracciamento, estero',
  },
  {
    slug: 'resi-e-garanzia',
    title: 'Resi, rimborsi e garanzia',
    sub: 'Recesso, pacco danneggiato, rimborsi',
  },
  {
    slug: 'conservazione-e-uso',
    title: 'Conservazione e uso',
    sub: 'Dissalare, dopo l’apertura, scadenza, etichetta',
  },
  {
    slug: 'regali-e-natale',
    title: 'Regali e Natale',
    sub: 'Box di Natale, spedire a chi riceve, date',
  },
  {
    slug: 'ristoranti-e-rivenditori',
    title: 'Ristoranti e rivenditori',
    sub: 'Area B2B, formati Ho.Re.Ca., campionatura',
  },
];

export const HELP_ARTICLES = [
  /* ── Scegliere i capperi ─────────────────────────────────────────── */
  {
    slug: 'quale-calibro-scegliere',
    cat: 'scegliere-i-capperi',
    q: 'Che calibro scelgo?',
    short: 'Il calibro è la misura del bocciolo: cambia il carattere, non la qualità.',
    body: [
      'Il calibro è il diametro del bocciolo al momento della raccolta. A Racale ogni cappero viene raccolto e classificato **a mano, uno per uno**. Non è un indice di qualità ma di carattere: più è piccolo, più aroma concentra; più è grande, più polpa e tenuta in cottura.',
      { ul: [
        '**Lilliput** (Ø 4–6 mm, vasetto da 75 g): il più piccolo e profumato. Crudo, a fine cottura: carpacci, tartare, burrata.',
        '**Occhio di Pernice** (Ø 7–9 mm, 150 g): il più versatile, per l’uso di tutti i giorni. Se non sai da dove partire, parti da qui.',
        '**Lacrimella** (Ø 9–11 mm, 250 g): carnoso, regge bene la cottura. Sughi, pasta, salse.',
        '**Capperone** (Ø 12–15 mm, 250 g): aroma intenso e persistente, per i sughi lunghi e i secondi di pesce.',
      ] },
      'Se vuoi provarli tutti, la [Box di Natale](/box-di-natale) permette di comporre una scatola con più calibri.',
    ],
  },
  {
    slug: 'sale-o-aceto',
    cat: 'scegliere-i-capperi',
    q: 'Capperi sotto sale o sott’aceto: che differenza c’è?',
    short: 'Il sale conserva il sapore del cappero, l’aceto aggiunge la sua acidità.',
    body: [
      'I capperi **al sale marino integrale** sono conservati solo con sale (80% capperi, 20% sale), senza altri ingredienti. Vanno sciacquati prima dell’uso e conservano il profumo floreale del cappero: sono quelli che consigliamo per cucinare.',
      'I capperi **all’aceto** (capperi, aceto di vino bianco, sale) sono pronti all’uso, senza dissalatura, e hanno una nota acida in più. Sono comodi per antipasti, insalate e aperitivi.',
      { note: 'Dopo l’apertura i capperi al sale stanno in dispensa coperti dal loro sale; quelli all’aceto vanno in frigorifero, immersi nel liquido.' },
    ],
  },
  {
    slug: 'capperi-e-cucunci',
    cat: 'scegliere-i-capperi',
    q: 'Che differenza c’è tra capperi e cucunci?',
    short: 'Il cappero è il bocciolo, il cucuncio è il frutto.',
    body: [
      'Il **cappero** è il bocciolo del fiore, raccolto prima che si apra. Se il bocciolo non viene colto, la pianta fiorisce e dal fiore nasce il **cucuncio**: il frutto, allungato, con il suo picciolo e piccoli semi all’interno.',
      'Il cucuncio ha un sapore più delicato e una consistenza croccante: si mangia così com’è, come aperitivo o con salumi e formaggi. Li proponiamo all’aceto di vino, di mele, di riso e di melograno. [Vedi i prodotti](/collections/all).',
    ],
  },
  {
    slug: 'foglie-e-polvere',
    cat: 'scegliere-i-capperi',
    q: 'Come si usano le foglie e la polvere di cappero?',
    short: 'Le foglie si dissalano e si cucinano; la polvere si usa come condimento finale.',
    body: [
      '**Foglie di cappero al sale marino**: dopo una breve dissalatura si friggono in pastella, si usano come foglie di vite per involtini o si tritano su tartare e pesce crudo. Nella tradizione salentina nulla della pianta si buttava.',
      '**Polvere di cappero extrafine**: un pizzico a fine preparazione, come faresti con una spezia. Dà sapidità e aroma di cappero senza i pezzi: su pasta, verdure, uova, pesce, focacce.',
    ],
  },
  {
    slug: 'quanti-capperi-servono',
    cat: 'scegliere-i-capperi',
    q: 'Quanto dura un vasetto? Che formato prendo?',
    short: 'I formati vanno da 50 g a 250 g; per i ristoranti c’è la busta da 500 g e 1 kg.',
    body: [
      'Il cappero si usa in piccole quantità: un cucchiaio basta per un sugo per quattro persone. In famiglia un vasetto da 150–250 g dura settimane e, conservato bene, non perde qualità.',
      'I formati: Lilliput 75 g, Occhio di Pernice 150 g, Lacrimella e Capperone 250 g, cucunci 200 g, foglie 50 g e 150 g, polvere 50 g. Per la ristorazione esiste la busta sottovuoto Ho.Re.Ca. da 500 g e 1 kg: vedi [Ristoranti e rivenditori](/assistenza/ristoranti-e-rivenditori).',
    ],
  },
  {
    slug: 'da-dove-vengono',
    cat: 'scegliere-i-capperi',
    q: 'Da dove vengono i vostri capperi?',
    short: 'Da Racale, nel Salento: li raccogliamo, saliamo e confezioniamo noi.',
    body: [
      'Dai nostri campi di Racale, in provincia di Lecce. Raccogliamo a mano tra maggio e luglio, classifichiamo per calibro e stratifichiamo subito con sale marino integrale, rimescolando ogni giorno per almeno 25 giorni.',
      'Il Cappero di Racale è riconosciuto come Comunità del Cibo Slow Food. Per saperne di più: [la nostra storia](/storia), [il territorio](/territorio) e [il processo produttivo](/processo-produttivo).',
    ],
  },

  /* ── Ordini e pagamenti ─────────────────────────────────────────── */
  {
    slug: 'come-pagare',
    cat: 'ordini-e-pagamenti',
    q: 'Come posso pagare? Il pagamento è sicuro?',
    short: 'Carte, Apple Pay e Google Pay tramite Stripe. I dati della carta non passano da noi.',
    body: [
      'Accettiamo carte di credito e debito (Visa, Mastercard, American Express) e i wallet Apple Pay e Google Pay. Il pagamento è gestito da **Stripe**: i dati della carta viaggiano cifrati direttamente a Stripe e non vengono mai salvati sui nostri server.',
      'L’addebito avviene quando confermi l’ordine. Dettagli nelle [Condizioni di vendita](/termini-e-condizioni#pagamenti).',
    ],
  },
  {
    slug: 'pagamento-non-riuscito',
    cat: 'ordini-e-pagamenti',
    q: 'Il pagamento non va a buon fine. Cosa faccio?',
    short: 'Controlla 3D Secure e limiti della carta, poi riprova o scrivici.',
    body: [
      { ol: [
        'Controlla di aver confermato il pagamento nell’app della tua banca (3D Secure): spesso la conferma arriva come notifica.',
        'Verifica che la carta sia abilitata ai pagamenti online e non abbia raggiunto il limite.',
        'Prova un altro metodo: Apple Pay o Google Pay di solito evitano il problema.',
      ] },
      'Se hai ricevuto un addebito ma non l’email di conferma, non riprovare: scrivici su WhatsApp ({whatsapp}) o a {emailOrdini} e controlliamo subito.',
    ],
  },
  {
    slug: 'fattura',
    cat: 'ordini-e-pagamenti',
    q: 'Posso avere la fattura?',
    short: 'Sì, se inserisci i dati fiscali al checkout, prima di confermare.',
    body: [
      'Inserisci Partita IVA, Codice Fiscale e codice destinatario SDI (o PEC) durante il checkout. La richiesta va fatta **prima** di confermare l’ordine: dopo l’emissione del documento fiscale non è più possibile trasformarlo in fattura.',
    ],
  },
  {
    slug: 'codice-sconto',
    cat: 'ordini-e-pagamenti',
    q: 'Dove inserisco un codice sconto?',
    short: 'Nel carrello, prima di andare al pagamento.',
    body: [
      'Apri il carrello e inserisci il codice nel campo dedicato prima di passare al pagamento: lo sconto compare subito nel totale. I codici non sono cumulabili tra loro salvo diversa indicazione, e non si possono applicare a un ordine già pagato.',
    ],
  },
  {
    slug: 'modificare-ordine',
    cat: 'ordini-e-pagamenti',
    q: 'Posso modificare o annullare un ordine?',
    short: 'Sì, finché non è stato spedito: scrivici il prima possibile.',
    body: [
      'Prepariamo gli ordini entro {prep}. Finché il pacco non è partito possiamo cambiare indirizzo, aggiungere o togliere prodotti o annullare l’ordine con rimborso completo.',
      'Scrivici subito su WhatsApp ({whatsapp}) o a {emailOrdini} indicando il **numero d’ordine**. Se l’ordine è già partito puoi comunque [fare un reso](/assistenza/resi-e-garanzia/come-fare-un-reso).',
    ],
  },
  {
    slug: 'serve-account',
    cat: 'ordini-e-pagamenti',
    q: 'Devo registrarmi per comprare?',
    short: 'No, puoi ordinare come ospite.',
    body: [
      'No. Puoi completare l’acquisto come ospite con la sola email. L’account serve se vuoi ritrovare lo storico degli ordini e gli indirizzi salvati: puoi crearlo quando vuoi da [Account](/account).',
    ],
  },
  {
    slug: 'conferma-non-arrivata',
    cat: 'ordini-e-pagamenti',
    q: 'Non ho ricevuto l’email di conferma.',
    short: 'Controlla spam e promozioni, poi cerca l’ordine o scrivici.',
    body: [
      'L’email di conferma parte pochi minuti dopo il pagamento. Controlla le cartelle Spam e Promozioni e cerca “Capperificio”. Se hai un account, l’ordine compare anche in [Account](/account).',
      'Se non la trovi, scrivici a {emailOrdini} con il nome e l’email usati: verifichiamo e te la rimandiamo.',
    ],
  },

  /* ── Spedizioni ─────────────────────────────────────────────────── */
  {
    slug: 'costi-di-spedizione',
    cat: 'spedizioni',
    q: 'Quanto costa la spedizione?',
    short: 'Gratuita in Italia da {soglia}; sotto, il costo si vede nel carrello.',
    body: [
      'In Italia la spedizione è **gratuita per ordini da {soglia}**. Sotto questa soglia il costo dipende da peso e destinazione e lo vedi nel carrello e al checkout, prima di pagare.',
      'Per l’estero il costo è calcolato allo stesso modo in base al Paese. Dettagli completi in [Spedizioni e resi](/spedizioni-e-resi#costi).',
    ],
  },
  {
    slug: 'tempi-di-consegna',
    cat: 'spedizioni',
    q: 'Quando arriva il mio ordine?',
    short: 'Prepariamo in {prep}, poi {deliveryIT} in Italia.',
    body: [
      { ul: [
        '**Preparazione**: {prep} dalla conferma del pagamento.',
        '**Italia**: {deliveryIT} con corriere espresso.',
        '**Estero**: {deliveryEU}, secondo il Paese.',
      ] },
      'I tempi sono indicativi: in alta stagione e nei giorni prima di Natale possono allungarsi di uno o due giorni. Per le Box di Natale valgono le date di spedizione scelte nel configuratore.',
    ],
  },
  {
    slug: 'tracciamento',
    cat: 'spedizioni',
    q: 'Come seguo il pacco?',
    short: 'Ti mandiamo il codice di tracciamento appena il pacco parte.',
    body: [
      'Quando affidiamo il pacco al corriere ricevi un’email con il **codice di tracciamento** e il link per seguirlo. Puoi controllare lo stato in qualsiasi momento anche da [Dov’è il mio ordine](/assistenza/dove-e-il-mio-ordine), con numero d’ordine ed email.',
    ],
  },
  {
    slug: 'spedite-estero',
    cat: 'spedizioni',
    q: 'Spedite all’estero?',
    short: 'Sì, in gran parte d’Europa: il checkout ti dice se il tuo indirizzo è servito.',
    body: [
      'Spediamo in Italia e in gran parte dei Paesi dell’Unione Europea. Inserendo l’indirizzo al checkout vedi subito se la destinazione è servita e quanto costa la spedizione.',
      'Per destinazioni fuori dall’UE o per ordini importanti scrivici a {email} prima di ordinare: valutiamo insieme la soluzione migliore.',
    ],
  },
  {
    slug: 'non-ero-in-casa',
    cat: 'spedizioni',
    q: 'Il corriere è passato e non ero in casa.',
    short: 'Di solito lascia un avviso e riprova; segui le istruzioni del tracciamento.',
    body: [
      'Il corriere di norma lascia un avviso e ritenta la consegna, oppure deposita il pacco in un punto di ritiro. Dal link di tracciamento puoi spesso scegliere una nuova data o un punto di ritiro.',
      'Se il pacco resta in giacenza oltre i termini torna a noi: in quel caso le spese di rientro e di nuova spedizione restano a carico del cliente. Se hai dubbi scrivici subito, prima che scada la giacenza.',
    ],
  },

  /* ── Resi e garanzia ────────────────────────────────────────────── */
  {
    slug: 'come-fare-un-reso',
    cat: 'resi-e-garanzia',
    q: 'Come faccio un reso?',
    short: '14 giorni dalla consegna, con confezioni chiuse e sigillate.',
    body: [
      'Hai **14 giorni dalla consegna** per recedere dall’acquisto senza indicare il motivo.',
      { ol: [
        'Scrivi a {email} entro 14 giorni dalla consegna indicando nome, numero d’ordine e i prodotti da restituire. Ti rispondiamo con la conferma e l’indirizzo per il reso.',
        'Entro 14 giorni dalla comunicazione rispedisci i prodotti **integri, con la confezione originale sigillata**, all’indirizzo che ti indichiamo.',
        'Rimborsiamo entro 14 giorni con lo stesso metodo di pagamento, appena riceviamo i prodotti o la prova della spedizione.',
      ] },
      { note: 'Sono prodotti alimentari: il recesso non vale per le confezioni aperte o con il sigillo rotto. Se un prodotto è difettoso, invece, vale la garanzia e il reso è a carico nostro.' },
    ],
  },
  {
    slug: 'chi-paga-il-reso',
    cat: 'resi-e-garanzia',
    q: 'Chi paga la spedizione del reso?',
    short: 'Il cliente, se cambia idea; noi, se il prodotto è difettoso o sbagliato.',
    body: [
      'Se recedi perché hai cambiato idea, le spese dirette di restituzione sono a tuo carico; ti rimborsiamo comunque le spese di consegna standard dell’ordine.',
      'Se il prodotto è arrivato danneggiato, difettoso o diverso da quello ordinato, la sostituzione o il rimborso e le eventuali spese sono **a carico nostro**.',
    ],
  },
  {
    slug: 'pacco-danneggiato',
    cat: 'resi-e-garanzia',
    q: 'Il pacco è arrivato rovinato o un vasetto è rotto.',
    short: 'Fotografa tutto e scrivici entro 7 giorni: rimediamo noi.',
    body: [
      { ol: [
        'Se l’imballo è visibilmente danneggiato, firma la consegna con la dicitura **“accetto con riserva di controllo”**.',
        'Fotografa il pacco, l’imballo interno e i prodotti danneggiati, compresa l’etichetta con il lotto.',
        'Scrivici entro 7 giorni su WhatsApp ({whatsapp}) o a {emailOrdini} con il numero d’ordine e le foto.',
      ] },
      'Ti rispediamo i prodotti danneggiati o ti rimborsiamo, senza costi per te.',
    ],
  },
  {
    slug: 'prodotto-difettoso',
    cat: 'resi-e-garanzia',
    q: 'Un prodotto non mi sembra a posto.',
    short: 'Vale la garanzia legale di 2 anni: segnalalo entro 2 mesi.',
    body: [
      'Tutti i prodotti hanno la **garanzia legale di conformità** di 2 anni dalla consegna. Se noti qualcosa che non va (odore, colore, confezione gonfia o non sigillata) non consumare il prodotto e scrivici entro 2 mesi dalla scoperta.',
      'Allega numero d’ordine e una foto del prodotto e del **lotto** stampato in etichetta. Sostituiamo il prodotto o ti rimborsiamo.',
      { note: 'Il sale che diventa umido o forma dei cristalli e qualche variazione di colore tra un vasetto e l’altro sono normali in un prodotto naturale senza additivi: vedi [Conservazione e uso](/assistenza/conservazione-e-uso).' },
    ],
  },
  {
    slug: 'tempi-rimborso',
    cat: 'resi-e-garanzia',
    q: 'Quando ricevo il rimborso?',
    short: 'Entro 14 giorni, sullo stesso metodo di pagamento.',
    body: [
      'Rimborsiamo entro 14 giorni dalla tua comunicazione di recesso, con lo stesso metodo di pagamento usato per l’acquisto. Possiamo attendere di ricevere i prodotti, o la prova che li hai spediti, prima di emettere il rimborso.',
      'Dal momento in cui lo emettiamo, la banca può impiegare qualche giorno lavorativo per mostrarlo sull’estratto conto. Ti avvisiamo via email quando il rimborso parte.',
    ],
  },

  /* ── Conservazione e uso ────────────────────────────────────────── */
  {
    slug: 'come-dissalare',
    cat: 'conservazione-e-uso',
    q: 'Come si dissalano i capperi?',
    short: 'Sciacqua sotto acqua fredda e lasciali in ammollo qualche minuto.',
    body: [
      { ol: [
        'Prendi solo i capperi che ti servono e richiudi subito il vasetto, lasciando gli altri coperti dal sale.',
        'Sciacquali sotto acqua fredda corrente, in un colino.',
        'Per un sapore più delicato lasciali in una ciotola d’acqua fredda da 10 a 30 minuti, cambiando l’acqua una volta. Più a lungo restano in ammollo, meno sono sapidi.',
        'Asciugali con carta da cucina prima di usarli.',
      ] },
      'Il calibro conta: un Lilliput si dissala in pochi minuti, un Capperone ha bisogno di più tempo. Nei sughi con acciughe o olive, dissalali di più.',
    ],
  },
  {
    slug: 'dopo-apertura',
    cat: 'conservazione-e-uso',
    q: 'Come si conservano dopo l’apertura?',
    short: 'Al sale in dispensa, all’aceto in frigorifero.',
    body: [
      { ul: [
        '**Capperi e foglie al sale**: in dispensa, in luogo fresco e asciutto, sempre coperti dal loro sale. Non serve il frigorifero.',
        '**Capperi e cucunci all’aceto**: in frigorifero, sempre immersi nel liquido. Il liquido dei cucunci è un ottimo condimento: non buttarlo.',
        '**Busta Ho.Re.Ca. sottovuoto**: una volta aperta, in frigorifero e da consumare in tempi brevi.',
      ] },
      'Usa sempre un cucchiaio pulito e asciutto: acqua e briciole nel vasetto sono la prima causa di deterioramento.',
    ],
  },
  {
    slug: 'scadenza',
    cat: 'conservazione-e-uso',
    q: 'Quanto durano? Dove trovo la scadenza?',
    short: 'Il termine minimo di conservazione e il lotto sono in etichetta.',
    body: [
      'Il termine minimo di conservazione (“da consumarsi preferibilmente entro”) e il **lotto** sono stampati sull’etichetta di ogni confezione. Il sale è un conservante naturale: conservati come indicato, i capperi al sale mantengono a lungo profumo e consistenza.',
      'Ingredienti, allergeni e quantità netta sono in ogni scheda prodotto e in etichetta. In caso di differenze, fa fede l’etichetta.',
    ],
  },
  {
    slug: 'sale-umido-cristalli',
    cat: 'conservazione-e-uso',
    q: 'Il sale è umido o ha fatto i cristalli: è normale?',
    short: 'Sì: è sale marino integrale, senza antiagglomeranti.',
    body: [
      'Sì. Usiamo **sale marino integrale** senza antiagglomeranti: assorbe l’umidità dei capperi e dell’aria, può inumidirsi, compattarsi o formare piccoli cristalli. Non cambia la qualità del prodotto.',
      'Anche il colore può variare tra un vasetto e l’altro, dal verde oliva al più scuro: dipende dal momento della raccolta e dal calibro. Se invece noti odori sgradevoli, muffa o una confezione gonfia, non consumare il prodotto e [segnalacelo](/assistenza/resi-e-garanzia/prodotto-difettoso).',
    ],
  },
  {
    slug: 'allergeni',
    cat: 'conservazione-e-uso',
    q: 'Contengono glutine o allergeni?',
    short: 'Gli ingredienti sono pochi e sono tutti in etichetta.',
    body: [
      'I capperi al sale contengono solo capperi e sale marino integrale; quelli all’aceto capperi, aceto di vino bianco e sale. L’elenco completo degli ingredienti e degli eventuali allergeni è in ogni scheda prodotto e sull’etichetta.',
      'Per esigenze specifiche (intolleranze, diete particolari) scrivici a {email}: ti rispondiamo con le informazioni del lotto.',
    ],
  },

  /* ── Regali e Natale ────────────────────────────────────────────── */
  {
    slug: 'box-di-natale',
    cat: 'regali-e-natale',
    q: 'Come funziona la Box di Natale?',
    short: 'La componi tu, scegli la data di spedizione e, se vuoi, la mandiamo a chi la riceve.',
    body: [
      'Dalla pagina [Box di Natale](/box-di-natale) scegli i prodotti da mettere nella scatola, aggiungi un biglietto e scegli quando spedirla: subito oppure in una delle date di dicembre proposte.',
      'I prezzi e le date disponibili sono sempre aggiornati nel configuratore.',
    ],
  },
  {
    slug: 'spedire-a-chi-riceve',
    cat: 'regali-e-natale',
    q: 'Posso spedire il regalo direttamente a chi lo riceve?',
    short: 'Sì: indica l’indirizzo del destinatario. Nel pacco non mettiamo prezzi.',
    body: [
      'Sì. Nella Box di Natale puoi indicare l’indirizzo del destinatario e un messaggio per il biglietto. Per gli altri ordini usa un indirizzo di spedizione diverso da quello di fatturazione al checkout.',
      'Nel pacco non inseriamo documenti con i prezzi: il documento fiscale arriva a te via email.',
    ],
  },
  {
    slug: 'entro-quando-per-natale',
    cat: 'regali-e-natale',
    q: 'Entro quando ordinare per Natale?',
    short: 'Per le Box di Natale fa fede la scadenza nel configuratore.',
    body: [
      'Per le **Box di Natale** l’ultimo giorno utile e le date di spedizione disponibili sono indicati nel [configuratore](/box-di-natale): ogni data ha la sua scadenza per prenotare.',
      'Per gli altri prodotti consigliamo di ordinare entro metà dicembre: nei giorni prima di Natale i corrieri sono più lenti del solito.',
    ],
  },
  {
    slug: 'regali-aziendali',
    cat: 'regali-e-natale',
    q: 'Fate regali aziendali o ordini per molte persone?',
    short: 'Sì: scrivici quantità e date e prepariamo una proposta.',
    body: [
      'Sì. Per strenne aziendali, eventi o ordini con molti destinatari scrivici a {emailB2B} indicando quante confezioni, il budget indicativo e la data di consegna desiderata. Ti mandiamo una proposta con prezzi e tempi.',
    ],
  },

  /* ── Ristoranti e rivenditori ───────────────────────────────────── */
  {
    slug: 'area-b2b',
    cat: 'ristoranti-e-rivenditori',
    q: 'Vendete a ristoranti, negozi e grossisti?',
    short: 'Sì, con prezzi netti e formati professionali nell’Area B2B.',
    body: [
      'Sì. L’[Area B2B](/b2b) è riservata a chi ha Partita IVA: prezzi netti, formati professionali e condizioni dedicate. Per informazioni scrivi a {emailB2B}.',
    ],
  },
  {
    slug: 'formati-horeca',
    cat: 'ristoranti-e-rivenditori',
    q: 'Che formati avete per la ristorazione?',
    short: 'Busta sottovuoto da 500 g e 1 kg.',
    body: [
      'Per la ristorazione proponiamo i capperi al sale in **busta sottovuoto ad alta barriera** da 500 g e 1 kg: pesa meno del vetro, occupa meno spazio e protegge il prodotto da ossigeno e umidità. Una volta aperta va conservata in frigorifero.',
    ],
  },
  {
    slug: 'campionatura',
    cat: 'ristoranti-e-rivenditori',
    q: 'Posso provare i prodotti prima di ordinare?',
    short: 'Sì, con la box campioni per professionisti.',
    body: [
      'Sì. La [box campioni](/sample-box) è pensata per ristoratori e rivenditori che vogliono assaggiare i calibri prima di un ordine all’ingrosso.',
    ],
  },
];

/** Le 4 domande in evidenza sotto la ricerca dell’hub. */
export const HELP_CHIPS = [
  'come-fare-un-reso',
  'quale-calibro-scegliere',
  'costi-di-spedizione',
  'entro-quando-per-natale',
];

/** Le domande più frequenti mostrate nell’hub. */
export const HELP_TOP = [
  'tempi-di-consegna',
  'come-dissalare',
  'dopo-apertura',
  'modificare-ordine',
  'pacco-danneggiato',
];

/* ── Helper ─────────────────────────────────────────────────────────── */

export const helpArticlePath = (a) => `/assistenza/${a.cat}/${a.slug}`;
export const helpCategoryPath = (c) => `/assistenza/${typeof c === 'string' ? c : c.slug}`;

export const getHelpCategory = (slug) => HELP_CATEGORIES.find((c) => c.slug === slug) || null;
export const getHelpArticle = (slug) => HELP_ARTICLES.find((a) => a.slug === slug) || null;
export const getArticlesInCategory = (slug) => HELP_ARTICLES.filter((a) => a.cat === slug);

/** Tutti i percorsi del centro assistenza, per la sitemap. */
export function helpSitemapPaths() {
  return [
    '/assistenza',
    '/assistenza/dove-e-il-mio-ordine',
    '/assistenza/qualcosa-non-va',
    '/assistenza/primo-ordine',
    '/spedizioni-e-resi',
    ...HELP_CATEGORIES.map(helpCategoryPath),
    ...HELP_ARTICLES.map(helpArticlePath),
  ];
}
