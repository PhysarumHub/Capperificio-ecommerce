import styles from '../../pages/LegalPage.module.css';
import { LEGAL_LAST_UPDATE } from '../../data/company';

/**
 * Layout condiviso dei documenti legali (privacy, cookie, termini).
 *
 * @param {Object}   props
 * @param {string}   props.tag       - Etichetta piccola sopra il titolo
 * @param {string}   props.title     - Titolo del documento
 * @param {string}   props.intro     - Paragrafo introduttivo
 * @param {Array}    props.sections  - [{ id, title, content: ReactNode }]
 */
export default function LegalLayout({ tag, title, intro, sections }) {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.tag}>
            <span className={styles.tagDot} />
            {tag}
          </span>
          <h1 className={styles.title}>{title}</h1>
          {intro && <p className={styles.intro}>{intro}</p>}
          <p className={styles.updated}>Ultimo aggiornamento: {LEGAL_LAST_UPDATE}</p>
        </div>
      </header>

      <div className={styles.body}>
        <nav className={styles.toc} aria-label="Indice del documento">
          <p className={styles.tocTitle}>Indice</p>
          <ul className={styles.tocList}>
            {sections.map(({ id, title: sectionTitle }) => (
              <li key={id}>
                <a href={`#${id}`}>{sectionTitle}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.content}>
          {sections.map(({ id, title: sectionTitle, content }, i) => (
            <section key={id} id={id} className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNum}>{String(i + 1).padStart(2, '0')}</span>
                <span>{sectionTitle}</span>
              </h2>
              {content}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
