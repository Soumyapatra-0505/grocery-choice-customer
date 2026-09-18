import React from 'react';
import { NavLink } from 'react-router-dom';
import { categories } from '../../data/categories';
import { Tag, LayoutGrid } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="app-navbar" aria-label="Product categories navigation">
      <div className="container">
        <div className="navbar-inner">
          <NavLink
            to="/categories"
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            style={{ fontWeight: 700, color: '#059669' }}
          >
            <LayoutGrid size={15} />
            <span>All Categories</span>
          </NavLink>

          <NavLink
            to="/products"
            end
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
          >
            <span>All Products</span>
          </NavLink>

          <NavLink
            to="/products?deal=true"
            className="navbar-link"
            style={{ color: '#d97706' }}
          >
            <Tag size={14} />
            <span>Hot Deals</span>
          </NavLink>

          {categories.map((cat) => (
            <NavLink
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              <span>{cat.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
