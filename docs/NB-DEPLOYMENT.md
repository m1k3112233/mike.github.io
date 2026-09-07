# NB Meal Planner deployment

NB Meal Planner is a separate static app for `https://nbmealplan.codelement.com/`. Source lives in `nb-meal-planner/`. Its browser storage key is `nb-dayplate-state-v1`, and its origin is independent of the original planner.

The default app opens with four prepared meals, estimated food quantities, a 1,900 kcal target, planning goals of 80 g protein / 250 g carbohydrate / 65 g fat, and a 14-hour fast / 10-hour eating window (editable 08:00–18:00). No import is needed to see the meal plan on a new browser or phone. General supplement recommendations display daily amounts and timing separately from the record of supplements actually taken. Actual medications, supplement use, body measurements, watch data and personal notes remain local. Private setup files and photos must never be committed or placed in the public app directory.

Existing saved copies of the exact untouched empty starter are upgraded to the prepared plan. Customized or imported plans, edited food labels and personal tracking are preserved. Existing installed apps receive the new release through the app's update action.

Missing carbohydrate and fat goals in the 1,900 kcal / 80 g protein setup are completed once in the template and selected day; existing explicit goals and historical days are preserved. The display labels planned totals, editable goals and meals checked as eaten separately. The rounded macro goals are a general planning distribution within the adult ranges in [Health Canada's reference table](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/reference-values-macronutrients.html), not rigid intake limits.

Build the dedicated release:

```text
npm test
npm run prepare-deploy -- --source nb-meal-planner --output dist-nb-root --flat
```

Copy the contents, including `.htaccess`, into this dedicated Hostinger document root:

```text
/home/u805757380/domains/codelement.com/public_html/nbmealplan
```

Namecheap has an A record `nbmealplan` pointing to `187.124.245.194` with a five-minute TTL. Keep the original `public_html` and `public_html/mealplan` contents intact.

The app was manually deployed on September 7, 2026, with release `build-7b1d67575e336624`. HTTPS and the HTTP-to-HTTPS redirect were verified. All 13 public assets matched the prepared files, search-exclusion headers were present, hidden metadata returned 403, and the upload ZIP and default placeholder were moved to Trash. The original root home page remained byte-for-byte unchanged. The live app installed its service worker and reloaded offline with local data intact. A local update from the preceding NB build also preserved the plan, and a 390-pixel phone layout was checked. Physical iPhone testing has not been performed.

The populated starter fix was deployed later on September 7 as `build-58b4e77cee57dd29`. All 13 live assets matched the prepared release, and a fresh local browser origin rendered the identical release with four meals and 1,903 estimated kcal without importing a profile. The live update action was checked with an existing personalized plan. The main site remained unchanged.

The completed macro goals and daily supplement-amount guidance were deployed as `build-a0ace7525ec73d2d`. All 13 live assets matched; the in-app update preserved the private profile, populated the previously missing macro goals, and displayed the sourced daily-amount guidance. The mobile layout and browser error log were checked. The automated suite passed 33 tests.

The `prepare-nb-hostinger-branch.yml` workflow builds NB changes on `main` and publishes an exact deployment tree to `hostinger-nbmealplan` without force-pushing. It does not itself deploy files to Hostinger. The native Hostinger GitHub connection is still pending, so automatic website deployments are not enabled. Once that connection is available, select this repository, the `hostinger-nbmealplan` branch, and the dedicated directory above before enabling Auto-deployment.

The app requests search exclusion through HTML and response headers. It remains accessible to anyone with the link; personal browser data is not served to other visitors. The service worker keeps its complete release cache separate from tracking storage and applies updates only through the app's update action. Export a full local backup before changing browsers or devices.
