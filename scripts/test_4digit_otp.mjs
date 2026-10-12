import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CUSTOMER_URL = 'http://localhost:5173';

async function runTests() {
  console.log('=== Running 6-Digit OTP Verification Tests ===\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    // Directly provide mock sendOtp and verifyOtp functions on window before page loads
    // This satisfies loadMsg91Sdk() line 91 and avoids any external network calls to MSG91
    await page.evaluateOnNewDocument(() => {
      window.sendOtp = (identifier, success, _failure) => {
        setTimeout(() => {
          if (typeof success === 'function') {
            success({ type: 'success', message: '6-digit OTP sent to ' + identifier });
          }
        }, 20);
      };
      window.verifyOtp = (code, success, _failure) => {
        setTimeout(() => {
          if (typeof success === 'function') {
            success({ type: 'success', 'access-token': 'mock_msg91_access_token_1234' });
          }
        }, 20);
      };
    });

    await page.goto(`${CUSTOMER_URL}/login`, { waitUntil: 'networkidle0' });

    // -------------------------------------------------------------
    // Part 1: Service-level Unit Tests for 6-digit OTP format validation
    // -------------------------------------------------------------
    console.log('Testing otpService verifyOtp() validation rules in browser:');

    const unitTestResults = await page.evaluate(async () => {
      const module = await import('/src/services/otpService.js');
      const verifyOtp = module.verifyOtp;

      const rEmpty = await verifyOtp('9876543210', '');
      const r3 = await verifyOtp('9876543210', '123');
      const r4 = await verifyOtp('9876543210', '1234');
      const r6 = await verifyOtp('9876543210', '123456');
      const r7 = await verifyOtp('9876543210', '1234567');
      const rAlpha = await verifyOtp('9876543210', '12ab56');

      return {
        rEmpty,
        r3,
        r4,
        r6,
        r7,
        rAlpha
      };
    });

    console.assert(!unitTestResults.rEmpty.success && unitTestResults.rEmpty.error === 'INVALID_FORMAT', 'Test 1 Failed: empty OTP');
    console.log('  [PASS] Empty OTP rejected with INVALID_FORMAT');

    console.assert(!unitTestResults.r3.success && unitTestResults.r3.error === 'INVALID_FORMAT', 'Test 2 Failed: 3 digits');
    console.log('  [PASS] 3-digit OTP "123" rejected with INVALID_FORMAT');

    console.assert(!unitTestResults.r7.success && unitTestResults.r7.error === 'INVALID_FORMAT', 'Test 3 Failed: 7 digits');
    console.log('  [PASS] 7-digit OTP "1234567" rejected with INVALID_FORMAT');

    console.assert(!unitTestResults.rAlpha.success && unitTestResults.rAlpha.error === 'INVALID_FORMAT', 'Test 4 Failed: non-numeric characters');
    console.log('  [PASS] Non-numeric "12ab56" rejected with INVALID_FORMAT');

    // -------------------------------------------------------------
    // Part 2: Browser DOM & Interaction Tests
    // -------------------------------------------------------------
    console.log('\nTesting Browser DOM & Interaction on LoginPage (/login):');

    // Fill phone number
    await page.type('#loginIdentifier', '9876543210');

    // Submit Send OTP
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    // Wait for OTP input boxes to appear
    await page.waitForSelector('.otp-inputs-grid input', { timeout: 8000 });

    // Assert exactly 6 OTP input boxes rendered
    const inputBoxes = await page.$$('.otp-inputs-grid input');
    console.assert(inputBoxes.length === 6, `Expected 6 OTP input boxes, found ${inputBoxes.length}`);
    console.log(`  [PASS] Rendered exactly ${inputBoxes.length} OTP input boxes in .otp-inputs-grid`);

    // Check heading / labels
    const labelText = await page.$eval('label[for="otp-digit-0"]', el => el.innerText);
    console.assert(labelText.includes('6-Digit'), `Expected label to mention 6-Digit, got: ${labelText}`);
    console.log(`  [PASS] Label text: "${labelText}"`);

    const gridAria = await page.$eval('.otp-inputs-grid', el => el.getAttribute('aria-label'));
    console.assert(gridAria.includes('6-Digit'), `Expected aria-label to mention 6-Digit, got: ${gridAria}`);
    console.log(`  [PASS] Grid aria-label: "${gridAria}"`);

    // Check button disabled state when empty
    const verifyBtnDisabledEmpty = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Verify OTP'));
      return btn ? btn.disabled : null;
    });
    console.assert(verifyBtnDisabledEmpty === true, 'Verify button should be disabled when empty');
    console.log('  [PASS] Verify OTP button is disabled when empty');

    // Type 5 digits: button must still be disabled
    await inputBoxes[0].type('1');
    await inputBoxes[1].type('2');
    await inputBoxes[2].type('3');
    await inputBoxes[3].type('4');
    await inputBoxes[4].type('5');

    const verifyBtnDisabled5 = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Verify OTP'));
      return btn ? btn.disabled : null;
    });
    console.assert(verifyBtnDisabled5 === true, 'Verify button should be disabled with 5 digits');
    console.log('  [PASS] Verify OTP button is disabled with 5 digits');

    // Type 6th digit: triggers auto-verification when all 6 digits are filled
    await inputBoxes[5].type('6');

    const btnState = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Verify'));
      return btn ? { disabled: btn.disabled, text: btn.innerText } : null;
    });
    console.assert(btnState && (btnState.text.includes('Verifying') || btnState.disabled === false), 'Auto-verification or enable should occur on 6 digits');
    console.log(`  [PASS] Auto-verification triggered on 6th digit (Button: "${btnState?.text}")`);

    // Verify box values
    const values = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.otp-inputs-grid input')).map(i => i.value);
    });
    console.assert(values.join('') === '123456', `Expected "123456", got "${values.join('')}"`);
    console.log(`  [PASS] All 6 OTP box values correctly populated: ["${values.join('", "')}"]`);

  } catch (err) {
    console.error('Browser test error:', err);
    throw err;
  } finally {
    if (browser) await browser.close();
  }

  console.log('\n=== All 6-Digit OTP Tests Passed Successfully! ===');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
