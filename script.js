/**
 * ============================================================================
 * Medicine Schedule and Reminder Manager
 * Modern Healthcare Dashboard UI & Logic
 * Author: Sasmitha K.M
 * ============================================================================
 */

'use strict';

// Storage Keys
const STORAGE_KEY_MEDS = 'medicines';
const STORAGE_KEY_HIST = 'medicineHistory';

// Application State
let medicines = [];
let medicineHistory = [];
let currentEditingId = null;
let activeReminderMedicine = null;
let currentDashHistoryFilter = 'ALL';
const triggeredAlerts = new Set();
let snoozeUntil = 0;

// Default demo dataset (reflecting the dashboard design screenshots)
const DEFAULT_MEDICINES = [
  {
    id: 'med_paracetamol_1',
    name: 'Paracetamol',
    dosage: '500 mg',
    type: 'Tablet',
    route: 'Oral',
    startDate: getRelativeDateString(-2),
    endDate: getRelativeDateString(5),
    reminderTime: '09:00',
    notes: 'Take after meals with water',
    color: '#10b981'
  },
  {
    id: 'med_vitamind3_2',
    name: 'Vitamin D3',
    dosage: '1000 IU',
    type: 'Capsule',
    route: 'Oral',
    startDate: getRelativeDateString(-3),
    endDate: getRelativeDateString(30),
    reminderTime: '20:00',
    notes: 'Take with warm milk before sleep',
    color: '#1d68f2'
  },
  {
    id: 'med_amoxicillin_3',
    name: 'Amoxicillin',
    dosage: '500 mg',
    type: 'Tablet',
    route: 'Oral',
    startDate: getRelativeDateString(-4),
    endDate: getRelativeDateString(3),
    reminderTime: '09:00',
    notes: 'Complete full course as prescribed',
    color: '#f59e0b'
  },
  {
    id: 'med_cetirizine_4',
    name: 'Cetirizine',
    dosage: '10 mg',
    type: 'Tablet',
    route: 'Oral',
    startDate: getRelativeDateString(-5),
    endDate: getRelativeDateString(25),
    reminderTime: '22:00',
    notes: 'Take before bedtime if allergy symptoms persist',
    color: '#8b5cf6'
  },
  {
    id: 'med_vitaminc_5',
    name: 'Vitamin C',
    dosage: '500 mg',
    type: 'Tablet',
    route: 'Oral',
    startDate: getRelativeDateString(-6),
    endDate: getRelativeDateString(24),
    reminderTime: '12:00',
    notes: 'Daily immunity booster after lunch',
    color: '#06b6d4'
  }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  init();
});

function init() {
  loadMedicines();
  loadHistory();
  setupSidebarNavigation();
  setupEventHandlers();
  updateGreetingAndDates();
  
  // Dynamic clock & interval check
  setInterval(updateGreetingAndDates, 60000);
  checkReminders();
  setInterval(checkReminders, 3000);

  // Renders
  updateDashboard();
  renderMedicines();
  renderHistory();
  populateHistoryMedDropdown();
  updateNotificationBtn();
}

// ============================================================================
// Data Persistence (LocalStorage)
// ============================================================================

function loadMedicines() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEDS);
    if (raw) {
      medicines = JSON.parse(raw);
    } else {
      // First load: seed with default demo medicines
      medicines = [...DEFAULT_MEDICINES];
      saveMedicines();
    }
  } catch (e) {
    console.error('Failed to load medicines from localStorage:', e);
    medicines = [...DEFAULT_MEDICINES];
  }
}

