import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const TEST_PORT = 5195;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const VIEWPORTS = [320, 360, 375, 390, 430, 768, 1024, 1280, 1366, 1440, 1920];

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

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
        return;
      }

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

// Sample cart items and user for testing authenticated / cart / checkout states
const MOCK_USER = {
  id: 1,
  fullName: 'Rahul Sharma',
  email: 'rahul.sharma@example.com',
  phone: '+91 98765 43210',
  isLoggedIn: true,
  role: 'ROLE_CUSTOMER',
  address: {
    street: 'Flat 402, Green Meadows Residency, Sector 14',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122001'
  }
};

const MOCK_CART = [
  {
    id: 1,
    name: 'Fresh Organic Robusta Bananas',
    sellingPrice: 48,
    mrp: 65,
    unit: 'KG',
    quantity: 2,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
    stockQuantity: 42
  },
  {
    id: 7,
    name: 'Organic Unpolished Toor Dal',
    sellingPrice: 139,
    mrp: 175,
    unit: 'KG',
    quantity: 1,
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    stockQuantity: 38
  }
];

const MOCK_LOCATION = {
  id: 'saved-1',
  addressId: 1,
  type: 'saved',
  label: 'Home',
  name: 'Home',
  address: 'Flat 402, Green Meadows Residency, Sector 14, Gurugram, Haryana 122001',
  recipientName: 'Rahul Sharma',
  recipientPhone: '+91 98765 43210'
};

async function auditPageResponsiveness(page, pageName, route, options = {}) {
  const issues = [];
  const { authenticate = false, setCart = false, setLocation = false, clickSelector = null, waitMs = 500 } = options;

  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });

  // Hydrate local storage if requested
  await page.evaluate(({ auth, cart, loc, mockUser, mockCart, mockLoc }) => {
    if (auth) {
      localStorage.setItem('grocery_choice_token', 'valid-test-token');
      localStorage.setItem('grocery_choice_user', JSON.stringify(mockUser));
    }
    if (cart) {
      localStorage.setItem('grocery_choice_cart', JSON.stringify(mockCart));
    }
    if (loc) {
      localStorage.setItem('grocery_choice_location', JSON.stringify({
        selectedLocation: mockLoc,
        savedLocations: [mockLoc]
      }));
    }
  }, {
    auth: authenticate,
    cart: setCart,
    loc: setLocation,
    mockUser: MOCK_USER,
    mockCart: MOCK_CART,
    mockLoc: MOCK_LOCATION
  });

  if (authenticate || setCart || setLocation) {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2' });
  }

  if (clickSelector) {
    try {
      await page.waitForSelector(clickSelector, { timeout: 3000 });
      await page.click(clickSelector);
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      issues.push({ type: 'SELECTOR_NOT_FOUND', details: `Failed to click ${clickSelector}: ${e.message}` });
    }
  }

  await new Promise(r => setTimeout(r, waitMs));

  // Check overflow & layout
  const evalResult = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const bodyScrollWidth = document.body.scrollWidth;
    const winWidth = window.innerWidth;

    const hasHorizontalOverflow = scrollWidth > winWidth + 1 || bodyScrollWidth > winWidth + 1;

    // Check if element is contained within an overflow-controlled ancestor
    function isAncestorContained(element) {
      let p = element.parentElement;
      while (p && p !== document.body && p !== document.documentElement) {
        const s = window.getComputedStyle(p);
        if (s.overflowX === 'hidden' || s.overflowX === 'auto' || s.overflowX === 'scroll' || s.overflow === 'hidden') {
          return true;
        }
        p = p.parentElement;
      }
      return false;
    }

    // Find overflowing elements
    const overflowingElements = [];
    const all = document.querySelectorAll('*');
    for (const el of all) {
      // Ignore hidden or svg paths
      if (el.tagName.toLowerCase() === 'svg' || el.tagName.toLowerCase() === 'path') continue;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

      if (!isAncestorContained(el)) {
        if (rect.right > winWidth + 1.5 || rect.width > winWidth + 1.5) {
          overflowingElements.push({
            tag: el.tagName.toLowerCase(),
            className: el.className ? String(el.className).slice(0, 50) : '',
            id: el.id || '',
            rectWidth: Math.round(rect.width),
            rectRight: Math.round(rect.right),
            winWidth
          });
        }
      }
    }

    return {
      winWidth,
      docWidth,
      scrollWidth,
      bodyScrollWidth,
      hasHorizontalOverflow,
      overflowingCount: overflowingElements.length,
      overflowingElements: overflowingElements.slice(0, 5) // top 5
    };
  });

  return evalResult;
}

async function runAudit() {
  console.log('================================================================');
  console.log('   GROCERY CHOICE — COMPREHENSIVE RESPONSIVENESS AUDIT SUITE    ');
  console.log('================================================================\n');

  const server = await startTestServer();

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Test matrix
  const pagesToTest = [
    { name: '1. Homepage', route: '/', options: {} },
    { name: '2. Category Listing', route: '/categories', options: {} },
    { name: '3. Product Listing', route: '/products', options: {} },
    { name: '4. Product Details', route: '/product/1', options: {} },
    { name: '5. Login (Step 1)', route: '/login', options: {} },
    { name: '6. Search Results', route: '/products?search=tea', options: {} },
    { name: '7. Cart (Active Items)', route: '/cart', options: { setCart: true } },
    { name: '8. Checkout (Auth + Cart)', route: '/checkout', options: { authenticate: true, setCart: true, setLocation: true } },
    { name: '9. Address Management', route: '/profile', options: { authenticate: true, setLocation: true, clickSelector: 'button[data-tab="addresses"], .profile-nav-item:nth-child(2)' } },
    { name: '10. Customer Profile', route: '/profile', options: { authenticate: true } }
  ];

  const auditMatrixResults = [];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const width of VIEWPORTS) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(`>>> TESTING VIEWPORT WIDTH: ${width}px (Height: 840px)`);
    console.log(`----------------------------------------------------------------`);
    await page.setViewport({ width, height: 840 });

    for (const testPage of pagesToTest) {
      totalTests++;
      const result = await auditPageResponsiveness(page, testPage.name, testPage.route, testPage.options);
      
      const isClean = !result.hasHorizontalOverflow && result.overflowingCount === 0;
      if (isClean) {
        passedTests++;
        console.log(`✓ PASS [${width}px] ${testPage.name} (scrollWidth: ${result.scrollWidth}px <= winWidth: ${result.winWidth}px)`);
      } else {
        failedTests++;
        console.log(`✗ FAIL [${width}px] ${testPage.name} (scrollWidth: ${result.scrollWidth}px > winWidth: ${result.winWidth}px)`);
        console.log(`       Overflowing elements:`, JSON.stringify(result.overflowingElements));
      }

      auditMatrixResults.push({
        viewport: width,
        page: testPage.name,
        passed: isClean,
        scrollWidth: result.scrollWidth,
        winWidth: result.winWidth,
        overflowingElements: result.overflowingElements
      });
    }
  }

  await browser.close();
  server.close();

  console.log('\n================================================================');
  console.log(`AUDIT COMPLETE: ${totalTests} Viewport-Page Combinations Tested`);
  console.log(`PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('================================================================\n');

  // Write detailed results to scratch artifact or json
  fs.writeFileSync(
    path.join(__dirname, 'audit_results_baseline.json'),
    JSON.stringify(auditMatrixResults, null, 2)
  );
  console.log('Saved baseline audit results to scripts/audit_results_baseline.json');
}

runAudit().catch(err => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
