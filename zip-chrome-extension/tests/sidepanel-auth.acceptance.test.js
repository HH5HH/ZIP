const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const BACKGROUND_PATH = path.join(ROOT, "background.js");
const SIDEPANEL_PATH = path.join(ROOT, "sidepanel.js");
const CONTENT_PATH = path.join(ROOT, "content.js");
const SIDEPANEL_FALLBACK_PATH = path.join(ROOT, "sidepanel-login-fallback.js");
const MANIFEST_PATH = path.join(ROOT, "manifest.json");
const ZENDESK_DASHBOARD_URL = "https://adobeprimetime.zendesk.com/agent/dashboard?brand_id=2379046";
const ZENDESK_LOGIN_WITH_RETURN_URL = "https://adobeprimetime.zendesk.com/access/login?return_to="
  + encodeURIComponent(ZENDESK_DASHBOARD_URL);

function createStorageArea(seed) {
  const store = { ...(seed || {}) };
  return {
    get(keys, callback) {
      let result = {};
      if (Array.isArray(keys)) {
        result = keys.reduce((acc, key) => {
          if (Object.prototype.hasOwnProperty.call(store, key)) acc[key] = store[key];
          return acc;
        }, {});
      } else if (typeof keys === "string") {
        if (Object.prototype.hasOwnProperty.call(store, keys)) result[keys] = store[keys];
      } else if (keys && typeof keys === "object") {
        result = { ...keys };
        Object.keys(keys).forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(store, key)) result[key] = store[key];
        });
      } else {
        result = { ...store };
      }
      if (typeof callback === "function") {
        callback(result);
        return;
      }
      return Promise.resolve(result);
    },
    set(values, callback) {
      if (values && typeof values === "object") {
        Object.assign(store, values);
      }
      if (typeof callback === "function") {
        callback();
        return;
      }
      return Promise.resolve();
    },
    remove(keys, callback) {
      const list = Array.isArray(keys) ? keys : [keys];
      list.forEach((key) => delete store[key]);
      if (typeof callback === "function") {
        callback();
        return;
      }
      return Promise.resolve();
    },
    _dump() {
      return { ...store };
    }
  };
}

