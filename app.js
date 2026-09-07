import { FOOD_CATALOG, DEFAULT_MEALS, DEFAULT_SUPPLEMENTS, DEFAULT_SETTINGS, LEGACY_EMPTY_TEMPLATE, SUPPLEMENT_GUIDANCE } from './data.js';
import { setupPWA } from './pwa.js';
import {
  STORAGE_KEY, aggregateNutrition, applyPlanImport, buildMealSupplementPlan, clone, createInitialState, ensureDay,
  exportFullState, exportPlan, fastingStatus, formatDuration, formatTime, localDateString,
  migrateLegacyEmptyState, migrateStarterMacroTargets,
  nutritionForFood, nutritionForMeal, recentAverage, recordMeasure, selectDate, setCheck,
  setNote, shiftDate, stringifyExport, targetDifference, updateDay, updateTemplate,
  validateFullRestore, validateState,
} from './model.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const idFrom = (prefix, name) => `${prefix}-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 38)}-${Date.now().toString(36).slice(-5)}`;
const numberValue = (value, fallback = 0) => { const number = Number(value); return Number.isFinite(number) ? number : fallback; };

const baseTemplate = {
  foods: clone(Array.isArray(FOOD_CATALOG) ? FOOD_CATALOG : []),
  meals: clone(Array.isArray(DEFAULT_MEALS) ? DEFAULT_MEALS : []),
  supplements: clone(Array.isArray(DEFAULT_SUPPLEMENTS) ? DEFAULT_SUPPLEMENTS : []),
  medications: [],
  settings: clone(DEFAULT_SETTINGS || {}),
};
const today = localDateString(new Date());
let storageBlocked = false;
let recoveryRaw = '';
let migratedOnLoad = false;
let state = loadState() || createInitialState(baseTemplate, today);
state = ensureDay(state, state.selectedDate || today);
const completedTargets = migrateStarterMacroTargets(state, DEFAULT_SETTINGS);
migratedOnLoad = migratedOnLoad || completedTargets !== state;
state = completedTargets;
let activeView = 'plan';
let selectedImport = null;
let pendingMealId = null;
let toastTimer;
let hiddenDate = state.selectedDate;
let lastActualDate = today;

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    recoveryRaw = stored;
    const result = validateState(JSON.parse(stored));
    if (result.ok) {
      const migrated = migrateLegacyEmptyState(result.state, baseTemplate, LEGACY_EMPTY_TEMPLATE);
      migratedOnLoad = migrated !== result.state;
      return migrated;
    }
    storageBlocked = true; recoveryRaw = stored;
    try { localStorage.setItem(`${STORAGE_KEY}-recovery`, stored); } catch { /* Keep the raw value in memory for this session. */ }
    queueMicrotask(() => showToast('NB Meal Plan saved data needs recovery. Export or import a backup before editing.'));
  } catch (error) {
    storageBlocked = true;
    try { if (recoveryRaw) localStorage.setItem(`${STORAGE_KEY}-recovery`, recoveryRaw); } catch { /* Keep the raw value in memory for this session. */ }
    queueMicrotask(() => showToast('NB Meal Plan saved data needs recovery. Export or import a backup before editing.'));
  }
  return null;
}

function persist() {
  if (storageBlocked) {
    $('#save-status').textContent = 'Saved data needs recovery';
    $('#save-status').classList.add('error');
    $('#storage-warning').hidden = false;
    $('#storage-warning').textContent = 'Your original NB Meal Plan data is protected. Export full backup in Settings to recover it, then import a valid backup. Changes cannot be saved until recovery.';
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, stringifyExport(state));
    $('#save-status').textContent = 'Saved on this device';
    $('#save-status').classList.remove('error');
    $('#storage-warning').hidden = true;
    $('#storage-message').textContent = 'Your NB Meal Plan data stays in this browser on this device.';
  } catch (error) {
    $('#save-status').textContent = 'Could not save';
    $('#save-status').classList.add('error');
    $('#storage-warning').hidden = false;
    $('#storage-warning').textContent = 'NB Meal Plan changes could not be saved on this device. Export a full backup in Settings before leaving.';
    $('#storage-message').textContent = 'NB Meal Plan storage is unavailable. Export a backup before leaving this page.';
    showToast('Could not save on this device. Export a backup now.');
  }
}

function commit(next, message = '') {
  const checked = validateState(next);
  if (!checked.ok) { showToast('Please check the entered values. Your saved plan has not changed.'); render(); return; }
  state = next;
  persist();
  render();
  if (message) showToast(message);
}

function day() {
  state = ensureDay(state, state.selectedDate);
  return state.days[state.selectedDate];
}

function foods() { return day().foods || []; }

function foodById(id) { return foods().find((food) => food.id === id); }

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function setView(view) {
  activeView = view;
  $$('.view-panel').forEach((panel) => { panel.hidden = panel.dataset.panel !== view; panel.classList.toggle('active', panel.dataset.panel === view); });
  $$('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view));
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
  const current = day();
  $('#date-picker').value = state.selectedDate;
  $('#today-button').hidden = state.selectedDate === localDateString(new Date());
  $('#page-date').textContent = activeView === 'plan' ? (state.selectedDate === localDateString(new Date()) ? 'Today' : prettyDate(state.selectedDate)) : ({ progress: 'Progress', foods: 'Foods', settings: 'Settings' }[activeView] || 'Plan');
  $('#day-label').textContent = prettyDate(state.selectedDate);
  renderPlan(current);
  if (activeView === 'progress') renderProgress();
  if (activeView === 'foods') renderFoods();
  if (activeView === 'settings') renderSettings(current);
  if (storageBlocked) {
    $('#save-status').textContent = 'Saved data needs recovery';
    $('#save-status').classList.add('error');
    $('#storage-message').textContent = 'Your original NB Meal Plan data is protected. Export full backup to recover that original file, or import a valid full backup.';
    persist();
  }
}

function prettyDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
}

