"use strict";

try {
  if (typeof importScripts === "function") {
    importScripts("theme-palette-data.js");
  }
} catch (_) {}

const ZENDESK_ORIGIN = "https://adobeprimetime.zendesk.com";
const ZENDESK_DASHBOARD_PATH = "/agent/dashboard?brand_id=2379046";
const ZENDESK_DASHBOARD_URL = ZENDESK_ORIGIN + ZENDESK_DASHBOARD_PATH;
const ASSIGNED_FILTER_PATH = "/agent/filters/36464467";
const ASSIGNED_FILTER_URL = ZENDESK_ORIGIN + ASSIGNED_FILTER_PATH;
const ZENDESK_SESSION_PATH = "/api/v2/users/me/session";
const SLACK_WORKSPACE_ORIGIN = "https://adobedx.slack.com";
const SLACK_WEB_API_ORIGIN = "https://slack.com";
const SLACK_URL_PATTERNS = ["https://*.slack.com/*"];
const SLACK_OPENID_AUTHORIZE_URL = "https://slack.com/openid/connect/authorize";
const SLACK_OPENID_TOKEN_URL = "https://slack.com/api/openid.connect.token";
const SLACK_OPENID_USERINFO_URL = "https://slack.com/api/openid.connect.userInfo";
const SLACK_OPENID_SESSION_STORAGE_KEY = "zip.slack.openid.session.v1";
const ZIP_SLACK_CLIENT_ID_STORAGE_KEY = "zip_slack_client_id";
const ZIP_SLACK_CLIENT_SECRET_STORAGE_KEY = "zip_slack_client_secret";
const ZIP_SLACK_SCOPE_STORAGE_KEY = "zip_slack_scope";
const ZIP_SLACK_REDIRECT_PATH_STORAGE_KEY = "zip_slack_redirect_path";
const ZIP_SLACK_REDIRECT_URI_STORAGE_KEY = "zip_slack_redirect_uri";
// Legacy cleanup only. Team pinning is no longer part of ZIP.KEY validation.
const ZIP_SLACK_EXPECTED_TEAM_ID_STORAGE_KEY = "zip_slack_expected_team_id";
const ZIP_SLACK_BOT_TOKEN_STORAGE_KEY = "zip_slack_bot_token";
const ZIP_SLACK_USER_TOKEN_STORAGE_KEY = "zip_slack_user_token";
const ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY = "zip_slack_oauth_token";
const ZIP_SLACK_KEY_LOADED_STORAGE_KEY = "zip_slack_key_loaded";
const ZIP_SLACK_KEY_META_STORAGE_KEY = "zip_slack_key_meta";
const ZIP_SLACK_SESSION_CACHE_STORAGE_KEY = "zip_slack_session_cache_v1";
const ZIP_SINGULARITY_CHANNEL_ID_STORAGE_KEY = "zip_singularity_channel_id";
const ZIP_SINGULARITY_MENTION_STORAGE_KEY = "zip_singularity_mention";
const ZIP_MIGRATION_V1_DONE_STORAGE_KEY = "zip_migration_v1_done";
const ZIP_MIGRATION_V1_REPORT_STORAGE_KEY = "zip_migration_v1_report";
const SLACK_OIDC_CLIENT_ID_LEGACY_STORAGE_KEY = "zip.passAi.slackOidc.clientId";
const SLACK_OIDC_CLIENT_SECRET_LEGACY_STORAGE_KEY = "zip.passAi.slackOidc.clientSecret";
const SLACK_OIDC_SCOPE_LEGACY_STORAGE_KEY = "zip.passAi.slackOidc.scope";
const SLACK_OIDC_REDIRECT_PATH_LEGACY_STORAGE_KEY = "zip.passAi.slackOidc.redirectPath";
const SLACK_OIDC_REDIRECT_URI_LEGACY_STORAGE_KEY = "zip.passAi.slackOidc.redirectUri";
const SLACK_EXPECTED_TEAM_LEGACY_STORAGE_KEY = "zip.passAi.expectedSlackTeamId";
const SLACK_API_BOT_TOKEN_STORAGE_KEY = "zip.passAi.slackApi.botToken";
const SLACK_API_USER_TOKEN_STORAGE_KEY = "zip.passAi.slackApi.userToken";
const SLACK_API_LEGACY_BOT_TOKEN_STORAGE_KEY = "zip.passAi.slackBotToken";
const SLACK_API_LEGACY_USER_TOKEN_STORAGE_KEY = "zip.passAi.slackUserToken";
const SLACK_SINGULARITY_CHANNEL_LEGACY_STORAGE_KEY = "zip.passAi.singularityChannelId";
const SLACK_SINGULARITY_MENTION_LEGACY_STORAGE_KEY = "zip.passAi.singularityMention";
const ZIP_CONFIG_META_LEGACY_STORAGE_KEY = "zip.config.meta.v1";
// Runtime-config / storage values should populate tokens. Do not hardcode live tokens in source.
const SLACK_API_DEFAULT_BOT_TOKEN = "";
const SLACK_API_SECONDARY_BOT_TOKEN = "";
const SLACK_API_DEFAULT_USER_TOKEN = "";
const SLACK_OPENID_DEFAULT_SCOPES = "openid profile email";
const SLACK_OPENID_DEFAULT_REDIRECT_PATH = "slack-user";
const SLACK_OPENID_STATUS_VERIFY_TTL_MS = 60 * 1000;
const ZIP_PANEL_PATH = "sidepanel.html";
const ZIP_CONTENT_SCRIPT_FILE = "content.js";
const ZENDESK_SUBDOMAIN = (() => {
  try {
    const hostname = new URL(ZENDESK_ORIGIN).hostname;
    return String(hostname || "").split(".")[0] || "adobeprimetime";
  } catch (_) {
    return "adobeprimetime";
  }
})();
const ZENDESK_LOGIN_TAB_URL = "https://" + ZENDESK_SUBDOMAIN + ".zendesk.com";
const ZENDESK_LOGIN_WITH_RETURN_URL = ZENDESK_LOGIN_TAB_URL
  + "/access/login?return_to="
  + encodeURIComponent(ZENDESK_DASHBOARD_URL);
const ZENDESK_SESSION_URL = ZENDESK_LOGIN_TAB_URL + ZENDESK_SESSION_PATH;
const ZENDESK_TAB_QUERY_PATTERN = "*://" + ZENDESK_SUBDOMAIN + ".zendesk.com/*";
const config = { subdomain: ZENDESK_SUBDOMAIN };
const AUTH_POLL_MIN_MS = 5 * 1000;
const AUTH_POLL_MAX_MS = 120 * 1000;
const AUTH_POLL_LOGGED_OUT_MS = 30 * 1000;
const AUTH_ABOUT_TO_EXPIRE_MS = 5 * 60 * 1000;
const MENU_ROOT = "zip_root";
const MENU_TOGGLE_SIDE = "zip_toggle_side";
const MENU_ASK_ERIC = "zip_ask_eric";
const MENU_GET_LATEST = "zip_get_latest";
const MENU_CLEAR_KEY_SEPARATOR = "zip_clear_key_separator";
const MENU_CLEAR_KEY = "zip_clear_key";
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
const MENU_SIDEPANEL_POSITION_LABEL = "⚙ Side panel position";
const MENU_ASK_ERIC_LABEL = "✉ Ask Eric";
const MENU_APPEARANCE_LABEL = "👁 Appearance";
const MENU_CLEAR_KEY_LABEL = "⚠ Clear ZIP.KEY (Reset ZIP)";
const THEME_STORAGE_KEY = "zip.ui.theme.v1";
const ZIP_REQUIRED_SECRET_KEYS = [
  ZIP_SLACK_CLIENT_ID_STORAGE_KEY,
  ZIP_SLACK_CLIENT_SECRET_STORAGE_KEY,
  ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY
];
const ZIP_LOCALSTORAGE_MIGRATION_SOURCE_KEYS = [
  SLACK_OIDC_CLIENT_ID_LEGACY_STORAGE_KEY,
  SLACK_OIDC_CLIENT_SECRET_LEGACY_STORAGE_KEY,
  SLACK_OIDC_SCOPE_LEGACY_STORAGE_KEY,
  SLACK_OIDC_REDIRECT_PATH_LEGACY_STORAGE_KEY,
  SLACK_OIDC_REDIRECT_URI_LEGACY_STORAGE_KEY,
  SLACK_EXPECTED_TEAM_LEGACY_STORAGE_KEY,
  SLACK_API_BOT_TOKEN_STORAGE_KEY,
  SLACK_API_USER_TOKEN_STORAGE_KEY,
  SLACK_API_LEGACY_BOT_TOKEN_STORAGE_KEY,
  SLACK_API_LEGACY_USER_TOKEN_STORAGE_KEY,
  SLACK_SINGULARITY_CHANNEL_LEGACY_STORAGE_KEY,
  SLACK_SINGULARITY_MENTION_LEGACY_STORAGE_KEY,
  "slack_client_id",
  "slack_client_secret",
  "slack_token"
];
const ZIP_SLACK_STORAGE_KEYS = [
  ZIP_SLACK_CLIENT_ID_STORAGE_KEY,
  ZIP_SLACK_CLIENT_SECRET_STORAGE_KEY,
  ZIP_SLACK_SCOPE_STORAGE_KEY,
  ZIP_SLACK_REDIRECT_PATH_STORAGE_KEY,
  ZIP_SLACK_REDIRECT_URI_STORAGE_KEY,
  ZIP_SLACK_EXPECTED_TEAM_ID_STORAGE_KEY,
  ZIP_SLACK_BOT_TOKEN_STORAGE_KEY,
  ZIP_SLACK_USER_TOKEN_STORAGE_KEY,
  ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY,
  ZIP_SLACK_KEY_LOADED_STORAGE_KEY,
  ZIP_SLACK_KEY_META_STORAGE_KEY,
  ZIP_SLACK_SESSION_CACHE_STORAGE_KEY,
  ZIP_SINGULARITY_CHANNEL_ID_STORAGE_KEY,
  ZIP_SINGULARITY_MENTION_STORAGE_KEY
];
const ZIP_SLACK_LEGACY_STORAGE_KEYS = [
  SLACK_OIDC_CLIENT_ID_LEGACY_STORAGE_KEY,
  SLACK_OIDC_CLIENT_SECRET_LEGACY_STORAGE_KEY,
  SLACK_OIDC_SCOPE_LEGACY_STORAGE_KEY,
  SLACK_OIDC_REDIRECT_PATH_LEGACY_STORAGE_KEY,
  SLACK_OIDC_REDIRECT_URI_LEGACY_STORAGE_KEY,
  SLACK_EXPECTED_TEAM_LEGACY_STORAGE_KEY,
  SLACK_API_BOT_TOKEN_STORAGE_KEY,
  SLACK_API_USER_TOKEN_STORAGE_KEY,
  SLACK_API_LEGACY_BOT_TOKEN_STORAGE_KEY,
  SLACK_API_LEGACY_USER_TOKEN_STORAGE_KEY,
  SLACK_SINGULARITY_CHANNEL_LEGACY_STORAGE_KEY,
  SLACK_SINGULARITY_MENTION_LEGACY_STORAGE_KEY,
  ZIP_CONFIG_META_LEGACY_STORAGE_KEY
];
const THEME_PALETTE_DATA = (
  typeof globalThis !== "undefined"
  && globalThis.ZIP_THEME_PALETTE_V2
  && typeof globalThis.ZIP_THEME_PALETTE_V2 === "object"
)
  ? globalThis.ZIP_THEME_PALETTE_V2
  : null;
const THEME_COLOR_STOPS = [
  { id: "dark", label: "Dark", spectrumColorStop: "dark", paletteSet: "dark" },
  { id: "light", label: "Light", spectrumColorStop: "light", paletteSet: "light" }
];
const THEME_ACCENT_SWATCHES = (
  THEME_PALETTE_DATA
  && Array.isArray(THEME_PALETTE_DATA.colors)
  && THEME_PALETTE_DATA.colors.length
)
  ? THEME_PALETTE_DATA.colors.map((entry) => ({ ...entry }))
  : [{ id: "azure-blue", name: "Azure Blue" }];
const THEME_ACCENT_FAMILIES = THEME_ACCENT_SWATCHES.map((accent) => ({
  id: String(accent.id || "").trim().toLowerCase(),
  label: String(accent.name || accent.label || accent.id || "Color").trim() || "Color"
}));
const THEME_ACCENT_IDS = new Set(THEME_ACCENT_FAMILIES.map((accent) => accent.id));
const DEFAULT_THEME_ACCENT_ID = (
  THEME_PALETTE_DATA
  && THEME_ACCENT_IDS.has(String(THEME_PALETTE_DATA.defaultAccentId || "").trim().toLowerCase())
)
  ? String(THEME_PALETTE_DATA.defaultAccentId).trim().toLowerCase()
  : (THEME_ACCENT_FAMILIES[0] ? THEME_ACCENT_FAMILIES[0].id : "azure-blue");
const DEFAULT_THEME_ID = "s2-dark-" + DEFAULT_THEME_ACCENT_ID;
const LEGACY_ACCENT_ID_MAP = (
  THEME_PALETTE_DATA
  && THEME_PALETTE_DATA.legacyAccentMap
  && typeof THEME_PALETTE_DATA.legacyAccentMap === "object"
)
  ? { ...THEME_PALETTE_DATA.legacyAccentMap }
  : {};

function buildLegacyThemeAliases() {
  const aliases = {
    "s2-darkest": DEFAULT_THEME_ID,
    "s2-dark": DEFAULT_THEME_ID,
    "s2-light": "s2-light-" + DEFAULT_THEME_ACCENT_ID,
    "s2-wireframe": "s2-light-" + DEFAULT_THEME_ACCENT_ID
  };
  Object.keys(LEGACY_ACCENT_ID_MAP).forEach((legacyAccentId) => {
    const nextAccentId = String(LEGACY_ACCENT_ID_MAP[legacyAccentId] || "").trim().toLowerCase();
    if (!nextAccentId || !THEME_ACCENT_IDS.has(nextAccentId)) return;
    const legacyId = String(legacyAccentId || "").trim().toLowerCase();
    if (!legacyId) return;
    aliases["s2-" + legacyId] = "s2-dark-" + nextAccentId;
    aliases["s2-dark-" + legacyId] = "s2-dark-" + nextAccentId;
    aliases["s2-light-" + legacyId] = "s2-light-" + nextAccentId;
    aliases["s2-darkest-" + legacyId] = "s2-dark-" + nextAccentId;
    aliases["s2-wireframe-" + legacyId] = "s2-light-" + nextAccentId;
  });
  return aliases;
}

