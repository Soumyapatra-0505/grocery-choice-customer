import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const customerDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('   GROCERY CHOICE — CUSTOMER VERCEL PREPARATION VERIFICATION   ');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message, details = '') {
  if (condition) {
    passCount++;
    console.log(`✓ PASS: [${message}]${details ? ' — ' + details : ''}`);
  } else {
    failCount++;
    console.error(`✗ FAIL: [${message}]${details ? ' — ' + details : ''}`);
  }
}

// 1. Production Environment Variables
console.log('--- 1. Production Environment Variables ---');
const prodEnv = loadEnv('production', customerDir);
const expectedProdUrl = 'https://grocery-choice-backend-production.up.railway.app';
assert(
  prodEnv.VITE_API_BASE_URL === expectedProdUrl,
  'Customer Production Environment Variable',
  `VITE_API_BASE_URL = ${prodEnv.VITE_API_BASE_URL}`
);

const prodEnvFile = fs.readFileSync(path.join(customerDir, '.env.production'), 'utf8');
assert(
  prodEnvFile.includes(`VITE_API_BASE_URL=${expectedProdUrl}`),
  '.env.production File Content',
  `Contains exact key-value pair`
);

// 2. Production API URL in Bundle
console.log('\n--- 2. Production API URL in Bundle ---');
const distAssetsDir = path.join(customerDir, 'dist', 'assets');
assert(fs.existsSync(distAssetsDir), 'Dist Assets Directory Exists');

const jsFiles = fs.readdirSync(distAssetsDir).filter(f => f.endsWith('.js'));
assert(jsFiles.length > 0, 'Production JS Bundle Found', jsFiles.join(', '));

const bundleContent = fs.readFileSync(path.join(distAssetsDir, jsFiles[0]), 'utf8');
assert(
  bundleContent.includes(expectedProdUrl),
  'Production Bundle Uses Railway Backend URL',
  `Found Railway URL in ${jsFiles[0]}`
);

// 3. Localhost Removed from Production
console.log('\n--- 3. Localhost Removed from Production ---');
const hasLocalhost8080 = bundleContent.includes('localhost:8080') || bundleContent.includes(':8080');
assert(!hasLocalhost8080, 'No Localhost:8080 in Production Bundle', 'Clean separation verified');

// 4. Vercel Configuration & Build
console.log('\n--- 4. Vercel Configuration & Build ---');
const vercelJsonPath = path.join(customerDir, 'vercel.json');
assert(fs.existsSync(vercelJsonPath), 'vercel.json exists for SPA client routing');
if (fs.existsSync(vercelJsonPath)) {
  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  assert(
    Array.isArray(vercelConfig.rewrites) && vercelConfig.rewrites.some(r => r.destination === '/index.html'),
    'vercel.json Rewrites to /index.html',
    'Ensures React Router routes do not 404 on refresh'
  );
}

const distIndexPath = path.join(customerDir, 'dist', 'index.html');
assert(fs.existsSync(distIndexPath), 'dist/index.html Generated Cleanly');

// 5. No Secrets in Frontend
console.log('\n--- 5. Security & Secrets Check ---');
const sensitiveKeywords = ['RAZORPAY_KEY_SECRET', 'JWT_SECRET', 'DB_PASSWORD', 'rzp_test_secret'];
const leakedKeywords = sensitiveKeywords.filter(k => bundleContent.includes(k));
assert(leakedKeywords.length === 0, 'No Secrets Leaked in Frontend Bundle', leakedKeywords.length ? `Leaked: ${leakedKeywords.join(', ')}` : 'Zero secrets detected');

// 6. Verify Customer API Service Mappings
console.log('\n--- 6. API Service Architecture Verification ---');
const apiJsContent = fs.readFileSync(path.join(customerDir, 'src', 'services', 'api.js'), 'utf8');

// Check that RAW_API_BASE_URL reads from import.meta.env.VITE_API_BASE_URL
assert(
  apiJsContent.includes('import.meta.env.VITE_API_BASE_URL'),
  'api.js Reads VITE_API_BASE_URL from Vite environment'
);

// Customer Auth API
const authEndpoints = ['/api/auth/send-otp', '/api/auth/verify-otp', '/api/auth/me'];
const allAuthPresent = authEndpoints.every(ep => apiJsContent.includes(ep));
assert(allAuthPresent, 'Customer Auth API Uses Centralized Service', authEndpoints.join(', '));

// Product & Category APIs
const catalogEndpoints = ['/api/products', '/api/products/search', '/api/categories'];
const allCatalogPresent = catalogEndpoints.every(ep => apiJsContent.includes(ep));
assert(allCatalogPresent, 'Product & Category APIs Use Centralized Service', catalogEndpoints.join(', '));

// Order & Checkout & Payment APIs
const orderEndpoints = ['/api/orders', '/api/orders/my-orders', '/api/addresses', '/api/payments/create-order', '/api/payments/verify'];
const allOrderPresent = orderEndpoints.every(ep => apiJsContent.includes(ep));
assert(allOrderPresent, 'Order, Checkout & Payment APIs Use Centralized Service', orderEndpoints.join(', '));

console.log('\n================================================================');
console.log(`TOTAL CHECKS: ${passCount + failCount}, PASSED: ${passCount}, FAILED: ${failCount}`);
if (failCount === 0) {
  console.log('FINAL READINESS STATUS: CUSTOMER VERCEL READY');
} else {
  console.log('FINAL READINESS STATUS: FAILED');
}
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
