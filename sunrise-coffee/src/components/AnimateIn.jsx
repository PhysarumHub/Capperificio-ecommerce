import useInView from '../hooks/useInView';
import styles from '../styles/animations.module.css';

export default function AnimateIn({ animation = 'fadeUp', delay = 0, className = '', as: Tag = 'div', children, style, ...props }) {
  const [ref, inView] = useInView();
  return (
    <Tag
      ref={ref}
      className={[styles[animation], inView ? styles.inView : '', className].filter(Boolean).join(' ')}
      style={{ '--delay': `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </Tag>
  );
}