function renderFasting(current) {
  const fast = fastingStatus(current.settings);
  $('#fasting-card').innerHTML = `<div><span class="eyebrow">${esc(fast.label)}</span><strong>${fast.state === 'eating' ? `${formatTime(current.settings.eatingStart)} – ${formatTime(current.settings.eatingEnd)}` : `Next eating window in ${formatDuration(fast.remaining)}`}</strong></div><span class="fasting-time">${fast.state === 'eating' ? `${formatDuration(fast.remaining)} left` : `${formatDuration(fast.elapsed)} fasting`}</span>`;
}

function renderPlan(current) {
  const summary = aggregateNutrition(current.meals, current.supplements, current.foods);
  const loggedMeals = current.meals.filter((meal) => state.checks?.[state.selectedDate]?.[`meal:${meal.id}`]);
  const logged = aggregateNutrition(loggedMeals, [], current.foods);
  const diffs = targetDifference(summary, current.settings);
  const supplementPlan = buildMealSupplementPlan(current, DEFAULT_SUPPLEMENTS, SUPPLEMENT_GUIDANCE);
  renderFasting(current);
  $('#meals-list').innerHTML = current.meals.length ? current.meals.map(meal => renderMeal(meal, supplementPlan.byMeal[meal.id])).join('') : '<div class="card empty-state">No meals yet. Add the first one to shape your day.</div>';
  const mealCounts = { logged: loggedMeals.length, total: current.meals.length };
  $('#summary-card').innerHTML = renderSummary(summary, diffs, current.settings, logged, mealCounts);
  $('#mobile-summary').innerHTML = `<div class="card summary-card">${renderSummary(summary, diffs, current.settings, logged, mealCounts)}</div>`;
  $('#supplements-card').innerHTML = renderSupplements(current, supplementPlan);
  $('#medications-card').innerHTML = renderMedications(current);
  $('#energy-card').innerHTML = renderEnergyReference(current.settings);
  $('#checks-card').innerHTML = renderChecks(current);
  $('#daily-note').value = state.notes?.[state.selectedDate] || '';
}

function renderMeal(meal, supplementRows = []) {
  const checked = Boolean(state.checks?.[state.selectedDate]?.[`meal:${meal.id}`]);
  const total = nutritionForMeal(meal, foods());
  return `<article class="meal-card" data-meal-id="${esc(meal.id)}"><div class="meal-head"><div class="meal-title"><div><label class="meal-time">Time<input class="meal-time-input" data-meal-time="${esc(meal.id)}" type="time" value="${esc(meal.time)}" aria-label="${esc(meal.name)} time"></label><h3>${esc(meal.name)}</h3></div></div><div class="meal-actions"><label class="check-label"><input type="checkbox" data-meal-check="${esc(meal.id)}" ${checked ? 'checked' : ''}> Logged</label><button class="quiet-button" data-action="remove-meal" data-meal-id="${esc(meal.id)}" type="button" aria-label="Remove ${esc(meal.name)}">Remove</button></div></div><div class="meal-items">${(meal.items || []).map((item, index) => renderFoodRow(meal, item, index)).join('')}</div><button class="add-food-row" data-action="add-item" data-meal-id="${esc(meal.id)}" type="button">+ Add food</button><div class="meal-total"><span>${total.knownKcal === false ? 'Energy —' : `${Math.round(total.kcal)} kcal`}</span><strong>${total.protein == null ? '—' : `${Math.round(total.protein)}g protein`}</strong></div>${renderMealSupplements(meal, supplementRows)}</article>`;
}

function renderScheduledSupplement(supplement) {
  const checked = Boolean(state.checks?.[state.selectedDate]?.[`supp:${supplement.id}`]);
  return `<div class="meal-supplement"><div class="meal-supplement-head"><strong>${esc(supplement.name)}</strong><label class="check-label"><input type="checkbox" data-supp-check="${esc(supplement.id)}" ${checked ? 'checked' : ''} aria-label="${esc(supplement.name)} taken">Taken</label></div><p class="guidance-dose">${esc(supplement.dose || 'Dose not set')}</p><p class="guidance-time">${esc(formatTime(supplement.time))} · Your saved schedule</p>${supplement.note ? `<p class="supplement-note">${esc(supplement.note)}</p>` : ''}</div>`;
}

function renderMealSupplements(meal, rows) {
  if (!rows.length) return '';
  const recommendations = rows.some(row => row.kind === 'recommendation');
  return `<section class="meal-supplements" aria-label="Supplements with ${esc(meal.name)}"><div class="meal-supplement-heading"><h4>With this meal</h4><span>${esc(formatTime(meal.time))}</span></div>${recommendations ? '<p class="supplement-note">Suggested amounts. Mark only what you actually take; optional items are not required.</p>' : ''}${rows.map(row => {
    if (row.kind === 'active') return renderScheduledSupplement(row.supplement);
    const { supplement, guidance, slot } = row;
    const key = `supp-meal:${guidance.group || supplement.id}:${meal.id}`;
    const checked = Boolean(state.checks?.[state.selectedDate]?.[key]);
    const name = supplement.name.replace(/\s*—.*$/, '');
    return `<div class="meal-supplement"><div class="meal-supplement-head"><strong>${esc(name)} <span class="supplement-tag">${esc(slot.label || 'Suggested')}</span></strong><label class="check-label"><input type="checkbox" data-daily-check="${esc(key)}" ${checked ? 'checked' : ''} aria-label="${esc(name)} taken with ${esc(meal.name)}">Taken</label></div><p class="guidance-dose">${esc(slot.amount)}</p>${slot.note ? `<p class="supplement-note">${esc(slot.note)}</p>` : ''}<details class="meal-supplement-details"><summary>Details & source</summary><p class="supplement-note">${esc(guidance.note)}${guidance.source ? ` <a href="${esc(guidance.source)}" target="_blank" rel="noopener noreferrer">Source</a>` : ''}</p></details></div>`;
  }).join('')}</section>`;
}

