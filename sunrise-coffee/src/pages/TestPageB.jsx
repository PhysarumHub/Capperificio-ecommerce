import { useViewTransitionNavigate } from '../hooks/useViewTransitionNavigate';
import { useSEO } from '../hooks/useSEO';
import styles from './TestPages.module.css';

export default function TestPageB() {
  useSEO({ title: 'Demo transizioni', path: '/test-b', noindex: true, canonical: false });
  const navigate = useViewTransitionNavigate();

  return (
    <div className={`${styles.page} ${styles.pageLight}`}>
      <p className={styles.label}>Pagina B — Demo transizioni</p>
      <h1 className={styles.title}>Cappuccino</h1>
      <button
        className={`${styles.btn} ${styles.btnDark}`}
        onClick={() => navigate('/test-a')}
      >
        ← Torna alla pagina A
      </button>
      <p className={styles.note}>View Transitions API · Chrome / Edge / Safari 18+</p>
    </div>
  );
}
