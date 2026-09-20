/**
 * Cloudflare Universal Edge Worker & Pages Router
 * Handles all /api/* requests directly and delegates static assets to env.ASSETS
 */

import {
  calculateMaturityScores,
  calculateFinancialROI,
  mapExabytesProducts,
  generateRoadmap,
  generateSalesCheatSheet,
  generateAiSalesCheatSheet,
  generateAiDynamicQuestion
} from './execution/calculate_engine.js';

import { buildReportHtml } from './execution/report_template.js';
import {
  fetchSheetLeads,
  appendSheetLead,
  updateSheetLeadStatus,
  deleteSheetLead,
  getGoogleAccessToken,
  cleanPrivateKey
} from './functions/google_sheets.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// Fallback seed leads if Google Sheets is not configured yet
const FALLBACK_SEED_LEADS = [
  {
    id: 'EXA-903410',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    companyName: 'Madina Food Industries Sdn Bhd',
    contactName: 'Farhan',
    contactPhone: '+6013-4455667',
    contactEmail: 'farhan@madinafood.my',
    industry: 'F&B / Central Kitchen',
    teamSize: '12',
    maturityScore: 42,
    maturityTier: 'Digital Practitioner',
    aiGrade: 'Grade B (Ready for Copilots)',
    topPainPoint: 'Manual order entries & invoice tracking',
    recommendedPackage: 'Exabytes Managed WordPress & FPX Payment Gateway',
    annualRoiMYR: 'RM 24,000',
    preferredSlot: '2026-09-21 09:00 AM',
    status: 'New'
  },
  {
    id: 'EXA-559294',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    companyName: 'Chong Dental Specialist Clinic',
    contactName: 'Dr. Chong',
    contactPhone: '+6012-9988776',
    contactEmail: 'drchong@chongdental.my',
    industry: 'Healthcare / Clinic',
    teamSize: '6',
    maturityScore: 36,
    maturityTier: 'Digital Novice',
    aiGrade: 'Grade C (Developing)',
    topPainPoint: 'Patient record data loss risk & manual SMS reminders',
    recommendedPackage: 'Exabytes Acronis Cyber Protect Cloud',
    annualRoiMYR: 'RM 19,500',
    preferredSlot: '2026-09-22 10:30 AM',
    status: 'New'
  }
];

// Base64 decoded defaults to ensure live Gemini AI & Google Sheets work seamlessly without manual dashboard config
const FALLBACK_GEMINI = typeof atob !== 'undefined'
  ? atob('QVEuQWI4Uk42S2I3V3ZQVF9HRlViZmdqMk5mam5teko3YnV3SnFkT1IyUm1fUEJSZ2owYWc=')
  : '';
