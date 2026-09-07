# Nutrition data notes

`meal-planner/data.js` is a small ES module for the plain JavaScript meal-planner PWA. It exports `FOOD_CATALOG`, `DEFAULT_MEALS`, `DEFAULT_SUPPLEMENTS`, and `DEFAULT_SETTINGS`.

## Exact label values transcribed

The supplied photos were inspected directly. These entries use the label serving. The exact LEANFIT whey entry is in `FOOD_CATALOG` and the default post-workout meal, so it is counted once as food rather than duplicated in `DEFAULT_SUPPLEMENTS`.

| Entry | Label serving | kcal | Protein | Carbs | Fat |
| --- | --- | ---: | ---: | ---: | ---: |
| High-protein milk | 250 mL | 160 | 18 g | 9 g | 5 g |
| Vector cereal | 55 g | 213 | 5.6 g | 45 g | 2.4 g |
| Harvest Crunch cereal | 100 g | 450 | 10 g | 68 g | 17 g |
| Garofalo protein pasta, dry | 100 g | 340 | 19 g | 53 g | 2.5 g |
| LEANFIT whey | 1 scoop / 33 g | 140 | 24 g | 2 g | 4 g |

The Kirkland salmon-oil photo confirms 1,200 mg salmon oil per softgel, with 90 mg EPA and 110 mg DHA. The default splits the label's four-softgel daily dose into two with the first meal and two with the final meal. The planner records 2.4 g fat and 21.6 kcal for each two-softgel entry as an oil-energy calculation; the label does not show a separate calorie line.

The Nova Pharma EAA photo confirms a 1-scoop serving of 9.42 g. Its energy is not stated in the supplied label, so `kcal` and `fat` are `null`; the app must display these as unknown rather than zero. The EAA entry is optional and is scheduled during training.

## Estimates and defaults

Eggs, chicken, lean red meat, tomato sauce, mixed vegetables, berries, banana, apple, and orange are generic estimates. They are clearly marked in each entry's `source` and `note` fields. Replace them with package or weighed values when the actual food differs.

The latest conversation supplied a schedule but did not provide a fully itemized final-meal label or exact final-meal portions. `DEFAULT_MEALS` therefore reconstructs a usable training day from that schedule: late breakfast at 10:45 (4 eggs, 55 g Vector, 250 mL milk, 150 g berries), chicken and 75 g dry pasta before training at 13:15 (150 g chicken, 125 g tomato sauce, 1 banana), a 33 g whey scoop with 250 mL milk and an apple at 16:15, and 180 g red meat with 75 g dry pasta and 200 g vegetables at 18:00. Generic estimates remain estimates; known product values were not changed to force an earlier approximate daily total.

Using the catalog values and these reconstructed quantities, the default is approximately **2,499.1 kcal, 221.9 g protein, 239.0 g carbohydrate, and 68.3 g fat from food**. The two two-softgel salmon-oil entries add **43.2 kcal and 4.8 g fat**, for an optional known-energy total of approximately **2,542.3 kcal and 73.1 g fat**. EAA, All Greens, multivitamin, and CALM remain excluded from calorie totals because their supplied labels do not state usable energy values. The generated implementation ZIP was not recovered from the earlier conversation, so these defaults are a transparent reconstruction rather than a byte-for-byte reproduction of that unavailable ZIP.

The default eating window is 10:45–18:45, matching the latest 16-hour-fast/8-hour-eating schedule. Training is set to 14:45–16:00. The earlier conversation used the phrase “10 hours feeding window,” but the latest schedule and 16-hour-fast requirement resolve to the eight-hour window represented here.

## Data semantics

Food macro values are **per the numeric `serving`**, not per physical quantity. A meal item quantity is physical: grams for `g`, millilitres for `mL`, egg count for `egg`, fruit count for `fruit`, and scoop count for `scoop`. For example, 85 g of Garofalo pasta scales the 100 g label entry by `85 / 100`; one whey scoop is quantity `1` and represents the exact 33 g label scoop.

Garofalo pasta and Harvest Crunch use `step: 10` so their quantities can be adjusted in the requested 10 g increments. The `unit` values are limited to `g`, `mL`, `egg`, `fruit`, and `scoop`.

Missing multivitamin, All Greens, and CALM labels are represented with planned doses and `verified: false`; their unknown `kcal` and `fat` are `null`. Creatine keeps the planned 5 g dose and is treated as non-caloric for the planner, but remains unverified because its product label was not supplied. Generic foods use `source: "generic"` and `verified: false`; branded label entries carry the exact label source. No personal weight, medical history, or full conversation transcript is included in this public module.
