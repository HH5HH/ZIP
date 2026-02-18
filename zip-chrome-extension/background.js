"use strict";

const ZENDESK_ORIGIN = "https://adobeprimetime.zendesk.com";
const ZENDESK_DASHBOARD_URL = ZENDESK_ORIGIN + "/agent/dashboard?brand_id=2379046";
const ASSIGNED_FILTER_PATH = "/agent/filters/36464467";
const ASSIGNED_FILTER_URL = ZENDESK_ORIGIN + ASSIGNED_FILTER_PATH;
const ZIP_PANEL_PATH = "sidepanel.html";
const MENU_ROOT = "zip_root";
const MENU_TOGGLE_SIDE = "zip_toggle_side";
const MENU_ASK_ERIC = "zip_ask_eric";
const MENU_GET_LATEST = "zip_get_latest";
const MENU_THEME_PARENT = "zip_theme_parent";
const MENU_THEME_PREFIX = "zip_theme_";
const ASK_ERIC_EMAIL = "minnick@adobe.com";
const OUTLOOK_DEEPLINK_COMPOSE_URL = "https://outlook.office.com/mail/deeplink/compose";
const GITHUB_OWNER = "HH5HH";
const GITHUB_REPO = "ZIP";
const ZIP_LATEST_MANIFEST_URL = "https://raw.githubusercontent.com/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/main/zip-chrome-extension/manifest.json";
const ZIP_LATEST_MANIFEST_API_URL = "https://api.github.com/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/contents/zip-chrome-extension/manifest.json?ref=main";
const ZIP_LATEST_PACKAGE_URL = "https://raw.githubusercontent.com/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/main/zip-chrome-extension.zip";
const CHROME_EXTENSIONS_URL = "chrome://extensions";
const UPDATE_CHECK_TTL_MS = 10 * 60 * 1000;
const CHROME_SIDEPANEL_SETTINGS_URL = "chrome://settings/?search=side%20panel";
const MENU_SIDEPANEL_POSITION_LABEL = "⚙ > Side panel position";
const THEME_STORAGE_KEY = "zip.ui.theme.v1";
const THEME_COLOR_STOPS = [
  { id: "dark", label: "Dark", spectrumColorStop: "dark", paletteSet: "dark" },
  { id: "light", label: "Light", spectrumColorStop: "light", paletteSet: "light" }
];
const THEME_ACCENT_FAMILIES = [
  { id: "blue", label: "Blue" },
  { id: "indigo", label: "Indigo" },
  { id: "purple", label: "Purple" },
  { id: "fuchsia", label: "Fuchsia" },
  { id: "magenta", label: "Magenta" },
  { id: "pink", label: "Pink" },
  { id: "red", label: "Red" },
  { id: "orange", label: "Orange" },
  { id: "yellow", label: "Yellow" },
  { id: "chartreuse", label: "Chartreuse" },
  { id: "celery", label: "Celery" },
  { id: "green", label: "Green" },
  { id: "seafoam", label: "Seafoam" },
  { id: "cyan", label: "Cyan" },
  { id: "turquoise", label: "Turquoise" },
  { id: "cinnamon", label: "Cinnamon" },
  { id: "brown", label: "Brown" },
  { id: "silver", label: "Silver" },
  { id: "gray", label: "Gray" }
];
// Legacy IDs are migrated to supported Spectrum 2 light/dark themes.
const LEGACY_THEME_ALIASES = {
  "s2-darkest": "s2-dark-blue",
  "s2-dark": "s2-dark-blue",
  "s2-light": "s2-light-blue",
  "s2-wireframe": "s2-light-blue",
  "s2-blue": "s2-dark-blue",
  "s2-indigo": "s2-dark-indigo",
  "s2-purple": "s2-dark-purple",
  "s2-fuchsia": "s2-dark-fuchsia",
  "s2-magenta": "s2-dark-magenta",
  "s2-pink": "s2-dark-pink",
  "s2-red": "s2-dark-red",
  "s2-orange": "s2-dark-orange",
  "s2-yellow": "s2-dark-yellow",
  "s2-chartreuse": "s2-dark-chartreuse",
  "s2-celery": "s2-dark-celery",
  "s2-green": "s2-dark-green",
  "s2-seafoam": "s2-dark-seafoam",
  "s2-cyan": "s2-dark-cyan",
  "s2-turquoise": "s2-dark-turquoise",
  "s2-cinnamon": "s2-dark-cinnamon",
  "s2-brown": "s2-dark-brown",
  "s2-silver": "s2-dark-silver",
  "s2-gray": "s2-dark-gray"
};