function renderFoodRow(meal, item, index) {
  const food = foodById(item.foodId);
  if (!food) return '';
  const nutrition = nutritionForFood(food, item.quantity);
  const estimated = food.source === 'generic' || food.verified === false;
  return `<div class="food-row"><div class="food-name"><strong>${esc(food.name)}${estimated ? '<span class="estimate-pill">estimated</span>' : ''}</strong><small>${esc(food.unit)} · ${nutrition.kcal == null ? 'energy unknown' : `${Math.round(nutrition.kcal)} kcal`}</small></div><input class="quantity-input" data-quantity data-meal-id="${esc(meal.id)}" data-item-index="${index}" type="number" min="0" step="${numberValue(food.step, 1)}" value="${numberValue(item.quantity)}" aria-label="${esc(food.name)} quantity in ${esc(meal.name)}"><button class="round-button" data-action="decrease" data-meal-id="${esc(meal.id)}" data-item-index="${index}" type="button" aria-label="Decrease ${esc(food.name)}">−</button><button class="round-button" data-action="increase" data-meal-id="${esc(meal.id)}" data-item-index="${index}" type="button" aria-label="Increase ${esc(food.name)}">+</button><button class="round-button remove-item" data-action="remove-item" data-meal-id="${esc(meal.id)}" data-item-index="${index}" type="button" aria-label="Remove ${esc(food.name)}">×</button></div>`;
}

function renderSummary(summary, diffs, settings, logged, mealCounts) {
  const kcal = Number.isFinite(summary.kcal) ? Math.round(summary.kcal) : '—';
  const macro = (label, value, target) => { const pending = target === null || target === undefined; const width = target > 0 && value != null ? Math.min(100, value / target * 100) : 0; return `<div class="macro-line"><span>${label}<small>${pending ? 'Goal not set' : `Goal ${Math.round(target)}g`}</small></span><div class="macro-bar" role="progressbar" aria-label="${label} planned compared with goal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(width)}"><span style="width:${width}%"></span></div><span class="macro-value">${value == null ? '—' : `${Math.round(value)}g`}</span></div>`; };
  const calorieTarget = settings.calories === null || settings.calories === undefined ? 'Target pending' : `Target ${settings.calories}`;
  const foodKcal = Number.isFinite(summary.foodKcal) ? Math.round(summary.foodKcal) : '—';
  const supplementKcal = Math.round(summary.supplementKcal || 0);
  return `<div class="summary-top"><div><span class="eyebrow">Daily plan</span><div class="summary-kcal">${kcal}<small> kcal planned</small></div></div><span class="muted">${calorieTarget}</span></div><div class="target-diff ${diffs.kcal > 0 ? 'over' : ''}">${diffs.kcal == null ? 'Calorie goal not set' : `${Math.abs(Math.round(diffs.kcal))} kcal ${diffs.kcal >= 0 ? 'above' : 'below'} goal (estimated)`}</div><p class="summary-note">Food ${foodKcal} kcal + scheduled supplements ${supplementKcal} kcal.</p><div class="logged-line"><span>Meals eaten · ${mealCounts.logged}/${mealCounts.total}</span><strong>${logged.knownKcal ? `${Math.round(logged.kcal)} kcal` : '—'}</strong></div>${mealCounts.logged === 0 && mealCounts.total > 0 ? '<p class="summary-note">Check “Logged” on a meal after eating it.</p>' : ''}<div class="macro-list">${macro('Protein', summary.protein, settings.protein)}${macro('Carbs', summary.carbs, settings.carbs)}${macro('Fat', summary.fat, settings.fat)}</div><p class="summary-note">Grams shown are planned amounts. Goals are flexible and editable in Settings.</p>${summary.genericFood ? '<p class="summary-note">Nutrition uses estimates. Compare your package labels.</p>' : ''}${summary.unknownSupplementKcal ? '<p class="summary-note">Some supplement energy is unknown, so the total is incomplete.</p>' : ''}`;
}

function renderSupplements(current, supplementPlan) {
  const { activeUnassigned: active, recommendations: suggestions, incomplete } = supplementPlan;
  const reviewRow = (supplement) => {
    const guide = SUPPLEMENT_GUIDANCE[supplement.id];
    return guide ? `<details class="supplement-guidance"><summary>${esc(supplement.name)}</summary><p class="guidance-dose">${esc(guide.amount)}</p>${guide.timing ? `<p class="guidance-time">${esc(guide.timing)}</p>` : ''}<p class="supplement-note">${esc(guide.note)}${guide.source ? ` <a href="${esc(guide.source)}" target="_blank" rel="noopener noreferrer">Source</a>` : ''}</p><p class="supplement-note">Saved label: ${esc(supplement.dose || '')} ${esc(supplement.note || '')}</p></details>` : `<div class="supplement-row review-row"><span>${esc(supplement.name)}<small>${esc(supplement.dose || 'Daily dose not recorded')}${supplement.note ? ` · ${esc(supplement.note)}` : ''}</small></span><span class="supplement-meta">Dose not recorded</span></div>`;
  };
  return `<div class="section-heading"><div><span class="eyebrow">Supplements</span><h3>Supplement details</h3></div></div><p class="supplement-note">Meal-time amounts and Taken checks are inside the meal cards. Recommendations follow breakfast, lunch and dinner when their times change. Taken checks save on this device.</p><div class="supplement-list">${active.length ? '<p class="supplement-note"><strong>Other saved times</strong><br>These keep the time recorded in Settings.</p>' + active.map(renderScheduledSupplement).join('') : ''}${suggestions.map(reviewRow).join('')}${incomplete.length ? '<p class="supplement-note"><strong>Dose details to add</strong><br>Record the full label and actual daily amount in Settings before scheduling.</p>' + incomplete.map(reviewRow).join('') : ''}</div>`;
}