function saveMedicines() {
  try {
    localStorage.setItem(STORAGE_KEY_MEDS, JSON.stringify(medicines));
  } catch (e) {
    console.error('Failed to save medicines:', e);
  }
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HIST);
    if (raw) {
      medicineHistory = JSON.parse(raw);
    } else {
      // Seed initial adherence history matching screenshots
      const todayStr = getTodayDateString();
      medicineHistory = [
        {
          id: 'hist_1',
          medicineId: 'med_paracetamol_1',
          medicineName: 'Paracetamol',
          dosage: '500 mg',
          type: 'Tablet',
          date: todayStr,
          scheduledTime: '09:00',
          status: 'TAKEN',
          notes: '-',
          recordedAt: new Date().toISOString()
        },
        {
          id: 'hist_2',
          medicineId: 'med_vitamind3_2',
          medicineName: 'Vitamin D3',
          dosage: '1000 IU',
          type: 'Capsule',
          date: getRelativeDateString(-1),
          scheduledTime: '20:00',
          status: 'TAKEN',
          notes: '-',
          recordedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'hist_3',
          medicineId: 'med_amoxicillin_3',
          medicineName: 'Amoxicillin',
          dosage: '500 mg',
          type: 'Tablet',
          date: getRelativeDateString(-2),
          scheduledTime: '09:00',
          status: 'MISSED',
          notes: '-',
          recordedAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 'hist_4',
          medicineId: 'med_cetirizine_4',
          medicineName: 'Cetirizine',
          dosage: '10 mg',
          type: 'Tablet',
          date: getRelativeDateString(-3),
          scheduledTime: '22:00',
          status: 'TAKEN',
          notes: '-',
          recordedAt: new Date(Date.now() - 259200000).toISOString()
        },
        {
          id: 'hist_5',
          medicineId: 'med_vitaminc_5',
          medicineName: 'Vitamin C',
          dosage: '500 mg',
          type: 'Tablet',
          date: getRelativeDateString(-4),
          scheduledTime: '12:00',
          status: 'TAKEN',
          notes: '-',
          recordedAt: new Date(Date.now() - 345600000).toISOString()
        }
      ];
      saveHistory();
    }
  } catch (e) {
    console.error('Failed to load history:', e);
    medicineHistory = [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY_HIST, JSON.stringify(medicineHistory));
  } catch (e) {
    console.error('Failed to save history:', e);
  }
}

// ============================================================================
// Sidebar Navigation & Route Switching
// ============================================================================

function setupSidebarNavigation() {
  const menuButtons = document.querySelectorAll('.sidebar-item');
  menuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-section');
      switchView(target);

      // Close mobile sidebar if open
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('open');
    });
  });

  // Mobile hamburger toggle
  const toggleBtn = document.getElementById('btn-toggle-sidebar');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.toggle('open');
    });
  }

  // Quick Action Links on Dashboard
  document.getElementById('link-view-all-meds')?.addEventListener('click', () => switchView('medicines'));
  document.getElementById('link-view-today')?.addEventListener('click', () => switchView('dashboard'));
  document.getElementById('link-view-taken-history')?.addEventListener('click', () => {
    switchView('history');
  });
  document.getElementById('link-view-missed-history')?.addEventListener('click', () => {
    switchView('history');
  });
  document.getElementById('btn-view-all-reminders')?.addEventListener('click', () => switchView('medicines'));

  // Medicines page: + Add Medicine button
  document.getElementById('btn-open-add-form')?.addEventListener('click', () => {
    resetMedicineForm();
    switchView('add-medicine');
  });

  // Test Reminder Alert Button on Promo card
  document.getElementById('btn-test-modal-trigger')?.addEventListener('click', () => {
    const med = medicines[0] || DEFAULT_MEDICINES[0];
    showReminder(med, true);
  });
}

