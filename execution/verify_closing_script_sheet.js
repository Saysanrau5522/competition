require('dotenv').config();
const fs = require('fs');
const { google } = require('googleapis');
const { appendLeadToGoogleSheet, fetchAllLeads } = require('./sheets_crm.js');

async function testClosingScriptSave() {
  console.log('🧪 Testing AI Closing Script Save to Google Sheets Column Q...');

  const testLead = {
    companyName: 'Bina Jaya Logistics Sdn Bhd',
    contactName: 'Tan Sri Lim',
    contactPhone: '+6012-3334455',
    contactEmail: 'tslim@binajaya.com.my',
    industry: 'Logistics and Supply Chain',
    teamSize: '25',
    maturityScore: 48,
    maturityTier: 'Digital Practitioner',
    aiGrade: 'Grade B (Ready for Copilots)',
    topPainPoint: 'Manual driver dispatch and paper delivery orders',
    recommendedPackage: 'Exabytes Cloud Dispatch and Cyber Protect',
    annualRoiMYR: 'RM 42,000',
    preferredSlot: 'Tomorrow 10:00 AM',
    status: 'New',
    salesCheatSheet: {
      closingCheatSheet: {
        bullet1_Hook: 'Acknowledge context: "Hi Tan Sri Lim, I reviewed your diagnostic for Bina Jaya Logistics. Noticed your team spends 18 hrs/week on paper delivery orders."',
        bullet2_Prescription: 'Phase 1 Quick Win: "Deploy Exabytes Cloud Dispatch to digitize driver tracking in under 5 days."',
        bullet3_FinancialMath: 'Close with hard numbers: "Reclaiming 18 hours weekly saves RM 42,000 annually with full ROI in under 3 weeks."'
      }
    }
  };

  const appendRes = await appendLeadToGoogleSheet(testLead);
  console.log('Append Result:', appendRes);

  // Read back directly from Google Sheets
  const creds = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
  const auth = new google.auth.JWT(creds.client_email, null, creds.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
  const sheets = google.sheets({ version: 'v4', auth });
  const sheetRes = await sheets.spreadsheets.values.get({
    spreadsheetId: '1fcWlDa-5X3bSU6mPsw475yFnzjx2SgNPTs1fURfYa7k',
    range: 'A:R'
  });

  const rows = sheetRes.data.values;
  const headerColQ = rows[0][16];
  const lastRow = rows[rows.length - 1];

  console.log('\n========================================');
  console.log(`Column Q Header: "${headerColQ}"`);
  console.log(`Row ${rows.length} Lead: ${lastRow[0]} (${lastRow[2]})`);
  console.log('Column Q Content:\n' + lastRow[16]);
  console.log('========================================');

  if (lastRow[16] && lastRow[16].includes('1) Hook:') && lastRow[16].includes('2) Prescription:') && lastRow[16].includes('3) Math:')) {
    console.log('✅ SUCCESS: AI Closing Script is properly formatted and saved into Google Sheet Column Q!');
  } else {
    console.error('❌ FAILURE: Column Q does not contain the expected closing script!');
    process.exit(1);
  }

  // Also test reading leads back via fetchAllLeads
  console.log('\nTesting CRM parse via fetchAllLeads()...');
  const crmResult = await fetchAllLeads();
  const crmLead = crmResult.leads.find(l => l.companyName === 'Bina Jaya Logistics Sdn Bhd');
  if (crmLead && crmLead.salesCheatSheet) {
    console.log('Parsed Hook:', crmLead.salesCheatSheet.hook);
    console.log('Parsed Prescription:', crmLead.salesCheatSheet.prescription);
    console.log('Parsed Math:', crmLead.salesCheatSheet.financialMath);
    console.log('✅ SUCCESS: CRM correctly parsed all 3 sections of the AI closing script!');
  } else {
    console.warn('Notice: crmLead not found or salesCheatSheet missing');
  }
}

testClosingScriptSave().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
