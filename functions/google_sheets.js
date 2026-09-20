/**
 * Pure Web-Crypto Google Sheets REST Client for Cloudflare Pages Functions
 * Works on all edge isolates with ZERO external npm dependencies.
 */

export function cleanPrivateKey(rawKey) {
  if (!rawKey) return null;
  let key = String(rawKey).trim();
  // Strip outer quotes if copied from .env
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    try {
      key = JSON.parse(key);
    } catch {
      key = key.slice(1, -1);
    }
  }
  // Convert literal \n to actual newlines
  key = key.replace(/\\n/g, '\n');
  return key;
}

function pemToDer(pem) {
  const cleaned = cleanPrivateKey(pem);
  const b64 = cleaned
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64UrlEncode(bytesOrString) {
  let b64;
  if (typeof bytesOrString === 'string') {
    b64 = btoa(bytesOrString);
  } else {
    let binary = '';
    const bytes = new Uint8Array(bytesOrString);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    b64 = btoa(binary);
  }
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function getGoogleAccessToken(clientEmail, privateKey) {
  if (!clientEmail || !privateKey) return null;

  try {
    const cleanedKey = cleanPrivateKey(privateKey);
    const der = pemToDer(cleanedKey);

    const key = await crypto.subtle.importKey(
      'pkcs8',
      der,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const now = Math.floor(Date.now() / 1000);
    const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = base64UrlEncode(JSON.stringify({
      iss: clientEmail.trim(),
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }));

    const sigBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(header + '.' + claim)
    );

    const jwt = header + '.' + claim + '.' + base64UrlEncode(sigBuffer);

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Google OAuth Token Error:', errBody);
      return { error: errBody };
    }

    const data = await res.json();
    return data.access_token;
  } catch (err) {
    console.error('Crypto / Token generation error:', err);
    return { error: err.message };
  }
}

function extractHook(val) {
  if (!val || typeof val !== 'string') return '';
  const m = val.match(/(?:1\)\s*Hook:\s*|Hook:\s*)([\s\S]*?)(?=(?:2\)\s*Prescription:|Prescription:|$))/i);
  return m ? m[1].trim() : val.trim();
}

function extractPrescription(val) {
  if (!val || typeof val !== 'string') return '';
  const m = val.match(/(?:2\)\s*Prescription:\s*|Prescription:\s*)([\s\S]*?)(?=(?:3\)\s*Math:|Math:|$))/i);
  return m ? m[1].trim() : '';
}

function extractMath(val) {
  if (!val || typeof val !== 'string') return '';
  const m = val.match(/(?:3\)\s*Math:\s*|Math:\s*)([\s\S]*?)$/i);
  return m ? m[1].trim() : '';
}

function formatClosingScript(lead) {
  if (typeof lead.closingScript === 'string' && lead.closingScript.trim()) {
    return lead.closingScript.trim();
  }
  if (typeof lead.scriptText === 'string' && lead.scriptText.trim()) {
    return lead.scriptText.trim();
  }

  const sheet = lead.salesCheatSheet || lead.salesSheet;
  if (sheet) {
    const cs = sheet.closingCheatSheet || sheet;
    const hook = cs.bullet1_Hook || cs.hook || '';
    const prescription = cs.bullet2_Prescription || cs.prescription || '';
    const math = cs.bullet3_FinancialMath || cs.financialMath || '';

    const parts = [];
    if (hook) parts.push(`1) Hook: ${hook}`);
    if (prescription) parts.push(`2) Prescription: ${prescription}`);
    if (math) parts.push(`3) Math: ${math}`);

    if (parts.length > 0) {
      return parts.join('\n\n');
    }
  }

  if (lead.notes && lead.notes !== 'Self-Service Blueprint' && lead.notes !== 'N/A') {
    return lead.notes;
  }

  return '';
}

