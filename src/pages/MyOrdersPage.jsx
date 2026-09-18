import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OrderCard from '../components/order/OrderCard';
import { Package, ArrowRight, ShoppingBag } from 'lucide-react';

export default function MyOrdersPage() {
  const { orders } = useAuth();

  return (
    <div className="orders-page container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '900px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
            My Grocery Orders
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Track active deliveries, inspect past receipts, and effortlessly reorder essentials.
          </p>
        </div>

        <Link to="/products" className="btn btn-secondary">
          <ShoppingBag size={16} />
          <span>Shop More Groceries</span>
        </Link>
      </div>

      {/* Orders List */}
      {orders && orders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '4rem 2rem',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}
          >
            <Package size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            No Orders Placed Yet
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
            When you place an order with Grocery Choice, you can track its delivery status and review details here.
          </p>
          <Link to="/products" className="btn btn-primary" style={{ margin: '0 auto' }}>
            <span>Explore Products</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
