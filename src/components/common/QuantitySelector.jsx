import React from 'react';
import { Minus, Plus } from 'lucide-react';

export default function QuantitySelector({
  quantity = 1,
  min = 1,
  max = 99,
  onChange,
  onIncrement,
  onDecrement,
  size = 'md',
  disabled = false,
  label = 'Quantity'
}) {
  const handleDec = (e) => {
    e.stopPropagation();
    if (quantity > min) {
      if (onDecrement) onDecrement();
      else if (onChange) onChange(quantity - 1);
    }
  };

  const handleInc = (e) => {
    e.stopPropagation();
    if (quantity < max) {
      if (onIncrement) onIncrement();
      else if (onChange) onChange(quantity + 1);
    }
  };

  const isSmall = size === 'sm';

  return (
    <div
      className="qty-selector"
      role="group"
      aria-label={label}
      style={{
        height: isSmall ? '34px' : '40px',
      }}
    >
      <button
        type="button"
        className="qty-btn"
        onClick={handleDec}
        disabled={disabled || quantity <= min}
        aria-label="Decrease quantity"
        style={{ width: isSmall ? '32px' : '38px', height: '100%' }}
      >
        <Minus size={isSmall ? 14 : 16} strokeWidth={2.5} />
      </button>

      <span
        className="qty-value"
        aria-live="polite"
        style={{
          minWidth: isSmall ? '28px' : '36px',
          fontSize: isSmall ? '0.85rem' : '0.95rem'
        }}
      >
        {quantity}
      </span>

      <button
        type="button"
        className="qty-btn"
        onClick={handleInc}
        disabled={disabled || quantity >= max}
        aria-label="Increase quantity"
        style={{ width: isSmall ? '32px' : '38px', height: '100%' }}
      >
        <Plus size={isSmall ? 14 : 16} strokeWidth={2.5} />
      </button>
    </div>
  );
}
