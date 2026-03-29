import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { useCartContext, useCustomerContext } from '../../context/ShopwareContext';
import CartDrawer from '../CartDrawer/CartDrawer';
import AuthDrawer from '../AuthDrawer/AuthDrawer';
import styles from './Header.module.css';

const MEGA_LINKS = [
  { label: 'Tutti i Prodotti', href: '/collections/all' },
  { label: 'Capperi',          href: '/collections/cappero' },
  { label: 'Cucunci',          href: '/collections/cucunci' },
  { label: 'Foglie',           href: '/collections/foglie' },
  { label: 'Polvere',          href: '/collections/polvere' },
  { label: 'Blog',             href: '/blog' },
  { label: 'Area B2B',         href: '/b2b', b2b: true },
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
        <nav className={styles.navLeft} aria-label="Menu principale">
          <button
            className={styles.shopTrigger}
            onClick={menuOpen ? closeMenu : openMenu}
            aria-expanded={menuOpen}
            aria-controls="megaMenu"
          >
            Menu{' '}
            <span className={styles.triggerIcon}>+</span>
          </button>
          <Link to="/" className={styles.navLink}>Chi siamo</Link>
        </nav>

        <div className={styles.navCenter}>
          <Link to="/">
            <img src="/images/Logo_icona.svg" alt="Capperificio" className={styles.navLogo} />
          </Link>
        </div>

        <nav className={styles.navRight} aria-label="Account e carrello">
          {isLoggedIn ? (
            <Link to="/account" className={styles.navLink}>Account</Link>
          ) : (
            <button className={styles.navLink} onClick={openAuth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Accedi
            </button>
          )}
          <button className={styles.navLink} onClick={openCart} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Carrello ({itemCount})
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
          {MEGA_LINKS.map(({ label, href, b2b }) => (
            <Link
              key={label}
              to={href}
              className={`${styles.megaLink} ${b2b ? styles.megaLinkB2B : ''}`}
              onClick={closeMenu}
            >
              {label} <span className={styles.megaLinkArrow}>&rsaquo;</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
