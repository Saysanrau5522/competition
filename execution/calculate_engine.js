/**
 * Layer 3: Deterministic Calculation Engine + Gemini AI Augmentation
 * Responsible for Digital Maturity Index (0-100), AI Readiness,
 * Malaysian Economic ROI Formulas, Exabytes Product Mapping,
 * and AI-Powered Dynamic Question Generation.
 */

const MALAYSIAN_BENCHMARKS = {
  ADMIN_HOURLY_RATE_MYR: 25.0, // Avg SME admin/clerical rate in Malaysia (RM25/hr)
  OWNER_HOURLY_RATE_MYR: 60.0, // Business owner/manager hourly rate
  WEEKS_PER_YEAR: 52,
  TECH_EFFICIENCY_FACTOR: 0.70, // Tech automation eliminates ~70% of repetitive task time
  LEAD_RECOVERY_RATE: 0.25, // Lead recovery factor with instant digital/AI response
  AVG_TICKET_SIZE_MYR: 350.0 // Baseline average transaction value for Malaysian SMEs
};

/**
 * Calculates 6-pillar digital maturity scores (0-100 aggregate)
 */
function calculateMaturityScores(data = {}) {
  const tools = Array.isArray(data.currentTools) ? data.currentTools : [];
  const bottleneck = data.bottleneck || '';
  
  // 1. Web & Digital Presence (Max 20)
  let webScore = 5;
  if (tools.includes('custom_domain') || tools.includes('ecommerce_site')) {
    webScore = 18;
  } else if (tools.includes('basic_website') || tools.includes('social_page')) {
    webScore = 11;
  }
  if (tools.includes('business_email')) {
    webScore = Math.min(20, webScore + 2);
  }

  // 2. Cloud Infrastructure & Storage (Max 20)
  let cloudScore = 4;
  if (tools.includes('automated_cloud_backup')) {
    cloudScore = 20;
  } else if (tools.includes('google_drive') || tools.includes('cloud_storage')) {
    cloudScore = 12;
  } else if (tools.includes('external_hard_drive')) {
    cloudScore = 6;
  }

  // 3. CRM & Customer Tracking (Max 15)
  let crmScore = 3;
  if (tools.includes('cloud_crm')) {
    crmScore = 15;
  } else if (tools.includes('excel_sheets')) {
    crmScore = 7;
  } else if (tools.includes('whatsapp_only')) {
    crmScore = 4;
  }

  // 4. Marketing & Automation (Max 15)
  let mktgScore = 3;
  if (tools.includes('marketing_automation') || tools.includes('email_newsletter')) {
    mktgScore = 14;
  } else if (tools.includes('meta_ads') || tools.includes('social_page')) {
    mktgScore = 8;
  }

  // 5. Cybersecurity & Compliance (Max 15)
  let secScore = 3;
  if (tools.includes('acronis_security') || tools.includes('enterprise_av')) {
    secScore = 15;
  } else if (tools.includes('free_antivirus') || tools.includes('ssl_active')) {
    secScore = 7;
  }

  // 6. AI Readiness & Process Agility (Max 15)
  let aiScore = 3;
  if (tools.includes('ai_tools_copilot')) {
    aiScore = 13;
  } else if (tools.includes('chatgpt_ad_hoc')) {
    aiScore = 7;
  }

  // Deductions if specific bottlenecks exist
  if (bottleneck.includes('data_loss')) {
    cloudScore = Math.max(3, cloudScore - 4);
    secScore = Math.max(3, secScore - 4);
  }
  if (bottleneck.includes('manual_inquiries') || bottleneck.includes('missed_leads')) {
    crmScore = Math.max(2, crmScore - 3);
  }

  const totalScore = Math.min(100, Math.max(10, Math.round(webScore + cloudScore + crmScore + mktgScore + secScore + aiScore)));

  // Tier classification
  let tier = 'Digital Novice';
  let tierColor = '#ef4444';
  let tierSummary = 'High vulnerability & manual dependencies. Urgent need to stabilize foundational cloud & digital assets.';

  if (totalScore >= 80) {
    tier = 'Digital Leader';
    tierColor = '#10b981';
    tierSummary = 'Advanced digital setup. Primed for end-to-end AI automation and scaled infrastructure optimization.';
  } else if (totalScore >= 60) {
    tier = 'Digital Accelerator';
    tierColor = '#00d2ff';
    tierSummary = 'Strong operational base. Focus should be on 24/7 AI lead capture and eliminating remaining manual friction.';
  } else if (totalScore >= 35) {
    tier = 'Digital Practitioner';
    tierColor = '#f59e0b';
    tierSummary = 'Moderate tool adoption with siloed processes. Needs centralized CRM, backup automation, and lead capture.';
  }

  // AI Readiness Index (Grade A-D)
  let aiGrade = 'C (Developing)';
  if (totalScore >= 75 && tools.includes('cloud_storage')) {
    aiGrade = 'A (Prime Candidate)';
  } else if (totalScore >= 50) {
    aiGrade = 'B (Ready for Copilots)';
  } else if (totalScore < 30) {
    aiGrade = 'D (Foundational Setup Needed First)';
  }

  return {
    totalScore,
    tier,
    tierColor,
    tierSummary,
    aiGrade,
    breakdown: {
      webScore,
      cloudScore,
      crmScore,
      mktgScore,
      secScore,
      aiScore
    },
    radarLabels: [
      'Web Presence',
      'Cloud & Backup',
      'CRM Tracking',
      'Marketing Automation',
      'Cybersecurity',
      'AI Readiness'
    ],
    radarValues: [
      Math.round((webScore / 20) * 100),
      Math.round((cloudScore / 20) * 100),
      Math.round((crmScore / 15) * 100),
      Math.round((mktgScore / 15) * 100),
      Math.round((secScore / 15) * 100),
      Math.round((aiScore / 15) * 100)
    ]
  };
}

