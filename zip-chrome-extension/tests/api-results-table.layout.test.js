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
