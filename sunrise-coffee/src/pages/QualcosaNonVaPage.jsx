import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { COMPANY } from '../data/company';
import s, { ContactSplit, Crumbs, HelpRich, pad } from '../components/Help/Help';

/*
 * Percorso guidato: una o due domande, poi una risposta con l'azione giusta.
 * Ogni nodo è { q, options: [{ label, next }] } oppure { answer: { title, body, actions } }.
 */
const TREE = {
  start: {
    q: 'Cosa è successo?',
    options: [
      { label: 'Il pacco non è ancora arrivato', next: 'late' },
      { label: 'Il pacco è arrivato rovinato', next: 'damaged' },
      { label: 'Manca qualcosa o ho ricevuto un prodotto sbagliato', next: 'wrong' },
      { label: 'Un prodotto non mi convince', next: 'quality' },
      { label: 'Ho un problema con il pagamento', next: 'payment' },
      { label: 'Voglio cambiare o annullare l’ordine', next: 'change' },
    ],
  },
  late: {
    q: 'Hai ricevuto l’email con il codice di tracciamento?',
    options: [
      { label: 'Sì, ho il codice', next: 'lateTracked' },
      { label: 'No, non ancora', next: 'lateNoTracking' },
    ],
  },
  lateTracked: {
    answer: {
      title: 'Controlla il tracciamento',
      body: [
        'Dal link nell’email vedi dove si trova il pacco. Se il tracciamento è fermo da più di 3 giorni lavorativi, o risulta consegnato ma non l’hai ricevuto, scrivici: apriamo noi la pratica con il corriere.',
      ],
      actions: [{ to: '/assistenza/dove-e-il-mio-ordine', label: 'Cerca il tuo ordine' }],
    },
  },
  lateNoTracking: {
    answer: {
      title: 'Il pacco potrebbe non essere ancora partito',
      body: [
        'Prepariamo gli ordini entro {prep}: il codice arriva quando il pacco parte. Le Box di Natale partono nella data che hai scelto. Se sono passati più di 3 giorni lavorativi dall’ordine, scrivici con il numero d’ordine.',
      ],
      actions: [{ to: '/assistenza/dove-e-il-mio-ordine', label: 'Cerca il tuo ordine' }],
    },
  },
  damaged: {
    answer: {
      title: 'Fotografa tutto e scrivici entro 7 giorni',
      body: [
        { ol: [
          'Fotografa il pacco, l’imballo interno e i prodotti danneggiati, con l’etichetta del lotto.',
          'Mandaci le foto con il numero d’ordine su WhatsApp ({whatsapp}) o a {emailOrdini}.',
        ] },
        'Ti rispediamo i prodotti o ti rimborsiamo, **senza costi per te**.',
      ],
      whatsapp: true,
    },
  },
  wrong: {
    answer: {
      title: 'Rimediamo noi',
      body: [
        'Scrivici con il numero d’ordine e una foto di quello che hai ricevuto. Se manca un prodotto lo spediamo subito; se è sbagliato ti mandiamo quello giusto e organizziamo noi il ritiro, a spese nostre.',
      ],
      whatsapp: true,
    },
  },
  quality: {
    q: 'La confezione è chiusa o l’hai già aperta?',
    options: [
      { label: 'È ancora chiusa: non la voglio più', next: 'qualityClosed' },
      { label: 'L’ho aperta e qualcosa non va', next: 'qualityOpened' },
    ],
  },
  qualityClosed: {
    answer: {
      title: 'Puoi recedere entro 14 giorni',
      body: [
        'Se la confezione è integra e sigillata puoi recedere entro 14 giorni dalla consegna, senza indicare il motivo: scrivi a {email} con numero d’ordine e prodotti. Le spese del reso sono a tuo carico; rimborsiamo entro 14 giorni.',
      ],
      actions: [{ to: '/assistenza/resi-e-garanzia/come-fare-un-reso', label: 'Come fare un reso' }],
    },
  },
  qualityOpened: {
    answer: {
      title: 'Prima un controllo veloce',
      body: [
        'Sale umido, piccoli cristalli e differenze di colore tra un vasetto e l’altro sono normali: usiamo solo sale marino integrale, senza additivi.',
        'Se invece noti **odore sgradevole, muffa o una confezione gonfia**, non consumare il prodotto e scrivici con una foto del prodotto e del lotto in etichetta: vale la garanzia, lo sostituiamo o ti rimborsiamo.',
      ],
      actions: [{ to: '/assistenza/conservazione-e-uso/sale-umido-cristalli', label: 'Cosa è normale' }],
      whatsapp: true,
    },
  },
  payment: {
    q: 'Ti è stato addebitato l’importo?',
    options: [
      { label: 'Sì, ma non ho ricevuto la conferma', next: 'paymentCharged' },
      { label: 'No, il pagamento non va a buon fine', next: 'paymentFailed' },
    ],
  },
  paymentCharged: {
    answer: {
      title: 'Non riprovare: controlliamo noi',
      body: [
        'Controlla Spam e Promozioni cercando “Capperificio”. Se l’email non c’è, scrivici con il nome e l’email usati: verifichiamo il pagamento e ti mandiamo la conferma. Se risultasse un doppio addebito, lo rimborsiamo.',
      ],
      whatsapp: true,
    },
  },
  paymentFailed: {
    answer: {
      title: 'Prova così',
      body: [
        { ol: [
          'Conferma il pagamento nell’app della tua banca (3D Secure).',
          'Verifica che la carta sia abilitata agli acquisti online.',
          'Prova Apple Pay o Google Pay.',
        ] },
        'Se ancora non funziona, scrivici: possiamo aiutarti a completare l’ordine.',
      ],
      whatsapp: true,
    },
  },
  change: {
    answer: {
      title: 'Scrivici subito',
      body: [
        'Finché il pacco non è partito possiamo cambiare indirizzo o prodotti, oppure annullare l’ordine con rimborso completo. Scrivici con il numero d’ordine: prima ci scrivi, più facile è. Se è già partito, puoi recedere entro 14 giorni dalla consegna.',
      ],
      actions: [{ to: '/assistenza/resi-e-garanzia/come-fare-un-reso', label: 'Come fare un reso' }],
      whatsapp: true,
    },
  },
};