function createChromeHarness(options) {
  const mutable = {
    zendeskTabs: Array.isArray(options && options.zendeskTabs) ? options.zendeskTabs.slice() : []
  };
  const calls = {
    runtimeSendMessage: [],
    tabsQuery: [],
    tabsUpdate: [],
    tabsCreate: [],
    tabsSendMessage: [],
    scriptingExecuteScript: [],
    windowsUpdate: [],
    windowsCreate: [],
    windowsRemove: [],
    fetch: [],
    setTimeout: [],
    setInterval: [],
    storageRemove: []
  };
  const listeners = {
    runtimeOnMessage: null
  };

  const storageArea = createStorageArea(options && options.storageSeed ? options.storageSeed : undefined);

  const chrome = {
    runtime: {
      lastError: null,
      getManifest() {
        return { version: "0.0.0-test", name: "ZIP", commands: {} };
      },
      sendMessage(message, callback) {
        calls.runtimeSendMessage.push(message);
        if (typeof callback === "function") callback();
        return Promise.resolve();
      },
      onMessage: {
        addListener(fn) {
          listeners.runtimeOnMessage = fn;
        }
      },
      onInstalled: { addListener() {} },
      onStartup: { addListener() {} }
    },
    tabs: {
      query(queryInfo, callback) {
        calls.tabsQuery.push(queryInfo);
        const pattern = String(queryInfo && queryInfo.url ? queryInfo.url : "");
        const result = pattern.includes("zendesk.com")
          ? mutable.zendeskTabs.slice()
          : [];
        if (typeof callback === "function") {
          callback(result);
          return;
        }
        return Promise.resolve(result);
      },
      update(tabId, updateInfo, callback) {
        calls.tabsUpdate.push({ tabId, updateInfo });
        const result = { id: tabId, windowId: 101 };
        if (typeof callback === "function") {
          callback(result);
          return;
        }
        return Promise.resolve(result);
      },
      create(createInfo, callback) {
        calls.tabsCreate.push(createInfo);
        const result = {
          id: 999,
          windowId: 202,
          url: createInfo && createInfo.url ? createInfo.url : ""
        };
        if (typeof callback === "function") {
          callback(result);
          return;
        }
        return Promise.resolve(result);
      },
      get(tabId, callback) {
        const matched = mutable.zendeskTabs.find((tab) => tab && Number(tab.id) === Number(tabId)) || null;
        const tab = matched
          ? { ...matched }
          : { id: tabId, url: "", windowId: 101 };
        if (typeof callback === "function") {
          callback(tab);
          return;
        }
        return Promise.resolve(tab);
      },
      sendMessage(tabId, message, callback) {
        calls.tabsSendMessage.push({ tabId, message });
        if (options && typeof options.tabsSendMessage === "function") {
          const scripted = options.tabsSendMessage({ tabId, message, calls, mutable }) || {};
          const runtimeError = String(scripted.runtimeError || "").trim();
          if (runtimeError) {
            chrome.runtime.lastError = { message: runtimeError };
            if (typeof callback === "function") callback(undefined);
            chrome.runtime.lastError = null;
            return;
          }
          const scriptedResponse = Object.prototype.hasOwnProperty.call(scripted, "response")
            ? scripted.response
            : { ok: false, status: 0, payload: null };
          if (typeof callback === "function") {
            callback(scriptedResponse);
            return;
          }
          return;
        }
        if (typeof callback === "function") {
          callback({ ok: false, status: 0, payload: null });
          return;
        }
      },
      onUpdated: { addListener() {} },
      onActivated: { addListener() {} }
    },
    scripting: {
      executeScript(injection, callback) {
        calls.scriptingExecuteScript.push(injection);
        if (typeof callback === "function") {
          callback([]);
          return;
        }
        return Promise.resolve([]);
      }
    },
    windows: {
      update(windowId, updateInfo, callback) {
        calls.windowsUpdate.push({ windowId, updateInfo });
        const result = { id: windowId };
        if (typeof callback === "function") {
          callback(result);
          return;
        }
        return Promise.resolve(result);
      },
      create(createInfo, callback) {
        calls.windowsCreate.push(createInfo);
        const result = { id: 303, tabs: [{ id: 404, windowId: 303 }] };
        if (typeof callback === "function") {
          callback(result);
          return;
        }
        return Promise.resolve(result);
      },
      remove(windowId, callback) {
        calls.windowsRemove.push({ windowId });
        if (typeof callback === "function") {
          callback();
          return;
        }
        return Promise.resolve();
      }
    },
    contextMenus: {
      removeAll(callback) {
        if (typeof callback === "function") callback();
      },
      create() {},
      update() {},
      onClicked: { addListener() {} }
    },
    commands: { onCommand: { addListener() {} } },
    sidePanel: {
      onOpened: { addListener() {} },
      onClosed: { addListener() {} },
      setPanelBehavior() { return Promise.resolve(); },
      setOptions() { return Promise.resolve(); },
      getLayout() { return Promise.resolve({ side: "right" }); },
      getPanelBehavior() { return Promise.resolve({ openPanelOnActionClick: true }); },
      getOptions() { return Promise.resolve({ enabled: true, path: "sidepanel.html" }); },
      open() { return Promise.resolve(); },
      close() { return Promise.resolve(); }
    },
    action: { onClicked: { addListener() {} } },
    identity: {
      getRedirectURL(pathName) {
        return "https://example.invalid/" + String(pathName || "");
      },
      launchWebAuthFlow(details, callback) {
        if (typeof callback === "function") callback(details && details.url ? details.url : "");
      }
    },
    storage: {
      local: {
        get: storageArea.get,
        set: storageArea.set,
        remove(keys, callback) {
          calls.storageRemove.push(Array.isArray(keys) ? keys.slice() : [keys]);
          return storageArea.remove(keys, callback);
        }
      }
    }
  };

  const context = {
    chrome,
    console,
    URL,
    TextEncoder,
    TextDecoder,
    crypto: { randomUUID: () => "00000000-0000-0000-0000-000000000000" },
    setTimeout(fn, delay) {
      calls.setTimeout.push({ fn, delay });
      return calls.setTimeout.length;
    },
    clearTimeout() {},
    setInterval(fn, delay) {
      calls.setInterval.push({ fn, delay });
      return calls.setInterval.length;
    },
    clearInterval() {},
    fetch(url) {
      calls.fetch.push(url);
      return Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({}),
        text: async () => ""
      });
    }
  };

  const source = fs.readFileSync(BACKGROUND_PATH, "utf8");
  vm.runInNewContext(source, context, { filename: BACKGROUND_PATH });
  assert.ok(listeners.runtimeOnMessage, "background runtime.onMessage listener was not registered");

  function resetCalls() {
    Object.keys(calls).forEach((key) => {
      if (Array.isArray(calls[key])) calls[key].length = 0;
    });
  }

  async function sendRuntimeMessage(message, senderOverride) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (response) => {
        if (settled) return;
        settled = true;
        resolve(response);
      };
      const maybeAsync = listeners.runtimeOnMessage(message, senderOverride || {}, done);
      if (maybeAsync !== true) done(undefined);
      setImmediate(() => done(undefined));
    });
  }

  return {
    calls,
    mutable,
    resetCalls,
    sendRuntimeMessage,
    storageDump: () => storageArea._dump()
  };
}

