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
const ZIP_SLACK_BOT_TOKEN_STORAGE_KEY = "zip_slack_bot_token";
const ZIP_SLACK_LEGACY_USER_TOKEN_STORAGE_KEY = "zip_slack_user_token";
const ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY = "zip_slack_oauth_token";
const ZIP_SLACK_KEY_LOADED_STORAGE_KEY = "zip_slack_key_loaded";
const ZIP_SLACK_KEY_META_STORAGE_KEY = "zip_slack_key_meta";
const ZIP_SLACK_SESSION_CACHE_STORAGE_KEY = "zip_slack_session_cache_v1";
const ZIP_SINGULARITY_CHANNEL_ID_STORAGE_KEY = "zip_singularity_channel_id";
const ZIP_SINGULARITY_MENTION_STORAGE_KEY = "zip_singularity_mention";
const ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY = "zip_pass_transition_channel_id";
const ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY = "zip_pass_transition_channel_name";
const ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY = "zip_pass_transition_member_ids";
const ZIP_PASS_TRANSITION_RECIPIENTS_STORAGE_KEY = "zip_pass_transition_recipients";
const ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY = "zip_pass_transition_members_synced_at";
const ZIP_PENDING_WORKSPACE_CLIENT_DEEPLINK_STORAGE_KEY = "zip.pending.workspace.client.deeplink.v1";
// Runtime-config / storage values should populate tokens. Do not hardcode live tokens in source.
const SLACK_API_DEFAULT_BOT_TOKEN = "";
const SLACK_API_SECONDARY_BOT_TOKEN = "";
const SLACK_API_DEFAULT_USER_TOKEN = "";
const SLACK_OPENID_DEFAULT_SCOPES = "openid profile email";
const SLACK_OPENID_DEFAULT_REDIRECT_PATH = "slack-user";
const ZIP_OFFICIAL_SLACK_OPENID_REDIRECT_URI = "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org/slack-openid";
const ZIP_OFFICIAL_WORKSPACE_DEEPLINK_URI = "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org/slack-user";
const SLACK_OPENID_STATUS_VERIFY_TTL_MS = 60 * 1000;
const SLACK_TOKEN_FAILURE_BACKOFF_MS = 2 * 60 * 1000;
const PASS_TRANSITION_RECIPIENT_LOOKUP_CONCURRENCY = 6;
const ZIP_PANEL_PATH = "sidepanel.html";
const ZIP_WORKSPACE_DEEPLINK_QUERY_PARAM = "zipdeeplink";
const ZIP_APPLY_WORKSPACE_DEEPLINK_MESSAGE_TYPE = "ZIP_APPLY_WORKSPACE_DEEPLINK";
const ZIP_CONTENT_SCRIPT_FILE = "content.js";
const LEGACY_ZIP_KEY_BANNER_SELECTOR = "#zip-key-required-banner";
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
const MENU_ASK_TEAM = "zip_ask_team";
const MENU_GET_LATEST = "zip_get_latest";
const MENU_CLEAR_KEY_SEPARATOR = "zip_clear_key_separator";
const MENU_CLEAR_KEY = "zip_clear_key";
const MENU_THEME_PARENT = "zip_theme_parent";
const MENU_THEME_PREFIX = "zip_theme_";
const ASK_TEAM_EMAIL = "PrimetimeTAMs@adobe.com";
const OUTLOOK_DEEPLINK_COMPOSE_URL = "https://outlook.office.com/mail/deeplink/compose";
const GITHUB_OWNER = "HH5HH";
const GITHUB_REPO = "ZIP";
const ZIP_LATEST_REF_API_URL = "https://api.github.com/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/git/ref/heads/main";
const ZIP_LATEST_COMMIT_API_URL = "https://api.github.com/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/commits/main";
const ZIP_LATEST_MANIFEST_URL = "https://raw.githubusercontent.com/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/main/zip-chrome-extension/manifest.json";
const ZIP_LATEST_MANIFEST_API_URL = "https://api.github.com/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/contents/zip-chrome-extension/manifest.json?ref=main";
const ZIP_LATEST_PACKAGE_URL = "https://raw.githubusercontent.com/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/main/ziptool_distro.zip";
const CHROME_EXTENSIONS_URL = "chrome://extensions";
const UPDATE_CHECK_TTL_MS = 10 * 60 * 1000;
const CHROME_SIDEPANEL_SETTINGS_URL = "chrome://settings/?search=side%20panel";
const MENU_SIDEPANEL_POSITION_LABEL = "⚙ Side panel position";
const MENU_ASK_TEAM_LABEL = "✉ Ask the Team";
const MENU_APPEARANCE_LABEL = "👁 Appearance";
const MENU_CLEAR_KEY_LABEL = "⚠ Clear ZIP.KEY (Reset ZIP)";
const THEME_STORAGE_KEY = "zip.ui.theme.v1";
const ZIP_REQUIRED_SLACK_BOT_TOKEN_FIELD = "slacktivation.bot_token";
const ZIP_REQUIRED_SLACK_API_TOKEN_FIELD = "slacktivation.user_token";
const ZIP_REQUIRED_SECRET_KEYS = [
  ZIP_SLACK_CLIENT_ID_STORAGE_KEY,
  ZIP_SLACK_CLIENT_SECRET_STORAGE_KEY,
  ZIP_SINGULARITY_CHANNEL_ID_STORAGE_KEY,
  ZIP_SINGULARITY_MENTION_STORAGE_KEY
];
const ZIP_SLACK_STORAGE_KEYS = [
  ZIP_SLACK_CLIENT_ID_STORAGE_KEY,
  ZIP_SLACK_CLIENT_SECRET_STORAGE_KEY,
  ZIP_SLACK_SCOPE_STORAGE_KEY,
  ZIP_SLACK_REDIRECT_PATH_STORAGE_KEY,
  ZIP_SLACK_REDIRECT_URI_STORAGE_KEY,
  ZIP_SLACK_BOT_TOKEN_STORAGE_KEY,
  ZIP_SLACK_LEGACY_USER_TOKEN_STORAGE_KEY,
  ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY,
  ZIP_SLACK_KEY_LOADED_STORAGE_KEY,
  ZIP_SLACK_KEY_META_STORAGE_KEY,
  ZIP_SLACK_SESSION_CACHE_STORAGE_KEY,
  ZIP_SINGULARITY_CHANNEL_ID_STORAGE_KEY,
  ZIP_SINGULARITY_MENTION_STORAGE_KEY,
  ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY,
  ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY,
  ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY,
  ZIP_PASS_TRANSITION_RECIPIENTS_STORAGE_KEY,
  ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY
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
  : [{ id: "cornflower", name: "Cornflower" }];
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
  : (THEME_ACCENT_FAMILIES[0] ? THEME_ACCENT_FAMILIES[0].id : "cornflower");
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
      const baseLabel = String(accent.label || accent.id || "Color").trim() || "Color";
      options.push({
        id: "s2-" + stop.id + "-" + accent.id,
        label: stop.label + " X " + baseLabel,
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
  latestCommitSha: "",
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
const zipWorkspaceDeeplinkTabIds = new Set();
let sessionAboutToExpireSentForDeadline = 0;
const slackTokenBackoffUntilByToken = new Map();
const slackMentionUserIdCache = new Map();
let latestTicketEnrichmentMetrics = null;

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

async function clearLegacyZipKeyBannerFromZendeskTab(tabId) {
  if (!chrome.scripting || typeof chrome.scripting.executeScript !== "function") return false;
  if (tabId == null) return false;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (selector) => {
        try {
          const nodes = document.querySelectorAll(selector);
          nodes.forEach((node) => {
            if (node && typeof node.remove === "function") node.remove();
          });
        } catch (_) {}
      },
      args: [LEGACY_ZIP_KEY_BANNER_SELECTOR]
    });
    return true;
  } catch (_) {
    return false;
  }
}

