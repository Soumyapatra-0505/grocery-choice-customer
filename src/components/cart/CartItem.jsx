import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import QuantitySelector from '../common/QuantitySelector';
import { useCart } from '../../context/CartContext';

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  const price = item.discountPrice || item.price;
  const itemTotal = price * item.quantity;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.25rem 0',
        borderBottom: '1px solid #e2e8f0',
        flexWrap: 'wrap'
      }}
    >
      {/* Product Image */}
      <Link
        to={`/product/${item.id}`}
        style={{
          width: '75px',
          height: '75px',
          borderRadius: '10px',
          overflow: 'hidden',
          backgroundColor: '#f8fafc',
          flexShrink: 0,
          border: '1px solid #f1f5f9'
        }}
      >
        <img
          src={item.image}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Link>

      {/* Product Info */}
      <div style={{ flex: '1 1 200px' }}>
        <Link
          to={`/product/${item.id}`}
          style={{
            fontWeight: 700,
            fontSize: '0.98rem',
            color: '#0f172a',
            display: 'block',
            marginBottom: '0.25rem'
          }}
        >
          {item.name}
        </Link>
        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
          {item.unit} • ₹{price} each
        </div>
      </div>

      {/* Quantity Stepper */}
      <div>
        <QuantitySelector
          quantity={item.quantity}
          min={1}
          max={item.stockCount || 99}
          onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
          onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
        />
      </div>

      {/* Item Total Price */}
      <div style={{ minWidth: '90px', textAlign: 'right' }}>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
          ₹{itemTotal}
        </div>
        {item.originalPrice && item.originalPrice > price && (
          <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
            Saved ₹{(item.originalPrice - price) * item.quantity}
          </div>
        )}
      </div>

      {/* Remove Button */}
      <div>
        <button
          type="button"
          onClick={() => removeFromCart(item.id)}
          aria-label={`Remove ${item.name} from cart`}
          style={{
            padding: '0.5rem',
            color: '#94a3b8',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.backgroundColor = '#fee2e2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