function switchView(sectionName) {
  // Update sidebar active state
  document.querySelectorAll('.sidebar-item').forEach(btn => {
    if (btn.getAttribute('data-section') === sectionName ||
        (sectionName === 'add-medicine' && btn.getAttribute('data-section') === 'medicines')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update visible section
  document.querySelectorAll('.content-section').forEach(sec => {
    if (sec.id === `section-${sectionName}`) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  if (sectionName === 'dashboard') {
    updateDashboard();
  } else if (sectionName === 'medicines') {
    renderMedicines();
  } else if (sectionName === 'history') {
    renderHistory();
    populateHistoryMedDropdown();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// Event Handlers Setup
// ============================================================================

function setupEventHandlers() {
  // Medicine Form Submit
  const form = document.getElementById('medicine-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (currentEditingId) {
        updateMedicine(currentEditingId);
      } else {
        addMedicine();
      }
    });
  }

  // Clear Form
  document.getElementById('btn-clear-form')?.addEventListener('click', () => {
    resetMedicineForm();
  });

  // Cancel Edit
  document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
    resetMedicineForm();
    switchView('medicines');
  });

  // Search Medicines
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('btn-clear-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (clearSearchBtn) clearSearchBtn.style.display = q ? 'block' : 'none';
      searchMedicines(q);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        renderMedicines();
      }
    });
  }

  // Type filter dropdown in Medicines view
  document.getElementById('filter-type-select')?.addEventListener('change', () => {
    renderMedicines();
  });

  // Dashboard Recent History Filter Buttons
  ['all', 'taken', 'missed'].forEach(key => {
    const btn = document.getElementById(`dash-filter-${key}`);
    if (btn) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dash-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDashHistoryFilter = key.toUpperCase();
        renderDashboardRecentHistory();
      });
    }
  });

  // History Tab Filters
  document.getElementById('history-filter-date')?.addEventListener('change', renderHistory);
  document.getElementById('history-filter-med')?.addEventListener('change', renderHistory);
  document.getElementById('btn-refresh-history')?.addEventListener('click', () => {
    renderHistory();
    showToast('History log refreshed.', 'info');
  });

  // Modal Buttons
  document.getElementById('btn-reminder-taken')?.addEventListener('click', () => {
    if (activeReminderMedicine) {
      markTaken(activeReminderMedicine);
    }
    closeReminderModal();
  });

  document.getElementById('btn-reminder-missed')?.addEventListener('click', () => {
    if (activeReminderMedicine) {
      markMissed(activeReminderMedicine);
    }
    closeReminderModal();
  });

  document.getElementById('btn-close-modal')?.addEventListener('click', closeReminderModal);

  // Notification Bell Click
  document.getElementById('btn-toggle-notification')?.addEventListener('click', requestNotificationPermission);
}

// ============================================================================
// Form & Medicine CRUD Operations
// ============================================================================

function validateMedicineForm() {
  const nameInput = document.getElementById('med-name');
  const dosageInput = document.getElementById('med-dosage');
  const typeInput = document.getElementById('med-type');
  const startDateInput = document.getElementById('med-start-date');
  const endDateInput = document.getElementById('med-end-date');
  const reminderTimeInput = document.getElementById('med-reminder-time');
  const notesInput = document.getElementById('med-notes');

  const name = nameInput.value.trim();
  const dosage = dosageInput.value.trim();
  const type = typeInput.value.trim();
  const startDate = startDateInput.value.trim();
  const endDate = endDateInput.value.trim();
  const reminderTime = reminderTimeInput.value.trim();
  const notes = notesInput.value.trim();

  if (!name) {
    showFormAlert('Please enter the medicine name.', 'error');
    nameInput.focus();
    return null;
  }
  if (!dosage) {
    showFormAlert('Please specify dosage (e.g. 500 mg).', 'error');
    dosageInput.focus();
    return null;
  }
  if (!type) {
    showFormAlert('Please select a medicine formulation type.', 'error');
    typeInput.focus();
    return null;
  }
  if (!startDate) {
    showFormAlert('Please choose a start date.', 'error');
    startDateInput.focus();
    return null;
  }
  if (!endDate) {
    showFormAlert('Please choose an end date.', 'error');
    endDateInput.focus();
    return null;
  }
  if (endDate < startDate) {
    showFormAlert('End date cannot be earlier than start date.', 'error');
    endDateInput.focus();
    return null;
  }
  if (!reminderTime) {
    showFormAlert('Please specify the daily reminder time.', 'error');
    reminderTimeInput.focus();
    return null;
  }

  hideFormAlert();
  return { name, dosage, type, startDate, endDate, reminderTime, notes };
}

function addMedicine() {
  const data = validateMedicineForm();
  if (!data) return;

  const colorPalette = ['#10b981', '#1d68f2', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];
  const randomColor = colorPalette[medicines.length % colorPalette.length];

  const newMed = {
    id: 'med_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    name: data.name,
    dosage: data.dosage,
    type: data.type,
    route: 'Oral',
    startDate: data.startDate,
    endDate: data.endDate,
    reminderTime: data.reminderTime,
    notes: data.notes,
    color: randomColor
  };

  medicines.push(newMed);
  saveMedicines();

  showToast(`Medicine "${newMed.name}" added successfully!`, 'success');
  resetMedicineForm();
  switchView('medicines');
  updateDashboard();
}