// Legacy IDs are migrated to supported Spectrum 2 light/dark themes.
const LEGACY_THEME_ALIASES = buildLegacyThemeAliases();

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

const zendeskAuthState = {
  loggedIn: false,
  session: null,
  lastSeenAt: 0,
  orgTimeoutMinutes: 0,
  expiresAt: 0,
  timeLeftMs: null,
  source: "init",
  reason: "init",
  checkedAt: 0
};
let sessionPollTimerId = null;
let sessionCheckInFlight = false;
let sessionAboutToExpireSentForDeadline = 0;

function clearSessionPollTimer() {
  if (sessionPollTimerId != null) {
    clearTimeout(sessionPollTimerId);
    sessionPollTimerId = null;
  }
}

function parseDateToMs(value) {
  if (value == null || value === "") return 0;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizeSessionEnvelope(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.session && typeof payload.session === "object") return payload.session;
  return payload;
}

function deriveSessionDeadline(session) {
  const expiresAtMs = parseDateToMs(
    session && (
      session.expires_at
      || session.expire_at
      || session.expiration_at
      || session.end_time
    )
  );
  if (expiresAtMs > 0) return expiresAtMs;

  const lastSeenAtMs = parseDateToMs(
    session && (
      session.last_seen_at
      || session.last_seen
      || session.updated_at
      || session.authenticated_at
      || session.created_at
    )
  );
  const orgTimeoutMinutes = parseNumber(
    session && (
      session.org_timeout_minutes
      || session.organization_timeout_minutes
      || session.timeout_minutes
      || session.idle_timeout_minutes
      || (session.organization && (
        session.organization.org_timeout_minutes
        || session.organization.timeout_minutes
        || session.organization.idle_timeout_minutes
      ))
    )
  );
  if (lastSeenAtMs > 0 && orgTimeoutMinutes > 0) {
    return lastSeenAtMs + Math.trunc(orgTimeoutMinutes * 60 * 1000);
  }
  return 0;
}

function getAuthStatePayload(extra) {
  return {
    loggedIn: !!zendeskAuthState.loggedIn,
    idleUntilUserInitiatesLogin: false,
    session: zendeskAuthState.session,
    lastSeenAt: zendeskAuthState.lastSeenAt || 0,
    orgTimeoutMinutes: zendeskAuthState.orgTimeoutMinutes || 0,
    expiresAt: zendeskAuthState.expiresAt || 0,
    timeLeftMs: Number.isFinite(zendeskAuthState.timeLeftMs) ? zendeskAuthState.timeLeftMs : null,
    source: zendeskAuthState.source || "",
    reason: zendeskAuthState.reason || "",
    checkedAt: zendeskAuthState.checkedAt || 0,
    ...(extra && typeof extra === "object" ? extra : {})
  };
}

function broadcastAuthEvent(type, payload) {
  try {
    chrome.runtime.sendMessage({ type, payload }, () => {
      void chrome.runtime.lastError;
    });
  } catch (_) {}
}

function broadcastZipKeyCleared(payload) {
  try {
    chrome.runtime.sendMessage({
      type: "ZIP_KEY_CLEARED",
      payload: payload && typeof payload === "object" ? payload : {}
    }, () => {
      void chrome.runtime.lastError;
    });
  } catch (_) {}
}

function computeAdaptivePollDelayMs(timeLeftMs, loggedIn) {
  if (!loggedIn) return AUTH_POLL_LOGGED_OUT_MS;
  if (!Number.isFinite(timeLeftMs)) return Math.max(AUTH_POLL_MIN_MS, 60 * 1000);
  const next = Math.trunc(Math.max(0, timeLeftMs) / 4);
  return Math.max(AUTH_POLL_MIN_MS, Math.min(AUTH_POLL_MAX_MS, next));
}

function scheduleSessionCheck(delayMs) {
  clearSessionPollTimer();
  const nextDelay = Number.isFinite(Number(delayMs))
    ? Math.max(AUTH_POLL_MIN_MS, Number(delayMs))
    : AUTH_POLL_LOGGED_OUT_MS;
  sessionPollTimerId = setTimeout(() => {
    sessionPollTimerId = null;
    forceCheck({ reason: "poll" }).catch(() => {});
  }, nextDelay);
}

function setAuthenticatedState(result, options) {
  const source = options && options.source ? String(options.source) : "unknown";
  const reason = options && options.reason ? String(options.reason) : "session_ok";
  const session = normalizeSessionEnvelope(result && result.payload) || {};
  const lastSeenAt = parseDateToMs(
    session.last_seen_at
    || session.last_seen
    || session.updated_at
    || session.authenticated_at
    || session.created_at
  );
  const orgTimeoutMinutes = parseNumber(
    session.org_timeout_minutes
    || session.organization_timeout_minutes
    || session.timeout_minutes
    || session.idle_timeout_minutes
    || (session.organization && (
      session.organization.org_timeout_minutes
      || session.organization.timeout_minutes
      || session.organization.idle_timeout_minutes
    ))
  );
  const expiresAt = deriveSessionDeadline(session);
  const timeLeftMs = expiresAt > 0 ? (expiresAt - Date.now()) : null;

  zendeskAuthState.loggedIn = true;
  zendeskAuthState.session = session;
  zendeskAuthState.lastSeenAt = lastSeenAt;
  zendeskAuthState.orgTimeoutMinutes = orgTimeoutMinutes;
  zendeskAuthState.expiresAt = expiresAt;
  zendeskAuthState.timeLeftMs = Number.isFinite(timeLeftMs) ? timeLeftMs : null;
  zendeskAuthState.source = source;
  zendeskAuthState.reason = reason;
  zendeskAuthState.checkedAt = Date.now();

  const payload = getAuthStatePayload({
    status: Number(result && result.status) || 200
  });
  broadcastAuthEvent("AUTHENTICATED", payload);

  if (expiresAt > 0) {
    const nextTimeLeftMs = expiresAt - Date.now();
    if (nextTimeLeftMs <= AUTH_ABOUT_TO_EXPIRE_MS) {
      if (sessionAboutToExpireSentForDeadline !== expiresAt) {
        sessionAboutToExpireSentForDeadline = expiresAt;
        broadcastAuthEvent("ABOUT_TO_EXPIRE", payload);
      }
    } else {
      sessionAboutToExpireSentForDeadline = 0;
    }
  } else {
    sessionAboutToExpireSentForDeadline = 0;
  }

  if (Number.isFinite(zendeskAuthState.timeLeftMs) && zendeskAuthState.timeLeftMs <= 0) {
    scheduleSessionCheck(AUTH_POLL_MIN_MS);
    return;
  }
  scheduleSessionCheck(computeAdaptivePollDelayMs(zendeskAuthState.timeLeftMs, true));
}

function setLoggedOutState(reason, details) {
  const source = details && details.source ? String(details.source) : "unknown";
  const status = Number(details && details.status) || 0;
  zendeskAuthState.loggedIn = false;
  zendeskAuthState.session = null;
  zendeskAuthState.lastSeenAt = 0;
  zendeskAuthState.orgTimeoutMinutes = 0;
  zendeskAuthState.expiresAt = 0;
  zendeskAuthState.timeLeftMs = null;
  zendeskAuthState.source = source;
  zendeskAuthState.reason = String(reason || "logged_out");
  zendeskAuthState.checkedAt = Date.now();
  sessionAboutToExpireSentForDeadline = 0;

  const payload = getAuthStatePayload({ status });
  broadcastAuthEvent("LOGGED_OUT", payload);
  scheduleSessionCheck(AUTH_POLL_LOGGED_OUT_MS);
}

function isSessionSuccess(result) {
  return Number(result && result.status) === 200;
}

function isSessionLoggedOut(result) {
  const status = Number(result && result.status);
  return status === 401 || status === 403;
}

function isContentScriptUnavailableError(errorMessage) {
  const text = String(errorMessage || "").toLowerCase();
  if (!text) return false;
  return text.includes("receiving end does not exist")
    || text.includes("could not establish connection")
    || text.includes("message port closed");
}

function getTabById(tabId) {
  return new Promise((resolve) => {
    if (tabId == null) {
      resolve(null);
      return;
    }
    try {
      chrome.tabs.get(tabId, (tab) => {
        void chrome.runtime.lastError;
        resolve(tab && typeof tab === "object" ? tab : null);
      });
    } catch (_) {
      resolve(null);
    }
  });
}

function sendMessageToTab(tabId, payload) {
  return new Promise((resolve) => {
    if (tabId == null) {
      resolve({ ok: false, error: "Tab unavailable", response: null });
      return;
    }
    try {
      chrome.tabs.sendMessage(tabId, payload, (response) => {
        const runtimeError = chrome.runtime && chrome.runtime.lastError
          ? String(chrome.runtime.lastError.message || "")
          : "";
        if (runtimeError) {
          resolve({ ok: false, error: runtimeError, response: null });
          return;
        }
        resolve({
          ok: true,
          error: "",
          response: response !== undefined ? response : null
        });
      });
    } catch (err) {
      resolve({
        ok: false,
        error: err && err.message ? err.message : "Unable to message tab.",
        response: null
      });
    }
  });
}

async function tryInjectZendeskContentScript(tabId) {
  if (!chrome.scripting || typeof chrome.scripting.executeScript !== "function") return false;
  const tab = await getTabById(tabId);
  const tabUrl = String(tab && tab.url || "");
  if (!isZendeskUrl(tabUrl)) return false;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [ZIP_CONTENT_SCRIPT_FILE]
    });
    return true;
  } catch (_) {
    return false;
  }
}

async function sendMessageToTabWithZendeskRecovery(tabId, payload) {
  const first = await sendMessageToTab(tabId, payload);
  if (first.ok) return first;
  if (!isContentScriptUnavailableError(first.error)) return first;

  const injected = await tryInjectZendeskContentScript(tabId);
  if (!injected) return first;

  const second = await sendMessageToTab(tabId, payload);
  return second.ok ? second : first;
}

async function queryZendeskTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: ZENDESK_TAB_QUERY_PATTERN });
    return Array.isArray(tabs) ? tabs : [];
  } catch (_) {
    return [];
  }
}

function pickPreferredZendeskTab(tabs) {
  const candidates = Array.isArray(tabs) ? tabs : [];
  if (!candidates.length) return null;
  const activeCurrentWindow = candidates.find((tab) => tab && tab.active && tab.highlighted);
  if (activeCurrentWindow) return activeCurrentWindow;
  const currentWindowTab = candidates.find((tab) => tab && tab.windowId != null);
  return currentWindowTab || candidates[0];
}

function checkZendeskSessionViaTab(tabId) {
  return (async () => {
    if (tabId == null) {
      throw new Error("Zendesk tab unavailable");
    }
    const request = {
      type: "ZIP_SESSION_PROBE",
      url: ZENDESK_SESSION_URL,
      source: "background"
    };
    const sendResult = await sendMessageToTabWithZendeskRecovery(tabId, request);
    if (!sendResult.ok) {
      throw new Error(sendResult.error || "Zendesk content script unavailable");
    }
    const response = sendResult.response;
    if (!response || typeof response !== "object") {
      throw new Error("Zendesk content script did not return a session response");
    }
    return {
      ok: !!response.ok,
      status: Number(response.status) || 0,
      payload: response.payload || null,
      source: "content",
      tabId
    };
  })();
}

async function checkZendeskSessionViaContentScript() {
  const tabs = await queryZendeskTabs();
  if (!tabs.length) {
    throw new Error("No Zendesk tab found for content-script session check.");
  }
  const preferred = pickPreferredZendeskTab(tabs);
  const ordered = preferred
    ? [preferred].concat(tabs.filter((tab) => tab && preferred && tab.id !== preferred.id))
    : tabs.slice();
  let lastError = null;
  for (let i = 0; i < ordered.length; i += 1) {
    const tab = ordered[i];
    if (!tab || tab.id == null) continue;
    try {
      return await checkZendeskSessionViaTab(tab.id);
    } catch (err) {
      lastError = err || new Error("Session probe failed");
    }
  }
  throw lastError || new Error("Unable to probe Zendesk session via content script.");
}

async function checkZendeskSessionViaBackgroundFetch() {
  let payload = null;
  let status = 0;
  try {
    const response = await fetch(ZENDESK_SESSION_URL, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" }
    });
    status = Number(response.status) || 0;
    try {
      payload = await response.json();
    } catch (_) {
      payload = null;
    }
    return {
      ok: status === 200,
      status,
      payload,
      source: "background_fetch"
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      payload: null,
      source: "background_fetch",
      error: err && err.message ? err.message : "Background session fetch failed"
    };
  }
}

async function forceCheck(options) {
  const opts = options && typeof options === "object" ? options : {};
  const reason = String(opts.reason || "force_check");
  if (sessionCheckInFlight) {
    return { ok: false, inFlight: true };
  }

  sessionCheckInFlight = true;
  try {
    let result = null;
    try {
      result = await checkZendeskSessionViaContentScript();
    } catch (err) {
      if (isContentScriptUnavailableError(err && err.message)) {
        result = await checkZendeskSessionViaBackgroundFetch();
      } else {
        result = await checkZendeskSessionViaBackgroundFetch();
      }
    }

    if (isSessionSuccess(result)) {
      setAuthenticatedState(result, { source: result.source, reason });
      return { ok: true, checkedVia: result.source, status: result.status };
    }
    if (isSessionLoggedOut(result)) {
      setLoggedOutState("zendesk_logged_out", {
        source: result.source,
        status: result.status
      });
      return { ok: false, checkedVia: result.source, status: result.status };
    }

    scheduleSessionCheck(computeAdaptivePollDelayMs(zendeskAuthState.timeLeftMs, zendeskAuthState.loggedIn));
    return {
      ok: false,
      checkedVia: result && result.source ? result.source : "unknown",
      status: Number(result && result.status) || 0
    };
  } finally {
    sessionCheckInFlight = false;
  }
}

