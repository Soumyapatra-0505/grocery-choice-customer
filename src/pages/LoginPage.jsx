import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Button from '../components/common/Button';
import Logo from '../assets/Logo';
import {
  sendOtp,
  verifyOtp,
  validateIdentifier,
  clearOtp,
  RESEND_COOLDOWN_SECONDS
} from '../services/otpService';
import {
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Mail,
  Edit2,
  RefreshCw,
  Sparkles,
  KeyRound,
  Radio
} from 'lucide-react';

export default function LoginPage() {
  // Step 1: 'identifier' | Step 2: 'otp'
  const [step, setStep] = useState('identifier');

  // Input states
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState('mobile'); // 'mobile' | 'email'
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  // UI & Feedback states
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoOtp, setDemoOtp] = useState(null);

  // Resend countdown state
  const [resendTimer, setResendTimer] = useState(0);

  // WebOTP listening state
  const [isListeningWebOtp, setIsListeningWebOtp] = useState(false);
  const webOtpAbortRef = useRef(null);

  // Refs for the 6 OTP input boxes
  const inputRefs = useRef([]);

  const { login } = useAuth();
  const { showToast } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || '/';

  // -------------------------------------------------------------
  // Countdown Timer Effect
  // -------------------------------------------------------------
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // -------------------------------------------------------------
  // Step 2: Verify OTP Handler
  // -------------------------------------------------------------
  const handleVerify = useCallback(async (otpToVerify = null) => {
    const code = typeof otpToVerify === 'string' ? otpToVerify : otpDigits.join('');

    setError('');

    if (code.length < 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }

    setIsSubmitting(true);
    const result = await verifyOtp(identifier, code);
    setIsSubmitting(false);

    if (result.success) {
      // Abort WebOTP listener on success
      if (webOtpAbortRef.current) {
        try {
          webOtpAbortRef.current.abort();
        } catch {
          // Ignore abort
        }
        webOtpAbortRef.current = null;
      }

      // Complete login in AuthContext with real token & user details
      login(result, result.token, identifierType === 'mobile' ? `Customer ${identifier.slice(-4)}` : '');
      showToast('Signed in successfully! Welcome to Grocery Choice.', 'success');
      navigate(redirectPath);
    } else {
      setError(result.message || 'Incorrect OTP. Please try again.');
    }
  }, [identifier, identifierType, login, navigate, otpDigits, redirectPath, showToast]);

  const handleVerifyRef = useRef(handleVerify);
  useEffect(() => {
    handleVerifyRef.current = handleVerify;
  }, [handleVerify]);

  // -------------------------------------------------------------
  // WebOTP API: Auto-read SMS OTP on supported browsers (Mobile only)
  // -------------------------------------------------------------
  useEffect(() => {
    // Only attempt WebOTP if on OTP step and identifier is mobile
    if (step !== 'otp' || identifierType !== 'mobile') {
      return;
    }

    // Check browser support for WebOTP
    if (typeof window !== 'undefined' && 'OTPCredential' in window && navigator.credentials) {
      const abortController = new AbortController();
      webOtpAbortRef.current = abortController;

      // Defer state update out of synchronous effect execution
      const timer = setTimeout(() => {
        setIsListeningWebOtp(true);
      }, 0);

      navigator.credentials
        .get({
          otp: { transport: ['sms'] },
          signal: abortController.signal
        })
        .then((otpCredential) => {
          setIsListeningWebOtp(false);
          if (otpCredential && otpCredential.code) {
            const code = otpCredential.code.trim();
            const digits = code.replace(/\D/g, '').slice(0, 6);
            if (digits.length === 6) {
              const newDigits = digits.split('');
              setOtpDigits(newDigits);
              showToast('OTP auto-detected from SMS!', 'info');
              // Automatically trigger verification once full OTP received safely
              handleVerifyRef.current(newDigits.join(''));
            }
          }
        })
        .catch((err) => {
          setIsListeningWebOtp(false);
          // Gracefully ignore AbortError (triggered on unmount or cancel)
          // Also ignore normal dismissal/timeout without showing an error banner
          if (err.name !== 'AbortError') {
            // Silently log for development debug; do NOT show user-facing error
            console.debug('WebOTP auto-read was not completed:', err.message);
          }
        });

      return () => {
        clearTimeout(timer);
        setIsListeningWebOtp(false);
        // Clean up and abort active listener on unmount or step change
        if (webOtpAbortRef.current) {
          try {
            webOtpAbortRef.current.abort();
          } catch {
            // Ignore abort error
          }
          webOtpAbortRef.current = null;
        }
      };
    }
  }, [step, identifierType, showToast]);

  // -------------------------------------------------------------
  // Step 1: Send OTP Handler
  // -------------------------------------------------------------
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setInfoMessage('');

    const validation = validateIdentifier(identifier);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setIsSubmitting(true);

    // Call Spring Boot OTP service
    const result = await sendOtp(identifier);
    setIsSubmitting(false);

    if (result.success) {
      setIdentifierType(result.type);
      setDemoOtp(result.demoCode);
      setStep('otp');
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(result.resendCooldownSeconds || RESEND_COOLDOWN_SECONDS);
      setInfoMessage(result.message);
      showToast(result.message, 'success');

      // Auto-focus first OTP input after DOM renders
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 50);
    } else {
      setError(result.error || 'Failed to send OTP. Please try again.');
    }
  };

  // -------------------------------------------------------------
  // Step 2: Resend OTP Handler
  // -------------------------------------------------------------
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isSubmitting) return;

    setError('');
    setIsSubmitting(true);

    const result = await sendOtp(identifier);
    setIsSubmitting(false);

    if (result.success) {
      setDemoOtp(result.demoCode);
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(result.resendCooldownSeconds || RESEND_COOLDOWN_SECONDS);
      setInfoMessage(`New OTP sent to your ${identifierType}.`);
      showToast(`New OTP sent to your ${identifierType}!`, 'success');

      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } else {
      setError(result.error || 'Failed to resend OTP.');
    }
  };

  // -------------------------------------------------------------
  // Step 2: Change Identifier Handler
  // -------------------------------------------------------------
  const handleChangeIdentifier = () => {
    // Abort active WebOTP listener
    if (webOtpAbortRef.current) {
      try {
        webOtpAbortRef.current.abort();
      } catch {
        // Ignore abort error
      }
      webOtpAbortRef.current = null;
    }
    clearOtp(identifier);
    setStep('identifier');
    setError('');
    setInfoMessage('');
    setDemoOtp(null);
    setOtpDigits(['', '', '', '', '', '']);
  };

  // -------------------------------------------------------------
  // OTP Input Field Handlers (Keyboard, Paste, Navigation)
  // -------------------------------------------------------------
  const handleDigitChange = (index, value) => {
    // Allow only single numeric digit
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    const digit = cleaned.slice(-1); // Take last entered digit
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    if (error) setError('');

    // Advance focus to next input if digit entered
    if (digit && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // If last digit filled, auto-verify if all 6 digits present
    const fullCode = updated.join('');
    if (fullCode.length === 6 && !updated.includes('')) {
      handleVerify(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0 && inputRefs.current[index - 1]) {
        // If current box is already empty, move to previous box and clear it
        e.preventDefault();
        const updated = [...otpDigits];
        updated[index - 1] = '';
        setOtpDigits(updated);
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0 && inputRefs.current[index - 1]) {
      e.preventDefault();
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5 && inputRefs.current[index + 1]) {
      e.preventDefault();
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digitsOnly = pastedData.replace(/\D/g, '').slice(0, 6);

    if (!digitsOnly) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < digitsOnly.length; i++) {
      newDigits[i] = digitsOnly[i];
    }
    setOtpDigits(newDigits);
    if (error) setError('');

    // Focus appropriate box
    const nextIndex = Math.min(digitsOnly.length, 5);
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus();
    }

    // Auto verify if complete 6 digits pasted
    if (digitsOnly.length === 6) {
      handleVerify(digitsOnly);
    }
  };

  // Quick helper to fill demo OTP
  const handleAutoFillDemoOtp = () => {
    if (demoOtp && demoOtp.length === 6) {
      const digits = demoOtp.split('');
      setOtpDigits(digits);
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
      handleVerify(demoOtp);
    }
  };

  // Demo Quick-Fill options for identifier
  const fillDemoIdentifier = (val) => {
    setIdentifier(val);
    setError('');
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '480px' }}>
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '2.5rem',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            <Logo size="large" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
            Login / Continue
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            {step === 'identifier'
              ? 'Enter your mobile number or email to receive an OTP'
              : 'Enter the 6-digit OTP sent to your mobile number/email.'}
          </p>
        </div>

        {/* Global Error Message */}
        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
              border: '1px solid #fca5a5'
            }}
          >
            {error}
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 1: IDENTIFIER INPUT (MOBILE OR EMAIL)               */}
        {/* ========================================================= */}
        {step === 'identifier' && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="loginIdentifier" className="form-label" style={{ fontWeight: 700 }}>
                Mobile Number or Email ID
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="loginIdentifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError('');
                  }}
                  className="form-input"
                  placeholder="Enter 10-digit mobile or email address"
                  autoFocus
                  autoComplete="username"
                  aria-required="true"
                  style={{ paddingLeft: '2.75rem' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {identifier.includes('@') ? <Mail size={18} /> : <Smartphone size={18} />}
                </div>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                We'll send a 6-digit one-time password (OTP) to verify your account.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting || !identifier.trim()}
              icon={<ArrowRight size={18} />}
            >
              {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
            </Button>

            {/* Quick Demo Pre-fills for Testing */}
            <div style={{ marginTop: '1.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚡ Quick Demo Credentials:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => fillDemoIdentifier('9876543210')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem' }}
                >
                  <Smartphone size={14} />
                  <span>Mobile: 9876543210</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoIdentifier('rahul.sharma@example.com')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem' }}
                >
                  <Mail size={14} />
                  <span>Email: rahul.sharma@...</span>
                </button>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem', color: '#64748b' }}>
              New to Grocery Choice?{' '}
              <Link to="/register" style={{ color: '#059669', fontWeight: 700 }}>
                Create an Account
              </Link>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 2: 6-DIGIT OTP VERIFICATION                        */}
        {/* ========================================================= */}
        {step === 'otp' && (
          <div className="otp-wrapper">
            {/* Target Identifier Pill with Change Option */}
            <div className="otp-target-pill">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {identifierType === 'mobile' ? (
                  <Smartphone size={16} color="#059669" />
                ) : (
                  <Mail size={16} color="#059669" />
                )}
                <span style={{ fontWeight: 700 }}>
                  {identifierType === 'mobile'
                    ? `+91 ${identifier.replace(/\D/g, '').slice(-10)}`
                    : identifier}
                </span>
              </div>
              <button
                type="button"
                onClick={handleChangeIdentifier}
                className="otp-change-btn"
                title="Change mobile number or email"
              >
                <Edit2 size={13} />
                <span>Change</span>
              </button>
            </div>

            {/* Info Message */}
            {infoMessage && (
              <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '0.65rem 0.9rem', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 600, border: '1px solid #a7f3d0', textAlign: 'center' }}>
                {infoMessage}
              </div>
            )}

            {/* WebOTP listening indicator on supported browsers */}
            {isListeningWebOtp && (
              <div className="otp-webotp-banner">
                <Radio size={14} className="spin-animation" />
                <span>Waiting to auto-read SMS OTP...</span>
              </div>
            )}

            {/* 6 Digit Input Boxes */}
            <div>
              <label
                htmlFor="otp-digit-0"
                style={{
                  display: 'block',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '0.5rem',
                  textAlign: 'center'
                }}
              >
                Enter 6-Digit OTP
              </label>

              <div
                className="otp-inputs-grid"
                onPaste={handlePaste}
                role="group"
                aria-label="6-Digit Verification Code"
              >
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-digit-${index}`}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`otp-box ${digit ? 'has-value' : ''} ${error ? 'is-invalid' : ''}`}
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Digit ${index + 1} of 6`}
                  />
                ))}
              </div>
            </div>

            {/* Resend OTP Row */}
            <div className="otp-resend-row">
              {resendTimer > 0 ? (
                <span>
                  Resend OTP in <strong style={{ color: '#0f172a' }}>{resendTimer} seconds</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="otp-resend-btn"
                  disabled={isSubmitting}
                >
                  <RefreshCw size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Resend OTP
                </button>
              )}

              <button
                type="button"
                onClick={handleChangeIdentifier}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Change {identifierType === 'mobile' ? 'Mobile' : 'Email'}
              </button>
            </div>

            {/* Verify OTP Button */}
            <Button
              type="button"
              onClick={() => handleVerify()}
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting || otpDigits.join('').length < 6}
              icon={<ShieldCheck size={18} />}
            >
              {isSubmitting ? 'Verifying OTP...' : 'Verify OTP'}
            </Button>

            {/* Prototype Demo OTP Helper Card */}
            {demoOtp && (
              <div className="otp-demo-card">
                <div>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <KeyRound size={14} />
                    <span>Prototype Demo OTP:</span>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.15em', marginTop: '2px' }}>
                    {demoOtp}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillDemoOtp}
                  className="otp-demo-btn"
                  title="Click to auto-fill and test verify instantly"
                >
                  <Sparkles size={12} style={{ display: 'inline', marginRight: '3px' }} />
                  Auto-Fill &amp; Verify
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation Link */}
        <div
          style={{
            marginTop: '2rem',
            textAlign: 'center',
            fontSize: '0.88rem',
            color: '#64748b',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '1.25rem'
          }}
        >
          Need help? Contact{' '}
          <a href="mailto:support@grocerychoice.com" style={{ color: '#059669', fontWeight: 700 }}>
            support@grocerychoice.com
          </a>
        </div>
      </div>
    </div>
  );
}
