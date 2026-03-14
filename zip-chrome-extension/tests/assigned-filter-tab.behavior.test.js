const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const BACKGROUND_JS_PATH = path.join(ROOT, "background.js");
const ZENDESK_ORIGIN = "https://adobeprimetime.zendesk.com";
const ASSIGNED_FILTER_PATH = "/agent/filters/36464467";
const ASSIGNED_FILTER_URL = ZENDESK_ORIGIN + ASSIGNED_FILTER_PATH;

function extractFunctionSource(source, functionName) {
  const markers = [
    "async function " + functionName + "(",
    "function " + functionName + "("
  ];
  let start = -1;
  for (let i = 0; i < markers.length; i += 1) {
    start = source.indexOf(markers[i]);
    if (start !== -1) break;
  }
  assert.notEqual(start, -1, "Unable to locate " + functionName + " in background.js");
  const bodyStart = source.indexOf("{", start);
  assert.notEqual(bodyStart, -1, "Unable to locate body for " + functionName);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }
  throw new Error("Unterminated function: " + functionName);
}

function loadEnsureAssignedFilterTab(seed) {
  const source = fs.readFileSync(BACKGROUND_JS_PATH, "utf8");
  const script = [
    'const ZENDESK_ORIGIN = "https://adobeprimetime.zendesk.com";',
    'const ASSIGNED_FILTER_PATH = "/agent/filters/36464467";',
    'const ASSIGNED_FILTER_URL = ZENDESK_ORIGIN + ASSIGNED_FILTER_PATH;',
    "const chrome = globalThis.__seed.chrome;",
    "async function getActiveTab() { return globalThis.__seed.activeTab; }",
    "async function getZendeskTabInCurrentWindow() { return globalThis.__seed.zendeskTab; }",
    extractFunctionSource(source, "normalizePathname"),
    extractFunctionSource(source, "isAssignedFilterUrl"),
    extractFunctionSource(source, "isZendeskUrl"),
    extractFunctionSource(source, "ensureAssignedFilterTabInCurrentWindow"),
    "module.exports = { ensureAssignedFilterTabInCurrentWindow };"
  ].join("\n\n");

  const context = {
    module: { exports: {} },
    exports: {},
    URL,
    __seed: seed
  };
  vm.runInNewContext(script, context, { filename: BACKGROUND_JS_PATH });
  return context.module.exports.ensureAssignedFilterTabInCurrentWindow;
}

function createChromeStub() {
  const calls = {
    tabsUpdate: [],
    tabsCreate: []
  };
  return {
    calls,
    chrome: {
      tabs: {
        update(tabId, updateInfo) {
          calls.tabsUpdate.push({ tabId, updateInfo });
          return Promise.resolve({ id: tabId, url: updateInfo && updateInfo.url ? updateInfo.url : "" });
        },
        create(createInfo) {
          calls.tabsCreate.push(createInfo);
          return Promise.resolve({ id: 777, url: createInfo && createInfo.url ? createInfo.url : "" });
        }
      }
    }
  };
}

function toPlainJson(value) {
  return JSON.parse(JSON.stringify(value));
}

test("assigned-filter bootstrap preserves a workspace deeplink tab and reuses an existing Zendesk tab", async () => {
  const { chrome, calls } = createChromeStub();
  const ensureAssignedFilterTabInCurrentWindow = loadEnsureAssignedFilterTab({
    chrome,
    activeTab: {
      id: 11,
      url: "chrome-extension://ibijkkpjfgaocgmpafbcckhhdkpbldoc/sidepanel.html?mode=workspace"
    },
    zendeskTab: {
      id: 42,
      url: ZENDESK_ORIGIN + "/agent/dashboard?brand_id=2379046"
    }
  });

  const result = await ensureAssignedFilterTabInCurrentWindow();

  assert.equal(result.ok, true);
  assert.equal(result.tabId, 42);
  assert.equal(result.reused, true);
  assert.equal(result.navigated, true);
  assert.deepEqual(toPlainJson(calls.tabsUpdate), [
    {
      tabId: 42,
      updateInfo: { url: ASSIGNED_FILTER_URL }
    }
  ]);
  assert.deepEqual(toPlainJson(calls.tabsCreate), []);
});

test("assigned-filter bootstrap opens a background Zendesk tab when workspace mode has no Zendesk host tab", async () => {
  const { chrome, calls } = createChromeStub();
  const ensureAssignedFilterTabInCurrentWindow = loadEnsureAssignedFilterTab({
    chrome,
    activeTab: {
      id: 11,
      url: "chrome-extension://ibijkkpjfgaocgmpafbcckhhdkpbldoc/sidepanel.html?mode=workspace"
    },
    zendeskTab: null
  });

  const result = await ensureAssignedFilterTabInCurrentWindow();

  assert.equal(result.ok, true);
  assert.equal(result.tabId, 777);
  assert.equal(result.reused, false);
  assert.equal(result.navigated, true);
  assert.deepEqual(toPlainJson(calls.tabsUpdate), []);
  assert.deepEqual(toPlainJson(calls.tabsCreate), [
    { url: ASSIGNED_FILTER_URL, active: false }
  ]);
});

test("assigned-filter bootstrap keeps legacy behavior when the active tab is already Zendesk", async () => {
  const { chrome, calls } = createChromeStub();
  const ensureAssignedFilterTabInCurrentWindow = loadEnsureAssignedFilterTab({
    chrome,
    activeTab: {
      id: 55,
      url: ZENDESK_ORIGIN + "/agent/tickets/12345"
    },
    zendeskTab: {
      id: 42,
      url: ASSIGNED_FILTER_URL
    }
  });

  const result = await ensureAssignedFilterTabInCurrentWindow();

  assert.equal(result.ok, true);
  assert.equal(result.tabId, 55);
  assert.equal(result.reused, true);
  assert.equal(result.navigated, true);
  assert.deepEqual(toPlainJson(calls.tabsUpdate), [
    {
      tabId: 55,
      updateInfo: { active: true, url: ASSIGNED_FILTER_URL }
    }
  ]);
  assert.deepEqual(toPlainJson(calls.tabsCreate), []);
});
