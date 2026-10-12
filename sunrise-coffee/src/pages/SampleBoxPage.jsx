import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { COMPANY } from '../data/company';
import pdp from '../components/ProductDetail/ProductDetail.module.css';
import styles from './SampleBoxPage.module.css';

/* Landing B2B in inglese per i rivenditori (spedizione Belgio / Italia): box campioni
   omaggio, il cliente paga solo la spedizione via Stripe Checkout
   (vedi /api/sample-box in server.js). Non indicizzata: si condivide via link.
   Layout e classi riprendono la scheda prodotto (ProductDetail). */

const PRODUCT_NAME = 'Trade Sample Box';

/* Galleria: per ora segnaposto. Per inserire le foto sostituire `label`
   con `src` (es. '/images/sample-box/01.webp') e un `alt` descrittivo. */
const GALLERY = [
  { label: 'The complete sample box' },
  { label: 'Small capers in vinegar' },
  { label: 'Lilliput capers in sea salt' },
  { label: 'Caper powder' },
  { label: 'Caper berries' },
  { label: 'Caper leaves' },
  { label: 'Caper shoots in vinegar' },
];

const BOX_CONTENTS = [
  {
    name: 'Small Capers in Vinegar',
    text: 'Small-calibre Racale capers marinated in selected white wine vinegar. Ready to use straight from the jar, with a bright acidity that balances the natural savouriness of the caper. Ideal for aperitivo, raw dishes and finger food.',
  },
  {
    name: 'Lilliput Capers in Sea Salt',
    text: 'Our signature: the smallest and most prized calibre (Ø 4–6 mm), hand-graded one by one and layered with whole Apulian sea salt, stirred daily for at least 25 days. Intense, floral, persistent. No additives or preservatives.',
  },
  {
    name: 'Caper Powder',
    text: 'Racale capers slowly dried below 40 °C to preserve the plant’s essential oils, then ground into an extra-fine, sage-green powder. A teaspoon transforms sauces, stocks, butters and raw finishes. 100% natural.',
  },
  {
    name: 'Caper Berries',
    text: 'The fruit of the caper plant (“cucunci”): buds left to flower that grow into elongated berries with tender flesh and crunchy seeds. Softer and fruitier than the caper, with a unique wild note. Perfect on charcuterie and cheese boards.',
  },
  {
    name: 'Caper Leaves',
    text: 'The least-known part of the plant and a rising star in modern kitchens. Only young, tender leaves are picked between May and September. Fresh, mineral taste with a light bitterness: excellent fried in batter, in rolls or chopped over tartare.',
  },
  {
    name: 'Caper Shoots in Vinegar',
    text: 'The tender tips of the caper plant, hand-picked and preserved in vinegar. A crunchy, herbaceous speciality of the Salento tradition, great in salads, on bruschetta and alongside fish.',
  },
];

const DETAILS = [
  ['Producer', 'Capperificio Caro — family business'],
  ['Origin', 'Racale (Salento, Apulia, Italy)'],
  ['Contents', '6 specialities, one sample of each'],
  ['Formats available', 'Retail jars & HoReCa packaging'],
  ['Samples', 'Complimentary'],
  ['You pay', 'Courier shipping only'],
  ['Shipping', 'Belgium €25 · Italy €10'],
];

const STEPS = [
  ['Pay the shipping', 'Secure payment by card or wallet through Stripe. Enter your company and delivery details at checkout.'],
  ['We prepare your box', 'We pack one sample of each of our six specialities, straight from our facility in Racale.'],
  ['Taste & test the market', 'Try the products with your team and customers, then let’s talk about a first trial order in retail or HoReCa formats.'],
];

function formatEur(amount) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function GalleryItem({ item, className, imgClassName, eager }) {
  return (
    <div className={className}>
      {item.src ? (
        <img
          src={item.src}
          alt={item.alt || item.label}
          className={imgClassName}
          width="900"
          height="900"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
      ) : (
        <div className={styles.placeholder} role="img" aria-label={item.label}>
          <span className={styles.placeholderLabel}>{item.label}</span>
        </div>
      )}
    </div>
  );
}

