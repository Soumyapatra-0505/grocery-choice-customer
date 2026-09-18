import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/cart/CartItem';
import Button from '../components/common/Button';
import { ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck, Truck } from 'lucide-react';

export default function CartPage() {
  const {
    cartItems,
    subtotal,
    deliveryFee,
    grandTotal,
    discountSavings,
    clearCart,
    freeDeliveryThreshold,
    amountNeededForFreeDelivery
  } = useCart();

  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            backgroundColor: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            border: '2px dashed #a7f3d0'
          }}
        >
          <ShoppingBag size={40} />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          Your Basket is Empty
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.98rem', maxWidth: '420px', margin: '0 auto 2rem' }}>
          Explore our farm-fresh fruits, everyday staples, snacks, and household essentials to start filling your bag.
        </p>

        <Link to="/products" className="btn btn-primary" style={{ padding: '0.8rem 1.75rem', borderRadius: '12px' }}>
          <span>Start Shopping</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const freeDeliveryProgress = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  return (
    <div className="cart-page container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Page Heading */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            Shopping Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Review your chosen items before proceeding to express checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={clearCart}
          style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ef4444', textDecoration: 'underline' }}
        >
          Clear entire cart
        </button>
      </div>

      {/* Free Delivery Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          marginBottom: '1.75rem',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <Truck size={18} color={amountNeededForFreeDelivery === 0 ? '#059669' : '#d97706'} />
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
            {amountNeededForFreeDelivery === 0 ? (
              <span style={{ color: '#059669' }}>🎉 Congratulations! You have unlocked FREE Delivery!</span>
            ) : (
              <span>
                Add <strong style={{ color: '#059669' }}>₹{amountNeededForFreeDelivery}</strong> more to your order to get <strong style={{ color: '#059669' }}>FREE Delivery</strong>!
              </span>
            )}
          </div>
        </div>

        <div style={{ height: '8px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${freeDeliveryProgress}%`,
              backgroundColor: '#059669',
              borderRadius: '9999px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {/* Grid: Cart Items & Order Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          alignItems: 'start'
        }}
      >
        {/* Cart Items List */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {cartItems.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
            <Link
              to="/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#059669'
              }}
            >
              <ArrowLeft size={16} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '1.75rem',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
            position: 'sticky',
            top: 'calc(var(--header-height) + 1.5rem)'
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            Order Summary
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Items Subtotal</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{subtotal}</span>
            </div>

            {discountSavings > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                <span>Discount Savings</span>
                <span style={{ fontWeight: 700 }}>- ₹{discountSavings}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Delivery Charge</span>
              <span>
                {deliveryFee === 0 ? (
                  <strong style={{ color: '#059669' }}>FREE</strong>
                ) : (
                  <strong style={{ color: '#0f172a' }}>₹{deliveryFee}</strong>
                )}
              </span>
            </div>

            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '0.85rem',
                marginTop: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
              }}
            >
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Grand Total
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Inclusive of all taxes
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>
                ₹{grandTotal}
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate('/checkout')}
            icon={<ArrowRight size={18} />}
          >
            Proceed to Checkout
          </Button>

          {/* Secure Checkout Trust Note */}
          <div
            style={{
              marginTop: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              color: '#64748b'
            }}
          >
            <ShieldCheck size={16} color="#059669" />
            <span>100% Safe &amp; Verified Checkout Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}
