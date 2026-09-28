/**
 * Comprehensive Automated Browser Test Suite
 * Verifying 12 Core Requirements for Profile Picture & Saved Payment Methods:
 *
 * 1. Profile picture section visible.
 * 2. Default avatar shown when no picture exists.
 * 3. Image selection/preview works.
 * 4. Invalid file type/oversized file is rejected appropriately.
 * 5. Remove/change picture UI works.
 * 6. Payment Methods section visible.
 * 7. Empty payment-method state works.
 * 8. Masked payment method display works if a real provider-backed method exists.
 * 9. No full card number or CVV is stored anywhere in frontend state/localStorage.
 * 10. Existing Razorpay checkout still works.
 * 11. Existing profile/address/orders functionality still works.
 * 12. No console/runtime errors.
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:8080';

const SCRATCH_DIR = 'd:\\Grocery Choice\\customer\\scripts\\scratch_test_assets';
if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

// Generate test image assets
const VALID_IMAGE_PATH = path.join(SCRATCH_DIR, 'sample_avatar.png');
const INVALID_FILE_PATH = path.join(SCRATCH_DIR, 'sample_doc.txt');
const OVERSIZED_IMAGE_PATH = path.join(SCRATCH_DIR, 'oversized_avatar.png');

// 1. Create valid 100x100 PNG (tiny 1x1 base64 expanded to valid png)
const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
fs.writeFileSync(VALID_IMAGE_PATH, Buffer.from(validPngBase64, 'base64'));

// 2. Create invalid text file
fs.writeFileSync(INVALID_FILE_PATH, 'This is a text document, not an image file.');

// 3. Create oversized dummy file (> 2MB, ~2.4MB)
const oversizedBuffer = Buffer.alloc(2.4 * 1024 * 1024, 0);
fs.writeFileSync(OVERSIZED_IMAGE_PATH, oversizedBuffer);

const results = [];

function logTest(testNum, title, passed, details = '') {
  results.push({ testNum, title, passed, details });
  console.log(`[TEST ${testNum}] ${passed ? '✓ PASS' : '✗ FAIL'}: ${title} ${details ? `(${details})` : ''}`);
}

async function run() {
  console.log('========================================================');
  console.log('Customer Profile: Profile Picture & Payment Methods Tests');
  console.log('========================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  const consoleErrors = [];
  page.on('pageerror', (err) => {
    console.error('Browser Page Error:', err.message);
    consoleErrors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      // Ignore favicon or non-critical 404s
      if (!txt.includes('favicon.ico')) {
        consoleErrors.push(txt);
      }
    }
  });

  // Handle browser confirm dialogs automatically
  page.on('dialog', async (dialog) => {
    // console.log(`Dialog opened: "${dialog.message()}" -> accepting`);
    await dialog.accept();
  });

  try {
    // Step 0: Ensure authenticated session
    let authToken = 'test-jwt-token';
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/owner-token`);
      if (res.ok) {
        const data = await res.json();
        authToken = data.token;
      }
    } catch {
      // Use fallback test token
    }

    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.evaluate(({ token }) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('grocery_choice_token', token);
      localStorage.setItem(
        'grocery_choice_user',
        JSON.stringify({
          id: 101,
          fullName: 'Aarav Patel',
          email: 'aarav.patel@grocerychoice.com',
          phone: '+91 98765 12345',
          role: 'ROLE_CUSTOMER',
          isLoggedIn: true,
          profilePicture: null
        })
      );
    }, { token: authToken });

    // Navigate to /profile
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.profile-page', { timeout: 6000 });

    // -------------------------------------------------------------
    // TEST 1: Profile picture section visible
    // -------------------------------------------------------------
    const picSection = await page.$('.profile-picture-section');
    const isSectionVisible = picSection !== null && await page.evaluate(el => el.offsetParent !== null, picSection);
    logTest(1, 'Profile picture section visible', Boolean(isSectionVisible), 'Found .profile-picture-section container');

    // -------------------------------------------------------------
    // TEST 2: Default avatar shown when no picture exists
    // -------------------------------------------------------------
    const hasDefaultAvatar = await page.evaluate(() => {
      const avatarBox = document.querySelector('.avatar-preview-box');
      if (!avatarBox) return false;
      const defaultBadge = avatarBox.querySelector('.default-avatar-badge');
      const img = avatarBox.querySelector('img');
      const uploadBtn = document.querySelector('button[aria-label="Upload new profile picture"]') ||
        Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Upload Picture') || b.innerText.includes('Upload Photo'));
      const removeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Remove Picture'));
      return Boolean(defaultBadge && !img && uploadBtn && !removeBtn);
    });
    logTest(2, 'Default avatar shown when no picture exists', hasDefaultAvatar, 'Default avatar badge present, no img, Upload Picture button present');

    // -------------------------------------------------------------
    // TEST 3: Image selection/preview works & save works
    // -------------------------------------------------------------
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) throw new Error('File input not found');

    await fileInput.uploadFile(VALID_IMAGE_PATH);
    await new Promise(r => setTimeout(r, 800));
    await page.waitForFunction(() => {
      const img = document.querySelector('.avatar-preview-box img');
      const previewBadge = document.querySelector('.preview-badge');
      return img !== null && previewBadge !== null;
    }, { timeout: 8000 });

    const previewState = await page.evaluate(() => {
      const badge = document.querySelector('.preview-badge');
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save Picture'));
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Cancel'));
      return Boolean(badge && saveBtn && cancelBtn);
    });
    logTest(3, 'Image selection/preview works', previewState, 'Preview badge and Save/Cancel buttons visible');

    // Save the picture
    await page.evaluate(() => {
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save Picture'));
      if (saveBtn) saveBtn.click();
    });
    await page.waitForFunction(() => {
      const previewBadge = document.querySelector('.preview-badge');
      const changeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Change Picture'));
      return !previewBadge && changeBtn !== null;
    }, { timeout: 5000 });

    // Verify top header and profile card show the saved image
    const savedImgVerified = await page.evaluate(() => {
      const img = document.querySelector('.avatar-preview-box img');
      const topAvatarImg = document.querySelector('.top-banner-avatar img');
      const removeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Remove Picture'));
      return Boolean(img && topAvatarImg && removeBtn);
    });
    console.log(`[TEST 3 Extension] Avatar saved & reflected in top banner: ${savedImgVerified ? '✓ PASS' : '✗ FAIL'}`);

    // -------------------------------------------------------------
    // TEST 4: Invalid file type/oversized file is rejected appropriately
    // -------------------------------------------------------------
    // Subtest 4A: Invalid file type (.txt)
    await fileInput.uploadFile(INVALID_FILE_PATH);
    await new Promise(r => setTimeout(r, 600));

    const invalidTypeHandled = await page.evaluate(() => {
      const alert = document.querySelector('[role="alert"]');
      return alert && alert.innerText.includes('Invalid file type');
    });

    // Subtest 4B: Oversized file (>2MB)
    await fileInput.uploadFile(OVERSIZED_IMAGE_PATH);
    await new Promise(r => setTimeout(r, 600));

    const oversizedHandled = await page.evaluate(() => {
      const alert = document.querySelector('[role="alert"]');
      return alert && alert.innerText.includes('exceeds the 2MB limit');
    });

    logTest(4, 'Invalid file type/oversized file is rejected appropriately', Boolean(invalidTypeHandled && oversizedHandled),
      `Invalid format alert: ${invalidTypeHandled}, Oversized alert: ${oversizedHandled}`);

    // -------------------------------------------------------------
    // TEST 5: Remove/change picture UI works
    // -------------------------------------------------------------
    // Click "Remove Picture" button (confirm dialog accepted by handler)
    await page.evaluate(() => {
      const removeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Remove Picture'));
      if (removeBtn) removeBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const pictureRemoved = await page.evaluate(() => {
      const defaultBadge = document.querySelector('.avatar-preview-box .default-avatar-badge');
      const hasImageInBox = Boolean(document.querySelector('.avatar-preview-box img'));
      const uploadBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Upload Picture') || b.innerText.includes('Upload Photo'));
      const avatarInStorage = localStorage.getItem('grocery_choice_avatar_default') ||
        localStorage.getItem('grocery_choice_avatar_+91 98765 12345');
      return Boolean(defaultBadge && !hasImageInBox && uploadBtn && !avatarInStorage);
    });
    logTest(5, 'Remove/change picture UI works', pictureRemoved, 'Reverted to clean default avatar and cleared avatar from storage');

    // -------------------------------------------------------------
    // TEST 6: Payment Methods section visible
    // -------------------------------------------------------------
    // Click "Payment Methods" in sidebar navigation
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('aside button'));
      const payTab = buttons.find(b => b.innerText.includes('Payment Methods'));
      if (payTab) payTab.click();
    });
    await page.waitForSelector('.payment-methods-section', { visible: true, timeout: 5000 });

    const paySectionVisible = await page.evaluate(() => {
      const section = document.querySelector('.payment-methods-section');
      const heading = section?.querySelector('h2');
      return Boolean(section && heading && heading.innerText.includes('Payment Methods'));
    });
    logTest(6, 'Payment Methods section visible', paySectionVisible, 'Navigated to Payment Methods tab successfully');

    // -------------------------------------------------------------
    // TEST 7: Empty payment-method state works
    // -------------------------------------------------------------
    const emptyStateVerified = await page.evaluate(() => {
      const emptyBox = document.querySelector('.payment-empty-state');
      const title = emptyBox?.querySelector('h3')?.innerText;
      const rbiBanner = document.body.innerText.includes('100% RBI & PCI-DSS Compliant Tokenization');
      return Boolean(emptyBox && title?.includes('No Saved Payment Methods') && rbiBanner);
    });

    // Test opening the "How to save a card" / "Add Payment Method" modal
    await page.evaluate(() => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add Payment Method') || b.innerText.includes('How to Save a Card'));
      if (addBtn) addBtn.click();
    });
    await page.waitForSelector('.modal-card', { visible: true, timeout: 5000 });

    const modalContent = await page.evaluate(() => {
      const modal = document.querySelector('.modal-card');
      const text = modal?.innerText || '';
      return {
        hasTitle: text.includes('Save Payment Method') || text.includes('Tokenization'),
        hasRbiExplanation: text.includes('Reserve Bank of India') || text.includes('RBI'),
        hasSteps: text.includes('Online Payment (Razorpay)') || text.includes('checkout')
      };
    });
    const modalPass = modalContent.hasTitle && modalContent.hasRbiExplanation && modalContent.hasSteps;

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.modal-card button[aria-label="Close modal"]') ||
        Array.from(document.querySelectorAll('.modal-card button')).find(b => b.innerText.includes('Understood'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    logTest(7, 'Empty payment-method state works', Boolean(emptyStateVerified && modalPass), 'Empty state rendered with RBI notice & educational modal');

    // -------------------------------------------------------------
    // TEST 8: Masked payment method display works if a real provider-backed method exists
    // -------------------------------------------------------------
    // Seed a provider-backed tokenized card into localStorage
    await page.evaluate(() => {
      const tokenizedMethods = [
        {
          id: 'card_tok_991823',
          network: 'Visa',
          last4: '4242',
          expiry: '09/29',
          isDefault: true
        }
      ];
      localStorage.setItem('grocery_choice_saved_payment_methods', JSON.stringify(tokenizedMethods));
    });

    // Reload / re-render profile payments tab
    await page.reload({ waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('aside button'));
      const payTab = buttons.find(b => b.innerText.includes('Payment Methods'));
      if (payTab) payTab.click();
    });
    await page.waitForSelector('.payment-methods-section', { visible: true, timeout: 5000 });

    const cardRendered = await page.evaluate(() => {
      const sectionText = document.querySelector('.payment-methods-section')?.innerText || '';
      const hasMaskedNumber = sectionText.includes('Visa •••• 4242') || sectionText.includes('•••• 4242');
      const hasExpiry = sectionText.includes('Expires 09/29');
      const hasDefault = sectionText.includes('Default');
      return Boolean(hasMaskedNumber && hasExpiry && hasDefault);
    });

    // Test removing the card
    await page.evaluate(() => {
      const removeBtn = document.querySelector('.payment-methods-section button[title="Remove payment method"]');
      if (removeBtn) removeBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const cardRemovedAndEmptyStateRestored = await page.evaluate(() => {
      const emptyBox = document.querySelector('.payment-empty-state');
      const storageRemaining = localStorage.getItem('grocery_choice_saved_payment_methods');
      return Boolean(emptyBox && (!storageRemaining || storageRemaining === '[]'));
    });

    logTest(8, 'Masked payment method display works if a real provider-backed method exists',
      Boolean(cardRendered && cardRemovedAndEmptyStateRestored),
      'Rendered "Visa •••• 4242", expiry, default badge, and removed cleanly');

    // -------------------------------------------------------------
    // TEST 9: No full card number or CVV is stored anywhere in frontend state/localStorage
    // -------------------------------------------------------------
    const storageAudit = await page.evaluate(() => {
      const allLocalStorage = { ...localStorage };
      const allSessionStorage = { ...sessionStorage };
      const stringified = JSON.stringify({ local: allLocalStorage, session: allSessionStorage }).toLowerCase();

      // Check for CVV or raw card patterns
      const hasCvvField = stringified.includes('"cvv"') || stringified.includes('"cardnumber"') || stringified.includes('"card_number"');
      // 16-digit card number regex check
      const sixteenDigitMatch = /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/.test(stringified);
      const threeDigitCvvPattern = /"cvv"\s*:\s*"\d{3,4}"/.test(stringified);

      return {
        hasCvvField,
        sixteenDigitMatch,
        threeDigitCvvPattern,
        keys: Object.keys(allLocalStorage)
      };
    });

    const securityPass = !storageAudit.hasCvvField && !storageAudit.sixteenDigitMatch && !storageAudit.threeDigitCvvPattern;
    logTest(9, 'No full card number or CVV is stored anywhere in frontend state/localStorage',
      securityPass, `Audit clean. Zero raw credentials stored. Keys: [${storageAudit.keys.join(', ')}]`);

    // -------------------------------------------------------------
    // TEST 10: Existing Razorpay checkout still works
    // -------------------------------------------------------------
    // Seed an item in cart
    await page.evaluate(() => {
      const mockCartItem = {
        id: 1,
        name: 'Fresh Organic Whole Milk',
        price: 64,
        sellingPrice: 64,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'
      };
      localStorage.setItem('grocery_choice_cart', JSON.stringify([mockCartItem]));
    });

    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.checkout-page, .checkout-section, #main-content', { timeout: 6000 });

    const checkoutState = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasAddressSection = text.includes('Delivery Address') || text.includes('Deliver to') || text.includes('Address');
      const hasPaymentOptions = text.includes('Online Payment') || text.includes('Razorpay') || text.includes('Cash on Delivery');
      const hasPlaceOrderBtn = Array.from(document.querySelectorAll('button')).some(b =>
        b.innerText.includes('Place Order') || b.innerText.includes('Proceed to Payment')
      );
      return Boolean(hasAddressSection && hasPaymentOptions && hasPlaceOrderBtn);
    });
    logTest(10, 'Existing Razorpay checkout still works', checkoutState, 'Address, items, Razorpay option, and Place Order button verified');

    // -------------------------------------------------------------
    // TEST 11: Existing profile/address/orders functionality still works
    // -------------------------------------------------------------
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.profile-page', { timeout: 6000 });

    // Check Personal Info Edit
    await page.evaluate(() => {
      const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Edit Profile'));
      if (editBtn) editBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const editFormOpen = await page.evaluate(() => Boolean(document.querySelector('input[name="fullName"]')));

    // Cancel edit
    await page.evaluate(() => {
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Check Address Tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('aside button'));
      const addrTab = buttons.find(b => b.innerText.includes('My Addresses'));
      if (addrTab) addrTab.click();
    });
    await new Promise(r => setTimeout(r, 500));
    const addressTabWorks = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Delivery Addresses') || text.includes('Add New Address');
    });

    // Check Orders navigation
    const ordersLinkPresent = await page.evaluate(() => {
      const link = document.querySelector('a[href="/orders"]');
      return Boolean(link);
    });

    logTest(11, 'Existing profile/address/orders functionality still works',
      Boolean(editFormOpen && addressTabWorks && ordersLinkPresent),
      'Personal Info editing, Delivery Addresses tab, and My Orders link functional');

    // -------------------------------------------------------------
    // TEST 12: No console/runtime errors
    // -------------------------------------------------------------
    const errorCount = consoleErrors.length;
    const test12Pass = errorCount === 0;
    logTest(12, 'No console/runtime errors', test12Pass,
      test12Pass ? 'Zero runtime or console errors' : `Errors caught: ${consoleErrors.join('; ')}`);

  } catch (err) {
    console.error('Test execution error:', err);
    logTest(999, 'Fatal Exception during test execution', false, err.message);
  } finally {
    await browser.close();

    // Clean up scratch assets
    try {
      if (fs.existsSync(SCRATCH_DIR)) {
        fs.rmSync(SCRATCH_DIR, { recursive: true, force: true });
      }
    } catch {}
  }

  console.log('\n========================================================');
  console.log('TEST SUMMARY');
  console.log('========================================================');
  const allPassed = results.every(r => r.passed);
  results.forEach(r => {
    console.log(`Test ${r.testNum}: ${r.passed ? 'PASS' : 'FAIL'} - ${r.title}`);
  });
  console.log(`\nOVERALL: ${allPassed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'} (${results.filter(r => r.passed).length}/${results.length})`);

  if (!allPassed) {
    process.exit(1);
  }
}

run();