/**
 * Deterministically calculates financial ROI in Ringgit Malaysia (MYR)
 */
function calculateFinancialROI(data = {}) {
  const weeklyWastedHours = parseFloat(data.hoursWasted) || 12;
  const estimatedMonthlyInquiries = parseInt(data.monthlyInquiries, 10) || 30;

  // 1. Direct Administrative Hours Recovered
  const annualHoursSaved = Math.round(weeklyWastedHours * MALAYSIAN_BENCHMARKS.TECH_EFFICIENCY_FACTOR * MALAYSIAN_BENCHMARKS.WEEKS_PER_YEAR);
  const annualAdminCashSaved = Math.round(annualHoursSaved * MALAYSIAN_BENCHMARKS.ADMIN_HOURLY_RATE_MYR);

  // 2. Revenue Leakage Recovered
  const monthlyRecoveredDeals = Math.max(1, Math.round(estimatedMonthlyInquiries * MALAYSIAN_BENCHMARKS.LEAD_RECOVERY_RATE * 0.20));
  const annualRevenueRecovered = Math.round(monthlyRecoveredDeals * MALAYSIAN_BENCHMARKS.AVG_TICKET_SIZE_MYR * 12);

  // 3. Exabytes Annual Investment benchmark
  const exabytesAnnualInvestment = 1480; 

  // 4. Combined Net Economic Value
  const totalAnnualBenefit = annualAdminCashSaved + annualRevenueRecovered;
  const netProfitGain = totalAnnualBenefit - exabytesAnnualInvestment;
  const roiMultiple = parseFloat((totalAnnualBenefit / exabytesAnnualInvestment).toFixed(1));
  const paybackPeriodDays = Math.round((exabytesAnnualInvestment / (totalAnnualBenefit / 365)));

  return {
    weeklyWastedHours,
    annualHoursSaved,
    annualAdminCashSaved,
    annualRevenueRecovered,
    exabytesAnnualInvestment,
    totalAnnualBenefit,
    netProfitGain,
    roiMultiple,
    paybackPeriodDays: Math.min(paybackPeriodDays > 0 ? paybackPeriodDays : 14, 45),
    hourlyRateBenchmark: MALAYSIAN_BENCHMARKS.ADMIN_HOURLY_RATE_MYR,
    formatted: {
      annualHoursSaved: `${annualHoursSaved.toLocaleString()} hrs`,
      annualAdminCashSaved: `RM ${annualAdminCashSaved.toLocaleString()}`,
      annualRevenueRecovered: `RM ${annualRevenueRecovered.toLocaleString()}`,
      totalAnnualBenefit: `RM ${totalAnnualBenefit.toLocaleString()}`,
      netProfitGain: `RM ${netProfitGain.toLocaleString()}`,
      roiMultiple: `${roiMultiple}x`,
      paybackPeriod: `${Math.min(paybackPeriodDays > 0 ? paybackPeriodDays : 14, 45)} days`
    }
  };
}

