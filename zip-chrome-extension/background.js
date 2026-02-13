"use strict";

const ZENDESK_ORIGIN = "https://adobeprimetime.zendesk.com";
const ZENDESK_DASHBOARD_URL = ZENDESK_ORIGIN + "/agent/dashboard?brand_id=2379046";
const ZIP_PANEL_PATH = "sidepanel.html";
const MENU_ROOT = "zip_root";
const MENU_TOGGLE_SIDE = "zip_toggle_side";
const MENU_ASK_ERIC = "zip_ask_eric";
const MENU_GET_LATEST = "zip_get_latest";
const ASK_ERIC_EMAIL = "minnick@adobe.com";
const GITHUB_OWNER = "HH5HH";
const GITHUB_REPO = "ZIP";
const ZIP_LATEST_MANIFEST_URL = "https://raw.githubusercontent.com/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/main/zip-chrome-extension/manifest.json";
const ZIP_LATEST_MANIFEST_API_URL = "https://api.github.com/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/contents/zip-chrome-extension/manifest.json?ref=main";
const ZIP_LATEST_PACKAGE_URL = "https://raw.githubusercontent.com/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/main/zip-chrome-extension.zip";
const CHROME_EXTENSIONS_URL = "chrome://extensions";
const UPDATE_CHECK_TTL_MS = 10 * 60 * 1000;
const CHROME_SIDEPANEL_SETTINGS_URL = "chrome://settings/?search=side%20panel";
const MENU_SIDEPANEL_POSITION_LABEL = "⚙ > Side panel position";
const MENU_CONTEXTS = ["action"];
const contextMenuState = {
  grouped: true
};
const updateState = {
  currentVersion: "",
  latestVersion: "",
  updateAvailable: false,
  lastCheckedAt: 0,
  checkError: "",
  inFlight: null
};

function getZipBuildVersion() {
  try {
    const manifest = chrome.runtime.getManifest();
    return manifest && manifest.version ? String(manifest.version) : "";
  } catch (_) {
    return "";
  }
}

function getZipRootMenuTitle() {
  const version = getZipBuildVersion();
  return version ? "ZIP v" + version : "ZIP";
}

function getToggleMenuItemTitle(currentSide) {
  const base = getToggleMenuTitle(currentSide);
  if (contextMenuState.grouped) return base;
  return getZipRootMenuTitle() + " | " + base;
}

function getAskEricMenuTitle() {
  if (contextMenuState.grouped) return "Ask Eric";
  return getZipRootMenuTitle() + " | Ask Eric";
}

function parseVersionPart(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareVersions(a, b) {
  const aParts = String(a || "").split(".");
  const bParts = String(b || "").split(".");
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i += 1) {
    const aPart = parseVersionPart(aParts[i]);
    const bPart = parseVersionPart(bParts[i]);
    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }
  return 0;
}

function extractVersionFromManifestObject(manifest) {
  const version = manifest && manifest.version ? String(manifest.version).trim() : "";
  if (!version) throw new Error("Latest version unavailable");
  return version;
}