test("LOGIN_CLICKED focuses existing Zendesk tab and never opens popup windows", async () => {
  const harness = createChromeHarness({
    zendeskTabs: [{ id: 42, windowId: 7, url: ZENDESK_DASHBOARD_URL }]
  });
  harness.resetCalls();

  const response = await harness.sendRuntimeMessage({ type: "LOGIN_CLICKED" });

  assert.equal(response && response.ok, true);
  assert.equal(harness.calls.tabsUpdate.length, 1, "existing Zendesk tab should be focused");
  assert.equal(
    String(harness.calls.tabsUpdate[0] && harness.calls.tabsUpdate[0].updateInfo && harness.calls.tabsUpdate[0].updateInfo.url || ""),
    ZENDESK_LOGIN_WITH_RETURN_URL,
    "existing Zendesk tab should navigate to login with encoded dashboard return URL"
  );
  assert.equal(harness.calls.windowsUpdate.length, 1, "window should be focused for existing tab");
  assert.equal(harness.calls.tabsCreate.length, 0, "no new tab should be created when Zendesk tab exists");
  assert.equal(harness.calls.windowsCreate.length, 0, "Zendesk login must not use popup windows");
});

test("LOGIN_CLICKED opens a normal Zendesk tab when none exists", async () => {
  const harness = createChromeHarness({ zendeskTabs: [] });
  harness.resetCalls();

  const response = await harness.sendRuntimeMessage({ type: "LOGIN_CLICKED" });

  assert.equal(response && response.ok, true);
  assert.equal(harness.calls.tabsUpdate.length, 0);
  assert.equal(harness.calls.tabsCreate.length, 1, "a regular tab should be created");
  assert.equal(String(harness.calls.tabsCreate[0].url || ""), ZENDESK_LOGIN_WITH_RETURN_URL);
  assert.equal(harness.calls.windowsCreate.length, 0, "Zendesk login must not open popup windows");
});

test("LOGIN_CLICKED still routes to login URL when background auth state is stale logged-in", async () => {
  const harness = createChromeHarness({
    zendeskTabs: [{ id: 42, windowId: 7, url: ZENDESK_DASHBOARD_URL }]
  });
  await harness.sendRuntimeMessage(
    { type: "ZD_SESSION_OK", status: 200, payload: { session: { id: 1 } } },
    { url: ZENDESK_DASHBOARD_URL }
  );
  harness.resetCalls();

  const response = await harness.sendRuntimeMessage({ type: "LOGIN_CLICKED" });

  assert.equal(response && response.ok, true);
  assert.equal(harness.calls.tabsUpdate.length, 1, "existing Zendesk tab should still be updated");
  assert.equal(
    String(harness.calls.tabsUpdate[0] && harness.calls.tabsUpdate[0].updateInfo && harness.calls.tabsUpdate[0].updateInfo.url || ""),
    ZENDESK_LOGIN_WITH_RETURN_URL,
    "login click should always route through Zendesk login URL to avoid stale-auth no-op clicks"
  );
  assert.equal(harness.calls.tabsCreate.length, 0, "no new tab should be created when existing Zendesk tab is present");
});