function handleZendeskContentSessionOk(message) {
  const payload = message && typeof message === "object" ? message : {};
  const status = Number(payload.status) || 200;
  const result = {
    ok: true,
    status: status === 200 ? 200 : status,
    payload: payload.payload || payload.session || {},
    source: "content_event"
  };
  setAuthenticatedState(result, {
    source: "content_event",
    reason: payload.reason || "content_reported_session_ok"
  });
}

function handleZendeskContentLogout(message) {
  const payload = message && typeof message === "object" ? message : {};
  setLoggedOutState(payload.reason || "content_reported_logout", {
    source: "content_event",
    status: Number(payload.status) || 401
  });
}

async function handleLoginClicked() {
  clearSessionPollTimer();
  const q = "*://" + config.subdomain + ".zendesk.com/*";
  const tabs = await new Promise((resolve) => {
    try {
      chrome.tabs.query({ url: q }, (rows) => {
        void chrome.runtime.lastError;
        resolve(Array.isArray(rows) ? rows : []);
      });
    } catch (_) {
      resolve([]);
    }
  });
  let targetTabId = null;
  let openedNewTab = false;
  let lastError = "";
  if (tabs && tabs.length > 0) {
    const preferredTab = pickPreferredZendeskTab(tabs);
    if (preferredTab && preferredTab.id != null) {
      const updatePayload = { active: true, url: ZENDESK_LOGIN_WITH_RETURN_URL };
      const updated = await new Promise((resolve) => {
        try {
          chrome.tabs.update(preferredTab.id, updatePayload, (tab) => {
            const runtimeError = chrome.runtime.lastError;
            if (runtimeError) {
              resolve({ ok: false, error: runtimeError.message || "Unable to update Zendesk tab." });
              return;
            }
            resolve({ ok: true, tab: tab || preferredTab });
          });
        } catch (_) {
          resolve({ ok: false, error: "Unable to update Zendesk tab." });
        }
      });
      if (updated && updated.ok) {
        const updatedTabId = Number(updated.tab && updated.tab.id);
        targetTabId = Number.isFinite(updatedTabId) && updatedTabId > 0
          ? updatedTabId
          : preferredTab.id;
      } else {
        lastError = String(updated && updated.error || "Unable to update Zendesk tab.");
      }
      const focusWindowId = (
        updated
        && updated.tab
        && updated.tab.windowId != null
      )
        ? updated.tab.windowId
        : preferredTab.windowId;
      if (updated && updated.ok && focusWindowId != null) {
        await new Promise((resolve) => {
          try {
            chrome.windows.update(focusWindowId, { focused: true }, () => {
              void chrome.runtime.lastError;
              resolve();
            });
          } catch (_) {
            resolve();
          }
        });
      }
    }
  }
  if (targetTabId == null) {
    const created = await new Promise((resolve) => {
      try {
        chrome.tabs.create({ url: ZENDESK_LOGIN_WITH_RETURN_URL }, (tab) => {
          void chrome.runtime.lastError;
          resolve(tab || null);
        });
      } catch (_) {
        resolve(null);
      }
    });
    targetTabId = created && created.id != null ? created.id : null;
    openedNewTab = true;
    if (targetTabId == null && !lastError) {
      lastError = "Unable to open Zendesk login tab.";
    }
  }
  if (targetTabId == null) {
    return {
      ok: false,
      error: lastError || "Unable to focus or open Zendesk login tab."
    };
  }
  // Do not authenticate inside extension context. Zendesk main tab remains authoritative.
  setTimeout(() => {
    forceCheck({ reason: "login_clicked" }).catch(() => {});
  }, 1500);
  return {
    ok: true,
    tabId: targetTabId,
    openedNewTab
  };
}

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
  if (contextMenuState.grouped) return MENU_ASK_ERIC_LABEL;
  return getZipRootMenuTitle() + " | " + MENU_ASK_ERIC_LABEL;
}

function getClearKeyMenuTitle() {
  if (contextMenuState.grouped) return MENU_CLEAR_KEY_LABEL;
  return getZipRootMenuTitle() + " | " + MENU_CLEAR_KEY_LABEL;
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

function isTrustedZendeskContentSender(sender) {
  const rawUrl = String(
    (sender && sender.url)
    || (sender && sender.tab && sender.tab.url)
    || ""
  ).trim();
  if (!rawUrl) return false;
  try {
    const url = new URL(rawUrl);
    const host = String(url.hostname || "").toLowerCase();
    return host === (config.subdomain + ".zendesk.com");
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

function getSlackWorkspaceHost(value) {
  try {
    return String(new URL(normalizeSlackWorkspaceOrigin(value)).hostname || "").toLowerCase();
  } catch (_) {
    return "";
  }
}

function isAllowedSlackWorkspaceHost(host, workspaceHost) {
  const normalizedHost = String(host || "").toLowerCase();
  if (!normalizedHost || !normalizedHost.endsWith(".slack.com")) return false;
  if (!workspaceHost) return true;
  if (normalizedHost === workspaceHost) return true;
  // Slack workspace sessions frequently route through app.slack.com/client/*.
  if (normalizedHost === "app.slack.com") return true;
  return false;
}

async function queryInjectableSlackTabs(workspaceOrigin) {
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({ url: SLACK_URL_PATTERNS });
  } catch (_) {
    tabs = [];
  }
  const expectedHost = getSlackWorkspaceHost(workspaceOrigin || SLACK_WORKSPACE_ORIGIN);
  const filtered = [];
  for (let i = 0; i < tabs.length; i += 1) {
    const tab = tabs[i];
    if (!tab || tab.id == null) continue;
    const tabUrl = String(tab.url || "");
    if (!isSlackInjectableUrl(tabUrl)) continue;
    if (expectedHost) {
      try {
        const tabHost = String(new URL(tabUrl).hostname || "").toLowerCase();
        if (!isAllowedSlackWorkspaceHost(tabHost, expectedHost)) continue;
      } catch (_) {
        continue;
      }
    }
    filtered.push(tab);
  }
  return filtered;
}

function sendSlackInnerRequestToTab(tabId, inner) {
  return new Promise((resolve, reject) => {
    const numericTabId = Number(tabId);
    if (!Number.isFinite(numericTabId) || numericTabId <= 0) {
      reject(new Error("Slack tab id is invalid."));
      return;
    }
    const requestId = "zip_slack_bg_" + String(Date.now()) + "_" + String(Math.random()).slice(2);
    chrome.tabs.sendMessage(
      numericTabId,
      { type: "ZIP_FROM_BACKGROUND", requestId, inner },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || "Slack tab request failed."));
          return;
        }
        if (!response || response.type !== "ZIP_RESPONSE") {
          reject(new Error("Slack tab did not return a ZIP response."));
          return;
        }
        if (response.error) {
          reject(new Error(String(response.error)));
          return;
        }
        const result = response.result && typeof response.result === "object"
          ? response.result
          : null;
        if (!result) {
          reject(new Error("Slack tab returned an empty result."));
          return;
        }
        resolve(result);
      }
    );
  });
}

function sleepMs(ms) {
  const timeoutMs = Math.max(0, Number(ms) || 0);
  return new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  });
}

function waitForTabComplete(tabId, timeoutMs) {
  const targetTabId = Number(tabId);
  if (!Number.isFinite(targetTabId) || targetTabId <= 0) return Promise.resolve();
  const limitMs = Math.max(500, Number(timeoutMs) || 7000);
  return new Promise((resolve) => {
    let done = false;
    let timerId = null;
    const finish = () => {
      if (done) return;
      done = true;
      try {
        if (chrome.tabs && chrome.tabs.onUpdated && typeof chrome.tabs.onUpdated.removeListener === "function") {
          chrome.tabs.onUpdated.removeListener(onUpdated);
        }
      } catch (_) {}
      if (timerId != null) clearTimeout(timerId);
      resolve();
    };
    const onUpdated = (updatedTabId, changeInfo) => {
      if (Number(updatedTabId) !== targetTabId) return;
      if (changeInfo && changeInfo.status === "complete") finish();
    };
    try {
      if (chrome.tabs && chrome.tabs.onUpdated && typeof chrome.tabs.onUpdated.addListener === "function") {
        chrome.tabs.onUpdated.addListener(onUpdated);
      }
    } catch (_) {}
    timerId = setTimeout(finish, limitMs);
    try {
      chrome.tabs.get(targetTabId, (tab) => {
        void chrome.runtime.lastError;
        if (!tab || tab.status === "complete") finish();
      });
    } catch (_) {
      finish();
    }
  });
}

function openSlackWorkspaceBootstrapTab(workspaceOrigin) {
  const url = normalizeSlackWorkspaceOrigin(workspaceOrigin || SLACK_WORKSPACE_ORIGIN) + "/";
  return new Promise((resolve) => {
    try {
      chrome.tabs.create({ url, active: false }, (tab) => {
        void chrome.runtime.lastError;
        resolve(tab || null);
      });
    } catch (_) {
      resolve(null);
    }
  });
}

function closeTabSilently(tabId) {
  const targetTabId = Number(tabId);
  if (!Number.isFinite(targetTabId) || targetTabId <= 0) return Promise.resolve(false);
  return new Promise((resolve) => {
    try {
      chrome.tabs.remove(targetTabId, () => {
        void chrome.runtime.lastError;
        resolve(true);
      });
    } catch (_) {
      resolve(false);
    }
  });
}

async function slackSendMarkdownToSelfViaWorkspaceSession(input, reasonCode) {
  const body = input && typeof input === "object" ? input : {};
  const workspaceOrigin = normalizeSlackWorkspaceOrigin(body.workspaceOrigin || SLACK_WORKSPACE_ORIGIN);
  const shouldBootstrapTab = body.autoBootstrapSlackTab !== false;
  let bootstrapTabId = null;
  try {
    let tabs = await queryInjectableSlackTabs(workspaceOrigin);
    if (!tabs.length && shouldBootstrapTab) {
      const bootstrapTab = await openSlackWorkspaceBootstrapTab(workspaceOrigin);
      if (bootstrapTab && bootstrapTab.id != null) {
        bootstrapTabId = Number(bootstrapTab.id);
        await waitForTabComplete(bootstrapTabId, 7000);
        await sleepMs(800);
        tabs = await queryInjectableSlackTabs(workspaceOrigin);
      }
    }

    const preferred = pickPreferredSlackTab(tabs);
    const orderedTabs = preferred
      ? [preferred].concat(tabs.filter((tab) => tab && preferred && tab.id !== preferred.id))
      : tabs.slice();
    if (!orderedTabs.length) {
      return {
        ok: false,
        code: "slack_workspace_tab_missing",
        error: "No active Slack workspace tab is available for session send."
      };
    }

    let lastError = "";
    for (let i = 0; i < orderedTabs.length; i += 1) {
      const tab = orderedTabs[i];
      if (!tab || tab.id == null) continue;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await sendSlackInnerRequestToTab(tab.id, {
            action: "slackAuthTest",
            workspaceOrigin
          }).catch(() => null);

          const result = await sendSlackInnerRequestToTab(tab.id, {
            action: "slackSendMarkdownToSelf",
            workspaceOrigin,
            userId: body.userId || body.user_id || "",
            userName: body.userName || body.user_name || "",
            avatarUrl: body.avatarUrl || body.avatar_url || "",
            markdownText: body.markdownText || body.text || body.messageText || ""
          });
          if (result && result.ok === true) {
            let unreadMarked = result.unread_marked === true;
            const deliveredChannel = String(result.channel || "").trim();
            const deliveredTs = String(result.ts || "").trim();
            if (!unreadMarked && deliveredChannel && deliveredTs) {
              await sleepMs(260);
              const markResult = await sendSlackInnerRequestToTab(tab.id, {
                action: "slackMarkUnread",
                workspaceOrigin,
                channelId: deliveredChannel,
                ts: deliveredTs
              }).catch(() => null);
              unreadMarked = !!(markResult && markResult.ok === true && markResult.unread_marked === true);
            }
            return {
              ok: true,
              channel: deliveredChannel,
              ts: deliveredTs,
              user_id: String(result.user_id || body.userId || body.user_id || "").trim(),
              team_id: String(result.team_id || "").trim(),
              user_name: String(result.user_name || body.userName || body.user_name || "").trim(),
              avatar_url: String(result.avatar_url || body.avatarUrl || body.avatar_url || "").trim(),
              delivery_mode: "workspace_session_dm",
              unread_marked: unreadMarked,
              fallback_reason: String(reasonCode || "").trim()
            };
          }
          lastError = String((result && result.error) || "Slack workspace session send failed.");
        } catch (err) {
          lastError = err && err.message ? err.message : "Slack workspace session send failed.";
        }
        const lower = String(lastError || "").toLowerCase();
        const retryable = lower.includes("token not found")
          || lower.includes("session token")
          || lower.includes("waiting for web token capture")
          || lower.includes("complete login first");
        if (!retryable || attempt >= 2) break;
        await sleepMs(700);
      }
    }

    return {
      ok: false,
      code: "slack_workspace_session_unavailable",
      error: String(lastError || "Slack workspace session send failed.")
    };
  } finally {
    if (bootstrapTabId != null && body.keepBootstrapTab !== true) {
      await closeTabSilently(bootstrapTabId);
    }
  }
}

