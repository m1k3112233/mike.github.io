import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, aggregateNutrition, applyPlanImport, createDaySnapshot, createInitialState, targetDifference, validateFullRestore, validatePlanImport, validateState } from '../nb-meal-planner/model.js';

const foods = [{ id: 'oats', name: 'Oats', unit: 'g', serving: 40, step: 10, kcal: 150, protein: 5, carbs: 27, fat: 3 }];
const settings = { calories: null, protein: null, carbs: null, fat: null, eatingStart: '08:00', eatingEnd: '18:00', trainingStart: '', trainingEnd: '', energyActive: null, energyResting: null, energyPeriod: '', workNote: '' };
const template = { foods, meals: [{ id: 'breakfast', name: 'Breakfast', time: '08:00', items: [] }], supplements: [], medications: [], settings };

test('review suggestions neither count as intake nor force a supplement clock time', () => {
  const supplement = { id: 'option', name: 'Optional product', time: '', dose: 'Review the label', status: 'review', kcal: null };
  const result = aggregateNutrition([], [supplement], foods);
  assert.equal(result.kcal, 0);
  assert.equal(result.knownKcal, true);
  assert.equal(result.unknownSupplementKcal, false);
  assert.equal(validatePlanImport({ template: { ...template, supplements: [supplement] } }).ok, true);
  assert.equal(validatePlanImport({ template: { ...template, supplements: [{ ...supplement, status: 'active' }] } }).ok, true);
  assert.equal(validatePlanImport({ template: { ...template, supplements: [{ ...supplement, status: 'maybe' }] } }).ok, false);
});

test('NB storage is independent and nullable targets never compare against zero', () => {
  assert.equal(STORAGE_KEY, 'nb-dayplate-state-v1');
  assert.deepEqual(targetDifference({ kcal: 900, protein: 40, carbs: 80, fat: 20 }, settings), { kcal: null, protein: null, carbs: null, fat: null });
  assert.equal(validatePlanImport({ template }).ok, true);
});

test('paired blank training times are valid and preserved in snapshots', () => {
  const snapshot = createDaySnapshot(template, '2026-09-07');
  assert.equal(snapshot.settings.trainingStart, '');
  assert.equal(snapshot.settings.trainingEnd, '');
  assert.equal(validatePlanImport({ template: { ...template, settings: { ...settings, trainingStart: '14:00', trainingEnd: '' } } }).ok, false);
});

test('health reference settings accept known values and reject malformed values', () => {
  assert.equal(validatePlanImport({ template: { ...template, settings: { ...settings, energyActive: 1400, energyResting: 1700, energyPeriod: 'Typical active workday', workNote: 'Outdoor work context' } } }).ok, true);
  assert.equal(validatePlanImport({ template: { ...template, settings: { ...settings, energyActive: -1 } } }).ok, false);
  assert.equal(validatePlanImport({ template: { ...template, settings: { ...settings, workNote: 'x'.repeat(501) } } }).ok, false);
});

test('medications survive plan import snapshots and remain separate from checks', () => {
  const medication = { id: 'med-a', name: 'Medication A', dose: 'As prescribed', time: '', note: 'Weekly on Sunday', status: 'review' };
  const state = createInitialState(template, '2026-09-07');
  const result = applyPlanImport(state, { template: { ...template, medications: [medication] } }, '2026-09-07');
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.days['2026-09-07'].medications, [medication]);
  assert.deepEqual(result.state.checks, {});
});

test('legacy missing medications normalize to an empty array while malformed medication data is rejected', () => {
  const state = createInitialState(template, '2026-09-07');
  delete state.template.medications;
  state.days['2026-09-07'] = createDaySnapshot(state.template, '2026-09-07');
  delete state.days['2026-09-07'].medications;
  const restored = validateState(state);
  assert.equal(restored.ok, true);
  assert.deepEqual(restored.state.template.medications, []);
  assert.deepEqual(restored.state.days['2026-09-07'].medications, []);
  assert.equal(validatePlanImport({ template: { ...template, medications: {} } }).ok, false);
  assert.equal(validateFullRestore({ ...state, template: { ...state.template, medications: [{ id: 'bad', name: 'Bad', dose: '', time: 'not-a-time', note: '' }] } }).ok, false);
});
