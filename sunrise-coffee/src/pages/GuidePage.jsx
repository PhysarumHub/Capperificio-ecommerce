import { useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { GUIDE_GROUPS, GUIDE_UPDATED, getGuide, guidePath, guideToc } from '../data/guide';
import { plainText } from '../components/Assistenza/RichText';
import GuideBlock from '../components/Guide/GuideBlocks';
import {
  Crumbs, GuideLeft, GuideMarquee, MobileToc, MoreGuides,
  SideHelp, SideIdeas, SideProcess, SideProduct, SideRelated, useReadingState,
} from '../components/Guide/GuideLayout';
import NotFoundPage from './NotFoundPage';
import styles from '../components/Guide/Guide.module.css';

const SITE = 'https://www.capperificiocaro.com';

function GuideView({ guide }) {
  const articleRef = useRef(null);
  const toc = useMemo(() => guideToc(guide), [guide]);
  const { active, progress } = useReadingState(articleRef, toc.map((t) => t.id));
  const group = GUIDE_GROUPS.find((g) => g.id === guide.group);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Guide', path: '/guide' },
    { name: guide.title, path: guidePath(guide) },
  ];

  const jsonLd = useMemo(() => {
    const faq = guide.blocks.find((b) => b.type === 'faq');
    const article = {
      '@type': 'Article',
      headline: guide.title,
      description: guide.short,
      image: `${SITE}${guide.hero.src}`,
      dateModified: '2026-11-19',
      inLanguage: 'it-IT',
      author: { '@type': 'Organization', name: 'Capperificio Caro', url: SITE },
      publisher: { '@type': 'Organization', name: 'Capperificio Caro', logo: { '@type': 'ImageObject', url: `${SITE}/images/email/logo.png` } },
      mainEntityOfPage: `${SITE}${guidePath(guide)}`,
    };
    if (!faq) return article;
    return {
      '@graph': [
        article,
        {
          '@type': 'FAQPage',
          mainEntity: faq.items.map((it) => ({ '@type': 'Question', name: it.q, acceptedAnswer: { '@type': 'Answer', text: plainText(it.a) } })),
        },
      ],
    };
  }, [guide]);

  useSEO({
    title: guide.title,
    description: plainText(guide.lead).slice(0, 158),
    path: guidePath(guide),
    image: guide.hero.src,
    type: 'article',
    breadcrumbs: crumbs,
    jsonLd,
  });

  return (
    <div className={styles.page}>
      <Crumbs items={crumbs} />
      <MobileToc toc={toc} active={active} progress={progress} />

      <div className={styles.shell}>
        <GuideLeft toc={toc} active={active} progress={progress} readMin={guide.readMin} currentSlug={guide.slug} />

        <article ref={articleRef} className={styles.center}>
          <header className={styles.head}>
            <p className={styles.label}>Guida · {group?.label}</p>
            <h1 className={styles.h1}>{guide.title}</h1>
            <p className={styles.lead}>{guide.lead}</p>
            <div className={styles.byline}>
              <img src="/images/email/logo.png" alt="" className={styles.avatar} width="48" height="48" />
              <div className={styles.bylineText}>
                <strong>Il team del Capperificio Caro, Racale</strong>
                <span className={styles.mono}>Aggiornata il {GUIDE_UPDATED} · {guide.readMin} min di lettura</span>
              </div>
            </div>
          </header>

          <figure className={styles.hero}>
            <img src={guide.hero.src} alt={guide.hero.alt} width="1400" height="612" fetchpriority="high" />
            <figcaption className={styles.heroTags}>
              {guide.hero.tags.map((t) => <span key={t}>{t}</span>)}
            </figcaption>
          </figure>

          {guide.blocks.map((b, i) => <GuideBlock key={b.id || `${b.type}-${i}`} block={b} />)}

          <section className={styles.method}>
            <img src="/images/territorio/territorio-archivio-tavolo.webp" alt="Foto d’archivio: la famiglia al tavolo della cernita dei capperi" loading="lazy" width="320" height="240" />
            <div className={styles.methodBody}>
              <p className={styles.label}>Come abbiamo scritto questa guida</p>
              <p>
                Da chi raccoglie, sala e confeziona i capperi a Racale da tre generazioni. Nessun contenuto
                sponsorizzato: i consigli valgono per qualsiasi cappero di qualità.
              </p>
            </div>
          </section>
        </article>

        <aside className={styles.right} aria-label="Prodotti e approfondimenti">
          <SideProduct product={guide.product} />
          <SideRelated slugs={guide.related} />
          <SideIdeas ideas={guide.ideas} />
          <SideProcess />
          <SideHelp />
        </aside>
      </div>

      <MoreGuides excludeSlug={guide.slug} />
      <GuideMarquee />
    </div>
  );
}

export default function GuidePage() {
  const { slug } = useParams();
  const guide = getGuide(slug);
  if (!guide) return <NotFoundPage />;
  return <GuideView key={slug} guide={guide} />;
}
