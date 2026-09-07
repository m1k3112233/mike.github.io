# NB Meal Planner deployment

NB Meal Planner is a separate static app for `https://nbmealplan.codelement.com/`. Source lives in `nb-meal-planner/`. Its browser storage key is `nb-dayplate-state-v1`, and its origin is independent of the original planner.

The default app contains empty meals, optional nutrition targets, a 14-hour fast / 10-hour eating window (editable 08:00–18:00), and empty medication and supplement lists. Personal settings and supplied product details are imported or entered locally. Private setup files and photos must never be committed or placed in the public app directory. Suggested or unconfirmed items are marked for review, with no daily checkboxes.

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

The `prepare-nb-hostinger-branch.yml` workflow builds NB changes on `main` and publishes an exact deployment tree to `hostinger-nbmealplan` without force-pushing. It does not itself deploy files to Hostinger. The native Hostinger GitHub connection is still pending, so automatic website deployments are not enabled. Once that connection is available, select this repository, the `hostinger-nbmealplan` branch, and the dedicated directory above before enabling Auto-deployment.

The app requests search exclusion through HTML and response headers. It remains accessible to anyone with the link; personal browser data is not served to other visitors. The service worker keeps its complete release cache separate from tracking storage and applies updates only through the app's update action. Export a full local backup before changing browsers or devices.
