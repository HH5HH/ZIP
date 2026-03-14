const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const SIDEPANEL_JS_PATH = path.join(ROOT, "sidepanel.js");

function extractFunctionSource(source, functionName) {
  const marker = "function " + functionName + "(";
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, "Unable to locate " + functionName + " in sidepanel.js");
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

function loadZipWorkspaceDeeplinkHelpers(seed) {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  const script = [
    'const STATUS_FILTER_ALL_VALUE = "all";',
    'const TICKET_SEARCH_MODE_LOCAL = "local";',
    'const TICKET_SEARCH_MODE_CLOUD = "cloud";',
    'const PASS_AI_SLACK_OIDC_DEFAULT_REDIRECT_PATH = "slack-user";',
    'const ZIP_OFFICIAL_SLACK_REDIRECT_URI = "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org/slack-openid";',
    'const ZIP_OFFICIAL_WORKSPACE_DEEPLINK_URI = "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org/slack-user";',
    'const ZIP_WORKSPACE_DEEPLINK_QUERY_PARAM = "zipdeeplink";',
    'const ZIP_TOOL_BETA_ARTICLE_URL = "https://tve.zendesk.com/hc/en-us/articles/46503360732436-ZIP-TOOL-beta";',
    'const ZIP_TOOL_BETA_LINK_LABEL = "zip-zap";',
    'const ZIP_TOOL_DEEPLINK_LINK_LABEL = "in ZipTool";',
    'const state = globalThis.__seed.state;',
    'const chrome = globalThis.__seed.chrome;',
    'function normalizeStatusValue(value) { const raw = String(value || "").trim().toLowerCase(); return raw || STATUS_FILTER_ALL_VALUE; }',
    'function normalizeTicketSearchMode(value) { return String(value || "").trim().toLowerCase() === TICKET_SEARCH_MODE_CLOUD ? TICKET_SEARCH_MODE_CLOUD : TICKET_SEARCH_MODE_LOCAL; }',
    'function normalizeZendeskTicketId(value) { const raw = String(value == null ? "" : value).trim(); return /^\\d+$/.test(raw) ? raw : null; }',
    'function getSelectedPassAiTicketId() { return normalizeZendeskTicketId(state.selectedTicketId); }',
    'function getActiveTicketSourceContext() { return globalThis.__seed.activeSource; }',
    'function getPassAiSlackOpenIdConfig() { return globalThis.__seed.openIdConfig; }',
    'function sanitizeSlackLinkTarget(value) { return String(value || "").trim(); }',
    extractFunctionSource(source, "normalizeZipKeyRedirectUri"),
    extractFunctionSource(source, "encodeZipWorkspaceDeeplinkText"),
    extractFunctionSource(source, "normalizeZipWorkspaceDeeplinkSourceKind"),
    extractFunctionSource(source, "buildZipWorkspaceDeeplinkPayload"),
    extractFunctionSource(source, "getZipToolSlackDeeplinkBaseUrl"),
    extractFunctionSource(source, "buildZipToolSlackDeeplinkUrl"),
    extractFunctionSource(source, "buildZipToolSlackFooterLine"),
    "module.exports = { buildZipWorkspaceDeeplinkPayload, buildZipToolSlackDeeplinkUrl, buildZipToolSlackFooterLine };"
  ].join("\n\n");
  const context = {
    module: { exports: {} },
    exports: {},
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    btoa: (value) => Buffer.from(String(value || ""), "binary").toString("base64"),
    atob: (value) => Buffer.from(String(value || ""), "base64").toString("binary"),
    __seed: seed
  };
  vm.runInNewContext(script, context, { filename: SIDEPANEL_JS_PATH });
  return context.module.exports;
}

