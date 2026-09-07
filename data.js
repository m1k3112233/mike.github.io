// Nutrition data for the local-first meal planner.
//
// Food macro fields are for the listed serving. Meal quantities are physical
// amounts (grams, millilitres, eggs, fruit servings, or scoops), so callers
// should scale each macro by quantity / serving size.

export const FOOD_CATALOG = [
  { id: 'rolled-oats', name: 'Rolled oats, dry', unit: 'g', serving: 100, step: 10, kcal: 389, protein: 16.9, carbs: 66.3, fat: 6.9, source: 'generic', verified: false, note: 'Generic estimate; weigh dry and compare your package label.' },
  { id: 'milk-1-percent', name: 'Milk, 1%', unit: 'mL', serving: 100, step: 50, kcal: 42, protein: 3.4, carbs: 5, fat: 1, source: 'generic', verified: false, note: 'Generic estimate; compare your carton label.' },
  { id: 'chickpeas-cooked', name: 'Chickpeas, cooked', unit: 'g', serving: 100, step: 25, kcal: 164, protein: 8.9, carbs: 27.4, fat: 2.6, source: 'generic', verified: false, note: 'Generic estimate for cooked, drained chickpeas. Rinse canned chickpeas; compare the package label.' },
  { id: 'rice-cooked', name: 'Rice, cooked', unit: 'g', serving: 100, step: 25, kcal: 130, protein: 2.7, carbs: 28.2, fat: 0.3, source: 'generic', verified: false, note: 'Generic estimate for plain cooked rice; count added oil separately.' },
  { id: 'potato-cooked', name: 'Potatoes, boiled', unit: 'g', serving: 100, step: 25, kcal: 87, protein: 1.9, carbs: 20.1, fat: 0.1, source: 'generic', verified: false, note: 'Generic estimate for plain boiled potatoes; count added oil separately.' },
  { id: 'olive-oil', name: 'Olive oil', unit: 'g', serving: 100, step: 5, kcal: 884, protein: 0, carbs: 0, fat: 100, source: 'generic', verified: false, note: 'Generic estimate; enter the amount actually used.' },
  { id: 'walnuts', name: 'Walnuts', unit: 'g', serving: 100, step: 5, kcal: 654, protein: 15.2, carbs: 13.7, fat: 65.2, source: 'generic', verified: false, note: 'Generic estimate for plain walnuts; compare the package label.' },
  {
    id: "protein-milk",
    name: "High-protein milk",
    unit: "mL",
    serving: 250,
    step: 50,
    kcal: 160,
    protein: 18,
    carbs: 9,
    fat: 5,
    source: "Product label photo (250 mL serving)",
    note: "Exact label values; Natrel Plus-style high-protein milk shown in the supplied photo."
  },
  {
    id: "vector-cereal",
    name: "Vector cereal",
    unit: "g",
    serving: 55,
    step: 5,
    kcal: 213,
    protein: 5.6,
    carbs: 45,
    fat: 2.4,
    source: "Vector product label photo (55 g serving)",
    note: "Exact label values. The label also shows 300 mL milk as a prepared serving; this entry is cereal only."
  },
  {
    id: "harvest-crunch-cereal",
    name: "Harvest Crunch cereal",
    unit: "g",
    serving: 100,
    step: 10,
    kcal: 450,
    protein: 10,
    carbs: 68,
    fat: 17,
    source: "Harvest Crunch product label photo (100 g serving)",
    note: "Exact label values. Use 10 g quantity changes in the planner."
  },
  {
    id: "garofalo-protein-pasta",
    name: "Garofalo protein pasta (dry)",
    unit: "g",
    serving: 100,
    step: 10,
    kcal: 340,
    protein: 19,
    carbs: 53,
    fat: 2.5,
    source: "Garofalo product label photo (100 g dry serving)",
    note: "Exact label values. Weigh dry; use 10 g quantity changes in the planner."
  },
  {
    id: "leanfit-whey",
    name: "LEANFIT whey protein",
    unit: "scoop",
    serving: 1,
    step: 0.5,
    kcal: 140,
    protein: 24,
    carbs: 2,
    fat: 4,
    source: "LEANFIT product label photo (33 g scoop)",
    note: "Exact label values; one scoop is 33 g."
  },
  {
    id: "whole-egg",
    name: "Whole egg",
    unit: "egg",
    serving: 1,
    step: 1,
    kcal: 72,
    protein: 6.3,
    carbs: 0.4,
    fat: 4.8,
    source: "generic",
    note: "Generic estimate for a large whole egg; brand and egg size can change the values.",
    verified: false
  },
  {
    id: "chicken-breast-cooked",
    name: "Chicken breast, cooked",
    unit: "g",
    serving: 100,
    step: 10,
    kcal: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    source: "generic",
    note: "Generic estimate for cooked skinless chicken breast; cooking method, trimming, and water loss affect the values.",
    verified: false
  },
  {
    id: "lean-red-meat-cooked",
    name: "Lean red meat, cooked",
    unit: "g",
    serving: 100,
    step: 10,
    kcal: 217,
    protein: 26,
    carbs: 0,
    fat: 12,
    source: "generic",
    note: "Generic estimate for roughly 90% lean cooked beef; use the actual cut or package label when available.",
    verified: false
  },
  {
    id: "tomato-sauce",
    name: "Tomato sauce",
    unit: "g",
    serving: 100,
    step: 10,
    kcal: 36,
    protein: 1.5,
    carbs: 7,
    fat: 0.2,
    source: "generic",
    note: "Generic estimate for plain tomato sauce; sauce brands and added oil/sugar vary.",
    verified: false
  },
  {
    id: "mixed-vegetables",
    name: "Mixed vegetables",
    unit: "g",
    serving: 100,
    step: 25,
    kcal: 35,
    protein: 2,
    carbs: 7,
    fat: 0.2,
    source: "generic",
    note: "Generic estimate for non-starchy mixed vegetables; count added oils separately.",
    verified: false
  },
  {
    id: "berries",
    name: "Berries",
    unit: "g",
    serving: 100,
    step: 25,
    kcal: 50,
    protein: 1,
    carbs: 12,
    fat: 0.3,
    source: "generic",
    note: "Generic estimate for mixed fresh berries; fruit variety and serving size vary.",
    verified: false
  },
  {
    id: "banana",
    name: "Banana",
    unit: "fruit",
    serving: 1,
    step: 1,
    kcal: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.4,
    source: "generic",
    note: "Generic estimate for one medium banana (~118 g); use a gram-based entry if banana size differs substantially.",
    verified: false
  },
  {
    id: "apple",
    name: "Apple",
    unit: "fruit",
    serving: 1,
    step: 1,
    kcal: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
    source: "generic",
    note: "Generic estimate for one medium apple (~182 g); use a gram-based entry if apple size differs substantially.",
    verified: false
  },
  {
    id: "orange",
    name: "Orange",
    unit: "fruit",
    serving: 1,
    step: 1,
    kcal: 62,
    protein: 1.2,
    carbs: 15.4,
    fat: 0.2,
    source: "generic",
    note: "Generic estimate for one medium orange (~131 g); fruit size varies.",
    verified: false
  }
];

