import { Link } from 'react-router-dom';
import { FacebookIcon, InstagramIcon, TikTokIcon, YouTubeIcon, WhatsAppIcon, EmailIcon } from '../Icons';
import { COMPANY } from '../../data/company';
import styles from './Footer.module.css';

const PAYMENT_METHODS = [
  { label: 'VISA', bg: '#1A1F71' },
  { label: 'MC',   bg: '#EB001B' },
  { label: 'AMEX', bg: '#006FCF' },
  { label: 'PAY',  bg: '#003087' },
  { label: 'DIN',  bg: '#0079BE' },
  { label: 'DISC', bg: '#FF6000' },
];

const LINKS_COL1 = [
  { label: 'Home',                href: '/' },
  { label: 'I nostri prodotti',   href: '/collections/all' },
  { label: 'Storia',              href: '/storia' },
  { label: 'Territorio',          href: '/territorio' },
  { label: 'Processo produttivo', href: '/processo-produttivo' },
];

const LINKS_COL2 = [
  { label: 'Blog',             href: '/blog' },
  { label: 'Area B2B',         href: '/b2b' },
  { label: 'Contatti',         href: '/contatti' },
  { label: 'FAQ',              href: '/faq' },
  { label: 'Gestione cookie',  href: '#', cookie: true },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy',        href: '/privacy-policy' },
  { label: 'Cookie Policy',         href: '/cookie-policy' },
  { label: 'Termini e Condizioni',  href: '/termini-e-condizioni' },
];

const SOCIAL_ICONS = [
  { Icon: FacebookIcon,  label: 'Facebook' },
  { Icon: InstagramIcon, label: 'Instagram' },
  { Icon: TikTokIcon,    label: 'TikTok' },
  { Icon: YouTubeIcon,   label: 'YouTube' },
  { Icon: WhatsAppIcon,  label: 'WhatsApp' },
  { Icon: EmailIcon,     label: 'Email' },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>

        <p className={styles.desc}>
          Capperi, cucunci e foglie di Racale. Artigianali, autentici, con tre generazioni di storia alle spalle.
        </p>

        <ul className={styles.links}>
          {LINKS_COL1.map(({ label, href }) => (
            <li key={label}><Link to={href}>{label}</Link></li>
          ))}
        </ul>

        <ul className={styles.links}>
          {LINKS_COL2.map(({ label, href, cookie }) => (
            <li key={label}>
              {cookie ? (
                <a href="#" onClick={(e) => { e.preventDefault(); window.CapperificioConsent?.openSettings(); }}>{label}</a>
              ) : (
                <Link to={href}>{label}</Link>
              )}
            </li>
          ))}
        </ul>

        <div className={styles.socials}>
          {SOCIAL_ICONS.map(({ Icon, label }) => (
            <a key={label} href="#" className={styles.socialLink} aria-label={label}>
              <Icon />
            </a>
          ))}
        </div>
      </div>

      <div className={styles.legalRow}>
        <ul className={styles.legalLinks}>
          {LEGAL_LINKS.map(({ label, href }) => (
            <li key={label}><Link to={href}>{label}</Link></li>
          ))}
        </ul>
        <p className={styles.legalInfo}>
          {COMPANY.legalNameShort} — {COMPANY.addressLine}<br />
          P.IVA e C.F. {COMPANY.vat} — REA {COMPANY.rea} — PEC{' '}
          <a href={`mailto:${COMPANY.pec}`}>{COMPANY.pec}</a>
        </p>
      </div>

      <div className={styles.bottom}>
        <div className={styles.copy}>
          &copy; 2026. Capperificio di Racale.<br />Tutti i diritti riservati.
        </div>
        <div className={styles.payments}>
          {PAYMENT_METHODS.map(({ label, bg }) => (
            <span key={label} className={styles.payIcon} style={{ background: bg }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.tagline}>
        <img src="/images/Scritta_caro.svg" alt="Capperificio di Racale" className={styles.scrittaCaro} loading="lazy" />
      </div>
    </footer>
  );
}
