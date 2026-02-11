"use strict";

const ZENDESK_ORIGIN = "https://adobeprimetime.zendesk.com";
const ZENDESK_DASHBOARD_URL = ZENDESK_ORIGIN + "/agent/dashboard";
const ZIP_PANEL_PATH = "sidepanel.html";
const MENU_OPEN_PANEL = "zip_open_side_panel";
const MENU_OPEN_WORKSPACE_TAB = "zip_open_workspace_tab";

const sidePanelCapabilities = {
  open: typeof chrome.sidePanel?.open === "function",
  close: typeof chrome.sidePanel?.close === "function",
  getLayout: typeof chrome.sidePanel?.getLayout === "function",
  getOptions: typeof chrome.sidePanel?.getOptions === "function",
  getPanelBehavior: typeof chrome.sidePanel?.getPanelBehavior === "function",
  onOpened: !!chrome.sidePanel?.onOpened?.addListener,
  onClosed: !!chrome.sidePanel?.onClosed?.addListener
};

const sidePanelState = {
  layout: "unknown",
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

async function configureSidePanelDefaults() {
  try {
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
      refreshLayoutState().catch(() => {});
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
  chrome.contextMenus.create({
    id: MENU_OPEN_PANEL,
    title: "Open ZIP Side Panel",
    contexts: ["action", "page"]
  });
  chrome.contextMenus.create({
    id: MENU_OPEN_WORKSPACE_TAB,
    title: "Open ZIP Workspace Tab (Horizontal)",
    contexts: ["action", "page"]
  });
}

async function getActiveTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs && tabs[0] ? tabs[0] : null;
  } catch (_) {
    return null;
  }
}

async function openWorkspaceTab() {
  const url = chrome.runtime.getURL(ZIP_PANEL_PATH + "?mode=workspace");
  try {
    const tab = await chrome.tabs.create({ url });
    return { ok: true, tabId: tab?.id ?? null };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : "Unable to open workspace tab" };
  }
}

async function openZipSidePanelFromGesture(tab) {
  if (!sidePanelCapabilities.open) {
    return { ok: false, error: "This Chrome version does not support sidePanel.open()" };
  }

  const activeTab = tab && tab.id != null ? tab : await getActiveTab();
  if (!activeTab || activeTab.id == null) {
    return { ok: false, error: "No active tab available" };
  }

  // Toggle behavior when close() and lifecycle events are available.
  if (sidePanelCapabilities.close && sidePanelCapabilities.onOpened && sidePanelCapabilities.onClosed) {
    const openedAt = toTime(sidePanelState.lastOpened && sidePanelState.lastOpened.at);
    const closedAt = toTime(sidePanelState.lastClosed && sidePanelState.lastClosed.at);
    const openedForThisTab = sidePanelState.lastOpened && sidePanelState.lastOpened.tabId === activeTab.id;
    if (openedForThisTab && openedAt > closedAt) {
      try {
        await chrome.sidePanel.close({ tabId: activeTab.id });
        return { ok: true, tabId: activeTab.id, closed: true };
      } catch (_) {}
    }
  }

  if (!isZendeskUrl(activeTab.url || "")) {
    // If user triggers ZIP from an irrelevant site, open Zendesk first.
    try {
      const zdTab = await chrome.tabs.create({ url: ZENDESK_DASHBOARD_URL });
      if (!zdTab || zdTab.id == null) {
        return { ok: false, error: "Unable to open Zendesk tab" };
      }
      await setOptionsForTab(zdTab.id, ZENDESK_DASHBOARD_URL);
      await chrome.sidePanel.open({ tabId: zdTab.id });
      return { ok: true, tabId: zdTab.id, openedZendeskTab: true };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "Unable to open side panel" };
    }
  }

  try {
    await setOptionsForTab(activeTab.id, activeTab.url || "");
    await chrome.sidePanel.open({ tabId: activeTab.id });
    return { ok: true, tabId: activeTab.id, openedZendeskTab: false };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : "Unable to open side panel" };
  }
}

async function getSidePanelContext() {
  const context = {
    layout: await refreshLayoutState(),
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
  await createContextMenus();
}

wireLifecycleEvents();
bootstrap().catch(() => {});

chrome.runtime.onInstalled.addListener(() => {
  bootstrap().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  bootstrap().catch(() => {});
});

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
  if (info.menuItemId === MENU_OPEN_PANEL) {
    openZipSidePanelFromGesture(tab).catch(() => {});
    return;
  }
  if (info.menuItemId === MENU_OPEN_WORKSPACE_TAB) {
    openWorkspaceTab().catch(() => {});
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "open-zip-side-panel") {
    openZipSidePanelFromGesture().catch(() => {});
    return;
  }
  if (command === "open-zip-workspace-tab") {
    openWorkspaceTab().catch(() => {});
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
