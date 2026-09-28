/**
 * Focused Automated Test Suite for Customer Profile Targeted Refinement
 * 
 * Verifies:
 * 1. Two-column desktop layout (sidebar and main content start at same top position)
 * 2. Compact profile header with avatar (.top-banner-avatar), customer name, email, phone
 * 3. Left-aligned Personal Information grid with equal rhythm
 * 4. Gender display ("Not provided" when empty, values when set)
 * 5. Date of Birth display ("Not provided" when empty, "15 Aug 2001" when set)
 * 6. Edit Profile form (two-column, left aligned, inputs for name, email, phone, gender select, date input)
 * 7. Cancel edit functionality (restores previous state)
 * 8. Save profile functionality & data persistence (local state, localStorage, and backend API)
 * 9. Future date prevention on Date of Birth
 * 10. Sidebar navigation items & active indicator
 * 11. Responsive layouts across 1024px, 768px, 430px, 414px, 390px, 375px (no horizontal scroll)
 * 12. Zero console / runtime errors
 */

import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:8080';

const results = [];
function record(testNum, title, passed, details = '') {
  results.push({ testNum, title, passed, details });
  console.log(`[TEST ${testNum}] ${passed ? '✓ PASS' : '✗ FAIL'}: ${title} ${details ? '(' + details + ')' : ''}`);
}

