# Meal Planner deployment

The application is a static HTML/CSS/JavaScript site, live at [mealplan.codelement.com](https://mealplan.codelement.com/). It has no application server, database, or secret configuration. The repository root keeps the existing `index.html` site.

## Hostinger Git setup

The repository includes `prepare-hostinger-branch.yml`. Every push to `main` that changes the app or its preparation script builds the app, computes a content fingerprint for the service worker cache, and publishes the resulting app contents at the root of the `hostinger-mealplanner` branch. The workflow does not replace the existing root site.

The `mealplan.codelement.com` subdomain has been created in Hostinger with this dedicated document root:

```text
/home/u805757380/domains/codelement.com/public_html/mealplan
```

The prepared app contents were manually uploaded on September 7, 2026. The ZIP and default placeholder file were moved to Trash after extraction. Namecheap has an A record for `mealplan` pointing to `187.124.245.194`, with a five-minute TTL. DNS and valid HTTPS are verified, and HTTP redirects to HTTPS. The GitHub connection is still pending because Chrome blocked the installation callback; automated deployments are not enabled yet.

The deployed release uses service-worker version `build-61f13ee9647ea3b1`. All 13 public assets matched the prepared release hashes. The live subdomain successfully installed its worker at `/` and reloaded offline in a browser check. Search-exclusion and cache-control headers were verified, and the original `codelement.com` home page remained byte-for-byte unchanged. Physical iPhone testing remains a separate device check.

When Git integration is available, open the site dashboard and go to **Advanced → Git → Continue with GitHub**. Choose `m1k3112233/mike.github.io`, branch `hostinger-mealplanner`, and set the install/root directory to that document root. Deploy once, then enable Hostinger's Auto-deployment option for that connected repository if it is available on the hosting plan. A later push to `main` updates the deployment branch and Hostinger can pull it through that integration. If Auto-deployment is unavailable, the same branch can be redeployed with hPanel's Redeploy control after a change.

This uses Hostinger's documented Git integration for custom HTML/PHP sites. Hostinger describes the path as **hPanel → Websites → Dashboard → Advanced → Git**, supports selecting a repository, branch, and root directory, and provides a deploy/redeploy and auto-deployment control. See the [Hostinger Git deployment guide](https://www.hostinger.com/support/1583302-how-to-deploy-a-git-repository-in-hostinger/) and its [Help Center version](https://support.hostinger.com/en/articles/1583302-how-to-deploy-a-git-repository). Their documentation also warns that changing or disconnecting a repository overwrites files in the target directory.

Use `public_html/mealplan` as the deployment directory; deploying to `public_html` would overwrite the existing root site. For manual deployment, run the preparation command below and copy the **contents** of `dist/meal-planner/` into that `mealplan` directory, including the hidden `.htaccess` file. The app's relative URLs and service-worker scope work at the subdomain document root or under a path. Browser storage is isolated to `https://mealplan.codelement.com/`, so it remains separate from `https://codelement.com/` and other subdomains.

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