function renderMedications(current) {
  const medications = Array.isArray(current.medications) ? current.medications : [];
  const active = medications.filter((medication) => medication.status !== 'review');
  const review = medications.filter((medication) => medication.status === 'review');
  const activeRows = active.map((medication) => { const key = `med:${medication.id}`; const checked = Boolean(state.checks?.[state.selectedDate]?.[key]); const time = medication.time ? formatTime(medication.time) : 'Time optional'; return `<label class="supplement-row"><span><input type="checkbox" data-med-check="${esc(medication.id)}" ${checked ? 'checked' : ''}> ${esc(medication.name)}<small>${esc(medication.dose || 'Dose details pending')}</small></span><span class="supplement-meta">${esc(time)}</span></label>${medication.note ? `<p class="supplement-note">${esc(medication.note)}</p>` : ''}`; }).join('');
  const reviewRows = review.map((medication) => `<div class="supplement-row review-row"><span>${esc(medication.name)}<small>${esc(medication.dose || 'Details pending')}</small></span><span class="supplement-meta">Needs confirmation</span></div>`).join('');
  return `<div class="section-heading"><div><span class="eyebrow">Medications</span><h3>Medication check-in</h3></div></div><div class="supplement-list">${activeRows || (!reviewRows ? '<span class="muted">Medications awaiting details.</span>' : '')}${reviewRows ? `<p class="supplement-note">Needs confirmation</p>${reviewRows}` : ''}</div><p class="summary-note">Check an active item only when it applies today. Keep frequency and other instructions in the as-prescribed note.</p>`;
}

function renderEnergyReference(settings = {}) {
  const active = settings.energyActive;
  const resting = settings.energyResting;
  const bothKnown = Number.isFinite(active) && Number.isFinite(resting);
  const value = (number) => Number.isFinite(number) ? `${number} kcal` : 'Unknown';
  return `<div class="section-heading"><div><span class="eyebrow">Energy reference</span><h3>Activity context</h3></div></div><p class="summary-note">Estimate/reference only; this is not an intake target.</p><div class="energy-lines"><div><span>Active</span><strong>${value(active)}</strong></div><div><span>Resting</span><strong>${value(resting)}</strong></div>${bothKnown ? `<div><span>Reference sum</span><strong>${active + resting} kcal</strong></div>` : ''}</div>${settings.energyPeriod ? `<p class="summary-note">${esc(settings.energyPeriod)}</p>` : ''}${settings.workNote ? `<p class="summary-note">${esc(settings.workNote)}</p>` : ''}`;
}

function renderChecks(current) {
  const checks = state.checks?.[state.selectedDate] || {};
  const items = [{ id: 'water', label: 'Water bottle filled' }, { id: 'kitchen', label: 'Food prepped' }];
  const training = current.settings.trainingStart && current.settings.trainingEnd ? `${formatTime(current.settings.trainingStart)} – ${formatTime(current.settings.trainingEnd)}` : '';
  if (training) items.push({ id: 'training', label: 'Training done' });
  return `<div class="section-heading"><div><span class="eyebrow">Daily checks</span><h3>Daily checklist</h3></div></div>${training ? `<p class="summary-note">${esc(training)}</p>` : ''}<div class="checks-list">${items.map((item) => `<label class="check-row"><span>${esc(item.label)}</span><input type="checkbox" data-daily-check="${item.id}" ${checks[item.id] ? 'checked' : ''}></label>`).join('')}</div>`;
}

function renderProgress() {
  const history = state.history || { weights: [], waist: [] };
  const card = (kind, title, unit) => { const entries = history[kind] || []; const average = recentAverage(entries); return `<article class="card progress-card"><span class="eyebrow">${title}</span><div class="progress-number">${average.value == null ? '—' : average.value}<small> ${unit}</small></div><p class="entry-note">${average.count ? `${average.label} · ${average.count} recorded` : 'Add a first entry below.'}</p><div class="entry-list">${entries.slice(-5).reverse().map((entry) => `<div class="entry-line"><span>${esc(prettyDate(entry.date))}</span><span>${entry.value} ${unit}</span></div>`).join('') || '<div class="empty-state">No entries yet.</div>'}</div><form class="measure-form" data-measure-form="${kind}"><input type="number" min="0.1" step="0.1" required placeholder="New ${title.toLowerCase()}" aria-label="New ${title.toLowerCase()}"><button class="button" type="submit">Log</button></form></article>`; };
  $('#progress-content').innerHTML = `${card('weights', 'Weight', 'lb')}${card('waist', 'Waist', 'in')}`;
}

