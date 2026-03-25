import { useState } from 'react';
import styles from './FilterTags.module.css';

const DEFAULT_TAGS = [
  'Tutti', 'Capperi', 'Cucunci', 'Foglie', 'Polvere',
  'Sotto sale', 'Sotto aceto', 'Lilliput', 'Capperone', 'Novità',
];

export default function FilterTags({ tags = DEFAULT_TAGS }) {
  const [active, setActive] = useState(tags[0]);

  return (
    <div className={styles.tags}>
      {tags.map((tag) => (
        <button
          key={tag}
          className={`${styles.tag} ${active === tag ? styles.active : ''}`}
          onClick={() => setActive(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
