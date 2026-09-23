import React from 'react';
import { PAYMENT_STATES } from '../../services/paymentService';
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  XCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import Button from '../common/Button';

export default function PaymentModal({
  isOpen,
  state,
  paymentMethod,
  orderTotal,
  paymentId,
  errorMessage,
  onRetry,
  onCancel,
  onSuccessDone
}) {
  if (!isOpen || state === PAYMENT_STATES.IDLE) return null;

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-card">
        {/* State 1: PROCESSING */}
        {state === PAYMENT_STATES.PROCESSING && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
            <div className="payment-spinner-wrap">
              <div className="payment-spinner" />
              <div className="payment-spinner-icon">
                <Lock size={20} color="#059669" />
              </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              Contacting Payment Gateway...
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Authorizing ₹{orderTotal} via <strong>{paymentMethod}</strong>
            </p>

            <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', fontSize: '0.78rem', color: '#64748b', border: '1px solid #e2e8f0', maxWidth: '340px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#059669', fontWeight: 700, marginBottom: '0.2rem' }}>
                <ShieldCheck size={14} />
                <span>128-Bit Bank Grade Encryption</span>
              </div>
              Please do not refresh the page or press the browser back button while we securely process your payment.
            </div>
          </div>
        )}

        {/* State 2: FAILED */}
        {state === PAYMENT_STATES.FAILED && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                border: '2px solid #fecaca'
              }}
            >
              <AlertCircle size={32} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b', marginBottom: '0.4rem' }}>
              Payment Failed
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.5rem', maxWidth: '360px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              {errorMessage || 'Your transaction was declined by the bank. No amount was debited from your account.'}
            </p>

            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.8rem', color: '#991b1b', marginBottom: '1.5rem', textAlign: 'left' }}>
              <strong>Notice:</strong> Your cart items are preserved. A confirmed paid order was NOT created.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outline"
                size="md"
                onClick={onCancel}
              >
                Change Payment Method
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={onRetry}
                icon={<RefreshCw size={15} />}
              >
                Retry Payment
              </Button>
            </div>
          </div>
        )}

        {/* State 3: CANCELLED */}
        {state === PAYMENT_STATES.CANCELLED && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fffbeb',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                border: '2px solid #fde68a'
              }}
            >
              <XCircle size={32} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400e', marginBottom: '0.4rem' }}>
              Payment Cancelled
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.5rem', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
              You cancelled the payment request. No money was deducted and your shopping cart has been preserved.
            </p>

            <Button
              variant="primary"
              size="md"
              onClick={onCancel}
              icon={<ArrowRight size={16} />}
            >
              Return to Checkout
            </Button>
          </div>
        )}

        {/* State 4: SUCCESS */}
        {state === PAYMENT_STATES.SUCCESS && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                border: '2px solid #a7f3d0'
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#065f46', marginBottom: '0.35rem' }}>
              Payment Verified Successfully!
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1rem' }}>
              Payment ID: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{paymentId}</strong>
            </p>

            <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '0.82rem', color: '#166534', marginBottom: '1.5rem' }}>
              Amount ₹{orderTotal} received via {paymentMethod}. Generating your confirmed delivery order now...
            </div>

            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={onSuccessDone}
            >
              View Order Confirmation &rarr;
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
