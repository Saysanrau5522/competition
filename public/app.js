/**
 * Exabytes AI SME Digital Growth Advisor - Client Application Logic
 */

let currentStep = 1;
const totalSteps = 5;
let cachedEvaluationData = null;
let radarChartInstance = null;
let dynamicAnswerSelected = null;

document.addEventListener('DOMContentLoaded', () => {
  initFormControls();
  initStepNavigation();
  initRangeSlider();
  initActionButtons();
});

/**
 * Initializes form listeners and range slider updates
 */
function initRangeSlider() {
  const rangeInput = document.getElementById('hoursWasted');
  const displayVal = document.getElementById('hoursWastedDisplay');

  if (rangeInput && displayVal) {
    rangeInput.addEventListener('input', (e) => {
      displayVal.textContent = `${e.target.value} hours / week`;
    });
  }
}

/**
 * Initializes step transitions and validation
 */
function initStepNavigation() {
  // Step 1 -> 2
  document.getElementById('btnStep1Next').addEventListener('click', () => {
    const compName = document.getElementById('companyName').value.trim();
    const ind = document.getElementById('industrySector').value;
    if (!compName) {
      showToast('Please enter your Registered Business / Company Name');
      document.getElementById('companyName').focus();
      return;
    }
    if (!ind) {
      showToast('Please select your primary Industry Sector');
      return;
    }
    goToStep(2);
  });

  // Step 2 -> 1 & 2 -> 3
  document.getElementById('btnStep2Prev').addEventListener('click', () => goToStep(1));
  document.getElementById('btnStep2Next').addEventListener('click', () => goToStep(3));

  // Step 3 -> 2 & 3 -> 4 (Triggers dynamic AI follow-up load)
  document.getElementById('btnStep3Prev').addEventListener('click', () => goToStep(2));
  document.getElementById('btnStep3Next').addEventListener('click', async () => {
    await loadDynamicFollowUp();
    goToStep(4);
  });

  // Step 4 -> 3 & 4 -> 5
  document.getElementById('btnStep4Prev').addEventListener('click', () => goToStep(3));
  document.getElementById('btnStep4Next').addEventListener('click', () => {
    if (!dynamicAnswerSelected) {
      showToast('Please select the option that best describes your operations');
      return;
    }
    goToStep(5);
  });

  // Step 5 -> 4
  document.getElementById('btnStep5Prev').addEventListener('click', () => goToStep(4));

  // Step 5 Submit
  document.getElementById('btnSubmitAudit').addEventListener('click', handleAuditSubmission);
}

/**
 * Changes active wizard step and updates progress indicators
 * @param {number} stepNumber
 */