function renderFoods() {
  const list = foods();
  $('#foods-list').innerHTML = list.length ? list.map((food) => `<article class="food-card"><div class="food-card-head"><div><h3>${esc(food.name)}</h3><div class="food-meta">${esc(food.serving)} ${esc(food.unit)} serving · ${food.source === 'generic' || food.verified === false ? 'Estimated entry' : 'Label entry'}</div></div><span class="estimate-pill">${food.source === 'generic' || food.verified === false ? 'estimate' : 'label'}</span></div><div class="nutrition-mini">${food.kcal == null ? 'Energy unknown' : `${food.kcal} kcal`} · ${food.protein == null ? '—' : `${food.protein}g protein`} · ${food.carbs == null ? '—' : `${food.carbs}g carbs`} · ${food.fat == null ? '—' : `${food.fat}g fat`}</div><div class="card-actions"><button class="quiet-button" data-action="edit-food" data-food-id="${esc(food.id)}" type="button">Edit</button><button class="quiet-button" data-action="delete-food" data-food-id="${esc(food.id)}" type="button">Remove</button></div></article>`).join('') : '<div class="card empty-state">No foods yet. Add one to start your library.</div>';
}

function renderSettings(current) {
  const s = current.settings || {};
  const inputNumber = (name, value) => `<input name="${name}" type="number" min="0" step="1" value="${value === null || value === undefined ? '' : esc(value)}">`;
  const medications = Array.isArray(current.medications) ? current.medications : [];
  const supplementEditor = (supplement) => `<div class="form-grid two"><label>Name<input name="supp-name-${esc(supplement.id)}" maxlength="120" value="${esc(supplement.name)}"></label><label>Dose<input name="supp-dose-${esc(supplement.id)}" maxlength="120" value="${esc(supplement.dose || '')}"></label><label>Time<input name="supp-time-${esc(supplement.id)}" type="time" value="${esc(supplement.time || '')}"></label><label>Status<select name="supp-status-${esc(supplement.id)}"><option value="active" ${supplement.status !== 'review' ? 'selected' : ''}>Active</option><option value="review" ${supplement.status === 'review' ? 'selected' : ''}>Needs confirmation</option></select></label><label>As-prescribed note<input name="supp-note-${esc(supplement.id)}" maxlength="500" value="${esc(supplement.note || '')}"></label><button class="quiet-button" data-action="remove-supplement" data-supplement-id="${esc(supplement.id)}" type="button">Remove supplement</button></div>`;
  const medicationEditor = (medication) => `<div class="medication-editor" data-medication-id="${esc(medication.id)}"><div class="form-grid two"><label>Name<input name="med-name-${esc(medication.id)}" maxlength="120" value="${esc(medication.name)}"></label><label>Dose as prescribed<input name="med-dose-${esc(medication.id)}" maxlength="120" value="${esc(medication.dose || '')}"></label><label>Time (optional)<input name="med-time-${esc(medication.id)}" type="time" value="${esc(medication.time || '')}"></label><label>Status<select name="med-status-${esc(medication.id)}"><option value="active" ${medication.status !== 'review' ? 'selected' : ''}>Active</option><option value="review" ${medication.status === 'review' ? 'selected' : ''}>Needs confirmation</option></select></label><label>As-prescribed note<input name="med-note-${esc(medication.id)}" maxlength="500" value="${esc(medication.note || '')}"></label></div><button class="quiet-button" data-action="remove-medication" data-medication-id="${esc(medication.id)}" type="button">Remove medication</button></div>`;
  $('#settings-form').innerHTML = `<fieldset class="form-section"><legend>Daily targets</legend><div class="form-grid two"><label>Calories${inputNumber('calories', s.calories)}</label><label>Protein (g)${inputNumber('protein', s.protein)}</label><label>Carbs (g)${inputNumber('carbs', s.carbs)}</label><label>Fat (g)${inputNumber('fat', s.fat)}</label></div><p class="supplement-note">Targets can stay blank while you personalize the plan.</p></fieldset><fieldset class="form-section"><legend>Timing</legend><div class="form-grid two"><label>Eating starts<input name="eatingStart" type="time" value="${esc(s.eatingStart || '')}"></label><label>Eating ends<input name="eatingEnd" type="time" value="${esc(s.eatingEnd || '')}"></label><label>Training starts<input name="trainingStart" type="time" value="${esc(s.trainingStart || '')}"></label><label>Training ends<input name="trainingEnd" type="time" value="${esc(s.trainingEnd || '')}"></label></div><p class="supplement-note">Training times are optional; leave both blank until known.</p></fieldset><fieldset class="form-section"><legend>Energy reference</legend><div class="form-grid two"><label>Active energy (kcal)${inputNumber('energyActive', s.energyActive)}</label><label>Resting energy (kcal)${inputNumber('energyResting', s.energyResting)}</label></div><label>Reference period / source<input name="energyPeriod" maxlength="120" value="${esc(s.energyPeriod || '')}" placeholder="e.g. watch estimate, typical workday"></label><label>Work context note<textarea name="workNote" maxlength="500" rows="3" placeholder="Optional context for the reference">${esc(s.workNote || '')}</textarea></label><p class="supplement-note">These are reference values only, never an intake target.</p></fieldset><fieldset class="form-section"><legend>Supplements</legend><div class="form-grid">${current.supplements.map(supplementEditor).join('') || '<p class="muted">Supplements awaiting details.</p>'}<button class="button button-secondary button-small" data-action="add-supplement" type="button">+ Add supplement</button></div></fieldset><fieldset class="form-section"><legend>Medications</legend><div class="form-grid">${medications.map(medicationEditor).join('') || '<p class="muted">Medications awaiting details.</p>'}<button class="button button-secondary button-small" data-action="add-medication" type="button">+ Add medication</button></div></fieldset><button class="button settings-save" type="submit">Save settings</button>`;
}

