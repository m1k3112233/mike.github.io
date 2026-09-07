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

export const DEFAULT_MEALS = [
  { id: 'breakfast', name: 'Breakfast', time: '08:00', items: [] },
  { id: 'lunch', name: 'Lunch', time: '12:30', items: [] },
  { id: 'snack', name: 'Afternoon snack', time: '15:00', items: [] },
  { id: 'dinner', name: 'Dinner', time: '17:30', items: [] }
];

// Personal supplements, medications, energy trends and tracking are entered
// locally in the browser; no private health profile is published with the app.
export const DEFAULT_SUPPLEMENTS = [];
export const DEFAULT_SETTINGS = {
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
