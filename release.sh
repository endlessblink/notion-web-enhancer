#!/usr/bin/env bash
#
# Notion Web Enhancer — one-command release.
#
#   ./release.sh <new-version>      e.g.  ./release.sh 0.1.3
#
# What it does (no web-UI clicking):
#   1. Bumps "version" in manifest.json.
#   2. Points updates.json at the new version's release asset.
#   3. Signs the add-on via the AMO API (web-ext sign, unlisted) and downloads
#      the signed .xpi.
#   4. Commits + pushes the version bump.
#   5. Cuts GitHub release v<version> with the signed .xpi (filename matches the
#      update_link in updates.json).
#   6. Verifies the feed + asset resolve.
#
# Then Zen/Firefox auto-updates within ~a day, or force it now via
#   about:addons → gear ⚙ → Check for Updates.
#
# Requirements:
#   - .amo-credentials  (gitignored)  — see .amo-credentials.example
#   - gh authenticated to github.com
#   - node/npx (web-ext is run via npx when not installed globally)
set -euo pipefail
cd "$(dirname "$0")"

REPO="endlessblink/notion-web-enhancer"
ADDON_ID="notion-web-enhancer@endlessblink"

VERSION="${1:-}"
if [[ -z "$VERSION" ]]; then
  echo "Usage: ./release.sh <new-version>   (e.g. 0.1.3)" >&2
  exit 1
fi
if git rev-parse "v$VERSION" >/dev/null 2>&1 || gh release view "v$VERSION" --repo "$REPO" >/dev/null 2>&1; then
  echo "Release v$VERSION already exists. Pick a higher version." >&2
  exit 1
fi

# --- AMO credentials (never committed) ---
[[ -f .amo-credentials ]] && source ./.amo-credentials
: "${AMO_JWT_ISSUER:?Set AMO_JWT_ISSUER in .amo-credentials (see .amo-credentials.example)}"
: "${AMO_JWT_SECRET:?Set AMO_JWT_SECRET in .amo-credentials (see .amo-credentials.example)}"

# --- web-ext runner ---
if command -v web-ext >/dev/null 2>&1; then WEBEXT=(web-ext); else WEBEXT=(npx --yes web-ext); fi

ASSET="notion-web-enhancer-$VERSION.xpi"
LINK="https://github.com/$REPO/releases/download/v$VERSION/$ASSET"

echo "==> Bumping manifest.json -> $VERSION"
python3 - "$VERSION" <<'PY'
import json, sys
p = "manifest.json"
m = json.load(open(p))
m["version"] = sys.argv[1]
with open(p, "w") as f:
    json.dump(m, f, indent=2, ensure_ascii=False)
    f.write("\n")
PY

echo "==> Updating updates.json -> $VERSION"
python3 - "$VERSION" "$LINK" "$ADDON_ID" <<'PY'
import json, sys
ver, link, addon_id = sys.argv[1], sys.argv[2], sys.argv[3]
p = "updates.json"
d = json.load(open(p))
d["addons"][addon_id]["updates"] = [{"version": ver, "update_link": link}]
with open(p, "w") as f:
    json.dump(d, f, indent=2)
    f.write("\n")
PY

echo "==> Signing via AMO (web-ext sign, unlisted) — this can take a minute"
rm -rf web-ext-artifacts
"${WEBEXT[@]}" sign \
  --channel=unlisted \
  --api-key="$AMO_JWT_ISSUER" \
  --api-secret="$AMO_JWT_SECRET" \
  --ignore-files "updates.json" "tests/**" "package.json" "README.md" \
                 ".gitignore" "release.sh" ".amo-credentials*" \
                 "web-ext-artifacts/**" "*.zip"

SIGNED="$(ls -t web-ext-artifacts/*.xpi 2>/dev/null | head -1 || true)"
[[ -n "$SIGNED" ]] || { echo "No signed .xpi was produced by web-ext." >&2; exit 1; }
cp "$SIGNED" "/tmp/$ASSET"
echo "    signed: $SIGNED"

echo "==> Committing + pushing version bump"
git add manifest.json updates.json
git commit -q -m "release: v$VERSION"
git push -q origin main

echo "==> Cutting GitHub release v$VERSION"
gh release create "v$VERSION" "/tmp/$ASSET" \
  --repo "$REPO" --title "v$VERSION" \
  --notes "Notion Web Enhancer $VERSION — signed by Mozilla (unlisted). Auto-update via updates.json."

echo "==> Verifying feed + asset resolve"
curl -sIL --max-time 20 -o /dev/null -w "    asset HTTP %{http_code}\n" "$LINK"
curl -s   --max-time 20 "https://raw.githubusercontent.com/$REPO/main/updates.json" \
  | python3 -c "import sys,json; print('    feed version:', json.load(sys.stdin)['addons']['$ADDON_ID']['updates'][0]['version'])"

echo "Done: v$VERSION released. Zen auto-updates within ~a day, or force via about:addons → gear → Check for Updates."
