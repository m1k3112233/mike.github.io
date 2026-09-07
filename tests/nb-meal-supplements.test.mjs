import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMealSupplementPlan } from '../nb-meal-planner/model.js';

const meals = [
  { id: 'breakfast', name: 'Breakfast', time: '08:00' },
  { id: 'lunch', name: 'Lunch', time: '12:30' },
  { id: 'dinner', name: 'Dinner', time: '17:30' },
];
const defaults = [
  { id: 'sterols-option', name: 'Plant sterols', status: 'review', time: '', dose: 'default dose' },
  { id: 'magnesium-option', name: 'Magnesium', status: 'review', time: '17:30', dose: 'default dose' },
];
const guidance = {
  'sterols-option': { group: 'sterols', amount: '1 g', meals: [{ mealId: 'lunch', amount: '1 g' }] },
  'sterols-photo': { group: 'sterols', amount: '1 g', meals: [{ mealId: 'dinner', amount: '1 g' }] },
  'magnesium-option': { group: 'magnesium', amount: '150 mg', meals: [{ mealId: 'dinner', amount: '150 mg' }] },
  'magnesium-photo': { group: 'magnesium', amount: '150 mg', meals: [] },
};

test('dedupes aliases and an active alias suppresses the recommendation group', () => {
  const current = { meals, supplements: [
    { id: 'sterols-photo', status: 'review', time: '', dose: 'saved label' },
    { id: 'magnesium-photo', status: 'active', time: '17:30', dose: 'saved dose' },
  ] };
  const result = buildMealSupplementPlan(current, defaults, guidance);
  assert.deepEqual(result.recommendations.map((item) => item.id), ['sterols-photo']);
  assert.equal(result.byMeal.dinner.filter((row) => row.kind === 'recommendation').length, 1);
  assert.equal(result.byMeal.dinner.some((row) => row.kind === 'recommendation' && row.supplement.id === 'magnesium-option'), false);
});

test('attaches active entries only to one exact meal and leaves custom or ambiguous times unassigned', () => {
  const current = { meals: [...meals, { id: 'late', name: 'Late', time: '12:30' }], supplements: [
    { id: 'exact', status: 'active', time: '08:00', dose: 'a' },
    { id: 'ambiguous', status: 'active', time: '12:30', dose: 'b' },
    { id: 'custom', status: 'active', time: '21:00', dose: 'c' },
    { id: 'blank', status: 'active', time: '', dose: 'd' },
  ] };
  const result = buildMealSupplementPlan(current, [], {});
  assert.deepEqual(result.byMeal.breakfast.map((row) => row.supplement.id), ['exact']);
  assert.deepEqual(result.activeUnassigned.map((item) => item.id), ['ambiguous', 'custom', 'blank']);
});

test('uses meal IDs after rename or reorder and drops slots for removed meals', () => {
  const current = { meals: [
    { id: 'dinner', name: 'Evening meal', time: '19:00' },
    { id: 'breakfast', name: 'Morning meal', time: '09:00' },
  ], supplements: [] };
  const result = buildMealSupplementPlan(current, defaults, {
    'magnesium-option': { amount: '150 mg', meals: [{ mealId: 'dinner', label: 'with dinner' }, { mealId: 'removed', amount: 'x' }] },
  });
  assert.deepEqual(Object.keys(result.byMeal), ['dinner', 'breakfast']);
  assert.equal(result.byMeal.dinner[0].slot.label, 'with dinner');
  assert.equal(result.byMeal.breakfast.length, 0);
});

test('does not mutate current, defaults, guidance, or recommendation statuses', () => {
  const current = { meals: structuredClone(meals), supplements: [{ id: 'sterols-option', status: 'review', time: '', dose: 'saved' }] };
  const input = structuredClone({ current, defaults, guidance });
  const result = buildMealSupplementPlan(current, defaults, guidance);
  assert.equal(result.recommendations[0].status, 'review');
  result.recommendations[0].status = 'active';
  result.byMeal.lunch[0].slot.amount = 'changed';
  assert.deepEqual({ current, defaults, guidance }, input);
  assert.equal(result.recommendations[0].status, 'active');
  assert.equal(current.supplements[0].status, 'review');
});
