const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const BACKGROUND_PATH = path.join(ROOT, "background.js");
const SIDEPANEL_PATH = path.join(ROOT, "sidepanel.js");
const CONTENT_PATH = path.join(ROOT, "content.js");
const OPTIONS_PATH = path.join(ROOT, "options.js");
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
    downloadsDownload: [],
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
    downloads: {
      download(downloadInfo, callback) {
        calls.downloadsDownload.push(downloadInfo);
        if (options && options.downloadShouldFail) {
          return Promise.reject(new Error("download failed"));
        }
        chrome.runtime.lastError = null;
        if (typeof callback === "function") {
          callback(73);
          return;
        }
        return Promise.resolve(73);
      }
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
    URLSearchParams,
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
    fetch(url, init) {
      const requestUrl = String(url || "");
      calls.fetch.push(requestUrl);
      if (options && typeof options.fetch === "function") {
        const scripted = options.fetch({ url: requestUrl, init, calls, mutable });
        if (scripted && typeof scripted.then === "function") return scripted;
        if (scripted) return Promise.resolve(scripted);
      }
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

test("idle storage never blocks session checks", async () => {
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
  assert.equal(Object.prototype.hasOwnProperty.call(stored, "zip_slack_oauth_token"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(stored, "zip_slack_user_token"), false);

  const cleared = await harness.sendRuntimeMessage({ type: "ZIP_CLEAR_KEY" });
  assert.equal(cleared && cleared.ok, true);
  const finalStatus = await harness.sendRuntimeMessage({ type: "ZIP_CHECK_SECRETS" });
  assert.equal(finalStatus && finalStatus.ok, false);
  const afterClear = harness.storageDump();
  assert.equal(Object.prototype.hasOwnProperty.call(afterClear, "zip_slack_client_id"), false);
  assert.equal(afterClear.zip_slack_key_loaded, false);
});

test("ZIP_IMPORT_KEY_PAYLOAD strips user-scoped Slack tokens from ZIP.KEY config", async () => {
  const harness = createChromeHarness({ zendeskTabs: [] });

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
        userToken: "SLK_TEST_LEGACY_ZIP_KEY_TOKEN",
        botToken: "SLK_TEST_ZIP_BOT_TOKEN"
      },
      singularity: {
        channelId: "C123456789A",
        mention: "@Singularity"
      }
    }
  });

  assert.equal(imported && imported.ok, true);
  const stored = harness.storageDump();
  assert.equal(String(stored.zip_slack_bot_token || ""), "SLK_TEST_ZIP_BOT_TOKEN");
  assert.equal(Object.prototype.hasOwnProperty.call(stored, "zip_slack_oauth_token"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(stored, "zip_slack_user_token"), false);
});

test("ZIP_IMPORT_KEY_PAYLOAD preserves PASS-TRANSITION cache for load-once member hydration", async () => {
  const harness = createChromeHarness({ zendeskTabs: [] });

  const imported = await harness.sendRuntimeMessage({
    type: "ZIP_IMPORT_KEY_PAYLOAD",
    config: {
      oidc: {
        clientId: "pass-transition-client-id",
        clientSecret: "pass-transition-client-secret",
        scope: "openid profile email",
        redirectPath: "slack-user"
      },
      singularity: {
        channelId: "C123456789A",
        mention: "@Singularity"
      },
      passTransition: {
        channelId: "C09NHJCMFC1",
        channelName: "#pass-transition",
        memberIds: ["U1234567890", "U2345678901"],
        membersSyncedAt: "2026-03-13T00:00:00.000Z"
      }
    }
  });
  assert.equal(imported && imported.ok, true);
  assert.equal(imported && imported.passTransition && imported.passTransition.channelId, "C09NHJCMFC1");
  assert.deepEqual(
    Array.from(imported && imported.passTransition && imported.passTransition.memberIds || []),
    ["U1234567890", "U2345678901"]
  );

  const stored = harness.storageDump();
  assert.equal(String(stored.zip_pass_transition_channel_id || ""), "C09NHJCMFC1");
  assert.equal(String(stored.zip_pass_transition_channel_name || ""), "#pass-transition");
  assert.equal(String(stored.zip_pass_transition_member_ids || ""), "U1234567890,U2345678901");
  assert.equal(String(stored.zip_pass_transition_members_synced_at || ""), "2026-03-13T00:00:00.000Z");

  harness.resetCalls();
  const members = await harness.sendRuntimeMessage({ type: "ZIP_GET_PASS_TRANSITION_MEMBERS" });
  assert.equal(members && members.ok, true);
  assert.equal(members && members.cached, true);
  assert.equal(members && members.hydrated, false);
  assert.deepEqual(Array.from(members && members.memberIds || []), ["U1234567890", "U2345678901"]);
  assert.equal(harness.calls.fetch.length, 0);
});

