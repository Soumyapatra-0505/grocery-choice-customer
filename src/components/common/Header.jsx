import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  User,
  CreditCard
} from 'lucide-react';

export default function Header() {
  const { totalItems, subtotal } = useCart();
  const { user, isLoggedIn, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const prevPathnameRef = useRef(location.pathname);

  // Close profile dropdown automatically on route change
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname;
      setUserDropdownOpen(false);
    }
  }, [location.pathname]);

  // Handle clicking outside the profile dropdown or pressing Escape
  useEffect(() => {
    if (!userDropdownOpen) return;

    const handleOutsideInteraction = (event) => {
      if (!userDropdownRef.current) return;
      const target = event.target;
      const path = event.composedPath ? event.composedPath() : [];
      if (!userDropdownRef.current.contains(target) && !path.includes(userDropdownRef.current)) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setUserDropdownOpen(false);
      }
    };

    if (typeof window !== 'undefined' && window.PointerEvent) {
      document.addEventListener('pointerdown', handleOutsideInteraction);
    } else {
      document.addEventListener('mousedown', handleOutsideInteraction);
      document.addEventListener('touchstart', handleOutsideInteraction);
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (typeof window !== 'undefined' && window.PointerEvent) {
        document.removeEventListener('pointerdown', handleOutsideInteraction);
      } else {
        document.removeEventListener('mousedown', handleOutsideInteraction);
        document.removeEventListener('touchstart', handleOutsideInteraction);
      }
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userDropdownOpen]);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <>
      {/* Top Value / Trust Announcement Strip */}
      <div className="top-announcement">
        <span>⚡ Superfast 15–30 Min Delivery Near You</span>
        <span style={{ opacity: 0.6 }}>•</span>
        <span>🎉 Free Delivery on Orders Over ₹199</span>
        <span style={{ opacity: 0.6 }}>•</span>
        <span>✨ 100% Quality Guaranteed</span>
      </div>

      <header className="app-header">
        <div className="container">
          <div className="header-inner">
            {/* Brand Logo & Name */}
            <Link to="/" aria-label="Grocery Choice Home" style={{ display: 'inline-flex', flexShrink: 0 }}>
              <Logo size="medium" />
            </Link>

            {/* Delivery Location Selector (Desktop) */}
            <div className="hide-on-mobile" style={{ flexShrink: 0 }}>
              <LocationSelector className="header-location" />
            </div>

            {/* Central Search Bar (Desktop) */}
            <div className="header-search">
              <SearchBar />
            </div>

            {/* Right Action Buttons */}
            <div className="header-actions">
              {/* Account Dropdown */}
              <div ref={userDropdownRef} style={{ position: 'relative' }}>
                {isLoggedIn ? (
                  <>
                    <button
                      type="button"
                      className="action-item"
                      onClick={() => setUserDropdownOpen((prev) => !prev)}
                      aria-expanded={userDropdownOpen}
                      aria-haspopup="true"
                      style={{ padding: '0.45rem 0.75rem', borderRadius: '12px' }}
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
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          overflow: 'hidden',
                          border: '1.5px solid #a7f3d0'
                        }}
                      >
                        {user?.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.fullName || 'User'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'
                        )}
                      </div>
                      <span className="hide-on-mobile" style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                        {user?.fullName ? user.fullName.split(' ')[0] : 'Profile'}
                      </span>
                    </button>

                    {userDropdownOpen && (
                      <div
                        className="user-dropdown-menu"
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          right: 0,
                          width: '230px',
                          backgroundColor: '#ffffff',
                          borderRadius: '16px',
                          boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.16)',
                          border: '1px solid #e2e8f0',
                          overflow: 'hidden',
                          zIndex: 300,
                          animation: 'fadeIn 0.15s ease'
                        }}
                      >
                        <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f8fafc' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              overflow: 'hidden',
                              border: '1.5px solid #a7f3d0',
                              flexShrink: 0
                            }}
                          >
                            {user?.profilePicture ? (
                              <img
                                src={user.profilePicture}
                                alt={user.fullName || 'User'}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'
                            )}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {user.fullName || 'Customer'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {user.phone || user.email}
                            </div>
                          </div>
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          style={{
                            padding: '0.7rem 1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: '#334155',
                            transition: 'background-color 0.12s'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <User size={16} color="#059669" />
                          <span>My Profile</span>
                        </Link>

                        <Link
                          to="/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          style={{
                            padding: '0.7rem 1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: '#334155',
                            transition: 'background-color 0.12s'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Package size={16} color="#059669" />
                          <span>My Orders</span>
                        </Link>

                        <Link
                          to="/profile?tab=payments"
                          onClick={() => setUserDropdownOpen(false)}
                          style={{
                            padding: '0.7rem 1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: '#334155',
                            transition: 'background-color 0.12s'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <CreditCard size={16} color="#059669" />
                          <span>Payment Methods</span>
                        </Link>

                        <button
                          type="button"
                          onClick={handleLogout}
                          style={{
                            width: '100%',
                            padding: '0.7rem 1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: '#dc2626',
                            textAlign: 'left',
                            borderTop: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            transition: 'background-color 0.12s'
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
                  <Link
                    to="/login"
                    className="action-item"
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '0.45rem 0.9rem',
                      fontWeight: 700
                    }}
                  >
                    <LogIn size={16} color="#059669" />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>

              {/* Cart Button with Count Badge & Total */}
              <Link
                to="/cart"
                className="cart-header-btn"
                aria-label={`Shopping cart with ${totalItems} items, subtotal ₹${subtotal}`}
              >
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <ShoppingCart size={20} strokeWidth={2.2} />
                  {totalItems > 0 && (
                    <span className="cart-badge">
                      {totalItems}
                    </span>
                  )}
                </div>

                <div className="hide-on-mobile" style={{ textAlign: 'left', lineHeight: 1.15 }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.9, fontWeight: 600 }}>My Cart</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>
                    {totalItems > 0 ? `₹${subtotal}` : '0 Items'}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Search & Location Strip (Visible only on screens < 768px) */}
        <div className="mobile-search-strip" style={{ display: 'none' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <LocationSelector className="mobile-location-bar" />
          </div>
          <SearchBar />
        </div>
      </header>
    </>
  );
}