/**
 * Maps gaps to Exabytes official products
 */
function mapExabytesProducts(data = {}, maturityScores = {}) {
  const tools = Array.isArray(data.currentTools) ? data.currentTools : [];
  const bottleneck = data.bottleneck || '';
  const products = [];

  // Product 1: Professional Email
  if (!tools.includes('business_email')) {
    products.push({
      id: 'exabytes-email',
      name: 'Exabytes EBiz Pro Business Email',
      tagline: 'Professional @yourcompany.com.my Branding with 99.9% Uptime',
      category: 'Core Infrastructure',
      priority: 'Phase 1 - Immediate',
      priceMYR: 'RM 9.90 / user / month',
      annualEstMYR: 297,
      benefits: [
        'Builds enterprise trust with corporate clients & banks',
        'Eliminates spam filtering of critical client invoices',
        'Direct Malaysian 24x7 phone & WhatsApp priority support'
      ]
    });
  }

  // Product 2: Web Presence / AI Website Builder
  if (!tools.includes('custom_domain') || !tools.includes('ecommerce_site') || bottleneck.includes('online_presence')) {
    products.push({
      id: 'exabytes-web',
      name: 'Exabytes AI Website Builder & Managed WordPress',
      tagline: 'High-Converting Digital Storefront with Built-in Malaysian Payment Gateways',
      category: 'Digital Storefront',
      priority: 'Phase 1 - Immediate',
      priceMYR: 'RM 29.90 / month',
      annualEstMYR: 358,
      benefits: [
        'AI generates custom Malaysian layout & copy in under 60 seconds',
        'Integrated with FPX, Touch n Go eWallet, and GrabPay',
        'Ultra-fast SSD hosting in Cyberjaya Tier-3 Data Center'
      ]
    });
  }

  // Product 3: Acronis Cloud Backup
  if (!tools.includes('automated_cloud_backup') || bottleneck.includes('data_loss')) {
    products.push({
      id: 'exabytes-backup',
      name: 'Exabytes Acronis Cyber Protect Cloud',
      tagline: 'Automated Off-site Daily Backup & Active Ransomware Neutralizer',
      category: 'Cyber Resilience & Compliance',
      priority: 'Phase 1 - Immediate',
      priceMYR: 'RM 39.00 / month',
      annualEstMYR: 468,
      benefits: [
        '100% compliance with Malaysian Personal Data Protection Act (PDPA)',
        'Zero-downtime 1-click snapshot restore if hardware fails',
        'Military-grade AES-256 cloud encryption'
      ]
    });
  }

  // Product 4: CRM & AI Inbound Chatbot
  if (!tools.includes('cloud_crm') || bottleneck.includes('manual_inquiries') || bottleneck.includes('missed_leads')) {
    products.push({
      id: 'exabytes-crm-ai',
      name: 'Exabytes Conversational AI Lead Engine & Cloud CRM',
      tagline: '24/7 WhatsApp & Web AI Assistant That Converts Visitors into Sales Deals',
      category: 'Growth & Automation',
      priority: 'Phase 2 - Operational Productivity',
      priceMYR: 'RM 149.00 / month',
      annualEstMYR: 1788,
      benefits: [
        'Instant response in English, Bahasa Melayu, and Mandarin',
        'Automatically qualifies customer budget and syncs directly into CRM',
        'Recovers up to 25% of after-hours leads that competitors miss'
      ]
    });
  }

  // Product 5: Cloud Server VPS
  if (parseInt(data.teamSize, 10) > 10 || tools.includes('database_heavy')) {
    products.push({
      id: 'exabytes-vps',
      name: 'Exabytes Enterprise Cloud SSD VPS',
      tagline: 'Dedicated Virtual Infrastructure with Guaranteed Resources',
      category: 'Cloud Scaling',
      priority: 'Phase 3 - Scale',
      priceMYR: 'RM 89.00 / month',
      annualEstMYR: 1068,
      benefits: [
        'Sub-50ms latency across Peninsular and East Malaysia',
        'Scalable CPU and RAM as your inventory or ERP expands',
        'Full root access and managed server monitoring'
      ]
    });
  }

  return products.slice(0, 4);
}

