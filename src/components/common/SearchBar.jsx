import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { products } from '../../data/products';

export default function SearchBar({ placeholder = 'Search for bananas, milk, atta, snacks, detergent...', onSearch }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const suggestions = React.useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [query]);

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

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="search-bar-wrapper" style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit} role="search" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            position: 'absolute',
            left: '1rem',
            color: '#64748b',
            display: 'inline-flex',
            pointerEvents: 'none'
          }}
        >
          <Search size={18} />
        </span>

        <input
          type="search"
          aria-label="Search products"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          style={{
            width: '100%',
            paddingLeft: '2.75rem',
            paddingRight: query ? '2.5rem' : '1.25rem',
            paddingTop: '0.65rem',
            paddingBottom: '0.65rem',
            borderRadius: '9999px',
            border: '1.5px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            color: '#0f172a',
            fontSize: '0.92rem',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: isOpen ? '0 4px 14px rgba(5, 150, 105, 0.12)' : 'none',
            borderColor: isOpen ? '#059669' : '#e2e8f0'
          }}
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search query"
            style={{
              position: 'absolute',
              right: '0.85rem',
              color: '#94a3b8',
              display: 'inline-flex',
              padding: '4px'
            }}
          >
            <X size={16} />
          </button>
        )}
      </form>

      {/* Auto-suggest dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.15)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            zIndex: 150,
          }}
        >
          <div style={{ padding: '0.5rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>
            Suggested Products
          </div>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleSelectProduct(item)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                    minHeight: '44px',
                    borderBottom: '1px solid #f8fafc'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {item.unit} • <span style={{ color: '#059669', fontWeight: 700 }}>₹{item.discountPrice}</span>
                    </div>
                  </div>
                  <ArrowRight size={14} color="#94a3b8" />
                </button>
              </li>
            ))}
          </ul>

          <div style={{ padding: '0.5rem 0.85rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleSubmit}
              style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              See all results for "{query}" <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
