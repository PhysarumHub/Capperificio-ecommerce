import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import LegalLayout from '../components/Legal/LegalLayout';
import CompanyData from '../components/Legal/CompanyData';
import { COMPANY } from '../data/company';
import styles from './LegalPage.module.css';

const SECTIONS = [
  {
    id: 'venditore',
    title: 'Identità del venditore',
    content: (
      <>
        <p>
          I beni acquistati su <strong>{COMPANY.domain}</strong> (di seguito il «Sito») sono venduti
          da:
        </p>
        <CompanyData />
        <p>
          Le presenti Condizioni Generali di Vendita (di seguito «Condizioni») disciplinano l'offerta
          e la vendita dei prodotti sul Sito e costituiscono parte integrante di ogni ordine.
          Effettuando un ordine dichiari di averle lette e accettate integralmente.
        </p>
        <p>
          Il Titolare si riserva il diritto di modificare le Condizioni in qualsiasi momento: alla
          singola compravendita si applicano le Condizioni pubblicate sul Sito al momento
          dell'invio dell'ordine.
        </p>
      </>
    ),
  },
  {
    id: 'definizioni',
    title: 'Definizioni e ambito di applicazione',
    content: (
      <>
        <ul>
          <li>
            <strong>Consumatore</strong> — la persona fisica che agisce per scopi estranei
            all'attività imprenditoriale, commerciale, artigianale o professionale eventualmente
            svolta, ai sensi dell'art. 3 del D.Lgs. 206/2005 («Codice del Consumo»).
          </li>
          <li>
            <strong>Professionista / cliente B2B</strong> — la persona fisica o giuridica che agisce
            nell'esercizio della propria attività, anche tramite l'area riservata B2B del Sito.
          </li>
          <li>
            <strong>Prodotti</strong> — i beni alimentari e gli articoli offerti in vendita sul Sito.
          </li>
        </ul>
        <p>
          Le tutele previste dal Codice del Consumo — in particolare il diritto di recesso e la
          garanzia legale di conformità di cui ai paragrafi 8 e 9 —{' '}
          <strong>si applicano esclusivamente ai Consumatori</strong>. Agli acquisti effettuati da
          Professionisti si applicano le norme del codice civile in materia di compravendita, con
          esclusione del diritto di recesso.
        </p>
      </>
    ),
  },
  {
    id: 'prodotti',
    title: 'Prodotti e disponibilità',
    content: (
      <>
        <p>
          I Prodotti sono descritti nelle relative schede pubblicate sul Sito. Le immagini hanno
          finalità illustrativa: trattandosi di prodotti alimentari artigianali, possono verificarsi
          lievi differenze di colore, calibro e aspetto rispetto alle fotografie, che non
          costituiscono difetto di conformità.
        </p>
        <p>
          Le informazioni obbligatorie ai sensi del Regolamento (UE) 1169/2011 — denominazione,
          elenco degli ingredienti, allergeni, quantità netta, termine minimo di conservazione,
          modalità di conservazione e sede dello stabilimento — sono riportate nella scheda prodotto
          e sull'etichetta del bene consegnato. In caso di difformità{' '}
          <strong>fa fede quanto riportato sull'etichetta</strong>.
        </p>
        <p>
          La disponibilità indicata sul Sito è aggiornata periodicamente e non costituisce garanzia
          di effettiva giacenza al momento dell'ordine. Qualora un Prodotto risulti indisponibile
          dopo l'invio dell'ordine, ne sarai informato tempestivamente e potrai scegliere fra la
          consegna parziale, la sostituzione o il rimborso integrale della somma versata.
        </p>
      </>
    ),
  },
  {
    id: 'prezzi',
    title: 'Prezzi',
    content: (
      <>
        <p>
          Tutti i prezzi indicati sul Sito sono espressi in Euro e si intendono{' '}
          <strong>comprensivi di IVA</strong> e di ogni altra imposta applicabile, salvo diversa
          indicazione nell'area B2B, dove i prezzi possono essere esposti al netto dell'IVA.
        </p>
        <p>
          I costi di spedizione non sono compresi nel prezzo dei Prodotti e sono calcolati e
          indicati separatamente nel riepilogo del carrello prima della conferma dell'ordine.
        </p>
        <p>
          Il Titolare si riserva il diritto di modificare i prezzi in qualsiasi momento: il prezzo
          applicabile è quello esposto sul Sito al momento dell'invio dell'ordine.
        </p>
        <p>
          In caso di evidente errore materiale nell'indicazione del prezzo — palesemente
          sproporzionato rispetto al valore del Prodotto e riconoscibile come tale — il Titolare
          potrà annullare l'ordine dandone immediata comunicazione e rimborsando integralmente
          quanto eventualmente già corrisposto.
        </p>
      </>
    ),
  },
  {
    id: 'ordine',
    title: 'Conclusione del contratto',
    content: (
      <>
        <p>
          La presentazione dei Prodotti sul Sito costituisce invito a proporre. L'ordine trasmesso
          dal Cliente ha valore di proposta contrattuale vincolante ed è soggetto alle presenti
          Condizioni.
        </p>
        <ol>
          <li>Selezioni i Prodotti e li aggiungi al carrello.</li>
          <li>
            Inserisci i dati di spedizione e fatturazione, scegli il metodo di consegna e di
            pagamento.
          </li>
          <li>
            Prima dell'invio visualizzi il riepilogo completo dell'ordine, con il prezzo totale
            comprensivo di imposte e spese di spedizione, e confermi con il pulsante che riporta
            l'indicazione «ordine con obbligo di pagamento».
          </li>
          <li>
            Ricevi una email di conferma di ricezione dell'ordine, contenente il numero d'ordine e il
            riepilogo dei Prodotti acquistati.
          </li>
        </ol>
        <p>
          <strong>Il contratto si intende concluso</strong> nel momento in cui ricevi la email di
          conferma dell'ordine. Il Titolare si riserva di non accettare ordini incompleti, non
          correttamente compilati, provenienti da soggetti con i quali sussistano contenziosi in
          essere o relativi a quantitativi anomali rispetto al normale consumo.
        </p>
        <p>
          L'ordine è archiviato nei sistemi del Titolare secondo i criteri di riservatezza e
          sicurezza indicati nella <Link to="/privacy-policy">Privacy Policy</Link> e resta
          consultabile nell'area riservata del tuo account.
        </p>
      </>
    ),
  },
  {
    id: 'pagamenti',
    title: 'Modalità di pagamento e fatturazione',
    content: (
      <>
        <p>Sono accettati i seguenti metodi di pagamento:</p>
        <ul>
          <li>
            <strong>Carte di credito e debito</strong> (Visa, Mastercard, American Express) e wallet
            digitali (Apple Pay, Google Pay), tramite <strong>Stripe</strong>.
          </li>
          <li>
            <strong>PayPal</strong>, secondo le condizioni contrattuali del fornitore.
          </li>
        </ul>
        <p>
          I dati delle carte di pagamento sono trasmessi tramite connessione cifrata direttamente al
          prestatore di servizi di pagamento e{' '}
          <strong>non sono mai memorizzati sui server del Titolare</strong>. L'addebito avviene al
          momento della conferma dell'ordine.
        </p>
        <p>
          Per ogni ordine viene emesso documento fiscale. Se desideri ricevere fattura, devi indicare
          in fase di checkout i dati richiesti (Partita IVA, Codice Fiscale, codice destinatario SDI
          o indirizzo PEC): la richiesta di fattura non può essere accolta successivamente
          all'emissione del documento.
        </p>
      </>
    ),
  },
  {
    id: 'spedizioni',
    title: 'Spedizione e consegna',
    content: (
      <>
        <p>
          Le spedizioni sono effettuate tramite corrieri espressi nazionali e internazionali.
          L'ordine viene preparato entro <strong>1–2 giorni lavorativi</strong> dalla conferma del
          pagamento; la consegna avviene indicativamente entro <strong>2–5 giorni lavorativi</strong>{' '}
          per l'Italia e <strong>5–10 giorni lavorativi</strong> per le destinazioni estere servite.
        </p>
        <p>
          I termini di consegna sono indicativi e non essenziali; eventuali ritardi imputabili al
          corriere, a condizioni meteorologiche avverse o a cause di forza maggiore non danno luogo a
          risarcimento. In ogni caso, ai sensi dell'art. 61 del Codice del Consumo, la consegna
          avverrà entro e non oltre <strong>30 giorni</strong> dalla conclusione del contratto.
        </p>
        <div className={styles.infoBox}>
          <p>
            <strong>Spese di spedizione:</strong> calcolate in fase di checkout in base a peso e
            destinazione. La spedizione è <strong>gratuita per gli ordini di importo pari o
            superiore a € 50</strong> con destinazione Italia.
          </p>
        </div>
        <p>
          Al momento della consegna sei tenuto a verificare che il numero dei colli corrisponda a
          quanto indicato nel documento di trasporto e che l'imballo sia integro. Eventuali danni
          devono essere contestati immediatamente al corriere apponendo la dicitura{' '}
          <em>«accetto con riserva di controllo»</em> sulla bolla di consegna e segnalati al
          Titolare entro 7 giorni.
        </p>
        <p>
          In caso di mancato ritiro entro i termini di giacenza, il Prodotto rientrerà al mittente:
          le spese di spedizione e di rientro restano a carico del Cliente e saranno detratte
          dall'eventuale rimborso.
        </p>
      </>
    ),
  },
  {
    id: 'recesso',
    title: 'Diritto di recesso',
    content: (
      <>
        <p>
          Se sei un Consumatore hai diritto di recedere dal contratto, senza indicarne le ragioni ed
          entro <strong>14 giorni</strong> dal giorno in cui tu o un terzo da te designato acquisite
          il possesso fisico dei Prodotti (art. 52 del Codice del Consumo).
        </p>
        <h3>Come esercitare il recesso</h3>
        <p>
          È sufficiente inviare, prima della scadenza del termine, una dichiarazione esplicita a{' '}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> indicando numero d'ordine,
          Prodotti oggetto di recesso e i tuoi dati. Puoi utilizzare il modulo di recesso tipo di cui
          all'Allegato I, parte B, del Codice del Consumo, ma non è obbligatorio.
        </p>
        <p>
          Devi restituire i Prodotti entro <strong>14 giorni</strong> dalla comunicazione del
          recesso, integri, non utilizzati, con la confezione originale sigillata e completi di ogni
          elemento accessorio. <strong>Le spese dirette di restituzione sono a tuo carico</strong>,
          salvo diversa indicazione.
        </p>
        <h3>Rimborso</h3>
        <p>
          Il rimborso di tutte le somme versate, comprese le spese di consegna standard, avverrà
          entro 14 giorni dalla ricezione della comunicazione di recesso, con lo stesso mezzo di
          pagamento utilizzato per l'acquisto. Il Titolare può sospendere il rimborso fino al
          ricevimento dei Prodotti o alla prova della loro spedizione.
        </p>
        <h3>Esclusioni</h3>
        <div className={styles.infoBox}>
          <p>
            Ai sensi dell'<strong>art. 59 del Codice del Consumo</strong> il diritto di recesso è
            escluso per:
          </p>
          <ul>
            <li>
              i beni che rischiano di deteriorarsi o scadere rapidamente (lett. d);
            </li>
            <li>
              i beni sigillati che non si prestano a essere restituiti per motivi igienici o connessi
              alla protezione della salute e che sono stati aperti dopo la consegna (lett. e);
            </li>
            <li>
              i beni confezionati su misura o chiaramente personalizzati (lett. c).
            </li>
          </ul>
          <p>
            Trattandosi di prodotti alimentari, il recesso non può pertanto essere esercitato sui
            Prodotti la cui confezione sia stata aperta o il cui sigillo risulti compromesso.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'garanzia',
    title: 'Garanzia legale di conformità',
    content: (
      <>
        <p>
          Tutti i Prodotti venduti sono coperti dalla garanzia legale di conformità prevista dagli
          artt. 128 e seguenti del Codice del Consumo, che tutela il Consumatore per i difetti di
          conformità esistenti al momento della consegna e che si manifestino entro{' '}
          <strong>due anni</strong> da tale data.
        </p>
        <p>
          Il difetto deve essere denunciato entro <strong>due mesi</strong> dalla scoperta. In caso
          di difetto di conformità hai diritto, senza spese, al ripristino della conformità mediante
          sostituzione del Prodotto o, in via subordinata, alla riduzione del prezzo o alla
          risoluzione del contratto.
        </p>
        <p>
          La garanzia non copre i difetti derivanti da conservazione non conforme alle indicazioni
          riportate in etichetta, da uso improprio o dal superamento del termine minimo di
          conservazione. Per attivare la garanzia scrivi a{' '}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> allegando il numero d'ordine e
          documentazione fotografica del difetto e del lotto riportato sulla confezione.
        </p>
      </>
    ),
  },
  {
    id: 'account',
    title: 'Account e area B2B',
    content: (
      <>
        <p>
          La registrazione di un account è facoltativa per l'acquisto ma necessaria per accedere
          all'area riservata B2B. Ti impegni a fornire dati veritieri, completi e aggiornati e a
          custodire le credenziali di accesso con la massima diligenza, rispondendo di ogni attività
          svolta tramite il tuo account.
        </p>
        <p>
          L'accesso all'area B2B è riservato a soggetti titolari di Partita IVA ed è subordinato alla
          verifica dei dati forniti da parte del Titolare, che si riserva di accogliere o rifiutare
          la richiesta a proprio insindacabile giudizio. Prezzi, quantitativi minimi e condizioni di
          fornitura dell'area B2B possono differire da quelli applicati alla clientela consumatore.
        </p>
        <p>
          Il Titolare può sospendere o chiudere l'account in caso di violazione delle presenti
          Condizioni, di utilizzo fraudolento del Sito o di fornitura di dati non veritieri.
        </p>
      </>
    ),
  },
  {
    id: 'proprieta',
    title: 'Proprietà intellettuale e uso del sito',
    content: (
      <>
        <p>
          Tutti i contenuti del Sito — marchi, loghi, testi, fotografie, illustrazioni, video,
          grafica, layout e software — sono di proprietà del Titolare o dei rispettivi licenzianti e
          sono protetti dalla normativa in materia di diritto d'autore e proprietà industriale.
        </p>
        <p>
          È vietata la riproduzione, la modifica, la distribuzione, la pubblicazione o l'utilizzo,
          anche parziale, dei contenuti del Sito per finalità commerciali senza il preventivo
          consenso scritto del Titolare. È altresì vietata qualsiasi attività di estrazione
          automatizzata dei dati (<em>scraping</em>) o di utilizzo del Sito in modo tale da
          pregiudicarne la funzionalità o la sicurezza.
        </p>
      </>
    ),
  },
  {
    id: 'responsabilita',
    title: 'Limitazione di responsabilità',
    content: (
      <>
        <p>
          Il Titolare non è responsabile per disservizi imputabili a cause di forza maggiore, quali
          interruzioni della rete elettrica o di telecomunicazione, scioperi, eventi naturali o altri
          eventi al di fuori del proprio ragionevole controllo, che impediscano in tutto o in parte
          l'esecuzione dell'ordine nei tempi previsti.
        </p>
        <p>
          Il Titolare non risponde di danni derivanti da un uso del Sito o dei Prodotti difforme
          dalle istruzioni fornite e dalle indicazioni riportate in etichetta.
        </p>
        <p>
          Nessuna disposizione delle presenti Condizioni limita o esclude la responsabilità del
          Titolare nei casi in cui ciò sia vietato dalla legge, in particolare per dolo, colpa grave
          o danni alla salute delle persone, né pregiudica i diritti inderogabili riconosciuti al
          Consumatore.
        </p>
      </>
    ),
  },
  {
    id: 'legge',
    title: 'Legge applicabile, reclami e foro',
    content: (
      <>
        <p>
          Le presenti Condizioni sono regolate dalla <strong>legge italiana</strong>. Per il
          Consumatore residente nell'Unione Europea restano fermi i diritti riconosciuti dalle
          disposizioni imperative del Paese di residenza abituale.
        </p>
        <p>
          Puoi inoltrare reclami scrivendo a <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>{' '}
          o via PEC a <a href={`mailto:${COMPANY.pec}`}>{COMPANY.pec}</a>. Ci impegniamo a rispondere
          entro 30 giorni dal ricevimento.
        </p>
        <p>
          Ai sensi del Regolamento (UE) 524/2013 il Consumatore può ricorrere agli organismi di
          risoluzione alternativa delle controversie (ADR) previsti dagli artt. 141 e seguenti del
          Codice del Consumo. Il ricorso a tali procedure è facoltativo e non pregiudica il diritto
          di adire l'autorità giudiziaria.
        </p>
        <p>
          Per le controversie con il Consumatore è competente in via esclusiva il foro del luogo di
          residenza o domicilio elettivo del Consumatore stesso. Per le controversie con clienti
          Professionisti è competente in via esclusiva il <strong>Foro di Lecce</strong>.
        </p>
        <p>
          Qualora una clausola delle presenti Condizioni risulti nulla o inefficace, ciò non
          pregiudica la validità delle restanti previsioni.
        </p>
      </>
    ),
  },
];

export default function TerminiCondizioniPage() {
  useSEO({
    title: 'Termini e Condizioni',
    description:
      'Condizioni generali di vendita di capperificiocaro.com: ordini, prezzi, pagamenti, spedizioni, diritto di recesso e garanzia legale di conformità.',
    path: '/termini-e-condizioni',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Termini e Condizioni', path: '/termini-e-condizioni' },
    ],
  });

  return (
    <LegalLayout
      tag="Documento legale"
      title="Termini e Condizioni"
      intro={`Condizioni generali di vendita dei prodotti offerti sul sito ${COMPANY.domain}, redatte nel rispetto del D.Lgs. 206/2005 (Codice del Consumo) e del D.Lgs. 70/2003.`}
      sections={SECTIONS}
    />
  );
}
