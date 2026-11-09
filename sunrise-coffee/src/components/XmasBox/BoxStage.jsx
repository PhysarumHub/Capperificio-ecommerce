import { useEffect, useRef, useState } from 'react';
import styles from './BoxStage.module.css';

/* Palcoscenico 3D delle box di Natale.
   - three.js arriva in un chunk separato, solo su questa pagina;
   - il render si ferma quando la scena esce dallo schermo o la tab è nascosta;
   - senza WebGL (o se il caricamento fallisce) resta il poster statico. */

const POSTER = '/images/box-natale/box-poster.webp';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

export default function BoxStage({ scene, giftNonce, onPick, label, children }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const sceneRef = useRef(scene);
  const pickRef = useRef(onPick);
  const giftDoneRef = useRef(-1);
  const [status, setStatus] = useState('loading'); // loading | ready | fallback

  sceneRef.current = scene;
  pickRef.current = onPick;

  // monta la scena una volta sola
  useEffect(() => {
    if (!hasWebGL()) { setStatus('fallback'); return undefined; }
    let disposed = false;
    let io; let ro; let onVis;

    const fonts = document.fonts
      ? Promise.all([
          document.fonts.load('500 24px "Paralucent"'),
          document.fonts.load('300 24px "Paralucent"'),
          document.fonts.load('italic 40px "PP Editorial Old"'),
        ]).catch(() => {})
      : Promise.resolve();

    Promise.all([import('./caroStage.js'), fonts])
      .then(([mod]) => {
        if (disposed || !canvasRef.current) return;
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const st = new mod.default(canvasRef.current, {
          logoUrl: '/images/box-natale/logo-cream.svg',
          reducedMotion: reduced,
          onPick: (id) => pickRef.current?.(id),
        });
        stageRef.current = st;
        apply(st, sceneRef.current);

        ro = new ResizeObserver(() => st.resize());
        ro.observe(canvasRef.current);
        let inView = true;
        io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; st.setActive(inView && !document.hidden); });
        io.observe(wrapRef.current);
        onVis = () => st.setActive(inView && !document.hidden);
        document.addEventListener('visibilitychange', onVis);

        requestAnimationFrame(() => requestAnimationFrame(() => { if (!disposed) setStatus('ready'); }));
      })
      .catch(() => { if (!disposed) setStatus('fallback'); });

    return () => {
      disposed = true;
      io?.disconnect(); ro?.disconnect();
      if (onVis) document.removeEventListener('visibilitychange', onVis);
      stageRef.current?.dispose();
      stageRef.current = null;
    };
  }, []);

  function apply(st, s) {
    if (!s) return;
    st.setMode(s.mode);
    st.setItems(s.items);
    st.setReserved(s.reserved);
    st.setBow(s.bow);
    st.setLid(s.lid);
    st.setWine(s.wine);
    if (s.mode === 'gift' && giftDoneRef.current !== giftNonce) {
      giftDoneRef.current = giftNonce;
      st.playGift(s.gift);
    }
  }

  // aggiorna a ogni cambio di stato
  useEffect(() => {
    if (stageRef.current) apply(stageRef.current, scene);
  });

  return (
    <div ref={wrapRef} className={styles.stage} data-status={status}>
      <img className={styles.poster} src={POSTER} alt="" aria-hidden="true" width="1200" height="900" decoding="async" />
      {status !== 'fallback' && (
        <canvas ref={canvasRef} className={styles.canvas} role="img" aria-label={label} />
      )}
      {status === 'fallback' && <span className="sr-only">{label}</span>}
      {children}
    </div>
  );
}
