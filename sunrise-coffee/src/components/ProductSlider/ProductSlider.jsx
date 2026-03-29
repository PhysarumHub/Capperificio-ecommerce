import { useState, useRef, useCallback, useEffect } from 'react';
import styles from './ProductSlider.module.css';

export default function ProductSlider({ children, slideWidth = 100 / 3.35 }) {
  const total = Array.isArray(children) ? children.length : 0;
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const startXRef = useRef(0);
  const curTxRef = useRef(0);
  const prevTxRef = useRef(0);
  const dragDistRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const getSlideWidth = useCallback(() => {
    const firstSlide = trackRef.current?.firstElementChild;
    return firstSlide ? firstSlide.getBoundingClientRect().width : 300;
  }, []);

  const getVisibleCount = useCallback(() => {
    const w = wrapperRef.current?.offsetWidth || 1;
    return w / getSlideWidth();
  }, [getSlideWidth]);

  const maxIdx = Math.max(0, Math.ceil(total - (wrapperRef.current ? getVisibleCount() : 3)));
  const dotCount = maxIdx + 1;

  const goTo = useCallback((i) => {
    if (isMobile) return;
    const clamped = Math.max(0, Math.min(i, maxIdx));
    setIdx(clamped);
    const tx = -(clamped * getSlideWidth());
    curTxRef.current = tx;
    prevTxRef.current = tx;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${tx}px)`;
    }
  }, [maxIdx, getSlideWidth, isMobile]);

  const handlePointerDown = useCallback((e) => {
    if (isMobile) return;
    setDragging(true);
    dragDistRef.current = 0;
    startXRef.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    prevTxRef.current = curTxRef.current;
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;

    const onMove = (e) => {
      if (!dragging) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const diff = x - startXRef.current;
      dragDistRef.current = Math.abs(diff);
      curTxRef.current = prevTxRef.current + diff;
      if (trackRef.current) {
        trackRef.current.style.transition = 'none';
        trackRef.current.style.transform = `translateX(${curTxRef.current}px)`;
      }
    };

    const onUp = () => {
      if (!dragging) return;
      setDragging(false);
      if (trackRef.current) trackRef.current.style.transition = '';
      const moved = curTxRef.current - prevTxRef.current;
      const thresh = getSlideWidth() * 0.2;
      if (moved < -thresh) goTo(idx + 1);
      else if (moved > thresh) goTo(idx - 1);
      else goTo(idx);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, idx, goTo, getSlideWidth, isMobile]);

  // Su mobile: DOM pulito senza nessun handler JS — identico al productGrid
  // Qualsiasi onMouseDown/onTouchStart sul wrapper causa problemi con i click
  // sui bottoni figlio su iOS Safari (synthetic mouse events da touch)
  if (isMobile) {
    return (
      <div className={styles.mobileWrapper}>
        {children}
      </div>
    );
  }

  return (
    <>
      <div
        ref={wrapperRef}
        className={`${styles.wrapper} ${dragging ? styles.grabbing : ''}`}
        onMouseDown={handlePointerDown}
      >
        <div ref={trackRef} className={styles.track}>
          {Array.isArray(children) && children.map((child, i) => (
            <div
              key={i}
              className={styles.slide}
              style={{ flex: `0 0 ${slideWidth}%` }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.dots}>
          {Array.from({ length: dotCount }, (_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === idx ? styles.dotActive : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <div className={styles.arrows}>
          <button className={styles.arrow} onClick={() => goTo(idx - 1)} disabled={idx <= 0} aria-label="Precedente">←</button>
          <button className={styles.arrow} onClick={() => goTo(idx + 1)} disabled={idx >= maxIdx} aria-label="Successivo">→</button>
        </div>
      </div>
    </>
  );
}
