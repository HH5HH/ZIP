"use strict";

const ZENDESK_ORIGIN = "https://adobeprimetime.zendesk.com";
const ZENDESK_DASHBOARD_URL = ZENDESK_ORIGIN + "/agent/dashboard?brand_id=2379046";
const ASSIGNED_FILTER_PATH = "/agent/filters/36464467";
const ASSIGNED_FILTER_URL = ZENDESK_ORIGIN + ASSIGNED_FILTER_PATH;
const SLACK_WORKSPACE_ORIGIN = "https://adobedx.slack.com";
const SLACK_URL_PATTERNS = ["https://*.slack.com/*"];
const SLACK_API_BASE_URL = "https://slack.com/api/";
const SLACK_OAUTH_USER_AUTHORIZE_URL = "https://slack.com/oauth/v2/authorize";
const SLACK_OAUTH_STORAGE_KEY = "zip.slack.oauth.v1";
const PASS_AI_SLACK_TEAM_ID = "T02CAQ0B2";
const PASS_AI_SLACK_CHANNEL_ID = "C08SX9ZR891";
const PASS_AI_SINGULARITY_MENTION_DEFAULT = "@Singularity";
const SLACK_OAUTH_APP_ID = "A0AGPACM3UG";
// Internal-only extension build. Values pinned to the current ZipTool Slack app.
const SLACK_OAUTH_CLIENT_ID = "2418816376.10567352717968";
const SLACK_OAUTH_CLIENT_SECRET = "31520173933cb712899d53c26e36a936";
const SLACK_OAUTH_REQUIRED_USER_SCOPES = [
  "channels:history",
  "channels:read",
  "groups:history",
  "groups:read",
  "chat:write"
];
const SLACK_OAUTH_USER_SCOPE = SLACK_OAUTH_REQUIRED_USER_SCOPES.join(",");
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
      options.push({
        id: "s2-" + stop.id + "-" + accent.id,
        label: stop.label + " X " + accent.label,
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
const contextMenuBuildState = {
  inFlight: null
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

function isSlackUrl(urlString) {
  try {
    const url = new URL(urlString);
    const host = String(url.hostname || "").toLowerCase();
    return host === "slack.com" || host.endsWith(".slack.com");
  } catch (_) {
    return false;
  }
}

function isSlackWorkspaceUrl(urlString) {
  try {
    const url = new URL(urlString);
    const host = String(url.hostname || "").toLowerCase();
    return host.endsWith(".slack.com");
  } catch (_) {
    return false;
  }
}

function isSlackAuthLikePath(pathname) {
  const path = String(pathname || "").toLowerCase();
  if (!path) return false;
  return (
    path.startsWith("/signin")
    || path.startsWith("/openid/")
    || path.startsWith("/oauth/")
    || path.includes("/ssb/redirect")
  );
}

function isSlackInjectableUrl(urlString) {
  try {
    const url = new URL(urlString);
    if (!isSlackWorkspaceUrl(url.toString())) return false;
    if (isSlackAuthLikePath(url.pathname || "")) return false;
    return true;
  } catch (_) {
    return false;
  }
}

function scoreSlackTabCandidate(tab) {
  if (!tab || tab.id == null) return Number.NEGATIVE_INFINITY;
  let url = null;
  try {
    url = new URL(String(tab.url || ""));
  } catch (_) {
    return Number.NEGATIVE_INFINITY;
  }
  if (!isSlackWorkspaceUrl(url.toString())) return Number.NEGATIVE_INFINITY;

  const full = url.toString();
  const path = String(url.pathname || "").toLowerCase();
  let score = 0;

  if (full.startsWith(SLACK_WORKSPACE_ORIGIN + "/client/")) score += 1200;
  else if (full.startsWith("https://app.slack.com/client/")) score += 1100;
  else if (full.startsWith(SLACK_WORKSPACE_ORIGIN + "/")) score += 900;
  else score += 700;

  if (isSlackAuthLikePath(path)) score -= 1200;
  if (path.includes("/signout")) score -= 600;

  const lastAccessed = Number(tab.lastAccessed || 0);
  if (Number.isFinite(lastAccessed) && lastAccessed > 0) {
    score += Math.min(Math.trunc(lastAccessed / 1000), 500);
  }

  return score;
}

function pickPreferredSlackTab(tabs) {
  const list = Array.isArray(tabs) ? tabs.filter((tab) => tab && tab.id != null) : [];
  if (!list.length) return null;
  let bestTab = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < list.length; i += 1) {
    const candidate = list[i];
    const score = scoreSlackTabCandidate(candidate);
    if (!Number.isFinite(score)) continue;
    if (score > bestScore) {
      bestScore = score;
      bestTab = candidate;
    }
  }
  return bestTab;
}

function generateRandomHex(bytes) {
  const size = Number(bytes);
  const length = Number.isFinite(size) && size > 0 ? Math.trunc(size) : 16;
  const array = new Uint8Array(length);
  try {
    crypto.getRandomValues(array);
  } catch (_) {
    for (let i = 0; i < array.length; i += 1) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  let out = "";
  for (let i = 0; i < array.length; i += 1) {
    out += array[i].toString(16).padStart(2, "0");
  }
  return out;
}

function normalizeSlackTeamId(value) {
  const id = String(value || "").trim().toUpperCase();
  return /^[TE][A-Z0-9]{8,}$/i.test(id) ? id : "";
}

function normalizeSlackUserId(value) {
  const id = String(value || "").trim().toUpperCase();
  return /^[UW][A-Z0-9]{8,}$/i.test(id) ? id : "";
}

function normalizeSlackChannelId(value) {
  const id = String(value || "").trim().toUpperCase();
  return /^C[A-Z0-9]{8,}$/.test(id) ? id : "";
}

function canonicalizeSingularityMention(value) {
  const raw = String(value || "").trim();
  if (!raw) return PASS_AI_SINGULARITY_MENTION_DEFAULT;
  if (/^<@[UW][A-Z0-9]{8,}>$/i.test(raw)) return raw;
  const plain = raw.startsWith("@") ? raw.slice(1).trim() : raw;
  if (!plain) return PASS_AI_SINGULARITY_MENTION_DEFAULT;
  if (plain.toLowerCase() === "singularity") return PASS_AI_SINGULARITY_MENTION_DEFAULT;
  return "@" + plain;
}

function generateSlackClientMessageId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch (_) {}
  return "zip-slack-" + String(Date.now()) + "-" + String(Math.floor(Math.random() * 1000000));
}

function generateSlackLikeTs() {
  const now = Date.now();
  const seconds = Math.floor(now / 1000);
  const micros = String((now % 1000) * 1000 + Math.floor(Math.random() * 1000)).padStart(6, "0");
  return String(seconds) + "." + micros;
}

function extractUrlsFromText(value) {
  const text = String(value || "");
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s)]+/gi);
  if (!matches || !matches.length) return [];
  const unique = [];
  for (let i = 0; i < matches.length; i += 1) {
    const url = String(matches[i] || "").trim();
    if (!url || unique.includes(url)) continue;
    unique.push(url);
    if (unique.length >= 8) break;
  }
  return unique;
}

function buildSingularityRichTextBlocks(singularityUserId, bodyText) {
  const text = String(bodyText || "");
  const elements = [];
  if (singularityUserId) {
    elements.push({ type: "user", user_id: singularityUserId });
    if (text) elements.push({ type: "text", text: " " + text });
  } else if (text) {
    elements.push({ type: "text", text });
  }
  if (!elements.length) return [];
  return [
    {
      type: "rich_text",
      elements: [
        {
          type: "rich_text_section",
          elements
        }
      ]
    }
  ];
}

function resolveExpectedSlackTeamId(...values) {
  for (let i = 0; i < values.length; i += 1) {
    const teamId = normalizeSlackTeamId(values[i]);
    if (teamId) return teamId;
  }
  return "";
}

function buildSlackTeamMismatchError(expectedTeamId, actualTeamId, actualEnterpriseId) {
  const expected = normalizeSlackTeamId(expectedTeamId);
  const actual = normalizeSlackTeamId(actualTeamId);
  const enterprise = normalizeSlackTeamId(actualEnterpriseId);
  if (!expected) return "Slack workspace validation is not configured.";
  if (!actual && !enterprise) return "Slack workspace could not be verified. Expected workspace/team " + expected + ".";
  if (actual && enterprise) {
    return "Slack workspace mismatch. Connected team " + actual + " (enterprise " + enterprise + "), expected team " + expected + ".";
  }
  if (actual) {
    return "Slack workspace mismatch. Connected team " + actual + ", expected team " + expected + ".";
  }
  return "Slack workspace mismatch. Connected enterprise " + enterprise + ", expected team " + expected + ".";
}

