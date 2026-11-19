import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { HELP_FACTS } from '../data/assistenza';
import h, { Band, Crumbs, JARS, JarsPanel, pad } from '../components/Help/Help';

// Chi agisce in ogni passaggio (stessa posizione di STEPS).
const WHO = ['TU', 'TU', 'IN POCHI MINUTI', `NOI · ${HELP_FACTS.prepDays}`, `CORRIERE · ${HELP_FACTS.deliveryIT}`, 'A CASA'];

const CALIBRI = [
  { name: 'Lilliput', size: 'Ø 4–6 mm · 75 g', text: 'Il più profumato. Crudo, su carpacci e burrata.', d: 20, jar: 'lilliput' },
  { name: 'Occhio di Pernice', size: 'Ø 7–9 mm · 150 g', text: 'Il più versatile, per l’uso di tutti i giorni.', d: 32, jar: 'occhio', start: true },
  { name: 'Lacrimella', size: 'Ø 9–11 mm · 250 g', text: 'Carnoso, regge la cottura. Sughi e pasta.', d: 44, jar: 'lacrimella' },
  { name: 'Capperone', size: 'Ø 12–15 mm · 250 g', text: 'Aroma intenso, per sughi lunghi e pesce.', d: 60, jar: 'capperone' },
];

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
    <div className={h.page}>
      <Crumbs items={[{ name: 'Centro assistenza', path: '/assistenza' }, { name: 'Il primo ordine', path: '/assistenza/primo-ordine' }]} />

      <section className={`${h.split} ${h.border}`}>
        <div className={h.splitText}>
          <span className={h.mono}>03 — NON HO ANCORA ORDINATO</span>
          <h1 className={h.h1}>Il tuo primo ordine, dal carrello alla dispensa</h1>
          <p className={h.lead} style={{ maxWidth: 480 }}>Sei passaggi, cosa succede in ognuno e cosa puoi fare tu. Non serve registrarsi: basta un’email.</p>
          <div className={h.actions} style={{ gap: 8 }}>
            <span className={h.pill}>Gratis da €{HELP_FACTS.freeShippingFrom}</span>
            <span className={h.pill}>Parte in {HELP_FACTS.prepDays}</span>
            <span className={h.pill}>Nessun account</span>
          </div>
        </div>
        <div className={h.splitMedia} style={{ minHeight: 540 }}><JarsPanel jars={['lilliput', 'occhio', 'aceto']} /></div>
      </section>

      <section className={h.section} style={{ paddingBottom: 24 }}>
        <div className={h.sectionHeadText}>
          <span className={h.mono}>• PASSO PER PASSO</span>
          <h2 className={h.h2}>Cosa succede dopo che clicchi “Paga”</h2>
        </div>
        <ol className={h.ruleGrid} style={{ '--cols': 3, borderBottom: 'none' }}>
          {STEPS.map((st, i) => (
            <li key={st.title} className={h.ruleCell} style={{ minHeight: 280, padding: '30px 26px', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                <span className={h.bigNum} style={{ color: 'var(--color-red)' }}>{pad(i + 1)}</span>
                <span className={h.monoMuted} style={{ fontSize: 12, textAlign: 'right' }}>{WHO[i]}</span>
              </span>
              <span className={h.cellTitle} style={{ fontSize: 27 }}>{st.title}</span>
              <span className={h.monoMuted}>{st.text}</span>
              <Link to={st.link.to} className={h.link} style={{ marginTop: 'auto', fontSize: 14 }}>{st.link.label} →</Link>
            </li>
          ))}
        </ol>
      </section>

      <section className={h.section}>
        <div className={h.sectionHead}>
          <div className={h.sectionHeadText}>
            <span className={h.mono}>• NON SAI DA DOVE PARTIRE?</span>
            <h2 className={h.h2}>Quattro calibri, un carattere ciascuno</h2>
          </div>
          <Link to="/guide/quale-calibro-scegliere" className={h.link}>Guida ai calibri →</Link>
        </div>
        <div className={h.ruleGrid} style={{ '--cols': 4 }}>
          {CALIBRI.map((c) => (
            <div key={c.name} className={`${h.ruleCell} ${c.start ? h.calDark : ''}`} style={{ padding: '28px 22px' }}>
              <span style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span className={h.dot} style={{ width: c.d, height: c.d, background: c.start ? '#C8D4B8' : undefined }} aria-hidden="true" />
                {c.start && <span className={h.pill} style={{ color: 'var(--color-light)', borderColor: 'rgba(252,243,223,.7)', fontSize: 12, minHeight: 0, padding: '3px 10px' }}>Si parte da qui</span>}
              </span>
              <span className={h.cellTitleItalic} style={{ fontSize: 30 }}>{c.name}</span>
              <span className={h.mono}>{c.size}</span>
              <span className={h.monoMuted}>{c.text}</span>
              <img src={JARS[c.jar].src} alt={JARS[c.jar].alt} loading="lazy" width="400" height="400" style={{ width: '100%', maxWidth: 200, alignSelf: 'center', background: '#fff', borderRadius: 14, marginTop: 8 }} />
            </div>
          ))}
        </div>
      </section>

      <Band words={['Scegli', 'Paga', 'Conferma', 'Racale', 'In viaggio', 'In dispensa']} />

      <section className={h.heroCenter} style={{ borderBottom: 'none', paddingBottom: 80 }}>
        <span className={h.h2} style={{ maxWidth: 820 }}>Tutti i capperi, i cucunci, le foglie e la polvere di Racale.</span>
        <div className={h.actions} style={{ justifyContent: 'center' }}>
          <Link to="/collections/all" className={h.btn}>Vai ai prodotti →</Link>
          <Link to="/assistenza" className={h.btnGhost}>Altre domande</Link>
        </div>
      </section>
    </div>
  );
}