test("PASS-TRANSITION hydration falls back to bot token after channel_not_found on user token", async () => {
  const harness = createChromeHarness({
    zendeskTabs: [],
    storageSeed: {
      zip_slack_client_id: "pass-transition-client-id",
      zip_slack_client_secret: "pass-transition-client-secret",
      zip_slack_scope: "openid profile email",
      zip_slack_redirect_path: "slack-user",
      zip_slack_key_loaded: true,
      zip_slack_oauth_token: "SLK_TEST_PASS_TRANSITION_USER_TOKEN",
      zip_slack_bot_token: "SLK_TEST_PASS_TRANSITION_BOT_TOKEN",
      zip_singularity_channel_id: "C123456789A",
      zip_singularity_mention: "@Singularity",
      zip_pass_transition_channel_id: "C09NHJCMFC1",
      zip_pass_transition_channel_name: "#pass-transition"
    },
    fetch: ({ init }) => {
      const headers = init && init.headers && typeof init.headers === "object" ? init.headers : {};
      const authorization = String(headers.Authorization || headers.authorization || "");
      if (authorization === "Bearer SLK_TEST_PASS_TRANSITION_USER_TOKEN") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ok: false, error: "channel_not_found" }),
          text: async () => ""
        });
      }
      if (authorization === "Bearer SLK_TEST_PASS_TRANSITION_BOT_TOKEN") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ok: true, members: ["U1234567890", "U2345678901"] }),
          text: async () => ""
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ ok: false, error: "unexpected_request" }),
        text: async () => ""
      });
    }
  });

  harness.resetCalls();
  const members = await harness.sendRuntimeMessage({ type: "ZIP_GET_PASS_TRANSITION_MEMBERS" });
  assert.equal(members && members.ok, true);
  assert.equal(members && members.cached, false);
  assert.equal(members && members.hydrated, true);
  assert.equal(members && members.tokenKind, "bot");
  assert.deepEqual(Array.from(members && members.memberIds || []), ["U1234567890", "U2345678901"]);
  assert.equal(harness.calls.fetch.length >= 2, true);

  const stored = harness.storageDump();
  assert.equal(String(stored.zip_pass_transition_member_ids || ""), "U1234567890,U2345678901");
  assert.equal(typeof stored.zip_pass_transition_members_synced_at, "string");
  assert.notEqual(String(stored.zip_pass_transition_members_synced_at || ""), "");
});