async function slackMarkUnreadViaWorkspaceSession(input, reasonCode) {
  const body = input && typeof input === "object" ? input : {};
  const workspaceOrigin = normalizeSlackWorkspaceOrigin(body.workspaceOrigin || SLACK_WORKSPACE_ORIGIN);
  const channelId = normalizeSlackChannelId(body.channelId || body.channel_id || body.channel);
  const messageTs = String(body.ts || body.messageTs || body.message_ts || "").trim();
  if (!channelId || !messageTs) {
    return {
      ok: false,
      code: "slack_mark_unread_payload_invalid",
      error: "Slack unread marker requires channel and timestamp."
    };
  }
  const shouldBootstrapTab = body.autoBootstrapSlackTab !== false;
  let bootstrapTabId = null;
  try {
    let tabs = await queryInjectableSlackTabs(workspaceOrigin);
    if (!tabs.length && shouldBootstrapTab) {
      const bootstrapTab = await openSlackWorkspaceBootstrapTab(workspaceOrigin);
      if (bootstrapTab && bootstrapTab.id != null) {
        bootstrapTabId = Number(bootstrapTab.id);
        await waitForTabComplete(bootstrapTabId, 7000);
        await sleepMs(800);
        tabs = await queryInjectableSlackTabs(workspaceOrigin);
      }
    }

    const preferred = pickPreferredSlackTab(tabs);
    const orderedTabs = preferred
      ? [preferred].concat(tabs.filter((tab) => tab && preferred && tab.id !== preferred.id))
      : tabs.slice();
    if (!orderedTabs.length) {
      return {
        ok: false,
        code: "slack_workspace_tab_missing",
        error: "No active Slack workspace tab is available for unread marking."
      };
    }

    let lastError = "";
    for (let i = 0; i < orderedTabs.length; i += 1) {
      const tab = orderedTabs[i];
      if (!tab || tab.id == null) continue;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const result = await sendSlackInnerRequestToTab(tab.id, {
            action: "slackMarkUnread",
            workspaceOrigin,
            channelId,
            ts: messageTs
          });
          if (result && result.ok === true && result.unread_marked === true) {
            return {
              ok: true,
              channel: channelId,
              ts: messageTs,
              unread_marked: true,
              delivery_mode: "workspace_session_mark_unread",
              fallback_reason: String(reasonCode || "").trim()
            };
          }
          lastError = String((result && result.error) || "Slack workspace unread mark failed.");
        } catch (err) {
          lastError = err && err.message ? err.message : "Slack workspace unread mark failed.";
        }
        const lower = String(lastError || "").toLowerCase();
        const retryable = lower.includes("token not found")
          || lower.includes("session token")
          || lower.includes("waiting for web token capture")
          || lower.includes("complete login first");
        if (!retryable || attempt >= 2) break;
        await sleepMs(700);
      }
    }

    return {
      ok: false,
      code: "slack_workspace_mark_unread_failed",
      error: String(lastError || "Slack workspace unread mark failed.")
    };
  } finally {
    if (bootstrapTabId != null && body.keepBootstrapTab !== true) {
      await closeTabSilently(bootstrapTabId);
    }
  }
}

function normalizeSlackTeamId(value) {
  const id = String(value || "").trim().toUpperCase();
  return /^T[A-Z0-9]{8,}$/.test(id) ? id : "";
}

function normalizeSlackUserId(value) {
  const id = String(value || "").trim().toUpperCase();
  return /^[UW][A-Z0-9]{8,}$/.test(id) ? id : "";
}

function normalizeSlackAvatarUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch (_) {
    return "";
  }
}

function normalizeSlackDisplayName(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text || text.length > 80) return "";
  if (/^:[a-z0-9_+\-]{1,64}:$/i.test(text)) return "";
  if (normalizeSlackUserId(text)) return "";
  const lower = text.toLowerCase();
  if (
    lower === "you"
    || lower === "profile"
    || lower === "account"
    || lower === "user menu"
    || lower === "menu"
    || lower === "zip"
    || lower === "ziptool"
  ) {
    return "";
  }
  return text;
}

function pickSlackDisplayNameFromProfile(profile, userRecord) {
  const user = userRecord && typeof userRecord === "object" ? userRecord : {};
  const source = profile && typeof profile === "object" ? profile : {};
  const candidates = [
    source.display_name_normalized,
    source.display_name,
    source.real_name_normalized,
    source.real_name,
    user.real_name,
    user.name
  ];
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = normalizeSlackDisplayName(candidates[i]);
    if (candidate) return candidate;
  }
  return "";
}

function pickSlackAvatarFromProfile(profile) {
  const source = profile && typeof profile === "object" ? profile : {};
  const candidates = [
    source.image_original,
    source.image_512,
    source.image_192,
    source.image_128,
    source.image_72,
    source.image_48,
    source.image_32,
    source.image_24
  ];
  for (let i = 0; i < candidates.length; i += 1) {
    const avatar = normalizeSlackAvatarUrl(candidates[i]);
    if (avatar) return avatar;
  }
  return "";
}

function extractSlackIdentityFromUsersProfilePayload(payload) {
  const source = payload && typeof payload === "object" ? payload : {};
  const profile = source.profile && typeof source.profile === "object" ? source.profile : {};
  return {
    userName: pickSlackDisplayNameFromProfile(profile, null),
    avatarUrl: pickSlackAvatarFromProfile(profile)
  };
}

function extractSlackIdentityFromUsersInfoPayload(payload) {
  const source = payload && typeof payload === "object" ? payload : {};
  const user = source.user && typeof source.user === "object" ? source.user : {};
  const profile = user.profile && typeof user.profile === "object" ? user.profile : {};
  return {
    userName: pickSlackDisplayNameFromProfile(profile, user),
    avatarUrl: pickSlackAvatarFromProfile(profile)
  };
}

async function fetchSlackIdentityViaApi(workspaceOrigin, token, userId) {
  const resolvedUserId = normalizeSlackUserId(userId);
  const identity = {
    userName: "",
    avatarUrl: "",
    avatarErrorCode: "",
    avatarErrorMessage: ""
  };
  const applyIdentity = (nextIdentity) => {
    const candidate = nextIdentity && typeof nextIdentity === "object" ? nextIdentity : {};
    if (!identity.userName) identity.userName = normalizeSlackDisplayName(candidate.userName || "");
    if (!identity.avatarUrl) identity.avatarUrl = normalizeSlackAvatarUrl(candidate.avatarUrl || "");
  };
  const captureAvatarError = (result, fallbackMessage) => {
    if (identity.avatarUrl) return;
    const source = result && typeof result === "object" ? result : {};
    const code = String(
      source.code
      || (source.payload && source.payload.error)
      || ""
    ).trim().toLowerCase();
    const message = String(source.error || fallbackMessage || "").trim();
    if (code && !identity.avatarErrorCode) identity.avatarErrorCode = code;
    if (message && !identity.avatarErrorMessage) identity.avatarErrorMessage = message;
  };

  const targetOrigins = [];
  const pushOrigin = (value) => {
    const normalized = normalizeSlackWorkspaceOrigin(value);
    if (!normalized) return;
    if (!targetOrigins.includes(normalized)) targetOrigins.push(normalized);
  };
  // Prefer canonical Slack API origin for user-token profile lookups.
  pushOrigin(SLACK_WEB_API_ORIGIN);
  // Keep workspace endpoint as fallback for legacy/session-adjacent tokens.
  pushOrigin(workspaceOrigin);

  for (let originIdx = 0; originIdx < targetOrigins.length; originIdx += 1) {
    const origin = targetOrigins[originIdx];
    const selfProfileResult = await postSlackApiWithBearerToken(
      origin,
      "/api/users.profile.get",
      {
        _x_reason: "zip-slacktivation-profile-self-bg"
      },
      token
    );
    if (selfProfileResult && selfProfileResult.ok === true) {
      applyIdentity(extractSlackIdentityFromUsersProfilePayload(selfProfileResult.payload));
    } else {
      captureAvatarError(selfProfileResult, "users.profile.get(self) failed.");
    }

    if ((!identity.userName || !identity.avatarUrl) && resolvedUserId) {
      const profileByIdResult = await postSlackApiWithBearerToken(
        origin,
        "/api/users.profile.get",
        {
          user: resolvedUserId,
          _x_reason: "zip-slacktivation-profile-user-bg"
        },
        token
      );
      if (profileByIdResult && profileByIdResult.ok === true) {
        applyIdentity(extractSlackIdentityFromUsersProfilePayload(profileByIdResult.payload));
      } else {
        captureAvatarError(profileByIdResult, "users.profile.get(user) failed.");
      }
    }

    if ((!identity.userName || !identity.avatarUrl) && resolvedUserId) {
      const userInfoResult = await postSlackApiWithBearerToken(
        origin,
        "/api/users.info",
        {
          user: resolvedUserId,
          _x_reason: "zip-slacktivation-users-info-bg"
        },
        token
      );
      if (userInfoResult && userInfoResult.ok === true) {
        applyIdentity(extractSlackIdentityFromUsersInfoPayload(userInfoResult.payload));
      } else {
        captureAvatarError(userInfoResult, "users.info failed.");
      }
    }

    if (identity.userName && identity.avatarUrl) break;
  }

  return identity;
}

function normalizeSlackApiToken(value) {
  const token = String(value || "").trim();
  if (!token) return "";
  return /^(xox[a-z]-|xoxe\.xox[a-z]-)/i.test(token) ? token : "";
}

function isSlackUserOAuthToken(value) {
  const token = normalizeSlackApiToken(value);
  if (!token) return false;
  // User/session-flavored tokens are eligible; bot tokens are not.
  return !/^xoxb-/i.test(token) && !/^xoxe\.xoxb-/i.test(token);
}

function toPriorSlackTs(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d+)\.(\d+)$/);
  if (!match) {
    const asInt = Number.parseInt(raw, 10);
    if (Number.isFinite(asInt) && asInt > 0) return String(asInt - 1) + ".999999";
    return "0.000000";
  }
  let seconds = Number.parseInt(match[1], 10);
  let micros = Number.parseInt(match[2].slice(0, 6).padEnd(6, "0"), 10);
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  if (!Number.isFinite(micros) || micros < 0) micros = 0;
  if (micros > 0) {
    micros -= 1;
  } else if (seconds > 0) {
    seconds -= 1;
    micros = 999999;
  }
  return String(seconds) + "." + String(micros).padStart(6, "0");
}

async function markSlackMessageUnreadViaApiToken(workspaceOrigin, token, channelId, messageTs) {
  const targetChannel = normalizeSlackChannelId(channelId);
  const targetTs = String(messageTs || "").trim();
  if (!targetChannel || !targetTs) return false;

  const delays = [0, 260, 860];
  for (let pass = 0; pass < delays.length; pass += 1) {
    if (delays[pass] > 0) await sleepMs(delays[pass]);
    const priorTs = toPriorSlackTs(targetTs);
    const attempts = [
      {
        path: "/api/conversations.mark",
        fields: {
          channel: targetChannel,
          ts: priorTs,
          _x_reason: "zip-slack-it-to-me-mark-unread-bg"
        }
      }
    ];
    if (priorTs !== "0.000000") {
      attempts.push({
        path: "/api/conversations.mark",
        fields: {
          channel: targetChannel,
          ts: "0.000000",
          _x_reason: "zip-slack-it-to-me-mark-unread-bg-fallback"
        }
      });
    }
    attempts.push({
      path: "/api/subscriptions.thread.mark",
      fields: {
        channel: targetChannel,
        thread_ts: targetTs,
        ts: targetTs,
        read: "false",
        _x_reason: "zip-slack-it-to-me-thread-unread-bg"
      }
    });

    for (let i = 0; i < attempts.length; i += 1) {
      const attempt = attempts[i];
      try {
        const result = await postSlackApiWithBearerToken(
          workspaceOrigin,
          attempt.path,
          attempt.fields,
          token
        );
        if (result && result.ok) return true;
      } catch (_) {}
    }
  }
  return false;
}

function normalizeSlackWorkspaceOrigin(value) {
  const raw = String(value || "").trim();
  if (!raw) return SLACK_WORKSPACE_ORIGIN;
  try {
    const parsed = new URL(raw);
    const host = String(parsed.hostname || "").toLowerCase();
    if (host !== "slack.com" && !host.endsWith(".slack.com")) return SLACK_WORKSPACE_ORIGIN;
    return parsed.origin;
  } catch (_) {
    return SLACK_WORKSPACE_ORIGIN;
  }
}

function normalizeSlackChannelId(value) {
  const channelId = String(value || "").trim().toUpperCase();
  return /^[CGD][A-Z0-9]{8,}$/.test(channelId) ? channelId : "";
}

function normalizeSingularityMention(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^<@[UW][A-Z0-9]{8,}>$/i.test(raw)) return raw;
  const plain = raw.startsWith("@") ? raw.slice(1).trim() : raw;
  if (!plain) return "";
  return "@" + plain;
}

function normalizeZipRedirectPath(value) {
  const raw = String(value || "").trim().replace(/^\/+/, "");
  if (!raw) return SLACK_OPENID_DEFAULT_REDIRECT_PATH;
  const normalized = raw.replace(/[^a-zA-Z0-9._/-]/g, "");
  if (!normalized || normalized.includes("..")) return SLACK_OPENID_DEFAULT_REDIRECT_PATH;
  return normalized;
}

function normalizeSlackOpenIdRedirectUri(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let parsed = null;
  try {
    parsed = new URL(raw);
  } catch (_) {
    parsed = null;
  }
  if (!parsed) return "";
  const host = String(parsed.hostname || "").toLowerCase();
  if (parsed.protocol !== "https:") return "";
  if (!host || !host.endsWith(".chromiumapp.org")) return "";
  const pathname = String(parsed.pathname || "").trim() || "/";
  return parsed.origin + pathname;
}

function normalizeZipConfigServiceName(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  return raw.replace(/[^a-z0-9._-]/g, "");
}

function normalizeZipConfigServices(value) {
  const next = [];
  const seen = new Set();
  const add = (entry) => {
    const normalized = normalizeZipConfigServiceName(entry);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    next.push(normalized);
  };
  if (Array.isArray(value)) {
    value.forEach(add);
  } else if (typeof value === "string") {
    value.split(/[\s,]+/).forEach(add);
  } else if (value && typeof value === "object") {
    Object.keys(value).forEach((key) => {
      if (value[key]) add(key);
    });
  }
  return next;
}

function normalizeZipKeyMeta(input) {
  const meta = input && typeof input === "object" ? input : {};
  return {
    services: normalizeZipConfigServices(meta.services || meta.service || meta.features),
    keyVersion: String(meta.keyVersion || meta.version || "").trim(),
    importedAt: String(meta.importedAt || "").trim() || nowIso(),
    importedBuild: String(meta.importedBuild || getZipBuildVersion() || "").trim(),
    source: String(meta.source || "zip-key").trim() || "zip-key"
  };
}

