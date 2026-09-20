const puppeteer = require('puppeteer');

(async () => {
  console.log('Testing End-to-End Delete via Browser UI...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto('http://localhost:3000/internal/dashboard.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // Get count of lead cards
    let leadCards = await page.$$('.lead-card');
    console.log('Initial lead cards on page:', leadCards.length);

    // Find first delete button
    const deleteBtn = await page.$('.btn-delete-lead');
    if (!deleteBtn) {
      console.error('No delete button found!');
      return;
    }

    // Click Remove button on the first card
    console.log('Clicking Remove button on card...');
    await deleteBtn.click();
    await new Promise(r => setTimeout(r, 500));

    // Capture screenshot of confirmation modal
    await page.screenshot({ path: 'C:/Users/divye/.gemini/antigravity-ide/brain/7bdf7eed-448b-417a-b737-3d962619cb58/crm_delete_confirmation_active.png' });
    console.log('Saved crm_delete_confirmation_active.png');

    // Click confirm delete button
    console.log('Confirming deletion...');
    const confirmBtn = await page.$('#btnConfirmDelete');
    await confirmBtn.click();

    // Wait for network request to finish and toast to appear
    await new Promise(r => setTimeout(r, 2000));

    // Capture screenshot after deletion showing toast notification
    await page.screenshot({ path: 'C:/Users/divye/.gemini/antigravity-ide/brain/7bdf7eed-448b-417a-b737-3d962619cb58/crm_after_delete_toast.png' });
    console.log('Saved crm_after_delete_toast.png');

    leadCards = await page.$$('.lead-card');
    console.log('Lead cards after deletion:', leadCards.length);
    console.log('Browser E2E test successful!');
  } finally {
    await browser.close();
  }
})();