test("PASS-TRANSITION recipients include the current Slack user and filter deleted and bot accounts", async () => {
  const harness = createChromeHarness({
    zendeskTabs: [],
    storageSeed: {
      zip_slack_client_id: "pass-transition-client-id",
      zip_slack_client_secret: "pass-transition-client-secret",
      zip_slack_scope: "openid profile email",
      zip_slack_redirect_path: "slack-user",
      zip_slack_key_loaded: true,
      zip_slack_oauth_token: "SLK_TEST_PASS_TRANSITION_USER_TOKEN",
      zip_singularity_channel_id: "C123456789A",
      zip_singularity_mention: "@Singularity",
      zip_pass_transition_channel_id: "C09NHJCMFC1",
      zip_pass_transition_channel_name: "#pass-transition",
      zip_pass_transition_member_ids: "U999999999,U222222222,U111111111,U333333333,U444444444",
      zip_pass_transition_members_synced_at: "2026-03-14T00:00:00.000Z",
      "zip.slack.openid.session.v1": {
        userId: "U999999999",
        userName: "Minnick Example",
        avatarUrl: "https://example.com/minnick.png"
      }
    },
    fetch: ({ url, init }) => {
      const headers = init && init.headers && typeof init.headers === "object" ? init.headers : {};
      const authorization = String(headers.Authorization || headers.authorization || "");
      const params = new URLSearchParams(String(init && init.body || ""));
      if (authorization !== "Bearer SLK_TEST_PASS_TRANSITION_USER_TOKEN") {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ ok: false, error: "invalid_auth" }),
          text: async () => ""
        });
      }
      if (url.endsWith("/api/auth.test")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ok: true, user_id: "U999999999", user: "minnick" }),
          text: async () => ""
        });
      }
      if (url.endsWith("/api/users.info")) {
        const userId = String(params.get("user") || "").trim().toUpperCase();
        const payloadByUserId = {
          U999999999: {
            ok: true,
            user: {
              id: "U999999999",
              name: "minnick",
              real_name: "Minnick Example",
              deleted: false,
              is_bot: false,
              is_app_user: false,
              profile: {
                display_name: "Minnick Example",
                real_name: "Minnick Example",
                email: "minnick@example.com",
                image_72: "https://example.com/minnick.png"
              }
            }
          },
          U111111111: {
            ok: true,
            user: {
              id: "U111111111",
              name: "alice",
              real_name: "Alice Example",
              deleted: false,
              is_bot: false,
              is_app_user: false,
              profile: {
                display_name: "Alice Example",
                real_name: "Alice Example",
                email: "alice@example.com",
                image_72: "https://example.com/alice.png"
              }
            }
          },
          U222222222: {
            ok: true,
            user: {
              id: "U222222222",
              name: "bob",
              real_name: "Bob Example",
              deleted: false,
              is_bot: false,
              is_app_user: false,
              profile: {
                display_name: "Bob Example",
                real_name: "Bob Example",
                email: "bob@example.com",
                image_72: "https://example.com/bob.png"
              }
            }
          },
          U333333333: {
            ok: true,
            user: {
              id: "U333333333",
              name: "deleted-user",
              real_name: "Deleted User",
              deleted: true,
              is_bot: false,
              is_app_user: false,
              profile: {
                display_name: "Deleted User",
                real_name: "Deleted User",
                email: "deleted@example.com"
              }
            }
          },
          U444444444: {
            ok: true,
            user: {
              id: "U444444444",
              name: "zip-bot",
              real_name: "ZIP Bot",
              deleted: false,
              is_bot: true,
              is_app_user: false,
              profile: {
                display_name: "ZIP Bot",
                real_name: "ZIP Bot",
                email: "zip-bot@example.com"
              }
            }
          }
        };
        const payload = payloadByUserId[userId] || { ok: false, error: "user_not_found" };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => payload,
          text: async () => ""
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ ok: false, error: "unexpected_request" }),
        text: async () => ""
      });
    }
  });

  harness.resetCalls();
  const recipients = await harness.sendRuntimeMessage({ type: "ZIP_GET_PASS_TRANSITION_RECIPIENTS" });
  assert.equal(recipients && recipients.ok, true);
  assert.equal(String(recipients && recipients.selfUserId || ""), "U999999999");
  assert.deepEqual(
    Array.from(recipients && recipients.members || []).map((entry) => entry.userId),
    ["U999999999", "U111111111", "U222222222"]
  );
  assert.deepEqual(
    Array.from(recipients && recipients.members || []).map((entry) => entry.label),
    ["Minnick Example (@minnick)", "Alice Example (@alice)", "Bob Example (@bob)"]
  );
  assert.equal(
    harness.calls.fetch.some((requestUrl) => String(requestUrl).includes("/api/users.profile.get")),
    false,
    "PASS-TRANSITION recipients should not fetch self profiles while resolving teammate identities"
  );
});

