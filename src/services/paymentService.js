/**
 * Grocery Choice - Customer Payment Gateway Service Abstraction
 *
 * ARCHITECTURAL NOTICE:
 * This service manages payment method definitions, validation, prototype checkout
 * simulation, and order status transitions for the Customer storefront.
 *
 * FUTURE PRODUCTION INTEGRATION (Spring Boot + Payment Gateway):
 * When connecting to the Phase 2 Spring Boot backend & Payment Gateway (Razorpay / Cashfree):
 * 1. Customer React -> Calls Spring Boot: POST /api/payment/create-order { amount, currency, orderId }
 * 2. Spring Boot creates gateway order using server-side SECRET key and returns gateway orderId & public keyId.
 * 3. React frontend initializes Gateway SDK checkout modal with public keyId only (NEVER secret key).
 * 4. Customer authorizes payment on Gateway (UPI App / 3D Secure OTP / Bank portal).
 * 5. Gateway sends webhook to Spring Boot: POST /api/payment/webhook.
 * 6. Spring Boot verifies HMAC signature, marks order as PAID in MySQL database.
 * 7. React receives client callback and requests verified confirmation from Spring Boot: POST /api/payment/verify.
 *
 * SECURITY COMPLIANCE:
 * - NEVER collect or store UPI PIN.
 * - NEVER collect or store Card CVV or Card PIN.
 * - NEVER send raw card numbers to application backend (use PCI-DSS Level 1 gateway tokenization).
 * - NEVER put gateway secret API keys in frontend code.
 */

export const PAYMENT_METHODS = {
  UPI: 'UPI',
  CARD: 'Credit / Debit Card',
  NETBANKING: 'Net Banking',
  WALLET: 'Wallets',
  COD: 'Cash on Delivery'
};

export const PAYMENT_STATES = {
  IDLE: 'IDLE',
  INITIATED: 'INITIATED',
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  PENDING: 'PENDING'
};

// Configurable COD limit (can be overridden by backend config)
export const COD_MAX_AMOUNT = 10000;

/**
 * Checks if COD is eligible for the order total
 */
export function isCodEligible(totalAmount) {
  return totalAmount <= COD_MAX_AMOUNT;
}

/**
 * Popular UPI App options
 */
export const POPULAR_UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', iconBg: '#ea4335' },
  { id: 'phonepe', name: 'PhonePe', iconBg: '#5f259f' },
  { id: 'paytm', name: 'Paytm UPI', iconBg: '#00b9f5' },
  { id: 'bhim', name: 'BHIM UPI', iconBg: '#00796b' },
  { id: 'cred', name: 'CRED UPI', iconBg: '#1e293b' }
];

/**
 * Popular Indian Banks for Net Banking
 */
export const POPULAR_BANKS = [
  { id: 'sbi', name: 'State Bank of India', code: 'SBIN' },
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', code: 'ICIC' },
  { id: 'axis', name: 'Axis Bank', code: 'UTIB' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', code: 'KKBK' },
  { id: 'pnb', name: 'Punjab National Bank', code: 'PUNB' }
];

export const OTHER_BANKS = [
  { id: 'bob', name: 'Bank of Baroda' },
  { id: 'canara', name: 'Canara Bank' },
  { id: 'union', name: 'Union Bank of India' },
  { id: 'indusind', name: 'IndusInd Bank' },
  { id: 'idfc', name: 'IDFC FIRST Bank' },
  { id: 'yes', name: 'Yes Bank' },
  { id: 'federal', name: 'Federal Bank' }
];

/**
 * Supported Digital Wallets
 */
export const SUPPORTED_WALLETS = [
  { id: 'paytm_wallet', name: 'Paytm Wallet', desc: 'Fast checkout with Paytm balance' },
  { id: 'phonepe_wallet', name: 'PhonePe Wallet', desc: 'Instant deduction from PhonePe balance' },
  { id: 'amazon_pay', name: 'Amazon Pay', desc: 'Use your Amazon Pay balance' },
  { id: 'mobikwik', name: 'MobiKwik', desc: 'MobiKwik wallet & SuperCash' }
];

/**
 * Validates UPI Virtual Payment Address (VPA) format: name@bank
 */
export function validateUpiId(upiId) {
  if (!upiId || !upiId.trim()) {
    return { isValid: false, error: 'Please enter a valid UPI ID / VPA' };
  }
  const trimmed = upiId.trim();
  // Standard VPA pattern: alphanumeric/dots/dashes followed by @ followed by bank handle
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  if (!upiRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid UPI ID format. Example: name@okaxis or mobile@upi' };
  }
  return { isValid: true, error: null };
}

/**
 * Formats a 16-digit card number with spaces every 4 digits
 */
export function formatCardNumber(value) {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 16);
  return digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Detects card network by prefix digits
 */
export function detectCardNetwork(cardNumber) {
  const digits = cardNumber.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^(60|65|81|82)/.test(digits)) return 'RuPay';
  if (/^3[47]/.test(digits)) return 'Amex';
  return 'Card';
}

