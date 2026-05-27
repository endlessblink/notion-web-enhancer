/*
 * Notion Web Enhancer — content script
 *
 * HOW THIS WORKS
 * --------------
 * Every feature is just a CSS class toggled on <html>. This script reads your
 * saved settings, turns the matching class on/off, and updates live whenever you
 * change a checkbox in the popup. The actual hiding/styling lives in content.css,
 * scoped under  html.<cssClass> { ... }.
 *
 * TO ADD A NEW TWEAK
 * ------------------
 *   1. Add one entry to FEATURES below (a key, a cssClass, a default).
 *   2. Add a matching  html.<cssClass> { ... }  block in content.css.
 *   3. Add a matching checkbox (data-key="<key>") in popup/popup.html.
 * That's the whole workflow — no other plumbing.
 */
(() => {
  "use strict";

  // Works in both Chrome (chrome.*) and Firefox (browser.*).
  const api = globalThis.browser ?? globalThis.chrome;
  const root = document.documentElement;

  // ── Single source of truth for all features ──────────────────────────────
  const FEATURES = {
    // The "…" menu + pencil/open icons that appear when you hover a board card.
    hideCardIcons: { cssClass: "nx-hide-card-icons", default: true },
    // Force pages to use the full window width instead of the narrow column.
    fullWidthPages: { cssClass: "nx-full-width", default: false },
    // Hide the round help/"?" button in the bottom corner.
    hideHelpButton: { cssClass: "nx-hide-help", default: false },
  };

  const defaults = Object.fromEntries(
    Object.entries(FEATURES).map(([key, def]) => [key, def.default])
  );

  function apply(settings) {
    for (const [key, def] of Object.entries(FEATURES)) {
      const on = settings[key] ?? def.default;
      root.classList.toggle(def.cssClass, Boolean(on));
    }
  }

  // Initial apply (fall back to defaults if storage is unavailable).
  Promise.resolve(api.storage.sync.get(defaults))
    .then(apply)
    .catch(() => apply(defaults));

  // Live updates when a checkbox changes in the popup.
  api.storage.onChanged.addListener((_changes, area) => {
    if (area !== "sync") return;
    Promise.resolve(api.storage.sync.get(defaults)).then(apply).catch(() => {});
  });
})();