test("ZIP_SLACK_API_AUTH_TEST rejects a stored token when it belongs to a different Slack user", async () => {
  const harness = createChromeHarness({
    zendeskTabs: [],
    storageSeed: {
      zip_slack_oauth_token: "SLK_TEST_SHARED_USER_TOKEN",
      "zip.slack.openid.session.v1": {
        userId: "UALICE123",
        userName: "Alice Example",
        avatarUrl: "https://example.com/alice.png"
      }
    },
    fetch: ({ url, init }) => {
      const headers = init && init.headers && typeof init.headers === "object" ? init.headers : {};
      const authorization = String(headers.Authorization || headers.authorization || "");
      if (url.endsWith("/api/auth.test") && authorization === "Bearer SLK_TEST_SHARED_USER_TOKEN") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ok: true, user_id: "UMINNICK1", user: "minnick" }),
          text: async () => ""
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ ok: false, error: "unexpected_request" }),
        text: async () => ""
      });
    }
  });

  harness.resetCalls();
  const response = await harness.sendRuntimeMessage({
    type: "ZIP_SLACK_API_AUTH_TEST",
    workspaceOrigin: "https://adobedx.slack.com",
    expectedUserId: "UALICE123"
  });

  assert.equal(response && response.ok, false);
  assert.equal(String(response && response.code || ""), "slack_identity_mismatch");
  assert.match(String(response && response.error || ""), /active Slack user/i);
  assert.equal(
    harness.calls.fetch.filter((requestUrl) => String(requestUrl).includes("/api/auth.test")).length,
    1
  );
});

test("ZIP_SLACK_API_SEND_TO_USER refuses to post when the token author mismatches the active Slack user", async () => {
  const harness = createChromeHarness({
    zendeskTabs: [],
    fetch: ({ url, init }) => {
      const headers = init && init.headers && typeof init.headers === "object" ? init.headers : {};
      const authorization = String(headers.Authorization || headers.authorization || "");
      if (url.endsWith("/api/auth.test") && authorization === "Bearer SLK_TEST_SHARED_USER_TOKEN") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ok: true, user_id: "UMINNICK1", user: "minnick" }),
          text: async () => ""
        });
      }
      if (url.endsWith("/api/conversations.open") || url.endsWith("/api/chat.postMessage")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ok: true }),
          text: async () => ""
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ ok: false, error: "unexpected_request" }),
        text: async () => ""
      });
    }
  });

  harness.resetCalls();
  const response = await harness.sendRuntimeMessage({
    type: "ZIP_SLACK_API_SEND_TO_USER",
    workspaceOrigin: "https://adobedx.slack.com",
    userId: "UBOBUSER1",
    authorUserId: "UALICE123",
    markdownText: "handoff note",
    userToken: "SLK_TEST_SHARED_USER_TOKEN",
    botToken: "",
    autoBootstrapSlackTab: false,
    preferApiFirst: true,
    preferBotDmDelivery: false,
    requireBotDelivery: false,
    allowBotDelivery: false,
    skipUnreadMark: true,
    forceNewMessage: true
  });

  assert.equal(response && response.ok, false);
  assert.equal(String(response && response.code || ""), "slack_identity_mismatch");
  assert.equal(
    harness.calls.fetch.some((requestUrl) => String(requestUrl).includes("/api/conversations.open")),
    false,
    "mismatched token must not open a DM for the wrong author"
  );
  assert.equal(
    harness.calls.fetch.some((requestUrl) => String(requestUrl).includes("/api/chat.postMessage")),
    false,
    "mismatched token must not post a Slack message"
  );
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
      singularity: {
        channelId: "C123456789A",
        mention: "@Singularity"
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

test("ZIP_CONTEXT_MENU_ACTION getLatest opens commit-pinned ZIP URL when latest main SHA is available", async () => {
  const latestSha = "0123456789abcdef0123456789abcdef01234567";
  const harness = createChromeHarness({
    zendeskTabs: [],
    fetch: ({ url }) => {
      if (url.includes("/zip-chrome-extension/manifest.json")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ version: "99.88.77" }),
          text: async () => ""
        });
      }
      if (url.includes("/git/ref/heads/main")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ object: { sha: latestSha } }),
          text: async () => ""
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({}),
        text: async () => ""
      });
    }
  });
  harness.resetCalls();

  const response = await harness.sendRuntimeMessage({ type: "ZIP_CONTEXT_MENU_ACTION", action: "getLatest" });
  assert.equal(response && response.ok, true);
  assert.equal(String(response && response.latestCommitSha || ""), latestSha);
  assert.equal(response && response.downloadStarted, true);
  assert.equal(harness.calls.downloadsDownload.length, 1, "downloads API should start the ZIP package download");
  assert.equal(harness.calls.tabsCreate.length, 1, "chrome extensions tab should still be opened");
  const downloadUrl = String(harness.calls.downloadsDownload[0] && harness.calls.downloadsDownload[0].url || "");
  assert.match(
    downloadUrl,
    new RegExp("/" + latestSha + "/ziptool_distro\\.zip\\?cacheBust=\\d+$")
  );
  assert.equal(downloadUrl.includes("/main/ziptool_distro.zip"), false, "download URL should not use branch-pinned path");
  assert.match(String(harness.calls.downloadsDownload[0] && harness.calls.downloadsDownload[0].filename || ""), /^ZIP-v99\.88\.77-0123456\.zip$/);
  assert.equal(String(harness.calls.tabsCreate[0] && harness.calls.tabsCreate[0].url || ""), "chrome://extensions");
});