/**
 * Generates the 3-Phase 12-Month Strategic Transformation Roadmap
 */
function generateRoadmap(data = {}, scores = {}) {
  const companyName = data.companyName || 'Your Business';

  return [
    {
      phase: 'Phase 1',
      title: 'Quick Wins & Digital Stability',
      timeline: 'Months 1 – 3',
      badgeColor: '#00d2ff',
      focus: 'Eliminate foundational data risk, upgrade brand perception, and launch lead capture.',
      keyMilestones: [
        'Deploy Exabytes EBiz Pro email addresses (@' + (data.companyName ? data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '') : 'company') + '.com.my)',
        'Launch mobile-optimized digital storefront with SSL and WhatsApp direct inquiry buttons',
        'Activate Exabytes Acronis automated cloud backups for critical accounting and operations databases'
      ],
      expectedOutcome: 'Zero data loss vulnerability; 100% professional client touchpoint credibility.'
    },
    {
      phase: 'Phase 2',
      title: 'Operational Productivity & CRM',
      timeline: 'Months 3 – 6',
      badgeColor: '#f59e0b',
      focus: 'Centralize fragmented communications and streamline repetitive team administration.',
      keyMilestones: [
        'Migrate manual Excel/paper prospect logs to centralized Cloud CRM',
        'Integrate multi-agent WhatsApp Web inbox for synchronized sales follow-ups',
        'Deploy automated quotation dispatch and digital payment confirmation workflows'
      ],
      expectedOutcome: `Reclaim ~${Math.round((parseFloat(data.hoursWasted) || 12) * 0.7)} hours/week of team administrative overhead.`
    },
    {
      phase: 'Phase 3',
      title: 'Automated Scaled AI Growth',
      timeline: 'Months 6 – 12',
      badgeColor: '#10b981',
      focus: 'Deploy 24/7 conversational AI agents and predictive customer re-engagement funnels.',
      keyMilestones: [
        'Embed Exabytes AI Chatbot trained on catalog FAQs for 24/7 lead qualification',
        'Activate automated customer reactivation campaigns (SMS / WhatsApp / Email)',
        'Scale cloud compute resources on Exabytes Cloud VPS as web traffic surges'
      ],
      expectedOutcome: 'Achieve estimated 25% lift in inbound deal conversion without hiring additional staff.'
    }
  ];
}

/**
 * Rule-based fallback for dynamic follow-up question
 */
