/**
 * Explicit Health Check & Diagnostics Endpoint for Cloudflare Pages
 * URL: /api/health
 */
import { fetchSheetLeads, getGoogleAccessToken, cleanPrivateKey } from '../google_sheets.js';

export async function onRequest(context) {
  const { env } = context;

  const cleanEnv = {
    ...env,
    GEMINI_API_KEY: env.GEMINI_API_KEY ? env.GEMINI_API_KEY.trim().replace(/^["']|["']$/g, '') : '',
    GOOGLE_SHEET_ID: env.GOOGLE_SHEET_ID ? env.GOOGLE_SHEET_ID.trim().replace(/^["']|["']$/g, '') : '',
    GOOGLE_SERVICE_ACCOUNT_EMAIL: env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? env.GOOGLE_SERVICE_ACCOUNT_EMAIL.trim().replace(/^["']|["']$/g, '') : '',
    GOOGLE_PRIVATE_KEY: cleanPrivateKey(env.GOOGLE_PRIVATE_KEY)
  };

  const checks = {
    GEMINI_API_KEY: cleanEnv.GEMINI_API_KEY
      ? `CONFIGURED (starts with ${cleanEnv.GEMINI_API_KEY.slice(0, 8)}...)`
      : 'MISSING - Set in Cloudflare Pages Settings > Environment variables',
    GOOGLE_SHEET_ID: cleanEnv.GOOGLE_SHEET_ID
      ? `CONFIGURED (${cleanEnv.GOOGLE_SHEET_ID})`
      : 'MISSING - Set in Cloudflare Pages Settings > Environment variables',
    GOOGLE_SERVICE_ACCOUNT_EMAIL: cleanEnv.GOOGLE_SERVICE_ACCOUNT_EMAIL
      ? `CONFIGURED (${cleanEnv.GOOGLE_SERVICE_ACCOUNT_EMAIL})`
      : 'MISSING - Set in Cloudflare Pages Settings > Environment variables',
    GOOGLE_PRIVATE_KEY: cleanEnv.GOOGLE_PRIVATE_KEY
      ? `CONFIGURED (${cleanEnv.GOOGLE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY') ? 'Valid PKCS8 Header' : 'Warning: Header not detected'})`
      : 'MISSING - Set in Cloudflare Pages Settings > Environment variables'
  };

  let googleAuthStatus = 'Not tested (missing credentials)';
  let sheetsReadStatus = 'Not tested';
  let leadsCount = 0;

  if (cleanEnv.GOOGLE_SERVICE_ACCOUNT_EMAIL && cleanEnv.GOOGLE_PRIVATE_KEY) {
    const tokenRes = await getGoogleAccessToken(cleanEnv.GOOGLE_SERVICE_ACCOUNT_EMAIL, cleanEnv.GOOGLE_PRIVATE_KEY);
    if (typeof tokenRes === 'string') {
      googleAuthStatus = 'SUCCESS (Google OAuth Token Generated)';
      if (cleanEnv.GOOGLE_SHEET_ID) {
        const leads = await fetchSheetLeads(cleanEnv);
        sheetsReadStatus = `SUCCESS (Connected to Sheet ${cleanEnv.GOOGLE_SHEET_ID})`;
        leadsCount = leads.length;
      }
    } else {
      googleAuthStatus = `FAILED: ${tokenRes?.error || 'Unknown error'}`;
    }
  }

  return new Response(JSON.stringify({
    status: 'online',
    runtime: 'Cloudflare Pages Functions (Edge)',
    timestamp: new Date().toISOString(),
    environment_checks: checks,
    google_sheets_connection: {
      auth: googleAuthStatus,
      read: sheetsReadStatus,
      total_leads_in_sheet: leadsCount
    },
    troubleshooting_tip: 'If variables show MISSING, make sure you clicked Retry Deployment after saving your environment variables in Cloudflare!'
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