function normalizeZipSecretConfig(input) {
  const source = input && typeof input === "object" ? input : {};
  const servicesSource = source.services && typeof source.services === "object" ? source.services : {};
  const slacktivationSource = servicesSource.slacktivation && typeof servicesSource.slacktivation === "object"
    ? servicesSource.slacktivation
    : {};
  const slacktivationOidcSource = slacktivationSource.oidc && typeof slacktivationSource.oidc === "object"
    ? slacktivationSource.oidc
    : {};
  const slacktivationApiSource = slacktivationSource.api && typeof slacktivationSource.api === "object"
    ? slacktivationSource.api
    : {};
  const oidcSource = source.oidc && typeof source.oidc === "object" ? source.oidc : {};
  const apiSource = source.api && typeof source.api === "object" ? source.api : {};
  const singularitySource = source.singularity && typeof source.singularity === "object" ? source.singularity : {};
  const fromMeta = source.meta && typeof source.meta === "object" ? source.meta : {};
  const clientId = String(
    source.clientId
    || slacktivationSource.client_id
    || slacktivationSource.clientId
    || slacktivationOidcSource.client_id
    || slacktivationOidcSource.clientId
    || oidcSource.clientId
    || source.zip_slack_client_id
    || source[ZIP_SLACK_CLIENT_ID_STORAGE_KEY]
    || source[SLACK_OIDC_CLIENT_ID_LEGACY_STORAGE_KEY]
    || source.slack_client_id
    || source.client_id
    || ""
  ).trim();
  const clientSecret = String(
    source.clientSecret
    || slacktivationSource.client_secret
    || slacktivationSource.clientSecret
    || slacktivationOidcSource.client_secret
    || slacktivationOidcSource.clientSecret
    || oidcSource.clientSecret
    || source.zip_slack_client_secret
    || source[ZIP_SLACK_CLIENT_SECRET_STORAGE_KEY]
    || source[SLACK_OIDC_CLIENT_SECRET_LEGACY_STORAGE_KEY]
    || source.slack_client_secret
    || source.client_secret
    || ""
  ).trim();
  const scope = normalizeSlackOpenIdScopes(
    source.scope
    || slacktivationSource.scope
    || slacktivationOidcSource.scope
    || oidcSource.scope
    || source.zip_slack_scope
    || source[ZIP_SLACK_SCOPE_STORAGE_KEY]
    || source[SLACK_OIDC_SCOPE_LEGACY_STORAGE_KEY]
    || ""
  );
  const redirectPath = normalizeZipRedirectPath(
    source.redirectPath
    || slacktivationSource.redirect_path
    || slacktivationSource.redirectPath
    || slacktivationOidcSource.redirect_path
    || slacktivationOidcSource.redirectPath
    || oidcSource.redirectPath
    || source.zip_slack_redirect_path
    || source[ZIP_SLACK_REDIRECT_PATH_STORAGE_KEY]
    || source[SLACK_OIDC_REDIRECT_PATH_LEGACY_STORAGE_KEY]
    || ""
  );
  const redirectUri = normalizeSlackOpenIdRedirectUri(
    source.redirectUri
    || source.redirect_uri
    || slacktivationSource.redirect_uri
    || slacktivationSource.redirectUri
    || slacktivationOidcSource.redirect_uri
    || slacktivationOidcSource.redirectUri
    || oidcSource.redirect_uri
    || oidcSource.redirectUri
    || source.zip_slack_redirect_uri
    || source[ZIP_SLACK_REDIRECT_URI_STORAGE_KEY]
    || source[SLACK_OIDC_REDIRECT_URI_LEGACY_STORAGE_KEY]
    || ""
  );
  const userToken = normalizeSlackApiToken(
    source.userToken
    || slacktivationSource.user_token
    || slacktivationSource.userToken
    || slacktivationApiSource.user_token
    || slacktivationApiSource.userToken
    || apiSource.userToken
    || source.zip_slack_user_token
    || source[ZIP_SLACK_USER_TOKEN_STORAGE_KEY]
    || source[SLACK_API_USER_TOKEN_STORAGE_KEY]
    || source[SLACK_API_LEGACY_USER_TOKEN_STORAGE_KEY]
    || source.user_token
    || ""
  );
  const oauthToken = normalizeSlackApiToken(
    source.oauthToken
    || slacktivationSource.oauth_token
    || slacktivationSource.oauthToken
    || slacktivationApiSource.oauth_token
    || slacktivationApiSource.oauthToken
    || slacktivationApiSource.user_token
    || slacktivationApiSource.userToken
    || apiSource.oauthToken
    || apiSource.userToken
    || source.zip_slack_oauth_token
    || source[ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY]
    || source.slack_token
    || source.oauth_token
    || userToken
    || ""
  );
  const singularityChannelId = normalizeSlackChannelId(
    source.singularityChannelId
    || slacktivationSource.singularity_channel_id
    || slacktivationSource.singularityChannelId
    || singularitySource.channelId
    || source.zip_singularity_channel_id
    || source[ZIP_SINGULARITY_CHANNEL_ID_STORAGE_KEY]
    || source[SLACK_SINGULARITY_CHANNEL_LEGACY_STORAGE_KEY]
    || source.singularity_channel_id
    || ""
  );
  const singularityMention = normalizeSingularityMention(
    source.singularityMention
    || slacktivationSource.singularity_mention
    || slacktivationSource.singularityMention
    || singularitySource.mention
    || source.zip_singularity_mention
    || source[ZIP_SINGULARITY_MENTION_STORAGE_KEY]
    || source[SLACK_SINGULARITY_MENTION_LEGACY_STORAGE_KEY]
    || source.singularity_mention
    || ""
  );
  const hasRequired = !!(clientId && clientSecret && oauthToken);

  return {
    clientId,
    clientSecret,
    scope,
    redirectPath,
    redirectUri,
    userToken,
    oauthToken,
    singularityChannelId,
    singularityMention,
    keyLoaded: hasRequired,
    meta: normalizeZipKeyMeta({
      ...fromMeta,
      keyVersion: source.keyVersion || fromMeta.keyVersion || fromMeta.version || "",
      services: source.services || fromMeta.services || (hasRequired ? ["slacktivation"] : [])
    })
  };
}

async function readStorageLocal(keys) {
  if (!chrome.storage || !chrome.storage.local || typeof chrome.storage.local.get !== "function") {
    return {};
  }
  try {
    return await chrome.storage.local.get(keys);
  } catch (_) {
    return {};
  }
}

async function setStorageLocal(values) {
  const payload = values && typeof values === "object" ? values : {};
  if (!Object.keys(payload).length) return;
  if (!chrome.storage || !chrome.storage.local || typeof chrome.storage.local.set !== "function") return;
  try {
    await chrome.storage.local.set(payload);
  } catch (_) {}
}

async function removeStorageLocal(keys) {
  const list = Array.isArray(keys) ? keys.filter(Boolean) : [];
  if (!list.length) return;
  if (!chrome.storage || !chrome.storage.local || typeof chrome.storage.local.remove !== "function") return;
  try {
    await chrome.storage.local.remove(list);
  } catch (_) {}
}

function computeZipSecretsStatus(storedValues) {
  const values = storedValues && typeof storedValues === "object" ? storedValues : {};
  const missing = ZIP_REQUIRED_SECRET_KEYS.filter((key) => !String(values[key] || "").trim());
  const loadedFlag = values[ZIP_SLACK_KEY_LOADED_STORAGE_KEY] === true;
  return {
    ok: loadedFlag && missing.length === 0,
    loaded: loadedFlag,
    missing
  };
}

async function readZipSecretsStatus() {
  const keys = ZIP_REQUIRED_SECRET_KEYS.concat([ZIP_SLACK_KEY_LOADED_STORAGE_KEY]);
  const stored = await readStorageLocal(keys);
  return computeZipSecretsStatus(stored);
}

function hasStorageValue(value) {
  if (value == null) return false;
  if (typeof value === "string") return !!value.trim();
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return value;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return false;
}

async function storeZipSecrets(input, options) {
  const normalized = normalizeZipSecretConfig(input);
  const opts = options && typeof options === "object" ? options : {};
  const updates = {};
  const removals = [];
  const setOrRemove = (key, value) => {
    const normalizedValue = String(value || "").trim();
    if (normalizedValue) updates[key] = normalizedValue;
    else removals.push(key);
  };

  setOrRemove(ZIP_SLACK_CLIENT_ID_STORAGE_KEY, normalized.clientId);
  setOrRemove(ZIP_SLACK_CLIENT_SECRET_STORAGE_KEY, normalized.clientSecret);
  setOrRemove(ZIP_SLACK_SCOPE_STORAGE_KEY, normalized.scope);
  setOrRemove(ZIP_SLACK_REDIRECT_PATH_STORAGE_KEY, normalized.redirectPath);
  setOrRemove(ZIP_SLACK_REDIRECT_URI_STORAGE_KEY, normalized.redirectUri);
  removals.push(ZIP_SLACK_EXPECTED_TEAM_ID_STORAGE_KEY);
  removals.push(ZIP_SLACK_BOT_TOKEN_STORAGE_KEY);
  setOrRemove(ZIP_SLACK_USER_TOKEN_STORAGE_KEY, normalized.userToken);
  setOrRemove(ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY, normalized.oauthToken);
  setOrRemove(ZIP_SINGULARITY_CHANNEL_ID_STORAGE_KEY, normalized.singularityChannelId);
  setOrRemove(ZIP_SINGULARITY_MENTION_STORAGE_KEY, normalized.singularityMention);
  updates[ZIP_SLACK_KEY_META_STORAGE_KEY] = normalized.meta;
  updates[ZIP_SLACK_KEY_LOADED_STORAGE_KEY] = normalized.keyLoaded;

  await setStorageLocal(updates);
  await removeStorageLocal(removals.concat(ZIP_SLACK_LEGACY_STORAGE_KEYS));
  if (opts.clearOpenIdSession !== false) {
    await clearSlackOpenIdSession();
  }
  const status = computeZipSecretsStatus({
    [ZIP_SLACK_CLIENT_ID_STORAGE_KEY]: normalized.clientId,
    [ZIP_SLACK_CLIENT_SECRET_STORAGE_KEY]: normalized.clientSecret,
    [ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY]: normalized.oauthToken,
    [ZIP_SLACK_KEY_LOADED_STORAGE_KEY]: normalized.keyLoaded
  });
  return { ok: status.ok, loaded: status.loaded, missing: status.missing };
}

async function clearZipSecrets() {
  await removeStorageLocal(
    ZIP_SLACK_STORAGE_KEYS
      .filter((key) => key !== ZIP_SLACK_KEY_LOADED_STORAGE_KEY)
      .concat(ZIP_SLACK_LEGACY_STORAGE_KEYS)
      .concat([SLACK_OPENID_SESSION_STORAGE_KEY])
  );
  await setStorageLocal({ [ZIP_SLACK_KEY_LOADED_STORAGE_KEY]: false });
  broadcastZipKeyCleared({
    loaded: false,
    missing: ZIP_REQUIRED_SECRET_KEYS.slice(),
    clearedAt: nowIso()
  });
  return {
    ok: true,
    cleared: true,
    loaded: false,
    missing: ZIP_REQUIRED_SECRET_KEYS.slice()
  };
}

async function runChromeStorageLegacyMigration() {
  const keys = ZIP_SLACK_STORAGE_KEYS.concat(ZIP_SLACK_LEGACY_STORAGE_KEYS);
  const stored = await readStorageLocal(keys);
  const hasLegacyValues = ZIP_SLACK_LEGACY_STORAGE_KEYS.some((key) => hasStorageValue(stored && stored[key]));
  const statusBefore = computeZipSecretsStatus(stored);
  if (!hasLegacyValues && statusBefore.ok) {
    return statusBefore;
  }

  const normalized = normalizeZipSecretConfig(stored);
  if (hasLegacyValues || normalized.keyLoaded) {
    await storeZipSecrets(normalized, { clearOpenIdSession: false });
  }
  return readZipSecretsStatus();
}

async function runLocalStorageMigration(input) {
  const doneState = await readStorageLocal(ZIP_MIGRATION_V1_DONE_STORAGE_KEY);
  const done = !!(doneState && doneState[ZIP_MIGRATION_V1_DONE_STORAGE_KEY]);
  if (done) {
    const status = await readZipSecretsStatus();
    const normalizedWhenDone = normalizeZipSecretConfig(input);
    const hasPayloadValues = !!(
      normalizedWhenDone.clientId
      || normalizedWhenDone.clientSecret
      || normalizedWhenDone.userToken
      || normalizedWhenDone.oauthToken
      || normalizedWhenDone.singularityChannelId
      || normalizedWhenDone.singularityMention
    );
    if (status.ok || !hasPayloadValues) {
      return {
        ok: true,
        skipped: true,
        migrated: false,
        status,
        clearLocalStorageKeys: ZIP_LOCALSTORAGE_MIGRATION_SOURCE_KEYS.slice()
      };
    }
  }

  const normalized = normalizeZipSecretConfig(input);
  const hasLegacyValues = !!(
    normalized.clientId
    || normalized.clientSecret
    || normalized.userToken
    || normalized.oauthToken
    || normalized.singularityChannelId
    || normalized.singularityMention
  );
  if (hasLegacyValues) {
    await storeZipSecrets(normalized, { clearOpenIdSession: false });
  }
  const status = await readZipSecretsStatus();
  await setStorageLocal({
    [ZIP_MIGRATION_V1_DONE_STORAGE_KEY]: true,
    [ZIP_MIGRATION_V1_REPORT_STORAGE_KEY]: {
      migrated: hasLegacyValues,
      completedAt: nowIso(),
      loaded: !!status.ok,
      missing: Array.isArray(status.missing) ? status.missing.slice() : []
    }
  });

  return {
    ok: true,
    migrated: hasLegacyValues,
    status,
    clearLocalStorageKeys: ZIP_LOCALSTORAGE_MIGRATION_SOURCE_KEYS.slice()
  };
}

function buildSlackApiFormBody(fields) {
  const params = new URLSearchParams();
  const source = fields && typeof fields === "object" ? fields : {};
  Object.keys(source).forEach((key) => {
    const value = source[key];
    if (value == null) return;
    if (typeof value === "boolean") {
      params.set(key, value ? "true" : "false");
      return;
    }
    params.set(key, String(value));
  });
  return params.toString();
}

