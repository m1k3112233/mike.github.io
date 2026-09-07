// Nutrition data for the local-first meal planner.
//
// Food macro fields are for the listed serving. Meal quantities are physical
// amounts (grams, millilitres, eggs, fruit servings, or scoops), so callers
// should scale each macro by quantity / serving size.

export const FOOD_CATALOG = [
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
  {
    id: "late-breakfast",
    name: "Late breakfast",
    time: "10:45",
    items: [
      { foodId: "whole-egg", quantity: 4 },
      { foodId: "vector-cereal", quantity: 55 },
      { foodId: "protein-milk", quantity: 250 },
      { foodId: "berries", quantity: 150 }
    ]
  },
  {
    id: "pre-workout",
    name: "Pre-workout meal",
    time: "13:15",
    items: [
      { foodId: "chicken-breast-cooked", quantity: 150 },
      { foodId: "garofalo-protein-pasta", quantity: 75 },
      { foodId: "tomato-sauce", quantity: 125 },
      { foodId: "banana", quantity: 1 }
    ]
  },
  {
    id: "post-workout",
    name: "Post-workout shake and fruit",
    time: "16:15",
    items: [
      { foodId: "leanfit-whey", quantity: 1 },
      { foodId: "protein-milk", quantity: 250 },
      { foodId: "apple", quantity: 1 }
    ]
  },
  {
    id: "final-meal",
    name: "Final meal",
    time: "18:00",
    items: [
      { foodId: "lean-red-meat-cooked", quantity: 180 },
      { foodId: "garofalo-protein-pasta", quantity: 75 },
      { foodId: "mixed-vegetables", quantity: 200 }
    ]
  }
];

export const DEFAULT_SUPPLEMENTS = [
  {
    id: "creatine-monohydrate",
    name: "Creatine monohydrate",
    time: "16:15",
    dose: "Planned: 5 g daily",
    note: "Planned dose from the conversation; product label was not supplied. Treated as non-caloric for this planner.",
    kcal: 0,
    fat: 0,
    optional: false,
    verified: false
  },
  {
    id: "kirkland-multivitamin",
    name: "Kirkland multivitamin",
    time: "10:45",
    dose: "Planned: label dose",
    note: "Product label was not supplied; confirm the serving and timing against the bottle.",
    kcal: null,
    fat: null,
    optional: false,
    verified: false
  },
  {
    id: "all-greens",
    name: "All Greens",
    time: "10:45",
    dose: "Planned: 1 label serving",
    note: "Product label was not supplied. Calories and fat remain unknown rather than being treated as zero.",
    kcal: null,
    fat: null,
    optional: true,
    verified: false
  },
  {
    id: "kirkland-salmon-oil-breakfast",
    name: "Kirkland salmon oil",
    time: "10:45",
    dose: "2 softgels",
    note: "Label confirms 4 softgels/day; each softgel contains 1,200 mg salmon oil, 90 mg EPA, and 110 mg DHA. Energy/fat are derived from 2.4 g oil.",
    kcal: 21.6,
    fat: 2.4,
    optional: false,
    verified: true
  },
  {
    id: "nova-pharma-eaa",
    name: "Nova Pharma EAA",
    time: "15:00",
    dose: "1 scoop (9.42 g) during training",
    note: "Label confirms the 9.42 g scoop. Energy and fat are not stated on the supplied label, so they remain unknown; EAA is optional and breaks a strict fast.",
    kcal: null,
    fat: null,
    optional: true,
    verified: true
  },
  {
    id: "kirkland-salmon-oil-dinner",
    name: "Kirkland salmon oil",
    time: "18:00",
    dose: "2 softgels",
    note: "Label confirms 4 softgels/day; each softgel contains 1,200 mg salmon oil, 90 mg EPA, and 110 mg DHA. Energy/fat are derived from 2.4 g oil.",
    kcal: 21.6,
    fat: 2.4,
    optional: false,
    verified: true
  },
  {
    id: "calm-magnesium",
    name: "CALM magnesium",
    time: "18:30",
    dose: "Planned: 200–300 mg elemental magnesium",
    note: "Planned range from the conversation; product label was not supplied. Confirm the product serving and elemental magnesium amount.",
    kcal: null,
    fat: null,
    optional: true,
    verified: false
  }
];

export const DEFAULT_SETTINGS = {
  calories: 2500,
  protein: 210,
  carbs: 255,
  fat: 70,
  eatingStart: "10:45",
  eatingEnd: "18:45",
  trainingStart: "14:45",
  trainingEnd: "16:00"
};
