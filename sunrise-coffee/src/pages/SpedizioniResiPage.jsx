import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { COMPANY } from '../data/company';
import { HELP_FACTS as F } from '../data/assistenza';
import { HelpCta, HelpHero, HelpTabs } from '../components/Assistenza/HelpParts';
import styles from '../components/Assistenza/Assistenza.module.css';

const UPDATED = '19 novembre 2026';

const SECTIONS = [
  { id: 'dove', title: 'Dove spediamo' },
  { id: 'costi', title: 'Costi di spedizione' },
  { id: 'tempi', title: 'Tempi di consegna' },
  { id: 'tracciamento', title: 'Tracciamento' },
  { id: 'problemi', title: 'Problemi con la consegna' },
  { id: 'recesso', title: 'Recesso e reso' },
  { id: 'difetti', title: 'Prodotto difettoso' },
  { id: 'contatti', title: 'Contatti' },
];

const Mail = ({ to = COMPANY.email }) => <a href={`mailto:${to}`}>{to}</a>;

export default function SpedizioniResiPage() {
  useSEO({
    title: 'Spedizioni e resi',
    description: `Costi e tempi di spedizione, tracciamento, recesso in ${F.withdrawalDays} giorni e garanzia: tutte le regole del Capperificio di Racale in una pagina.`,
    path: '/spedizioni-e-resi',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Centro assistenza', path: '/assistenza' },
      { name: 'Spedizioni e resi', path: '/spedizioni-e-resi' },
    ],
  });

  const h2 = (i) => (
    <h2 id={SECTIONS[i].id}>{i + 1}. {SECTIONS[i].title}</h2>
  );

  return (
    <div className={styles.page}>
      <HelpHero
        kicker={`Aggiornamento: ${UPDATED}`}
        title="Spedizioni e resi"
        intro="Come spediamo, quanto costa, quando arriva e cosa fare se qualcosa non va. Le regole complete sono nelle Condizioni di vendita: qui le trovi spiegate in breve."
        crumbs={[
          { name: 'Centro assistenza', path: '/assistenza' },
          { name: 'Spedizioni e resi', path: '/spedizioni-e-resi' },
        ]}
      />
      <HelpTabs />

      <div className={styles.narrow}>
        <section className={styles.section}>
          <nav className={styles.toc} aria-label="In questa pagina">
            <p className={styles.label}><span className={styles.dot} />In questa pagina</p>
            <ol>
              {SECTIONS.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}
            </ol>
          </nav>

          <div className={`${styles.rich} ${styles.policy}`}>
            {h2(0)}
            <p>
              Spediamo in tutta Italia e in gran parte dei Paesi dell’Unione Europea. Al checkout,
              inserendo l’indirizzo, vedi subito se la destinazione è servita. Per altri Paesi scrivici
              prima di ordinare a <Mail />.
            </p>

            {h2(1)}
            <h3>2.1 Italia</h3>
            <p>
              Spedizione <strong>gratuita per ordini da € {F.freeShippingFrom}</strong>. Sotto questa soglia
              il costo dipende da peso e destinazione e lo vedi nel carrello prima di pagare.
            </p>
            <h3>2.2 Estero</h3>
            <p>Il costo è calcolato al checkout in base al Paese e al peso del pacco.</p>
            <h3>2.3 Box di Natale</h3>
            <p>
              Il costo della spedizione e le date disponibili sono indicati nel{' '}
              <Link to="/box-di-natale">configuratore</Link>. Puoi spedire la box direttamente a chi la riceve.
            </p>

            {h2(2)}
            <ul>
              <li><strong>Preparazione</strong>: {F.prepDays} dalla conferma del pagamento.</li>
              <li><strong>Italia</strong>: {F.deliveryIT} con corriere espresso.</li>
              <li><strong>Estero</strong>: {F.deliveryEU}, secondo il Paese.</li>
            </ul>
            <p>
              I tempi sono indicativi: possono allungarsi nei periodi di picco, per cause del corriere o
              per maltempo. In ogni caso la consegna avviene entro 30 giorni dalla conclusione del contratto.
            </p>
            <h3>3.1 Per Natale</h3>
            <p>
              Per le Box di Natale fa fede la data di spedizione scelta nel configuratore. Per gli altri
              prodotti consigliamo di ordinare entro metà dicembre.
            </p>

            {h2(3)}
            <p>
              Quando il pacco parte ricevi un’email con corriere e codice di tracciamento. Puoi controllare
              lo stato anche da <Link to="/assistenza/dove-e-il-mio-ordine">Dov’è il mio ordine</Link>, con
              numero d’ordine ed email, senza account.
            </p>

            {h2(4)}
            <h3>5.1 Se non sei in casa</h3>
            <p>
              Il corriere lascia un avviso e ritenta la consegna o deposita il pacco in un punto di ritiro.
              Se il pacco non viene ritirato entro i termini di giacenza torna a noi: le spese di rientro e
              di nuova spedizione restano a carico del cliente.
            </p>
            <h3>5.2 Pacco danneggiato</h3>
            <p>
              Se l’imballo è danneggiato firma con la dicitura <strong>“accetto con riserva di
              controllo”</strong>, fotografa pacco e prodotti e scrivici entro {F.damageReportDays} giorni
              su WhatsApp ({COMPANY.whatsapp}) o a <Mail to={COMPANY.emailOrders} />. Rispediamo o
              rimborsiamo, senza costi per te.
            </p>

            {h2(5)}
            <p>
              Se sei un consumatore puoi recedere entro <strong>{F.withdrawalDays} giorni dalla
              consegna</strong>, senza indicare il motivo.
            </p>
            <h3>6.1 I passaggi</h3>
            <ol className={styles.steps}>
              <li>Scrivi a <Mail /> entro {F.withdrawalDays} giorni dalla consegna con nome, numero d’ordine e prodotti da restituire: ti confermiamo la ricezione e l’indirizzo per il reso.</li>
              <li>Entro {F.withdrawalDays} giorni dalla comunicazione rispedisci i prodotti, integri e con la confezione originale sigillata, all’indirizzo che ti indichiamo.</li>
              <li>Rimborsiamo entro {F.withdrawalDays} giorni con lo stesso metodo di pagamento, anche le spese di consegna standard, appena riceviamo i prodotti o la prova della spedizione.</li>
            </ol>
            <h3>6.2 Chi paga il reso</h3>
            <p>
              Le spese dirette di restituzione sono a carico del cliente. Se il prodotto è difettoso,
              danneggiato o diverso da quello ordinato, le paghiamo noi.
            </p>
            <h3>6.3 Prodotti alimentari</h3>
            <p className={styles.note}>
              Il recesso è escluso per le confezioni aperte o con il sigillo compromesso, e per i prodotti
              che rischiano di deteriorarsi rapidamente (art. 59 del Codice del Consumo).
            </p>

            {h2(6)}
            <p>
              Tutti i prodotti hanno la garanzia legale di conformità di {F.warrantyYears} anni dalla
              consegna. Segnala il difetto entro {F.defectReportMonths} mesi dalla scoperta a{' '}
              <Mail />, con numero d’ordine e foto del prodotto e del lotto in etichetta: sostituiamo o
              rimborsiamo. La garanzia non copre i difetti dovuti a conservazione diversa da quella
              indicata in etichetta o al superamento del termine minimo di conservazione.
            </p>

            {h2(7)}
            <p>
              WhatsApp: <a href={COMPANY.whatsappLink} target="_blank" rel="noopener noreferrer">{COMPANY.whatsapp}</a>
              {' '}· Ordini: <Mail to={COMPANY.emailOrders} /> · Informazioni: <Mail />
            </p>
            <p>
              {COMPANY.legalNameShort} — {COMPANY.addressLine} — P.IVA {COMPANY.vat}. Regole complete
              nelle <Link to="/termini-e-condizioni">Condizioni generali di vendita</Link>.
            </p>
          </div>
        </section>
      </div>

      <HelpCta />
    </div>
  );
}
