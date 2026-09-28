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
 * <#> Your Grocery Choice verification code is 1234.
 * 
 * @localhost:5173 #1234
 * -------------------------------------------------------------
 * 
 * Note: The final line MUST begin with "@" followed by the exact domain/origin,
 * a space, and "#" followed by the 4-digit OTP code.
 */

import { authApi } from './api';

// In-memory temporary store for dev/testing fallback
const otpStore = new Map();

// OTP Validity Duration: 300 seconds (5 minutes)
export const OTP_EXPIRY_SECONDS = 300;
// Resend Cooldown Duration: 60 seconds
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Checks whether MSG91 Web SDK OTP Widget is enabled via Vite environment variables
 */
export function isMsg91Enabled() {
  const widgetId = import.meta.env.VITE_MSG91_WIDGET_ID;
  const tokenAuth = import.meta.env.VITE_MSG91_TOKEN_AUTH;
  return Boolean(widgetId && tokenAuth && String(widgetId).trim() !== '' && String(tokenAuth).trim() !== '');
}

/**
 * Converts a raw Indian mobile or email identifier to the MSG91 identifier format:
 * 91XXXXXXXXXX (country code without +) for mobile numbers
 */
export function toMsg91Identifier(rawIdentifier) {
  if (!rawIdentifier) return '';
  const trimmed = rawIdentifier.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

// Cached promise for dynamic MSG91 SDK script loading
let sdkLoadPromise = null;

/**
 * Loads the MSG91 Web SDK dynamically and initializes it in exposeMethods mode
 * adhering to MSG91's official Custom UI integration specification:
 * - widgetId
 * - tokenAuth
 * - exposeMethods: true
 * - initSendOTP(configuration)
 */
export function loadMsg91Sdk() {
  if (!isMsg91Enabled()) {
    return Promise.resolve(false);
  }

  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  // Already initialized and methods exposed?
  if (typeof window.sendOtp === 'function' && typeof window.verifyOtp === 'function') {
    return Promise.resolve(true);
  }

  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

  const widgetId = import.meta.env.VITE_MSG91_WIDGET_ID?.trim();
  const tokenAuth = import.meta.env.VITE_MSG91_TOKEN_AUTH?.trim();

  if (!widgetId || !tokenAuth) {
    return Promise.reject(new Error('MSG91 widgetId or tokenAuth configuration is missing.'));
  }

  // Official configuration object per MSG91 documentation
  const configuration = {
    widgetId,
    tokenAuth,
    exposeMethods: true,
    success: (data) => {
      if (import.meta.env.DEV) {
        console.debug('[MSG91 Widget] success callback event:', data);
      }
    },
    failure: (err) => {
      if (import.meta.env.DEV) {
        console.debug('[MSG91 Widget] failure callback event:', err);
      }
    }
  };

  // Set window.configuration for official Web SDK convention
  window.configuration = configuration;

  const rawPromise = new Promise((resolve, reject) => {
    let checkMethodsTimer = null;
    let waitForInitTimer = null;

    const cleanupTimers = () => {
      if (checkMethodsTimer) clearInterval(checkMethodsTimer);
      if (waitForInitTimer) clearInterval(waitForInitTimer);
    };

    const fail = (error) => {
      cleanupTimers();
      sdkLoadPromise = null;
      if (import.meta.env.DEV) {
        console.warn('[MSG91 SDK Loader] Initialization error:', error?.message || error);
      }
      reject(error);
    };

    // Helper: Poll for exposed methods on window after initSendOTP
    const waitForExposedMethods = () => {
      let attempts = 0;
      const maxAttempts = 150; // 15 seconds (150 * 100ms) to allow Angular custom element to bootstrap
      checkMethodsTimer = setInterval(() => {
        attempts++;
        if (typeof window.sendOtp === 'function' && typeof window.verifyOtp === 'function') {
          cleanupTimers();
          if (import.meta.env.DEV) {
            console.debug(`[MSG91 SDK Loader] Methods successfully exposed on window in ${attempts * 100}ms`);
          }
          resolve(true);
        } else if (attempts >= maxAttempts) {
          cleanupTimers();
          if (typeof window.sendOtp === 'function') {
            resolve(true);
          } else {
            fail(new Error('MSG91 Web SDK timed out waiting for exposed methods (sendOtp, verifyOtp) on window.'));
          }
        }
      }, 100);
    };

    // Helper: Execute window.initSendOTP with configuration
    const executeInit = () => {
      try {
        if (typeof window.initSendOTP !== 'function') {
          fail(new Error('MSG91 initSendOTP function not found on window.'));
          return;
        }

        window.initSendOTP(configuration);
        waitForExposedMethods();
      } catch (err) {
        fail(err instanceof Error ? err : new Error(String(err)));
      }
    };

    // Helper: Wait for window.initSendOTP to be defined once script is present/loaded
    const waitForInitFunction = (maxWaitMs = 10000) => {
      if (typeof window.initSendOTP === 'function') {
        executeInit();
        return;
      }
      const start = Date.now();
      waitForInitTimer = setInterval(() => {
        if (typeof window.initSendOTP === 'function') {
          clearInterval(waitForInitTimer);
          executeInit();
        } else if (Date.now() - start > maxWaitMs) {
          clearInterval(waitForInitTimer);
          fail(new Error('Timed out waiting for MSG91 initSendOTP to initialize.'));
        }
      }, 50);
    };

    // Case 1: initSendOTP is already available on window
    if (typeof window.initSendOTP === 'function') {
      executeInit();
      return;
    }

    // Case 2: Script element already exists in document
    const existingScript = document.querySelector('script[src*="otp-provider.js"]');
    if (existingScript) {
      waitForInitFunction(10000);
      return;
    }

    // Case 3: Create and append script dynamically
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;

    script.onload = () => {
      if (import.meta.env.DEV) {
        console.debug('[MSG91 SDK Loader] Script downloaded successfully from https://verify.msg91.com/otp-provider.js');
      }
      waitForInitFunction(8000);
    };

    script.onerror = () => {
      try {
        script.remove();
      } catch {
        // Ignore removal error
      }
      fail(new Error('Failed to load MSG91 OTP SDK from https://verify.msg91.com/otp-provider.js'));
    };

    // Set src AFTER attaching handlers to prevent race conditions with cached scripts
    script.src = 'https://verify.msg91.com/otp-provider.js';

    const targetParent = document.body || document.head || document.documentElement;
    targetParent.appendChild(script);
  });

  // Automatically reset sdkLoadPromise on failure so future attempts can retry
  sdkLoadPromise = rawPromise.catch((err) => {
    sdkLoadPromise = null;
    throw err;
  });

  return sdkLoadPromise;
}

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
 * Sends a cryptographically secure OTP via MSG91 Web SDK (when configured)
 * or via Spring Boot backend API (in dev/database fallback mode).
 */
export async function sendOtp(rawIdentifier) {
  const validation = validateIdentifier(rawIdentifier);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const normalized = validation.normalized;

  // Use MSG91 Web SDK when widget credentials are configured
  if (isMsg91Enabled()) {
    try {
      await loadMsg91Sdk();
      if (typeof window.sendOtp !== 'function') {
        throw new Error('MSG91 window.sendOtp is not available');
      }

      const msg91Identifier = toMsg91Identifier(rawIdentifier);

      const msg91Res = await new Promise((resolve, reject) => {
        window.sendOtp(
          msg91Identifier,
          (response) => resolve(response),
          (error) => reject(error)
        );
      });

      console.debug('MSG91 sendOtp success response:', msg91Res);

      return {
        success: true,
        type: validation.type,
        identifier: normalized,
        demoCode: null,
        expiresInSeconds: OTP_EXPIRY_SECONDS,
        resendCooldownSeconds: RESEND_COOLDOWN_SECONDS,
        message: validation.type === 'mobile'
          ? `4-digit OTP sent to +91 ${normalized}`
          : `4-digit OTP sent to ${normalized}`
      };
    } catch (err) {
      console.error('Error sending OTP via MSG91:', err);
      const errMsg = (typeof err === 'string' ? err : err?.message || err?.errors || 'Failed to send OTP via MSG91');
      return {
        success: false,
        error: errMsg
      };
    }
  }

  // Fallback: Default Spring Boot dev/database OTP delivery
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
        ? `4-digit OTP sent to +91 ${normalized}`
        : `4-digit OTP sent to ${normalized}`)
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
 * Resends OTP using MSG91 Web SDK retryOtp or fallback sendOtp
 */
export async function retryOtp(rawIdentifier, channel = null) {
  const validation = validateIdentifier(rawIdentifier);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const normalized = validation.normalized;

  if (isMsg91Enabled()) {
    try {
      await loadMsg91Sdk();
      if (typeof window.retryOtp !== 'function') {
        return await sendOtp(rawIdentifier);
      }

      await new Promise((resolve, reject) => {
        window.retryOtp(
          channel,
          (response) => resolve(response),
          (error) => reject(error)
        );
      });

      return {
        success: true,
        type: validation.type,
        identifier: normalized,
        demoCode: null,
        expiresInSeconds: OTP_EXPIRY_SECONDS,
        resendCooldownSeconds: RESEND_COOLDOWN_SECONDS,
        message: `New OTP sent to your ${validation.type}.`
      };
    } catch (err) {
      console.error('Error resending OTP via MSG91:', err);
      const errMsg = (typeof err === 'string' ? err : err?.message || err?.errors || 'Failed to resend OTP via MSG91');
      return {
        success: false,
        error: errMsg
      };
    }
  }

  // Fallback: Use standard sendOtp for dev/backend
  return await sendOtp(rawIdentifier);
}

/**
 * Verifies the entered 4-digit OTP.
 * When MSG91 is enabled:
 * 1. Calls MSG91 Web SDK window.verifyOtp(code)
 * 2. Obtains MSG91 access token from response
 * 3. Sends access token to Spring Boot /api/auth/msg91/verify for secure server-side validation
 * 4. Receives Grocery Choice JWT and Customer profile
 *
 * When MSG91 is not enabled (dev fallback):
 * Calls /api/auth/verify-otp against Spring Boot
 */
export async function verifyOtp(rawIdentifier, inputCode, name = '') {
  const validation = validateIdentifier(rawIdentifier);
  const normalized = validation.isValid ? validation.normalized : normalizeIdentifier(rawIdentifier);

  if (!inputCode || typeof inputCode !== 'string' || inputCode.length !== 4 || !/^\d{4}$/.test(inputCode)) {
    return {
      success: false,
      error: 'INVALID_FORMAT',
      message: 'Please enter a complete 4-digit numeric OTP'
    };
  }

  if (isMsg91Enabled()) {
    try {
      await loadMsg91Sdk();
      if (typeof window.verifyOtp !== 'function') {
        throw new Error('MSG91 window.verifyOtp is not available');
      }

      // Step 1: Verify OTP with MSG91 Web SDK
      const msg91Res = await new Promise((resolve, reject) => {
        window.verifyOtp(
          inputCode,
          (response) => resolve(response),
          (error) => reject(error)
        );
      });

      console.debug('MSG91 verifyOtp success response:', msg91Res);

      // Step 2: Extract MSG91 access token
      const accessToken = (typeof msg91Res === 'string' ? msg91Res : null)
        || msg91Res?.['access-token']
        || msg91Res?.accessToken
        || msg91Res?.token
        || msg91Res?.data?.['access-token']
        || (typeof msg91Res?.message === 'string' && msg91Res.message.startsWith('eyJ') ? msg91Res.message : null)
        || msg91Res?.message;

      if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
        throw new Error('MSG91 did not return a valid access token after OTP verification');
      }

      // Step 3: Server-side token verification with Spring Boot backend
      // Backend validates access token with MSG91 using MSG91_AUTH_KEY and issues Grocery Choice JWT
      const authRes = await authApi.verifyMsg91Token(accessToken.trim(), normalized, name);

      return {
        success: true,
        message: authRes.message || 'OTP verified successfully',
        type: validation.type,
        identifier: normalized,
        token: authRes.token,
        user: authRes.user
      };
    } catch (err) {
      console.error('Error verifying OTP with MSG91 / backend:', err);
      const errMsg = (typeof err === 'string' ? err : err?.message || err?.errors || 'Verification failed. Please try again.');
      return {
        success: false,
        error: errMsg,
        message: errMsg
      };
    }
  }

  // Fallback: Default Spring Boot database OTP verification
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