test("ZIP_REQUEST retries after injecting Zendesk content script when receiver is missing", async () => {
  let attempt = 0;
  const harness = createChromeHarness({
    zendeskTabs: [{ id: 42, windowId: 7, url: ZENDESK_DASHBOARD_URL }],
    tabsSendMessage: ({ message }) => {
      if (!message || message.type !== "ZIP_FROM_BACKGROUND") {
        return { response: { ok: false, status: 0, payload: null } };
      }
      attempt += 1;
      if (attempt === 1) {
        return { runtimeError: "Could not establish connection. Receiving end does not exist." };
      }
      return {
        response: {
          type: "ZIP_RESPONSE",
          requestId: message.requestId,
          result: { ok: true, status: 200 }
        }
      };
    }
  });

  const response = await harness.sendRuntimeMessage({
    type: "ZIP_REQUEST",
    requestId: "r-test",
    tabId: 42,
    inner: { action: "getMe" }
  });

  assert.equal(response && response.type, "ZIP_RESPONSE");
  assert.equal(response && response.error, undefined);
  assert.equal(response && response.result && response.result.ok, true);
  assert.equal(harness.calls.scriptingExecuteScript.length, 1, "content script should be injected once before retry");
  assert.equal(harness.calls.tabsSendMessage.length, 2, "request should retry exactly once");
});

test("legacy idle storage never blocks session checks", async () => {
  const harness = createChromeHarness({
    zendeskTabs: [],
    storageSeed: { "zip.auth.idle.v1": true }
  });
  harness.resetCalls();

  const authState = await harness.sendRuntimeMessage({ type: "ZIP_GET_AUTH_STATE" });
  assert.equal(authState && authState.idleUntilUserInitiatesLogin, false);
  assert.equal(
    harness.calls.fetch.some((url) => String(url).includes("/api/v2/users/me/logout")),
    false,
    "extension must never call Zendesk logout endpoint"
  );

  harness.resetCalls();
  const forced = await harness.sendRuntimeMessage({ type: "ZIP_FORCE_CHECK", reason: "test_force_check" });
  assert.notEqual(forced && forced.idle, true, "force check must not be blocked by local idle state");
  assert.equal(harness.calls.fetch.length > 0 || harness.calls.tabsSendMessage.length > 0, true, "force check should probe Zendesk session");
});

test("ZIP_CHECK_SECRETS reports missing state until ZIP_IMPORT_KEY_PAYLOAD succeeds", async () => {
  const harness = createChromeHarness({ zendeskTabs: [] });
  harness.resetCalls();

  const before = await harness.sendRuntimeMessage({ type: "ZIP_CHECK_SECRETS" });
  assert.equal(before && before.ok, false);

  const imported = await harness.sendRuntimeMessage({
    type: "ZIP_IMPORT_KEY_PAYLOAD",
    config: {
      oidc: {
        clientId: "zip-client-id",
        clientSecret: "zip-client-secret",
        scope: "openid profile email",
        redirectPath: "slack-user"
      },
      api: {
        userToken: "xoxp-test-token"
      },
      singularity: {
        channelId: "C123456789A",
        mention: "@Singularity"
      }
    }
  });
  assert.equal(imported && imported.ok, true);

  const after = await harness.sendRuntimeMessage({ type: "ZIP_CHECK_SECRETS" });
  assert.equal(after && after.ok, true);
  const stored = harness.storageDump();
  assert.equal(String(stored.zip_slack_client_id || ""), "zip-client-id");
  assert.equal(String(stored.zip_slack_client_secret || ""), "zip-client-secret");
  assert.equal(stored.zip_slack_key_loaded, true);

  const cleared = await harness.sendRuntimeMessage({ type: "ZIP_CLEAR_KEY" });
  assert.equal(cleared && cleared.ok, true);
  const finalStatus = await harness.sendRuntimeMessage({ type: "ZIP_CHECK_SECRETS" });
  assert.equal(finalStatus && finalStatus.ok, false);
  const afterClear = harness.storageDump();
  assert.equal(Object.prototype.hasOwnProperty.call(afterClear, "zip_slack_client_id"), false);
  assert.equal(afterClear.zip_slack_key_loaded, false);
});

