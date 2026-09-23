import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CUSTOMER_URL = 'http://localhost:5173';

async function run() {
  console.log('--- Probing Checkout & Razorpay Modal in Browser ---');
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
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('  [BROWSER ERROR]', msg.text());
  });

  // 1. Login
  console.log('1. Navigating to login...');
  await page.goto(`${CUSTOMER_URL}/login`, { waitUntil: 'networkidle0' });
  await page.$eval('#loginIdentifier', el => el.value = '9876543210');
  await page.$eval('#loginIdentifier', el => el.dispatchEvent(new Event('input', { bubbles: true })));
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 2000));
  const demoOtpBtn = await page.$('.otp-demo-btn');
  if (demoOtpBtn) {
    await demoOtpBtn.click();
    console.log('Clicked demo OTP verify');
  }
  await new Promise(r => setTimeout(r, 2500));

  const token = await page.evaluate(() => localStorage.getItem('grocery_choice_token'));
  console.log('Customer token:', token ? 'EXISTS' : 'MISSING');

  // 2. Add product to cart
  console.log('2. Navigating to products...');
  await page.goto(`${CUSTOMER_URL}/products`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  
  // Click first Add button
  const addButtons = await page.$$('.product-card button.btn-secondary');
  console.log('Found add buttons:', addButtons.length);
  if (addButtons.length > 0) {
    await addButtons[0].click();
    console.log('Clicked Add on first product');
  }
  await new Promise(r => setTimeout(r, 1000));

  const cart = await page.evaluate(() => localStorage.getItem('grocery_choice_cart'));
  console.log('Cart contents:', cart);

  // 3. Checkout
  console.log('3. Navigating to checkout...');
  await page.goto(`${CUSTOMER_URL}/checkout`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Check Razorpay script on window
  const rzpOnWindow = await page.evaluate(() => typeof window.Razorpay);
  console.log('typeof window.Razorpay:', rzpOnWindow);

  // Spy on window.Razorpay to inspect options passed to it
  await page.evaluate(() => {
    const OrigRazorpay = window.Razorpay;
    window.__capturedRazorpay = [];
    window.Razorpay = function(options) {
      console.log('Razorpay constructor called with order_id:', options.order_id);
      window.__lastRzpInstance = new OrigRazorpay(options);
      window.__lastRzpOptions = options;
      window.__capturedRazorpay.push({
        key: options.key,
        amount: options.amount,
        order_id: options.order_id,
        hasHandler: typeof options.handler === 'function'
      });
      return window.__lastRzpInstance;
    };
  });

  // 4. Click place order
  console.log('4. Clicking Place Order...');
  const payButton = await page.$('button[type="submit"]');
  if (payButton) {
    const buttonText = await page.evaluate(el => el.innerText, payButton);
    console.log('Pay button text:', buttonText);
    await payButton.click();
  }

  // Wait for Razorpay modal
  await new Promise(r => setTimeout(r, 4000));

  const captured = await page.evaluate(() => window.__capturedRazorpay);
  console.log('Captured Razorpay options:', captured);

  // Check if Razorpay iframe is present in DOM
  const frames = await page.evaluate(() => {
    const iframes = Array.from(document.querySelectorAll('iframe'));
    return iframes.map(f => ({ className: f.className, src: f.src }));
  });
  console.log('DOM iframes found:', frames);

  await browser.close();
}

run().catch(console.error);
