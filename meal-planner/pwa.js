const noop = () => {};

/**
 * Register the app-scoped worker and expose a user-triggered update action.
 * The caller owns the update UI; applying an update never clears local state.
 */
export function setupPWA({ onStatus = noop, onUpdate = noop } = {}) {
  if (!("serviceWorker" in navigator)) {
    onStatus("Offline support is unavailable in this browser.");
    return { registration: null, applyUpdate: noop, destroy: noop };
  }

  let registration = null;
  let waitingWorker = null;
  let updateStarted = false;
  let reloadIssued = false;
  const listeners = [];

  const listen = (target, event, handler) => {
    target.addEventListener(event, handler);
    listeners.push(() => target.removeEventListener(event, handler));
  };

  const notifyWaiting = (worker) => {
    if (!worker || waitingWorker === worker) return;
    waitingWorker = worker;
    onStatus("An update is ready to apply.");
    onUpdate(() => {
      if (updateStarted || !waitingWorker) return;
      updateStarted = true;
      onStatus("Applying update…");
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    });
  };

  const inspectRegistration = () => {
    if (registration?.waiting && navigator.serviceWorker.controller) {
      notifyWaiting(registration.waiting);
    }
  };

  const checkForUpdate = () => {
    if (!registration || !navigator.onLine) return;
    registration.update().catch(() => {
      // Offline transitions are normal; the next online/focus check retries.
    });
  };

  const onUpdateFound = () => {
    const installing = registration?.installing;
    if (!installing) return;
    installing.addEventListener("statechange", () => {
      if (installing.state !== "installed") return;
      if (navigator.serviceWorker.controller) {
        notifyWaiting(installing);
      } else {
        onStatus("Offline support is ready.");
      }
    });
  };

  const start = async () => {
    try {
      onStatus("Installing offline support…");
      // Resolving from this module keeps /meal-planner and public_html-root
      // deployments identical, including the worker's registration scope.
      const workerUrl = new URL("./sw.js", import.meta.url);
      registration = await navigator.serviceWorker.register(workerUrl, {
        scope: new URL("./", import.meta.url).pathname,
        updateViaCache: "none",
      });
      registration.addEventListener("updatefound", onUpdateFound);
      // Handle a worker that was already installing before this listener was added.
      onUpdateFound();
      if (navigator.serviceWorker.controller) {
        onStatus("Offline support is ready.");
      } else {
        void navigator.serviceWorker.ready.then(() => onStatus("Offline support is ready."));
      }
      inspectRegistration();
      checkForUpdate();
    } catch {
      onStatus("Offline support could not be enabled.");
    }
  };

  listen(navigator.serviceWorker, "controllerchange", () => {
    if (!updateStarted || reloadIssued) return;
    reloadIssued = true;
    window.location.reload();
  });
  listen(window, "online", checkForUpdate);
  listen(window, "focus", checkForUpdate);
  listen(document, "visibilitychange", () => {
    if (document.visibilityState === "visible") checkForUpdate();
  });

  void start();

  return {
    get registration() {
      return registration;
    },
    applyUpdate: () => {
      if (waitingWorker && !updateStarted) {
        updateStarted = true;
        waitingWorker.postMessage({ type: "SKIP_WAITING" });
      }
    },
    destroy: () => listeners.splice(0).forEach((remove) => remove()),
  };
}
