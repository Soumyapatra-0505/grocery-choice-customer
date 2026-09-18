import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useDeliveryLocation } from '../context/LocationContext';
import Button from '../components/common/Button';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Clock,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  AlertCircle
} from 'lucide-react';

export default function CheckoutPage() {
  const { cartItems, subtotal, deliveryFee, grandTotal, discountSavings, clearCart, showToast } = useCart();
  const { user, placeOrder } = useAuth();
  const { selectedLocation, openLocationModal } = useDeliveryLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || 'Rahul Sharma',
    email: user?.email || 'rahul.sharma@example.com',
    phone: user?.phone || '+91 98765 43210',
    deliverySlot: 'Express Delivery (Within 25 mins)',
    paymentMethod: 'Cash on Delivery (COD)'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If cart is empty, redirect to cart page
  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
          No items to checkout
        </h1>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          Your shopping cart is currently empty. Add products before proceeding to checkout.
        </p>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Please enter your full name';
    if (!formData.phone.trim()) newErrors.phone = 'Please enter your mobile phone number';
    if (!selectedLocation) {
      newErrors.location = 'Please select a delivery location before placing your order';
      showToast('Please select a delivery location before placing your order', 'error');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const orderPayload = {
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        price: item.discountPrice || item.price,
        originalPrice: item.originalPrice,
        quantity: item.quantity,
        image: item.image
      })),
      subtotal,
      deliveryFee,
      discountSavings,
      total: grandTotal,
      deliverySlot: formData.deliverySlot,
      paymentMethod: formData.paymentMethod,
      deliveryLocation: selectedLocation,
      address: {
        fullName: formData.fullName,
        phone: formData.phone,
        street: selectedLocation.formattedAddress || 'Current Location',
        city: selectedLocation.city || 'Local Area',
        state: selectedLocation.state || '',
        pincode: selectedLocation.pincode || ''
      }
    };

    setTimeout(() => {
      const createdOrder = placeOrder(orderPayload);
      clearCart();
      showToast(`Order #${createdOrder.id} placed successfully!`, 'success');
      setIsSubmitting(false);
      navigate('/orders');
    }, 600);
  };

  return (
    <div className="checkout-page container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link
          to="/cart"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: '#059669',
            marginBottom: '0.75rem'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Cart</span>
        </Link>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
          Express Grocery Checkout
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Confirm your delivery address and schedule your contactless drop-off.
        </p>
      </div>

      <form onSubmit={handlePlaceOrder}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'start'
          }}
        >
          {/* Left Column: Customer & Address & Schedule */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* 1. Customer Information */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '1.75rem',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
              }}
            >
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                1. Contact Information
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">Full Name *</label>
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                  />
                  {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">Phone Number *</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="+91 98765 43210"
                  />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="email" className="form-label">Email Address (for invoice &amp; receipt)</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* 2. Delivery Location */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '1.75rem',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  2. Delivery Location
                </h2>
                {selectedLocation && (
                  <button
                    type="button"
                    onClick={() => openLocationModal('select')}
                    style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', textDecoration: 'underline' }}
                  >
                    Change Location
                  </button>
                )}
              </div>

              {selectedLocation ? (
                <div
                  style={{
                    backgroundColor: '#ecfdf5',
                    border: '1.5px solid #a7f3d0',
                    borderRadius: '14px',
                    padding: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: '#059669',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <MapPin size={19} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px'
                          }}
                        >
                          {selectedLocation.label || (selectedLocation.type === 'geolocation' ? 'GPS Location' : 'Home')}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#065f46' }}>
                          {selectedLocation.compactDisplay}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.92rem', color: '#1e293b', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                        {selectedLocation.formattedAddress}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px dashed #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: '#047857' }}>
                      Deliveries are routed to this exact address
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => openLocationModal('select')}
                    >
                      Change Location
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1.5px solid #fde68a',
                    borderRadius: '14px',
                    padding: '1.75rem 1.25rem',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#fef3c7',
                      color: '#b45309',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.75rem'
                    }}
                  >
                    <AlertCircle size={24} />
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#92400e', marginBottom: '0.35rem' }}>
                    Please select a delivery location
                  </h3>

                  <p style={{ fontSize: '0.88rem', color: '#b45309', marginBottom: '1.25rem', maxWidth: '380px', margin: '0 auto 1.25rem' }}>
                    You must select your location using browser GPS or enter an address manually before placing your order.
                  </p>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => openLocationModal('select')}
                    icon={<MapPin size={16} />}
                  >
                    Select Location
                  </Button>

                  {errors.location && (
                    <div style={{ marginTop: '0.75rem', color: '#dc2626', fontWeight: 700, fontSize: '0.82rem' }}>
                      {errors.location}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Delivery Time Slot */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '1.75rem',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
              }}
            >
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                3. Choose Delivery Slot
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  'Express Delivery (Within 25 mins)',
                  'Morning Slot (07:00 AM - 10:00 AM)',
                  'Afternoon Slot (01:00 PM - 04:00 PM)',
                  'Evening Slot (06:00 PM - 09:00 PM)'
                ].map((slot) => (
                  <label
                    key={slot}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: formData.deliverySlot === slot ? '2px solid #059669' : '1px solid #e2e8f0',
                      backgroundColor: formData.deliverySlot === slot ? '#ecfdf5' : '#ffffff',
                      cursor: 'pointer',
                      fontWeight: formData.deliverySlot === slot ? 700 : 500
                    }}
                  >
                    <input
                      type="radio"
                      name="deliverySlot"
                      value={slot}
                      checked={formData.deliverySlot === slot}
                      onChange={handleChange}
                      style={{ accentColor: '#059669', width: '18px', height: '18px' }}
                    />
                    <Clock size={16} color={formData.deliverySlot === slot ? '#059669' : '#64748b'} />
                    <span>{slot}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Payment Placeholder */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '1.75rem',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  4. Payment Options
                </h2>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', backgroundColor: '#ecfdf5', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  Mock Prototype
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { id: 'Cash on Delivery (COD)', label: 'Cash on Delivery / Pay on Drop', icon: <Banknote size={18} /> },
                  { id: 'UPI / Google Pay / PhonePe', label: 'UPI / QR Scan on Delivery (Instant)', icon: <Smartphone size={18} /> },
                  { id: 'Credit / Debit Card (Mock)', label: 'Credit / Debit Card (Mock Test)', icon: <CreditCard size={18} /> }
                ].map((opt) => (
                  <label
                    key={opt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: formData.paymentMethod === opt.id ? '2px solid #059669' : '1px solid #e2e8f0',
                      backgroundColor: formData.paymentMethod === opt.id ? '#ecfdf5' : '#ffffff',
                      cursor: 'pointer',
                      fontWeight: formData.paymentMethod === opt.id ? 700 : 500
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={opt.id}
                      checked={formData.paymentMethod === opt.id}
                      onChange={handleChange}
                      style={{ accentColor: '#059669', width: '18px', height: '18px' }}
                    />
                    <span style={{ color: formData.paymentMethod === opt.id ? '#059669' : '#64748b' }}>
                      {opt.icon}
                    </span>
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Action */}
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
              Order Summary ({cartItems.length} items)
            </h2>

            {/* Mini Items List */}
            <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '0.25rem' }}>
              {cartItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0', fontSize: '0.88rem', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                    <span style={{ fontWeight: 700 }}>{item.quantity}x</span> {item.name}
                  </div>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    ₹{(item.discountPrice || item.price) * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{subtotal}</span>
              </div>

              {discountSavings > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                  <span>Total Discount</span>
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
                  paddingTop: '0.75rem',
                  marginTop: '0.4rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}
              >
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Total Amount</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>₹{grandTotal}</span>
              </div>
            </div>

            {/* Delivery Destination Notice */}
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                backgroundColor: selectedLocation ? '#ecfdf5' : '#fffbeb',
                border: selectedLocation ? '1px solid #a7f3d0' : '1px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.82rem'
              }}
            >
              <MapPin size={16} color={selectedLocation ? '#059669' : '#b45309'} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedLocation ? (
                  <span>
                    Delivering to <strong style={{ color: '#065f46' }}>{selectedLocation.compactDisplay}</strong>
                  </span>
                ) : (
                  <span style={{ color: '#b45309', fontWeight: 700 }}>
                    ⚠️ Delivery location required
                  </span>
                )}
              </div>
              {!selectedLocation && (
                <button
                  type="button"
                  onClick={() => openLocationModal('select')}
                  style={{ color: '#059669', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'underline' }}
                >
                  Select
                </button>
              )}
            </div>

            {/* Place Order CTA */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              icon={<CheckCircle2 size={18} />}
            >
              {isSubmitting
                ? 'Placing Your Order...'
                : !selectedLocation
                ? 'Select Delivery Location to Place Order'
                : `Place Order • ₹${grandTotal}`}
            </Button>

            <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: '#64748b', textAlign: 'center', lineHeight: 1.4 }}>
              By placing this order you agree to Grocery Choice's Terms of Service and Freshness Guarantee.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