test("ZIP_CONTEXT_MENU_ACTION getLatest falls back to main ZIP URL with cache bust when SHA lookup fails", async () => {
  const harness = createChromeHarness({ zendeskTabs: [] });
  harness.resetCalls();

  const response = await harness.sendRuntimeMessage({ type: "ZIP_CONTEXT_MENU_ACTION", action: "getLatest" });
  assert.equal(response && response.ok, true);
  assert.equal(String(response && response.latestCommitSha || ""), "");
  assert.equal(response && response.downloadStarted, true);
  assert.equal(harness.calls.downloadsDownload.length, 1, "downloads API should still be attempted");
  assert.equal(harness.calls.tabsCreate.length, 1, "chrome extensions tab should still be opened");
  const downloadUrl = String(harness.calls.downloadsDownload[0] && harness.calls.downloadsDownload[0].url || "");
  assert.match(
    downloadUrl,
    /\/main\/ziptool_distro\.zip\?cacheBust=\d+$/
  );
  assert.match(String(harness.calls.downloadsDownload[0] && harness.calls.downloadsDownload[0].filename || ""), /^ZIP-vlatest\.zip$/);
  assert.equal(String(harness.calls.tabsCreate[0] && harness.calls.tabsCreate[0].url || ""), "chrome://extensions");
});

test("ZIP_CONTEXT_MENU_ACTION getLatest falls back to opening the package tab when downloads API fails", async () => {
  const latestSha = "fedcba9876543210fedcba9876543210fedcba98";
  const harness = createChromeHarness({
    zendeskTabs: [],
    downloadShouldFail: true,
    fetch: ({ url }) => {
      if (url.includes("/zip-chrome-extension/manifest.json")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ version: "8.8.8" }),
          text: async () => ""
        });
      }
      if (url.includes("/git/ref/heads/main")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ object: { sha: latestSha } }),
          text: async () => ""
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({}),
        text: async () => ""
      });
    }
  });
  harness.resetCalls();

  const response = await harness.sendRuntimeMessage({ type: "ZIP_CONTEXT_MENU_ACTION", action: "getLatest" });
  assert.equal(response && response.ok, true);
  assert.equal(response && response.downloadStarted, false);
  assert.equal(response && response.downloadTabOpened, true);
  assert.equal(harness.calls.downloadsDownload.length, 1, "downloads API should still be attempted");
  assert.equal(harness.calls.tabsCreate.length, 2, "package tab fallback and chrome extensions tab should both be opened");
  const downloadUrl = String(harness.calls.tabsCreate[0] && harness.calls.tabsCreate[0].url || "");
  assert.match(
    downloadUrl,
    new RegExp("/" + latestSha + "/ziptool_distro\\.zip\\?cacheBust=\\d+$")
  );
  assert.equal(String(harness.calls.tabsCreate[1] && harness.calls.tabsCreate[1].url || ""), "chrome://extensions");
});

