/**
 * Clean standalone executive blueprint HTML template
 * Zero native dependencies - safe for Cloudflare Edge & Node
 */

function buildReportHtml(reportData = {}) {
  const data = reportData || {};
  const companyName = data.companyName || 'Malaysian SME Enterprise';
  const contactName = data.contactName || 'Business Owner';
  const contactEmail = data.contactEmail || 'contact@sme.com.my';
  const industry = data.industry || 'General SME';
  const teamSize = data.teamSize || '5-15 Employees';

  const scores = data.scores || {};
  const totalScore = (typeof scores.totalScore === 'number') ? scores.totalScore : 42;
  const tier = scores.tier || 'Digital Practitioner';
  const aiGrade = scores.aiGrade || 'B';
  const tierSummary = scores.tierSummary || 'Business possesses core digital capabilities and is well-positioned for AI-assisted workflow automation.';
  const breakdown = scores.breakdown || {};

  const roi = data.roi || {};
  const roiFormatted = roi.formatted || {};
  const weeklyWastedHours = roi.weeklyWastedHours || data.hoursWasted || 12;

  const rawRoadmap = Array.isArray(data.roadmap) ? data.roadmap : [];
  const roadmap = rawRoadmap.length > 0 ? rawRoadmap : [
    {
      phase: 'Phase 1',
      title: 'Foundation & Immediate Quick Wins',
      timeline: 'Days 1–30',
      focus: 'Eliminate foundational data risk and launch lead capture.',
      keyMilestones: [
        'Deploy enterprise business email with branded domain',
        'Activate Acronis automated cloud backups for critical databases',
        'Launch mobile-optimized contact points with instant messaging'
      ],
      expectedOutcome: 'Zero data loss vulnerability and 100% professional credibility.'
    },
    {
      phase: 'Phase 2',
      title: 'Workflow Automation & CRM',
      timeline: 'Days 31–90',
      focus: 'Centralize prospect records and streamline quote dispatch.',
      keyMilestones: [
        'Migrate manual prospect spreadsheets to unified Cloud CRM',
        'Integrate multi-agent synchronized sales follow-ups',
        'Deploy automated quotation dispatch workflows'
      ],
      expectedOutcome: `Reclaim ~${Math.round((parseFloat(weeklyWastedHours) || 12) * 0.7)} hours/week of administrative overhead.`
    },
    {
      phase: 'Phase 3',
      title: 'AI Copilot Integration & Scaled Growth',
      timeline: 'Days 91–180',
      focus: 'Deploy 24/7 conversational AI agents and predictive re-engagement.',
      keyMilestones: [
        'Embed AI Chatbot trained on catalog FAQs for 24/7 lead qualification',
        'Activate automated customer reactivation campaigns',
        'Scale cloud compute resources as traffic surges'
      ],
      expectedOutcome: 'Achieve estimated 25% lift in deal conversion without additional staff.'
    }
  ];

  const rawProducts = Array.isArray(data.products) ? data.products : [];
  const products = rawProducts.length > 0 ? rawProducts : [
    {
      priority: 'Priority 1',
      name: 'Exabytes EBiz Pro Business Email',
      tagline: 'Enterprise domain email & collaborative cloud suite',
      category: 'Digital Identity',
      priceMYR: 'RM 9.90 / user / mo'
    },
    {
      priority: 'Priority 2',
      name: 'Exabytes Acronis Cyber Protect Cloud',
      tagline: 'Automated disk backup with ransomware defense',
      category: 'Cloud Security',
      priceMYR: 'RM 89.00 / month'
    }
  ];

  const generatedDate = new Date().toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Exabytes SME Digital Transformation Blueprint - ${companyName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
      color: #1e293b;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
    }

    h1, h2, h3, h4 {
      font-family: 'Outfit', sans-serif;
      margin-top: 0;
      color: #0b1528;
    }

    .page {
      width: 210mm;
      height: 297mm;
      padding: 24mm 22mm;
      position: relative;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
      background: #ffffff;
    }

    @media print {
      .screen-bar { display: none !important; }
      body { background: #ffffff !important; }
      .page { box-shadow: none !important; margin: 0 !important; width: 100% !important; height: 100% !important; }
    }

    @media screen {
      body { background: #0f172a; padding-bottom: 50px; }
      .page { margin: 25px auto; box-shadow: 0 15px 35px rgba(0,0,0,0.3); border-radius: 4px; }
      .screen-bar {
        position: sticky;
        top: 0;
        z-index: 99999;
        background: #1e293b;
        color: #ffffff;
        padding: 14px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      .btn-bar-print {
        background: linear-gradient(135deg, #00d2ff, #0088cc);
        color: #0b1528;
        font-weight: 700;
        border: none;
        padding: 9px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        transition: transform 0.2s;
      }
      .btn-bar-print:hover {
        transform: scale(1.03);
      }
    }

    /* Page Header & Footer */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 24px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-logo svg {
      width: 28px;
      height: 28px;
    }

    .brand-logo span {
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 18px;
      color: #0066cc;
      letter-spacing: -0.5px;
    }

    .brand-logo span b {
      color: #00d2ff;
    }

    .header-doc-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      font-weight: 600;
    }

    .page-footer {
      position: absolute;
      bottom: 16mm;
      left: 22mm;
      right: 22mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }

    /* PAGE 1: COVER */
    .cover-page {
      background: linear-gradient(135deg, #070e1c 0%, #0d1e38 60%, #003366 100%);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 32mm 24mm;
    }

    .cover-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cover-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(0, 210, 255, 0.15);
      border: 1px solid #00d2ff;
      color: #00d2ff;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .cover-main {
      margin: auto 0;
    }

    .cover-title {
      font-size: 34px;
      font-weight: 800;
      line-height: 1.2;
      color: #ffffff;
      margin-bottom: 16px;
    }

    .cover-title span {
      background: linear-gradient(90deg, #00d2ff, #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-subtitle {
      font-size: 15px;
      color: #94a3b8;
      max-width: 500px;
      line-height: 1.6;
      margin-bottom: 28px;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
    }

    .meta-box label {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #00d2ff;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .meta-box value {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
    }

    .cover-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 11px;
      color: #64748b;
    }

    /* PAGE 2: DIAGNOSTIC & MATURITY */
    .score-banner {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      align-items: center;
    }

    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: #0b1528;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(0,0,0,0.1);
      border: 4px solid #00d2ff;
    }

    .score-number {
      font-size: 38px;
      font-weight: 800;
      line-height: 1;
      font-family: 'Outfit', sans-serif;
      color: #00d2ff;
    }

    .score-scale {
      font-size: 10px;
      color: #94a3b8;
    }

    .score-details h3 {
      font-size: 18px;
      margin-bottom: 6px;
      color: #0f172a;
    }

    .tag-tier {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 8px;
      background: #e0f2fe;
      color: #0284c7;
    }

    .pillars-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      margin-bottom: 24px;
    }

    .pillar-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      background: #ffffff;
    }

    .pillar-card-header {
      display: flex;
      justify-content: space-between;
      font-weight: 600;
      font-size: 12px;
      margin-bottom: 6px;
    }

    .pillar-bar {
      height: 8px;
      background: #f1f5f9;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .pillar-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #0066cc, #00d2ff);
      border-radius: 4px;
    }

    .pillar-desc {
      font-size: 11px;
      color: #64748b;
    }

    /* PAGE 3: 12-MONTH ROADMAP */
    .timeline-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .timeline-phase {
      border-left: 4px solid #0066cc;
      padding-left: 18px;
      position: relative;
    }

    .phase-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 4px;
      background: #0066cc;
      color: #ffffff;
      display: inline-block;
      margin-bottom: 4px;
    }

    .phase-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .phase-meta {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 10px;
    }

    .milestone-list {
      margin: 0;
      padding-left: 18px;
      font-size: 12px;
      color: #334155;
    }

    .milestone-list li {
      margin-bottom: 6px;
    }

    .phase-outcome {
      background: #f8fafc;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 11px;
      color: #0f766e;
      font-weight: 600;
      margin-top: 8px;
    }

    /* PAGE 4: FINANCIAL ROI & EXABYTES SOLUTIONS */
    .roi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .roi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      text-align: center;
    }

    .roi-card-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .roi-card-val {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      font-family: 'Outfit', sans-serif;
    }

    .roi-card-val.highlight {
      color: #10b981;
    }

    .products-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 11px;
    }

    .products-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
    }

    .products-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }

    .products-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    .product-priority {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      background: #dbeafe;
      color: #1e40af;
    }

    .advisor-cta-box {
      background: linear-gradient(135deg, #0b1528, #1e3a8a);
      color: #ffffff;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .advisor-cta-text h4 {
      color: #ffffff;
      font-size: 16px;
      margin-bottom: 4px;
    }

    .advisor-cta-text p {
      margin: 0;
      color: #cbd5e1;
      font-size: 11px;
    }

    .advisor-contact-info {
      text-align: right;
      font-size: 11px;
      color: #00d2ff;
      font-weight: 600;
    }
  </style>
</head>
<body>

  <!-- Sticky Top Screen Bar with Instant Print / Save as PDF Button -->
  <div class="screen-bar">
    <div style="font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 600; color: #ffffff;">
      🏢 Exabytes Transformation Blueprint — <strong>${companyName}</strong>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="btn-bar-print" onclick="window.print()">🖨️ Print / Save as PDF (Ctrl + P)</button>
    </div>
  </div>

  <!-- PAGE 1: COVER -->
  <div class="page cover-page">
    <div class="cover-top">
      <div class="brand-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="#00d2ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
        <span style="color:#ffffff;">EXABYTES <b>MALAYSIA</b></span>
      </div>
      <div class="cover-badge">Confidential Executive Report</div>
    </div>

    <div class="cover-main">
      <div class="cover-title">
        SME Digital & AI<br>
        <span>Transformation Blueprint</span>
      </div>
      <div class="cover-subtitle">
        A deterministic operational roadmap and Malaysian economic ROI analysis engineered to accelerate digital maturity and automate business workflows.
      </div>

      <div class="cover-meta-grid">
        <div class="meta-box">
          <label>Prepared For</label>
          <value>${companyName}</value>
        </div>
        <div class="meta-box">
          <label>Industry Sector</label>
          <value>${industry}</value>
        </div>
        <div class="meta-box">
          <label>Organization Size</label>
          <value>${teamSize}</value>
        </div>
        <div class="meta-box">
          <label>Assessment Date</label>
          <value>${generatedDate}</value>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>Exabytes Network Sdn Bhd (HQ: Penang & Cyberjaya)</div>
      <div>Document Ref: EXA-BP-${Math.floor(100000 + Math.random() * 900000)}</div>
    </div>
  </div>

  <!-- PAGE 2: DIAGNOSTIC & MATURITY -->
  <div class="page">
    <div class="page-header">
      <div class="brand-logo">
        <span>EXABYTES <b>ADVISOR</b></span>
      </div>
      <div class="header-doc-title">Section 1: Digital Maturity Index</div>
    </div>

    <h2>Operational Diagnostic & Maturity Breakdown</h2>
    <p style="color:#64748b; margin-bottom: 20px;">
      Based on the operational parameters provided, your enterprise has been benchmarked against Malaysian SME industry baselines across 6 fundamental digital pillars.
    </p>

    <div class="score-banner">
      <div class="score-circle">
        <div class="score-number">${scores.totalScore}</div>
        <div class="score-scale">out of 100</div>
      </div>
      <div class="score-details">
        <div class="tag-tier">${scores.tier}</div>
        <h3>AI Readiness Index: Grade ${scores.aiGrade}</h3>
        <p style="margin: 0; color: #475569; font-size: 12px;">
          ${scores.tierSummary}
        </p>
      </div>
    </div>

    <h3 style="font-size: 15px; margin-bottom: 12px;">Pillar-by-Pillar Benchmark Analysis</h3>
    <div class="pillars-grid">
      <div class="pillar-card">
        <div class="pillar-card-header">
          <span>1. Web & Digital Presence</span>
          <span>${breakdown.webScore || 10} / 20</span>
        </div>
        <div class="pillar-bar">
          <div class="pillar-bar-fill" style="width: ${((breakdown.webScore || 10) / 20) * 100}%;"></div>
        </div>
        <div class="pillar-desc">Branded domain, SSL certification, and conversion-optimized mobile storefront.</div>
      </div>

      <div class="pillar-card">
        <div class="pillar-card-header">
          <span>2. Cloud Infrastructure & Backup</span>
          <span>${breakdown.cloudScore || 10} / 20</span>
        </div>
        <div class="pillar-bar">
          <div class="pillar-bar-fill" style="width: ${((breakdown.cloudScore || 10) / 20) * 100}%;"></div>
        </div>
        <div class="pillar-desc">Automated off-site cloud storage and disaster resilience under PDPA guidelines.</div>
      </div>

      <div class="pillar-card">
        <div class="pillar-card-header">
          <span>3. CRM & Lead Tracking</span>
          <span>${breakdown.crmScore || 7} / 15</span>
        </div>
        <div class="pillar-bar">
          <div class="pillar-bar-fill" style="width: ${((breakdown.crmScore || 7) / 15) * 100}%;"></div>
        </div>
        <div class="pillar-desc">Centralized customer contact ledger and automated follow-up communications.</div>
      </div>

      <div class="pillar-card">
        <div class="pillar-card-header">
          <span>4. Marketing Automation</span>
          <span>${breakdown.mktgScore || 7} / 15</span>
        </div>
        <div class="pillar-bar">
          <div class="pillar-bar-fill" style="width: ${((breakdown.mktgScore || 7) / 15) * 100}%;"></div>
        </div>
        <div class="pillar-desc">Automated promotional newsletters, social scheduling, and prospect nurturing.</div>
      </div>

      <div class="pillar-card">
        <div class="pillar-card-header">
          <span>5. Cybersecurity & Compliance</span>
          <span>${breakdown.secScore || 7} / 15</span>
        </div>
        <div class="pillar-bar">
          <div class="pillar-bar-fill" style="width: ${((breakdown.secScore || 7) / 15) * 100}%;"></div>
        </div>
        <div class="pillar-desc">Active ransomware protection, email spam defense, and encrypted customer data.</div>
      </div>

      <div class="pillar-card">
        <div class="pillar-card-header">
          <span>6. AI Readiness & Process Agility</span>
          <span>${breakdown.aiScore || 7} / 15</span>
        </div>
        <div class="pillar-bar">
          <div class="pillar-bar-fill" style="width: ${((breakdown.aiScore || 7) / 15) * 100}%;"></div>
        </div>
        <div class="pillar-desc">Standardized digital data feeds ready for automated AI copilot ingestion.</div>
      </div>
    </div>

    <div style="background: #eff6ff; border-left: 4px solid #0066cc; padding: 12px 16px; border-radius: 6px; font-size: 11px; color: #1e3a8a;">
      <strong>Strategic Takeaway:</strong> Moving from <em>${tier}</em> to the next bracket requires eliminating manual communication bottlenecks before investing in advanced algorithms.
    </div>

    <div class="page-footer">
      <div>Exabytes SME Digital Growth Advisor</div>
      <div>Page 2 of 4</div>
    </div>
  </div>

  <!-- PAGE 3: 12-MONTH STAGED ROADMAP -->
  <div class="page">
    <div class="page-header">
      <div class="brand-logo">
        <span>EXABYTES <b>ADVISOR</b></span>
      </div>
      <div class="header-doc-title">Section 2: Staged Transformation Roadmap</div>
    </div>

    <h2>12-Month Staged Strategic Roadmap</h2>
    <p style="color:#64748b; margin-bottom: 24px;">
      To prevent capital waste and ensure high employee adoption, technology deployments are sequenced into 3 proven execution phases:
    </p>

    <div class="timeline-container">
      ${roadmap.map((phase, idx) => {
        const milestones = Array.isArray(phase.keyMilestones)
          ? phase.keyMilestones
          : (Array.isArray(phase.deliverables) ? phase.deliverables : []);
        return `
        <div class="timeline-phase" style="border-left-color: ${idx === 0 ? '#0066cc' : idx === 1 ? '#f59e0b' : '#10b981'};">
          <span class="phase-badge" style="background: ${idx === 0 ? '#0066cc' : idx === 1 ? '#f59e0b' : '#10b981'};">${phase.phase || ('Phase ' + (idx + 1))}: ${phase.timeline || ''}</span>
          <div class="phase-title">${phase.title || ''}</div>
          <div class="phase-meta">${phase.focus || ''}</div>
          <ul class="milestone-list">
            ${milestones.map(m => `<li>${m}</li>`).join('')}
          </ul>
          <div class="phase-outcome">
            Target Outcome: ${phase.expectedOutcome || phase.focus || 'Accelerated operational efficiency'}
          </div>
        </div>
      `;}).join('')}
    </div>

    <div class="page-footer">
      <div>Exabytes SME Digital Growth Advisor</div>
      <div>Page 3 of 4</div>
    </div>
  </div>

  <!-- PAGE 4: ROI MATH & EXABYTES SOLUTIONS -->
  <div class="page">
    <div class="page-header">
      <div class="brand-logo">
        <span>EXABYTES <b>ADVISOR</b></span>
      </div>
      <div class="header-doc-title">Section 3: Financial ROI & Solution Packages</div>
    </div>

    <h2>Deterministic Financial ROI & Business Case</h2>
    <p style="color:#64748b; margin-bottom: 18px;">
      All financial metrics below are calculated using localized Malaysian economic baselines (RM 25.00/hr admin wage) against your stated ${weeklyWastedHours} wasted hours/week:
    </p>

    <div class="roi-grid">
      <div class="roi-card">
        <div class="roi-card-label">Annual Admin Hours Saved</div>
        <div class="roi-card-val">${roiFormatted.annualHoursSaved || '437 hrs'}</div>
      </div>
      <div class="roi-card">
        <div class="roi-card-label">Direct Labor Cash Recovered</div>
        <div class="roi-card-val highlight">${roiFormatted.annualAdminCashSaved || 'RM 10,920'}</div>
      </div>
      <div class="roi-card">
        <div class="roi-card-label">12-Month ROI Multiplier</div>
        <div class="roi-card-val highlight">${roiFormatted.roiMultiple || '8.4x'}</div>
      </div>
    </div>

    <h3 style="font-size: 15px; margin-bottom: 10px;">Recommended Exabytes Commercial Solutions</h3>
    <table class="products-table">
      <thead>
        <tr>
          <th>Priority</th>
          <th>Official Solution</th>
          <th>Category</th>
          <th>Starting Rate</th>
        </tr>
      </thead>
      <tbody>
        ${products.map((p, idx) => `
          <tr>
            <td><span class="product-priority">${p.priority || ('Priority ' + (idx + 1))}</span></td>
            <td><strong>${p.name || 'Exabytes Cloud Solution'}</strong><br><span style="color:#64748b; font-size:10px;">${p.tagline || p.tag || (Array.isArray(p.benefits) ? p.benefits.join(' • ') : '')}</span></td>
            <td>${p.category || p.tag || 'Cloud Solutions'}</td>
            <td><strong>${p.priceMYR || 'Custom Quote'}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="advisor-cta-box">
      <div class="advisor-cta-text">
        <h4>Schedule Your Complimentary Strategy Session</h4>
        <p>Your Exabytes Growth Advisor is prepared to review your personalized implementation roadmap.</p>
      </div>
      <div class="advisor-contact-info">
        <div>Call: 1800-88-2282</div>
        <div>Email: sales@exabytes.my</div>
        <div>WhatsApp: +6012-386-8282</div>
      </div>
    </div>

    <div class="page-footer">
      <div>Exabytes SME Digital Growth Advisor • www.exabytes.my</div>
      <div>Page 4 of 4</div>
    </div>
  </div>

</body>
</html>`;
}

/**
 * Renders HTML to PDF buffer using Puppeteer
 * @param {Object} reportData
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateBlueprintPdf(reportData) {
  const htmlContent = buildReportHtml(reportData);

  if (!puppeteer) {
    throw new Error('Puppeteer is not installed in current environment.');
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // Wait brief moment for styles and SVG rendering
    await new Promise(r => setTimeout(r, 500));
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { buildReportHtml };
