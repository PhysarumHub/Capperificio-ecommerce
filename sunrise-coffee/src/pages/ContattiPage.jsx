import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { COMPANY } from '../data/company';
import { FacebookIcon, InstagramIcon } from '../components/Icons';
import contentStyles from './ContentPage.module.css';
import styles from './ContattiPage.module.css';

const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY.addressLine)}`;

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21l1.65-4.95A8.5 8.5 0 1 1 8.5 19.5L3 21Z" />
      <path d="M8.5 9.5c0 3.5 2.5 6 6 6 .5 0 1-.5 1-1v-.9c0-.3-.2-.5-.5-.6l-1.8-.5c-.3-.1-.5 0-.7.2l-.4.5a5 5 0 0 1-2.8-2.8l.5-.4c.2-.2.3-.4.2-.7l-.5-1.8c-.1-.3-.3-.5-.6-.5H8.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

const METHODS = [
  {
    icon: <MailIcon />,
    label: 'Informazioni generali',
    desc: 'Prodotti, catalogo, curiosità sul Capperificio.',
    cta: COMPANY.email,
    href: `mailto:${COMPANY.email}`,
  },
  {
    icon: <WhatsAppIcon />,
    label: 'Assistenza diretta',
    desc: 'Risposta rapida su WhatsApp.',
    cta: 'Scrivici su WhatsApp',
    href: COMPANY.whatsappLink,
    external: true,
  },
];

export default function ContattiPage() {
  useSEO({
    title: 'Contatti',
    description: `Come contattare ${COMPANY.brand}: email, sede a Racale (Salento) e social.`,
    path: '/contatti',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Contatti', path: '/contatti' },
    ],
  });

  return (
    <div className={contentStyles.page}>
      <header className={contentStyles.hero}>
        <div className={contentStyles.heroInner}>
          <span className={contentStyles.tag}>
            <span className={contentStyles.tagDot} />
            Assistenza
          </span>
          <h1 className={contentStyles.title}>Parliamone</h1>
          <p className={contentStyles.intro}>
            Siamo a Racale, nel Salento. Scrivici o passa a trovarci — qui sotto tutti i modi per
            raggiungerci.
          </p>
        </div>
      </header>

      <div className={contentStyles.body}>
        <section className={styles.section}>
          <div className={styles.methods}>
            {METHODS.map(({ icon, label, desc, cta, href, external }) => (
              <a
                key={label}
                href={href}
                className={styles.methodCard}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                <span className={styles.methodIcon} aria-hidden="true">{icon}</span>
                <div>
                  <p className={styles.methodLabel}>{label}</p>
                  <p className={styles.methodDesc}>{desc}</p>
                </div>
                <span className={styles.methodEmail}>{cta}</span>
              </a>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>
            <span className={styles.sectionLabelDot} />
            Dove siamo
          </p>
          <p className={styles.whereIntro}>
            Il Capperificio ha sede a Racale, nel cuore del Salento.
          </p>
          <div className={styles.mapWrap}>
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(COMPANY.addressLine)}&z=15&output=embed`}
              title="Mappa: sede del Capperificio di Racale"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className={styles.mapFrame}
            />
          </div>
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Apri in Google Maps
          </a>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>
            <span className={styles.sectionLabelDot} />
            Seguici
          </p>
          <div className={styles.socials}>
            <a
              href="https://www.facebook.com/p/Capperificio-Caro-100093341396615/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Facebook"
            >
              <FacebookIcon />
            </a>
            <a
              href="https://www.instagram.com/capperificiocaro/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Instagram"
            >
              <InstagramIcon />
            </a>
          </div>
        </section>

        <div className={styles.cta}>
          <p className={styles.ctaTitle}>Spedizioni, resi o pagamenti?</p>
          <p className={styles.ctaDesc}>Prova prima a dare un'occhiata alle domande frequenti.</p>
          <Link to="/faq" className={styles.ctaBtn}>Vai alle FAQ &rarr;</Link>
        </div>
      </div>
    </div>
  );
}
