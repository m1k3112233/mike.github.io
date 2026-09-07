export const STATE_VERSION = 1;
export const STORAGE_KEY = 'dayplate-state-v1';

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const round = (value, places = 1) => {
  if (!finite(value)) return null;
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

export function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function localDateString(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayLocal() {
  return localDateString(new Date());
}

export function shiftDate(dateString, days) {
  const [year, month, day] = String(dateString).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + Number(days || 0));
  return localDateString(date);
}

export function isDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function timeToMinutes(time) {
  if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export function formatTime(time) {
  const minutes = timeToMinutes(time);
  if (minutes === null) return String(time || '');
  const hour = Math.floor(minutes / 60) % 12 || 12;
  return `${hour}:${String(minutes % 60).padStart(2, '0')} ${minutes < 720 ? 'AM' : 'PM'}`;
}

export function fastingStatus(settings, now = new Date()) {
  const start = timeToMinutes(settings?.eatingStart);
  const end = timeToMinutes(settings?.eatingEnd);
  if (start === null || end === null || start === end) return { state: 'unknown', elapsed: 0, remaining: 0, label: 'Fasting window unavailable' };
  const minutes = now.getHours() * 60 + now.getMinutes();
  const overnight = end < start;
  const inWindow = overnight ? minutes >= start || minutes < end : minutes >= start && minutes < end;
  if (inWindow) {
    const elapsed = overnight && minutes < end ? minutes + 1440 - start : minutes - start;
    const total = overnight ? end + 1440 - start : end - start;
    return { state: 'eating', elapsed, remaining: Math.max(0, total - elapsed), label: 'Eating window' };
  }
  const nextStart = minutes < start ? start : start + 1440;
  const nextEnd = overnight ? end + 1440 : end;
  const remaining = nextStart - minutes;
  const eatingDuration = (end - start + 1440) % 1440;
  const totalFast = 1440 - eatingDuration;
  const elapsedSinceEnd = minutes >= end ? minutes - end : minutes + 1440 - end;
  return { state: 'fasting', elapsed: elapsedSinceEnd, remaining, total: totalFast, label: 'Fasting' };
}

export function formatDuration(minutes) {
  if (!finite(minutes)) return '—';
  const whole = Math.max(0, Math.round(minutes));
  return `${Math.floor(whole / 60)}h ${String(whole % 60).padStart(2, '0')}m`;
}

export function nutritionForFood(food, quantity) {
  const amount = Number(quantity);
  const serving = Number(food?.serving);
  if (!food || !finite(amount) || amount < 0 || !finite(serving) || serving <= 0) return { kcal: null, protein: null, carbs: null, fat: null };
  const scale = amount / serving;
  return Object.fromEntries(['kcal', 'protein', 'carbs', 'fat'].map((key) => {
    const value = food[key];
    return [key, finite(value) ? round(value * scale, 1) : null];
  }));
}

export function aggregateNutrition(meals = [], supplements = [], foods = []) {
  const catalog = new Map((Array.isArray(foods) ? foods : []).map((food) => [food.id, food]));
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0, knownKcal: true, foodKcal: 0, supplementKcal: 0, knownSupplementKcal: 0, unknownSupplementKcal: false, genericFood: false };
  const add = (nutrition, source, supplement = false) => {
    for (const key of ['kcal', 'protein', 'carbs', 'fat']) {
      const value = nutrition?.[key];
      if (finite(value)) total[key] += value;
      else if (key === 'kcal') total.knownKcal = false;
    }
    if (supplement) {
      if (finite(nutrition?.kcal)) { total.supplementKcal += nutrition.kcal; total.knownSupplementKcal += nutrition.kcal; }
      else if (source?.kcal === null || source?.kcal === undefined) total.unknownSupplementKcal = true;
    } else if (finite(nutrition?.kcal)) total.foodKcal += nutrition.kcal;
    if (source?.source === 'generic' || source?.verified === false) total.genericFood = true;
  };
  for (const meal of meals || []) for (const item of meal.items || []) add(nutritionForFood(catalog.get(item.foodId), item.quantity), catalog.get(item.foodId));
  for (const supplement of supplements || []) {
    const amount = finite(supplement.kcal) ? supplement.kcal : null;
    add({ kcal: amount, protein: null, carbs: null, fat: finite(supplement.fat) ? supplement.fat : null }, supplement, true);
  }
  return Object.fromEntries(Object.entries(total).map(([key, value]) => [key, ['kcal', 'protein', 'carbs', 'fat', 'foodKcal', 'supplementKcal', 'knownSupplementKcal'].includes(key) ? round(value, 1) : value]));
}

export function nutritionForMeal(meal, foods = []) {
  return aggregateNutrition([meal], [], foods);
}

const safeRecord = (value) => isObject(value) && !Object.keys(value).some((key) => ['__proto__', 'prototype', 'constructor'].includes(key));

function validId(value) { return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(value); }
function validName(value) { return typeof value === 'string' && value.trim().length > 0 && value.length <= 120; }
function validNumber(value, min = 0, max = 1e7) { return finite(value) && value >= min && value <= max; }
function validStoredNumber(value, min = 0, max = 1e7) { return typeof value === 'number' && validNumber(value, min, max); }

export function normalizeTemplate({ meals = [], supplements = [], settings = {}, foods = [] } = {}) {
  return {
    meals: clone(Array.isArray(meals) ? meals : []),
    supplements: clone(Array.isArray(supplements) ? supplements : []),
    settings: clone(settings || {}),
    foods: clone(Array.isArray(foods) ? foods : []),
  };
}

export function createDaySnapshot(template, date) {
  return { date, ...normalizeTemplate(template) };
}

export function createInitialState(template, date = todayLocal()) {
  const normalized = normalizeTemplate(template);
  return {
    version: STATE_VERSION,
    selectedDate: isDateString(date) ? date : todayLocal(),
    template: normalized,
    days: {},
    notes: {},
    checks: {},
    history: { weights: [], waist: [] },
  };
}

export function ensureDay(state, date) {
  if (!isDateString(date)) return state;
  const next = clone(state);
  next.days = next.days || {};
  if (next.days[date]) return next;
  next.days[date] = createDaySnapshot(next.template, date);
  return next;
}

export function selectDate(state, date) {
  const next = ensureDay({ ...clone(state), selectedDate: date }, date);
  return next;
}

export function updateDay(state, date, patch) {
  const next = ensureDay(state, date);
  next.days[date] = { ...next.days[date], ...clone(patch), date };
  return next;
}

export function updateTemplate(state, template) {
  return { ...clone(state), template: normalizeTemplate(template) };
}

export function setCheck(state, date, checkId, checked) {
  const next = clone(state);
  next.checks = next.checks || {};
  next.checks[date] = { ...(next.checks[date] || {}), [checkId]: Boolean(checked) };
  return next;
}

export function setNote(state, date, note) {
  const next = clone(state);
  next.notes = next.notes || {};
  if (String(note || '').trim()) next.notes[date] = String(note).slice(0, 3000);
  else delete next.notes[date];
  return next;
}

export function recordMeasure(state, kind, date, value) {
  if (!['weights', 'waist'].includes(kind) || !isDateString(date) || !validNumber(Number(value), 0.1, 1000)) return state;
  const next = clone(state);
  next.history = next.history || { weights: [], waist: [] };
  const entries = Array.isArray(next.history[kind]) ? next.history[kind].filter((entry) => entry.date !== date) : [];
  entries.push({ date, value: round(Number(value), 2) });
  entries.sort((a, b) => a.date.localeCompare(b.date));
  next.history[kind] = entries.slice(-400);
  return next;
}

export function recentAverage(entries, count = 7) {
  const values = (Array.isArray(entries) ? entries : []).filter((entry) => finite(entry?.value)).slice(-count);
  if (!values.length) return { value: null, count: 0, label: `Average of last ${count} entries` };
  return { value: round(values.reduce((sum, entry) => sum + entry.value, 0) / values.length, 2), count: values.length, label: `Average of last ${count} entries` };
}

export function targetDifference(total, settings) {
  return Object.fromEntries(['kcal', 'protein', 'carbs', 'fat'].map((key) => {
    const targetKey = key === 'kcal' ? 'calories' : key;
    const target = Number(settings?.[targetKey]);
    return [key, finite(total?.[key]) && finite(target) ? round(total[key] - target, 1) : null];
  }));
}

function validateFood(food) {
  return safeRecord(food) && validId(food.id) && validName(food.name) && ['g', 'mL', 'egg', 'fruit', 'scoop'].includes(food.unit) && validStoredNumber(food.serving, 0.0001, 1e7) && validStoredNumber(food.step, 0.0001, 1e7) && ['kcal', 'protein', 'carbs', 'fat'].every((key) => food[key] === null || validStoredNumber(food[key], 0, 1e7));
}

function validateMeal(meal, foodIds) {
  return safeRecord(meal) && validId(meal.id) && validName(meal.name) && timeToMinutes(meal.time) !== null && Array.isArray(meal.items) && meal.items.every((item) => safeRecord(item) && validId(item.foodId) && foodIds.has(item.foodId) && validStoredNumber(item.quantity, 0, 1e7));
}

function validateSupplement(supplement) {
  return safeRecord(supplement) && validId(supplement.id) && validName(supplement.name) && timeToMinutes(supplement.time) !== null && typeof supplement.dose === 'string' && supplement.dose.length <= 120 && (supplement.kcal === null || supplement.kcal === undefined || validStoredNumber(supplement.kcal, 0, 1e5)) && (supplement.fat === null || supplement.fat === undefined || validStoredNumber(supplement.fat, 0, 1e5));
}

function validateSettings(settings) {
  return safeRecord(settings) && ['calories', 'protein', 'carbs', 'fat'].every((key) => validStoredNumber(settings[key], 0, 1e7)) && ['eatingStart', 'eatingEnd', 'trainingStart', 'trainingEnd'].every((key) => timeToMinutes(settings[key]) !== null);
}

function validateTemplate(template) {
  if (!safeRecord(template) || !Array.isArray(template.foods) || !Array.isArray(template.meals) || !Array.isArray(template.supplements) || !validateSettings(template.settings)) return false;
  const foodIds = template.foods.map((food) => food?.id);
  const mealIds = template.meals.map((meal) => meal?.id);
  const supplementIds = template.supplements.map((supplement) => supplement?.id);
  const unique = (items) => new Set(items).size === items.length;
  const foods = new Set(foodIds);
  return template.foods.length <= 200 && template.meals.length <= 40 && template.supplements.length <= 50 && unique(foodIds) && unique(mealIds) && unique(supplementIds) && template.foods.every(validateFood) && template.meals.every((meal) => validateMeal(meal, foods)) && template.supplements.every(validateSupplement);
}

function validateHistory(history) {
  if (!safeRecord(history) || !Array.isArray(history.weights) || !Array.isArray(history.waist) || history.weights.length > 400 || history.waist.length > 400) return false;
  return ['weights', 'waist'].every((kind) => history[kind].every((entry) => safeRecord(entry) && isDateString(entry.date) && validStoredNumber(entry.value, 0.1, 1000)));
}

export function validateState(value) {
  if (!safeRecord(value) || value.version !== STATE_VERSION || !isDateString(value.selectedDate) || !validateTemplate(value.template) || !safeRecord(value.days) || !safeRecord(value.notes) || !safeRecord(value.checks) || !validateHistory(value.history)) return { ok: false, error: 'This file is not a valid Dayplate state.' };
  for (const [date, day] of Object.entries(value.days)) if (!isDateString(date) || !safeRecord(day) || day.date !== date || !validateTemplate(day)) return { ok: false, error: `Invalid planner snapshot for ${date}.` };
  for (const note of Object.values(value.notes)) if (typeof note !== 'string' || note.length > 3000) return { ok: false, error: 'A note is too long.' };
  for (const [date, checks] of Object.entries(value.checks)) if (!isDateString(date) || !safeRecord(checks) || Object.values(checks).some((checked) => typeof checked !== 'boolean')) return { ok: false, error: 'Daily checks are malformed.' };
  return { ok: true, state: clone(value) };
}

export function validatePlanImport(value) {
  if (!safeRecord(value) || !validateTemplate(value.template || value)) return { ok: false, error: 'The plan needs meals, foods, supplements, and valid settings.' };
  return { ok: true, template: normalizeTemplate(value.template || value), selectedDate: isDateString(value.selectedDate) ? value.selectedDate : null };
}

export function applyPlanImport(state, imported, date = state.selectedDate) {
  const checked = validatePlanImport(imported);
  if (!checked.ok) return { ok: false, error: checked.error, state };
  const next = clone(state);
  next.template = checked.template;
  next.days = next.days || {};
  next.days[date] = createDaySnapshot(checked.template, date);
  next.selectedDate = date;
  return { ok: true, state: next };
}

export function validateFullRestore(value, maxBytes = 2_000_000) {
  let parsed = value;
  if (typeof value === 'string') {
    if (value.length > maxBytes) return { ok: false, error: 'Backup is larger than 2 MB.' };
    try { parsed = JSON.parse(value); } catch { return { ok: false, error: 'Backup is not valid JSON.' }; }
  }
  if (!safeRecord(parsed)) return { ok: false, error: 'Backup must be a JSON object.' };
  return validateState(parsed);
}

export function exportPlan(state, date = state.selectedDate) {
  const day = state.days?.[date] || createDaySnapshot(state.template, date);
  return { version: STATE_VERSION, type: 'dayplate-plan', selectedDate: date, template: clone(day) };
}

export function exportFullState(state) {
  return clone(state);
}

export function stringifyExport(value) {
  return JSON.stringify(value, null, 2);
}
