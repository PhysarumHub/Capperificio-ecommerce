import { useRef, useState, useCallback } from 'react';
import styles from './StorySlider.module.css';

const ITEMS = [
  {
    type: 'text',
    content: 'Our coffees are sourced through transparent, ethical relationships with farmers and cooperatives. We pay fair prices, prioritize long-term partnerships, and work with producers who invest in their communities and workers.',
  },
  {
    type: 'image',
    src: '/images/CAPPERI.jpg',
    alt: 'Green coffee beans on branch',
  },
  {
    type: 'text',
    content: 'Quality is checked at every stage, from green bean selection to final roast. Each batch is carefully profiled, cupped, and evaluated to ensure consistency, balance, and exceptional flavor in every roast.',
  },
  {
    type: 'image',
    src: '/images/CAPPERI.jpg',
    alt: 'Coffee brewing',
  },
];

export default function StorySlider() {
  const wrapperRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);

  const onMouseDown = useCallback((e) => {
    dragStart.current = { x: e.clientX, scrollLeft: wrapperRef.current.scrollLeft };
    setDragging(true);
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    wrapperRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
  }, []);

  const onMouseUp = useCallback(() => {
    dragStart.current = null;
    setDragging(false);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${dragging ? styles.grabbing : ''}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {ITEMS.map((item, i) => (
        item.type === 'text' ? (
          <div key={i} className={styles.textCell}>
            <p className={styles.text}>{item.content}</p>
          </div>
        ) : (
          <div key={i} className={styles.imageCell}>
            <img src={item.src} alt={item.alt} className={styles.image} draggable={false} />
          </div>
        )
      ))}
    </div>
  );
}