function editMedicine(id) {
  const med = medicines.find(m => m.id === id);
  if (!med) return;

  currentEditingId = id;
  switchView('add-medicine');

  document.getElementById('edit-medicine-id').value = med.id;
  document.getElementById('med-name').value = med.name;
  document.getElementById('med-dosage').value = med.dosage;
  document.getElementById('med-type').value = med.type;
  document.getElementById('med-start-date').value = med.startDate;
  document.getElementById('med-end-date').value = med.endDate;
  document.getElementById('med-reminder-time').value = med.reminderTime;
  document.getElementById('med-notes').value = med.notes || '';

  document.getElementById('form-heading-text').textContent = 'Edit Medicine Schedule';
  document.getElementById('btn-submit-med').textContent = 'Save Changes';
  document.getElementById('btn-cancel-edit').style.display = 'inline-block';
}

function updateMedicine(id) {
  const data = validateMedicineForm();
  if (!data) return;

  const idx = medicines.findIndex(m => m.id === id);
  if (idx === -1) return;

  medicines[idx] = {
    ...medicines[idx],
    name: data.name,
    dosage: data.dosage,
    type: data.type,
    startDate: data.startDate,
    endDate: data.endDate,
    reminderTime: data.reminderTime,
    notes: data.notes
  };

  saveMedicines();
  showToast(`Medicine "${data.name}" updated successfully!`, 'success');
  resetMedicineForm();
  switchView('medicines');
  updateDashboard();
}

function deleteMedicine(id) {
  const med = medicines.find(m => m.id === id);
  if (!med) return;

  if (window.confirm(`Are you sure you want to delete "${med.name}" (${med.dosage})?`)) {
    medicines = medicines.filter(m => m.id !== id);
    saveMedicines();
    renderMedicines();
    updateDashboard();
    showToast(`Medicine "${med.name}" removed from schedule.`, 'info');
  }
}

function resetMedicineForm() {
  currentEditingId = null;
  const form = document.getElementById('medicine-form');
  if (form) form.reset();

  document.getElementById('edit-medicine-id').value = '';
  document.getElementById('form-heading-text').textContent = 'Add New Medicine';
  document.getElementById('btn-submit-med').textContent = 'Add Medicine';
  document.getElementById('btn-cancel-edit').style.display = 'none';

  // Set default dates
  document.getElementById('med-start-date').value = getTodayDateString();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  document.getElementById('med-end-date').value = formatDateYMD(nextWeek);

  hideFormAlert();
}

function showFormAlert(msg, type = 'error') {
  const box = document.getElementById('form-alert-box');
  if (!box) return;
  box.className = `form-alert ${type}`;
  box.textContent = msg;
  box.style.display = 'block';
}

function hideFormAlert() {
  const box = document.getElementById('form-alert-box');
  if (box) box.style.display = 'none';
}

// ============================================================================
// Render Medicine List View
// ============================================================================

