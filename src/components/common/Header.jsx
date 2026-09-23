import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../assets/Logo';
import SearchBar from './SearchBar';
import LocationSelector from '../location/LocationSelector';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingCart,
  Package,
  LogOut,
  LogIn,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

export default function Header() {
  const { totalItems, subtotal } = useCart();
  const { user, isLoggedIn, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <>
      {/* Top Announcement Ribbon */}
      <div className="top-announcement">
        <span>⚡ Superfast 15-30 Min Delivery in Gurugram &amp; NCR</span>
        <span style={{ opacity: 0.6 }}>•</span>
        <span>🎉 Free Delivery on orders over ₹499</span>
        <span style={{ opacity: 0.6 }}>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={13} /> 100% Quality Guaranteed
        </span>
      </div>

      <header className="app-header">
        <div className="container">
          <div className="header-inner">
            {/* Mobile Menu Trigger */}
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              style={{
                display: 'none',
                padding: '0.4rem',
                color: '#0f172a'
              }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Brand Logo */}
            <Link to="/" aria-label="Grocery Choice Home" style={{ display: 'inline-flex' }}>
              <Logo size="medium" />
            </Link>

            {/* Delivery Location Selector */}
            <LocationSelector className="header-location" />

            {/* Central Search Bar */}
            <div className="header-search">
              <SearchBar />
            </div>

            {/* Action Buttons */}
            <div className="header-actions">
              {/* Account Dropdown */}
              <div style={{ position: 'relative' }}>
                {isLoggedIn ? (
                  <>
                    <button
                      type="button"
                      className="action-item"
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      aria-expanded={userDropdownOpen}
                      aria-haspopup="true"
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.88rem'
                        }}
                      >
                        {user.fullName ? user.fullName.charAt(0) : 'U'}
                      </div>
                      <span className="hide-on-mobile">{user.fullName.split(' ')[0]}</span>
                    </button>

                    {userDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          right: 0,
                          width: '200px',
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.15)',
                          border: '1px solid #e2e8f0',
                          overflow: 'hidden',
                          zIndex: 200
                        }}
                      >
                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{user.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
                        </div>

                        <Link
                          to="/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          style={{
                            padding: '0.65rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            fontSize: '0.88rem',
                            color: '#334155',
                            transition: 'background-color 0.15s'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Package size={16} color="#059669" />
                          <span>My Orders</span>
                        </Link>

                        <button
                          type="button"
                          onClick={handleLogout}
                          style={{
                            width: '100%',
                            padding: '0.65rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            fontSize: '0.88rem',
                            color: '#ef4444',
                            textAlign: 'left',
                            borderTop: '1px solid #f1f5f9',
                            transition: 'background-color 0.15s'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link to="/login" className="action-item">
                    <LogIn size={18} />
                    <span className="hide-on-mobile">Sign In</span>
                  </Link>
                )}
              </div>

              {/* My Orders Button */}
              <Link to="/orders" className="action-item hide-on-mobile" title="View past orders">
                <Package size={18} />
                <span>Orders</span>
              </Link>

              {/* Cart Button with Count Badge */}
              <Link
                to="/cart"
                className="btn btn-primary"
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.65rem'
                }}
                aria-label={`Cart with ${totalItems} items`}
              >
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <ShoppingCart size={20} />
                  {totalItems > 0 && (
                    <span
                      className="cart-badge"
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-10px',
                        backgroundColor: '#ffffff',
                        color: '#059669',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                      }}
                    >
                      {totalItems}
                    </span>
                  )}
                </div>

                <div className="hide-on-mobile" style={{ textAlign: 'left', lineHeight: 1.1 }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>My Cart</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>
                    {totalItems > 0 ? `₹${subtotal}` : '0 Items'}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              boxShadow: '0 10px 20px rgba(0,0,0,0.08)'
            }}
          >
            <div style={{ marginBottom: '0.5rem' }}>
              <SearchBar onSearch={() => setMobileMenuOpen(false)} />
            </div>

            <Link
              to="/categories"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontWeight: 600, padding: '0.5rem 0', color: '#0f172a' }}
            >
              Browse All Categories
            </Link>
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontWeight: 600, padding: '0.5rem 0', color: '#0f172a' }}
            >
              All Products
            </Link>
            <Link
              to="/orders"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontWeight: 600, padding: '0.5rem 0', color: '#0f172a' }}
            >
              My Orders
            </Link>
            {!isLoggedIn ? (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-secondary"
                style={{ justifyContent: 'center' }}
              >
                Sign In / Register
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="btn btn-outline"
                style={{ justifyContent: 'center', color: '#ef4444' }}
              >
                Sign Out
              </button>
            )}
          </div>
        )}
      </header>

      {/* Accessible Mobile Location Bar */}
      <div className="mobile-location-strip">
        <LocationSelector variant="mobile-bar" />
      </div>
    </>
  );
}
