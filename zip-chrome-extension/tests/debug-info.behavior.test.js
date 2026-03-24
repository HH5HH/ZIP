const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const BACKGROUND_PATH = path.join(ROOT, "background.js");
const CONTENT_PATH = path.join(ROOT, "content.js");
const SIDEPANEL_PATH = path.join(ROOT, "sidepanel.js");

test("content routes Zendesk search diagnostics through runtime messages instead of console debug", () => {
  const source = fs.readFileSync(CONTENT_PATH, "utf8");
  assert.match(source, /function logZendeskSearchEvent\(payload\)/);
  assert.match(source, /sendRuntimeMessage\(\{\s*type:\s*"ZIP_ZENDESK_SEARCH_METRICS"/);
  assert.doesNotMatch(source, /console\.debug\("\[ZIP\] Zendesk search:/);
});

test("background buffers and relays runtime debug bridge events into extension pages", () => {
  const source = fs.readFileSync(BACKGROUND_PATH, "utf8");
  assert.match(source, /const ZIP_DEBUG_EVENT_BUFFER_LIMIT = 120;/);
  assert.match(source, /function recordRuntimeDebugEvent\(payload\)/);
  assert.match(source, /chrome\.runtime\.sendMessage\(\{\s*type:\s*"ZIP_DEBUG_EVENT_RECORDED",\s*payload:\s*entry\s*\}/);
  assert.match(source, /if \(msg\.type === "ZIP_DEBUG_EVENT"\) \{/);
  assert.match(source, /if \(msg\.type === "ZIP_GET_DEBUG_EVENT_BUFFER"\) \{/);
  assert.match(source, /if \(msg\.type === "ZIP_ZENDESK_SEARCH_METRICS"\) \{/);
  assert.match(source, /channel:\s*"zendesk_search"/);
  assert.match(source, /message:\s*eventType \|\| "zendesk_search"/);
});

test("sidepanel ingests bridged debug events and exposes them in ZIP DEBUG INFO", () => {
  const source = fs.readFileSync(SIDEPANEL_PATH, "utf8");
  assert.match(source, /zendeskSearchMetrics:\s*null/);
  assert.match(source, /function recordZipDebugEvent\(channel,\s*message,\s*details,\s*level,\s*atOverride\)/);
  assert.match(source, /function applyRuntimeDebugBridgeEvent\(payload\)/);
  assert.match(source, /function loadRuntimeDebugEventBuffer\(\)/);
  assert.match(source, /if \(msg\.type === "ZIP_DEBUG_EVENT_RECORDED"\) \{/);
  assert.match(source, /loadRuntimeDebugEventBuffer\(\)\.catch\(\(\) => \{\}\);/);
  assert.match(source, /await loadRuntimeDebugEventBuffer\(\)\.catch\(\(\) => \[\]\);/);
  assert.match(source, /"zendesk_search_metrics=" \+ zendeskSearchMetrics/);
  assert.match(source, /"PASS AI handled Slack config issue"/);
  assert.match(source, /"PASS AI request failed"/);
  assert.match(source, /"ticket email copy failed"/);
  assert.match(source, /"load latest ticket question failed"/);
  assert.doesNotMatch(source, /console\.error\("Failed to load latest ticket question:/);
  assert.doesNotMatch(source, /console\.error\("Ticket email copy failed:/);
});
