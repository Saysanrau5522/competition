const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testClientPdf() {
  console.log('🚀 Starting Puppeteer browser to verify Client-Side PDF Generation...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    console.log('1. Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Ensure html2canvas and jspdf are loaded
    console.log('2. Verifying libraries loaded in browser context...');
    const libCheck = await page.evaluate(() => {
      return {
        hasHtml2Canvas: typeof window.html2canvas === 'function',
        hasJsPdf: typeof (window.jspdf && window.jspdf.jsPDF) === 'function' || typeof window.jsPDF === 'function',
        hasHtml2Pdf: typeof window.html2pdf === 'function'
      };
    });
    console.log('Libraries in page:', libCheck);

    // Simulate diagnostic evaluation data
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

    page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.text()));
    page.on('pageerror', err => console.log('[BROWSER ERROR]', err.message));

    console.log('3. Executing high-fidelity client-side PDF generation in browser...');
    const pdfBase64 = await page.evaluate(async (data) => {
      console.log('Fetching /api/diagnostic/html-report...');
      const response = await fetch('/api/diagnostic/html-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const html = await response.text();
      console.log('Fetched HTML length:', html.length);

      // Create isolated iframe
      const iframe = document.createElement('iframe');
      iframe.id = 'testPdfIframe';
      iframe.style.cssText = 'position: fixed; top: 0; left: 0; width: 794px; height: 1123px; border: 0; z-index: 99999; background: #ffffff;';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      console.log('Waiting for iframe to render...');
      await new Promise(r => setTimeout(r, 600));

      const screenBar = iframeDoc.querySelector('.screen-bar');
      if (screenBar) screenBar.style.display = 'none';

      const pages = Array.from(iframeDoc.querySelectorAll('.page'));
      console.log('Pages found in iframeDoc:', pages.length);

      const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
      const h2c = window.html2canvas;
      console.log('jsPDFClass:', typeof jsPDFClass, 'h2c:', typeof h2c);

      const pdf = new jsPDFClass({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i];
        pageEl.style.margin = '0';
        pageEl.style.boxShadow = 'none';
        console.log(`Rendering page ${i + 1}/${pages.length}... clientHeight=${pageEl.clientHeight}, offsetHeight=${pageEl.offsetHeight}`);

        try {
          const canvas = await h2c(pageEl, {
            scale: 1.5,
            useCORS: true,
            logging: true,
            backgroundColor: '#ffffff',
            width: 794,
            windowWidth: 794,
            scrollY: 0,
            scrollX: 0
          });

          console.log(`Page ${i + 1} canvas generated: ${canvas.width}x${canvas.height}`);
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          console.log(`Page ${i + 1} imgData length: ${imgData.length}`);

          if (i > 0) pdf.addPage('a4', 'portrait');
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        } catch (renderErr) {
          console.error(`Page ${i + 1} render error:`, renderErr.message);
        }
      }

      iframe.remove();
      return pdf.output('datauristring');
    }, sampleData);

    console.log('4. Analyzing generated PDF...');
    const base64Data = pdfBase64.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const outPath = path.join(__dirname, 'test_client_generated.pdf');
    fs.writeFileSync(outPath, buffer);

    console.log(`- PDF Size: ${buffer.length} bytes (${Math.round(buffer.length / 1024)} KB)`);

    // Basic PDF header verification
    const pdfStr = buffer.toString('utf-8', 0, 100);
    console.log('- Header check:', pdfStr.slice(0, 15));

    // Check page count by counting /Type /Page in PDF binary
    const fullStr = buffer.toString('binary');
    const pageMatches = fullStr.match(/\/Type\s*\/Page\b/g) || [];
    console.log('- Verified PDF Page Count:', pageMatches.length);

    if (buffer.length > 50000 && pageMatches.length === 4) {
      console.log('🎉 SUCCESS: Client-Side PDF generation produces a complete, non-blank 4-page PDF!');
    } else {
      console.error('❌ FAILED: PDF is too small or does not have 4 pages');
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

testClientPdf().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
