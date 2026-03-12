import { Link } from 'react-router-dom';
import styles from './BlogGrid.module.css';

const POSTS = [
  {
    title: 'How to Store Coffee Beans So They Stay Fresh Longer',
    excerpt: "Coffee tastes best when it's fresh. Even the highest-quality beans lose flavor over time if they're stored incorrectly. The good news? ...",
    image: '/images/CAPPERI.jpg',
  },
  {
    title: 'Morning Coffee: Make It Part of Your Routine',
    excerpt: "For many of us, mornings are a bit of a dance, rushed and scrambling out the door. But what if your coffee wasn't just fuel—it was a moment to ...",
    image: '/images/CAPPERI.jpg',
  },
  {
    title: '5 Easy Ways to Upgrade Your Home Coffee Game',
    excerpt: "You don't need a café setup to achieve a better cup at home. Here's how to make great coffee at home. A few small tweaks can make a big difference in flavor.",
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
