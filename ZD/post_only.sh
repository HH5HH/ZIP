#!/usr/bin/env bash
set -euo pipefail

# Master script: refresh Zendesk cookies via web login flow and print one line:
#   _zendesk_cookie=<value>; other_cookie=<value>; ...
#
# Usage:
#   ./zendesk_cookie_master.sh <EMAIL> <PASSWORD>

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <EMAIL> <PASSWORD>" >&2
  exit 2
fi

EMAIL="$1"
PASS="$2"

ZD_SIGNIN_URL="https://adobeprimetime.zendesk.com/auth/v3/signin"
BASE="${ZD_BASE:-https://adobeprimetime.zendesk.com}"
BRAND_ID="${ZD_BRAND_ID:-2379046}"
RETURN_TO="${ZD_RETURN_TO:-https%3A%2F%2Fadobeprimetime.zendesk.com%2Fagent%2Ffilters%2F43567215%3Fbrand_id%3D2379046}"

SIGNIN_RETURN_TO="${ZD_SIGNIN_RETURN_TO:-https%3A%2F%2Fadobeprimetime.zendesk.com%2Fagent%2Ffilters%2F43567215}"
ROLE="${ZD_ROLE:-agent}"
SIGNIN_URL="${ZD_SIGNIN_URL:-${BASE}/auth/v3/signin?return_to=${SIGNIN_RETURN_TO}&role=${ROLE}}"

# Host used to keep only cookies that apply to this Zendesk host.
HOST="${BASE#https://}"
HOST="${HOST#http://}"
HOST="${HOST%%/*}"

json_escape() {
  local s="${1-}"
  s=${s//\\/\\\\}
  s=${s//\"/\\\"}
  s=${s//$'\n'/\\n}
  s=${s//$'\r'/\\r}
  s=${s//$'\t'/\\t}
  printf '%s' "$s"
}

JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT

# 1) Preflight GET: establish session + obtain CSRF/authenticity token
LOGIN_HTML="$(curl -sS -c "$JAR" "$SIGNIN_URL")"

TOKEN="$(
  printf '%s' "$LOGIN_HTML" \
    | sed -n \
        -e 's/.*name="authenticity_token" value="\([^"]*\)".*/\1/p' \
        -e 's/.*name="csrf-token" content="\([^"]*\)".*/\1/p' \
        -e 's/.*"csrfToken"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
    | head -n1
)"

if [[ -z "${TOKEN:-}" ]]; then
  echo "ERROR: Could not extract CSRF/authenticity token from: $SIGNIN_URL" >&2
  echo "HINT: Set ZD_SIGNIN_URL to the exact page that contains the email/password form." >&2
  exit 1
fi

# 2) POST to the login handler (this is where _zendesk_cookie is set)
PAYLOAD="$(
  printf '{"user":{"email":"%s","password":"%s"},"use_ui_redirect":true,"brand_id":"%s","return_to":"%s","return_to_on_failure":"","authenticity_token":"%s"}' \
    "$(json_escape "$EMAIL")" \
    "$(json_escape "$PASS")" \
    "$BRAND_ID" \
    "$RETURN_TO" \
    "$(json_escape "$TOKEN")"
)"

RESP="$(
  curl -sS -b "$JAR" -c "$JAR" \
    -H 'accept: application/json' \
    -H 'content-type: application/json;charset=UTF-8' \
    -H 'x-requested-with: XMLHttpRequest' \
    -H "x-csrf-token: $TOKEN" \
    -H "origin: $BASE" \
    -H "referer: $SIGNIN_URL" \
    --data "$PAYLOAD" \
    "$BASE/access/login"
)"

# 3) Follow the returned path once (finalizes cookies)
NEXT_URL="$(printf '%s' "$RESP" | sed -n 's/.*"path":"\([^"]*\)".*/\1/p' | head -n1)"
if [[ -n "${NEXT_URL:-}" ]]; then
  if [[ "$NEXT_URL" == /* ]]; then
    NEXT_URL="${BASE}${NEXT_URL}"
  fi
  curl -sSL -b "$JAR" -c "$JAR" "$NEXT_URL" >/dev/null
fi

# 4) Print cookies as a single Cookie-header-ready line, with _zendesk_cookie first.
COOKIE_LINE="$(awk -F'\t' -v host="$HOST" '
function host_ok(h, dom, d) {
  d = dom
  sub(/^#HttpOnly_/, "", d)
  sub(/^\./, "", d)
  return (length(h) >= length(d) && substr(h, length(h)-length(d)+1) == d)
}
NF >= 7 {
  if ($0 ~ /^#/ && $0 !~ /^#HttpOnly_/) next
  if (!host_ok(host, $1)) next
  n = $6; v = $7
  if (n == "") next
  cookies[n] = v
}
END {
  if (!("_zendesk_cookie" in cookies)) exit 3
  out = "_zendesk_cookie=" cookies["_zendesk_cookie"]
  for (k in cookies) {
    if (k == "_zendesk_cookie") continue
    out = out "; " k "=" cookies[k]
  }
  print out
}
' "$JAR")"
status=$?

if [[ $status -ne 0 || -z "${COOKIE_LINE:-}" ]]; then
  echo "ERROR: _zendesk_cookie not set by server (login likely failed or CSRF/session mismatch)." >&2
  exit 1
fi

printf '%s\n' "$COOKIE_LINE"