function doesSlackTeamMatchExpected(expectedTeamId, actualTeamId, actualEnterpriseId) {
  const expected = normalizeSlackTeamId(expectedTeamId);
  if (!expected) return true;
  const teamId = normalizeSlackTeamId(actualTeamId);
  const enterpriseId = normalizeSlackTeamId(actualEnterpriseId);
  if (!teamId && !enterpriseId) return true;
  return teamId === expected || enterpriseId === expected;
}

function hasSlackScope(scopeCsv, scopeName) {
  const requested = String(scopeName || "").trim().toLowerCase();
  if (!requested) return false;
  const raw = String(scopeCsv || "").trim();
  if (!raw) return false;
  const scopes = raw.split(",").map((part) => String(part || "").trim().toLowerCase()).filter(Boolean);
  return scopes.includes(requested);
}

function getSlackScopeList(scopeCsv) {
  const raw = String(scopeCsv || "").trim();
  if (!raw) return [];
  return raw.split(",").map((part) => String(part || "").trim()).filter(Boolean);
}

function getMissingSlackScopes(grantedScopeCsv, requiredScopes) {
  const granted = new Set(
    getSlackScopeList(grantedScopeCsv)
      .map((scope) => scope.toLowerCase())
      .filter(Boolean)
  );
  const required = Array.isArray(requiredScopes) ? requiredScopes : [];
  return required
    .map((scope) => String(scope || "").trim().toLowerCase())
    .filter(Boolean)
    .filter((scope) => !granted.has(scope));
}

function classifySlackIssueContext(context) {
  const ctx = context && typeof context === "object" ? context : {};
  const errorCode = String(ctx.errorCode || "").trim().toLowerCase();
  const message = String(ctx.errorMessage || ctx.message || "").trim().toLowerCase();
  const httpStatus = Number(ctx.httpStatus);
  const missingInput = !!ctx.missingInput;
  const expectedTeamId = normalizeSlackTeamId(ctx.expectedTeamId);
  const actualTeamId = normalizeSlackTeamId(ctx.actualTeamId);
  const actualEnterpriseId = normalizeSlackTeamId(ctx.actualEnterpriseId);
  const workspaceMismatch = !doesSlackTeamMatchExpected(expectedTeamId, actualTeamId, actualEnterpriseId);

  if (missingInput) {
    return {
      classification: "code_input_validation",
      issueSource: "code",
      recommendedAction: "Provide required request fields before calling Slack APIs."
    };
  }
  if (workspaceMismatch) {
    return {
      classification: "slack_workspace_config",
      issueSource: "slack_config",
      recommendedAction: "Sign into the expected Slack workspace and re-authorize the extension token."
    };
  }
  if (errorCode === "missing_scope") {
    return {
      classification: "slack_scope_config",
      issueSource: "slack_config",
      recommendedAction: "Add the missing Slack scope to the app, reinstall the app, then sign in again."
    };
  }
  if (errorCode === "channel_not_found" || errorCode === "not_in_channel" || errorCode === "is_archived") {
    return {
      classification: "slack_channel_access",
      issueSource: "slack_config",
      recommendedAction: "Verify channel ID, user membership, and channel visibility for the authorized Slack user."
    };
  }
  if (errorCode === "invalid_auth" || errorCode === "not_authed" || errorCode === "token_revoked" || errorCode === "account_inactive") {
    return {
      classification: "slack_auth_config",
      issueSource: "slack_config",
      recommendedAction: "Re-authenticate with Slack and ensure a valid user token is stored."
    };
  }
  if (errorCode === "ratelimited" || httpStatus === 429) {
    return {
      classification: "slack_rate_limit",
      issueSource: "slack_service",
      recommendedAction: "Retry with backoff after the Slack rate limit window resets."
    };
  }
  if (Number.isFinite(httpStatus) && httpStatus >= 500) {
    return {
      classification: "slack_platform_error",
      issueSource: "slack_service",
      recommendedAction: "Retry later; Slack upstream returned a server error."
    };
  }
  if (message.includes("network")) {
    return {
      classification: "runtime_network_error",
      issueSource: "runtime",
      recommendedAction: "Check local network connectivity and retry."
    };
  }
  if (!errorCode && !message && !missingInput) {
    return {
      classification: "ok",
      issueSource: "none",
      recommendedAction: ""
    };
  }
  return {
    classification: "slack_api_error",
    issueSource: "slack_service",
    recommendedAction: "Review Slack API error details and request payload context."
  };
}

function buildSlackDiagnostics(context) {
  const ctx = context && typeof context === "object" ? context : {};
  const expectedTeamId = normalizeSlackTeamId(ctx.expectedTeamId);
  const actualTeamId = normalizeSlackTeamId(ctx.actualTeamId);
  const actualEnterpriseId = normalizeSlackTeamId(ctx.actualEnterpriseId);
  const channelId = String(ctx.channelId || "").trim().toUpperCase();
  const parentTs = String(ctx.parentTs || "").trim();
  const errorCode = String(ctx.errorCode || "").trim().toLowerCase();
  const errorMessage = String(ctx.errorMessage || ctx.message || "").trim();
  const scope = String(ctx.scope || "").trim();
  const scopeList = getSlackScopeList(scope);
  const issue = classifySlackIssueContext({
    ...ctx,
    expectedTeamId,
    actualTeamId,
    actualEnterpriseId,
    errorCode,
    errorMessage
  });
  const notes = Array.isArray(ctx.notes)
    ? ctx.notes.map((note) => String(note || "").trim()).filter(Boolean)
    : [];

  return {
    timestamp: new Date().toISOString(),
    phase: String(ctx.phase || "").trim() || "unknown",
    apiMethod: String(ctx.apiMethod || "").trim(),
    classification: issue.classification,
    issueSource: issue.issueSource,
    likelyCodeIssue: issue.issueSource === "code",
    likelyConfigIssue: issue.issueSource === "slack_config",
    expectedTeamId,
    actualTeamId,
    actualEnterpriseId,
    channelId,
    parentTs,
    httpStatus: Number.isFinite(Number(ctx.httpStatus)) ? Number(ctx.httpStatus) : 0,
    errorCode,
    errorMessage,
    scope,
    scopeList,
    scopeFlags: {
      chatWrite: hasSlackScope(scope, "chat:write"),
      channelsRead: hasSlackScope(scope, "channels:read"),
      channelsHistory: hasSlackScope(scope, "channels:history"),
      groupsRead: hasSlackScope(scope, "groups:read"),
      groupsHistory: hasSlackScope(scope, "groups:history")
    },
    recommendedAction: issue.recommendedAction,
    notes
  };
}

function formatSlackDiagnosticsDetails(diagnostics) {
  const diag = diagnostics && typeof diagnostics === "object" ? diagnostics : null;
  if (!diag) return "";
  const parts = [
    "phase=" + String(diag.phase || "unknown"),
    "classification=" + String(diag.classification || "unknown"),
    "issueSource=" + String(diag.issueSource || "unknown"),
    "apiMethod=" + String(diag.apiMethod || ""),
    "expectedTeam=" + String(diag.expectedTeamId || ""),
    "actualTeam=" + String(diag.actualTeamId || ""),
    "enterprise=" + String(diag.actualEnterpriseId || ""),
    "channel=" + String(diag.channelId || ""),
    "parentTs=" + String(diag.parentTs || ""),
    "httpStatus=" + String(diag.httpStatus || 0),
    "errorCode=" + String(diag.errorCode || ""),
    "scope=" + String(diag.scope || ""),
    "recommendedAction=" + String(diag.recommendedAction || "")
  ];
  if (Array.isArray(diag.notes) && diag.notes.length) {
    parts.push("notes=" + diag.notes.join(" | "));
  }
  return "Diagnostic: " + parts.join("; ");
}

