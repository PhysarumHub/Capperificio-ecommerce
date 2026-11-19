import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GUIDES, GUIDE_GROUPS, getGuide, guidePath, guidesInGroup } from '../../data/guide';
import styles from './Guide.module.css';

/** Sezione visibile + avanzamento della lettura dentro `articleRef`. */
export function useReadingState(articleRef, ids) {
  const [active, setActive] = useState(ids[0] || null);
  const [progress, setProgress] = useState(0);
  const key = ids.join('|');

  useEffect(() => {
    const els = key.split('|').map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = articleRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const total = r.height - window.innerHeight * 0.6;
        setProgress(Math.min(1, Math.max(0, -r.top / Math.max(total, 1))));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [articleRef]);

  return { active, progress };
}

function TocList({ toc, active, onPick }) {
  return (
    <ol className={styles.toc}>
      {toc.map((t, i) => (
        <li key={t.id}>
          <a
            href={`#${t.id}`}
            className={active === t.id ? styles.tocActive : undefined}
            aria-current={active === t.id ? 'location' : undefined}
            onClick={onPick}
          >
            <span>{String(i + 1).padStart(2, '0')}</span>
            {t.label}
          </a>
        </li>
      ))}
    </ol>
  );
}

export function Progress({ value }) {
  return (
    <div className={styles.progress} aria-hidden="true">
      <div style={{ transform: `scaleX(${value})` }} />
    </div>
  );
}

/** Colonna sinistra: indice della pagina + elenco di tutte le guide. */
export function GuideLeft({ toc, active, progress, readMin, currentSlug, tocLabel = 'In questa guida' }) {
  return (
    <aside className={styles.left} aria-label="Indice e guide">
      {toc.length > 0 && (
        <nav className={styles.tocBox} aria-label={tocLabel}>
          <p className={styles.label}>{tocLabel}</p>
          <TocList toc={toc} active={active} />
          <Progress value={progress} />
          {readMin && <span className={styles.mono}>Lettura {readMin} min · {Math.round(progress * 100)}%</span>}
        </nav>
      )}
      <GuideGroups currentSlug={currentSlug} />
    </aside>
  );
}

export function GuideGroups({ currentSlug }) {
  return (
    <nav className={styles.groups} aria-label="Tutte le guide">
      <p className={styles.label}>Tutte le guide</p>
      {GUIDE_GROUPS.map((g) => (
        <div key={g.id} className={styles.group}>
          <span className={styles.mono}>{g.label}</span>
          {guidesInGroup(g.id).map((guide) => {
            const current = guide.slug === currentSlug;
            return (
              <Link
                key={guide.slug}
                to={guidePath(guide)}
                className={`${styles.groupLink} ${current ? styles.groupLinkActive : ''}`}
                aria-current={current ? 'page' : undefined}
              >
                {current ? '→ ' : ''}{guide.title}
              </Link>
            );
          })}
        </div>
      ))}
      <Link to="/guide" className={styles.moreLink} style={{ paddingTop: 6 }}>Tutte le guide →</Link>
    </nav>
  );
}

/** Indice su mobile: barra fissa sotto l'header, si apre a tendina. */
export function MobileToc({ toc, active, progress }) {
  const [open, setOpen] = useState(false);
  if (!toc.length) return null;
  const idx = Math.max(0, toc.findIndex((t) => t.id === active));
  return (
    <div className={styles.mtoc}>
      <button type="button" className={styles.mtocBtn} aria-expanded={open} aria-controls="mtoc-list" onClick={() => setOpen((v) => !v)}>
        <span className={styles.mtocNow}>
          <span className={styles.label}>Indice · {String(idx + 1).padStart(2, '0')} di {String(toc.length).padStart(2, '0')}</span>
          <span>{toc[idx]?.label}</span>
        </span>
        <span className={styles.faqIcon} style={open ? { transform: 'rotate(45deg)' } : undefined} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </span>
      </button>
      <Progress value={progress} />
      {open && (
        <div id="mtoc-list">
          <TocList toc={toc} active={active} onPick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

/* ── Colonna destra ─────────────────────────────────────────────────── */

export function SideProduct({ product, label = 'Usato in questa guida' }) {
  if (!product) return null;
  return (
    <div className={styles.side}>
      <p className={styles.label}>{label}</p>
      <Link to={product.to} className={styles.product}>
        <img src={product.image} alt="" loading="lazy" width="300" height="360" />
        <span className={styles.productName}>{product.name}</span>
        <span className={styles.pills}>
          {product.pills.map((p) => <span key={p} className={styles.pill}>{p}</span>)}
        </span>
        <span className={styles.productCta}>VEDI IL PRODOTTO →</span>
      </Link>
    </div>
  );
}

export function SideRelated({ slugs, label = 'Leggi anche' }) {
  const items = slugs.map(getGuide).filter(Boolean);
  if (!items.length) return null;
  return (
    <div className={styles.side}>
      <p className={styles.label}>{label}</p>
      {items.map((g) => (
        <Link key={g.slug} to={guidePath(g)} className={styles.relItem}>
          <img src={g.hero.src} alt="" loading="lazy" width="64" height="64" />
          <span className={styles.relText}>
            <span className={styles.relTitle}>{g.title}</span>
            <span className={styles.mono}>Guida · {g.readMin} min</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function SideIdeas({ ideas }) {
  if (!ideas?.length) return null;
  return (
    <div className={styles.side}>
      <p className={styles.label}>Idee in cucina</p>
      <div className={styles.chips}>
        {ideas.map((i) => <span key={i} className={styles.chip}>{i}</span>)}
      </div>
    </div>
  );
}

export function SideProcess() {
  return (
    <Link to="/processo-produttivo" className={styles.photoLink}>
      <img src="/images/capperificio-caro-capperi-racale.webp" alt="" loading="lazy" width="600" height="450" />
      <span>
        <span className={styles.label}>Processo produttivo</span>
        <span className={styles.photoLinkTitle}>Un anno intorno alla pianta</span>
      </span>
    </Link>
  );
}

export function SideHelp() {
  return (
    <div className={styles.helpBox}>
      <span className={styles.helpTitle}>Ordini, spedizioni, resi?</span>
      <Link to="/assistenza">Vai al centro assistenza →</Link>
    </div>
  );
}

/* ── Fondo pagina ───────────────────────────────────────────────────── */

export function MoreGuides({ excludeSlug, title = 'Continua a leggere' }) {
  const items = GUIDES.filter((g) => g.slug !== excludeSlug).slice(0, 4);
  const groupLabel = (id) => GUIDE_GROUPS.find((g) => g.id === id)?.label || '';
  return (
    <section className={styles.more}>
      <div className={styles.moreHead}>
        <h2 className={styles.h2}>{title}</h2>
        <Link to="/guide" className={styles.moreLink}>Tutte le guide →</Link>
      </div>
      <div className={styles.moreGrid}>
        {items.map((g) => (
          <Link key={g.slug} to={guidePath(g)} className={styles.moreCard}>
            <img src={g.hero.src} alt="" loading="lazy" width="400" height="300" />
            <span className={styles.moreTitle}>{g.title}</span>
            <span className={styles.pill}>{groupLabel(g.group)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const MARQUEE = ['Dissalare', 'Conservare', 'Lilliput', 'Lacrimella', 'Occhio di pernice', 'Capperone', 'Cucunci', 'Foglie', 'Polvere'];

export function GuideMarquee() {
  const words = [...MARQUEE, ...MARQUEE];
  return (
    <div className={styles.marquee} aria-hidden="true">
      {words.map((w, i) => <span key={i}>{w}{i < words.length - 1 ? '  ›' : ''}</span>)}
    </div>
  );
}

export function Crumbs({ items }) {
  return (
    <nav aria-label="Percorso" className={styles.crumbs}>
      <ol>
        {items.map((it, i) => (
          <li key={it.path}>
            {i < items.length - 1 ? <Link to={it.path}>{it.name}</Link> : <span aria-current="page">{it.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