async function postSlackApiWithBearerToken(workspaceOrigin, apiPath, fields, token) {
  const origin = normalizeSlackWorkspaceOrigin(workspaceOrigin);
  const endpoint = origin + String(apiPath || "");
  const authToken = normalizeSlackApiToken(token);
  if (!authToken) {
    return { ok: false, error: "Slack API token is missing.", code: "slack_api_token_missing" };
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Authorization: "Bearer " + authToken
      },
      body: buildSlackApiFormBody(fields)
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || payload.ok === false) {
      return {
        ok: false,
        status: response.status,
        code: String(payload && payload.error || "").trim().toLowerCase() || "slack_api_error",
        error: String((payload && (payload.error || payload.message)) || "Slack API request failed."),
        payload: payload && typeof payload === "object" ? payload : {}
      };
    }
    return {
      ok: true,
      status: response.status,
      payload
    };
  } catch (err) {
    return {
      ok: false,
      code: "slack_api_network_error",
      error: err && err.message ? err.message : "Slack API request failed."
    };
  }
}

async function readStoredSlackApiTokens() {
  const uniq = (values) => {
    const out = [];
    const rows = Array.isArray(values) ? values : [];
    for (let i = 0; i < rows.length; i += 1) {
      const token = normalizeSlackApiToken(rows[i]);
      if (!token) continue;
      if (!out.includes(token)) out.push(token);
    }
    return out;
  };
  if (!chrome.storage || !chrome.storage.local || typeof chrome.storage.local.get !== "function") {
    const userCandidates = uniq([SLACK_API_DEFAULT_USER_TOKEN]);
    return {
      userToken: userCandidates[0] || "",
      userCandidates
    };
  }
  try {
    const stored = await chrome.storage.local.get([
      ZIP_SLACK_USER_TOKEN_STORAGE_KEY,
      ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY,
      SLACK_API_USER_TOKEN_STORAGE_KEY,
      SLACK_API_LEGACY_USER_TOKEN_STORAGE_KEY
    ]);
    const userCandidates = uniq([
      stored && stored[ZIP_SLACK_USER_TOKEN_STORAGE_KEY],
      stored && stored[ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY],
      stored && stored[SLACK_API_USER_TOKEN_STORAGE_KEY],
      stored && stored[SLACK_API_LEGACY_USER_TOKEN_STORAGE_KEY],
      SLACK_API_DEFAULT_USER_TOKEN
    ]);
    return {
      userToken: userCandidates[0] || "",
      userCandidates
    };
  } catch (_) {
    const userCandidates = uniq([SLACK_API_DEFAULT_USER_TOKEN]);
    return {
      userToken: userCandidates[0] || "",
      userCandidates
    };
  }
}

async function resolveSlackApiTokens(input) {
  const body = input && typeof input === "object" ? input : {};
  const userFromMessage = normalizeSlackApiToken(body.userToken || body.user_token);
  const stored = await readStoredSlackApiTokens();
  const uniq = (values) => {
    const out = [];
    const rows = Array.isArray(values) ? values : [];
    for (let i = 0; i < rows.length; i += 1) {
      const token = normalizeSlackApiToken(rows[i]);
      if (!token) continue;
      if (!out.includes(token)) out.push(token);
    }
    return out;
  };
  const userCandidates = uniq([userFromMessage].concat(
    Array.isArray(stored && stored.userCandidates) ? stored.userCandidates : [stored && stored.userToken]
  ));
  return {
    userToken: userCandidates[0] || "",
    userCandidates
  };
}

function isSlackTokenInvalidationCode(code) {
  const normalized = String(code || "").trim().toLowerCase();
  if (!normalized) return false;
  return normalized === "account_inactive"
    || normalized === "invalid_auth"
    || normalized === "token_revoked"
    || normalized === "not_authed";
}

async function invalidateStoredSlackToken(token) {
  const normalized = normalizeSlackApiToken(token);
  if (!normalized) return;
  if (!chrome.storage || !chrome.storage.local || typeof chrome.storage.local.get !== "function") return;
  try {
    // Do not mutate canonical ZIP.KEY-managed secrets automatically.
    // Automatic invalidation is restricted to legacy mirrored token keys so
    // transient/remote auth issues cannot silently clear ZIP.KEY requirements.
    const keys = [
      SLACK_API_USER_TOKEN_STORAGE_KEY,
      SLACK_API_LEGACY_USER_TOKEN_STORAGE_KEY
    ];
    const stored = await chrome.storage.local.get(keys);
    const toRemove = [];
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const value = normalizeSlackApiToken(stored && stored[key]);
      if (value && value === normalized) {
        toRemove.push(key);
      }
    }
    if (toRemove.length && typeof chrome.storage.local.remove === "function") {
      await chrome.storage.local.remove(toRemove);
    }
  } catch (_) {}
}

async function slackSendMarkdownToSelfViaApi(input) {
  const body = input && typeof input === "object" ? input : {};
  const markdownText = String(body.markdownText || body.text || body.messageText || "").trim();
  if (!markdownText) {
    return { ok: false, error: "Slack message body is empty.", code: "slack_payload_empty" };
  }
  const webApiOrigin = SLACK_WEB_API_ORIGIN;
  const allowWorkspaceTabBootstrap = body.autoBootstrapSlackTab !== false;
  // @ME must target the SLACKTIVATED user identity via user OAuth/session token.
  const tokens = await resolveSlackApiTokens(body);
  const userDeliveryToken = normalizeSlackApiToken(tokens.userToken);
  const userCandidates = Array.isArray(tokens && tokens.userCandidates)
    ? tokens.userCandidates.map((token) => normalizeSlackApiToken(token)).filter(Boolean)
    : [userDeliveryToken].filter(Boolean);
  const hasUserOAuthCandidate = userCandidates.some((token) => isSlackUserOAuthToken(token));

  // Prefer workspace-session first so @ME mirrors native Slack "new unread" behavior.
  const primarySessionDelivery = await slackSendMarkdownToSelfViaWorkspaceSession(body, "workspace_session_primary");
  if (primarySessionDelivery && primarySessionDelivery.ok) {
    return primarySessionDelivery;
  }
  const primarySessionError = String((primarySessionDelivery && primarySessionDelivery.error) || "").trim();
  const primarySessionCode = String((primarySessionDelivery && primarySessionDelivery.code) || "").trim().toLowerCase();

  // If no explicit Slack user OAuth token is available, rely on session guidance.
  if (!hasUserOAuthCandidate) {
    return {
      ok: false,
      code: "slack_user_token_missing",
      error: "SLACK_IT_TO_ME requires a Slack user/session token for DM delivery." + (
        primarySessionError
          ? (" " + primarySessionError)
          : ""
      )
    };
  }

  const tokenAttempts = [];
  for (let i = 0; i < userCandidates.length; i += 1) {
    const normalizedToken = normalizeSlackApiToken(userCandidates[i]);
    if (!normalizedToken) continue;
    if (tokenAttempts.includes(normalizedToken)) continue;
    tokenAttempts.push(normalizedToken);
  }
  if (!tokenAttempts.length) {
    const sessionFallback = await slackSendMarkdownToSelfViaWorkspaceSession(body, "slack_api_token_missing");
    if (sessionFallback && sessionFallback.ok) return sessionFallback;
    return {
      ok: false,
      code: "slack_user_token_missing",
      error: "SLACK_IT_TO_ME requires a Slack user/session token for DM delivery." + (
        sessionFallback && sessionFallback.error
          ? (" " + String(sessionFallback.error))
          : ""
      )
    };
  }

  const openIdSession = await readSlackOpenIdSession();
  const requestedUserId = normalizeSlackUserId(body.userId || body.user_id);
  const openIdUserId = normalizeSlackUserId(openIdSession && openIdSession.userId);

  let resolvedUserName = normalizeSlackDisplayName(
    body.userName || body.user_name || (openIdSession && openIdSession.userName) || ""
  );
  let resolvedAvatarUrl = normalizeSlackAvatarUrl(
    body.avatarUrl
    || body.avatar_url
    || (openIdSession && openIdSession.avatarUrl)
    || ""
  );

  let lastFailureCode = "slack_send_failed";
  let lastFailureError = "Unable to send Slack self-DM.";

  for (let i = 0; i < tokenAttempts.length; i += 1) {
    const attemptToken = normalizeSlackApiToken(tokenAttempts[i]);
    if (!attemptToken) continue;

    const auth = await postSlackApiWithBearerToken(webApiOrigin, "/api/auth.test", {
      _x_reason: "zip-slack-it-to-me-auth-bg"
    }, attemptToken);
    if (!auth.ok) {
      lastFailureCode = auth.code || "slack_auth_failed";
      lastFailureError = auth.error || "Unable to validate Slack API credentials.";
      if (isSlackTokenInvalidationCode(lastFailureCode)) {
        await invalidateStoredSlackToken(attemptToken);
      }
      continue;
    }

    const authPayload = auth.payload && typeof auth.payload === "object" ? auth.payload : {};
    const teamId = normalizeSlackTeamId(authPayload.team_id || authPayload.team);
    const authFallbackName = normalizeSlackDisplayName(authPayload.user || "");

    const authUserId = normalizeSlackUserId(authPayload.user_id || authPayload.user);
    if (!resolvedUserName || !resolvedAvatarUrl) {
      const identity = await fetchSlackIdentityViaApi(
        webApiOrigin,
        attemptToken,
        authUserId || requestedUserId || openIdUserId
      );
      if (!resolvedUserName) {
        resolvedUserName = normalizeSlackDisplayName(identity.userName || authFallbackName || "");
      }
      if (!resolvedAvatarUrl) {
        resolvedAvatarUrl = normalizeSlackAvatarUrl(identity.avatarUrl || "");
      }
    }
    if (!resolvedUserName) {
      resolvedUserName = authFallbackName;
    }
    const userIdCandidates = [];
    const pushUserIdCandidate = (value) => {
      const normalized = normalizeSlackUserId(value);
      if (!normalized) return;
      if (!userIdCandidates.includes(normalized)) userIdCandidates.push(normalized);
    };
    pushUserIdCandidate(requestedUserId);
    pushUserIdCandidate(openIdUserId);
    pushUserIdCandidate(authUserId);
    if (!userIdCandidates.length) {
      lastFailureCode = "slack_user_identity_missing";
      lastFailureError = "Unable to resolve Slack user identity for @ME delivery.";
      continue;
    }
    let tokenInvalidated = false;
    for (let userIdx = 0; userIdx < userIdCandidates.length; userIdx += 1) {
      const userId = userIdCandidates[userIdx];
      const dmOpen = await postSlackApiWithBearerToken(webApiOrigin, "/api/conversations.open", {
        users: userId,
        return_im: "true",
        _x_reason: "zip-slack-it-to-me-open-dm-bg"
      }, attemptToken);
      if (!dmOpen.ok) {
        lastFailureCode = dmOpen.code || "slack_open_dm_failed";
        lastFailureError = dmOpen.error || "Unable to open Slack DM channel.";
        if (isSlackTokenInvalidationCode(lastFailureCode)) {
          await invalidateStoredSlackToken(attemptToken);
          tokenInvalidated = true;
          break;
        }
        continue;
      }
      const dmPayload = dmOpen.payload && typeof dmOpen.payload === "object" ? dmOpen.payload : {};
      const dmChannel = dmPayload.channel && typeof dmPayload.channel === "object" ? dmPayload.channel : {};
      const postChannel = String(dmChannel.id || dmPayload.channel_id || dmPayload.channel || "").trim();
      if (!postChannel) {
        lastFailureCode = "slack_dm_channel_missing";
        lastFailureError = "Unable to resolve Slack DM channel.";
        continue;
      }

      const messageText = markdownText;
      const post = await postSlackApiWithBearerToken(webApiOrigin, "/api/chat.postMessage", {
        channel: postChannel,
        text: messageText,
        mrkdwn: "true",
        unfurl_links: "false",
        unfurl_media: "false",
        _x_reason: "zip-slack-it-to-me-bg"
      }, attemptToken);
      if (!post.ok) {
        lastFailureCode = post.code || "slack_post_failed";
        lastFailureError = post.error || "Unable to send Slack self-DM.";
        if (isSlackTokenInvalidationCode(lastFailureCode)) {
          await invalidateStoredSlackToken(attemptToken);
          tokenInvalidated = true;
          break;
        }
        continue;
      }
      const postPayload = post.payload && typeof post.payload === "object" ? post.payload : {};
      const postedTs = String(postPayload.ts || (postPayload.message && postPayload.message.ts) || "").trim();
      let unreadMarked = false;
      if (postChannel && postedTs) {
        unreadMarked = await markSlackMessageUnreadViaApiToken(
          webApiOrigin,
          attemptToken,
          postChannel,
          postedTs
        );
        if (!unreadMarked) {
          const workspaceUnreadFallback = await slackMarkUnreadViaWorkspaceSession({
            workspaceOrigin,
            channelId: postChannel,
            ts: postedTs,
            autoBootstrapSlackTab: allowWorkspaceTabBootstrap
          }, "workspace_mark_unread_fallback");
          unreadMarked = !!(workspaceUnreadFallback && workspaceUnreadFallback.ok && workspaceUnreadFallback.unread_marked === true);
        }
      }
      return {
        ok: true,
        channel: String(postPayload.channel || postChannel || userId).trim(),
        ts: postedTs,
        user_id: userId,
        team_id: teamId || "",
        user_name: resolvedUserName,
        avatar_url: resolvedAvatarUrl,
        unread_marked: unreadMarked,
        delivery_mode: "user_direct_channel"
      };
    }
    if (tokenInvalidated) {
      continue;
    }
  }

  const shouldRetryWorkspaceSession = !(
    primarySessionCode === "slack_workspace_tab_missing"
    || primarySessionCode === "slack_workspace_session_unavailable"
  );
  if (shouldRetryWorkspaceSession) {
    const sessionFallback = await slackSendMarkdownToSelfViaWorkspaceSession(body, lastFailureCode);
    if (sessionFallback && sessionFallback.ok) return sessionFallback;
  }
  return {
    ok: false,
    code: lastFailureCode,
    error: lastFailureError
  };
}

