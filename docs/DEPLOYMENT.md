# Meal Planner deployment

The application is a static HTML/CSS/JavaScript site. It has no application server, database, or secret configuration. The repository root keeps the existing `index.html` site. The intended Hostinger address is `https://codelement.com/mealplanner/`.

## Hostinger Git setup

The repository includes `prepare-hostinger-branch.yml`. Every push to `main` that changes the app or its preparation script builds the app, computes a content fingerprint for the service worker cache, and publishes the resulting app contents at the root of the `hostinger-mealplanner` branch. The workflow does not replace the existing root site.

In hPanel, open the site dashboard and go to **Advanced → Git → Continue with GitHub**. Choose `m1k3112233/mike.github.io`, branch `hostinger-mealplanner`, and set the install/root directory to:

```text
public_html/mealplanner
```

The directory must be empty for the first deployment. Deploy once, then enable Hostinger's Auto-deployment option for that connected repository if it is available on the hosting plan. A later push to `main` updates the deployment branch and Hostinger pulls it through that integration. If Auto-deployment is unavailable, the same branch can be redeployed with hPanel's Redeploy control after a change.

This uses Hostinger's documented Git integration for custom HTML/PHP sites. Hostinger describes the path as **hPanel → Websites → Dashboard → Advanced → Git**, supports selecting a repository, branch, and root directory, and provides a deploy/redeploy and auto-deployment control. See the [Hostinger Git deployment guide](https://www.hostinger.com/support/1583302-how-to-deploy-a-git-repository-in-hostinger/) and its [Help Center version](https://support.hostinger.com/en/articles/1583302-how-to-deploy-a-git-repository). Their documentation also warns that changing or disconnecting a repository overwrites files in the target directory.

Do not connect the deployment branch to `public_html` for this site: that would put the app's `index.html` over the existing root site. If the app is ever copied manually, run the preparation command below and copy the **contents** of `dist/meal-planner/` into `public_html/mealplanner/`, including the hidden `.htaccess` file. The app's relative URLs and service-worker scope work in either `/mealplanner/` or a document root deployment.

## Privacy and cache behavior

The app is intended to be unlisted. The app HTML carries a `noindex` meta tag and `.htaccess` sends `X-Robots-Tag: noindex, nofollow, noarchive`; this requests search exclusion without changing the existing site's indexing rules. Directory indexes are disabled for the app folder. This is not access protection; anyone with the link can open the app.

`index.html` and `sw.js` are sent with `no-store` headers so a browser can discover a new worker. Each prepared build replaces `__BUILD_VERSION__` in `sw.js` with a hash of the app assets and injects SHA-256 integrity values for every precached shell file. The worker caches only requests inside its own app scope and installs the complete shell atomically; if a file is missing or has changed while a deployment is being copied, installation fails instead of creating a mixed cache. A new worker waits until the app's update action applies it, then the page reloads once; local storage is never cleared.

## Local preparation and checks

From the repository root:

```text
npm test
npm run prepare-deploy -- --output dist
```

The ready-to-copy directory is `dist/meal-planner/`. To create a package whose contents are directly deployable at a document root, use `npm run prepare-deploy -- --output dist-root --flat`; this is only appropriate when that document root is dedicated to the app.

The workflow artifact from **Validate static app** is also named `meal-planner-hostinger-ready` and contains the same prepared app directory. There is no GitHub Pages workflow, so the existing repository root site remains under its current hosting configuration.