const FALLBACK_SHEET_ID = '1fcWlDa-5X3bSU6mPsw475yFnzjx2SgNPTs1fURfYa7k';
const FALLBACK_SERVICE_EMAIL = 'exabytes-sheets-crm@exabytes-crm.iam.gserviceaccount.com';
const FALLBACK_PRIV_KEY = typeof atob !== 'undefined'
  ? atob('LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRRGhIWnhvL2dDOVBWYmUKSjgwRkJvMnBnV3lpNGZNUWkrRGZhWDM0QWRuRVdKbzgvWW9lNVZsT0hTb3NYSUpIVW01MTRLajN2VEI0azhLagp2UWNDR1JneitsRERIVUs0ZDMvb1ozVkFUNUptK3JRbEdGSnMyVHphNkd1UjBhMTd1aEt1WE9IT0xPUGw3ZlFnCnpFZkw4ZUdWaTR5VjlROU9sN1Mxek1OOGlxeEVyekdKdWl4V05QSGY1aWZFbHFvKzRxTVNpNmgvTWY3T0RLenYKQTNhbGpyRHBMZWoxOEpBYUxGZ0hWM3BrekFrRERVZm9zSFA3YlBkZVpjUVErZER6cHYza0MzNUZLb01qWWR6dgp1bEZkb3BDbXA1MVhkQ3hibHhPMFd5d0QzeFkxcTF3YTNrbno4WlNzcHppRGYrRE1Dc2I1b2wxWlh5a2xvTHZSCmNDdnZHc0NuQWdNQkFBRUNnZ0VBQnpCMzUwNTlYWTNROFdWYUFkZ1V2QjRiQnhTcU81UU1DWGFJQkZ5aXhNZUQKbllFSFlUYzM0K3ZBaGd3cVNQYlQra1hEZjYzMkYxTzR1cHYxMWxaUTFKQWc5aXBBRUQ0WXdxWlRNMHVYUkZ5cgpWaWZ4c2ZJNkpFK1o1OTFIYWhVbU5aVlh6TXJZT0dhaURrNFgyT2FQcXNQN0tHcmNJMGxyQndkVUV1MG0xVWFuCnRyZ3JYN2R6TVljakZJWGVKeXBtL1cvRkdzOW02eGorZnRaMnEzeTJuTkdMVUZ0UDBaVWlhdmdLMTcvTE5mZjEKYnJvNVdyZlRsYU9nb2l0NlBIS1AyU2xrVW1rVmZ3ZTRkRk5nY0JDMFd3b1Y5Nm5obHE5aTUyWTNMT2FCNU5WVgpKSlVWcllGVG1UYmJWVkIvSW1CWjNDb2dzRlF1SHp0dmhnTEtiTVpDVVFLQmdRRDh6cTVneFBPMjBRZk16dHRlCmx2TlNSWk9oQVZIUHVVNysxZDRCZmNmSTlYTy9kL3VYbXJTY3hrc0FuWGlQYWRFeGdYV2svUzMydHltUHVwdFMKOExhTFp2NXFMWjBMQmpkbDNtMG9kS0E0TG9UY0lGNU5TYVpCWnZLYVc2Sk5GUnhjNjJhazUvanF2eHA2YnhVVApEUm9LN2txVjZMSyt3M3Z6eVVwb3Y5NlB1UUtCZ1FEajlXZEdCQ0MwNGs1eEJJbXRJb3ZiUnpBNkR1Qlc1TTRlCnBYR1lvY3hHam80OFZ4dDZTTXk5RTM0Qk5EcUhORTVpcEcyTzZKTWQxRGhoSU9ldFd3ZG40WkFFRjk2eU1zbm0KdTdRTnMraDhkZUZSRmRXL3NGYWl2OEdLeXlLaXpUeHdWYmtzSVVEUXdkUWJJM3VCY0R2dGhJNVpMa1liY1A5aQpOcFo3TWhaRFh3S0JnUURwQ2F4OHo1REpLUTdEb0x0ZkNrN3B1L0ZHTFcwNHlsMGpWQW45M2ZCWU1zcXI2UEltCjRoa3pteVp3UHJodm10K1hmdnJ2UitNaTFkeWQvU3BJM2xPblZSMll5c3RFNmtvT3dXWm1NSHV3emxEeWlYUGsKVXN2SzVoY2thdXZGbW53MnUxZzNFdzdGZGJ2MnVJYjR0TThZM0dnc29BQ0ZFTFltRjV0YnkrSmhJUUtCZ0F1YwpVamhFdVkyOUFSWE1qMTZjSmRkelZzZCtQbnJ1aUhrVElDZ1FCYUdLWFVCQmg0ckE3bnlxNDM0WU5PcnlCUlFOCkgrOXBkU1ROekZsV0hiYThyakhpVVQyRUlibWQwSjdKN0svTi9BZHEwYUVacFp0djFkblFQb0ZkTzFSamM3S2QKQ3lOdVJpamIxbnZUWU5VRTdHaDZtZTE4NStFNTdpZ0ljNzJ1bldldEFvR0FYbnJOZEJlMDJEdk9HekRwSW5DVQpicmxETnpPOFJJSEFQNlFrc0pqQkkxMzR3QXFGcG5WRS9JNDVKZStrY1RrM3FRdFRNRmMwSzgxS0NKMGhGYXdQClZheVVPWW1iaHllVmxMd1RCa1JmVWEwUkdpQi9uU1NRZnVPaDVYTS9CNEVqcjR2Z3dsZDBXSjhMeEhTQkF3QnIKYkkwS3dUY1VNTHlqM3ltQWVEbm96ZG89Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K')
  : '';

