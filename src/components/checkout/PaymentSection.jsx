import React, { useState } from 'react';
import {
  PAYMENT_METHODS,
  POPULAR_UPI_APPS,
  POPULAR_BANKS,
  OTHER_BANKS,
  SUPPORTED_WALLETS,
  COD_MAX_AMOUNT,
  isCodEligible,
  detectCardNetwork,
  formatCardNumber
} from '../../services/paymentService';
import {
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
  Banknote,
  ShieldCheck,
  Lock,
  QrCode,
  CheckCircle2,
  Info,
  Sparkles
} from 'lucide-react';

export default function PaymentSection({
  selectedMethod,
  onSelectMethod,
  orderTotal,
  paymentDetails,
  onPaymentDetailsChange,
  simulationOutcome,
  onSimulationOutcomeChange,
  validationErrors = {}
}) {
  const [upiMode, setUpiMode] = useState('app'); // 'app' | 'vpa' | 'qr'

  const handleCardChange = (field, value) => {
    let formattedValue = value;
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      const clean = value.replace(/\D/g, '').slice(0, 4);
      if (clean.length > 2) {
        formattedValue = `${clean.slice(0, 2)}/${clean.slice(2)}`;
      } else {
        formattedValue = clean;
      }
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    onPaymentDetailsChange({
      ...paymentDetails,
      [field]: formattedValue
    });
  };

  const codAvailable = isCodEligible(orderTotal);

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.75rem',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} color="#059669" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Payment Method
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#64748b' }}>
          <Lock size={12} color="#059669" />
          <span>100% Secure &amp; Encrypted</span>
        </div>
      </div>

      {/* Payment Method Selector Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {/* 1. UPI */}
        <div
          className={`payment-method-card ${selectedMethod === PAYMENT_METHODS.UPI ? 'active' : ''}`}
          onClick={() => onSelectMethod(PAYMENT_METHODS.UPI)}
        >
          <div className="payment-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="radio"
                name="paymentMethodOption"
                value={PAYMENT_METHODS.UPI}
                checked={selectedMethod === PAYMENT_METHODS.UPI}
                onChange={() => onSelectMethod(PAYMENT_METHODS.UPI)}
                style={{ accentColor: '#059669', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div className="payment-card-icon">
                <Smartphone size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  UPI (Google Pay, PhonePe, Paytm, BHIM)
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Instant zero-fee payment via any UPI app or UPI ID
                </div>
              </div>
            </div>

            <span className="payment-badge-pill" style={{ backgroundColor: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
              Recommended
            </span>
          </div>

          {/* Expanded UPI Details */}
          {selectedMethod === PAYMENT_METHODS.UPI && (
            <div className="payment-subpanel" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`payment-subtab-btn ${upiMode === 'app' ? 'active' : ''}`}
                  onClick={() => setUpiMode('app')}
                >
                  Popular UPI Apps
                </button>
                <button
                  type="button"
                  className={`payment-subtab-btn ${upiMode === 'vpa' ? 'active' : ''}`}
                  onClick={() => setUpiMode('vpa')}
                >
                  Enter UPI ID / VPA
                </button>
                <button
                  type="button"
                  className={`payment-subtab-btn ${upiMode === 'qr' ? 'active' : ''}`}
                  onClick={() => setUpiMode('qr')}
                >
                  <QrCode size={14} />
                  <span>Scan QR Code</span>
                </button>
              </div>

              {/* UPI App Selection */}
              {upiMode === 'app' && (
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                    Select your preferred UPI app:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
                    {POPULAR_UPI_APPS.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        className={`upi-app-chip ${(paymentDetails.upiApp || 'gpay') === app.id ? 'active' : ''}`}
                        onClick={() => onPaymentDetailsChange({ ...paymentDetails, upiApp: app.id })}
                      >
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: app.iconBg,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.72rem'
                          }}
                        >
                          {app.name.charAt(0)}
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{app.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* VPA ID Entry */}
              {upiMode === 'vpa' && (
                <div>
                  <label htmlFor="upiVpaId" className="form-label" style={{ fontSize: '0.82rem' }}>
                    Enter Virtual Payment Address (VPA) / UPI ID *
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      id="upiVpaId"
                      type="text"
                      className="form-input"
                      placeholder="e.g. rahul@okaxis or 9876543210@upi"
                      value={paymentDetails.upiId || ''}
                      onChange={(e) => onPaymentDetailsChange({ ...paymentDetails, upiId: e.target.value })}
                      style={{ fontSize: '0.88rem' }}
                    />
                  </div>
                  {validationErrors.upiId && (
                    <div className="form-error" style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>
                      {validationErrors.upiId}
                    </div>
                  )}
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.35rem' }}>
                    A payment request will be sent to your UPI app for authorization.
                  </div>
                </div>
              )}

              {/* QR Code Preview */}
              {upiMode === 'qr' && (
                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'inline-block', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <QrCode size={110} color="#0f172a" />
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginTop: '0.5rem' }}>
                    Scan &amp; Pay ₹{orderTotal}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Scan with Google Pay, PhonePe, Paytm or any BHIM UPI app
                  </div>
                </div>
              )}

              {/* Security Banner */}
              <div className="payment-security-tip">
                <ShieldCheck size={14} color="#059669" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Security Note:</strong> Grocery Choice never asks for your UPI PIN. Enter your PIN only inside your authentic UPI app.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Credit / Debit Card */}
        <div
          className={`payment-method-card ${selectedMethod === PAYMENT_METHODS.CARD ? 'active' : ''}`}
          onClick={() => onSelectMethod(PAYMENT_METHODS.CARD)}
        >
          <div className="payment-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="radio"
                name="paymentMethodOption"
                value={PAYMENT_METHODS.CARD}
                checked={selectedMethod === PAYMENT_METHODS.CARD}
                onChange={() => onSelectMethod(PAYMENT_METHODS.CARD)}
                style={{ accentColor: '#059669', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div className="payment-card-icon">
                <CreditCard size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  Credit / Debit Card
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Visa, Mastercard, RuPay, Maestro &amp; American Express
                </div>
              </div>
            </div>

            <span className="payment-badge-pill" style={{ backgroundColor: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}>
              Gateway Ready
            </span>
          </div>

          {/* Expanded Card Details */}
          {selectedMethod === PAYMENT_METHODS.CARD && (
            <div className="payment-subpanel" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Card Number */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="cardNumberInput" className="form-label" style={{ fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Card Number *</span>
                    <span style={{ color: '#059669', fontWeight: 800 }}>
                      {detectCardNetwork(paymentDetails.cardNumber || '')}
                    </span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="cardNumberInput"
                      type="text"
                      className="form-input"
                      placeholder="4532 •••• •••• 8921"
                      maxLength={19}
                      value={paymentDetails.cardNumber || ''}
                      onChange={(e) => handleCardChange('cardNumber', e.target.value)}
                      style={{ fontSize: '0.92rem', letterSpacing: '0.05em', paddingRight: '2.5rem' }}
                    />
                    <CreditCard size={18} color="#94a3b8" style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                  {validationErrors.cardNumber && <span className="form-error">{validationErrors.cardNumber}</span>}
                </div>

                {/* Cardholder Name */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="cardholderNameInput" className="form-label" style={{ fontSize: '0.82rem' }}>
                    Name on Card *
                  </label>
                  <input
                    id="cardholderNameInput"
                    type="text"
                    className="form-input"
                    placeholder="e.g. RAHUL SHARMA"
                    value={paymentDetails.cardholderName || ''}
                    onChange={(e) => handleCardChange('cardholderName', e.target.value.toUpperCase())}
                    style={{ fontSize: '0.88rem' }}
                  />
                  {validationErrors.cardholderName && <span className="form-error">{validationErrors.cardholderName}</span>}
                </div>

                {/* Expiry and CVV */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="cardExpiryInput" className="form-label" style={{ fontSize: '0.82rem' }}>
                      Expiry Date *
                    </label>
                    <input
                      id="cardExpiryInput"
                      type="text"
                      className="form-input"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={paymentDetails.expiryDate || ''}
                      onChange={(e) => handleCardChange('expiryDate', e.target.value)}
                      style={{ fontSize: '0.88rem' }}
                    />
                    {validationErrors.expiryDate && <span className="form-error">{validationErrors.expiryDate}</span>}
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="cardCvvInput" className="form-label" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span>CVV / CVC *</span>
                      <span title="3 digits on back of Visa/Mastercard, 4 digits on front of Amex" style={{ cursor: 'help' }}>
                        <Info size={13} color="#94a3b8" />
                      </span>
                    </label>
                    <input
                      id="cardCvvInput"
                      type="password"
                      className="form-input"
                      placeholder="•••"
                      maxLength={4}
                      value={paymentDetails.cvv || ''}
                      onChange={(e) => handleCardChange('cvv', e.target.value)}
                      style={{ fontSize: '0.88rem' }}
                    />
                    {validationErrors.cvv && <span className="form-error">{validationErrors.cvv}</span>}
                  </div>
                </div>
              </div>

              {/* Security Note */}
              <div className="payment-security-tip">
                <Lock size={14} color="#059669" style={{ flexShrink: 0 }} />
                <span>
                  <strong>PCI-DSS Certified:</strong> Card details are processed directly via encrypted payment gateway iframe. Grocery Choice never stores your card number, CVV or card PIN.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Net Banking */}
        <div
          className={`payment-method-card ${selectedMethod === PAYMENT_METHODS.NETBANKING ? 'active' : ''}`}
          onClick={() => onSelectMethod(PAYMENT_METHODS.NETBANKING)}
        >
          <div className="payment-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="radio"
                name="paymentMethodOption"
                value={PAYMENT_METHODS.NETBANKING}
                checked={selectedMethod === PAYMENT_METHODS.NETBANKING}
                onChange={() => onSelectMethod(PAYMENT_METHODS.NETBANKING)}
                style={{ accentColor: '#059669', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div className="payment-card-icon">
                <Building2 size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  Net Banking
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  All major Indian public &amp; private sector banks supported
                </div>
              </div>
            </div>

            <span className="payment-badge-pill" style={{ backgroundColor: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' }}>
              All Banks
            </span>
          </div>

          {/* Expanded Net Banking Details */}
          {selectedMethod === PAYMENT_METHODS.NETBANKING && (
            <div className="payment-subpanel" onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                Popular Banks:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '0.85rem' }}>
                {POPULAR_BANKS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`bank-chip ${(paymentDetails.bankId || 'sbi') === b.id ? 'active' : ''}`}
                    onClick={() => onPaymentDetailsChange({ ...paymentDetails, bankId: b.id })}
                  >
                    <Building2 size={15} color="#059669" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{b.name}</span>
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="otherBanksSelect" className="form-label" style={{ fontSize: '0.82rem' }}>
                  Or Select Other Bank:
                </label>
                <select
                  id="otherBanksSelect"
                  className="form-select"
                  value={paymentDetails.bankId || 'sbi'}
                  onChange={(e) => onPaymentDetailsChange({ ...paymentDetails, bankId: e.target.value })}
                  style={{ fontSize: '0.88rem' }}
                >
                  <optgroup label="Popular Banks">
                    {POPULAR_BANKS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Other Supported Banks">
                    {OTHER_BANKS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="payment-security-tip">
                <Info size={14} color="#059669" style={{ flexShrink: 0 }} />
                <span>
                  You will be securely redirected to your bank's authenticated payment gateway to approve this transaction.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Wallets */}
        <div
          className={`payment-method-card ${selectedMethod === PAYMENT_METHODS.WALLET ? 'active' : ''}`}
          onClick={() => onSelectMethod(PAYMENT_METHODS.WALLET)}
        >
          <div className="payment-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="radio"
                name="paymentMethodOption"
                value={PAYMENT_METHODS.WALLET}
                checked={selectedMethod === PAYMENT_METHODS.WALLET}
                onChange={() => onSelectMethod(PAYMENT_METHODS.WALLET)}
                style={{ accentColor: '#059669', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div className="payment-card-icon">
                <Wallet size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  Wallets
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Paytm, PhonePe, Amazon Pay &amp; MobiKwik
                </div>
              </div>
            </div>

            <span className="payment-badge-pill" style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
              Quick Checkout
            </span>
          </div>

          {/* Expanded Wallet Details */}
          {selectedMethod === PAYMENT_METHODS.WALLET && (
            <div className="payment-subpanel" onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                Select Wallet Provider:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
                {SUPPORTED_WALLETS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    className={`wallet-chip ${(paymentDetails.walletId || 'paytm_wallet') === w.id ? 'active' : ''}`}
                    onClick={() => onPaymentDetailsChange({ ...paymentDetails, walletId: w.id })}
                  >
                    <Wallet size={16} color="#059669" />
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{w.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{w.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="payment-security-tip">
                <ShieldCheck size={14} color="#059669" style={{ flexShrink: 0 }} />
                <span>
                  Your registered mobile number will be linked securely via OTP on the gateway checkout screen.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 5. Cash on Delivery (COD) */}
        <div
          className={`payment-method-card ${selectedMethod === PAYMENT_METHODS.COD ? 'active' : ''} ${!codAvailable ? 'disabled' : ''}`}
          onClick={() => {
            if (codAvailable) onSelectMethod(PAYMENT_METHODS.COD);
          }}
        >
          <div className="payment-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="radio"
                name="paymentMethodOption"
                value={PAYMENT_METHODS.COD}
                checked={selectedMethod === PAYMENT_METHODS.COD}
                onChange={() => onSelectMethod(PAYMENT_METHODS.COD)}
                disabled={!codAvailable}
                style={{ accentColor: '#059669', width: '18px', height: '18px', cursor: codAvailable ? 'pointer' : 'not-allowed' }}
              />
              <div className="payment-card-icon">
                <Banknote size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  Cash on Delivery (COD)
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Pay via cash or UPI QR scan at your doorstep upon arrival
                </div>
              </div>
            </div>

            <span className="payment-badge-pill" style={{ backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
              Pay on Delivery
            </span>
          </div>

          {/* Expanded COD Details */}
          {selectedMethod === PAYMENT_METHODS.COD && (
            <div className="payment-subpanel" onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  color: '#334155'
                }}
              >
                <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <span>No Online Payment Required Right Now</span>
                </div>
                <div>
                  Your order will be scheduled immediately with <strong>Payment Status: Pending</strong>. You can hand cash or scan the delivery agent's UPI QR code upon arrival.
                </div>
              </div>

              {!codAvailable && (
                <div style={{ marginTop: '0.5rem', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600 }}>
                  ⚠️ Cash on Delivery is available for orders up to ₹{COD_MAX_AMOUNT.toLocaleString('en-IN')}. Please choose an online payment method.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prototype Gateway Sandbox Controls */}
      <div
        style={{
          padding: '0.85rem 1rem',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1',
          fontSize: '0.82rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#0f172a' }}>
            <Sparkles size={14} color="#059669" />
            <span>Prototype Gateway Test Sandbox:</span>
          </div>
          <span style={{ fontSize: '0.72rem', backgroundColor: '#e2e8f0', color: '#475569', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
            Phase 1 Mock Mode
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontWeight: simulationOutcome === 'SUCCESS' ? 700 : 500 }}>
            <input
              type="radio"
              name="simOutcome"
              value="SUCCESS"
              checked={simulationOutcome === 'SUCCESS'}
              onChange={() => onSimulationOutcomeChange('SUCCESS')}
              style={{ accentColor: '#059669' }}
            />
            <span style={{ color: '#059669' }}>Simulate Success</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontWeight: simulationOutcome === 'FAILURE' ? 700 : 500 }}>
            <input
              type="radio"
              name="simOutcome"
              value="FAILURE"
              checked={simulationOutcome === 'FAILURE'}
              onChange={() => onSimulationOutcomeChange('FAILURE')}
              style={{ accentColor: '#dc2626' }}
            />
            <span style={{ color: '#dc2626' }}>Simulate Failure</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontWeight: simulationOutcome === 'CANCELLED' ? 700 : 500 }}>
            <input
              type="radio"
              name="simOutcome"
              value="CANCELLED"
              checked={simulationOutcome === 'CANCELLED'}
              onChange={() => onSimulationOutcomeChange('CANCELLED')}
              style={{ accentColor: '#d97706' }}
            />
            <span style={{ color: '#d97706' }}>Simulate Cancel</span>
          </label>
        </div>
      </div>
    </div>
  );
}
