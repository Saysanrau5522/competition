const puppeteer = require('puppeteer');
const path = require('path');

async function capture() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Wait for animations and fonts
    await new Promise(r => setTimeout(r, 600));

    // Fill Step 1 and proceed to Step 2
    await page.type('#companyName', 'Apex Engineering Sdn Bhd');
    await page.select('#industrySector', 'manufacturing_logistics');
    await page.click('#btnStep1Next');
    await new Promise(r => setTimeout(r, 600));

    const artifactPath2 = 'C:/Users/divye/.gemini/antigravity-ide/brain/7bdf7eed-448b-417a-b737-3d962619cb58/new_ui_step2.png';
    await page.screenshot({ path: artifactPath2, fullPage: false });
    console.log('Saved Step 2 screenshot to:', artifactPath2);

    // Proceed to Step 3 then Step 4
    await page.click('#btnStep2Next');
    await new Promise(r => setTimeout(r, 600));
    await page.click('#btnStep3Next');
    await page.waitForSelector('.dynamic-option-card', { visible: true, timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    const artifactPath4 = 'C:/Users/divye/.gemini/antigravity-ide/brain/7bdf7eed-448b-417a-b737-3d962619cb58/new_ui_step4.png';
    await page.screenshot({ path: artifactPath4, fullPage: false });
    console.log('Saved Step 4 screenshot to:', artifactPath4);
  } finally {
    await browser.close();
  }
}

capture().catch(console.error);
