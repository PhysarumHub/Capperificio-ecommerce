import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { COMPANY } from '../data/company';
import { HELP_FACTS as F } from '../data/assistenza';
import s, { Crumbs, pad } from '../components/Help/Help';

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

function Head({ i }) {
  return (
    <>
      <span className={s.mono}>{pad(i + 1)}</span>
      <h2 className={s.h3} style={{ fontSize: 40 }}>{SECTIONS[i].title}</h2>
    </>
  );
}

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

  const stats = [
    { k: 'GRATUITA IN ITALIA', v: `da €${F.freeShippingFrom}` },
    { k: 'CONSEGNA IN ITALIA', v: '2–5 gg' },
    { k: 'RECESSO', v: `${F.withdrawalDays} gg` },
    { k: 'GARANZIA LEGALE', v: `${F.warrantyYears} anni` },
  ];

  return (
    <div className={s.page}>
      <Crumbs items={[{ name: 'Centro assistenza', path: '/assistenza' }, { name: 'Spedizioni e resi', path: '/spedizioni-e-resi' }]} />

      <section className={s.section} style={{ paddingTop: 64, paddingBottom: 0 }}>
        <div className={s.head} style={{ maxWidth: 820 }}>
          <span className={s.kicker}>Aggiornamento: {UPDATED}</span>
          <h1 className={s.h1} style={{ fontSize: 'clamp(52px, 7vw, 92px)' }}>Spedizioni e resi</h1>
          <p className={s.lead} style={{ fontSize: 19, maxWidth: 760 }}>
            Dove spediamo, quanto costa, quanto ci mette e come funzionano resi e garanzia. Le regole complete sono nelle{' '}
            <Link to="/termini-e-condizioni" className={s.link} style={{ fontSize: 'inherit' }}>Condizioni generali di vendita</Link>.
          </p>
        </div>
        <div className={s.ruleGrid} style={{ '--cols': 4 }}>
          {stats.map((st) => (
            <div key={st.k} className={s.ruleCell}>
              <span className={s.mono}>{st.k}</span>
              <span className={s.bigNum}>{st.v}</span>
            </div>
          ))}
        </div>
      </section>

      <div className={s.shell} style={{ alignItems: 'flex-start' }}>
        <aside className={s.left} style={{ borderRight: 'none', paddingLeft: 40 }}>
          <span className={s.kicker}>In questa pagina</span>
          <ol className={s.nav}>
            {SECTIONS.map((sec, i) => (
              <li key={sec.id}><a href={`#${sec.id}`}><span>{pad(i + 1)}</span>{sec.title}</a></li>
            ))}
          </ol>
        </aside>

        <article className={s.center} style={{ maxWidth: 900, gap: 52 }}>
          <section id="dove" className={s.policy}>
            <Head i={0} />
            <p>
              Spediamo in tutta Italia e in gran parte dei Paesi dell’Unione Europea. Al checkout, inserendo l’indirizzo,
              vedi subito se la destinazione è servita. Per altri Paesi scrivici prima di ordinare a <Mail />.
            </p>
          </section>

          <section id="costi" className={s.policy}>
            <Head i={1} />
            <div className={`${s.ruleGrid} ${s.stack}`}>
              <div className={s.ruleCell}>
                <span className={s.cellTitle}>Italia</span>
                <span className={s.monoMuted}>Gratuita per ordini da €{F.freeShippingFrom}. Sotto, il costo dipende da peso e destinazione e lo vedi nel carrello prima di pagare.</span>
              </div>
              <div className={s.ruleCell}>
                <span className={s.cellTitle}>Estero</span>
                <span className={s.monoMuted}>Calcolato al checkout in base al Paese e al peso del pacco.</span>
              </div>
              <div className={s.ruleCell}>
                <span className={s.cellTitle}>Box di Natale</span>
                <span className={s.monoMuted}>
                  Costo e date disponibili nel <Link to="/box-di-natale" className={s.link} style={{ fontSize: 'inherit' }}>configuratore</Link>. Puoi spedirla direttamente a chi la riceve.
                </span>
              </div>
            </div>
          </section>

          <section id="tempi" className={s.policy}>
            <Head i={2} />
            <div className={s.timebar}>
              <span>PREPARAZIONE · {F.prepDays}</span>
              <span>CORRIERE · {F.deliveryIT} in Italia · {F.deliveryEU} all’estero</span>
            </div>
            <p>
              I tempi sono indicativi: possono allungarsi nei periodi di picco, per cause del corriere o per maltempo.
              In ogni caso la consegna avviene entro 30 giorni dalla conclusione del contratto.
            </p>
            <div className={s.softBox}>
              <span className={s.mono}>PER NATALE</span>
              <span>Per le Box di Natale fa fede la data di spedizione scelta nel configuratore. Per gli altri prodotti consigliamo di ordinare entro metà dicembre.</span>
            </div>
          </section>

          <section id="tracciamento" className={s.policy}>
            <Head i={3} />
            <p>
              Quando il pacco parte ricevi un’email con corriere e codice di tracciamento. Puoi controllare lo stato anche da{' '}
              <Link to="/assistenza/dove-e-il-mio-ordine">Dov’è il mio ordine</Link>, con numero d’ordine ed email, senza account.
            </p>
          </section>

          <section id="problemi" className={s.policy}>
            <Head i={4} />
            <div className={`${s.ruleGrid} ${s.stack}`} style={{ '--cols': 2, borderBottom: 'none' }}>
              <div className={s.ruleCell}>
                <span className={s.cellTitle}>Se non sei in casa</span>
                <span style={{ fontSize: 16, lineHeight: 1.7, color: '#4E6B4E' }}>
                  Il corriere lascia un avviso e ritenta la consegna o deposita il pacco in un punto di ritiro. Se non viene ritirato
                  entro i termini di giacenza torna a noi: le spese di rientro e di nuova spedizione restano a carico del cliente.
                </span>
              </div>
              <div className={s.ruleCell}>
                <span className={s.cellTitle}>Pacco danneggiato</span>
                <span style={{ fontSize: 16, lineHeight: 1.7, color: '#4E6B4E' }}>
                  Se l’imballo è danneggiato firma con la dicitura “accetto con riserva di controllo”, fotografa pacco e prodotti e
                  scrivici entro {F.damageReportDays} giorni su WhatsApp ({COMPANY.whatsapp}) o a <Mail to={COMPANY.emailOrders} />.
                  Rispediamo o rimborsiamo, senza costi per te.
                </span>
              </div>
            </div>
          </section>

          <section id="recesso" className={s.policy}>
            <Head i={5} />
            <p>Se sei un consumatore puoi recedere entro <strong>{F.withdrawalDays} giorni dalla consegna</strong>, senza indicare il motivo.</p>
            <ol className={`${s.ruleGrid} ${s.stack}`}>
              {[
                <>Scrivi a <Mail /> entro {F.withdrawalDays} giorni dalla consegna con nome, numero d’ordine e prodotti da restituire: ti confermiamo la ricezione e l’indirizzo per il reso.</>,
                <>Entro {F.withdrawalDays} giorni dalla comunicazione rispedisci i prodotti, integri e con la confezione originale sigillata.</>,
                <>Rimborsiamo entro {F.withdrawalDays} giorni con lo stesso metodo di pagamento, anche le spese di consegna standard, appena riceviamo i prodotti o la prova della spedizione.</>,
              ].map((t, i) => (
                <li key={i} className={s.ruleCell}>
                  <span className={s.bigNum} style={{ fontSize: 40, color: 'var(--color-red)' }}>{pad(i + 1)}</span>
                  <span className={s.monoMuted}>{t}</span>
                </li>
              ))}
            </ol>
            <p>Le spese dirette di restituzione sono a carico del cliente. Se il prodotto è difettoso, danneggiato o diverso da quello ordinato, le paghiamo noi.</p>
            <div className={s.greenBox}>
              <span className={s.kicker}>Prodotti alimentari</span>
              <span>Il recesso è escluso per le confezioni aperte o con il sigillo compromesso, e per i prodotti che rischiano di deteriorarsi rapidamente (art. 59 del Codice del Consumo).</span>
            </div>
          </section>

          <section id="difetti" className={s.policy}>
            <Head i={6} />
            <p>
              Tutti i prodotti hanno la garanzia legale di conformità di {F.warrantyYears} anni dalla consegna. Segnala il difetto
              entro {F.defectReportMonths} mesi dalla scoperta a <Mail />, con numero d’ordine e foto del prodotto e del lotto in
              etichetta: sostituiamo o rimborsiamo. La garanzia non copre i difetti dovuti a conservazione diversa da quella
              indicata in etichetta o al superamento del termine minimo di conservazione.
            </p>
          </section>

          <section id="contatti" className={s.policy}>
            <Head i={7} />
            <div className={`${s.ruleGrid} ${s.stack}`}>
              <a href={COMPANY.whatsappLink} target="_blank" rel="noopener noreferrer" className={s.ruleCell}>
                <span className={s.mono}>WHATSAPP</span><span className={s.cellTitle} style={{ fontSize: 20 }}>{COMPANY.whatsapp}</span>
              </a>
              <a href={`mailto:${COMPANY.emailOrders}`} className={s.ruleCell}>
                <span className={s.mono}>ORDINI</span><span className={s.cellTitle} style={{ fontSize: 20 }}>{COMPANY.emailOrders}</span>
              </a>
              <a href={`mailto:${COMPANY.email}`} className={s.ruleCell}>
                <span className={s.mono}>INFORMAZIONI</span><span className={s.cellTitle} style={{ fontSize: 20 }}>{COMPANY.email}</span>
              </a>
            </div>
            <span className={s.monoMuted} style={{ fontSize: 12 }}>
              {COMPANY.legalNameShort} — {COMPANY.addressLine} — P.IVA {COMPANY.vat}. Regole complete nelle{' '}
              <Link to="/termini-e-condizioni">Condizioni generali di vendita</Link>.
            </span>
          </section>
        </article>
      </div>

      <section className={s.cta}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className={s.kicker}>Hai un problema con un ordine?</span>
          <span className={s.ctaTitle}>Ti diciamo cosa fare in due domande.</span>
        </div>
        <Link to="/assistenza/qualcosa-non-va" className={s.btnLight}>Qualcosa non va →</Link>
      </section>
    </div>
  );
}
