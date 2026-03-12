import { useState } from 'react';
import styles from './FilterTags.module.css';

const DEFAULT_TAGS = [
  'All coffee', 'Popular', 'Single Origin', 'Blend', 'Filter',
  'Espresso', 'Brazil', 'Colombia', 'Ethiopia', 'Kenya', 'Washed', 'Natural',
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
