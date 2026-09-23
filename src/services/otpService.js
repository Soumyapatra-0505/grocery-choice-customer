/**
 * Grocery Choice - Mock OTP Authentication Service
 * 
 * ARCHITECTURAL NOTICE:
 * This service manages temporary OTP generation, storage, expiration, and validation
 * for the customer frontend prototype.
 * 
 * FUTURE PRODUCTION INTEGRATION (Spring Boot + SMS/Email Provider):
 * When connecting to the Phase 2 Spring Boot backend:
 * 1. sendOtp(identifier, type):
 *    -> Replace with POST /api/auth/send-otp { identifier, type }
 *    -> Spring Boot will generate a cryptographically secure OTP, hash it in Redis/DB,
 *       and dispatch via SMS gateway (Twilio/AWS SNS/Msg91) or Email (SendGrid/JavaMail).
 * 2. verifyOtp(identifier, code):
 *    -> Replace with POST /api/auth/verify-otp { identifier, code }
 *    -> Spring Boot validates code, returns JWT access/refresh tokens and customer profile.
 * 
 * WEBOTP SMS FORMAT (For Mobile SMS Auto-Reading):
 * For supported mobile browsers (Chrome on Android, etc.) to automatically read the SMS OTP,
 * the SMS dispatched by the gateway must follow the W3C WebOTP API specification:
 * 
 * -------------------------------------------------------------
 * <#> Your Grocery Choice verification code is 123456.
 * 
 * @localhost:5173 #123456
 * -------------------------------------------------------------
 * 
 * Note: The final line MUST begin with "@" followed by the exact domain/origin,
 * a space, and "#" followed by the 6-digit OTP code.
 */

import { authApi } from './api';

// In-memory temporary store for dev/testing fallback
const otpStore = new Map();

// OTP Validity Duration: 300 seconds (5 minutes)
export const OTP_EXPIRY_SECONDS = 300;
// Resend Cooldown Duration: 60 seconds
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Normalizes email or mobile number for consistent store lookup
 */
export function normalizeIdentifier(identifier) {
  if (!identifier) return '';
  const trimmed = identifier.trim();
  // Check if it's mobile (only digits, spaces, hyphens, plus)
  if (!trimmed.includes('@') && /^\+?[\d\s-]{8,}$/.test(trimmed)) {
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      return digitsOnly.slice(2);
    }
    return digitsOnly;
  }
  return trimmed.toLowerCase();
}

/**
 * Validates whether the identifier is a valid 10-digit mobile number or standard email
 */
export function validateIdentifier(input) {
  if (!input || !input.trim()) {
    return { isValid: false, type: null, error: 'Please enter your mobile number or email ID' };
  }

  const trimmed = input.trim();

  // Email check
  if (trimmed.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { isValid: false, type: 'email', error: 'Please enter a valid email address' };
    }
    return { isValid: true, type: 'email', normalized: trimmed.toLowerCase(), error: null };
  }

  // Mobile number check
  const digits = trimmed.replace(/\D/g, '');
  const is10Digit = digits.length === 10 && /^[6-9]\d{9}$/.test(digits);
  const is11Digit = digits.length === 11 && digits.startsWith('0') && /^[6-9]\d{9}$/.test(digits.slice(1));
  const is12Digit = digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2));

  if (is10Digit || is11Digit || is12Digit) {
    const normalizedMobile = is10Digit ? digits : (is11Digit ? digits.slice(1) : digits.slice(2));
    return { isValid: true, type: 'mobile', normalized: normalizedMobile, error: null };
  }

  return {
    isValid: false,
    type: 'mobile',
    error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)'
  };
}

/**
 * Sends a cryptographically secure OTP via Spring Boot backend API
 */
export async function sendOtp(rawIdentifier) {
  const validation = validateIdentifier(rawIdentifier);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const normalized = validation.normalized;

  try {
    const res = await authApi.sendOtp(normalized, 'LOGIN');

    // In local development / test mode, fetch dev OTP for the auto-fill helper
    let devCode = null;
    try {
      const devRes = await authApi.getDevOtp(normalized);
      if (devRes && devRes.otp) {
        devCode = devRes.otp;
      }
    } catch {
      // Dev endpoint may not be reached or enabled in strict prod
    }

    return {
      success: true,
      type: validation.type,
      identifier: normalized,
      demoCode: devCode,
      expiresInSeconds: res.expiresInSeconds || OTP_EXPIRY_SECONDS,
      resendCooldownSeconds: res.resendCooldownSeconds || RESEND_COOLDOWN_SECONDS,
      message: res.message || (validation.type === 'mobile'
        ? `6-digit OTP sent to +91 ${normalized}`
        : `6-digit OTP sent to ${normalized}`)
    };
  } catch (err) {
    console.error('Error sending OTP from server:', err);
    return {
      success: false,
      error: err.message || 'Failed to send OTP. Please try again.'
    };
  }
}

/**
 * Verifies the entered 6-digit OTP against Spring Boot backend and obtains JWT
 */
export async function verifyOtp(rawIdentifier, inputCode, name = '') {
  const validation = validateIdentifier(rawIdentifier);
  const normalized = validation.isValid ? validation.normalized : normalizeIdentifier(rawIdentifier);

  if (!inputCode || typeof inputCode !== 'string' || inputCode.length !== 6 || !/^\d{6}$/.test(inputCode)) {
    return {
      success: false,
      error: 'INVALID_FORMAT',
      message: 'Please enter a complete 6-digit numeric OTP'
    };
  }

  try {
    const res = await authApi.verifyOtp(normalized, inputCode, name);
    return {
      success: true,
      message: res.message || 'OTP verified successfully',
      type: validation.type,
      identifier: normalized,
      token: res.token,
      user: res.user
    };
  } catch (err) {
    console.error('Error verifying OTP with server:', err);
    return {
      success: false,
      error: err.message,
      message: err.message || 'Verification failed. Please try again.'
    };
  }
}

/**
 * Clears active OTP state
 */
export function clearOtp(rawIdentifier) {
  const normalized = normalizeIdentifier(rawIdentifier);
  otpStore.delete(normalized);
}

/**
 * Helper to inspect active OTP
 */
export function getActiveMockOtp(rawIdentifier) {
  const normalized = normalizeIdentifier(rawIdentifier);
  const record = otpStore.get(normalized);
  if (record && Date.now() <= record.expiresAt) {
    return {
      code: record.code,
      remainingSeconds: Math.max(0, Math.ceil((record.expiresAt - Date.now()) / 1000))
    };
  }
  return null;
}
