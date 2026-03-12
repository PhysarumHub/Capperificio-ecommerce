import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { SunLogo } from '../Icons';
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
            Shop{' '}
            <span className={`${styles.triggerIcon} ${menuOpen ? styles.triggerIconOpen : ''}`}>+</span>
          </button>
          <Link to="/" className={styles.navLink}>Blog</Link>
          <Link to="/" className={styles.navLink}>About</Link>
        </nav>

        <div className={styles.navCenter}>
          <Link to="/">
            <SunLogo className={styles.navSun} />
          </Link>
        </div>

        <nav className={styles.navRight}>
          <Link to="/" className={styles.navLink}>Search</Link>
          <Link to="/" className={styles.navLink}>Cart (0)</Link>
        </nav>
      </header>

      {/* Mega menu */}
      <div
        className={`${styles.megaBackdrop} ${menuOpen ? styles.megaBackdropOpen : ''}`}
        onClick={closeMenu}
      />
      <div
        id="megaMenu"
        className={`${styles.megaMenu} ${menuOpen ? styles.megaMenuOpen : ''}`}
        role="dialog"
        aria-label="Shop navigation"
      >
        <div className={styles.megaLeft}>
          <div className={styles.megaNavLabel}>Shop</div>
          <nav className={styles.megaLinks}>
            {MEGA_LINKS.map(({ label, href }) => (
              <Link key={label} to={href} className={styles.megaLink} onClick={closeMenu}>
                {label} <span className={styles.megaLinkArrow}>&rsaquo;</span>
              </Link>
            ))}
          </nav>
          <button className={styles.megaCloseBtn} onClick={closeMenu}>
            Close &times;
          </button>
        </div>
        <div className={styles.megaCenter}>
          <img src="/images/CAPPERI.jpg" alt="Featured product" className={styles.megaCenterImg} />
        </div>
        <div className={styles.megaRight}>
          <img src="/images/CAPPERI.jpg" alt="Coffee drip" className={styles.megaRightImg} />
        </div>
      </div>
    </>
  );
}
