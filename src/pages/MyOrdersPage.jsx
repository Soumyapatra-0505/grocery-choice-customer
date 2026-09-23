import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import OrderCard from '../components/order/OrderCard';
import { orderApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { Package, ArrowRight, ShoppingBag, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState(null);
  const { showToast } = useCart();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderApi.getMyOrders().catch(() => orderApi.getByCustomerId(1));
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch customer orders:', err);
      setError(err.message || 'Unable to load orders from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this order? Any reserved stock will be returned to inventory.');
    if (!confirmCancel) return;

    try {
      setCancellingId(orderId);
      const cancelled = await orderApi.cancel(orderId);
      showToast(`Order #${cancelled.orderNumber || orderId} has been cancelled.`, 'success');
      await fetchOrders();
    } catch (err) {
      console.error('Failed to cancel order:', err);
      showToast(err.message || 'Failed to cancel order.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="orders-page container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '900px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
            My Grocery Orders
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Track active deliveries, inspect past receipts, and manage your Grocery Choice orders.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={fetchOrders}
            className="btn btn-secondary"
            title="Refresh orders from database"
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <Link to="/products" className="btn btn-secondary">
            <ShoppingBag size={16} />
            <span>Shop More Groceries</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            style={{ fontWeight: 700, textDecoration: 'underline', color: '#b91c1c', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ padding: '4rem 0', textAlign: 'center', color: '#64748b' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#059669' }} />
          <p style={{ fontWeight: 600 }}>Loading your orders from MySQL...</p>
        </div>
      ) : orders && orders.length > 0 ? (
        /* Orders List */
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onCancel={handleCancelOrder}
              isCancelling={cancellingId === order.id}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
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