function buildSlackErrorPayload(context) {
  const ctx = context && typeof context === "object" ? context : {};
  const diagnostics = buildSlackDiagnostics(ctx);
  const message = String(ctx.userMessage || ctx.errorMessage || ctx.errorCode || "Slack request failed.").trim() || "Slack request failed.";
  return {
    ok: false,
    error: message,
    details: formatSlackDiagnosticsDetails(diagnostics),
    diagnostics,
    meta: {
      classification: diagnostics.classification,
      issue_source: diagnostics.issueSource
    }
  };
}

function getSlackApiEndpoint(methodName) {
  const raw = String(methodName || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return SLACK_API_BASE_URL + raw.replace(/^\//, "");
}

function buildSlackFormBody(fields) {
  const params = new URLSearchParams();
  const source = fields && typeof fields === "object" ? fields : {};
  const keys = Object.keys(source);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (!key) continue;
    const value = source[key];
    if (value == null) continue;
    if (typeof value === "string") {
      params.set(key, value);
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      params.set(key, String(value));
      continue;
    }
    try {
      params.set(key, JSON.stringify(value));
    } catch (_) {
      params.set(key, String(value));
    }
  }
  return params;
}

async function parseSlackApiResponse(response) {
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (_) {
    payload = null;
  }
  return { text, payload };
}

function getSlackApiError(payload, fallback) {
  const message = payload && typeof payload === "object"
    ? (payload.error || payload.warning || payload.message || payload.detail || "")
    : "";
  return String(message || fallback || "Slack API request failed.").trim() || "Slack API request failed.";
}

async function callSlackApi(methodName, fields, options) {
  const endpoint = getSlackApiEndpoint(methodName);
  if (!endpoint) return { ok: false, error: "Slack API endpoint is missing." };
  const opts = options && typeof options === "object" ? options : {};
  const method = String(opts.httpMethod || "POST").toUpperCase();
  const body = buildSlackFormBody(fields);
  const headers = { Accept: "application/json" };
  const bearerToken = String(opts.bearerToken || "").trim();
  if (bearerToken) headers.Authorization = "Bearer " + bearerToken;
  if (method !== "GET") headers["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";

  let response = null;
  try {
    response = await fetch(endpoint, {
      method,
      cache: "no-store",
      headers,
      body: method === "GET" ? undefined : body
    });
  } catch (err) {
    return { ok: false, error: String(err && err.message || "Slack API network error.") };
  }

  const parsed = await parseSlackApiResponse(response);
  const payload = parsed.payload && typeof parsed.payload === "object" ? parsed.payload : null;
  const payloadOk = payload ? payload.ok !== false : false;
  if (!response.ok || !payloadOk) {
    return {
      ok: false,
      status: response.status,
      error: getSlackApiError(payload, parsed.text || "Slack API request failed."),
      payload: payload || {},
      rawText: parsed.text
    };
  }
  return {
    ok: true,
    status: response.status,
    payload: payload || {},
    rawText: parsed.text
  };
}

function launchWebAuthFlow(details) {
  return new Promise((resolve, reject) => {
    if (!chrome.identity || typeof chrome.identity.launchWebAuthFlow !== "function") {
      reject(new Error("chrome.identity API is unavailable. Add the identity permission."));
      return;
    }
    chrome.identity.launchWebAuthFlow(details, (redirectUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || "Slack OAuth was cancelled."));
        return;
      }
      resolve(String(redirectUrl || ""));
    });
  });
}

function parseOAuthRedirectUrl(urlString) {
  const raw = String(urlString || "").trim();
  if (!raw) return { error: "Missing Slack OAuth callback URL." };
  let parsed = null;
  try {
    parsed = new URL(raw);
  } catch (_) {
    return { error: "Invalid Slack OAuth callback URL." };
  }
  const errorCode = String(parsed.searchParams.get("error") || "").trim();
  const errorDescription = String(parsed.searchParams.get("error_description") || "").trim();
  const code = String(parsed.searchParams.get("code") || "").trim();
  const state = String(parsed.searchParams.get("state") || "").trim();
  if (errorCode) {
    return {
      error: errorDescription ? (errorCode + ": " + errorDescription) : errorCode,
      code: "",
      state
    };
  }
  if (!code) return { error: "Slack OAuth callback did not include an authorization code.", code: "", state };
  return { error: "", code, state };
}

function getSlackSignInConfig() {
  const clientId = String(SLACK_OAUTH_CLIENT_ID || "").trim();
  const clientSecret = String(SLACK_OAUTH_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret) {
    return { ok: false, error: "Slack OAuth client configuration is missing." };
  }
  return { ok: true, clientId, clientSecret };
}

function getSlackOAuthRedirectUris() {
  if (!chrome.identity || typeof chrome.identity.getRedirectURL !== "function") {
    return { user: "" };
  }
  return {
    user: chrome.identity.getRedirectURL("slack-user")
  };
}

async function readSlackOAuthSession() {
  if (!chrome.storage || !chrome.storage.local) return null;
  try {
    const stored = await chrome.storage.local.get(SLACK_OAUTH_STORAGE_KEY);
    const payload = stored && stored[SLACK_OAUTH_STORAGE_KEY];
    return payload && typeof payload === "object" ? payload : null;
  } catch (_) {
    return null;
  }
}

async function writeSlackOAuthSession(session) {
  if (!chrome.storage || !chrome.storage.local) return;
  try {
    await chrome.storage.local.set({ [SLACK_OAUTH_STORAGE_KEY]: session && typeof session === "object" ? session : null });
  } catch (_) {}
}

async function clearSlackOAuthSession() {
  if (!chrome.storage || !chrome.storage.local) return;
  try {
    await chrome.storage.local.remove(SLACK_OAUTH_STORAGE_KEY);
  } catch (_) {}
}

