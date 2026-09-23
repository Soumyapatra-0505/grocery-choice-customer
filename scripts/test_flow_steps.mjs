import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CUSTOMER_URL = 'http://localhost:5173';

// Load .env to get key and secret for signature generation without printing
function loadEnv() {
  const envPath = 'd:\\Grocery Choice\\backend\\.env';
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
  return env;
}

const env = loadEnv();
console.log('Env loaded successfully (Key ID present:', !!env.RAZORPAY_KEY_ID, ')');

async function testFlow() {
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
  
  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon')) {
        consoleErrors.push(text);
        console.error('  [BROWSER ERROR]', text);
      }
    }
  });

  // 1. Customer Login
  console.log('--- Step 1: Customer Login ---');
  await page.goto(`${CUSTOMER_URL}/login`, { waitUntil: 'networkidle0' });
  
  // Click demo button for mobile
  const demoBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('9876543210'));
  });
  await demoBtn.asElement().click();
  await page.click('button[type="submit"]');

  // Wait for OTP card or check if 429
  let otpReady = false;
  for (let i = 0; i < 35; i++) {
    const hasOtpBtn = await page.$('.otp-demo-btn');
    if (hasOtpBtn) {
      otpReady = true;
      break;
    }
    // Check if error banner with seconds
    const errorText = await page.evaluate(() => {
      const err = document.querySelector('[role="alert"]');
      return err ? err.innerText : '';
    });
    if (errorText.includes('wait') && errorText.includes('seconds')) {
      console.log('Cooldown active:', errorText, '- waiting...');
    }
    await new Promise(r => setTimeout(r, 1000));
    // Retry clicking Send OTP if needed
    const sendBtn = await page.$('button[type="submit"]');
    if (sendBtn && !hasOtpBtn && i % 5 === 0) {
      await sendBtn.click().catch(() => {});
    }
  }

  if (otpReady) {
    await page.click('.otp-demo-btn');
    await new Promise(r => setTimeout(r, 2500));
  }

  const token = await page.evaluate(() => localStorage.getItem('grocery_choice_token'));
  console.log('Customer token after login:', token ? 'VALID JWT' : 'FAILED');

  // 2. Add product to cart
  console.log('--- Step 2: Add Product to Cart ---');
  await page.goto(`${CUSTOMER_URL}/products`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  const addBtn = (await page.$$('.product-card button.btn-secondary'))[0];
  await addBtn.click();
  await new Promise(r => setTimeout(r, 1000));
  const cart = await page.evaluate(() => localStorage.getItem('grocery_choice_cart'));
  console.log('Cart items count:', JSON.parse(cart || '[]').length);

  // 3. Checkout
  console.log('--- Step 3: Proceed to Checkout ---');
  await page.goto(`${CUSTOMER_URL}/checkout`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // 4. Select online payment method
  console.log('--- Step 4: Online Payment Method Selection ---');
  const selectedMethod = await page.evaluate(() => {
    const active = document.querySelector('.payment-card.active, [data-selected="true"]');
    return active ? active.innerText : 'UPI';
  });
  console.log('Selected payment method:', selectedMethod);

  // Spy on window.Razorpay to capture created order & options
  await page.evaluate(() => {
    const OrigRazorpay = window.Razorpay;
    window.__capturedRzp = null;
    window.Razorpay = function(options) {
      console.log('Razorpay constructor invoked! Order ID:', options.order_id);
      window.__capturedRzp = {
        options: options,
        orderId: options.order_id,
        key: options.key,
        amount: options.amount
      };
      const inst = new OrigRazorpay(options);
      window.__rzpInstance = inst;
      return inst;
    };
  });

  // 5. Submit Order -> Backend creates Razorpay Test Order
  console.log('--- Step 5: Backend creates Razorpay Test Order ---');
  const payBtn = await page.$('button[type="submit"]');
  console.log('Submitting checkout via Pay button...');
  await payBtn.click();

  // Wait for Razorpay modal and order ID
  await new Promise(r => setTimeout(r, 5000));

  const captured = await page.evaluate(() => {
    return window.__capturedRzp ? {
      orderId: window.__capturedRzp.orderId,
      key: window.__capturedRzp.key,
      amount: window.__capturedRzp.amount,
      hasHandler: typeof window.__capturedRzp.options.handler === 'function'
    } : null;
  });

  console.log('Captured Razorpay Order from Backend:', captured);

  // 6. Check Razorpay Checkout iframe
  console.log('--- Step 6: Razorpay Checkout opens in browser ---');
  const iframeInfo = await page.evaluate(() => {
    const frame = document.querySelector('iframe.razorpay-checkout-frame');
    return frame ? {
      exists: true,
      className: frame.className,
      display: frame.style.display,
      height: frame.offsetHeight,
      srcPreview: frame.src.slice(0, 80)
    } : { exists: false };
  });
  console.log('Razorpay iframe in DOM:', iframeInfo);

  await browser.close();
}

testFlow().catch(console.error);
