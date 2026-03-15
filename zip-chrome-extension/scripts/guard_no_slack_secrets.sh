#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$ROOT" ]]; then
  echo "error: not inside a git repository" >&2
  exit 1
fi
cd "$ROOT"

SLACK_TOKEN_REGEX='xox[baprs]-[0-9]{6,}-[0-9]{6,}-[A-Za-z0-9-]{10,}|xoxe\.xox[baprs]-[0-9]{6,}-[0-9]{6,}-[A-Za-z0-9-]{10,}'

failure=0

fail() {
  echo "security check failed: $1" >&2
  failure=1
}

if git grep -nI -E "$SLACK_TOKEN_REGEX" -- . >/tmp/zip_slack_token_scan.$$ 2>/dev/null; then
  cat /tmp/zip_slack_token_scan.$$ >&2
  fail "found Slack token pattern in tracked source"
fi
rm -f /tmp/zip_slack_token_scan.$$

RUNTIME_CONFIG_PATH="$ROOT/zip-chrome-extension/slack-runtime-config.js"
if [[ ! -f "$RUNTIME_CONFIG_PATH" ]]; then
  fail "missing runtime config file: $RUNTIME_CONFIG_PATH"
else
  if rg -n 'ZIP_PASS_AI_SLACK_(BOT|USER)_TOKEN\s*=\s*"[^"]+"' "$RUNTIME_CONFIG_PATH" >/tmp/zip_slack_assign_scan.$$; then
    cat /tmp/zip_slack_assign_scan.$$ >&2
    fail "runtime config hardcodes Slack bot/user token assignments"
  fi
  rm -f /tmp/zip_slack_assign_scan.$$

  if rg -n 'ZIP_PASS_AI_SLACK_OIDC_CLIENT_SECRET\s*=\s*"[^"]+"' "$RUNTIME_CONFIG_PATH" >/tmp/zip_slack_secret_scan.$$; then
    cat /tmp/zip_slack_secret_scan.$$ >&2
    fail "runtime config hardcodes Slack OpenID client secret"
  fi
  rm -f /tmp/zip_slack_secret_scan.$$
fi

for tracked_secret_path in \
  "zip-chrome-extension/ZIP.KEY"; do
  if git cat-file -e ":$tracked_secret_path" >/dev/null 2>&1; then
    fail "tracked secret file detected: $tracked_secret_path"
  fi
done

ARCHIVE_PATH="$ROOT/ziptool_distro.zip"
ARCHIVE_RUNTIME_CONFIG_ENTRY="slack-runtime-config.js"
if git ls-files --error-unmatch "ziptool_distro.zip" >/dev/null 2>&1; then
  if [[ ! -f "$ARCHIVE_PATH" ]]; then
    fail "tracked archive is missing from working tree: ziptool_distro.zip"
  else
    archive_runtime_config="$(mktemp)"
    if unzip -p "$ARCHIVE_PATH" "$ARCHIVE_RUNTIME_CONFIG_ENTRY" >"$archive_runtime_config" 2>/dev/null; then
      if grep -Eq "$SLACK_TOKEN_REGEX" "$archive_runtime_config"; then
        fail "archive runtime config includes Slack token value"
      fi
      if rg -n 'ZIP_PASS_AI_SLACK_(BOT|USER)_TOKEN\s*=\s*"[^"]+"' "$archive_runtime_config" >/tmp/zip_archive_assign_scan.$$; then
        cat /tmp/zip_archive_assign_scan.$$ >&2
        fail "archive runtime config hardcodes bot/user token assignment"
      fi
      rm -f /tmp/zip_archive_assign_scan.$$

      if rg -n 'ZIP_PASS_AI_SLACK_OIDC_CLIENT_SECRET\s*=\s*"[^"]+"' "$archive_runtime_config" >/tmp/zip_archive_secret_scan.$$; then
        cat /tmp/zip_archive_secret_scan.$$ >&2
        fail "archive runtime config hardcodes Slack OpenID client secret"
      fi
      rm -f /tmp/zip_archive_secret_scan.$$
    else
      fail "archive is missing $ARCHIVE_RUNTIME_CONFIG_ENTRY"
    fi
    rm -f "$archive_runtime_config"
  fi
fi

if [[ "$failure" -ne 0 ]]; then
  exit 1
fi

echo "Slack secret guard: no exposed Slack secrets detected."