export default function SampleBoxPage() {
  const navigate = useNavigate();
  const [shipping, setShipping] = useState({ loading: true, options: [] });
  const [country, setCountry] = useState('BE');
  const [openItem, setOpenItem] = useState(BOX_CONTENTS[0].name);

  useSEO({
    title: 'Trade Sample Box',
    description: 'Six specialities from Capperificio Caro, Racale (Salento): complimentary trade samples for retailers and HoReCa. You only pay for shipping.',
    path: '/sample-box',
    noindex: true,
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/sample-box')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((d) => { if (!cancelled) setShipping({ loading: false, options: d.options || [] }); })
      .catch(() => { if (!cancelled) setShipping({ loading: false, options: [] }); });
    return () => { cancelled = true; };
  }, []);

  // Nessun carrello: si va dritti al checkout dedicato col paese già scelto.
  const goToCheckout = () => navigate(`/sample-box/checkout?country=${country}`);

  const quoteHref = `mailto:${COMPANY.emailB2B}?subject=${encodeURIComponent('Sample box — shipping quote')}`;
  /* Se l'API non risponde resta il contatto via email. */
  const selected = shipping.options.find((o) => o.country === country);
  const priceLabel = shipping.loading
    ? ' '
    : selected
      ? `${formatEur(selected.amount)} shipping to ${selected.label}`
      : 'Shipping quote on request';

  const countryPicker = shipping.options.length > 0 && (
    <div className={pdp.optionGroups}>
      <p className={styles.pickerLabel}>Ship to</p>
      <div className={pdp.optionChips}>
        {shipping.options.map((o) => (
          <button
            key={o.country}
            className={`${pdp.optionChip} ${o.country === country ? pdp.optionChipSelected : ''}`}
            aria-pressed={o.country === country}
            onClick={() => setCountry(o.country)}
          >
            {o.label} · {formatEur(o.amount)}
          </button>
        ))}
      </div>
    </div>
  );

  const cta = selected ? (
    <button className={pdp.btnAddCart} onClick={goToCheckout}>
      Request the box <span>→</span> {formatEur(selected.amount)}
    </button>
  ) : (
    <a className={pdp.btnAddCart} href={quoteHref} aria-disabled={shipping.loading}>
      Request shipping quote <span>→</span>
    </a>
  );

  const purchasePanel = (
    <>
      <p className={pdp.pdpTitle} aria-hidden="true">{PRODUCT_NAME}</p>
      <span className={pdp.calibroTag}>6 specialities</span>
      <p className={styles.lead}>
        Complimentary samples of our full range. <strong>You only cover the shipping</strong> to your address.
      </p>
      <div className={pdp.pdpPrice}>
        <span className={styles.freeBadge}>Samples free</span> {priceLabel}
      </div>

      {countryPicker}

      {cta}

      <ul className={styles.trustList}>
        <li>Secure payment via Stripe</li>
        <li>Tracked courier delivery</li>
        <li>Hand-picked in Racale, Salento</li>
      </ul>

      <p className={styles.contact}>
        Questions? Write to <a href={`mailto:${COMPANY.emailB2B}`}>{COMPANY.emailB2B}</a>
      </p>
    </>
  );

  return (
    <>
      <h1 className="sr-only">{PRODUCT_NAME} — Capperificio Caro</h1>

      <div className={pdp.breadcrumb}>
        <span>Capperificio Caro</span><span className={pdp.sep}>/</span>
        <span>Trade</span><span className={pdp.sep}>/</span>
        <span>{PRODUCT_NAME}</span>
      </div>

      <section className={`${pdp.productSection} ${styles.section}`}>
        {/* ── Sinistra: descrizione e contenuto del box ── */}
        <div className={pdp.colLeft}>
          <p className={pdp.description}>
            A taste of <em>Racale</em>, in one box. Capperificio Caro is a family business in the heart of
            Salento, where we hand-pick and grade our capers by calibre. This box gathers <em>all our
            specialities</em> so you can evaluate them for your shelves and for the HoReCa channel.
          </p>

          <div className={pdp.sectionTitle}>What&apos;s inside the box</div>
          <div className={`${pdp.brewAccordion} ${styles.contentsAccordion}`}>
            {BOX_CONTENTS.map(({ name, text }, i) => {
              const isOpen = openItem === name;
              return (
                <div key={name} className={pdp.brewItem}>
                  <button
                    className={pdp.brewToggle}
                    onClick={() => setOpenItem(isOpen ? null : name)}
                    aria-expanded={isOpen}
                  >
                    <span><span className={styles.itemNum}>{String(i + 1).padStart(2, '0')}</span>{name}</span>
                    <span className={`${pdp.brewIcon} ${isOpen ? pdp.brewIconOpen : ''}`}>+</span>
                  </button>
                  {isOpen && <div className={pdp.brewContent}><p>{text}</p></div>}
                </div>
              );
            })}
          </div>

          <div className={pdp.sectionTitle}>Details</div>
          <table className={pdp.infoTable}>
            <tbody>
              {DETAILS.map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v}</td></tr>
              ))}
            </tbody>
          </table>

          <div className={pdp.sectionTitle}>How it works</div>
          <ol className={styles.steps}>
            {STEPS.map(([title, text]) => (
              <li key={title}>
                <strong>{title}</strong>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Centro: galleria ── */}
        <div className={pdp.colCenter}>
          <div className={pdp.desktopImages}>
            {GALLERY.map((item, i) => (
              <GalleryItem key={i} item={item} className={pdp.productImage} imgClassName={pdp.pdpImg} eager={i === 0} />
            ))}
          </div>
          <div className={styles.mobileGallery}>
            {GALLERY.map((item, i) => (
              <GalleryItem key={i} item={item} className={styles.mobileSlide} imgClassName={styles.mobileSlideImg} eager={i === 0} />
            ))}
          </div>
          <div className={pdp.mobileInfo}>{purchasePanel}</div>
        </div>

        {/* ── Destra: pannello pagamento ── */}
        <div className={pdp.colRight}>{purchasePanel}</div>
      </section>

      <div className={`${pdp.mobileSticky} ${pdp.mobileStickyShow}`}>
        <div className={pdp.mobileStickyInner}>
          <div>
            <div className={pdp.mobileStickyName}>{PRODUCT_NAME}</div>
            <div className={pdp.mobileStickyPrice}>{priceLabel}</div>
          </div>
          {selected ? (
            <button className={pdp.mobileStickyBtn} onClick={goToCheckout}>Request the box</button>
          ) : (
            <a className={pdp.mobileStickyBtn} href={quoteHref}>Get a quote</a>
          )}
        </div>
      </div>
    </>
  );
}