function buildThemeOptions() {
  const options = [];
  THEME_COLOR_STOPS.forEach((stop) => {
    THEME_ACCENT_FAMILIES.forEach((accent) => {
      const isDefaultBlue = accent.id === "blue";
      options.push({
        id: "s2-" + stop.id + "-" + accent.id,
        label: isDefaultBlue
          ? ("Spectrum 2 " + stop.label)
          : ("Spectrum 2 " + stop.label + " " + accent.label),
        spectrumColorStop: stop.spectrumColorStop,
        themeColorStop: stop.id,
        paletteSet: stop.paletteSet,
        accentFamily: accent.id
      });
    });
  });
  return options;
}

const ZIP_THEME_OPTIONS = buildThemeOptions();
const ZIP_THEME_OPTION_BY_ID = Object.fromEntries(ZIP_THEME_OPTIONS.map((option) => [option.id, option]));
const DEFAULT_THEME_ID = "s2-dark-blue";
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
const themeState = {
  selectedId: DEFAULT_THEME_ID,
  loaded: false,
  inFlight: null
};

function getThemeOption(themeId) {
  const normalized = String(themeId || "").trim().toLowerCase();
  return ZIP_THEME_OPTION_BY_ID[normalized] || null;
}

function normalizeThemeId(themeId) {
  const raw = String(themeId || "").trim().toLowerCase();
  let mapped = LEGACY_THEME_ALIASES[raw] || raw;
  if (mapped.startsWith("s2-darkest-")) {
    mapped = "s2-dark-" + mapped.slice("s2-darkest-".length);
  }
  if (mapped.startsWith("s2-wireframe-")) {
    mapped = "s2-light-" + mapped.slice("s2-wireframe-".length);
  }
  return getThemeOption(mapped) ? mapped : DEFAULT_THEME_ID;
}

function getThemeMenuItemId(themeId) {
  return MENU_THEME_PREFIX + String(themeId || "").trim().toLowerCase();
}

function getThemeIdFromMenuItemId(menuItemId) {
  const raw = String(menuItemId || "").trim().toLowerCase();
  if (!raw || !raw.startsWith(MENU_THEME_PREFIX)) return "";
  const candidateId = raw.slice(MENU_THEME_PREFIX.length);
  if (
    !getThemeOption(candidateId)
    && !LEGACY_THEME_ALIASES[candidateId]
    && !candidateId.startsWith("s2-wireframe-")
    && !candidateId.startsWith("s2-darkest-")
  ) return "";
  return normalizeThemeId(candidateId);
}

function getThemeStatePayload() {
  const selectedId = normalizeThemeId(themeState.selectedId);
  const selectedTheme = getThemeOption(selectedId) || getThemeOption(DEFAULT_THEME_ID);
  return {
    themeId: selectedTheme ? selectedTheme.id : DEFAULT_THEME_ID,
    theme: selectedTheme || ZIP_THEME_OPTIONS[0],
    options: ZIP_THEME_OPTIONS.map((option) => ({ ...option }))
  };
}

async function readThemeIdFromStorage() {
  if (!chrome.storage || !chrome.storage.local) {
    return DEFAULT_THEME_ID;
  }
  try {
    const stored = await chrome.storage.local.get(THEME_STORAGE_KEY);
    return normalizeThemeId(stored && stored[THEME_STORAGE_KEY]);
  } catch (_) {
    return DEFAULT_THEME_ID;
  }
}

async function persistThemeId(themeId) {
  if (!chrome.storage || !chrome.storage.local) return;
  try {
    await chrome.storage.local.set({ [THEME_STORAGE_KEY]: normalizeThemeId(themeId) });
  } catch (_) {}
}

