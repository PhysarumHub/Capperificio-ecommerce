import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { COMPANY } from '../data/company';
import { HELP_FACTS } from '../data/assistenza';
import s, { Crumbs, JarsPanel, pad } from '../components/Help/Help';

const STEPS = [
  { key: 'received', label: 'Ordine ricevuto', note: 'pagamento confermato' },
  { key: 'prepared', label: 'In preparazione a Racale', note: `entro ${HELP_FACTS.prepDays}` },
  { key: 'shipped', label: 'In viaggio', note: 'affidato al corriere' },
  { key: 'delivered', label: 'Consegnato', note: `di solito in ${HELP_FACTS.deliveryIT}` },
];

const STATUS_TITLE = {
  received: 'L’abbiamo ricevuto',
  prepared: 'Lo stiamo preparando',
  shipped: 'È in viaggio verso di te',
  delivered: 'Risulta consegnato',
  cancelled: 'Ordine annullato',
  returned: 'Il pacco è rientrato da noi',
};

const STATUS_TEXT = {
  received: 'Abbiamo ricevuto il tuo ordine: lo prepariamo entro 1–2 giorni lavorativi.',
  prepared: 'Stiamo preparando il tuo pacco. Appena parte ti mandiamo il codice di tracciamento.',
  shipped: 'Il pacco è in viaggio con il corriere. Dal link di tracciamento vedi dove si trova e puoi scegliere un’altra data se non sei in casa.',
  delivered: 'Il pacco risulta consegnato. Buona cucina!',
  cancelled: 'Questo ordine è stato annullato. Se è stato pagato, il rimborso è già partito o partirà a breve.',
  returned: 'Il pacco è rientrato da noi. Scrivici per concordare una nuova spedizione o il rimborso.',
};

const STUCK = [
  { title: 'Non è ancora partito', text: `Prepariamo in ${HELP_FACTS.prepDays}; le Box di Natale partono nella data che hai scelto. Dopo 3 giorni lavorativi, scrivici.` },
  { title: 'Il tracciamento è fermo', text: 'Se non si aggiorna da più di 3 giorni lavorativi, scrivici: apriamo noi la pratica con il corriere.' },
  { title: 'Risulta consegnato, ma non c’è', text: 'Controlla con vicini e portineria, poi scrivici con il numero d’ordine.' },
];

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