function decodeZipWorkspacePayload(value) {
  const raw = String(value || "").trim();
  assert.notEqual(raw, "", "Expected encoded deeplink payload.");
  const compact = raw
    .replace(/\s+/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const remainder = compact.length % 4;
  const padded = remainder === 0 ? compact : (compact + "=".repeat(4 - remainder));
  return Buffer.from(padded, "base64").toString("utf8");
}

function extractSlackLinkTarget(markdown, label) {
  const pattern = new RegExp("<([^>|]+)\\|" + label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ">");
  const match = String(markdown || "").match(pattern);
  assert.ok(match, "Expected markdown to include link label " + label + ".");
  return match[1];
}

test("Slack footer deeplink prioritizes selected ticket context", () => {
  const helpers = loadZipWorkspaceDeeplinkHelpers({
    state: {
      selectedTicketId: "12345",
      statusFilter: "open",
      ticketSearchMode: "local"
    },
    activeSource: {
      kind: "view",
      id: "3600042"
    },
    openIdConfig: {
      redirectUri: "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org/slack-openid",
      redirectPath: "slack-user"
    },
    chrome: {
      identity: {
        getRedirectURL(pathname) {
          return "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org/" + String(pathname || "");
        }
      }
    }
  });

  const footer = helpers.buildZipToolSlackFooterLine();
  assert.match(footer, /^\/\/ <https:\/\/tve\.zendesk\.com\/hc\/en-us\/articles\/46503360732436-ZIP-TOOL-beta\|zip-zap> :ziptool: <https:\/\/ibijkkpjfgaocgmpafbcckhhdkpbldoc\.chromiumapp\.org\/slack-user\?zipdeeplink=/);
  const deeplinkUrl = extractSlackLinkTarget(footer, "in ZipTool");
  const parsed = new URL(deeplinkUrl);
  const payload = JSON.parse(decodeZipWorkspacePayload(parsed.searchParams.get("zipdeeplink")));

  assert.equal(payload.sourceKind, "ticket");
  assert.equal(payload.sourceId, "12345");
  assert.equal(payload.statusFilter, "open");
});

test("Slack footer deeplink preserves view context when no ticket is selected", () => {
  const helpers = loadZipWorkspaceDeeplinkHelpers({
    state: {
      selectedTicketId: null,
      statusFilter: "pending",
      ticketSearchMode: "local"
    },
    activeSource: {
      kind: "view",
      id: "3600042"
    },
    openIdConfig: {
      redirectUri: "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org/slack-openid",
      redirectPath: "slack-user"
    },
    chrome: {
      identity: {
        getRedirectURL(pathname) {
          return "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org/" + String(pathname || "");
        }
      }
    }
  });

  const deeplinkUrl = helpers.buildZipToolSlackDeeplinkUrl();
  const parsed = new URL(deeplinkUrl);
  const payload = JSON.parse(decodeZipWorkspacePayload(parsed.searchParams.get("zipdeeplink")));

  assert.equal(payload.sourceKind, "view");
  assert.equal(payload.sourceId, "3600042");
  assert.equal(payload.statusFilter, "pending");
});

test("Slack footer deeplink stays on the official ZipTool prefix even when config points at another app", () => {
  const helpers = loadZipWorkspaceDeeplinkHelpers({
    state: {
      selectedTicketId: "54321",
      statusFilter: "hold",
      ticketSearchMode: "local"
    },
    activeSource: {
      kind: "view",
      id: "3600042"
    },
    openIdConfig: {
      redirectUri: "https://underpar-runtime.chromiumapp.org/underpar-user",
      redirectPath: "underpar-user"
    },
    chrome: {
      identity: {
        getRedirectURL(pathname) {
          return "https://ziptool-runtime.chromiumapp.org/" + String(pathname || "");
        }
      }
    }
  });

  const deeplinkUrl = helpers.buildZipToolSlackDeeplinkUrl();
  const parsed = new URL(deeplinkUrl);
  const payload = JSON.parse(decodeZipWorkspacePayload(parsed.searchParams.get("zipdeeplink")));

  assert.equal(parsed.origin, "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org");
  assert.equal(parsed.pathname, "/slack-user");
  assert.equal(payload.sourceKind, "ticket");
  assert.equal(payload.sourceId, "54321");
  assert.equal(payload.statusFilter, "hold");
});

test("Slack footer deeplink ignores non-official runtime ids", () => {
  const helpers = loadZipWorkspaceDeeplinkHelpers({
    state: {
      selectedTicketId: "67890",
      statusFilter: "new",
      ticketSearchMode: "local"
    },
    activeSource: {
      kind: "view",
      id: "3600042"
    },
    openIdConfig: {
      redirectUri: "https://underpar-runtime.chromiumapp.org/underpar-user",
      redirectPath: "underpar-user"
    },
    chrome: {
      runtime: {
        id: "abcdefghijklmnopqrstuvwxabcdefab"
      }
    }
  });

  const deeplinkUrl = helpers.buildZipToolSlackDeeplinkUrl();
  const parsed = new URL(deeplinkUrl);
  const payload = JSON.parse(decodeZipWorkspacePayload(parsed.searchParams.get("zipdeeplink")));

  assert.equal(parsed.origin, "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org");
  assert.equal(parsed.pathname, "/slack-user");
  assert.equal(payload.sourceKind, "ticket");
  assert.equal(payload.sourceId, "67890");
  assert.equal(payload.statusFilter, "new");
});

test("Slack footer deeplink falls back to the official ZipTool workspace redirect path", () => {
  const helpers = loadZipWorkspaceDeeplinkHelpers({
    state: {
      selectedTicketId: null,
      statusFilter: "solved",
      ticketSearchMode: "local"
    },
    activeSource: {
      kind: "view",
      id: "9001"
    },
    openIdConfig: {
      redirectUri: "https://underpar-runtime.chromiumapp.org/underpar-user",
      redirectPath: "underpar-user"
    },
    chrome: {}
  });

  const deeplinkUrl = helpers.buildZipToolSlackDeeplinkUrl();
  const parsed = new URL(deeplinkUrl);
  const payload = JSON.parse(decodeZipWorkspacePayload(parsed.searchParams.get("zipdeeplink")));

  assert.equal(parsed.origin, "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org");
  assert.equal(parsed.pathname, "/slack-user");
  assert.equal(payload.sourceKind, "view");
  assert.equal(payload.sourceId, "9001");
  assert.equal(payload.statusFilter, "solved");
});
