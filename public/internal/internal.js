let allLeads = [];
let activeFilter = 'ALL';
let activeLead = null;

// Calendar State
let calCurrentMonth = new Date().getMonth();
let calCurrentYear = new Date().getFullYear();
let calActiveDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
  fetchLeads();
  initFiltersAndSearch();
  initModalListeners();
  initViewSwitcher();
  initCalendarScheduleView();
});

/**
 * Initializes View Switcher between Pipeline and Calendar
 */
function initViewSwitcher() {
  const tabLeads = document.getElementById('tabViewLeads');
  const tabCalendar = document.getElementById('tabViewCalendar');
  const secLeads = document.getElementById('sectionLeadsPipeline');
  const secCalendar = document.getElementById('sectionCalendarSchedule');

  if (tabLeads && tabCalendar) {
    tabLeads.addEventListener('click', () => {
      tabLeads.classList.add('active');
      tabCalendar.classList.remove('active');
      secLeads.classList.remove('d-none');
      secCalendar.classList.add('d-none');
    });

    tabCalendar.addEventListener('click', () => {
      tabCalendar.classList.add('active');
      tabLeads.classList.remove('active');
      secCalendar.classList.remove('d-none');
      secLeads.classList.add('d-none');
      renderMiniCalendar();
      renderDaySchedule();
    });
  }
}

/**
 * Initializes Calendar Schedule View controls
 */
function initCalendarScheduleView() {
  const prevMonthBtn = document.getElementById('btnPrevMonth');
  const nextMonthBtn = document.getElementById('btnNextMonth');
  const prevDayBtn = document.getElementById('btnPrevDay');
  const nextDayBtn = document.getElementById('btnNextDay');
  const todayBtn = document.getElementById('btnCalToday');

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      calCurrentMonth--;
      if (calCurrentMonth < 0) {
        calCurrentMonth = 11;
        calCurrentYear--;
      }
      renderMiniCalendar();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      calCurrentMonth++;
      if (calCurrentMonth > 11) {
        calCurrentMonth = 0;
        calCurrentYear++;
      }
      renderMiniCalendar();
    });
  }

  if (prevDayBtn) {
    prevDayBtn.addEventListener('click', () => {
      calActiveDate.setDate(calActiveDate.getDate() - 1);
      calCurrentMonth = calActiveDate.getMonth();
      calCurrentYear = calActiveDate.getFullYear();
      renderMiniCalendar();
      renderDaySchedule();
    });
  }

  if (nextDayBtn) {
    nextDayBtn.addEventListener('click', () => {
      calActiveDate.setDate(calActiveDate.getDate() + 1);
      calCurrentMonth = calActiveDate.getMonth();
      calCurrentYear = calActiveDate.getFullYear();
      renderMiniCalendar();
      renderDaySchedule();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      calActiveDate = new Date();
      calCurrentMonth = calActiveDate.getMonth();
      calCurrentYear = calActiveDate.getFullYear();
      renderMiniCalendar();
      renderDaySchedule();
    });
  }
}

/**
 * Renders the mini month calendar in the sidebar
 */