function renderMedicines(customList = null) {
  let list = customList !== null ? customList : medicines;

  // Apply Type filter
  const typeSelect = document.getElementById('filter-type-select');
  if (typeSelect && typeSelect.value !== 'ALL') {
    list = list.filter(m => m.type === typeSelect.value);
  }

  const tbody = document.getElementById('medicines-table-body');
  const countLabel = document.getElementById('showing-medicines-count');
  const emptyState = document.getElementById('medicines-empty-state');
  const table = document.getElementById('medicines-full-table');

  if (countLabel) {
    countLabel.textContent = `Showing ${list.length} medicine${list.length === 1 ? '' : 's'}`;
  }

  if (!tbody) return;
  tbody.innerHTML = '';

  if (list.length === 0) {
    if (table) table.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (table) table.style.display = 'table';
  if (emptyState) emptyState.style.display = 'none';

  const todayStr = getTodayDateString();

  list.forEach(med => {
    const tr = document.createElement('tr');
    const status = getMedicineLifecycleStatus(med, todayStr);
    const color = med.color || '#1d68f2';

    tr.innerHTML = `
      <td>
        <div class="table-med-name-col">
          <div class="table-icon-circle" style="background-color: ${color}20; color: ${color};">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
            </svg>
          </div>
          <span>${escapeHtml(med.name)}</span>
        </div>
      </td>
      <td>${escapeHtml(med.dosage)}</td>
      <td>${escapeHtml(med.type)}</td>
      <td>${formatDateDisplay(med.startDate)}</td>
      <td>${formatDateDisplay(med.endDate)}</td>
      <td>${formatTime12(med.reminderTime)}</td>
      <td>
        <span class="badge-status ${status.class}">${status.label}</span>
      </td>
      <td class="text-center">
        <div class="table-action-btns">
          <button type="button" class="btn-table-action btn-action-edit" title="Edit">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>
          <button type="button" class="btn-table-action btn-action-delete" title="Delete">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </td>
    `;

    tr.querySelector('.btn-action-edit')?.addEventListener('click', () => editMedicine(med.id));
    tr.querySelector('.btn-action-delete')?.addEventListener('click', () => deleteMedicine(med.id));

    tbody.appendChild(tr);
  });
}

function searchMedicines(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    renderMedicines();
    return;
  }

  const results = medicines.filter(m => {
    return (m.name && m.name.toLowerCase().includes(q)) ||
           (m.dosage && m.dosage.toLowerCase().includes(q)) ||
           (m.type && m.type.toLowerCase().includes(q)) ||
           (m.notes && m.notes.toLowerCase().includes(q));
  });

  renderMedicines(results);
}

// ============================================================================
// Dashboard View Population
// ============================================================================

function updateDashboard() {
  const todayStr = getTodayDateString();

  // 1. KPI Counts
  const totalMeds = medicines.length;
  const todayMeds = medicines.filter(m => m.startDate <= todayStr && todayStr <= m.endDate);
  const takenCount = medicineHistory.filter(h => h.date === todayStr && h.status === 'TAKEN').length;
  const missedCount = medicineHistory.filter(h => h.date === todayStr && h.status === 'MISSED').length;

  document.getElementById('stat-total-medicines').textContent = totalMeds;
  document.getElementById('stat-today-medicines').textContent = todayMeds.length;
  document.getElementById('stat-taken-count').textContent = takenCount;
  document.getElementById('stat-missed-count').textContent = missedCount;

  // 2. Today's Medicines Feed
  renderDashboardTodayMedicines(todayMeds, todayStr);

  // 3. Upcoming Reminders Feed
  renderDashboardUpcomingReminders(todayMeds);

  // 4. Recent History Feed
  renderDashboardRecentHistory();
}

function renderDashboardTodayMedicines(todayMeds, todayStr) {
  const container = document.getElementById('dashboard-today-list');
  if (!container) return;
  container.innerHTML = '';

  if (todayMeds.length === 0) {
    container.innerHTML = `<div class="empty-placeholder" style="padding: 1.5rem 0;">No medicines active for today.</div>`;
    return;
  }

  todayMeds.forEach(med => {
    const hist = medicineHistory.find(h => h.medicineId === med.id && h.date === todayStr);
    let statusBadge = '';
    if (hist && hist.status === 'TAKEN') {
      statusBadge = `<span class="badge-status badge-taken">&#10003; Taken</span>`;
    } else if (hist && hist.status === 'MISSED') {
      statusBadge = `<span class="badge-status badge-missed">&#10005; Missed</span>`;
    } else {
      statusBadge = `<button type="button" class="badge-status badge-upcoming" style="border:none; cursor:pointer;" title="Click to open reminder">Upcoming</button>`;
    }

    const item = document.createElement('div');
    item.className = 'today-med-card';
    const color = med.color || '#10b981';

    item.innerHTML = `
      <div class="today-med-left">
        <div class="med-icon-badge" style="background-color: ${color}20; color: ${color};">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
          </svg>
        </div>
        <div>
          <h4 class="med-item-name">${escapeHtml(med.name)}</h4>
          <span class="med-item-sub">${escapeHtml(med.dosage)} &bull; ${escapeHtml(med.type)} &bull; ${escapeHtml(med.route || 'Oral')}</span>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 1.25rem;">
        <span class="today-med-time">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          ${formatTime12(med.reminderTime)}
        </span>
        ${statusBadge}
      </div>
    `;

    const triggerBtn = item.querySelector('.badge-upcoming');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => showReminder(med, true));
    }

    container.appendChild(item);
  });
}