test("automatic Slack token invalidation does not remove persisted Slack session token storage keys", () => {
  const source = fs.readFileSync(BACKGROUND_PATH, "utf8");
  const fnMatch = source.match(/async function invalidateStoredSlackToken\(token\)\s*\{[\s\S]*?\n\}/);
  assert.ok(fnMatch, "invalidateStoredSlackToken function not found");
  const body = fnMatch[0];
  assert.match(body, /Persisted Slack session tokens are never auto-removed/);
  assert.doesNotMatch(body, /zip\.passAi/);
  assert.doesNotMatch(body, /ZIP_SLACK_LEGACY_USER_TOKEN_STORAGE_KEY/);
  assert.doesNotMatch(body, /ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY/);
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
  const optionsSource = fs.readFileSync(OPTIONS_PATH, "utf8");
  const html = fs.readFileSync(path.join(ROOT, "sidepanel.html"), "utf8");
  assert.match(source, /const ZIP_KEY_FILE_PREFIX = "ZIPKEY1:";/);
  assert.match(source, /const ZIP_CONFIG_META_STORAGE_KEY = "zip\.config\.meta\.v1";/);
  assert.match(source, /const ZIP_SLACKTIVATION_SERVICE_KEY = "slacktivation";/);
  assert.match(source, /"slacktivation\.client_id"/);
  assert.match(source, /"slacktivation\.client_secret"/);
  assert.doesNotMatch(source, /"slacktivation\.user_token"/);
  assert.doesNotMatch(optionsSource, /"slacktivation\.user_token"/);
  assert.match(source, /"slacktivation\.singularity_channel_id"/);
  assert.match(source, /"slacktivation\.singularity_mention"/);
  assert.match(source, /function parseZipKeyPayload\(rawText\)/);
  assert.match(source, /function importZipKeyFromFile\(file\)/);
  assert.match(source, /const gateStatus = enforceZipConfigGate\(\{ reportStatus: true \}\);/);
  assert.match(source, /msg\.type === "ZIP_KEY_CLEARED"/);
  assert.match(source, /Please drop an updated ZIP\.KEY to SLACKTIVATE ZIP\./);
  assert.match(source, /Please drop ZIP\.KEY to SLACKTIVATE ZIP\./);
  assert.match(source, /DROP ZIP\.KEY TO SLACKTIVATE/);
  assert.match(html, /Please drop ZIP\.KEY to SLACKTIVATE/);
  assert.match(html, /DROP ZIP\.KEY TO SLACKTIVATE/);
  assert.doesNotMatch(source, /ZIP\.KEY cleared\. Drop the latest ZIP\.KEY file to continue\./);
  assert.doesNotMatch(source, /Supports ZIPKEY1 files \(JSON or KEY=VALUE\)\./);
  assert.doesNotMatch(html, /Supports ZIPKEY1 files\./);
});

test("sidepanel ZIP.KEY persistence keeps optional bot config and strips user-scoped auth", () => {
  const source = fs.readFileSync(SIDEPANEL_PATH, "utf8");
  assert.match(source, /const normalizedBotToken = normalizePassAiSlackApiToken\(normalized\.api && normalized\.api\.botToken\);/);
  assert.doesNotMatch(source, /const normalizedUserToken = normalizePassAiSlackApiToken\(normalized\.api && normalized\.api\.userToken\);/);
  assert.match(source, /api:\s*\{[\s\S]*botToken:\s*normalizedBotToken[\s\S]*\}/);
});