async function fetchLatestZipVersionFromRaw() {
  const response = await fetch(ZIP_LATEST_MANIFEST_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const manifest = await response.json();
  return extractVersionFromManifestObject(manifest);
}

async function fetchLatestZipVersionFromGithubApi() {
  const response = await fetch(ZIP_LATEST_MANIFEST_API_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const payload = await response.json();
  const encoded = payload && payload.content ? String(payload.content).replace(/\s+/g, "") : "";
  if (!encoded) throw new Error("GitHub API content unavailable");
  let decoded = "";
  try {
    decoded = atob(encoded);
  } catch (_) {
    throw new Error("Failed to decode GitHub manifest");
  }
  let manifest = null;
  try {
    manifest = JSON.parse(decoded);
  } catch (_) {
    throw new Error("Failed to parse GitHub manifest");
  }
  return extractVersionFromManifestObject(manifest);
}

async function fetchLatestZipVersion() {
  let lastError = null;
  const resolvers = [fetchLatestZipVersionFromRaw, fetchLatestZipVersionFromGithubApi];
  for (const resolveVersion of resolvers) {
    try {
      return await resolveVersion();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Latest version unavailable");
}

function getUpdateStatePayload() {
  return {
    currentVersion: updateState.currentVersion || getZipBuildVersion(),
    latestVersion: updateState.latestVersion || "",
    updateAvailable: !!updateState.updateAvailable,
    checkedAt: updateState.lastCheckedAt || 0,
    checkError: updateState.checkError || ""
  };
}

async function refreshUpdateState(options = {}) {
  const force = !!options.force;
  const now = Date.now();
  const currentVersion = getZipBuildVersion();
  updateState.currentVersion = currentVersion;

  if (!force && updateState.lastCheckedAt && (now - updateState.lastCheckedAt) < UPDATE_CHECK_TTL_MS) {
    return { ...getUpdateStatePayload(), changed: false };
  }

  if (updateState.inFlight) {
    return updateState.inFlight;
  }

  updateState.inFlight = (async () => {
    const prevLatestVersion = updateState.latestVersion;
    const prevUpdateAvailable = !!updateState.updateAvailable;
    const prevCheckError = updateState.checkError;
    try {
      const latestVersion = await fetchLatestZipVersion();
      updateState.latestVersion = latestVersion;
      updateState.updateAvailable = compareVersions(currentVersion, latestVersion) < 0;
      updateState.checkError = "";
    } catch (err) {
      updateState.latestVersion = "";
      updateState.updateAvailable = false;
      updateState.checkError = err && err.message ? err.message : "Version check failed";
    } finally {
      updateState.lastCheckedAt = Date.now();
      updateState.inFlight = null;
    }
    const payload = getUpdateStatePayload();
    const changed = (
      prevLatestVersion !== updateState.latestVersion
      || prevUpdateAvailable !== !!updateState.updateAvailable
      || prevCheckError !== updateState.checkError
    );
    return { ...payload, changed };
  })();

  return updateState.inFlight;
}

async function createContextMenuItem(createProps) {
  await new Promise((resolve, reject) => {
    chrome.contextMenus.create(createProps, () => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message || "contextMenus.create failed"));
      else resolve();
    });
  });
}

const sidePanelCapabilities = {
  open: typeof chrome.sidePanel?.open === "function",
  close: typeof chrome.sidePanel?.close === "function",
  setLayout: typeof chrome.sidePanel?.setLayout === "function",
  setSide: typeof chrome.sidePanel?.setSide === "function",
  setOptions: typeof chrome.sidePanel?.setOptions === "function",
  getLayout: typeof chrome.sidePanel?.getLayout === "function",
  getOptions: typeof chrome.sidePanel?.getOptions === "function",
  getPanelBehavior: typeof chrome.sidePanel?.getPanelBehavior === "function",
  onOpened: !!chrome.sidePanel?.onOpened?.addListener,
  onClosed: !!chrome.sidePanel?.onClosed?.addListener
};

const sidePanelState = {
  layout: "unknown",
  requestedSide: "",
  lastOpened: null,
  lastClosed: null
};

function nowIso() {
  return new Date().toISOString();
}

function toTime(value) {
  const t = Date.parse(String(value || ""));
  return Number.isFinite(t) ? t : 0;
}

function isZendeskUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.origin === ZENDESK_ORIGIN;
  } catch (_) {
    return false;
  }
}

function normalizeSide(value) {
  return value === "left" || value === "right" ? value : "";
}

function getOppositeSide(side) {
  if (side === "left") return "right";
  if (side === "right") return "left";
  return "";
}

function canProgrammaticallySetSide() {
  return !!(sidePanelCapabilities.setLayout || sidePanelCapabilities.setSide);
}

function getRequestedToggleSide(currentSide) {
  const known = normalizeSide(currentSide);
  if (known) return getOppositeSide(known);
  const fromState = normalizeSide(sidePanelState.requestedSide);
  return fromState ? getOppositeSide(fromState) : "left";
}

function getToggleMenuTitle(currentSide) {
  return MENU_SIDEPANEL_POSITION_LABEL;
}

