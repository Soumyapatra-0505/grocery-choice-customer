import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { products } from '../data/products';
import ProductDetails from '../components/product/ProductDetails';
import ProductGrid from '../components/product/ProductGrid';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function ProductDetailsPage() {
  const { id } = useParams();

  const product = useMemo(() => {
    return products.find((p) => p.id === id);
  }, [id]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product]);

  if (!product) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <AlertCircle size={32} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
          Product Not Found
        </h1>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
          The item you are looking for might have been moved or is currently unavailable.
        </p>
        <Link to="/products" className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Browse All Products</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="product-details-page container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Product Primary Details */}
      <ProductDetails product={product} />

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section aria-labelledby="related-heading" style={{ marginTop: '4rem' }}>
          <div className="section-header">
            <div className="section-title-wrap">
              <h2 id="related-heading" style={{ fontSize: '1.4rem' }}>
                Similar in {product.categoryName}
              </h2>
              <p className="section-subtitle">Customers who looked at this item also bought these</p>
            </div>
            <Link to={`/products?category=${product.category}`} className="view-all-link">
              <span>View All</span>
            </Link>
          </div>

          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