function openFoodDialog(food = null) {
  $('#food-dialog-title').textContent = food ? 'Edit food' : 'Add a food';
  $('#food-id').value = food?.id || '';
  $('#food-name').value = food?.name || '';
  $('#food-unit').value = food?.unit || 'g';
  $('#food-serving').value = food?.serving ?? '';
  $('#food-step').value = food?.step ?? '';
  $('#food-kcal').value = food?.kcal ?? '';
  $('#food-protein').value = food?.protein ?? '';
  $('#food-carbs').value = food?.carbs ?? '';
  $('#food-fat').value = food?.fat ?? '';
  $('#food-note').value = food?.note || '';
  $('#food-dialog').showModal();
}

function openMealDialog() { $('#meal-name').value = ''; $('#meal-time').value = '12:00'; $('#meal-dialog').showModal(); }

function chooseFood(mealId) {
  const available = foods();
  if (!available.length) { showToast('Add a food to your library first.'); setView('foods'); return; }
  pendingMealId = mealId;
  $('#food-search').value = '';
  renderFoodChoices(available);
  $('#food-picker').showModal();
}

function renderFoodChoices(list = foods()) {
  const query = ($('#food-search')?.value || '').trim().toLowerCase();
  const matching = list.filter((food) => food.name.toLowerCase().includes(query));
  $('#food-choice').innerHTML = matching.length ? matching.map((food) => `<option value="${esc(food.id)}">${esc(food.name)} · ${esc(food.unit)}</option>`).join('') : '<option value="" disabled>No matching food</option>';
}

function addSelectedFood(event) {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  const food = foodById($('#food-choice').value);
  if (!food || !pendingMealId) return;
  const current = day();
  const meals = current.meals.map((meal) => meal.id === pendingMealId ? { ...meal, items: [...meal.items, { foodId: food.id, quantity: food.serving }] } : meal);
  $('#food-picker').close(); pendingMealId = null;
  commit(updateDay(state, state.selectedDate, { meals }), 'Food added');
}

function adjustItem(mealId, index, direction) {
  const current = day();
  const meals = current.meals.map((meal) => {
    if (meal.id !== mealId) return meal;
    const items = meal.items.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const food = foodById(item.foodId);
      const step = numberValue(food?.step, 1);
      return { ...item, quantity: Math.max(0, numberValue(item.quantity) + step * direction) };
    });
    return { ...meal, items };
  });
  commit(updateDay(state, state.selectedDate, { meals }));
}

function removeItem(mealId, index) {
  const current = day();
  const meals = current.meals.map((meal) => meal.id === mealId ? { ...meal, items: meal.items.filter((_, itemIndex) => itemIndex !== index) } : meal);
  commit(updateDay(state, state.selectedDate, { meals }));
}

function saveFood(event) {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  const id = $('#food-id').value || idFrom('food', $('#food-name').value);
  const old = foodById(id);
  const readOptional = (selector) => { const value = $(selector).value.trim(); return value === '' ? null : numberValue(value); };
  const food = { id, name: $('#food-name').value.trim(), unit: $('#food-unit').value, serving: numberValue($('#food-serving').value), step: numberValue($('#food-step').value), kcal: readOptional('#food-kcal'), protein: readOptional('#food-protein'), carbs: readOptional('#food-carbs'), fat: readOptional('#food-fat'), source: old?.source || 'custom', verified: old?.verified ?? false, note: $('#food-note').value.trim() };
  if (!food.name || food.serving <= 0 || food.step <= 0) return;
  const replace = (list) => list.map((entry) => entry.id === id ? food : entry);
  const current = day();
  const nextFoods = old ? replace(current.foods) : [...current.foods, food];
  let next = updateDay(state, state.selectedDate, { foods: nextFoods });
  next = updateTemplate(next, { ...next.template, foods: old ? replace(next.template.foods) : [...next.template.foods, food] });
  $('#food-dialog').close();
  commit(next, old ? 'Food updated' : 'Food added');
}

function saveSettings(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const settings = { ...day().settings };
  ['calories', 'protein', 'carbs', 'fat', 'energyActive', 'energyResting'].forEach((key) => { const raw = String(form.get(key) ?? '').trim(); settings[key] = raw === '' ? null : numberValue(raw, NaN); });
  ['eatingStart', 'eatingEnd', 'trainingStart', 'trainingEnd'].forEach((key) => { settings[key] = form.get(key); });
  settings.energyPeriod = String(form.get('energyPeriod') || '').trim();
  settings.workNote = String(form.get('workNote') || '').trim();
  const targetInvalid = ['calories', 'protein', 'carbs', 'fat'].some((key) => settings[key] !== null && (!Number.isFinite(settings[key]) || settings[key] < 0 || settings[key] > 100000));
  const energyInvalid = ['energyActive', 'energyResting'].some((key) => settings[key] !== null && (!Number.isFinite(settings[key]) || settings[key] < 0 || settings[key] > 10000000));
  const eatingInvalid = ['eatingStart', 'eatingEnd'].some((key) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(settings[key]));
  const trainingBlank = settings.trainingStart === '' && settings.trainingEnd === '';
  const trainingInvalid = !trainingBlank && ['trainingStart', 'trainingEnd'].some((key) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(settings[key]));
  if (targetInvalid || energyInvalid || eatingInvalid || trainingInvalid || settings.energyPeriod.length > 120 || settings.workNote.length > 500) { showToast('Check targets, times, and reference details before saving.'); return; }
  const supplements = day().supplements.map((supplement) => ({ ...supplement, name: String(form.get(`supp-name-${supplement.id}`) || '').trim(), dose: String(form.get(`supp-dose-${supplement.id}`) || ''), time: String(form.get(`supp-time-${supplement.id}`) || ''), note: String(form.get(`supp-note-${supplement.id}`) || '').trim(), status: form.get(`supp-status-${supplement.id}`) === 'review' ? 'review' : 'active' }));
  const medications = (day().medications || []).map((medication) => ({ ...medication, name: String(form.get(`med-name-${medication.id}`) || '').trim(), dose: String(form.get(`med-dose-${medication.id}`) || '').trim(), time: String(form.get(`med-time-${medication.id}`) || ''), note: String(form.get(`med-note-${medication.id}`) || '').trim(), status: form.get(`med-status-${medication.id}`) === 'review' ? 'review' : 'active' }));
  if (supplements.some((supplement) => !supplement.name || supplement.name.length > 120 || supplement.dose.length > 120 || supplement.note.length > 500 || (supplement.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(supplement.time)))) { showToast('Check supplement names, doses, notes, and times before saving.'); return; }
  if (medications.some((medication) => !medication.name || medication.name.length > 120 || medication.dose.length > 120 || medication.note.length > 500 || (medication.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(medication.time)))) { showToast('Check medication names, doses, notes, and times before saving.'); return; }
  commit(updateDay(state, state.selectedDate, { settings, supplements, medications }), 'Settings saved');
}