async function clearLegacyZipKeyBannersFromZendeskTabs() {
  const tabs = await queryZendeskTabs();
  for (let i = 0; i < tabs.length; i += 1) {
    const tabId = tabs[i] && tabs[i].id;
    if (tabId == null) continue;
    await clearLegacyZipKeyBannerFromZendeskTab(tabId);
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

function getAskTeamMenuTitle() {
  if (contextMenuState.grouped) return MENU_ASK_TEAM_LABEL;
  return getZipRootMenuTitle() + " | " + MENU_ASK_TEAM_LABEL;
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
  const resolvers = [fetchLatestZipVersionFromGithubApi, fetchLatestZipVersionFromRaw];
  for (const resolveVersion of resolvers) {
    try {
      return await resolveVersion();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Latest version unavailable");
}

function normalizeCommitSha(value) {
  const sha = String(value || "").trim().toLowerCase();
  return /^[a-f0-9]{40}$/.test(sha) ? sha : "";
}

function extractCommitShaFromRefPayload(payload) {
  return normalizeCommitSha(payload && payload.object && payload.object.sha);
}

function extractCommitShaFromCommitPayload(payload) {
  return normalizeCommitSha(payload && payload.sha);
}

async function fetchLatestZipCommitShaFromRefApi() {
  const response = await fetch(ZIP_LATEST_REF_API_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const payload = await response.json();
  const sha = extractCommitShaFromRefPayload(payload);
  if (!sha) throw new Error("Git ref API commit SHA unavailable");
  return sha;
}

async function fetchLatestZipCommitShaFromCommitApi() {
  const response = await fetch(ZIP_LATEST_COMMIT_API_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const payload = await response.json();
  const sha = extractCommitShaFromCommitPayload(payload);
  if (!sha) throw new Error("Commit API SHA unavailable");
  return sha;
}

async function fetchLatestZipCommitSha() {
  let lastError = null;
  const resolvers = [fetchLatestZipCommitShaFromRefApi, fetchLatestZipCommitShaFromCommitApi];
  for (const resolveCommitSha of resolvers) {
    try {
      return await resolveCommitSha();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Latest commit SHA unavailable");
}

function withCacheBust(url) {
  const value = "cacheBust=" + Date.now();
  const text = String(url || "").trim();
  if (!text) return "";
  if (text.includes("?")) return text + "&" + value;
  return text + "?" + value;
}

function buildLatestZipPackageUrl(commitSha) {
  const normalizedSha = normalizeCommitSha(commitSha);
  const baseUrl = normalizedSha
    ? ("https://raw.githubusercontent.com/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/" + normalizedSha + "/ziptool_distro.zip")
    : ZIP_LATEST_PACKAGE_URL;
  return withCacheBust(baseUrl);
}

function sanitizeLatestPackageFileSegment(value, fallback) {
  const normalized = String(value || "")
    .trim()
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function buildLatestZipPackageFileName(latestVersion, commitSha) {
  const versionSegment = sanitizeLatestPackageFileSegment(latestVersion, "latest");
  const shaSegment = normalizeCommitSha(commitSha).slice(0, 7);
  return shaSegment
    ? ("ZIP-v" + versionSegment + "-" + shaSegment + ".zip")
    : ("ZIP-v" + versionSegment + ".zip");
}

function startLatestPackageDownload(downloadOptions) {
  if (!chrome.downloads || typeof chrome.downloads.download !== "function") {
    return Promise.reject(new Error("Chrome downloads API unavailable"));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const finishResolve = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    const finishReject = (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    try {
      const maybePromise = chrome.downloads.download(downloadOptions, (downloadId) => {
        const runtimeError = chrome.runtime && chrome.runtime.lastError;
        if (runtimeError) {
          finishReject(new Error(runtimeError.message || "Chrome downloads API failed"));
          return;
        }
        finishResolve(downloadId);
      });
      if (maybePromise && typeof maybePromise.then === "function") {
        maybePromise.then(finishResolve, finishReject);
      }
    } catch (error) {
      finishReject(error instanceof Error ? error : new Error(String(error || "Chrome downloads API failed")));
    }
  });
}

function getUpdateStatePayload() {
  return {
    currentVersion: updateState.currentVersion || getZipBuildVersion(),
    latestVersion: updateState.latestVersion || "",
    latestCommitSha: updateState.latestCommitSha || "",
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
    const prevLatestCommitSha = updateState.latestCommitSha;
    const prevUpdateAvailable = !!updateState.updateAvailable;
    const prevCheckError = updateState.checkError;
    try {
      const [latestVersion, latestCommitSha] = await Promise.all([
        fetchLatestZipVersion(),
        fetchLatestZipCommitSha().catch(() => "")
      ]);
      updateState.latestVersion = latestVersion;
      updateState.latestCommitSha = normalizeCommitSha(latestCommitSha);
      updateState.updateAvailable = compareVersions(currentVersion, latestVersion) < 0;
      updateState.checkError = "";
    } catch (err) {
      updateState.latestVersion = prevLatestVersion || "";
      updateState.latestCommitSha = prevLatestCommitSha || "";
      updateState.updateAvailable = prevUpdateAvailable;
      updateState.checkError = err && err.message ? err.message : "Version check failed";
    } finally {
      updateState.lastCheckedAt = Date.now();
      updateState.inFlight = null;
    }
    const payload = getUpdateStatePayload();
    const changed = (
      prevLatestVersion !== updateState.latestVersion
      || prevLatestCommitSha !== updateState.latestCommitSha
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

function isTrustedZendeskSenderUrl(rawUrl) {
  const candidate = String(rawUrl || "").trim();
  if (!candidate) return false;
  try {
    const url = new URL(candidate);
    const host = String(url.hostname || "").toLowerCase();
    return host === (config.subdomain + ".zendesk.com");
  } catch (_) {
    return false;
  }
}

function collectZendeskSenderUrlCandidates(sender) {
  const candidates = [
    sender && sender.url,
    sender && sender.origin,
    sender && sender.documentUrl,
    sender && sender.documentOrigin,
    sender && sender.tab && sender.tab.url
  ];
  const seen = new Set();
  const normalized = [];
  for (const value of candidates) {
    const url = String(value || "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    normalized.push(url);
  }
  return normalized;
}

function isTrustedZendeskContentSender(sender) {
  const candidates = collectZendeskSenderUrlCandidates(sender);
  for (const candidate of candidates) {
    if (isTrustedZendeskSenderUrl(candidate)) return true;
  }
  return false;
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

function isRetryableSlackWorkspaceSessionErrorMessage(message) {
  const lower = String(message || "").trim().toLowerCase();
  if (!lower) return false;
  return lower.includes("token not found")
    || lower.includes("session token")
    || lower.includes("waiting for web token capture")
    || lower.includes("complete login first")
    || lower.includes("slack session unavailable")
    || lower.includes("not a slack tab");
}

function extractSlackSessionTokenFromAuthResult(result) {
  if (!result || typeof result !== "object") return "";
  return normalizeSlackApiToken(
    result.session_token
    || result.sessionToken
    || result.web_token
    || result.webToken
    || result.user_token
    || result.userToken
    || result.token
    || ""
  );
}

async function persistSlackRuntimeUserToken(token) {
  const normalizedToken = normalizeSlackApiToken(token);
  if (!normalizedToken || !isSlackUserOAuthToken(normalizedToken)) return "";
  await Promise.all([
    setStorageLocal({ [ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY]: normalizedToken }),
    removeStorageLocal([ZIP_SLACK_LEGACY_USER_TOKEN_STORAGE_KEY])
  ]);
  clearSlackTokenBackoff(normalizedToken);
  return normalizedToken;
}

async function captureSlackRuntimeUserTokenFromWorkspaceSession(options) {
  const opts = options && typeof options === "object" ? options : {};
  const workspaceOrigin = normalizeSlackWorkspaceOrigin(opts.workspaceOrigin || SLACK_WORKSPACE_ORIGIN);
  const expectedUserId = normalizeSlackUserId(
    opts.expectedUserId
    || opts.expected_user_id
    || ""
  );
  const allowCreateTab = opts.allowCreateTab !== false;
  let bootstrapTabId = null;
  try {
    let tabs = await queryInjectableSlackTabs(workspaceOrigin);
    if (!tabs.length && allowCreateTab) {
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
        error: "No active Slack workspace tab is available for Slack session hydration."
      };
    }

    let lastFailureCode = "slack_user_token_missing";
    let lastFailureError = "Slack session token not found yet. Finish login in the adobedx.slack.com tab.";
    for (let i = 0; i < orderedTabs.length; i += 1) {
      const tab = orderedTabs[i];
      if (!tab || tab.id == null) continue;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        let authResult = null;
        try {
          authResult = await sendSlackInnerRequestToTab(tab.id, {
            action: "slackAuthTest",
            workspaceOrigin
          });
        } catch (err) {
          authResult = {
            ok: false,
            code: "slack_workspace_session_unavailable",
            error: err && err.message ? err.message : "Slack workspace session auth failed."
          };
        }

        const candidateToken = extractSlackSessionTokenFromAuthResult(authResult);
        let candidateUserId = normalizeSlackUserId(
          authResult && (authResult.user_id || authResult.userId || "")
        );
        const candidateUserName = normalizeSlackDisplayName(
          authResult && (authResult.user_name || authResult.userName || "")
        );
        const candidateAvatarUrl = normalizeSlackAvatarUrl(
          authResult && (authResult.avatar_url || authResult.avatarUrl || "")
        );
        const candidateTeamId = normalizeSlackTeamId(
          authResult && (authResult.team_id || authResult.teamId || "")
        );

        if (candidateToken) {
          if (expectedUserId && !candidateUserId) {
            const authCheck = await postSlackApiWithBearerToken(workspaceOrigin, "/api/auth.test", {
              _x_reason: "zip-workspace-session-capture-bg"
            }, candidateToken);
            if (!authCheck || !authCheck.ok) {
              lastFailureCode = String(authCheck && authCheck.code || "slack_auth_failed").trim().toLowerCase() || "slack_auth_failed";
              lastFailureError = String(authCheck && authCheck.error || "Unable to validate Slack workspace session token.").trim();
              if (isRetryableSlackWorkspaceSessionErrorMessage(lastFailureError) && attempt < 2) {
                await sleepMs(700);
                continue;
              }
              break;
            }
            const authPayload = authCheck.payload && typeof authCheck.payload === "object" ? authCheck.payload : {};
            candidateUserId = normalizeSlackUserId(authPayload.user_id || authPayload.user || "");
          }
          if (expectedUserId && candidateUserId && candidateUserId !== expectedUserId) {
            lastFailureCode = "slack_identity_mismatch";
            lastFailureError = "Slack workspace session does not match the active Slack user.";
            break;
          }
          const persistedToken = await persistSlackRuntimeUserToken(candidateToken);
          return {
            ok: true,
            userToken: persistedToken || candidateToken,
            userId: candidateUserId,
            userName: candidateUserName,
            avatarUrl: candidateAvatarUrl,
            teamId: candidateTeamId
          };
        }

        const resultCode = String(authResult && authResult.code || "").trim().toLowerCase();
        const resultError = String(
          (authResult && (
            authResult.error
            || authResult.warning
            || authResult.message
          ))
          || "Slack workspace session token not found yet."
        ).trim();
        lastFailureCode = resultCode || "slack_user_token_missing";
        lastFailureError = resultError || "Slack workspace session token not found yet.";
        if (isRetryableSlackWorkspaceSessionErrorMessage(lastFailureError) && attempt < 2) {
          await sleepMs(700);
          continue;
        }
        break;
      }
    }

    return {
      ok: false,
      code: lastFailureCode,
      error: lastFailureError
    };
  } finally {
    if (bootstrapTabId != null && opts.keepBootstrapTab !== true) {
      await closeTabSilently(bootstrapTabId);
    }
  }
}

function buildSlackNewMessageFields(fields) {
  const source = fields && typeof fields === "object" ? { ...fields } : {};
  delete source.thread_ts;
  delete source.threadTs;
  delete source.parent_ts;
  delete source.parentTs;
  delete source.reply_broadcast;
  return source;
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
            markdownText: body.markdownText || body.text || body.messageText || "",
            forceNewMessage: true
          });
          if (result && result.ok === true) {
            const deliveredChannel = String(result.channel || "").trim();
            const deliveredTs = String(result.ts || "").trim();
            const directChannelId = normalizeSlackDirectChannelId(deliveredChannel);
            return {
              ok: true,
              channel: deliveredChannel,
              direct_channel_id: directChannelId,
              ts: deliveredTs,
              user_id: String(result.user_id || body.userId || body.user_id || "").trim(),
              team_id: String(result.team_id || "").trim(),
              user_name: String(result.user_name || body.userName || body.user_name || "").trim(),
              avatar_url: String(result.avatar_url || body.avatarUrl || body.avatar_url || "").trim(),
              delivery_mode: "workspace_session_dm",
              unread_marked: result.unread_marked === true,
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

async function postSlackApiViaWorkspaceSession(input) {
  const body = input && typeof input === "object" ? input : {};
  const workspaceOrigin = normalizeSlackWorkspaceOrigin(body.workspaceOrigin || SLACK_WORKSPACE_ORIGIN);
  const apiPath = String(body.apiPath || body.api_path || "").trim();
  if (!apiPath) {
    return {
      ok: false,
      code: "slack_api_path_missing",
      error: "Slack API path is required."
    };
  }
  const shouldBootstrapTab = body.allowCreateTab === true;
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
        error: "No active Slack workspace tab is available for session API access."
      };
    }

    let lastFailureCode = "slack_workspace_session_unavailable";
    let lastFailureError = "Slack workspace session request failed.";
    for (let i = 0; i < orderedTabs.length; i += 1) {
      const tab = orderedTabs[i];
      if (!tab || tab.id == null) continue;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const result = await sendSlackInnerRequestToTab(tab.id, {
            action: "slackApiProxy",
            workspaceOrigin,
            apiPath,
            fields: body.fields && typeof body.fields === "object" ? body.fields : {}
          });
          if (result && result.ok === true) {
            return result;
          }
          lastFailureCode = String(result && result.code || "slack_workspace_session_unavailable").trim().toLowerCase() || "slack_workspace_session_unavailable";
          lastFailureError = String((result && result.error) || "Slack workspace session request failed.").trim();
        } catch (err) {
          lastFailureCode = "slack_workspace_session_unavailable";
          lastFailureError = err && err.message ? err.message : "Slack workspace session request failed.";
        }
        if (!isRetryableSlackWorkspaceSessionErrorMessage(lastFailureError) || attempt >= 2) break;
        await sleepMs(700);
      }
    }

    return {
      ok: false,
      code: lastFailureCode,
      error: lastFailureError
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

function resolveExpectedSlackAuthorUserId(input, openIdSession) {
  const source = input && typeof input === "object" ? input : {};
  const session = openIdSession && typeof openIdSession === "object" ? openIdSession : null;
  return firstNonEmptySlackText([
    normalizeSlackUserId(source.authorUserId || source.author_user_id || ""),
    normalizeSlackUserId(source.senderUserId || source.sender_user_id || ""),
    normalizeSlackUserId(source.expectedUserId || source.expected_user_id || ""),
    normalizeSlackUserId(session && session.userId || "")
  ]);
}

function decodeSlackEntityText(value) {
  return String(value == null ? "" : value)
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#64;/gi, "@")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'");
}

function normalizeSlackMentionText(value) {
  const raw = decodeSlackEntityText(String(value || "").trim());
  if (!raw) return "";
  if (/^<@[UW][A-Z0-9]{8,}>$/i.test(raw)) return raw;
  const plain = raw.startsWith("@") ? raw.slice(1).trim() : raw;
  if (!plain) return "";
  return "@" + plain;
}

function normalizeSlackMentionHandle(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^<@[UW][A-Z0-9]{8,}>$/i.test(raw)) return "";
  const plain = raw.startsWith("@") ? raw.slice(1) : raw;
  return String(plain || "").trim().toLowerCase();
}

function normalizeSlackHandleLoose(value) {
  const normalized = normalizeSlackMentionHandle(value);
  if (!normalized) return "";
  return normalized.replace(/[^a-z0-9._-]+/g, "");
}

function normalizeSlackEmailAddress(value) {
  const text = String(value || "").replace(/\s+/g, "").trim().toLowerCase();
  if (!text || text.length > 160) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : "";
}

function firstNonEmptySlackText(values) {
  const rows = Array.isArray(values) ? values : [values];
  for (let i = 0; i < rows.length; i += 1) {
    const text = String(rows[i] || "").trim();
    if (text) return text;
  }
  return "";
}

async function mapWithConcurrencyLimit(items, concurrency, mapper) {
  const rows = Array.isArray(items) ? items : [];
  if (!rows.length) return [];
  const limit = Math.max(1, Math.min(Number(concurrency) || 1, rows.length));
  const output = new Array(rows.length);
  let cursor = 0;
  const worker = async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= rows.length) return;
      output[index] = await mapper(rows[index], index);
    }
  };
  const workers = [];
  for (let i = 0; i < limit; i += 1) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return output;
}

function doesSlackUserMatchMentionHandle(user, handle) {
  const target = normalizeSlackMentionHandle(handle);
  if (!target) return false;
  const targetLoose = normalizeSlackHandleLoose(target);
  const source = user && typeof user === "object" ? user : {};
  const profile = source.profile && typeof source.profile === "object" ? source.profile : {};
  const candidates = [
    source.name,
    source.real_name,
    profile.display_name_normalized,
    profile.display_name,
    profile.real_name_normalized,
    profile.real_name
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = normalizeSlackMentionHandle(candidates[i]);
    if (!candidate) continue;
    if (candidate === target) return true;
    const candidateLoose = normalizeSlackHandleLoose(candidate);
    if (candidateLoose && targetLoose && candidateLoose === targetLoose) return true;
  }
  return false;
}

function doesSlackMessageIdentityMatchMentionHandle(message, handle) {
  const target = normalizeSlackMentionHandle(handle);
  if (!target) return false;
  const targetLoose = normalizeSlackHandleLoose(target);
  const source = message && typeof message === "object" ? message : {};
  const profile = source.user_profile && typeof source.user_profile === "object" ? source.user_profile : {};
  const botProfile = source.bot_profile && typeof source.bot_profile === "object" ? source.bot_profile : {};
  const candidates = [
    source.username,
    source.app_name,
    source.user_display_name,
    profile.display_name_normalized,
    profile.display_name,
    profile.real_name_normalized,
    profile.real_name,
    botProfile.name,
    botProfile.app_name
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = normalizeSlackMentionHandle(candidates[i]);
    if (!candidate) continue;
    if (candidate === target) return true;
    const candidateLoose = normalizeSlackHandleLoose(candidate);
    if (candidateLoose && targetLoose && candidateLoose === targetLoose) return true;
  }
  return false;
}

function parseSlackUserIdFromMention(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^<@([UW][A-Z0-9]{8,})>$/i);
  return match ? normalizeSlackUserId(match[1] || "") : "";
}

function stripSlackMentionPrefix(text, mention) {
  const value = String(text || "");
  const prefix = String(mention || "").trim();
  if (!prefix) return value;
  if (!value.toLowerCase().startsWith(prefix.toLowerCase())) return value;
  return value.slice(prefix.length).trim();
}

async function resolveSlackUserIdByMentionViaApi(apiOrigin, token, mention) {
  const handle = normalizeSlackMentionHandle(mention);
  if (!handle) return "";
  const origin = normalizeSlackWorkspaceOrigin(apiOrigin);
  const cacheKey = origin + "::" + handle;
  const cached = normalizeSlackUserId(slackMentionUserIdCache.get(cacheKey) || "");
  if (cached) return cached;

  let cursor = "";
  for (let page = 0; page < 3; page += 1) {
    const fields = {
      limit: 500,
      _x_reason: "zip-qai-resolve-mention-user-bg"
    };
    if (cursor) fields.cursor = cursor;
    const usersList = await postSlackApiWithBearerToken(origin, "/api/users.list", fields, token);
    if (!usersList || !usersList.ok) break;
    const payload = usersList.payload && typeof usersList.payload === "object" ? usersList.payload : {};
    const members = Array.isArray(payload.members) ? payload.members : [];
    for (let i = 0; i < members.length; i += 1) {
      const member = members[i];
      if (!member || typeof member !== "object") continue;
      const memberId = normalizeSlackUserId(member.id || member.user_id || "");
      if (!memberId) continue;
      if (!doesSlackUserMatchMentionHandle(member, handle)) continue;
      slackMentionUserIdCache.set(cacheKey, memberId);
      return memberId;
    }
    cursor = String(payload && payload.response_metadata && payload.response_metadata.next_cursor || "").trim();
    if (!cursor) break;
  }
  return "";
}

async function resolveSlackUserIdFromChannelHistoryViaApi(apiOrigin, token, channelId, mention) {
  const handle = normalizeSlackMentionHandle(mention);
  const targetChannel = normalizeSlackChannelId(channelId);
  if (!handle || !targetChannel) return "";
  const origin = normalizeSlackWorkspaceOrigin(apiOrigin);
  const cacheKey = origin + "::" + handle;
  const cached = normalizeSlackUserId(slackMentionUserIdCache.get(cacheKey) || "");
  if (cached) return cached;

  const history = await postSlackApiWithBearerToken(origin, "/api/conversations.history", {
    channel: targetChannel,
    limit: 120,
    inclusive: "false",
    _x_reason: "zip-qai-resolve-mention-history-bg"
  }, token);
  if (!history || !history.ok) return "";
  const payload = history.payload && typeof history.payload === "object" ? history.payload : {};
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];
    if (!message || typeof message !== "object") continue;
    const messageUserId = normalizeSlackUserId(
      message.user
      || message.user_id
      || (message.user_profile && message.user_profile.id)
      || ""
    );
    if (!messageUserId) continue;
    if (!doesSlackMessageIdentityMatchMentionHandle(message, handle)) continue;
    slackMentionUserIdCache.set(cacheKey, messageUserId);
    return messageUserId;
  }
  return "";
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

function normalizeSlackStatusIconName(value) {
  const name = String(value || "").trim().toLowerCase();
  if (!name) return "";
  return /^[a-z0-9_+\-]{1,64}$/.test(name) ? (":" + name + ":") : "";
}

function normalizeSlackStatusIcon(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const alias = normalizeSlackStatusIconName(raw);
  if (alias) return alias;
  if (/^:[a-z0-9_+\-]{1,64}:$/i.test(raw)) return raw.toLowerCase();
  const normalized = raw.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.slice(0, 32);
}

function normalizeSlackStatusMessage(value) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.slice(0, 160);
}

function normalizeSlackStatusIconUrl(value) {
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

function pickSlackStatusFromDisplayInfo(displayInfo) {
  const rows = Array.isArray(displayInfo)
    ? displayInfo
    : (displayInfo ? [displayInfo] : []);
  for (let i = 0; i < rows.length; i += 1) {
    const entry = rows[i];
    if (!entry || typeof entry !== "object") continue;
    const statusIconUrl = normalizeSlackStatusIconUrl(
      entry.display_url
      || entry.image_url
      || entry.url
      || entry.icon_url
      || entry.iconUrl
      || ""
    );
    const statusIcon = normalizeSlackStatusIcon(
      entry.unicode
      || entry.emoji_string
      || entry.emoji
      || entry.display_alias
      || entry.display_name
      || entry.name
      || entry.emoji_name
      || ""
    ) || normalizeSlackStatusIconName(entry.name || entry.emoji_name || "");
    if (statusIcon || statusIconUrl) {
      return { statusIcon, statusIconUrl };
    }
  }
  return { statusIcon: "", statusIconUrl: "" };
}

function pickSlackStatusFromProfile(profile, userRecord) {
  const source = profile && typeof profile === "object" ? profile : {};
  const user = userRecord && typeof userRecord === "object" ? userRecord : {};
  const userProfile = user.profile && typeof user.profile === "object" ? user.profile : {};
  const displayInfo = pickSlackStatusFromDisplayInfo(
    source.status_emoji_display_info
    || userProfile.status_emoji_display_info
    || null
  );
  const statusIcon = normalizeSlackStatusIcon(
    source.status_emoji
    || userProfile.status_emoji
    || displayInfo.statusIcon
    || ""
  ) || displayInfo.statusIcon;
  const statusIconUrl = normalizeSlackStatusIconUrl(
    source.status_emoji_url
    || userProfile.status_emoji_url
    || displayInfo.statusIconUrl
    || ""
  );
  const statusMessage = normalizeSlackStatusMessage(
    source.status_text
    || source.status_text_canonical
    || userProfile.status_text
    || userProfile.status_text_canonical
    || ""
  );
  return { statusIcon, statusIconUrl, statusMessage };
}

function extractSlackIdentityFromUsersProfilePayload(payload) {
  const source = payload && typeof payload === "object" ? payload : {};
  const profile = source.profile && typeof source.profile === "object" ? source.profile : {};
  const status = pickSlackStatusFromProfile(profile, null);
  return {
    userName: pickSlackDisplayNameFromProfile(profile, null),
    avatarUrl: pickSlackAvatarFromProfile(profile),
    statusIcon: status.statusIcon,
    statusIconUrl: status.statusIconUrl,
    statusMessage: status.statusMessage
  };
}

function extractSlackIdentityFromUsersInfoPayload(payload) {
  const source = payload && typeof payload === "object" ? payload : {};
  const user = source.user && typeof source.user === "object" ? source.user : {};
  const profile = user.profile && typeof user.profile === "object" ? user.profile : {};
  const status = pickSlackStatusFromProfile(profile, user);
  return {
    userName: pickSlackDisplayNameFromProfile(profile, user),
    avatarUrl: pickSlackAvatarFromProfile(profile),
    statusIcon: status.statusIcon,
    statusIconUrl: status.statusIconUrl,
    statusMessage: status.statusMessage
  };
}

function buildPassTransitionRecipientLabel(fullName, handle, fallback) {
  const normalizedName = normalizeSlackDisplayName(fullName || fallback);
  const normalizedHandle = normalizeSlackHandleLoose(handle);
  if (
    normalizedName
    && normalizedHandle
    && normalizedName.replace(/^@+/, "").trim().toLowerCase() !== normalizedHandle.toLowerCase()
  ) {
    return normalizedName + " (@" + normalizedHandle + ")";
  }
  if (normalizedName) return normalizedName;
  if (normalizedHandle) return "@" + normalizedHandle;
  return firstNonEmptySlackText([
    normalizeSlackDisplayName(fallback),
    normalizeSlackEmailAddress(fallback),
    normalizeSlackUserId(fallback)
  ]);
}

function extractPassTransitionRecipientFromUsersInfoPayload(payload, fallbackUserId) {
  const source = payload && typeof payload === "object" ? payload : {};
  const user = source.user && typeof source.user === "object" ? source.user : {};
  const profile = user.profile && typeof user.profile === "object" ? user.profile : {};
  const userId = normalizeSlackUserId(user.id || fallbackUserId);
  if (!userId) return null;
  const userName = pickSlackDisplayNameFromProfile(profile, user);
  const realName = normalizeSlackDisplayName(profile.real_name || user.real_name || "");
  const handle = normalizeSlackHandleLoose(user.name || "")
    || (!/\s/.test(userName) ? normalizeSlackHandleLoose(userName) : "");
  const email = normalizeSlackEmailAddress(profile.email || "");
  const avatarUrl = pickSlackAvatarFromProfile(profile);
  const status = pickSlackStatusFromProfile(profile, user);
  const fullName = firstNonEmptySlackText([realName, userName, email, userId]);
  const label = buildPassTransitionRecipientLabel(fullName, handle, fullName);
  return {
    userId,
    userName,
    displayName: firstNonEmptySlackText([userName, realName]),
    realName,
    handle,
    email,
    avatarUrl,
    statusIcon: status.statusIcon,
    statusIconUrl: status.statusIconUrl,
    statusMessage: status.statusMessage,
    deleted: user.deleted === true,
    bot: user.is_bot === true || user.is_app_user === true,
    label: label || ("@" + userId)
  };
}

function normalizeCachedPassTransitionRecipient(input) {
  const raw = input && typeof input === "object" ? input : {};
  const userId = normalizeSlackUserId(raw.userId || raw.user_id || "");
  if (!userId) return null;
  const userName = normalizeSlackDisplayName(
    raw.userName
    || raw.user_name
    || raw.displayName
    || raw.display_name
    || ""
  );
  const label = normalizeSlackDisplayName(raw.label || "") || userName || ("@" + userId);
  return {
    userId,
    userName,
    displayName: normalizeSlackDisplayName(raw.displayName || raw.display_name || ""),
    realName: normalizeSlackDisplayName(raw.realName || raw.real_name || ""),
    handle: normalizeSlackHandleLoose(raw.handle || ""),
    email: normalizeSlackEmailAddress(raw.email || ""),
    avatarUrl: normalizeSlackAvatarUrl(raw.avatarUrl || raw.avatar_url || ""),
    statusIcon: normalizeSlackStatusIcon(raw.statusIcon || raw.status_icon || ""),
    statusIconUrl: normalizeSlackStatusIconUrl(raw.statusIconUrl || raw.status_icon_url || ""),
    statusMessage: normalizeSlackStatusMessage(raw.statusMessage || raw.status_message || ""),
    deleted: raw.deleted === true,
    bot: raw.bot === true,
    label
  };
}

function normalizeCachedPassTransitionRecipientList(value) {
  let rows = value;
  if (typeof rows === "string") {
    const trimmed = rows.trim();
    if (!trimmed) return [];
    try {
      rows = JSON.parse(trimmed);
    } catch (_) {
      rows = [];
    }
  }
  const input = Array.isArray(rows) ? rows : [];
  const output = [];
  const seen = new Set();
  for (let i = 0; i < input.length; i += 1) {
    const normalized = normalizeCachedPassTransitionRecipient(input[i]);
    if (!normalized || seen.has(normalized.userId)) continue;
    seen.add(normalized.userId);
    output.push(normalized);
  }
  return output;
}

async function fetchPassTransitionRecipientViaApi(workspaceOrigin, token, userId) {
  const resolvedUserId = normalizeSlackUserId(userId);
  if (!resolvedUserId) {
    return {
      ok: false,
      code: "slack_user_identity_missing",
      error: "Slack user ID is required for PASS-TRANSITION recipient lookup."
    };
  }
  const targetOrigins = [];
  const pushOrigin = (value) => {
    const normalized = normalizeSlackWorkspaceOrigin(value);
    if (!normalized) return;
    if (!targetOrigins.includes(normalized)) targetOrigins.push(normalized);
  };
  pushOrigin(SLACK_WEB_API_ORIGIN);
  pushOrigin(workspaceOrigin);
  let lastFailure = {
    ok: false,
    code: "slack_user_info_unavailable",
    error: "Unable to load PASS-TRANSITION recipient details from Slack."
  };
  for (let originIdx = 0; originIdx < targetOrigins.length; originIdx += 1) {
    const origin = targetOrigins[originIdx];
    const userInfoResult = await postSlackApiWithBearerToken(
      origin,
      "/api/users.info",
      {
        user: resolvedUserId,
        include_locale: "false",
        _x_reason: "zip-pass-transition-user-info-bg"
      },
      token
    );
    if (!userInfoResult || userInfoResult.ok !== true) {
      lastFailure = {
        ok: false,
        code: String(userInfoResult && userInfoResult.code || "slack_user_info_unavailable").trim().toLowerCase() || "slack_user_info_unavailable",
        error: String(userInfoResult && userInfoResult.error || "Unable to load PASS-TRANSITION recipient details from Slack.").trim()
      };
      continue;
    }
    const recipient = extractPassTransitionRecipientFromUsersInfoPayload(userInfoResult.payload, resolvedUserId);
    if (recipient) {
      return {
        ok: true,
        recipient
      };
    }
    lastFailure = {
      ok: false,
      code: "slack_user_info_unavailable",
      error: "Slack returned an incomplete PASS-TRANSITION recipient record."
    };
  }
  return lastFailure;
}

async function hydratePassTransitionRecipientsViaWorkspaceSession(options) {
  const opts = options && typeof options === "object" ? options : {};
  const channelId = normalizeSlackChannelId(opts.channelId || opts.channel_id || "");
  const channelName = String(opts.channelName || opts.channel_name || "").trim();
  if (!channelId) {
    return {
      ok: false,
      code: "pass_transition_channel_missing",
      error: "PASS-TRANSITION channel ID is not configured in ZIP.KEY."
    };
  }
  let bootstrapTabId = null;
  try {
    let tabs = await queryInjectableSlackTabs(SLACK_WORKSPACE_ORIGIN);
    if (!tabs.length && opts.allowCreateTab === true) {
      const bootstrapTab = await openSlackWorkspaceBootstrapTab(SLACK_WORKSPACE_ORIGIN);
      if (bootstrapTab && bootstrapTab.id != null) {
        bootstrapTabId = Number(bootstrapTab.id);
        await waitForTabComplete(bootstrapTabId, 7000);
        await sleepMs(800);
        tabs = await queryInjectableSlackTabs(SLACK_WORKSPACE_ORIGIN);
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
        error: "No active Slack workspace tab is available for PASS-TRANSITION hydration."
      };
    }

    const callSlackApiProxy = async (tabId, apiPath, fields) => sendSlackInnerRequestToTab(tabId, {
      action: "slackApiProxy",
      workspaceOrigin: SLACK_WORKSPACE_ORIGIN,
      apiPath,
      fields
    });

    let lastFailureCode = "slack_workspace_session_unavailable";
    let lastFailureError = "Slack workspace session request failed.";
    for (let tabIndex = 0; tabIndex < orderedTabs.length; tabIndex += 1) {
      const tab = orderedTabs[tabIndex];
      if (!tab || tab.id == null) continue;
      const tabId = Number(tab.id);
      try {
        const authResult = await callSlackApiProxy(tabId, "/api/auth.test", {
          _x_reason: "zip-pass-transition-session-auth-bg"
        });
        if (!authResult || authResult.ok !== true) {
          lastFailureCode = String(authResult && authResult.code || "invalid_auth").trim().toLowerCase() || "invalid_auth";
          lastFailureError = String(authResult && authResult.error || "Slack session unavailable.").trim();
          continue;
        }

        const rosterResult = await callSlackApiProxy(tabId, "/api/conversations.members", {
          channel: channelId,
          limit: 1000,
          _x_reason: "zip-pass-transition-session-members-bg"
        });
        if (!rosterResult || rosterResult.ok !== true) {
          lastFailureCode = String(rosterResult && rosterResult.code || "slack_user_info_unavailable").trim().toLowerCase() || "slack_user_info_unavailable";
          lastFailureError = String(rosterResult && rosterResult.error || "Unable to load PASS-TRANSITION members from the active Slack session.").trim();
          continue;
        }

        const authPayload = authResult.payload && typeof authResult.payload === "object" ? authResult.payload : {};
        const rosterPayload = rosterResult.payload && typeof rosterResult.payload === "object" ? rosterResult.payload : {};
        const selfUserId = normalizeSlackUserId(authPayload.user_id || authPayload.user || "");
        const memberIds = normalizeSlackUserIdList(rosterPayload.members);
        const recipients = [];
        const seenRecipients = new Set();
        let lastLookupFailureCode = "";
        let lastLookupFailureError = "";
        for (let i = 0; i < memberIds.length; i += 1) {
          const memberId = normalizeSlackUserId(memberIds[i]);
          if (!memberId || seenRecipients.has(memberId)) continue;
          const userInfo = await callSlackApiProxy(tabId, "/api/users.info", {
            user: memberId,
            include_locale: "false",
            _x_reason: "zip-pass-transition-session-user-info-bg"
          });
          if (!userInfo || userInfo.ok !== true) {
            lastLookupFailureCode = String(userInfo && userInfo.code || "slack_user_info_unavailable").trim().toLowerCase() || "slack_user_info_unavailable";
            lastLookupFailureError = String(userInfo && userInfo.error || "Unable to load PASS-TRANSITION recipient details from Slack.").trim();
            continue;
          }
          const recipient = extractPassTransitionRecipientFromUsersInfoPayload(userInfo.payload, memberId);
          if (!recipient || !recipient.userId || recipient.deleted === true || recipient.bot === true) continue;
          seenRecipients.add(recipient.userId);
          recipients.push({
            userId: recipient.userId,
            isSelf: !!(selfUserId && recipient.userId === selfUserId),
            userName: normalizeSlackDisplayName(recipient.userName || ""),
            displayName: normalizeSlackDisplayName(recipient.displayName || recipient.userName || recipient.realName || ""),
            realName: normalizeSlackDisplayName(recipient.realName || ""),
            handle: normalizeSlackHandleLoose(recipient.handle || ""),
            email: normalizeSlackEmailAddress(recipient.email || ""),
            avatarUrl: normalizeSlackAvatarUrl(recipient.avatarUrl || ""),
            statusIcon: normalizeSlackStatusIcon(recipient.statusIcon || ""),
            statusIconUrl: normalizeSlackStatusIconUrl(recipient.statusIconUrl || ""),
            statusMessage: normalizeSlackStatusMessage(recipient.statusMessage || ""),
            label: normalizeSlackDisplayName(recipient.label || "") || ("@" + recipient.userId)
          });
        }
        if (memberIds.length > 0 && recipients.length === 0) {
          lastFailureCode = lastLookupFailureCode || "slack_user_info_unavailable";
          lastFailureError = lastLookupFailureError || "Unable to load PASS-TRANSITION recipient details from Slack.";
          continue;
        }

        recipients.sort((left, right) => {
          const leftIsSelf = !!(left && left.isSelf);
          const rightIsSelf = !!(right && right.isSelf);
          if (leftIsSelf !== rightIsSelf) return leftIsSelf ? -1 : 1;
          return String(left && left.label || "").localeCompare(String(right && right.label || ""), undefined, {
            sensitivity: "base"
          });
        });

        const membersSyncedAt = nowIso();
        await setStorageLocal({
          [ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY]: channelId,
          [ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY]: channelName,
          [ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY]: normalizeSlackUserIdCsv(memberIds),
          [ZIP_PASS_TRANSITION_RECIPIENTS_STORAGE_KEY]: recipients,
          [ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY]: membersSyncedAt
        });

        return {
          ok: true,
          cached: false,
          hydrated: true,
          channelId,
          channelName,
          memberIds,
          memberCount: memberIds.length,
          membersSyncedAt,
          synced: memberIds.length > 0,
          selfUserId,
          members: recipients,
          tokenKind: "workspace_session"
        };
      } catch (err) {
        lastFailureCode = "slack_workspace_session_unavailable";
        lastFailureError = err && err.message ? err.message : "Slack workspace session request failed.";
      }
    }

    return {
      ok: false,
      code: lastFailureCode,
      error: lastFailureError
    };
  } finally {
    if (bootstrapTabId != null) {
      await closeTabSilently(bootstrapTabId);
    }
  }
}

async function fetchSlackIdentityViaApi(workspaceOrigin, token, userId) {
  const resolvedUserId = normalizeSlackUserId(userId);
  const identity = {
    userName: "",
    avatarUrl: "",
    statusIcon: "",
    statusIconUrl: "",
    statusMessage: "",
    avatarErrorCode: "",
    avatarErrorMessage: ""
  };
  const applyIdentity = (nextIdentity) => {
    const candidate = nextIdentity && typeof nextIdentity === "object" ? nextIdentity : {};
    if (!identity.userName) identity.userName = normalizeSlackDisplayName(candidate.userName || "");
    if (!identity.avatarUrl) identity.avatarUrl = normalizeSlackAvatarUrl(candidate.avatarUrl || "");
    if (!identity.statusIcon) identity.statusIcon = normalizeSlackStatusIcon(candidate.statusIcon || "");
    if (!identity.statusIconUrl) identity.statusIconUrl = normalizeSlackStatusIconUrl(candidate.statusIconUrl || "");
    if (!identity.statusMessage) identity.statusMessage = normalizeSlackStatusMessage(candidate.statusMessage || "");
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
  return /^(?:xoxe\.)?xox[a-z]-/i.test(token) ? token : "";
}

function isSlackBotApiToken(value) {
  const token = normalizeSlackApiToken(value);
  if (!token) return false;
  return /^xoxb-/i.test(token) || /^xoxe\.xoxb-/i.test(token);
}

function isSlackWebSessionToken(value) {
  const token = normalizeSlackApiToken(value);
  if (!token) return false;
  return /^xoxc-/i.test(token)
    || /^xoxd-/i.test(token)
    || /^xoxe\.xoxc-/i.test(token)
    || /^xoxe\.xoxd-/i.test(token);
}

function isSlackUserOAuthToken(value) {
  const token = normalizeSlackApiToken(value);
  if (!token) return false;
  // User/session-flavored tokens are eligible; bot tokens are not.
  return !isSlackBotApiToken(token);
}

function getSlackTokenBackoffUntil(token) {
  const normalized = normalizeSlackApiToken(token);
  if (!normalized) return 0;
  const until = Number(slackTokenBackoffUntilByToken.get(normalized) || 0);
  if (!Number.isFinite(until) || until <= 0) {
    slackTokenBackoffUntilByToken.delete(normalized);
    return 0;
  }
  if (Date.now() >= until) {
    slackTokenBackoffUntilByToken.delete(normalized);
    return 0;
  }
  return until;
}

function isSlackTokenTemporarilyBackedOff(token) {
  return getSlackTokenBackoffUntil(token) > 0;
}

function markSlackTokenBackoff(token) {
  const normalized = normalizeSlackApiToken(token);
  if (!normalized) return;
  slackTokenBackoffUntilByToken.set(normalized, Date.now() + SLACK_TOKEN_FAILURE_BACKOFF_MS);
}

function clearSlackTokenBackoff(token) {
  const normalized = normalizeSlackApiToken(token);
  if (!normalized) return;
  slackTokenBackoffUntilByToken.delete(normalized);
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

function parseSlackTsParts(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const match = raw.match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) return null;
  const seconds = Number.parseInt(match[1], 10);
  const micros = Number.parseInt(String(match[2] || "0").slice(0, 6).padEnd(6, "0"), 10);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  if (!Number.isFinite(micros) || micros < 0) return null;
  return { seconds, micros };
}

function compareSlackTs(leftValue, rightValue) {
  const left = parseSlackTsParts(leftValue);
  const right = parseSlackTsParts(rightValue);
  if (!left || !right) return 0;
  if (left.seconds < right.seconds) return -1;
  if (left.seconds > right.seconds) return 1;
  if (left.micros < right.micros) return -1;
  if (left.micros > right.micros) return 1;
  return 0;
}

function slackTsToMicros(value) {
  const parts = parseSlackTsParts(value);
  if (!parts) return null;
  return (parts.seconds * 1000000) + parts.micros;
}

function normalizeSlackReadCursorTs(readCursorTs, messageTs) {
  const targetTs = String(messageTs || "").trim();
  const fallbackTs = toPriorSlackTs(targetTs);
  const candidateTs = String(readCursorTs || "").trim();
  if (!candidateTs) return fallbackTs;
  if (compareSlackTs(candidateTs, targetTs) >= 0) return fallbackTs;
  return candidateTs;
}

async function fetchSlackLatestMessageTsViaApiToken(workspaceOrigin, token, channelId) {
  const targetChannel = normalizeSlackChannelId(channelId);
  if (!targetChannel) return "";
  const result = await postSlackApiWithBearerToken(workspaceOrigin, "/api/conversations.history", {
    channel: targetChannel,
    limit: 1,
    inclusive: "false",
    _x_reason: "zip-slack-it-to-me-history-latest-bg"
  }, token);
  if (!result || !result.ok) return "";
  const payload = result.payload && typeof result.payload === "object" ? result.payload : {};
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  if (!messages.length) return "";
  return String(messages[0] && messages[0].ts || "").trim();
}

async function isSlackMessageUnreadViaApiToken(workspaceOrigin, token, channelId, messageTs, readCursorTs) {
  const targetChannel = normalizeSlackChannelId(channelId);
  const targetTs = String(messageTs || "").trim();
  if (!targetChannel || !targetTs) return false;
  const cursorTs = normalizeSlackReadCursorTs(readCursorTs, targetTs);
  const result = await postSlackApiWithBearerToken(workspaceOrigin, "/api/conversations.info", {
    channel: targetChannel,
    include_num_members: "false",
    _x_reason: "zip-slack-it-to-me-mark-verify-bg"
  }, token);
  if (!result || !result.ok) return false;
  const payload = result.payload && typeof result.payload === "object" ? result.payload : {};
  const channel = payload.channel && typeof payload.channel === "object" ? payload.channel : {};
  const lastRead = String(channel.last_read || "").trim();
  if (!lastRead) return false;
  if (compareSlackTs(lastRead, targetTs) >= 0) return false;
  if (compareSlackTs(lastRead, cursorTs) < 0) return false;
  const targetMicros = slackTsToMicros(targetTs);
  const lastReadMicros = slackTsToMicros(lastRead);
  if (targetMicros == null || lastReadMicros == null) return false;
  const deltaSeconds = (targetMicros - lastReadMicros) / 1000000;
  return deltaSeconds >= 0 && deltaSeconds <= 2.5;
}

async function markSlackMessageUnreadViaApiToken(workspaceOrigin, token, channelId, messageTs, readCursorTs) {
  const targetChannel = normalizeSlackChannelId(channelId);
  const targetTs = String(messageTs || "").trim();
  if (!targetChannel || !targetTs) return false;

  const cursorTs = normalizeSlackReadCursorTs(readCursorTs, targetTs);
  const delays = [0, 180];
  for (let pass = 0; pass < delays.length; pass += 1) {
    if (delays[pass] > 0) await sleepMs(delays[pass]);
    try {
      const result = await postSlackApiWithBearerToken(
        workspaceOrigin,
        "/api/conversations.mark",
        {
          channel: targetChannel,
          ts: cursorTs,
          _x_reason: "zip-slack-it-to-me-mark-cursor-bg"
        },
        token
      );
      if (result && result.ok) {
        const verified = await isSlackMessageUnreadViaApiToken(
          workspaceOrigin,
          token,
          targetChannel,
          targetTs,
          cursorTs
        );
        if (verified) return true;
      }
    } catch (_) {}
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

function normalizeSlackDirectChannelId(value) {
  const channelId = String(value || "").trim().toUpperCase();
  return /^D[A-Z0-9]{8,}$/.test(channelId) ? channelId : "";
}

function normalizeSingularityMention(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^<@[UW][A-Z0-9]{8,}>$/i.test(raw)) return raw;
  const plain = raw.startsWith("@") ? raw.slice(1).trim() : raw;
  if (!plain) return "";
  return "@" + plain;
}

function normalizeSlackChannelName(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withoutPrefix = raw.replace(/^#+/, "").trim();
  if (!withoutPrefix) return "";
  return "#" + withoutPrefix;
}

function normalizeSlackUserIdList(value) {
  const out = [];
  const seen = new Set();
  const add = (candidate) => {
    const normalized = normalizeSlackUserId(candidate);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    out.push(normalized);
  };
  if (Array.isArray(value)) {
    value.forEach(add);
    return out;
  }
  const raw = String(value || "").trim();
  if (!raw) return out;
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(add);
        return out;
      }
    } catch (_) {}
  }
  raw.split(/[\s,|]+/).forEach(add);
  return out;
}

function normalizeSlackUserIdCsv(value) {
  return normalizeSlackUserIdList(value).join(",");
}

function normalizeIsoDateTime(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const stamp = Date.parse(raw);
  return Number.isFinite(stamp) ? new Date(stamp).toISOString() : "";
}

function buildPassTransitionSnapshot(input) {
  const source = input && typeof input === "object" ? input : {};
  const recipients = normalizeCachedPassTransitionRecipientList(
    source.recipients
    || source.recipientProfiles
    || source[ZIP_PASS_TRANSITION_RECIPIENTS_STORAGE_KEY]
    || []
  );
  const channelId = normalizeSlackChannelId(
    source.channelId
    || source.channel_id
    || source[ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY]
    || ""
  );
  const channelName = normalizeSlackChannelName(
    source.channelName
    || source.channel_name
    || source[ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY]
    || ""
  );
  const memberIds = normalizeSlackUserIdList(
    source.memberIds
    || source.member_ids
    || source.members
    || source[ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY]
    || recipients.map((entry) => entry.userId)
  );
  const membersSyncedAt = normalizeIsoDateTime(
    source.membersSyncedAt
    || source.members_synced_at
    || source.lastSyncedAt
    || source.last_synced_at
    || source[ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY]
    || ""
  );
  return {
    channelId,
    channelName,
    memberIds,
    memberCount: memberIds.length,
    recipients,
    recipientCount: recipients.length,
    membersSyncedAt,
    synced: !!((memberIds.length || recipients.length) && membersSyncedAt)
  };
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

function getZipWorkspaceDeeplinkRedirectOrigins() {
  const origins = [];
  const seen = new Set();
  const pushOrigin = (value) => {
    const normalized = normalizeSlackOpenIdRedirectUri(value);
    if (!normalized) return;
    try {
      const parsed = new URL(normalized);
      if (seen.has(parsed.origin)) return;
      seen.add(parsed.origin);
      origins.push(parsed.origin);
    } catch (_) {}
  };
  pushOrigin(ZIP_OFFICIAL_WORKSPACE_DEEPLINK_URI);
  pushOrigin(ZIP_OFFICIAL_SLACK_OPENID_REDIRECT_URI);
  try {
    if (chrome.identity && typeof chrome.identity.getRedirectURL === "function") {
      pushOrigin(chrome.identity.getRedirectURL(""));
      pushOrigin(chrome.identity.getRedirectURL(SLACK_OPENID_DEFAULT_REDIRECT_PATH));
      pushOrigin(chrome.identity.getRedirectURL("slack-openid"));
    }
  } catch (_) {}
  return origins;
}

function parseZipWorkspaceDeeplinkUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  let parsed = null;
  try {
    parsed = new URL(raw);
  } catch (_) {
    parsed = null;
  }
  if (!parsed || parsed.protocol !== "https:") return null;
  const payload = String(parsed.searchParams.get(ZIP_WORKSPACE_DEEPLINK_QUERY_PARAM) || "").trim();
  if (!payload) return null;
  const allowedOrigins = getZipWorkspaceDeeplinkRedirectOrigins();
  if (!allowedOrigins.includes(parsed.origin)) return null;
  return {
    payload,
    origin: parsed.origin
  };
}

function buildZipWorkspaceInternalUrl(encodedPayload) {
  const payload = String(encodedPayload || "").trim();
  if (!payload) return "";
  const params = new URLSearchParams();
  params.set("mode", "workspace");
  params.set(ZIP_WORKSPACE_DEEPLINK_QUERY_PARAM, payload);
  return chrome.runtime.getURL(ZIP_PANEL_PATH + "?" + params.toString());
}

function isZipSidePanelCurrentlyOpen() {
  const openedAt = toTime(sidePanelState.lastOpened && sidePanelState.lastOpened.at);
  const closedAt = toTime(sidePanelState.lastClosed && sidePanelState.lastClosed.at);
  const tabId = Number(sidePanelState.lastOpened && sidePanelState.lastOpened.tabId);
  return Number.isFinite(tabId) && tabId > 0 && openedAt > closedAt;
}

async function focusTabWindow(tab) {
  const targetTab = tab && typeof tab === "object" ? tab : null;
  if (!targetTab || targetTab.id == null) return false;
  try {
    await chrome.tabs.update(targetTab.id, { active: true });
  } catch (_) {}
  if (targetTab.windowId != null && chrome.windows && typeof chrome.windows.update === "function") {
    try {
      await chrome.windows.update(targetTab.windowId, { focused: true });
    } catch (_) {}
  }
  return true;
}

async function tryOpenZipSidePanelForTab(tab) {
  const targetTab = tab && typeof tab === "object" ? tab : null;
  if (!targetTab || targetTab.id == null || !sidePanelCapabilities.open) return false;
  try {
    await setOptionsForTab(targetTab.id, targetTab.url || "");
    await chrome.sidePanel.open({ tabId: targetTab.id });
    return true;
  } catch (_) {
    return false;
  }
}

function broadcastZipWorkspaceDeeplinkToClient(payload) {
  const messagePayload = payload && typeof payload === "object" ? payload : {};
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({
        type: ZIP_APPLY_WORKSPACE_DEEPLINK_MESSAGE_TYPE,
        payload: messagePayload
      }, (response) => {
        const runtimeError = chrome.runtime && chrome.runtime.lastError
          ? String(chrome.runtime.lastError.message || "")
          : "";
        if (runtimeError) {
          resolve(false);
          return;
        }
        resolve(!!(response && response.ok === true && response.accepted === true));
      });
    } catch (_) {
      resolve(false);
    }
  });
}

function closeZipWorkspaceDeeplinkSourceTab(tabId) {
  const numericTabId = Number(tabId);
  if (!Number.isFinite(numericTabId) || numericTabId <= 0) return Promise.resolve(false);
  return new Promise((resolve) => {
    try {
      chrome.tabs.remove(numericTabId, () => {
        void chrome.runtime.lastError;
        resolve(true);
      });
    } catch (_) {
      resolve(false);
    }
  });
}

function normalizeQueuedZipWorkspaceClientDeeplink(value) {
  const source = value && typeof value === "object" ? value : {};
  const encodedPayload = String(source.encodedPayload || "").trim();
  const targetTabId = Number(source.targetTabId);
  if (!encodedPayload || !Number.isFinite(targetTabId) || targetTabId <= 0) return null;
  return {
    encodedPayload,
    targetTabId,
    createdAtMs: Math.max(0, Number(source.createdAtMs || 0))
  };
}

async function readQueuedZipWorkspaceClientDeeplink() {
  const stored = await readStorageLocal([ZIP_PENDING_WORKSPACE_CLIENT_DEEPLINK_STORAGE_KEY]);
  return normalizeQueuedZipWorkspaceClientDeeplink(stored && stored[ZIP_PENDING_WORKSPACE_CLIENT_DEEPLINK_STORAGE_KEY]);
}

async function queueZipWorkspaceDeeplinkForClient(encodedPayload, targetTabId) {
  const queued = normalizeQueuedZipWorkspaceClientDeeplink({
    encodedPayload,
    targetTabId,
    createdAtMs: Date.now()
  });
  if (!queued) return null;
  await setStorageLocal({
    [ZIP_PENDING_WORKSPACE_CLIENT_DEEPLINK_STORAGE_KEY]: queued
  });
  return queued;
}

async function clearQueuedZipWorkspaceClientDeeplinkIfMatches(encodedPayload, targetTabId) {
  const current = await readQueuedZipWorkspaceClientDeeplink().catch(() => null);
  if (!current) return false;
  if (current.encodedPayload !== String(encodedPayload || "").trim()) return false;
  if (Number(current.targetTabId) !== Number(targetTabId)) return false;
  await removeStorageLocal([ZIP_PENDING_WORKSPACE_CLIENT_DEEPLINK_STORAGE_KEY]).catch(() => {});
  return true;
}

async function waitForQueuedZipWorkspaceDeeplinkConsumption(encodedPayload, targetTabId, timeoutMs) {
  const expectedPayload = String(encodedPayload || "").trim();
  const expectedTabId = Number(targetTabId);
  const deadline = Date.now() + Math.max(0, Number(timeoutMs) || 0);
  while (Date.now() <= deadline) {
    const current = await readQueuedZipWorkspaceClientDeeplink().catch(() => null);
    if (!current) return true;
    if (current.encodedPayload !== expectedPayload || Number(current.targetTabId) !== expectedTabId) {
      return true;
    }
    await sleepMs(120);
  }
  return false;
}

async function deliverZipWorkspaceDeeplinkToOpenClient(encodedPayload, sourceTabId) {
  const payload = String(encodedPayload || "").trim();
  if (!payload || !isZipSidePanelCurrentlyOpen()) return false;
  const targetTabId = Number(sidePanelState.lastOpened && sidePanelState.lastOpened.tabId);
  if (!Number.isFinite(targetTabId) || targetTabId <= 0) return false;
  const targetTab = await getTabById(targetTabId);
  if (!targetTab || !isZendeskUrl(targetTab.url || "")) return false;
  const queued = await queueZipWorkspaceDeeplinkForClient(payload, targetTabId).catch(() => null);
  await focusTabWindow(targetTab);
  const accepted = await broadcastZipWorkspaceDeeplinkToClient({
    encodedPayload: payload,
    targetTabId
  });
  if (!accepted) {
    if (queued) {
      const consumed = await waitForQueuedZipWorkspaceDeeplinkConsumption(payload, targetTabId, 1800);
      if (!consumed) {
        await clearQueuedZipWorkspaceClientDeeplinkIfMatches(payload, targetTabId).catch(() => {});
        return false;
      }
    } else {
      return false;
    }
  } else {
    await clearQueuedZipWorkspaceClientDeeplinkIfMatches(payload, targetTabId).catch(() => {});
  }
  if (Number(sourceTabId) !== targetTabId) {
    await closeZipWorkspaceDeeplinkSourceTab(sourceTabId);
  }
  return true;
}

async function routeZipWorkspaceDeeplinkToZendeskClient(encodedPayload, sourceTabId) {
  const payload = String(encodedPayload || "").trim();
  if (!payload) return false;

  let targetTab = null;
  const lastOpenedTabId = Number(sidePanelState.lastOpened && sidePanelState.lastOpened.tabId);
  if (Number.isFinite(lastOpenedTabId) && lastOpenedTabId > 0) {
    const lastOpenedTab = await getTabById(lastOpenedTabId);
    if (lastOpenedTab && isZendeskUrl(lastOpenedTab.url || "")) {
      targetTab = lastOpenedTab;
    }
  }

  if (!targetTab) {
    const zendeskTabs = await queryZendeskTabs();
    const preferredZendeskTab = pickPreferredZendeskTab(zendeskTabs);
    if (preferredZendeskTab && preferredZendeskTab.id != null) {
      targetTab = preferredZendeskTab;
    }
  }

  if (!targetTab) {
    try {
      const createdZendeskTab = await chrome.tabs.create({ url: ZENDESK_DASHBOARD_URL, active: true });
      if (createdZendeskTab && createdZendeskTab.id != null) {
        targetTab = createdZendeskTab;
      }
    } catch (_) {}
  }

  const targetTabId = Number(targetTab && targetTab.id);
  if (!Number.isFinite(targetTabId) || targetTabId <= 0) return false;

  const queued = await queueZipWorkspaceDeeplinkForClient(payload, targetTabId).catch(() => null);
  if (!queued) return false;

  await focusTabWindow(targetTab);
  const accepted = await broadcastZipWorkspaceDeeplinkToClient({
    encodedPayload: payload,
    targetTabId
  });
  if (accepted) {
    await clearQueuedZipWorkspaceClientDeeplinkIfMatches(payload, targetTabId).catch(() => {});
  } else {
    const consumed = await waitForQueuedZipWorkspaceDeeplinkConsumption(payload, targetTabId, 1800);
    if (!consumed) {
      await tryOpenZipSidePanelForTab(targetTab);
    }
  }

  if (Number(sourceTabId) !== targetTabId) {
    await closeZipWorkspaceDeeplinkSourceTab(sourceTabId);
  }
  return true;
}

function maybeRouteZipWorkspaceDeeplinkTab(tabId, url) {
  const numericTabId = Number(tabId);
  if (!Number.isFinite(numericTabId)) return false;
  const parsed = parseZipWorkspaceDeeplinkUrl(url);
  if (!parsed || zipWorkspaceDeeplinkTabIds.has(numericTabId)) return false;
  zipWorkspaceDeeplinkTabIds.add(numericTabId);
  void (async () => {
    try {
      const deliveredToOpenClient = await deliverZipWorkspaceDeeplinkToOpenClient(parsed.payload, numericTabId);
      if (deliveredToOpenClient) return;
      await routeZipWorkspaceDeeplinkToZendeskClient(parsed.payload, numericTabId);
    } finally {
      zipWorkspaceDeeplinkTabIds.delete(numericTabId);
    }
  })();
  return true;
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
  const passTransitionSource = source.passTransition && typeof source.passTransition === "object" ? source.passTransition : {};
  const passTransitionNestedSource = slacktivationSource.pass_transition && typeof slacktivationSource.pass_transition === "object"
    ? slacktivationSource.pass_transition
    : {};
  const fromMeta = source.meta && typeof source.meta === "object" ? source.meta : {};
  const clientId = String(
    source.clientId
    || slacktivationSource.client_id
    || slacktivationSource.clientId
    || slacktivationOidcSource.client_id
    || slacktivationOidcSource.clientId
    || oidcSource.clientId
    || source[ZIP_SLACK_CLIENT_ID_STORAGE_KEY]
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
    || source[ZIP_SLACK_CLIENT_SECRET_STORAGE_KEY]
    || source.client_secret
    || ""
  ).trim();
  const scope = normalizeSlackOpenIdScopes(
    source.scope
    || slacktivationSource.scope
    || slacktivationOidcSource.scope
    || oidcSource.scope
    || source[ZIP_SLACK_SCOPE_STORAGE_KEY]
    || ""
  );
  const redirectPath = normalizeZipRedirectPath(
    source.redirectPath
    || slacktivationSource.redirect_path
    || slacktivationSource.redirectPath
    || slacktivationOidcSource.redirect_path
    || slacktivationOidcSource.redirectPath
    || oidcSource.redirectPath
    || source[ZIP_SLACK_REDIRECT_PATH_STORAGE_KEY]
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
    || source[ZIP_SLACK_REDIRECT_URI_STORAGE_KEY]
    || ""
  );
  const rawApiTokens = [
    source.botToken,
    source.bot_token,
    slacktivationSource.bot_token,
    slacktivationSource.botToken,
    slacktivationApiSource.bot_token,
    slacktivationApiSource.botToken,
    apiSource.botToken,
    apiSource.bot_token,
    source[ZIP_SLACK_BOT_TOKEN_STORAGE_KEY],
    source.userToken,
    source.user_token,
    slacktivationSource.user_token,
    slacktivationSource.userToken,
    slacktivationApiSource.user_token,
    slacktivationApiSource.userToken,
    apiSource.userToken,
    apiSource.user_token,
    source[ZIP_SLACK_LEGACY_USER_TOKEN_STORAGE_KEY],
    source.oauthToken,
    source.oauth_token,
    slacktivationSource.oauth_token,
    slacktivationSource.oauthToken,
    slacktivationApiSource.oauth_token,
    slacktivationApiSource.oauthToken,
    apiSource.oauthToken,
    apiSource.oauth_token,
    source[ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY]
  ];
  const botCandidates = [];
  const userCandidates = [];
  rawApiTokens.forEach((entry) => {
    const token = normalizeSlackApiToken(entry);
    if (!token) return;
    if (isSlackBotApiToken(token)) {
      if (!botCandidates.includes(token)) botCandidates.push(token);
      return;
    }
    if (isSlackUserOAuthToken(token) && !userCandidates.includes(token)) {
      userCandidates.push(token);
    }
  });
  const botToken = botCandidates[0] || "";
  const userToken = userCandidates[0] || "";
  const oauthToken = userCandidates[0] || "";
  const singularityChannelId = normalizeSlackChannelId(
    source.singularityChannelId
    || slacktivationSource.singularity_channel_id
    || slacktivationSource.singularityChannelId
    || singularitySource.channelId
    || source[ZIP_SINGULARITY_CHANNEL_ID_STORAGE_KEY]
    || source.singularity_channel_id
    || ""
  );
  const singularityMention = normalizeSingularityMention(
    source.singularityMention
    || slacktivationSource.singularity_mention
    || slacktivationSource.singularityMention
    || singularitySource.mention
    || source[ZIP_SINGULARITY_MENTION_STORAGE_KEY]
    || source.singularity_mention
    || ""
  );
  const passTransition = buildPassTransitionSnapshot({
    channelId:
      source.passTransitionChannelId
      || slacktivationSource.pass_transition_channel_id
      || slacktivationSource.passTransitionChannelId
      || passTransitionNestedSource.channel_id
      || passTransitionNestedSource.channelId
      || passTransitionSource.channelId
      || source[ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY]
      || source.pass_transition_channel_id
      || "",
    channelName:
      source.passTransitionChannelName
      || slacktivationSource.pass_transition_channel_name
      || slacktivationSource.passTransitionChannelName
      || passTransitionNestedSource.channel_name
      || passTransitionNestedSource.channelName
      || passTransitionSource.channelName
      || source[ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY]
      || source.pass_transition_channel_name
      || "",
    memberIds:
      source.passTransitionMemberIds
      || slacktivationSource.pass_transition_member_ids
      || slacktivationSource.passTransitionMemberIds
      || passTransitionNestedSource.member_ids
      || passTransitionNestedSource.memberIds
      || passTransitionNestedSource.members
      || passTransitionSource.memberIds
      || source[ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY]
      || source.pass_transition_member_ids
      || "",
    membersSyncedAt:
      source.passTransitionMembersSyncedAt
      || slacktivationSource.pass_transition_members_synced_at
      || slacktivationSource.passTransitionMembersSyncedAt
      || passTransitionNestedSource.members_synced_at
      || passTransitionNestedSource.membersSyncedAt
      || passTransitionNestedSource.last_synced_at
      || passTransitionNestedSource.lastSyncedAt
      || passTransitionSource.membersSyncedAt
      || source[ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY]
      || source.pass_transition_members_synced_at
      || "",
    recipients:
      passTransitionNestedSource.recipients
      || passTransitionNestedSource.members_json
      || passTransitionNestedSource.membersJson
      || passTransitionSource.recipients
      || passTransitionSource.membersJson
      || source[ZIP_PASS_TRANSITION_RECIPIENTS_STORAGE_KEY]
      || source.pass_transition_recipients
      || source.pass_transition_members_json
      || ""
  });
  const hasRequired = !!(
    clientId
    && clientSecret
    && botToken
    && singularityChannelId
    && singularityMention
    && (userToken || oauthToken)
  );

  return {
    clientId,
    clientSecret,
    scope,
    redirectPath,
    redirectUri,
    botToken,
    userToken,
    oauthToken,
    singularityChannelId,
    singularityMention,
    passTransition,
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
  const hasBotToken = !!normalizeSlackApiToken(
    values[ZIP_SLACK_BOT_TOKEN_STORAGE_KEY]
    || ""
  );
  const hasUserScopedToken = !!normalizeSlackApiToken(
    values[ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY]
    || values[ZIP_SLACK_LEGACY_USER_TOKEN_STORAGE_KEY]
    || ""
  );
  if (!hasBotToken) {
    missing.push(ZIP_REQUIRED_SLACK_BOT_TOKEN_FIELD);
  }
  if (!hasUserScopedToken) {
    missing.push(ZIP_REQUIRED_SLACK_API_TOKEN_FIELD);
  }
  const loadedFlag = values[ZIP_SLACK_KEY_LOADED_STORAGE_KEY] === true;
  return {
    ok: loadedFlag && missing.length === 0,
    loaded: loadedFlag,
    missing,
    passTransition: buildPassTransitionSnapshot(values)
  };
}

async function readZipSecretsStatus() {
  const keys = ZIP_REQUIRED_SECRET_KEYS.concat([
    ZIP_SLACK_BOT_TOKEN_STORAGE_KEY,
    ZIP_SLACK_LEGACY_USER_TOKEN_STORAGE_KEY,
    ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY,
    ZIP_SLACK_KEY_LOADED_STORAGE_KEY,
    ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY,
    ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY,
    ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY,
    ZIP_PASS_TRANSITION_RECIPIENTS_STORAGE_KEY,
    ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY
  ]);
  const stored = await readStorageLocal(keys);
  return computeZipSecretsStatus(stored);
}

async function storeZipSecrets(input, options) {
  const normalized = normalizeZipSecretConfig(input);
  const missingFields = [];
  if (!normalized.clientId) missingFields.push("slacktivation.client_id");
  if (!normalized.clientSecret) missingFields.push("slacktivation.client_secret");
  if (!normalized.botToken) missingFields.push(ZIP_REQUIRED_SLACK_BOT_TOKEN_FIELD);
  if (!(normalized.userToken || normalized.oauthToken)) missingFields.push(ZIP_REQUIRED_SLACK_API_TOKEN_FIELD);
  if (!normalized.singularityChannelId) missingFields.push("slacktivation.singularity_channel_id");
  if (!normalized.singularityMention) missingFields.push("slacktivation.singularity_mention");
  if (missingFields.length) {
    throw new Error("ZIP.KEY is missing required SLACKTIVATION fields: " + missingFields.join(", ") + ".");
  }
  const opts = options && typeof options === "object" ? options : {};
  const existingPassTransition = await readStorageLocal([
    ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY,
    ZIP_PASS_TRANSITION_RECIPIENTS_STORAGE_KEY
  ]);
  const existingPassTransitionChannelId = normalizeSlackChannelId(
    existingPassTransition && existingPassTransition[ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY]
  );
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
  setOrRemove(ZIP_SLACK_BOT_TOKEN_STORAGE_KEY, normalized.botToken);
  setOrRemove(ZIP_SLACK_LEGACY_USER_TOKEN_STORAGE_KEY, normalized.userToken);
  setOrRemove(ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY, normalized.oauthToken);
  setOrRemove(ZIP_SINGULARITY_CHANNEL_ID_STORAGE_KEY, normalized.singularityChannelId);
  setOrRemove(ZIP_SINGULARITY_MENTION_STORAGE_KEY, normalized.singularityMention);
  setOrRemove(ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY, normalized.passTransition && normalized.passTransition.channelId);
  setOrRemove(ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY, normalized.passTransition && normalized.passTransition.channelName);
  setOrRemove(ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY, normalized.passTransition && normalized.passTransition.memberIds);
  setOrRemove(ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY, normalized.passTransition && normalized.passTransition.membersSyncedAt);
  const cachedRecipients = normalizeCachedPassTransitionRecipientList(
    normalized.passTransition && normalized.passTransition.recipients
  );
  if (cachedRecipients.length) {
    updates[ZIP_PASS_TRANSITION_RECIPIENTS_STORAGE_KEY] = cachedRecipients;
  } else if (
    !normalized.passTransition
    || !normalized.passTransition.channelId
    || normalized.passTransition.channelId !== existingPassTransitionChannelId
  ) {
    removals.push(ZIP_PASS_TRANSITION_RECIPIENTS_STORAGE_KEY);
  }
  updates[ZIP_SLACK_KEY_META_STORAGE_KEY] = normalized.meta;
  updates[ZIP_SLACK_KEY_LOADED_STORAGE_KEY] = normalized.keyLoaded;

  await setStorageLocal(updates);
  await removeStorageLocal(removals);
  if (opts.clearOpenIdSession !== false) {
    await clearSlackOpenIdSession();
  }
  const status = computeZipSecretsStatus({
    [ZIP_SLACK_CLIENT_ID_STORAGE_KEY]: normalized.clientId,
    [ZIP_SLACK_CLIENT_SECRET_STORAGE_KEY]: normalized.clientSecret,
    [ZIP_SLACK_BOT_TOKEN_STORAGE_KEY]: normalized.botToken,
    [ZIP_SLACK_LEGACY_USER_TOKEN_STORAGE_KEY]: normalized.userToken,
    [ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY]: normalized.oauthToken,
    [ZIP_SINGULARITY_CHANNEL_ID_STORAGE_KEY]: normalized.singularityChannelId,
    [ZIP_SINGULARITY_MENTION_STORAGE_KEY]: normalized.singularityMention,
    [ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY]: normalized.passTransition && normalized.passTransition.channelId,
    [ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY]: normalized.passTransition && normalized.passTransition.channelName,
    [ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY]: normalized.passTransition && normalized.passTransition.memberIds,
    [ZIP_PASS_TRANSITION_RECIPIENTS_STORAGE_KEY]: cachedRecipients,
    [ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY]: normalized.passTransition && normalized.passTransition.membersSyncedAt,
    [ZIP_SLACK_KEY_LOADED_STORAGE_KEY]: normalized.keyLoaded
  });
  return {
    ok: status.ok,
    loaded: status.loaded,
    missing: status.missing,
    passTransition: status.passTransition
  };
}

async function clearZipSecrets() {
  await removeStorageLocal(
    ZIP_SLACK_STORAGE_KEYS
      .filter((key) => key !== ZIP_SLACK_KEY_LOADED_STORAGE_KEY)
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

async function fetchSlackConversationMembersViaApi(workspaceOrigin, token, channelId) {
  const targetChannel = normalizeSlackChannelId(channelId);
  if (!targetChannel) {
    return {
      ok: false,
      code: "slack_channel_missing",
      error: "Slack channel ID is required."
    };
  }
  const memberIds = [];
  const seen = new Set();
  let cursor = "";
  for (let page = 0; page < 20; page += 1) {
    const fields = {
      channel: targetChannel,
      limit: 1000,
      _x_reason: "zip-pass-transition-members-bg"
    };
    if (cursor) fields.cursor = cursor;
    const result = await postSlackApiWithBearerToken(workspaceOrigin, "/api/conversations.members", fields, token);
    if (!result || !result.ok) return result || {
      ok: false,
      code: "slack_api_error",
      error: "Unable to hydrate Slack channel members."
    };
    const payload = result.payload && typeof result.payload === "object" ? result.payload : {};
    const members = Array.isArray(payload.members) ? payload.members : [];
    for (let i = 0; i < members.length; i += 1) {
      const memberId = normalizeSlackUserId(members[i]);
      if (!memberId || seen.has(memberId)) continue;
      seen.add(memberId);
      memberIds.push(memberId);
    }
    cursor = String(payload && payload.response_metadata && payload.response_metadata.next_cursor || "").trim();
    if (!cursor) break;
  }
  return {
    ok: true,
    channelId: targetChannel,
    memberIds
  };
}

async function getPassTransitionMembers(options) {
  const opts = options && typeof options === "object" ? options : {};
  const force = opts.force === true;
  const allowCreateTab = opts.allowCreateTab === true;
  const stored = await readStorageLocal([
    ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY,
    ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY,
    ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY,
    ZIP_PASS_TRANSITION_RECIPIENTS_STORAGE_KEY,
    ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY
  ]);
  const snapshot = buildPassTransitionSnapshot(stored);
  if (!snapshot.channelId) {
    return {
      ok: false,
      code: "pass_transition_channel_missing",
      error: "PASS-TRANSITION channel ID is not configured in ZIP.KEY.",
      ...snapshot
    };
  }
  if (snapshot.memberIds.length && !force) {
    return {
      ok: true,
      cached: true,
      hydrated: false,
      ...snapshot
    };
  }

  let tokens = await resolveSlackApiTokens({});
  let workspaceSessionCapture = null;
  if (force) {
    const openIdSession = await readSlackOpenIdSession();
    workspaceSessionCapture = await captureSlackRuntimeUserTokenFromWorkspaceSession({
      workspaceOrigin: SLACK_WORKSPACE_ORIGIN,
      expectedUserId: resolveExpectedSlackAuthorUserId({}, openIdSession),
      allowCreateTab
    }).catch((err) => ({
      ok: false,
      code: "slack_workspace_session_unavailable",
      error: err && err.message ? err.message : "Unable to capture Slack workspace session token."
    }));
    if (workspaceSessionCapture && workspaceSessionCapture.ok === true) {
      const storedTokens = await readStoredSlackApiTokens();
      const capturedUserToken = normalizeSlackApiToken(workspaceSessionCapture.userToken);
      tokens = {
        botToken: storedTokens && storedTokens.botToken || "",
        botCandidates: Array.isArray(storedTokens && storedTokens.botCandidates) ? storedTokens.botCandidates : [],
        userToken: capturedUserToken,
        userCandidates: capturedUserToken ? [capturedUserToken] : []
      };
    }
  }
  const tokenAttempts = buildSlackQaiTokenAttempts(tokens, "user");
  if (!tokenAttempts.length) {
    return {
      ok: false,
      code: String(workspaceSessionCapture && workspaceSessionCapture.code || "slack_token_missing").trim().toLowerCase() || "slack_token_missing",
      error: String(
        workspaceSessionCapture && workspaceSessionCapture.error
        || "Slack token is unavailable for PASS-TRANSITION member hydration."
      ).trim(),
      ...snapshot
    };
  }

  const apiOrigins = buildSlackQaiApiOrigins(SLACK_WORKSPACE_ORIGIN);
  let lastFailureCode = "slack_api_error";
  let lastFailureError = "Unable to hydrate PASS-TRANSITION members.";
  let lastFailureTokenKind = "";

  for (let i = 0; i < tokenAttempts.length; i += 1) {
    const attempt = tokenAttempts[i];
    const attemptToken = normalizeSlackApiToken(attempt && attempt.token);
    if (!attemptToken) continue;
    for (let originIndex = 0; originIndex < apiOrigins.length; originIndex += 1) {
      const apiOrigin = apiOrigins[originIndex];
      const membersResult = await fetchSlackConversationMembersViaApi(apiOrigin, attemptToken, snapshot.channelId);
      if (membersResult && membersResult.ok) {
        const syncedAt = nowIso();
        const memberIdsCsv = normalizeSlackUserIdCsv(membersResult.memberIds);
        await setStorageLocal({
          [ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY]: snapshot.channelId,
          [ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY]: snapshot.channelName,
          [ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY]: memberIdsCsv,
          [ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY]: syncedAt
        });
        return {
          ok: true,
          cached: false,
          hydrated: true,
          channelId: snapshot.channelId,
          channelName: snapshot.channelName,
          memberIds: normalizeSlackUserIdList(memberIdsCsv),
          memberCount: normalizeSlackUserIdList(memberIdsCsv).length,
          membersSyncedAt: syncedAt,
          synced: !!memberIdsCsv,
          tokenKind: String(attempt && attempt.kind || "").trim().toLowerCase()
        };
      }
      lastFailureCode = String(membersResult && membersResult.code || "slack_api_error").trim().toLowerCase() || "slack_api_error";
      lastFailureError = String(membersResult && membersResult.error || "Unable to hydrate PASS-TRANSITION members.").trim();
      lastFailureTokenKind = String(attempt && attempt.kind || "").trim().toLowerCase();
    }
  }

  return {
    ok: false,
    code: lastFailureCode,
    error: lastFailureError,
    tokenKind: lastFailureTokenKind,
    ...snapshot
  };
}

async function hydratePassTransitionRecipients(options) {
  const opts = options && typeof options === "object" ? options : {};
  const allowCreateTab = opts.allowCreateTab === true;
  const storedSnapshot = await readStorageLocal([
    ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY,
    ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY,
    ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY,
    ZIP_PASS_TRANSITION_RECIPIENTS_STORAGE_KEY,
    ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY
  ]);
  const snapshot = buildPassTransitionSnapshot(storedSnapshot);
  const hydrateViaWorkspaceSession = async () => hydratePassTransitionRecipientsViaWorkspaceSession({
    channelId: snapshot.channelId,
    channelName: snapshot.channelName,
    allowCreateTab
  });
  const membersResult = await getPassTransitionMembers({
    force: true,
    allowCreateTab
  });
  if (!membersResult || membersResult.ok !== true) {
    if (allowCreateTab && snapshot.channelId) {
      const sessionResult = await hydrateViaWorkspaceSession().catch(() => null);
      if (sessionResult && sessionResult.ok === true) {
        return sessionResult;
      }
    }
    return membersResult || {
      ok: false,
      code: "pass_transition_unavailable",
      error: "PASS-TRANSITION recipients are unavailable."
    };
  }

  const memberIds = normalizeSlackUserIdList(membersResult.memberIds);
  if (!memberIds.length) {
    return {
      ok: true,
      ...membersResult,
      members: []
    };
  }

  let tokens = await resolveSlackApiTokens({});
  let workspaceSessionCapture = null;
  if (opts.force === true) {
    const openIdSession = await readSlackOpenIdSession();
    workspaceSessionCapture = await captureSlackRuntimeUserTokenFromWorkspaceSession({
      workspaceOrigin: SLACK_WORKSPACE_ORIGIN,
      expectedUserId: resolveExpectedSlackAuthorUserId({}, openIdSession),
      allowCreateTab
    }).catch((err) => ({
      ok: false,
      code: "slack_workspace_session_unavailable",
      error: err && err.message ? err.message : "Unable to capture Slack workspace session token."
    }));
    if (workspaceSessionCapture && workspaceSessionCapture.ok === true) {
      const capturedUserToken = normalizeSlackApiToken(workspaceSessionCapture.userToken);
      tokens = {
        botToken: "",
        botCandidates: [],
        userToken: capturedUserToken,
        userCandidates: capturedUserToken ? [capturedUserToken] : []
      };
    }
  }
  const tokenAttempts = buildSlackQaiTokenAttempts(tokens, "user");
  if (!tokenAttempts.length) {
    return {
      ok: false,
      code: String(workspaceSessionCapture && workspaceSessionCapture.code || "slack_token_missing").trim().toLowerCase() || "slack_token_missing",
      error: String(
        workspaceSessionCapture && workspaceSessionCapture.error
        || "Slack token is unavailable for PASS-TRANSITION recipient lookup."
      ).trim(),
      ...membersResult
    };
  }

  const apiOrigins = buildSlackQaiApiOrigins(SLACK_WORKSPACE_ORIGIN);
  const openIdSession = await readSlackOpenIdSession();
  let selfUserId = normalizeSlackUserId(openIdSession && openIdSession.userId);
  let resolvedToken = "";
  let resolvedApiOrigin = "";
  let lastFailureCode = "slack_auth_failed";
  let lastFailureError = "Unable to load PASS-TRANSITION recipient identities.";

  outer:
  for (let i = 0; i < tokenAttempts.length; i += 1) {
    const attempt = tokenAttempts[i];
    const attemptToken = normalizeSlackApiToken(attempt && attempt.token);
    if (!attemptToken) continue;
    if (isSlackTokenTemporarilyBackedOff(attemptToken)) {
      lastFailureCode = "slack_token_backoff";
      lastFailureError = "Slack token validation is cooling down after recent failures.";
      continue;
    }
    for (let originIndex = 0; originIndex < apiOrigins.length; originIndex += 1) {
      const apiOrigin = apiOrigins[originIndex];
      const auth = await postSlackApiWithBearerToken(apiOrigin, "/api/auth.test", {
        _x_reason: "zip-pass-transition-recipients-auth-bg"
      }, attemptToken);
      if (!auth || !auth.ok) {
        lastFailureCode = String(auth && auth.code || "slack_auth_failed").trim().toLowerCase() || "slack_auth_failed";
        lastFailureError = String(auth && auth.error || "Unable to validate Slack token for PASS-TRANSITION recipients.").trim();
        if (isSlackTokenInvalidationCode(lastFailureCode)) {
          markSlackTokenBackoff(attemptToken);
          await invalidateStoredSlackToken(attemptToken);
        }
        continue;
      }
      clearSlackTokenBackoff(attemptToken);
      resolvedToken = attemptToken;
      resolvedApiOrigin = apiOrigin;
      const authPayload = auth.payload && typeof auth.payload === "object" ? auth.payload : {};
      if (!selfUserId) {
        selfUserId = normalizeSlackUserId(authPayload.user_id || authPayload.user);
      }
      break outer;
    }
  }

  if (!resolvedToken || !resolvedApiOrigin) {
    if (allowCreateTab && snapshot.channelId) {
      const sessionResult = await hydrateViaWorkspaceSession().catch(() => null);
      if (sessionResult && sessionResult.ok === true) {
        return sessionResult;
      }
    }
    return {
      ok: false,
      code: lastFailureCode,
      error: lastFailureError,
      ...membersResult
    };
  }

  const recipients = [];
  const seenRecipientIds = new Set();
  const lookupMemberIds = memberIds.filter(Boolean);
  let lookupAttemptCount = lookupMemberIds.length;
  let lookupSuccessCount = 0;
  let lookupFailureCount = 0;
  let lastLookupFailureCode = "";
  let lastLookupFailureError = "";
  const lookupResults = await mapWithConcurrencyLimit(
    lookupMemberIds,
    PASS_TRANSITION_RECIPIENT_LOOKUP_CONCURRENCY,
    async (memberId) => ({
      memberId,
      recipientResult: await fetchPassTransitionRecipientViaApi(resolvedApiOrigin, resolvedToken, memberId).catch(() => null)
    })
  );
  for (let i = 0; i < lookupResults.length; i += 1) {
    const lookup = lookupResults[i] && typeof lookupResults[i] === "object" ? lookupResults[i] : {};
    const memberId = normalizeSlackUserId(lookup.memberId || "");
    if (!memberId) continue;
    const recipientResult = lookup.recipientResult;
    if (!recipientResult || recipientResult.ok !== true || !recipientResult.recipient) {
      lookupFailureCount += 1;
      lastLookupFailureCode = String(recipientResult && recipientResult.code || "slack_user_info_unavailable").trim().toLowerCase() || "slack_user_info_unavailable";
      lastLookupFailureError = String(recipientResult && recipientResult.error || "Unable to load PASS-TRANSITION recipient details from Slack.").trim();
      continue;
    }
    lookupSuccessCount += 1;
    const recipient = recipientResult.recipient;
    if (!recipient.userId || seenRecipientIds.has(recipient.userId)) continue;
    if (recipient.deleted === true || recipient.bot === true) continue;
    seenRecipientIds.add(recipient.userId);
    recipients.push({
      userId: recipient.userId,
      isSelf: !!(selfUserId && recipient.userId === selfUserId),
      userName: normalizeSlackDisplayName(recipient.userName || ""),
      displayName: normalizeSlackDisplayName(recipient.displayName || recipient.userName || recipient.realName || ""),
      realName: normalizeSlackDisplayName(recipient.realName || ""),
      handle: normalizeSlackHandleLoose(recipient.handle || ""),
      email: normalizeSlackEmailAddress(recipient.email || ""),
      avatarUrl: normalizeSlackAvatarUrl(recipient.avatarUrl || ""),
      statusIcon: normalizeSlackStatusIcon(recipient.statusIcon || ""),
      statusIconUrl: normalizeSlackStatusIconUrl(recipient.statusIconUrl || ""),
      statusMessage: normalizeSlackStatusMessage(recipient.statusMessage || ""),
      label: normalizeSlackDisplayName(recipient.label || "") || ("@" + recipient.userId)
    });
  }
  if (lookupAttemptCount > 0 && lookupSuccessCount === 0 && lookupFailureCount === lookupAttemptCount) {
    if (allowCreateTab && snapshot.channelId) {
      const sessionResult = await hydrateViaWorkspaceSession().catch(() => null);
      if (sessionResult && sessionResult.ok === true) {
        return sessionResult;
      }
    }
    return {
      ok: false,
      code: lastLookupFailureCode || "slack_user_info_unavailable",
      error: lastLookupFailureError || "Unable to load PASS-TRANSITION recipient details from Slack.",
      ...membersResult
    };
  }
  recipients.sort((left, right) => {
    const leftIsSelf = !!(left && left.isSelf);
    const rightIsSelf = !!(right && right.isSelf);
    if (leftIsSelf !== rightIsSelf) return leftIsSelf ? -1 : 1;
    return String(left && left.label || "").localeCompare(String(right && right.label || ""), undefined, {
      sensitivity: "base"
    });
  });

  await setStorageLocal({
    [ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY]: membersResult.channelId,
    [ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY]: membersResult.channelName,
    [ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY]: normalizeSlackUserIdCsv(membersResult.memberIds),
    [ZIP_PASS_TRANSITION_RECIPIENTS_STORAGE_KEY]: recipients,
    [ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY]: membersResult.membersSyncedAt || nowIso()
  });

  return {
    ok: true,
    ...membersResult,
    selfUserId,
    members: recipients
  };
}

async function getPassTransitionRecipients() {
  const stored = await readStorageLocal([
    ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY,
    ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY,
    ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY,
    ZIP_PASS_TRANSITION_RECIPIENTS_STORAGE_KEY,
    ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY
  ]);
  const snapshot = buildPassTransitionSnapshot(stored);
  if (!snapshot.channelId) {
    return {
      ok: false,
      code: "pass_transition_channel_missing",
      error: "PASS-TRANSITION channel ID is not configured in ZIP.KEY.",
      ...snapshot,
      members: []
    };
  }
  return {
    ok: true,
    cached: true,
    hydrated: false,
    ...snapshot,
    selfUserId: "",
    members: Array.isArray(snapshot.recipients) ? snapshot.recipients.slice() : []
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

function buildSlackWebSessionRequestFields(fields, token) {
  const source = fields && typeof fields === "object" ? fields : {};
  const payload = {
    ...source,
    token: normalizeSlackApiToken(token)
  };
  if (!Object.prototype.hasOwnProperty.call(payload, "_x_mode")) {
    payload._x_mode = "online";
  }
  if (!Object.prototype.hasOwnProperty.call(payload, "_x_sonic")) {
    payload._x_sonic = true;
  }
  if (!Object.prototype.hasOwnProperty.call(payload, "_x_app_name")) {
    payload._x_app_name = "client";
  }
  return payload;
}

async function postSlackApiWithBearerToken(workspaceOrigin, apiPath, fields, token) {
  const origin = normalizeSlackWorkspaceOrigin(workspaceOrigin);
  const endpoint = origin + String(apiPath || "");
  const authToken = normalizeSlackApiToken(token);
  if (!authToken) {
    return { ok: false, error: "Slack API token is missing.", code: "slack_api_token_missing" };
  }
  const useWebSessionTransport = isSlackWebSessionToken(authToken);
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
  };
  if (!useWebSessionTransport) {
    headers.Authorization = "Bearer " + authToken;
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      credentials: useWebSessionTransport ? "include" : "omit",
      cache: useWebSessionTransport ? "no-store" : "default",
      body: buildSlackApiFormBody(
        useWebSessionTransport
          ? buildSlackWebSessionRequestFields(fields, authToken)
          : fields
      )
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
    const botCandidates = uniq([SLACK_API_DEFAULT_BOT_TOKEN, SLACK_API_SECONDARY_BOT_TOKEN]);
    const userCandidates = uniq([SLACK_API_DEFAULT_USER_TOKEN]);
    return {
      botToken: botCandidates[0] || "",
      botCandidates,
      userToken: userCandidates[0] || "",
      userCandidates
    };
  }
  try {
    const stored = await chrome.storage.local.get([
      ZIP_SLACK_BOT_TOKEN_STORAGE_KEY,
      ZIP_SLACK_LEGACY_USER_TOKEN_STORAGE_KEY,
      ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY
    ]);
    const botCandidates = uniq([
      stored && stored[ZIP_SLACK_BOT_TOKEN_STORAGE_KEY],
      SLACK_API_DEFAULT_BOT_TOKEN,
      SLACK_API_SECONDARY_BOT_TOKEN
    ]);
    const userCandidates = uniq([
      stored && stored[ZIP_SLACK_LEGACY_USER_TOKEN_STORAGE_KEY],
      stored && stored[ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY],
      SLACK_API_DEFAULT_USER_TOKEN
    ]);
    return {
      botToken: botCandidates[0] || "",
      botCandidates,
      userToken: userCandidates[0] || "",
      userCandidates
    };
  } catch (_) {
    const botCandidates = uniq([SLACK_API_DEFAULT_BOT_TOKEN, SLACK_API_SECONDARY_BOT_TOKEN]);
    const userCandidates = uniq([SLACK_API_DEFAULT_USER_TOKEN]);
    return {
      botToken: botCandidates[0] || "",
      botCandidates,
      userToken: userCandidates[0] || "",
      userCandidates
    };
  }
}

async function resolveSlackApiTokens(input) {
  const body = input && typeof input === "object" ? input : {};
  const strictProvidedTokens = body.strictProvidedTokens === true;
  const botFromMessage = normalizeSlackApiToken(body.botToken || body.bot_token);
  const userFromMessage = normalizeSlackApiToken(body.userToken || body.user_token);
  const oauthFromMessage = normalizeSlackApiToken(body.oauthToken || body.oauth_token);
  const providedBotCandidates = Array.isArray(body.botCandidates) ? body.botCandidates : [];
  const providedUserCandidates = Array.isArray(body.userCandidates) ? body.userCandidates : [];
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
  let botCandidates = [];
  let userCandidates = [];
  if (strictProvidedTokens) {
    botCandidates = uniq([botFromMessage].concat(providedBotCandidates));
    userCandidates = uniq([userFromMessage, oauthFromMessage].concat(providedUserCandidates));
  } else {
    const stored = await readStoredSlackApiTokens();
    const openIdSession = await readSlackOpenIdSession();
    const openIdAccessToken = normalizeSlackApiToken(openIdSession && openIdSession.accessToken);
    const storedUserCandidates = Array.isArray(stored && stored.userCandidates)
      ? stored.userCandidates
      : [stored && stored.userToken];
    botCandidates = uniq([botFromMessage].concat(providedBotCandidates).concat(
      Array.isArray(stored && stored.botCandidates) ? stored.botCandidates : [stored && stored.botToken]
    ));
    userCandidates = uniq([userFromMessage, oauthFromMessage].concat(providedUserCandidates).concat(
      storedUserCandidates
    ).concat([openIdAccessToken]));
  }
  // Classify tokens by prefix so runtime-captured session tokens and optional bot config survive slot mixups.
  const botResolved = uniq(botCandidates.concat(userCandidates)).filter((token) => isSlackBotApiToken(token));
  const userResolved = uniq(userCandidates.concat(botCandidates)).filter((token) => isSlackUserOAuthToken(token));
  return {
    botToken: botResolved[0] || "",
    botCandidates: botResolved,
    userToken: userResolved[0] || "",
    userCandidates: userResolved
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
  void token;
  // Persisted Slack session tokens are never auto-removed by token invalidation paths.
}

async function slackSendMarkdownToSelfViaBotApi(input, resolvedTokens) {
  const body = input && typeof input === "object" ? input : {};
  const tokens = resolvedTokens && typeof resolvedTokens === "object" ? resolvedTokens : {};
  const webApiOrigin = SLACK_WEB_API_ORIGIN;
  const requestedDirectChannelId = normalizeSlackDirectChannelId(
    body.directChannelId
    || body.direct_channel_id
    || body.channelId
    || body.channel_id
    || body.channel
  );
  const botDeliveryToken = normalizeSlackApiToken(tokens.botToken);
  const botCandidates = Array.isArray(tokens && tokens.botCandidates)
    ? tokens.botCandidates
      .map((token) => normalizeSlackApiToken(token))
      .filter((token) => isSlackBotApiToken(token))
    : [botDeliveryToken].filter((token) => isSlackBotApiToken(token));
  if (!botCandidates.length) {
    return {
      ok: false,
      code: "slack_bot_token_missing",
      error: "SLACK_IT_TO_ME requires a Slack bot token for guaranteed new-message delivery."
    };
  }

  const openIdSession = await readSlackOpenIdSession();
  const requestedUserId = normalizeSlackUserId(body.userId || body.user_id);
  const requireRequestedUser = body.requireRequestedUser === true;
  if (requireRequestedUser && !requestedUserId) {
    return {
      ok: false,
      code: "slack_user_identity_missing",
      error: "A PASS-TRANSITION recipient is required for targeted Slack delivery."
    };
  }
  const openIdUserId = normalizeSlackUserId(openIdSession && openIdSession.userId);
  const userIdCandidates = [];
  const pushUserIdCandidate = (value) => {
    const normalized = normalizeSlackUserId(value);
    if (!normalized) return;
    if (!userIdCandidates.includes(normalized)) userIdCandidates.push(normalized);
  };
  if (requireRequestedUser) {
    pushUserIdCandidate(requestedUserId);
  } else {
    pushUserIdCandidate(requestedUserId);
    pushUserIdCandidate(openIdUserId);
  }
  if (!userIdCandidates.length) {
    return {
      ok: false,
      code: "slack_user_identity_missing",
      error: "Unable to resolve Slack user identity for @ME delivery."
    };
  }

  const resolvedUserName = normalizeSlackDisplayName(
    body.userName || body.user_name || (openIdSession && openIdSession.userName) || ""
  );
  const resolvedAvatarUrl = normalizeSlackAvatarUrl(
    body.avatarUrl
    || body.avatar_url
    || (openIdSession && openIdSession.avatarUrl)
    || ""
  );

  let lastFailureCode = "slack_bot_send_failed";
  let lastFailureError = "Unable to send Slack @ME message with bot delivery.";
  let backedOffTokenCount = 0;

  for (let i = 0; i < botCandidates.length; i += 1) {
    const attemptToken = normalizeSlackApiToken(botCandidates[i]);
    if (!attemptToken) continue;
    if (isSlackTokenTemporarilyBackedOff(attemptToken)) {
      backedOffTokenCount += 1;
      lastFailureCode = "slack_bot_token_backoff";
      lastFailureError = "Slack bot token validation is cooling down after recent failures.";
      continue;
    }

    const auth = await postSlackApiWithBearerToken(webApiOrigin, "/api/auth.test", {
      _x_reason: "zip-slack-it-to-me-auth-bot-bg"
    }, attemptToken);
    if (!auth.ok) {
      lastFailureCode = auth.code || "slack_auth_failed";
      lastFailureError = auth.error || "Unable to validate Slack bot credentials.";
      if (isSlackTokenInvalidationCode(lastFailureCode)) {
        markSlackTokenBackoff(attemptToken);
      }
      continue;
    }
    clearSlackTokenBackoff(attemptToken);

    const authPayload = auth.payload && typeof auth.payload === "object" ? auth.payload : {};
    const teamId = normalizeSlackTeamId(authPayload.team_id || authPayload.team);
    let tokenInvalidated = false;
    for (let userIdx = 0; userIdx < userIdCandidates.length; userIdx += 1) {
      const userId = userIdCandidates[userIdx];
      const messageText = String(body.markdownText || body.text || body.messageText || "").trim();
      const sendViaChannel = async (channelId, reasonTag) => {
        const postFields = buildSlackNewMessageFields({
          channel: channelId,
          text: messageText,
          mrkdwn: true,
          parse: "none",
          unfurl_links: "false",
          unfurl_media: "false",
          _x_reason: reasonTag
        });
        return postSlackApiWithBearerToken(webApiOrigin, "/api/chat.postMessage", postFields, attemptToken);
      };
      const openDirectChannel = async (reasonTag) => {
        const dmOpen = await postSlackApiWithBearerToken(webApiOrigin, "/api/conversations.open", {
          users: userId,
          return_im: "true",
          _x_reason: reasonTag
        }, attemptToken);
        if (!dmOpen || !dmOpen.ok) {
          return {
            ok: false,
            code: dmOpen && dmOpen.code ? dmOpen.code : "slack_open_dm_failed",
            error: dmOpen && dmOpen.error ? dmOpen.error : "Unable to open Slack DM channel."
          };
        }
        const dmPayload = dmOpen.payload && typeof dmOpen.payload === "object" ? dmOpen.payload : {};
        const dmChannel = dmPayload.channel && typeof dmPayload.channel === "object" ? dmPayload.channel : {};
        const channelId = normalizeSlackDirectChannelId(
          dmChannel.id
          || dmPayload.channel_id
          || dmPayload.channel
        );
        if (!channelId) {
          return {
            ok: false,
            code: "slack_dm_channel_missing",
            error: "Unable to resolve Slack DM channel."
          };
        }
        return { ok: true, channelId };
      };

      let postChannel = requestedDirectChannelId;
      if (!postChannel) {
        const dmOpen = await openDirectChannel("zip-slack-it-to-me-open-dm-bot-bg");
        if (!dmOpen.ok) {
          lastFailureCode = dmOpen.code || "slack_open_dm_failed";
          lastFailureError = dmOpen.error || "Unable to open Slack DM channel.";
          if (isSlackTokenInvalidationCode(lastFailureCode)) {
            markSlackTokenBackoff(attemptToken);
            tokenInvalidated = true;
            break;
          }
          continue;
        }
        postChannel = String(dmOpen.channelId || "").trim();
      }

      let post = await sendViaChannel(postChannel, "zip-slack-it-to-me-bot-bg");
      if (
        (!post || !post.ok)
        && requestedDirectChannelId
        && postChannel === requestedDirectChannelId
      ) {
        const postCode = String(post && post.code || "").trim().toLowerCase();
        const shouldRecoverWithDmOpen = postCode === "channel_not_found" || postCode === "not_in_channel";
        if (shouldRecoverWithDmOpen) {
          const dmRecover = await openDirectChannel("zip-slack-it-to-me-open-dm-bot-recover-bg");
          if (!dmRecover.ok) {
            lastFailureCode = dmRecover.code || "slack_open_dm_failed";
            lastFailureError = dmRecover.error || "Unable to open Slack DM channel.";
            if (isSlackTokenInvalidationCode(lastFailureCode)) {
              markSlackTokenBackoff(attemptToken);
              tokenInvalidated = true;
              break;
            }
            continue;
          }
          postChannel = String(dmRecover.channelId || postChannel).trim();
          post = await sendViaChannel(postChannel, "zip-slack-it-to-me-bot-recover-bg");
        }
      }
      if (!post.ok) {
        lastFailureCode = post.code || "slack_post_failed";
        lastFailureError = post.error || "Unable to send Slack self-DM.";
        if (isSlackTokenInvalidationCode(lastFailureCode)) {
          markSlackTokenBackoff(attemptToken);
          tokenInvalidated = true;
          break;
        }
        continue;
      }
      const postPayload = post.payload && typeof post.payload === "object" ? post.payload : {};
      const postedTs = String(postPayload.ts || (postPayload.message && postPayload.message.ts) || "").trim();
      const directChannelId = normalizeSlackDirectChannelId(postPayload.channel || postChannel || "");
      return {
        ok: true,
        channel: String(postPayload.channel || postChannel || userId).trim(),
        direct_channel_id: directChannelId || normalizeSlackDirectChannelId(postChannel),
        ts: postedTs,
        user_id: userId,
        team_id: teamId || "",
        user_name: resolvedUserName,
        avatar_url: resolvedAvatarUrl,
        unread_marked: true,
        delivery_mode: "bot_direct_channel"
      };
    }
    if (tokenInvalidated) {
      continue;
    }
  }

  if (backedOffTokenCount > 0 && backedOffTokenCount >= botCandidates.length) {
    return {
      ok: false,
      code: "slack_bot_token_backoff",
      error: lastFailureError
    };
  }
  return {
    ok: false,
    code: lastFailureCode,
    error: lastFailureError
  };
}

async function slackSendMarkdownToUserViaApi(input) {
  const body = input && typeof input === "object" ? input : {};
  const requestedUserId = normalizeSlackUserId(body.userId || body.user_id);
  const preferBotDmDelivery = body.preferBotDmDelivery === true;
  const requireBotDelivery = body.requireBotDelivery === true;
  const allowBotDelivery = body.allowBotDelivery === true || requireBotDelivery;
  if (!requestedUserId) {
    return {
      ok: false,
      code: "slack_user_identity_missing",
      error: "A PASS-TRANSITION recipient is required for targeted Slack delivery."
    };
  }
  return slackSendMarkdownToSelfViaApi({
    ...body,
    userId: requestedUserId,
    user_id: requestedUserId,
    preferApiFirst: false,
    preferRequestedUser: true,
    requireRequestedUser: true,
    preferBotDmDelivery,
    requireBotDelivery,
    allowBotDelivery
  });
}

async function slackSendMarkdownToSelfViaApi(input) {
  const body = input && typeof input === "object" ? input : {};
  const markdownText = String(body.markdownText || body.text || body.messageText || "").trim();
  if (!markdownText) {
    return { ok: false, error: "Slack message body is empty.", code: "slack_payload_empty" };
  }
  const workspaceOrigin = normalizeSlackWorkspaceOrigin(body.workspaceOrigin || SLACK_WORKSPACE_ORIGIN);
  const webApiOrigin = workspaceOrigin || SLACK_WEB_API_ORIGIN;
  const allowWorkspaceTabBootstrap = body.autoBootstrapSlackTab !== false;
  const requireNativeNewMessage = body.requireNativeNewMessage !== false;
  const skipUnreadMark = body.skipUnreadMark !== false;
  const preferApiFirst = body.preferApiFirst !== false;
  const preferBotDmDelivery = body.preferBotDmDelivery !== false;
  const preferRequestedUser = body.preferRequestedUser === true;
  const requireRequestedUser = body.requireRequestedUser === true;
  const requireBotDelivery = body.requireBotDelivery === true;
  const allowBotDelivery = body.allowBotDelivery === true || requireBotDelivery;
  // Prefer SLACKTIVATED user-identity delivery. Bot delivery is fallback.
  const tokens = await resolveSlackApiTokens(body);
  const userDeliveryToken = normalizeSlackApiToken(tokens.userToken);
  const userCandidates = Array.isArray(tokens && tokens.userCandidates)
    ? tokens.userCandidates.map((token) => normalizeSlackApiToken(token)).filter(Boolean)
    : [userDeliveryToken].filter(Boolean);
  const tokenAttempts = [];
  for (let i = 0; i < userCandidates.length; i += 1) {
    const normalizedToken = normalizeSlackApiToken(userCandidates[i]);
    if (!normalizedToken) continue;
    if (!isSlackUserOAuthToken(normalizedToken)) continue;
    if (tokenAttempts.includes(normalizedToken)) continue;
    tokenAttempts.push(normalizedToken);
  }
  const hasUserOAuthCandidate = tokenAttempts.length > 0;
  let primaryBotFailure = null;
  if (allowBotDelivery && preferBotDmDelivery) {
    const primaryBotDelivery = await slackSendMarkdownToSelfViaBotApi(body, tokens);
    if (primaryBotDelivery && primaryBotDelivery.ok) {
      return primaryBotDelivery;
    }
    primaryBotFailure = primaryBotDelivery || null;
    if (requireBotDelivery) {
      return {
        ok: false,
        code: String((primaryBotFailure && primaryBotFailure.code) || "slack_bot_delivery_failed"),
        error: String((primaryBotFailure && primaryBotFailure.error) || "Unable to send Slack @ME message with bot delivery.")
      };
    }
  }

  let primarySessionDelivery = null;
  let primarySessionError = "";
  let primarySessionCode = "";
  const shouldTryPrimarySessionFirst = !preferApiFirst || (!hasUserOAuthCandidate && !allowBotDelivery);
  if (shouldTryPrimarySessionFirst) {
    // Session-first path remains available for environments without a valid user token.
    const initialSessionDelivery = await slackSendMarkdownToSelfViaWorkspaceSession(body, "workspace_session_primary");
    primarySessionDelivery = initialSessionDelivery;
    if (
      primarySessionDelivery
      && primarySessionDelivery.ok
    ) {
      if (!requireNativeNewMessage || primarySessionDelivery.unread_marked === true) {
        return primarySessionDelivery;
      }
      const deliveredChannel = normalizeSlackChannelId(primarySessionDelivery.channel);
      const deliveredTs = String(primarySessionDelivery.ts || "").trim();
      if (deliveredChannel && deliveredTs && tokenAttempts.length) {
        for (let i = 0; i < tokenAttempts.length; i += 1) {
          const token = tokenAttempts[i];
          if (!token || isSlackTokenTemporarilyBackedOff(token)) continue;
          const marked = await markSlackMessageUnreadViaApiToken(
            webApiOrigin,
            token,
            deliveredChannel,
            deliveredTs
          );
          if (marked) {
            clearSlackTokenBackoff(token);
            return {
              ...primarySessionDelivery,
              unread_marked: true
            };
          }
        }
      }
      return {
        ok: false,
        code: "slack_unread_marker_unconfirmed",
        error: "Slack delivery succeeded but native unread/new marker was not confirmed."
      };
    }
    primarySessionError = String((primarySessionDelivery && primarySessionDelivery.error) || "").trim();
    if (
      primarySessionDelivery
      && primarySessionDelivery.ok
      && requireNativeNewMessage
      && primarySessionDelivery.unread_marked !== true
    ) {
      primarySessionError = "Slack delivery succeeded but native unread/new marker was not confirmed.";
    }
    primarySessionCode = String((primarySessionDelivery && primarySessionDelivery.code) || "").trim().toLowerCase();
  }

  // If no explicit Slack user OAuth token is available, rely on session guidance.
  if (!hasUserOAuthCandidate) {
    if (allowBotDelivery) {
      const botFallback = primaryBotFailure || await slackSendMarkdownToSelfViaBotApi(body, tokens);
      if (botFallback && botFallback.ok) {
        return botFallback;
      }
      if (requireBotDelivery) {
        return {
          ok: false,
          code: String((botFallback && botFallback.code) || "slack_bot_delivery_failed"),
          error: String((botFallback && botFallback.error) || "Unable to send Slack @ME message with bot delivery.")
        };
      }
      const botFailure = String((botFallback && botFallback.error) || "").trim();
      return {
        ok: false,
        code: String((botFallback && botFallback.code) || "slack_user_token_missing"),
        error: "SLACK_IT_TO_ME requires a Slack user/session token or bot token for DM delivery." + (
          botFailure
            ? (" " + botFailure)
            : ""
        ) + (
          primarySessionError
            ? (" " + primarySessionError)
            : ""
        )
      };
    }
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

  if (!tokenAttempts.length) {
    if (allowBotDelivery) {
      const botFallback = primaryBotFailure || await slackSendMarkdownToSelfViaBotApi(body, tokens);
      if (botFallback && botFallback.ok) {
        return botFallback;
      }
      if (requireBotDelivery) {
        return {
          ok: false,
          code: String((botFallback && botFallback.code) || "slack_bot_delivery_failed"),
          error: String((botFallback && botFallback.error) || "Unable to send Slack @ME message with bot delivery.")
        };
      }
    }
    const sessionFallback = await slackSendMarkdownToSelfViaWorkspaceSession(body, "slack_api_token_missing");
    if (
      sessionFallback
      && sessionFallback.ok
      && (!requireNativeNewMessage || sessionFallback.unread_marked === true)
    ) {
      return sessionFallback;
    }
    const unreadFailure = (
      sessionFallback
      && sessionFallback.ok
      && requireNativeNewMessage
      && sessionFallback.unread_marked !== true
    ) ? "Slack delivery succeeded but native unread/new marker was not confirmed." : "";
    const sessionFallbackError = String((sessionFallback && sessionFallback.error) || unreadFailure).trim();
    return {
      ok: false,
      code: "slack_user_token_missing",
      error: "SLACK_IT_TO_ME requires a Slack user/session token for DM delivery." + (
        sessionFallbackError
          ? (" " + sessionFallbackError)
          : ""
      )
    };
  }

  const openIdSession = await readSlackOpenIdSession();
  const requestedUserId = normalizeSlackUserId(body.userId || body.user_id);
  const expectedAuthorUserId = resolveExpectedSlackAuthorUserId(body, openIdSession);
  if (requireRequestedUser && !requestedUserId) {
    return {
      ok: false,
      code: "slack_user_identity_missing",
      error: "A PASS-TRANSITION recipient is required for targeted Slack delivery."
    };
  }
  const openIdUserId = normalizeSlackUserId(openIdSession && openIdSession.userId);

  let resolvedUserName = normalizeSlackDisplayName(
    body.authorUserName
    || body.author_user_name
    || body.userName
    || body.user_name
    || (openIdSession && openIdSession.userName)
    || ""
  );
  let resolvedAvatarUrl = normalizeSlackAvatarUrl(
    body.authorAvatarUrl
    || body.author_avatar_url
    || body.avatarUrl
    || body.avatar_url
    || (openIdSession && openIdSession.avatarUrl)
    || ""
  );

  let lastFailureCode = "slack_send_failed";
  let lastFailureError = "Unable to send Slack self-DM.";
  let backedOffTokenCount = 0;

  for (let i = 0; i < tokenAttempts.length; i += 1) {
    const attemptToken = normalizeSlackApiToken(tokenAttempts[i]);
    if (!attemptToken) continue;
    if (isSlackTokenTemporarilyBackedOff(attemptToken)) {
      backedOffTokenCount += 1;
      lastFailureCode = "slack_token_backoff";
      lastFailureError = "Slack token validation is cooling down after recent failures.";
      continue;
    }

    const auth = await postSlackApiWithBearerToken(webApiOrigin, "/api/auth.test", {
      _x_reason: "zip-slack-it-to-me-auth-bg"
    }, attemptToken);
    if (!auth.ok) {
      lastFailureCode = auth.code || "slack_auth_failed";
      lastFailureError = auth.error || "Unable to validate Slack API credentials.";
      if (isSlackTokenInvalidationCode(lastFailureCode)) {
        markSlackTokenBackoff(attemptToken);
        await invalidateStoredSlackToken(attemptToken);
      }
      continue;
    }
    clearSlackTokenBackoff(attemptToken);

    const authPayload = auth.payload && typeof auth.payload === "object" ? auth.payload : {};
    const teamId = normalizeSlackTeamId(authPayload.team_id || authPayload.team);
    const authFallbackName = normalizeSlackDisplayName(authPayload.user || "");
    const authUserId = normalizeSlackUserId(authPayload.user_id || authPayload.user);
    if (expectedAuthorUserId && authUserId && authUserId !== expectedAuthorUserId) {
      lastFailureCode = "slack_identity_mismatch";
      lastFailureError = "Slack API token does not match the active Slack user.";
      continue;
    }
    if (expectedAuthorUserId && !authUserId) {
      lastFailureCode = "slack_identity_mismatch";
      lastFailureError = "Slack API token identity could not be verified for the active Slack user.";
      continue;
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
    if (requireRequestedUser) {
      pushUserIdCandidate(requestedUserId);
    } else if (preferRequestedUser) {
      pushUserIdCandidate(requestedUserId);
      pushUserIdCandidate(authUserId);
      pushUserIdCandidate(openIdUserId);
    } else {
      pushUserIdCandidate(authUserId);
      pushUserIdCandidate(requestedUserId);
      pushUserIdCandidate(openIdUserId);
    }
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
          markSlackTokenBackoff(attemptToken);
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
      const postFields = buildSlackNewMessageFields({
        channel: postChannel,
        text: messageText,
        mrkdwn: true,
        parse: "none",
        unfurl_links: "false",
        unfurl_media: "false",
        _x_reason: "zip-slack-it-to-me-bg"
      });
      const prePostCursorTs = skipUnreadMark
        ? ""
        : await fetchSlackLatestMessageTsViaApiToken(
          webApiOrigin,
          attemptToken,
          postChannel
        ).catch(() => "");
      const post = await postSlackApiWithBearerToken(webApiOrigin, "/api/chat.postMessage", postFields, attemptToken);
      if (!post.ok) {
        lastFailureCode = post.code || "slack_post_failed";
        lastFailureError = post.error || "Unable to send Slack self-DM.";
        if (isSlackTokenInvalidationCode(lastFailureCode)) {
          markSlackTokenBackoff(attemptToken);
          await invalidateStoredSlackToken(attemptToken);
          tokenInvalidated = true;
          break;
        }
        continue;
      }
      const postPayload = post.payload && typeof post.payload === "object" ? post.payload : {};
      const postedTs = String(postPayload.ts || (postPayload.message && postPayload.message.ts) || "").trim();
      let unreadMarked = false;
      if (!skipUnreadMark && postChannel && postedTs) {
        unreadMarked = await markSlackMessageUnreadViaApiToken(
          webApiOrigin,
          attemptToken,
          postChannel,
          postedTs,
          prePostCursorTs
        );
        if (!unreadMarked) {
          const workspaceUnreadFallback = await slackMarkUnreadViaWorkspaceSession({
            workspaceOrigin: webApiOrigin,
            channelId: postChannel,
            ts: postedTs,
            autoBootstrapSlackTab: allowWorkspaceTabBootstrap
          }, "workspace_mark_unread_fallback");
          unreadMarked = !!(workspaceUnreadFallback && workspaceUnreadFallback.ok && workspaceUnreadFallback.unread_marked === true);
        }
      }
      if (!skipUnreadMark && requireNativeNewMessage && unreadMarked !== true) {
        return {
          ok: false,
          code: "slack_unread_marker_unconfirmed",
          error: "Slack delivery succeeded but native unread/new marker was not confirmed."
        };
      }
      return {
        ok: true,
        channel: String(postPayload.channel || postChannel || userId).trim(),
        direct_channel_id: normalizeSlackDirectChannelId(postPayload.channel || postChannel || ""),
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

  if (allowBotDelivery) {
    const botFallback = primaryBotFailure || await slackSendMarkdownToSelfViaBotApi(body, tokens);
    if (botFallback && botFallback.ok) {
      return botFallback;
    }
    if (requireBotDelivery) {
      return {
        ok: false,
        code: String((botFallback && botFallback.code) || "slack_bot_delivery_failed"),
        error: String((botFallback && botFallback.error) || "Unable to send Slack @ME message with bot delivery.")
      };
    }
    if (botFallback && !botFallback.ok && botFallback.error) {
      lastFailureError = String(botFallback.error || lastFailureError);
      lastFailureCode = String(botFallback.code || lastFailureCode);
    }
  }

  if (backedOffTokenCount > 0 && backedOffTokenCount >= tokenAttempts.length) {
    const sessionFallback = await slackSendMarkdownToSelfViaWorkspaceSession(body, "slack_token_backoff");
    if (
      sessionFallback
      && sessionFallback.ok
      && (!requireNativeNewMessage || sessionFallback.unread_marked === true)
    ) {
      return sessionFallback;
    }
    if (
      sessionFallback
      && sessionFallback.ok
      && requireNativeNewMessage
      && sessionFallback.unread_marked !== true
    ) {
      lastFailureCode = "slack_unread_marker_unconfirmed";
      lastFailureError = "Slack delivery succeeded but native unread/new marker was not confirmed.";
    }
  }

  const shouldRetryWorkspaceSession = !(
    primarySessionCode === "slack_workspace_tab_missing"
    || primarySessionCode === "slack_workspace_session_unavailable"
  );
  if (shouldRetryWorkspaceSession) {
    const sessionFallback = await slackSendMarkdownToSelfViaWorkspaceSession(body, lastFailureCode);
    if (
      sessionFallback
      && sessionFallback.ok
      && (!requireNativeNewMessage || sessionFallback.unread_marked === true)
    ) {
      return sessionFallback;
    }
    if (
      sessionFallback
      && sessionFallback.ok
      && requireNativeNewMessage
      && sessionFallback.unread_marked !== true
    ) {
      lastFailureCode = "slack_unread_marker_unconfirmed";
      lastFailureError = "Slack delivery succeeded but native unread/new marker was not confirmed.";
    }
  }
  return {
    ok: false,
    code: lastFailureCode,
    error: lastFailureError
  };
}

function normalizeSlackQaiTokenKind(value) {
  const kind = String(value || "").trim().toLowerCase();
  if (kind === "bot") return "bot";
  if (kind === "user") return "user";
  return "";
}

function appendSlackQaiTokenAttempt(attempts, token, kind) {
  const normalizedToken = normalizeSlackApiToken(token);
  const normalizedKind = normalizeSlackQaiTokenKind(kind);
  if (!normalizedToken || !normalizedKind) return;
  if (normalizedKind === "bot" && !isSlackBotApiToken(normalizedToken)) return;
  if (normalizedKind === "user" && !isSlackUserOAuthToken(normalizedToken)) return;
  if (!Array.isArray(attempts)) return;
  if (attempts.some((row) => row && row.token === normalizedToken)) return;
  attempts.push({ token: normalizedToken, kind: normalizedKind });
}

function buildSlackQaiTokenAttempts(tokens, preferredKind) {
  const resolved = tokens && typeof tokens === "object" ? tokens : {};
  const userCandidates = Array.isArray(resolved.userCandidates)
    ? resolved.userCandidates
    : [resolved.userToken];
  const botCandidates = Array.isArray(resolved.botCandidates)
    ? resolved.botCandidates
    : [resolved.botToken];
  const attempts = [];
  const preferred = normalizeSlackQaiTokenKind(preferredKind);
  const appendUsers = () => {
    for (let i = 0; i < userCandidates.length; i += 1) {
      appendSlackQaiTokenAttempt(attempts, userCandidates[i], "user");
    }
  };
  const appendBots = () => {
    for (let i = 0; i < botCandidates.length; i += 1) {
      appendSlackQaiTokenAttempt(attempts, botCandidates[i], "bot");
    }
  };

  if (preferred === "bot") {
    appendBots();
    if (!attempts.length) appendUsers();
    else appendUsers();
    return attempts;
  }
  if (preferred === "user") {
    appendUsers();
    if (!attempts.length) appendBots();
    else appendBots();
    return attempts;
  }
  // Default to user/session first, then bot fallback for scope/channel compatibility variance.
  appendUsers();
  appendBots();
  return attempts;
}

function isRetryableSlackQaiApiCode(code) {
  const normalized = String(code || "").trim().toLowerCase();
  if (!normalized) return false;
  return normalized === "invalid_auth"
    || normalized === "not_authed"
    || normalized === "token_revoked"
    || normalized === "account_inactive"
    || normalized === "missing_scope"
    || normalized === "insufficient_scope"
    || normalized === "not_allowed_token_type"
    || normalized === "channel_not_found"
    || normalized === "not_in_channel";
}

function buildSlackQaiApiOrigins(workspaceOrigin) {
  const origins = [];
  const pushOrigin = (value) => {
    const normalized = normalizeSlackWorkspaceOrigin(value);
    if (!normalized) return;
    if (!origins.includes(normalized)) origins.push(normalized);
  };
  pushOrigin(workspaceOrigin || SLACK_WORKSPACE_ORIGIN);
  pushOrigin(SLACK_WORKSPACE_ORIGIN);
  pushOrigin(SLACK_WEB_API_ORIGIN);
  return origins;
}

function slackQaiTsToEpochMs(ts) {
  const value = Number(ts);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.trunc(value * 1000);
}

function extractSlackQaiRichTextElementsPlain(elements, parts) {
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
    if (Array.isArray(node.elements)) {
      extractSlackQaiRichTextElementsPlain(node.elements, out);
    }
    if (Array.isArray(node.items)) {
      extractSlackQaiRichTextElementsPlain(node.items, out);
    }
  }
  return out;
}

function extractSlackQaiBlocksText(blocks) {
  const rows = Array.isArray(blocks) ? blocks : [];
  const parts = [];
  for (let i = 0; i < rows.length; i += 1) {
    const block = rows[i];
    if (!block || typeof block !== "object") continue;
    if (Array.isArray(block.elements)) {
      extractSlackQaiRichTextElementsPlain(block.elements, parts);
    }
    if (block.text && typeof block.text === "object") {
      const plain = String(block.text.text || "").trim();
      if (plain) parts.push(plain);
    }
  }
  return parts.join("").trim();
}

function extractSlackQaiMessageText(message) {
  if (!message || typeof message !== "object") return "";
  const parts = [];
  const directText = String(message.text || "").trim();
  if (directText) parts.push(directText);

  const blockText = extractSlackQaiBlocksText(message.blocks);
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
    parts.push(url ? (name + ": " + url) : name);
  }

  return parts.join("\n\n").trim();
}

function isSlackQaiSingularityMessage(message, options) {
  if (!message || typeof message !== "object") return false;
  const opts = options && typeof options === "object" ? options : {};
  const singularityUserId = normalizeSlackUserId(opts.singularityUserId || "");
  const messageUserId = normalizeSlackUserId(message.user || "");
  if (singularityUserId && messageUserId && messageUserId === singularityUserId) return true;

  const singularityNamePattern = String(opts.singularityNamePattern || "").trim().toLowerCase();
  const botProfile = message.bot_profile && typeof message.bot_profile === "object" ? message.bot_profile : null;
  const profile = message.user_profile && typeof message.user_profile === "object" ? message.user_profile : null;
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

function hasSlackQaiFinalMarker(message, markerRegexText) {
  const markerSource = String(markerRegexText || "FINAL_RESPONSE").trim();
  const text = extractSlackQaiMessageText(message);
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
  if (!eventPayload) return false;
  return eventPayload.FINAL_RESPONSE === true
    || eventPayload.final_response === true
    || eventPayload.final === true;
}

function hasSlackQaiCompletionFooterText(value) {
  const text = String(value || "").replace(/\r\n?/g, "\n").trim().toLowerCase();
  if (!text) return false;
  if (text.includes("how helpful was this answer")) return true;
  if (text.includes("ai generated content. check important info for mistakes")) return true;
  if (text.includes("if you have any more questions, just tag me in this thread")) return true;
  if (text.includes("sources:")) return true;
  return false;
}

function hasSlackQaiSourcesFooterText(value) {
  const text = String(value || "").replace(/\r\n?/g, "\n").trim().toLowerCase();
  if (!text) return false;
  const idx = text.lastIndexOf("\nsources:");
  const start = idx >= 0 ? idx + 1 : (text.startsWith("sources:") ? 0 : -1);
  if (start < 0) return false;
  const tail = text.slice(start);
  if (!tail.includes("sources:")) return false;
  if (!tail.includes("confidence-source")) return false;
  return true;
}

function normalizeSlackQaiTextForDedup(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .toLowerCase();
}

function isSlackQaiAckMessageText(value) {
  const text = normalizeSlackQaiTextForDedup(value);
  if (!text) return false;
  if (text.length > 420) return false;
  const hints = [
    "processing your request",
    "working on your request",
    "just a moment",
    "please wait",
    "i'm thinking",
    "im thinking",
    "thinking..."
  ];
  for (let i = 0; i < hints.length; i += 1) {
    if (text.includes(hints[i])) return true;
  }
  return false;
}

async function slackSendToSingularityViaApi(input) {
  const body = input && typeof input === "object" ? input : {};
  const workspaceOrigin = normalizeSlackWorkspaceOrigin(body.workspaceOrigin || SLACK_WORKSPACE_ORIGIN);
  const apiOrigins = buildSlackQaiApiOrigins(workspaceOrigin);
  const channelId = normalizeSlackChannelId(body.channelId || body.channel_id || body.channel);
  const messageText = decodeSlackEntityText(String(body.messageText || body.text || body.question || "")).trim();
  if (!channelId) {
    return { ok: false, code: "slack_channel_missing", error: "Slack channel ID is required." };
  }
  if (!messageText) {
    return { ok: false, code: "slack_payload_empty", error: "Question text is empty." };
  }
  const mention = normalizeSlackMentionText(body.mention || "");
  const messageMentionMatch = messageText.match(/^<@([UW][A-Z0-9]{8,})>/i);
  let singularityUserId = normalizeSlackUserId(
    body.singularityUserId
    || body.singularity_user_id
    || (messageMentionMatch && messageMentionMatch[1])
    || parseSlackUserIdFromMention(mention)
  );
  let bodyText = messageText;
  if (mention) bodyText = stripSlackMentionPrefix(bodyText, mention);
  if (singularityUserId) bodyText = stripSlackMentionPrefix(bodyText, "<@" + singularityUserId + ">");
  bodyText = String(bodyText || "").trim();
  if (!bodyText) bodyText = messageText;
  const tokens = await resolveSlackApiTokens(body);
  const tokenAttempts = buildSlackQaiTokenAttempts(tokens, body.tokenKind || body.token_kind || "");
  if (!tokenAttempts.length) {
    return { ok: false, code: "slack_user_token_missing", error: "Slack user/session token is missing for Q&AI delivery." };
  }

  let lastFailureCode = "slack_qai_send_failed";
  let lastFailureError = "Unable to post message to Singularity.";
  let lastFailureStatus = 0;
  let lastFailureScope = "";
  let lastFailureTokenKind = "";
  let lastFailureWorkspaceOrigin = "";
  let backedOffCount = 0;

  for (let i = 0; i < tokenAttempts.length; i += 1) {
    const attempt = tokenAttempts[i];
    const attemptToken = normalizeSlackApiToken(attempt && attempt.token);
    if (!attemptToken) continue;
    if (isSlackTokenTemporarilyBackedOff(attemptToken)) {
      backedOffCount += 1;
      lastFailureCode = "slack_token_backoff";
      lastFailureError = "Slack token validation is cooling down after recent failures.";
      continue;
    }
    let tokenInvalidated = false;
    for (let originIdx = 0; originIdx < apiOrigins.length; originIdx += 1) {
      const apiOrigin = apiOrigins[originIdx];
      let effectiveSingularityUserId = singularityUserId;
      if (!effectiveSingularityUserId && mention.startsWith("@")) {
        effectiveSingularityUserId = await resolveSlackUserIdByMentionViaApi(
          apiOrigin,
          attemptToken,
          mention
        ).catch(() => "");
      }
      if (!effectiveSingularityUserId && mention.startsWith("@")) {
        effectiveSingularityUserId = await resolveSlackUserIdFromChannelHistoryViaApi(
          apiOrigin,
          attemptToken,
          channelId,
          mention
        ).catch(() => "");
      }
      if (effectiveSingularityUserId) {
        singularityUserId = effectiveSingularityUserId;
      }
      const mentionPrefix = effectiveSingularityUserId
        ? ("<@" + effectiveSingularityUserId + ">")
        : mention;
      const outboundText = mentionPrefix ? (mentionPrefix + " " + bodyText).trim() : bodyText;
      const post = await postSlackApiWithBearerToken(apiOrigin, "/api/chat.postMessage", {
        channel: channelId,
        text: outboundText,
        mrkdwn: "true",
        parse: effectiveSingularityUserId ? "none" : "full",
        link_names: "1",
        unfurl_links: "false",
        unfurl_media: "false",
        _x_reason: "zip-qai-send-bg"
      }, attemptToken);
      if (post && post.ok) {
        const payload = post.payload && typeof post.payload === "object" ? post.payload : {};
        const messageTs = String(payload.ts || (payload.message && payload.message.ts) || "").trim();
        const postedChannel = String(payload.channel || channelId).trim();
        return {
          ok: true,
          channel: postedChannel,
          ts: messageTs,
          parent_ts: messageTs,
          thread_ts: messageTs,
          message: payload.message || null,
          token_kind: attempt.kind || "",
          workspace_origin: apiOrigin,
          delivery_mode: "qai_api_" + String(attempt.kind || "user")
        };
      }
      const code = String(post && post.code || "slack_qai_send_failed").trim().toLowerCase();
      const error = String(post && post.error || "Unable to post message to Singularity.").trim();
      const status = Number(post && post.status || 0);
      const payload = post && post.payload && typeof post.payload === "object" ? post.payload : {};
      lastFailureCode = code || "slack_qai_send_failed";
      lastFailureError = error || "Unable to post message to Singularity.";
      lastFailureStatus = Number.isFinite(status) ? status : 0;
      lastFailureScope = String(payload.needed || payload.provided || "").trim();
      lastFailureTokenKind = String(attempt.kind || "").trim().toLowerCase();
      lastFailureWorkspaceOrigin = String(apiOrigin || "").trim();
      if (isSlackTokenInvalidationCode(code)) {
        markSlackTokenBackoff(attemptToken);
        await invalidateStoredSlackToken(attemptToken);
        tokenInvalidated = true;
        break;
      }
      if (!isRetryableSlackQaiApiCode(code) && apiOrigin === apiOrigins[apiOrigins.length - 1]) {
        clearSlackTokenBackoff(attemptToken);
      }
    }
    if (tokenInvalidated) {
      continue;
    }
  }

  if (backedOffCount > 0 && backedOffCount >= tokenAttempts.length) {
    return {
      ok: false,
      code: "slack_token_backoff",
      error: "Slack token validation is cooling down after recent failures.",
      diagnostics: {
        phase: "send",
        classification: "slack_auth_config",
        issueSource: "slack_api",
        channelId,
        errorCode: "slack_token_backoff",
        httpStatus: 0,
        scope: "",
        tokenKind: "",
        workspaceOrigin: "",
        recommendedAction: "Wait for backoff to clear, then retry."
      }
    };
  }
  const classifySlackQaiFailure = (code) => {
    if (code === "channel_not_found" || code === "not_in_channel") return "slack_channel_access";
    if (code === "missing_scope" || code === "insufficient_scope" || code === "not_allowed_token_type") return "slack_scope_config";
    if (code === "invalid_auth" || code === "not_authed" || code === "token_revoked" || code === "account_inactive") return "slack_auth_config";
    if (code === "workspace_mismatch") return "slack_workspace_config";
    return "slack_api_error";
  };
  const recommendedAction = (() => {
    if (lastFailureCode === "channel_not_found") return "Verify token workspace/channel access and retry web-session fallback.";
    if (lastFailureCode === "not_in_channel") return "Invite token identity to channel or use channel-visible token.";
    if (lastFailureCode === "missing_scope" || lastFailureCode === "insufficient_scope") return "Use a token with required chat/conversations scopes.";
    return "Retry with a valid workspace-scoped Slack token.";
  })();
  return {
    ok: false,
    code: lastFailureCode,
    error: lastFailureError,
    diagnostics: {
      phase: "send",
      classification: classifySlackQaiFailure(lastFailureCode),
      issueSource: "slack_api",
      channelId,
      errorCode: lastFailureCode,
      httpStatus: lastFailureStatus,
      scope: lastFailureScope,
      tokenKind: lastFailureTokenKind,
      workspaceOrigin: lastFailureWorkspaceOrigin,
      recommendedAction
    }
  };
}

async function slackPollSingularityThreadViaApi(input) {
  const body = input && typeof input === "object" ? input : {};
  const workspaceOrigin = normalizeSlackWorkspaceOrigin(body.workspaceOrigin || SLACK_WORKSPACE_ORIGIN);
  const apiOrigins = buildSlackQaiApiOrigins(workspaceOrigin);
  const channelId = normalizeSlackChannelId(body.channelId || body.channel_id || body.channel);
  const parentTs = String(body.parentTs || body.parent_ts || body.threadTs || body.thread_ts || "").trim();
  if (!channelId || !parentTs) {
    return { ok: false, code: "slack_thread_meta_missing", error: "Slack channel/thread metadata is required." };
  }
  const limitRaw = Number(body.limit);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.trunc(limitRaw), 200) : 40;
  const tokens = await resolveSlackApiTokens(body);
  const tokenAttempts = buildSlackQaiTokenAttempts(tokens, body.tokenKind || body.token_kind || "");
  if (!tokenAttempts.length) {
    return { ok: false, code: "slack_user_token_missing", error: "Slack user/session token is missing for Q&AI polling." };
  }

  let lastFailureCode = "slack_qai_poll_failed";
  let lastFailureError = "Unable to fetch thread replies.";
  let backedOffCount = 0;

  for (let i = 0; i < tokenAttempts.length; i += 1) {
    const attempt = tokenAttempts[i];
    const attemptToken = normalizeSlackApiToken(attempt && attempt.token);
    if (!attemptToken) continue;
    if (isSlackTokenTemporarilyBackedOff(attemptToken)) {
      backedOffCount += 1;
      lastFailureCode = "slack_token_backoff";
      lastFailureError = "Slack token validation is cooling down after recent failures.";
      continue;
    }
    let tokenInvalidated = false;
    let replies = null;
    for (let originIdx = 0; originIdx < apiOrigins.length; originIdx += 1) {
      const apiOrigin = apiOrigins[originIdx];
      replies = await postSlackApiWithBearerToken(apiOrigin, "/api/conversations.replies", {
        channel: channelId,
        ts: parentTs,
        inclusive: "true",
        oldest: parentTs,
        limit,
        _x_reason: "zip-qai-poll-bg"
      }, attemptToken);
      if (replies && replies.ok) break;
      const code = String(replies && replies.code || "slack_qai_poll_failed").trim().toLowerCase();
      const error = String(replies && replies.error || "Unable to fetch thread replies.").trim();
      lastFailureCode = code || "slack_qai_poll_failed";
      lastFailureError = error || "Unable to fetch thread replies.";
      if (isSlackTokenInvalidationCode(code)) {
        markSlackTokenBackoff(attemptToken);
        await invalidateStoredSlackToken(attemptToken);
        tokenInvalidated = true;
        break;
      }
    }
    if (tokenInvalidated) {
      continue;
    }
    if (!replies || !replies.ok) {
      continue;
    }

    const payload = replies.payload && typeof replies.payload === "object" ? replies.payload : {};
    const messages = Array.isArray(payload.messages) ? payload.messages.slice() : [];
    messages.sort((a, b) => slackQaiTsToEpochMs(a && a.ts) - slackQaiTsToEpochMs(b && b.ts));

    const singularityOptions = {
      singularityUserId: body.singularityUserId,
      singularityNamePattern: body.singularityNamePattern
    };
    const postingUserId = normalizeSlackUserId(body.postingUserId || body.posting_user_id || "");
    const explicitSingularityTarget = !!(
      normalizeSlackUserId(singularityOptions.singularityUserId)
      || String(singularityOptions.singularityNamePattern || "").trim()
    );

    const preferredReplies = [];
    const fallbackReplies = [];
    const nonSingularityMessages = [];
    for (let msgIdx = 0; msgIdx < messages.length; msgIdx += 1) {
      const message = messages[msgIdx];
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
      const fromSingularity = isSlackQaiSingularityMessage(message, singularityOptions);
      if (fromSingularity) {
        preferredReplies.push(message);
        continue;
      }
      if (fromPostingUser) continue;
      nonSingularityMessages.push(message);
      if (!explicitSingularityTarget) fallbackReplies.push(message);
    }
    const replyMessages = preferredReplies.length ? preferredReplies : fallbackReplies;

    const latestReply = replyMessages.length ? replyMessages[replyMessages.length - 1] : null;
    const finalMarkerRegex = String(body.finalMarkerRegex || "FINAL_RESPONSE").trim();
    let finalReply = null;
    for (let msgIdx = replyMessages.length - 1; msgIdx >= 0; msgIdx -= 1) {
      const message = replyMessages[msgIdx];
      const messageText = extractSlackQaiMessageText(message);
      if (
        hasSlackQaiFinalMarker(message, finalMarkerRegex)
        || hasSlackQaiCompletionFooterText(messageText)
      ) {
        finalReply = message;
        break;
      }
    }

    const latestReplyTs = String((latestReply && latestReply.ts) || "").trim();
    const latestReplyText = extractSlackQaiMessageText(latestReply);
    const finalReplyTs = String((finalReply && finalReply.ts) || "").trim();
    const finalReplyText = extractSlackQaiMessageText(finalReply);
    const allReplies = replyMessages.map((message) => ({
      ts: String((message && message.ts) || "").trim(),
      text: extractSlackQaiMessageText(message),
      hasFinalMarker: hasSlackQaiFinalMarker(message, finalMarkerRegex),
      hasCompletionFooter: hasSlackQaiCompletionFooterText(extractSlackQaiMessageText(message)),
      isAck: isSlackQaiAckMessageText(extractSlackQaiMessageText(message))
    })).filter((row) => row.ts || row.text);

    const dedupedReplyRows = [];
    const seenReplyNorms = new Set();
    for (let rowIdx = 0; rowIdx < allReplies.length; rowIdx += 1) {
      const row = allReplies[rowIdx];
      const text = String((row && row.text) || "").trim();
      if (!text) continue;
      const norm = normalizeSlackQaiTextForDedup(text);
      if (!norm || seenReplyNorms.has(norm)) continue;
      if (dedupedReplyRows.length) {
        const last = dedupedReplyRows[dedupedReplyRows.length - 1];
        if (
          last
          && typeof last.norm === "string"
          && norm.length > last.norm.length + 40
          && norm.includes(last.norm)
        ) {
          dedupedReplyRows.pop();
          seenReplyNorms.delete(last.norm);
        }
      }
      dedupedReplyRows.push({ text, norm, isAck: !!(row && row.isAck) });
      seenReplyNorms.add(norm);
    }

    let allReplyTexts = dedupedReplyRows.map((row) => row.text);
    if (allReplyTexts.length > 1) {
      const nonAckTexts = dedupedReplyRows
        .filter((row) => !row.isAck)
        .map((row) => row.text);
      if (nonAckTexts.length) allReplyTexts = nonAckTexts;
    }

    const combinedReplyText = allReplyTexts.join("\n\n").trim();
    const hasCompletionFooter = allReplies.some((row) => row && row.hasCompletionFooter);
    const hasSourcesFooter = allReplyTexts.some((text) => hasSlackQaiSourcesFooterText(text));
    const ackOnly = dedupedReplyRows.length === 1 && !!(dedupedReplyRows[0] && dedupedReplyRows[0].isAck);
    const nonSingularityReplies = nonSingularityMessages.map((message) => ({
      ts: String((message && message.ts) || "").trim(),
      text: extractSlackQaiMessageText(message)
    })).filter((row) => row.ts || row.text);
    const latestNonSingularityReply = nonSingularityReplies.length
      ? nonSingularityReplies[nonSingularityReplies.length - 1]
      : null;
    const cachedLatestUpdates = Object.create(null);
    cachedLatestUpdates[parentTs] = parentTs;
    allReplies.forEach((row) => {
      const ts = String(row && row.ts || "").trim();
      if (ts) cachedLatestUpdates[ts] = ts;
    });
    nonSingularityReplies.forEach((row) => {
      const ts = String(row && row.ts || "").trim();
      if (ts) cachedLatestUpdates[ts] = ts;
    });

    return {
      ok: true,
      status: (finalReply || hasCompletionFooter || hasSourcesFooter) ? "final" : "pending",
      channel: channelId,
      parent_ts: parentTs,
      latestReplyTs,
      latestReplyText,
      finalReplyTs,
      finalReplyText,
      hasFinalMarker: !!finalReply || hasCompletionFooter || hasSourcesFooter,
      hasCompletionFooter,
      hasSourcesFooter,
      ackOnly,
      final: !!finalReply || hasCompletionFooter || hasSourcesFooter,
      allReplies,
      allReplyTexts,
      combinedReplyText,
      repliesCount: replyMessages.length,
      singularityRepliesCount: replyMessages.length,
      nonSingularityRepliesCount: nonSingularityReplies.length,
      latestNonSingularityReplyTs: String((latestNonSingularityReply && latestNonSingularityReply.ts) || "").trim(),
      latestNonSingularityReplyText: String((latestNonSingularityReply && latestNonSingularityReply.text) || "").trim(),
      cachedLatestUpdates,
      messageCount: messages.length,
      token_kind: attempt.kind || ""
    };
  }

  if (backedOffCount > 0 && backedOffCount >= tokenAttempts.length) {
    return {
      ok: false,
      code: "slack_token_backoff",
      error: "Slack token validation is cooling down after recent failures."
    };
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
  const requestedDirectChannelId = normalizeSlackDirectChannelId(
    body.directChannelId || body.direct_channel_id
  );
  const botCandidates = Array.isArray(tokens && tokens.botCandidates)
    ? tokens.botCandidates
      .map((token) => normalizeSlackApiToken(token))
      .filter((token) => isSlackBotApiToken(token))
    : [normalizeSlackApiToken(tokens && tokens.botToken)].filter((token) => isSlackBotApiToken(token));
  if (!tokenAttempts.length) {
    return {
      ok: false,
      code: "slack_user_token_missing",
      error: "Slack user/session token is missing for API auth test."
    };
  }

  const openIdSession = await readSlackOpenIdSession();
  const expectedUserId = resolveExpectedSlackAuthorUserId(body, openIdSession);
  let lastFailureCode = "slack_auth_failed";
  let lastFailureError = "Unable to validate Slack API credentials.";
  let backedOffTokenCount = 0;

  for (let i = 0; i < tokenAttempts.length; i += 1) {
    const attemptToken = normalizeSlackApiToken(tokenAttempts[i]);
    if (!attemptToken) continue;
    if (isSlackTokenTemporarilyBackedOff(attemptToken)) {
      backedOffTokenCount += 1;
      lastFailureCode = "slack_token_backoff";
      lastFailureError = "Slack token validation is cooling down after recent failures.";
      continue;
    }
    const auth = await postSlackApiWithBearerToken(workspaceOrigin, "/api/auth.test", {
      _x_reason: "zip-slacktivation-auth-bg"
    }, attemptToken);
    if (!auth.ok) {
      lastFailureCode = auth.code || "slack_auth_failed";
      lastFailureError = auth.error || "Unable to validate Slack API credentials.";
      if (isSlackTokenInvalidationCode(lastFailureCode)) {
        markSlackTokenBackoff(attemptToken);
        await invalidateStoredSlackToken(attemptToken);
      }
      continue;
    }
    clearSlackTokenBackoff(attemptToken);

    const payload = auth.payload && typeof auth.payload === "object" ? auth.payload : {};
    const authUserId = normalizeSlackUserId(payload.user_id || payload.user || "");
    if (expectedUserId && authUserId && authUserId !== expectedUserId) {
      lastFailureCode = "slack_identity_mismatch";
      lastFailureError = "Slack API token does not match the active Slack user.";
      continue;
    }
    if (expectedUserId && !authUserId) {
      lastFailureCode = "slack_identity_mismatch";
      lastFailureError = "Slack API token identity could not be verified for the active Slack user.";
      continue;
    }
    const userId = normalizeSlackUserId(authUserId || body.userId || body.user_id || expectedUserId);
    const teamId = normalizeSlackTeamId(payload.team_id || payload.team);
    const fallbackUserName = normalizeSlackDisplayName(
      body.userName
      || body.user_name
      || (openIdSession && openIdSession.userName)
      || ""
    );
    const fallbackAvatarUrl = normalizeSlackAvatarUrl(
      body.avatarUrl
      || body.avatar_url
      || (openIdSession && openIdSession.avatarUrl)
      || ""
    );
    const fallbackStatusIcon = normalizeSlackStatusIcon(
      body.statusIcon
      || body.status_icon
      || ""
    );
    const fallbackStatusIconUrl = normalizeSlackStatusIconUrl(
      body.statusIconUrl
      || body.status_icon_url
      || ""
    );
    const fallbackStatusMessage = normalizeSlackStatusMessage(
      body.statusMessage
      || body.status_message
      || ""
    );
    let userName = "";
    let avatarUrl = "";
    let statusIcon = "";
    let statusIconUrl = "";
    let statusMessage = "";
    let avatarErrorCode = "";
    let avatarErrorMessage = "";
    if (userId) {
      const identity = await fetchSlackIdentityViaApi(workspaceOrigin, attemptToken, userId);
      userName = normalizeSlackDisplayName(identity.userName || "");
      avatarUrl = normalizeSlackAvatarUrl(identity.avatarUrl || "");
      statusIcon = normalizeSlackStatusIcon(identity.statusIcon || "");
      statusIconUrl = normalizeSlackStatusIconUrl(identity.statusIconUrl || "");
      statusMessage = normalizeSlackStatusMessage(identity.statusMessage || "");
      if (!avatarUrl) {
        avatarErrorCode = String(identity.avatarErrorCode || "").trim().toLowerCase();
        avatarErrorMessage = String(identity.avatarErrorMessage || "").trim();
      }
    }
    if (!userName) {
      userName = fallbackUserName || normalizeSlackDisplayName(payload.user || "");
    }
    if (!avatarUrl) {
      avatarUrl = fallbackAvatarUrl;
    }
    if (!statusIcon) {
      statusIcon = fallbackStatusIcon;
    }
    if (!statusIconUrl) {
      statusIconUrl = fallbackStatusIconUrl;
    }
    if (!statusMessage) {
      statusMessage = fallbackStatusMessage;
    }
    let directChannelId = requestedDirectChannelId;
    let directChannelErrorCode = "";
    if (!directChannelId && userId && botCandidates.length) {
      for (let botIdx = 0; botIdx < botCandidates.length; botIdx += 1) {
        const botToken = normalizeSlackApiToken(botCandidates[botIdx]);
        if (!botToken) continue;
        if (isSlackTokenTemporarilyBackedOff(botToken)) {
          directChannelErrorCode = "slack_bot_token_backoff";
          continue;
        }
        const dmOpen = await postSlackApiWithBearerToken(SLACK_WEB_API_ORIGIN, "/api/conversations.open", {
          users: userId,
          return_im: "true",
          _x_reason: "zip-slacktivation-open-dm-bot-bg"
        }, botToken);
        if (!dmOpen || !dmOpen.ok) {
          directChannelErrorCode = String(dmOpen && dmOpen.code || "slack_open_dm_failed").trim().toLowerCase();
          if (isSlackTokenInvalidationCode(directChannelErrorCode)) {
            markSlackTokenBackoff(botToken);
          }
          continue;
        }
        const dmPayload = dmOpen.payload && typeof dmOpen.payload === "object" ? dmOpen.payload : {};
        const dmChannel = dmPayload.channel && typeof dmPayload.channel === "object" ? dmPayload.channel : {};
        const candidateChannelId = normalizeSlackDirectChannelId(
          dmChannel.id
          || dmPayload.channel_id
          || dmPayload.channel
        );
        if (!candidateChannelId) {
          directChannelErrorCode = "slack_dm_channel_missing";
          continue;
        }
        clearSlackTokenBackoff(botToken);
        directChannelId = candidateChannelId;
        directChannelErrorCode = "";
        break;
      }
    }
    return {
      ok: true,
      ready: true,
      mode: "api",
      user_id: userId,
      team_id: teamId,
      user_name: userName,
      avatar_url: avatarUrl,
      status_icon: statusIcon,
      status_icon_url: statusIconUrl,
      status_message: statusMessage,
      direct_channel_id: directChannelId,
      direct_channel_error_code: directChannelId ? "" : directChannelErrorCode,
      avatar_error_code: avatarErrorCode,
      avatar_error: avatarErrorMessage
    };
  }

  if (backedOffTokenCount > 0 && backedOffTokenCount >= tokenAttempts.length) {
    return {
      ok: false,
      code: "slack_token_backoff",
      error: "Slack token validation is cooling down after recent failures."
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
    id: MENU_ASK_TEAM,
    parentId: MENU_ROOT,
    title: getAskTeamMenuTitle(),
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
    id: MENU_ASK_TEAM,
    title: getAskTeamMenuTitle(),
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

  const activeTabUrl = String(activeTab.url || "");
  const activeTabIsZendesk = isZendeskUrl(activeTabUrl);
  const activeTabAlreadyOnAssignedFilter = isAssignedFilterUrl(activeTabUrl);
  if (activeTabAlreadyOnAssignedFilter) {
    try {
      await chrome.tabs.update(activeTab.id, { active: true });
    } catch (_) {}
    return { ok: true, tabId: activeTab.id, reused: true, navigated: false, url: targetUrl };
  }

  if (activeTabIsZendesk) {
    try {
      await chrome.tabs.update(activeTab.id, { active: true, url: targetUrl });
      return { ok: true, tabId: activeTab.id, reused: true, navigated: true, url: targetUrl };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "Unable to navigate active tab to assigned filter" };
    }
  }

  const existingZendeskTab = await getZendeskTabInCurrentWindow();
  if (existingZendeskTab && existingZendeskTab.id != null) {
    const existingZendeskUrl = String(existingZendeskTab.url || "");
    if (isAssignedFilterUrl(existingZendeskUrl)) {
      return {
        ok: true,
        tabId: existingZendeskTab.id,
        reused: true,
        navigated: false,
        url: targetUrl
      };
    }
    try {
      await chrome.tabs.update(existingZendeskTab.id, { url: targetUrl });
      return {
        ok: true,
        tabId: existingZendeskTab.id,
        reused: true,
        navigated: true,
        url: targetUrl
      };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : "Unable to navigate Zendesk tab to assigned filter" };
    }
  }

  try {
    const createdTab = await chrome.tabs.create({ url: targetUrl, active: false });
    return {
      ok: true,
      tabId: createdTab && createdTab.id != null ? createdTab.id : null,
      reused: false,
      navigated: true,
      url: targetUrl
    };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : "Unable to open assigned filter tab" };
  }
}

async function openAskTeamEmail(tab) {
  const currentVersion = getZipBuildVersion() || "?";
  let latestVersion = "";
  try {
    const updateInfo = await refreshUpdateState({ force: false });
    latestVersion = updateInfo && updateInfo.latestVersion ? String(updateInfo.latestVersion).trim() : "";
  } catch (_) {}
  const localBuild = String(currentVersion || "?").trim() || "?";
  const latestBuild = String(latestVersion || "").trim() || "?";
  const contextUrl = tab && tab.url
    ? String(tab.url).replace(/\s+/g, " ").trim()
    : "";
  const contextLine = contextUrl
    ? ("Context URL: " + contextUrl)
    : "Context URL: (none)";
  const lines = [
    "",
    "",
    "",
    "",
    "I run ZIP " + localBuild + ", Latest ZIP is " + latestBuild,
    contextLine,
    "When a problem comes along, you must ZIP it!"
  ];
  const bodyText = lines.join("\n").replace(/\r\n?/g, "\n").trimEnd();
  const subject = "ZIP! ";
  const encode = (value) => encodeURIComponent(String(value == null ? "" : value));
  const url = OUTLOOK_DEEPLINK_COMPOSE_URL
    + "?to=" + encode(ASK_TEAM_EMAIL)
    + "&subject=" + encode(subject)
    + "&body=" + encode(bodyText);
  try {
    await chrome.tabs.create({ url });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : "Unable to open Outlook Web compose window" };
  }
}

async function openGetLatestFlow() {
  const refreshed = await refreshUpdateState({ force: true }).catch((err) => ({
    currentVersion: getZipBuildVersion(),
    latestVersion: "",
    latestCommitSha: "",
    updateAvailable: false,
    checkedAt: Date.now(),
    checkError: err && err.message ? err.message : "Version check failed"
  }));
  const hasFreshUpdateMetadata = !String(refreshed && refreshed.checkError || "").trim();
  const latestVersion = hasFreshUpdateMetadata ? (refreshed && refreshed.latestVersion || "") : "";
  const latestCommitSha = hasFreshUpdateMetadata ? (refreshed && refreshed.latestCommitSha || "") : "";
  const downloadUrl = buildLatestZipPackageUrl(latestCommitSha);
  const downloadFileName = buildLatestZipPackageFileName(latestVersion, latestCommitSha);
  const result = {
    ok: false,
    downloadUrl,
    downloadFileName,
    latestVersion: latestVersion,
    latestCommitSha: latestCommitSha,
    checkError: String(refreshed && refreshed.checkError || "").trim(),
    downloadId: 0,
    downloadStarted: false,
    downloadTabOpened: false,
    extensionsOpened: false
  };
  try {
    const createdDownloadId = await startLatestPackageDownload({
      url: downloadUrl,
      filename: downloadFileName,
      conflictAction: "uniquify",
      saveAs: false
    });
    result.downloadId = Number(createdDownloadId || 0);
    result.downloadStarted = true;
  } catch (_) {
    try {
      await chrome.tabs.create({ url: downloadUrl });
      result.downloadTabOpened = true;
    } catch (_) {}
  }
  try {
    await chrome.tabs.create({ url: CHROME_EXTENSIONS_URL });
    result.extensionsOpened = true;
  } catch (_) {}
  result.ok = result.downloadStarted || result.downloadTabOpened || result.extensionsOpened;
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
  await clearLegacyZipKeyBannersFromZendeskTabs().catch(() => {});
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

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (!tab?.url) return;
  if (maybeRouteZipWorkspaceDeeplinkTab(tabId, tab.url)) return;
  setOptionsForTab(tabId, tab.url).catch(() => {});
  if (info && info.status === "complete" && isZendeskUrl(tab.url)) {
    clearLegacyZipKeyBannerFromZendeskTab(tabId).catch(() => {});
  }
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
  if (info.menuItemId === MENU_ASK_TEAM) {
    openAskTeamEmail(tab).catch(() => {});
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
  if (msg.type === "ZIP_TICKET_ENRICHMENT_METRICS") {
    latestTicketEnrichmentMetrics = msg && msg.payload && typeof msg.payload === "object"
      ? { ...msg.payload }
      : null;
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "ZIP_GET_TICKET_ENRICHMENT_METRICS") {
    sendResponse({
      ok: true,
      payload: latestTicketEnrichmentMetrics
    });
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
        missing: ZIP_REQUIRED_SECRET_KEYS.slice(),
        passTransition: buildPassTransitionSnapshot({})
      }));
    return true;
  }
  if (msg.type === "ZIP_GET_PASS_TRANSITION_MEMBERS") {
    getPassTransitionMembers({
      force: msg.force === true,
      allowCreateTab: msg.allowCreateTab === true
    })
      .then((result) => sendResponse(result || {
        ok: false,
        code: "pass_transition_unavailable",
        error: "PASS-TRANSITION member hydration did not return a result."
      }))
      .catch((err) => sendResponse({
        ok: false,
        code: "pass_transition_hydration_failed",
        error: err && err.message ? err.message : "Unable to hydrate PASS-TRANSITION members."
      }));
    return true;
  }
  if (
    msg.type === "ZIP_SYNC_PASS_TRANSITION_MEMBERS"
    || msg.type === "ZIP_REHYDRATE_PASS_TRANSITION_MEMBERS"
  ) {
    hydratePassTransitionRecipients({
      allowCreateTab: msg.allowCreateTab === true
    })
      .then((result) => sendResponse(result || {
        ok: false,
        code: "pass_transition_unavailable",
        error: "PASS-TRANSITION member hydration did not return a result."
      }))
      .catch((err) => sendResponse({
        ok: false,
        code: "pass_transition_hydration_failed",
        error: err && err.message ? err.message : "Unable to hydrate PASS-TRANSITION members."
      }));
    return true;
  }
  if (msg.type === "ZIP_GET_PASS_TRANSITION_RECIPIENTS") {
    getPassTransitionRecipients()
      .then((result) => sendResponse(result || {
        ok: false,
        code: "pass_transition_recipients_unavailable",
        error: "PASS-TRANSITION recipients did not return a result."
      }))
      .catch((err) => sendResponse({
        ok: false,
        code: "pass_transition_recipients_failed",
        error: err && err.message ? err.message : "Unable to load PASS-TRANSITION recipients."
      }));
    return true;
  }
  if (msg.type === "ZIP_GET_PASS_TRANSITION_CONFIG") {
    readStorageLocal([
      ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY,
      ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY,
      ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY,
      ZIP_PASS_TRANSITION_RECIPIENTS_STORAGE_KEY,
      ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY
    ])
      .then((stored) => sendResponse({
        ok: true,
        ...buildPassTransitionSnapshot(stored)
      }))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "Unable to read PASS-TRANSITION configuration."
      }));
    return true;
  }
  if (msg.type === "ZIP_IMPORT_KEY_PAYLOAD") {
    (async () => {
      const status = await storeZipSecrets(msg && msg.config && typeof msg.config === "object" ? msg.config : {});
      const passTransition = status && status.passTransition ? status.passTransition : null;
      if (!passTransition || !passTransition.channelId) {
        return status;
      }
      const hydrationResult = await hydratePassTransitionRecipients({ allowCreateTab: false }).catch((err) => ({
        ok: false,
        code: "pass_transition_hydration_failed",
        error: err && err.message ? err.message : "Unable to hydrate PASS-TRANSITION members."
      }));
      if (!hydrationResult || hydrationResult.ok !== true) {
        return {
          ...status,
          passTransition: {
            ...passTransition,
            rosterError: String(hydrationResult && hydrationResult.error || "").trim(),
            rosterErrorCode: String(hydrationResult && hydrationResult.code || "").trim().toLowerCase()
          }
        };
      }
      return {
        ...status,
        passTransition: {
          ...passTransition,
          memberIds: Array.isArray(hydrationResult.memberIds) ? hydrationResult.memberIds.slice() : [],
          memberCount: Math.max(0, Number(hydrationResult.memberCount || 0)),
          recipients: Array.isArray(hydrationResult.members) ? hydrationResult.members.slice() : [],
          recipientCount: Math.max(0, Number(hydrationResult.members && hydrationResult.members.length || 0)),
          membersSyncedAt: String(hydrationResult.membersSyncedAt || "").trim(),
          synced: hydrationResult.synced === true
        }
      };
    })()
      .then((status) => sendResponse(status))
      .catch((err) => sendResponse({
        ok: false,
        loaded: false,
        error: err && err.message ? err.message : "Unable to import ZIP.KEY payload."
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
  if (msg.type === "ZIP_SLACK_API_SEND_TO_USER") {
    slackSendMarkdownToUserViaApi(msg)
      .then((result) => sendResponse(result || { ok: false, error: "Slack API targeted send did not return a result." }))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "Slack API targeted send failed."
      }));
    return true;
  }
  if (msg.type === "ZIP_SLACK_API_QAI_SEND") {
    slackSendToSingularityViaApi(msg)
      .then((result) => sendResponse(result || { ok: false, error: "Slack Q&AI send did not return a result." }))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "Slack Q&AI send failed."
      }));
    return true;
  }
  if (msg.type === "ZIP_SLACK_API_QAI_POLL") {
    slackPollSingularityThreadViaApi(msg)
      .then((result) => sendResponse(result || { ok: false, error: "Slack Q&AI poll did not return a result." }))
      .catch((err) => sendResponse({
        ok: false,
        error: err && err.message ? err.message : "Slack Q&AI poll failed."
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
      if (action === "askTeam" || action === "askEric") {
        const tab = await getActiveTab();
        return openAskTeamEmail(tab);
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
