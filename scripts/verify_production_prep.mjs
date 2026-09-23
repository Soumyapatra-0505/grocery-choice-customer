import puppeteer from 'puppeteer-core';
import { loadEnv } from 'vite';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CUSTOMER_LOCAL = 'http://localhost:5173';
const OWNER_LOCAL = 'http://localhost:5174';
const BACKEND_LOCAL = 'http://localhost:8080';
const PROD_BACKEND_URL = 'https://grocery-choice-backend-production.up.railway.app';
const PROD_CUSTOMER_URL = 'https://grocery-choice-customer-8ntfdslp-grocery-choice.vercel.app';

const results = [];
function record(name, pass, details = '') {
  results.push({ name, pass: !!pass, details });
  console.log(`${pass ? '✓ PASS' : '✗ FAIL'}: [${name}] ${details ? '— ' + details : ''}`);
}

async function runVerification() {
  console.log('================================================================');
  console.log('  GROCERY CHOICE — PRODUCTION READINESS & API VERIFICATION');
  console.log('================================================================\n');

  // 1. Environment Variables Configuration Check
  console.log('--- 1. Environment Variables Check ---');
  const custDevEnv = loadEnv('development', 'd:/Grocery Choice/customer');
  const custProdEnv = loadEnv('production', 'd:/Grocery Choice/customer');
  const ownerDevEnv = loadEnv('development', 'd:/Grocery Choice/owner');
  const ownerProdEnv = loadEnv('production', 'd:/Grocery Choice/owner');

  const custDevPass = custDevEnv.VITE_API_BASE_URL === 'http://localhost:8080';
  const custProdPass = custProdEnv.VITE_API_BASE_URL === PROD_BACKEND_URL;
  record('Customer Dev Environment Config', custDevPass, `VITE_API_BASE_URL = ${custDevEnv.VITE_API_BASE_URL}`);
  record('Customer Prod Environment Config', custProdPass, `VITE_API_BASE_URL = ${custProdEnv.VITE_API_BASE_URL}`);

  const ownerDevPass = ownerDevEnv.VITE_API_BASE_URL === 'http://localhost:8080';
  const ownerProdPass = ownerProdEnv.VITE_API_BASE_URL === PROD_BACKEND_URL;
  record('Owner Dev Environment Config', ownerDevPass, `VITE_API_BASE_URL = ${ownerDevEnv.VITE_API_BASE_URL}`);
  record('Owner Prod Environment Config', ownerProdPass, `VITE_API_BASE_URL = ${ownerProdEnv.VITE_API_BASE_URL}`);

  // 2. Production Bundle Verification
  console.log('\n--- 2. Production Bundle Verification ---');
  const custDistFiles = fs.readdirSync('d:/Grocery Choice/customer/dist/assets');
  const custJsFile = custDistFiles.find(f => f.endsWith('.js'));
  const custJsContent = fs.readFileSync(`d:/Grocery Choice/customer/dist/assets/${custJsFile}`, 'utf8');

  const custBundleHasProdUrl = custJsContent.includes('grocery-choice-backend-production.up.railway.app');
  const custBundleHasNoLocalhostApi = !custJsContent.includes('http://localhost:8080');
  record('Customer Production Bundle Uses Railway URL', custBundleHasProdUrl, `Found in ${custJsFile}`);
  record('Customer Production Bundle Has No Hardcoded Localhost API', custBundleHasNoLocalhostApi, 'Zero occurrences of http://localhost:8080');

  const ownerDistFiles = fs.readdirSync('d:/Grocery Choice/owner/dist/assets');
  const ownerJsFile = ownerDistFiles.find(f => f.endsWith('.js'));
  const ownerJsContent = fs.readFileSync(`d:/Grocery Choice/owner/dist/assets/${ownerJsFile}`, 'utf8');

  const ownerBundleHasProdUrl = ownerJsContent.includes('grocery-choice-backend-production.up.railway.app');
  const ownerBundleHasNoLocalhostApi = !ownerJsContent.includes('http://localhost:8080');
  record('Owner Production Bundle Uses Railway URL', ownerBundleHasProdUrl, `Found in ${ownerJsFile}`);
  record('Owner Production Bundle Has No Hardcoded Localhost API', ownerBundleHasNoLocalhostApi, 'Zero occurrences of http://localhost:8080');

  // 3. CORS Backend Verification
  console.log('\n--- 3. CORS Preflight & Origin Verification ---');
  // A. Deployed Customer Vercel Origin
  const corsProdRes = await fetch(`${BACKEND_LOCAL}/api/categories`, {
    method: 'OPTIONS',
    headers: {
      'Origin': PROD_CUSTOMER_URL,
      'Access-Control-Request-Method': 'GET'
    }
  });
  const allowOriginProd = corsProdRes.headers.get('access-control-allow-origin');
  const allowCredsProd = corsProdRes.headers.get('access-control-allow-credentials');
  const corsProdPass = corsProdRes.status === 200 && allowOriginProd === PROD_CUSTOMER_URL && allowCredsProd === 'true';
  record('CORS: Deployed Customer Production Origin Allowed', corsProdPass, `Origin: ${allowOriginProd}, Credentials: ${allowCredsProd}`);

  // B. Local Customer Origin
  const corsLocalCustRes = await fetch(`${BACKEND_LOCAL}/api/categories`, {
    method: 'OPTIONS',
    headers: {
      'Origin': CUSTOMER_LOCAL,
      'Access-Control-Request-Method': 'GET'
    }
  });
  const allowOriginLocalCust = corsLocalCustRes.headers.get('access-control-allow-origin');
  const corsLocalCustPass = corsLocalCustRes.status === 200 && allowOriginLocalCust === CUSTOMER_LOCAL;
  record('CORS: Local Customer Origin Allowed', corsLocalCustPass, `Origin: ${allowOriginLocalCust}`);

  // C. Local Owner Origin
  const corsLocalOwnerRes = await fetch(`${BACKEND_LOCAL}/api/categories`, {
    method: 'OPTIONS',
    headers: {
      'Origin': OWNER_LOCAL,
      'Access-Control-Request-Method': 'GET'
    }
  });
  const allowOriginLocalOwner = corsLocalOwnerRes.headers.get('access-control-allow-origin');
  const corsLocalOwnerPass = corsLocalOwnerRes.status === 200 && allowOriginLocalOwner === OWNER_LOCAL;
  record('CORS: Local Owner Origin Allowed', corsLocalOwnerPass, `Origin: ${allowOriginLocalOwner}`);

  // D. Disallowed Malicious Origin Rejected (No Wildcard)
  const corsMaliciousRes = await fetch(`${BACKEND_LOCAL}/api/categories`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://attacker-origin.com',
      'Access-Control-Request-Method': 'GET'
    }
  });
  const allowOriginMalicious = corsMaliciousRes.headers.get('access-control-allow-origin');
  const corsMaliciousPass = corsMaliciousRes.status === 403 || allowOriginMalicious === null;
  record('CORS: Disallowed Origin Rejected (No Wildcard Allowed)', corsMaliciousPass, `Status: ${corsMaliciousRes.status}, Allowed: ${allowOriginMalicious}`);

  // 4. API Services Configuration & Functional Integrity (Local Dev)
  console.log('\n--- 4. API Endpoints Functional Check (Local Dev Server) ---');
  // Categories
  const catRes = await fetch(`${BACKEND_LOCAL}/api/categories`);
  const catData = await catRes.json();
  record('Category API functional', Array.isArray(catData) && catData.length > 0, `Loaded ${catData.length} categories`);

  // Products
  const prodRes = await fetch(`${BACKEND_LOCAL}/api/products`);
  const prodData = await prodRes.json();
  record('Product API functional', Array.isArray(prodData) && prodData.length > 0, `Loaded ${prodData.length} products`);

  // Product Search
  const searchRes = await fetch(`${BACKEND_LOCAL}/api/products/search?query=Milk`);
  const searchData = await searchRes.json();
  record('Product Search API functional', Array.isArray(searchData), `Search returned ${searchData.length} result(s)`);

  // Auth send-otp
  const sendOtpRes = await fetch(`${BACKEND_LOCAL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'test.prep@grocerychoice.com', purpose: 'LOGIN' })
  });
  const sendOtpData = await sendOtpRes.json();
  record('Customer Auth Send-OTP API functional', sendOtpRes.status === 200, `Success: ${sendOtpData.success}`);

  // Owner Auth login
  const ownerLoginRes = await fetch(`${BACKEND_LOCAL}/api/auth/owner/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'owner@grocerychoice.com', password: 'Admin@123' })
  });
  const ownerLoginData = await ownerLoginRes.json();
  record('Owner Auth Login API functional', ownerLoginRes.status === 200 && !!ownerLoginData.token, `Owner role: ${ownerLoginData.user?.role}`);

  // Owner Orders API with token
  const ownerOrdersRes = await fetch(`${BACKEND_LOCAL}/api/orders`, {
    headers: { 'Authorization': `Bearer ${ownerLoginData.token}` }
  });
  const ownerOrdersData = await ownerOrdersRes.json();
  record('Owner Orders API functional', Array.isArray(ownerOrdersData), `Found ${ownerOrdersData.length} orders in system`);

  // 5. Browser Console Verification
  console.log('\n--- 5. Browser Console Verification (Puppeteer) ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox']
  });

  const consoleErrors = [];
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('React DevTools')) {
        consoleErrors.push(text);
        console.error('  [Browser Console Error]:', text);
      }
    }
  });

  // Navigate to Customer Storefront
  await page.goto(`${CUSTOMER_LOCAL}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.goto(`${CUSTOMER_LOCAL}/products`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Navigate to Owner Portal
  await page.goto(`${OWNER_LOCAL}/login`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  await browser.close();

  const consolePass = consoleErrors.length === 0;
  record('Browser Console Errors Check', consolePass, `Errors captured: ${consoleErrors.length}`);

  // Summary
  console.log('\n================================================================');
  console.log('                 FINAL VERIFICATION SUMMARY');
  console.log('================================================================');
  let allPass = true;
  for (const r of results) {
    if (!r.pass) allPass = false;
  }
  console.log(`TOTAL CHECKS: ${results.length}, PASSED: ${results.filter(r => r.pass).length}, FAILED: ${results.filter(r => !r.pass).length}`);
  console.log(`FINAL READINESS STATUS: ${allPass ? 'READY' : 'FAILED'}`);
  console.log('================================================================\n');

  return { allPass, consoleErrors };
}

runVerification().then(res => {
  if (!res.allPass) process.exit(1);
  else process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
