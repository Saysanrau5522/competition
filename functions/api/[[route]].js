/**
 * Cloudflare Pages Functions API Router
 * Handles all /api/* requests natively at Cloudflare Edge
 */

import {
  calculateMaturityScores,
  calculateFinancialROI,
  mapExabytesProducts,
  generateSalesCheatSheet,
  generateAiDynamicQuestion
} from '../../execution/calculate_engine.js';

import { buildReportHtml } from '../../execution/generate_pdf.js';
import { fetchSheetLeads, appendSheetLead, updateSheetLeadStatus } from '../google_sheets.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// Fallback seed leads if Google Sheets is not yet configured in Cloudflare
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

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const pathSegments = params.route || [];
  const fullPath = pathSegments.join('/');

  // Handle CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    // 1. POST /api/diagnostic/evaluate
    if (fullPath === 'diagnostic/evaluate' && request.method === 'POST') {
      const answers = await request.json();
      const companyData = {
        companyName: answers.companyName,
        contactName: answers.contactName,
        contactEmail: answers.contactEmail,
        contactPhone: answers.contactPhone,
        industry: answers.industry,
        teamSize: answers.teamSize,
        bottleneck: answers.q_bottleneck,
        goals: answers.q_goals
      };

      const scores = calculateMaturityScores(answers);
      const roi = calculateFinancialROI(answers, scores.totalScore, companyData);
      const products = mapExabytesProducts(scores, roi, companyData);
      const salesSheet = generateSalesCheatSheet(companyData, scores, roi, products);

      // AI dynamic question using Gemini (or deterministic fallback)
      const aiQuestion = await generateAiDynamicQuestion(companyData, env.GEMINI_API_KEY);

      return jsonResponse({
        companyName: companyData.companyName,
        contactName: companyData.contactName,
        contactEmail: companyData.contactEmail,
        contactPhone: companyData.contactPhone,
        industry: companyData.industry,
        teamSize: companyData.teamSize,
        bottleneck: answers.q_bottleneck,
        scores,
        roi,
        products,
        roadmap: [
          { phase: 'Phase 1: Foundation (Days 1 - 30)', title: 'Cloud Infrastructure & Automated Operations', impact: 'Reclaim 6 - 8 hours/week' },
          { phase: 'Phase 2: Acceleration (Days 31 - 60)', title: 'Cyber Resilience & Data Security', impact: 'Zero downtime & ransomware protection' },
          { phase: 'Phase 3: Scale (Days 61 - 90)', title: 'AI Copilot & Lead Automation', impact: '+35% faster inbound response times' }
        ],
        salesSheet,
        aiQuestion
      });
    }

    // 2. POST /api/diagnostic/html-report
    if (fullPath === 'diagnostic/html-report' && request.method === 'POST') {
      const reportData = await request.json();
      const html = buildReportHtml(reportData);
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 3. POST /api/diagnostic/pdf (Fallback for Edge)
    if (fullPath === 'diagnostic/pdf' && request.method === 'POST') {
      return jsonResponse({
        success: false,
        useHtmlFallback: true,
        message: 'Headless Chromium is not supported directly in Edge isolates. Use the print-ready preview.'
      }, 200);
    }

    // 4. POST /api/consultation/submit
    if (fullPath === 'consultation/submit' && request.method === 'POST') {
      const leadData = await request.json();
      const leadId = `EXA-${Date.now().toString().slice(-6)}`;
      const leadRecord = {
        id: leadId,
        createdAt: new Date().toISOString(),
        status: 'New',
        ...leadData
      };

      const syncOk = await appendSheetLead(env, leadRecord);

      return jsonResponse({
        success: true,
        result: {
          lead: leadRecord,
          syncStatus: syncOk ? 'synced_to_google_sheets' : 'edge_buffered'
        }
      });
    }

    // 5. GET /api/appointments/booked
    if (fullPath === 'appointments/booked' && request.method === 'GET') {
      let leads = await fetchSheetLeads(env);
      if (!leads || leads.length === 0) {
        leads = FALLBACK_SEED_LEADS;
      }

      const bookedSlots = leads.map(l => ({
        leadId: l.id,
        companyName: l.companyName,
        slot: l.preferredSlot || '',
        status: l.status || 'New'
      }));

      return jsonResponse({ success: true, bookedSlots });
    }

    // 6. GET /api/crm/leads
    if (fullPath === 'crm/leads' && request.method === 'GET') {
      let leads = await fetchSheetLeads(env);
      const isLive = leads && leads.length > 0;
      if (!isLive) {
        leads = FALLBACK_SEED_LEADS;
      }

      return jsonResponse({
        success: true,
        source: isLive ? 'google_sheets' : 'edge_seed_cache',
        leads
      });
    }

    // 7. PATCH /api/crm/leads/:id/status or POST /api/crm/leads/:id/status
    if (pathSegments[0] === 'crm' && pathSegments[1] === 'leads' && pathSegments[3] === 'status') {
      const leadId = pathSegments[2];
      const body = await request.json();
      const newStatus = body.status;

      const ok = await updateSheetLeadStatus(env, leadId, newStatus);
      return jsonResponse({ success: true, leadId, status: newStatus, synced: ok });
    }

    // Not Found
    return jsonResponse({ error: 'Endpoint not found', path: fullPath }, 404);

  } catch (err) {
    console.error('Edge API error:', err);
    return jsonResponse({ error: err.message }, 500);
  }
}
