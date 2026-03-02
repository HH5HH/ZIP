#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT}" ]]; then
  echo "error: not inside a git repository" >&2
  exit 1
fi
cd "$ROOT"

usage() {
  cat <<'USAGE'
Usage: scan_archives_for_secrets.sh [--staged]

Options:
  --staged   Scan only staged .zip files
  --help     Show this help text
USAGE
}

mode="all"
case "${1:-}" in
  "" ) ;;
  --staged ) mode="staged" ;;
  --help ) usage; exit 0 ;;
  * ) echo "error: unknown argument '$1'" >&2; usage; exit 1 ;;
esac

SECRET_REGEX='xox[baprs]-[0-9]{6,}-[0-9]{6,}-[A-Za-z0-9-]{10,}|xoxe\.xox[baprs]-[0-9]{6,}-[0-9]{6,}-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (RSA|OPENSSH|EC|DSA|PGP|PRIVATE) KEY-----'

is_interesting_entry() {
  local lower
  lower="$(printf "%s" "$1" | tr '[:upper:]' '[:lower:]')"
  case "$lower" in
    *.js|*.mjs|*.cjs|*.ts|*.tsx|*.jsx|*.json|*.html|*.css|*.md|*.txt|*.yml|*.yaml|*.env|*.ini|*.conf|*.xml)
      return 0
      ;;
  esac

  [[ "$lower" == *secret* || "$lower" == *token* || "$lower" == *config* || "$lower" == *key* ]]
}

failure=0
found_zip=0

scan_archive() {
  local zip_path="$1"
  local matches_file
  matches_file="$(mktemp)"

  if strings "$zip_path" | grep -aEn "$SECRET_REGEX" >"$matches_file"; then
    echo "security check failed: secret-like pattern found in archive strings: $zip_path" >&2
    cat "$matches_file" >&2
    failure=1
  fi
  rm -f "$matches_file"

  while IFS= read -r entry; do
    [[ -n "$entry" ]] || continue
    if ! is_interesting_entry "$entry"; then
      continue
    fi

    local entry_matches
    entry_matches="$(mktemp)"
    if unzip -p "$zip_path" "$entry" 2>/dev/null | grep -aEn "$SECRET_REGEX" >"$entry_matches"; then
      echo "security check failed: secret-like pattern found in archive entry: $zip_path::$entry" >&2
      cat "$entry_matches" >&2
      failure=1
    fi
    rm -f "$entry_matches"
  done < <(unzip -Z1 "$zip_path" 2>/dev/null || true)
}

if [[ "$mode" == "staged" ]]; then
  while IFS= read -r path; do
    [[ -n "$path" ]] || continue
    case "$path" in
      *.zip)
        if [[ -f "$path" ]]; then
          found_zip=1
          scan_archive "$path"
        fi
        ;;
    esac
  done < <(git diff --cached --name-only --diff-filter=ACMR)
else
  while IFS= read -r path; do
    [[ -n "$path" ]] || continue
    if [[ -f "$path" ]]; then
      found_zip=1
      scan_archive "$path"
    fi
  done < <(git ls-files '*.zip')
fi

if [[ "$found_zip" -eq 0 ]]; then
  echo "Archive secret scan: no zip files selected."
  exit 0
fi

if [[ "$failure" -ne 0 ]]; then
  exit 1
fi

echo "Archive secret scan: no exposed secrets detected."
