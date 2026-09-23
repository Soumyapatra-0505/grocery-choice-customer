import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CUSTOMER_URL = 'http://localhost:5173';

async function testRzpIframe() {
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

  // Login
  console.log('Logging in...');
  await page.goto(`${CUSTOMER_URL}/login`, { waitUntil: 'networkidle0' });
  const demoBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('9876543210'));
  });
  await demoBtn.asElement().click();
  await page.click('button[type="submit"]');

  await page.waitForSelector('.otp-demo-btn', { timeout: 10000 });
  await page.click('.otp-demo-btn');
  await new Promise(r => setTimeout(r, 2500));
  console.log('Login complete.');

  // Add product
  await page.goto(`${CUSTOMER_URL}/products`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  const addBtn = (await page.$$('.product-card button.btn-secondary'))[0];
  await addBtn.click();
  await new Promise(r => setTimeout(r, 1000));
  console.log('Product added.');

  // Checkout
  await page.goto(`${CUSTOMER_URL}/checkout`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Capture Razorpay call
  await page.evaluate(() => {
    const OrigRazorpay = window.Razorpay;
    window.__capturedRzp = null;
    window.Razorpay = function(options) {
      console.log('window.Razorpay called with order_id:', options.order_id);
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

  // Submit checkout
  console.log('Clicking Pay button...');
  const payBtn = await page.$('button[type="submit"]');
  await payBtn.click();

  // Wait for Razorpay order creation and iframe
  console.log('Waiting for Razorpay order and iframe...');
  await new Promise(r => setTimeout(r, 6000));

  const captured = await page.evaluate(() => {
    return {
      capturedRzp: window.__capturedRzp ? {
        orderId: window.__capturedRzp.orderId,
        key: window.__capturedRzp.key,
        amount: window.__capturedRzp.amount,
        hasHandler: typeof window.__capturedRzp.options.handler === 'function'
      } : null,
      iframes: Array.from(document.querySelectorAll('iframe')).map(f => ({
        className: f.className,
        src: f.src,
        styleDisplay: f.style.display,
        offsetHeight: f.offsetHeight
      }))
    };
  });

  console.log('Captured result:', JSON.stringify(captured, null, 2));

  // Check frames in puppeteer
  console.log('Puppeteer frames count:', page.frames().length);
  for (const f of page.frames()) {
    console.log(' - Frame url:', f.url());
  }

  await browser.close();
}

testRzpIframe().catch(console.error);
