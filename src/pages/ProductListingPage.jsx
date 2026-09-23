import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import ProductGrid from '../components/product/ProductGrid';
import { Filter, X, AlertCircle, RefreshCw } from 'lucide-react';

export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, products, loading, error, refreshCatalog } = useCatalog();

  const currentCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const isDealOnly = searchParams.get('deal') === 'true';

  const [sortBy, setSortBy] = useState('popularity'); // popularity | price-low | price-high | discount | rating
  const [stockFilter, setStockFilter] = useState('all'); // all | in-stock

  // Current selected category object (supports lookup by numeric id or slug)
  const currentCategoryObj = useMemo(() => {
    if (currentCategory === 'all') return null;
    return categories.find(
      (c) => String(c.id) === String(currentCategory) || c.slug === currentCategory
    );
  }, [categories, currentCategory]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category filter
        if (currentCategory !== 'all') {
          const matchId = String(product.categoryId) === String(currentCategory);
          const matchSlug = product.category === currentCategory;
          const matchObjId = currentCategoryObj && String(product.categoryId) === String(currentCategoryObj.id);
          const matchObjSlug = currentCategoryObj && product.category === currentCategoryObj.slug;
          if (!matchId && !matchSlug && !matchObjId && !matchObjSlug) {
            return false;
          }
        }

        // Deal filter
        if (isDealOnly && !product.isDeal && !(product.discountPercentage > 0)) {
          return false;
        }

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = (product.name || '').toLowerCase().includes(q);
          const matchCat = (product.categoryName || '').toLowerCase().includes(q);
          const matchDesc = (product.description || '').toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchDesc) {
            return false;
          }
        }

        // Stock filter
        if (stockFilter === 'in-stock') {
          const isOut = product.stockStatus === 'out_of_stock' || product.stockQuantity <= 0;
          if (isOut) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') {
          return a.discountPrice - b.discountPrice;
        }
        if (sortBy === 'price-high') {
          return b.discountPrice - a.discountPrice;
        }
        if (sortBy === 'discount') {
          return b.discountPercentage - a.discountPercentage;
        }
        if (sortBy === 'rating') {
          return b.rating - a.rating;
        }
        // default popularity
        return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
      });
  }, [products, currentCategory, currentCategoryObj, searchQuery, isDealOnly, stockFilter, sortBy]);

  const handleCategorySelect = (catId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', catId);
    }
    setSearchParams(nextParams);
  };

  const handleClearAllFilters = () => {
    setSearchParams({});
    setStockFilter('all');
    setSortBy('popularity');
  };

  return (
    <div className="product-listing-page container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      {/* Error state */}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            fontSize: '0.95rem',
            fontWeight: 600
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} />
            <span>Unable to connect to Grocery Choice server.</span>
          </div>
          <button
            type="button"
            onClick={() => refreshCatalog()}
            style={{
              background: '#b91c1c',
              color: '#ffffff',
              border: 'none',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Page Header / Active Query Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {searchQuery
              ? `Results for "${searchQuery}"`
              : isDealOnly
              ? "Today's Best Deals"
              : currentCategoryObj
              ? currentCategoryObj.name
              : 'All Grocery Products'}
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} available for delivery
          </p>
        </div>

        {/* Sort & Quick Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label htmlFor="sort-select" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-select"
            style={{ minWidth: '180px', padding: '0.5rem 0.85rem', fontSize: '0.88rem', fontWeight: 600 }}
          >
            <option value="popularity">Popularity</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="discount">Highest Discount</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(currentCategory !== 'all' || searchQuery || isDealOnly || stockFilter !== 'all') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>Active Filters:</span>

          {currentCategory !== 'all' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              Category: {currentCategoryObj?.name || currentCategory}
              <button
                type="button"
                onClick={() => handleCategorySelect('all')}
                style={{ display: 'inline-flex', padding: 0 }}
                aria-label="Remove category filter"
              >
                <X size={14} />
              </button>
            </span>
          )}

          {searchQuery && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              Search: "{searchQuery}"
              <button
                type="button"
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.delete('search');
                  setSearchParams(p);
                }}
                style={{ display: 'inline-flex', padding: 0 }}
                aria-label="Remove search filter"
              >
                <X size={14} />
              </button>
            </span>
          )}

          {isDealOnly && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              Hot Deals Only
              <button
                type="button"
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.delete('deal');
                  setSearchParams(p);
                }}
                style={{ display: 'inline-flex', padding: 0 }}
                aria-label="Remove deal filter"
              >
                <X size={14} />
              </button>
            </span>
          )}

          {stockFilter !== 'all' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              In Stock Only
              <button
                type="button"
                onClick={() => setStockFilter('all')}
                style={{ display: 'inline-flex', padding: 0 }}
                aria-label="Remove stock filter"
              >
                <X size={14} />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleClearAllFilters}
            style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', marginLeft: '0.5rem', textDecoration: 'underline' }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading products from Grocery Choice server...</p>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '2rem',
          alignItems: 'start'
        }}
        className="product-listing-layout"
      >
        {/* Sidebar Filters */}
        <aside
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
          }}
          aria-label="Filter products"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <Filter size={18} color="#059669" />
            <span>Filter Catalog</span>
          </div>

          {/* Department List */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.65rem', letterSpacing: '0.04em' }}>
              Categories
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>
                <button
                  type="button"
                  onClick={() => handleCategorySelect('all')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: currentCategory === 'all' ? 700 : 500,
                    color: currentCategory === 'all' ? '#059669' : '#334155',
                    backgroundColor: currentCategory === 'all' ? '#ecfdf5' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>All Products</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{products.length}</span>
                </button>
              </li>

              {categories.map((cat) => {
                const count = products.filter(
                  (p) => String(p.categoryId) === String(cat.id) || p.category === cat.slug
                ).length;
                const isSelected =
                  currentCategory === String(cat.id) || currentCategory === cat.slug;
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => handleCategorySelect(cat.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#059669' : '#334155',
                        backgroundColor: isSelected ? '#ecfdf5' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{cat.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Availability Filter */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.65rem', letterSpacing: '0.04em' }}>
              Availability
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="stock-filter"
                  checked={stockFilter === 'all'}
                  onChange={() => setStockFilter('all')}
                  style={{ accentColor: '#059669', width: '16px', height: '16px' }}
                />
                <span>Include All Items</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="stock-filter"
                  checked={stockFilter === 'in-stock'}
                  onChange={() => setStockFilter('in-stock')}
                  style={{ accentColor: '#059669', width: '16px', height: '16px' }}
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main>
          <ProductGrid
            products={filteredProducts}
            emptyTitle="No matching grocery products found"
            emptyMessage="Try clearing your search query or selecting a different category."
            onResetFilters={handleClearAllFilters}
          />
        </main>
      </div>
    </div>
  );
}

