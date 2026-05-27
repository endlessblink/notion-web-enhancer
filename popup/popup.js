/*
 * Popup logic: reflect saved settings into the checkboxes, and persist any
 * change. The content script watches storage and updates open Notion tabs live.
 *
 * Keep these defaults in sync with FEATURES in content/content.js.
 */
(() => {
  "use strict";

  const api = globalThis.browser ?? globalThis.chrome;

  const defaults = {
    hideCardIcons: true,
    fullWidthPages: false,
    hideHelpButton: false,
  };

  async function init() {
    const settings = await api.storage.sync.get(defaults);
    const boxes = document.querySelectorAll("input[type=checkbox][data-key]");

    boxes.forEach((box) => {
      const key = box.dataset.key;
      box.checked = Boolean(settings[key]);
      box.addEventListener("change", () => {
        api.storage.sync.set({ [key]: box.checked });
      });
    });
  }

  init();
})();
