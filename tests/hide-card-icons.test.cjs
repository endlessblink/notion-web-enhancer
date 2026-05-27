/*
 * Regression test for the `hideCardIcons` feature.
 *
 * Notion's hover-toolbar container has only obfuscated, changing class names, so
 * content.css targets it via :has() on the stable bits (data-popup-origin +
 * ellipsisSmall/pencilLineSmall icons). This test loads the REAL content.css over
 * a fixture of the captured DOM in a real browser and verifies the pill hides when
 * the feature is on, shows when off, and that unrelated elements are untouched.
 *
 * Run:  npm test   (from notion-web-enhancer/)
 * Uses the globally-installed `playwright` (resolved via NODE_PATH) + its bundled
 * chromium — no local install needed.
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(ROOT, "content", "content.css"), "utf8");
const fixture = fs.readFileSync(
  path.join(__dirname, "fixtures", "board-card.html"),
  "utf8"
);

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});

async function loadPage(featureOn) {
  const page = await browser.newPage();
  await page.setContent(fixture, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: css });
  await page.evaluate((on) => {
    document.documentElement.classList.toggle("nx-hide-card-icons", on);
  }, featureOn);
  return page;
}

test("hides the card hover toolbar when the feature is ON", async () => {
  const page = await loadPage(true);
  assert.equal(
    await page.locator('[data-testid="card-toolbar"]').isVisible(),
    false,
    "toolbar pill should be hidden"
  );
  await page.close();
});

test("shows the card hover toolbar when the feature is OFF", async () => {
  const page = await loadPage(false);
  assert.equal(
    await page.locator('[data-testid="card-toolbar"]').isVisible(),
    true,
    "toolbar pill should be visible without the feature class"
  );
  await page.close();
});

test("does not hide unrelated content or popup-origin elements", async () => {
  const page = await loadPage(true);
  assert.equal(
    await page.locator('[data-testid="innocent"]').isVisible(),
    true,
    "unrelated popup-origin element (different icon) must stay visible"
  );
  assert.equal(
    await page.locator('[data-testid="card-title"]').isVisible(),
    true,
    "card content must stay visible"
  );
  await page.close();
});