function downloadJson(value, filename) {
  const content = storageBlocked && recoveryRaw && filename.includes('backup') ? recoveryRaw : stringifyExport(value);
  const blob = new Blob([content], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob); link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function beginImport(file) {
  if (!file || file.size > 2_000_000) { showToast('That backup is larger than 2 MB.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      selectedImport = JSON.parse(reader.result);
      const template = selectedImport.template || selectedImport;
      const mealCount = Array.isArray(template.meals) ? template.meals.length : 0;
      const foodCount = Array.isArray(template.foods) ? template.foods.length : 0;
      $('#import-preview').textContent = selectedImport.type === 'dayplate-plan' ? `Plan preview: ${mealCount} meals and ${foodCount} foods will be applied to ${prettyDate(state.selectedDate)}. Your progress, notes, and checks on other days stay here.` : `Full backup preview: this file contains ${mealCount} meals and ${foodCount} foods. Applying it replaces all NB Meal Plan data after one more confirmation.`;
      $('#import-form [value="full"]').disabled = selectedImport.type === 'dayplate-plan';
      $('#import-form [value="plan"]').checked = true;
      $('#import-dialog').showModal();
    } catch { showToast('That file is not valid JSON.'); }
  };
  reader.readAsText(file);
}

function applyImport(event) {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  if (!selectedImport) return;
  const mode = $('input[name="import-mode"]:checked').value;
  if (storageBlocked && mode !== 'full') { showToast('Import a valid full backup to recover saved tracking. Export the protected original first if needed.'); return; }
  if (mode === 'full') {
    if (!window.confirm('Review: this will replace meals, foods, settings, notes, checks, and progress on this device. Continue?')) return;
    const result = validateFullRestore(selectedImport);
    if (!result.ok) { showToast(result.error); return; }
    state = result.state;
  } else {
    const result = applyPlanImport(state, selectedImport, state.selectedDate);
    if (!result.ok) { showToast(result.error); return; }
    state = result.state;
    state.checks[state.selectedDate] = {};
  }
  storageBlocked = false;
  recoveryRaw = '';
  $('#import-dialog').close(); selectedImport = null; persist(); render(); showToast('Import applied');
}

document.addEventListener('click', (event) => {
  if (event.target.closest('#mobile-more')) { $('#mobile-date').value = state.selectedDate; $('#day-dialog').showModal(); return; }
  const view = event.target.closest('[data-view]'); if (view) { setView(view.dataset.view); return; }
  const action = event.target.closest('[data-action]');
  if (action) {
    const { action: type, mealId, itemIndex, foodId } = action.dataset;
    if (type === 'increase') adjustItem(mealId, Number(itemIndex), 1);
    if (type === 'decrease') adjustItem(mealId, Number(itemIndex), -1);
    if (type === 'add-item') chooseFood(mealId);
    if (type === 'remove-item') removeItem(mealId, Number(itemIndex));
    if (type === 'remove-meal' && window.confirm('Remove this meal from the selected day?')) commit(updateDay(state, state.selectedDate, { meals: day().meals.filter((meal) => meal.id !== mealId) }));
    if (type === 'edit-food') openFoodDialog(foodById(foodId));
    if (type === 'delete-food') { const inMeals = (meals) => (meals || []).some((meal) => meal.items?.some((item) => item.foodId === foodId)); const referenced = inMeals(state.template.meals) || inMeals(day().meals); if (referenced) { showToast('Remove this food from its meals before deleting it.'); return; } if (!window.confirm('Remove this food from the library?')) return; const nextFoods = foods().filter((food) => food.id !== foodId); let next = updateDay(state, state.selectedDate, { foods: nextFoods }); next = updateTemplate(next, { ...next.template, foods: next.template.foods.filter((food) => food.id !== foodId) }); commit(next); }
    if (type === 'add-medication') { const medication = { id: idFrom('med', 'medication'), name: 'New medication', dose: '', time: '', note: '', status: 'review' }; commit(updateDay(state, state.selectedDate, { medications: [...(day().medications || []), medication] }), 'Medication added for confirmation'); }
    if (type === 'remove-medication') { const medicationId = action.dataset.medicationId; commit(updateDay(state, state.selectedDate, { medications: (day().medications || []).filter((medication) => medication.id !== medicationId) }), 'Medication removed'); }
    if (type === 'add-supplement') { const supplement = { id: idFrom('supp', 'supplement'), name: 'New supplement', time: '', dose: '', note: '', kcal: null, fat: null, status: 'review' }; commit(updateDay(state, state.selectedDate, { supplements: [...day().supplements, supplement] }), 'Supplement added for confirmation'); }
    if (type === 'remove-supplement') { const supplementId = action.dataset.supplementId; commit(updateDay(state, state.selectedDate, { supplements: day().supplements.filter((supplement) => supplement.id !== supplementId) }), 'Supplement removed'); }
    return;
  }
  if (event.target.id === 'prev-day') commit(selectDate(state, shiftDate(state.selectedDate, -1)));
  if (event.target.id === 'next-day') commit(selectDate(state, shiftDate(state.selectedDate, 1)));
  if (event.target.id === 'today-button') commit(selectDate(state, localDateString(new Date())));
  if (event.target.id === 'add-meal') openMealDialog();
  if (event.target.id === 'add-food') openFoodDialog();
  if (event.target.id === 'save-template') { commit(updateTemplate(state, day()), 'This plan is now the template for new days'); }
  if (event.target.id === 'export-plan' || event.target.id === 'settings-export-plan') downloadJson(exportPlan(state), `nbmealplan-plan-${state.selectedDate}.json`);
  if (event.target.id === 'export-backup' || event.target.id === 'settings-export-backup') downloadJson(exportFullState(state), `nbmealplan-backup-${state.selectedDate}.json`);
  if (event.target.id === 'import-button' || event.target.id === 'settings-import') $('#import-file').click();
});

document.addEventListener('change', (event) => {
  const target = event.target;
  if (target.id === 'date-picker' && target.value) { commit(selectDate(state, target.value)); return; }
  if (target.matches('[data-quantity]')) {
    const current = day(); const meals = current.meals.map((meal) => meal.id === target.dataset.mealId ? { ...meal, items: meal.items.map((item, index) => index === Number(target.dataset.itemIndex) ? { ...item, quantity: Math.max(0, numberValue(target.value)) } : item) } : meal); commit(updateDay(state, state.selectedDate, { meals })); return;
  }
  if (target.matches('[data-meal-time]')) {
    const meals = day().meals.map((meal) => meal.id === target.dataset.mealTime ? { ...meal, time: target.value } : meal);
    commit(updateDay(state, state.selectedDate, { meals })); return;
  }
  if (target.matches('[data-meal-check], [data-supp-check], [data-med-check], [data-daily-check]')) {
    const id = target.dataset.mealCheck ? `meal:${target.dataset.mealCheck}` : target.dataset.suppCheck ? `supp:${target.dataset.suppCheck}` : target.dataset.medCheck ? `med:${target.dataset.medCheck}` : target.dataset.dailyCheck;
    commit(setCheck(state, state.selectedDate, id, target.checked));
  }
  if (target.id === 'import-file') { beginImport(target.files?.[0]); target.value = ''; }
});

document.addEventListener('input', (event) => { if (event.target.id === 'daily-note') { state = setNote(state, state.selectedDate, event.target.value); persist(); } });
document.addEventListener('blur', (event) => { if (event.target.id === 'daily-note') persist(); }, true);
document.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-measure-form]');
  if (!form) return;
  event.preventDefault();
  const value = numberValue(form.querySelector('input').value, NaN);
  if (!Number.isFinite(value)) return;
  commit(recordMeasure(state, form.dataset.measureForm, state.selectedDate, value), 'Entry logged');
});

