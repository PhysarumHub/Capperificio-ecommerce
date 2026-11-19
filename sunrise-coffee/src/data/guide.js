/**
 * GUIDE — contenuti delle pagine /guide/:slug (fonte unica).
 *
 * File JS puro (niente JSX): lo importano sia le pagine React sia
 * server.js per la sitemap. Ogni guida è una sequenza di blocchi; i blocchi
 * con `id` e `toc` compaiono nell'indice a sinistra.
 *
 * Tipi di blocco (resi da src/components/Guide/GuideBlocks.jsx):
 *   brief    → 3 risposte rapide in griglia a filetti
 *   steps    → passi numerati con icona
 *   calibri  → i 4 calibri disegnati in scala + barra (mode: 'soak' | 'flavor')
 *   split    → testo + due foto sfalsate (come /storia)
 *   compare  → due colonne a confronto con foto
 *   fact     → banda verde "Lo sapevi?"
 *   cards    → 3 card (tone: 'no' errori | 'yes' consigli)
 *   faq      → domande apribili (anche JSON-LD FAQPage)
 * Nel testo: **grassetto** e [link](/percorso).
 */

export const GUIDE_UPDATED = '19 novembre 2026';

export const GUIDE_GROUPS = [
  { id: 'conservazione', label: 'Conservazione e uso' },
  { id: 'scegliere', label: 'Scegliere i capperi' },
];

const P = {
  sale: {
    name: 'Capperi di Racale al Sale Marino Integrale',
    to: '/prodotti/capperi-di-racale-al-sale-marino-integrale',
    image: '/images/box-natale/sale-lilliput.webp',
    pills: ['Lilliput', 'Occhio di Pernice', 'Lacrimella', 'Capperone'],
  },
  aceto: {
    name: 'Capperi di Racale all’Aceto di Vino',
    to: '/prodotti/capperi-di-racale-all-aceto-di-vino',
    image: '/images/box-natale/aceto.webp',
    pills: ['Lilliput', 'Occhio di Pernice', 'Lacrimella', 'Capperone'],
  },
  cucunci: {
    name: 'Cucunci di Racale',
    to: '/collections/all',
    image: '/images/box-natale/cucunci.webp',
    pills: ['Aceto di vino', 'Mele', 'Riso', 'Melograno'],
  },
  foglie: {
    name: 'Foglie di Cappero di Racale',
    to: '/prodotti/foglie-di-cappero-di-racale',
    image: '/images/box-natale/leaves.webp',
    pills: ['50 g', '150 g'],
  },
  polvere: {
    name: 'Polvere di Cappero Extrafine',
    to: '/prodotti/polvere-di-cappero-di-racale-extrafine',
    image: '/images/box-natale/powder.webp',
    pills: ['50 g'],
  },
};