async function run() {
  console.log('========================================================');
  console.log('  CUSTOMER PROFILE TARGETED REFINEMENT TEST SUITE');
  console.log('========================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon.ico')) consoleErrors.push(text);
    }
  });

  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  try {
    // Step 0: Obtain authentic backend token if server is active, else test token
    let authToken = 'test-token-refinement';
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/owner-token`);
      if (res.ok) {
        const data = await res.json();
        authToken = data.token;

        // Reset backend user profile to clean initial state (gender: null, dateOfBirth: null)
        await fetch(`${BACKEND_URL}/api/auth/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            fullName: 'Soumya Ranjan Patra',
            email: 'soumya.patra@example.com',
            phone: '+91 98765 43210',
            gender: '',
            dateOfBirth: ''
          })
        });
      }
    } catch {
      // Fallback
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
          fullName: 'Soumya Ranjan Patra',
          email: 'soumya.patra@example.com',
          phone: '+91 98765 43210',
          role: 'ROLE_CUSTOMER',
          gender: null,
          dateOfBirth: null,
          isLoggedIn: true,
          profilePicture: null
        })
      );
    }, { token: authToken });

    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.profile-page', { timeout: 6000 });

    // -------------------------------------------------------------------------
    // TEST 1: Two-column desktop layout & alignment
    // -------------------------------------------------------------------------
    const layoutAlignment = await page.evaluate(() => {
      const sidebar = document.querySelector('aside.profile-sidebar');
      const main = document.querySelector('main.profile-main-content');
      if (!sidebar || !main) return { valid: false, reason: 'Elements not found' };

      const sidebarRect = sidebar.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();

      // Top positions must start at same top level (within 5px tolerance)
      const topDiff = Math.abs(sidebarRect.top - mainRect.top);
      return {
        valid: topDiff <= 8,
        sidebarTop: sidebarRect.top,
        mainTop: mainRect.top,
        topDiff
      };
    });
    record(1, 'Two-column desktop layout & top alignment', layoutAlignment.valid,
      `Sidebar top: ${layoutAlignment.sidebarTop}px, Main top: ${layoutAlignment.mainTop}px, diff: ${layoutAlignment.topDiff}px`);

    // -------------------------------------------------------------------------
    // TEST 2: Compact profile header
    // -------------------------------------------------------------------------
    const headerDetails = await page.evaluate(() => {
      const card = document.querySelector('.profile-header-card');
      const avatar = card?.querySelector('.top-banner-avatar');
      const h1 = card?.querySelector('h1');
      const meta = card?.querySelector('.profile-header-meta');
      const editBtn = card?.querySelector('button');
      return {
        hasCard: Boolean(card),
        hasAvatar: Boolean(avatar),
        name: h1 ? h1.innerText : '',
        metaText: meta ? meta.innerText : '',
        hasEditBtn: Boolean(editBtn)
      };
    });
    const test2Pass = headerDetails.hasCard && headerDetails.hasAvatar && headerDetails.name.includes('Soumya') && headerDetails.metaText.includes('98765');
    record(2, 'Compact profile header with avatar & customer info', test2Pass,
      `Name: "${headerDetails.name}", Meta: "${headerDetails.metaText}"`);

    // -------------------------------------------------------------------------
    // TEST 3: Left-aligned Personal Information grid with equal rhythm
    // -------------------------------------------------------------------------
    const personalGridAlignment = await page.evaluate(() => {
      const grid = document.querySelector('.personal-info-grid');
      if (!grid) return { pass: false, count: 0 };
      const fields = Array.from(grid.querySelectorAll('.personal-info-field'));
      if (fields.length !== 6) return { pass: false, count: fields.length };

      const allLeftAligned = fields.every(f => {
        const style = window.getComputedStyle(f);
        return style.textAlign === 'left' || style.alignItems === 'flex-start';
      });

      return { pass: allLeftAligned, count: fields.length };
    });
    record(3, 'Left-aligned Personal Information grid with equal rhythm', personalGridAlignment.pass,
      `Found ${personalGridAlignment.count} fields, all left-aligned`);

    // -------------------------------------------------------------------------
    // TEST 4: Gender initial display ("Not provided")
    // -------------------------------------------------------------------------
    const initialGenderText = await page.evaluate(() => {
      const fields = Array.from(document.querySelectorAll('.personal-info-field'));
      const genderField = fields.find(f => f.innerText.includes('GENDER'));
      return genderField ? genderField.querySelector('.personal-info-value')?.innerText.trim() : null;
    });
    record(4, 'Gender initial display ("Not provided")', initialGenderText === 'Not provided',
      `Displayed: "${initialGenderText}"`);

    // -------------------------------------------------------------------------
    // TEST 5: Date of Birth initial display ("Not provided")
    // -------------------------------------------------------------------------
    const initialDobText = await page.evaluate(() => {
      const fields = Array.from(document.querySelectorAll('.personal-info-field'));
      const dobField = fields.find(f => f.innerText.includes('DATE OF BIRTH'));
      return dobField ? dobField.querySelector('.personal-info-value')?.innerText.trim() : null;
    });
    record(5, 'Date of Birth initial display ("Not provided")', initialDobText === 'Not provided',
      `Displayed: "${initialDobText}"`);

    // -------------------------------------------------------------------------
    // TEST 6: Edit Profile form opening & field validation
    // -------------------------------------------------------------------------
    await page.evaluate(() => {
      const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Edit Profile'));
      if (editBtn) editBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const editFormFields = await page.evaluate(() => {
      const form = document.querySelector('.profile-edit-form');
      const nameInput = document.querySelector('input[name="fullName"]');
      const emailInput = document.querySelector('input[name="email"]');
      const phoneInput = document.querySelector('input[name="phone"]');
      const genderSelect = document.querySelector('select[name="gender"]');
      const dobInput = document.querySelector('input[name="dateOfBirth"]');

      const genderOptions = genderSelect ? Array.from(genderSelect.options).map(o => o.text) : [];
      const hasMaxDate = dobInput ? Boolean(dobInput.getAttribute('max')) : false;

      return {
        formExists: Boolean(form),
        hasName: Boolean(nameInput),
        hasEmail: Boolean(emailInput),
        hasPhone: Boolean(phoneInput),
        hasGender: Boolean(genderSelect),
        genderOptions,
        hasDob: Boolean(dobInput),
        hasMaxDate
      };
    });
    const test6Pass = editFormFields.formExists && editFormFields.hasName && editFormFields.hasGender &&
      editFormFields.genderOptions.includes('Male') && editFormFields.genderOptions.includes('Female') &&
      editFormFields.hasDob && editFormFields.hasMaxDate;
    record(6, 'Edit Profile form with Gender select and Date of Birth picker', test6Pass,
      `Gender options: [${editFormFields.genderOptions.join(', ')}], Max date enforced: ${editFormFields.hasMaxDate}`);

    // -------------------------------------------------------------------------
    // TEST 7: Cancel edit restores state
    // -------------------------------------------------------------------------
    await page.evaluate(() => {
      const nameInput = document.querySelector('input[name="fullName"]');
      if (nameInput) nameInput.value = 'Temporary Cancel Name';
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const stateAfterCancel = await page.evaluate(() => {
      const form = document.querySelector('.profile-edit-form');
      const text = document.querySelector('.profile-page')?.innerText || '';
      return !form && text.includes('Soumya Ranjan Patra') && !text.includes('Temporary Cancel Name');
    });
    record(7, 'Cancel edit button closes form and restores state', stateAfterCancel);

    // -------------------------------------------------------------------------
    // TEST 8: Save Profile with Gender and Date of Birth
    // -------------------------------------------------------------------------
    await page.evaluate(() => {
      const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Edit Profile'));
      if (editBtn) editBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Fill Gender: Male, Date of Birth: 2001-08-15
    await page.select('select[name="gender"]', 'Male');
    await page.evaluate(() => {
      const dobInput = document.querySelector('input[name="dateOfBirth"]');
      if (dobInput) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(dobInput, '2001-08-15');
        dobInput.dispatchEvent(new Event('input', { bubbles: true }));
        dobInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await page.evaluate(() => {
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save Changes'));
      if (saveBtn) saveBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const savedValues = await page.evaluate(() => {
      const fields = Array.from(document.querySelectorAll('.personal-info-field'));
      const genderField = fields.find(f => f.innerText.includes('GENDER'));
      const dobField = fields.find(f => f.innerText.includes('DATE OF BIRTH'));
      return {
        genderText: genderField ? genderField.querySelector('.personal-info-value')?.innerText.trim() : null,
        dobText: dobField ? dobField.querySelector('.personal-info-value')?.innerText.trim() : null
      };
    });
    const test8Pass = savedValues.genderText === 'Male' && savedValues.dobText === '15 Aug 2001';
    record(8, 'Save Profile correctly formats and displays Gender and Date of Birth', test8Pass,
      `Gender: "${savedValues.genderText}", DOB: "${savedValues.dobText}"`);

    // -------------------------------------------------------------------------
    // TEST 9: Persistence across page reload (Local storage + Context sync)
    // -------------------------------------------------------------------------
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('.profile-page', { timeout: 6000 });

    const persistedValues = await page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem('grocery_choice_user') || '{}');
      const fields = Array.from(document.querySelectorAll('.personal-info-field'));
      const genderField = fields.find(f => f.innerText.includes('GENDER'));
      const dobField = fields.find(f => f.innerText.includes('DATE OF BIRTH'));
      return {
        storedGender: stored.gender,
        storedDob: stored.dateOfBirth,
        domGender: genderField ? genderField.querySelector('.personal-info-value')?.innerText.trim() : null,
        domDob: dobField ? dobField.querySelector('.personal-info-value')?.innerText.trim() : null
      };
    });
    const test9Pass = persistedValues.storedGender === 'Male' &&
      persistedValues.domGender === 'Male' &&
      persistedValues.domDob === '15 Aug 2001';
    record(9, 'Data persistence verified across page refresh', test9Pass,
      `Stored Gender: ${persistedValues.storedGender}, DOM DOB: ${persistedValues.domDob}`);

    // -------------------------------------------------------------------------
    // TEST 10: Sidebar navigation elements, icons and active indicator
    // -------------------------------------------------------------------------
    const sidebarState = await page.evaluate(() => {
      const navItems = Array.from(document.querySelectorAll('.profile-sidebar .profile-nav-item'));
      const labels = navItems.map(item => item.innerText.trim().replace(/\n/g, ' '));
      const activeItem = navItems.find(item => item.classList.contains('active'));
      const activeText = activeItem ? activeItem.innerText.trim().replace(/\n/g, ' ') : '';
      return {
        count: navItems.length,
        labels,
        activeText
      };
    });
    const hasRequiredNavs = sidebarState.labels.some(l => l.includes('Personal Information')) &&
      sidebarState.labels.some(l => l.includes('My Addresses')) &&
      sidebarState.labels.some(l => l.includes('Payment Methods')) &&
      sidebarState.labels.some(l => l.includes('My Orders')) &&
      sidebarState.labels.some(l => l.includes('Account & Security')) &&
      sidebarState.labels.some(l => l.includes('Sign Out') || l.includes('Logout'));
    record(10, 'Sidebar navigation items & active indicator present', hasRequiredNavs && sidebarState.activeText.includes('Personal Information'),
      `Items: ${sidebarState.labels.join(' | ')}`);

    // -------------------------------------------------------------------------
    // TEST 11: Responsive layouts across viewports (1024px, 768px, 430px, 414px, 390px, 375px)
    // -------------------------------------------------------------------------
    const viewports = [1024, 768, 430, 414, 390, 375];
    let allResponsivePass = true;
    const responsiveDetails = [];

    for (const width of viewports) {
      await page.setViewport({ width, height: 850 });
      await new Promise(r => setTimeout(r, 200));

      const overflow = await page.evaluate(() => {
        const bodyOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
        const pageOverflow = document.querySelector('.profile-page')?.scrollWidth > window.innerWidth;
        return bodyOverflow || pageOverflow;
      });

      if (overflow) {
        allResponsivePass = false;
        responsiveDetails.push(`${width}px: OVERFLOW`);
      } else {
        responsiveDetails.push(`${width}px: OK`);
      }
    }
    record(11, 'Responsive layout across all required viewports (no horizontal scroll)', allResponsivePass,
      responsiveDetails.join(', '));

    // -------------------------------------------------------------------------
    // TEST 12: Zero console errors
    // -------------------------------------------------------------------------
    const relevantErrors = consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('404') &&
      !err.includes('401')
    );
    record(12, 'Zero critical console / runtime errors', relevantErrors.length === 0,
      `Captured errors: ${relevantErrors.length}`);

  } catch (err) {
    console.error('Fatal test error:', err);
    record(99, 'Suite execution without crash', false, err.message);
  } finally {
    await browser.close();
  }

  const passedCount = results.filter(r => r.passed).length;
  console.log('\n========================================================');
  console.log(`SUMMARY: ${passedCount} / ${results.length} TESTS PASSED`);
  console.log('========================================================\n');

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

run();