async function updateToggleMenuTitle(currentSide) {
  if (!chrome.contextMenus) return;
  const side = normalizeSide(currentSide) || "unknown";
  const title = getToggleMenuItemTitle(side);
  await new Promise((resolve) => {
    chrome.contextMenus.update(MENU_TOGGLE_SIDE, { title }, () => {
      resolve();
    });
  });
}

async function syncLayoutAndToggleMenu() {
  const side = await refreshLayoutState();
  await updateToggleMenuTitle(side);
  return side;
}

async function configureSidePanelDefaults() {
  try {
    // Use documented behavior: action click toggles side panel entry.
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (_) {}
  // Keep ZIP tab-scoped by default and only enable on supported domains.
  try {
    await chrome.sidePanel.setOptions({ path: ZIP_PANEL_PATH, enabled: false });
  } catch (_) {}
}

async function setOptionsForTab(tabId, tabUrl) {
  if (tabId == null) return;
  const enabled = isZendeskUrl(tabUrl || "");
  const options = enabled
    ? { tabId, path: ZIP_PANEL_PATH, enabled: true }
    : { tabId, enabled: false };
  try {
    await chrome.sidePanel.setOptions(options);
  } catch (_) {}
}

async function syncAllTabOptions() {
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({});
  } catch (_) {}
  await Promise.all(tabs.map((tab) => setOptionsForTab(tab.id, tab.url || "")));
}

async function refreshLayoutState() {
  if (!sidePanelCapabilities.getLayout) {
    sidePanelState.layout = "unknown";
    return sidePanelState.layout;
  }
  try {
    const layout = await chrome.sidePanel.getLayout();
    const side = layout && (layout.side === "left" || layout.side === "right") ? layout.side : "unknown";
    sidePanelState.layout = side;
    return side;
  } catch (_) {
    sidePanelState.layout = "unknown";
    return sidePanelState.layout;
  }
}

function wireLifecycleEvents() {
  if (sidePanelCapabilities.onOpened) {
    chrome.sidePanel.onOpened.addListener((info) => {
      sidePanelState.lastOpened = { ...info, at: nowIso() };
      syncLayoutAndToggleMenu().catch(() => {});
    });
  }
  if (sidePanelCapabilities.onClosed) {
    chrome.sidePanel.onClosed.addListener((info) => {
      sidePanelState.lastClosed = { ...info, at: nowIso() };
    });
  }
}

async function createContextMenus() {
  if (!chrome.contextMenus) return;
  await new Promise((resolve) => chrome.contextMenus.removeAll(() => resolve()));
  const currentSide = normalizeSide(sidePanelState.layout) || "unknown";
  const shouldShowGetLatest = !!updateState.updateAvailable;
  contextMenuState.grouped = true;
  try {
    await createContextMenuItem({
      id: MENU_ROOT,
      title: getZipRootMenuTitle(),
      contexts: MENU_CONTEXTS
    });
    await createContextMenuItem({
      id: MENU_TOGGLE_SIDE,
      parentId: MENU_ROOT,
      title: getToggleMenuItemTitle(currentSide),
      contexts: MENU_CONTEXTS
    });
    await createContextMenuItem({
      id: MENU_ASK_ERIC,
      parentId: MENU_ROOT,
      title: getAskEricMenuTitle(),
      contexts: MENU_CONTEXTS
    });
    if (shouldShowGetLatest) {
      await createContextMenuItem({
        id: MENU_GET_LATEST,
        parentId: MENU_ROOT,
        title: "Get Latest",
        contexts: MENU_CONTEXTS
      });
    }
  } catch (err) {
    // Fallback: if grouped action menus are unsupported, create flat action items.
    contextMenuState.grouped = false;
    await new Promise((resolve) => chrome.contextMenus.removeAll(() => resolve()));
    await createContextMenuItem({
      id: MENU_TOGGLE_SIDE,
      title: getToggleMenuItemTitle(currentSide),
      contexts: MENU_CONTEXTS
    });
    await createContextMenuItem({
      id: MENU_ASK_ERIC,
      title: getAskEricMenuTitle(),
      contexts: MENU_CONTEXTS
    });
    if (shouldShowGetLatest) {
      await createContextMenuItem({
        id: MENU_GET_LATEST,
        title: "Get Latest",
        contexts: MENU_CONTEXTS
      });
    }
  }
}

