import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext';
import { Tag, LayoutGrid } from 'lucide-react';

const DEFAULT_DEPARTMENTS = [
  { id: 'fruits-vegetables', name: 'Fruits & Vegetables' },
  { id: 'rice-atta-grains', name: 'Rice, Atta & Grains' },
  { id: 'dairy-breakfast', name: 'Dairy & Breakfast' },
  { id: 'snacks', name: 'Snacks' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'personal-care', name: 'Personal Care' },
  { id: 'household-essentials', name: 'Household Essentials' },
  { id: 'cleaning-supplies', name: 'Cleaning Supplies' }
];

export default function Navbar() {
  const { categories } = useCatalog();

  const displayCategories = categories && categories.length > 0 ? categories : DEFAULT_DEPARTMENTS;

  return (
    <nav className="app-navbar" aria-label="Product categories navigation">
      <div className="container">
        <div className="navbar-inner">
          <NavLink
            to="/categories"
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            style={{ fontWeight: 800, color: '#059669' }}
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
            style={{ color: '#d97706', fontWeight: 700 }}
          >
            <Tag size={14} />
            <span>Hot Deals</span>
          </NavLink>

          {displayCategories.map((cat) => (
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
