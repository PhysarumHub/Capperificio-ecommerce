import { Link } from 'react-router-dom';
import useInView from '../../hooks/useInView';
import styles from './SectionHeader.module.css';
import anim from '../../styles/animations.module.css';

export default function SectionHeader({ label, title, count, viewAllHref, viewAllText = 'View all →', style }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`${styles.header} ${inView ? anim.headerInView : ''}`} style={style}>
      <div className={`${styles.label} ${anim.labelAnim}`}>
        <span className={styles.dot} /> {label}
      </div>
      <h2 className={`${styles.title} ${anim.titleAnim}`}>
        {title}
        {count != null && <sup>{count}</sup>}
      </h2>
      {viewAllHref && (
        <Link to={viewAllHref} className={`${styles.viewAll} ${anim.linkAnim}`}>{viewAllText}</Link>
      )}
    </div>
  );
}
