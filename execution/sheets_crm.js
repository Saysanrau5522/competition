/**
 * Layer 3: Two-Way Google Sheets CRM Sync & Resilient Local Storage
 * Reads & Writes leads directly to Google Sheets with automatic header initialization
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TMP_DIR = path.join(__dirname, '..', '.tmp');
const LOCAL_LEADS_FILE = path.join(TMP_DIR, 'crm_leads.json');

// Ensure .tmp directory exists
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Ensure local leads file exists with seed data
function initLocalLeads() {
  if (!fs.existsSync(LOCAL_LEADS_FILE)) {
    const seedLeads = [
      {
        id: 'LEAD-101',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        companyName: 'Nusantara Retail Supply Sdn Bhd',
        contactName: 'Ahmad Faiz',
        contactEmail: 'faiz@nusantararetail.com.my',
        contactPhone: '+6012-9876543',
        industry: 'Retail / E-Commerce',
        teamSize: '8',
        maturityScore: 34,
        maturityTier: 'Digital Novice',
        aiGrade: 'C (Developing)',
        topPainPoint: 'Manual WhatsApp order fulfillment & stockouts',
        recommendedPackage: 'Exabytes AI Website Builder & Managed WordPress',
        annualRoiMYR: 'RM 18,200',
        status: 'New',
        salesCheatSheet: {
          hook: 'Acknowledge context: "Hi Ahmad Faiz, saw Nusantara Retail is spending ~14 hrs/week typing WhatsApp receipts manually."',
          prescription: 'Phase 1 Quick Win: "Deploy Exabytes AI Website Builder with instant FPX payments to automate order capturing."',
          financialMath: 'Reclaiming those hours recovers ~RM 12,740 in direct admin labor each year.'
        }
      },
      {
        id: 'LEAD-102',
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        companyName: 'Apex Precision Engineering',
        contactName: 'Kavitha Raman',
        contactEmail: 'kavitha@apexeng.my',
        contactPhone: '+6017-2345678',
        industry: 'Manufacturing / Logistics',
        teamSize: '18',
        maturityScore: 48,
        maturityTier: 'Digital Practitioner',
        aiGrade: 'B (Ready for Copilots)',
        topPainPoint: 'Ransomware risk & on-premise server downtime',
        recommendedPackage: 'Exabytes Acronis Cyber Protect Cloud',
        annualRoiMYR: 'RM 29,400',
        status: 'Contacted',
        salesCheatSheet: {
          hook: 'Acknowledge context: "Hi Kavitha, noted Apex Engineering has critical CAD files on local hard drives vulnerable to ransomware."',
          prescription: 'Phase 1 Quick Win: "Deploy Exabytes Acronis Cloud Backup for automated hourly disk snapshots and 1-click recovery."',
          financialMath: 'Eliminating manual backup management saves RM 18,000+ while guaranteeing 100% PDPA compliance.'
        }
      }
    ];
    fs.writeFileSync(LOCAL_LEADS_FILE, JSON.stringify(seedLeads, null, 2), 'utf-8');
  }
}

initLocalLeads();

/**
 * Validates Google Sheets credentials
 */
function getGoogleAuthClient() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  let clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  // Check if credentials.json exists in root
  const credPath = path.join(__dirname, '..', 'credentials.json');
  if (fs.existsSync(credPath)) {
    try {
      const creds = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
      if (creds.client_email && creds.private_key) {
        clientEmail = creds.client_email;
        privateKey = creds.private_key;
      }
    } catch (e) {
      console.warn('Error reading credentials.json:', e.message);
    }
  }

  if (!sheetId || !clientEmail || !privateKey) {
    return null;
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
    return { error: 'GOOGLE_PRIVATE_KEY does not contain "-----BEGIN PRIVATE KEY-----".' };
  }

  try {
    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    const sheets = google.sheets({ version: 'v4', auth });
    return { sheets, sheetId };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Standard CRM columns
 */
const CRM_HEADERS = [
  'Lead ID',
  'Created Date',
  'Company Name',
  'Contact Name',
  'Phone',
  'Email',
  'Industry',
  'Team Size',
  'Maturity Score',
  'Maturity Tier',
  'AI Grade',
  'Top Bottleneck',
  'Recommended Package',
  'Annual ROI (MYR)',
  'Preferred Slot',
  'Status',
  'AI Closing Script',
  'Consultant Notes'
];

/**
 * Ensures Google Sheet has proper column headers on Row 1
 */
async function ensureGoogleSheetHeaders(sheets, sheetId) {
  try {
    const check = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A1:R1'
    });

    if (!check.data.values || check.data.values.length === 0 || check.data.values[0].length === 0) {
      // Initialize headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'A1:R1',
        valueInputOption: 'USER_ENTERED',
        resource: { values: [CRM_HEADERS] }
      });
      console.log('[Google Sheets CRM] Initialized column headers on Row 1.');
    }
  } catch (err) {
    console.warn('[Google Sheets CRM] Header check notice:', err.message);
  }
}

/**
 * Appends a lead row to Google Sheet
 */
