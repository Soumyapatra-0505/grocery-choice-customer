import React from 'react';
import ProductCard from './ProductCard';
import { PackageOpen } from 'lucide-react';

export default function ProductGrid({
  products = [],
  emptyTitle = 'No products found',
  emptyMessage = 'Try adjusting your filters or search keywords.',
  onResetFilters
}) {
  if (products.length === 0) {
    return (
      <div
        style={{
          padding: '4rem 1.5rem',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          margin: '1.5rem 0'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: '#64748b'
          }}
        >
          <PackageOpen size={32} />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
          {emptyTitle}
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
          {emptyMessage}
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="btn btn-secondary"
            style={{ margin: '0 auto' }}
          >
            Reset All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="product-grid" role="region" aria-label="Product list">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