test("sidepanel Clear ZIP.KEY action requires explicit user confirmation", () => {
  const source = fs.readFileSync(SIDEPANEL_PATH, "utf8");
  assert.match(source, /const ZIP_CLEAR_KEY_CONFIRMATION_MESSAGE = "Clear ZIP\.KEY and reset ZIP now\?/);
  assert.match(source, /action === "clearZipKey" && !requestZipKeyClearConfirmation\(\)/);
  assert.match(source, /window\.confirm\(ZIP_CLEAR_KEY_CONFIRMATION_MESSAGE\)/);
});

test("options Clear ZIP.KEY action requires explicit user confirmation", () => {
  const source = fs.readFileSync(OPTIONS_PATH, "utf8");
  assert.match(source, /const ZIP_CLEAR_KEY_CONFIRMATION_MESSAGE = "Clear ZIP\.KEY and reset ZIP now\?/);
  assert.match(source, /window\.confirm\(ZIP_CLEAR_KEY_CONFIRMATION_MESSAGE\)/);
  assert.match(source, /setStatus\("Clear ZIP\.KEY canceled\."\)/);
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

test("sendToZendeskTab retry path is isolated from Slack worker-tab state", () => {
  const source = fs.readFileSync(SIDEPANEL_PATH, "utf8");
  const sendToZendeskTabMatch = source.match(/function sendToZendeskTab\(inner\)\s*\{[\s\S]*?\n  \}/);
  assert.ok(sendToZendeskTabMatch, "sendToZendeskTab function not found");
  const sendToZendeskTabBody = sendToZendeskTabMatch[0];
  assert.doesNotMatch(sendToZendeskTabBody, /isTrackedSlackWorkerTabId/);
  assert.doesNotMatch(sendToZendeskTabBody, /clearTrackedSlackWorkerTabReference/);
  assert.doesNotMatch(sendToZendeskTabBody, /numericTabId/);
});

test("refreshAll uses single-flight protection to prevent overlapping catalog loads", () => {
  const source = fs.readFileSync(SIDEPANEL_PATH, "utf8");
  const refreshAllMatch = source.match(/async function refreshAll\(\)\s*\{[\s\S]*?\n  \}/);
  assert.ok(refreshAllMatch, "refreshAll function not found");
  const refreshAllBody = refreshAllMatch[0];
  assert.match(refreshAllBody, /if \(refreshAllInFlight\) return refreshAllInFlight;/);
  assert.match(refreshAllBody, /refreshAllInFlight = \(async \(\) => \{/);
  assert.match(refreshAllBody, /return await refreshAllInFlight;/);
  assert.match(refreshAllBody, /refreshAllInFlight = null;/);
});

test("content script supports authoritative session probe and logout/session events", () => {
  const source = fs.readFileSync(CONTENT_PATH, "utf8");
  assert.match(source, /type === "ZIP_SESSION_PROBE"/);
  assert.match(source, /type:\s*"ZD_SESSION_OK"/);
  assert.match(source, /type:\s*"ZD_LOGOUT"/);
  assert.match(source, /probeZendeskSession\(\{\s*reason:\s*"auth_page_bootstrap"\s*\}\)/);
  assert.match(source, /emitZendeskLogout\("auth_page_probe_failed",\s*401\)/);
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

  harness.resetCalls();
  const untrustedLogout = await harness.sendRuntimeMessage(
    { type: "ZD_LOGOUT", status: 401, reason: "test_logout" },
    { url: "https://example.com/logout" }
  );
  assert.equal(untrustedLogout && untrustedLogout.ok, false);
  assert.equal(
    harness.calls.runtimeSendMessage.some((entry) => entry && entry.type === "LOGGED_OUT"),
    false,
    "untrusted logout sender must not mutate auth state"
  );

  harness.resetCalls();
  const trustedLogout = await harness.sendRuntimeMessage(
    { type: "ZD_LOGOUT", status: 401, reason: "test_logout" },
    { url: ZENDESK_DASHBOARD_URL }
  );
  assert.equal(trustedLogout && trustedLogout.ok, true);
  assert.equal(
    harness.calls.runtimeSendMessage.some((entry) => entry && entry.type === "LOGGED_OUT"),
    true,
    "trusted Zendesk logout sender should update auth state"
  );

  harness.resetCalls();
  const trustedLogoutByDocumentUrl = await harness.sendRuntimeMessage(
    { type: "ZD_LOGOUT", status: 401, reason: "tab_lookup_logout" },
    { documentUrl: ZENDESK_DASHBOARD_URL }
  );
  assert.equal(trustedLogoutByDocumentUrl && trustedLogoutByDocumentUrl.ok, true);
  assert.equal(
    harness.calls.runtimeSendMessage.some((entry) => entry && entry.type === "LOGGED_OUT"),
    true,
    "trusted Zendesk documentUrl sender should pass when sender URL is unavailable"
  );

  harness.resetCalls();
  const untrustedLogoutByDocumentUrl = await harness.sendRuntimeMessage(
    { type: "ZD_LOGOUT", status: 401, reason: "tab_lookup_logout" },
    { documentUrl: "https://example.com/logout" }
  );
  assert.equal(untrustedLogoutByDocumentUrl && untrustedLogoutByDocumentUrl.ok, false);
  assert.equal(
    harness.calls.runtimeSendMessage.some((entry) => entry && entry.type === "LOGGED_OUT"),
    false,
    "non-Zendesk documentUrl sender must remain blocked"
  );
});