async function appendLeadToGoogleSheet(lead) {
  const client = getGoogleAuthClient();
  if (!client || client.error) {
    return { syncedToGoogle: false, reason: client?.error || 'Google Sheets credentials not set.' };
  }

  const { sheets, sheetId } = client;

  try {
    await ensureGoogleSheetHeaders(sheets, sheetId);

    const scriptText = lead.salesCheatSheet ?
      `1) Hook: ${lead.salesCheatSheet.hook}\n2) Prescription: ${lead.salesCheatSheet.prescription}\n3) Math: ${lead.salesCheatSheet.financialMath}` :
      (lead.notes || 'N/A');

    const row = [
      lead.id || `EXA-${Date.now().toString().slice(-6)}`,
      lead.createdAt || new Date().toISOString(),
      lead.companyName || 'N/A',
      lead.contactName || 'N/A',
      lead.contactPhone || 'N/A',
      lead.contactEmail || 'N/A',
      lead.industry || 'N/A',
      lead.teamSize || 'N/A',
      lead.maturityScore || 0,
      lead.maturityTier || 'N/A',
      lead.aiGrade || 'N/A',
      lead.topPainPoint || 'N/A',
      lead.recommendedPackage || 'N/A',
      lead.annualRoiMYR || 'N/A',
      lead.preferredSlot || 'N/A',
      lead.status || 'New',
      scriptText,
      lead.notes || ''
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:R',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] }
    });

    console.log(`[Google Sheets CRM] Successfully appended lead ${lead.id} to Google Sheet!`);
    return { syncedToGoogle: true };
  } catch (err) {
    console.error('[Google Sheets CRM] Append error:', err.message);
    return { syncedToGoogle: false, error: err.message };
  }
}

/**
 * Reads leads from Google Sheets (or fallback to local cache)
 */
async function fetchAllLeads() {
  const client = getGoogleAuthClient();

  if (client && !client.error) {
    try {
      const { sheets, sheetId } = client;
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A2:R'
      });

      const rows = res.data.values;
      if (rows && rows.length > 0) {
        const cloudLeads = rows.map((r, idx) => ({
          id: r[0] || `LEAD-${idx + 100}`,
          createdAt: r[1] || new Date().toISOString(),
          companyName: r[2] || 'SME Prospect',
          contactName: r[3] || 'Owner',
          contactPhone: r[4] || '',
          contactEmail: r[5] || '',
          industry: r[6] || 'SME',
          teamSize: r[7] || '1-10',
          maturityScore: parseInt(r[8], 10) || 40,
          maturityTier: r[9] || 'Digital Practitioner',
          aiGrade: r[10] || 'Grade B',
          topPainPoint: r[11] || '',
          recommendedPackage: r[12] || '',
          annualRoiMYR: r[13] || '',
          preferredSlot: r[14] || '',
          status: r[15] || 'New',
          salesCheatSheet: {
            hook: r[16] || '',
            prescription: '',
            financialMath: ''
          },
          notes: r[17] || ''
        })).reverse(); // Most recent first

        return { source: 'google_sheets', leads: cloudLeads };
      }
    } catch (err) {
      console.warn('[CRM] Google Sheets fetch notice (using local fallback):', err.message);
    }
  }

  // Fallback to local storage
  return { source: 'local_storage', leads: getLocalLeads() };
}

/**
 * Reads leads from local storage
 */
function getLocalLeads() {
  try {
    initLocalLeads();
    const raw = fs.readFileSync(LOCAL_LEADS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

/**
 * Saves a new lead locally
 */
function saveLocalLead(lead) {
  try {
    const leads = getLocalLeads();
    leads.unshift(lead);
    fs.writeFileSync(LOCAL_LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
    return lead;
  } catch (err) {
    console.error('[CRM] Error saving local lead:', err);
    throw err;
  }
}

/**
 * Updates status of a lead in local cache and Google Sheets
 */
async function updateLeadStatus(leadId, newStatus) {
  let updatedLead = null;

  // 1. Update local
  try {
    const leads = getLocalLeads();
    const target = leads.find(l => l.id === leadId);
    if (target) {
      target.status = newStatus;
      fs.writeFileSync(LOCAL_LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
      updatedLead = target;
    }
  } catch (err) {
    console.error('Error updating local status:', err);
  }

  // 2. Update Google Sheet if available
  const client = getGoogleAuthClient();
  if (client && !client.error) {
    try {
      const { sheets, sheetId } = client;
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A:P'
      });
      const rows = res.data.values || [];
      const rowIndex = rows.findIndex(r => r[0] === leadId);
      if (rowIndex !== -1) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `P${rowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [[newStatus]] }
        });
        console.log(`[Google Sheets CRM] Updated status of ${leadId} to ${newStatus}`);
      }
    } catch (e) {
      console.warn('[CRM] Google Sheets status update notice:', e.message);
    }
  }

  return updatedLead || { id: leadId, status: newStatus };
}

/**
 * Main capture lead function
 */
async function recordConsultationLead(leadPayload) {
  const leadId = `EXA-${Date.now().toString().slice(-6)}`;
  const leadRecord = {
    id: leadId,
    createdAt: new Date().toISOString(),
    status: 'New',
    ...leadPayload
  };

  // 1. Always save locally to guarantee 0 data loss
  saveLocalLead(leadRecord);

  // 2. Sync to Google Sheets
  const gSync = await appendLeadToGoogleSheet(leadRecord);

  return {
    success: true,
    lead: leadRecord,
    syncStatus: gSync
  };
}

module.exports = {
  recordConsultationLead,
  getLocalLeads,
  fetchAllLeads,
  updateLeadStatus,
  appendLeadToGoogleSheet
};
