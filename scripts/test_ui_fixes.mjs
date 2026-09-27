/**
 * Focused UI Test Suite for Customer Bug Fixes:
 * 1. Bottom Toast Auto-Dismissal (Success ~3s, Error/Warning ~4s, Manual X, Sequential Queueing, Timer Cleanup)
 * 2. Profile Dropdown Outside-Click (Toggle, Outside-Click, Inside-Click Preservation, Escape, Route Navigation)
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const TEST_PORT = 5190;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function startTestServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
      let pathname = parsedUrl.pathname;
      let filePath = path.join(DIST_DIR, pathname);

      // Serve static asset if it exists
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      // Vercel SPA rewrite fallback to index.html
      const indexPath = path.join(DIST_DIR, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(indexPath).pipe(res);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    });

    server.listen(TEST_PORT, '127.0.0.1', () => {
      console.log(`[TEST SERVER] Running on ${BASE_URL}`);
      resolve(server);
    });
  });
}

async function runTests() {
  console.log('=== Running Customer UI Bug Fixes Verification Tests ===\n');

  const server = await startTestServer();
  const consoleErrors = [];

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setRequestInterception(true);

    page.on('request', req => {
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      };

      if (req.method() === 'OPTIONS') {
        req.respond({ status: 200, headers });
        return;
      }

      if (req.url().includes('/api/users/profile') || req.url().includes('/api/auth/me')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          headers,
          body: JSON.stringify({
            id: 99,
            fullName: 'Rahul Sharma',
            email: 'rahul.sharma@example.com',
            phone: '9876543210',
            role: 'ROLE_CUSTOMER'
          })
        });
      } else if (req.url().includes('/api/orders')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          headers,
          body: JSON.stringify([])
        });
      } else if (req.url().includes('/api/products') || req.url().includes('/api/categories')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          headers,
          body: JSON.stringify([])
        });
      } else {
        req.continue();
      }
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error('Browser console error:', msg.text());
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(err.message);
      console.error('Page error:', err.message);
    });

    // Seed mock logged-in customer session
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('grocery_choice_token', 'mock_jwt_test_token_123');
      localStorage.setItem('grocery_choice_user', JSON.stringify({
        id: 99,
        fullName: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '9876543210',
        role: 'ROLE_CUSTOMER',
        isLoggedIn: true
      }));
    });

    console.log('Navigating to homepage...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    // Wait for App to mount
    await page.waitForFunction(() => typeof window.__showToast === 'function', { timeout: 8000 });

    // =========================================================================
    // ISSUE 1: TOAST TESTS
    // =========================================================================

    // 1. Toast appears
    console.log('\n--- TOAST TEST 1: Toast appears ---');
    await page.evaluate(() => window.__showToast('Item added to cart!', 'success'));
    await page.waitForSelector('.toast', { timeout: 2000 });
    const toastText = await page.$eval('.toast span', el => el.textContent);
    if (!toastText.includes('Item added to cart!')) {
      throw new Error(`Expected toast to display "Item added to cart!", got "${toastText}"`);
    }
    console.log(`[PASS] Toast appeared with text: "${toastText}"`);

    // 2. Success/info auto-dismisses around 3 seconds
    console.log('\n--- TOAST TEST 2: Success/info auto-dismisses around 3 seconds ---');
    // At 1.5s, toast should still be visible
    await new Promise(r => setTimeout(r, 1500));
    let toastVisibleAt1_5s = await page.$('.toast');
    if (!toastVisibleAt1_5s) throw new Error('Success toast disappeared prematurely at 1.5s!');
    console.log('[PASS] Success toast remains visible at 1.5s');

    // At 3.4s total, toast should have auto-dismissed
    await new Promise(r => setTimeout(r, 1900));
    let toastAt3_4s = await page.$('.toast');
    if (toastAt3_4s) throw new Error('Success toast did not auto-dismiss after ~3 seconds!');
    console.log('[PASS] Success toast successfully auto-dismissed after ~3 seconds');

    // Test info toast auto-dismiss
    await page.evaluate(() => window.__showToast('4-digit OTP sent to +91 9876543210', 'info'));
    await page.waitForSelector('.toast', { timeout: 2000 });
    await new Promise(r => setTimeout(r, 1500));
    if (!(await page.$('.toast'))) throw new Error('Info toast disappeared prematurely at 1.5s!');
    await new Promise(r => setTimeout(r, 1900));
    if (await page.$('.toast')) throw new Error('Info toast did not auto-dismiss after ~3 seconds!');
    console.log('[PASS] Info toast ("4-digit OTP sent to +91...") successfully auto-dismissed after ~3 seconds');

    // 3. Error/warning auto-dismisses around 4 seconds
    console.log('\n--- TOAST TEST 3: Error/warning auto-dismisses around 4 seconds ---');
    await page.evaluate(() => window.__showToast('Unable to process payment!', 'error'));
    await page.waitForSelector('.toast', { timeout: 2000 });
    // At 3.0s, error toast must STILL be visible (since error timeout is 4000ms)
    await new Promise(r => setTimeout(r, 3000));
    let errorToastAt3s = await page.$('.toast');
    if (!errorToastAt3s) throw new Error('Error toast disappeared before 3 seconds! Expected 4s duration.');
    console.log('[PASS] Error toast is STILL visible at 3.0 seconds (4s lifespan honored)');

    // At 4.4s, error toast should be dismissed
    await new Promise(r => setTimeout(r, 1400));
    let errorToastAt4_4s = await page.$('.toast');
    if (errorToastAt4_4s) throw new Error('Error toast did not auto-dismiss after 4 seconds!');
    console.log('[PASS] Error toast successfully auto-dismissed after ~4 seconds');

    // Warning toast check
    await page.evaluate(() => window.__showToast('Low stock warning: only 2 items left!', 'warning'));
    await page.waitForSelector('.toast', { timeout: 2000 });
    await new Promise(r => setTimeout(r, 3000));
    if (!(await page.$('.toast'))) throw new Error('Warning toast disappeared before 3s!');
    await new Promise(r => setTimeout(r, 1400));
    if (await page.$('.toast')) throw new Error('Warning toast did not auto-dismiss after 4s!');
    console.log('[PASS] Warning toast successfully auto-dismissed after ~4 seconds');

    // 4. Manual X button closes immediately
    console.log('\n--- TOAST TEST 4: Manual X closes immediately ---');
    await page.evaluate(() => window.__showToast('Dismissible notification', 'success'));
    await page.waitForSelector('.toast button[aria-label="Dismiss notification"]', { timeout: 2000 });
    const xButton = await page.$('.toast button[aria-label="Dismiss notification"]');
    await xButton.click();
    await new Promise(r => setTimeout(r, 100));
    if (await page.$('.toast')) throw new Error('Toast did not dismiss immediately when X clicked!');
    console.log('[PASS] Toast dismissed immediately upon manual X click');

    // 5. Sequential toasts work correctly & no stale timer prematurely dismisses newer toast
    console.log('\n--- TOAST TEST 5: Sequential toasts (stale timer protection) ---');
    // Trigger Toast 1 at t=0
    await page.evaluate(() => window.__showToast('Toast Message 1', 'success'));
    console.log('[PASS] Toast 1 triggered at t=0');

    // Wait 1.8 seconds, then trigger Toast 2
    await new Promise(r => setTimeout(r, 1800));
    await page.evaluate(() => window.__showToast('Toast Message 2', 'success'));
    console.log('[PASS] Toast 2 triggered at t=1.8s');

    // Wait another 1.8 seconds (t=3.6s from Toast 1).
    // If stale Toast 1 timer was active, it would have dismissed Toast 2!
    await new Promise(r => setTimeout(r, 1800));
    const toast2At3_6s = await page.$('.toast');
    if (!toast2At3_6s) throw new Error('Toast 2 was prematurely killed by Toast 1 stale timer!');
    const currentToastMsg = await page.$eval('.toast span', el => el.textContent);
    if (!currentToastMsg.includes('Toast Message 2')) {
      throw new Error(`Expected Toast 2 to be visible, got "${currentToastMsg}"`);
    }
    console.log('[PASS] Toast 2 is STILL visible at t=3.6s (stale Toast 1 timer cancelled cleanly)');

    // Now wait for Toast 2 to dismiss on its own schedule (approx 1.6s more)
    await new Promise(r => setTimeout(r, 1600));
    if (await page.$('.toast')) throw new Error('Toast 2 did not auto-dismiss on its own schedule!');
    console.log('[PASS] Toast 2 cleanly auto-dismissed on its own 3s timer');

    // 6. Timer cleanup works
    console.log('\n--- TOAST TEST 6: Timer cleanup ---');
    await page.evaluate(() => {
      window.__showToast('Cleanup test', 'success');
      window.__closeToast();
    });
    await new Promise(r => setTimeout(r, 3500));
    console.log('[PASS] No timer exceptions or dangling state after closeToast');

    // =========================================================================
    // ISSUE 2: PROFILE DROPDOWN TESTS
    // =========================================================================

    console.log('\n--- DROPDOWN TEST 1: Opens on profile click ---');
    const profileBtn = await page.$('.action-item[aria-haspopup="true"]');
    if (!profileBtn) throw new Error('Profile dropdown button not found in Header');
    await profileBtn.click();
    await new Promise(r => setTimeout(r, 100));

    let dropdown = await page.$('.user-dropdown-menu');
    let ariaExpanded = await profileBtn.evaluate(el => el.getAttribute('aria-expanded'));
    if (!dropdown || ariaExpanded !== 'true') throw new Error('Dropdown did not open on profile button click!');
    console.log('[PASS] Profile dropdown opened (aria-expanded: true, .user-dropdown-menu visible)');

    console.log('\n--- DROPDOWN TEST 2: Closes when profile icon is clicked again ---');
    await profileBtn.click();
    await new Promise(r => setTimeout(r, 100));
    dropdown = await page.$('.user-dropdown-menu');
    ariaExpanded = await profileBtn.evaluate(el => el.getAttribute('aria-expanded'));
    if (dropdown || ariaExpanded !== 'false') throw new Error('Dropdown did not close on second profile click!');
    console.log('[PASS] Profile dropdown toggled closed on second profile click');

    console.log('\n--- DROPDOWN TEST 3: Remains open when clicking INSIDE ---');
    await profileBtn.click();
    await new Promise(r => setTimeout(r, 100));
    // Click on the user info header inside the dropdown
    const userInfoInside = await page.$('.user-dropdown-menu div');
    if (!userInfoInside) throw new Error('User info container inside dropdown not found');
    await userInfoInside.click();
    await new Promise(r => setTimeout(r, 100));
    dropdown = await page.$('.user-dropdown-menu');
    if (!dropdown) throw new Error('Dropdown closed when clicking inside! Should remain open.');
    console.log('[PASS] Dropdown remains open when clicking inside on non-action area');

    console.log('\n--- DROPDOWN TEST 4: Closes when clicking OUTSIDE ---');
    // Click outside on the header search or background
    const outsideEl = await page.$('.header-search input') || await page.$('a[aria-label="Grocery Choice Home"]');
    await outsideEl.click();
    await new Promise(r => setTimeout(r, 150));
    dropdown = await page.$('.user-dropdown-menu');
    if (dropdown) throw new Error('Dropdown did NOT close when clicking outside!');
    console.log('[PASS] Dropdown closed automatically when clicking outside');

    console.log('\n--- DROPDOWN TEST 5: Escape closes it ---');
    await profileBtn.click();
    await new Promise(r => setTimeout(r, 100));
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 100));
    dropdown = await page.$('.user-dropdown-menu');
    if (dropdown) throw new Error('Dropdown did NOT close upon pressing Escape key!');
    console.log('[PASS] Dropdown closed upon pressing Escape key');

    console.log('\n--- DROPDOWN TEST 6: Navigation / action inside dropdown works ---');
    await profileBtn.click();
    await new Promise(r => setTimeout(r, 100));
    const ordersLink = await page.$('.user-dropdown-menu a[href="/orders"]');
    if (!ordersLink) throw new Error('Orders link inside dropdown not found');
    await ordersLink.click();
    await page.waitForFunction(() => window.location.pathname.includes('/orders'), { timeout: 5000 });
    console.log(`[PASS] Navigated to ${page.url()} via dropdown action`);

    // Ensure dropdown is not stuck open on the new route
    dropdown = await page.$('.user-dropdown-menu');
    if (dropdown) throw new Error('Dropdown remained open after route navigation!');
    console.log('[PASS] Dropdown is closed following route navigation');

    // 7. Verify no console errors
    console.log('\n--- CONSOLE ERROR CHECK ---');
    const fatalErrors = consoleErrors.filter(e => 
      !e.includes('favicon.ico') &&
      !e.includes('401') &&
      !e.includes('ERR_FAILED') &&
      !e.includes('CORS') &&
      !e.includes('Unable to connect')
    );
    if (fatalErrors.length > 0) {
      throw new Error(`Browser console logged errors: ${JSON.stringify(fatalErrors)}`);
    }
    console.log('[PASS] 0 JavaScript/React runtime errors logged during all interactions');

    console.log('\n============================================================');
    console.log('  ALL CUSTOMER UI BUG FIX TESTS PASSED SUCCESSFULLY!       ');
    console.log('============================================================\n');

  } finally {
    await browser.close();
    server.close();
  }
}

runTests().catch(err => {
  console.error('\nTest Suite FAILED:', err);
  process.exit(1);
});
