import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { getHelpArticle, helpArticlePath } from '../data/assistenza';
import { HelpCta, HelpHero, HelpTabs, Chevron } from '../components/Assistenza/HelpParts';
import styles from '../components/Assistenza/Assistenza.module.css';

const STEPS = [
  { key: 'received', label: 'Ordine ricevuto' },
  { key: 'prepared', label: 'In preparazione a Racale' },
  { key: 'shipped', label: 'In viaggio' },
  { key: 'delivered', label: 'Consegnato' },
];

const STATUS_TEXT = {
  received: 'Abbiamo ricevuto il tuo ordine: lo prepariamo entro 1–2 giorni lavorativi.',
  prepared: 'Stiamo preparando il tuo pacco. Appena parte ti mandiamo il codice di tracciamento.',
  shipped: 'Il pacco è in viaggio con il corriere.',
  delivered: 'Il pacco risulta consegnato. Buona cucina!',
  cancelled: 'Questo ordine è stato annullato. Se è stato pagato, il rimborso è già partito o partirà a breve.',
  returned: 'Il pacco è rientrato da noi. Scrivici per concordare una nuova spedizione o il rimborso.',
};

const RELATED = ['tracciamento', 'modificare-ordine', 'non-ero-in-casa', 'pacco-danneggiato'];

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
  const stepIndex = r ? STEPS.findIndex((s) => s.key === r.status) : -1;

  return (
    <div className={styles.page}>
      <HelpHero
        kicker="Segui il tuo ordine"
        title="Dov’è il mio ordine"
        intro="Non serve un account. Trovi il numero d’ordine nell’email di conferma che ti abbiamo mandato dopo il pagamento."
        crumbs={[
          { name: 'Centro assistenza', path: '/assistenza' },
          { name: 'Dov’è il mio ordine', path: '/assistenza/dove-e-il-mio-ordine' },
        ]}
      />
      <HelpTabs />

      <div className={styles.narrow}>
        <section className={styles.section}>
          <div className={styles.formCard}>
            <form className={styles.form} onSubmit={onSubmit}>
              <div className={styles.formRow}>
                <label className={styles.field}>
                  <span>Numero d’ordine</span>
                  <input
                    className={styles.input}
                    name="orderNumber"
                    inputMode="numeric"
                    placeholder="es. 10042"
                    required
                    value={form.orderNumber}
                    onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                  />
                </label>
                <label className={styles.field}>
                  <span>Email dell’ordine</span>
                  <input
                    className={styles.input}
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </label>
              </div>
              <button type="submit" className={styles.btn} disabled={state.loading}>
                {state.loading ? 'Cerco…' : 'Cerca l’ordine'}
              </button>
              <p className={styles.formNote}>
                Mostriamo solo lo stato dell’ordine e il tracciamento: niente indirizzi né dati di pagamento.
              </p>
              {state.error && <p className={styles.error} role="alert">{state.error}</p>}
            </form>
          </div>

          {r && (
            <div className={styles.section} aria-live="polite">
              <p className={styles.label}><span className={styles.dot} />Ordine #{r.orderNumber} · {fmtDate(r.orderDate)}</p>
              {stepIndex >= 0 && (
                <ol className={styles.tracker}>
                  {STEPS.map((s, i) => (
                    <li
                      key={s.key}
                      className={`${styles.trackStep} ${i <= stepIndex ? styles.trackDone : ''} ${i === stepIndex ? styles.trackCurrent : ''}`}
                      aria-current={i === stepIndex ? 'step' : undefined}
                    >
                      <span className={styles.trackNum}>0{i + 1}</span>
                      {s.label}
                    </li>
                  ))}
                </ol>
              )}
              <div className={styles.rich}>
                <p>{STATUS_TEXT[r.status]}</p>
                {r.tracking && (
                  <p>
                    Corriere: <strong>{r.tracking.carrier || '—'}</strong> · Codice di tracciamento:{' '}
                    <strong>{r.tracking.number}</strong>
                    {r.tracking.url && <> · <a href={r.tracking.url} target="_blank" rel="noopener noreferrer">Segui il pacco</a></>}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Il tuo pacco non si muove?</h2>
          <ul className={styles.qlist}>
            {RELATED.map((slug) => {
              const a = getHelpArticle(slug);
              return (
                <li key={slug}>
                  <Link to={helpArticlePath(a)} className={styles.qlink}>
                    <span className={styles.qtext}>{a.q}</span>
                    <Chevron />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <HelpCta />
    </div>
  );
}
