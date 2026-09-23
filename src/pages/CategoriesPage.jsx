import React from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import { ArrowRight, Sparkles, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function CategoriesPage() {
  const { categories, products, loading, error, refreshCatalog } = useCatalog();

  return (
    <div className="categories-page container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
          border: '1px solid #a7f3d0',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          marginBottom: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#047857', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <Sparkles size={16} /> Complete Grocery Departments
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#065f46', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Explore All Categories
          </h1>
          <p style={{ color: '#047857', fontSize: '1rem', maxWidth: '560px', lineHeight: 1.5 }}>
            From farm-fresh produce to pantry staples and hygiene supplies, choose your category and discover curated high quality goods.
          </p>
        </div>

        <Link
          to="/products"
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}
        >
          <span>View All {products.length > 0 ? `${products.length} ` : ''}Products</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            fontSize: '0.95rem',
            fontWeight: 600
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} />
            <span>Unable to connect to Grocery Choice server.</span>
          </div>
          <button
            type="button"
            onClick={() => refreshCatalog()}
            style={{
              background: '#b91c1c',
              color: '#ffffff',
              border: 'none',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && categories.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading categories from Grocery Choice server...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && categories.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <Layers size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>No Categories Available</h3>
          <p style={{ color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            There are currently no active categories listed in the catalog.
          </p>
          <button
            type="button"
            onClick={() => refreshCatalog()}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={15} /> Refresh Catalog
          </button>
        </div>
      )}

      {/* Categories Visual Grid */}
      {categories.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {categories.map((cat) => {
            const count = products.filter(
              (p) => String(p.categoryId) === String(cat.id) || p.category === cat.slug
            ).length;

            return (
              <div
                key={cat.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(5, 150, 105, 0.12)';
                  e.currentTarget.style.borderColor = '#a7f3d0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.04)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{ height: '180px', overflow: 'hidden', position: 'relative', backgroundColor: '#f1f5f9' }}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(4px)',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#059669',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                    }}
                  >
                    {count > 0 ? `${count} items` : 'Curated'}
                  </div>
                </div>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                    {cat.name}
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem', flex: 1 }}>
                    {cat.description || 'Explore fresh essentials and daily necessities in this department.'}
                  </p>

                  <Link
                    to={`/products?category=${cat.id}`}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
                  >
                    <span>Browse {cat.shortName || cat.name}</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

