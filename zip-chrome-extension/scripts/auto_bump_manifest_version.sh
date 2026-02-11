#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT}" ]]; then
  echo "error: not inside a git repository" >&2
  exit 1
fi
cd "$ROOT"

MANIFEST="zip-chrome-extension/manifest.json"

usage() {
  cat <<USAGE
Usage: auto_bump_manifest_version.sh [--if-staged-zip-changes]

Options:
  --if-staged-zip-changes   Bump only when staged ZIP app files are present.
  --help                    Show this help text.

Behavior:
  - Bumps patch segment of manifest version (x.y.z -> x.y.(z+1)).
  - Prints new version to stdout only when a bump occurs.
USAGE
}

mode="always"
case "${1:-}" in
  "" ) ;;
  --if-staged-zip-changes ) mode="staged" ;;
  --help ) usage; exit 0 ;;
  * ) echo "error: unknown argument '$1'" >&2; usage; exit 1 ;;
esac

trigger_file() {
  local path="$1"
  case "$path" in
    zip-chrome-extension/*|zip.html|zip-chrome-install.html)
      ;;
    *)
      return 1
      ;;
  esac

  case "$path" in
    zip-chrome-extension/manifest.json)
      return 1
      ;;
    zip-chrome-extension/docs/html/*|zip-chrome-extension/docs/pdf/*)
      return 1
      ;;
    *.zip)
      return 1
      ;;
  esac

  return 0
}

if [[ "$mode" == "staged" ]]; then
  should_bump=0
  while IFS= read -r path; do
    [[ -n "$path" ]] || continue
    if trigger_file "$path"; then
      should_bump=1
      break
    fi
  done < <(git diff --cached --name-only --diff-filter=ACMR)

  [[ "$should_bump" -eq 1 ]] || exit 0
fi

if [[ ! -f "$MANIFEST" ]]; then
  echo "error: missing $MANIFEST" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required for auto version bump" >&2
  exit 1
fi

current="$(jq -r '.version // empty' "$MANIFEST")"
if [[ -z "$current" ]]; then
  echo "error: manifest version not found" >&2
  exit 1
fi

if [[ ! "$current" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  echo "error: unsupported manifest version format '$current' (expected x.y.z)" >&2
  exit 1
fi

major="${BASH_REMATCH[1]}"
minor="${BASH_REMATCH[2]}"
patch="${BASH_REMATCH[3]}"
new_version="${major}.${minor}.$((patch + 1))"

tmp="$(mktemp)"
jq --arg version "$new_version" '.version = $version' "$MANIFEST" > "$tmp"
mv "$tmp" "$MANIFEST"

echo "$new_version"
