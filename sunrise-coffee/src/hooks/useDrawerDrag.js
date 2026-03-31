import { useRef, useCallback } from 'react';

const DISMISS_VELOCITY = 0.5; // px/ms — flick rapido
const DISMISS_RATIO    = 0.35; // 35% altezza drawer

/**
 * Drag-to-dismiss stile Vaul per bottom-sheet mobile.
 * Attach onTouchStart / onTouchMove / onTouchEnd al handle/header del drawer.
 */
export function useDrawerDrag({ drawerRef, backdropRef, onClose }) {
  const startY    = useRef(null);
  const startTime = useRef(null);

  const onTouchStart = useCallback((e) => {
    if (window.innerWidth > 768) return;
    startY.current    = e.touches[0].clientY;
    startTime.current = Date.now();
    if (drawerRef.current) {
      drawerRef.current.style.transition = 'none';
    }
  }, [drawerRef]);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    const el = drawerRef.current;
    if (!el) return;

    if (dy <= 0) {
      // Trascina verso l'alto: damping forte
      el.style.transform = `translateY(${dy * 0.12}px)`;
      return;
    }

    el.style.transform = `translateY(${dy}px)`;

    // Schiarisci il backdrop proporzionalmente
    if (backdropRef?.current) {
      const h     = el.offsetHeight || 500;
      const ratio = Math.max(0, 1 - dy / h);
      backdropRef.current.style.background = `rgba(0,0,0,${(0.4 * ratio).toFixed(3)})`;
    }
  }, [drawerRef, backdropRef]);

  const onTouchEnd = useCallback((e) => {
    if (startY.current === null) return;
    const dy = e.changedTouches[0].clientY - startY.current;
    const dt = Math.max(1, Date.now() - startTime.current);
    const velocity = dy / dt;
    const el = drawerRef.current;

    startY.current = null;

    if (!el) { onClose(); return; }

    el.style.transition = ''; // ripristina transizione CSS

    const h             = el.offsetHeight || 500;
    const shouldDismiss = dy > h * DISMISS_RATIO || velocity > DISMISS_VELOCITY;

    if (shouldDismiss) {
      el.style.transform = 'translateY(100%)';
      if (backdropRef?.current) {
        backdropRef.current.style.background    = 'rgba(0,0,0,0)';
        backdropRef.current.style.pointerEvents = 'none';
      }
      setTimeout(() => {
        onClose();
        if (el) el.style.transform = '';
        if (backdropRef?.current) {
          backdropRef.current.style.background    = '';
          backdropRef.current.style.pointerEvents = '';
        }
      }, 350);
    } else {
      // Torna alla posizione aperta
      el.style.transform = 'translateY(0)';
      if (backdropRef?.current) {
        backdropRef.current.style.background = '';
      }
      setTimeout(() => {
        if (el) el.style.transform = '';
      }, 450);
    }
  }, [drawerRef, backdropRef, onClose]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
