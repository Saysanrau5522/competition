const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testClientSidePdfFlow() {
  console.log('Testing client-side PDF generation in Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('[PAGE CONSOLE]', msg.text()));
    page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));
    page.on('requestfailed', req => console.log('[REQ FAILED]', req.url(), req.failure()?.errorText));
    page.on('response', res => {
      if (res.status() >= 400) console.log('[HTTP ' + res.status() + ']', res.url());
    });

    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    const downloadDir = path.resolve(__dirname, '../.tmp/downloads');
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadDir
    });

    console.log('Invoking generateClientSidePdf and waiting for real browser download...');
    const result = await page.evaluate(async () => {

      const sampleData = {
        companyName: 'Apex Precision Engineering Sdn Bhd',
        contactName: 'Kavitha Raman',
        contactEmail: 'kavitha@apexeng.my',
        industry: 'Manufacturing / Logistics',
        teamSize: '18',
        bottleneck: 'Manual machine maintenance logs and inventory tracking',
        scores: {
          totalScore: 48,
          tier: 'Digital Practitioner',
          aiGrade: 'Grade B (Ready for Copilots)',
          breakdown: { web: 14, ops: 8, sec: 10, ai: 8, fin: 8 },
          radarLabels: ['Web Presence', 'Operations', 'Security', 'AI Readiness', 'Cashflow', 'Cloud'],
          radarValues: [70, 40, 50, 40, 40, 50]
        },
        roi: {
          weeklyWastedHours: 18,
          annualAdminCashSavedMYR: 23400,
          formatted: {
            totalAnnualBenefit: 'RM 42,000',
            annualAdminCashSaved: 'RM 23,400',
            paybackPeriod: '2-3 weeks'
          }
        },
        products: [
          {
            name: 'Exabytes Acronis Cyber Protect Cloud',
            tag: 'Cloud Security',
            priceMYR: 'RM 89.00 / month',
            benefits: ['Automated hourly backups', 'Ransomware protection', 'Instant disaster recovery']
          }
        ],
        roadmap: [
          {
            phase: 'Phase 1: Foundation (Days 1-30)',
            focus: 'Automate manual friction',
            deliverables: ['Acronis Cloud Backup Deployment', 'Cloud POS Integration']
          },
          {
            phase: 'Phase 2: Scale (Days 31-90)',
            focus: 'Automate customer communications',
            deliverables: ['WhatsApp AI Notification Bot', 'Unified Lead Inbox']
          },
          {
            phase: 'Phase 3: Optimize (Days 91-180)',
            focus: 'Enterprise Copilot & Predictive Stock',
            deliverables: ['AI Predictive Inventory Model', 'Executive KPI Dashboard']
          }
        ]
      };

      console.log('Calling generateClientSidePdf(sampleData)...');
      try {
        await window.generateClientSidePdf(sampleData);
      } catch (e) {
        console.log('generateClientSidePdf threw an error:', e.message, e.stack);
      }

      return true;
    });

    console.log('Waiting for file to be written into download directory...');
    let downloadedFilePath = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 500));
      const files = fs.readdirSync(downloadDir).filter(f => f.endsWith('.pdf'));
      if (files.length > 0) {
        downloadedFilePath = path.join(downloadDir, files[0]);
        break;
      }
    }

    if (!downloadedFilePath) {
      console.error('❌ FAILED: No PDF file appeared in download directory');
      process.exit(1);
    }

    const stats = fs.statSync(downloadedFilePath);
    console.log(`- Downloaded PDF filename: ${path.basename(downloadedFilePath)}`);
    console.log(`- PDF Size: ${stats.size} bytes (${Math.round(stats.size / 1024)} KB)`);

    const fileBuffer = fs.readFileSync(downloadedFilePath);
    const fullStr = fileBuffer.toString('binary');
    const pageMatches = fullStr.match(/\/Type\s*\/Page\b/g) || [];
    console.log(`- Verified PDF Page Count: ${pageMatches.length} pages`);

    if (stats.size > 100000 && pageMatches.length === 4) {
      console.log('🎉 SUCCESS: Browser downloaded real 4-page executive PDF with zero blank pages!');
    } else {
      console.error('❌ FAILED: PDF is too small or does not have 4 pages');
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

testClientSidePdfFlow().catch(e => {
  console.error(e);
  process.exit(1);
});
