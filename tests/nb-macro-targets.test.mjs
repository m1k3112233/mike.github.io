import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clone,
  createDaySnapshot,
  createInitialState,
  migrateStarterMacroTargets,
  validatePlanImport,
  validateState,
} from '../nb-meal-planner/model.js';

const date = '2026-09-07';
const older = '2026-09-06';
const settings = {
  calories: 1900,
  protein: 80,
  carbs: null,
  fat: undefined,
  eatingStart: '08:00',
  eatingEnd: '18:00',
  trainingStart: '',
  trainingEnd: '',
  energyActive: null,
  energyResting: null,
  energyPeriod: '',
  workNote: '',
};
const importedTemplate = {
  foods: [],
  meals: [{ id: 'breakfast', name: 'Breakfast', time: '08:00', items: [] }],
  supplements: [],
  settings,
};
const defaults = { carbs: 250, fat: 65 };

function stateWithDays() {
  const state = createInitialState(importedTemplate, date);
  state.days[date] = createDaySnapshot(importedTemplate, date);
  state.days[older] = createDaySnapshot(importedTemplate, older);
  state.notes = { [date]: 'Keep this note', [older]: 'Old note' };
  state.checks = { [date]: { water: true }, [older]: { water: false } };
  state.history.weights = [{ date: older, value: 80 }];
  return state;
}

test('private import-shaped templates can be validated and receive only missing starter targets', () => {
  const imported = validatePlanImport({ template: importedTemplate });
  assert.equal(imported.ok, true);
  const state = stateWithDays();
  const before = clone(state);
  const migrated = migrateStarterMacroTargets(state, defaults);

  assert.equal(migrated.template.settings.carbs, 250);
  assert.equal(migrated.template.settings.fat, 65);
  assert.equal(migrated.days[date].settings.carbs, 250);
  assert.equal(migrated.days[date].settings.fat, 65);
  assert.deepEqual(migrated.days[older], before.days[older]);
  assert.deepEqual(migrated.notes, before.notes);
  assert.deepEqual(migrated.checks, before.checks);
  assert.deepEqual(migrated.history, before.history);
  assert.equal(migrated.starterMacroTargetsVersion, 1);
  assert.equal(state.starterMacroTargetsVersion, undefined);
});

test('explicit targets and other calorie or protein profiles are preserved', () => {
  const state = stateWithDays();
  state.template.settings.carbs = 220;
  state.template.settings.fat = 70;
  state.days[date].settings = { ...state.days[date].settings, calories: 2000, protein: 80, carbs: null, fat: null };
  state.days[older].settings = { ...state.days[older].settings, calories: 1900, protein: 90, carbs: null, fat: null };
  const migrated = migrateStarterMacroTargets(state, defaults);
  assert.equal(migrated.template.settings.carbs, 220);
  assert.equal(migrated.template.settings.fat, 70);
  assert.equal(migrated.days[date].settings.carbs, null);
  assert.equal(migrated.days[date].settings.fat, null);
  assert.equal(migrated.days[older].settings.carbs, null);
  assert.equal(migrated.days[older].settings.fat, null);
});

test('marker makes migration idempotent and clearing goals after it does not refill them', () => {
  const first = migrateStarterMacroTargets(stateWithDays(), defaults);
  const second = migrateStarterMacroTargets(first, defaults);
  assert.strictEqual(second, first);
  first.template.settings.carbs = null;
  first.days[date].settings.fat = null;
  const afterClear = migrateStarterMacroTargets(first, defaults);
  assert.strictEqual(afterClear, first);
  assert.equal(afterClear.template.settings.carbs, null);
  assert.equal(afterClear.days[date].settings.fat, null);
});

test('valid states are marked even when no target needs filling', () => {
  const state = stateWithDays();
  state.template.settings.carbs = 250;
  state.template.settings.fat = 65;
  state.days[date].settings = { ...state.days[date].settings, carbs: 250, fat: 65 };
  const migrated = migrateStarterMacroTargets(state, defaults);
  assert.equal(migrated.starterMacroTargetsVersion, 1);
  assert.notStrictEqual(migrated, state);
});

test('validateState accepts legacy states without marker and rejects malformed markers', () => {
  const state = stateWithDays();
  assert.equal(validateState(state).ok, true);
  for (const marker of [null, 0, '1', 1.5, 2, true]) {
    assert.equal(validateState({ ...state, starterMacroTargetsVersion: marker }).ok, false, `marker ${String(marker)} should be rejected`);
  }
  const roundtrip = validateState(migrateStarterMacroTargets(state, defaults));
  assert.equal(roundtrip.ok, true);
  assert.equal(roundtrip.state.starterMacroTargetsVersion, 1);
});
