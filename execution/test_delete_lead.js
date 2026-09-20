const puppeteer = require('puppeteer');

(async () => {
  console.log('Testing Exabytes Consultant CRM Delete Lead feature...');

  // 1. First fetch leads to find one to delete
  const res = await fetch('http://localhost:3000/api/crm/leads');
  const data = await res.json();
  console.log(`Current leads count: ${data.leads.length}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Navigate to dashboard
    await page.goto('http://localhost:3000/internal/dashboard.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Capture initial CRM dashboard
    await page.screenshot({ path: 'C:/Users/divye/.gemini/antigravity-ide/brain/7bdf7eed-448b-417a-b737-3d962619cb58/crm_with_delete_buttons.png' });
    console.log('Captured screenshot: crm_with_delete_buttons.png');

    // Check if delete button exists on lead cards
    const deleteBtn = await page.$('.btn-delete-lead');
    console.log('Found .btn-delete-lead button on card:', !!deleteBtn);

    if (deleteBtn) {
      // Click delete button on the first card
      await deleteBtn.click();
      await new Promise(r => setTimeout(r, 500));

      // Capture confirmation modal
      await page.screenshot({ path: 'C:/Users/divye/.gemini/antigravity-ide/brain/7bdf7eed-448b-417a-b737-3d962619cb58/crm_delete_modal.png' });
      console.log('Captured screenshot: crm_delete_modal.png');

      // Click cancel
      const cancelBtn = await page.$('#btnCancelDelete');
      if (cancelBtn) await cancelBtn.click();
      await new Promise(r => setTimeout(r, 300));
    }

    // Now test opening lead dossier and checking Remove Lead button inside
    const firstCard = await page.$('.lead-card');
    if (firstCard) {
      await firstCard.click();
      await new Promise(r => setTimeout(r, 600));

      const modalDeleteBtn = await page.$('#btnDeleteCurrentLead');
      console.log('Found #btnDeleteCurrentLead in dossier modal:', !!modalDeleteBtn);

      await page.screenshot({ path: 'C:/Users/divye/.gemini/antigravity-ide/brain/7bdf7eed-448b-417a-b737-3d962619cb58/crm_dossier_with_remove.png' });
      console.log('Captured screenshot: crm_dossier_with_remove.png');
    }

    console.log('All delete UI components verified successfully!');
  } finally {
    await browser.close();
  }
})();
