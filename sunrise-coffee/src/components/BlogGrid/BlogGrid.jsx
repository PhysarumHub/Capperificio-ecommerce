import { Link } from 'react-router-dom';
import { useBlogPosts } from '../../hooks/useBlogPosts';
import useInView from '../../hooks/useInView';
import styles from './BlogGrid.module.css';
import anim from '../../styles/animations.module.css';

const POSTS_FALLBACK = [
  {
    title: 'Come conservare i capperi sotto sale: guida pratica',
    excerpt: "Il sale marino è il metodo di conservazione più antico e migliore per i capperi. Scopri come mantenerli fragranti e saporiti a lungo, direttamente in dispensa...",
    image: '/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp',
    slug: null,
  },
  {
    title: 'Capperi in cucina: 5 abbinamenti da provare',
    excerpt: "Dal pesce spada alla pasta alla Norma, i capperi di Racale esaltano ogni piatto. Ecco cinque ricette della tradizione pugliese e siciliana da mettere in tavola...",
    image: '/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp',
    slug: null,
  },
  {
    title: 'Lilliput, Lacrimella, Capperone: le differenze',
    excerpt: "Non tutti i capperi sono uguali. La dimensione incide su sapore, consistenza e uso ideale in cucina. Una piccola guida per scegliere il formato giusto...",
    image: '/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp',
    slug: null,
  },
];

export default function BlogGrid() {
  const { posts: apiPosts, loading } = useBlogPosts({ limit: 3 });
  const [ref, inView] = useInView({ threshold: 0.1 });
  const posts = !loading && apiPosts.length > 0 ? apiPosts : POSTS_FALLBACK;

  return (
    <div
      ref={ref}
      className={`${styles.grid} ${anim.staggerGrid} ${inView ? anim.staggerInView : ''}`}
    >
      {posts.map((post) => {
        const content = (
          <>
            <div className={`${styles.img} ${anim.imgZoom}`}>
              {post.image
                ? <img src={post.image} alt={post.title} className={styles.postImg} loading="lazy" decoding="async" />
                : <div className={styles.imgPlaceholder} />
              }
            </div>
            <div className={styles.body}>
              <h3 className={styles.title}>{post.title}</h3>
              <p className={styles.excerpt}>{post.excerpt}</p>
              <span className={styles.link}>Leggi →</span>
            </div>
          </>
        );

        return post.slug ? (
          <Link key={post.slug} to={`/blog/${post.slug}`} className={styles.card}>
            {content}
          </Link>
        ) : (
          <div key={post.title} className={styles.card}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
