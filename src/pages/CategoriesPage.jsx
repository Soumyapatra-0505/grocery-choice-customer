import React from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../data/categories';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CategoriesPage() {
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
          <span>View All 24+ Products</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* 8 Categories Visual Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {categories.map((cat) => (
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
                {cat.itemCount}
              </div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                {cat.name}
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem', flex: 1 }}>
                {cat.description}
              </p>

              <Link
                to={`/products?category=${cat.id}`}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
              >
                <span>Browse {cat.shortName}</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
