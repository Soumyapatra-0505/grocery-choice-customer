import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CUSTOMER_URL = 'http://localhost:5173';

async function testLogin() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('  [CONSOLE]', msg.text()));

  await page.goto(`${CUSTOMER_URL}/login`, { waitUntil: 'networkidle0' });

  // Look for the demo button:
  const demoBtnHandle = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.innerText.includes('9876543210'));
  });

  const demoBtn = demoBtnHandle.asElement();
  if (demoBtn) {
    console.log('Found demo button, clicking it...');
    await demoBtn.click();
  } else {
    console.log('Demo button not found! Fallback to input...');
    await page.type('#loginIdentifier', '9876543210');
  }

  await new Promise(r => setTimeout(r, 500));
  const val = await page.$eval('#loginIdentifier', el => el.value);
  console.log('Input value:', val);

  // Submit Send OTP
  const submitBtn = await page.$('button[type="submit"]');
  console.log('Clicking Send OTP...');
  await submitBtn.click();

  // Wait for OTP step
  console.log('Waiting for OTP step...');
  await page.waitForSelector('.otp-demo-btn', { timeout: 8000 }).catch(e => console.log('Timeout waiting for .otp-demo-btn'));

  const demoCardText = await page.evaluate(() => {
    const el = document.querySelector('.otp-demo-card');
    return el ? el.innerText : 'NO DEMO CARD';
  });
  console.log('Demo card text:', demoCardText);

  // Click .otp-demo-btn
  const otpDemoBtn = await page.$('.otp-demo-btn');
  if (otpDemoBtn) {
    console.log('Clicking .otp-demo-btn to auto-verify...');
    await otpDemoBtn.click();
  }

  // Wait for login to complete
  await new Promise(r => setTimeout(r, 3000));

  const authData = await page.evaluate(() => {
    return {
      token: localStorage.getItem('grocery_choice_token'),
      user: localStorage.getItem('grocery_choice_user'),
      url: window.location.href
    };
  });

  console.log('Auth data after login:', authData);

  await browser.close();
}

testLogin().catch(console.error);