async function runSlackUserScopeFlow(config, options) {
  const opts = options && typeof options === "object" ? options : {};
  const redirectUri = chrome.identity.getRedirectURL("slack-user");
  const expectedState = generateRandomHex(16);
  const authorizeUrl = new URL(SLACK_OAUTH_USER_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("user_scope", SLACK_OAUTH_USER_SCOPE);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", expectedState);
  const teamHint = normalizeSlackTeamId(opts.teamId);
  if (teamHint) authorizeUrl.searchParams.set("team", teamHint);

  const callbackUrl = await launchWebAuthFlow({
    url: authorizeUrl.toString(),
    interactive: true
  });
  const parsed = parseOAuthRedirectUrl(callbackUrl);
  if (parsed.error) {
    throw new Error("Slack user-token authorization failed: " + parsed.error);
  }
  if (!parsed.state || parsed.state !== expectedState) {
    throw new Error("Slack user-token authorization failed state validation.");
  }

  const exchange = await callSlackApi("oauth.v2.access", {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: parsed.code,
    redirect_uri: redirectUri
  });
  if (!exchange.ok) {
    throw new Error("Slack user-token exchange failed: " + getSlackApiError(exchange.payload, exchange.error));
  }

  const payload = exchange.payload || {};
  const authedUser = payload && payload.authed_user && typeof payload.authed_user === "object"
    ? payload.authed_user
    : {};
  const userToken = String(authedUser.access_token || "").trim();
  const grantedScope = String(authedUser.scope || "").trim();
  if (!userToken) {
    throw new Error("Slack OAuth app did not return an authed user access token.");
  }
  const missingScopes = getMissingSlackScopes(grantedScope, SLACK_OAUTH_REQUIRED_USER_SCOPES);
  if (missingScopes.length) {
    throw new Error(
      "Slack OAuth token missing required user scopes: " + missingScopes.join(", ")
      + ". Required: " + SLACK_OAUTH_USER_SCOPE + "."
    );
  }

  const authTest = await callSlackApi("auth.test", {}, { bearerToken: userToken });
  if (!authTest.ok) {
    throw new Error("Slack user token validation failed: " + getSlackApiError(authTest.payload, authTest.error));
  }

  const authPayload = authTest.payload || {};
  return {
    accessToken: userToken,
    scope: grantedScope,
    tokenType: "Bearer",
    appId: String(payload.app_id || "").trim(),
    userId: normalizeSlackUserId(authPayload.user_id || authedUser.id || ""),
    teamId: normalizeSlackTeamId(authPayload.team_id || (payload.team && payload.team.id) || ""),
    enterpriseId: normalizeSlackTeamId(authPayload.enterprise_id || (payload.enterprise && payload.enterprise.id) || ""),
    authPayload
  };
}

async function performSlackOAuthSignIn(options) {
  const config = getSlackSignInConfig();
  if (!config.ok) {
    return {
      ...buildSlackErrorPayload({
        phase: "oauthSignIn",
        apiMethod: "oauth.v2.access",
        errorCode: "local_config_missing",
        errorMessage: config.error,
        userMessage: config.error,
        missingInput: true
      }),
      ready: false
    };
  }

  const opts = options && typeof options === "object" ? options : {};
  const existing = await readSlackOAuthSession();
  const existingTeamId = normalizeSlackTeamId(existing && existing.teamId);
  const requestedTeamId = resolveExpectedSlackTeamId(
    opts.expectedTeamId,
    opts.teamId,
    existingTeamId,
    PASS_AI_SLACK_TEAM_ID
  );
  const userToken = await runSlackUserScopeFlow(config, {
    teamId: requestedTeamId || existingTeamId
  });
  const actualTeamId = normalizeSlackTeamId(userToken.teamId);
  const actualEnterpriseId = normalizeSlackTeamId(userToken.enterpriseId);
  if (!doesSlackTeamMatchExpected(requestedTeamId, actualTeamId, actualEnterpriseId)) {
    const mismatch = buildSlackErrorPayload({
      phase: "oauthSignIn",
      apiMethod: "auth.test",
      expectedTeamId: requestedTeamId,
      actualTeamId,
      actualEnterpriseId,
      errorCode: "workspace_mismatch",
      errorMessage: buildSlackTeamMismatchError(requestedTeamId, actualTeamId, actualEnterpriseId),
      userMessage: buildSlackTeamMismatchError(requestedTeamId, actualTeamId, actualEnterpriseId),
      scope: String(userToken.scope || "")
    });
    return {
      ...mismatch,
      ready: false,
      app_id: String(userToken.appId || SLACK_OAUTH_APP_ID || "").trim(),
      team_id: actualTeamId,
      enterprise_id: actualEnterpriseId,
      expected_team_id: requestedTeamId
    };
  }

  const session = {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    appId: String(userToken.appId || SLACK_OAUTH_APP_ID || "").trim(),
    teamId: actualTeamId,
    enterpriseId: actualEnterpriseId,
    userId: normalizeSlackUserId(userToken.userId),
    userToken: {
      accessToken: userToken.accessToken,
      scope: userToken.scope,
      tokenType: userToken.tokenType
    },
    profile: {
      name: String(userToken.authPayload && (userToken.authPayload.user || userToken.userId) || "").trim(),
      email: "",
      image: ""
    }
  };
  await writeSlackOAuthSession(session);
  return {
    ok: true,
    ready: true,
    app_id: session.appId || "",
    user_id: session.userId,
    team_id: session.teamId,
    enterprise_id: session.enterpriseId,
    expected_team_id: requestedTeamId || "",
    profile: session.profile,
    scope: session.userToken.scope
  };
}

async function getSlackOAuthStatus(options) {
  const opts = options && typeof options === "object" ? options : {};
  const expectedTeamId = resolveExpectedSlackTeamId(
    opts.expectedTeamId,
    opts.teamId,
    PASS_AI_SLACK_TEAM_ID
  );
  const session = await readSlackOAuthSession();
  if (!session || !session.userToken || !session.userToken.accessToken) {
    return {
      ...buildSlackErrorPayload({
        phase: "oauthStatus",
        apiMethod: "auth.test",
        expectedTeamId,
        errorCode: "not_authed",
        errorMessage: "Slack sign-in required.",
        userMessage: "Slack sign-in required."
      }),
      ok: true,
      ready: false,
      expected_team_id: expectedTeamId
    };
  }

  const token = String(session.userToken.accessToken || "").trim();
  if (!token) {
    return {
      ...buildSlackErrorPayload({
        phase: "oauthStatus",
        apiMethod: "auth.test",
        expectedTeamId,
        errorCode: "not_authed",
        errorMessage: "Slack sign-in required.",
        userMessage: "Slack sign-in required.",
        scope: String(session && session.userToken && session.userToken.scope || "")
      }),
      ok: true,
      ready: false,
      expected_team_id: expectedTeamId
    };
  }
  const sessionScope = String(session && session.userToken && session.userToken.scope || "");
  const missingScopes = getMissingSlackScopes(sessionScope, SLACK_OAUTH_REQUIRED_USER_SCOPES);
  if (missingScopes.length) {
    return {
      ...buildSlackErrorPayload({
        phase: "oauthStatus",
        apiMethod: "auth.test",
        expectedTeamId,
        actualTeamId: session && session.teamId,
        actualEnterpriseId: session && session.enterpriseId,
        errorCode: "missing_scope",
        errorMessage: "Slack OAuth token missing required user scopes: " + missingScopes.join(", "),
        userMessage: "Slack OAuth token missing required scopes: " + missingScopes.join(", ") + ". Reinstall/re-authorize the app.",
        scope: sessionScope,
        notes: ["Required user scopes: " + SLACK_OAUTH_USER_SCOPE]
      }),
      ok: true,
      ready: false,
      app_id: String(session && session.appId || SLACK_OAUTH_APP_ID || "").trim(),
      expected_team_id: expectedTeamId,
      missing_scopes: missingScopes,
      required_scopes: SLACK_OAUTH_REQUIRED_USER_SCOPES.slice()
    };
  }

  const authTest = await callSlackApi("auth.test", {}, { bearerToken: token });
  if (!authTest.ok) {
    await clearSlackOAuthSession();
    const statusError = buildSlackErrorPayload({
      phase: "oauthStatus",
      apiMethod: "auth.test",
      expectedTeamId,
      actualTeamId: session && session.teamId,
      actualEnterpriseId: session && session.enterpriseId,
      errorCode: authTest.error,
      errorMessage: getSlackApiError(authTest.payload, authTest.error || "Slack token expired."),
      userMessage: getSlackApiError(authTest.payload, authTest.error || "Slack token expired."),
      httpStatus: authTest.status,
      scope: String(session && session.userToken && session.userToken.scope || "")
    });
    return {
      ...statusError,
      ok: true,
      ready: false,
      app_id: String(session && session.appId || SLACK_OAUTH_APP_ID || "").trim(),
      expected_team_id: expectedTeamId
    };
  }

  const payload = authTest.payload || {};
  const userId = normalizeSlackUserId(payload.user_id || session.userId || "");
  const teamId = normalizeSlackTeamId(payload.team_id || session.teamId || "");
  const enterpriseId = normalizeSlackTeamId(payload.enterprise_id || session.enterpriseId || "");
  const nextSession = {
    ...session,
    updatedAt: Date.now(),
    userId,
    teamId,
    enterpriseId
  };
  await writeSlackOAuthSession(nextSession);
  if (!doesSlackTeamMatchExpected(expectedTeamId, teamId, enterpriseId)) {
    const mismatch = buildSlackErrorPayload({
      phase: "oauthStatus",
      apiMethod: "auth.test",
      expectedTeamId,
      actualTeamId: teamId,
      actualEnterpriseId: enterpriseId,
      errorCode: "workspace_mismatch",
      errorMessage: buildSlackTeamMismatchError(expectedTeamId, teamId, enterpriseId),
      userMessage: buildSlackTeamMismatchError(expectedTeamId, teamId, enterpriseId),
      scope: String(nextSession && nextSession.userToken && nextSession.userToken.scope || "")
    });
    return {
      ...mismatch,
      ok: true,
      ready: false,
      app_id: String(nextSession && nextSession.appId || SLACK_OAUTH_APP_ID || "").trim(),
      user_id: userId,
      team_id: teamId,
      enterprise_id: enterpriseId,
      expected_team_id: expectedTeamId,
      profile: nextSession.profile || {}
    };
  }
  return {
    ok: true,
    ready: true,
    app_id: String(nextSession && nextSession.appId || SLACK_OAUTH_APP_ID || "").trim(),
    user_id: userId,
    team_id: teamId,
    enterprise_id: enterpriseId,
    expected_team_id: expectedTeamId,
    profile: nextSession.profile || {},
    scope: sessionScope
  };
}

async function getSlackUserAccessToken(options) {
  const opts = options && typeof options === "object" ? options : {};
  const expectedTeamId = resolveExpectedSlackTeamId(
    opts.expectedTeamId,
    opts.teamId,
    opts.requiredTeamId,
    PASS_AI_SLACK_TEAM_ID
  );
  const session = await readSlackOAuthSession();
  const token = String(session && session.userToken && session.userToken.accessToken || "").trim();
  if (!token) {
    return {
      ...buildSlackErrorPayload({
        phase: "getUserAccessToken",
        apiMethod: "auth.test",
        expectedTeamId,
        actualTeamId: session && session.teamId,
        actualEnterpriseId: session && session.enterpriseId,
        errorCode: "not_authed",
        errorMessage: "Slack sign-in required. Click Sign in with Slack.",
        userMessage: "Slack sign-in required. Click Sign in with Slack.",
        scope: String(session && session.userToken && session.userToken.scope || "")
      }),
      token: "",
      session,
      app_id: String(session && session.appId || SLACK_OAUTH_APP_ID || "").trim(),
      expectedTeamId
    };
  }
  const teamId = normalizeSlackTeamId(session && session.teamId);
  const enterpriseId = normalizeSlackTeamId(session && session.enterpriseId);
  const sessionScope = String(session && session.userToken && session.userToken.scope || "");
  const missingScopes = getMissingSlackScopes(sessionScope, SLACK_OAUTH_REQUIRED_USER_SCOPES);
  if (missingScopes.length) {
    return {
      ...buildSlackErrorPayload({
        phase: "getUserAccessToken",
        apiMethod: "auth.test",
        expectedTeamId,
        actualTeamId: teamId,
        actualEnterpriseId: enterpriseId,
        errorCode: "missing_scope",
        errorMessage: "Slack OAuth token missing required user scopes: " + missingScopes.join(", "),
        userMessage: "Slack OAuth token missing required scopes: " + missingScopes.join(", ") + ". Reauthorize with Slack.",
        scope: sessionScope,
        notes: ["Required user scopes: " + SLACK_OAUTH_USER_SCOPE]
      }),
      token: "",
      session,
      app_id: String(session && session.appId || SLACK_OAUTH_APP_ID || "").trim(),
      teamId,
      enterpriseId,
      expectedTeamId,
      missing_scopes: missingScopes,
      required_scopes: SLACK_OAUTH_REQUIRED_USER_SCOPES.slice()
    };
  }
  if (!doesSlackTeamMatchExpected(expectedTeamId, teamId, enterpriseId)) {
    const mismatch = buildSlackErrorPayload({
      phase: "getUserAccessToken",
      apiMethod: "auth.test",
      expectedTeamId,
      actualTeamId: teamId,
      actualEnterpriseId: enterpriseId,
      errorCode: "workspace_mismatch",
      errorMessage: buildSlackTeamMismatchError(expectedTeamId, teamId, enterpriseId),
      userMessage: buildSlackTeamMismatchError(expectedTeamId, teamId, enterpriseId),
      scope: String(session && session.userToken && session.userToken.scope || "")
    });
    return {
      ...mismatch,
      token: "",
      session,
      app_id: String(session && session.appId || SLACK_OAUTH_APP_ID || "").trim(),
      teamId,
      enterpriseId,
      expectedTeamId
    };
  }
  return { ok: true, token, session, app_id: String(session && session.appId || SLACK_OAUTH_APP_ID || "").trim(), teamId, enterpriseId, expectedTeamId };
}

function slackTsToEpochMs(ts) {
  const value = Number(ts);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.trunc(value * 1000);
}

function extractRichTextElementsPlain(elements, parts) {
  const rows = Array.isArray(elements) ? elements : [];
  const out = Array.isArray(parts) ? parts : [];
  for (let i = 0; i < rows.length; i += 1) {
    const node = rows[i];
    if (!node || typeof node !== "object") continue;
    const type = String(node.type || "").trim().toLowerCase();
    if (type === "text") {
      out.push(String(node.text || ""));
      continue;
    }
    if (type === "link") {
      out.push(String(node.url || node.text || ""));
      continue;
    }
    if (type === "user") {
      const userId = String(node.user_id || "").trim();
      if (userId) out.push("<@" + userId + ">");
      continue;
    }
    if (Array.isArray(node.elements)) extractRichTextElementsPlain(node.elements, out);
    if (Array.isArray(node.items)) extractRichTextElementsPlain(node.items, out);
  }
  return out;
}

function extractSlackBlocksText(blocks) {
  const rows = Array.isArray(blocks) ? blocks : [];
  const parts = [];
  for (let i = 0; i < rows.length; i += 1) {
    const block = rows[i];
    if (!block || typeof block !== "object") continue;
    if (Array.isArray(block.elements)) extractRichTextElementsPlain(block.elements, parts);
    if (block.text && typeof block.text === "object") {
      const plain = String(block.text.text || "").trim();
      if (plain) parts.push(plain);
    }
  }
  return parts.join("").trim();
}

function extractSlackMessageText(message) {
  if (!message || typeof message !== "object") return "";
  const parts = [];
  const directText = String(message.text || "").trim();
  if (directText) parts.push(directText);

  const blockText = extractSlackBlocksText(message.blocks);
  if (blockText && !parts.includes(blockText)) parts.push(blockText);

  const attachments = Array.isArray(message.attachments) ? message.attachments : [];
  for (let i = 0; i < attachments.length; i += 1) {
    const attachment = attachments[i];
    if (!attachment || typeof attachment !== "object") continue;
    const lines = [attachment.pretext, attachment.title, attachment.text, attachment.fallback, attachment.from_url]
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    if (lines.length) parts.push(lines.join("\n"));
  }

  const files = Array.isArray(message.files) ? message.files : [];
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    if (!file || typeof file !== "object") continue;
    const name = String(file.name || file.title || "attachment").trim();
    const url = String(file.url_private || file.url_private_download || file.permalink || "").trim();
    if (!name && !url) continue;
    parts.push(url ? (name + ": " + url) : name);
  }

  return parts.join("\n").trim();
}