function getDynamicFollowUpQuestion(params = {}) {
  const industry = params.industry || 'general';

  if (industry.includes('retail') || industry.includes('ecommerce')) {
    return {
      questionId: 'retail_orders',
      title: 'How are customer orders and inventory currently tracked across your channels?',
      subtitle: 'Malaysian retailers often lose up to 15 hours/week synchronizing WhatsApp messages with physical stock.',
      options: [
        { label: 'Mostly manual paper receipts & WhatsApp text messages', value: 'manual_whatsapp', hoursImpact: 16 },
        { label: 'Excel spreadsheets updated at the end of each day', value: 'excel_daily', hoursImpact: 10 },
        { label: 'Standalone POS system not connected to our online store', value: 'offline_pos', hoursImpact: 7 },
        { label: 'Integrated cloud e-commerce & inventory management', value: 'cloud_integrated', hoursImpact: 2 }
      ]
    };
  }

  if (industry.includes('services') || industry.includes('consulting')) {
    return {
      questionId: 'services_followup',
      title: 'How long does it typically take from client inquiry to sending an official quotation?',
      subtitle: 'In B2B services, 50% of Malaysian buyers choose the first vendor that delivers a formal proposal.',
      options: [
        { label: 'Over 24 to 48 hours (manual typing and pricing checks)', value: 'slow_quote', hoursImpact: 14 },
        { label: 'Same day (around 4 - 8 hours via manual templates)', value: 'sameday_quote', hoursImpact: 8 },
        { label: 'Within 1 - 2 hours using semi-automated templates', value: 'fast_quote', hoursImpact: 4 },
        { label: 'Instant automated proposal delivery', value: 'automated_quote', hoursImpact: 1 }
      ]
    };
  }

  if (industry.includes('fnb') || industry.includes('hospitality')) {
    return {
      questionId: 'fnb_crm',
      title: 'Do you systematically capture customer contact info for repeat visits or promotions?',
      subtitle: 'Sustained F&B profitability relies heavily on automated digital loyalty and direct remarketing.',
      options: [
        { label: 'No customer database captured; walk-ins only', value: 'no_crm', hoursImpact: 12 },
        { label: 'Occasional manual name/phone lists in notebooks', value: 'paper_crm', hoursImpact: 9 },
        { label: 'Third-party delivery apps (Grab/Foodpanda) without direct data ownership', value: 'thirdparty_only', hoursImpact: 6 },
        { label: 'Owned digital membership / automated WhatsApp loyalty club', value: 'owned_loyalty', hoursImpact: 2 }
      ]
    };
  }

  if (industry.includes('manufacturing') || industry.includes('logistics')) {
    return {
      questionId: 'mfg_continuity',
      title: 'If your primary on-premise computer or server suffered a ransomware attack or failure today, how would you recover?',
      subtitle: 'Over 68% of Malaysian SMEs lose critical records permanently without certified cloud backup.',
      options: [
        { label: 'No backup exists; recovery would be catastrophic', value: 'no_backup', hoursImpact: 20 },
        { label: 'Manual weekly backup to an external USB drive kept on-site', value: 'usb_manual', hoursImpact: 10 },
        { label: 'Personal Google Drive/Dropbox folder managed manually', value: 'cloud_folder', hoursImpact: 6 },
        { label: 'Automated daily cloud snapshot with immutable ransomware defense', value: 'acronis_active', hoursImpact: 1 }
      ]
    };
  }

  return {
    questionId: 'general_inquiries',
    title: 'Approximately how many inquiries or quote requests does your team handle each week?',
    subtitle: 'This allows our calculation engine to project your exact administrative recovery in Ringgit Malaysia.',
    options: [
      { label: '10 to 30 inquiries / week (mostly manual follow-ups)', value: 'inquiries_low', hoursImpact: 8 },
      { label: '30 to 80 inquiries / week (high manual workload)', value: 'inquiries_med', hoursImpact: 14 },
      { label: '80+ inquiries / week (team struggles to respond on time)', value: 'inquiries_high', hoursImpact: 22 },
      { label: 'Low inquiry volume; seeking inbound growth systems', value: 'seeking_leads', hoursImpact: 5 }
    ]
  };
}

/**
 * AI-Augmented dynamic follow-up question generator using Gemini 3.6 Flash
 * Falls back cleanly to getDynamicFollowUpQuestion if API is unavailable
 */
