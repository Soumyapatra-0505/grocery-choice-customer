import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShieldCheck, Truck, RotateCcw, Check, ShoppingCart, ChevronRight, MapPin } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useDeliveryLocation } from '../../context/LocationContext';
import QuantitySelector from '../common/QuantitySelector';
import Button from '../common/Button';

export default function ProductDetails({ product }) {
  const [selectedQty, setSelectedQty] = useState(1);
  const { addToCart, getItemQuantity } = useCart();
  const { selectedLocation, openLocationModal } = useDeliveryLocation();
  const currentCartQty = getItemQuantity(product.id);

  const isOutOfStock = product.stockStatus === 'out_of_stock';
  const isLowStock = product.stockStatus === 'low_stock';

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart(product, selectedQty);
    }
  };

  return (
    <div className="product-details-container">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#059669', fontWeight: 600 }}>Home</Link>
        <ChevronRight size={14} />
        <Link to={`/products?category=${product.category}`} style={{ color: '#059669', fontWeight: 600 }}>
          {product.categoryName}
        </Link>
        <ChevronRight size={14} />
        <span style={{ color: '#0f172a', fontWeight: 600 }}>{product.name}</span>
      </nav>

      {/* Main Details Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)'
        }}
      >
        {/* Large Product Image Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: '#fafbfc',
              border: '1px solid #f1f5f9',
              aspectRatio: '1 / 1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />

            {/* Discount Badge */}
            {product.discountPercentage > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  backgroundColor: '#059669',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  boxShadow: '0 4px 10px rgba(5, 150, 105, 0.3)'
                }}
              >
                {product.discountPercentage}% OFF
              </span>
            )}
          </div>

          {/* Freshness & Trust Guarantee Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              backgroundColor: '#f8fafc',
              padding: '0.85rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: '#475569'
            }}
          >
            <div>
              <Truck size={18} color="#059669" style={{ margin: '0 auto 0.25rem' }} />
              <div>15-30 Min Delivery</div>
            </div>
            <div>
              <ShieldCheck size={18} color="#059669" style={{ margin: '0 auto 0.25rem' }} />
              <div>100% Hygienic</div>
            </div>
            <div>
              <RotateCcw size={18} color="#059669" style={{ margin: '0 auto 0.25rem' }} />
              <div>Doorstep Returns</div>
            </div>
          </div>
        </div>

        {/* Product Information & Purchase Column */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
            {product.categoryName}
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3, marginBottom: '0.75rem' }}>
            {product.name}
          </h1>

          {/* Rating and Reviews */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.88rem'
              }}
            >
              <Star size={15} fill="#f59e0b" stroke="#f59e0b" />
              <span>{product.rating}</span>
            </div>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
              {product.reviewCount} customer reviews
            </span>
          </div>

          {/* Unit Info */}
          <div style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '1.25rem' }}>
            Pack / Net Weight: <strong style={{ color: '#0f172a' }}>{product.unit}</strong>
          </div>

          {/* Pricing Row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
              ₹{product.discountPrice}
            </div>

            {product.originalPrice > product.discountPrice && (
              <>
                <div style={{ fontSize: '1.1rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                  MRP ₹{product.originalPrice}
                </div>
                <div
                  style={{
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px'
                  }}
                >
                  Save ₹{product.originalPrice - product.discountPrice} ({product.discountPercentage}%)
                </div>
              </>
            )}
          </div>

          <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1.5rem' }}>
            (Inclusive of all applicable taxes)
          </div>

          {/* Stock Availability Indicator */}
          <div style={{ marginBottom: '1rem' }}>
            {isOutOfStock ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', backgroundColor: '#fee2e2', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                Currently Out of Stock
              </div>
            ) : isLowStock ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#b45309', backgroundColor: '#fef3c7', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                Hurry! Only {product.stockCount} left in stock
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                <Check size={16} /> In Stock &amp; Ready for Delivery
              </div>
            )}
          </div>

          {/* Location Delivery Awareness */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.84rem',
              color: '#334155',
              marginBottom: '1.5rem',
              padding: '0.65rem 0.9rem',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0'
            }}
          >
            <MapPin size={16} color="#059669" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedLocation ? (
                <>Delivering to: <strong style={{ color: '#0f172a' }}>{selectedLocation.compactDisplay}</strong></>
              ) : (
                <span style={{ color: '#64748b' }}>Select your location to check delivery details</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => openLocationModal('select')}
              style={{
                background: 'none',
                border: 'none',
                color: '#059669',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                padding: '0.2rem 0.4rem',
                borderRadius: '4px',
                flexShrink: 0
              }}
            >
              {selectedLocation ? 'Change' : 'Set Location'}
            </button>
          </div>

          {/* Quantity and Add to Cart Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <QuantitySelector
              quantity={selectedQty}
              min={1}
              max={product.stockCount || 99}
              onChange={(newVal) => setSelectedQty(newVal)}
              disabled={isOutOfStock}
              size="lg"
            />

            <Button
              variant="primary"
              size="lg"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              icon={<ShoppingCart size={20} />}
              style={{ flex: 1, minWidth: '200px' }}
            >
              {isOutOfStock ? 'Sold Out' : `Add to Cart • ₹${product.discountPrice * selectedQty}`}
            </Button>
          </div>

          {currentCartQty > 0 && (
            <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600, marginBottom: '1.5rem' }}>
              ✓ You currently have {currentCartQty} of this item in your <Link to="/cart" style={{ textDecoration: 'underline' }}>cart</Link>.
            </div>
          )}

          {/* Description Section */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Product Overview
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
