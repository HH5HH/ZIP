#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCS_DIR="$ROOT/docs"
HTML_DIR="$DOCS_DIR/html"
PDF_DIR="$DOCS_DIR/pdf"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
MD2HTML="/opt/homebrew/bin/md2html"

if [[ ! -x "$MD2HTML" ]]; then
  echo "error: md2html not found at $MD2HTML" >&2
  exit 1
fi

if [[ ! -x "$CHROME" ]]; then
  echo "error: Chrome not found at $CHROME" >&2
  exit 1
fi

mkdir -p "$HTML_DIR" "$PDF_DIR"

DOCS=(
  "$ROOT/README.md"
  "$DOCS_DIR/ZIP_PRINT_THIS_FIRST_QUICK_START.md"
  "$DOCS_DIR/ZIP_MANAGEMENT_RELEASE_MEMO.md"
  "$DOCS_DIR/ZIP_MANAGER_ONE_PAGE_HANDOUT.md"
  "$DOCS_DIR/ZIP_END_TO_END_USER_TRAINING.md"
  "$DOCS_DIR/ZIP_FUNCTIONALITY_INVENTORY_AND_DOC_WORKFLOW.md"
  "$DOCS_DIR/ZIP_USER_UAT_TEST_CASES.md"
  "$DOCS_DIR/ZIP_TRAINING_BINDER.md"
)

render_pdf_with_guard() {
  local html="$1"
  local pdf="$2"
  local base="$3"
  local profile="/tmp/zip-docs-chrome-profile-${base}-$$"
  local log="/tmp/zip_pdf_${base}.log"

  rm -f "$pdf" "$log"

  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --no-first-run \
    --no-default-browser-check \
    --disable-background-networking \
    --disable-component-update \
    --disable-sync \
    --metrics-recording-only \
    --disable-default-apps \
    --mute-audio \
    --no-pings \
    --hide-scrollbars \
    --user-data-dir="$profile" \
    --virtual-time-budget=14000 \
    --print-to-pdf="$pdf" \
    --print-to-pdf-no-header \
    "file://$html" >"$log" 2>&1 &

  local pid=$!
  local deadline=$((SECONDS + 50))

  while kill -0 "$pid" 2>/dev/null; do
    if [[ -s "$pdf" ]] && rg -q "bytes written to file" "$log" 2>/dev/null; then
      break
    fi
    if [[ "$SECONDS" -ge "$deadline" ]]; then
      break
    fi
    sleep 1
  done

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    sleep 1
    kill -9 "$pid" 2>/dev/null || true
  fi
  wait "$pid" 2>/dev/null || true

  if [[ ! -s "$pdf" ]]; then
    echo "error: failed to render $pdf" >&2
    sed -n '1,120p' "$log" >&2 || true
    exit 1
  fi
}

