const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const CONTENT_JS_PATH = path.resolve(__dirname, "..", "content.js");

test("live Zendesk search preserves native status results by default", () => {
  const source = fs.readFileSync(CONTENT_JS_PATH, "utf8");
  assert.match(
    source,
    /const preserveNativeSearchResults = Object\.prototype\.hasOwnProperty\.call\(opts,\s*"preserveNativeSearchResults"\)\s*\?\s*!!opts\.preserveNativeSearchResults\s*:\s*true;/
  );
  assert.match(source, /preserveNativeSearchResults,/);
});

test("status post-filtering is conditional for search service and legacy search", () => {
  const source = fs.readFileSync(CONTENT_JS_PATH, "utf8");
  assert.match(source, /if \(!preserveNativeSearchResults && !includeTicketByStatus\(raw\)\) continue;/);
  const matches = source.match(/if \(!preserveNativeSearchResults && !includeTicketByStatus\(raw\)\) continue;/g) || [];
  assert.equal(matches.length, 2, "expected conditional status filter in both modern and legacy paths");
});
