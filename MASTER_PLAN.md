# MASTER_PLAN.md — Notion Web Enhancer

Browser extension (Chrome + Firefox/Zen, Manifest V3) that tweaks notion.so. Phase 1
is a CSS-toggle extension with a settings popup, shipped and signed. Phase 2 is a
CLI-auth-backed chatbot that can read and act on Notion.

Repo: https://github.com/endlessblink/notion-web-enhancer
(moved out of the `cc-linux-enhancments` repo into its own project.)

## Summary

| ID | Status | Type | Title |
|----|--------|------|-------|
| NWE-001 | DONE | FEATURE | Scaffold cross-browser extension: CSS tweaks + settings popup |
| NWE-002 | DONE | BUG | Verify & fix card-icon hide selectors against live Notion DOM |
| NWE-003 | TODO | TASK | Verify full-width + help-button selectors on live Notion |
| NWE-004 | DONE | TASK | Sign on AMO (unlisted) + self-hosted auto-update feed |
| NWE-005 | DONE | TASK | One-command release automation (release.sh via web-ext sign) |
| NWE-010 | TODO | FEATURE | Local bridge service: bind 127.0.0.1, shared-token auth, /chat |
| NWE-011 | TODO | FEATURE | Bridge to Claude CLI + Codex CLI, switchable per message |
| NWE-012 | TODO | FEATURE | Chat panel UI injected into notion.so, talks to local bridge |
| NWE-013 | TODO | FEATURE | MVP: read current Notion page as context for the model |
| NWE-014 | TODO | FEATURE | Notion official API integration: token + search/read |
| NWE-015 | TODO | FEATURE | Tool-calling loop for write actions (create cards, set status) |
| NWE-016 | TODO | TASK | Security hardening (token, CORS, localhost) + packaging |

---

## Phase 1 — Extension (CSS tweaks)

#### NWE-001 — Scaffold cross-browser extension: CSS tweaks + settings popup `DONE`
MV3 `manifest.json` matching `*.notion.so`; `content.js` toggles a CSS class on
`<html>` per feature (single `FEATURES` map); `content.css` feature blocks; popup
with a checkbox per feature persisted to `storage.sync` with live updates. Seed
features: `hideCardIcons`, `fullWidthPages`, `hideHelpButton`.

#### NWE-002 — Verify & fix card-icon hide selectors against live Notion DOM `DONE`
Notion's hover-toolbar container has only obfuscated classes, so the selector
anchors on stable hooks `[data-popup-origin="true"]` + icon classes
`ellipsisSmall`/`pencilLineSmall`, using `:has()` to hide the whole pill. Confirmed
on the live board. Firefox min bumped to 121 (`:has()`). Regression test at
`tests/hide-card-icons.test.cjs` (Playwright over captured-DOM fixture) passes.

#### NWE-003 — Verify full-width + help-button selectors on live Notion `TODO`
Toolbar icons added (magic-wand on indigo gradient, 16/32/48/128) and wired into
the manifest — done. Still to confirm against live Notion: `nx-full-width`
(`.notion-page-content` max-width) actually widens a page, and `nx-hide-help`
(`.notion-help-button`) hides the "?" bubble; adjust selectors if not.

#### NWE-004 — Sign on AMO (unlisted) + self-hosted auto-update feed `DONE`
Signed via addons.mozilla.org as unlisted/self-distributed; installs permanently in
Zen. Auto-update wired with `update_url` → `updates.json` (raw GitHub) → signed
`.xpi` hosted as a GitHub Release. v0.1.2 live and verified (feed + asset HTTP 200).

#### NWE-005 — One-command release automation `DONE`
`release.sh <version>` bumps `manifest.json`, updates `updates.json`, signs via the
AMO API (`web-ext sign`, unlisted), commits/pushes, and cuts the GitHub release with
the signed `.xpi`. Credentials in gitignored `.amo-credentials` (template provided).

---

## Phase 2 — CLI-auth chatbot (future epic)

**Decisions locked:**
- **Brain:** both Claude CLI and Codex CLI, switchable via a per-message dropdown.
- **Notion access:** official Notion API (one-time integration token + page sharing)
  — not DOM automation.
- **First version:** rough MVP first (chat + read current page), expand to actions.
- **Architecture:** a browser extension cannot read CLI auth files, so a local bridge
  holds the connection and **shells out to `claude -p` / `codex exec`** rather than
  reusing OAuth tokens (avoids the Claude-Max-OAuth 429 request-shape fragility).

```
Notion tab → extension chat panel → HTTP → local bridge (127.0.0.1)
                                              ├→ claude -p / codex exec
                                              └→ Notion official API (read/write)
```

#### NWE-010 — Local bridge service: bind 127.0.0.1, shared-token auth, /chat `TODO`
Small Node/Python service bound to loopback only, gated by a shared token. `/chat` POST.

#### NWE-011 — Bridge to Claude CLI + Codex CLI, switchable per message `TODO`
Spawn `claude -p "…"` or `codex exec "…"` per a `model` field. Handle lifecycle,
timeouts, streaming.

#### NWE-012 — Chat panel UI injected into notion.so, talks to local bridge `TODO`
Content-script side panel (chat log, input, model dropdown) calling the bridge;
needs localhost host permission + CORS.

#### NWE-013 — MVP: read current Notion page as context for the model `TODO`
Pass current page content (Notion API by page id, or DOM) as context.

#### NWE-014 — Notion official API integration: token + search/read `TODO`
Bridge holds a Notion integration token; implement search + page/database read.

#### NWE-015 — Tool-calling loop for write actions `TODO`
Tools to create database rows/cards, update properties/status, append blocks; run a
tool-calling loop so the bot can act on Notion.

#### NWE-016 — Security hardening + packaging `TODO`
Loopback bind, rotating shared token, strict CORS, no secret logging; package the
bridge for easy local start.