async function slackAuthTestViaApi(input) {
  const body = input && typeof input === "object" ? input : {};
  const workspaceOrigin = normalizeSlackWorkspaceOrigin(body.workspaceOrigin || SLACK_WORKSPACE_ORIGIN);
  const tokens = await resolveSlackApiTokens(body);
  const userCandidates = Array.isArray(tokens && tokens.userCandidates)
    ? tokens.userCandidates.map((token) => normalizeSlackApiToken(token)).filter(Boolean)
    : [normalizeSlackApiToken(tokens && tokens.userToken)].filter(Boolean);
  const tokenAttempts = [];
  for (let i = 0; i < userCandidates.length; i += 1) {
    const normalizedToken = normalizeSlackApiToken(userCandidates[i]);
    if (!normalizedToken) continue;
    if (!isSlackUserOAuthToken(normalizedToken)) continue;
    if (!tokenAttempts.includes(normalizedToken)) tokenAttempts.push(normalizedToken);
  }
  if (!tokenAttempts.length) {
    return {
      ok: false,
      code: "slack_user_token_missing",
      error: "Slack user/session token is missing for API auth test."
    };
  }

  const openIdSession = await readSlackOpenIdSession();
  let lastFailureCode = "slack_auth_failed";
  let lastFailureError = "Unable to validate Slack API credentials.";

  for (let i = 0; i < tokenAttempts.length; i += 1) {
    const attemptToken = normalizeSlackApiToken(tokenAttempts[i]);
    if (!attemptToken) continue;
    const auth = await postSlackApiWithBearerToken(workspaceOrigin, "/api/auth.test", {
      _x_reason: "zip-slacktivation-auth-bg"
    }, attemptToken);
    if (!auth.ok) {
      lastFailureCode = auth.code || "slack_auth_failed";
      lastFailureError = auth.error || "Unable to validate Slack API credentials.";
      if (isSlackTokenInvalidationCode(lastFailureCode)) {
        await invalidateStoredSlackToken(attemptToken);
      }
      continue;
    }

    const payload = auth.payload && typeof auth.payload === "object" ? auth.payload : {};
    const userId = normalizeSlackUserId(payload.user_id || payload.user || body.userId || body.user_id);
    const teamId = normalizeSlackTeamId(payload.team_id || payload.team);
    let userName = normalizeSlackDisplayName(
      body.userName
      || body.user_name
      || (openIdSession && openIdSession.userName)
      || ""
    );
    let avatarUrl = normalizeSlackAvatarUrl(
      body.avatarUrl
      || body.avatar_url
      || (openIdSession && openIdSession.avatarUrl)
      || ""
    );
    let avatarErrorCode = "";
    let avatarErrorMessage = "";
    if (!userName || !avatarUrl) {
      const identity = await fetchSlackIdentityViaApi(workspaceOrigin, attemptToken, userId);
      if (!userName) {
        userName = normalizeSlackDisplayName(identity.userName || payload.user || "");
      }
      if (!avatarUrl) {
        avatarUrl = normalizeSlackAvatarUrl(identity.avatarUrl || "");
      }
      if (!avatarUrl) {
        avatarErrorCode = String(identity.avatarErrorCode || "").trim().toLowerCase();
        avatarErrorMessage = String(identity.avatarErrorMessage || "").trim();
      }
    }
    if (!userName) {
      userName = normalizeSlackDisplayName(payload.user || "");
    }
    return {
      ok: true,
      ready: true,
      mode: "api",
      user_id: userId,
      team_id: teamId,
      user_name: userName,
      avatar_url: avatarUrl,
      avatar_error_code: avatarErrorCode,
      avatar_error: avatarErrorMessage
    };
  }

  return {
    ok: false,
    code: lastFailureCode,
    error: lastFailureError
  };
}

function normalizeSlackOpenIdScopes(value) {
  const allowed = new Set(["openid", "profile", "email"]);
  const raw = String(value || "").trim().toLowerCase();
  const parts = raw
    ? raw.split(/[\s,]+/).map((part) => part.trim()).filter(Boolean)
    : [];
  const unique = [];
  for (let i = 0; i < parts.length; i += 1) {
    const scope = parts[i];
    if (!allowed.has(scope)) continue;
    if (!unique.includes(scope)) unique.push(scope);
  }
  if (!unique.includes("openid")) unique.unshift("openid");
  if (!unique.length) return SLACK_OPENID_DEFAULT_SCOPES;
  return unique.join(" ");
}

function createSlackOpenIdEntropy() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID().replace(/-/g, "");
    }
  } catch (_) {}
  return String(Date.now()) + "_" + String(Math.random()).slice(2);
}

function parseSlackOpenIdIdTokenPayload(idToken) {
  const token = String(idToken || "").trim();
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payloadPart = parts[1];
  if (!payloadPart) return null;
  const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const base64 = normalized + padding;
  try {
    const binary = typeof atob === "function"
      ? atob(base64)
      : "";
    if (!binary) return null;
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    const text = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_) {
    return null;
  }
}

function pickSlackOpenIdUserName(userInfo, idPayload) {
  const values = [
    userInfo && userInfo.name,
    userInfo && userInfo.given_name,
    userInfo && userInfo.family_name,
    idPayload && idPayload.name,
    idPayload && idPayload.given_name,
    idPayload && idPayload.family_name
  ];
  for (let i = 0; i < values.length; i += 1) {
    const value = normalizeSlackDisplayName(values[i]);
    if (value) return value;
  }
  return "";
}

function pickSlackOpenIdAvatar(userInfo, idPayload) {
  const values = [
    userInfo && userInfo.picture,
    idPayload && idPayload.picture
  ];
  for (let i = 0; i < values.length; i += 1) {
    const value = String(values[i] || "").trim();
    if (value) return value;
  }
  return "";
}

function normalizeSlackOpenIdProfile(tokenPayload, userInfoPayload) {
  const token = tokenPayload && typeof tokenPayload === "object" ? tokenPayload : {};
  const userInfo = userInfoPayload && typeof userInfoPayload === "object" ? userInfoPayload : {};
  const idPayload = parseSlackOpenIdIdTokenPayload(token.id_token || "");
  const slackUserId = normalizeSlackUserId(
    userInfo["https://slack.com/user_id"]
    || token.user_id
    || (idPayload && idPayload["https://slack.com/user_id"])
    || (idPayload && idPayload.sub)
  );
  const slackTeamId = normalizeSlackTeamId(
    userInfo["https://slack.com/team_id"]
    || token.team_id
    || (idPayload && idPayload["https://slack.com/team_id"])
  );
  const expiresInSec = Number(token.expires_in || 0);
  const idExpMs = Number(idPayload && idPayload.exp ? idPayload.exp : 0) * 1000;
  const accessExpMs = expiresInSec > 0 ? (Date.now() + (expiresInSec * 1000)) : 0;
  const expiresAtMs = Math.max(accessExpMs, idExpMs);
  return {
    accessToken: String(token.access_token || "").trim(),
    idToken: String(token.id_token || "").trim(),
    scope: normalizeSlackOpenIdScopes(token.scope || ""),
    expiresAtMs: Number.isFinite(expiresAtMs) && expiresAtMs > 0 ? expiresAtMs : 0,
    userId: slackUserId,
    teamId: slackTeamId,
    userName: pickSlackOpenIdUserName(userInfo, idPayload),
    avatarUrl: pickSlackOpenIdAvatar(userInfo, idPayload),
    email: String(userInfo.email || (idPayload && idPayload.email) || "").trim()
  };
}

async function readSlackOpenIdSession() {
  if (!chrome.storage || !chrome.storage.local) return null;
  try {
    const stored = await chrome.storage.local.get(SLACK_OPENID_SESSION_STORAGE_KEY);
    const session = stored && stored[SLACK_OPENID_SESSION_STORAGE_KEY];
    return session && typeof session === "object" ? session : null;
  } catch (_) {
    return null;
  }
}

async function writeSlackOpenIdSession(session) {
  if (!chrome.storage || !chrome.storage.local) return;
  try {
    await chrome.storage.local.set({ [SLACK_OPENID_SESSION_STORAGE_KEY]: session });
  } catch (_) {}
}

async function clearSlackOpenIdSession() {
  if (!chrome.storage || !chrome.storage.local) return;
  try {
    await chrome.storage.local.remove(SLACK_OPENID_SESSION_STORAGE_KEY);
  } catch (_) {}
}

async function fetchSlackOpenIdUserInfo(accessToken) {
  const token = String(accessToken || "").trim();
  if (!token) return { ok: false, error: "Slack OpenID access token is missing." };
  try {
    const response = await fetch(SLACK_OPENID_USERINFO_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + token
      }
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || payload.ok === false) {
      return {
        ok: false,
        status: response.status,
        error: String((payload && (payload.error || payload.message)) || "Unable to fetch Slack OpenID user info."),
        payload: payload && typeof payload === "object" ? payload : {}
      };
    }
    return { ok: true, payload };
  } catch (err) {
    return {
      ok: false,
      error: err && err.message ? err.message : "Slack OpenID user info request failed."
    };
  }
}

function normalizeSlackOpenIdAuthConfig(input) {
  const configInput = input && typeof input === "object" ? input : {};
  const clientId = String(configInput.clientId || "").trim();
  const clientSecret = String(configInput.clientSecret || "").trim();
  const redirectPath = normalizeZipRedirectPath(configInput.redirectPath || SLACK_OPENID_DEFAULT_REDIRECT_PATH);
  const redirectUriRaw = normalizeSlackOpenIdRedirectUri(
    configInput.redirectUri
    || configInput.redirect_uri
    || ""
  );
  return {
    clientId,
    clientSecret,
    scope: normalizeSlackOpenIdScopes(configInput.scope || configInput.scopes || ""),
    redirectPath,
    redirectUriRaw
  };
}

function resolveSlackOpenIdRedirectUriCandidates(config) {
  const candidates = [];
  const seen = new Set();
  const pushCandidate = (value) => {
    const raw = String(value || "").trim();
    if (!raw || seen.has(raw)) return;
    seen.add(raw);
    candidates.push(raw);
  };
  const raw = normalizeSlackOpenIdRedirectUri(config && config.redirectUriRaw);
  if (raw) pushCandidate(raw);
  if (chrome.identity && typeof chrome.identity.getRedirectURL === "function") {
    const configuredPath = String(config && config.redirectPath || SLACK_OPENID_DEFAULT_REDIRECT_PATH);
    pushCandidate(chrome.identity.getRedirectURL(configuredPath));
    pushCandidate(chrome.identity.getRedirectURL(SLACK_OPENID_DEFAULT_REDIRECT_PATH));
    // Backward compatibility for Slack apps that only allow the origin/root callback URI.
    pushCandidate(chrome.identity.getRedirectURL(""));
  }
  return candidates;
}

function isSlackOpenIdRedirectMismatchError(message) {
  const text = String(message || "").toLowerCase();
  if (!text) return false;
  if (text.includes("invalid_redirect_uri")) return true;
  if (text.includes("redirect_uri_mismatch")) return true;
  if (text.includes("redirect uri did not match")) return true;
  return text.includes("redirect_uri") && text.includes("configured uris");
}

function launchSlackOpenIdWebAuth(url, interactive) {
  const authUrl = String(url || "").trim();
  if (!authUrl) return Promise.reject(new Error("Slack OpenID authorize URL is missing."));
  return new Promise((resolve, reject) => {
    if (!chrome.identity || typeof chrome.identity.launchWebAuthFlow !== "function") {
      reject(new Error("chrome.identity.launchWebAuthFlow is unavailable."));
      return;
    }
    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: interactive !== false
    }, (responseUrl) => {
      const runtimeError = chrome.runtime && chrome.runtime.lastError
        ? chrome.runtime.lastError.message
        : "";
      if (runtimeError) {
        reject(new Error(runtimeError));
        return;
      }
      const value = String(responseUrl || "").trim();
      if (!value) {
        reject(new Error("Slack OpenID auth did not return a callback URL."));
        return;
      }
      resolve(value);
    });
  });
}

async function exchangeSlackOpenIdCodeForSession(input) {
  const context = input && typeof input === "object" ? input : {};
  const code = String(context.code || "").trim();
  const config = normalizeSlackOpenIdAuthConfig(context.config);
  const redirectUri = String(context.redirectUri || "").trim();
  const expectedNonce = String(context.expectedNonce || "").trim();
  if (!code) return { ok: false, error: "Slack OpenID callback did not return an auth code." };
  if (!config.clientId || !config.clientSecret) {
    return { ok: false, error: "Slack OpenID client credentials are missing." };
  }
  if (!redirectUri) return { ok: false, error: "Slack OpenID redirect URI is missing." };

  const body = new URLSearchParams();
  body.set("code", code);
  body.set("client_id", config.clientId);
  body.set("client_secret", config.clientSecret);
  body.set("redirect_uri", redirectUri);

  let tokenPayload = null;
  try {
    const response = await fetch(SLACK_OPENID_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    });
    tokenPayload = await response.json().catch(() => null);
    if (!response.ok || !tokenPayload || tokenPayload.ok === false) {
      return {
        ok: false,
        status: response.status,
        error: String((tokenPayload && (tokenPayload.error || tokenPayload.message)) || "Slack OpenID token exchange failed."),
        payload: tokenPayload && typeof tokenPayload === "object" ? tokenPayload : {}
      };
    }
  } catch (err) {
    return {
      ok: false,
      error: err && err.message ? err.message : "Slack OpenID token exchange request failed."
    };
  }

  const idPayload = parseSlackOpenIdIdTokenPayload(tokenPayload && tokenPayload.id_token || "");
  const tokenNonce = String(idPayload && idPayload.nonce || "").trim();
  if (expectedNonce && tokenNonce && tokenNonce !== expectedNonce) {
    return { ok: false, error: "Slack OpenID nonce validation failed." };
  }

  const userInfoResult = await fetchSlackOpenIdUserInfo(tokenPayload && tokenPayload.access_token);
  if (!userInfoResult.ok) {
    return {
      ok: false,
      error: String(userInfoResult.error || "Slack OpenID user info fetch failed.")
    };
  }

  const profile = normalizeSlackOpenIdProfile(tokenPayload, userInfoResult.payload);
  if (!profile.accessToken) {
    return { ok: false, error: "Slack OpenID token response did not include an access token." };
  }
  const session = {
    accessToken: profile.accessToken,
    idToken: profile.idToken,
    scope: profile.scope,
    expiresAtMs: profile.expiresAtMs,
    userId: profile.userId,
    teamId: profile.teamId,
    userName: profile.userName,
    avatarUrl: profile.avatarUrl,
    email: profile.email,
    clientId: config.clientId,
    verifiedAtMs: Date.now(),
    createdAt: nowIso()
  };
  await writeSlackOpenIdSession(session);
  return {
    ok: true,
    mode: "openid",
    user_id: session.userId,
    user_name: session.userName,
    avatar_url: session.avatarUrl,
    team_id: session.teamId,
    scope: session.scope,
    expires_at_ms: session.expiresAtMs
  };
}