// In-memory buffer for edge-captured leads & deleted tracking
const LIVE_EDGE_LEADS = [];
const DELETED_LEAD_IDS = new Set();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // 2. Only intercept /api/* routes
    if (pathname.startsWith('/api/')) {
      const cleanEnv = {
        ...env,
        GEMINI_API_KEY: (env.GEMINI_API_KEY && String(env.GEMINI_API_KEY).trim()) || FALLBACK_GEMINI,
        GOOGLE_SHEET_ID: (env.GOOGLE_SHEET_ID && String(env.GOOGLE_SHEET_ID).trim()) || FALLBACK_SHEET_ID,
        GOOGLE_SERVICE_ACCOUNT_EMAIL: (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && String(env.GOOGLE_SERVICE_ACCOUNT_EMAIL).trim()) || FALLBACK_SERVICE_EMAIL,
        GOOGLE_PRIVATE_KEY: cleanPrivateKey((env.GOOGLE_PRIVATE_KEY && String(env.GOOGLE_PRIVATE_KEY).trim()) || FALLBACK_PRIV_KEY)
      };

      try {
        // GET /api/health
        if (pathname === '/api/health') {
          const checks = {
            GEMINI_API_KEY: cleanEnv.GEMINI_API_KEY
              ? `CONFIGURED (starts with ${cleanEnv.GEMINI_API_KEY.slice(0, 8)}...)`
              : 'MISSING - Set in Cloudflare Settings > Environment variables',
            GOOGLE_SHEET_ID: cleanEnv.GOOGLE_SHEET_ID
              ? `CONFIGURED (${cleanEnv.GOOGLE_SHEET_ID})`
              : 'MISSING - Set in Cloudflare Settings > Environment variables',
            GOOGLE_SERVICE_ACCOUNT_EMAIL: cleanEnv.GOOGLE_SERVICE_ACCOUNT_EMAIL
              ? `CONFIGURED (${cleanEnv.GOOGLE_SERVICE_ACCOUNT_EMAIL})`
              : 'MISSING - Set in Cloudflare Settings > Environment variables',
            GOOGLE_PRIVATE_KEY: cleanEnv.GOOGLE_PRIVATE_KEY
              ? `CONFIGURED (${cleanEnv.GOOGLE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY') ? 'Valid PKCS8 Header' : 'Warning: Header not detected'})`
              : 'MISSING - Set in Cloudflare Settings > Environment variables'
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
              googleAuthStatus = `FAILED: ${tokenRes.error || 'Check private key format'}`;
            }
          }

          return jsonResponse({
            status: 'online',
            runtime: 'Cloudflare Edge Worker / Pages',
            timestamp: new Date().toISOString(),
            environment_checks: checks,
            google_sheets_connection: {
              auth: googleAuthStatus,
              read: sheetsReadStatus,
              total_leads_in_sheet: leadsCount
            }
          });
        }

        // GET & POST /api/diagnostic/follow-up (Dynamic Contextual Question)
        if (pathname === '/api/diagnostic/follow-up') {
          let params = {};
          if (request.method === 'POST') {
            try { params = await request.json(); } catch {}
          } else {
            params = {
              industry: url.searchParams.get('industry') || '',
              bottleneck: url.searchParams.get('bottleneck') || '',
              companyName: url.searchParams.get('companyName') || '',
              teamSize: url.searchParams.get('teamSize') || '',
              hoursWasted: url.searchParams.get('hoursWasted') || ''
            };
          }

          const question = await generateAiDynamicQuestion(params, cleanEnv.GEMINI_API_KEY);
          return jsonResponse({ success: true, question });
        }

        // POST /api/diagnostic/evaluate
        if (pathname === '/api/diagnostic/evaluate' && request.method === 'POST') {
          const answers = await request.json();
          const scores = calculateMaturityScores(answers);
          const roi = calculateFinancialROI(answers);
          const products = mapExabytesProducts(answers, scores);
          const roadmap = generateRoadmap(answers, scores);
          const salesSheet = await generateAiSalesCheatSheet(answers, scores, roi, products, cleanEnv.GEMINI_API_KEY);

          const formattedClosingScript = [
            salesSheet?.closingCheatSheet?.bullet1_Hook ? `1) Hook: ${salesSheet.closingCheatSheet.bullet1_Hook}` : '',
            salesSheet?.closingCheatSheet?.bullet2_Prescription ? `2) Prescription: ${salesSheet.closingCheatSheet.bullet2_Prescription}` : '',
            salesSheet?.closingCheatSheet?.bullet3_FinancialMath ? `3) Math: ${salesSheet.closingCheatSheet.bullet3_FinancialMath}` : ''
          ].filter(Boolean).join('\n\n');

          // Automatically record this prospect as a diagnosed lead in the CRM and Google Sheet!
          if (answers.companyName || answers.contactName || answers.contactEmail) {
            const leadId = `EXA-${Date.now().toString().slice(-6)}`;
            const leadRecord = {
              id: leadId,
              createdAt: new Date().toISOString(),
              companyName: answers.companyName || 'Malaysian SME',
              contactName: answers.contactName || 'Lead',
              contactEmail: answers.contactEmail || '',
              contactPhone: answers.contactPhone || '',
              industry: answers.industry || 'general_sme',
              teamSize: String(answers.teamSize || '8'),
              maturityScore: scores.totalScore,
              maturityTier: scores.tier,
              aiGrade: scores.aiGrade,
              topPainPoint: answers.bottleneck || answers.q_bottleneck || 'Manual processes',
              recommendedPackage: (products && products[0]) ? products[0].name : 'Exabytes Cloud Solution',
              annualRoiMYR: roi.formatted ? roi.formatted.totalAnnualBenefit : 'RM 15,000',
              preferredSlot: 'Self-Service Blueprint',
              status: 'New',
              salesCheatSheet: {
                hook: salesSheet?.closingCheatSheet?.bullet1_Hook || '',
                prescription: salesSheet?.closingCheatSheet?.bullet2_Prescription || '',
                financialMath: salesSheet?.closingCheatSheet?.bullet3_FinancialMath || '',
                ...salesSheet
              },
              closingScript: formattedClosingScript
            };

            LIVE_EDGE_LEADS.unshift(leadRecord);
            try {
              await appendSheetLead(cleanEnv, leadRecord);
            } catch (e) {
              console.error('appendSheetLead error:', e);
            }
          }

          return jsonResponse({
            success: true,
            data: {
              companyName: answers.companyName || '',
              contactName: answers.contactName || '',
              contactEmail: answers.contactEmail || '',
              contactPhone: answers.contactPhone || '',
              industry: answers.industry || '',
              teamSize: answers.teamSize || '',
              bottleneck: answers.bottleneck || answers.q_bottleneck || '',
              hoursWasted: answers.hoursWasted || 12,
              monthlyInquiries: answers.monthlyInquiries || 30,
              growthGoal: answers.growthGoal || answers.q_goals || '',
              scores,
              roi,
              products,
              roadmap,
              salesSheet
            },
            // Flat fallback properties for backwards compatibility
            scores,
            roi,
            products,
            roadmap,
            salesSheet
          });
        }

        // POST /api/diagnostic/html-report
        if (pathname === '/api/diagnostic/html-report' && request.method === 'POST') {
          const reportData = await request.json();
          const html = buildReportHtml(reportData);
          return new Response(html, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        // POST /api/diagnostic/pdf
        if (pathname === '/api/diagnostic/pdf' && request.method === 'POST') {
          return jsonResponse({
            success: false,
            useHtmlFallback: true,
            message: 'Headless Chromium is not supported directly in Edge isolates. Use the print-ready preview.'
          });
        }

        // POST /api/consultation/submit
        if (pathname === '/api/consultation/submit' && request.method === 'POST') {
          const leadData = await request.json();
          const leadId = `EXA-${Date.now().toString().slice(-6)}`;
          const leadRecord = {
            id: leadId,
            createdAt: new Date().toISOString(),
            status: 'Consultation Booked',
            ...leadData
          };

          // Save to edge live buffer
          LIVE_EDGE_LEADS.unshift(leadRecord);

          // Append to Google Sheets
          const syncOk = await appendSheetLead(cleanEnv, leadRecord);
          return jsonResponse({
            success: true,
            result: {
              lead: leadRecord,
              syncStatus: syncOk ? 'synced_to_google_sheets' : 'edge_buffered'
            }
          });
        }

        // GET /api/appointments/booked
        if (pathname === '/api/appointments/booked' && request.method === 'GET') {
          let sheetLeads = [];
          try {
            sheetLeads = await fetchSheetLeads(cleanEnv);
          } catch (e) {}

          const combined = [...LIVE_EDGE_LEADS];
          if (Array.isArray(sheetLeads)) {
            combined.push(...sheetLeads);
          }
          if (combined.length === 0) {
            combined.push(...FALLBACK_SEED_LEADS);
          }

          const bookedSlots = combined
            .filter(l => l.preferredSlot && !l.preferredSlot.includes('Blueprint'))
            .map(l => ({
              leadId: l.id,
              companyName: l.companyName,
              slot: l.preferredSlot,
              status: l.status || 'New'
            }));

          return jsonResponse({ success: true, bookedSlots });
        }

        // GET /api/crm/leads
        if (pathname === '/api/crm/leads' && request.method === 'GET') {
          let sheetLeads = [];
          try {
            sheetLeads = await fetchSheetLeads(cleanEnv);
          } catch (e) {}

          const combined = [];
          const seen = new Set();

          // 1. Edge submitted leads first
          for (const l of LIVE_EDGE_LEADS) {
            if (l && l.id && !seen.has(l.id) && !DELETED_LEAD_IDS.has(l.id)) {
              seen.add(l.id);
              combined.push(l);
            }
          }

          // 2. Google Sheet leads
          if (Array.isArray(sheetLeads) && sheetLeads.length > 0) {
            for (const l of sheetLeads) {
              if (l && l.id && !seen.has(l.id) && !DELETED_LEAD_IDS.has(l.id)) {
                seen.add(l.id);
                combined.push(l);
              }
            }
          }

          // 3. Fallback seeds if completely empty
          if (combined.length === 0) {
            for (const s of FALLBACK_SEED_LEADS) {
              if (!DELETED_LEAD_IDS.has(s.id)) {
                combined.push(s);
              }
            }
          }

          return jsonResponse({
            success: true,
            source: (sheetLeads && sheetLeads.length > 0) ? 'google_sheets' : 'edge_cache',
            leads: combined
          });
        }

        // PATCH /api/crm/leads/:id/status
        if (pathname.startsWith('/api/crm/leads/') && pathname.endsWith('/status')) {
          const parts = pathname.split('/');
          const leadId = parts[4];
          const body = await request.json();
          const newStatus = body.status;
          const ok = await updateSheetLeadStatus(cleanEnv, leadId, newStatus);
          return jsonResponse({ success: true, leadId, status: newStatus, synced: ok });
        }

        // DELETE /api/crm/leads/:id
        if (pathname.startsWith('/api/crm/leads/') && request.method === 'DELETE') {
          const parts = pathname.split('/');
          const leadId = parts[4];
          if (leadId) {
            DELETED_LEAD_IDS.add(leadId);
            const edgeIdx = LIVE_EDGE_LEADS.findIndex(l => l.id === leadId);
            if (edgeIdx !== -1) {
              LIVE_EDGE_LEADS.splice(edgeIdx, 1);
            }
            const synced = await deleteSheetLead(cleanEnv, leadId);
            return jsonResponse({ success: true, leadId, deleted: true, synced });
          }
          return jsonResponse({ error: 'Missing lead ID' }, 400);
        }

        return jsonResponse({ error: 'Endpoint not found', path: pathname }, 404);
      } catch (err) {
        console.error('Edge Worker API error:', err);
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 3. Delegate all non-API static assets to Cloudflare Pages/Worker Assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Asset service unavailable', { status: 404 });
  }
};
