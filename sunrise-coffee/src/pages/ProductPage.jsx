import { useParams } from 'react-router-dom';
import ProductDetail from '../components/ProductDetail/ProductDetail';
import { ProductsMarquee } from '../components/Marquee/Marquee';
import { useProduct } from '../hooks/useProducts';

export default function ProductPage() {
  const { slug } = useParams();
  const { product, loading, error } = useProduct(slug);

  return (
    <>
      <ProductDetail product={product} loading={loading} error={error} slug={slug} />
      <ProductsMarquee />
    </>
  );
}
