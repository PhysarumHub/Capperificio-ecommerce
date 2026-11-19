import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { GUIDE_GROUPS, guidePath, guidesInGroup } from '../data/guide';
import { Crumbs, GuideMarquee } from '../components/Guide/GuideLayout';
import styles from '../components/Guide/Guide.module.css';

export default function GuideHubPage() {
  useSEO({
    title: 'Guide al cappero',
    description: 'Come dissalare e conservare i capperi, quale calibro scegliere, sale o aceto, capperi e cucunci: le guide del Capperificio Caro di Racale.',
    path: '/guide',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Guide', path: '/guide' }],
  });

  return (
    <div className={styles.page}>
      <Crumbs items={[{ name: 'Home', path: '/' }, { name: 'Guide', path: '/guide' }]} />
      <header className={styles.hubHero}>
        <div className={styles.head}>
          <p className={styles.label}>Guide</p>
          <h1 className={styles.h1}>Tutto quello che sappiamo sul cappero</h1>
          <p className={styles.lead}>
            Come sceglierlo, conservarlo e usarlo in cucina, spiegato da chi lo raccoglie e lo sala a Racale.
          </p>
        </div>
      </header>

      {GUIDE_GROUPS.map((g) => (
        <section key={g.id} className={styles.hubGroup}>
          <h2 className={styles.h2}>{g.label}</h2>
          <div className={styles.hubGrid}>
            {guidesInGroup(g.id).map((guide) => (
              <Link key={guide.slug} to={guidePath(guide)} className={styles.hubCard}>
                <div>
                  <img src={guide.hero.src} alt="" loading="lazy" width="600" height="450" />
                  <span>{guide.title}</span>
                </div>
                <p className={styles.hubShort}>{guide.short}</p>
                <span className={styles.mono}>Guida · {guide.readMin} min</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <GuideMarquee />
    </div>
  );
}
