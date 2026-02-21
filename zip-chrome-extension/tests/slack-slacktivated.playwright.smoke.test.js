const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SIDEPANEL_HTML_PATH = path.join(ROOT, "sidepanel.html");
const SIDEPANEL_JS_PATH = path.join(ROOT, "sidepanel.js");
const PATHS_JS_PATH = path.join(ROOT, "paths.js");
const THEME_PALETTE_DATA_PATH = path.join(ROOT, "theme-palette-data.js");

const SIDEPANEL_HTML_STRIPPED = stripScriptTags(fs.readFileSync(SIDEPANEL_HTML_PATH, "utf8"));
const SIDEPANEL_JS_SOURCE = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
const PATHS_JS_SOURCE = fs.readFileSync(PATHS_JS_PATH, "utf8");
const THEME_PALETTE_SOURCE = fs.readFileSync(THEME_PALETTE_DATA_PATH, "utf8");

async function loadPlaywrightOrSkip(t) {
  try {
    return await import("playwright");
  } catch (_) {
    t.skip("Playwright package is not installed in this environment.");
    return null;
  }
}

function stripScriptTags(html) {
  return String(html || "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

function buildSidepanelHarnessBootstrap(options) {
  const defaults = {
    openIdStatusOk: true,
    silentAuthOk: false,
    interactiveAuthOk: false,
    slackTabs: [],
    activeTabSlack: false
  };
  const scenario = { ...defaults, ...(options && typeof options === "object" ? options : {}) };

  return `
    (() => {
      const scenario = ${JSON.stringify(scenario)};
      let nextTabId = 9000;
      const calls = {
        runtimeSendMessage: [],
        tabsQuery: [],
        tabsCreate: [],
        tabsUpdate: [],
        windowsCreate: [],
        windowsUpdate: []
      };
      const listeners = {
        runtimeOnMessage: null
      };
      const storage = Object.create(null);
      const mutable = {
        zendeskTabs: [
          {
            id: 4242,
            windowId: 50,
            active: true,
            highlighted: true,
            url: "https://adobeprimetime.zendesk.com/agent/dashboard"
          }
        ],
        slackTabs: Array.isArray(scenario.slackTabs) ? scenario.slackTabs.slice() : []
      };

      function clone(value) {
        return JSON.parse(JSON.stringify(value));
      }

      function asyncCallback(callback, payload) {
        if (typeof callback !== "function") return;
        setTimeout(() => callback(payload), 0);
      }

      function normalizeSlackTab(tab, idx) {
        const id = Number(tab && tab.id);
        const windowId = Number(tab && tab.windowId);
        return {
          id: Number.isFinite(id) && id > 0 ? id : (7100 + idx),
          windowId: Number.isFinite(windowId) && windowId > 0 ? windowId : 77,
          active: !!(tab && tab.active),
          highlighted: !!(tab && tab.highlighted),
          url: String((tab && tab.url) || "https://adobedx.slack.com/")
        };
      }

      mutable.slackTabs = mutable.slackTabs.map((tab, idx) => normalizeSlackTab(tab, idx));

      function openIdPayload() {
        return {
          ok: true,
          mode: "openid",
          user_id: "U123TEST",
          user_name: "Eric Minnick",
          avatar_url: "https://avatars.slack-edge.com/2024-01-01/123_abc_192.png",
          team_id: "TMOCKZIP"
        };
      }

      function zendeskMeResult() {
        const user = {
          id: 1001,
          name: "Test Agent",
          email: "agent@example.com",
          default_group_id: 1,
          organization_id: 1
        };
        return { user, payload: { user } };
      }

      function zendeskTicketsResult() {
        return {
          tickets: [
            {
              id: 51361,
              subject: "TempPass Entitlement Scoping",
              status: "pending",
              priority: "normal",
              created_at: "2026-02-20T00:00:00Z",
              updated_at: "2026-02-20T00:00:00Z"
            }
          ]
        };
      }

      function runtimeResponse(message) {
        const type = String(message && message.type || "");
        if (type === "ZIP_GET_THEME") return { themeId: "s2-dark-azure-blue", options: [] };
        if (type === "ZIP_SET_THEME") return { ok: true, themeId: String(message.themeId || "s2-dark-azure-blue"), options: [] };
        if (type === "ZIP_GET_SIDEPANEL_CONTEXT") return { layout: "right", capabilities: { setLayout: true, setSide: false } };
        if (type === "ZIP_GET_UPDATE_STATE") return { updateAvailable: false };
        if (type === "ZIP_GET_AUTH_STATE") return { loggedIn: true };
        if (type === "ZIP_FORCE_CHECK") return { ok: true, payload: { loggedIn: true } };
        if (type === "ZIP_GET_ACTIVE_TAB") return { tabId: 4242 };
        if (type === "ZIP_GET_SLACK_TAB") {
          const first = mutable.slackTabs[0];
          return { tabId: first && first.id != null ? first.id : null };
        }
        if (type === "ZIP_ENSURE_ASSIGNED_FILTER_TAB") return { ok: true, tabId: 4242, navigated: false };
        if (type === "ZIP_SLACK_OPENID_STATUS") {
          return scenario.openIdStatusOk ? openIdPayload() : { ok: false, error: "No cached Slack OpenID session." };
        }
        if (type === "ZIP_SLACK_OPENID_AUTH") {
          const interactive = !(message && message.interactive === false);
          const ok = interactive ? !!scenario.interactiveAuthOk : !!scenario.silentAuthOk;
          return ok ? openIdPayload() : {
            ok: false,
            error: interactive ? "auth_flow_failed" : "interaction_required"
          };
        }
        if (type === "ZIP_REQUEST") {
          const inner = message && message.inner && typeof message.inner === "object" ? message.inner : {};
          const action = String(inner.action || "");
          if (action === "getMe") return { result: zendeskMeResult() };
          if (action === "loadTickets") return { result: zendeskTicketsResult() };
          if (action === "loadOrganizations") return { result: { organizations: [] } };
          if (action === "loadViews") return { result: { views: [] } };
          if (action === "loadAllGroupsWithMembers") return { result: { groupsWithMembers: [] } };
          if (action === "loadOrganizationCount") return { result: { count: 0 } };
          if (action === "loadViewCount") return { result: { count: 0 } };
          if (action === "loadGroupTicketCount") return { result: { count: 0 } };
          if (action === "loadAssigneeTicketCount") return { result: { count: 0 } };
          if (action === "fetch") return { result: { ok: true, status: 200, payload: {} } };
          return { result: {} };
        }
        return {};
      }

      const storageLocal = {
        get(keys, callback) {
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
          asyncCallback(callback, out);
          return Promise.resolve(out);
        },
        set(values, callback) {
          if (values && typeof values === "object") Object.assign(storage, values);
          asyncCallback(callback, undefined);
          return Promise.resolve();
        },
        remove(keys, callback) {
          const rows = Array.isArray(keys) ? keys : [keys];
          rows.forEach((key) => delete storage[key]);
          asyncCallback(callback, undefined);
          return Promise.resolve();
        }
      };

      const seededMeta = {
        services: ["slacktivation"],
        importedAt: new Date().toISOString(),
        source: "test"
      };
      Object.assign(storage, {
        zip_slack_client_id: "mock.client.id",
        zip_slack_client_secret: "mock.client.secret",
        zip_slack_oauth_token: "xoxp-mock-user-token",
        zip_slack_scope: "openid profile email",
        zip_slack_redirect_path: "slack-user",
        zip_slack_redirect_uri: "https://hiecfnklcdpmkadljghekolopidedllo.chromiumapp.org/slack-user",
        zip_slack_key_loaded: true,
        zip_slack_key_meta: seededMeta
      });

      window.ZIP_PASS_AI_SLACK_OIDC_CLIENT_ID = "mock.client.id";
      window.ZIP_PASS_AI_SLACK_OIDC_CLIENT_SECRET = "mock.client.secret";
      window.ZIP_PASS_AI_SLACK_OIDC_SCOPE = "openid profile email";
      window.ZIP_PASS_AI_SLACK_OIDC_REDIRECT_PATH = "slack-user";
      window.ZIP_PASS_AI_EXPECTED_SLACK_TEAM_ID = "";
      window.ZIP_CONFIG_META = seededMeta;
      try {
        window.localStorage.setItem("zip.config.meta.v1", JSON.stringify({
          services: ["slacktivation"],
          importedAt: new Date().toISOString(),
          source: "test"
        }));
      } catch (_) {}

      window.chrome = {
        runtime: {
          lastError: null,
          getManifest() {
            return {
              version: "0.0.0-test",
              name: "ZIP",
              description: "ZIP test harness"
            };
          },
          sendMessage(message, callback) {
            calls.runtimeSendMessage.push(clone(message));
            const response = runtimeResponse(message || {});
            asyncCallback(callback, response);
            return Promise.resolve(response);
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
            calls.tabsQuery.push(clone(queryInfo || {}));
            if (queryInfo && queryInfo.active && queryInfo.currentWindow) {
              const active = scenario.activeTabSlack && mutable.slackTabs.length
                ? { ...mutable.slackTabs[0], active: true, highlighted: true }
                : { ...mutable.zendeskTabs[0], active: true, highlighted: true };
              const payload = active ? [active] : [];
              asyncCallback(callback, payload);
              return Promise.resolve(payload);
            }
            const pattern = String(queryInfo && queryInfo.url ? queryInfo.url : "");
            if (pattern.includes("slack.com")) {
              const payload = mutable.slackTabs.map((tab) => ({ ...tab }));
              asyncCallback(callback, payload);
              return Promise.resolve(payload);
            }
            if (pattern.includes("zendesk.com")) {
              const payload = mutable.zendeskTabs.map((tab) => ({ ...tab }));
              asyncCallback(callback, payload);
              return Promise.resolve(payload);
            }
            asyncCallback(callback, []);
            return Promise.resolve([]);
          },
          create(createInfo, callback) {
            calls.tabsCreate.push(clone(createInfo || {}));
            const url = String((createInfo && createInfo.url) || "");
            const payload = {
              id: ++nextTabId,
              windowId: 77,
              active: !!(createInfo && createInfo.active),
              highlighted: !!(createInfo && createInfo.active),
              url
            };
            if (url.includes("slack.com")) {
              mutable.slackTabs = [payload, ...mutable.slackTabs];
            }
            asyncCallback(callback, payload);
            return Promise.resolve(payload);
          },
          update(tabId, updateInfo, callback) {
            calls.tabsUpdate.push({ tabId, updateInfo: clone(updateInfo || {}) });
            const normalizedTabId = Number(tabId);
            const url = String(updateInfo && updateInfo.url || "");
            mutable.slackTabs = mutable.slackTabs.map((tab) => {
              if (tab.id !== normalizedTabId) return tab;
              const next = { ...tab };
              if (url) next.url = url;
              if (updateInfo && Object.prototype.hasOwnProperty.call(updateInfo, "active")) {
                next.active = !!updateInfo.active;
                next.highlighted = !!updateInfo.active;
              }
              return next;
            });
            const tab = mutable.slackTabs.find((row) => row.id === normalizedTabId);
            const payload = tab ? { ...tab } : { id: normalizedTabId, windowId: 77 };
            asyncCallback(callback, payload);
            return Promise.resolve(payload);
          },
          remove(_tabId, callback) {
            asyncCallback(callback, undefined);
            return Promise.resolve();
          },
          onUpdated: { addListener() {} },
          onActivated: { addListener() {} }
        },
        windows: {
          create(createInfo, callback) {
            calls.windowsCreate.push(clone(createInfo || {}));
            const payload = { id: 98, tabs: [{ id: 99, windowId: 98 }] };
            asyncCallback(callback, payload);
            return Promise.resolve(payload);
          },
          update(windowId, updateInfo, callback) {
            calls.windowsUpdate.push({ windowId, updateInfo: clone(updateInfo || {}) });
            const payload = { id: windowId };
            asyncCallback(callback, payload);
            return Promise.resolve(payload);
          },
          remove(_windowId, callback) {
            asyncCallback(callback, undefined);
            return Promise.resolve();
          }
        },
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
        contextMenus: {
          create() {},
          update() {},
          removeAll(callback) { asyncCallback(callback, undefined); },
          onClicked: { addListener() {} }
        },
        commands: { onCommand: { addListener() {} } },
        action: { onClicked: { addListener() {} } },
        identity: {
          getRedirectURL(pathName) {
            return "https://example.invalid/" + String(pathName || "");
          },
          launchWebAuthFlow(details, callback) {
            asyncCallback(callback, details && details.url ? String(details.url) : "");
          }
        },
        storage: { local: storageLocal }
      };

      window.__zipSidepanelHarness = {
        getCalls() {
          return clone(calls);
        },
        getMessageTypes() {
          return calls.runtimeSendMessage.map((row) => String(row && row.type || ""));
        },
        getOpenIdAuthCalls() {
          return calls.runtimeSendMessage
            .filter((row) => String(row && row.type || "") === "ZIP_SLACK_OPENID_AUTH")
            .map((row) => clone(row));
        },
        hasRuntimeListener() {
          return typeof listeners.runtimeOnMessage === "function";
        }
      };
    })();
  `;
}

async function bootSidepanelForScenario(page, scenario) {
  const pageErrors = [];
  const consoleErrors = [];
  const onPageError = (err) => {
    pageErrors.push(String((err && err.message) || err || ""));
  };
  const onConsole = (msg) => {
    if (!msg || typeof msg.type !== "function") return;
    if (msg.type() !== "error") return;
    consoleErrors.push(String(msg.text ? msg.text() : ""));
  };
  page.on("pageerror", onPageError);
  page.on("console", onConsole);

  await page.goto("about:blank");
  await page.setContent(SIDEPANEL_HTML_STRIPPED, { waitUntil: "domcontentloaded" });
  await page.addScriptTag({ content: buildSidepanelHarnessBootstrap(scenario) });
  await page.addScriptTag({ content: PATHS_JS_SOURCE });
  await page.addScriptTag({ content: THEME_PALETTE_SOURCE });
  await page.addScriptTag({ content: SIDEPANEL_JS_SOURCE });
  try {
    await page.waitForFunction(() => {
      return !!(window.__zipSidepanelHarness && window.__zipSidepanelHarness.hasRuntimeListener());
    }, { timeout: 5000 });

    await page.waitForFunction(() => {
      const appScreen = document.getElementById("zipAppScreen");
      const slackBtn = document.getElementById("zipSlacktivatedBtn");
      return !!(appScreen && !appScreen.classList.contains("hidden") && slackBtn);
    }, { timeout: 10000 });
  } catch (err) {
    const debugSnapshot = await page.evaluate(() => {
      const loginScreen = document.getElementById("zipLoginScreen");
      const appScreen = document.getElementById("zipAppScreen");
      const harness = window.__zipSidepanelHarness || null;
      return {
        hasChrome: !!window.chrome,
        hasRuntime: !!(window.chrome && window.chrome.runtime),
        hasHarness: !!harness,
        hasRuntimeListener: !!(harness && harness.hasRuntimeListener && harness.hasRuntimeListener()),
        loginHidden: !!(loginScreen && loginScreen.classList.contains("hidden")),
        appHidden: !!(appScreen && appScreen.classList.contains("hidden"))
      };
    }).catch(() => null);
    const detail = {
      pageErrors,
      consoleErrors,
      debugSnapshot
    };
    const msg = (err && err.message ? err.message : "Sidepanel bootstrap failed")
      + "\nDiagnostics: "
      + JSON.stringify(detail);
    throw new Error(msg);
  } finally {
    page.off("pageerror", onPageError);
    page.off("console", onConsole);
  }
}

async function readSlackUiReport(page) {
  return await page.evaluate(() => {
    const harness = window.__zipSidepanelHarness;
    const calls = harness ? harness.getCalls() : null;
    const messageTypes = harness ? harness.getMessageTypes() : [];
    const openIdAuthCalls = harness ? harness.getOpenIdAuthCalls() : [];
    const slackBtn = document.getElementById("zipSlacktivatedBtn");
    const slackToMe = document.getElementById("zipSlackItToMeBtn");
    return {
      calls,
      messageTypes,
      openIdAuthCalls,
      slackTitle: slackBtn ? String(slackBtn.getAttribute("title") || "") : "",
      slackClass: slackBtn ? String(slackBtn.className || "") : "",
      slackToMeDisabled: !!(slackToMe && slackToMe.disabled)
    };
  });
}

async function clickSlacktivatedButton(page) {
  await page.evaluate(() => {
    const btn = document.getElementById("zipSlacktivatedBtn");
    if (btn) btn.click();
  });
}

test("Playwright smoke: existing Slack session SLACKTIVATES sidepanel without opening extra Slack tabs", async (t) => {
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

  await bootSidepanelForScenario(page, {
    openIdStatusOk: true,
    silentAuthOk: false,
    interactiveAuthOk: false
  });

  await page.waitForFunction(() => {
    const slackBtn = document.getElementById("zipSlacktivatedBtn");
    const slackToMe = document.getElementById("zipSlackItToMeBtn");
    return !!(slackBtn && slackBtn.classList.contains("is-slacktivated") && slackToMe && !slackToMe.disabled);
  }, { timeout: 10000 });

  const report = await readSlackUiReport(page);
  assert.ok(report && report.calls, "test harness should capture call logs");
  assert.ok(report.messageTypes.includes("ZIP_SLACK_OPENID_STATUS"), "should probe existing Slack OpenID session");
  assert.equal(report.openIdAuthCalls.length, 0, "should not invoke auth flow when status already has session");

  const slackTabCreates = (report.calls.tabsCreate || []).filter((row) => String((row && row.url) || "").includes("slack.com"));
  const slackTabUpdates = (report.calls.tabsUpdate || []).filter((row) => String(row && row.updateInfo && row.updateInfo.url || "").includes("slack.com"));
  assert.equal(slackTabCreates.length, 0, "must not open Slack tab when existing session is detected");
  assert.equal(slackTabUpdates.length, 0, "must not retarget tabs to Slack when existing session is detected");
  assert.equal((report.calls.windowsCreate || []).length, 0, "must not create popup windows");
  assert.equal(report.slackToMeDisabled, false, "@ME should be enabled when SLACKTIVATED");
  assert.match(report.slackClass, /\bis-slacktivated\b/);
  assert.match(report.slackTitle, /SLACKTIVATED/i);
});

test("Playwright smoke: no Slack session triggers interactive OpenID auth and SLACKTIVATES with no Slack tabs", async (t) => {
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

  await bootSidepanelForScenario(page, {
    openIdStatusOk: false,
    silentAuthOk: false,
    interactiveAuthOk: true
  });

  await page.waitForFunction(() => {
    const slackBtn = document.getElementById("zipSlacktivatedBtn");
    return !!(slackBtn && slackBtn.classList.contains("is-slack-pending"));
  }, { timeout: 10000 });

  await clickSlacktivatedButton(page);

  await page.waitForFunction(() => {
    const slackBtn = document.getElementById("zipSlacktivatedBtn");
    const slackToMe = document.getElementById("zipSlackItToMeBtn");
    return !!(slackBtn && slackBtn.classList.contains("is-slacktivated") && slackToMe && !slackToMe.disabled);
  }, { timeout: 10000 });

  const report = await readSlackUiReport(page);
  const interactiveOpenIdCall = (report.openIdAuthCalls || []).find((call) => call && call.interactive === true);
  assert.ok(interactiveOpenIdCall, "should run interactive OpenID auth when no Slack session exists");

  const slackTabCreates = (report.calls.tabsCreate || []).filter((row) => String((row && row.url) || "").includes("slack.com"));
  const slackTabUpdates = (report.calls.tabsUpdate || []).filter((row) => String(row && row.updateInfo && row.updateInfo.url || "").includes("slack.com"));
  assert.equal(slackTabCreates.length, 0, "should not open Slack tab when OpenID interactive auth succeeds");
  assert.equal(slackTabUpdates.length, 0, "should not retarget tabs when OpenID interactive auth succeeds");
  assert.equal((report.calls.windowsCreate || []).length, 0, "must not create popup windows");
  assert.match(report.slackClass, /\bis-slacktivated\b/);
});

test("Playwright smoke: OpenID auth failure opens exactly one normal Slack tab (no popup)", async (t) => {
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

  await bootSidepanelForScenario(page, {
    openIdStatusOk: false,
    silentAuthOk: false,
    interactiveAuthOk: false,
    slackTabs: []
  });

  await clickSlacktivatedButton(page);

  await page.waitForFunction(() => {
    const harness = window.__zipSidepanelHarness;
    if (!harness) return false;
    const calls = harness.getCalls();
    const slackCreates = (calls.tabsCreate || []).filter((row) => String((row && row.url) || "").includes("slack.com"));
    return slackCreates.length >= 1;
  }, { timeout: 10000 });

  const report = await readSlackUiReport(page);
  const interactiveOpenIdCall = (report.openIdAuthCalls || []).find((call) => call && call.interactive === true);
  assert.ok(interactiveOpenIdCall, "should attempt interactive OpenID auth before fallback tab");

  const slackTabCreates = (report.calls.tabsCreate || []).filter((row) => String((row && row.url) || "").includes("slack.com"));
  assert.equal(slackTabCreates.length, 1, "should open exactly one Slack tab on auth fallback");
  assert.equal((report.calls.windowsCreate || []).length, 0, "must not create popup windows");
  assert.match(report.slackClass, /\bis-slack-pending\b/);
  assert.equal(report.slackToMeDisabled, true, "@ME should stay disabled until SLACKTIVATED");
});

test("Playwright smoke: fallback uses existing Slack tab focus instead of creating a new tab", async (t) => {
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

  await bootSidepanelForScenario(page, {
    openIdStatusOk: false,
    silentAuthOk: false,
    interactiveAuthOk: false,
    slackTabs: [{ id: 5101, windowId: 71, active: false, highlighted: false, url: "https://adobedx.slack.com/" }],
    activeTabSlack: false
  });

  await clickSlacktivatedButton(page);

  await page.waitForFunction(() => {
    const harness = window.__zipSidepanelHarness;
    if (!harness) return false;
    const calls = harness.getCalls();
    const slackUpdates = (calls.tabsUpdate || []).filter((row) => String(row && row.updateInfo && row.updateInfo.url || "").includes("slack.com"));
    return slackUpdates.length >= 1;
  }, { timeout: 10000 });

  const report = await readSlackUiReport(page);
  const slackTabCreates = (report.calls.tabsCreate || []).filter((row) => String((row && row.url) || "").includes("slack.com"));
  const slackTabUpdates = (report.calls.tabsUpdate || []).filter((row) => String(row && row.updateInfo && row.updateInfo.url || "").includes("slack.com"));
  const focusedExisting = slackTabUpdates.find((row) => Number(row && row.tabId) === 5101);

  assert.equal(slackTabCreates.length, 0, "should not create a new Slack tab when one already exists");
  assert.ok(focusedExisting, "should focus/update existing Slack tab for fallback login");
  assert.equal((report.calls.windowsCreate || []).length, 0, "must not create popup windows");
});

test("Playwright smoke: fallback reuses app.slack.com client tab instead of opening new Slack tabs", async (t) => {
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

  await bootSidepanelForScenario(page, {
    openIdStatusOk: false,
    silentAuthOk: false,
    interactiveAuthOk: false,
    slackTabs: [{ id: 5102, windowId: 71, active: false, highlighted: false, url: "https://app.slack.com/client/TMOCKZIP/C12345" }],
    activeTabSlack: false
  });

  await clickSlacktivatedButton(page);

  await page.waitForFunction(() => {
    const harness = window.__zipSidepanelHarness;
    if (!harness) return false;
    const calls = harness.getCalls();
    const slackUpdates = (calls.tabsUpdate || []).filter((row) => String(row && row.updateInfo && row.updateInfo.url || "").includes("slack.com"));
    return slackUpdates.length >= 1;
  }, { timeout: 10000 });

  const report = await readSlackUiReport(page);
  const slackTabCreates = (report.calls.tabsCreate || []).filter((row) => String((row && row.url) || "").includes("slack.com"));
  const slackTabUpdates = (report.calls.tabsUpdate || []).filter((row) => String(row && row.updateInfo && row.updateInfo.url || "").includes("slack.com"));
  const focusedExisting = slackTabUpdates.find((row) => Number(row && row.tabId) === 5102);

  assert.equal(slackTabCreates.length, 0, "should not create a new Slack tab when app.slack.com tab already exists");
  assert.ok(focusedExisting, "should focus/update existing app.slack.com tab for fallback login");
  assert.equal((report.calls.windowsCreate || []).length, 0, "must not create popup windows");
});