function goToStep(stepNumber) {
  currentStep = stepNumber;

  // Update step elements visibility
  for (let i = 1; i <= totalSteps; i++) {
    const stepEl = document.getElementById(`step${i}`);
    if (stepEl) {
      if (i === currentStep) {
        stepEl.classList.add('active');
      } else {
        stepEl.classList.remove('active');
      }
    }
  }

  // Update progress bar
  const pct = (currentStep / totalSteps) * 100;
  const bar = document.getElementById('progressBarFill');
  const counter = document.getElementById('stepCounter');
  const preview = document.getElementById('stepTitlePreview');

  if (bar) bar.style.width = `${pct}%`;
  if (counter) counter.textContent = `Step ${currentStep} of ${totalSteps}`;

  const stepTitles = [
    'Company Profile',
    'Digital Assets in Use',
    'Operational Bottlenecks',
    'Contextual Assessment',
    'Executive Delivery Details'
  ];
  if (preview) preview.textContent = stepTitles[currentStep - 1];

  // Scroll to card top smoothly
  document.getElementById('wizardSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderDynamicQuestion(q) {
  if (!q || !q.title || !Array.isArray(q.options)) return;
  document.getElementById('dynamicQuestionTitle').textContent = q.title;
  document.getElementById('dynamicQuestionSubtitle').textContent = q.subtitle || 'Operational assessment';

  const container = document.getElementById('dynamicOptionsContainer');
  container.innerHTML = '';
  dynamicAnswerSelected = null;

  q.options.forEach((opt, idx) => {
    const optCard = document.createElement('div');
    optCard.className = 'dynamic-option-card';
    optCard.dataset.value = opt.value;
    optCard.innerHTML = `
      <div class="dynamic-radio"></div>
      <div class="dynamic-text-title">${opt.label}</div>
    `;

    optCard.addEventListener('click', () => {
      document.querySelectorAll('.dynamic-option-card').forEach(c => c.classList.remove('selected'));
      optCard.classList.add('selected');
      dynamicAnswerSelected = opt.value;
    });

    // Select first by default
    if (idx === 0) {
      optCard.classList.add('selected');
      dynamicAnswerSelected = opt.value;
    }

    container.appendChild(optCard);
  });
}

/**
 * Fetches targeted dynamic follow-up question from API with bulletproof fallback
 */
/**
 * Fetches targeted dynamic follow-up question from API with bulletproof fallback
 */
async function loadDynamicFollowUp() {
  const companyName = document.getElementById('companyName')?.value?.trim() || '';
  const industry = document.getElementById('industrySector')?.value || 'general_sme';
  const teamSize = document.getElementById('teamSize')?.value || '8';
  const bottleneck = document.getElementById('primaryBottleneck')?.value || 'manual_inquiries';
  const hoursWasted = document.getElementById('hoursWasted')?.value || '12';

  const fallbackQuestions = {
    retail_ecommerce: {
      title: 'How are customer orders and inventory currently tracked across your sales channels?',
      subtitle: 'Stockouts and manual WhatsApp order entries cost Malaysian retailers an estimated 15+ hours each week.',
      options: [
        { label: 'Mostly manual paper receipts and individual WhatsApp chat confirmations', value: 'manual_whatsapp' },
        { label: 'Excel spreadsheets updated manually at the end of each business day', value: 'excel_daily' },
        { label: 'Standalone retail POS in-store that is not synchronized with our online store', value: 'offline_pos' },
        { label: 'Cloud-synced inventory with instant automated FPX checkout links', value: 'cloud_integrated' }
      ]
    },
    professional_services: {
      title: 'How long does it typically take from initial client inquiry to sending an official proposal or quotation?',
      subtitle: 'In B2B professional services, 50% of Malaysian buyers select the first vendor that delivers a structured quotation.',
      options: [
        { label: 'Over 24 to 48 hours (manual document drafting and partner pricing checks)', value: 'slow_quote' },
        { label: 'Same day (around 4 - 8 hours using manual Word/Excel templates)', value: 'sameday_quote' },
        { label: 'Within 1 - 2 hours using standardized semi-automated template workflows', value: 'fast_quote' },
        { label: 'Instant automated proposal delivery with online acceptance and deposit tracking', value: 'automated_quote' }
      ]
    },
    manufacturing_logistics: {
      title: 'If your primary server or on-premise computer suffered a ransomware attack today, how would you recover?',
      subtitle: 'Over 68% of Malaysian SMEs lose critical CAD/ERP records permanently without immutable cloud backup.',
      options: [
        { label: 'No verified backup exists; recovery would be catastrophic downtime', value: 'no_backup' },
        { label: 'Manual weekly backup to an external USB hard drive kept on-site', value: 'usb_manual' },
        { label: 'Personal Google Drive or Dropbox folder managed ad-hoc by staff', value: 'cloud_folder' },
        { label: 'Automated daily cloud snapshots with active anti-ransomware protection', value: 'acronis_active' }
      ]
    },
    fnb_hospitality: {
      title: 'Do you systematically capture customer contact info for repeat visits, loyalty rewards, or promotions?',
      subtitle: 'Sustained F&B profitability relies heavily on automated digital loyalty and direct customer remarketing.',
      options: [
        { label: 'No customer database captured; 100% dependent on walk-ins and word-of-mouth', value: 'no_crm' },
        { label: 'Occasional manual name/phone lists in notebooks or business card fishbowls', value: 'paper_crm' },
        { label: 'Third-party delivery platforms (Grab/Foodpanda) without direct customer data ownership', value: 'thirdparty_only' },
        { label: 'Owned digital membership and automated WhatsApp VIP loyalty notifications', value: 'owned_loyalty' }
      ]
    },
    healthcare_wellness: {
      title: 'How do you handle patient appointment bookings and confidential medical records under PDPA?',
      subtitle: 'Over 70% of Malaysian private practices still rely on unencrypted desktop folders vulnerable to hardware failure.',
      options: [
        { label: 'Manual phone/WhatsApp bookings and physical paper medical folders', value: 'paper_health' },
        { label: 'Basic spreadsheets with unencrypted desktop folders lacking audit trails', value: 'desktop_health' },
        { label: 'Standalone booking app, but patient consent forms are still kept physically', value: 'hybrid_health' },
        { label: 'Fully digitized practice management system with encrypted cloud backups and SMS reminders', value: 'cloud_health' }
      ]
    },
    construction_engineering: {
      title: 'How does your project team coordinate site progress updates, variation orders, and subcontractor billings?',
      subtitle: 'Disjointed communication between site supervisors and finance creates costly dispute delays.',
      options: [
        { label: 'Scattered personal WhatsApp group chats with paper site receipts and forms', value: 'whatsapp_site' },
        { label: 'End-of-week spreadsheet consolidations leading to delayed claim submissions', value: 'excel_site' },
        { label: 'Cloud shared folders for site photos, but billings are still processed manually', value: 'cloud_folders_site' },
        { label: 'Centralized project cloud portal with real-time milestone tracking and digital sign-offs', value: 'integrated_site' }
      ]
    },
    education_training: {
      title: 'How does your organization capture student inquiries and manage course registrations?',
      subtitle: 'Educational providers lose over 30% of student sign-ups when inquiries are not followed up within 15 minutes.',
      options: [
        { label: 'Manual responses to social media DMs and phone calls during working hours only', value: 'manual_dms' },
        { label: 'Basic Google Forms requiring manual spreadsheet copy-pasting to issue payment details', value: 'forms_manual' },
        { label: 'Website form with email notifications, but follow-up takes 1 to 2 business days', value: 'slow_email' },
        { label: '24/7 automated WhatsApp inquiry bot with instant course brochure delivery and seat booking', value: 'automated_edu' }
      ]
    },
    general_sme: {
      title: 'Approximately how many customer inquiries or quote requests does your team handle each week?',
      subtitle: 'This allows our calculation engine to project your exact administrative recovery in Ringgit Malaysia.',
      options: [
        { label: '10 to 30 inquiries / week (mostly manual WhatsApp/email follow-ups)', value: 'inquiries_low' },
        { label: '30 to 80 inquiries / week (high manual workload consuming staff capacity)', value: 'inquiries_med' },
        { label: '80+ inquiries / week (team regularly struggles to respond before customers go elsewhere)', value: 'inquiries_high' },
        { label: 'Low inquiry volume currently; urgently seeking scalable digital inbound systems', value: 'seeking_leads' }
      ]
    }
  };

  const selectedFallback = fallbackQuestions[industry] || fallbackQuestions.general_sme;

  try {
    const queryParams = new URLSearchParams({
      companyName,
      industry,
      teamSize,
      bottleneck,
      hoursWasted
    });
    const res = await fetch(`/api/diagnostic/follow-up?${queryParams.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.question) {
        renderDynamicQuestion(json.question);
        return;
      }
    }
  } catch (err) {
    console.warn('Error fetching dynamic follow up from API, using instant contextual fallback:', err);
  }

  // Graceful fallback to guarantee the user is NEVER blocked
  renderDynamicQuestion(selectedFallback);
}

/**
 * Handles full assessment submission and renders results
 */
async function handleAuditSubmission() {
  const contactName = document.getElementById('contactName').value.trim();
  const contactPhone = document.getElementById('contactPhone').value.trim();
  const contactEmail = document.getElementById('contactEmail').value.trim();

  if (!contactName || !contactPhone || !contactEmail) {
    showToast('Please fill in all required contact details for your blueprint.');
    return;
  }

  const submitBtn = document.getElementById('btnSubmitAudit');
  const spinner = document.getElementById('submitSpinner');
  const btnText = submitBtn.querySelector('.btn-text');

  // Show loading
  submitBtn.disabled = true;
  spinner.classList.remove('d-none');
  btnText.textContent = 'Analyzing Diagnostic & Calculating ROI...';

  // Gather all form fields
  const checkedTools = Array.from(document.querySelectorAll('input[name="tools"]:checked')).map(cb => cb.value);

  const payload = {
    companyName: document.getElementById('companyName').value.trim(),
    industry: document.getElementById('industrySector').value,
    teamSize: document.getElementById('teamSize').value,
    currentTools: checkedTools,
    bottleneck: document.getElementById('primaryBottleneck').value,
    hoursWasted: document.getElementById('hoursWasted').value,
    monthlyInquiries: document.getElementById('monthlyInquiries').value,
    dynamicFollowUpAnswer: dynamicAnswerSelected,
    contactName,
    contactPhone,
    contactEmail,
    growthGoal: document.getElementById('growthGoal').value
  };

  try {
    const res = await fetch('/api/diagnostic/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (json.success && json.data) {
      cachedEvaluationData = {
        ...payload,
        ...json.data
      };

      // Populate and reveal results
      renderResults(cachedEvaluationData);

      // Hide wizard, show results
      document.getElementById('wizardSection').classList.add('d-none');
      document.getElementById('heroSection').classList.add('d-none');
      const resSection = document.getElementById('resultsSection');
      resSection.classList.remove('d-none');

      resSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast('Transformation Blueprint successfully generated!');
    } else {
      showToast('Evaluation error: ' + (json.error || 'Please try again.'));
    }
  } catch (err) {
    console.error('Submission error:', err);
    showToast('Network error while evaluating. Please try again.');
  } finally {
    submitBtn.disabled = false;
    spinner.classList.add('d-none');
    btnText.textContent = 'Generate My Digital Transformation Blueprint';
  }
}

/**
 * Populates all DOM elements and charts in the results section
 * @param {Object} data
 */
function renderResults(data) {
  const { scores, roi, products, roadmap } = data;

  // Header badges
  document.getElementById('resClientBadge').textContent = `Prepared for: ${data.companyName}`;
  const now = new Date();
  document.getElementById('resDateBadge').textContent = `Generated: ${now.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })}`;

  // Score Dial & Diagnosis
  document.getElementById('resTotalScore').textContent = scores.totalScore;
  const tierTag = document.getElementById('resTierTag');
  tierTag.textContent = scores.tier;
  tierTag.style.borderColor = scores.tierColor || '#00d2ff';
  tierTag.style.color = scores.tierColor || '#00d2ff';

  document.getElementById('resAiGrade').textContent = `AI Readiness: Grade ${scores.aiGrade}`;
  document.getElementById('resTierSummary').textContent = scores.tierSummary;

  // Key metrics bar
  document.getElementById('resWeeklyHours').textContent = `${roi.weeklyWastedHours} hrs/wk`;
  document.getElementById('resTotalBenefit').textContent = roi.formatted.totalAnnualBenefit;
  document.getElementById('resPaybackDays').textContent = roi.formatted.paybackPeriod;

  // ROI Cards
  document.getElementById('resAnnualHours').textContent = roi.formatted.annualHoursSaved;
  document.getElementById('resCashSaved').textContent = roi.formatted.annualAdminCashSaved;
  document.getElementById('resRevenueSaved').textContent = roi.formatted.annualRevenueRecovered;
  document.getElementById('resNetValue').textContent = roi.formatted.totalAnnualBenefit;

  // Render Radar Chart with Chart.js
  renderRadarChart(scores);

  // Render Roadmap Phases
  renderRoadmapTimeline(roadmap);

  // Render Exabytes Solutions
  renderSolutionsGrid(products);
}

/**
 * Initializes or updates Chart.js radar chart
 * @param {Object} scores
 */
function renderRadarChart(scores) {
  const canvas = document.getElementById('maturityRadarChart');
  if (!canvas) return;

  if (radarChartInstance) {
    radarChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  radarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: scores.radarLabels,
      datasets: [
        {
          label: 'Your Maturity Index (%)',
          data: scores.radarValues,
          backgroundColor: 'rgba(0, 210, 255, 0.25)',
          borderColor: '#00d2ff',
          borderWidth: 2.5,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#10b981',
          pointRadius: 4
        },
        {
          label: 'Malaysian SME Benchmark (%)',
          data: [45, 40, 35, 30, 40, 25],
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
          grid: { color: 'rgba(255, 255, 255, 0.08)' },
          pointLabels: {
            color: '#cbd5e1',
            font: { family: 'Inter', size: 11, weight: 600 }
          },
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: {
            display: false,
            stepSize: 20
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 12 }
          }
        }
      }
    }
  });
}

/**
 * Renders the 3-phase transformation roadmap cards
 * @param {Array} roadmap
 */
function renderRoadmapTimeline(roadmap) {
  const container = document.getElementById('phasesTimelineContainer');
  if (!container) return;

  container.innerHTML = roadmap.map((phase, idx) => `
    <div class="phase-card phase-${idx + 1}">
      <span class="phase-badge-pill">${phase.phase}</span>
      <div class="phase-card-title">${phase.title}</div>
      <div class="phase-card-timeline">${phase.timeline}</div>
      <ul class="milestones-ul">
        ${phase.keyMilestones.map(m => `<li>${m}</li>`).join('')}
      </ul>
      <div class="phase-card-outcome">
        <strong>Expected Impact:</strong> ${phase.expectedOutcome}
      </div>
    </div>
  `).join('');
}

/**
 * Renders Exabytes recommended product packages
 * @param {Array} products
 */
function renderSolutionsGrid(products) {
  const container = document.getElementById('solutionsGridContainer');
  if (!container) return;

  container.innerHTML = products.map(prod => `
    <div class="sol-item-card">
      <div>
        <div class="sol-priority">${prod.priority}</div>
        <div class="sol-name">${prod.name}</div>
        <div class="sol-tagline">${prod.tagline}</div>
        <div class="sol-price">${prod.priceMYR}</div>
      </div>
      <ul class="sol-benefits">
        ${prod.benefits.map(b => `<li>${b}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}

/**
 * Initializes action buttons (PDF download, HTML preview, Consultation Modal)
 */
function initActionButtons() {
  // Download PDF
  const pdfBtn = document.getElementById('btnDownloadPdf');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', async () => {
      if (!cachedEvaluationData) return;

      const spinner = document.getElementById('pdfSpinner');
      const text = document.getElementById('pdfBtnText');

      pdfBtn.disabled = true;
      spinner.classList.remove('d-none');
      text.textContent = 'Generating 4-Page PDF...';

      try {
        const response = await fetch('/api/diagnostic/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cachedEvaluationData)
        });

        const contentType = response.headers.get('Content-Type') || '';

        if (response.ok && contentType.includes('application/pdf')) {
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          const safeName = (cachedEvaluationData.companyName || 'SME').replace(/[^a-zA-Z0-9]/g, '_');
          a.download = `Exabytes_Blueprint_${safeName}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(downloadUrl);
          showToast('PDF blueprint downloaded successfully!');
        } else {
          showToast('Could not compile PDF directly. Opening print-ready executive blueprint...');
          openPrintReadyReport(cachedEvaluationData);
        }
      } catch (err) {
        console.error('PDF error:', err);
        showToast('Direct PDF export error. Opening print-ready blueprint...');
        openPrintReadyReport(cachedEvaluationData);
      } finally {
        pdfBtn.disabled = false;
        spinner.classList.add('d-none');
        text.textContent = 'Download Executive Blueprint (PDF)';
      }
    });
  }

  // Preview in Browser
  const previewBtn = document.getElementById('btnPreviewHtml');
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      if (!cachedEvaluationData) return;
      openPrintReadyReport(cachedEvaluationData);
    });
  }

  // Consultation Modal Triggers
  const openModalBtn = document.getElementById('btnOpenConsultModal');
  const modal = document.getElementById('consultationModal');
  const closeModalBtn = document.getElementById('btnCloseModal');
  const cancelConsultBtn = document.getElementById('btnCancelConsult');
  const confirmConsultBtn = document.getElementById('btnConfirmConsult');

  if (openModalBtn && modal) {
    openModalBtn.addEventListener('click', () => {
      modal.classList.remove('d-none');
      initCalendarBookingWidget();
    });

    closeModalBtn.addEventListener('click', () => modal.classList.add('d-none'));
    cancelConsultBtn.addEventListener('click', () => modal.classList.add('d-none'));

    confirmConsultBtn.addEventListener('click', handleConsultationBooking);
  }
}

