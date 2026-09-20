/**
 * Layer 3: Main Express Web Server
 * AI SME Digital Growth Advisor & Lead Generation Engine
 * Production-ready with Google Gemini 3.6 Flash & Two-Way Google Sheets CRM
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const {
  calculateMaturityScores,
  calculateFinancialROI,
  mapExabytesProducts,
  generateRoadmap,
  getDynamicFollowUpQuestion,
  generateAiDynamicQuestion,
  generateSalesCheatSheet
} = require('./calculate_engine');
const { recordConsultationLead, fetchAllLeads, updateLeadStatus, deleteLead } = require('./sheets_crm');
const { generateBlueprintPdf, buildReportHtml } = require('./generate_pdf');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Gemini LLM Sales Script Enhancer (using gemini-3.6-flash with deterministic SOP fallback)
async function generateAiEnrichedScript(formData, scores, roi, products) {
  const apiKey = process.env.GEMINI_API_KEY;
  const baseSheet = generateSalesCheatSheet(formData, scores, roi, products);

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return baseSheet;
  }

  try {
    const prompt = `You are a Senior B2B Solutions Consultant at Exabytes Malaysia.
Client Profile:
- Company: ${formData.companyName || 'SME'}
- Contact: ${formData.contactName || 'Owner'}
- Industry: ${formData.industry}
- Team Size: ${formData.teamSize}
- Maturity Score: ${scores.totalScore}/100 (${scores.tier})
- Hours Wasted: ${roi.weeklyWastedHours} hrs/week
- Annual Labor Value at Risk: ${roi.formatted.annualAdminCashSaved}
- Recommended Exabytes Product: ${products[0]?.name || 'Exabytes Business Solution'}

Based on directives/sales_pitch_sop.md, output exactly 3 bullet points:
1. The Empathetic Hook (citing their specific pain and hours wasted).
2. The Exabytes Phase 1 Prescription (explaining why this product fixes it first).
3. The Deterministic Financial Math (referencing direct RM recovered).
Keep tone consultative, urgent, and professional. Return raw text with 3 bullet lines.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length >= 3) {
          baseSheet.closingCheatSheet.bullet1_Hook = lines[0].replace(/^[-*•1-3.]\s*/, '');
          baseSheet.closingCheatSheet.bullet2_Prescription = lines[1].replace(/^[-*•1-3.]\s*/, '');
          baseSheet.closingCheatSheet.bullet3_FinancialMath = lines[2].replace(/^[-*•1-3.]\s*/, '');
          baseSheet.aiEnhanced = true;
        }
      }
    }
  } catch (err) {
    console.warn('[LLM] Gemini sales script notice (using SOP script):', err.message);
  }

  return baseSheet;
}

// ----------------------------------------------------------------------------
// API Endpoints
// ----------------------------------------------------------------------------

/**
 * GET & POST /api/diagnostic/follow-up
 * Generates dynamic, context-aware follow-up question via Gemini (with SOP fallback)
 */
async function handleFollowUpRequest(req, res) {
  try {
    const params = {
      companyName: req.query.companyName || req.body.companyName,
      industry: req.query.industry || req.body.industry,
      bottleneck: req.query.bottleneck || req.body.bottleneck,
      teamSize: req.query.teamSize || req.body.teamSize,
      hoursWasted: req.query.hoursWasted || req.body.hoursWasted
    };

    const question = await generateAiDynamicQuestion(params);
    res.json({ success: true, question });
  } catch (err) {
    res.json({ success: true, question: getDynamicFollowUpQuestion(req.query) });
  }
}

app.get('/api/diagnostic/follow-up', handleFollowUpRequest);
app.post('/api/diagnostic/follow-up', handleFollowUpRequest);

/**
 * POST /api/diagnostic/evaluate
 * Evaluates the full assessment and returns scores, ROI, roadmap, products, and sales script
 */