async function ensureThemeStateLoaded() {
  if (themeState.loaded) return themeState.selectedId;
  if (themeState.inFlight) return themeState.inFlight;
  themeState.inFlight = (async () => {
    const storedId = await readThemeIdFromStorage();
    themeState.selectedId = normalizeThemeId(storedId);
    themeState.loaded = true;
    themeState.inFlight = null;
    return themeState.selectedId;
  })().catch((err) => {
    themeState.inFlight = null;
    throw err;
  });
  return themeState.inFlight;
}

function notifyThemeChanged() {
  const payload = getThemeStatePayload();
  try {
    chrome.runtime.sendMessage({ type: "ZIP_THEME_CHANGED", ...payload }, () => {
      void chrome.runtime.lastError;
    });
  } catch (_) {}
}

async function setTheme(themeId, options = {}) {
  const nextThemeId = normalizeThemeId(themeId);
  const prevThemeId = normalizeThemeId(themeState.selectedId);
  const changed = nextThemeId !== prevThemeId;
  themeState.selectedId = nextThemeId;
  themeState.loaded = true;
  if (options.persist !== false) {
    await persistThemeId(nextThemeId);
  }
  if (options.refreshMenus !== false) {
    await createContextMenus();
    await updateToggleMenuTitle(sidePanelState.layout);
  }
  if (changed && options.broadcast !== false) {
    notifyThemeChanged();
  }
  return { ...getThemeStatePayload(), changed };
}

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

async function createThemeContextMenuItems(parentId) {
  const selectedThemeId = normalizeThemeId(themeState.selectedId);
  const grouped = !!parentId;
  if (grouped) {
    await createContextMenuItem({
      id: MENU_THEME_PARENT,
      parentId,
      title: "Spectrum 2 Theme",
      contexts: MENU_CONTEXTS
    });
  }
  for (const theme of ZIP_THEME_OPTIONS) {
    const createProps = {
      id: getThemeMenuItemId(theme.id),
      title: grouped ? theme.label : ("Theme: " + theme.label),
      type: "radio",
      checked: theme.id === selectedThemeId,
      contexts: MENU_CONTEXTS
    };
    if (grouped) createProps.parentId = MENU_THEME_PARENT;
    await createContextMenuItem(createProps);
  }
}

async function createContextMenus() {
  if (!chrome.contextMenus) return;
  await new Promise((resolve) => chrome.contextMenus.removeAll(() => resolve()));
  const currentSide = normalizeSide(sidePanelState.layout) || "unknown";
  const shouldShowGetLatest = !!updateState.updateAvailable;
  themeState.selectedId = normalizeThemeId(themeState.selectedId);
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
    await createThemeContextMenuItems(MENU_ROOT);
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
    await createThemeContextMenuItems(null);
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

function normalizePathname(pathname) {
  const value = String(pathname || "");
  return value.replace(/\/+$/, "") || "/";
}

function isAssignedFilterUrl(urlString) {
  try {
    const url = new URL(urlString);
    if (url.origin !== ZENDESK_ORIGIN) return false;
    return normalizePathname(url.pathname) === normalizePathname(ASSIGNED_FILTER_PATH);
  } catch (_) {
    return false;
  }
}

async function ensureAssignedFilterTabInCurrentWindow(urlOverride) {
  const targetUrl = typeof urlOverride === "string" && urlOverride.trim() ? urlOverride.trim() : ASSIGNED_FILTER_URL;
  const activeTab = await getActiveTab();
  if (!activeTab || activeTab.id == null) {
    return { ok: false, error: "No active tab available for assigned filter navigation" };
  }

  const alreadyOnAssignedFilter = isAssignedFilterUrl(activeTab.url || "");
  if (alreadyOnAssignedFilter) {
    try {
      await chrome.tabs.update(activeTab.id, { active: true });
    } catch (_) {}
    return { ok: true, tabId: activeTab.id, reused: true, navigated: false, url: targetUrl };
  }

  try {
    await chrome.tabs.update(activeTab.id, { active: true, url: targetUrl });
    return { ok: true, tabId: activeTab.id, reused: true, navigated: true, url: targetUrl };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : "Unable to navigate active tab to assigned filter" };
  }
}