function renderMiniCalendar() {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const titleEl = document.getElementById('miniCalTitle');
  if (titleEl) {
    titleEl.textContent = `${monthNames[calCurrentMonth]} ${calCurrentYear}`;
  }

  const grid = document.getElementById('miniCalGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="mini-cal-day-head">Mo</div>
    <div class="mini-cal-day-head">Tu</div>
    <div class="mini-cal-day-head">We</div>
    <div class="mini-cal-day-head">Th</div>
    <div class="mini-cal-day-head">Fr</div>
    <div class="mini-cal-day-head">Sa</div>
    <div class="mini-cal-day-head">Su</div>
  `;

  // First day of month
  const firstDay = new Date(calCurrentYear, calCurrentMonth, 1);
  const startingDay = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();

  // Blank padding cells
  for (let i = 0; i < startingDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'mini-cal-day-cell empty';
    grid.appendChild(emptyCell);
  }

  // Days 1..daysInMonth
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(calCurrentYear, calCurrentMonth, day);
    const dateStr = `${calCurrentYear}-${String(calCurrentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Check if this day has any booked leads
    const hasBookings = allLeads.some(l => {
      const slot = (l.preferredSlot || '').trim().toLowerCase();
      if (!slot) return false;
      if (slot.includes(dateStr.toLowerCase())) return true;
      const altStr = `${calCurrentYear}-${calCurrentMonth + 1}-${day}`;
      return slot.includes(altStr);
    });

    const isSelected = calActiveDate.getFullYear() === calCurrentYear &&
                       calActiveDate.getMonth() === calCurrentMonth &&
                       calActiveDate.getDate() === day;

    const cell = document.createElement('div');
    cell.className = `mini-cal-day-cell ${isSelected ? 'active-day' : ''} ${hasBookings ? 'has-events' : ''}`;
    cell.textContent = day;
    if (hasBookings) {
      cell.title = `Booked Consultation on ${dateStr}`;
    }

    cell.addEventListener('click', () => {
      calActiveDate = new Date(calCurrentYear, calCurrentMonth, day);
      renderMiniCalendar();
      renderDaySchedule();
    });

    grid.appendChild(cell);
  }
}

/**
 * Renders the day schedule and checklist on the right
 */
function renderDaySchedule() {
  const yyyy = calActiveDate.getFullYear();
  const mm = String(calActiveDate.getMonth() + 1).padStart(2, '0');
  const dd = String(calActiveDate.getDate()).padStart(2, '0');
  const activeDateKey = `${yyyy}-${mm}-${dd}`;

  const headerDateEl = document.getElementById('scheduleDateHeader');
  if (headerDateEl) {
    headerDateEl.textContent = calActiveDate.toLocaleDateString('en-MY', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // Filter leads booked for this active date
  const dayAppointments = allLeads.filter(l => (l.preferredSlot || '').includes(activeDateKey));

  // Update Left Checklist
  const badgeEl = document.getElementById('selectedDateCountBadge');
  if (badgeEl) {
    badgeEl.textContent = `${dayAppointments.length} session${dayAppointments.length === 1 ? '' : 's'}`;
  }

  const checklistContainer = document.getElementById('checklistItemsContainer');
  if (checklistContainer) {
    if (dayAppointments.length === 0) {
      checklistContainer.innerHTML = `<div style="font-size: 11px; color: var(--text-dim); padding: 10px 0;">No consultations scheduled for this date.</div>`;
    } else {
      checklistContainer.innerHTML = dayAppointments.map(l => `
        <div class="checklist-item" onclick="openLeadDossier('${l.id}')">
          <div class="checklist-dot"></div>
          <div class="checklist-info">
            <div class="checklist-comp">${l.companyName}</div>
            <div class="checklist-time">${l.preferredSlot || 'Scheduled Meeting'}</div>
          </div>
          <span class="status-badge status-${(l.status || 'new').toLowerCase()}">${l.status || 'New'}</span>
        </div>
      `).join('');
    }
  }

  // Render Right Timeline Grid (Hour Rows from 8 AM to 5 PM)
  const timelineGrid = document.getElementById('timelineScheduleGrid');
  if (!timelineGrid) return;

  const hours = [
    { label: '08:00 AM', match: '08:00' },
    { label: '09:00 AM', match: '09:00' },
    { label: '10:00 AM', match: '10:00' },
    { label: '10:30 AM', match: '10:30' },
    { label: '11:30 AM', match: '11:30' },
    { label: '02:00 PM', match: '02:00' },
    { label: '03:30 PM', match: '03:30' },
    { label: '04:30 PM', match: '04:30' },
    { label: '05:00 PM', match: '05:00' }
  ];

  timelineGrid.innerHTML = hours.map((h, idx) => {
    // Find matching appointment for this hour
    const matchingLeads = dayAppointments.filter(l => (l.preferredSlot || '').includes(h.match));

    let slotContent = `<div class="empty-slot-placeholder">No meetings scheduled</div>`;
    if (matchingLeads.length > 0) {
      slotContent = matchingLeads.map(l => `
        <div class="schedule-event-pill ${idx % 2 === 1 ? 'purple-theme' : ''}" onclick="openLeadDossier('${l.id}')">
          <div class="event-left">
            <div class="event-comp-title">🏢 ${l.companyName}</div>
            <div class="event-meta-sub">👤 ${l.contactName} • ${l.recommendedPackage || 'Exabytes Cloud'}</div>
          </div>
          <span class="event-status-tag">${l.status || 'New'}</span>
        </div>
      `).join('');
    }

    return `
      <div class="timeline-hour-row">
        <div class="timeline-hour-label">${h.label}</div>
        <div class="timeline-slot-container">
          ${slotContent}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Fetches all leads from CRM API
 */
async function fetchLeads() {
  try {
    const res = await fetch('/api/crm/leads');
    const json = await res.json();
    if (json.success && Array.isArray(json.leads)) {
      allLeads = json.leads;
      updateKpis(allLeads);
      renderLeads();
    }
  } catch (err) {
    console.error('Error fetching leads:', err);
    showToast('Failed to load CRM leads.');
  }
}

/**
 * Updates top KPI summary metrics
 * @param {Array} leads
 */
function updateKpis(leads) {
  document.getElementById('statTotalLeads').textContent = leads.length;

  if (leads.length === 0) {
    document.getElementById('statAvgScore').textContent = '0 / 100';
    document.getElementById('statPipelineVal').textContent = 'RM 0';
    document.getElementById('statPendingCount').textContent = '0';
    return;
  }

  const avgScore = Math.round(leads.reduce((acc, l) => acc + (parseInt(l.maturityScore, 10) || 0), 0) / leads.length);
  document.getElementById('statAvgScore').textContent = `${avgScore} / 100`;

  let totalRm = 0;
  leads.forEach(l => {
    if (l.annualRoiMYR) {
      const num = parseInt(l.annualRoiMYR.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num)) totalRm += num;
    }
  });
  document.getElementById('statPipelineVal').textContent = `RM ${totalRm.toLocaleString()}`;

  const pending = leads.filter(l => (l.status || 'New') === 'New').length;
  document.getElementById('statPendingCount').textContent = pending;
}

/**
 * Filters and renders lead cards
 */
function renderLeads() {
  const container = document.getElementById('leadsContainer');
  if (!container) return;

  const searchQuery = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();

  const filtered = allLeads.filter(lead => {
    // Status filter
    if (activeFilter !== 'ALL' && (lead.status || 'New') !== activeFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const hay = `${lead.companyName || ''} ${lead.contactName || ''} ${lead.industry || ''} ${lead.topPainPoint || ''}`.toLowerCase();
      if (!hay.includes(searchQuery)) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: #94a3b8;">
        No inbound leads found matching current criteria.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(lead => {
    const statusClass = (lead.status || 'New').toLowerCase();
    const formattedDate = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Recent';

    return `
      <div class="lead-card" onclick="openLeadDossier('${lead.id}')">
        <div>
          <div class="lead-card-top">
            <div>
              <div class="lead-company-name">${lead.companyName || 'SME Enterprise'}</div>
              <div class="lead-industry">${lead.industry || 'General SME'} • ${lead.teamSize || '1-10'} Staff</div>
            </div>
            <span class="status-badge status-${statusClass}">${lead.status || 'New'}</span>
          </div>

          <div class="lead-score-strip">
            <div class="mini-score-val">${lead.maturityScore || 40}</div>
            <div class="mini-score-meta">
              <strong>${lead.maturityTier || 'Practitioner'}</strong><br>
              ${lead.aiGrade || 'Grade B'}
            </div>
          </div>

          <div class="lead-pain-summary">
            <strong>Bottleneck:</strong> ${lead.topPainPoint || 'Manual admin waste'}
          </div>

          <div class="lead-recommended-pkg">
            <strong>Target Solution:</strong> ${lead.recommendedPackage || 'Exabytes Cloud Suite'}
          </div>
        </div>

        <div class="lead-card-footer">
          <span>${formattedDate}</span>
          <button class="btn-open-dossier" type="button">View AI Script &rarr;</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Initializes search input and filter buttons
 */
function initFiltersAndSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => renderLeads());
  }

  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.dataset.status;
      renderLeads();
    });
  });
}