for md in "${DOCS[@]}"; do
  base="$(basename "$md" .md)"
  body="$HTML_DIR/${base}.body.html"
  html="$HTML_DIR/${base}.html"
  pdf="$PDF_DIR/${base}.pdf"

  title="$(awk '/^# /{sub(/^# /, ""); print; exit}' "$md" | sed 's/[&<>]/ /g')"
  [[ -n "$title" ]] || title="$base"

  base_dir="$(cd "$(dirname "$md")" && pwd)"

  "$MD2HTML" --github --ftables --ftasklists "$md" > "$body"

  cat > "$html" <<HTML
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <base href="file://$base_dir/" />
  <title>$title</title>
  <style>
    :root {
      --s2-bg: #f4f4f4;
      --s2-surface: #ffffff;
      --s2-border: #dadada;
      --s2-text: #222222;
      --s2-muted: #575757;
      --s2-accent: #ff2d55;
      --s2-accent-2: #ff7a00;
      --s2-accent-dark: #be0a26;
      --s2-link: #1473e6;
      --s2-code-bg: #f0f0f0;
      --s2-code-border: #d0d0d0;
      --s2-pre-bg: #171717;
      --s2-pre-ink: #f3f3f3;
      --s2-table-head: #fdecee;
      --s2-shadow: 0 5px 16px rgba(0,0,0,0.09);
      --s2-font: "Adobe Clean", "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      --s2-mono: "Source Code Pro", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    @page {
      size: Letter;
      margin: 0.58in;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--s2-text);
      background:
        radial-gradient(80% 38% at 8% 0%, rgba(190,10,38,0.13) 0%, rgba(255,255,255,0) 60%),
        linear-gradient(180deg, #fbfbfb 0%, var(--s2-bg) 100%);
      font-family: var(--s2-font);
      font-size: 11.1pt;
      line-height: 1.58;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 100%;
      max-width: 8.5in;
      margin: 0 auto;
    }
    .hero {
      position: relative;
      border: 1px solid var(--s2-border);
      border-radius: 12px;
      margin-bottom: 18px;
      overflow: hidden;
      box-shadow: var(--s2-shadow);
      background: #101013;
      page-break-inside: avoid;
      break-inside: avoid-page;
    }
    .hero-bg {
      display: block;
      width: 100%;
      height: 130px;
      object-fit: cover;
      opacity: 0.86;
    }
    .hero::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(100deg, rgba(9,9,11,0.92) 10%, rgba(9,9,11,0.46) 72%);
      pointer-events: none;
    }
    .hero-content {
      position: absolute;
      inset: 12px 14px;
      z-index: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      color: #ffffff;
    }
    .hero-brand {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 6px;
    }
    .hero-brand img {
      width: 21px;
      height: 21px;
      filter: drop-shadow(0 0 8px rgba(255, 45, 85, 0.32));
    }
    .hero-brand span {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      color: #f3f3f3;
    }
    .hero h1 {
      margin: 0;
      border: none;
      padding: 0;
      color: #fff;
      font-size: 21pt;
      line-height: 1.15;
      font-weight: 800;
    }
    .hero-meta {
      margin-top: 6px;
      font-size: 8.8pt;
      color: rgba(255,255,255,0.86);
    }
    main {
      background: var(--s2-surface);
      border: 1px solid var(--s2-border);
      border-radius: 11px;
      padding: 16px 18px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.06);
    }
    h1, h2, h3, h4 {
      color: #1f1f1f;
      line-height: 1.25;
      margin-top: 1.1em;
      margin-bottom: 0.45em;
      page-break-after: avoid;
      break-after: avoid-page;
    }
    h1 {
      font-size: 18pt;
      border-bottom: 2px solid var(--s2-border);
      padding-bottom: 6px;
      margin-top: 0.3em;
    }
    h2 {
      font-size: 14.2pt;
      border-left: 4px solid var(--s2-accent);
      padding-left: 10px;
    }
    h3 {
      font-size: 12.2pt;
      color: var(--s2-accent-dark);
    }
    p {
      margin: 0.45em 0 0.7em;
      orphans: 3;
      widows: 3;
    }
    a {
      color: var(--s2-link);
      text-decoration: none;
      border-bottom: 1px solid rgba(20,115,230,0.35);
    }
    ul, ol {
      margin: 0.32em 0 0.75em 1.25em;
      padding: 0;
    }
    li { margin: 0.22em 0; }
    blockquote {
      margin: 0.85em 0;
      padding: 10px 12px;
      border-left: 4px solid var(--s2-accent);
      border-radius: 6px;
      background: #fff4f6;
      color: #444;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      border: 1px solid var(--s2-border);
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    code {
      font-family: var(--s2-mono);
      background: var(--s2-code-bg);
      border: 1px solid var(--s2-code-border);
      border-radius: 4px;
      padding: 0.1em 0.34em;
      font-size: 0.92em;
      color: #222;
      word-break: break-word;
    }
    pre {
      margin: 0.7em 0 0.9em;
      background: var(--s2-pre-bg);
      color: var(--s2-pre-ink);
      border: 1px solid #111;
      border-radius: 8px;
      padding: 12px;
      overflow: auto;
      page-break-inside: avoid;
      break-inside: avoid-page;
    }
    pre code {
      border: none;
      background: transparent;
      color: inherit;
      padding: 0;
      font-size: 9.5pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.6em 0 0.95em;
      font-size: 10pt;
      page-break-inside: avoid;
      break-inside: avoid-page;
    }
    th, td {
      border: 1px solid var(--s2-border);
      padding: 7px 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: var(--s2-table-head);
      font-weight: 700;
    }
    tr:nth-child(even) td {
      background: #fcfcfc;
    }
    hr {
      border: none;
      border-top: 1px solid var(--s2-border);
      margin: 1.1em 0;
    }
    .footer {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid var(--s2-border);
      color: var(--s2-muted);
      font-size: 8.7pt;
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="hero">
      <img class="hero-bg" src="file://$ROOT/assets/brand/splash/zeek-info-peek-master-splash-1920x1080.png" alt="ZIP splash" />
      <div class="hero-content">
        <div class="hero-brand">
          <img src="file://$ROOT/assets/brand/source/zeek-info-peek-master-icon.svg" alt="ZIP app icon" />
          <span>ZEEK INFO PEEK</span>
        </div>
        <h1>$title</h1>
        <div class="hero-meta">ZIP Documentation Suite • Spectrum 2 branded export • Generated $(date '+%Y-%m-%d %H:%M:%S')</div>
      </div>
    </header>
    <main>
HTML

  cat "$body" >> "$html"

  cat >> "$html" <<'HTML'
    </main>
    <footer class="footer">
      <span>PASS • ZIP (Zeek Info Peek)</span>
      <span>Master brand kit aligned</span>
    </footer>
  </div>
</body>
</html>
HTML

  render_pdf_with_guard "$html" "$pdf" "$base"
  bytes="$(wc -c < "$pdf")"
  echo "rendered:$base bytes:$bytes"
done

echo "---"
ls -lT "$PDF_DIR" | sed -n '1,120p'
