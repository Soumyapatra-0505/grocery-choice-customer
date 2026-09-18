import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import QuantitySelector from '../common/QuantitySelector';

export default function ProductCard({ product }) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const cartQty = getItemQuantity(product.id);

  const isOutOfStock = product.stockStatus === 'out_of_stock';
  const isLowStock = product.stockStatus === 'low_stock';

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  return (
    <article className="product-card" aria-label={product.name}>
      <Link to={`/product/${product.id}`} className="product-image-wrap" tabIndex={-1}>
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />

        {/* Badges */}
        <div className="product-badges">
          {product.discountPercentage > 0 && (
            <span className="badge-discount">
              {product.discountPercentage}% OFF
            </span>
          )}

          {isOutOfStock ? (
            <span className="stock-tag stock-out" role="status">Out of Stock</span>
          ) : isLowStock ? (
            <span className="stock-tag stock-low" role="status">Only {product.stockCount} left</span>
          ) : (
            <span className="stock-tag stock-in" role="status">In Stock</span>
          )}
        </div>
      </Link>

      <div className="product-content">
        <div className="product-category-tag">{product.categoryName}</div>

        <h3 className="product-title">
          <Link to={`/product/${product.id}`} title={product.name}>
            {product.name}
          </Link>
        </h3>

        <div className="product-unit">{product.unit}</div>

        <div className="product-rating">
          <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
          <span>{product.rating}</span>
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>({product.reviewCount})</span>
        </div>

        <div className="product-bottom-row">
          <div className="product-price-box">
            <div className="price-current">₹{product.discountPrice}</div>
            {product.originalPrice > product.discountPrice && (
              <div className="price-original">₹{product.originalPrice}</div>
            )}
          </div>

          <div className="product-action-wrap">
            {isOutOfStock ? (
              <button
                type="button"
                disabled
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', minHeight: '36px', opacity: 0.6 }}
              >
                Sold Out
              </button>
            ) : cartQty > 0 ? (
              <QuantitySelector
                quantity={cartQty}
                size="sm"
                onIncrement={() => updateQuantity(product.id, cartQty + 1)}
                onDecrement={() => updateQuantity(product.id, cartQty - 1)}
                max={product.stockCount || 99}
              />
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className="btn btn-secondary"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  minHeight: '36px',
                  borderRadius: '8px'
                }}
                aria-label={`Add ${product.name} to cart`}
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>ADD</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
