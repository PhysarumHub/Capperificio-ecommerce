import { Link } from 'react-router-dom';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { useSEO } from '../hooks/useSEO';
import styles from './BlogPage.module.css';

const POSTS_FALLBACK = [
  {
    title: 'Come conservare i capperi sotto sale: guida pratica',
    excerpt: "Il sale marino è il metodo di conservazione più antico e migliore per i capperi. Scopri come mantenerli fragranti e saporiti a lungo, direttamente in dispensa.",
    image: '/images/CAPPERI.jpg',
    slug: null,
    category: 'Guide',
  },
  {
    title: 'Capperi in cucina: 5 abbinamenti da provare',
    excerpt: "Dal pesce spada alla pasta alla Norma, i capperi di Racale esaltano ogni piatto. Ecco cinque ricette della tradizione pugliese e siciliana da mettere in tavola.",
    image: '/images/CAPPERI.jpg',
    slug: null,
    category: 'Ricette',
  },
  {
    title: 'Lilliput, Lacrimella, Capperone: le differenze',
    excerpt: "Non tutti i capperi sono uguali. La dimensione incide su sapore, consistenza e uso ideale in cucina. Una piccola guida per scegliere il formato giusto.",
    image: '/images/CAPPERI.jpg',
    slug: null,
    category: 'Prodotti',
  },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

const BLOG_JSON_LD = {
  '@type': 'Blog',
  name: 'Blog — Capperificio di Racale',
  description: 'Storie, ricette e guide dal mondo dei capperi di Racale.',
};

export default function BlogPage() {
  useSEO({
    title: 'Blog — Storie e Ricette',
    description: 'Storie, ricette e guide sul mondo dei capperi di Racale. Scopri come utilizzare e conservare i capperi artigianali dal Salento.',
    path: '/blog',
    jsonLd: BLOG_JSON_LD,
  });

  const { posts: apiPosts, loading } = useBlogPosts({ limit: 20 });
  const posts = !loading && apiPosts.length > 0 ? apiPosts : POSTS_FALLBACK;

  return (
    <div className={styles.page}>
      <header className={styles.banner}>
        <div className={styles.bannerLabel}>
          <span className={styles.bannerDot} />
          Dal campo alla tavola
        </div>
        <h1 className={styles.bannerTitle}>Il nostro blog</h1>
        <p className={styles.bannerDesc}>
          Storie, ricette e guide sul mondo dei capperi di Racale.
        </p>
      </header>

      <div className={styles.grid}>
        {posts.map((post) => (
          <div key={post.slug || post.title} className={styles.card}>
            <div className={styles.img}>
              {post.image ? (
                <img src={post.image} alt={post.title} className={styles.postImg} loading="lazy" />
              ) : (
                <div className={styles.imgPlaceholder} />
              )}
            </div>
            <div className={styles.body}>
              {post.category && (
                <span className={styles.category}>{post.category}</span>
              )}
              <h2 className={styles.title}>{post.title}</h2>
              <p className={styles.excerpt}>{post.excerpt}</p>
              <div className={styles.cardFooter}>
                {post.date && (
                  <time className={styles.date}>{formatDate(post.date)}</time>
                )}
                {post.slug ? (
                  <Link to={`/blog/${post.slug}`} className={styles.link}>Leggi →</Link>
                ) : (
                  <span className={styles.link}>Leggi →</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
