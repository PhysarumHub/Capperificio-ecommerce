import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { COMPANY } from '../data/company';
import { HELP_ARTICLES, HELP_CATEGORIES, getArticlesInCategory, helpArticlePath } from '../data/assistenza';
import RichText, { blocksToPlain } from '../components/Assistenza/RichText';
import contentStyles from './ContentPage.module.css';
import styles from './FAQPage.module.css';

// Le domande arrivano dal centro assistenza (fonte unica): qui tutte in una pagina.
const GROUPS = HELP_CATEGORIES.map((c) => ({
  id: c.slug,
  label: c.title,
  items: getArticlesInCategory(c.slug).map((a) => ({
    id: a.slug,
    q: a.q,
    a: (
      <>
        <RichText body={a.body} />
        <p><Link to={helpArticlePath(a)}>Apri la risposta</Link></p>
      </>
    ),
  })),
}));

const FAQ_JSONLD = {
  '@type': 'FAQPage',
  mainEntity: HELP_ARTICLES.map((a) => ({
    '@type': 'Question',
    name: a.q,
    acceptedAnswer: { '@type': 'Answer', text: blocksToPlain(a.body) },
  })),
};

function AccordionItem({ id, q, a, isOpen, onToggle }) {
  return (
    <div id={id} className={`${styles.item} ${isOpen ? styles.open : ''}`}>
      <button
        type="button"
        className={styles.trigger}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
      >
        <span className={styles.triggerText}>{q}</span>
        <span className={styles.iconWrap} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>
      <div className={styles.panel} id={`${id}-panel`} role="region">
        <div className={styles.panelInner}>
          <div className={styles.panelContent}>{a}</div>
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  useSEO({
    title: 'Domande frequenti',
    description: `Calibri, conservazione, spedizioni, resi e pagamenti: tutte le risposte alle domande più comuni su ${COMPANY.brand}.`,
    path: '/faq',
    jsonLd: FAQ_JSONLD,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'FAQ', path: '/faq' },
    ],
  });

  const [openId, setOpenId] = useState(GROUPS[0].items[0].id);

  const toggle = (id) => setOpenId((current) => (current === id ? null : id));

  return (
    <div className={contentStyles.page}>
      <header className={contentStyles.hero}>
        <div className={contentStyles.heroInner}>
          <span className={contentStyles.tag}>
            <span className={contentStyles.tagDot} />
            Domande frequenti
          </span>
          <h1 className={contentStyles.title}>Le domande che ci fate più spesso</h1>
          <p className={contentStyles.intro}>
            Scegliere e conservare i capperi, ordini, spedizioni e resi: tutte le risposte in una
            pagina. Per cercare una risposta o seguire un ordine vai al{' '}
            <Link to="/assistenza">centro assistenza</Link>.
          </p>
        </div>
      </header>

      <div className={contentStyles.body}>
        <div className={styles.groups}>
          {GROUPS.map((group) => (
            <div key={group.id}>
              <p className={styles.groupLabel}>
                <span className={styles.groupLabelDot} />
                {group.label}
              </p>
              <div className={styles.list}>
                {group.items.map((item) => (
                  <AccordionItem
                    key={item.id}
                    {...item}
                    isOpen={openId === item.id}
                    onToggle={() => toggle(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.cta}>
          <p className={styles.ctaTitle}>Non hai trovato la risposta che cercavi?</p>
          <Link to="/assistenza" className={styles.ctaBtn}>Vai al centro assistenza &rarr;</Link>
        </div>
      </div>
    </div>
  );
}
