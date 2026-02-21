const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const BACKGROUND_PATH = path.join(ROOT, "background.js");
const ZENDESK_DASHBOARD_URL = "https://adobeprimetime.zendesk.com/agent/dashboard?brand_id=2379046";
const ZENDESK_LOGIN_WITH_RETURN_URL = "https://adobeprimetime.zendesk.com/access/login?return_to="
  + encodeURIComponent(ZENDESK_DASHBOARD_URL);

async function loadPlaywrightOrSkip(t) {
  try {
    return await import("playwright");
  } catch (err) {
    t.skip("Playwright package is not installed in this environment.");
    return null;
  }
}

function buildBrowserHarnessBootstrap() {
  return `
    (() => {
      const mutable = { zendeskTabs: [] };
      const calls = {
        runtimeSendMessage: [],
        tabsQuery: [],
        tabsUpdate: [],
        tabsCreate: [],
        tabsSendMessage: [],
        windowsUpdate: [],
        windowsCreate: [],
        windowsRemove: [],
        fetch: [],
        storageGet: [],
        storageSet: [],
        storageRemove: []
      };
      const listeners = { runtimeOnMessage: null };
      const storage = Object.create(null);

      function clone(value) {
        return JSON.parse(JSON.stringify(value));
      }

      function resultOrCallback(value, callback) {
        if (typeof callback === "function") {
          callback(value);
          return undefined;
        }
        return Promise.resolve(value);
      }

      const storageLocal = {
        get(keys, callback) {
          calls.storageGet.push(keys == null ? null : clone(keys));
          let out = {};
          if (Array.isArray(keys)) {
            keys.forEach((key) => {
              if (Object.prototype.hasOwnProperty.call(storage, key)) out[key] = storage[key];
            });
          } else if (typeof keys === "string") {
            if (Object.prototype.hasOwnProperty.call(storage, keys)) out[keys] = storage[keys];
          } else if (keys && typeof keys === "object") {
            out = { ...keys };
            Object.keys(keys).forEach((key) => {
              if (Object.prototype.hasOwnProperty.call(storage, key)) out[key] = storage[key];
            });
          } else {
            out = { ...storage };
          }
          return resultOrCallback(out, callback);
        },
        set(values, callback) {
          calls.storageSet.push(values && typeof values === "object" ? clone(values) : {});
          if (values && typeof values === "object") {
            Object.assign(storage, values);
          }
          return resultOrCallback(undefined, callback);
        },
        remove(keys, callback) {
          const list = Array.isArray(keys) ? keys.slice() : [keys];
          calls.storageRemove.push(list.slice());
          list.forEach((key) => {
            delete storage[key];
          });
          return resultOrCallback(undefined, callback);
        }
      };

      const chrome = {
        runtime: {
          lastError: null,
          getManifest() {
            return { version: "0.0.0-test", name: "ZIP", commands: {} };
          },
          sendMessage(message, callback) {
            calls.runtimeSendMessage.push(clone(message));
            if (typeof callback === "function") callback();
            return Promise.resolve();
          },
          onMessage: {
            addListener(listener) {
              listeners.runtimeOnMessage = listener;
            }
          },
          onInstalled: { addListener() {} },
          onStartup: { addListener() {} }
        },
        tabs: {
          query(queryInfo, callback) {
            calls.tabsQuery.push(queryInfo && typeof queryInfo === "object" ? clone(queryInfo) : {});
            const pattern = String(queryInfo && queryInfo.url ? queryInfo.url : "");
            const rows = pattern.includes("zendesk.com") ? mutable.zendeskTabs.slice() : [];
            return resultOrCallback(rows, callback);
          },
          update(tabId, updateInfo, callback) {
            calls.tabsUpdate.push({ tabId, updateInfo: clone(updateInfo || {}) });
            return resultOrCallback({ id: tabId, windowId: 111 }, callback);
          },
          create(createInfo, callback) {
            calls.tabsCreate.push(clone(createInfo || {}));
            return resultOrCallback({
              id: 222,
              windowId: 333,
              url: createInfo && createInfo.url ? createInfo.url : ""
            }, callback);
          },
          get(tabId, callback) {
            return resultOrCallback({ id: tabId, url: "", windowId: 111 }, callback);
          },
          sendMessage(tabId, message, callback) {
            calls.tabsSendMessage.push({ tabId, message: clone(message || {}) });
            return resultOrCallback({ ok: false, status: 0, payload: null }, callback);
          },
          onUpdated: { addListener() {} },
          onActivated: { addListener() {} }
        },
        windows: {
          update(windowId, updateInfo, callback) {
            calls.windowsUpdate.push({ windowId, updateInfo: clone(updateInfo || {}) });
            return resultOrCallback({ id: windowId }, callback);
          },
          create(createInfo, callback) {
            calls.windowsCreate.push(clone(createInfo || {}));
            return resultOrCallback({ id: 444, tabs: [{ id: 445, windowId: 444 }] }, callback);
          },
          remove(windowId, callback) {
            calls.windowsRemove.push({ windowId });
            return resultOrCallback(undefined, callback);
          }
        },
        contextMenus: {
          create() {},
          update() {},
          removeAll(callback) {
            if (typeof callback === "function") callback();
          },
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
        storage: { local: storageLocal }
      };

      const originalFetch = window.fetch.bind(window);
      window.fetch = (url) => {
        calls.fetch.push(String(url || ""));
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({}),
          text: async () => ""
        });
      };

      window.chrome = chrome;
      window.__zipPlaywrightHarness = {
        mutable,
        resetCalls() {
          Object.keys(calls).forEach((key) => {
            if (Array.isArray(calls[key])) calls[key].length = 0;
          });
        },
        callsSnapshot() {
          return clone(calls);
        },
        async sendRuntimeMessage(message) {
          return await new Promise((resolve) => {
            const listener = listeners.runtimeOnMessage;
            if (!listener) {
              resolve(null);
              return;
            }
            let settled = false;
            const done = (response) => {
              if (settled) return;
              settled = true;
              resolve(response == null ? null : response);
            };
            const maybeAsync = listener(message, {}, done);
            if (maybeAsync !== true) done(null);
            setTimeout(() => done(null), 0);
          });
        },
        restoreFetch() {
          window.fetch = originalFetch;
        }
      };
    })();
  `;
}

