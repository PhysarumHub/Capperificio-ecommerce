import { Link } from 'react-router-dom';
import styles from './BlogGrid.module.css';

const POSTS = [
  {
    title: 'Come conservare i capperi sotto sale: guida pratica',
    excerpt: "Il sale marino è il metodo di conservazione più antico e migliore per i capperi. Scopri come mantenerli fragranti e saporiti a lungo, direttamente in dispensa...",
    image: '/images/CAPPERI.jpg',
  },
  {
    title: 'Capperi in cucina: 5 abbinamenti da provare',
    excerpt: "Dal pesce spada alla pasta alla Norma, i capperi di Racale esaltano ogni piatto. Ecco cinque ricette della tradizione pugliese e siciliana da mettere in tavola...",
    image: '/images/CAPPERI.jpg',
  },
  {
    title: 'Lilliput, Lacrimella, Capperone: le differenze',
    excerpt: "Non tutti i capperi sono uguali. La dimensione incide su sapore, consistenza e uso ideale in cucina. Una piccola guida per scegliere il formato giusto...",
    image: '/images/CAPPERI.jpg',
  },
];

export default function BlogGrid() {
  return (
    <div className={styles.grid}>
      {POSTS.map((post) => (
        <div key={post.title} className={styles.card}>
          <div className={styles.img}>
            {post.image ? (
              <img src={post.image} alt={post.title} className={styles.postImg} />
            ) : (
              <div className={styles.imgPlaceholder} />
            )}
          </div>
          <div className={styles.body}>
            <h3 className={styles.title}>{post.title}</h3>
            <p className={styles.excerpt}>{post.excerpt}</p>
            <Link to="/" className={styles.link}>Read More &rarr;</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
