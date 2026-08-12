import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import LegalLayout from '../components/Legal/LegalLayout';
import { COMPANY } from '../data/company';
import styles from './LegalPage.module.css';

function openCookieSettings() {
  if (window.CapperificioConsent?.openSettings) {
    window.CapperificioConsent.openSettings();
  }
}

const SECTIONS = [
  {
    id: 'cosa-sono',
    title: 'Cosa sono i cookie',
    content: (
      <>
        <p>
          I cookie sono piccoli file di testo che i siti visitati inviano al terminale dell'utente,
          dove vengono memorizzati per essere poi ritrasmessi agli stessi siti alla visita
          successiva. Accanto ai cookie esistono tecnologie analoghe — <em>local storage</em>,{' '}
          <em>session storage</em>, pixel e web beacon — che consentono di archiviare o leggere
          informazioni sul dispositivo e alle quali si applica la medesima disciplina.
        </p>
        <p>
          La presente Cookie Policy, resa ai sensi dell'art. 122 del D.Lgs. 196/2003 (Codice
          Privacy), delle Linee guida del Garante del 10 giugno 2021 e degli artt. 6 e 13 del
          Regolamento (UE) 2016/679, descrive quali strumenti utilizziamo su{' '}
          <strong>{COMPANY.domain}</strong> e come puoi gestirli.
        </p>
        <p>
          Titolare del trattamento è <strong>{COMPANY.legalNameShort}</strong>, con sede in{' '}
          {COMPANY.addressLine}, P.IVA {COMPANY.vat}. Per i dettagli completi consulta la{' '}
          <Link to="/privacy-policy">Privacy Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'categorie',
    title: 'Categorie di cookie utilizzati',
    content: (
      <>
        <h3>Cookie tecnici necessari</h3>
        <p>
          Indispensabili al funzionamento del sito: consentono la navigazione, la gestione del
          carrello, l'autenticazione e la memorizzazione delle scelte espresse in materia di cookie.
          Vengono installati <strong>senza necessità di consenso</strong>, in quanto strettamente
          necessari a erogare il servizio da te richiesto.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Fornitore</th>
                <th>Finalità</th>
                <th>Durata</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>sw-context-token</code></td>
                <td>Shopware (prima parte)</td>
                <td>Identifica la sessione di acquisto e mantiene il contenuto del carrello</td>
                <td>Sessione</td>
              </tr>
              <tr>
                <td><code>capperificio_consent</code></td>
                <td>Prima parte (local storage)</td>
                <td>Memorizza le preferenze espresse tramite il banner cookie</td>
                <td>12 mesi</td>
              </tr>
              <tr>
                <td><code>session-</code>, <code>csrf</code></td>
                <td>Shopware (prima parte)</td>
                <td>Autenticazione dell'utente e protezione dei moduli da attacchi CSRF</td>
                <td>Sessione</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Cookie analitici</h3>
        <p>
          Ci permettono di comprendere in forma aggregata come i visitatori utilizzano il sito, quali
          pagine sono più consultate e dove si verificano difficoltà di navigazione. Sono installati{' '}
          <strong>solo previo tuo consenso</strong> e possono essere disattivati in qualsiasi
          momento.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Fornitore</th>
                <th>Finalità</th>
                <th>Durata</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>_ga</code>, <code>_ga_*</code></td>
                <td>Google Analytics 4 — Google Ireland Ltd.</td>
                <td>Distingue gli utenti e misura le sessioni</td>
                <td>24 mesi</td>
              </tr>
              <tr>
                <td><code>_gid</code></td>
                <td>Google Analytics 4 — Google Ireland Ltd.</td>
                <td>Distingue gli utenti</td>
                <td>24 ore</td>
              </tr>
              <tr>
                <td><code>_gat</code></td>
                <td>Google Analytics 4 — Google Ireland Ltd.</td>
                <td>Limita la frequenza delle richieste al server</td>
                <td>1 minuto</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Cookie di marketing e profilazione</h3>
        <p>
          Utilizzati per mostrarti annunci pertinenti sui siti dei nostri partner pubblicitari e per
          misurare l'efficacia delle campagne. Sono installati{' '}
          <strong>esclusivamente previo tuo consenso</strong>.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Fornitore</th>
                <th>Finalità</th>
                <th>Durata</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>_fbp</code></td>
                <td>Meta Platforms Ireland Ltd.</td>
                <td>Misurazione delle conversioni e retargeting pubblicitario</td>
                <td>3 mesi</td>
              </tr>
              <tr>
                <td><code>_fbc</code></td>
                <td>Meta Platforms Ireland Ltd.</td>
                <td>Attribuzione del clic proveniente da un annuncio</td>
                <td>3 mesi</td>
              </tr>
              <tr>
                <td><code>_gcl_au</code></td>
                <td>Google Ireland Ltd.</td>
                <td>Attribuzione delle conversioni Google Ads</td>
                <td>3 mesi</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Il sito utilizza <strong>Google Tag Manager</strong> per la gestione dei tag e{' '}
          <strong>Google Consent Mode v2</strong>: fino alla manifestazione del consenso i tag
          operano in modalità limitata, senza memorizzare identificatori sul tuo dispositivo.
        </p>
      </>
    ),
  },
  {
    id: 'terze-parti',
    title: 'Cookie di terze parti',
    content: (
      <>
        <p>
          Alcuni strumenti sono forniti da soggetti terzi che agiscono come titolari autonomi del
          trattamento. Il Titolare non ha accesso né controllo diretto sui cookie installati da tali
          soggetti: ti invitiamo a consultare le rispettive informative.
        </p>
        <ul>
          <li>
            <strong>Google Ireland Ltd.</strong> —{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Informativa privacy
            </a>
          </li>
          <li>
            <strong>Meta Platforms Ireland Ltd.</strong> —{' '}
            <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer">
              Informativa privacy
            </a>
          </li>
          <li>
            <strong>Stripe Payments Europe Ltd.</strong> —{' '}
            <a href="https://stripe.com/it/privacy" target="_blank" rel="noopener noreferrer">
              Informativa privacy
            </a>{' '}
            (cookie tecnici e antifrode attivi nella fase di pagamento)
          </li>
        </ul>
        <p>
          Le pagine del sito possono inoltre includere contenuti incorporati (ad esempio video o
          mappe) che, una volta caricati, possono impostare cookie propri. Tali contenuti vengono
          attivati solo dopo il consenso alle relative categorie.
        </p>
      </>
    ),
  },
  {
    id: 'gestione',
    title: 'Come gestire le preferenze',
    content: (
      <>
        <p>
          Al primo accesso al sito ti viene mostrato un banner che ti consente di accettare tutti i
          cookie, rifiutarli o selezionare le singole categorie. Puoi modificare le tue scelte in
          qualsiasi momento, senza alcun pregiudizio per la navigazione:
        </p>
        <div className={styles.infoBox}>
          <p>
            Rivedi o revoca il consenso già prestato tramite il pannello di gestione delle
            preferenze:
          </p>
          <button type="button" className={styles.inlineBtn} onClick={openCookieSettings}>
            Gestisci le preferenze cookie
          </button>
        </div>
        <p>
          La revoca del consenso comporta la rimozione dei cookie analitici e di marketing già
          presenti sul tuo dispositivo. I cookie tecnici necessari restano attivi perché
          indispensabili al funzionamento del sito.
        </p>
        <h3>Impostazioni del browser</h3>
        <p>
          Puoi in ogni caso configurare il tuo browser per bloccare o eliminare i cookie. Segnaliamo
          che la disabilitazione dei cookie tecnici può compromettere alcune funzionalità del sito,
          come il carrello e l'accesso all'area riservata.
        </p>
        <ul>
          <li>
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a>
          </li>
          <li>
            <a href="https://support.mozilla.org/it/kb/Attivare%20e%20disattivare%20i%20cookie" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a>
          </li>
          <li>
            <a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Apple Safari</a>
          </li>
          <li>
            <a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'diritti-cookie',
    title: "Diritti dell'interessato e contatti",
    content: (
      <>
        <p>
          Rispetto ai dati raccolti tramite cookie puoi esercitare i diritti previsti dagli articoli
          15–22 del GDPR: accesso, rettifica, cancellazione, limitazione, portabilità, opposizione e
          revoca del consenso. Il dettaglio dei diritti e delle modalità di esercizio è riportato
          nella <Link to="/privacy-policy">Privacy Policy</Link>.
        </p>
        <p>
          Per qualsiasi richiesta puoi scrivere a{' '}
          <a href={`mailto:${COMPANY.emailPrivacy}`}>{COMPANY.emailPrivacy}</a> o inviare una PEC a{' '}
          <a href={`mailto:${COMPANY.pec}`}>{COMPANY.pec}</a>. Hai inoltre diritto di proporre
          reclamo al{' '}
          <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
            Garante per la protezione dei dati personali
          </a>.
        </p>
        <p>
          La presente Cookie Policy può essere aggiornata a seguito dell'introduzione di nuovi
          strumenti o di modifiche normative: la versione vigente è sempre pubblicata su questa
          pagina.
        </p>
      </>
    ),
  },
];

export default function CookiePolicyPage() {
  useSEO({
    title: 'Cookie Policy',
    description:
      'Informativa estesa sui cookie e sulle tecnologie di tracciamento utilizzate su capperificiocaro.com, con gestione delle preferenze.',
    path: '/cookie-policy',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Cookie Policy', path: '/cookie-policy' },
    ],
  });

  return (
    <LegalLayout
      tag="Documento legale"
      title="Cookie Policy"
      intro="Informativa estesa sull'utilizzo di cookie e tecnologie analoghe, resa ai sensi dell'art. 122 del D.Lgs. 196/2003 e delle Linee guida del Garante Privacy del 10 giugno 2021."
      sections={SECTIONS}
    />
  );
}
