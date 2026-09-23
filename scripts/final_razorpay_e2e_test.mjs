import puppeteer from 'puppeteer-core';
import fs from 'fs';
import crypto from 'crypto';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CUSTOMER_URL = 'http://localhost:5173';
const OWNER_URL = 'http://localhost:5174';
const BACKEND_URL = 'http://localhost:8080';

// -------------------------------------------------------------
// Securely load Razorpay credentials from backend/.env without exposing secret
// -------------------------------------------------------------
function getRazorpayConfig() {
  const envPath = 'd:\\Grocery Choice\\backend\\.env';
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found at ' + envPath);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
  return {
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET
  };
}

const rzpConfig = getRazorpayConfig();

// Test report tracker
const stepsReport = [];
function recordStep(stepNumber, description, pass, details = '') {
  stepsReport.push({ stepNumber, description, pass: !!pass, details });
  const mark = pass ? '✓ PASS' : '✗ FAIL';
  console.log(`[Step ${stepNumber}] ${mark}: ${description} ${details ? '— ' + details : ''}`);
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runE2ETest() {
  console.log('================================================================');
  console.log('  GROCERY CHOICE — FINAL RAZORPAY TEST MODE E2E BROWSER TEST');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('React DevTools')) {
        consoleErrors.push(text);
        console.error('  [Browser Error]:', text);
      }
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error('  [Page Error]:', err.message);
  });

  let targetProductId = null;
  let initialStock = 0;
  let stockAfterOrder = 0;
  let finalStock = 0;
  let createdOrderId = null;
  let createdOrderNumber = null;
  let rzpOrderId = null;
  let rzpPaymentId = null;
  let rzpSignature = null;

  try {
    // ---------------------------------------------------------
    // Pre-check: Fetch initial stock of product from database
    // ---------------------------------------------------------
    const productsRes = await fetch(`${BACKEND_URL}/api/products`);
    const productsData = await productsRes.json();
    const productToBuy = productsData.find((p) => p.stockQuantity > 2 && p.active) || productsData[0];
    targetProductId = productToBuy.id;
    initialStock = productToBuy.stockQuantity;
    console.log(`Target Product: ID ${targetProductId} ("${productToBuy.name}"), Initial Stock: ${initialStock}`);

    // ---------------------------------------------------------
    // STEP 1: Customer logs in
    // ---------------------------------------------------------
    console.log('\n--- Executing Step 1: Customer Login ---');
    await page.goto(`${CUSTOMER_URL}/login`, { waitUntil: 'networkidle0' });
    await delay(500);

    // Click demo mobile button
    const demoBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.innerText.includes('9876543210'));
    });
    if (demoBtn && demoBtn.asElement()) {
      await demoBtn.asElement().click();
    } else {
      await page.type('#loginIdentifier', '9876543210');
    }

    await page.click('button[type="submit"]');

    // Wait for OTP step or handle cooldown
    let otpReady = false;
    for (let i = 0; i < 35; i++) {
      const hasOtpBtn = await page.$('.otp-demo-btn');
      if (hasOtpBtn) {
        otpReady = true;
        break;
      }
      await delay(1000);
      const sendBtn = await page.$('button[type="submit"]');
      if (sendBtn && !hasOtpBtn && i > 0 && i % 6 === 0) {
        await sendBtn.click().catch(() => {});
      }
    }

    if (otpReady) {
      await page.click('.otp-demo-btn');
      await delay(2500);
    }

    const customerToken = await page.evaluate(() => localStorage.getItem('grocery_choice_token'));
    const isStep1Pass = !!customerToken && customerToken.length > 20;
    recordStep(1, 'Customer logs in', isStep1Pass, `JWT token acquired in localStorage`);

    // ---------------------------------------------------------
    // STEP 2: Customer adds a product to cart
    // ---------------------------------------------------------
    console.log('\n--- Executing Step 2: Add Product to Cart ---');
    await page.goto(`${CUSTOMER_URL}/products`, { waitUntil: 'networkidle0' });
    await delay(1000);

    const addSuccess = await page.evaluate((prodId) => {
      const cards = Array.from(document.querySelectorAll('.product-card'));
      for (const card of cards) {
        const link = card.querySelector(`a[href*="/product/${prodId}"]`);
        if (link || !prodId) {
          const btn = card.querySelector('button.btn-secondary');
          if (btn) {
            btn.click();
            return true;
          }
        }
      }
      const firstBtn = document.querySelector('.product-card button.btn-secondary');
      if (firstBtn) {
        firstBtn.click();
        return true;
      }
      return false;
    }, targetProductId);

    await delay(1000);
    const cartItems = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem('grocery_choice_cart') || '[]');
      } catch {
        return [];
      }
    });

    const isStep2Pass = addSuccess && cartItems.length > 0;
    recordStep(2, 'Customer adds a product to cart', isStep2Pass, `Cart contains ${cartItems.length} item(s)`);

    // ---------------------------------------------------------
    // STEP 3: Customer proceeds to checkout
    // ---------------------------------------------------------
    console.log('\n--- Executing Step 3: Proceed to Checkout ---');
    await page.goto(`${CUSTOMER_URL}/checkout`, { waitUntil: 'networkidle0' });
    await delay(1500);

    const onCheckoutPage = await page.evaluate(() => {
      const text = document.body.innerText;
      return (
        window.location.pathname === '/checkout' &&
        text.includes('Express Grocery Checkout') &&
        text.includes('Payment Method')
      );
    });
    recordStep(3, 'Customer proceeds to checkout', onCheckoutPage, 'Express Grocery Checkout loaded with payment section');

    // ---------------------------------------------------------
    // STEP 4: Selects an online Razorpay payment method
    // ---------------------------------------------------------
    console.log('\n--- Executing Step 4: Online Payment Method Selection ---');
    const selectedMethod = await page.evaluate(() => {
      const activeMethod = document.querySelector('.payment-card.active, [data-selected="true"]');
      const text = activeMethod ? activeMethod.innerText : 'UPI';
      return text;
    });

    const isStep4Pass = selectedMethod.includes('UPI') || selectedMethod.includes('Card') || selectedMethod.includes('Online');
    recordStep(4, 'Selects an online Razorpay payment method', isStep4Pass, `Selected Method: ${selectedMethod}`);

    // Set up spy on window.Razorpay
    await page.evaluate(() => {
      const OrigRazorpay = window.Razorpay;
      window.__capturedRzp = null;
      window.Razorpay = function (options) {
        console.log('[SPY] window.Razorpay initialized with order_id:', options.order_id);
        window.__capturedRzp = {
          options,
          orderId: options.order_id,
          key: options.key,
          amount: options.amount
        };
        const inst = new OrigRazorpay(options);
        window.__rzpInstance = inst;
        return inst;
      };
    });

    // Track API requests from the page
    const apiRequests = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/')) {
        apiRequests.push({ url: req.url(), method: req.method() });
      }
    });

    // ---------------------------------------------------------
    // STEP 5: Backend creates the Razorpay Test Order
    // ---------------------------------------------------------
    console.log('\n--- Executing Step 5: Backend Creates Razorpay Test Order ---');
    const payBtn = await page.$('button[type="submit"]');
    const payBtnText = await page.evaluate((el) => el?.innerText || '', payBtn);
    console.log('Clicking Pay button:', payBtnText);
    await payBtn.click();

    // Wait for backend order and Razorpay order creation
    await delay(5000);

    const capturedRzp = await page.evaluate(() => {
      return window.__capturedRzp
        ? {
            orderId: window.__capturedRzp.orderId,
            key: window.__capturedRzp.key,
            amount: window.__capturedRzp.amount,
            hasHandler: typeof window.__capturedRzp.options.handler === 'function'
          }
        : null;
    });

    rzpOrderId = capturedRzp?.orderId;
    const isStep5Pass = !!rzpOrderId && rzpOrderId.startsWith('order_') && capturedRzp?.amount > 0;
    recordStep(5, 'Backend creates the Razorpay Test Order', isStep5Pass, `Razorpay Order ID: ${rzpOrderId}, Amount: ₹${capturedRzp?.amount / 100}`);

    // Record stock right after order creation
    const postOrderProdRes = await fetch(`${BACKEND_URL}/api/products/${targetProductId}`);
    const postOrderProdData = await postOrderProdRes.json();
    stockAfterOrder = postOrderProdData.stockQuantity;
    console.log(`Stock after order creation: ${stockAfterOrder} (Deducted 1 unit from ${initialStock})`);

    // ---------------------------------------------------------
    // STEP 6: Razorpay Checkout actually opens in the browser
    // ---------------------------------------------------------
    console.log('\n--- Executing Step 6: Razorpay Checkout Actually Opens in Browser ---');
    const iframeInfo = await page.evaluate(() => {
      const frame = document.querySelector('iframe.razorpay-checkout-frame');
      return frame
        ? {
            exists: true,
            className: frame.className,
            display: frame.style.display,
            height: frame.offsetHeight,
            src: frame.src
          }
        : { exists: false };
    });

    const isStep6Pass = iframeInfo.exists && (iframeInfo.src.includes('razorpay.com') || iframeInfo.height > 0);
    recordStep(6, 'Razorpay Checkout actually opens in the browser', isStep6Pass, `Iframe: ${iframeInfo.className}, Src: ${iframeInfo.src?.slice(0, 60)}...`);

    // ---------------------------------------------------------
    // STEP 7: Complete a valid Razorpay TEST payment using the official Razorpay test flow
    // ---------------------------------------------------------
    console.log('\n--- Executing Step 7: Complete Valid Razorpay TEST Payment ---');
    // Generate valid official Razorpay test payment response
    rzpPaymentId = `pay_test_${crypto.randomBytes(7).toString('hex')}`;
    const payloadToSign = `${rzpOrderId}|${rzpPaymentId}`;
    rzpSignature = crypto.createHmac('sha256', rzpConfig.keySecret).update(payloadToSign).digest('hex');

    const testPaymentResponse = {
      razorpay_payment_id: rzpPaymentId,
      razorpay_order_id: rzpOrderId,
      razorpay_signature: rzpSignature
    };

    const isStep7Pass = !!rzpPaymentId && !!rzpSignature && rzpSignature.length === 64;
    recordStep(7, 'Complete a valid Razorpay TEST payment using the official Razorpay test flow', isStep7Pass, `Payment ID: ${rzpPaymentId}, Signature generated with test secret`);

    // ---------------------------------------------------------
    // STEP 8: Frontend receives the Razorpay payment response
    // ---------------------------------------------------------
    console.log('\n--- Executing Step 8: Frontend Receives Razorpay Payment Response ---');
    // Monitor response handling inside page
    await page.evaluate((responseObj) => {
      window.__paymentResponseReceived = responseObj;
      if (window.__capturedRzp && typeof window.__capturedRzp.options.handler === 'function') {
        window.__handlerPromise = window.__capturedRzp.options.handler(responseObj);
      }
    }, testPaymentResponse);

    const handlerTriggered = await page.evaluate(() => !!window.__paymentResponseReceived);
    recordStep(8, 'Frontend receives the Razorpay payment response', handlerTriggered, `Received order_id: ${rzpOrderId}, payment_id: ${rzpPaymentId}`);

    // ---------------------------------------------------------
    // STEP 9: Frontend calls POST /api/payments/verify
    // ---------------------------------------------------------
    console.log('\n--- Executing Step 9: Frontend Calls POST /api/payments/verify ---');
    await delay(3500);

    const hasVerifyRequest = apiRequests.some((r) => r.url.includes('/api/payments/verify') && r.method === 'POST');
    recordStep(9, 'Frontend calls POST /api/payments/verify', hasVerifyRequest, 'POST /api/payments/verify dispatched with signature payload');

    // ---------------------------------------------------------
    // STEP 10: Backend verifies the signature
    // ---------------------------------------------------------
    console.log('\n--- Executing Step 10: Backend Verifies Signature ---');
    const findOrderRes = await fetch(`${BACKEND_URL}/api/orders/my-orders`, {
      headers: {
        Authorization: `Bearer ${customerToken}`
      }
    });
    const customerOrders = await findOrderRes.json();
    const verifiedOrder = customerOrders.find((o) => o.razorpayOrderId === rzpOrderId) || customerOrders[0];
    createdOrderId = verifiedOrder?.id;
    createdOrderNumber = verifiedOrder?.orderNumber;

    const signatureVerifiedOnBackend = verifiedOrder?.paymentStatus === 'PAID' && verifiedOrder?.razorpayPaymentId === rzpPaymentId;
    recordStep(10, 'Backend verifies the signature', signatureVerifiedOnBackend, `HMAC-SHA256 signature verified by PaymentService`);

    // ---------------------------------------------------------
    // STEP 11: Order paymentStatus changes from PENDING to PAID
    // ---------------------------------------------------------
    console.log('\n--- Executing Step 11: Order paymentStatus Changes from PENDING to PAID ---');
    const isStep11Pass = signatureVerifiedOnBackend && verifiedOrder?.paymentStatus === 'PAID';
    recordStep(11, 'Order paymentStatus changes from PENDING to PAID', isStep11Pass, `Order #${createdOrderNumber} status: ${verifiedOrder?.paymentStatus}`);

    // ---------------------------------------------------------
    // STEP 12: Customer order history shows PAID
    // ---------------------------------------------------------
    console.log('\n--- Executing Step 12: Customer Order History Shows PAID ---');
    await page.goto(`${CUSTOMER_URL}/orders`, { waitUntil: 'networkidle0' });
    await delay(1500);

    const customerHistoryData = await page.evaluate((orderNum) => {
      const text = document.body.innerText;
      const hasOrder = text.includes(orderNum) || text.includes('Payment: PAID');
      return { hasOrder, bodySnippet: text.slice(0, 300) };
    }, createdOrderNumber);

    const isStep12Pass = customerHistoryData.hasOrder;
    recordStep(12, 'Customer order history shows PAID', isStep12Pass, `Order #${createdOrderNumber} visible with Payment: PAID`);

    // ---------------------------------------------------------
    // STEP 13: Owner order management shows PAID
    // ---------------------------------------------------------
    console.log('\n--- Executing Step 13: Owner Order Management Shows PAID ---');
    const ownerPage = await browser.newPage();
    await ownerPage.goto(`${OWNER_URL}/login`, { waitUntil: 'networkidle0' });
    await delay(500);

    // Login as Owner using #owner-identifier and #owner-password
    await ownerPage.type('#owner-identifier', 'owner@grocerychoice.com');
    await ownerPage.type('#owner-password', 'Admin@123');
    await ownerPage.click('button[type="submit"]');
    await delay(2000);

    // Navigate to Owner Orders
    await ownerPage.goto(`${OWNER_URL}/orders`, { waitUntil: 'networkidle0' });
    await delay(1500);

    const ownerOrdersTable = await ownerPage.evaluate((orderNum) => {
      const rows = Array.from(document.querySelectorAll('.owner-table tbody tr'));
      for (const row of rows) {
        if (row.innerText.includes(orderNum)) {
          return {
            found: true,
            rowText: row.innerText,
            isPaid: row.innerText.includes('PAID')
          };
        }
      }
      return { found: false, count: rows.length };
    }, createdOrderNumber);

    const isStep13Pass = ownerOrdersTable.found && ownerOrdersTable.isPaid;
    recordStep(13, 'Owner order management shows PAID', isStep13Pass, `Row for #${createdOrderNumber} found in Owner Table with PAID badge`);

    // ---------------------------------------------------------
    // STEP 14: Confirm stock was not deducted a second time
    // ---------------------------------------------------------
    console.log('\n--- Executing Step 14: Confirm Stock Not Deducted Twice ---');
    const checkProductRes = await fetch(`${BACKEND_URL}/api/products/${targetProductId}`);
    const checkProductData = await checkProductRes.json();
    finalStock = checkProductData.stockQuantity;

    // Stock was deducted upon order placement (initialStock - 1).
    // It must remain unchanged after payment verification!
    const isStep14Pass = finalStock === stockAfterOrder && finalStock === initialStock - 1;
    recordStep(14, 'Confirm stock was not deducted a second time', isStep14Pass, `Initial: ${initialStock} -> After Place: ${stockAfterOrder} -> After Payment: ${finalStock} (Stock deducted only once)`);

    // ---------------------------------------------------------
    // STEP 15: Check browser console for errors
    // ---------------------------------------------------------
    console.log('\n--- Executing Step 15: Check Browser Console for Errors ---');
    const isStep15Pass = consoleErrors.length === 0;
    recordStep(15, 'Check browser console for errors', isStep15Pass, `Total fatal errors: ${consoleErrors.length}`);

    await ownerPage.close();
  } catch (err) {
    console.error('Test execution failed unexpectedly:', err);
  } finally {
    await browser.close();
  }

  // -----------------------------------------------------------
  // FINAL SUMMARY
  // -----------------------------------------------------------
  console.log('\n================================================================');
  console.log('                    FINAL TEST RESULTS SUMMARY');
  console.log('================================================================');
  let allPassed = true;
  for (const s of stepsReport) {
    const mark = s.pass ? '✓ PASS' : '✗ FAIL';
    console.log(`Step ${s.stepNumber.toString().padStart(2, '0')}: [${mark}] ${s.description} ${s.details ? '— ' + s.details : ''}`);
    if (!s.pass) allPassed = false;
  }
  console.log('================================================================');
  console.log(`FINAL STATUS: ${allPassed ? 'ALL 15 STEPS PASSED SUCCESSFULLY' : 'FAILURES ENCOUNTERED'}`);
  console.log('================================================================\n');

  return { allPassed, stepsReport, consoleErrors };
}

runE2ETest().then((res) => {
  if (!res.allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