app.post('/api/diagnostic/evaluate', async (req, res) => {
  try {
    const formData = req.body;
    const scores = calculateMaturityScores(formData);
    const roi = calculateFinancialROI(formData);
    const products = mapExabytesProducts(formData, scores);
    const roadmap = generateRoadmap(formData, scores);
    const salesSheet = await generateAiEnrichedScript(formData, scores, roi, products);

    if (formData.companyName || formData.contactName || formData.contactEmail) {
      const formattedScript = [
        salesSheet?.closingCheatSheet?.bullet1_Hook ? `1) Hook: ${salesSheet.closingCheatSheet.bullet1_Hook}` : '',
        salesSheet?.closingCheatSheet?.bullet2_Prescription ? `2) Prescription: ${salesSheet.closingCheatSheet.bullet2_Prescription}` : '',
        salesSheet?.closingCheatSheet?.bullet3_FinancialMath ? `3) Math: ${salesSheet.closingCheatSheet.bullet3_FinancialMath}` : ''
      ].filter(Boolean).join('\n\n');

      const leadRecord = {
        companyName: formData.companyName || 'Malaysian SME',
        contactName: formData.contactName || 'Lead',
        contactEmail: formData.contactEmail || '',
        contactPhone: formData.contactPhone || '',
        industry: formData.industry || 'general_sme',
        teamSize: String(formData.teamSize || '8'),
        maturityScore: scores.totalScore,
        maturityTier: scores.tier,
        aiGrade: scores.aiGrade,
        topPainPoint: formData.bottleneck || formData.q_bottleneck || 'Manual processes',
        recommendedPackage: (products && products[0]) ? products[0].name : 'Exabytes Cloud Solution',
        annualRoiMYR: roi.formatted ? roi.formatted.totalAnnualBenefit : 'RM 15,000',
        preferredSlot: 'Self-Service Blueprint',
        status: 'New',
        salesCheatSheet: salesSheet,
        closingScript: formattedScript
      };
      recordConsultationLead(leadRecord).catch(() => {});
    }

    res.json({
      success: true,
      data: {
        scores,
        roi,
        products,
        roadmap,
        salesSheet
      }
    });
  } catch (error) {
    console.error('Error in /api/diagnostic/evaluate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/diagnostic/pdf
 * Generates and downloads the 4-page A4 PDF blueprint
 */
app.post('/api/diagnostic/pdf', async (req, res) => {
  try {
    const reportData = req.body;
    const pdfBuffer = await generateBlueprintPdf(reportData);

    const safeName = (reportData.companyName || 'SME')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Exabytes_Blueprint_${safeName}.pdf"`
    );
    res.end(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, error: 'Could not generate PDF: ' + error.message });
  }
});

/**
 * POST /api/diagnostic/html-report
 * Returns standalone styled HTML report for browser preview/printing
 */
app.post('/api/diagnostic/html-report', (req, res) => {
  try {
    const html = buildReportHtml(req.body);
    res.send(html);
  } catch (err) {
    res.status(500).send('Error generating report: ' + err.message);
  }
});

/**
 * POST /api/consultation/submit
 * Captures lead from client portal to Google Sheets & local CRM
 */
app.post('/api/consultation/submit', async (req, res) => {
  try {
    const leadData = req.body;
    const result = await recordConsultationLead(leadData);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error saving consultation lead:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/health
 * Health & diagnostic check for environment variables and Google Sheets connection
 */
app.get('/api/health', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privKey = process.env.GOOGLE_PRIVATE_KEY;

  let leadsCount = 0;
  let sheetsStatus = 'Not connected';
  try {
    const leadsRes = await fetchAllLeads();
    leadsCount = leadsRes.leads ? leadsRes.leads.length : 0;
    sheetsStatus = `Connected (${leadsRes.source})`;
  } catch (e) {
    sheetsStatus = `Error: ${e.message}`;
  }

  res.json({
    status: 'online',
    runtime: 'Node.js Express Server',
    timestamp: new Date().toISOString(),
    environment_checks: {
      GEMINI_API_KEY: apiKey ? `CONFIGURED (${apiKey.slice(0, 8)}...)` : 'MISSING',
      GOOGLE_SHEET_ID: sheetId ? `CONFIGURED (${sheetId})` : 'MISSING',
      GOOGLE_SERVICE_ACCOUNT_EMAIL: email ? `CONFIGURED (${email})` : 'MISSING',
      GOOGLE_PRIVATE_KEY: privKey ? 'CONFIGURED (Header detected)' : 'MISSING'
    },
    google_sheets_connection: {
      status: sheetsStatus,
      total_leads: leadsCount
    }
  });
});

/**
 * GET /api/appointments/booked
 * Returns all booked slots so client calendar can disable unavailable times
 */
app.get('/api/appointments/booked', async (req, res) => {
  try {
    const result = await fetchAllLeads();
    const leads = result.leads || [];
    const bookedSlots = [];

    leads.forEach(l => {
      const slotStr = l.preferredSlot || '';
      // Format can be "YYYY-MM-DD HH:MM AM" or descriptive
      bookedSlots.push({
        leadId: l.id,
        companyName: l.companyName,
        slot: slotStr,
        status: l.status
      });
    });

    res.json({ success: true, bookedSlots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/crm/leads
 * Returns captured leads (reads directly from Google Sheets if configured)
 */
app.get('/api/crm/leads', async (req, res) => {
  try {
    const result = await fetchAllLeads();
    res.json({ success: true, source: result.source, leads: result.leads });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/crm/leads/:id/status
 * Updates lead status in Google Sheets and local CRM
 */
app.patch('/api/crm/leads/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await updateLeadStatus(id, status);
    res.json({ success: true, lead: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/crm/leads/:id
 * Removes lead from Google Sheets and local CRM
 */
app.delete('/api/crm/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteLead(id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Exabytes SME Digital Growth Advisor Server Running!`);
  console.log(`🌐 Client Portal:    http://localhost:${PORT}`);
  console.log(`💼 Internal Sales:   http://localhost:${PORT}/internal/dashboard.html`);
  console.log(`=======================================================`);
});
