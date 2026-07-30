import { useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductDetail from '../components/ProductDetail/ProductDetail';
import { ProductsMarquee } from '../components/Marquee/Marquee';
import { useProduct } from '../hooks/useProducts';
import { useSEO } from '../hooks/useSEO';
import { getProductImage } from '../lib/utils/image';
import { gtmViewItem } from '../lib/utils/gtm';
import { isProductAvailable } from '../lib/utils/availability';
import { COMPANY } from '../data/company';

/* Soglia di spedizione gratuita: deve restare allineata a CheckoutPage. */
const FREE_SHIPPING_MIN = 50;

/* Tariffa di spedizione standard sotto soglia, in EUR.
   Oggi il costo lo calcola il corriere in checkout in base a peso e
   destinazione, quindi non lo dichiariamo: annunciare 0 sarebbe falso e
   Merchant Center penalizza i dati che non combaciano col checkout.
   Se in futuro adotti una tariffa fissa, mettila qui e finirà nello schema. */
const STANDARD_SHIPPING_RATE = null;

/* I prezzi restano validi fino a fine anno solare: Google richiede
   priceValidUntil per mostrare il prezzo nelle rich result. */
function priceValidUntil() {
  return `${new Date().getFullYear()}-12-31`;
}

export default function ProductPage() {
  const { slug } = useParams();
  const { product, loading, error } = useProduct(slug);

  const productName = product?.translated?.name || product?.name || '';
  const productDesc = product?.translated?.description || product?.description || '';
  const plainDesc = productDesc.replace(/<[^>]*>/g, '').slice(0, 160);
  const productImage = product ? getProductImage(product) : undefined;
  const price = product?.calculatedPrice?.unitPrice || product?.price?.[0]?.gross;

  const jsonLd = useMemo(() => {
    if (!product) return null;

    const productUrl = `${COMPANY.siteUrl}/product/${slug}`;
    const inStock = isProductAvailable(product);
    const sku = product.productNumber || product.id;
    const gtin = product.ean || undefined;

    return {
      '@type': 'Product',
      name: productName,
      description: plainDesc,
      image: productImage,
      sku,
      ...(gtin ? { gtin13: gtin } : {}),
      mpn: sku,
      brand: { '@type': 'Brand', name: COMPANY.brand },
      offers: {
        '@type': 'Offer',
        url: productUrl,
        price: price ?? 0,
        priceCurrency: 'EUR',
        priceValidUntil: priceValidUntil(),
        itemCondition: 'https://schema.org/NewCondition',
        availability: inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: COMPANY.legalNameShort },

        /* Spedizione e resi dichiarati nello schema: Google li mostra
           direttamente in scheda invece di lasciarli come "sorpresa". */
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          ...(STANDARD_SHIPPING_RATE != null
            ? {
                shippingRate: {
                  '@type': 'MonetaryAmount',
                  value: STANDARD_SHIPPING_RATE,
                  currency: 'EUR',
                },
              }
            : {}),
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'IT',
          },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
            transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' },
          },
          /* Sopra questa soglia la spedizione è gratuita (vedi Termini). */
          freeShippingThreshold: {
            '@type': 'MonetaryAmount',
            value: FREE_SHIPPING_MIN,
            currency: 'EUR',
          },
        },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'IT',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 14,
          returnMethod: 'https://schema.org/ReturnByMail',
          returnFees: 'https://schema.org/ReturnShippingFees',
        },
      },
    };
  }, [product, productName, plainDesc, productImage, price, slug]);

  useEffect(() => {
    if (!product) return;
    gtmViewItem({ id: product.id, name: productName, price: price ?? 0 });
  }, [product?.id]);

  useSEO({
    title: productName || 'Prodotto',
    description: plainDesc || (productName ? `Scopri ${productName} — capperi artigianali dal Salento.` : undefined),
    path: `/product/${slug}`,
    image: productImage,
    type: 'product',
    jsonLd,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Tutti i Prodotti', path: '/collections/all' },
      { name: productName || 'Prodotto', path: `/product/${slug}` },
    ],
  });

  return (
    <>
      <ProductDetail product={product} loading={loading} error={error} slug={slug} />
      <ProductsMarquee />
    </>
  );
}
