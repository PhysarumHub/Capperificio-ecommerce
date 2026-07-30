import { useRef, useState, useCallback } from 'react';
import styles from './StorySlider.module.css';

const ITEMS = [
  {
    type: 'text',
    content: 'Ogni cappero viene raccolto a mano tra luglio e agosto, quando il bocciolo è al punto giusto di maturazione. Un gesto antico che si ripete uguale da tre generazioni tra le campagne di Racale, in provincia di Lecce.',
  },
  {
    type: 'image',
    src: '/images/20250611_CapperificioCaro_Capperi___-3635 (1).webp',
    alt: 'Capperi di Racale',
  },
  {
    type: 'text',
    content: 'La qualità si controlla ad ogni fase: dalla selezione in campo alla salamoia, fino alla conservazione. Ogni vasetto che esce dalla nostra bottega porta con sé il sapore autentico del Salento.',
  },
  {
    type: 'image',
    src: '/images/dalcampoallatavola2.webp',
    alt: 'Dal campo alla tavola',
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
            <img src={item.src} alt={item.alt} className={styles.image} draggable={false} loading="lazy" decoding="async" />
          </div>
        )
      ))}
    </div>
  );
}