async function openAskEricEmail(tab) {
  const lines = [
    "Hi Eric,",
    "",
    "Question / feedback:",
    ""
  ];
  const currentVersion = getZipBuildVersion() || "?";
  let latestVersion = "";
  try {
    const updateInfo = await refreshUpdateState({ force: false });
    latestVersion = updateInfo && updateInfo.latestVersion ? String(updateInfo.latestVersion).trim() : "";
  } catch (_) {}
  const versionLine = latestVersion && latestVersion !== currentVersion
    ? ("Running ZIP v" + currentVersion + ", Latest ZIP is v" + latestVersion)
    : ("Running ZIP v" + currentVersion);
  lines.push(versionLine);
  if (tab && tab.url) lines.push("Context URL: " + tab.url);
  const subject = "ZIPv" + currentVersion + " Feedback";
  const encode = (value) => encodeURIComponent(String(value == null ? "" : value));
  const url = OUTLOOK_DEEPLINK_COMPOSE_URL
    + "?to=" + encode(ASK_ERIC_EMAIL)
    + "&subject=" + encode(subject)
    + "&body=" + encode(lines.join("\n"));
  try {
    await chrome.tabs.create({ url });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : "Unable to open Outlook Web compose window" };
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
  await ensureThemeStateLoaded().catch(() => {
    themeState.selectedId = DEFAULT_THEME_ID;
    themeState.loaded = true;
  });
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
  const selectedThemeId = getThemeIdFromMenuItemId(info.menuItemId);
  if (selectedThemeId) {
    setTheme(selectedThemeId, { persist: true, refreshMenus: true, broadcast: true }).catch(() => {});
    return;
  }
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
      const activeTab = tabs && tabs[0] ? tabs[0] : null;
      const activeTabId = activeTab && activeTab.id != null ? activeTab.id : null;
      const activeTabUrl = activeTab && activeTab.url ? String(activeTab.url) : "";
      if (activeTabId && isZendeskUrl(activeTabUrl)) {
        sendResponse({ tabId: activeTabId });
        return;
      }
      chrome.tabs.query({ currentWindow: true, url: ZENDESK_ORIGIN + "/*" }, (zdTabs) => {
        const currentWindowZendeskTabId = zdTabs && zdTabs[0] && zdTabs[0].id != null ? zdTabs[0].id : null;
        if (currentWindowZendeskTabId) {
          sendResponse({ tabId: currentWindowZendeskTabId });
          return;
        }
        chrome.tabs.query({ url: ZENDESK_ORIGIN + "/*" }, (allZdTabs) => {
          const anyZendeskTabId = allZdTabs && allZdTabs[0] && allZdTabs[0].id != null ? allZdTabs[0].id : null;
          sendResponse({ tabId: anyZendeskTabId || activeTabId || null });
        });
      });
    });
    return true;
  }
  if (msg.type === "ZIP_GET_THEME") {
    ensureThemeStateLoaded()
      .then(() => sendResponse(getThemeStatePayload()))
      .catch(() => sendResponse(getThemeStatePayload()));
    return true;
  }
  if (msg.type === "ZIP_SET_THEME") {
    setTheme(msg.themeId, { persist: true, refreshMenus: true, broadcast: true })
      .then((payload) => sendResponse({ ok: true, ...payload }))
      .catch((err) => sendResponse({ ok: false, error: err && err.message ? err.message : "Unable to set theme" }));
    return true;
  }
  if (msg.type === "ZIP_CONTEXT_MENU_ACTION") {
    const action = (msg.action || "").trim();
    (async () => {
      if (action.startsWith("theme:")) {
        const requestedTheme = action.slice("theme:".length);
        return setTheme(requestedTheme, { persist: true, refreshMenus: true, broadcast: true });
      }
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
  if (msg.type === "ZIP_ENSURE_ASSIGNED_FILTER_TAB") {
    ensureAssignedFilterTabInCurrentWindow(msg.url)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, error: err && err.message ? err.message : "Unable to open assigned filter tab" }));
    return true;
  }
});