test("Playwright smoke: LOGIN_CLICKED does not create popup windows", async (t) => {
  const playwright = await loadPlaywrightOrSkip(t);
  if (!playwright) return;

  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });
  } catch (err) {
    t.skip("Chromium failed to launch for Playwright smoke test: " + (err && err.message ? err.message : "unknown error"));
    return;
  }

  t.after(async () => {
    try {
      await browser.close();
    } catch (_) {}
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  const backgroundSource = fs.readFileSync(BACKGROUND_PATH, "utf8");

  await page.goto("about:blank");
  await page.addScriptTag({ content: buildBrowserHarnessBootstrap() });
  await page.addScriptTag({ content: backgroundSource });

  const listenerInstalled = await page.evaluate(() => {
    return !!(window.__zipPlaywrightHarness && window.__zipPlaywrightHarness.sendRuntimeMessage);
  });
  assert.equal(listenerInstalled, true, "background runtime message listener should be installed");

  // Scenario 1: existing Zendesk tab should be focused (no popup create).
  await page.evaluate(() => {
    window.__zipPlaywrightHarness.resetCalls();
    window.__zipPlaywrightHarness.mutable.zendeskTabs = [
      { id: 701, windowId: 88, active: true, highlighted: true, url: "https://adobeprimetime.zendesk.com/agent/dashboard?brand_id=2379046" }
    ];
  });
  const existingTabResponse = await page.evaluate(async () => {
    return await window.__zipPlaywrightHarness.sendRuntimeMessage({ type: "LOGIN_CLICKED" });
  });
  const existingTabCalls = await page.evaluate(() => window.__zipPlaywrightHarness.callsSnapshot());
  assert.equal(existingTabResponse && existingTabResponse.ok, true);
  assert.equal(existingTabCalls.tabsUpdate.length, 1, "expected existing Zendesk tab to be focused");
  assert.equal(
    String(existingTabCalls.tabsUpdate[0] && existingTabCalls.tabsUpdate[0].updateInfo && existingTabCalls.tabsUpdate[0].updateInfo.url || ""),
    ZENDESK_LOGIN_WITH_RETURN_URL,
    "existing Zendesk tab should navigate to login with encoded dashboard return URL"
  );
  assert.equal(existingTabCalls.windowsUpdate.length, 1, "expected existing Zendesk window to be focused");
  assert.equal(existingTabCalls.tabsCreate.length, 0, "should not create new tab when Zendesk tab exists");
  assert.equal(existingTabCalls.windowsCreate.length, 0, "must never create popup windows for Zendesk login");

  // Scenario 2: no Zendesk tab should open normal tab (still no popup create).
  await page.evaluate(() => {
    window.__zipPlaywrightHarness.resetCalls();
    window.__zipPlaywrightHarness.mutable.zendeskTabs = [];
  });
  const createTabResponse = await page.evaluate(async () => {
    return await window.__zipPlaywrightHarness.sendRuntimeMessage({ type: "LOGIN_CLICKED" });
  });
  const createTabCalls = await page.evaluate(() => window.__zipPlaywrightHarness.callsSnapshot());
  assert.equal(createTabResponse && createTabResponse.ok, true);
  assert.equal(createTabCalls.tabsCreate.length, 1, "expected a normal Zendesk tab create when none exists");
  assert.equal(createTabCalls.windowsCreate.length, 0, "must never create popup windows for Zendesk login");
  assert.equal(String(createTabCalls.tabsCreate[0].url || ""), ZENDESK_LOGIN_WITH_RETURN_URL);
});
