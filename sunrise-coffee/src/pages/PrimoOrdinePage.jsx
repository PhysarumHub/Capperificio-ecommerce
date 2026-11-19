import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { HELP_FACTS } from '../data/assistenza';
import { HelpCta, HelpHero, HelpTabs, Chevron } from '../components/Assistenza/HelpParts';
import styles from '../components/Assistenza/Assistenza.module.css';

const STEPS = [
  {
    title: 'Scegli i capperi',
    text: 'Non sai quale calibro prendere? L’Occhio di Pernice è il più versatile. Se vuoi confrontarli, leggi la guida ai calibri.',
    link: { to: '/guide/quale-calibro-scegliere', label: 'Guida ai calibri' },
  },
  {
    title: 'Paga in sicurezza',
    text: 'Carta, Apple Pay o Google Pay tramite Stripe. Non serve registrarsi: basta l’email. Se vuoi la fattura, inserisci i dati fiscali prima di confermare.',
    link: { to: '/assistenza/ordini-e-pagamenti/come-pagare', label: 'Metodi di pagamento' },
  },
  {
    title: 'Ricevi la conferma',
    text: 'Pochi minuti dopo il pagamento ti arriva l’email con il numero d’ordine. Tienila: serve per seguire il pacco o per scriverci.',
    link: { to: '/assistenza/ordini-e-pagamenti/conferma-non-arrivata', label: 'Non è arrivata?' },
  },
  {
    title: 'Prepariamo il pacco a Racale',
    text: `Entro ${HELP_FACTS.prepDays} prendiamo i vasetti dalla dispensa, li proteggiamo uno per uno e chiudiamo la scatola. Finché non parte, puoi ancora cambiare l’ordine.`,
    link: { to: '/assistenza/ordini-e-pagamenti/modificare-ordine', label: 'Modificare un ordine' },
  },
  {
    title: 'Il pacco parte',
    text: `Ti mandiamo il codice di tracciamento. In Italia arriva in ${HELP_FACTS.deliveryIT}; la spedizione è gratuita da € ${HELP_FACTS.freeShippingFrom}.`,
    link: { to: '/assistenza/dove-e-il-mio-ordine', label: 'Dov’è il mio ordine' },
  },
  {
    title: 'In dispensa',
    text: 'I capperi al sale stanno in dispensa, coperti dal loro sale; quelli all’aceto, dopo l’apertura, in frigorifero. Prima di usarli al sale, sciacquali.',
    link: { to: '/guide/come-dissalare-i-capperi', label: 'Come si dissalano' },
  },
];

export default function PrimoOrdinePage() {
  useSEO({
    title: 'Il tuo primo ordine',
    description: 'Cosa succede dopo il pagamento, passo per passo: conferma, preparazione a Racale, spedizione e conservazione dei capperi.',
    path: '/assistenza/primo-ordine',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Centro assistenza', path: '/assistenza' },
      { name: 'Il primo ordine', path: '/assistenza/primo-ordine' },
    ],
  });

  return (
    <div className={styles.page}>
      <HelpHero
        kicker="Il primo ordine"
        title="Dal campo alla tua dispensa"
        intro="Cosa succede dopo che hai cliccato su “Paga”, passo per passo."
        crumbs={[
          { name: 'Centro assistenza', path: '/assistenza' },
          { name: 'Il primo ordine', path: '/assistenza/primo-ordine' },
        ]}
      />
      <HelpTabs />

      <div className={styles.wrap}>
        <section className={styles.section}>
          <div className={styles.topics}>
            {STEPS.map((s, i) => (
              <div key={s.title} className={styles.topic}>
                <span className={styles.topicNum}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.topicTitle}>{s.title}</span>
                <span className={styles.topicSub}>{s.text}</span>
                <Link to={s.link.to} className={styles.entryGo}>{s.link.label} <Chevron /></Link>
              </div>
            ))}
            <Link to="/collections/all" className={styles.topic}>
              <span className={styles.topicNum}>{String(STEPS.length + 1).padStart(2, '0')}</span>
              <span className={styles.topicTitle}>Pronto?</span>
              <span className={styles.topicSub}>Tutti i capperi, i cucunci, le foglie e la polvere di Racale.</span>
              <span className={styles.topicCount}>Vai ai prodotti</span>
            </Link>
          </div>
        </section>
      </div>

      <HelpCta title="Hai un dubbio prima di ordinare?" />
    </div>
  );
}
