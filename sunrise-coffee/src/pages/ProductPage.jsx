import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ProductDetail from '../components/ProductDetail/ProductDetail';
import { ProductsMarquee } from '../components/Marquee/Marquee';
import { useProduct } from '../hooks/useProducts';
import { useSEO } from '../hooks/useSEO';
import { getProductImage } from '../lib/utils/image';

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
    return {
      '@type': 'Product',
      name: productName,
      description: plainDesc,
      image: productImage,
      offers: {
        '@type': 'Offer',
        price: price || 0,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: `https://www.capperificio.it/product/${slug}`,
      },
    };
  }, [product, productName, plainDesc, productImage, price, slug]);

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
