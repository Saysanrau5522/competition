const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = path.join('C:', 'Users', 'divye', '.gemini', 'antigravity-ide', 'brain', '7bdf7eed-448b-417a-b737-3d962619cb58');

async function verify() {
  console.log('🚀 Starting Puppeteer UI verification...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // 1. Verify CRM Dashboard Calendar
    console.log('📅 Navigating to CRM Dashboard...');
    await page.goto('http://localhost:3000/internal/dashboard.html', { waitUntil: 'networkidle0' });

    console.log('🖱️ Clicking Calendar Schedule Tab...');
    await page.click('#tabViewCalendar');
    await new Promise(r => setTimeout(r, 1000));

    // Check if has-events cells exist
    const hasEventsCount = await page.$$eval('.mini-cal-day-cell.has-events', els => els.length);
    console.log(`✨ Found ${hasEventsCount} booked day cell(s) in CRM mini-calendar with .has-events!`);

    const crmShotPath = path.join(ARTIFACTS_DIR, 'crm_calendar_view.png');
    await page.screenshot({ path: crmShotPath, fullPage: false });
    console.log(`📸 Saved CRM screenshot to: ${crmShotPath}`);

    // 2. Verify Client Portal Consultation Modal
    console.log('🌐 Navigating to Client Portal...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Fill form
    await page.type('#companyName', 'Penang Artisan Bakery Sdn Bhd');
    await page.select('#industry', 'Retail & E-Commerce');
    await page.select('#teamSize', '5 - 15');
    await page.select('#annualRevenue', 'RM 50,000 - RM 150,000');
    await page.type('#contactName', 'Lim Wei');
    await page.type('#contactEmail', 'lim@penangartisan.my');
    await page.type('#contactPhone', '+6012-3456789');

    // Step 1 -> 2
    await page.click('#btnNext1');
    await new Promise(r => setTimeout(r, 500));

    // Step 2 answers
    await page.click('input[name="q_cloud"][value="3"]');
    await page.click('input[name="q_cyber"][value="2"]');
    await page.click('#btnNext2');
    await new Promise(r => setTimeout(r, 500));

    // Step 3 answers
    await page.click('input[name="q_bottleneck"][value="operations"]');
    await page.click('input[name="q_goals"][value="ai_automate"]');
    await page.click('#btnSubmitAudit');

    console.log('⏳ Waiting for AI Blueprint generation...');
    await page.waitForSelector('#viewAuditResult:not(.d-none)', { timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // Click open consultation modal
    console.log('🖱️ Opening Consultation Modal...');
    await page.click('#btnOpenConsultModal');
    await new Promise(r => setTimeout(r, 1000));

    const modalBookedDaysCount = await page.$$eval('.booking-day-cell.has-bookings', els => els.length);
    const slotsCount = await page.$$eval('.slot-option-card', els => els.length);
    console.log(`✨ Found ${modalBookedDaysCount} booked day cell(s) in Client Booking Calendar!`);
    console.log(`✨ Found ${slotsCount} time slot cards in right column!`);

    const clientShotPath = path.join(ARTIFACTS_DIR, 'client_consultation_calendar.png');
    await page.screenshot({ path: clientShotPath, fullPage: false });
    console.log(`📸 Saved Client Consultation Modal screenshot to: ${clientShotPath}`);

    console.log('✅ UI verification passed successfully!');
  } finally {
    await browser.close();
  }
}

verify().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