async function getActiveTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs && tabs[0] ? tabs[0] : null;
  } catch (_) {
    return null;
  }
}

async function getZendeskTabInCurrentWindow() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true, url: ZENDESK_ORIGIN + "/*" });
    return tabs && tabs[0] ? tabs[0] : null;
  } catch (_) {
    return null;
  }
}

async function openAskEricEmail(tab) {
  const lines = [
    "Hi Eric,",
    "",
    "Question / feedback:",
    ""
  ];
  if (tab && tab.url) lines.push("Context URL: " + tab.url);
  const params = new URLSearchParams({
    subject: "ZIP Question / Feedback",
    body: lines.join("\n")
  });
  const url = "mailto:" + ASK_ERIC_EMAIL + "?" + params.toString();
  try {
    await chrome.tabs.create({ url });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : "Unable to open mail client" };
  }
}

async function openGetLatestFlow() {
  const result = {
    ok: false,
    downloadUrl: ZIP_LATEST_PACKAGE_URL,
    latestVersion: updateState.latestVersion || "",
    downloadOpened: false,
    extensionsOpened: false
  };
  try {
    await chrome.tabs.create({ url: ZIP_LATEST_PACKAGE_URL });
    result.downloadOpened = true;
  } catch (_) {}
  try {
    await chrome.tabs.create({ url: CHROME_EXTENSIONS_URL });
    result.extensionsOpened = true;
  } catch (_) {}
  result.ok = result.downloadOpened || result.extensionsOpened;
  if (!result.ok) {
    result.error = "Unable to open update links";
  }
  return result;
}

async function openSidePanelSettings() {
  try {
    const existing = await chrome.tabs.query({ url: "chrome://settings/*", currentWindow: true });
    const tab = existing && existing[0] ? existing[0] : null;
    if (tab && tab.id != null) {
      await chrome.tabs.update(tab.id, { active: true, url: CHROME_SIDEPANEL_SETTINGS_URL });
      return { ok: true, tabId: tab.id, reused: true, url: CHROME_SIDEPANEL_SETTINGS_URL };
    }
  } catch (_) {}
  try {
    const created = await chrome.tabs.create({ url: CHROME_SIDEPANEL_SETTINGS_URL });
    return { ok: true, tabId: created?.id ?? null, reused: false, url: CHROME_SIDEPANEL_SETTINGS_URL };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : "Unable to open Chrome side panel settings" };
  }
}

async function openZipSidePanelFromGesture(tab, options = {}) {
  const skipToggle = !!(options && options.skipToggle);

  if (!sidePanelCapabilities.open) {
    return { ok: false, error: "This Chrome version does not support sidePanel.open()" };
  }

  const activeTab = tab && tab.id != null ? tab : await getActiveTab();
  if (!activeTab || activeTab.id == null) {
    return { ok: false, error: "No active tab available" };
  }

  let targetTab = activeTab;
  if (!isZendeskUrl(targetTab.url || "")) {
    const existingZendeskTab = await getZendeskTabInCurrentWindow();
    if (existingZendeskTab && existingZendeskTab.id != null) {
      targetTab = existingZendeskTab;
      try {
        await chrome.tabs.update(targetTab.id, { active: true });
      } catch (_) {}
    } else {
      try {
        const createdZendeskTab = await chrome.tabs.create({ url: ZENDESK_DASHBOARD_URL });
        if (!createdZendeskTab || createdZendeskTab.id == null) {
          return { ok: false, error: "Unable to open Zendesk tab." };
        }
        targetTab = createdZendeskTab;
      } catch (err) {
        return { ok: false, error: err && err.message ? err.message : "Unable to open Zendesk tab." };
      }
    }
  }

  // Toggle behavior when close() and lifecycle events are available.
  if (!skipToggle && sidePanelCapabilities.close && sidePanelCapabilities.onOpened && sidePanelCapabilities.onClosed) {
    const openedAt = toTime(sidePanelState.lastOpened && sidePanelState.lastOpened.at);
    const closedAt = toTime(sidePanelState.lastClosed && sidePanelState.lastClosed.at);
    const openedForThisTab = sidePanelState.lastOpened && sidePanelState.lastOpened.tabId === targetTab.id;
    if (openedForThisTab && openedAt > closedAt) {
      try {
        await chrome.sidePanel.close({ tabId: targetTab.id });
        return { ok: true, tabId: targetTab.id, closed: true };
      } catch (_) {}
    }
  }

  try {
    await setOptionsForTab(targetTab.id, targetTab.url || "");
    await chrome.sidePanel.open({ tabId: targetTab.id });
    const actualSide = await refreshLayoutState();
    return { ok: true, tabId: targetTab.id, openedZendeskTab: targetTab.id !== activeTab.id, actualSide };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : "Unable to open side panel" };
  }
}