const LEGACY_MEALS = [
  { id: 'breakfast', name: 'Breakfast', time: '08:00', items: [] },
  { id: 'lunch', name: 'Lunch', time: '12:30', items: [] },
  { id: 'snack', name: 'Afternoon snack', time: '15:00', items: [] },
  { id: 'dinner', name: 'Dinner', time: '17:30', items: [] }
];

const LEGACY_SETTINGS = {
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
  workNote: ''
};

// An exact snapshot lets the app upgrade only the untouched former starter.
// Imported plans, edited food labels and personal tracking remain local.
export const LEGACY_EMPTY_TEMPLATE = {
  foods: FOOD_CATALOG.slice(), meals: LEGACY_MEALS, settings: LEGACY_SETTINGS,
  supplements: [], medications: []
};

const estimate = (id, name, kcal, protein, carbs, fat, unit = 'g') => ({
  id, name, unit, serving: 100, step: 10, kcal, protein, carbs, fat,
  source: 'generic', verified: false,
  note: 'Generic estimate. Compare your package label and preparation method.'
});
FOOD_CATALOG.push(
  estimate('wholegrain-bread', 'Whole-grain bread / toast', 250, 10, 46, 4),
  estimate('cheddar-cheese', 'Cheddar cheese', 403, 25, 1.3, 33),
  estimate('milk-2-percent', 'Filtered milk, 2%', 50, 3.4, 5, 2, 'mL'),
  estimate('milk-whole', 'Milk, 3.25%', 61, 3.2, 4.8, 3.25, 'mL'),
  estimate('salad-leaves', 'Salad leaves', 20, 1.5, 3, 0.3),
  estimate('cucumber', 'Cucumber', 15, 0.7, 3.6, 0.1),
  estimate('mushrooms', 'Mushrooms', 22, 3.1, 3.3, 0.3),
  estimate('celery', 'Celery', 16, 0.7, 3, 0.2),
  estimate('almonds', 'Almonds, unsalted', 579, 21.2, 21.6, 49.9),
  estimate('dried-cranberries', 'Dried cranberries, sweetened', 325, 0.1, 83, 1.1),
  estimate('raisin-bran', 'Raisin Bran cereal', 355, 9, 80, 2),
  estimate('salmon-cooked', 'Salmon, cooked', 206, 22, 0, 12),
  estimate('tuna-water', 'Canned light tuna in water, drained', 116, 25.5, 0, 0.8),
  estimate('reduced-fat-cheese', 'Reduced-fat cheese', 280, 30, 3, 16)
);