/**
 * Opens print-ready HTML report with one-click print/save as PDF
 */
async function openPrintReadyReport(data) {
  try {
    const response = await fetch('/api/diagnostic/html-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const html = await response.text();
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  } catch (e) {
    showToast('Failed to open preview window.');
  }
}

/**
 * Visual Monthly Calendar Booking State
 */
let bookingCalMonth = new Date().getMonth();
let bookingCalYear = new Date().getFullYear();
let calendarSelectedDate = null; // 'YYYY-MM-DD'
let calendarSelectedTime = null; // '10:30 AM'
let bookedSlotsList = [];

/**
 * Initializes visual calendar booking modal with full monthly picker
 */
async function initCalendarBookingWidget() {
  const calGrid = document.getElementById('bookingCalendarGrid');
  const slotsContainer = document.getElementById('bookingTimeSlotsContainer');
  if (!calGrid || !slotsContainer) return;

  // Reset selection
  calendarSelectedTime = null;
  document.getElementById('consultSlot').value = '';

  // Current date anchor
  const today = new Date();
  bookingCalMonth = today.getMonth();
  bookingCalYear = today.getFullYear();

  // Set default selected date to tomorrow (or Monday if tomorrow is Sunday)
  let defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 1);
  if (defaultDate.getDay() === 0) { // Sunday -> move to Monday
    defaultDate.setDate(defaultDate.getDate() + 1);
  }
  const defY = defaultDate.getFullYear();
  const defM = String(defaultDate.getMonth() + 1).padStart(2, '0');
  const defD = String(defaultDate.getDate()).padStart(2, '0');
  calendarSelectedDate = `${defY}-${defM}-${defD}`;

  // Fetch booked slots from API
  try {
    const res = await fetch('/api/appointments/booked');
    const json = await res.json();
    if (json.success && Array.isArray(json.bookedSlots)) {
      bookedSlotsList = json.bookedSlots;
    }
  } catch (e) {
    bookedSlotsList = [];
  }

  // Setup month navigation buttons
  const prevBtn = document.getElementById('btnBookingPrevMonth');
  const nextBtn = document.getElementById('btnBookingNextMonth');
  if (prevBtn) {
    prevBtn.onclick = () => {
      bookingCalMonth--;
      if (bookingCalMonth < 0) {
        bookingCalMonth = 11;
        bookingCalYear--;
      }
      renderBookingMonthCalendar();
    };
  }
  if (nextBtn) {
    nextBtn.onclick = () => {
      bookingCalMonth++;
      if (bookingCalMonth > 11) {
        bookingCalMonth = 0;
        bookingCalYear++;
      }
      renderBookingMonthCalendar();
    };
  }

  renderBookingMonthCalendar();
  renderBookingTimeSlotsForDate(calendarSelectedDate, defaultDate);
}

