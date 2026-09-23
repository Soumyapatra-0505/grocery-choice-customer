import React, { useState } from 'react';
import { Package, Truck, CheckCircle2, Clock, ChevronDown, ChevronUp, MapPin, XCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Button from '../common/Button';

export default function OrderCard({ order, onCancel, isCancelling }) {
  const [expanded, setExpanded] = useState(false);
  const { addToCart } = useCart();

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', icon: <CheckCircle2 size={16} />, label: 'Delivered' };
      case 'OUT_FOR_DELIVERY':
      case 'OUT FOR DELIVERY':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', icon: <Truck size={16} />, label: 'Out for Delivery' };
      case 'PROCESSING':
        return { bg: '#fef3c7', text: '#d97706', border: '#fde68a', icon: <Clock size={16} />, label: 'Processing' };
      case 'CONFIRMED':
        return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', icon: <CheckCircle2 size={16} />, label: 'Confirmed' };
      case 'CANCELLED':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', icon: <XCircle size={16} />, label: 'Cancelled' };
      case 'PLACED':
      default:
        return { bg: '#fffbeb', text: '#b45309', border: '#fde68a', icon: <Clock size={16} />, label: status || 'Placed' };
    }
  };

  const statusStyle = getStatusColor(order.status);
  const orderNumber = order.orderNumber || (typeof order.id === 'string' && order.id.startsWith('GC-') ? order.id : `GC-ORD-${order.id}`);
  const displayTotal = order.totalAmount !== undefined ? order.totalAmount : order.total;
  const formattedDate = order.formattedDate || (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Recently Placed');

  const canCancel = (order.status === 'PLACED' || order.status === 'CONFIRMED' || order.status === 'Placed') && !!onCancel;

  const handleReorder = () => {
    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        const productObj = {
          id: item.productId || item.id,
          name: item.productName || item.name,
          unit: item.unit,
          price: item.price || item.discountPrice,
          sellingPrice: item.price || item.discountPrice,
          image: item.imageUrl || item.image
        };
        addToCart(productObj, item.quantity || 1);
      });
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        marginBottom: '1.25rem',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
      }}
    >
      {/* Card Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '1rem',
          borderBottom: '1px solid #f1f5f9',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}
          >
            <Package size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', fontFamily: 'monospace' }}>
              {orderNumber}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Placed on {formattedDate}
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: statusStyle.bg,
            color: statusStyle.text,
            border: `1px solid ${statusStyle.border}`,
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: 700
          }}
        >
          {statusStyle.icon}
          <span>{statusStyle.label}</span>
        </div>
      </div>

      {/* Item Thumbs Preview */}
      <div style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {order.items?.map((item, idx) => (
            <div
              key={idx}
              title={`${item.productName || item.name} (${item.quantity}x)`}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fafbfc'
              }}
            >
              <img
                src={item.imageUrl || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'}
                alt={item.productName || item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
          <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '0.25rem' }}>
            {order.items?.length} {order.items?.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Total Amount
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            ₹{displayTotal}
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '0.1rem 0.45rem',
              borderRadius: '4px',
              backgroundColor: order.paymentStatus === 'PAID' || order.paymentStatus === 'Paid' ? '#ecfdf5' : '#fffbeb',
              color: order.paymentStatus === 'PAID' || order.paymentStatus === 'Paid' ? '#065f46' : '#92400e',
              border: `1px solid ${order.paymentStatus === 'PAID' || order.paymentStatus === 'Paid' ? '#a7f3d0' : '#fde68a'}`,
              display: 'inline-block',
              marginTop: '0.15rem'
            }}
          >
            Payment: {order.paymentStatus || 'PENDING'}
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div
          style={{
            paddingTop: '1rem',
            marginTop: '0.5rem',
            borderTop: '1px dashed #e2e8f0',
            fontSize: '0.88rem',
            color: '#475569'
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Items Ordered</div>
            {order.items?.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.35rem 0',
                  borderBottom: '1px solid #f8fafc'
                }}
              >
                <span>
                  {item.quantity}x {item.productName || item.name} ({item.unit})
                </span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  ₹{item.subtotal || ((item.price || item.discountPrice) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={14} color="#059669" /> Delivery Address
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                {order.deliveryAddressText || order.address?.street || 'Standard Delivery Address'}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Delivery Slot</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                {order.deliverySlot || 'Standard Delivery (30-45 mins)'}
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.5rem', marginBottom: '0.25rem' }}>Payment Method</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                {order.paymentMethod || 'Cash on Delivery'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Actions Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid #f1f5f9',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            color: '#059669',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}
        >
          <span>{expanded ? 'Hide Details' : 'View Order Breakdown'}</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              disabled={isCancelling}
              onClick={() => onCancel(order.id)}
              style={{
                color: '#dc2626',
                borderColor: '#fca5a5',
                backgroundColor: '#fff'
              }}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleReorder}
          >
            Reorder All Items
          </Button>
        </div>
      </div>
    </div>
  );
}
