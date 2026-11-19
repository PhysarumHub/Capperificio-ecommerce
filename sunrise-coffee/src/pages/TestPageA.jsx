import { useViewTransitionNavigate } from '../hooks/useViewTransitionNavigate';
import { useSEO } from '../hooks/useSEO';
import styles from './TestPages.module.css';

export default function TestPageA() {
  useSEO({ title: 'Demo transizioni', path: '/test-a', noindex: true, canonical: false });
  const navigate = useViewTransitionNavigate();

  return (
    <div className={`${styles.page} ${styles.pageDark}`}>
      <p className={styles.label}>Pagina A — Demo transizioni</p>
      <h1 className={styles.title}>Espresso</h1>
      <button
        className={`${styles.btn} ${styles.btnGreen}`}
        onClick={() => navigate('/test-b')}
      >
        Vai alla pagina B →
      </button>
      <p className={styles.note}>View Transitions API · Chrome / Edge / Safari 18+</p>
    </div>
  );
}
