const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SIDEPANEL_JS_PATH = path.join(ROOT, "sidepanel.js");
const SIDEPANEL_CSS_PATH = path.join(ROOT, "sidepanel.css");

test("API results renderer applies adaptive key-column sizing for root and nested KV tables", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  assert.match(source, /function computeReadableKeyColumnCh\(/);
  assert.match(source, /ROOT_KV_KEY_COLUMN_MIN_CH/);
  assert.match(source, /NESTED_KV_KEY_COLUMN_MIN_CH/);
  assert.match(source, /table\.style\.setProperty\("--zip-api-kv-key-col-ch"/);
  assert.match(source, /nest\.style\.setProperty\("--zip-nested-kv-key-col-ch"/);
});

test("API result key cells force horizontal readable flow and prevent character-column wrapping", () => {
  const css = fs.readFileSync(SIDEPANEL_CSS_PATH, "utf8");
  assert.match(css, /\.raw-table-wrap table\.raw-table-mode-kv\s*\{[\s\S]*table-layout:\s*auto;/);
  assert.match(css, /\.raw-table-wrap table\.raw-table-mode-kv\s*\{[\s\S]*--zip-api-kv-key-col-ch:/);
  assert.match(css, /\.raw-table-wrap table\.raw-table-mode-kv col\.raw-kv-col-key\s*\{[\s\S]*var\(--zip-api-kv-key-col-ch\)/);
  assert.match(css, /\.raw-kv-key-label\s*\{[\s\S]*white-space:\s*nowrap;/);
  assert.match(css, /\.raw-kv-key-label\s*\{[\s\S]*word-break:\s*normal;/);
  assert.match(css, /\.raw-kv-key-label\s*\{[\s\S]*overflow-wrap:\s*normal;/);
  assert.match(css, /\.raw-nested-table\.raw-nested-table-kv\s*\{[\s\S]*--zip-nested-kv-key-col-ch:/);
});

test("ticket layout stays contained when the sidepanel is narrowed", () => {
  const css = fs.readFileSync(SIDEPANEL_CSS_PATH, "utf8");
  assert.match(css, /html\s*\{[\s\S]*min-width:\s*0;/);
  assert.match(css, /html\s*\{[\s\S]*overflow-x:\s*hidden;/);
  assert.match(css, /body\s*\{[\s\S]*min-width:\s*0;/);
  assert.match(css, /body\s*\{[\s\S]*overflow:\s*hidden;/);
  assert.match(css, /\.topbar\s*\{[\s\S]*min-inline-size:\s*0;/);
  assert.match(css, /\.section\s*\{[\s\S]*min-inline-size:\s*0;/);
  assert.doesNotMatch(css, /\.ticket-section-header\s*\{[\s\S]*min-inline-size:\s*var\(--zip-ticket-header-min-inline-size\);/);
  assert.match(css, /\.ticket-section-filters\s*\{[\s\S]*max-inline-size:\s*100%;/);
  assert.match(css, /\.table-wrap\s*\{[\s\S]*max-width:\s*100%;/);
  assert.match(css, /@media \(max-width: 520px\) \{[\s\S]*\.topbar\s*\{[\s\S]*flex-wrap:\s*wrap;/);
  assert.match(css, /@media \(max-width: 520px\) \{[\s\S]*\.ticket-section-header\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\);[\s\S]*grid-template-areas:\s*"title"[\s\S]*"status"[\s\S]*"filters";/);
  assert.match(css, /@media \(max-width: 520px\) \{[\s\S]*\.ticket-table-footer\s*\{[\s\S]*flex-wrap:\s*wrap;/);
});
