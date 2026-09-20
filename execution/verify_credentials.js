/**
 * Layer 3: Environment & Credentials Verification Tool
 * Tests connection to Google Gemini API and Google Sheets API
 * Run via: npm run verify-env
 */

require('dotenv').config();
const { google } = require('googleapis');

async function testGeminiApi() {
  console.log('\n[1/2] 🤖 Testing Google Gemini API Connection...');
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('⚠️  GEMINI_API_KEY is not configured in .env.');
    console.log('   -> System will use deterministic SOP rules from directives/diagnostic_sop.md');
    return { ok: false, mode: 'fallback' };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with exactly the single word: "READY"' }] }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      console.log(`✅ Gemini API connected successfully! (Response: "${reply}")`);
      return { ok: true, mode: 'live' };
    } else {
      const errText = await response.text();
      console.log(`❌ Gemini API rejected request (HTTP ${response.status}):`, errText);
      console.log('   -> Check your GEMINI_API_KEY at https://aistudio.google.com/');
      return { ok: false, error: errText };
    }
  } catch (err) {
    console.log('❌ Error connecting to Gemini API:', err.message);
    return { ok: false, error: err.message };
  }
}

async function testGoogleSheetsApi() {
  console.log('\n[2/2] 📊 Testing Google Sheets API Connection...');
  const sheetId = process.env.GOOGLE_SHEET_ID;
  let clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  const fs = require('fs');
  const path = require('path');
  const credPath = path.join(__dirname, '..', 'credentials.json');
  if (fs.existsSync(credPath)) {
    try {
      const creds = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
      if (creds.client_email && creds.private_key) {
        clientEmail = creds.client_email;
        privateKey = creds.private_key;
        console.log('   (Loaded Service Account credentials from credentials.json)');
      }
    } catch (e) {}
  }

  if (!sheetId || !clientEmail || !privateKey) {
    console.log('⚠️  Google Sheets variables are incomplete in .env.');
    console.log('   -> Leads will be stored in resilient local cache (.tmp/crm_leads.json)');
    return { ok: false, mode: 'fallback' };
  }

  // Handle JSON-stringified quotes or escaped newlines
  if (typeof privateKey === 'string') {
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      try {
        privateKey = JSON.parse(privateKey);
      } catch (e) {
        privateKey = privateKey.slice(1, -1);
      }
    }
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    console.log('⚠️  GOOGLE_PRIVATE_KEY does not appear to be a PEM formatted private key.');
    return { ok: false, formatError: true };
  }

  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });

    console.log(`✅ Google Sheets API connected successfully!`);
    console.log(`   Spreadsheet Title: "${meta.data.properties?.title}"`);
    console.log(`   Sheets Found: ${meta.data.sheets?.map(s => s.properties?.title).join(', ')}`);
    return { ok: true, title: meta.data.properties?.title };
  } catch (err) {
    console.log('❌ Google Sheets API connection failed:', err.message);
    if (err.message.includes('permission') || err.message.includes('The caller does not have permission')) {
      console.log('   💡 TIP: Make sure you shared your Google Sheet with the Service Account email:');
      console.log(`   👉 ${clientEmail} (as Editor)`);
    }
    return { ok: false, error: err.message };
  }
}

async function main() {
  console.log('====================================================');
  console.log('🔍 Validating Production API Integrations');
  console.log('====================================================');

  const gemini = await testGeminiApi();
  const sheets = await testGoogleSheetsApi();

  console.log('\n====================================================');
  console.log('📋 Summary of System Readiness:');
  console.log(`- AI Engine:   ${gemini.ok ? '🟢 LIVE (Google Gemini 3.6 Flash)' : '🟡 RESILIENT FALLBACK (Deterministic SOP)'}`);
  console.log(`- CRM Engine:  ${sheets.ok ? '🟢 LIVE (Google Sheets Cloud)' : '🟡 RESILIENT FALLBACK (Local Storage .tmp/crm_leads.json)'}`);
  console.log('====================================================\n');
}

main();
