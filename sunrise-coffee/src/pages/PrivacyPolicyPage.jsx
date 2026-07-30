import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import LegalLayout from '../components/Legal/LegalLayout';
import CompanyData from '../components/Legal/CompanyData';
import { COMPANY } from '../data/company';
import styles from './LegalPage.module.css';

const SECTIONS = [
  {
    id: 'titolare',
    title: 'Titolare del trattamento',
    content: (
      <>
        <p>
          Il Titolare del trattamento dei dati personali raccolti tramite il sito{' '}
          <strong>{COMPANY.domain}</strong> è:
        </p>
        <CompanyData />
        <p>
          Per qualsiasi richiesta relativa al trattamento dei tuoi dati personali puoi scrivere a{' '}
          <a href={`mailto:${COMPANY.emailPrivacy}`}>{COMPANY.emailPrivacy}</a> oppure inviare una
          comunicazione via PEC a <a href={`mailto:${COMPANY.pec}`}>{COMPANY.pec}</a>.
        </p>
        <p>
          Il Titolare non ha nominato un Responsabile della Protezione dei Dati (DPO), non
          ricorrendone i presupposti di cui all'art. 37 del Regolamento (UE) 2016/679 (di seguito
          «GDPR»).
        </p>
      </>
    ),
  },
  {
    id: 'dati-raccolti',
    title: 'Quali dati raccogliamo',
    content: (
      <>
        <p>
          Raccogliamo esclusivamente i dati necessari a erogare i servizi richiesti. A seconda di
          come utilizzi il sito, possiamo trattare le seguenti categorie di dati:
        </p>
        <h3>Dati forniti volontariamente da te</h3>
        <ul>
          <li>
            <strong>Dati anagrafici e di contatto:</strong> nome, cognome, ragione sociale, indirizzo
            email, numero di telefono.
          </li>
          <li>
            <strong>Dati di spedizione e fatturazione:</strong> indirizzo, CAP, città, provincia,
            Paese, Partita IVA, Codice Fiscale, codice destinatario SDI.
          </li>
          <li>
            <strong>Dati dell'account:</strong> credenziali di accesso (la password è conservata in
            forma cifrata e non è mai visibile al Titolare), storico degli ordini, preferenze.
          </li>
          <li>
            <strong>Contenuto delle comunicazioni:</strong> messaggi inviati tramite moduli di
            contatto, richieste di accesso all'area B2B, richieste di assistenza.
          </li>
        </ul>
        <h3>Dati di pagamento</h3>
        <p>
          I dati della carta di credito e degli strumenti di pagamento{' '}
          <strong>non transitano né vengono memorizzati sui nostri server</strong>: sono raccolti e
          trattati direttamente dai prestatori di servizi di pagamento (Stripe, PayPal), in qualità
          di titolari autonomi del trattamento. Riceviamo unicamente l'esito della transazione e i
          dati minimi necessari alla riconciliazione contabile.
        </p>
        <h3>Dati raccolti automaticamente</h3>
        <ul>
          <li>
            <strong>Dati di navigazione:</strong> indirizzo IP, tipo e versione di browser, sistema
            operativo, pagine visitate, data e ora di accesso, referrer. Questi dati sono raccolti
            dai log del server per finalità di sicurezza e diagnostica.
          </li>
          <li>
            <strong>Cookie e tecnologie simili:</strong> come descritto nella{' '}
            <Link to="/cookie-policy">Cookie Policy</Link>. I cookie non necessari sono installati
            solo previo tuo consenso.
          </li>
        </ul>
        <p>
          Non trattiamo intenzionalmente categorie particolari di dati (art. 9 GDPR) e il sito non è
          destinato a minori di 16 anni.
        </p>
      </>
    ),
  },
  {
    id: 'finalita',
    title: 'Finalità e basi giuridiche',
    content: (
      <>
        <p>
          Ogni trattamento è fondato su una specifica base giuridica ai sensi dell'art. 6 GDPR,
          secondo la tabella seguente:
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Finalità</th>
                <th>Base giuridica</th>
                <th>Conservazione</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Gestione degli ordini, spedizione e assistenza post-vendita</td>
                <td>Esecuzione del contratto — art. 6.1.b</td>
                <td>Durata del rapporto contrattuale</td>
              </tr>
              <tr>
                <td>Adempimenti fiscali, contabili e di fatturazione</td>
                <td>Obbligo legale — art. 6.1.c</td>
                <td>10 anni (art. 2220 c.c.)</td>
              </tr>
              <tr>
                <td>Creazione e gestione dell'account cliente e dell'area B2B</td>
                <td>Esecuzione del contratto — art. 6.1.b</td>
                <td>Fino alla cancellazione dell'account</td>
              </tr>
              <tr>
                <td>Risposta a richieste inviate tramite i moduli di contatto</td>
                <td>Misure precontrattuali / legittimo interesse — art. 6.1.b, 6.1.f</td>
                <td>24 mesi dall'ultimo contatto</td>
              </tr>
              <tr>
                <td>Invio della newsletter e comunicazioni promozionali</td>
                <td>Consenso — art. 6.1.a</td>
                <td>Fino alla revoca del consenso</td>
              </tr>
              <tr>
                <td>Cookie analitici e di marketing, profilazione</td>
                <td>Consenso — art. 6.1.a</td>
                <td>Vedi <Link to="/cookie-policy">Cookie Policy</Link></td>
              </tr>
              <tr>
                <td>Sicurezza del sito, prevenzione frodi e abusi</td>
                <td>Legittimo interesse — art. 6.1.f</td>
                <td>12 mesi (log di sistema)</td>
              </tr>
              <tr>
                <td>Accertamento, esercizio o difesa di un diritto in sede giudiziaria</td>
                <td>Legittimo interesse — art. 6.1.f</td>
                <td>Fino al termine di prescrizione</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Il conferimento dei dati contrassegnati come obbligatori nei moduli è necessario per
          concludere l'ordine o attivare il servizio richiesto: il mancato conferimento rende
          impossibile dare seguito alla richiesta. Il conferimento dei dati per finalità di
          marketing è invece sempre facoltativo.
        </p>
      </>
    ),
  },
  {
    id: 'destinatari',
    title: 'Destinatari dei dati',
    content: (
      <>
        <p>
          I dati possono essere comunicati a soggetti che agiscono come Responsabili del trattamento
          (art. 28 GDPR), nominati con apposito atto, o come titolari autonomi. Le principali
          categorie di destinatari sono:
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Destinatario</th>
                <th>Attività</th>
                <th>Ruolo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Shopware AG</td>
                <td>Piattaforma e-commerce, gestione catalogo e ordini</td>
                <td>Responsabile</td>
              </tr>
              <tr>
                <td>Stripe Payments Europe Ltd.</td>
                <td>Elaborazione dei pagamenti con carta e wallet</td>
                <td>Titolare autonomo</td>
              </tr>
              <tr>
                <td>PayPal (Europe) S.à r.l. et Cie, S.C.A.</td>
                <td>Elaborazione dei pagamenti PayPal</td>
                <td>Titolare autonomo</td>
              </tr>
              <tr>
                <td>Packlink Shipping S.L. e corrieri incaricati</td>
                <td>Spedizione e tracciamento degli ordini</td>
                <td>Responsabile / Titolare autonomo</td>
              </tr>
              <tr>
                <td>Resend, Inc.</td>
                <td>Invio delle email transazionali (conferme d'ordine, spedizione)</td>
                <td>Responsabile</td>
              </tr>
              <tr>
                <td>Google Ireland Ltd.</td>
                <td>Analisi statistica e tag management, previo consenso</td>
                <td>Titolare autonomo</td>
              </tr>
              <tr>
                <td>Fornitori di hosting e infrastruttura</td>
                <td>Erogazione tecnica del sito e conservazione dei dati</td>
                <td>Responsabile</td>
              </tr>
              <tr>
                <td>Consulenti fiscali, contabili e legali</td>
                <td>Adempimenti amministrativi e tutela dei diritti</td>
                <td>Responsabile / Titolare autonomo</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          I dati possono inoltre essere comunicati ad autorità pubbliche quando previsto da un
          obbligo di legge. <strong>I dati non sono in alcun caso oggetto di diffusione né venduti a
          terzi.</strong>
        </p>
        <p>
          L'elenco aggiornato dei Responsabili del trattamento è disponibile su richiesta scrivendo
          a <a href={`mailto:${COMPANY.emailPrivacy}`}>{COMPANY.emailPrivacy}</a>.
        </p>
      </>
    ),
  },
  {
    id: 'trasferimenti',
    title: 'Trasferimenti extra-UE',
    content: (
      <>
        <p>
          I dati sono trattati in via principale all'interno dello Spazio Economico Europeo. Alcuni
          fornitori (ad esempio Google e Resend) possono trattare dati negli Stati Uniti o in altri
          Paesi terzi.
        </p>
        <p>
          In tali casi il trasferimento avviene esclusivamente in presenza di adeguate garanzie ai
          sensi del Capo V del GDPR, ovvero:
        </p>
        <ul>
          <li>
            una decisione di adeguatezza della Commissione Europea (es. adesione al{' '}
            <em>EU–U.S. Data Privacy Framework</em>);
          </li>
          <li>
            le Clausole Contrattuali Standard approvate dalla Commissione Europea, integrate ove
            necessario da misure supplementari di natura tecnica e organizzativa.
          </li>
        </ul>
        <p>
          Puoi richiedere copia delle garanzie adottate scrivendo a{' '}
          <a href={`mailto:${COMPANY.emailPrivacy}`}>{COMPANY.emailPrivacy}</a>.
        </p>
      </>
    ),
  },
  {
    id: 'conservazione',
    title: 'Conservazione dei dati',
    content: (
      <>
        <p>
          I dati sono conservati per il tempo strettamente necessario a conseguire le finalità per
          cui sono stati raccolti, secondo i termini indicati nella tabella al paragrafo 3 e nel
          rispetto dei termini di legge.
        </p>
        <p>
          Al termine del periodo di conservazione i dati sono cancellati o resi anonimi in modo
          irreversibile, salvo che una loro ulteriore conservazione sia richiesta per l'accertamento,
          l'esercizio o la difesa di un diritto in sede giudiziaria.
        </p>
      </>
    ),
  },
  {
    id: 'diritti',
    title: 'I tuoi diritti',
    content: (
      <>
        <p>
          In qualità di interessato puoi esercitare in ogni momento, gratuitamente, i diritti
          previsti dagli articoli 15–22 del GDPR:
        </p>
        <ul>
          <li><strong>Accesso</strong> — ottenere conferma dell'esistenza di un trattamento e copia dei tuoi dati.</li>
          <li><strong>Rettifica</strong> — correggere dati inesatti o integrare dati incompleti.</li>
          <li><strong>Cancellazione</strong> — ottenere la rimozione dei dati nei casi previsti dall'art. 17.</li>
          <li><strong>Limitazione</strong> — chiedere la sospensione del trattamento nei casi previsti dall'art. 18.</li>
          <li><strong>Portabilità</strong> — ricevere i dati in formato strutturato e di uso comune, o chiederne la trasmissione a un altro titolare.</li>
          <li><strong>Opposizione</strong> — opporti al trattamento fondato sul legittimo interesse e, in ogni momento e senza motivazione, al marketing diretto.</li>
          <li><strong>Revoca del consenso</strong> — revocare in qualsiasi momento il consenso prestato, senza pregiudicare la liceità del trattamento effettuato prima della revoca.</li>
          <li><strong>Reclamo</strong> — proporre reclamo al Garante per la protezione dei dati personali.</li>
        </ul>
        <p>
          Per esercitare i tuoi diritti scrivi a{' '}
          <a href={`mailto:${COMPANY.emailPrivacy}`}>{COMPANY.emailPrivacy}</a>, allegando un
          documento di identità in corso di validità se necessario a verificare la tua identità.
          Risponderemo entro 30 giorni dal ricevimento della richiesta, prorogabili di ulteriori due
          mesi in caso di particolare complessità.
        </p>
        <p>
          Puoi inoltre proporre reclamo al <strong>Garante per la protezione dei dati personali</strong>,
          Piazza Venezia 11, 00187 Roma —{' '}
          <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
            garanteprivacy.it
          </a>.
        </p>
      </>
    ),
  },
  {
    id: 'sicurezza',
    title: 'Sicurezza e processi automatizzati',
    content: (
      <>
        <p>
          Adottiamo misure tecniche e organizzative adeguate ai sensi dell'art. 32 GDPR, tra cui:
          cifratura del traffico tramite protocollo HTTPS/TLS, conservazione delle password in forma
          cifrata, controllo degli accessi basato su ruoli, limitazione della frequenza delle
          richieste (rate limiting), backup periodici e aggiornamento costante dei sistemi.
        </p>
        <p>
          Non effettuiamo processi decisionali interamente automatizzati che producano effetti
          giuridici o incidano in modo analogamente significativo sulla tua persona, ai sensi
          dell'art. 22 GDPR.
        </p>
      </>
    ),
  },
  {
    id: 'modifiche',
    title: 'Modifiche alla presente informativa',
    content: (
      <>
        <p>
          Il Titolare si riserva di aggiornare la presente informativa per adeguarla a modifiche
          normative, organizzative o tecnologiche. La versione vigente è sempre pubblicata su questa
          pagina, con indicazione della data di ultimo aggiornamento.
        </p>
        <p>
          In caso di modifiche sostanziali che incidano sui trattamenti basati sul consenso, te ne
          daremo comunicazione e, ove necessario, ti chiederemo di rinnovare il consenso.
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  useSEO({
    title: 'Privacy Policy',
    description:
      'Informativa sul trattamento dei dati personali ai sensi del Regolamento (UE) 2016/679 (GDPR) per il sito capperificiocaro.com.',
    path: '/privacy-policy',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Privacy Policy', path: '/privacy-policy' },
    ],
  });

  return (
    <LegalLayout
      tag="Documento legale"
      title="Privacy Policy"
      intro={`Informativa sul trattamento dei dati personali resa ai sensi degli articoli 13 e 14 del Regolamento (UE) 2016/679 agli utenti del sito ${COMPANY.domain}.`}
      sections={SECTIONS}
    />
  );
}
