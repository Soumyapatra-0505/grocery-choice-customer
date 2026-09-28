import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true });
const page = await browser.newPage();

const viewports = [
  { name: '1920px', width: 1920, height: 1080 },
  { name: '1440px', width: 1440, height: 900 },
  { name: '1024px', width: 1024, height: 768 },
  { name: '768px', width: 768, height: 1024 },
  { name: '430px', width: 430, height: 932 },
  { name: '390px', width: 390, height: 844 },
  { name: '375px', width: 375, height: 667 },
];

await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
await page.evaluate(() => {
  localStorage.setItem('grocery_choice_token', 'test');
  localStorage.setItem('grocery_choice_user', JSON.stringify({
    id: 101,
    fullName: 'Soumya Ranjan Patra',
    email: 'soumya.patra@example.com',
    phone: '+91 98765 43210',
    role: 'ROLE_CUSTOMER',
    gender: 'Male',
    dateOfBirth: '2001-08-15',
    isLoggedIn: true
  }));
});

for (const vp of viewports) {
  await page.setViewport({ width: vp.width, height: vp.height });
  await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: `test-screenshots/profile_${vp.name}.png`, fullPage: false });
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth ||
           document.body.scrollWidth > window.innerWidth;
  });
  console.log(`Viewport ${vp.name}: screenshot saved, horizontal overflow = ${overflow}`);
}

await browser.close();
console.log('All viewports captured successfully.');
