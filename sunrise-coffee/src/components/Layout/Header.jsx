import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { SunLogo } from '../Icons';
import { useCartContext, useCustomerContext } from '../../context/ShopwareContext';
import CartDrawer from '../CartDrawer/CartDrawer';
import AuthDrawer from '../AuthDrawer/AuthDrawer';
import styles from './Header.module.css';

const MEGA_LINKS = [
  { label: 'All Coffee', href: '/collections/all' },
  { label: 'Espresso', href: '/collections/espresso' },
  { label: 'Filter', href: '/collections/filter' },
  { label: 'Single Origin', href: '/collections/single-origin' },
  { label: 'Blend', href: '/collections/blend' },
  { label: 'Full List', href: '/collections/all' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { itemCount } = useCartContext();
  const { isLoggedIn } = useCustomerContext();

  const openCart = useCallback(() => {
    setCartOpen(true);
    setMenuOpen(false);
  }, []);

  const closeCart = useCallback(() => setCartOpen(false), []);

  const openAuth = useCallback(() => {
    setAuthOpen(true);
    setMenuOpen(false);
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const openMenu = useCallback(() => {
    setMenuOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeMenu]);

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.navLeft}>
          <button
            className={styles.shopTrigger}
            onClick={menuOpen ? closeMenu : openMenu}
            aria-expanded={menuOpen}
            aria-controls="megaMenu"
          >
            Menu{' '}
            <span className={styles.triggerIcon}>+</span>
          </button>
          <Link to="/" className={styles.navLink}>About</Link>
        </nav>

        <div className={styles.navCenter}>
          <Link to="/">
            <SunLogo className={styles.navSun} />
          </Link>
        </div>

        <nav className={styles.navRight}>
          {isLoggedIn ? (
            <Link to="/account" className={styles.navLink}>Account</Link>
          ) : (
            <button className={styles.navLink} onClick={openAuth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Login
            </button>
          )}
          <button className={styles.navLink} onClick={openCart} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Cart ({itemCount})
          </button>
        </nav>
      </header>

      <CartDrawer open={cartOpen} onClose={closeCart} />
      <AuthDrawer open={authOpen} onClose={closeAuth} />

      {/* Menu drawer */}
      <div
        className={`${styles.megaBackdrop} ${menuOpen ? styles.megaBackdropOpen : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />
      <div
        id="megaMenu"
        className={`${styles.megaMenu} ${menuOpen ? styles.megaMenuOpen : ''}`}
        role="dialog"
        aria-label="Navigazione"
        aria-modal="true"
      >
        <div className={styles.megaDrawerHeader}>
          <span className={styles.megaDrawerTitle}>Menu</span>
          <button className={styles.megaCloseBtn} onClick={closeMenu} aria-label="Chiudi menu">✕</button>
        </div>
        <nav className={styles.megaLinks}>
          {MEGA_LINKS.map(({ label, href }) => (
            <Link key={label} to={href} className={styles.megaLink} onClick={closeMenu}>
              {label} <span className={styles.megaLinkArrow}>&rsaquo;</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
