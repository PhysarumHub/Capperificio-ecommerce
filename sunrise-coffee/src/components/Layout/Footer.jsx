import { Link } from 'react-router-dom';
import { FacebookIcon, InstagramIcon, TikTokIcon, YouTubeIcon, WhatsAppIcon, EmailIcon } from '../Icons';
import styles from './Footer.module.css';

const PAYMENT_METHODS = [
  { label: 'VISA', bg: '#1A1F71' },
  { label: 'MC',   bg: '#EB001B' },
  { label: 'AMEX', bg: '#006FCF' },
  { label: 'PAY',  bg: '#003087' },
  { label: 'DIN',  bg: '#0079BE' },
  { label: 'DISC', bg: '#FF6000' },
];

const LINKS_COL1 = ['Tutti i prodotti', 'Capperi', 'Cucunci', 'Foglie', 'Polvere'];
const LINKS_COL2 = ['Chi siamo', 'Contatti', 'FAQ', 'Area B2B', 'Gestione cookie'];

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
          {LINKS_COL1.map((t) => (
            <li key={t}><Link to="/">{t}</Link></li>
          ))}
        </ul>

        <ul className={styles.links}>
          {LINKS_COL2.map((t) => (
            <li key={t}>
              {t === 'Gestione cookie' ? (
                <a href="#" onClick={(e) => { e.preventDefault(); window.CapperificioConsent?.openSettings(); }}>{t}</a>
              ) : (
                <Link to="/">{t}</Link>
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
