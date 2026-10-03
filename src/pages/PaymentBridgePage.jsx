import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadRazorpayScript } from '../services/paymentService';
import { ShieldCheck, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

/**
 * Grocery Choice - Mobile Payment Bridge Page
 * Route: /payment/bridge
 * 
 * Secure web bridge between React Native Customer App (via expo-web-browser)
 * and Razorpay Checkout.js.
 * 
 * - Receives orderId, razorpay_order_id, key, amount, etc.
 * - Safely loads and opens Razorpay Checkout.js.
 * - On success, redirects to grocerychoice://payment/verify with signature parameters.
 * - On cancel/failure, returns to grocerychoice://payment/verify with appropriate status.
 * - NEVER contains or exposes Razorpay secrets.
 * - DOES NOT perform client-side signature verification (done server-side).
 * - DOES NOT create another order in database.
 */
export default function PaymentBridgePage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('initializing'); // 'initializing' | 'ready' | 'active' | 'cancelled' | 'failed' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const autoLaunchedRef = useRef(false);

  // Extract query parameters
  const orderId = searchParams.get('orderId') || searchParams.get('order_id') || searchParams.get('id');
  const razorpayOrderId =
    searchParams.get('razorpay_order_id') ||
    searchParams.get('razorpayOrderId') ||
    searchParams.get('order_id');
  const keyId =
    searchParams.get('key') ||
    searchParams.get('razorpayKeyId') ||
    searchParams.get('key_id');
  const amountStr = searchParams.get('amount');
  const amount = amountStr ? parseInt(amountStr, 10) : 19900;
  const currency = searchParams.get('currency') || 'INR';
  const customerName = searchParams.get('name') || '';
  const customerEmail = searchParams.get('email') || '';
  const customerPhone = searchParams.get('contact') || searchParams.get('phone') || '';
  const returnUrl = searchParams.get('return_url') || searchParams.get('returnUrl') || 'grocerychoice://payment/verify';

  // Format currency helper
  const formattedAmount = (amount / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2
  });

  const launchRazorpay = useCallback(() => {
    if (!orderId || !razorpayOrderId || !keyId) {
      setStatus('error');
      setErrorMessage('Missing required payment parameters (order ID, Razorpay order ID, or Key ID).');
      return;
    }

    if (!window.Razorpay) {
      setStatus('error');
      setErrorMessage('Razorpay Checkout SDK is not loaded. Please tap "Reload Gateway".');
      return;
    }

    setStatus('active');

    const options = {
      key: keyId,
      amount: amount,
      currency: currency,
      name: 'Grocery Choice',
      description: `Order #${orderId}`,
      image: '/favicon.svg',
      order_id: razorpayOrderId,
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone
      },
      theme: {
        color: '#059669'
      },
      modal: {
        ondismiss: function () {
          setStatus('cancelled');
          const sep = returnUrl.includes('?') ? '&' : '?';
          const cancelRedirect = `${returnUrl}${sep}orderId=${encodeURIComponent(orderId)}&status=CANCELLED`;
          window.location.href = cancelRedirect;
        }
      },
      handler: function (response) {
        setStatus('ready');
        // Secure Deep-Link Return to Mobile App
        // Passes back razorpay_order_id, razorpay_payment_id, razorpay_signature
        // Mobile app will invoke server-side paymentsApi.verifyPayment() as authoritative check
        const sep = returnUrl.includes('?') ? '&' : '?';
        const successRedirect = `${returnUrl}${sep}orderId=${encodeURIComponent(orderId)}&razorpay_order_id=${encodeURIComponent(response.razorpay_order_id)}&razorpay_payment_id=${encodeURIComponent(response.razorpay_payment_id)}&razorpay_signature=${encodeURIComponent(response.razorpay_signature)}`;
        window.location.href = successRedirect;
      }
    };

    try {
      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (failResponse) {
        setStatus('failed');
        const desc = failResponse?.error?.description || 'Payment was declined by issuing bank.';
        setErrorMessage(desc);
        const sep = returnUrl.includes('?') ? '&' : '?';
        const failRedirect = `${returnUrl}${sep}orderId=${encodeURIComponent(orderId)}&status=FAILED&errorMessage=${encodeURIComponent(desc)}`;
        window.location.href = failRedirect;
      });

      rzp.open();
    } catch (err) {
      console.error('Failed to open Razorpay checkout:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to initialize payment gateway.');
    }
  }, [orderId, razorpayOrderId, keyId, amount, currency, customerName, customerEmail, customerPhone, returnUrl]);

  useEffect(() => {
    let isMounted = true;

    async function initSdk() {
      if (!orderId || !razorpayOrderId || !keyId) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage('Invalid payment request: orderId, razorpay_order_id, and key are required.');
        }
        return;
      }

      try {
        const loaded = await loadRazorpayScript();
        if (isMounted) {
          if (loaded && window.Razorpay) {
            setIsSdkLoaded(true);
            setStatus('ready');
            if (!autoLaunchedRef.current) {
              autoLaunchedRef.current = true;
              setTimeout(() => {
                if (isMounted) {
                  launchRazorpay();
                }
              }, 250);
            }
          } else {
            setStatus('error');
            setErrorMessage('Unable to load Razorpay Checkout SDK. Please check your internet connection.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err.message || 'Error loading payment gateway.');
        }
      }
    }

    initSdk();

    return () => {
      isMounted = false;
    };
  }, [orderId, razorpayOrderId, keyId, launchRazorpay]);

  const handleCancelAndReturn = () => {
    const sep = returnUrl.includes('?') ? '&' : '?';
    window.location.href = `${returnUrl}${sep}orderId=${encodeURIComponent(orderId || '')}&status=CANCELLED`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header Badge */}
        <div style={styles.badgeWrap}>
          <div style={styles.brandBadge}>
            <ShieldCheck size={18} color="#059669" />
            <span style={styles.brandBadgeText}>Grocery Choice Secure Payment</span>
          </div>
        </div>

        {/* Order Details */}
        <div style={styles.orderSummaryBox}>
          <div style={styles.orderRow}>
            <span style={styles.orderLabel}>Order Number</span>
            <span style={styles.orderValue}>#{orderId || '---'}</span>
          </div>
          <div style={styles.orderRow}>
            <span style={styles.orderLabel}>Amount Payable</span>
            <span style={styles.orderAmount}>{formattedAmount}</span>
          </div>
          <div style={styles.orderRow}>
            <span style={styles.orderLabel}>Gateway</span>
            <span style={styles.gatewayTag}>Razorpay Test Mode</span>
          </div>
        </div>

        {/* Status Area */}
        <div style={styles.statusArea}>
          {status === 'initializing' && (
            <div style={styles.statusMessageRow}>
              <Loader2 size={24} color="#059669" style={styles.spinner} />
              <div style={styles.statusTextCol}>
                <span style={styles.statusTitle}>Connecting to Payment Gateway...</span>
                <span style={styles.statusSub}>Preparing secure checkout window</span>
              </div>
            </div>
          )}

          {status === 'active' && (
            <div style={styles.statusMessageRow}>
              <Loader2 size={24} color="#059669" style={styles.spinner} />
              <div style={styles.statusTextCol}>
                <span style={styles.statusTitle}>Checkout Active</span>
                <span style={styles.statusSub}>Complete payment in the Razorpay overlay</span>
              </div>
            </div>
          )}

          {status === 'ready' && (
            <div style={styles.statusMessageRow}>
              <CheckCircle2 size={24} color="#059669" />
              <div style={styles.statusTextCol}>
                <span style={styles.statusTitle}>Gateway Ready</span>
                <span style={styles.statusSub}>Tap button below if window did not open</span>
              </div>
            </div>
          )}

          {status === 'cancelled' && (
            <div style={styles.statusMessageRow}>
              <AlertCircle size={24} color="#d97706" />
              <div style={styles.statusTextCol}>
                <span style={styles.statusTitleWarn}>Payment Cancelled</span>
                <span style={styles.statusSub}>Returning to Grocery Choice App...</span>
              </div>
            </div>
          )}

          {(status === 'failed' || status === 'error') && (
            <div style={styles.statusMessageRow}>
              <AlertCircle size={24} color="#dc2626" />
              <div style={styles.statusTextCol}>
                <span style={styles.statusTitleError}>
                  {status === 'failed' ? 'Payment Declined' : 'Gateway Notice'}
                </span>
                <span style={styles.statusSub}>{errorMessage || 'Unable to complete checkout.'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={styles.actionCol}>
          <button
            type="button"
            onClick={launchRazorpay}
            disabled={status === 'initializing' || !isSdkLoaded}
            style={{
              ...styles.primaryBtn,
              opacity: status === 'initializing' || !isSdkLoaded ? 0.7 : 1,
              cursor: status === 'initializing' || !isSdkLoaded ? 'not-allowed' : 'pointer'
            }}
          >
            ⚡ Open Razorpay Checkout
          </button>

          <button
            type="button"
            onClick={handleCancelAndReturn}
            style={styles.cancelBtn}
          >
            <ArrowLeft size={16} style={{ marginRight: 6 }} />
            Cancel & Return to App
          </button>
        </div>

        {/* Security Notice */}
        <div style={styles.footnote}>
          <span>🔒 256-bit SSL Encrypted • Direct Bank Authorization</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: '16px',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
  },
  card: {
    maxWidth: '420px',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  badgeWrap: {
    display: 'flex',
    justifyContent: 'center'
  },
  brandBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ecfdf5',
    color: '#059669',
    fontSize: '12px',
    fontWeight: '700',
    padding: '6px 12px',
    borderRadius: '9999px',
    border: '1px solid #a7f3d0'
  },
  brandBadgeText: {
    letterSpacing: '0.2px'
  },
  orderSummaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '14px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  orderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  orderLabel: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500'
  },
  orderValue: {
    fontSize: '13px',
    color: '#0f172a',
    fontWeight: '700'
  },
  orderAmount: {
    fontSize: '18px',
    color: '#059669',
    fontWeight: '800'
  },
  gatewayTag: {
    fontSize: '11px',
    backgroundColor: '#e2e8f0',
    color: '#475569',
    padding: '2px 8px',
    borderRadius: '6px',
    fontWeight: '600'
  },
  statusArea: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '14px',
    border: '1px dashed #cbd5e1'
  },
  statusMessageRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  statusTextCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  statusTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a'
  },
  statusTitleWarn: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#d97706'
  },
  statusTitleError: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#dc2626'
  },
  statusSub: {
    fontSize: '12px',
    color: '#64748b'
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  },
  actionCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    padding: '14px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
  },
  cancelBtn: {
    width: '100%',
    backgroundColor: 'transparent',
    color: '#64748b',
    border: '1px solid #cbd5e1',
    padding: '12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s ease'
  },
  footnote: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#94a3b8',
    paddingTop: '4px'
  }
};