function isSingularityMessage(message, options) {
  if (!message || typeof message !== "object") return false;
  const singularityUserId = normalizeSlackUserId(options && options.singularityUserId);
  const singularityNamePattern = String(options && options.singularityNamePattern || "").trim().toLowerCase();

  const senderUserId = normalizeSlackUserId(message.user || "");
  if (singularityUserId && senderUserId && senderUserId === singularityUserId) return true;

  const botProfile = message.bot_profile && typeof message.bot_profile === "object" ? message.bot_profile : null;
  const profile = message.profile && typeof message.profile === "object" ? message.profile : null;
  const identityBlob = [
    message.username,
    botProfile && botProfile.name,
    botProfile && botProfile.app_name,
    profile && profile.display_name,
    profile && profile.real_name
  ].map((value) => String(value || "").trim().toLowerCase()).join(" ");
  if (!identityBlob || !singularityNamePattern) return false;
  return identityBlob.includes(singularityNamePattern);
}

function hasSlackFinalMarker(message, markerRegexText) {
  const markerSource = String(markerRegexText || "FINAL_RESPONSE").trim();
  const text = extractSlackMessageText(message);
  if (markerSource && text) {
    try {
      const regex = new RegExp(markerSource, "i");
      if (regex.test(text)) return true;
    } catch (_) {
      if (text.toLowerCase().includes(markerSource.toLowerCase())) return true;
    }
  }
  const metadata = message && message.metadata && typeof message.metadata === "object" ? message.metadata : null;
  const eventPayload = metadata && metadata.event_payload && typeof metadata.event_payload === "object"
    ? metadata.event_payload
    : null;
  if (eventPayload) {
    if (eventPayload.FINAL_RESPONSE === true || eventPayload.final_response === true || eventPayload.final === true) {
      return true;
    }
  }
  return false;
}

function isPublicSlackChannelId(channelId) {
  const id = String(channelId || "").trim().toUpperCase();
  return /^C[A-Z0-9]{8,}$/.test(id);
}

async function tryJoinSlackChannelForPosting(channelId, bearerToken) {
  if (!isPublicSlackChannelId(channelId)) {
    return { ok: true, attempted: false, skipped: true };
  }
  const join = await callSlackApi("conversations.join", {
    channel: channelId
  }, { bearerToken });
  if (join.ok) {
    return { ok: true, attempted: true, joined: true };
  }
  return {
    ok: false,
    attempted: true,
    joined: false,
    error: String(join.error || "").trim(),
    payload: join.payload || {}
  };
}