export default function QualcosaNonVaPage() {
  useSEO({
    title: 'Qualcosa non va con il tuo ordine?',
    description: 'Pacco in ritardo o rovinato, prodotto sbagliato, problemi di pagamento: rispondi a due domande e ti diciamo cosa fare.',
    path: '/assistenza/qualcosa-non-va',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Centro assistenza', path: '/assistenza' },
      { name: 'Qualcosa non va', path: '/assistenza/qualcosa-non-va' },
    ],
  });

  const [path, setPath] = useState(['start']);
  const node = TREE[path[path.length - 1]];
  const go = (next) => setPath([...path, next]);
  const back = () => setPath(path.slice(0, -1));

  const stepNow = node.q ? Math.min(path.length - 1, 1) : 2;
  const labels = ['01 · Cosa è successo', '02 · Un dettaglio', '03 · Cosa fare'];

  return (
    <div className={s.page}>
      <Crumbs items={[{ name: 'Centro assistenza', path: '/assistenza' }, { name: 'Qualcosa non va', path: '/assistenza/qualcosa-non-va' }]} />

      <section className={s.heroCenter} style={{ borderBottom: 'none', paddingBottom: 40 }}>
        <span className={s.mono}>02 — C’È UN PROBLEMA</span>
        <h1 className={s.h1}>Qualcosa non va con il tuo ordine?</h1>
        <p className={s.lead}>Rispondi a una o due domande e ti diciamo subito cosa fare. Se preferisci, scrivici direttamente.</p>
      </section>

      <section className={s.wizard} aria-live="polite">
        <div className={s.wizBar} aria-hidden="true">
          {labels.map((l, i) => (
            <span key={l} className={i === stepNow ? s.wizNow : i < stepNow ? s.wizDone : undefined}>{l.toUpperCase()}</span>
          ))}
        </div>
        <div className={s.wizBody}>
          {node.q ? (
            <>
              <h2 className={s.h3} style={{ fontSize: 'clamp(30px, 3.4vw, 44px)' }}>{node.q}</h2>
              <div style={{ borderTop: '1px solid var(--color-border)' }}>
                {node.options.map((o, i) => (
                  <button key={o.next} type="button" className={s.option} onClick={() => go(o.next)}>
                    <span className={s.accNum}>{pad(i + 1)}</span>
                    <span className={s.accQ}>{o.label}</span>
                    <span style={{ fontSize: 20, color: 'var(--color-red)' }} aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <span className={s.kicker}>Ecco cosa fare</span>
              <h2 className={s.h3} style={{ fontSize: 'clamp(30px, 3.4vw, 46px)' }}>{node.answer.title}</h2>
              <HelpRich body={node.answer.body} />
              <div className={s.actions}>
                {node.answer.whatsapp && (
                  <a href={COMPANY.whatsappLink} target="_blank" rel="noopener noreferrer" className={s.btn}>Scrivici su WhatsApp →</a>
                )}
                {node.answer.actions?.map((a) => (
                  <Link key={a.to} to={a.to} className={node.answer.whatsapp ? s.btnGhost : s.btn}>{a.label} →</Link>
                ))}
              </div>
            </>
          )}
          {path.length > 1 && (
            <div style={{ display: 'flex', gap: 20 }}>
              <button type="button" className={s.textBtn} onClick={back}>← Indietro</button>
              <button type="button" className={s.textBtn} style={{ color: '#5F7D5F', fontWeight: 300 }} onClick={() => setPath(['start'])}>Ricomincia</button>
            </div>
          )}
        </div>
      </section>

      <ContactSplit
        kicker="• PREFERISCI SCRIVERCI SUBITO?"
        title="Tieni a portata di mano il numero d’ordine"
        jars={['foglie', 'occhio', 'polvere']}
      />
    </div>
  );
}