function renderDashboardUpcomingReminders(todayMeds) {
  const container = document.getElementById('dashboard-upcoming-list');
  if (!container) return;
  container.innerHTML = '';

  const sorted = [...todayMeds].sort((a, b) => (a.reminderTime || '').localeCompare(b.reminderTime || ''));

  if (sorted.length === 0) {
    container.innerHTML = `<div class="empty-placeholder" style="padding: 1.5rem 0;">No upcoming reminders.</div>`;
    return;
  }

  sorted.slice(0, 3).forEach(med => {
    const color = med.color || '#1d68f2';
    const row = document.createElement('div');
    row.className = 'upcoming-rem-item';
    row.innerHTML = `
      <div class="upcoming-rem-left">
        <div class="table-icon-circle" style="background-color: ${color}20; color: ${color};">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
          </svg>
        </div>
        <div>
          <h4 style="font-size: 0.92rem; font-weight: 700; color: #0f172a;">${escapeHtml(med.name)}</h4>
          <span style="font-size: 0.78rem; color: #64748b;">${formatTime12(med.reminderTime)} &bull; ${escapeHtml(med.dosage)} &bull; ${escapeHtml(med.type)}</span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span class="badge-status badge-upcoming">Upcoming</span>
        <button type="button" class="btn-table-action" style="border:none; cursor:pointer;" title="Preview Alert">
          <span class="upcoming-arrow">&rsaquo;</span>
        </button>
      </div>
    `;

    row.querySelector('button')?.addEventListener('click', () => showReminder(med, true));
    container.appendChild(row);
  });
}