async function setSideIfSupported(requestedSide) {
  const side = normalizeSide(requestedSide);
  if (!side) return { supported: false, applied: false, method: null };
  if (sidePanelCapabilities.setLayout) {
    try {
      await chrome.sidePanel.setLayout({ side });
      return { supported: true, applied: true, method: "setLayout" };
    } catch (_) {}
  }
  if (sidePanelCapabilities.setSide) {
    try {
      await chrome.sidePanel.setSide({ side });
      return { supported: true, applied: true, method: "setSide" };
    } catch (_) {}
  }
  return { supported: false, applied: false, method: null };
}

async function toggleZipSidePanelSide(tab) {
  const currentSide = await refreshLayoutState();
  const requestedSide = getRequestedToggleSide(currentSide);
  sidePanelState.requestedSide = requestedSide;
  const sideSetResult = await setSideIfSupported(requestedSide);
  if (!sideSetResult.applied) {
    const openResult = await openZipSidePanelFromGesture(tab, { skipToggle: true });
    const settingsResult = await openSidePanelSettings();
    const actualSide = openResult.actualSide || (await refreshLayoutState());
    await updateToggleMenuTitle(actualSide);
    return {
      ...openResult,
      requestedSide,
      actualSide,
      sideChanged: false,
      canProgrammaticallySetSide: false,
      sideSetMethod: null,
      needsManualSideChange: true,
      settingsOpened: settingsResult.ok,
      settingsUrl: settingsResult.ok ? settingsResult.url : null,
      error: settingsResult.ok ? "Switch side in Chrome settings, then click toggle again." : settingsResult.error
    };
  }
  const result = await openZipSidePanelFromGesture(tab, { skipToggle: true });
  const actualSide = result.actualSide || (await refreshLayoutState());
  await updateToggleMenuTitle(actualSide);
  const sideChanged = actualSide === requestedSide;
  return {
    ...result,
    requestedSide,
    actualSide,
    sideChanged,
    canProgrammaticallySetSide: canProgrammaticallySetSide(),
    sideSetMethod: sideSetResult.method
  };
}

async function getSidePanelContext() {
  const context = {
    layout: await refreshLayoutState(),
    supportedSides: ["left", "right"],
    supportsTopBottom: false,
    canProgrammaticallySetSide: canProgrammaticallySetSide(),
    requestedSide: normalizeSide(sidePanelState.requestedSide) || null,
    capabilities: sidePanelCapabilities,
    lastOpened: sidePanelState.lastOpened,
    lastClosed: sidePanelState.lastClosed,
    panelBehavior: null,
    activeTab: null,
    activeTabOptions: null
  };

  if (sidePanelCapabilities.getPanelBehavior) {
    try {
      context.panelBehavior = await chrome.sidePanel.getPanelBehavior();
    } catch (_) {}
  }

  const activeTab = await getActiveTab();
  if (activeTab && activeTab.id != null) {
    context.activeTab = { id: activeTab.id, url: activeTab.url || "" };
    if (sidePanelCapabilities.getOptions) {
      try {
        context.activeTabOptions = await chrome.sidePanel.getOptions({ tabId: activeTab.id });
      } catch (_) {}
    }
  }

  return context;
}

async function bootstrap() {
  await configureSidePanelDefaults();
  await refreshLayoutState();
  await syncAllTabOptions();
  await refreshUpdateState({ force: true }).catch(() => {});
  await createContextMenus();
  await updateToggleMenuTitle(sidePanelState.layout);
}

