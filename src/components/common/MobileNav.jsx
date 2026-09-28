import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Search, Package, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MobileNav() {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchClick = (e) => {
    e.preventDefault();
    // If not already on /products, navigate there and focus search
    if (location.pathname !== '/products') {
      navigate('/products');
    }
    // Scroll to top and focus search bar
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const searchInput = document.querySelector('input[type="search"]');
      if (searchInput) {
        searchInput.focus();
      }
    }, 150);
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      <NavLink
        to="/"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        aria-label="Home"
      >
        <Home size={20} strokeWidth={2.2} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/categories"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        aria-label="Categories"
      >
        <LayoutGrid size={20} strokeWidth={2.2} />
        <span>Categories</span>
      </NavLink>

      <button
        type="button"
        onClick={handleSearchClick}
        className="mobile-nav-item"
        aria-label="Search"
      >
        <Search size={20} strokeWidth={2.2} />
        <span>Search</span>
      </button>

      <NavLink
        to="/orders"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        aria-label="My Orders"
      >
        <Package size={20} strokeWidth={2.2} />
        <span>Orders</span>
      </NavLink>

      <NavLink
        to={isLoggedIn ? '/profile' : '/login'}
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        aria-label={isLoggedIn ? 'My Profile' : 'Sign In'}
      >
        <User size={20} strokeWidth={2.2} />
        <span>{isLoggedIn ? (user?.fullName ? user.fullName.split(' ')[0] : 'Profile') : 'Sign In'}</span>
      </NavLink>
    </nav>
  );
}