async function sendPassAiSlackMessage(payload) {
  const tokenState = await getSlackUserAccessToken(payload);
  if (!tokenState.ok) return tokenState;
  const channelId = normalizeSlackChannelId(PASS_AI_SLACK_CHANNEL_ID)
    || normalizeSlackChannelId(payload && (payload.channelId || payload.channel_id));
  if (!channelId) {
    return buildSlackErrorPayload({
      phase: "sendMessage",
      apiMethod: "chat.postMessage",
      expectedTeamId: tokenState.expectedTeamId,
      actualTeamId: tokenState.teamId,
      actualEnterpriseId: tokenState.enterpriseId,
      errorCode: "missing_channel_id",
      errorMessage: "Slack channel ID is required.",
      userMessage: "Slack channel ID is required.",
      missingInput: true,
      scope: String(tokenState && tokenState.session && tokenState.session.userToken && tokenState.session.userToken.scope || "")
    });
  }
  const singularityUserId = normalizeSlackUserId(payload && payload.singularityUserId);
  const mention = canonicalizeSingularityMention(payload && payload.mention || PASS_AI_SINGULARITY_MENTION_DEFAULT);
  const question = String(payload && (payload.question || payload.text || payload.messageText) || "").trim();
  if (!question) {
    return buildSlackErrorPayload({
      phase: "sendMessage",
      apiMethod: "chat.postMessage",
      expectedTeamId: tokenState.expectedTeamId,
      actualTeamId: tokenState.teamId,
      actualEnterpriseId: tokenState.enterpriseId,
      channelId,
      errorCode: "missing_question_text",
      errorMessage: "Question text is empty.",
      userMessage: "Question text is empty.",
      missingInput: true,
      scope: String(tokenState && tokenState.session && tokenState.session.userToken && tokenState.session.userToken.scope || "")
    });
  }

  let bodyText = question;
  const singularityTag = singularityUserId ? ("<@" + singularityUserId + ">") : "";
  if (singularityTag && bodyText.startsWith(singularityTag)) {
    bodyText = bodyText.slice(singularityTag.length).trim();
  }
  if (bodyText.startsWith(mention)) {
    bodyText = bodyText.slice(mention.length).trim();
  }
  const text = (mention + " " + bodyText).trim();
  const clientContextTeamId = resolveExpectedSlackTeamId(
    tokenState.expectedTeamId,
    tokenState.teamId,
    tokenState.enterpriseId,
    PASS_AI_SLACK_TEAM_ID
  );
  const urlsForUnfurl = extractUrlsFromText(bodyText);
  const richTextBlocks = buildSingularityRichTextBlocks(singularityUserId, bodyText);
  const postMessageFields = {
    channel: channelId,
    ts: generateSlackLikeTs(),
    type: "message",
    xArgs: "",
    include_channel_perm_error: "true",
    client_msg_id: generateSlackClientMessageId(),
    _x_reason: "webapp_message_send",
    _x_mode: "online",
    _x_sonic: "true",
    _x_app_name: "client"
  };
  if (clientContextTeamId) postMessageFields.client_context_team_id = clientContextTeamId;
  if (richTextBlocks.length) postMessageFields.blocks = richTextBlocks;
  if (!richTextBlocks.length && text) postMessageFields.text = text;
  if (urlsForUnfurl.length) postMessageFields.unfurl = urlsForUnfurl.map((url) => ({ url }));

  // For user-token flows, joining should usually happen in the Slack client UI.
  const tokenScopes = tokenState && tokenState.session && tokenState.session.userToken
    ? String(tokenState.session.userToken.scope || "")
    : "";
  const canJoinViaApi = hasSlackScope(tokenScopes, "channels:join");
  const joinAttempt = canJoinViaApi
    ? await tryJoinSlackChannelForPosting(channelId, tokenState.token)
    : { ok: true, attempted: false, skipped: true };

  const post = await callSlackApi("chat.postMessage", postMessageFields, { bearerToken: tokenState.token });
  if (!post.ok) {
    const errorCode = String(post.error || "").trim().toLowerCase();
    if (errorCode === "channel_not_found") {
      const expectedTeamId = tokenState.expectedTeamId || resolveExpectedSlackTeamId(payload && payload.expectedTeamId, PASS_AI_SLACK_TEAM_ID);
      const actualTeamId = normalizeSlackTeamId(tokenState.teamId || (tokenState.session && tokenState.session.teamId));
      const actualEnterpriseId = normalizeSlackTeamId(tokenState.enterpriseId || (tokenState.session && tokenState.session.enterpriseId));
      const workspaceHint = !doesSlackTeamMatchExpected(expectedTeamId, actualTeamId, actualEnterpriseId)
        ? (" " + buildSlackTeamMismatchError(expectedTeamId, actualTeamId, actualEnterpriseId))
        : "";
      const missingScopeHint = joinAttempt && joinAttempt.attempted && !joinAttempt.ok
        && String(joinAttempt.error || "").trim().toLowerCase() === "missing_scope"
        ? " conversations.join is unavailable for this token type/scope set."
        : "";
      const joinHint = joinAttempt && joinAttempt.attempted && !joinAttempt.ok && joinAttempt.error
        ? (" Slack join preflight failed: " + joinAttempt.error + ".")
        : "";
      const composedMessage = "channel_not_found. Ensure your Slack user has access to channel " + channelId + " and has joined it in Slack."
        + workspaceHint + joinHint + missingScopeHint;
      const diagnosticsPayload = buildSlackErrorPayload({
        phase: "sendMessage",
        apiMethod: "chat.postMessage",
        expectedTeamId,
        actualTeamId,
        actualEnterpriseId,
        channelId,
        errorCode,
        errorMessage: post.error,
        userMessage: composedMessage,
        httpStatus: post.status,
        scope: tokenScopes,
        notes: [
          workspaceHint.trim(),
          joinHint.trim(),
          missingScopeHint.trim()
        ]
      });
      return {
        ...post,
        ...diagnosticsPayload,
        expected_team_id: expectedTeamId || "",
        team_id: actualTeamId || "",
        enterprise_id: actualEnterpriseId || ""
      };
    }
    return {
      ...post,
      ...buildSlackErrorPayload({
        phase: "sendMessage",
        apiMethod: "chat.postMessage",
        expectedTeamId: tokenState.expectedTeamId,
        actualTeamId: tokenState.teamId,
        actualEnterpriseId: tokenState.enterpriseId,
        channelId,
        errorCode: post.error,
        errorMessage: getSlackApiError(post.payload, post.error),
        userMessage: getSlackApiError(post.payload, post.error),
        httpStatus: post.status,
        scope: tokenScopes
      })
    };
  }
  const out = post.payload || {};
  const messageTs = String(out.ts || (out.message && out.message.ts) || "").trim();
  const postedChannel = String(out.channel || channelId).trim();
  return {
    ok: true,
    channel: postedChannel,
    ts: messageTs,
    parent_ts: messageTs,
    thread_ts: messageTs,
    message: out.message || null,
    payload: out
  };
}

