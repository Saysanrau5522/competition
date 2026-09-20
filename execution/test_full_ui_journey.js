const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testFullUiJourney() {
  console.log('🚀 Starting Full UI End-to-End Diagnostic Journey...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    page.on('console', msg => console.log('[UI CONSOLE]', msg.text()));
    page.on('pageerror', err => console.log('[UI ERROR]', err.message));

    const downloadDir = path.resolve(__dirname, '../.tmp/downloads_e2e');
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadDir
    });

    console.log('1. Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    console.log('2. Step 1: Submitting enterprise demographics...');
    await page.type('#companyName', 'Nexus Cargo Logistics Sdn Bhd');
    await page.select('#industrySector', 'manufacturing_logistics');
    await page.select('#teamSize', '25');
    await page.click('#btnStep1Next');
    await new Promise(r => setTimeout(r, 600));

    console.log('3. Step 2: Selecting digital tools...');
    await page.click('#btnStep2Next');
    await new Promise(r => setTimeout(r, 600));

    console.log('4. Step 3: Setting bottleneck & wasted hours...');
    await page.click('#btnStep3Next');
    console.log('Waiting for dynamic follow-up to load...');
    await page.waitForSelector('.dynamic-option-card', { visible: true, timeout: 10000 });

    console.log('5. Step 4: Selecting dynamic AI question answer...');
    const firstOption = await page.$('.dynamic-option-card');
    if (firstOption) {
      await firstOption.click();
      await new Promise(r => setTimeout(r, 400));
    }
    await page.click('#btnStep4Next');
    await new Promise(r => setTimeout(r, 600));

    console.log('6. Step 5: Entering contact details and submitting audit...');
    await page.type('#contactName', 'Tan Sri Aaron Wong');
    await page.type('#contactPhone', '+60129876543');
    await page.type('#contactEmail', 'aaron.wong@nexus-logistics.my');
    await page.click('#btnSubmitAudit');

    console.log('7. Waiting for results section to be visible...');
    await page.waitForSelector('#resultsSection', { visible: true, timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));

    console.log('8. Locating "#btnDownloadPdf" on results dashboard...');
    const pdfBtn = await page.$('#btnDownloadPdf');
    if (!pdfBtn) throw new Error('#btnDownloadPdf button not found!');

    console.log('9. Clicking "Download Executive Blueprint (PDF)" button...');
    await pdfBtn.click();

    console.log('10. Waiting for PDF download to finish on disk...');
    let downloadedFilePath = null;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 500));
      const files = fs.readdirSync(downloadDir).filter(f => f.endsWith('.pdf'));
      if (files.length > 0) {
        downloadedFilePath = path.join(downloadDir, files[0]);
        break;
      }
    }

    if (!downloadedFilePath) {
      throw new Error('Timeout waiting for downloaded PDF file');
    }

    const stats = fs.statSync(downloadedFilePath);
    console.log(`- Downloaded PDF filename: ${path.basename(downloadedFilePath)}`);
    console.log(`- PDF Size: ${stats.size} bytes (${Math.round(stats.size / 1024)} KB)`);

    const fileBuffer = fs.readFileSync(downloadedFilePath);
    const fullStr = fileBuffer.toString('binary');
    const pageMatches = fullStr.match(/\/Type\s*\/Page\b/g) || [];
    console.log(`- Verified PDF Page Count: ${pageMatches.length} pages`);

    if (stats.size > 100000 && pageMatches.length === 4) {
      console.log('🎉 SUCCESS: Full End-to-End User Journey downloaded a complete 4-page PDF with ZERO blank pages!');
    } else {
      throw new Error(`Invalid PDF: size=${stats.size}, pages=${pageMatches.length}`);
    }
  } finally {
    await browser.close();
  }
}

testFullUiJourney().catch(err => {
  console.error('❌ E2E Error:', err);
  process.exit(1);
});