/**
 * Validates card inputs for gateway mock testing
 * Note: Card data is validated locally for format only and is NEVER stored or sent to backend.
 */
export function validateCardDetails({ cardNumber, cardholderName, expiryDate, cvv }) {
  const digits = (cardNumber || '').replace(/\D/g, '');
  if (digits.length < 15) {
    return { isValid: false, error: 'Please enter a valid 16-digit card number' };
  }
  if (!cardholderName || !cardholderName.trim()) {
    return { isValid: false, error: 'Please enter the cardholder name as printed on the card' };
  }
  const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!expiryRegex.test(expiryDate)) {
    return { isValid: false, error: 'Please enter a valid expiry in MM/YY format' };
  }
  const cvvDigits = (cvv || '').replace(/\D/g, '');
  if (cvvDigits.length < 3 || cvvDigits.length > 4) {
    return { isValid: false, error: 'Please enter a valid 3 or 4 digit CVV' };
  }
  return { isValid: true, error: null };
}

/**
 * Prototype Payment Gateway Simulation Engine
 *
 * Handles simulation of real payment gateway states:
 * - INITIATED: Creates payment intent
 * - PROCESSING: Gateway handshake / 3DS OTP simulation
 * - SUCCESS: Payment captured and verified
 * - FAILED: Simulated payment failure (insufficient funds, bank decline)
 * - CANCELLED: User closed gateway checkout modal
 *
 * CRITICAL SECURITY GUARANTEE:
 * Strips all sensitive card/UPI data. Only returns non-sensitive metadata (gateway paymentId, method).
 */
export async function simulateGatewayPayment({
  orderTotal,
  paymentMethod,
  _paymentDetails = {},
  simulationOutcome = 'SUCCESS'
}) {
  return new Promise((resolve) => {
    // Simulate network latency of payment gateway checkout handshake
    setTimeout(() => {
      if (simulationOutcome === 'CANCELLED') {
        resolve({
          status: PAYMENT_STATES.CANCELLED,
          message: 'Payment was cancelled by user. Your cart remains intact and no amount was charged.',
          paymentMethod
        });
        return;
      }

      if (simulationOutcome === 'FAILURE') {
        resolve({
          status: PAYMENT_STATES.FAILED,
          error: 'TRANSACTION_DECLINED',
          message: 'Payment failed: The issuing bank declined the transaction. Please retry or choose another payment method.',
          paymentMethod
        });
        return;
      }

      // Successful simulated transaction
      const randomTxnId = 'pay_' + Math.random().toString(36).substring(2, 12).toUpperCase();
      resolve({
        status: PAYMENT_STATES.SUCCESS,
        paymentId: randomTxnId,
        paymentMethod,
        amount: orderTotal,
        currency: 'INR',
        verified: true,
        timestamp: new Date().toISOString(),
        message: 'Payment authorized and verified successfully'
      });
    }, 1200);
  });
}