wireLifecycleEvents();
bootstrap().catch(() => {});

chrome.runtime.onInstalled.addListener(() => {
  bootstrap().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  bootstrap().catch(() => {});
});

setInterval(() => {
  refreshUpdateState({ force: true })
    .then((info) => {
      if (!info || !info.changed) return;
      return createContextMenus().then(() => updateToggleMenuTitle(sidePanelState.layout));
    })
    .catch(() => {});
}, UPDATE_CHECK_TTL_MS);

chrome.tabs.onUpdated.addListener((tabId, _info, tab) => {
  if (!tab?.url) return;
  setOptionsForTab(tabId, tab.url).catch(() => {});
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId)
    .then((tab) => setOptionsForTab(tabId, tab?.url || ""))
    .catch(() => {});
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_TOGGLE_SIDE) {
    toggleZipSidePanelSide(tab).catch(() => {});
    return;
  }
  if (info.menuItemId === MENU_GET_LATEST) {
    openGetLatestFlow().catch(() => {});
    return;
  }
  if (info.menuItemId === MENU_ASK_ERIC) {
    openAskEricEmail(tab).catch(() => {});
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "open-zip-side-panel") {
    openZipSidePanelFromGesture(undefined).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "ZIP_REQUEST") {
    const { requestId, tabId, inner } = msg;
    chrome.tabs.sendMessage(tabId, { type: "ZIP_FROM_BACKGROUND", requestId, inner }, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ type: "ZIP_RESPONSE", requestId, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response || { type: "ZIP_RESPONSE", requestId, error: "No response" });
      }
    });
    return true;
  }
  if (msg.type === "ZIP_NAVIGATE") {
    const { tabId, url } = msg;
    chrome.tabs.update(tabId, { url }, () => sendResponse({ error: chrome.runtime.lastError?.message }));
    return true;
  }
  if (msg.type === "ZIP_GET_ACTIVE_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let tabId = tabs[0]?.id ?? null;
      if (!tabId) {
        chrome.tabs.query({ url: ZENDESK_ORIGIN + "/*" }, (zdTabs) => {
          tabId = zdTabs[0]?.id ?? null;
          sendResponse({ tabId });
        });
      } else {
        sendResponse({ tabId });
      }
    });
    return true;
  }
  if (msg.type === "ZIP_CONTEXT_MENU_ACTION") {
    const action = (msg.action || "").trim();
    (async () => {
      if (action === "toggleSide") return toggleZipSidePanelSide(undefined);
      if (action === "askEric") {
        const tab = await getActiveTab();
        return openAskEricEmail(tab);
      }
      if (action === "getLatest") {
        return openGetLatestFlow();
      }
      return { ok: false, error: "Unknown context menu action" };
    })()
      .then((result) => sendResponse(result || { ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err && err.message ? err.message : "Action failed" }));
    return true;
  }
  if (msg.type === "ZIP_GET_UPDATE_STATE") {
    refreshUpdateState({ force: !!msg.force })
      .then((info) => {
        if (info && info.changed) {
          createContextMenus().then(() => updateToggleMenuTitle(sidePanelState.layout)).catch(() => {});
        }
        sendResponse(getUpdateStatePayload());
      })
      .catch(() => sendResponse(getUpdateStatePayload()));
    return true;
  }
  if (msg.type === "ZIP_GET_SIDEPANEL_CONTEXT") {
    getSidePanelContext()
      .then((context) => sendResponse(context))
      .catch(() => sendResponse({ layout: "unknown", capabilities: sidePanelCapabilities }));
    return true;
  }
  if (msg.type === "ZIP_OPEN_LOGIN") {
    const url = msg.url || ZENDESK_ORIGIN + "/auth/v3/signin?return_to=" + encodeURIComponent(ZENDESK_ORIGIN + "/agent/filters/36464467");
    chrome.tabs.create({ url }, (tab) => {
      sendResponse({ tabId: tab?.id ?? null, error: chrome.runtime.lastError?.message });
    });
    return true;
  }
});
