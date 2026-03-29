import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBlogPost } from '../hooks/useBlogPost';
import { useSEO } from '../hooks/useSEO';
import styles from './BlogArticlePage.module.css';

function renderBlocks(blocks) {
  if (!blocks || !Array.isArray(blocks)) return null;
  return blocks.map((block, i) => {
    switch (block.type) {
      case 'paragraph':
        return <p key={i} className={styles.paragraph}>{renderInline(block.children)}</p>;
      case 'heading':
        return renderHeading(block, i);
      case 'list':
        return renderList(block, i);
      case 'quote':
        return <blockquote key={i} className={styles.quote}>{renderInline(block.children)}</blockquote>;
      case 'image':
        return <img key={i} src={block.image?.url} alt={block.image?.alternativeText || ''} className={styles.contentImage} />;
      default:
        return null;
    }
  });
}

function renderInline(children) {
  if (!children) return null;
  return children.map((child, i) => {
    if (child.type === 'link') {
      return <a key={i} href={child.url} target="_blank" rel="noopener noreferrer">{renderInline(child.children)}</a>;
    }
    let el = child.text;
    if (child.bold)          el = <strong key={i}>{el}</strong>;
    else if (child.italic)   el = <em key={i}>{el}</em>;
    else if (child.code)     el = <code key={i}>{el}</code>;
    else                     el = <span key={i}>{el}</span>;
    return el;
  });
}

function renderHeading(block, i) {
  const text = renderInline(block.children);
  switch (block.level) {
    case 1: return <h1 key={i} className={styles.h1}>{text}</h1>;
    case 2: return <h2 key={i} className={styles.h2}>{text}</h2>;
    case 3: return <h3 key={i} className={styles.h3}>{text}</h3>;
    default: return <h4 key={i} className={styles.h3}>{text}</h4>;
  }
}

function renderList(block, i) {
  const items = block.children.map((item, j) => (
    <li key={j}>{renderInline(item.children)}</li>
  ));
  return block.format === 'ordered'
    ? <ol key={i} className={styles.list}>{items}</ol>
    : <ul key={i} className={styles.list}>{items}</ul>;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function BlogArticlePage() {
  const { slug } = useParams();
  const { post, loading, error } = useBlogPost(slug);

  const jsonLd = useMemo(() => {
    if (!post) return null;
    return {
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt || '',
      image: post.image || undefined,
      datePublished: post.date || undefined,
      author: { '@type': 'Organization', name: 'Capperificio di Racale' },
      publisher: { '@type': 'Organization', name: 'Capperificio di Racale' },
    };
  }, [post]);

  useSEO({
    title: post?.title || 'Articolo',
    description: post?.excerpt || 'Leggi questo articolo dal blog del Capperificio di Racale.',
    path: `/blog/${slug}`,
    image: post?.image,
    type: 'article',
    jsonLd,
  });

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Caricamento...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className={styles.notFound}>
        <p>Articolo non trovato.</p>
        <Link to="/" className={styles.back}>← Torna alla home</Link>
      </div>
    );
  }

  return (
    <div className={styles.pageGrid}>
      <div className={styles.sideCol} />

      <article className={styles.article}>
        <header className={styles.header}>
          {post.category && (
            <span className={styles.category}>{post.category}</span>
          )}
          <h1 className={styles.title}>{post.title}</h1>
          {post.excerpt && (
            <p className={styles.excerpt}>{post.excerpt}</p>
          )}
          <div className={styles.meta}>
            {post.date && <time>{formatDate(post.date)}</time>}
          </div>
        </header>

        {post.image && (
          <div className={styles.coverWrap}>
            <img src={post.image} alt={post.title} className={styles.cover} loading="lazy" />
          </div>
        )}

        <div className={styles.body}>
          {renderBlocks(post.content)}
        </div>

        <div className={styles.footer}>
          <Link to="/" className={styles.back}>← Torna alla home</Link>
        </div>
      </article>

      <div className={styles.sideCol} />
    </div>
  );
}
