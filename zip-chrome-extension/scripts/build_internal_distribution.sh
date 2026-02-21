#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT}" ]]; then
  echo "error: not inside a git repository" >&2
  exit 1
fi
cd "$ROOT"

SOURCE_DIR="$ROOT/zip-chrome-extension"
MANIFEST_PATH="$SOURCE_DIR/manifest.json"
BASE_CONFIG_PATH="$SOURCE_DIR/slack-runtime-config.js"
LOCAL_CONFIG_PATH="${ZIP_SLACK_LOCAL_CONFIG:-}"

if [[ -z "$LOCAL_CONFIG_PATH" ]]; then
  if [[ -f "$SOURCE_DIR/slack-runtime-config.local.js" ]]; then
    LOCAL_CONFIG_PATH="$SOURCE_DIR/slack-runtime-config.local.js"
  elif [[ -f "$SOURCE_DIR/slack-oidc.local.js" ]]; then
    # Backward-compatible fallback for existing local setups.
    LOCAL_CONFIG_PATH="$SOURCE_DIR/slack-oidc.local.js"
  else
    LOCAL_CONFIG_PATH="$SOURCE_DIR/slack-runtime-config.local.js"
  fi
fi

if [[ ! -f "$MANIFEST_PATH" ]]; then
  echo "error: missing $MANIFEST_PATH" >&2
  exit 1
fi
if [[ ! -f "$BASE_CONFIG_PATH" ]]; then
  echo "error: missing $BASE_CONFIG_PATH" >&2
  exit 1
fi
if [[ ! -f "$LOCAL_CONFIG_PATH" ]]; then
  cat >&2 <<EOF
error: missing local Slack runtime secrets file:
  $LOCAL_CONFIG_PATH

Create it from:
  $SOURCE_DIR/slack-runtime-config.local.example.js
EOF
  exit 1
fi
if rg -q "REPLACE_ME|CHANGE_ME|YOUR_" "$LOCAL_CONFIG_PATH"; then
  echo "error: local secrets file still contains placeholder values: $LOCAL_CONFIG_PATH" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required to read manifest version" >&2
  exit 1
fi

VERSION="$(jq -r '.version // empty' "$MANIFEST_PATH")"
if [[ -z "$VERSION" ]]; then
  echo "error: manifest version missing in $MANIFEST_PATH" >&2
  exit 1
fi

OUTPUT_PATH="${1:-$ROOT/ZIP_TEAM_DISTRIBUTION_v${VERSION}.zip}"
if [[ "$OUTPUT_PATH" != /* ]]; then
  OUTPUT_PATH="$ROOT/$OUTPUT_PATH"
fi

TMP_DIR="$(mktemp -d)"
STAGE_DIR="$TMP_DIR/zip-chrome-extension"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

rsync -a --delete --exclude '.DS_Store' "$SOURCE_DIR/" "$STAGE_DIR/"

# Merge base runtime config + local secrets into packaged slack-runtime-config.js.
cat "$BASE_CONFIG_PATH" > "$STAGE_DIR/slack-runtime-config.js"
printf "\n\n" >> "$STAGE_DIR/slack-runtime-config.js"
cat "$LOCAL_CONFIG_PATH" >> "$STAGE_DIR/slack-runtime-config.js"

rm -f "$OUTPUT_PATH"
(cd "$STAGE_DIR" && zip -rq "$OUTPUT_PATH" . -x "*.DS_Store")

echo "Built internal ZIP:"
echo "  $OUTPUT_PATH"
echo "Using local secrets file:"
echo "  $LOCAL_CONFIG_PATH"
echo "Version:"
echo "  $VERSION"