async function pollPassAiSlackThread(payload) {
  const tokenState = await getSlackUserAccessToken(payload);
  if (!tokenState.ok) return tokenState;

  const channelId = String(payload && (payload.channelId || payload.channel_id) || "").trim().toUpperCase();
  const parentTs = String(payload && (payload.parentTs || payload.parent_ts || payload.threadTs || payload.thread_ts) || "").trim();
  if (!channelId || !parentTs) {
    return buildSlackErrorPayload({
      phase: "pollThread",
      apiMethod: "conversations.replies",
      expectedTeamId: tokenState.expectedTeamId,
      actualTeamId: tokenState.teamId,
      actualEnterpriseId: tokenState.enterpriseId,
      channelId,
      parentTs,
      errorCode: "missing_channel_or_thread",
      errorMessage: "Slack channel/thread metadata is required.",
      userMessage: "Slack channel/thread metadata is required.",
      missingInput: true,
      scope: String(tokenState && tokenState.session && tokenState.session.userToken && tokenState.session.userToken.scope || "")
    });
  }

  const limitRaw = Number(payload && payload.limit);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.trunc(limitRaw), 200) : 40;
  const cachedLatestUpdates = payload && payload.cached_latest_updates && typeof payload.cached_latest_updates === "object"
    ? payload.cached_latest_updates
    : payload && payload.cachedLatestUpdates && typeof payload.cachedLatestUpdates === "object"
      ? payload.cachedLatestUpdates
      : null;
  const repliesFields = {
    channel: channelId,
    ts: parentTs,
    inclusive: "true",
    oldest: parentTs,
    limit,
    _x_reason: "history-api/fetchReplies",
    _x_mode: "online",
    _x_sonic: "true",
    _x_app_name: "client"
  };
  if (cachedLatestUpdates && Object.keys(cachedLatestUpdates).length) {
    repliesFields.cached_latest_updates = cachedLatestUpdates;
  }
  const replies = await callSlackApi("conversations.replies", repliesFields, { bearerToken: tokenState.token });
  if (!replies.ok) {
    return {
      ...replies,
      ...buildSlackErrorPayload({
        phase: "pollThread",
        apiMethod: "conversations.replies",
        expectedTeamId: tokenState.expectedTeamId,
        actualTeamId: tokenState.teamId,
        actualEnterpriseId: tokenState.enterpriseId,
        channelId,
        parentTs,
        errorCode: replies.error,
        errorMessage: getSlackApiError(replies.payload, replies.error),
        userMessage: getSlackApiError(replies.payload, replies.error),
        httpStatus: replies.status,
        scope: String(tokenState && tokenState.session && tokenState.session.userToken && tokenState.session.userToken.scope || "")
      })
    };
  }

  const payloadObj = replies.payload || {};
  const messages = Array.isArray(payloadObj.messages) ? payloadObj.messages.slice() : [];
  messages.sort((a, b) => slackTsToEpochMs(a && a.ts) - slackTsToEpochMs(b && b.ts));

  const singularityOptions = {
    singularityUserId: payload && payload.singularityUserId,
    singularityNamePattern: payload && payload.singularityNamePattern
  };
  const postingUserId = normalizeSlackUserId(tokenState && tokenState.session && tokenState.session.userId);
  const explicitSingularityTarget = !!(
    normalizeSlackUserId(singularityOptions && singularityOptions.singularityUserId)
    || String(singularityOptions && singularityOptions.singularityNamePattern || "").trim()
  );

  const collectSingularityReplies = (messageRows) => {
    const rows = Array.isArray(messageRows) ? messageRows : [];
    const preferred = [];
    const fallback = [];
    const nonSingularity = [];
    for (let i = 0; i < rows.length; i += 1) {
      const message = rows[i];
      if (!message || typeof message !== "object") continue;
      const ts = String(message.ts || "").trim();
      if (!ts || ts === parentTs) continue;
      const threadTs = String(message.thread_ts || "").trim();
      if (threadTs && threadTs !== parentTs) continue;

      const messageUserId = normalizeSlackUserId(
        message.user
        || (message.user_profile && message.user_profile.id)
        || ""
      );
      const fromPostingUser = !!(postingUserId && messageUserId && messageUserId === postingUserId);
      const fromSingularity = isSingularityMessage(message, singularityOptions);
      if (fromSingularity) {
        preferred.push(message);
        continue;
      }
      if (fromPostingUser) continue;
      nonSingularity.push(message);
      if (!explicitSingularityTarget) fallback.push(message);
    }
    const out = preferred.length ? preferred : fallback;
    out.sort((a, b) => slackTsToEpochMs(a && a.ts) - slackTsToEpochMs(b && b.ts));
    nonSingularity.sort((a, b) => slackTsToEpochMs(a && a.ts) - slackTsToEpochMs(b && b.ts));
    return {
      replyMessages: out,
      nonSingularityMessages: nonSingularity
    };
  };

  const initialReplySet = collectSingularityReplies(messages);
  let replyMessages = initialReplySet.replyMessages;
  let nonSingularityMessages = initialReplySet.nonSingularityMessages;
  let historyMessageCount = 0;
  let threadLatestReplyTs = "";

  // Slack client commonly checks channel history metadata for root latest_reply; do that as fallback.
  const history = await callSlackApi("conversations.history", {
    channel: channelId,
    oldest: parentTs,
    inclusive: "true",
    limit: Math.max(28, Math.min(limit, 200)),
    _x_reason: "history-api/fetchHistory",
    _x_mode: "online",
    _x_sonic: "true",
    _x_app_name: "client"
  }, { bearerToken: tokenState.token });
  if (history.ok) {
    const historyPayload = history.payload || {};
    const historyMessages = Array.isArray(historyPayload.messages) ? historyPayload.messages.slice() : [];
    historyMessages.sort((a, b) => slackTsToEpochMs(a && a.ts) - slackTsToEpochMs(b && b.ts));
    historyMessageCount = historyMessages.length;
    const rootMessage = historyMessages.find((message) => String(message && message.ts || "").trim() === parentTs) || null;
    threadLatestReplyTs = String((rootMessage && rootMessage.latest_reply) || "").trim();

    const latestKnownReplyTs = replyMessages.length
      ? String(replyMessages[replyMessages.length - 1].ts || "").trim()
      : "";
    const shouldFetchIncrementalReplies = !!(
      threadLatestReplyTs
      && threadLatestReplyTs !== parentTs
      && (
        !latestKnownReplyTs
        || slackTsToEpochMs(threadLatestReplyTs) > slackTsToEpochMs(latestKnownReplyTs)
      )
    );

    if (shouldFetchIncrementalReplies) {
      const incremental = await callSlackApi("conversations.replies", {
        channel: channelId,
        ts: parentTs,
        inclusive: "true",
        oldest: threadLatestReplyTs,
        limit,
        _x_reason: "history-api/fetchReplies",
        _x_mode: "online",
        _x_sonic: "true",
        _x_app_name: "client"
      }, { bearerToken: tokenState.token });
      if (incremental.ok) {
        const incrementalPayload = incremental.payload || {};
        const incrementalMessages = Array.isArray(incrementalPayload.messages) ? incrementalPayload.messages.slice() : [];
        const incrementalReplySet = collectSingularityReplies(incrementalMessages);
        const incrementalReplies = incrementalReplySet.replyMessages;
        const incrementalNonSingularity = incrementalReplySet.nonSingularityMessages;
        if (incrementalReplies.length) {
          const mergedByTs = new Map();
          replyMessages.forEach((message) => {
            const ts = String(message && message.ts || "").trim();
            if (ts) mergedByTs.set(ts, message);
          });
          incrementalReplies.forEach((message) => {
            const ts = String(message && message.ts || "").trim();
            if (ts) mergedByTs.set(ts, message);
          });
          replyMessages = Array.from(mergedByTs.values());
          replyMessages.sort((a, b) => slackTsToEpochMs(a && a.ts) - slackTsToEpochMs(b && b.ts));
        }
        if (incrementalNonSingularity.length) {
          const mergedByTs = new Map();
          nonSingularityMessages.forEach((message) => {
            const ts = String(message && message.ts || "").trim();
            if (ts) mergedByTs.set(ts, message);
          });
          incrementalNonSingularity.forEach((message) => {
            const ts = String(message && message.ts || "").trim();
            if (ts) mergedByTs.set(ts, message);
          });
          nonSingularityMessages = Array.from(mergedByTs.values());
          nonSingularityMessages.sort((a, b) => slackTsToEpochMs(a && a.ts) - slackTsToEpochMs(b && b.ts));
        }
      }
    }
  }

  const latestReply = replyMessages.length ? replyMessages[replyMessages.length - 1] : null;
  const finalMarkerRegex = String(payload && payload.finalMarkerRegex || "FINAL_RESPONSE").trim();
  let finalReply = null;
  for (let i = replyMessages.length - 1; i >= 0; i -= 1) {
    if (hasSlackFinalMarker(replyMessages[i], finalMarkerRegex)) {
      finalReply = replyMessages[i];
      break;
    }
  }

  const latestReplyTs = String((latestReply && latestReply.ts) || "").trim();
  const latestReplyText = extractSlackMessageText(latestReply);
  const finalReplyTs = String((finalReply && finalReply.ts) || "").trim();
  const finalReplyText = extractSlackMessageText(finalReply);
  const allReplies = replyMessages.map((message) => ({
    ts: String((message && message.ts) || "").trim(),
    text: extractSlackMessageText(message),
    hasFinalMarker: hasSlackFinalMarker(message, finalMarkerRegex)
  })).filter((row) => row.ts || row.text);
  const allReplyTexts = allReplies.map((row) => String(row.text || "").trim()).filter(Boolean);
  const combinedReplyText = allReplyTexts.join("\n\n").trim();
  const nonSingularityReplies = nonSingularityMessages.map((message) => ({
    ts: String((message && message.ts) || "").trim(),
    text: extractSlackMessageText(message)
  })).filter((row) => row.ts || row.text);
  const latestNonSingularityReply = nonSingularityReplies.length
    ? nonSingularityReplies[nonSingularityReplies.length - 1]
    : null;
  const cachedLatestUpdatesOut = Object.create(null);
  cachedLatestUpdatesOut[parentTs] = parentTs;
  allReplies.forEach((row) => {
    const ts = String(row && row.ts || "").trim();
    if (ts) cachedLatestUpdatesOut[ts] = ts;
  });
  nonSingularityReplies.forEach((row) => {
    const ts = String(row && row.ts || "").trim();
    if (ts) cachedLatestUpdatesOut[ts] = ts;
  });
  if (threadLatestReplyTs) cachedLatestUpdatesOut[threadLatestReplyTs] = threadLatestReplyTs;

  return {
    ok: true,
    status: finalReply ? "final" : "pending",
    channel: channelId,
    parent_ts: parentTs,
    latestReplyTs,
    latestReplyText,
    finalReplyTs,
    finalReplyText,
    hasFinalMarker: !!finalReply,
    final: !!finalReply,
    threadLatestReplyTs,
    allReplies,
    allReplyTexts,
    combinedReplyText,
    repliesCount: replyMessages.length,
    singularityRepliesCount: replyMessages.length,
    nonSingularityRepliesCount: nonSingularityReplies.length,
    latestNonSingularityReplyTs: String((latestNonSingularityReply && latestNonSingularityReply.ts) || "").trim(),
    latestNonSingularityReplyText: String((latestNonSingularityReply && latestNonSingularityReply.text) || "").trim(),
    cachedLatestUpdates: cachedLatestUpdatesOut,
    historyMessageCount,
    messageCount: messages.length
  };
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
      title: "Appearance",
      contexts: MENU_CONTEXTS
    });
  }
  for (const theme of ZIP_THEME_OPTIONS) {
    const createProps = {
      id: getThemeMenuItemId(theme.id),
      title: theme.label,
      type: "radio",
      checked: theme.id === selectedThemeId,
      contexts: MENU_CONTEXTS
    };
    if (grouped) createProps.parentId = MENU_THEME_PARENT;
    await createContextMenuItem(createProps);
  }
}