async function generateAiDynamicQuestion(params = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const fallback = getDynamicFollowUpQuestion(params);

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return fallback;
  }

  try {
    const prompt = `You are the lead SME Digital Transformation Architect at Exabytes Malaysia.
An SME user is completing our Digital Maturity Diagnostic. Here is their profile:
- Company Name: ${params.companyName || 'Malaysian SME'}
- Industry Sector: ${params.industry || 'General Business'}
- Employee Headcount: ${params.teamSize || '5 - 15 employees'}
- Primary Bottleneck: ${params.bottleneck || 'Manual administrative overhead'}
- Weekly Hours Wasted: ${params.hoursWasted || 12} hrs/week

Generate exactly 1 high-impact dynamic follow-up question with 4 realistic multiple-choice options to quantify their operational inefficiency.
Focus on Malaysian business realities (e.g. WhatsApp reliance, paper invoices, SST/invoicing delays, PDPA data loss).

Output strictly valid JSON with this exact schema:
{
  "questionId": "string",
  "title": "Clear, engaging question string",
  "subtitle": "Short 1-sentence explanation of why this matters for Malaysian SME profitability",
  "options": [
    { "label": "Option 1 description", "value": "opt_1", "hoursImpact": 16 },
    { "label": "Option 2 description", "value": "opt_2", "hoursImpact": 10 },
    { "label": "Option 3 description", "value": "opt_3", "hoursImpact": 5 },
    { "label": "Option 4 description", "value": "opt_4", "hoursImpact": 1 }
  ]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (parsed.title && Array.isArray(parsed.options) && parsed.options.length === 4) {
          parsed.aiGenerated = true;
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[AI Question] Gemini call failed, using SOP fallback:', err.message);
  }

  return fallback;
}

/**
 * Generates the deterministic Sales Closing Script Cheat Sheet for Exabytes Consultants
 */
function generateSalesCheatSheet(data = {}, scores = {}, roi = {}, products = []) {
  const companyName = data.companyName || 'the prospect';
  const ownerName = data.contactName || 'there';
  const hours = roi.weeklyWastedHours || 12;
  const cashSaved = roi.formatted ? roi.formatted.annualAdminCashSaved : 'RM 10,000+';
  const topProduct = products[0] || { name: 'Exabytes Cloud Starter', priceMYR: 'RM 29.90/mo' };

  const bullet1_Hook = `Acknowledge context: "Hi ${ownerName}, I reviewed your diagnostic for ${companyName}. I noticed your team is currently dedicating ~${hours} hours every week battling ${data.bottleneck || 'manual operational bottlenecks'}, which is typical for ${data.industry || 'Malaysian SMEs'} at your stage."`;

  const bullet2_Prescription = `Phase 1 Quick Win: "Rather than an overwhelming IT overhaul, our data shows immediate ROI by deploying ${topProduct.name} (${topProduct.priceMYR}). This directly automates your immediate workflow friction in under 7 business days."`;

  const bullet3_FinancialMath = `Close with hard numbers: "Reclaiming those ${hours} wasted hours yields an estimated ${cashSaved} in recovered administrative capacity per year. The investment is under RM ${(roi.exabytesAnnualInvestment || 1480).toLocaleString()}/year, paying for itself in approximately ${roi.formatted ? roi.formatted.paybackPeriod : '2-3 weeks'}."`;

  return {
    leadSummary: {
      companyName,
      contactName: data.contactName || 'N/A',
      contactPhone: data.contactPhone || 'N/A',
      contactEmail: data.contactEmail || 'N/A',
      industry: data.industry || 'SME',
      teamSize: data.teamSize || '1-10',
      totalMaturityScore: scores.totalScore,
      aiGrade: scores.aiGrade,
      annualBenefitMYR: roi.formatted ? roi.formatted.totalAnnualBenefit : 'RM 15,000'
    },
    primaryPitchProduct: topProduct,
    closingCheatSheet: {
      bullet1_Hook,
      bullet2_Prescription,
      bullet3_FinancialMath
    },
    objectionHandling: [
      {
        objection: '"We don\'t have budget for new software this quarter."',
        rebuttal: `"We start with Phase 1 at ${topProduct.priceMYR}. You aren't spending new capital; you are reallocating a fraction of the ${cashSaved} currently lost to manual time waste."`
      },
      {
        objection: '"My staff are not technical enough."',
        rebuttal: '"Exabytes provides full Malaysian localized onboarding in English, Malay, and Mandarin with 24x7 phone support so your team has zero learning curve."'
      }
    ]
  };
}

module.exports = {
  MALAYSIAN_BENCHMARKS,
  calculateMaturityScores,
  calculateFinancialROI,
  mapExabytesProducts,
  generateRoadmap,
  getDynamicFollowUpQuestion,
  generateAiDynamicQuestion,
  generateSalesCheatSheet
};
