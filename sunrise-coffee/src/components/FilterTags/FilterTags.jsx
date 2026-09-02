import { useState } from 'react';
import styles from './FilterTags.module.css';

const DEFAULT_ROWS = [
  ['Racale', 'Capperi', 'Cucunci', 'Foglie'],
  ['Sotto sale', 'Sotto aceto', 'In salamoia'],
  ['Ho.Re.Ca', 'Enogastronomie'],
];

export default function FilterTags({ rows = DEFAULT_ROWS }) {
  const [active, setActive] = useState(rows[0]?.[0]);

  return (
    <div className={styles.tags}>
      {rows.map((row, i) => (
        <div key={i} className={styles.row}>
          {row.map((tag) => (
            <button
              key={tag}
              className={`${styles.tag} ${active === tag ? styles.active : ''}`}
              onClick={() => setActive(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
