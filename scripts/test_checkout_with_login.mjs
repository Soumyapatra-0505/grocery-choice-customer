import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CUSTOMER_URL = 'http://localhost:5173';

async function testCheckoutWithLogin() {
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
  page.on('console', msg => console.log('  [CONSOLE]', msg.text()));

  // 1. Login
  console.log('--- 1. Login ---');
  await page.goto(`${CUSTOMER_URL}/login`, { waitUntil: 'networkidle0' });
  const demoBtnHandle = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.innerText.includes('9876543210'));
  });
  await demoBtnHandle.asElement().click();
  await page.click('button[type="submit"]');
  await page.waitForSelector('.otp-demo-btn', { timeout: 8000 });
  await page.click('.otp-demo-btn');
  await new Promise(r => setTimeout(r, 2500));
  console.log('Login completed.');

  // 2. Add product
  console.log('--- 2. Add product to cart ---');
  await page.goto(`${CUSTOMER_URL}/products`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  const addBtn = (await page.$$('.product-card button.btn-secondary'))[0];
  await addBtn.click();
  await new Promise(r => setTimeout(r, 1000));
  console.log('Product added.');

  // 3. Checkout
  console.log('--- 3. Checkout ---');
  await page.goto(`${CUSTOMER_URL}/checkout`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

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
      const instance = new OrigRazorpay(options);
      window.__rzpInstance = instance;
      return instance;
    };
  });

  // 4. Submit order
  console.log('--- 4. Clicking Pay button ---');
  const payBtn = await page.$('button[type="submit"]');
  console.log('Pay button text:', await page.evaluate(el => el.innerText, payBtn));
  await payBtn.click();

  // Wait for Razorpay to open
  console.log('Waiting for Razorpay order creation and modal open...');
  await new Promise(r => setTimeout(r, 5000));

  const captured = await page.evaluate(() => window.__capturedRzp);
  console.log('Captured Razorpay options in window:', {
    orderId: captured?.orderId,
    key: captured?.key,
    amount: captured?.amount,
    hasHandler: typeof captured?.options?.handler === 'function'
  });

  // Inspect frames
  const allFrames = page.frames();
  console.log('Total frames in page:', allFrames.length);
  for (const f of allFrames) {
    console.log('Frame URL:', f.url());
  }

  await browser.close();
}

testCheckoutWithLogin().catch(console.error);