function renderDashboardRecentHistory() {
  const tbody = document.getElementById('dash-history-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let list = medicineHistory;
  if (currentDashHistoryFilter === 'TAKEN') {
    list = medicineHistory.filter(h => h.status === 'TAKEN');
  } else if (currentDashHistoryFilter === 'MISSED') {
    list = medicineHistory.filter(h => h.status === 'MISSED');
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding: 1.5rem; color: #94a3b8;">No history records match.</td></tr>`;
    return;
  }

  list.slice(0, 5).forEach(hist => {
    const tr = document.createElement('tr');
    const isTaken = hist.status === 'TAKEN';
    const statusBadge = isTaken
      ? `<span class="badge-status badge-taken">&#10003; TAKEN</span>`
      : `<span class="badge-status badge-missed">&#10005; MISSED</span>`;

    const med = medicines.find(m => m.id === hist.medicineId);
    const color = (med && med.color) ? med.color : (isTaken ? '#10b981' : '#ef4444');

    tr.innerHTML = `
      <td>
        <div class="table-med-name-col">
          <div class="table-icon-circle" style="background-color: ${color}20; color: ${color};">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
            </svg>
          </div>
          <span>${escapeHtml(hist.medicineName)}</span>
        </div>
      </td>
      <td>${formatDateDisplay(hist.date)}</td>
      <td>${formatTime12(hist.scheduledTime)}</td>
      <td>${statusBadge}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================================
// History View Population
// ============================================================================

function renderHistory() {
  const tbody = document.getElementById('history-full-table-body');
  const countLabel = document.getElementById('showing-history-count');
  const emptyState = document.getElementById('history-empty-state');

  const dateFilter = document.getElementById('history-filter-date')?.value || 'ALL';
  const medFilter = document.getElementById('history-filter-med')?.value || 'ALL';

  let list = [...medicineHistory];

  // Date filtering
  const todayStr = getTodayDateString();
  if (dateFilter === 'TODAY') {
    list = list.filter(h => h.date === todayStr);
  } else if (dateFilter === '7DAYS') {
    const sevenAgo = getRelativeDateString(-7);
    list = list.filter(h => h.date >= sevenAgo);
  } else if (dateFilter === '30DAYS') {
    const thirtyAgo = getRelativeDateString(-30);
    list = list.filter(h => h.date >= thirtyAgo);
  }

  // Medicine filtering
  if (medFilter !== 'ALL') {
    list = list.filter(h => h.medicineId === medFilter || h.medicineName === medFilter);
  }

  if (countLabel) {
    countLabel.textContent = `Showing ${list.length} record${list.length === 1 ? '' : 's'}`;
  }

  if (!tbody) return;
  tbody.innerHTML = '';

  if (list.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  list.forEach(hist => {
    const tr = document.createElement('tr');
    const isTaken = hist.status === 'TAKEN';
    const statusBadge = isTaken
      ? `<span class="badge-status badge-taken">&#10003; Taken</span>`
      : `<span class="badge-status badge-missed">&#10005; Missed</span>`;

    tr.innerHTML = `
      <td>${formatDateDisplay(hist.date)}</td>
      <td>${formatTime12(hist.scheduledTime)}</td>
      <td><strong>${escapeHtml(hist.medicineName)}</strong></td>
      <td>${escapeHtml(hist.dosage || '500 mg')}</td>
      <td>${escapeHtml(hist.type || 'Tablet')}</td>
      <td>${statusBadge}</td>
      <td><span style="color: #64748b;">${hist.notes && hist.notes !== '-' ? escapeHtml(hist.notes) : '-'}</span></td>
      <td class="text-center">
        <button type="button" class="btn-table-action btn-action-view" title="View details">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </td>
    `;

    tr.querySelector('.btn-action-view')?.addEventListener('click', () => {
      showToast(`${hist.medicineName}: ${hist.status} at ${formatTime12(hist.scheduledTime)} (${formatDateDisplay(hist.date)})`, 'info');
    });

    tbody.appendChild(tr);
  });
}

function populateHistoryMedDropdown() {
  const select = document.getElementById('history-filter-med');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '<option value="ALL">All Medicines</option>';

  const medMap = new Map();
  medicines.forEach(m => medMap.set(m.id, m.name));
  medicineHistory.forEach(h => {
    if (!medMap.has(h.medicineId)) {
      medMap.set(h.medicineId, h.medicineName);
    }
  });

  medMap.forEach((name, id) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = name;
    select.appendChild(opt);
  });

  if (currentVal) select.value = currentVal;
}

// ============================================================================
// Reminder System & Alarm Check
// ============================================================================