export default function OrderStatusPage() {
  useSEO({
    title: 'Dov’è il mio ordine',
    description: 'Segui il tuo ordine del Capperificio di Racale con numero d’ordine ed email: stato e codice di tracciamento, senza account.',
    path: '/assistenza/dove-e-il-mio-ordine',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Centro assistenza', path: '/assistenza' },
      { name: 'Dov’è il mio ordine', path: '/assistenza/dove-e-il-mio-ordine' },
    ],
  });

  const [form, setForm] = useState({ orderNumber: '', email: '' });
  const [state, setState] = useState({ loading: false, error: '', result: null });

  async function onSubmit(e) {
    e.preventDefault();
    setState({ loading: true, error: '', result: null });
    try {
      const res = await fetch('/api/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Ricerca non riuscita. Riprova.');
      setState({ loading: false, error: '', result: data });
    } catch (err) {
      setState({ loading: false, error: err.message, result: null });
    }
  }

  const r = state.result;
  const stepIndex = r ? STEPS.findIndex((st) => st.key === r.status) : -1;

  return (
    <div className={s.page}>
      <Crumbs items={[{ name: 'Centro assistenza', path: '/assistenza' }, { name: 'Dov’è il mio ordine', path: '/assistenza/dove-e-il-mio-ordine' }]} />

      <section className={`${s.split} ${s.border}`}>
        <div className={s.splitText} style={{ justifyContent: 'flex-start', paddingTop: 64 }}>
          <span className={s.mono}>01 — HO GIÀ ORDINATO</span>
          <h1 className={s.h1}>Dov’è il mio ordine?</h1>
          <p className={s.lead} style={{ maxWidth: 480 }}>
            Inserisci il numero d’ordine e l’email che hai usato: ti diciamo a che punto è e, se è partito, ti diamo il tracciamento.
          </p>
          <form className={s.formGrid} onSubmit={onSubmit}>
            <div className={s.field}>
              <label htmlFor="ord-num" className={s.mono}>NUMERO D’ORDINE</label>
              <input
                id="ord-num"
                className={s.input}
                inputMode="numeric"
                placeholder="es. 10042"
                required
                value={form.orderNumber}
                onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
              />
            </div>
            <div className={s.field}>
              <label htmlFor="ord-mail" className={s.mono}>EMAIL DELL’ORDINE</label>
              <input
                id="ord-mail"
                type="email"
                className={s.input}
                placeholder="nome@esempio.it"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <button type="submit" className={s.btn} disabled={state.loading}>
              {state.loading ? 'Cerco…' : 'Cerca l’ordine'}
            </button>
          </form>
          {state.error && <p className={s.error} role="alert">{state.error}</p>}
          <span className={s.monoMuted} style={{ fontSize: 12 }}>
            Il numero d’ordine è nell’email di conferma. Mostriamo solo lo stato e il tracciamento: niente indirizzi né dati di pagamento.
          </span>
        </div>
        <div className={s.splitMedia}><JarsPanel jars={['lilliput', 'occhio', 'capperone']} /></div>
      </section>

      {r && (
        <section className={`${s.section} ${s.border}`} aria-live="polite">
          <div className={s.sectionHead}>
            <div className={s.sectionHeadText}>
              <span className={s.kicker}>Ordine #{r.orderNumber}{r.orderDate ? ` · ${fmtDate(r.orderDate)}` : ''}</span>
              <h2 className={s.h2}>{STATUS_TITLE[r.status] || 'Il tuo ordine'}</h2>
            </div>
            {r.tracking?.url && (
              <a href={r.tracking.url} target="_blank" rel="noopener noreferrer" className={s.btn}>Segui il pacco →</a>
            )}
          </div>

          {stepIndex >= 0 && (
            <ol className={`${s.ruleGrid} ${s.timeline}`} style={{ '--cols': 4 }}>
              {STEPS.map((st, i) => {
                const cls = i < stepIndex ? s.stepDone : i === stepIndex ? s.stepNow : s.stepTodo;
                return (
                  <li key={st.key} className={`${s.ruleCell} ${cls}`} aria-current={i === stepIndex ? 'step' : undefined}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={s.stepDot} aria-hidden="true">{i < stepIndex ? '✓' : i === stepIndex ? '•' : ''}</span>
                      <span className={s.mono} style={{ color: 'inherit' }}>{pad(i + 1)}</span>
                    </span>
                    <span className={s.cellTitleItalic} style={{ fontSize: 28 }}>{st.label}</span>
                    <span className={s.monoMuted} style={{ fontSize: 12, color: 'inherit', opacity: .85 }}>{st.note}</span>
                  </li>
                );
              })}
            </ol>
          )}

          <p className={s.lead} style={{ maxWidth: 680, color: '#4E6B4E', fontSize: 17 }}>{STATUS_TEXT[r.status]}</p>
          {r.tracking && (
            <p className={s.monoMuted}>
              Corriere: {r.tracking.carrier || '—'} · Codice di tracciamento: {r.tracking.number}
            </p>
          )}
        </section>
      )}

      <section className={s.section}>
        <div className={s.sectionHeadText}>
          <span className={s.mono}>• SE QUALCOSA NON TORNA</span>
          <h2 className={s.h2}>Il tuo pacco non si muove?</h2>
        </div>
        <div className={s.ruleGrid} style={{ borderBottom: 'none' }}>
          {STUCK.map((x) => (
            <div key={x.title} className={s.ruleCell}>
              <span className={s.cellTitle} style={{ fontSize: 24 }}>{x.title}</span>
              <span className={s.monoMuted}>{x.text}</span>
            </div>
          ))}
        </div>
        <Link to="/assistenza/qualcosa-non-va" className={s.link}>Apri il percorso “Qualcosa non va” →</Link>
      </section>

      <section className={s.cta}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className={s.kicker}>Non trovi l’ordine?</span>
          <span className={s.ctaTitle}>Scrivici: lo cerchiamo noi.</span>
        </div>
        <a href={COMPANY.whatsappLink} target="_blank" rel="noopener noreferrer" className={s.btnLight}>Scrivici su WhatsApp →</a>
      </section>
    </div>
  );
}