test("ZIP_RUN_LOCALSTORAGE_MIGRATION maps legacy keys to canonical chrome.storage.local keys", async () => {
  const harness = createChromeHarness({ zendeskTabs: [] });
  harness.resetCalls();

  const migrated = await harness.sendRuntimeMessage({
    type: "ZIP_RUN_LOCALSTORAGE_MIGRATION",
    legacy: {
      "zip.passAi.slackOidc.clientId": "legacy-client-id",
      "zip.passAi.slackOidc.clientSecret": "legacy-client-secret",
      "zip.passAi.slackOidc.scope": "openid profile email",
      "zip.passAi.slackOidc.redirectPath": "slack-user",
      "zip.passAi.expectedSlackTeamId": "TLEGACY1234",
      "zip.passAi.slackApi.userToken": "xoxp-legacy-token",
      "zip.passAi.singularityMention": "@Singularity"
    }
  });
  assert.equal(migrated && migrated.ok, true);
  assert.equal(migrated && migrated.migrated, true);
  assert.equal(Array.isArray(migrated && migrated.clearLocalStorageKeys), true);

  const stored = harness.storageDump();
  assert.equal(String(stored.zip_slack_client_id || ""), "legacy-client-id");
  assert.equal(String(stored.zip_slack_client_secret || ""), "legacy-client-secret");
  assert.equal(stored.zip_slack_key_loaded, true);
  assert.equal(stored.zip_migration_v1_done, true);
});

test("ZIP_CONTEXT_MENU_ACTION clearZipKey clears canonical ZIP secret storage", async () => {
  const harness = createChromeHarness({ zendeskTabs: [] });
  harness.resetCalls();

  const imported = await harness.sendRuntimeMessage({
    type: "ZIP_IMPORT_KEY_PAYLOAD",
    config: {
      oidc: {
        clientId: "menu-client-id",
        clientSecret: "menu-client-secret",
        scope: "openid profile email",
        redirectPath: "slack-user"
      },
      api: {
        userToken: "xoxp-menu-test-token"
      }
    }
  });
  assert.equal(imported && imported.ok, true);

  const action = await harness.sendRuntimeMessage({ type: "ZIP_CONTEXT_MENU_ACTION", action: "clearZipKey" });
  assert.equal(action && action.ok, true);
  const stored = harness.storageDump();
  assert.equal(Object.prototype.hasOwnProperty.call(stored, "zip_slack_client_id"), false);
  assert.equal(stored.zip_slack_key_loaded, false);
});

