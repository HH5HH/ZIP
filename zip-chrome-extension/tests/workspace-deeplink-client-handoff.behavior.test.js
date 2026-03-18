const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const BACKGROUND_JS_PATH = path.join(ROOT, "background.js");
const SIDEPANEL_JS_PATH = path.join(ROOT, "sidepanel.js");

function extractFunctionSource(source, functionName) {
  const markers = [
    "async function " + functionName + "(",
    "function " + functionName + "("
  ];
  let start = -1;
  for (let index = 0; index < markers.length; index += 1) {
    start = source.indexOf(markers[index]);
    if (start !== -1) break;
  }
  assert.notEqual(start, -1, "Unable to locate " + functionName);
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

function encodeZipWorkspacePayload(payload) {
  const json = JSON.stringify(payload);
  return Buffer.from(json, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

test("hidden live client still accepts runtime workspace deeplink handoff", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  const script = [
    'const IS_WORKSPACE_MODE = false;',
    'const state = globalThis.__seed.state;',
    'function parseZipWorkspaceDeeplinkPayload() { return globalThis.__seed.parsedPayload; }',
    'function clearStoredZipWorkspaceDeeplinkIfMatches() { return Promise.resolve(false); }',
    'function applyPendingWorkspaceDeeplink() { return Promise.resolve({ applied: false }); }',
    'function setStatus() {}',
    'function getTicketTableContextStatusMessage() { return "context"; }',
    'function formatErrorMessage(err, fallback) { return err && err.message ? err.message : fallback; }',
    extractFunctionSource(source, "getCurrentZipWorkspaceClientTabId"),
    extractFunctionSource(source, "handleRuntimeWorkspaceDeeplinkMessage"),
    "module.exports = { handleRuntimeWorkspaceDeeplinkMessage, state };"
  ].join("\n\n");
  const context = {
    module: { exports: {} },
    exports: {},
    __seed: {
      state: {
        pendingWorkspaceDeeplink: null,
        user: null,
        sidePanelTargetTabId: 42,
        zendeskTabId: 99
      },
      parsedPayload: {
        version: 1,
        sourceKind: "ticket",
        sourceId: "12345",
        statusFilter: "open",
        searchMode: "cloud"
      }
    }
  };
  vm.runInNewContext(script, context, { filename: SIDEPANEL_JS_PATH });

  const accepted = context.module.exports.handleRuntimeWorkspaceDeeplinkMessage({
    encodedPayload: encodeZipWorkspacePayload({
      v: 1,
      sourceKind: "ticket",
      sourceId: "12345",
      statusFilter: "open"
    }),
    targetTabId: 42
  });

  assert.equal(accepted, true);
  assert.deepEqual(context.module.exports.state.pendingWorkspaceDeeplink, {
    version: 1,
    sourceKind: "ticket",
    sourceId: "12345",
    statusFilter: "open",
    searchMode: "cloud"
  });
});

test("client can consume a queued targeted workspace deeplink from storage", async () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  const encodedPayload = encodeZipWorkspacePayload({
    v: 1,
    sourceKind: "view",
    sourceId: "3600042",
    statusFilter: "pending"
  });
  const script = [
    'const ZIP_PENDING_WORKSPACE_CLIENT_DEEPLINK_STORAGE_KEY = "zip.pending.workspace.client.deeplink.v1";',
    'const IS_WORKSPACE_MODE = false;',
    'const state = globalThis.__seed.state;',
    'const getChromeStorageLocal = globalThis.__seed.getChromeStorageLocal;',
    'const removeChromeStorageLocal = globalThis.__seed.removeChromeStorageLocal;',
    'const handleRuntimeWorkspaceDeeplinkMessage = globalThis.__seed.handleRuntimeWorkspaceDeeplinkMessage;',
    extractFunctionSource(source, "normalizeQueuedZipWorkspaceClientDeeplink"),
    extractFunctionSource(source, "getCurrentZipWorkspaceClientTabId"),
    extractFunctionSource(source, "consumeStoredZipWorkspaceDeeplinkForCurrentClient"),
    "module.exports = { consumeStoredZipWorkspaceDeeplinkForCurrentClient };"
  ].join("\n\n");
  const calls = {
    removed: [],
    handled: []
  };
  const context = {
    module: { exports: {} },
    exports: {},
    __seed: {
      state: {
        sidePanelTargetTabId: 42,
        zendeskTabId: 99
      },
      getChromeStorageLocal: async () => ({
        "zip.pending.workspace.client.deeplink.v1": {
          encodedPayload,
          targetTabId: 42,
          createdAtMs: Date.now()
        }
      }),
      removeChromeStorageLocal: async (keys) => {
        calls.removed.push(Array.isArray(keys) ? keys.slice() : [keys]);
      },
      handleRuntimeWorkspaceDeeplinkMessage: (payload) => {
        calls.handled.push(payload);
        return true;
      }
    }
  };
  vm.runInNewContext(script, context, { filename: SIDEPANEL_JS_PATH });

  const consumed = await context.module.exports.consumeStoredZipWorkspaceDeeplinkForCurrentClient();

  assert.equal(consumed, true);
  assert.deepEqual(JSON.parse(JSON.stringify(calls.handled)), [
    {
      encodedPayload,
      targetTabId: 42
    }
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(calls.removed)), [
    ["zip.pending.workspace.client.deeplink.v1"]
  ]);
});

test("background reroutes official deeplinks back into the Zendesk-hosted ZIP client", () => {
  const source = fs.readFileSync(BACKGROUND_JS_PATH, "utf8");
  const maybeRouteSource = extractFunctionSource(source, "maybeRouteZipWorkspaceDeeplinkTab");

  assert.match(source, /const ZIP_PENDING_WORKSPACE_CLIENT_DEEPLINK_STORAGE_KEY = "zip\.pending\.workspace\.client\.deeplink\.v1";/);
  assert.match(source, /async function queueZipWorkspaceDeeplinkForClient\(encodedPayload,\s*targetTabId\)/);
  assert.match(source, /async function waitForQueuedZipWorkspaceDeeplinkConsumption\(encodedPayload,\s*targetTabId,\s*timeoutMs\)/);
  assert.match(source, /async function routeZipWorkspaceDeeplinkToZendeskClient\(encodedPayload,\s*sourceTabId\)/);
  assert.match(source, /const queued = await queueZipWorkspaceDeeplinkForClient\(payload,\s*targetTabId\)\.catch\(\(\) => null\);/);
  assert.match(source, /await tryOpenZipSidePanelForTab\(targetTab\);/);
  assert.match(maybeRouteSource, /const deliveredToOpenClient = await deliverZipWorkspaceDeeplinkToOpenClient\(parsed\.payload,\s*numericTabId\);/);
  assert.match(maybeRouteSource, /await routeZipWorkspaceDeeplinkToZendeskClient\(parsed\.payload,\s*numericTabId\);/);
  assert.doesNotMatch(maybeRouteSource, /workspaceUrl/);
});

test("background accepts official ZipTool deeplink origin even when runtime redirect origin differs", () => {
  const source = fs.readFileSync(BACKGROUND_JS_PATH, "utf8");
  const encodedPayload = encodeZipWorkspacePayload({
    v: 1,
    sourceKind: "ticket",
    sourceId: "12345",
    statusFilter: "open"
  });
  const script = [
    'const SLACK_OPENID_DEFAULT_REDIRECT_PATH = "slack-user";',
    'const ZIP_WORKSPACE_DEEPLINK_QUERY_PARAM = "zipdeeplink";',
    'const ZIP_OFFICIAL_SLACK_OPENID_REDIRECT_URI = "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org/slack-openid";',
    'const ZIP_OFFICIAL_WORKSPACE_DEEPLINK_URI = "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org/slack-user";',
    'const chrome = globalThis.__seed.chrome;',
    extractFunctionSource(source, "normalizeSlackOpenIdRedirectUri"),
    extractFunctionSource(source, "getZipWorkspaceDeeplinkRedirectOrigins"),
    extractFunctionSource(source, "parseZipWorkspaceDeeplinkUrl"),
    "module.exports = { getZipWorkspaceDeeplinkRedirectOrigins, parseZipWorkspaceDeeplinkUrl };"
  ].join("\n\n");
  const context = {
    module: { exports: {} },
    exports: {},
    URL,
    __seed: {
      chrome: {
        identity: {
          getRedirectURL(pathname) {
            return "https://underpar-runtime.chromiumapp.org/" + String(pathname || "");
          }
        }
      }
    }
  };
  vm.runInNewContext(script, context, { filename: BACKGROUND_JS_PATH });

  const parsed = context.module.exports.parseZipWorkspaceDeeplinkUrl(
    "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org/slack-user?zipdeeplink=" + encodedPayload
  );

  assert.deepEqual(JSON.parse(JSON.stringify(parsed)), {
    payload: encodedPayload,
    origin: "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org"
  });
  assert.ok(
    context.module.exports.getZipWorkspaceDeeplinkRedirectOrigins().includes("https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org")
  );
});