export const GUIDES = [
  /* ───────────────────────────────────────────────────────────── */
  {
    slug: 'come-dissalare-i-capperi',
    group: 'conservazione',
    title: 'Come dissalare i capperi',
    short: 'Il metodo in 4 passi e quanto lasciarli in acqua per calibro.',
    lead: 'Il sale conserva il profumo del cappero: va tolto quanto basta, non tutto. Il metodo che usiamo a Racale, e quanto lasciarli in acqua a seconda del calibro.',
    readMin: 4,
    hero: {
      src: '/images/processo/processo-maturazione.webp',
      alt: 'Capperi di Racale al sale marino integrale con un cucchiaio di legno',
      tags: ['Capperi al sale marino integrale', '80% capperi · 20% sale'],
    },
    product: P.sale,
    related: ['quale-calibro-scegliere', 'come-conservare-i-capperi', 'capperi-e-cucunci'],
    ideas: ['Spaghetti alla puttanesca', 'Pane cunzato', 'Burrata e capperi', 'Pesce spada'],
    blocks: [
      {
        type: 'brief', id: 'breve', toc: 'In breve',
        items: [
          { big: 'Sciacqua', small: 'sotto acqua fredda corrente, in un colino' },
          { big: '10–30 min', small: 'in acqua fredda, cambiandola una volta' },
          { big: 'Asciuga', small: 'con carta da cucina, poi in padella o a crudo' },
        ],
      },
      {
        type: 'steps', id: 'metodo', toc: 'Il metodo in 4 passi',
        kicker: 'Il metodo', title: 'Quattro passi, un colino e una ciotola',
        steps: [
          { icon: 'jar', title: 'Prendi solo quelli che ti servono', text: 'Richiudi subito il vasetto: gli altri restano coperti dal loro sale.' },
          { icon: 'tap', title: 'Sciacquali sotto l’acqua fredda', text: 'In un colino, mescolando con le dita, finché il sale in superficie non va via.' },
          { icon: 'bowl', title: 'Lasciali in ammollo', text: 'Da 10 a 30 minuti in acqua fredda, cambiandola una volta. Più restano, meno sono sapidi.' },
          { icon: 'towel', title: 'Asciugali bene', text: 'Con carta da cucina: bagnati schizzano in padella e annacquano i condimenti.' },
        ],
      },
      {
        type: 'calibri', id: 'calibro', toc: 'Quanto ammollo, per calibro', mode: 'soak',
        kicker: 'Per calibro', title: 'Più è grande, più resta in acqua',
        text: 'Un bocciolo piccolo cede il sale in pochi minuti, uno grande ha più polpa da sciogliere. I diametri sono quelli con cui classifichiamo a mano la raccolta.',
        note: 'Cerchi in scala tra loro · tempi indicativi: assaggia un cappero prima di toglierli dall’acqua',
      },
      {
        type: 'split', id: 'perche', toc: 'Perché sono sotto sale',
        kicker: 'Perché sono sotto sale', title: 'Il sale non è un difetto da togliere',
        paras: [
          'Appena raccolto, ogni bocciolo viene stratificato con sale marino integrale delle saline pugliesi e rimescolato ogni giorno per almeno 25 giorni. È il sale a tenere dentro gli oli essenziali: per questo il cappero al sale sa ancora di cappero, mentre l’aceto aggiunge la sua acidità.',
          'Solo due ingredienti in etichetta: **capperi 80%, sale marino integrale 20%**.',
        ],
        link: { to: '/processo-produttivo', label: 'Vedi come lavoriamo, dalla raccolta al vasetto' },
        images: [
          { src: '/images/processo/processo-salatura.webp', alt: 'Capperi appena raccolti mescolati al sale marino', caption: 'Giorno 1 · la salatura' },
          { src: '/images/dalcampoallatavola2.webp', alt: 'Capperi coperti di cristalli di sale', caption: 'Giorno 25 · pronti per il vasetto' },
        ],
      },
      { type: 'fact', big: '25', text: 'I giorni minimi in cui i capperi vengono rimescolati a mano con il sale, uno strato alla volta, prima di finire nel vasetto.' },
      {
        type: 'cards', id: 'errori', toc: 'Tre errori da evitare', tone: 'no',
        kicker: 'Errori da evitare', title: 'Tre cose che rovinano un buon cappero',
        cards: [
          { title: 'Acqua calda', text: 'Cuoce il bocciolo e lo ammorbidisce. Sempre fredda.' },
          { title: 'Dissalare tutto il vasetto', text: 'Senza sale non si conservano più: prendi solo la dose del giorno.' },
          { title: 'Un cucchiaio bagnato', text: 'L’acqua nel vasetto scioglie il sale e rovina il resto. Asciutto e pulito.' },
        ],
      },
      {
        type: 'faq', id: 'faq', toc: 'Domande frequenti',
        kicker: 'Domande frequenti', title: 'Ci chiedete anche',
        items: [
          { q: 'Posso dissalarli il giorno prima?', a: 'Meglio di no: senza sale si conservano poco. Dissalali il giorno stesso, al massimo poche ore prima, e tienili in frigorifero coperti.' },
          { q: 'Quelli all’aceto vanno dissalati?', a: 'No, sono pronti all’uso. Se li trovi troppo acidi puoi sciacquarli velocemente, ma perdono un po’ di profumo.' },
          { q: 'Il sale avanzato si può riusare?', a: 'Sì: ha preso l’aroma dei capperi. Usalo per condire verdure, patate o pesce al forno, regolando il resto del sale.' },
        ],
      },
    ],
  },

  /* ───────────────────────────────────────────────────────────── */
  {
    slug: 'quale-calibro-scegliere',
    group: 'scegliere',
    title: 'Quale calibro di cappero scegliere',
    short: 'Lilliput, Occhio di Pernice, Lacrimella e Capperone a confronto.',
    lead: 'Il calibro è il diametro del bocciolo al momento della raccolta. Non dice quanto è buono un cappero, ma che carattere ha: ecco come scegliere quello giusto per il piatto.',
    readMin: 5,
    hero: {
      src: '/images/processo/processo-cernita.webp',
      alt: 'Capperi appena raccolti sul tavolo di cernita',
      tags: ['Classificati a mano', '4 calibri'],
    },
    product: P.sale,
    related: ['come-dissalare-i-capperi', 'capperi-sotto-sale-o-sottaceto', 'capperi-e-cucunci'],
    ideas: ['Carpaccio e tartare', 'Insalata pantesca', 'Puttanesca', 'Pesce spada'],
    blocks: [
      {
        type: 'brief', id: 'breve', toc: 'In breve',
        items: [
          { big: 'Piccolo', small: 'più aroma in meno polpa: a crudo, a fine cottura' },
          { big: 'Medio', small: 'il più versatile, per tutti i giorni' },
          { big: 'Grande', small: 'più polpa, regge le cotture lunghe' },
        ],
      },
      {
        type: 'calibri', id: 'calibri', toc: 'I quattro calibri', mode: 'flavor',
        kicker: 'I quattro calibri', title: 'Dal Lilliput al Capperone, in scala',
        text: 'A Racale ogni bocciolo viene raccolto e classificato a mano, uno per uno: prima viene colto, più piccolo e delicato è il calibro; più tempo resta sulla pianta, più cresce e si fa carnoso.',
        note: 'Cerchi in scala tra loro · la barra indica l’intensità dell’aroma per boccone',
      },
      {
        type: 'cards', id: 'quale', toc: 'Quale per quale piatto', tone: 'yes',
        kicker: 'Quale per quale piatto', title: 'La scelta in tre domande',
        cards: [
          { title: 'Lo usi a crudo?', text: '**Lilliput**: su carpacci, tartare, burrata o crostini. Si mette alla fine, intero.' },
          { title: 'Lo usi tutti i giorni?', text: '**Occhio di Pernice**: insalate, sughi veloci, pesce. Se non sai da dove partire, parti da qui.' },
          { title: 'Cuoce a lungo?', text: '**Lacrimella** o **Capperone**: sughi, ragù di pesce, secondi in umido. Non si sfaldano.' },
        ],
      },
      {
        type: 'split', id: 'raccolta', toc: 'Come nasce un calibro',
        kicker: 'Come nasce un calibro', title: 'Una questione di giorni sulla pianta',
        paras: [
          'La pianta del cappero produce boccioli nuovi ogni giorno, da maggio all’estate. Si raccoglie a mano, più volte sulla stessa pianta: il bocciolo colto giovane è un Lilliput, quello lasciato qualche giorno in più diventa un Capperone. Se non si coglie affatto, fiorisce e dà il cucuncio.',
          'Dopo la raccolta i boccioli passano dalla calibratura, che li separa per diametro, e poi dalla salatura.',
        ],
        link: { to: '/processo-produttivo', label: 'Il processo produttivo, mese per mese' },
        images: [
          { src: '/images/processo/processo-boccioli.webp', alt: 'Boccioli di cappero sulla pianta, vicino a un fiore aperto', caption: 'Boccioli e fiore sulla stessa pianta' },
          { src: '/images/processo/processo-calibratura.webp', alt: 'La calibratura dei capperi in laboratorio', caption: 'La calibratura' },
        ],
      },
      { type: 'fact', big: '4', text: 'I calibri in cui classifichiamo a mano ogni raccolta di Racale: Lilliput, Occhio di Pernice, Lacrimella e Capperone.' },
      {
        type: 'faq', id: 'faq', toc: 'Domande frequenti',
        kicker: 'Domande frequenti', title: 'Ci chiedete anche',
        items: [
          { q: 'Il calibro più piccolo è il più buono?', a: 'È il più aromatico per boccone e il più pregiato da raccogliere, ma non è “migliore” in assoluto: in un sugo lungo un Capperone dà più soddisfazione.' },
          { q: 'Posso sostituire un calibro con un altro in una ricetta?', a: 'Sì. Con un calibro più piccolo usane un po’ meno e aggiungilo più tardi; con uno più grande puoi tagliarlo a metà.' },
          { q: 'Che calibro usate per la polvere?', a: 'La polvere di cappero è ottenuta dai capperi essiccati e macinati finemente: si usa come una spezia, un pizzico a fine preparazione.' },
        ],
      },
    ],
  },

  /* ───────────────────────────────────────────────────────────── */
  {
    slug: 'come-conservare-i-capperi',
    group: 'conservazione',
    title: 'Come conservare i capperi dopo l’apertura',
    short: 'Al sale in dispensa, all’aceto in frigorifero: cosa è normale e cosa no.',
    lead: 'Capperi al sale, all’aceto, cucunci e busta sottovuoto si conservano in modo diverso. Le regole per ognuno, e come riconoscere quello che è normale in un prodotto senza additivi.',
    readMin: 3,
    hero: {
      src: '/images/sample-box/capers-in-sea-salt.webp',
      alt: 'Capperi coperti di sale marino integrale',
      tags: ['Senza conservanti', 'Solo sale o aceto'],
    },
    product: P.sale,
    related: ['come-dissalare-i-capperi', 'capperi-sotto-sale-o-sottaceto', 'foglie-e-polvere-di-cappero'],
    ideas: ['Condimento per patate', 'Salsa verde', 'Insalata di riso'],
    blocks: [
      {
        type: 'brief', id: 'breve', toc: 'In breve',
        items: [
          { big: 'Al sale', small: 'in dispensa, sempre coperti dal loro sale' },
          { big: 'All’aceto', small: 'in frigorifero, immersi nel liquido' },
          { big: 'Asciutto', small: 'il cucchiaio: mai acqua nel vasetto' },
        ],
      },
      {
        type: 'compare', id: 'regole', toc: 'Le regole per ogni prodotto',
        kicker: 'Le regole', title: 'Ogni vasetto ha la sua',
        cols: [
          { title: 'Al sale marino', image: '/images/box-natale/sale-occhio.webp', rows: [['Prima di aprire', 'Luogo fresco e asciutto'], ['Dopo l’apertura', 'Dispensa, coperti dal sale'], ['Frigorifero', 'Non serve'], ['Vale anche per', 'Foglie di cappero al sale']] },
          { title: 'All’aceto', image: '/images/box-natale/aceto.webp', rows: [['Prima di aprire', 'Luogo fresco e asciutto'], ['Dopo l’apertura', 'Frigorifero, nel liquido'], ['Il liquido', 'Non buttarlo: è un condimento'], ['Vale anche per', 'Cucunci all’aceto']] },
        ],
      },
      {
        type: 'cards', id: 'normale', toc: 'Cosa è normale', tone: 'yes',
        kicker: 'Cosa è normale', title: 'Non è un difetto se…',
        cards: [
          { title: 'Il sale è umido o compatto', text: 'È sale marino integrale, senza antiagglomeranti: assorbe l’umidità dei capperi.' },
          { title: 'Ci sono piccoli cristalli', text: 'Il sale si riforma in cristalli col tempo. Non cambia nulla nel sapore.' },
          { title: 'Il colore varia', text: 'Dal verde oliva al più scuro, secondo il momento della raccolta e il calibro.' },
        ],
      },
      {
        type: 'cards', id: 'attenzione', toc: 'Quando non consumarli', tone: 'no',
        kicker: 'Quando non consumarli', title: 'Scrivici se noti…',
        cards: [
          { title: 'Odore sgradevole', text: 'Diverso dal profumo pungente del cappero.' },
          { title: 'Muffa', text: 'Sulla superficie o sul tappo.' },
          { title: 'Confezione gonfia', text: 'O un sigillo che non era integro all’apertura. [Segnalacelo](/assistenza/resi-e-garanzia/prodotto-difettoso): vale la garanzia.' },
        ],
      },
      { type: 'fact', big: '2', text: 'Gli ingredienti dei nostri capperi al sale: capperi e sale marino integrale. Niente conservanti, niente additivi.' },
      {
        type: 'faq', id: 'faq', toc: 'Domande frequenti',
        kicker: 'Domande frequenti', title: 'Ci chiedete anche',
        items: [
          { q: 'Dove trovo la scadenza?', a: 'Il termine minimo di conservazione e il lotto sono stampati sull’etichetta di ogni confezione.' },
          { q: 'Posso aggiungere sale se si è inumidito?', a: 'Sì, puoi aggiungere sale marino grosso asciutto, in modo che i capperi restino sempre coperti.' },
          { q: 'E la busta Ho.Re.Ca. sottovuoto?', a: 'Una volta aperta va conservata in frigorifero e consumata in tempi brevi.' },
        ],
      },
    ],
  },

  /* ───────────────────────────────────────────────────────────── */
  {
    slug: 'capperi-sotto-sale-o-sottaceto',
    group: 'scegliere',
    title: 'Capperi sotto sale o sott’aceto?',
    short: 'Ingredienti, sapore e usi a confronto.',
    lead: 'Stesso cappero, due modi di conservarlo. Il sale lascia parlare il bocciolo, l’aceto aggiunge la sua acidità e li rende pronti all’uso. Quale scegliere, e per cosa.',
    readMin: 3,
    hero: {
      src: '/images/sample-box/capers-on-wooden-spoon.webp',
      alt: 'Capperi al sale su un cucchiaio di legno',
      tags: ['Sale marino integrale', 'Aceto di vino bianco'],
    },
    product: P.aceto,
    related: ['come-dissalare-i-capperi', 'quale-calibro-scegliere', 'come-conservare-i-capperi'],
    ideas: ['Aperitivo', 'Insalata di patate', 'Salsa tartara', 'Puttanesca'],
    blocks: [
      {
        type: 'brief', id: 'breve', toc: 'In breve',
        items: [
          { big: 'Sale', small: 'più profumo, da sciacquare: per cucinare' },
          { big: 'Aceto', small: 'pronti all’uso, più acidi: per antipasti' },
          { big: 'Stessi calibri', small: 'dal Lilliput al Capperone, in entrambi' },
        ],
      },
      {
        type: 'compare', id: 'confronto', toc: 'Il confronto',
        kicker: 'Il confronto', title: 'Due vasetti, due caratteri',
        cols: [
          { title: 'Al sale marino integrale', image: '/images/box-natale/sale-lacrimella.webp', rows: [['Ingredienti', 'Capperi 80%, sale marino integrale 20%'], ['Sapore', 'Floreale, pungente, il cappero com’è'], ['Prima dell’uso', 'Sciacquare e dissalare'], ['Ideale per', 'Sughi, pesce, cucina calda']] },
          { title: 'All’aceto di vino', image: '/images/box-natale/aceto.webp', rows: [['Ingredienti', 'Capperi, aceto di vino bianco, sale'], ['Sapore', 'Acidulo, rinfrescante'], ['Prima dell’uso', 'Niente, pronti'], ['Ideale per', 'Antipasti, insalate, aperitivo']] },
        ],
      },
      {
        type: 'split', id: 'perche-sale', toc: 'Perché preferiamo il sale',
        kicker: 'Perché preferiamo il sale', title: 'Il sale tiene dentro il profumo',
        paras: [
          'Il sale marino disidrata lentamente il bocciolo e ne conserva gli oli essenziali: dopo la dissalatura il cappero sa ancora di cappero. L’aceto, invece, porta con sé la sua acidità, che in cucina si somma a quella di pomodoro, limone o vino.',
          'Per questo, quando un piatto ha già una parte acida, consigliamo il sale; quando il cappero è protagonista a crudo, l’aceto è comodo e immediato.',
        ],
        link: { to: '/guide/come-dissalare-i-capperi', label: 'Come dissalare i capperi' },
        images: [
          { src: '/images/processo/processo-salatura.webp', alt: 'Salatura dei capperi', caption: 'La salatura' },
          { src: '/images/processo/processo-vasetto.webp', alt: 'Vasetto di capperi tra i boccioli appena raccolti', caption: 'Dal campo al vasetto' },
        ],
      },
      {
        type: 'faq', id: 'faq', toc: 'Domande frequenti',
        kicker: 'Domande frequenti', title: 'Ci chiedete anche',
        items: [
          { q: 'Posso usare quelli all’aceto al posto di quelli al sale?', a: 'Sì, ricordando che aggiungono acidità: riduci un po’ limone o aceto nella ricetta.' },
          { q: 'Si conservano allo stesso modo?', a: 'No: al sale in dispensa coperti dal sale, all’aceto in frigorifero dopo l’apertura, immersi nel liquido.' },
        ],
      },
    ],
  },

  /* ───────────────────────────────────────────────────────────── */
  {
    slug: 'capperi-e-cucunci',
    group: 'scegliere',
    title: 'Capperi e cucunci: la differenza',
    short: 'Il bocciolo e il frutto della stessa pianta.',
    lead: 'Vengono dalla stessa pianta, ma in due momenti diversi: il cappero è il bocciolo, il cucuncio è il frutto. Come si riconoscono e come si mangiano.',
    readMin: 3,
    hero: {
      src: '/images/territorio/territorio-fiore-cappero.webp',
      alt: 'Fiore di cappero aperto con boccioli intorno',
      tags: ['Capparis spinosa', 'Bocciolo → fiore → frutto'],
    },
    product: P.cucunci,
    related: ['quale-calibro-scegliere', 'capperi-sotto-sale-o-sottaceto', 'foglie-e-polvere-di-cappero'],
    ideas: ['Aperitivo', 'Taglieri di salumi', 'Formaggi stagionati'],
    blocks: [
      {
        type: 'brief', id: 'breve', toc: 'In breve',
        items: [
          { big: 'Cappero', small: 'il bocciolo, colto prima che si apra' },
          { big: 'Fiore', small: 'se il bocciolo resta sulla pianta' },
          { big: 'Cucuncio', small: 'il frutto che nasce dal fiore' },
        ],
      },
      {
        type: 'steps', id: 'ciclo', toc: 'Dal bocciolo al frutto',
        kicker: 'Dal bocciolo al frutto', title: 'Tre momenti della stessa pianta',
        steps: [
          { icon: 'bud', title: 'Bocciolo', text: 'Si raccoglie a mano, chiuso: è il cappero. La misura decide il calibro.' },
          { icon: 'flower', title: 'Fiore', text: 'Un bocciolo non raccolto si apre in un fiore bianco e lilla, che dura un giorno.' },
          { icon: 'fruit', title: 'Cucuncio', text: 'Dal fiore nasce il frutto: allungato, con il suo picciolo e piccoli semi dentro.' },
        ],
      },
      {
        type: 'compare', id: 'confronto', toc: 'Come si riconoscono',
        kicker: 'Come si riconoscono', title: 'Bocciolo e frutto a confronto',
        cols: [
          { title: 'Cappero', image: '/images/box-natale/sale-capperone.webp', rows: [['Cos’è', 'Il bocciolo del fiore'], ['Forma', 'Tonda, compatta'], ['Sapore', 'Intenso, pungente'], ['Come si usa', 'Ingrediente: sughi, pesce, condimenti']] },
          { title: 'Cucuncio', image: '/images/box-natale/cucunci.webp', rows: [['Cos’è', 'Il frutto'], ['Forma', 'Allungata, con picciolo'], ['Sapore', 'Più delicato, croccante'], ['Come si usa', 'Si mangia intero, come aperitivo']] },
        ],
      },
      { type: 'fact', big: '1', text: 'Il giorno di vita di un fiore di cappero: si apre al mattino e appassisce entro sera. Se è stato impollinato, lascia il posto al cucuncio.' },
      {
        type: 'faq', id: 'faq', toc: 'Domande frequenti',
        kicker: 'Domande frequenti', title: 'Ci chiedete anche',
        items: [
          { q: 'I cucunci si mangiano con il picciolo?', a: 'Si prende il cucuncio dal picciolo e si mangia il frutto, semi compresi. Il picciolo si lascia.' },
          { q: 'Il liquido dei cucunci si butta?', a: 'No: è un ottimo condimento per insalate e verdure.' },
        ],
      },
    ],
  },

  /* ───────────────────────────────────────────────────────────── */
  {
    slug: 'foglie-e-polvere-di-cappero',
    group: 'scegliere',
    title: 'Foglie e polvere di cappero: come usarle',
    short: 'Le parti della pianta che la tradizione salentina non buttava.',
    lead: 'Nella tradizione salentina nulla della pianta si buttava. Le foglie si dissalano e si cucinano, la polvere si usa come una spezia: due modi diversi di portare il cappero nel piatto.',
    readMin: 3,
    hero: {
      src: '/images/sample-box/caper-buds.webp',
      alt: 'Rametto di cappero con foglie e boccioli',
      tags: ['Foglie al sale marino', 'Polvere extrafine'],
    },
    product: P.foglie,
    related: ['come-dissalare-i-capperi', 'capperi-e-cucunci', 'come-conservare-i-capperi'],
    ideas: ['Foglie fritte in pastella', 'Involtini', 'Tartare di pesce', 'Focaccia'],
    blocks: [
      {
        type: 'brief', id: 'breve', toc: 'In breve',
        items: [
          { big: 'Foglie', small: 'si dissalano, poi fritte, in involtini o tritate' },
          { big: 'Polvere', small: 'un pizzico a fine preparazione, come una spezia' },
          { big: 'Al sale', small: 'le foglie si conservano come i capperi' },
        ],
      },
      {
        type: 'compare', id: 'confronto', toc: 'Foglie o polvere',
        kicker: 'Foglie o polvere', title: 'Due prodotti, due gesti',
        cols: [
          { title: 'Foglie al sale marino', image: '/images/box-natale/leaves.webp', rows: [['Ingredienti', 'Foglie di cappero 80%, sale marino 20%'], ['Prima dell’uso', 'Breve dissalatura'], ['In cucina', 'Fritte in pastella, involtini, su tartare'], ['Formati', '50 g e 150 g']] },
          { title: 'Polvere extrafine', image: '/images/box-natale/powder.webp', rows: [['Cos’è', 'Cappero essiccato e macinato'], ['Prima dell’uso', 'Niente'], ['In cucina', 'Pasta, verdure, uova, pesce, focacce'], ['Formato', '50 g']] },
        ],
      },
      {
        type: 'steps', id: 'foglie', toc: 'Le foglie in cucina',
        kicker: 'Le foglie in cucina', title: 'Tre modi per usarle',
        steps: [
          { icon: 'pan', title: 'Fritte in pastella', text: 'Dopo la dissalatura e un’asciugatura accurata. Con una salsa allo yogurt e menta.' },
          { icon: 'roll', title: 'Come foglie di vite', text: 'Per involtini di riso o di pesce, come si fa con le foglie di vite.' },
          { icon: 'knife', title: 'Tritate a crudo', text: 'Su tartare, carpacci e pesce crudo: danno sapidità e una nota verde.' },
        ],
      },
      { type: 'fact', big: '0', text: 'Le parti della pianta che la tradizione salentina buttava. Boccioli, frutti e foglie: tutto finiva in cucina.' },
      {
        type: 'faq', id: 'faq', toc: 'Domande frequenti',
        kicker: 'Domande frequenti', title: 'Ci chiedete anche',
        items: [
          { q: 'La polvere sostituisce il sale?', a: 'In parte sì: è sapida, quindi riduci il sale della ricetta quando la usi.' },
          { q: 'Come si conservano le foglie aperte?', a: 'Come i capperi al sale: in luogo fresco e asciutto, coperte dal loro sale.' },
        ],
      },
    ],
  },
];

/* ── Helper ─────────────────────────────────────────────────────── */

export const guidePath = (g) => `/guide/${typeof g === 'string' ? g : g.slug}`;
export const getGuide = (slug) => GUIDES.find((g) => g.slug === slug) || null;
export const guidesInGroup = (id) => GUIDES.filter((g) => g.group === id);
export const guideToc = (g) => g.blocks.filter((b) => b.id && b.toc).map((b) => ({ id: b.id, label: b.toc }));

export function guideSitemapPaths() {
  return ['/guide', ...GUIDES.map(guidePath)];
}
