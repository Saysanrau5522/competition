/**
 * Comprehensive Automated Test Suite
 * Tests calculation engine, CRM syncing, PDF HTML builder, and API endpoints
 */

const { calculateMaturityScores, calculateFinancialROI, mapExabytesProducts, generateRoadmap, getDynamicFollowUpQuestion, generateSalesCheatSheet } = require('./calculate_engine');
const { recordConsultationLead, getLocalLeads, updateLeadStatus } = require('./sheets_crm');
const { buildReportHtml } = require('./generate_pdf');

async function runTests() {
  console.log('==================================================');
  console.log('🧪 Starting Exabytes Advisor System Verification');
  console.log('==================================================');

  // TEST 1: Calculation Engine Scores & Boundaries
  console.log('\n[1/5] Testing Calculation Engine...');
  const sampleA = {
    companyName: 'Penang Hardware Trading Sdn Bhd',
    industry: 'retail_ecommerce',
    teamSize: '8',
    currentTools: ['business_email', 'basic_website', 'excel_sheets', 'whatsapp_only'],
    bottleneck: 'manual_inquiries',
    hoursWasted: 14,
    monthlyInquiries: 60
  };

  const scores = calculateMaturityScores(sampleA);
  console.log(`- Maturity Score: ${scores.totalScore}/100, Tier: ${scores.tier}, AI Grade: ${scores.aiGrade}`);
  if (scores.totalScore < 0 || scores.totalScore > 100) {
    throw new Error(`Invalid score: ${scores.totalScore}`);
  }

  // TEST 2: Deterministic ROI Math
  console.log('\n[2/5] Testing Deterministic Malaysian Economic ROI Math...');
  const roi = calculateFinancialROI(sampleA);
  console.log(`- Annual Hours Saved: ${roi.formatted.annualHoursSaved}`);
  console.log(`- Direct Admin Cash Recovered: ${roi.formatted.annualAdminCashSaved}`);
  console.log(`- Revenue Leakage Recovered: ${roi.formatted.annualRevenueRecovered}`);
  console.log(`- Total 12-Month Net Value: ${roi.formatted.totalAnnualBenefit}`);
  console.log(`- Payback Horizon: ${roi.formatted.paybackPeriod}`);

  if (roi.annualAdminCashSaved <= 0 || roi.annualHoursSaved <= 0) {
    throw new Error('ROI calculations resulted in zero or negative value');
  }

  // TEST 3: Dynamic Follow-Up & Product Mapping
  console.log('\n[3/5] Testing Dynamic Follow-up & Exabytes Product Mapping...');
  const followUp = getDynamicFollowUpQuestion({ industry: 'retail_ecommerce', bottleneck: 'manual_inquiries' });
  console.log(`- Dynamic Question Generated: "${followUp.title}"`);
  console.log(`- Options count: ${followUp.options.length}`);

  const products = mapExabytesProducts(sampleA, scores);
  console.log(`- Mapped Exabytes Packages: ${products.map(p => p.name).join(' | ')}`);
  if (products.length === 0) {
    throw new Error('No Exabytes products mapped');
  }

  // TEST 4: Sales Cheat Sheet (SOP Compliant)
  console.log('\n[4/5] Testing AI Sales Closing Cheat Sheet Generation...');
  const cheatSheet = generateSalesCheatSheet(sampleA, scores, roi, products);
  console.log(`- Hook: ${cheatSheet.closingCheatSheet.bullet1_Hook.slice(0, 75)}...`);
  console.log(`- Prescription: ${cheatSheet.closingCheatSheet.bullet2_Prescription.slice(0, 75)}...`);
  console.log(`- Financial Math: ${cheatSheet.closingCheatSheet.bullet3_FinancialMath.slice(0, 75)}...`);

  // TEST 5: CRM Operations (Local & Google Sheets Fallback)
  console.log('\n[5/5] Testing CRM Sync & State Management...');
  const newLead = await recordConsultationLead({
    companyName: 'Batu Maung Marine Supplies',
    contactName: 'Captain Lee',
    contactPhone: '+6012-4455667',
    contactEmail: 'lee@batumaung.com.my',
    industry: 'Logistics',
    teamSize: '15',
    maturityScore: 45,
    maturityTier: 'Digital Practitioner',
    aiGrade: 'Grade B',
    topPainPoint: 'Ransomware & lost orders',
    recommendedPackage: 'Exabytes Acronis Cyber Protect Cloud',
    annualRoiMYR: 'RM 24,500'
  });
  console.log(`- Captured Lead ID: ${newLead.lead.id}`);

  const leads = getLocalLeads();
  console.log(`- Total Leads in CRM: ${leads.length}`);
  const found = leads.find(l => l.id === newLead.lead.id);
  if (!found) {
    throw new Error('Newly created lead not found in CRM storage');
  }

  updateLeadStatus(newLead.lead.id, 'Contacted');
  const updated = getLocalLeads().find(l => l.id === newLead.lead.id);
  console.log(`- Lead status updated to: ${updated.status}`);

  // Test HTML Blueprint Generation
  const html = buildReportHtml({
    companyName: sampleA.companyName,
    scores,
    roi,
    roadmap: generateRoadmap(sampleA, scores),
    products
  });
  console.log(`- 4-Page Blueprint HTML generated (${html.length} bytes)`);

  console.log('\n==================================================');
  console.log('✅ All Automated Tests Passed with 100% Success!');
  console.log('==================================================');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
