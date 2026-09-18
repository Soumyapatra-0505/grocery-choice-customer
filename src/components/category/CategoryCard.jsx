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
      }}
      aria-label={`Shop ${category.name}, ${category.itemCount}`}
    >
      <div className="category-icon-box">
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          width="72"
          height="72"
        />
      </div>

      <div className="category-name">{category.name}</div>
      <div className="category-count">{category.itemCount}</div>
    </Link>
  );
}