const item = (foodId, quantity) => ({ foodId, quantity });
export const DEFAULT_MEALS = [
  { id: 'breakfast', name: 'Egg, toast & cheese', time: '08:00', items: [item('whole-egg', 1), item('wholegrain-bread', 60), item('cheddar-cheese', 20), item('milk-2-percent', 250)] },
  { id: 'lunch', name: 'Chicken salad & whole-grain toast', time: '12:30', items: [item('chicken-breast-cooked', 90), item('salad-leaves', 80), item('cucumber', 100), item('mushrooms', 100), item('celery', 50), item('olive-oil', 10), item('wholegrain-bread', 60)] },
  { id: 'snack', name: 'Raisin Bran, milk & almonds', time: '15:00', items: [item('raisin-bran', 65), item('milk-2-percent', 200), item('almonds', 30), item('dried-cranberries', 15)] },
  { id: 'dinner', name: 'Salmon & crisp salad', time: '17:30', items: [item('salmon-cooked', 100), item('salad-leaves', 80), item('cucumber', 150), item('mushrooms', 100), item('olive-oil', 15), item('wholegrain-bread', 30)] }
];

// General review options are public. Actual medications, supplement use,
// body measurements, watch data and medical history are never shipped here.
export const DEFAULT_SUPPLEMENTS = [
  { id: 'psyllium-option', name: 'Psyllium fibre — option', status: 'review', time: '', kcal: null,
    dose: 'Build toward 7 g/day of soluble psyllium fibre; powder amount depends on the label.',
    note: 'Start with one labelled serving at lunch, then increase gradually toward the daily target split with dinner. Mix each dose with at least 250 mL liquid; never swallow dry. Avoid with swallowing difficulty or bowel blockage. Ask the pharmacist to confirm medicine spacing and the product dose. Health Canada supports 7 g/day of soluble psyllium fibre for lowering LDL.' },
  { id: 'sterols-option', name: 'Plant sterols — optional', status: 'review', time: '', kcal: null,
    dose: 'Optional: 1 g with lunch + 1 g with dinner; total 2 g/day.',
    note: 'Use a clearly labelled product. Discuss with the pharmacist if taking cholesterol medication. Avoid with sitosterolaemia; not for pregnancy or breastfeeding without clinical advice. This is an option to review, not a prescription or a reason to stop medication.' }
];
export const DEFAULT_SETTINGS = {
  ...LEGACY_SETTINGS, calories: 1900, protein: 80,
  workNote: 'A flexible starter plan around 1,900 kcal with an 80 g protein goal. Adjust portions to maintain weight, appetite and activity. Food values are estimates pending package labels. Suggested swaps: 1% milk, reduced-fat cheese, oats on some mornings, or chickpeas in a salad. Use olive oil instead of butter. Your changes stay in this browser.'
};
