import { Link, Navigate, useParams } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import {
  HELP_CATEGORIES, getArticlesInCategory, getHelpArticle, getHelpCategory,
  helpArticlePath, helpCategoryPath,
} from '../data/assistenza';
import RichText, { blocksToPlain, plainText } from '../components/Assistenza/RichText';
import { HelpCta, HelpHero, HelpTabs, Chevron } from '../components/Assistenza/HelpParts';
import NotFoundPage from './NotFoundPage';
import { COMPANY } from '../data/company';
import { getGuide, guidePath } from '../data/guide';
import { Crumbs, SideProcess, SideRelated } from '../components/Guide/GuideLayout';
import g from '../components/Guide/Guide.module.css';
import styles from '../components/Assistenza/Assistenza.module.css';

const HUB = { name: 'Centro assistenza', path: '/assistenza' };

/** /assistenza/:cat → elenco risposte dell’argomento. */
function CategoryView({ category }) {
  const articles = getArticlesInCategory(category.slug);
  const crumbs = [HUB, { name: category.title, path: helpCategoryPath(category) }];

  useSEO({
    title: `${category.title} — Assistenza`,
    description: `${category.sub}: le risposte del Capperificio di Racale.`,
    path: helpCategoryPath(category),
    breadcrumbs: [{ name: 'Home', path: '/' }, ...crumbs],
  });

  const others = HELP_CATEGORIES.filter((c) => c.slug !== category.slug);

  return (
    <div className={styles.page}>
      <HelpHero kicker={`${articles.length} risposte`} title={category.title} intro={category.sub} crumbs={crumbs} />
      <HelpTabs />
      <div className={styles.wrap}>
        <section className={`${styles.section} ${styles.article}`}>
          <ul className={styles.qlist}>
            {articles.map((a) => (
              <li key={a.slug}>
                <Link to={helpArticlePath(a)} className={styles.qlink}>
                  <span className={styles.qtext}>
                    {a.q}
                    <span className={styles.qshort}>{plainText(a.short)}</span>
                  </span>
                  <Chevron />
                </Link>
              </li>
            ))}
          </ul>
          <aside className={styles.aside}>
            <p className={styles.label}><span className={styles.dot} />Altri argomenti</p>
            <ul className={styles.asideList}>
              {others.map((c) => <li key={c.slug}><Link to={helpCategoryPath(c)}>{c.title}</Link></li>)}
            </ul>
          </aside>
        </section>
      </div>
      <HelpCta />
    </div>
  );
}

// Risposte che hanno una guida completa: la mostriamo in evidenza.
const GUIDE_FOR = {
  'quale-calibro-scegliere': 'quale-calibro-scegliere',
  'sale-o-aceto': 'capperi-sotto-sale-o-sottaceto',
  'capperi-e-cucunci': 'capperi-e-cucunci',
  'foglie-e-polvere': 'foglie-e-polvere-di-cappero',
  'come-dissalare': 'come-dissalare-i-capperi',
  'dopo-apertura': 'come-conservare-i-capperi',
  'sale-umido-cristalli': 'come-conservare-i-capperi',
  'scadenza': 'come-conservare-i-capperi',
};

const DEFAULT_RELATED = ['come-dissalare-i-capperi', 'quale-calibro-scegliere', 'come-conservare-i-capperi'];

/** /assistenza/:cat/:slug → singola risposta, con il layout delle guide. */
function ArticleView({ article, category }) {
  const crumbs = [
    HUB,
    { name: category.title, path: helpCategoryPath(category) },
    { name: article.q, path: helpArticlePath(article) },
  ];
  const description = plainText(article.short);
  const siblings = getArticlesInCategory(category.slug);
  const others = HELP_CATEGORIES.filter((c) => c.slug !== category.slug);
  const guide = getGuide(GUIDE_FOR[article.slug]);
  const related = guide
    ? [guide.slug, ...guide.related].slice(0, 3)
    : DEFAULT_RELATED;

  useSEO({
    title: article.q,
    description,
    path: helpArticlePath(article),
    breadcrumbs: [{ name: 'Home', path: '/' }, ...crumbs],
    jsonLd: {
      '@type': 'FAQPage',
      mainEntity: [{
        '@type': 'Question',
        name: article.q,
        acceptedAnswer: { '@type': 'Answer', text: blocksToPlain(article.body) },
      }],
    },
  });

  return (
    <div className={g.page}>
      <Crumbs items={[{ name: 'Home', path: '/' }, ...crumbs]} />
      <div className={g.shell}>
        <aside className={g.left} aria-label="Altre domande">
          <nav className={g.tocBox} aria-label={category.title}>
            <p className={g.label}>{category.title}</p>
            <ol className={g.toc}>
              {siblings.map((a, i) => (
                <li key={a.slug}>
                  <Link
                    to={helpArticlePath(a)}
                    className={a.slug === article.slug ? g.tocActive : undefined}
                    aria-current={a.slug === article.slug ? 'page' : undefined}
                  >
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    {a.q}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          <nav className={g.groups} aria-label="Altri argomenti">
            <p className={g.label}>Altri argomenti</p>
            {others.map((c) => (
              <Link key={c.slug} to={helpCategoryPath(c)} className={g.groupLink}>{c.title}</Link>
            ))}
            <Link to="/assistenza" className={g.moreLink} style={{ paddingTop: 6 }}>Centro assistenza →</Link>
          </nav>
        </aside>

        <article className={g.center}>
          <header className={g.head}>
            <p className={g.label}>Assistenza · {category.title}</p>
            <h1 className={g.h1}>{article.q}</h1>
            <p className={g.lead}>{description}</p>
          </header>

          <RichText body={article.body} />

          {guide && (
            <Link to={guidePath(guide)} className={g.photoLink} style={{ aspectRatio: '16 / 6' }}>
              <img src={guide.hero.src} alt="" loading="lazy" width="1200" height="450" />
              <span>
                <span className={g.label}>La guida completa · {guide.readMin} min</span>
                <span className={g.photoLinkTitle} style={{ fontSize: 30 }}>{guide.title} →</span>
              </span>
            </Link>
          )}

          <p className={g.mono}>Risposta del team del Capperificio Caro, Racale</p>
        </article>

        <aside className={g.right} aria-label="Guide e aiuto">
          <SideRelated slugs={related} label={guide ? 'Guide collegate' : 'Guide utili'} />
          <div className={g.helpBox}>
            <span className={g.helpTitle}>Non hai trovato la risposta?</span>
            <Link to="/assistenza/qualcosa-non-va">Percorso guidato →</Link>
            <Link to="/assistenza/dove-e-il-mio-ordine">Dov’è il mio ordine →</Link>
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          </div>
          <SideProcess />
        </aside>
      </div>
      <HelpCta />
    </div>
  );
}

export default function AssistenzaTopicPage() {
  const { cat, slug } = useParams();
  const category = getHelpCategory(cat);
  if (!category) return <NotFoundPage />;
  if (!slug) return <CategoryView key={cat} category={category} />;

  const article = getHelpArticle(slug);
  if (!article) return <NotFoundPage />;
  // Risposta raggiunta con l’argomento sbagliato nell’URL → percorso canonico
  if (article.cat !== cat) return <Navigate to={helpArticlePath(article)} replace />;
  return <ArticleView key={slug} article={article} category={category} />;
}