/**
 * Renders full month calendar in client booking modal
 */
function renderBookingMonthCalendar() {
  const calGrid = document.getElementById('bookingCalendarGrid');
  const titleLabel = document.getElementById('bookingNavTitle');
  const monthYearLabel = document.getElementById('bookingMonthYearLabel');
  if (!calGrid) return;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthStr = `${monthNames[bookingCalMonth]} ${bookingCalYear}`;
  if (titleLabel) titleLabel.textContent = monthStr;
  if (monthYearLabel) monthYearLabel.textContent = monthStr;

  calGrid.innerHTML = `
    <div class="booking-day-head">Mo</div>
    <div class="booking-day-head">Tu</div>
    <div class="booking-day-head">We</div>
    <div class="booking-day-head">Th</div>
    <div class="booking-day-head">Fr</div>
    <div class="booking-day-head">Sa</div>
    <div class="booking-day-head">Su</div>
  `;

  const firstDay = new Date(bookingCalYear, bookingCalMonth, 1);
  const startingDay = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(bookingCalYear, bookingCalMonth + 1, 0).getDate();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Blank padding cells
  for (let i = 0; i < startingDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'booking-day-cell empty';
    calGrid.appendChild(emptyCell);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(bookingCalYear, bookingCalMonth, day);
    const dateKey = `${bookingCalYear}-${String(bookingCalMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = cellDate.getDay();

    // Past date or Sunday check
    const isPast = cellDate < todayStart;
    const isSunday = dayOfWeek === 0;
    const isDisabled = isPast || isSunday;

    // Check if day has bookings
    const hasBookings = bookedSlotsList.some(b => {
      const s = (b.slot || '').toLowerCase();
      return s.includes(dateKey.toLowerCase());
    });

    const isSelected = (calendarSelectedDate === dateKey);

    const cell = document.createElement('div');
    let cellClass = 'booking-day-cell';
    if (isDisabled) cellClass += ' disabled';
    if (hasBookings) cellClass += ' has-bookings'; // Light blue bubble glow!
    if (isSelected) cellClass += ' active';

    cell.className = cellClass;
    cell.textContent = day;

    if (!isDisabled) {
      cell.title = hasBookings ? `Date: ${dateKey} (Has bookings)` : `Date: ${dateKey} (Available)`;
      cell.addEventListener('click', () => {
        calendarSelectedDate = dateKey;
        renderBookingMonthCalendar();
        renderBookingTimeSlotsForDate(dateKey, cellDate);
      });
    }

    calGrid.appendChild(cell);
  }
}

/**
 * Renders available and booked time slots for selected date
 */
function renderBookingTimeSlotsForDate(dateStr, dateObj) {
  const container = document.getElementById('bookingTimeSlotsContainer');
  const titleEl = document.getElementById('activeBookingDateTitle');
  if (!container) return;

  // Format header date label
  if (!dateObj) {
    const parts = dateStr.split('-');
    dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  const dateFormatted = dateObj.toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  if (titleEl) {
    titleEl.textContent = dateFormatted;
  }

  const defaultSlots = [
    { time: '09:00 AM', label: '09:00 AM - 10:00 AM', sub: 'Morning Executive Strategy' },
    { time: '10:30 AM', label: '10:30 AM - 11:30 AM', sub: 'Morning Deep Dive Review' },
    { time: '02:00 PM', label: '02:00 PM - 03:00 PM', sub: 'Afternoon Architecture Session' },
    { time: '03:30 PM', label: '03:30 PM - 04:30 PM', sub: 'Afternoon Cloud & AI Alignment' },
    { time: '04:30 PM', label: '04:30 PM - 05:30 PM', sub: 'Late Afternoon Wrap-up' }
  ];

  container.innerHTML = '';
  calendarSelectedTime = null;
  document.getElementById('consultSlot').value = '';

  defaultSlots.forEach(s => {
    // Check if slot is booked
    const isBooked = bookedSlotsList.some(b => {
      const bSlot = (b.slot || '').toLowerCase();
      const timeNum = s.time.toLowerCase().split(' ')[0]; // e.g. "10:30"
      return bSlot.includes(dateStr.toLowerCase()) && (bSlot.includes(s.time.toLowerCase()) || bSlot.includes(timeNum));
    });

    const card = document.createElement('div');
    card.className = `slot-option-card ${isBooked ? 'booked' : ''}`;

    if (isBooked) {
      card.innerHTML = `
        <div class="slot-info">
          <div class="slot-time-title">${s.label}</div>
          <div class="slot-time-sub" style="color: #64748b; font-size: 11px;">Exabytes Slot Reserved</div>
        </div>
        <span class="slot-badge-booked" style="font-size: 11px; font-weight: 700; color: #ef4444; background: rgba(239, 68, 68, 0.15); padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(239, 68, 68, 0.3);">🔒 Booked</span>
      `;
    } else {
      card.innerHTML = `
        <div class="slot-info">
          <div class="slot-time-title">${s.label}</div>
          <div class="slot-time-sub" style="color: var(--text-dim); font-size: 11px;">${s.sub}</div>
        </div>
        <span class="slot-badge-avail" style="font-size: 11px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.15); padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.3);">✨ Available</span>
      `;

      card.addEventListener('click', () => {
        container.querySelectorAll('.slot-option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        calendarSelectedTime = s.time;
        const fullSlotStr = `${dateStr} ${s.time}`;
        document.getElementById('consultSlot').value = fullSlotStr;
      });
    }

    container.appendChild(card);
  });
}

/**
 * Handles consultation booking and sends lead to CRM API
 */
async function handleConsultationBooking() {
  if (!cachedEvaluationData) return;

  const slot = document.getElementById('consultSlot').value;
  if (!slot) {
    showToast('Please select an available consultation date and time slot first.');
    return;
  }

  const notes = document.getElementById('consultNotes').value.trim();
  const spinner = document.getElementById('consultSpinner');
  const btnText = document.getElementById('confirmConsultText');
  const confirmBtn = document.getElementById('btnConfirmConsult');

  confirmBtn.disabled = true;
  spinner.classList.remove('d-none');
  btnText.textContent = 'Syncing to Exabytes CRM...';

  const leadPayload = {
    companyName: cachedEvaluationData.companyName,
    contactName: cachedEvaluationData.contactName,
    contactPhone: cachedEvaluationData.contactPhone,
    contactEmail: cachedEvaluationData.contactEmail,
    industry: cachedEvaluationData.industry,
    teamSize: cachedEvaluationData.teamSize,
    maturityScore: cachedEvaluationData.scores.totalScore,
    maturityTier: cachedEvaluationData.scores.tier,
    aiGrade: cachedEvaluationData.scores.aiGrade,
    topPainPoint: cachedEvaluationData.bottleneck,
    recommendedPackage: cachedEvaluationData.products[0]?.name || 'Exabytes Cloud Suite',
    annualRoiMYR: cachedEvaluationData.roi.formatted.totalAnnualBenefit,
    preferredSlot: slot,
    notes: notes,
    salesCheatSheet: cachedEvaluationData.salesSheet ? {
      hook: cachedEvaluationData.salesSheet.closingCheatSheet.bullet1_Hook,
      prescription: cachedEvaluationData.salesSheet.closingCheatSheet.bullet2_Prescription,
      financialMath: cachedEvaluationData.salesSheet.closingCheatSheet.bullet3_FinancialMath
    } : null
  };

  try {
    const res = await fetch('/api/consultation/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadPayload)
    });

    const json = await res.json();
    if (json.success) {
      document.getElementById('consultationForm').classList.add('d-none');
      const successBox = document.getElementById('modalSuccessMsg');
      successBox.classList.remove('d-none');
      if (json.result && json.result.lead && json.result.lead.id) {
        document.getElementById('leadRefNumber').textContent = json.result.lead.id;
      }
      showToast('Lead captured and assigned to Exabytes Sales Consultant!');
    }
  } catch (err) {
    console.error('Lead sync error:', err);
    showToast('Failed to record consultation. Please try again.');
  } finally {
    confirmBtn.disabled = false;
    spinner.classList.add('d-none');
    btnText.textContent = 'Confirm Consultation Booking';
  }
}

/**
 * Displays toast feedback notification
 * @param {string} message
 */
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function initFormControls() {
  // Empty helper if extra controls needed
}