test("sidepanel login wiring uses LOGIN_CLICKED with no ZIP local sign-out path", () => {
  const source = fs.readFileSync(SIDEPANEL_PATH, "utf8");
  const startLoginMatch = source.match(/async function startLogin\(\)\s*\{[\s\S]*?\n  \}/);
  assert.ok(startLoginMatch, "startLogin function not found");
  const startLoginBody = startLoginMatch[0];

  assert.match(startLoginBody, /sendBackgroundRequest\("LOGIN_CLICKED"/);
  assert.doesNotMatch(startLoginBody, /ZIP_OPEN_LOGIN|ZIP_NAVIGATE|window\.open/);
  assert.doesNotMatch(source, /ZIP_SIGN_OUT/);
  assert.doesNotMatch(source, /function signout\(/);
  assert.doesNotMatch(source, /zipSignoutBtn/);
  assert.match(source, /msg\.type === "AUTHENTICATED"/);
  assert.match(source, /msg\.type === "LOGGED_OUT"/);
  assert.match(source, /msg\.type === "ABOUT_TO_EXPIRE"/);
  assert.match(source, /const collectZendeskTabCandidates = async \(\) => \{/);
  assert.match(source, /const zendeskTabs = await queryZendeskTabsFromSidepanel\(\)\.catch\(\(\) => \[\]\);/);
  assert.match(source, /const candidateIds = await collectZendeskTabCandidates\(\);/);
});

test("sidepanel requires ZIP.KEY gate before Zendesk login", () => {
  const source = fs.readFileSync(SIDEPANEL_PATH, "utf8");
  assert.match(source, /const ZIP_KEY_FILE_PREFIX = "ZIPKEY1:";/);
  assert.match(source, /const ZIP_CONFIG_META_STORAGE_KEY = "zip\.config\.meta\.v1";/);
  assert.match(source, /const ZIP_SLACKTIVATION_SERVICE_KEY = "slacktivation";/);
  assert.match(source, /"slacktivation\.client_id"/);
  assert.match(source, /"slacktivation\.client_secret"/);
  assert.match(source, /"slacktivation\.user_token"/);
  assert.match(source, /function parseZipKeyPayload\(rawText\)/);
  assert.match(source, /function importZipKeyFromFile\(file\)/);
  assert.match(source, /const gateStatus = enforceZipConfigGate\(\{ reportStatus: true \}\);/);
  assert.match(source, /msg\.type === "ZIP_KEY_CLEARED"/);
  assert.doesNotMatch(source, /ZIP\.KEY cleared\. Drop the latest ZIP\.KEY file to continue\./);
});

test("startup status waits for filter catalogs before announcing Ready", () => {
  const source = fs.readFileSync(SIDEPANEL_PATH, "utf8");
  const applySessionMatch = source.match(/async function applySession\(me\)\s*\{[\s\S]*?\n  \}/);
  assert.ok(applySessionMatch, "applySession function not found");
  const applySessionBody = applySessionMatch[0];

  const loadingMenusIndex = applySessionBody.indexOf("Loading filter menus");
  const catalogsIndex = applySessionBody.indexOf("loadFilterCatalogWithRetry(\"By Organization\", loadOrganizations)");
  const firstReadyIndex = applySessionBody.indexOf("setStatus(\"Ready. ");

  assert.notEqual(loadingMenusIndex, -1, "startup should show non-ready status while filter catalogs load");
  assert.notEqual(catalogsIndex, -1, "filter catalog loading block should exist");
  assert.notEqual(firstReadyIndex, -1, "ready status should exist");
  assert.ok(
    firstReadyIndex > catalogsIndex,
    "first Ready status must occur only after filter catalog loading starts"
  );
});

test("content script supports authoritative session probe and logout/session events", () => {
  const source = fs.readFileSync(CONTENT_PATH, "utf8");
  assert.match(source, /type === "ZIP_SESSION_PROBE"/);
  assert.match(source, /type:\s*"ZD_SESSION_OK"/);
  assert.match(source, /type:\s*"ZD_LOGOUT"/);
  assert.match(source, /msg && msg\.type === "ZIP_KEY_CLEARED"/);
  assert.match(source, /type:\s*"ZIP_CHECK_SECRETS"/);
  assert.match(source, /type:\s*"ZIP_OPEN_OPTIONS"/);
  assert.match(source, /ZIP_KEY_BANNER_ID/);
  assert.match(source, /\/api\/v2\/users\/me\/session/);
});

test("manifest enables storage permission and options page", () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  assert.equal(manifest && manifest.manifest_version, 3);
  assert.equal(Array.isArray(manifest && manifest.permissions), true);
  assert.equal(manifest.permissions.includes("storage"), true);
  assert.equal(typeof manifest.options_ui === "object" && manifest.options_ui.page === "options.html", true);
});

test("sidepanel fallback script exists and opens Zendesk via tabs APIs", () => {
  const source = fs.readFileSync(SIDEPANEL_FALLBACK_PATH, "utf8");
  assert.match(source, /ZIP_LOGIN_FALLBACK_OPEN/);
  assert.match(source, /chrome\.tabs\.query/);
  assert.match(source, /chrome\.tabs\.create/);
  assert.match(source, /\/access\/login\?return_to=/);
  assert.match(source, /encodeURIComponent\(ZENDESK_DASHBOARD_URL\)/);
  assert.doesNotMatch(source, /window\.open/);
});

test("ZD session events are accepted only from trusted Zendesk content senders", async () => {
  const harness = createChromeHarness({ zendeskTabs: [] });
  harness.resetCalls();

  const untrusted = await harness.sendRuntimeMessage(
    { type: "ZD_SESSION_OK", status: 200, payload: { session: { id: 1 } } },
    { url: "https://example.com/page" }
  );
  assert.equal(untrusted && untrusted.ok, false);
  assert.equal(
    harness.calls.runtimeSendMessage.some((entry) => entry && entry.type === "AUTHENTICATED"),
    false,
    "untrusted sender must not mutate auth state"
  );

  harness.resetCalls();
  const trusted = await harness.sendRuntimeMessage(
    { type: "ZD_SESSION_OK", status: 200, payload: { session: { id: 1 } } },
    { url: ZENDESK_DASHBOARD_URL }
  );
  assert.equal(trusted && trusted.ok, true);
  assert.equal(
    harness.calls.runtimeSendMessage.some((entry) => entry && entry.type === "AUTHENTICATED"),
    true,
    "trusted Zendesk content sender should update auth state"
  );
});
