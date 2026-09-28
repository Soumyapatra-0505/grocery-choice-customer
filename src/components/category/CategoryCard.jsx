import React from 'react';
import { Link } from 'react-router-dom';

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/products?category=${category.id}`}
      className="category-card"
      style={{
        backgroundColor: category.color || '#ffffff',
        borderColor: category.borderColor || '#e2e8f0',
        padding: '1.25rem 0.85rem',
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      aria-label={`Shop ${category.name}, ${category.itemCount || 'browse items'}`}
    >
      <div
        className="category-icon-box"
        style={{
          width: '74px',
          height: '74px',
          borderRadius: '50%',
          overflow: 'hidden',
          marginBottom: '0.75rem',
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
          border: '2px solid #ffffff',
          flexShrink: 0
        }}
      >
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', lineHeight: 1.25, marginBottom: '0.2rem' }}>
        {category.name}
      </div>

      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
        {category.itemCount || 'Fresh stock'}
      </div>
    </Link>
  );
}
