# Dayplate meal planner

A plain HTML, CSS and JavaScript meal planner that works offline after its first successful online load. No application server, database, account, analytics or remote font service is required.

The existing root website is preserved. The planner source is in `meal-planner/`; only that folder's deployable contents are published to the planner's own Hostinger directory.

## Everyday use

- Open **Plan** to adjust food quantities, meal times and daily checklists. Nutrition recalculates from each food's serving values.
- Dates have their own food and plan snapshots. Use **Use this plan for new days** when a change should become the default.
- Use **Foods** to inspect product-label values, edit estimates or add a custom food.
- **Progress** stores weight, waist and notes on the current device. The weight average uses the last seven recorded entries, which may span more than seven days.
- **Settings** contains targets, eating and training times, supplements, and JSON import/export.
- On iPhone, open the HTTPS app in Safari, tap Share and choose Add to Home Screen.

## Data and privacy

Personal tracking stays in browser storage. App updates do not clear it. The app requests search-engine exclusion and is not linked from the main website. This is an unlisted public app, not password protection. Browser storage belongs to the website origin, so other applications on that same origin may share access to storage.

Backups are local JSON files. Export a full backup regularly and before changing browsers, devices or domains, or clearing website data. Browser storage can be removed by the browser or device; offline caching is not a backup. Plan-only imports preserve tracking history; a full restore explicitly replaces it after review.

The public source includes the food catalog and editable example schedule, but no personal weight measurements, waist measurements, daily notes or tracking history.

## Development and publishing

The app itself has no install or build dependency. Node.js is used only for validation and to package a versioned deployment. See [deployment instructions](docs/DEPLOYMENT.md) for the GitHub-to-Hostinger flow and [nutrition provenance](docs/NUTRITION.md) for exact label values and remaining estimates.

```sh
npm test
npm run prepare-deploy -- --output dist
```

Serve the generated `dist/` folder with a local HTTP server and open `/meal-planner/` for offline/update testing. Service workers require HTTPS, except on localhost. Opening the HTML as a local file does not install an offline app.