export async function fetchSheetLeads(env) {
  const sheetId = (env.GOOGLE_SHEET_ID || '').trim();
  const email = (env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
  const key = env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !email || !key) {
    return [];
  }

  try {
    const tokenResult = await getGoogleAccessToken(email, key);
    if (!tokenResult || typeof tokenResult !== 'string') return [];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A2:R`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${tokenResult}` }
    });

    if (!res.ok) {
      console.warn('Google Sheets fetch failed:', await res.text());
      return [];
    }

    const data = await res.json();
    const rows = data.values || [];

    return rows.map((r, idx) => {
      const scriptCol = r[16] || '';
      return {
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
          hook: extractHook(scriptCol),
          prescription: extractPrescription(scriptCol),
          financialMath: extractMath(scriptCol),
          fullScript: scriptCol
        },
        notes: r[17] || ''
      };
    }).reverse();
  } catch (err) {
    console.error('Error fetching sheet leads:', err);
    return [];
  }
}

export async function appendSheetLead(env, lead) {
  const sheetId = (env.GOOGLE_SHEET_ID || '').trim();
  const email = (env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
  const key = env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !email || !key) {
    return false;
  }

  try {
    const tokenResult = await getGoogleAccessToken(email, key);
    if (!tokenResult || typeof tokenResult !== 'string') return false;

    const formattedScript = formatClosingScript(lead);

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
      formattedScript,
      lead.notes || ''
    ];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:R:append?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenResult}`,
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
  const sheetId = (env.GOOGLE_SHEET_ID || '').trim();
  const email = (env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
  const key = env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !email || !key) return false;

  try {
    const tokenResult = await getGoogleAccessToken(email, key);
    if (!tokenResult || typeof tokenResult !== 'string') return false;

    // Find row
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:P`;
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${tokenResult}` }
    });
    if (!getRes.ok) return false;

    const data = await getRes.json();
    const rows = data.values || [];
    let targetRowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === leadId) {
        targetRowIndex = i + 1;
        break;
      }
    }

    if (targetRowIndex === -1) return false;

    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/P${targetRowIndex}?valueInputOption=USER_ENTERED`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokenResult}`,
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

export async function deleteSheetLead(env, leadId) {
  const sheetId = (env.GOOGLE_SHEET_ID || '').trim();
  const email = (env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
  const key = env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !email || !key) return false;

  try {
    const tokenResult = await getGoogleAccessToken(email, key);
    if (!tokenResult || typeof tokenResult !== 'string') return false;

    // Find row
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:A`;
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${tokenResult}` }
    });
    if (!getRes.ok) return false;

    const data = await getRes.json();
    const rows = data.values || [];
    let targetRowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === leadId) {
        targetRowIndex = i; // 0-based index
        break;
      }
    }

    if (targetRowIndex === -1) return false;

    // Attempt 1: batchUpdate deleteDimension to cleanly remove the row
    try {
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`, {
        headers: { Authorization: `Bearer ${tokenResult}` }
      });
      let numericSheetId = 0;
      if (metaRes.ok) {
        const meta = await metaRes.json();
        numericSheetId = meta.sheets?.[0]?.properties?.sheetId || 0;
      }

      const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`;
      const batchRes = await fetch(batchUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenResult}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: numericSheetId,
                  dimension: 'ROWS',
                  startIndex: targetRowIndex,
                  endIndex: targetRowIndex + 1
                }
              }
            }
          ]
        })
      });

      if (batchRes.ok) return true;
    } catch (e) {
      console.warn('Batch delete row notice, clearing row values fallback:', e);
    }

    // Attempt 2: Clear row values
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A${targetRowIndex + 1}:R${targetRowIndex + 1}:clear`;
    const clearRes = await fetch(clearUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenResult}`,
        'Content-Type': 'application/json'
      }
    });

    return clearRes.ok;
  } catch (err) {
    console.error('Error deleting lead from Google Sheet:', err);
    return false;
  }
}

