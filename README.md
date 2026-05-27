# Notion Web Enhancer

A tiny personal browser extension for tweaking notion.so in the browser. Each
tweak is a checkbox in the toolbar popup; changes apply live.

## Load it

### Chrome / Chromium / Edge / Brave
1. Go to `chrome://extensions`
2. Turn on **Developer mode** (top-right)
3. Click **Load unpacked** → select this `notion-web-enhancer/` folder
4. Pin the puzzle-piece icon and click it to open the settings popup

### Firefox
1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…** → select `manifest.json` in this folder
3. Click the toolbar icon for settings

> Firefox temporary add-ons unload when the browser restarts. For a permanent
> install, package and sign it via [addons.mozilla.org](https://addons.mozilla.org)
> (Developer Hub → submit for "unlisted" self-distribution).

## Features

| Toggle | What it does |
|--------|--------------|
| Hide card hover icons | Removes the `…` menu + pencil/open icons on board cards |
| Full-width pages | Uses the full window width instead of the narrow column |
| Hide help button | Hides the floating `?` bubble in the corner |

## Add your own tweak

1. Add an entry to `FEATURES` in `content/content.js`
2. Add a matching `html.<cssClass> { ... }` block in `content/content.css`
3. Add a checkbox with `data-key="<key>"` in `popup/popup.html`

## Tests

A regression test guards the fragile card-icon selector against edits:

```bash
npm test
```

It loads the real `content/content.css` over a fixture of Notion's captured
hover-toolbar DOM in a headless browser and asserts the pill hides/shows correctly.
Uses the globally-installed `playwright` + its bundled chromium (no local install).

## Releasing a new version (one command)

Auto-update is wired through a self-hosted feed (`updates.json` + GitHub
Releases), so installed copies update themselves. To ship a new version:

```bash
./release.sh 0.1.3
```

This bumps `manifest.json`, points `updates.json` at the new release, signs the
add-on via the AMO API (`web-ext sign`, unlisted), commits + pushes, and cuts the
GitHub release with the signed `.xpi`. One-time setup: copy
`.amo-credentials.example` → `.amo-credentials` and fill in your AMO API key +
secret (from addons.mozilla.org → Developer Hub → Manage API Keys). `gh` must be
authenticated.

Zen/Firefox picks up the update within ~a day, or force it via `about:addons` →
gear ⚙ → **Check for Updates**.

## Fixing a selector after a Notion update

Notion uses obfuscated, changing class names. If a tweak stops working:

1. Right-click the element in Notion → **Inspect**
2. Find a stable-looking selector (prefer `notion-*` classes or `role`/`aria-*`)
3. Paste it into the relevant block in `content/content.css`