function checkReminders() {
  if (Date.now() < snoozeUntil) return;

  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHours}:${currentMinutes}`;
  const todayStr = getTodayDateString();

  const activeMeds = medicines.filter(m => m.startDate <= todayStr && todayStr <= m.endDate);

  for (const med of activeMeds) {
    if (med.reminderTime === currentTime) {
      const alertKey = `${med.id}_${todayStr}_${currentTime}`;

      if (!triggeredAlerts.has(alertKey)) {
        const alreadyLogged = medicineHistory.some(
          h => h.medicineId === med.id && h.date === todayStr && h.scheduledTime === med.reminderTime
        );

        if (!alreadyLogged) {
          triggeredAlerts.add(alertKey);
          showReminder(med);
          break;
        }
      }
    }
  }
}

function showReminder(medicine, isManualTest = false) {
  if (!medicine) return;
  activeReminderMedicine = medicine;

  playReminderSound();

  document.getElementById('reminder-med-name').textContent = medicine.name;
  document.getElementById('reminder-med-meta').textContent = `${medicine.dosage} • ${medicine.type}`;
  document.getElementById('reminder-med-time').textContent = formatTime12(medicine.reminderTime);

  const modal = document.getElementById('reminder-modal');
  if (modal) modal.style.display = 'flex';

  // Browser Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notifIcon = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💊</text></svg>');
      const notif = new Notification(`Time to take your medicine: ${medicine.name}!`, {
        body: `Dosage: ${medicine.dosage} (${medicine.type})\nScheduled for: ${formatTime12(medicine.reminderTime)}`,
        icon: notifIcon
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {}
  }

  if (isManualTest) {
    showToast(`Triggered test alert for "${medicine.name}"`, 'info');
  }
}

function closeReminderModal() {
  const modal = document.getElementById('reminder-modal');
  if (modal) modal.style.display = 'none';

  const chkSnooze = document.getElementById('chk-snooze');
  if (chkSnooze && chkSnooze.checked) {
    snoozeUntil = Date.now() + (60 * 60 * 1000); // 1 hour
    showToast('Reminders snoozed for 1 hour.', 'info');
    chkSnooze.checked = false;
  }

  activeReminderMedicine = null;
}

function markTaken(medicine) {
  recordHistory(medicine, 'TAKEN');
  showToast(`Great! Marked "${medicine.name}" as Taken.`, 'success');
  updateDashboard();
  renderHistory();
}

function markMissed(medicine) {
  recordHistory(medicine, 'MISSED');
  showToast(`Marked "${medicine.name}" as Missed.`, 'warning');
  updateDashboard();
  renderHistory();
}

function recordHistory(medicine, status) {
  const todayStr = getTodayDateString();
  const entry = {
    id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    medicineId: medicine.id,
    medicineName: medicine.name,
    dosage: medicine.dosage,
    type: medicine.type,
    date: todayStr,
    scheduledTime: medicine.reminderTime,
    status: status,
    notes: medicine.notes || '-',
    recordedAt: new Date().toISOString()
  };

  medicineHistory.unshift(entry);
  saveHistory();
}

// ============================================================================
// Notification Permissions & Web Audio
// ============================================================================

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Browser notifications not supported.', 'warning');
    return;
  }

  if (Notification.permission === 'granted') {
    showToast('Notifications are already active!', 'info');
    return;
  }

  Notification.requestPermission().then(permission => {
    updateNotificationBtn();
    if (permission === 'granted') {
      showToast('Notifications enabled!', 'success');
    }
  });
}

function updateNotificationBtn() {
  const dot = document.querySelector('.bell-dot');
  if (!dot) return;
  if ('Notification' in window && Notification.permission === 'granted') {
    dot.style.background = '#10b981'; // Green dot when enabled
  } else {
    dot.style.background = '#ef4444'; // Red dot when disabled
  }
}

function playReminderSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Tone 1 (659 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const now = ctx.currentTime;
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2 (880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.22);
    gain2.gain.setValueAtTime(0.25, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.22);
    osc2.stop(now + 0.7);
  } catch (e) {}
}

// ============================================================================
// Date & String Helpers
// ============================================================================

function updateGreetingAndDates() {
  const now = new Date();
  const hour = now.getHours();

  let greeting = 'Good Morning';
  let emoji = '☀️';
  if (hour >= 12 && hour < 17) {
    greeting = 'Good Afternoon';
    emoji = '🌤️';
  } else if (hour >= 17) {
    greeting = 'Good Evening';
    emoji = '🌙';
  }

  const greetingElem = document.getElementById('greeting-text');
  if (greetingElem) {
    greetingElem.textContent = `${greeting}, Sasmitha! ${emoji}`;
  }

  const formattedDate = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const headerDateElem = document.getElementById('header-today-date');
  if (headerDateElem) headerDateElem.textContent = formattedDate;

  const scheduleDateElem = document.getElementById('label-today-schedule-date');
  if (scheduleDateElem) scheduleDateElem.textContent = formattedDate;
}

function getTodayDateString() {
  return formatDateYMD(new Date());
}

function getRelativeDateString(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return formatDateYMD(d);
}

function formatDateYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateDisplay(ymdStr) {
  if (!ymdStr) return '-';
  const parts = ymdStr.split('-');
  if (parts.length !== 3) return ymdStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime12(time24) {
  if (!time24) return '-';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${m} ${ampm}`;
}

function getMedicineLifecycleStatus(med, todayStr) {
  if (todayStr < med.startDate) {
    return { key: 'upcoming', label: 'Upcoming', class: 'badge-upcoming' };
  } else if (todayStr > med.endDate) {
    return { key: 'completed', label: 'Completed', class: 'badge-status' };
  } else {
    return { key: 'active', label: 'Active', class: 'badge-active' };
  }
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  container.appendChild(t);

  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => {
      if (t.parentNode === container) container.removeChild(t);
    }, 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
