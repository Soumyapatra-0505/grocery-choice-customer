import React from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import CategoryCard from '../components/category/CategoryCard';
import ProductGrid from '../components/product/ProductGrid';
import {
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Truck,
  Percent,
  MapPin,
  RefreshCw,
  AlertCircle,
  Package,
  HeartHandshake
} from 'lucide-react';
import { useDeliveryLocation } from '../context/LocationContext';

export default function HomePage() {
  const { selectedLocation, openLocationModal } = useDeliveryLocation();
  const { categories, products, loading, error, loadInitialData } = useCatalog();

  const activeProducts = (products || []).filter((p) => p.active !== false);

  // 1. Popular Picks: Best-rated or top items
  const popularProducts = activeProducts.slice(0, 8);

  // 2. Fresh & Healthy: Produce & Dairy
  const freshAndHealthy = activeProducts.filter((p) => {
    const cat = (p.categoryName || p.categoryId || '').toLowerCase();
    return cat.includes('fruit') || cat.includes('veg') || cat.includes('produce') || cat.includes('dairy');
  }).length > 0
    ? activeProducts.filter((p) => {
        const cat = (p.categoryName || p.categoryId || '').toLowerCase();
        return cat.includes('fruit') || cat.includes('veg') || cat.includes('produce') || cat.includes('dairy');
      }).slice(0, 8)
    : activeProducts.slice(0, 8);

  // 3. Daily Essentials: Grains, Atta, Rice, Oil
  const dailyEssentials = activeProducts.filter((p) => {
    const cat = (p.categoryName || p.categoryId || '').toLowerCase();
    return cat.includes('grain') || cat.includes('atta') || cat.includes('rice') || cat.includes('flour') || cat.includes('oil');
  }).length > 0
    ? activeProducts.filter((p) => {
        const cat = (p.categoryName || p.categoryId || '').toLowerCase();
        return cat.includes('grain') || cat.includes('atta') || cat.includes('rice') || cat.includes('flour') || cat.includes('oil');
      }).slice(0, 8)
    : activeProducts.slice(2, 10);

  // 4. Snacks & Beverages
  const snacksAndBeverages = activeProducts.filter((p) => {
    const cat = (p.categoryName || p.categoryId || '').toLowerCase();
    return cat.includes('snack') || cat.includes('bev') || cat.includes('drink') || cat.includes('juice') || cat.includes('tea');
  }).length > 0
    ? activeProducts.filter((p) => {
        const cat = (p.categoryName || p.categoryId || '').toLowerCase();
        return cat.includes('snack') || cat.includes('bev') || cat.includes('drink') || cat.includes('juice') || cat.includes('tea');
      }).slice(0, 8)
    : activeProducts.slice(1, 9);

  // 5. Household Essentials
  const householdEssentials = activeProducts.filter((p) => {
    const cat = (p.categoryName || p.categoryId || '').toLowerCase();
    return cat.includes('house') || cat.includes('clean') || cat.includes('care') || cat.includes('detergent');
  }).length > 0
    ? activeProducts.filter((p) => {
        const cat = (p.categoryName || p.categoryId || '').toLowerCase();
        return cat.includes('house') || cat.includes('clean') || cat.includes('care') || cat.includes('detergent');
      }).slice(0, 8)
    : activeProducts.slice(3, 9);

  return (
    <div className="home-page">
      {/* -------------------------------------------------------------
          1. HERO SECTION
          ------------------------------------------------------------- */}
      <section
        className="hero-section"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 45%, #059669 100%)',
          color: '#ffffff',
          padding: '3.5rem 0 4rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '360px',
            height: '360px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, rgba(52, 211, 153, 0) 70%)',
            pointerEvents: 'none'
          }}
        />

        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              alignItems: 'center',
              gap: '3rem'
            }}
          >
            {/* Left Content */}
            <div>
              {/* Delivery location chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    border: '1px solid rgba(255, 255, 255, 0.25)'
                  }}
                >
                  <Zap size={14} color="#fde047" fill="#fde047" />
                  <span>15–30 MIN EXPRESS DELIVERY</span>
                </div>

                <button
                  type="button"
                  onClick={() => openLocationModal('select')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    color: '#a7f3d0',
                    backdropFilter: 'blur(8px)',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.4)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.25)';
                    e.currentTarget.style.color = '#a7f3d0';
                  }}
                  title="Click to set or change your delivery location"
                >
                  <MapPin size={13} color="#34d399" />
                  <span>
                    {selectedLocation ? `Delivering to: ${selectedLocation.compactDisplay || selectedLocation.city}` : 'Please enter your delivery address'}
                  </span>
                </button>
              </div>

              {/* Exact Suggested Copy */}
              <h1
                className="hero-title"
                style={{
                  fontSize: 'clamp(2.3rem, 4.5vw, 3.4rem)',
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                  marginBottom: '1rem',
                  color: '#ffffff'
                }}
              >
                Fresh groceries. <br />
                <span style={{ color: '#6ee7b7' }}>Delivered to your doorstep.</span>
              </h1>

              {/* Exact Subtext */}
              <p
                style={{
                  fontSize: '1.05rem',
                  color: '#d1fae5',
                  lineHeight: 1.6,
                  maxWidth: '520px',
                  marginBottom: '2rem'
                }}
              >
                Quality groceries, everyday essentials and more — delivered quickly to your location.
              </p>

              {/* Primary & Secondary CTAs */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link
                  to="/products"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#065f46',
                    fontWeight: 800,
                    padding: '0.85rem 1.75rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '1rem'
                  }}
                >
                  <span>Shop Now</span>
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/categories"
                  className="btn btn-outline"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.35)',
                    fontWeight: 700,
                    padding: '0.85rem 1.6rem',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '1rem'
                  }}
                >
                  <span>Explore Categories</span>
                </Link>
              </div>
            </div>

            {/* Right Product Composition Card */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem'
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '18px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={22} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>Lightning Drop</div>
                <div style={{ fontSize: '0.82rem', color: '#d1fae5' }}>Delivered in 15–30 minutes from your neighborhood dark store.</div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '18px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Percent size={22} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>Best Value</div>
                <div style={{ fontSize: '0.82rem', color: '#d1fae5' }}>Direct farm partnerships bring everyday wholesale prices.</div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '18px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={22} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>100% Quality</div>
                <div style={{ fontSize: '0.82rem', color: '#d1fae5' }}>Multi-level hygiene inspection on all fruits, veg and dairy.</div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '18px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fdf4ff', color: '#c026d3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HeartHandshake size={22} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>Doorstep Return</div>
                <div style={{ fontSize: '0.82rem', color: '#d1fae5' }}>Zero-hassle replacement or refund right at your door.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          COMPACT TRUST / VALUE STRIP
          ------------------------------------------------------------- */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0.85rem 1.25rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: '#1e293b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⚡</span>
            <span>Superfast 15–30 Min Delivery Near You</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🎉</span>
            <span>Free Delivery on Orders Over ₹199</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>✨</span>
            <span>100% Quality Guaranteed</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MAIN CONTENT CONTAINER
          ------------------------------------------------------------- */}
      <div className="container" style={{ marginTop: '2.5rem' }}>
        {/* Error Notification */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '1.25rem 1.5rem',
              borderRadius: '16px',
              gap: '1rem',
              marginBottom: '2.5rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertCircle size={22} color="#ef4444" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>Unable to load catalog from server.</div>
                <div style={{ fontSize: '0.85rem', color: '#b91c1c', marginTop: '0.2rem' }}>
                  Please ensure your connection is active or retry below.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={loadInitialData}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 700 }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton State */}
        {loading && (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', marginBottom: '2.5rem' }}>
            <RefreshCw size={36} color="#059669" className="spin" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
              Loading fresh grocery catalog...
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && categories.length === 0 && products.length === 0 && (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1', marginBottom: '2.5rem' }}>
            <Package size={40} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>Catalog is Currently Empty</div>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Items published in the store will appear here in real time.
            </p>
          </div>
        )}

        {/* -------------------------------------------------------------
            2. SHOP BY CATEGORY SECTION
            ------------------------------------------------------------- */}
        <section aria-labelledby="cat-heading" style={{ marginBottom: '3.5rem' }}>
          <div className="section-header">
            <div className="section-title-wrap">
              <h2 id="cat-heading">Shop by Category</h2>
              <p className="section-subtitle">
                Explore hand-picked departments curated for your daily lifestyle
              </p>
            </div>
            <Link to="/categories" className="view-all-link">
              <span>View All Categories</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="categories-grid">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------------
            3. POPULAR PICKS
            ------------------------------------------------------------- */}
        {popularProducts.length > 0 && (
          <section aria-labelledby="popular-heading" style={{ marginBottom: '3.5rem' }}>
            <div className="section-header">
              <div className="section-title-wrap">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  <Sparkles size={15} /> Customer Favorites
                </div>
                <h2 id="popular-heading">Popular Picks</h2>
                <p className="section-subtitle">Most loved groceries ordered frequently in your area</p>
              </div>
              <Link to="/products" className="view-all-link">
                <span>View Full Catalog</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <ProductGrid products={popularProducts} />
          </section>
        )}

        {/* -------------------------------------------------------------
            PROMOTIONAL VALUE BANNER
            ------------------------------------------------------------- */}
        <section
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '20px',
            padding: '2.5rem',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            marginBottom: '3.5rem',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)'
          }}
        >
          <div>
            <div style={{ color: '#34d399', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              Organic Fresh Harvest
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.45rem' }}>
              Crisp Produce, Direct from Farmers
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', maxWidth: '520px' }}>
              Clean, washed, and temperature-controlled produce. Free delivery on orders over ₹199 with 15–30 minute dispatch.
            </p>
          </div>

          <Link
            to="/products?category=fruits-vegetables"
            className="btn btn-primary"
            style={{ padding: '0.85rem 1.75rem', borderRadius: '12px', fontSize: '0.98rem' }}
          >
            <span>Shop Fresh Produce</span>
            <ArrowRight size={16} />
          </Link>
        </section>

        {/* -------------------------------------------------------------
            4. FRESH & HEALTHY
            ------------------------------------------------------------- */}
        {freshAndHealthy.length > 0 && (
          <section aria-labelledby="fresh-heading" style={{ marginBottom: '3.5rem' }}>
            <div className="section-header">
              <div className="section-title-wrap">
                <h2 id="fresh-heading">Fresh &amp; Healthy</h2>
                <p className="section-subtitle">Farm-fresh fruits, crispy vegetables, pure milk &amp; dairy</p>
              </div>
              <Link to="/products?category=fruits-vegetables" className="view-all-link">
                <span>See All Produce</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <ProductGrid products={freshAndHealthy} />
          </section>
        )}

        {/* -------------------------------------------------------------
            5. DAILY ESSENTIALS
            ------------------------------------------------------------- */}
        {dailyEssentials.length > 0 && (
          <section aria-labelledby="essentials-heading" style={{ marginBottom: '3.5rem' }}>
            <div className="section-header">
              <div className="section-title-wrap">
                <h2 id="essentials-heading">Daily Essentials</h2>
                <p className="section-subtitle">Premium chakki atta, aged basmati rice, cooking oils, and dals</p>
              </div>
              <Link to="/products?category=rice-atta-grains" className="view-all-link">
                <span>View Essentials</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <ProductGrid products={dailyEssentials} />
          </section>
        )}

        {/* -------------------------------------------------------------
            6. SNACKS & BEVERAGES
            ------------------------------------------------------------- */}
        {snacksAndBeverages.length > 0 && (
          <section aria-labelledby="snacks-heading" style={{ marginBottom: '3.5rem' }}>
            <div className="section-header">
              <div className="section-title-wrap">
                <h2 id="snacks-heading">Snacks &amp; Beverages</h2>
                <p className="section-subtitle">Crunchy munchies, roasted nuts, fresh juices, and energizing drinks</p>
              </div>
              <Link to="/products?category=snacks" className="view-all-link">
                <span>View Snacks</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <ProductGrid products={snacksAndBeverages} />
          </section>
        )}

        {/* -------------------------------------------------------------
            7. HOUSEHOLD ESSENTIALS
            ------------------------------------------------------------- */}
        {householdEssentials.length > 0 && (
          <section aria-labelledby="household-heading" style={{ marginBottom: '4rem' }}>
            <div className="section-header">
              <div className="section-title-wrap">
                <h2 id="household-heading">Household Essentials</h2>
                <p className="section-subtitle">Floor cleaners, paper towels, dishwash gels, and laundry detergents</p>
              </div>
              <Link to="/products?category=household-essentials" className="view-all-link">
                <span>View Household Range</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <ProductGrid products={householdEssentials} />
          </section>
        )}
      </div>
    </div>
  );
}
