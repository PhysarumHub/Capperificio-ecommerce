import { TOKENS_TOTAL } from '../../data/natalBox';
import styles from './TokenMeter.module.css';

/* Dieci gettoni d'ottone: quelli spesi si accendono, gli altri restano incisi. */
export default function TokenMeter({ used, compact = false }) {
  const left = TOKENS_TOTAL - used;
  return (
    <div className={`${styles.meter} ${compact ? styles.compact : ''}`}>
      <div
        className={styles.track}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={TOKENS_TOTAL}
        aria-valuenow={used}
        aria-label={`Gettoni usati: ${used} su ${TOKENS_TOTAL}`}
      >
        {Array.from({ length: TOKENS_TOTAL }, (_, i) => (
          <span key={i} className={`${styles.slot} ${i < used ? styles.on : ''}`} style={{ '--i': i }} />
        ))}
      </div>
      {!compact && (
        <p className={styles.label} aria-live="polite">
          <strong>{used} di {TOKENS_TOTAL} gettoni</strong>
          {' · '}{left === 0 ? 'scatola piena' : left === 1 ? 'ne resta 1' : `ne restano ${left}`}
        </p>
      )}
    </div>
  );
}
