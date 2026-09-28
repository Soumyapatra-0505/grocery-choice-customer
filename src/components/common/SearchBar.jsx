import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Tag } from 'lucide-react';
import { useCatalog } from '../../context/CatalogContext';

export default function SearchBar({
  placeholder = 'Search for groceries, fruits, dairy, snacks...',
  onSearch,
  className = ''
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { products, categories } = useCatalog();

  const productSuggestions = React.useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return products
      .filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.categoryName || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [query, products]);

  const categorySuggestions = React.useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return (categories || [])
      .filter((c) => (c.name || '').toLowerCase().includes(q))
      .slice(0, 3);
  }, [query, categories]);

  const hasSuggestions = productSuggestions.length > 0 || categorySuggestions.length > 0;

  // Handle clicking outside to close suggestions
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    if (onSearch) {
      onSearch(query.trim());
    } else {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectProduct = (product) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/product/${product.id}`);
  };

  const handleSelectCategory = (category) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/products?category=${category.id}`);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`search-bar-wrapper ${className}`} style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit} role="search" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            position: 'absolute',
            left: '1.1rem',
            color: '#64748b',
            display: 'inline-flex',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          <Search size={18} strokeWidth={2.2} />
        </span>

        <input
          type="search"
          className="search-input"
          aria-label="Search products"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          style={{
            width: '100%',
            paddingLeft: '2.85rem',
            paddingRight: query ? '2.5rem' : '1.25rem',
            paddingTop: '0.65rem',
            paddingBottom: '0.65rem',
            borderRadius: '9999px',
            border: isOpen ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
            backgroundColor: isOpen ? '#ffffff' : '#f8fafc',
            color: '#0f172a',
            fontSize: '0.92rem',
            outline: 'none',
            transition: 'all 0.18s ease',
            boxShadow: isOpen ? '0 4px 14px rgba(5, 150, 105, 0.12)' : 'none'
          }}
        />

        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={handleClear}
            aria-label="Clear search query"
            style={{
              position: 'absolute',
              right: '0.85rem',
              color: '#94a3b8',
              display: 'inline-flex',
              padding: '4px',
              borderRadius: '50%',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        )}
      </form>

      {/* Auto-suggest dropdown */}
      {isOpen && hasSuggestions && (
        <div
          className="search-suggestions-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.15)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            zIndex: 250,
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Category matches */}
          {categorySuggestions.length > 0 && (
            <div style={{ borderBottom: '1px solid #f1f5f9', padding: '0.5rem 0' }}>
              <div style={{ padding: '0.25rem 1rem', fontSize: '0.72rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Categories
              </div>
              {categorySuggestions.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    textAlign: 'left',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    cursor: 'pointer',
                    transition: 'background-color 0.12s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ecfdf5')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Tag size={14} color="#059669" />
                  <span>In <strong>{cat.name}</strong></span>
                  <ArrowRight size={13} style={{ marginLeft: 'auto', color: '#94a3b8' }} />
                </button>
              ))}
            </div>
          )}

          {/* Product matches */}
          {productSuggestions.length > 0 && (
            <div style={{ padding: '0.5rem 0' }}>
              <div style={{ padding: '0.25rem 1rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Matching Products
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {productSuggestions.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectProduct(item)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        textAlign: 'left',
                        transition: 'background-color 0.12s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'contain', backgroundColor: '#f1f5f9', padding: '2px' }}
                      />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                          {item.unit} • <span style={{ color: '#059669', fontWeight: 700 }}>₹{item.discountPrice}</span>
                          {item.originalPrice > item.discountPrice && (
                            <span style={{ textDecoration: 'line-through', marginLeft: '0.35rem', color: '#94a3b8' }}>
                              ₹{item.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={14} color="#94a3b8" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ padding: '0.6rem 1rem', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleSubmit}
              style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
            >
              See all results for "{query}" <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
