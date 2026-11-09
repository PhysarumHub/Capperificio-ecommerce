import { TOKENS_TOTAL } from '../../data/natalBox';
import styles from './TokenMeter.module.css';

/* Dieci gettoni: quelli spesi si "coniano" in oro, gli altri restano incisi. */
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
        <span className={styles.label} aria-hidden="true">
          <strong>{used}</strong>/{TOKENS_TOTAL} gettoni
          <span className={styles.left}>{left === 0 ? ' · completa' : ` · ne restano ${left}`}</span>
        </span>
      )}
    </div>
  );
}
