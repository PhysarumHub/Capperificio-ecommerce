import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { COMPANY } from '../data/company';
import contentStyles from './ContentPage.module.css';
import styles from './FAQPage.module.css';

const GROUPS = [
  {
    id: 'ordini',
    label: 'Ordini e pagamenti',
    items: [
      {
        id: 'pagamenti',
        q: 'Quali metodi di pagamento accettate?',
        a: (
          <p>
            Carte di credito e debito (Visa, Mastercard, American Express) e wallet digitali
            (Apple Pay, Google Pay) tramite Stripe. I dati della carta viaggiano
            cifrati direttamente al fornitore di pagamento e non sono mai memorizzati sui nostri
            server. Dettagli completi nelle{' '}
            <Link to="/termini-e-condizioni#pagamenti">Condizioni Generali di Vendita</Link>.
          </p>
        ),
      },
      {
        id: 'fattura',
        q: 'Posso richiedere fattura?',
        a: (
          <p>
            Sì: indica Partita IVA, Codice Fiscale e codice destinatario SDI (o PEC) in fase di
            checkout. La richiesta va fatta prima di confermare l'ordine — non può essere accolta
            dopo l'emissione del documento fiscale.
          </p>
        ),
      },
    ],
  },
  {
    id: 'spedizioni',
    label: 'Spedizioni e resi',
    items: [
      {
        id: 'spedizione',
        q: 'Quanto tempo impiega la spedizione e quanto costa?',
        a: (
          <>
            <p>
              Prepariamo l'ordine entro 1–2 giorni lavorativi dalla conferma del pagamento. La
              consegna avviene indicativamente entro 2–5 giorni lavorativi in Italia e 5–10
              giorni lavorativi per l'estero.
            </p>
            <p>
              La spedizione è <strong>gratuita per ordini da € 50 in su</strong> verso l'Italia;
              sotto questa soglia il costo è calcolato in base a peso e destinazione e mostrato
              nel carrello prima del pagamento. Dettagli completi nelle{' '}
              <Link to="/termini-e-condizioni#spedizioni">Condizioni Generali di Vendita</Link>.
            </p>
          </>
        ),
      },
      {
        id: 'reso',
        q: 'Posso restituire un prodotto?',
        a: (
          <>
            <p>
              Hai 14 giorni di tempo dalla ricezione per esercitare il diritto di recesso,
              scrivendo a <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> con numero
              d'ordine e prodotti interessati.
            </p>
            <p>
              <strong>Attenzione:</strong> trattandosi di prodotti alimentari, il recesso non è
              esercitabile su confezioni la cui apertura o il cui sigillo di protezione igienica
              risultino compromessi. Dettagli completi nelle{' '}
              <Link to="/termini-e-condizioni#recesso">Condizioni Generali di Vendita</Link>.
            </p>
          </>
        ),
      },
      {
        id: 'garanzia',
        q: 'Un prodotto è arrivato danneggiato o difettoso: cosa faccio?',
        a: (
          <p>
            Tutti i prodotti sono coperti dalla garanzia legale di conformità (2 anni dalla
            consegna). Scrivi a <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> entro 2
            mesi dalla scoperta del difetto, allegando numero d'ordine e una foto del prodotto e
            del lotto riportato in etichetta. Dettagli completi nelle{' '}
            <Link to="/termini-e-condizioni#garanzia">Condizioni Generali di Vendita</Link>.
          </p>
        ),
      },
    ],
  },
  {
    id: 'prodotto',
    label: 'Prodotto e assistenza',
    items: [
      {
        id: 'ingredienti',
        q: 'Dove trovo ingredienti, allergeni e conservazione?',
        a: (
          <p>
            Denominazione, ingredienti, allergeni, quantità netta, termine minimo di
            conservazione e modalità di conservazione sono riportati nella scheda di ogni
            prodotto e sull'etichetta del prodotto ricevuto. In caso di differenze fa sempre fede
            quanto scritto in etichetta.
          </p>
        ),
      },
      {
        id: 'b2b',
        q: 'Vendete anche a ristoranti, negozi o grossisti?',
        a: (
          <p>
            Sì, abbiamo un'<Link to="/b2b">Area B2B</Link> dedicata con prezzi netti e formati
            industriali, riservata a soggetti titolari di Partita IVA. Per informazioni scrivi a{' '}
            <a href={`mailto:${COMPANY.emailB2B}`}>{COMPANY.emailB2B}</a>.
          </p>
        ),
      },
    ],
  },
];

function AccordionItem({ id, q, a, isOpen, onToggle }) {
  return (
    <div id={id} className={`${styles.item} ${isOpen ? styles.open : ''}`}>
      <button
        type="button"
        className={styles.trigger}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
      >
        <span className={styles.triggerText}>{q}</span>
        <span className={styles.iconWrap} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>
      <div className={styles.panel} id={`${id}-panel`} role="region">
        <div className={styles.panelInner}>
          <div className={styles.panelContent}>{a}</div>
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  useSEO({
    title: 'Domande frequenti',
    description: `Spedizioni, resi, pagamenti e garanzia: le risposte alle domande più comuni su ${COMPANY.brand}.`,
    path: '/faq',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'FAQ', path: '/faq' },
    ],
  });

  const [openId, setOpenId] = useState(GROUPS[0].items[0].id);

  const toggle = (id) => setOpenId((current) => (current === id ? null : id));

  return (
    <div className={contentStyles.page}>
      <header className={contentStyles.hero}>
        <div className={contentStyles.heroInner}>
          <span className={contentStyles.tag}>
            <span className={contentStyles.tagDot} />
            Domande frequenti
          </span>
          <h1 className={contentStyles.title}>Le domande che ci fate più spesso</h1>
          <p className={contentStyles.intro}>
            Ordini, spedizioni, resi e pagamenti — le risposte rapide prima di scriverci.
          </p>
        </div>
      </header>

      <div className={contentStyles.body}>
        <div className={styles.groups}>
          {GROUPS.map((group) => (
            <div key={group.id}>
              <p className={styles.groupLabel}>
                <span className={styles.groupLabelDot} />
                {group.label}
              </p>
              <div className={styles.list}>
                {group.items.map((item) => (
                  <AccordionItem
                    key={item.id}
                    {...item}
                    isOpen={openId === item.id}
                    onToggle={() => toggle(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.cta}>
          <p className={styles.ctaTitle}>Non hai trovato la risposta che cercavi?</p>
          <Link to="/contatti" className={styles.ctaBtn}>Scrivici &rarr;</Link>
        </div>
      </div>
    </div>
  );
}
