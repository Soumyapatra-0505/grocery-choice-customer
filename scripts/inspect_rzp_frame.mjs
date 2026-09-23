import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CUSTOMER_URL = 'http://localhost:5173';

async function inspectRzpFrame() {
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

  // Login
  await page.goto(`${CUSTOMER_URL}/login`, { waitUntil: 'networkidle0' });
  const demoBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('9876543210'));
  });
  await demoBtn.asElement().click();
  await page.click('button[type="submit"]');
  await page.waitForSelector('.otp-demo-btn', { timeout: 10000 });
  await page.click('.otp-demo-btn');
  await new Promise(r => setTimeout(r, 2500));

  // Add product & checkout
  await page.goto(`${CUSTOMER_URL}/products`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await (await page.$$('.product-card button.btn-secondary'))[0].click();
  await new Promise(r => setTimeout(r, 1000));

  await page.goto(`${CUSTOMER_URL}/checkout`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Submit checkout
  await (await page.$('button[type="submit"]')).click();
  await new Promise(r => setTimeout(r, 6000));

  // Find the razorpay frame
  const rzpFrame = page.frames().find(f => f.url().includes('api.razorpay.com/v1/checkout/public'));
  if (rzpFrame) {
    console.log('Found Razorpay Frame!');
    try {
      const text = await rzpFrame.evaluate(() => document.body.innerText);
      console.log('Razorpay Frame text preview (first 200 chars):', text.slice(0, 200));
      const buttons = await rzpFrame.evaluate(() => Array.from(document.querySelectorAll('button, [role="button"]')).map(b => b.innerText || b.className));
      console.log('Razorpay Frame buttons/roles:', buttons);
    } catch (e) {
      console.log('Could not evaluate inside frame:', e.message);
    }
  } else {
    console.log('Razorpay frame not found');
  }

  await browser.close();
}

inspectRzpFrame().catch(console.error);
