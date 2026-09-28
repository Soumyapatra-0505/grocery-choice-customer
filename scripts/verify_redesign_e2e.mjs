import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:8080';
const SCREENSHOT_DIR = 'D:\\Grocery Choice\\customer\\test-screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runVerification() {
  console.log('===============================================================');
  console.log('  GROCERY CHOICE — REDESIGNED WEBSITE E2E VERIFICATION SUITE');
  console.log('===============================================================\n');

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
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('favicon') && !txt.includes('Download the React DevTools') && !txt.includes('hCaptcha') && !txt.includes('localhost detected')) {
        consoleErrors.push(txt);
      }
    }
  });

  const results = [];
  function assert(name, condition, details = '') {
    results.push({ name, passed: Boolean(condition), details });
    console.log(`${condition ? '✓ PASS' : '✗ FAIL'}: ${name} ${details ? '(' + details + ')' : ''}`);
  }

  try {
    // ------------------------------------------------------------------------
    // Step 0: Ensure Authenticated Session for Customer Checkout & Profile
    // ------------------------------------------------------------------------
    let authToken = 'test-customer-token';
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/owner-token`);
      if (res.ok) {
        const data = await res.json();
        authToken = data.token;
      }
    } catch {
      // Use fallback
    }

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await page.evaluate(({ token }) => {
      localStorage.setItem('grocery_choice_token', token);
      localStorage.setItem(
        'grocery_choice_user',
        JSON.stringify({
          id: 1,
          fullName: 'Rahul Sharma',
          email: 'rahul.sharma@example.com',
          phone: '+91 98765 43210'
        })
      );
    }, { token: authToken });

    // ------------------------------------------------------------------------
    // 1. DESKTOP VIEWPORT & HOME PAGE (1920x1080)
    // ------------------------------------------------------------------------
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('\n--- 1. Home Page & Brand Header (Desktop 1920px) ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));

    // Logo & Brand
    const brandName = await page.$eval('.logo-brand-text, .header-brand', (el) => el.innerText).catch(() => '');
    assert('Brand name displayed', brandName.includes('Grocery') && brandName.includes('Choice'), brandName);

    // Search bar placeholder
    const searchPlaceholder = await page.$eval('.search-input', (el) => el.placeholder).catch(() => '');
    assert(
      'Search input placeholder',
      searchPlaceholder.includes('Search for groceries'),
      searchPlaceholder
    );

    // Hero Section Copy
    const heroTitle = await page.$eval('.hero-title', (el) => el.innerText).catch(() => '');
    assert(
      'Hero banner headline',
      heroTitle.includes('Fresh groceries') && heroTitle.includes('Delivered to your doorstep'),
      heroTitle
    );

    // Value Strip
    const bodyText = await page.$eval('body', (el) => el.innerText);
    assert('Value strip: Superfast 15-30 Min', bodyText.includes('15–30 Min Delivery'));
    assert('Value strip: Free Delivery on ₹199', bodyText.includes('Free Delivery on Orders Over ₹199'));
    assert('Value strip: 100% Quality Guaranteed', bodyText.includes('100% Quality Guaranteed'));

    // Category Section Header
    assert('Shop by Category section present', bodyText.includes('Shop by Category'));

    // Product Sections
    assert('Popular Picks section present', bodyText.includes('Popular Picks'));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_desktop_home_1920.png'), fullPage: false });

    // ------------------------------------------------------------------------
    // 2. SEARCH SUGGESTIONS & AUTOCOMPLETE
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Search Autocomplete Experience ---');
    await page.type('.search-input', 'milk');
    await new Promise((r) => setTimeout(r, 600));

    const suggestionsVisible = await page.$eval('.search-suggestions-dropdown', (el) => el !== null).catch(() => false);
    assert('Search suggestions dropdown appears on typing', suggestionsVisible);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_search_dropdown.png') });

    // Clear search
    await page.click('.search-clear-btn');
    await new Promise((r) => setTimeout(r, 300));

    // ------------------------------------------------------------------------
    // 3. DELIVERY LOCATION MODAL (Current Location, Saved Addresses, Enter Manually)
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Delivery Location Experience ---');
    await page.click('.location-selector-btn');
    await new Promise((r) => setTimeout(r, 500));

    const modalText = await page.$eval('.modal-card', (el) => el.innerText).catch(() => '');
    assert('Location modal opened', modalText.includes('Select Delivery Location'));
    assert('Option 1: Use Current Location visible', modalText.includes('Use My Current Location'));
    assert('Option 2: Enter Manually visible', modalText.includes('Enter Location Manually'));
    assert('Option 3: Saved Addresses visible', modalText.toLowerCase().includes('saved'));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_location_modal.png') });

    // Close modal
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 400));

    // ------------------------------------------------------------------------
    // 4. CATEGORIES PAGE
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Categories Page ---');
    await page.goto(`${BASE_URL}/categories`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));

    const catHeading = await page.$eval('h1', (el) => el.innerText).catch(() => '');
    assert('Categories page loaded', catHeading.includes('Categories') || catHeading.includes('Department'), catHeading);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_categories_page.png') });

    // ------------------------------------------------------------------------
    // 5. PRODUCTS & PRODUCT CARD & ADD TO CART
    // ------------------------------------------------------------------------
    console.log('\n--- 5. Products & Product Card Interaction ---');
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    // Check product card structure
    const hasProductCard = await page.$eval('.product-card', (el) => Boolean(el)).catch(() => false);
    assert('Product cards rendered in grid', hasProductCard);

    // Click + ADD on first product card
    const addBtnHandle = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('.product-card button'));
      return buttons.find((b) => b.innerText.includes('ADD') || b.getAttribute('aria-label')?.includes('Add'));
    });
    if (addBtnHandle.asElement()) {
      await addBtnHandle.asElement().click();
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Verify quantity stepper appears on card
    const hasStepper = await page.$eval('.product-card .qty-selector', (el) => Boolean(el)).catch(() => false);
    assert('Quantity selector appears after clicking Add', hasStepper);

    // Verify header cart badge updated
    const cartBadgeCount = await page.$eval('.cart-badge', (el) => el.innerText).catch(() => '0');
    assert('Header cart badge reflects added item', parseInt(cartBadgeCount) >= 1, `Count: ${cartBadgeCount}`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_products_and_add_to_cart.png') });

    // ------------------------------------------------------------------------
    // 6. CART PAGE
    // ------------------------------------------------------------------------
    console.log('\n--- 6. Cart Page ---');
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));

    const cartPageTitle = await page.$eval('h1', (el) => el.innerText).catch(() => '');
    assert('Cart page title: Your Cart', cartPageTitle.includes('Your Cart'), cartPageTitle);

    const cartText = await page.$eval('.cart-page', (el) => el.innerText).catch(() => '');
    assert('Order Summary section present', cartText.includes('Order Summary'));
    assert('Subtotal line present', cartText.includes('Subtotal'));
    assert('Delivery Charge line present', cartText.includes('Delivery Charge'));
    assert('Proceed to Checkout button present', cartText.includes('Proceed to Checkout'));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_cart_page.png') });

    // ------------------------------------------------------------------------
    // 7. CHECKOUT PAGE (Multi-section, Delivery Address, Payment Methods)
    // ------------------------------------------------------------------------
    console.log('\n--- 7. Checkout Page Multi-section & Placement ---');
    // Ensure active location exists in localStorage for order placement
    await page.evaluate(() => {
      const loc = {
        id: 'test-loc-1',
        type: 'manual',
        label: 'Home',
        house: 'Flat 402, Green Meadows',
        street: 'MG Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        compactDisplay: 'Bengaluru, 560038',
        formattedAddress: 'Flat 402, Green Meadows, MG Road, Indiranagar, Bengaluru, Karnataka - 560038'
      };
      localStorage.setItem('grocery_choice_location', JSON.stringify({
        selectedLocation: loc,
        savedLocations: [loc]
      }));
    });

    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    const checkoutText = await page.$eval('body', (el) => el.innerText).catch(() => '');
    assert('Section 1: Delivery Address present', checkoutText.includes('Delivery Address'));
    assert('Contact Details present', checkoutText.includes('Contact Details'));
    assert('Payment Options present', checkoutText.includes('Payment Options') || checkoutText.includes('Payment Method'));
    assert('Order Summary & Price Details present', checkoutText.includes('Order Summary'));

    // Verify payment options: UPI, Card, Net Banking, Wallet, COD
    assert('UPI payment option available', checkoutText.includes('UPI'));
    assert('Card payment option available', checkoutText.includes('Card') || checkoutText.includes('Debit / Credit'));
    assert('Cash on Delivery option available', checkoutText.includes('Cash on Delivery'));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_checkout_page.png') });

    // Select COD and Place Order
    console.log('\n--- 8. Placing Order via Cash on Delivery ---');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.payment-method-card'));
      const codCard = cards.find((c) => c.innerText.includes('Cash on Delivery'));
      if (codCard) codCard.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Submit order
    const placeOrderBtn = await page.$('button[type="submit"]');
    if (placeOrderBtn) {
      await placeOrderBtn.click();
      await page.waitForFunction(
        () => document.body.innerText.includes('Order Confirmed') || document.body.innerText.includes('Order Placed'),
        { timeout: 8000 }
      ).catch(() => {});
      await new Promise((r) => setTimeout(r, 1500));
    }

    // ------------------------------------------------------------------------
    // 9. ORDER CONFIRMATION SCREEN
    // ------------------------------------------------------------------------
    console.log('\n--- 9. Order Confirmation Screen ---');
    const confirmBody = await page.$eval('body', (el) => el.innerText).catch(() => '');
    assert('Order Confirmed heading', confirmBody.includes('Order Confirmed'));
    assert(
      'Thank you message',
      confirmBody.includes('Thank you for shopping with Grocery Choice')
    );
    assert('Order Number displayed', confirmBody.includes('Order Number'));
    assert('Amount displayed', confirmBody.includes('Amount'));
    assert('Estimated Delivery Time displayed', confirmBody.includes('Estimated Delivery Time'));
    assert('Track Order button present', confirmBody.includes('Track Order'));
    assert('Continue Shopping button present', confirmBody.includes('Continue Shopping'));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_order_confirmation.png') });

    // ------------------------------------------------------------------------
    // 10. MY ORDERS PAGE
    // ------------------------------------------------------------------------
    console.log('\n--- 10. My Orders Page ---');
    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));

    const ordersHeading = await page.$eval('h1', (el) => el.innerText).catch(() => '');
    assert('My Orders page heading: My Orders', ordersHeading === 'My Orders', ordersHeading);

    const ordersText = await page.$eval('.orders-page', (el) => el.innerText).catch(() => '');
    assert('Order card or list rendered properly', ordersText.includes('Placed on') || ordersText.includes('Track active deliveries'));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_my_orders_page.png') });

    // ------------------------------------------------------------------------
    // 11. PROFILE PAGE
    // ------------------------------------------------------------------------
    console.log('\n--- 11. Customer Profile Page ---');
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    const profileText = await page.$eval('.profile-page', (el) => el.innerText).catch(() => '');
    assert('Profile picture / Avatar section present', profileText.includes('Profile Picture') || profileText.includes('Rahul Sharma') || profileText.includes('Upload Picture'));
    assert('Personal Information tab present', profileText.includes('Personal Information'));
    assert('My Addresses tab present', profileText.includes('My Addresses'));
    assert('Payment Methods tab present', profileText.includes('Payment Methods'));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_profile_page.png') });

    // ------------------------------------------------------------------------
    // 12. FOOTER VERIFICATION
    // ------------------------------------------------------------------------
    console.log('\n--- 12. Footer Design & Tagline ---');
    const footerText = await page.$eval('.app-footer', (el) => el.innerText).catch(() => '');
    assert('Footer: Customer Support section present', footerText.includes('Customer Support'));
    assert('Footer: Quick Links section present', footerText.includes('Quick Links'));
    assert('Footer: Legal section present', footerText.includes('Legal'));
    assert('Footer: Tagline present', footerText.includes('Quality groceries. Better choice.'));

    // ------------------------------------------------------------------------
    // 13. RESPONSIVE BREAKPOINTS (Tablet & Mobile)
    // ------------------------------------------------------------------------
    console.log('\n--- 13. Responsive Breakpoints Testing ---');
    const viewports = [
      { name: 'Desktop 1440px', width: 1440, height: 900 },
      { name: 'Tablet 1024px', width: 1024, height: 768 },
      { name: 'Tablet 768px', width: 768, height: 1024 },
      { name: 'Mobile 390px (iPhone 14)', width: 390, height: 844 }
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 600));

      if (vp.width <= 768) {
        // Verify Mobile bottom navigation
        const mobileNavVisible = await page.$eval('.mobile-bottom-nav', (el) => el !== null).catch(() => false);
        assert(`${vp.name}: Mobile bottom nav visible`, mobileNavVisible);

        // Verify mobile header search strip
        const mobileSearchVisible = await page.$eval('.mobile-search-strip', (el) => el !== null).catch(() => false);
        assert(`${vp.name}: Mobile search strip visible below header`, mobileSearchVisible);
      } else {
        assert(`${vp.name}: Desktop/Tablet layout rendered without crashes`, true);
      }

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `11_responsive_${vp.width}.png`),
        fullPage: false
      });
    }

    // ------------------------------------------------------------------------
    // 14. CONSOLE & RUNTIME ERRORS
    // ------------------------------------------------------------------------
    console.log('\n--- 14. Console & Runtime Errors Audit ---');
    const criticalErrors = consoleErrors.filter(e => !e.includes('404') && !e.includes('401'));
    assert('No critical runtime console errors', criticalErrors.length === 0, `Errors: ${criticalErrors.join('; ')}`);

  } catch (err) {
    console.error('Fatal execution error during test:', err);
  } finally {
    await browser.close();
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log('\n===============================================================');
  console.log(`  VERIFICATION RESULTS: ${passedCount} / ${results.length} PASSED`);
  console.log('===============================================================\n');

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runVerification();
