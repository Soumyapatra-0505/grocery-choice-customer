import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const TEST_PORT = 5196;
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
      resolve(server);
    });
  });
}

async function diagnose() {
  const server = await startTestServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  for (const width of [320, 360]) {
    console.log(`\n================== DIAGNOSING ${width}px ==================`);
    await page.setViewport({ width, height: 800 });

    // Test Homepage
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    const hpDiag = await page.evaluate((w) => {
      const culprits = [];
      document.querySelectorAll('*').forEach((el) => {
        // If element causes root document scrollWidth to increase:
        // That means el is not inside an overflow: hidden / auto container, and its rect.right > w
        let p = el.parentElement;
        let isContained = false;
        while (p && p !== document.body && p !== document.documentElement) {
          const s = window.getComputedStyle(p);
          if (s.overflowX === 'hidden' || s.overflowX === 'auto' || s.overflowX === 'scroll' || s.overflow === 'hidden') {
            isContained = true;
            break;
          }
          p = p.parentElement;
        }

        const rect = el.getBoundingClientRect();
        if (!isContained && (rect.right > w + 0.5 || rect.width > w + 0.5)) {
          culprits.push({
            tag: el.tagName.toLowerCase(),
            class: typeof el.className === 'string' ? el.className : '',
            id: el.id,
            width: Math.round(rect.width),
            right: Math.round(rect.right),
            left: Math.round(rect.left),
            text: el.innerText ? el.innerText.slice(0, 30).replace(/\n/g, ' ') : ''
          });
        }
      });
      return {
        docScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        winWidth: w,
        culprits: culprits.slice(0, 10)
      };
    }, width);

    console.log(`Homepage at ${width}px: scrollWidth = ${hpDiag.docScrollWidth}px (winWidth = ${hpDiag.winWidth}px)`);
    console.log('Uncontained culprits causing overflow:');
    console.log(JSON.stringify(hpDiag.culprits, null, 2));

    // Test Cart
    await page.evaluate(() => {
      localStorage.setItem('grocery_choice_cart', JSON.stringify([
        {
          id: 1,
          name: 'Fresh Organic Robusta Bananas',
          sellingPrice: 48,
          mrp: 65,
          unit: 'KG',
          quantity: 2,
          imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
          stockQuantity: 42
        }
      ]));
    });
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle2' });
    const cartDiag = await page.evaluate((w) => {
      const culprits = [];
      document.querySelectorAll('*').forEach((el) => {
        let p = el.parentElement;
        let isContained = false;
        while (p && p !== document.body && p !== document.documentElement) {
          const s = window.getComputedStyle(p);
          if (s.overflowX === 'hidden' || s.overflowX === 'auto' || s.overflowX === 'scroll' || s.overflow === 'hidden') {
            isContained = true;
            break;
          }
          p = p.parentElement;
        }

        const rect = el.getBoundingClientRect();
        if (!isContained && (rect.right > w + 0.5 || rect.width > w + 0.5)) {
          culprits.push({
            tag: el.tagName.toLowerCase(),
            class: typeof el.className === 'string' ? el.className : '',
            id: el.id,
            width: Math.round(rect.width),
            right: Math.round(rect.right),
            left: Math.round(rect.left),
            text: el.innerText ? el.innerText.slice(0, 30).replace(/\n/g, ' ') : ''
          });
        }
      });
      return {
        docScrollWidth: document.documentElement.scrollWidth,
        culprits: culprits.slice(0, 10)
      };
    }, width);

    console.log(`Cart at ${width}px: scrollWidth = ${cartDiag.docScrollWidth}px`);
    console.log('Cart culprits:');
    console.log(JSON.stringify(cartDiag.culprits, null, 2));
  }

  await browser.close();
  server.close();
}

diagnose();
