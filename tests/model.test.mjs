import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateNutrition,
  applyPlanImport,
  createDaySnapshot,
  createInitialState,
  fastingStatus,
  localDateString,
  recentAverage,
  validateFullRestore,
  validatePlanImport,
} from '../meal-planner/model.js';

const foods = [
  { id: 'oats', name: 'Oats', unit: 'g', serving: 40, step: 10, kcal: 150, protein: 5, carbs: 27, fat: 3 },
  { id: 'berries', name: 'Berries', unit: 'g', serving: 100, step: 25, kcal: 50, protein: 1, carbs: 12, fat: 0 },
];
const meals = [{ id: 'breakfast', name: 'Breakfast', time: '10:45', items: [{ foodId: 'oats', quantity: 80 }] }];
const supplements = [{ id: 'creatine', name: 'Creatine', time: '14:45', dose: '5 g', kcal: null, fat: null }];
const settings = { calories: 2000, protein: 150, carbs: 220, fat: 65, eatingStart: '10:45', eatingEnd: '18:45', trainingStart: '14:45', trainingEnd: '16:00' };
const template = { foods, meals, supplements, settings };

test('nutrition scales each food by quantity / serving and keeps unknown supplement energy unknown', () => {
  const total = aggregateNutrition(meals, supplements, foods);
  assert.equal(total.kcal, 300);
  assert.equal(total.protein, 10);
  assert.equal(total.carbs, 54);
  assert.equal(total.fat, 6);
  assert.equal(total.unknownSupplementKcal, true);
});

test('day snapshots preserve the plan that existed when the day was opened', () => {
  const day = createDaySnapshot(template, '2026-09-07');
  template.meals[0].items[0].quantity = 40;
  assert.equal(day.meals[0].items[0].quantity, 80);
});

test('plan import changes planner content without replacing history or notes', () => {
  const state = createInitialState(template, '2026-09-07');
  state.notes['2026-09-07'] = 'Keep this note';
  state.history.weights.push({ date: '2026-09-06', value: 80 });
  const changed = { ...template, settings: { ...settings, calories: 2200 } };
  const result = applyPlanImport(state, { template: changed }, '2026-09-07');
  assert.equal(result.ok, true);
  assert.equal(result.state.template.settings.calories, 2200);
  assert.equal(result.state.notes['2026-09-07'], 'Keep this note');
  assert.equal(result.state.history.weights[0].value, 80);
});

test('strict import rejects prototype pollution and malformed references', () => {
  assert.equal(validatePlanImport({ template: { ...template, meals: [{ ...meals[0], items: [{ foodId: 'missing', quantity: 1 }] }] } }).ok, false);
  assert.equal(validateFullRestore(JSON.stringify({ __proto__: { polluted: true } })).ok, false);
});

test('local date uses local calendar components rather than UTC date', () => {
  const local = new Date(2026, 8, 7, 23, 30);
  assert.equal(localDateString(local), '2026-09-07');
});

test('fasting countdown handles standard and overnight eating windows', () => {
  const standard = fastingStatus({ eatingStart: '10:45', eatingEnd: '18:45' }, new Date(2026, 8, 7, 9, 45));
  assert.equal(standard.state, 'fasting');
  assert.equal(standard.remaining, 60);
  const overnight = fastingStatus({ eatingStart: '20:00', eatingEnd: '04:00' }, new Date(2026, 8, 7, 2, 0));
  assert.equal(overnight.state, 'eating');
  assert.equal(overnight.elapsed, 360);
});

test('recent average reports entry count so a 7-entry mean is not mislabeled as a 7-day average', () => {
  const average = recentAverage([{ value: 80 }, { value: 81 }, { value: 79 }], 7);
  assert.equal(average.value, 80);
  assert.equal(average.count, 3);
  assert.match(average.label, /entries/);
});
