import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clone,
  createDaySnapshot,
  createInitialState,
  migrateLegacyEmptyState,
  normalizeTemplate,
  aggregateNutrition,
  validateState,
} from '../nb-meal-planner/model.js';
import { FOOD_CATALOG, DEFAULT_MEALS, DEFAULT_SUPPLEMENTS, DEFAULT_SETTINGS, LEGACY_EMPTY_TEMPLATE } from '../nb-meal-planner/data.js';

const date = '2026-09-07';
const legacyFood = { id: 'oats', name: 'Oats', unit: 'g', serving: 40, step: 10, kcal: 150, protein: 5, carbs: 27, fat: 3 };
const starterFood = { id: 'eggs', name: 'Eggs', unit: 'egg', serving: 1, step: 1, kcal: 72, protein: 6.3, carbs: 0.4, fat: 4.8 };
const legacySettings = {
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
  eatingStart: '08:00',
  eatingEnd: '18:00',
  trainingStart: '',
  trainingEnd: '',
  energyActive: null,
  energyResting: null,
  energyPeriod: '',
  workNote: '',
};
const legacy = {
  foods: [legacyFood],
  meals: [
    { id: 'breakfast', name: 'Breakfast', time: '08:00', items: [] },
    { id: 'lunch', name: 'Lunch', time: '12:30', items: [] },
    { id: 'snack', name: 'Afternoon snack', time: '15:00', items: [] },
    { id: 'dinner', name: 'Dinner', time: '17:30', items: [] },
  ],
  supplements: [],
  medications: [],
  settings: legacySettings,
};
const starter = {
  foods: [legacyFood, starterFood],
  meals: [
    { id: 'breakfast', name: 'Breakfast', time: '08:00', items: [{ foodId: 'eggs', quantity: 2 }] },
    { id: 'lunch', name: 'Lunch', time: '12:30', items: [] },
    { id: 'snack', name: 'Afternoon snack', time: '15:00', items: [] },
    { id: 'dinner', name: 'Dinner', time: '17:30', items: [] },
  ],
  supplements: [],
  medications: [],
  settings: { ...legacySettings, calories: 1900, protein: 80 },
};

test('a saved untouched legacy state receives the starter template and day', () => {
  const state = createInitialState(legacy, date);
  state.days[date] = createDaySnapshot(legacy, date);
  state.notes[date] = 'Keep this note';
  state.checks[date] = { 'daily-water': true, 'meal:breakfast': false };
  state.history.weights = [{ date, value: 80 }];
  const migrated = migrateLegacyEmptyState(state, starter, legacy);

  assert.deepEqual(migrated.template, normalizeTemplate(starter));
  assert.deepEqual(migrated.days[date], createDaySnapshot(starter, date));
  assert.deepEqual(migrated.notes, state.notes);
  assert.deepEqual(migrated.checks, state.checks);
  assert.deepEqual(migrated.history, state.history);
  assert.deepEqual(migrateLegacyEmptyState(migrated, starter, legacy), migrated);
});

test('a legacy template with no saved day is upgraded for future day creation', () => {
  const state = createInitialState(legacy, date);
  const migrated = migrateLegacyEmptyState(state, starter, legacy);
  assert.deepEqual(migrated.template, normalizeTemplate(starter));
  assert.deepEqual(migrated.days, {});
});

test('customized existing days stay intact while the untouched template is upgraded', () => {
  const state = createInitialState(legacy, date);
  state.days[date] = createDaySnapshot(legacy, date);
  state.days[date].meals[0].items = [{ foodId: 'oats', quantity: 40 }];
  state.notes[date] = 'Customized day';
  state.checks[date] = { 'meal:breakfast': true };
  state.history.waist = [{ date, value: 90 }];
  const originalDay = clone(state.days[date]);
  const migrated = migrateLegacyEmptyState(state, starter, legacy);

  assert.deepEqual(migrated.template, normalizeTemplate(starter));
  assert.deepEqual(migrated.days[date], originalDay);
  assert.deepEqual(migrated.notes, state.notes);
  assert.deepEqual(migrated.checks, state.checks);
  assert.deepEqual(migrated.history, state.history);
});

test('edited legacy templates, including food edits, are never migrated', () => {
  const state = createInitialState(legacy, date);
  state.days[date] = createDaySnapshot(legacy, date);
  state.template.foods[0].name = 'My oats';
  state.template.settings.calories = 1700;
  const migrated = migrateLegacyEmptyState(state, starter, legacy);
  assert.deepEqual(migrated, state);
});

test('the shipped starter fills a fresh visit and the exact deployed legacy plan', () => {
  const shipped = { foods: FOOD_CATALOG, meals: DEFAULT_MEALS, supplements: DEFAULT_SUPPLEMENTS, settings: DEFAULT_SETTINGS, medications: [] };
  const fresh = createInitialState(shipped, date);
  assert.equal(validateState(fresh).ok, true);
  assert.equal(fresh.template.meals.length, 4);
  assert.ok(fresh.template.meals.every(meal => meal.items.length > 0));
  const before = createInitialState(LEGACY_EMPTY_TEMPLATE, date);
  before.days[date] = createDaySnapshot(LEGACY_EMPTY_TEMPLATE, date);
  const saved = validateState(JSON.parse(JSON.stringify(before))).state;
  const after = migrateLegacyEmptyState(saved, shipped, LEGACY_EMPTY_TEMPLATE);
  assert.equal(validateState(after).ok, true);
  const total = aggregateNutrition(after.days[date].meals, after.days[date].supplements, after.days[date].foods);
  assert.equal(Math.round(total.kcal), 1903);
  assert.equal(after.days[date].settings.calories, 1900);
  assert.equal(after.days[date].settings.protein, 80);
  assert.deepEqual(after.days[date].medications, []);
  assert.equal(after.days[date].settings.energyActive, null);
});