$('#food-form').addEventListener('submit', saveFood);
$('#day-form').addEventListener('submit', (event) => { if (event.submitter?.value === 'cancel') return; event.preventDefault(); const date = $('#mobile-date').value; if (!date) return; $('#day-dialog').close(); commit(selectDate(state, date)); });
$('#meal-form').addEventListener('submit', (event) => { if (event.submitter?.value === 'cancel') return; event.preventDefault(); const meal = { id: idFrom('meal', $('#meal-name').value), name: $('#meal-name').value.trim(), time: $('#meal-time').value, items: [] }; if (!meal.name || !meal.time) return; $('#meal-dialog').close(); commit(updateDay(state, state.selectedDate, { meals: [...day().meals, meal] }), 'Meal added'); });
$('#food-picker-form').addEventListener('submit', addSelectedFood);
$('#food-search').addEventListener('input', () => renderFoodChoices());
$('#settings-form').addEventListener('submit', saveSettings);
$('#import-form').addEventListener('submit', applyImport);
window.addEventListener('storage', (event) => { if (event.key !== STORAGE_KEY || !event.newValue) return; try { const result = validateState(JSON.parse(event.newValue)); if (result.ok) { state = result.state; render(); showToast('Updated from another NB Meal Plan tab'); } } catch { /* Ignore malformed cross-tab values. */ } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') hiddenDate = state.selectedDate; else { const currentDate = localDateString(new Date()); if (currentDate !== lastActualDate && hiddenDate === lastActualDate && state.selectedDate === hiddenDate) commit(selectDate(state, currentDate), 'Moved to today'); lastActualDate = currentDate; } });

setupPWA({ onStatus: (status) => { const statusNode = $('#pwa-status'); if (statusNode && status) statusNode.textContent = status; }, onUpdate: (applyUpdate) => { const updateButton = $('#pwa-update'); updateButton.hidden = false; updateButton.onclick = () => applyUpdate(); } });
setInterval(() => {
  const currentDate = localDateString(new Date());
  if (currentDate !== lastActualDate) {
    const followsToday = state.selectedDate === lastActualDate;
    lastActualDate = currentDate;
    if (followsToday) commit(selectDate(state, currentDate), 'Moved to today');
  }
  renderFasting(day());
}, 30000);
render();
if (migratedOnLoad) persist();
