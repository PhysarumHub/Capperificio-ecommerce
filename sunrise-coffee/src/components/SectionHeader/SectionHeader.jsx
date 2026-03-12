import { Link } from 'react-router-dom';
import styles from './SectionHeader.module.css';

export default function SectionHeader({ label, title, count, viewAllHref, viewAllText = 'View all →', style }) {
  return (
    <div className={styles.header} style={style}>
      <div className={styles.label}>
        <span className={styles.dot} /> {label}
      </div>
      <h2 className={styles.title}>
        {title}
        {count != null && <sup>{count}</sup>}
      </h2>
      {viewAllHref && (
        <Link to={viewAllHref} className={styles.viewAll}>{viewAllText}</Link>
      )}
    </div>
  );
}
