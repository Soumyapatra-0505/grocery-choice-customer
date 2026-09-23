import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import { productApi } from '../services/api';
import ProductDetails from '../components/product/ProductDetails';
import ProductGrid from '../components/product/ProductGrid';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { products } = useCatalog();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await productApi.getById(id);
      setProduct(data);
    } catch (err) {
      const cached = products.find((p) => String(p.id) === String(id));
      if (cached) {
        setProduct(cached);
      } else {
        setError(err.message || 'Unable to connect to Grocery Choice server.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, products]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!id) return;
      try {
        setError(null);
        const data = await productApi.getById(id);
        if (!ignore) setProduct(data);
      } catch (err) {
        if (!ignore) {
          const cached = products.find((p) => String(p.id) === String(id));
          if (cached) {
            setProduct(cached);
          } else {
            setError(err.message || 'Unable to connect to Grocery Choice server.');
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id, products]);


  const relatedProducts = useMemo(() => {
    if (!product || !products.length) return [];
    return products
      .filter((p) => {
        const matchCat =
          (product.categoryId && String(p.categoryId) === String(product.categoryId)) ||
          p.category === product.category;
        return matchCat && String(p.id) !== String(product.id);
      })
      .slice(0, 4);
  }, [product, products]);

  if (loading && !product) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div
          className="spinner"
          style={{
            margin: '0 auto 1.5rem',
            width: '44px',
            height: '44px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#059669',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Loading product details...</h2>
        <p style={{ color: '#64748b' }}>Fetching live information from Grocery Choice server</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div
          role="alert"
          style={{
            maxWidth: '540px',
            margin: '0 auto',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}
          >
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#b91c1c', marginBottom: '0.5rem' }}>
            Unable to connect to Grocery Choice server.
          </h2>
          <p style={{ color: '#7f1d1d', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
            We could not retrieve this product's details right now. Please check if the backend service is running.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={fetchProduct}
              className="btn btn-primary"
              style={{ backgroundColor: '#b91c1c', borderColor: '#b91c1c' }}
            >
              <RefreshCw size={15} />
              <span>Retry</span>
            </button>
            <Link to="/products" className="btn btn-secondary">
              <span>Back to Products</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}
        >
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
            <Link
              to={`/products?category=${product.categoryId || product.category}`}
              className="view-all-link"
            >
              <span>View All</span>
            </Link>
          </div>

          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}

