/**
 * Cloudflare Edge Compatible Google Sheets REST Client
 * Zero external npm dependencies. Uses standard fetch + Node crypto.
 */
import crypto from 'node:crypto';

export async function getGoogleAccessToken(clientEmail, privateKey) {
  if (!clientEmail || !privateKey) return null;

  let cleanedKey = privateKey;
  if (typeof cleanedKey === 'string') {
    if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
      try {
        cleanedKey = JSON.parse(cleanedKey);
      } catch (e) {
        cleanedKey = cleanedKey.slice(1, -1);
      }
    }
    cleanedKey = cleanedKey.replace(/\\n/g, '\n');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(header + '.' + claim);
  const signature = sign.sign(cleanedKey, 'base64url');
  const jwt = header + '.' + claim + '.' + signature;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!res.ok) {
    console.error('Google OAuth Token Error:', await res.text());
    return null;
  }

  const data = await res.json();
  return data.access_token;
}

export async function fetchSheetLeads(env) {
  const sheetId = env.GOOGLE_SHEET_ID;
  const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !email || !key) {
    return [];
  }

  try {
    const token = await getGoogleAccessToken(email, key);
    if (!token) return [];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A2:R`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      console.warn('Google Sheets fetch failed:', await res.text());
      return [];
    }

    const data = await res.json();
    const rows = data.values || [];

    return rows.map((r, idx) => ({
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
    })).reverse();
  } catch (err) {
    console.error('Error fetching sheet leads:', err);
    return [];
  }
}

export async function appendSheetLead(env, lead) {
  const sheetId = env.GOOGLE_SHEET_ID;
  const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !email || !key) {
    return false;
  }

  try {
    const token = await getGoogleAccessToken(email, key);
    if (!token) return false;

    const row = [
      lead.id || `EXA-${Date.now().toString().slice(-6)}`,
      lead.createdAt || new Date().toISOString(),
      lead.companyName || '',
      lead.contactName || '',
      lead.contactPhone || '',
      lead.contactEmail || '',
      lead.industry || '',
      lead.teamSize || '',
      lead.maturityScore || 0,
      lead.maturityTier || '',
      lead.aiGrade || '',
      lead.topPainPoint || '',
      lead.recommendedPackage || '',
      lead.annualRoiMYR || '',
      lead.preferredSlot || '',
      lead.status || 'New',
      lead.salesCheatSheet?.hook || '',
      lead.notes || ''
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:R:append?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [row] })
    });

    return res.ok;
  } catch (err) {
    console.error('Error appending sheet lead:', err);
    return false;
  }
}

export async function updateSheetLeadStatus(env, leadId, newStatus) {
  const sheetId = env.GOOGLE_SHEET_ID;
  const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !email || !key) return false;

  try {
    const token = await getGoogleAccessToken(email, key);
    if (!token) return false;

    // Get all rows to find matching leadId row number
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:P`;
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!getRes.ok) return false;

    const data = await getRes.json();
    const rows = data.values || [];
    let targetRowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === leadId) {
        targetRowIndex = i + 1; // 1-indexed for Sheets
        break;
      }
    }

    if (targetRowIndex === -1) return false;

    // Update status in column P
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/P${targetRowIndex}?valueInputOption=USER_ENTERED`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [[newStatus]] })
    });

    return updateRes.ok;
  } catch (err) {
    console.error('Error updating lead status in Google Sheet:', err);
    return false;
  }
}
