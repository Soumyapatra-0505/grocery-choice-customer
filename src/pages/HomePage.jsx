import React from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../data/categories';
import { products } from '../data/products';
import CategoryCard from '../components/category/CategoryCard';
import ProductGrid from '../components/product/ProductGrid';
import { ArrowRight, Sparkles, Zap, ShieldCheck, Truck, Percent, Gift, MapPin } from 'lucide-react';
import { useDeliveryLocation } from '../context/LocationContext';

export default function HomePage() {
  const { selectedLocation, openLocationModal } = useDeliveryLocation();
  const popularProducts = products.filter((p) => p.isPopular).slice(0, 8);
  const dealProducts = products.filter((p) => p.isDeal).slice(0, 8);
  const householdProducts = products.filter((p) => p.isHousehold).slice(0, 6);

  return (
    <div className="home-page">
      {/* Hero Banner Section */}
      <section
        className="hero-section"
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 45%, #059669 100%)',
          color: 'white',
          padding: '3rem 0 3.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '320px',
            height: '320px',
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
              gap: '2.5rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <Zap size={15} color="#fde047" fill="#fde047" />
                  <span>FRESH HARVEST • 15 MIN EXPRESS DELIVERY</span>
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
                    padding: '0.4rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.4)'; e.currentTarget.style.color = '#ffffff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.25)'; e.currentTarget.style.color = '#a7f3d0'; }}
                  title="Click to set or change your delivery location"
                >
                  <MapPin size={14} color="#34d399" />
                  <span>
                    {selectedLocation ? `Delivering to: ${selectedLocation.compactDisplay}` : '📍 Select Delivery Location'}
                  </span>
                </button>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2.1rem, 4vw, 3.2rem)',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                  marginBottom: '1rem'
                }}
              >
                Daily Groceries <br />
                <span style={{ color: '#6ee7b7' }}>Handpicked &amp; Fresh</span> At Your Door.
              </h1>

              <p
                style={{
                  fontSize: '1.05rem',
                  color: '#d1fae5',
                  lineHeight: 1.6,
                  maxWidth: '520px',
                  marginBottom: '2rem'
                }}
              >
                Shop farm-fresh fruits, crispy vegetables, dairy, grains, snacks, and daily household essentials with guaranteed best prices and zero delivery fees over ₹499.
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link
                  to="/products"
                  className="btn"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#065f46',
                    fontWeight: 800,
                    padding: '0.8rem 1.6rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>Start Shopping Now</span>
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/products?deal=true"
                  className="btn"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    fontWeight: 700,
                    padding: '0.8rem 1.5rem',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Percent size={17} />
                  <span>View Today's Deals</span>
                </Link>
              </div>
            </div>

            {/* Hero Quick Promo Banner Grid */}
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
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={20} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Instant Drop</div>
                <div style={{ fontSize: '0.82rem', color: '#d1fae5' }}>Delivered in 15-30 minutes from local dark stores.</div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Percent size={20} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Up to 30% Off</div>
                <div style={{ fontSize: '0.82rem', color: '#d1fae5' }}>Unbeatable wholesale direct savings on staples &amp; dairy.</div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#ecfeff', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={20} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Farm Verified</div>
                <div style={{ fontSize: '0.82rem', color: '#d1fae5' }}>Strict hygiene sorting and residue-free organic options.</div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fdf4ff', color: '#c026d3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Gift size={20} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Free Delivery</div>
                <div style={{ fontSize: '0.82rem', color: '#d1fae5' }}>Zero shipping cost on all orders above ₹499.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: '3.5rem' }}>
        {/* Shop by Category Section */}
        <section aria-labelledby="cat-heading" style={{ marginBottom: '4rem' }}>
          <div className="section-header">
            <div className="section-title-wrap">
              <h2 id="cat-heading">Shop by Category</h2>
              <p className="section-subtitle">Explore all 8 fresh departments curated for everyday living</p>
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

        {/* Best Deals Section */}
        <section aria-labelledby="deals-heading" style={{ marginBottom: '4rem' }}>
          <div className="section-header">
            <div className="section-title-wrap">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#d97706', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                <Sparkles size={16} /> Maximum Value
              </div>
              <h2 id="deals-heading">Today's Best Deals &amp; Steals</h2>
              <p className="section-subtitle">Special marked-down prices on seasonal produce and staple essentials</p>
            </div>
            <Link to="/products?deal=true" className="view-all-link">
              <span>See All Deals</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <ProductGrid products={dealProducts} />
        </section>

        {/* Mid-Page Promo Banner */}
        <section
          style={{
            background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '20px',
            padding: '2.5rem',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            marginBottom: '4rem',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)'
          }}
        >
          <div>
            <div style={{ color: '#34d399', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Organic Harvest Festival
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.5rem' }}>
              Get 25% Off Fresh Bananas, Tomatoes &amp; Greens
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '500px' }}>
              Directly harvest-packed by certified regional agricultural cooperatives. Use code <strong style={{ color: '#fde047' }}>FRESHCHOICE</strong> at checkout.
            </p>
          </div>

          <Link
            to="/products?category=fruits-vegetables"
            className="btn btn-primary"
            style={{ padding: '0.85rem 1.75rem', borderRadius: '12px', fontSize: '1rem' }}
          >
            Shop Organic Produce
          </Link>
        </section>

        {/* Popular Products Section */}
        <section aria-labelledby="popular-heading" style={{ marginBottom: '4rem' }}>
          <div className="section-header">
            <div className="section-title-wrap">
              <h2 id="popular-heading">Popular Products</h2>
              <p className="section-subtitle">Customer favorites ordered most frequently in your neighborhood</p>
            </div>
            <Link to="/products" className="view-all-link">
              <span>View Full Catalog</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <ProductGrid products={popularProducts} />
        </section>

        {/* Household Essentials Section */}
        <section aria-labelledby="household-heading" style={{ marginBottom: '4rem' }}>
          <div className="section-header">
            <div className="section-title-wrap">
              <h2 id="household-heading">Household Essentials &amp; Cleaning</h2>
              <p className="section-subtitle">Stock up on premium paper towels, floor cleaners, dishwash and liners</p>
            </div>
            <Link to="/products?category=household-essentials" className="view-all-link">
              <span>View Household Range</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <ProductGrid products={householdProducts} />
        </section>
      </div>
    </div>
  );
}