/**
 * Opens lead dossier modal and prepares closing script
 * @param {string} leadId
 */
function openLeadDossier(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  if (!lead) return;

  activeLead = lead;

  document.getElementById('modalLeadId').textContent = lead.id;
  const statusBadge = document.getElementById('modalStatusBadge');
  statusBadge.textContent = lead.status || 'New';
  statusBadge.className = `status-badge status-${(lead.status || 'New').toLowerCase()}`;

  document.getElementById('modalCompanyName').textContent = lead.companyName || 'SME Enterprise';
  document.getElementById('modalMetaSubtitle').textContent = `${lead.contactName || 'Owner'} • ${lead.industry || 'SME'} • Headcount: ${lead.teamSize || '5'}`;

  // Contact links
  const phoneClean = (lead.contactPhone || '').replace(/[^0-9]/g, '');
  const waBtn = document.getElementById('btnActionWhatsapp');
  const callBtn = document.getElementById('btnActionCall');

  waBtn.href = phoneClean ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(`Hi ${lead.contactName || ''}, this is your Exabytes Growth Consultant regarding your Digital Transformation Blueprint for ${lead.companyName}.`)}` : '#';
  callBtn.href = phoneClean ? `tel:${phoneClean}` : '#';

  // Details
  document.getElementById('modalBottleneck').textContent = lead.topPainPoint || 'Manual WhatsApp & Paper Logging';
  document.getElementById('modalScoreGrade').textContent = `${lead.maturityScore || 42}/100 • ${lead.aiGrade || 'Grade B'}`;
  document.getElementById('modalRecommendedPkg').textContent = lead.recommendedPackage || 'Exabytes Business Solution';
  document.getElementById('modalRoi').textContent = lead.annualRoiMYR || 'RM 15,000+';

  // AI Script
  const cheat = lead.salesCheatSheet || {};
  const cs = cheat.closingCheatSheet || cheat;
  const hookVal = cheat.hook || cs.bullet1_Hook || '';
  const presVal = cheat.prescription || cs.bullet2_Prescription || '';
  const mathVal = cheat.financialMath || cs.bullet3_FinancialMath || '';

  document.getElementById('scriptHook').textContent = hookVal || `Hi ${lead.contactName || 'there'}, I reviewed your diagnostic for ${lead.companyName}. I noticed your team is dedicating significant hours weekly to ${lead.topPainPoint || 'manual workflows'}.`;
  document.getElementById('scriptPrescription').textContent = presVal || `Rather than an expensive IT overhaul, our Phase 1 recommendation is deploying ${lead.recommendedPackage || 'Exabytes Cloud Suite'} to solve this immediately.`;
  document.getElementById('scriptMath').textContent = mathVal || `Reclaiming these wasted hours yields an estimated ${lead.annualRoiMYR || 'RM 15,000'} in recovered labor per year, paying for itself in under 30 days.`;

  // Status selector
  document.getElementById('selectLeadStatus').value = lead.status || 'New';

  // Show modal
  document.getElementById('dossierModal').classList.remove('d-none');
}

/**
 * Initializes modal buttons and copy handler
 */
function initModalListeners() {
  const modal = document.getElementById('dossierModal');
  const closeTop = document.getElementById('btnCloseDossier');
  const closeBtm = document.getElementById('btnCloseDossierBottom');

  if (closeTop) closeTop.addEventListener('click', () => modal.classList.add('d-none'));
  if (closeBtm) closeBtm.addEventListener('click', () => modal.classList.add('d-none'));

  // Copy Full Script
  const copyBtn = document.getElementById('btnCopyScript');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const hook = document.getElementById('scriptHook').textContent;
      const pres = document.getElementById('scriptPrescription').textContent;
      const math = document.getElementById('scriptMath').textContent;

      const fullScript = `📞 EXABYTES CLOSING SCRIPT FOR ${activeLead?.companyName || 'PROSPECT'}\n\n1. THE HOOK:\n${hook}\n\n2. THE PRESCRIPTION:\n${pres}\n\n3. THE FINANCIAL MATH:\n${math}`;

      navigator.clipboard.writeText(fullScript).then(() => {
        showToast('Full sales script copied to clipboard!');
      }).catch(() => {
        showToast('Could not copy to clipboard.');
      });
    });
  }

  // Update Status
  const statusSelect = document.getElementById('selectLeadStatus');
  if (statusSelect) {
    statusSelect.addEventListener('change', async (e) => {
      if (!activeLead) return;
      const newStatus = e.target.value;

      try {
        const res = await fetch(`/api/crm/leads/${activeLead.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
          activeLead.status = newStatus;
          const statusBadge = document.getElementById('modalStatusBadge');
          statusBadge.textContent = newStatus;
          statusBadge.className = `status-badge status-${newStatus.toLowerCase()}`;
          showToast(`Lead status updated to ${newStatus}`);
          renderLeads();
          updateKpis(allLeads);
        }
      } catch (err) {
        showToast('Failed to update status');
      }
    });
  }
}

/**
 * Toast feedback
 * @param {string} msg
 */
function showToast(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