async function createGroupedContextMenus(currentSide, shouldShowGetLatest) {
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
}

async function createFlatContextMenus(currentSide, shouldShowGetLatest) {
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

async function createContextMenus() {
  if (!chrome.contextMenus) return;
  if (contextMenuBuildState.inFlight) return contextMenuBuildState.inFlight;

  contextMenuBuildState.inFlight = (async () => {
    const currentSide = normalizeSide(sidePanelState.layout) || "unknown";
    const shouldShowGetLatest = !!updateState.updateAvailable;
    themeState.selectedId = normalizeThemeId(themeState.selectedId);

    await new Promise((resolve) => chrome.contextMenus.removeAll(() => resolve()));
    contextMenuState.grouped = true;
    try {
      await createGroupedContextMenus(currentSide, shouldShowGetLatest);
      return;
    } catch (_) {
      // Retry grouped once after a clean reset to avoid transient rebuild races.
      try {
        await new Promise((resolve) => chrome.contextMenus.removeAll(() => resolve()));
        contextMenuState.grouped = true;
        await createGroupedContextMenus(currentSide, shouldShowGetLatest);
        return;
      } catch (retryErr) {
        // Fallback: if grouped action menus are unsupported, create flat action items.
        contextMenuState.grouped = false;
        await new Promise((resolve) => chrome.contextMenus.removeAll(() => resolve()));
        await createFlatContextMenus(currentSide, shouldShowGetLatest);
      }
    }
  })();

  try {
    await contextMenuBuildState.inFlight;
  } finally {
    contextMenuBuildState.inFlight = null;
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
  if (msg.type === "ZIP_SLACK_OAUTH_STATUS") {
    const redirectUris = getSlackOAuthRedirectUris();
    getSlackOAuthStatus({
      expectedTeamId: msg.expectedTeamId,
      teamId: msg.teamId
    })
      .then((result) => sendResponse({ ...(result || {}), redirectUris }))
      .catch((err) => sendResponse({
        ok: false,
        ready: false,
        redirectUris,
        error: err && err.message ? err.message : "Unable to determine Slack sign-in state."
      }));
    return true;
  }
  if (msg.type === "ZIP_SLACK_OAUTH_SIGN_IN") {
    const redirectUris = getSlackOAuthRedirectUris();
    performSlackOAuthSignIn({
      teamId: msg.teamId,
      expectedTeamId: msg.expectedTeamId
    })
      .then((result) => sendResponse({ ...(result || {}), redirectUris }))
      .catch((err) => sendResponse({
        ok: false,
        ready: false,
        redirectUris,
        error: err && err.message ? err.message : "Slack sign-in failed."
      }));
    return true;
  }
  if (msg.type === "ZIP_SLACK_OAUTH_SIGN_OUT") {
    clearSlackOAuthSession()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err && err.message ? err.message : "Unable to clear Slack sign-in state." }));
    return true;
  }
  if (msg.type === "ZIP_PASS_AI_SLACK_SEND") {
    sendPassAiSlackMessage(msg || {})
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "Unable to post Slack message."
      }));
    return true;
  }
  if (msg.type === "ZIP_PASS_AI_SLACK_POLL") {
    pollPassAiSlackThread(msg || {})
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "Unable to poll Slack thread."
      }));
    return true;
  }
  if (msg.type === "ZIP_GET_SLACK_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs && tabs[0] ? tabs[0] : null;
      const activeTabId = activeTab && activeTab.id != null ? activeTab.id : null;
      const activeTabUrl = activeTab && activeTab.url ? String(activeTab.url) : "";
      if (activeTabId && isSlackInjectableUrl(activeTabUrl)) {
        sendResponse({ tabId: activeTabId });
        return;
      }

      chrome.tabs.query({ currentWindow: true, url: SLACK_URL_PATTERNS }, (slackTabs) => {
        const currentWindowSlackTabs = Array.isArray(slackTabs) ? slackTabs : [];
        const preferredCurrentWindowTab = pickPreferredSlackTab(currentWindowSlackTabs);
        if (preferredCurrentWindowTab && preferredCurrentWindowTab.id != null) {
          sendResponse({ tabId: preferredCurrentWindowTab.id });
          return;
        }

        chrome.tabs.query({ url: SLACK_URL_PATTERNS }, (allSlackTabs) => {
          const everySlackTab = Array.isArray(allSlackTabs) ? allSlackTabs : [];
          const preferredSlackTab = pickPreferredSlackTab(everySlackTab);
          sendResponse({ tabId: preferredSlackTab && preferredSlackTab.id != null ? preferredSlackTab.id : null });
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
  if (msg.type === "ZIP_OPEN_SLACK_LOGIN") {
    const url = msg.url || (SLACK_WORKSPACE_ORIGIN + "/signin");
    chrome.windows.create(
      {
        url,
        type: "popup",
        focused: true,
        width: 1060,
        height: 840
      },
      (win) => {
        if (chrome.runtime.lastError) {
          sendResponse({ windowId: null, tabId: null, error: chrome.runtime.lastError.message });
          return;
        }
        const tabs = Array.isArray(win && win.tabs) ? win.tabs : [];
        const firstTab = tabs.length ? tabs[0] : null;
        sendResponse({
          windowId: win && win.id != null ? win.id : null,
          tabId: firstTab && firstTab.id != null ? firstTab.id : null
        });
      }
    );
    return true;
  }
  if (msg.type === "ZIP_CLOSE_WINDOW") {
    const windowId = Number(msg.windowId);
    if (!Number.isFinite(windowId) || windowId <= 0) {
      sendResponse({ ok: false, error: "Invalid window id." });
      return true;
    }
    chrome.windows.remove(windowId, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ ok: true });
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
