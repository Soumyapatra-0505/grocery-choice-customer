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

// In-memory temporary store for active prototype OTPs
// Key: normalized identifier, Value: { code, expiresAt, type, createdAt, attempts }
const otpStore = new Map();

// OTP Validity Duration: 120 seconds (2 minutes)
export const OTP_EXPIRY_SECONDS = 120;
// Resend Cooldown Duration: 30 seconds
export const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Normalizes email or mobile number for consistent store lookup
 */
export function normalizeIdentifier(identifier) {
  if (!identifier) return '';
  const trimmed = identifier.trim();
  // Check if it's mobile (only digits, spaces, hyphens, plus)
  if (!trimmed.includes('@') && /^\+?[\d\s-]{8,}$/.test(trimmed)) {
    // Keep digits only, remove leading +91 or 91 if 12 digits, or keep 10-digit standard
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
  // Accepts 10 digits directly, or 11 with leading 0, or 12 with 91 country code
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
 * Generates and stores a mock 6-digit OTP for testing/development
 */
export function sendOtp(rawIdentifier) {
  const validation = validateIdentifier(rawIdentifier);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const normalized = validation.normalized;
  // Generate random 6-digit numeric OTP (100000 - 999999)
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  const expiresAt = now + OTP_EXPIRY_SECONDS * 1000;

  const record = {
    code,
    type: validation.type,
    identifier: normalized,
    rawIdentifier: rawIdentifier.trim(),
    createdAt: now,
    expiresAt,
    attempts: 0
  };

  otpStore.set(normalized, record);

  // In development, return the code so the UI can provide an easy demo helper
  return {
    success: true,
    type: validation.type,
    identifier: normalized,
    demoCode: code,
    expiresInSeconds: OTP_EXPIRY_SECONDS,
    message: validation.type === 'mobile'
      ? `6-digit OTP sent to +91 ${normalized}`
      : `6-digit OTP sent to ${normalized}`
  };
}

/**
 * Verifies the entered 6-digit OTP
 */
export function verifyOtp(rawIdentifier, inputCode) {
  const normalized = normalizeIdentifier(rawIdentifier);
  const record = otpStore.get(normalized);

  if (!inputCode || typeof inputCode !== 'string' || inputCode.length !== 6 || !/^\d{6}$/.test(inputCode)) {
    return {
      success: false,
      error: 'INVALID_FORMAT',
      message: 'Please enter a complete 6-digit numeric OTP'
    };
  }

  if (!record) {
    return {
      success: false,
      error: 'NOT_FOUND',
      message: 'No active OTP found for this number/email. Please request a new OTP.'
    };
  }

  // Check Expiration
  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalized);
    return {
      success: false,
      error: 'EXPIRED',
      message: 'This OTP has expired. Please click "Resend OTP" to receive a new code.'
    };
  }

  // Check Attempts limit (e.g. max 5 wrong attempts)
  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(normalized);
    return {
      success: false,
      error: 'MAX_ATTEMPTS',
      message: 'Too many incorrect attempts. For security, please request a fresh OTP.'
    };
  }

  // Verify Code
  if (record.code !== inputCode) {
    return {
      success: false,
      error: 'MISMATCH',
      message: 'Incorrect OTP. Please check the 6-digit code and try again.'
    };
  }

  // Success: Clear OTP so it cannot be reused
  otpStore.delete(normalized);
  return {
    success: true,
    message: 'OTP verified successfully',
    type: record.type,
    identifier: normalized
  };
}

/**
 * Clears active OTP for an identifier (e.g., when user goes back to change identifier)
 */
export function clearOtp(rawIdentifier) {
  const normalized = normalizeIdentifier(rawIdentifier);
  otpStore.delete(normalized);
}

/**
 * Helper to inspect current active mock OTP (useful for testing/demo banner)
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
