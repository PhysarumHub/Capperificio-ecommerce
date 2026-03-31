import { useState, useEffect, useCallback } from 'react';
import styles from './CookieConsent.module.css';

const STORAGE_KEY = 'capperificio_consent';

/* ── localStorage helpers ─────────────────────────────── */
function getConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setConsent(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/* ── Purge tracking cookies ───────────────────────────── */
function purgeTrackingCookies() {
  const names = ['_ga', '_gid', '_gat', '_fbp', '_fbc'];
  const domains = [window.location.hostname, '.' + window.location.hostname];

  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim();
    if (names.includes(name) || name.startsWith('_ga_')) {
      domains.forEach((d) => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${d}`;
      });
    }
  });
}

/* ── Google Consent Mode v2 update ────────────────────── */
function updateConsentSignals(prefs) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', {
    analytics_storage:       prefs.analytics ? 'granted' : 'denied',
    ad_storage:              prefs.marketing ? 'granted' : 'denied',
    ad_user_data:            prefs.marketing ? 'granted' : 'denied',
    ad_personalization:      prefs.marketing ? 'granted' : 'denied',
    personalization_storage: prefs.marketing ? 'granted' : 'denied',
    functionality_storage:   'granted',
    security_storage:        'granted',
  });
}

/* ── Component ────────────────────────────────────────── */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  /* Init: show banner only on first visit */
  useEffect(() => {
    const prefs = getConsent();
    if (prefs) {
      if (!prefs.analytics && !prefs.marketing) purgeTrackingCookies();
    } else {
      purgeTrackingCookies();
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  /* Save logic */
  const save = useCallback((prefs) => {
    setConsent(prefs);
    updateConsentSignals(prefs);
    if (!prefs.analytics && !prefs.marketing) purgeTrackingCookies();
    document.dispatchEvent(new CustomEvent('capperificio:consent', { detail: prefs }));
    setVisible(false);
    setModalOpen(false);
  }, []);

  const handleAccept = () => save({ necessary: true, analytics: true, marketing: true });
  const handleReject = () => save({ necessary: true, analytics: false, marketing: false });
  const handleSavePrefs = () => save({ necessary: true, analytics, marketing });

  const openSettings = useCallback(() => {
    const prefs = getConsent();
    if (prefs) {
      setAnalytics(prefs.analytics);
      setMarketing(prefs.marketing);
    }
    setModalOpen(true);
  }, []);

  /* Expose openSettings globally */
  useEffect(() => {
    window.CapperificioConsent = { openSettings };
    return () => { delete window.CapperificioConsent; };
  }, [openSettings]);

  return (
    <>
      {/* ── Banner ──────────────────────────────────────── */}
      <div className={`${styles.banner} ${visible ? styles.bannerVisible : ''}`} role="dialog" aria-label="Gestione cookie">
        <div className={styles.bannerInner}>
          <p className={styles.bannerText}>
            Utilizziamo cookie per migliorare la tua esperienza sul sito e per finalità analitiche e di marketing.{' '}
            <a href="/cookie-policy" className={styles.bannerLink}>Scopri di più</a>
          </p>
          <div className={styles.bannerActions}>
            <button className={`${styles.btn} ${styles.btnAccept}`} onClick={handleAccept}>
              Accetta tutto
            </button>
            <button className={`${styles.btn} ${styles.btnReject}`} onClick={handleReject}>
              Rifiuta
            </button>
            <button className={`${styles.btn} ${styles.btnSettings}`} onClick={openSettings}>
              Personalizza
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal overlay ───────────────────────────────── */}
      <div
        className={`${styles.overlay} ${modalOpen ? styles.overlayOpen : ''}`}
        onClick={() => setModalOpen(false)}
        aria-hidden={!modalOpen}
      >
        <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Preferenze cookie">
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Preferenze cookie</h2>
            <button className={styles.modalClose} onClick={() => setModalOpen(false)} aria-label="Chiudi">
              ✕
            </button>
          </div>

          <p className={styles.modalDesc}>
            Scegli quali categorie di cookie accettare. I cookie necessari sono sempre attivi perché indispensabili al funzionamento del sito.
          </p>

          {/* Necessari */}
          <div className={styles.group}>
            <div className={styles.groupHead}>
              <div>
                <span className={styles.groupLabel}>Necessari</span>
                <span className={styles.groupTag}>Sempre attivi</span>
              </div>
              <label className={styles.toggle}>
                <input type="checkbox" checked disabled />
                <span className={`${styles.track} ${styles.trackDisabled}`} />
              </label>
            </div>
            <p className={styles.groupDesc}>
              Cookie essenziali per la navigazione e il funzionamento del sito. Non possono essere disattivati.
            </p>
          </div>

          {/* Analitici */}
          <div className={styles.group}>
            <div className={styles.groupHead}>
              <div>
                <span className={styles.groupLabel}>Analitici</span>
              </div>
              <label className={styles.toggle}>
                <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
                <span className={styles.track} />
              </label>
            </div>
            <p className={styles.groupDesc}>
              Ci aiutano a capire come utilizzi il sito, in modo da poterlo migliorare.
            </p>
          </div>

          {/* Marketing */}
          <div className={styles.group}>
            <div className={styles.groupHead}>
              <div>
                <span className={styles.groupLabel}>Marketing</span>
              </div>
              <label className={styles.toggle}>
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
                <span className={styles.track} />
              </label>
            </div>
            <p className={styles.groupDesc}>
              Utilizzati per mostrarti annunci pertinenti e misurare l'efficacia delle campagne.
            </p>
          </div>

          <button className={styles.modalSave} onClick={handleSavePrefs}>
            Salva preferenze
          </button>
        </div>
      </div>
    </>
  );
}
