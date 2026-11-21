import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { COMPANY } from '../../data/company';
import { gtmEvent } from '../../lib/utils/gtm';
import styles from './WhatsAppWidget.module.css';

/*
 * Pulsante WhatsApp fisso + pannello di avvio conversazione.
 *
 * Scelte:
 * - Nessuna apertura automatica né notifiche finte: si apre solo al click.
 * - Il pannello non è modale (la pagina resta usabile): Esc, click fuori e
 *   la X lo chiudono; il focus va al primo argomento e torna al pulsante.
 * - Gli argomenti precompilano il messaggio, con il prodotto o la pagina da
 *   cui si scrive: meno passaggi per il cliente, contesto immediato per noi.
 * - wa.me apre l'app su mobile e WhatsApp Web/Desktop su computer.
 * - Nascosto dove distrae (carrello, checkout); più in alto dove c'è la barra
 *   fissa di acquisto su mobile (scheda prodotto, Box di Natale).
 * - Evento GTM "whatsapp_click" con l'argomento scelto.
 */

const HIDDEN_ON = [/^\/cart/, /^\/checkout/, /^\/sample-box\/checkout/];
const RAISED_ON = [/^\/prodotti\//, /^\/box-di-natale/];

function pageContext(pathname) {
  if (pathname.startsWith('/prodotti/')) {
    const name = document.querySelector('h1')?.textContent?.trim();
    return name ? { kind: 'product', label: name } : null;
  }
  return null;
}

function buildTopics(ctx) {
  const product = ctx?.kind === 'product' ? ctx.label : null;
  return [
    product
      ? { id: 'product', label: `Domanda su ${product}`, text: `Ciao! Ho una domanda su ${product}: ` }
      : { id: 'product', label: 'Consiglio su un prodotto', text: 'Ciao! Vorrei un consiglio su quali capperi scegliere: ' },
    { id: 'order', label: 'Il mio ordine', text: 'Ciao! Vi scrivo per il mio ordine n. ' },
    { id: 'gift', label: 'Regali e Box di Natale', text: 'Ciao! Vorrei informazioni sulla Box di Natale: ' },
    { id: 'b2b', label: 'Ristorante o negozio', text: 'Ciao! Ho un ristorante/negozio e vorrei informazioni sui prezzi all’ingrosso. ' },
  ];
}

const waUrl = (text) => `${COMPANY.whatsappLink}?text=${encodeURIComponent(text)}`;

function WaIcon({ size = 28 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M16.04 3C8.86 3 3.03 8.82 3.03 16c0 2.3.6 4.53 1.74 6.5L3 29l6.68-1.75A12.95 12.95 0 0 0 16.04 29C23.2 29 29 23.18 29 16S23.2 3 16.04 3Zm0 23.62c-1.98 0-3.92-.53-5.61-1.54l-.4-.24-3.96 1.04 1.06-3.86-.26-.4A10.6 10.6 0 0 1 5.4 16c0-5.86 4.77-10.62 10.64-10.62 5.86 0 10.6 4.76 10.6 10.62 0 5.86-4.76 10.62-10.6 10.62Zm5.83-7.95c-.32-.16-1.89-.93-2.18-1.04-.3-.1-.5-.16-.72.16-.21.32-.82 1.04-1.01 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.21-.19-.32-.02-.5.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.53-.72-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66 0 1.57 1.14 3.08 1.3 3.3.16.2 2.25 3.43 5.44 4.81.76.33 1.35.52 1.81.67.76.24 1.46.2 2.01.12.61-.09 1.89-.77 2.15-1.52.27-.74.27-1.38.19-1.51-.08-.14-.29-.22-.61-.38Z"
      />
    </svg>
  );
}

export default function WhatsAppWidget() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [topics, setTopics] = useState(() => buildTopics(null));
  const [message, setMessage] = useState('');
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Cambio pagina → chiudi senza rubare il focus
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const onPointer = (e) => {
      if (!panelRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) close(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    panelRef.current?.querySelector(`.${styles.topic}`)?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, close]);

  if (HIDDEN_ON.some((re) => re.test(pathname))) return null;
  const raised = RAISED_ON.some((re) => re.test(pathname));

  function toggle() {
    if (!open) {
      setTopics(buildTopics(pageContext(pathname)));
      gtmEvent('whatsapp_open', { page_path: pathname });
    }
    setOpen((v) => !v);
  }

  function track(topic) {
    gtmEvent('whatsapp_click', { whatsapp_topic: topic, page_path: pathname });
  }

  const freeText = message.trim()
    ? `${message.trim()}\n\n(Scrivo da ${window.location.origin}${pathname})`
    : '';

  return (
    <div className={`${styles.root} ${raised ? styles.raised : ''}`}>
      {open && (
        <div
          ref={panelRef}
          id="wa-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="wa-title"
          className={styles.panel}
        >
          <div className={styles.head}>
            <img src="/images/email/logo.png" alt="" width="40" height="40" className={styles.avatar} />
            <div className={styles.headText}>
              <p id="wa-title" className={styles.title}>Capperificio Caro</p>
              <p className={styles.sub}>Ti risponde una persona del capperificio, da Racale.</p>
            </div>
            <button type="button" className={styles.close} onClick={() => close()} aria-label="Chiudi">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          <div className={styles.body}>
            <p className={styles.bubble}>
              Ciao! Scegli un argomento: ti apriamo WhatsApp con il messaggio già pronto.
            </p>

            <ul className={styles.topics}>
              {topics.map((t) => (
                <li key={t.id}>
                  <a
                    href={waUrl(t.text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.topic}
                    onClick={() => track(t.id)}
                  >
                    {t.label}
                    <span aria-hidden="true">→</span>
                  </a>
                </li>
              ))}
            </ul>

          </div>

          <form
            className={styles.compose}
            onSubmit={(e) => {
              e.preventDefault();
              if (!freeText) return;
              track('free');
              window.open(waUrl(freeText), '_blank', 'noopener,noreferrer');
            }}
          >
            <label htmlFor="wa-message" className="sr-only">Scrivi il tuo messaggio</label>
            <textarea
              id="wa-message"
              rows={2}
              maxLength={500}
              placeholder="Oppure scrivi qui la tua domanda…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form.requestSubmit(); }
              }}
              className={styles.textarea}
            />
            <button type="submit" className={styles.send} disabled={!freeText} aria-label="Invia su WhatsApp">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg>
            </button>
          </form>

          <p className={styles.foot}>
            Preferisci leggere? <Link to="/assistenza" onClick={() => close(false)}>Centro assistenza</Link>
            {' · '}
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          </p>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        className={styles.fab}
        onClick={toggle}
        aria-expanded={open}
        aria-controls="wa-panel"
        aria-label={open ? 'Chiudi la chat WhatsApp' : 'Scrivici su WhatsApp'}
      >
        <WaIcon />
        <span className={styles.fabLabel}>Scrivici</span>
      </button>
    </div>
  );
}
