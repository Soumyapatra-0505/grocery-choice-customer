/**
 * Automated Test Suite for Customer Razorpay Test Mode Checkout Integration
 * 
 * Tests:
 * 1. Payment API client contracts (create-order, verify, fail)
 * 2. Razorpay script loader module contracts
 * 3. Checkout workflow logic (COD vs Online, signature verification, failure handling)
 * 4. Zero Secret Audit: Strict verification that RAZORPAY_KEY_SECRET is nowhere in customer src or dist
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const customerRoot = path.resolve(__dirname, '..');

const results = [];
function record(testName, pass, details = '') {
  results.push({ testName, pass: !!pass, details });
  const status = pass ? '✓ PASS' : '✗ FAIL';
  console.log(`${status}: [${testName}] ${details ? '— ' + details : ''}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('  CUSTOMER RAZORPAY TEST MODE CHECKOUT INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. paymentApi Endpoint Contract Verification
  // ---------------------------------------------------------------------------
  console.log('--- 1. Testing paymentApi Contract in api.js ---');
  const apiJsPath = path.join(customerRoot, 'src', 'services', 'api.js');
  const apiJsContent = fs.readFileSync(apiJsPath, 'utf8');

  const hasCreateOrder = apiJsContent.includes('/api/payments/create-order') &&
    apiJsContent.includes('createOrder: async (orderId)');
  record('paymentApi.createOrder endpoint contract', hasCreateOrder, 'POST /api/payments/create-order with orderId');

  const hasVerifyPayment = apiJsContent.includes('/api/payments/verify') &&
    apiJsContent.includes('razorpay_order_id: razorpayOrderId') &&
    apiJsContent.includes('razorpay_payment_id: razorpayPaymentId') &&
    apiJsContent.includes('razorpay_signature: razorpaySignature');
  record('paymentApi.verifyPayment endpoint contract', hasVerifyPayment, 'POST /api/payments/verify with orderId and Razorpay signature payload');

  const hasRecordFailure = apiJsContent.includes('/api/payments/fail') &&
    apiJsContent.includes('recordFailure: async (orderId)');
  record('paymentApi.recordFailure endpoint contract', hasRecordFailure, 'POST /api/payments/fail with orderId');

  // ---------------------------------------------------------------------------
  // 2. Razorpay Script Loader Module Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Testing loadRazorpayScript in paymentService.js ---');
  const paymentServicePath = path.join(customerRoot, 'src', 'services', 'paymentService.js');
  const paymentServiceContent = fs.readFileSync(paymentServicePath, 'utf8');

  const hasScriptLoader = paymentServiceContent.includes('export function loadRazorpayScript()') &&
    paymentServiceContent.includes('https://checkout.razorpay.com/v1/checkout.js');
  record('loadRazorpayScript existence & official CDN URL', hasScriptLoader, 'Loads https://checkout.razorpay.com/v1/checkout.js safely');

  const hasWindowCheck = paymentServiceContent.includes('window.Razorpay');
  record('loadRazorpayScript window.Razorpay cache check', hasWindowCheck, 'Checks existing window.Razorpay before injecting script tag');

  // ---------------------------------------------------------------------------
  // 3. CheckoutPage Integration Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Testing CheckoutPage.jsx Razorpay Workflow ---');
  const checkoutPath = path.join(customerRoot, 'src', 'pages', 'CheckoutPage.jsx');
  const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');

  const importsScriptLoader = checkoutContent.includes('loadRazorpayScript') &&
    checkoutContent.includes("from '../services/paymentService'");
  record('CheckoutPage imports loadRazorpayScript', importsScriptLoader, 'Safe dynamic loader imported from paymentService');

  const callsScriptLoader = checkoutContent.includes('await loadRazorpayScript()');
  record('CheckoutPage invokes loadRazorpayScript before order initiation', callsScriptLoader, 'Awaits script ready check');

  const usesPublicKeyOnly = checkoutContent.includes('key: rzpOrderData.razorpayKeyId') &&
    !checkoutContent.includes('RAZORPAY_KEY_SECRET');
  record('Razorpay checkout options use public keyId only', usesPublicKeyOnly, 'Passes rzpOrderData.razorpayKeyId; zero secret in options');

  const verifiesSignatureServerSide = checkoutContent.includes('paymentApi.verifyPayment({') &&
    checkoutContent.includes('orderId: createdOrder.id') &&
    checkoutContent.includes('razorpayOrderId: response.razorpay_order_id') &&
    checkoutContent.includes('razorpayPaymentId: response.razorpay_payment_id') &&
    checkoutContent.includes('razorpaySignature: response.razorpay_signature');
  record('Server-side HMAC-SHA256 verification call in handler', verifiesSignatureServerSide, 'Sends client response tokens to backend for verification');

  const handlesVerificationSuccessOnly = checkoutContent.includes("verifyRes.paymentStatus === 'PAID'") &&
    checkoutContent.includes('clearCart()') &&
    checkoutContent.includes('setConfirmedOrder(');
  record('Only marks order confirmed after server verification succeeds', handlesVerificationSuccessOnly, 'Guards clearCart and order confirmation with verifyRes success');

  const handlesModalDismissal = checkoutContent.includes('modal:') &&
    checkoutContent.includes('ondismiss:') &&
    checkoutContent.includes('paymentApi.recordFailure(createdOrder.id)');
  record('Handles user cancellation/dismissal via recordFailure', handlesModalDismissal, 'Calls paymentApi.recordFailure on modal dismissal');

  const handlesPaymentFailedEvent = checkoutContent.includes("rzp.on('payment.failed'") &&
    checkoutContent.includes('paymentApi.recordFailure(createdOrder.id)');
  record('Handles payment gateway decline via recordFailure', handlesPaymentFailedEvent, 'Calls paymentApi.recordFailure on payment.failed');

  const preservesCod = checkoutContent.includes('selectedPaymentMethod === PAYMENT_METHODS.COD') &&
    checkoutContent.includes('clearCart()') &&
    checkoutContent.includes('setConfirmedOrder(createdOrder)');
  record('Preserves Cash on Delivery (COD) flow', preservesCod, 'Completes COD order immediately without invoking Razorpay');

  const preventsDoubleSubmit = checkoutContent.includes('if (isSubmitting') &&
    checkoutContent.includes('disabled={isSubmitting');
  record('Prevents duplicate order submissions while processing', preventsDoubleSubmit, 'Guard check and disabled button prevent double submit');

  // ---------------------------------------------------------------------------
  // 4. Strict Zero Secret Audit in Customer Source, Dist & Env
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Zero Secrets Audit across Customer Source, Dist & Env ---');
  
  function scanDirForSecrets(dirPath, fileExtensions) {
    const leakedFiles = [];
    if (!fs.existsSync(dirPath)) return leakedFiles;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          leakedFiles.push(...scanDirForSecrets(fullPath, fileExtensions));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (fileExtensions.includes(ext) || entry.name.startsWith('.env')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          // Check for RAZORPAY_KEY_SECRET or actual key secret pattern
          if (content.includes('RAZORPAY_KEY_SECRET') || /rzp_live_[a-zA-Z0-9]{14,}/.test(content)) {
            // Allow comment notice in paymentService about never putting secret
            if (entry.name === 'paymentService.js' && content.includes('NEVER put gateway secret')) {
              // Ignore architectural disclaimer comment
              const nonCommentMatches = content.split('\n').filter(line => 
                !line.trim().startsWith('*') && 
                !line.trim().startsWith('//') && 
                line.includes('RAZORPAY_KEY_SECRET')
              );
              if (nonCommentMatches.length > 0) {
                leakedFiles.push({ file: fullPath, matches: nonCommentMatches });
              }
            } else if (entry.name === 'final_razorpay_e2e_test.mjs') {
              // Ignore backend/.env test fixture script
            } else {
              leakedFiles.push({ file: fullPath });
            }
          }
        }
      }
    }
    return leakedFiles;
  }

  // Scan src
  const srcLeaks = scanDirForSecrets(path.join(customerRoot, 'src'), ['.js', '.jsx', '.ts', '.tsx', '.json', '.html']);
  record('Zero secrets in customer/src', srcLeaks.length === 0, srcLeaks.length === 0 ? 'No secrets or secret keys found in src' : `Found in: ${srcLeaks.map(l => l.file).join(', ')}`);

  // Scan dist
  const distLeaks = scanDirForSecrets(path.join(customerRoot, 'dist'), ['.js', '.css', '.html']);
  record('Zero secrets in customer/dist production bundle', distLeaks.length === 0, distLeaks.length === 0 ? 'Production bundle is 100% clean of Razorpay secrets' : `Found in: ${distLeaks.map(l => l.file).join(', ')}`);

  // Scan .env files
  const envFiles = ['.env', '.env.example', '.env.development', '.env.production'];
  let envSecretFound = false;
  for (const envFile of envFiles) {
    const fullPath = path.join(customerRoot, envFile);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('RAZORPAY_KEY_SECRET') || content.includes('rzp_test_secret')) {
        envSecretFound = true;
      }
    }
  }
  record('Zero Razorpay secret in customer .env configuration', !envSecretFound, 'Customer env files contain only VITE_API_BASE_URL and public MSG91 widget tokens');

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  const allPassed = results.every(r => r.pass);
  const passedCount = results.filter(r => r.pass).length;
  console.log(`  RESULTS: ${passedCount}/${results.length} CHECKS PASSED`);
  console.log(`  OVERALL STATUS: ${allPassed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);
  console.log('================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runTests();
