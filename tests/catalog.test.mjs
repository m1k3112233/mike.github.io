import test from 'node:test';
import assert from 'node:assert/strict';
import { FOOD_CATALOG, DEFAULT_MEALS, DEFAULT_SUPPLEMENTS, DEFAULT_SETTINGS } from '../meal-planner/data.js';
import { aggregateNutrition, createInitialState, ensureDay, exportFullState, validateFullRestore, validatePlanImport, updateDay } from '../meal-planner/model.js';

const template = { foods: FOOD_CATALOG, meals: DEFAULT_MEALS, supplements: DEFAULT_SUPPLEMENTS, settings: DEFAULT_SETTINGS };

test('real catalog preserves supplied serving labels and counts whey only as food', () => {
  const expected = {
    'protein-milk': [250,160,18,9,5],
    'vector-cereal': [55,213,5.6,45,2.4],
    'harvest-crunch-cereal': [100,450,10,68,17],
    'garofalo-protein-pasta': [100,340,19,53,2.5],
    'leanfit-whey': [1,140,24,2,4],
  };
  for (const [id, values] of Object.entries(expected)) {
    const food = FOOD_CATALOG.find(f => f.id === id);
    assert.deepEqual(['serving','kcal','protein','carbs','fat'].map(k => food[k]), values);
  }
  assert.equal(FOOD_CATALOG.find(f => f.id === 'garofalo-protein-pasta').step, 10);
  assert.equal(FOOD_CATALOG.find(f => f.id === 'harvest-crunch-cereal').step, 10);
  const foodOnly = aggregateNutrition(DEFAULT_MEALS, [], FOOD_CATALOG);
  const withSupplements = aggregateNutrition(DEFAULT_MEALS, DEFAULT_SUPPLEMENTS, FOOD_CATALOG);
  assert.ok(Math.abs(withSupplements.kcal - foodOnly.kcal - 43.2) < 0.01, 'Only the estimated salmon oil calories should be added');
  assert.equal(withSupplements.unknownSupplementKcal, true);
});

test('real defaults round trip through strict backup validation', () => {
  const state = ensureDay(createInitialState(template, '2026-09-07'), '2026-09-07');
  const exported = JSON.stringify(exportFullState(state));
  const checked = validateFullRestore(exported);
  assert.equal(checked.ok, true, checked.error);
  assert.deepEqual(checked.state, state);
});

test('editing a day does not mutate an existing state or a prior snapshot', () => {
  let state = ensureDay(createInitialState(template, '2026-09-07'), '2026-09-07');
  state = ensureDay(state, '2026-09-08');
  const before = JSON.stringify(state);
  const next = updateDay(state, '2026-09-08', {settings:{...state.days['2026-09-08'].settings, calories:2400}});
  assert.equal(JSON.stringify(state), before);
  assert.equal(next.days['2026-09-07'].settings.calories, 2500);
  assert.equal(next.days['2026-09-08'].settings.calories, 2400);
});

test('malformed imports cannot silently change quantity types or accept duplicate food identities', () => {
  for (const bad of ['', '100', false, null, -1]) {
    const changed = structuredClone(template);
    changed.meals[0].items[0].quantity = bad;
    assert.equal(validatePlanImport({template:changed}).ok, false, `Accepted quantity ${String(bad)}`);
  }
  const duplicate = structuredClone(template);
  duplicate.foods.push({...duplicate.foods[0]});
  assert.equal(validatePlanImport({template:duplicate}).ok, false);
});

test('full backup rejects injected check keys and non-boolean check states', () => {
  const state = createInitialState(template, '2026-09-07');
  state.checks['2026-09-07'] = {training: 'false'};
  assert.equal(validateFullRestore(JSON.stringify(state)).ok, false);
  state.checks = JSON.parse('{"2026-09-07":{"__proto__":{"polluted":true}}}');
  assert.equal(validateFullRestore(JSON.stringify(state)).ok, false);
});