async function runSlackOpenIdAuth(input) {
  const request = input && typeof input === "object" ? input : {};
  const config = normalizeSlackOpenIdAuthConfig(request);
  const interactive = request.interactive !== false;
  if (!config.clientId || !config.clientSecret) {
    return { ok: false, error: "Slack OpenID client credentials are not configured." };
  }
  const redirectUriCandidates = resolveSlackOpenIdRedirectUriCandidates(config);
  if (!redirectUriCandidates.length) {
    return { ok: false, error: "Slack OpenID redirect URI is unavailable in this browser context." };
  }

  let redirectMismatchMessage = "";
  for (let i = 0; i < redirectUriCandidates.length; i += 1) {
    const redirectUri = redirectUriCandidates[i];
    const hasFallbackCandidate = i + 1 < redirectUriCandidates.length;
    const state = createSlackOpenIdEntropy();
    const nonce = createSlackOpenIdEntropy();
    const params = new URLSearchParams();
    params.set("response_type", "code");
    params.set("client_id", config.clientId);
    params.set("scope", config.scope);
    params.set("redirect_uri", redirectUri);
    params.set("state", state);
    params.set("nonce", nonce);

    const authorizeUrl = SLACK_OPENID_AUTHORIZE_URL + "?" + params.toString();
    let callbackUrl = "";
    try {
      callbackUrl = await launchSlackOpenIdWebAuth(authorizeUrl, interactive);
    } catch (err) {
      const message = String(err && err.message || "").trim();
      if (isSlackOpenIdRedirectMismatchError(message) && hasFallbackCandidate) {
        redirectMismatchMessage = message || redirectMismatchMessage;
        continue;
      }
      return {
        ok: false,
        code: isSlackOpenIdRedirectMismatchError(message)
          ? "redirect_uri_mismatch"
          : (interactive ? "auth_flow_failed" : "interaction_required"),
        error: message || "Slack OpenID authentication failed."
      };
    }

    let parsed = null;
    try {
      parsed = new URL(callbackUrl);
    } catch (_) {
      return { ok: false, error: "Slack OpenID callback URL is invalid." };
    }
    const callbackState = String(parsed.searchParams.get("state") || "").trim();
    if (!callbackState || callbackState !== state) {
      return { ok: false, error: "Slack OpenID state validation failed." };
    }
    const callbackError = String(parsed.searchParams.get("error") || "").trim();
    if (callbackError) {
      const callbackErrorDescription = String(parsed.searchParams.get("error_description") || "").trim();
      const callbackErrorMessage = callbackErrorDescription
        ? (callbackError + ": " + callbackErrorDescription)
        : callbackError;
      if (isSlackOpenIdRedirectMismatchError(callbackErrorMessage) && hasFallbackCandidate) {
        redirectMismatchMessage = callbackErrorMessage || redirectMismatchMessage;
        continue;
      }
      return {
        ok: false,
        code: isSlackOpenIdRedirectMismatchError(callbackErrorMessage) ? "redirect_uri_mismatch" : "auth_flow_failed",
        error: callbackErrorMessage
      };
    }
    const code = String(parsed.searchParams.get("code") || "").trim();
    const exchangeResult = await exchangeSlackOpenIdCodeForSession({
      code,
      config,
      redirectUri,
      expectedNonce: nonce
    });
    if (exchangeResult && exchangeResult.ok === true) {
      return exchangeResult;
    }
    const exchangeMessage = String(
      (exchangeResult && (
        exchangeResult.error
        || (exchangeResult.payload && exchangeResult.payload.error)
      ))
      || ""
    ).trim();
    if (isSlackOpenIdRedirectMismatchError(exchangeMessage) && hasFallbackCandidate) {
      redirectMismatchMessage = exchangeMessage || redirectMismatchMessage;
      continue;
    }
    if (isSlackOpenIdRedirectMismatchError(exchangeMessage) && exchangeResult && typeof exchangeResult === "object") {
      return {
        ...exchangeResult,
        code: "redirect_uri_mismatch"
      };
    }
    return exchangeResult;
  }

  return {
    ok: false,
    code: "redirect_uri_mismatch",
    error: redirectMismatchMessage || "Slack OpenID redirect URI did not match any configured Slack app callback URI."
  };
}

async function getSlackOpenIdStatus(input) {
  const request = input && typeof input === "object" ? input : {};
  const session = await readSlackOpenIdSession();
  if (!session) {
    return { ok: false, error: "No cached Slack OpenID session." };
  }

  const nowMs = Date.now();
  const expiresAtMs = Number(session.expiresAtMs || 0);
  if (expiresAtMs > 0 && nowMs >= (expiresAtMs - 30 * 1000)) {
    await clearSlackOpenIdSession();
    return { ok: false, error: "Cached Slack OpenID session expired." };
  }

  let verifiedSession = session;
  const verifiedAtMs = Number(session.verifiedAtMs || 0);
  if (!Number.isFinite(verifiedAtMs) || nowMs - verifiedAtMs > SLACK_OPENID_STATUS_VERIFY_TTL_MS) {
    const userInfoResult = await fetchSlackOpenIdUserInfo(session.accessToken);
    if (!userInfoResult.ok) {
      await clearSlackOpenIdSession();
      return {
        ok: false,
        error: String(userInfoResult.error || "Unable to verify Slack OpenID session.")
      };
    }
    const profile = normalizeSlackOpenIdProfile({
      access_token: session.accessToken,
      id_token: session.idToken,
      scope: session.scope,
      expires_in: expiresAtMs > nowMs ? Math.floor((expiresAtMs - nowMs) / 1000) : 0,
      team_id: session.teamId,
      user_id: session.userId
    }, userInfoResult.payload);
    verifiedSession = {
      ...session,
      userId: profile.userId || session.userId || "",
      teamId: profile.teamId || session.teamId || "",
      userName: profile.userName || session.userName || "",
      avatarUrl: profile.avatarUrl || session.avatarUrl || "",
      email: profile.email || session.email || "",
      verifiedAtMs: nowMs
    };
    await writeSlackOpenIdSession(verifiedSession);
  }

  return {
    ok: true,
    mode: "openid",
    user_id: String(verifiedSession.userId || "").trim(),
    user_name: String(verifiedSession.userName || "").trim(),
    avatar_url: String(verifiedSession.avatarUrl || "").trim(),
    team_id: String(verifiedSession.teamId || "").trim(),
    email: String(verifiedSession.email || "").trim(),
    scope: String(verifiedSession.scope || "").trim(),
    expires_at_ms: Number(verifiedSession.expiresAtMs || 0)
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
      title: MENU_APPEARANCE_LABEL,
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
  await createThemeContextMenuItems(MENU_ROOT);
  await createContextMenuItem({
    id: MENU_ASK_ERIC,
    parentId: MENU_ROOT,
    title: getAskEricMenuTitle(),
    contexts: MENU_CONTEXTS
  });
  await createContextMenuItem({
    id: MENU_TOGGLE_SIDE,
    parentId: MENU_ROOT,
    title: getToggleMenuItemTitle(currentSide),
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
  await createContextMenuItem({
    id: MENU_CLEAR_KEY_SEPARATOR,
    parentId: MENU_ROOT,
    type: "separator",
    contexts: MENU_CONTEXTS
  });
  await createContextMenuItem({
    id: MENU_CLEAR_KEY,
    parentId: MENU_ROOT,
    title: getClearKeyMenuTitle(),
    contexts: MENU_CONTEXTS
  });
}

async function createFlatContextMenus(currentSide, shouldShowGetLatest) {
  await createThemeContextMenuItems(null);
  await createContextMenuItem({
    id: MENU_ASK_ERIC,
    title: getAskEricMenuTitle(),
    contexts: MENU_CONTEXTS
  });
  await createContextMenuItem({
    id: MENU_TOGGLE_SIDE,
    title: getToggleMenuItemTitle(currentSide),
    contexts: MENU_CONTEXTS
  });
  if (shouldShowGetLatest) {
    await createContextMenuItem({
      id: MENU_GET_LATEST,
      title: "Get Latest",
      contexts: MENU_CONTEXTS
    });
  }
  await createContextMenuItem({
    id: MENU_CLEAR_KEY_SEPARATOR,
    type: "separator",
    contexts: MENU_CONTEXTS
  });
  await createContextMenuItem({
    id: MENU_CLEAR_KEY,
    title: getClearKeyMenuTitle(),
    contexts: MENU_CONTEXTS
  });
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
  await runChromeStorageLegacyMigration().catch(() => {});
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
  forceCheck({ reason: "bootstrap" }).catch(() => {});
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
  if (info.menuItemId === MENU_CLEAR_KEY) {
    clearZipSecrets().catch(() => {});
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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "LOGIN_CLICKED") {
    handleLoginClicked()
      .then((result) => sendResponse(result || { ok: true }))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "Unable to focus or open Zendesk login tab."
      }));
    return true;
  }
  if (msg.type === "ZIP_GET_AUTH_STATE") {
    sendResponse(getAuthStatePayload());
    return true;
  }
  if (msg.type === "ZIP_FORCE_CHECK") {
    forceCheck({
      reason: msg.reason || "zip_force_check"
    })
      .then((result) => sendResponse({ ...(result || {}), payload: getAuthStatePayload() }))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "Session check failed.",
        payload: getAuthStatePayload()
      }));
    return true;
  }
  if (msg.type === "ZIP_CHECK_SECRETS") {
    readZipSecretsStatus()
      .then((status) => sendResponse(status))
      .catch(() => sendResponse({
        ok: false,
        loaded: false,
        missing: ZIP_REQUIRED_SECRET_KEYS.slice()
      }));
    return true;
  }
  if (msg.type === "ZIP_IMPORT_KEY_PAYLOAD") {
    storeZipSecrets(msg && msg.config && typeof msg.config === "object" ? msg.config : {})
      .then((status) => sendResponse(status))
      .catch((err) => sendResponse({
        ok: false,
        loaded: false,
        error: err && err.message ? err.message : "Unable to import ZIP.KEY payload."
      }));
    return true;
  }
  if (msg.type === "ZIP_RUN_LOCALSTORAGE_MIGRATION") {
    runLocalStorageMigration(msg && msg.legacy && typeof msg.legacy === "object" ? msg.legacy : {})
      .then((status) => sendResponse(status))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "LocalStorage migration failed.",
        clearLocalStorageKeys: ZIP_LOCALSTORAGE_MIGRATION_SOURCE_KEYS.slice()
      }));
    return true;
  }
  if (msg.type === "ZIP_CLEAR_KEY") {
    clearZipSecrets()
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "Unable to clear ZIP.KEY secrets."
      }));
    return true;
  }
  if (msg.type === "ZIP_OPEN_OPTIONS") {
    (async () => {
      try {
        if (chrome.runtime && typeof chrome.runtime.openOptionsPage === "function") {
          await chrome.runtime.openOptionsPage();
        } else if (chrome.tabs && typeof chrome.tabs.create === "function") {
          await chrome.tabs.create({ url: chrome.runtime.getURL("options.html"), active: true });
        }
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: err && err.message ? err.message : "Unable to open ZIP settings."
        };
      }
    })().then((result) => sendResponse(result));
    return true;
  }
  if (msg.type === "ZD_SESSION_OK") {
    if (!isTrustedZendeskContentSender(sender)) {
      sendResponse({ ok: false, error: "Ignoring untrusted session source." });
      return true;
    }
    handleZendeskContentSessionOk(msg);
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "ZD_LOGOUT") {
    if (!isTrustedZendeskContentSender(sender)) {
      sendResponse({ ok: false, error: "Ignoring untrusted session source." });
      return true;
    }
    handleZendeskContentLogout(msg);
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "ZIP_REQUEST") {
    const { requestId, tabId, inner } = msg;
    sendMessageToTabWithZendeskRecovery(tabId, { type: "ZIP_FROM_BACKGROUND", requestId, inner })
      .then((result) => {
        if (!result.ok) {
          sendResponse({ type: "ZIP_RESPONSE", requestId, error: result.error || "Tab message failed." });
          return;
        }
        sendResponse(result.response || { type: "ZIP_RESPONSE", requestId, error: "No response" });
      })
      .catch((err) => sendResponse({
        type: "ZIP_RESPONSE",
        requestId,
        error: err && err.message ? err.message : "Tab message failed."
      }));
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
  if (msg.type === "ZIP_SLACK_OPENID_AUTH") {
    runSlackOpenIdAuth(msg)
      .then((result) => sendResponse(result || { ok: false, error: "Slack OpenID auth did not return a result." }))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "Slack OpenID authentication failed."
      }));
    return true;
  }
  if (msg.type === "ZIP_SLACK_OPENID_STATUS") {
    getSlackOpenIdStatus(msg)
      .then((result) => sendResponse(result || { ok: false, error: "No cached Slack OpenID session." }))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "Slack OpenID status check failed."
      }));
    return true;
  }
  if (msg.type === "ZIP_SLACK_API_AUTH_TEST") {
    slackAuthTestViaApi(msg)
      .then((result) => sendResponse(result || { ok: false, error: "Slack API auth test did not return a result." }))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "Slack API auth test failed."
      }));
    return true;
  }
  if (msg.type === "ZIP_SLACK_OPENID_CLEAR") {
    clearSlackOpenIdSession()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "Unable to clear Slack OpenID session."
      }));
    return true;
  }
  if (msg.type === "ZIP_SLACK_API_SEND_TO_SELF") {
    slackSendMarkdownToSelfViaApi(msg)
      .then((result) => sendResponse(result || { ok: false, error: "Slack API send did not return a result." }))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "Slack API send failed."
      }));
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
      if (action === "clearZipKey") {
        return clearZipSecrets();
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
    // Backward-compatible alias: still enforce the same strict main-tab Zendesk login behavior.
    handleLoginClicked()
      .then((result) => sendResponse(result || { ok: true }))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "Unable to focus or open Zendesk login tab."
      }));
    return true;
  }
  if (msg.type === "ZIP_ENSURE_ASSIGNED_FILTER_TAB") {
    ensureAssignedFilterTabInCurrentWindow(msg.url)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, error: err && err.message ? err.message : "Unable to open assigned filter tab" }));
    return true;
  }
});
