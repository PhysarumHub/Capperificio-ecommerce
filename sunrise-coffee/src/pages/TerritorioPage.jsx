import { useSEO } from '../hooks/useSEO';
import styles from './TerritorioPage.module.css';

const TERRITORIO_JSON_LD = {
  '@type': 'WebPage',
  name: 'Il Nostro Territorio — Capperificio Caro',
  description: 'Il Salento, la terra del cappero. Tre generazioni, una filiera corta, un territorio che si racconta in ogni bocciolo.',
};

const GALLERY = [
  { img: '/images/territorio/capperificio-caro-raccolta.webp', alt: 'La raccolta dei capperi nei campi di Racale' },
  { img: '/images/territorio/capperificio-caro-lavorazione-jul-23.webp', alt: 'Lavorazione artigianale dei capperi' },
  { img: '/images/territorio/capperificio-caro-capperi.webp', alt: 'I capperi del Salento appena raccolti' },
  { img: '/images/territorio/raccolta-capperificio-caro-lug-12-2024.webp', alt: 'Raccolta dei capperi, luglio 2024' },
  { img: '/images/territorio/capperificio-caro-lavorazione-jul-23-1.webp', alt: 'Mani al lavoro nella lavorazione dei capperi' },
  { img: '/images/territorio/capperificio-caro-raccolta-2024.webp', alt: 'Campo di capperi durante la raccolta 2024' },
  { img: '/images/territorio/lavorazione-capperificio-caro-23-lug-2024.webp', alt: 'Fase di lavorazione del cappero' },
  { img: '/images/territorio/raccolta-capperificio-caro-lug-12-2024-1.webp', alt: 'Cesti di capperi appena raccolti' },
  { img: '/images/territorio/capperificio-caro-raccolta-2024-1.webp', alt: 'Raccolta manuale dei capperi' },
  { img: '/images/territorio/capperificio-caro-raccolta-jul-12-2024.webp', alt: 'Il cappero sulla pianta, pronto per la raccolta' },
  { img: '/images/territorio/capperi-condivisione-pubblica-giugno-11-2025.webp', alt: 'Un momento di condivisione al Capperificio Caro' },
  { img: '/images/territorio/foto-lug-29-2024-da-aruba-drive.webp', alt: 'Vista del territorio di Racale, nel Salento' },
];

export default function TerritorioPage() {
  useSEO({
    title: 'Il Nostro Territorio',
    description: 'Il Salento, la terra del cappero. Tre generazioni, una filiera corta e trasparente, un territorio che si racconta in ogni bocciolo di Racale.',
    path: '/territorio',
    jsonLd: TERRITORIO_JSON_LD,
  });

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <img
          className={styles.heroImg}
          src="/images/territorio/hero-raccolta.png"
          alt="Raccolta dei capperi nel Salento"
          loading="eager"
          decoding="async"
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Racale, Salento</span>
          <h1 className={styles.heroTitle}>Il Nostro Territorio</h1>
          <p className={styles.heroDesc}>
            Il Salento, la terra del cappero. Tre generazioni, una filiera corta e
            trasparente, un territorio che si racconta in ogni bocciolo.
          </p>
        </div>
      </section>

      <section className={styles.gallerySection} aria-label="Galleria fotografica del territorio">
        <div className={styles.galleryGrid}>
          {GALLERY.map((item, i) => (
            <figure className={styles.galleryItem} key={item.img}>
              <img
                src={item.img}
                alt={item.alt}
                loading={i < 3 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
