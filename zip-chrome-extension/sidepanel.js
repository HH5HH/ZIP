(function () {
  "use strict";

  const BASE = "https://adobeprimetime.zendesk.com";
  const ZENDESK_DASHBOARD_URL = BASE + "/agent/dashboard?brand_id=2379046";
  const ZENDESK_LOGIN_WITH_RETURN_URL = BASE
    + "/access/login?return_to="
    + encodeURIComponent(ZENDESK_DASHBOARD_URL);
  const ASSIGNED_FILTER_PATH = "/agent/filters/36464467";
  const ASSIGNED_FILTER_URL = BASE + ASSIGNED_FILTER_PATH;
  const ZENDESK_TAB_QUERY = BASE.replace(/^https?:\/\//, "*://") + "/*";
  const SLACK_TAB_QUERY = "*://*.slack.com/*";
  const TICKET_URL_PREFIX = BASE + "/agent/tickets/";
  const SHOW_TICKET_API_PATH = "/api/v2/tickets/{ticket_id}";
  const PASS_AI_SLACK_WORKSPACE_ORIGIN = "https://adobedx.slack.com";
  const PASS_AI_SLACK_API_ENDPOINT = PASS_AI_SLACK_WORKSPACE_ORIGIN + "/api";
  const PASS_AI_SLACK_APP_ID = "A0AGPACM3UG";
  const ZIP_OFFICIAL_EXTENSION_ID = "ibijkkpjfgaocgmpafbcckhhdkpbldoc";
  const ZIP_OFFICIAL_SLACK_REDIRECT_URI = "https://ibijkkpjfgaocgmpafbcckhhdkpbldoc.chromiumapp.org/slack-openid";
  const PASS_AI_SLACK_SINGULARITY_USER_ID = "U05PQCUFN0H";
  // Legacy cleanup key only. Team pinning is no longer part of ZIP.KEY validation.
  const PASS_AI_SLACK_TEAM_STORAGE_KEY = "zip.passAi.expectedSlackTeamId";
  const PASS_AI_SLACK_OIDC_CLIENT_ID_STORAGE_KEY = "zip.passAi.slackOidc.clientId";
  const PASS_AI_SLACK_OIDC_CLIENT_SECRET_STORAGE_KEY = "zip.passAi.slackOidc.clientSecret";
  const PASS_AI_SLACK_OIDC_SCOPE_STORAGE_KEY = "zip.passAi.slackOidc.scope";
  const PASS_AI_SLACK_OIDC_REDIRECT_PATH_STORAGE_KEY = "zip.passAi.slackOidc.redirectPath";
  const PASS_AI_SLACK_OIDC_REDIRECT_URI_STORAGE_KEY = "zip.passAi.slackOidc.redirectUri";
  const PASS_AI_SLACK_API_BOT_TOKEN_STORAGE_KEY = "zip.passAi.slackApi.botToken";
  const PASS_AI_SLACK_API_USER_TOKEN_STORAGE_KEY = "zip.passAi.slackApi.userToken";
  const PASS_AI_SLACK_OIDC_DEFAULT_SCOPE = "openid profile email";
  const PASS_AI_SLACK_OIDC_DEFAULT_REDIRECT_PATH = "slack-user";
  const ZIP_KEY_FILE_PREFIX = "ZIPKEY1:";
  const ZIP_CONFIG_META_STORAGE_KEY = "zip.config.meta.v1";
  const ZIP_SLACKTIVATION_SERVICE_KEY = "slacktivation";
  const ZIP_REQUIRED_CONFIG_FIELDS = Object.freeze([
    "slacktivation.client_id",
    "slacktivation.client_secret",
    "slacktivation.user_token"
  ]);
  const PASS_AI_SLACK_CHANNEL_STORAGE_KEY = "zip.passAi.singularityChannelId";
  const PASS_AI_SLACK_CHANNEL_DEFAULT = "C08SX9ZR891";
  const PASS_AI_SINGULARITY_MENTION_STORAGE_KEY = "zip.passAi.singularityMention";
  const PASS_AI_SINGULARITY_MENTION_DEFAULT = "@Singularity";
  const ZIP_SLACK_CLIENT_ID_STORAGE_KEY = "zip_slack_client_id";
  const ZIP_SLACK_CLIENT_SECRET_STORAGE_KEY = "zip_slack_client_secret";
  const ZIP_SLACK_SCOPE_STORAGE_KEY = "zip_slack_scope";
  const ZIP_SLACK_REDIRECT_PATH_STORAGE_KEY = "zip_slack_redirect_path";
  const ZIP_SLACK_REDIRECT_URI_STORAGE_KEY = "zip_slack_redirect_uri";
  const ZIP_SLACK_BOT_TOKEN_STORAGE_KEY = "zip_slack_bot_token";
  const ZIP_SLACK_USER_TOKEN_STORAGE_KEY = "zip_slack_user_token";
  const ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY = "zip_slack_oauth_token";
  const ZIP_SLACK_KEY_LOADED_STORAGE_KEY = "zip_slack_key_loaded";
  const ZIP_SLACK_KEY_META_STORAGE_KEY = "zip_slack_key_meta";
  const ZIP_SLACK_SESSION_CACHE_STORAGE_KEY = "zip_slack_session_cache_v1";
  const ZIP_SINGULARITY_CHANNEL_ID_STORAGE_KEY = "zip_singularity_channel_id";
  const ZIP_SINGULARITY_MENTION_STORAGE_KEY = "zip_singularity_mention";
  const SLACKTIVATED_SESSION_CACHE_VERSION = 1;
  const ZIP_LOCALSTORAGE_MIGRATION_SOURCE_KEYS = Object.freeze([
    PASS_AI_SLACK_OIDC_CLIENT_ID_STORAGE_KEY,
    PASS_AI_SLACK_OIDC_CLIENT_SECRET_STORAGE_KEY,
    PASS_AI_SLACK_OIDC_SCOPE_STORAGE_KEY,
    PASS_AI_SLACK_OIDC_REDIRECT_PATH_STORAGE_KEY,
    PASS_AI_SLACK_OIDC_REDIRECT_URI_STORAGE_KEY,
    PASS_AI_SLACK_TEAM_STORAGE_KEY,
    PASS_AI_SLACK_API_BOT_TOKEN_STORAGE_KEY,
    PASS_AI_SLACK_API_USER_TOKEN_STORAGE_KEY,
    "zip.passAi.slackBotToken",
    "zip.passAi.slackUserToken",
    PASS_AI_SLACK_CHANNEL_STORAGE_KEY,
    PASS_AI_SINGULARITY_MENTION_STORAGE_KEY,
    "slack_client_id",
    "slack_client_secret",
    "slack_token"
  ]);
  const PASS_AI_SINGULARITY_NAME_PATTERN = "singularity";
  const SLACKTIVATED_PENDING_ICON_URL = "icons/icon128.png";
  const SLACKTIVATED_LOGIN_TOOLTIP = "ZIP is not SLACKTIVATED - Click to login into https://adobedx.slack.com/";
  const PASS_AI_POLL_INTERVAL_MS = 1500;
  const PASS_AI_POLL_MAX_ATTEMPTS = 48;
  const PASS_AI_INACTIVITY_FINAL_MS = 6000;
  const PASS_AI_MIN_SINGULARITY_REPLIES = 2;
  const PASS_AI_SLACK_AUTH_POLL_INTERVAL_MS = 2500;
  const PASS_AI_SLACK_AUTH_POLL_MAX_ATTEMPTS = 36;
  const SLACK_IT_TO_ME_MAX_ROWS = 120;
  const SLACK_IT_TO_ME_MAX_MESSAGE_CHARS = 36000;
  const IS_WORKSPACE_MODE = new URLSearchParams(window.location.search || "").get("mode") === "workspace";
  const DEFAULT_FOOTER_HINT = "Tip: Click your avatar for ZIP menu actions";
  const FOOTER_HINT_TOOLTIP = "Click your avatar to open the ZIP context menu.";

  const TICKET_COLUMNS = [
    { key: "id", label: "Ticket", type: "number" },
    { key: "subject", label: "Subject", type: "string" },
    { key: "status", label: "Status", type: "string" },
    { key: "priority", label: "Priority", type: "string" },
    { key: "created_at", label: "Created", type: "date" },
    { key: "updated_at", label: "Updated", type: "date" },
    { key: "__ticket_email_actions", label: "", type: "utility", sortable: false }
  ];

  const state = {
    user: null,
    /** Parsed from GET /api/v2/users/me for API runner defaults (id, default_group_id, organization_id, etc.) */
    userProfile: null,
    mePayload: null,
    tickets: [],
    filteredTickets: [],
    sortKey: "updated_at",
    sortDir: "desc",
    textFilter: "",
    statusFilter: "all",
    busy: false,
    lastApiPath: "/api/v2/users/me",
    lastApiPayload: null,
    lastApiPayloadString: "",
    lastApiRequest: null,
    organizations: [],
    orgCountsById: Object.create(null),
    orgCountLoadSeq: 0,
    orgLabelPadLength: 0,
    views: [],
    viewCountsById: Object.create(null),
    viewCountLoadSeq: 0,
    viewLabelPadLength: 0,
    orgSelectLoading: false,
    groupSelectLoading: false,
    groupLoadSeq: 0,
    viewSelectLoading: false,
    ticketSource: "assigned",
    selectedOrgId: "",
    selectedViewId: "",
    selectedByGroupValue: "",
    selectedTicketId: null,
    groupsWithMembers: [],
    groupOptions: [],
    groupCountsByValue: Object.create(null),
    groupLabelPadLength: 0,
    ticketTableLoading: false,
    showZdApiContainers: false,
    sidePanelLayout: "unknown",
    zendeskTabId: null,
    slackTabId: null,
    passAiLoading: false,
    passAiConversationInFlight: false,
    passAiTicketId: null,
    passAiActiveClientId: "",
    passAiSlackReady: false,
    passAiSlackAuthPolling: false,
    passAiSlackUserId: "",
    passAiSlackUserName: "",
    passAiSlackAvatarUrl: "",
    passAiSlackWebReady: false,
    passAiSlackAuthError: "",
    passAiLastThreadContext: null,
    passAiDeleteInFlight: false,
    passAiPanelVisible: false,
    slackItToMeLoading: false,
    zipConfigReady: false,
    zipConfigReason: "",
    zipConfigMissingFields: [],
    zipSecretConfigLoaded: false,
    zipSecretConfig: {
      keyLoaded: false,
      clientId: "",
      clientSecret: "",
      scope: PASS_AI_SLACK_OIDC_DEFAULT_SCOPE,
      redirectPath: PASS_AI_SLACK_OIDC_DEFAULT_REDIRECT_PATH,
      redirectUri: "",
      userToken: "",
      oauthToken: "",
      singularityChannelId: PASS_AI_SLACK_CHANNEL_DEFAULT,
      singularityMention: PASS_AI_SINGULARITY_MENTION_DEFAULT,
      meta: null
    },
    ticketEmailCopyBusyById: Object.create(null),
    ticketEmailUserEmailCacheById: Object.create(null),
    ticketEmailRequesterByTicketId: Object.create(null),
    ticketEmailCopyCacheByTicketId: Object.create(null),
    themeId: "s2-dark-azure-blue",
    themeOptions: [],
    themeFlyoutStop: ""
  };

  let authCheckTimerId = null;
  let authCheckInFlight = false;
  let authCheckPollingEnabled = false;
  let authCheckLastRanAt = 0;
  let passAiSlackAuthPollTimerId = null;
  let passAiSlackAuthPollAttempt = 0;
  let toastHideTimerId = null;
  let authHydrationInFlight = false;
  let authRefreshInFlight = false;
  let slackAuthCheckInFlight = false;
  let slackAuthCheckLastAt = 0;
  let slackIdentityEnrichmentLastAt = 0;
  let slackSessionCacheHydrated = false;
  let slackOpenIdSilentProbeLastAt = 0;
  let slackBootstrapInFlight = false;
  let slackBootstrapLastAt = 0;
  let eventsWired = false;
  const AUTH_CHECK_INTERVAL_ACTIVE_MS = 60 * 1000;
  const AUTH_CHECK_INTERVAL_LOGGED_OUT_MS = 15 * 1000;
  const AUTH_CHECK_INTERVAL_HIDDEN_MS = 120 * 1000;
  const AUTH_CHECK_FORCE_GAP_MS = 1500;
  const SLACK_AUTH_AUTO_REFRESH_MIN_GAP_MS = 8000;
  const SLACK_IDENTITY_ENRICH_MIN_GAP_MS = 30 * 1000;
  const SLACK_OPENID_SILENT_PROBE_MIN_GAP_MS = 60 * 1000;
  const VIEW_COUNT_CACHE_KEY = "zip.filter.viewCounts.v1";
  const ORG_COUNT_CACHE_KEY = "zip.filter.orgCounts.v1";
  const GROUP_COUNT_CACHE_KEY = "zip.filter.groupCounts.v1";
  const ZENDESK_TAB_RETRY_MAX_ATTEMPTS = 6;
  const ZENDESK_TAB_RETRY_BASE_DELAY_MS = 150;
  const SLACK_TAB_RETRY_MAX_ATTEMPTS = 6;
  const SLACK_TAB_RETRY_BASE_DELAY_MS = 150;
  const SLACK_BOOTSTRAP_MIN_GAP_MS = 25 * 1000;
  const FILTER_CATALOG_RETRY_ATTEMPTS = 3;
  const FILTER_CATALOG_RETRY_BASE_DELAY_MS = 500;
  const TICKET_EMAIL_COPY_CACHE_TTL_MS = 5 * 60 * 1000;
  const STATUS_FILTER_ALL_VALUE = "all";
  const STATUS_FILTER_ALL_LABEL = "all";
  const PREFERRED_STATUS_ORDER = ["new", "open", "pending", "hold", "solved", "closed"];
  const ZD_API_VISIBILITY_STORAGE_KEY = "zip.ui.showZdApiContainers.v1";
  const CONTEXT_MENU_ZD_API_SHOW_LABEL = "Show ZD API";
  const CONTEXT_MENU_ZD_API_HIDE_LABEL = "Hide ZD API";
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
    : [{ id: "azure-blue", name: "Azure Blue", hex: "#0078D4", spectrumToken: "spectrum-blue-600", recommendedForeground: "#ffffff", notes: "" }];
  const THEME_ACCENT_FAMILIES = THEME_ACCENT_SWATCHES.map((accent) => ({
    id: String(accent.id || "").trim().toLowerCase(),
    label: String(accent.name || accent.label || accent.id || "Color").trim() || "Color"
  }));
  const THEME_ACCENT_FAMILY_BY_ID = Object.fromEntries(THEME_ACCENT_SWATCHES.map((accent) => [
    String(accent.id || "").trim().toLowerCase(),
    { ...accent, id: String(accent.id || "").trim().toLowerCase() }
  ]));
  const THEME_ACCENT_IDS = new Set(THEME_ACCENT_FAMILIES.map((accent) => accent.id));
  const THEME_ACCENT_GROUPS = normalizeThemeAccentGroups(
    THEME_PALETTE_DATA && Array.isArray(THEME_PALETTE_DATA.groups) ? THEME_PALETTE_DATA.groups : [],
    THEME_ACCENT_SWATCHES
  );
  const LEGACY_ACCENT_ID_MAP = (
    THEME_PALETTE_DATA
    && THEME_PALETTE_DATA.legacyAccentMap
    && typeof THEME_PALETTE_DATA.legacyAccentMap === "object"
  )
    ? { ...THEME_PALETTE_DATA.legacyAccentMap }
    : {};
  const DEFAULT_THEME_ACCENT_ID = (
    THEME_PALETTE_DATA
    && THEME_ACCENT_IDS.has(String(THEME_PALETTE_DATA.defaultAccentId || "").trim().toLowerCase())
  )
    ? String(THEME_PALETTE_DATA.defaultAccentId).trim().toLowerCase()
    : (THEME_ACCENT_FAMILIES[0] ? THEME_ACCENT_FAMILIES[0].id : "azure-blue");
  const DEFAULT_THEME_ID = "s2-dark-" + DEFAULT_THEME_ACCENT_ID;

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

  const FALLBACK_THEME_OPTIONS = buildThemeOptions();
  const FALLBACK_THEME_OPTION_BY_ID = Object.fromEntries(FALLBACK_THEME_OPTIONS.map((option) => [option.id, option]));
  const SPECTRUM_COLORSTOP_CLASS_BY_NAME = {
    light: "spectrum--light",
    dark: "spectrum--dark"
  };
  const THEME_TONE_BY_COLOR_STOP = {
    dark: { primary: "800", hover: "700", down: "600", link: "900", focus: "800" },
    light: { primary: "900", hover: "1000", down: "1000", link: "900", focus: "800" }
  };
  function normalizeHexColor(hexValue) {
    const raw = String(hexValue || "").trim();
    const normalized = raw.startsWith("#") ? raw.slice(1) : raw;
    if (/^[0-9a-f]{6}$/i.test(normalized)) return normalized.toLowerCase();
    return "0078d4";
  }

  function hexToRgbArray(hexValue) {
    const hex = normalizeHexColor(hexValue);
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16)
    ];
  }

  function clampRgbChannel(value) {
    return Math.max(0, Math.min(255, Math.round(Number(value) || 0)));
  }

  function mixRgbTriplets(baseTriplet, targetTriplet, ratioToTarget) {
    const ratio = Math.max(0, Math.min(1, Number(ratioToTarget) || 0));
    return [
      clampRgbChannel((baseTriplet[0] * (1 - ratio)) + (targetTriplet[0] * ratio)),
      clampRgbChannel((baseTriplet[1] * (1 - ratio)) + (targetTriplet[1] * ratio)),
      clampRgbChannel((baseTriplet[2] * (1 - ratio)) + (targetTriplet[2] * ratio))
    ];
  }

  function rgbTripletToString(triplet) {
    return [
      clampRgbChannel(triplet[0]),
      clampRgbChannel(triplet[1]),
      clampRgbChannel(triplet[2])
    ].join(", ");
  }

  function clampNumber(value, minValue, maxValue) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return minValue;
    return Math.max(minValue, Math.min(maxValue, numeric));
  }

  function rgbTripletToHsl(triplet) {
    const r = clampRgbChannel(triplet[0]) / 255;
    const g = clampRgbChannel(triplet[1]) / 255;
    const b = clampRgbChannel(triplet[2]) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let hue = 0;
    if (delta > 0) {
      if (max === r) hue = ((g - b) / delta) % 6;
      else if (max === g) hue = ((b - r) / delta) + 2;
      else hue = ((r - g) / delta) + 4;
      hue *= 60;
      if (hue < 0) hue += 360;
    }
    const lightness = (max + min) / 2;
    const saturation = delta === 0
      ? 0
      : (delta / (1 - Math.abs((2 * lightness) - 1)));
    return [hue, saturation, lightness];
  }

  function degreesToRadians(value) {
    return (Math.PI * Number(value || 0)) / 180;
  }

  function formatCssNumber(value, digits) {
    return clampNumber(value, -999, 999).toFixed(digits).replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
  }

  function formatCssPercent(value) {
    return formatCssNumber(clampNumber(value, 0, 100), 2) + "%";
  }

  function formatCssAlpha(value) {
    return formatCssNumber(clampNumber(value, 0, 1), 3);
  }

  function buildTonePalette(baseRgb, paletteSet) {
    const white = [255, 255, 255];
    const black = [0, 0, 0];
    if (paletteSet === "light") {
      return {
        "500": rgbTripletToString(mixRgbTriplets(baseRgb, white, 0.34)),
        "600": rgbTripletToString(mixRgbTriplets(baseRgb, white, 0.22)),
        "700": rgbTripletToString(mixRgbTriplets(baseRgb, white, 0.11)),
        "800": rgbTripletToString(baseRgb),
        "900": rgbTripletToString(mixRgbTriplets(baseRgb, black, 0.1)),
        "1000": rgbTripletToString(mixRgbTriplets(baseRgb, black, 0.22)),
        "1100": rgbTripletToString(mixRgbTriplets(baseRgb, black, 0.32))
      };
    }
    return {
      "500": rgbTripletToString(mixRgbTriplets(baseRgb, black, 0.34)),
      "600": rgbTripletToString(mixRgbTriplets(baseRgb, black, 0.22)),
      "700": rgbTripletToString(mixRgbTriplets(baseRgb, black, 0.11)),
      "800": rgbTripletToString(baseRgb),
      "900": rgbTripletToString(mixRgbTriplets(baseRgb, white, 0.12)),
      "1000": rgbTripletToString(mixRgbTriplets(baseRgb, white, 0.24)),
      "1100": rgbTripletToString(mixRgbTriplets(baseRgb, white, 0.36))
    };
  }

  function buildAccentPaletteRgb(swatches) {
    const map = Object.create(null);
    (Array.isArray(swatches) ? swatches : []).forEach((accent) => {
      const accentId = String(accent && accent.id ? accent.id : "").trim().toLowerCase();
      if (!accentId) return;
      const baseRgb = hexToRgbArray(accent.hex);
      map[accentId] = {
        light: buildTonePalette(baseRgb, "light"),
        dark: buildTonePalette(baseRgb, "dark")
      };
    });
    return map;
  }

  function normalizeThemeAccentGroups(rawGroups, swatches) {
    const accentIds = (Array.isArray(swatches) ? swatches : [])
      .map((swatch) => String(swatch && swatch.id ? swatch.id : "").trim().toLowerCase())
      .filter(Boolean);
    const known = new Set(accentIds);
    const seen = new Set();
    const groups = [];
    (Array.isArray(rawGroups) ? rawGroups : []).forEach((group) => {
      const ids = (Array.isArray(group && group.colorIds) ? group.colorIds : [])
        .map((value) => String(value || "").trim().toLowerCase())
        .filter((id) => known.has(id) && !seen.has(id));
      if (!ids.length) return;
      ids.forEach((id) => seen.add(id));
      groups.push({
        id: String(group && group.id ? group.id : ("group-" + String(groups.length + 1))).trim().toLowerCase(),
        name: String(group && group.name ? group.name : "Colors").trim() || "Colors",
        colorIds: ids
      });
    });
    const remaining = accentIds.filter((id) => !seen.has(id));
    if (remaining.length) {
      groups.push({
        id: "additional-colors",
        name: "Additional Colors",
        colorIds: remaining
      });
    }
    if (groups.length) return groups;
    return [{ id: "all-colors", name: "Colors", colorIds: accentIds }];
  }

  const ACCENT_PALETTE_RGB = buildAccentPaletteRgb(THEME_ACCENT_SWATCHES);
  const ALL_SPECTRUM_COLORSTOP_CLASSES = ["spectrum--light", "spectrum--dark"];

  function isAuthFailureStatus(status) {
    return status === 401 || status === 403;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForZendeskSessionReady(timeoutMs) {
    const timeout = Math.max(0, Number(timeoutMs) || 0);
    const deadline = Date.now() + timeout;
    let lastError = null;
    while (Date.now() <= deadline) {
      try {
        const me = await sendToZendeskTab({ action: "getMe" });
        if (hasZendeskSessionUser(me)) return;
        if (shouldTreatMeResponseAsLoggedOut(me)) {
          throw new Error("Session expired");
        }
      } catch (err) {
        lastError = err || null;
      }
      await wait(250);
    }
    if (lastError) throw lastError;
    throw new Error("Zendesk tab not ready");
  }

  function isTransientZendeskTabErrorMessage(message) {
    const text = String(message || "").toLowerCase();
    if (!text) return false;
    return text.includes("receiving end does not exist")
      || text.includes("could not establish connection")
      || text.includes("message port closed before a response was received")
      || text.includes("no active tab")
      || text.includes("no response");
  }

  function normalizeStatusValue(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getAvailableStatusValuesFromTickets(tickets) {
    const values = new Set();
    (Array.isArray(tickets) ? tickets : []).forEach((row) => {
      const normalized = normalizeStatusValue(row && row.status);
      if (!normalized) return;
      values.add(normalized);
    });
    const preferred = PREFERRED_STATUS_ORDER.filter((status) => values.has(status));
    const extras = Array.from(values)
      .filter((status) => !PREFERRED_STATUS_ORDER.includes(status))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return preferred.concat(extras);
  }

  function resizeStatusFilterToContent() {
    if (!els.statusFilter || typeof window === "undefined" || typeof document === "undefined") return;
    const selectEl = els.statusFilter;
    const labels = Array.from(selectEl.options || [])
      .map((option) => String(option.textContent || "").trim())
      .filter(Boolean);
    if (!labels.length) {
      selectEl.style.removeProperty("--zip-status-filter-inline-size");
      return;
    }

    let probe = null;
    try {
      const computed = window.getComputedStyle(selectEl);
      probe = document.createElement("span");
      probe.style.position = "fixed";
      probe.style.left = "-9999px";
      probe.style.top = "0";
      probe.style.visibility = "hidden";
      probe.style.pointerEvents = "none";
      probe.style.whiteSpace = "pre";
      probe.style.font = computed.font;
      probe.style.fontFamily = computed.fontFamily;
      probe.style.fontSize = computed.fontSize;
      probe.style.fontWeight = computed.fontWeight;
      probe.style.fontVariant = computed.fontVariant;
      probe.style.letterSpacing = computed.letterSpacing;
      probe.style.textTransform = computed.textTransform;
      document.body.appendChild(probe);

      let widestLabelPx = 0;
      labels.forEach((label) => {
        probe.textContent = label;
        const width = probe.getBoundingClientRect().width;
        if (Number.isFinite(width) && width > widestLabelPx) widestLabelPx = width;
      });

      const paddingLeftPx = Number.parseFloat(computed.paddingLeft) || 0;
      const paddingRightPx = Number.parseFloat(computed.paddingRight) || 0;
      const chromeUiAllowancePx = 10;
      const safetyPx = 2;
      const minPx = 56;
      const viewportMaxPx = Math.max(minPx, Math.floor((window.innerWidth || 320) * 0.5));
      const maxPx = Math.min(320, viewportMaxPx);
      const targetPx = Math.max(
        minPx,
        Math.min(
          maxPx,
          Math.ceil(widestLabelPx + paddingLeftPx + paddingRightPx + chromeUiAllowancePx + safetyPx)
        )
      );

      selectEl.style.setProperty("--zip-status-filter-inline-size", targetPx + "px");
    } catch (_) {
      selectEl.style.removeProperty("--zip-status-filter-inline-size");
    } finally {
      if (probe && probe.parentNode) probe.parentNode.removeChild(probe);
    }
  }

  function syncStatusFilterOptions() {
    if (!els.statusFilter) return;
    const availableStatuses = getAvailableStatusValuesFromTickets(state.tickets);
    const desired = [{ value: STATUS_FILTER_ALL_VALUE, label: STATUS_FILTER_ALL_LABEL }]
      .concat(availableStatuses.map((status) => ({ value: status, label: status })));

    const existing = Array.from(els.statusFilter.options || []).map((opt) => ({
      value: normalizeStatusValue(opt.value),
      label: String(opt.textContent || "")
    }));
    const optionsAreSame = existing.length === desired.length
      && existing.every((opt, idx) => opt.value === desired[idx].value && opt.label === desired[idx].label);

    if (!optionsAreSame) {
      els.statusFilter.innerHTML = "";
      desired.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.label;
        els.statusFilter.appendChild(option);
      });
    }

    const current = normalizeStatusValue(state.statusFilter) || STATUS_FILTER_ALL_VALUE;
    const valid = desired.some((opt) => opt.value === current);
    const next = valid ? current : STATUS_FILTER_ALL_VALUE;
    state.statusFilter = next;
    els.statusFilter.value = next;
    resizeStatusFilterToContent();
  }

  function stopAuthCheckPolling() {
    authCheckPollingEnabled = false;
    if (authCheckTimerId != null) {
      clearTimeout(authCheckTimerId);
      authCheckTimerId = null;
    }
  }

  function getAuthCheckIntervalMs() {
    if (typeof document !== "undefined" && document.hidden) {
      return AUTH_CHECK_INTERVAL_HIDDEN_MS;
    }
    return state.user ? AUTH_CHECK_INTERVAL_ACTIVE_MS : AUTH_CHECK_INTERVAL_LOGGED_OUT_MS;
  }

  function scheduleNextAuthCheck(delayMs) {
    if (!authCheckPollingEnabled) return;
    if (authCheckTimerId != null) {
      clearTimeout(authCheckTimerId);
      authCheckTimerId = null;
    }
    const fallbackDelay = getAuthCheckIntervalMs();
    const nextDelay = Number.isFinite(Number(delayMs)) ? Math.max(0, Number(delayMs)) : fallbackDelay;
    authCheckTimerId = setTimeout(() => {
      authCheckTimerId = null;
      runAuthCheckTick().catch(() => {});
    }, nextDelay);
  }

  function isSessionErrorMessage(message) {
    const text = String(message || "").toLowerCase();
    if (!text) return false;
    return text.includes("session expired") || text.includes("http 401") || text.includes("http 403");
  }

  function hasZendeskSessionUser(me) {
    return !!(me && me.user && me.user.id != null);
  }

  function shouldTreatMeResponseAsLoggedOut(me) {
    if (hasZendeskSessionUser(me)) return false;
    const status = Number(me && me.status);
    if (isAuthFailureStatus(status)) return true;
    return Number.isFinite(status) && status >= 200 && status < 300;
  }

  function handleZendeskLoggedOut() {
    showLogin();
    const gateStatus = enforceZipConfigGate({ reportStatus: false });
    if (gateStatus.ready) {
      setStatus("User is logged out of Zendesk. Please sign in.", true);
    } else {
      setStatus(getZipConfigGateMessage(gateStatus), gateStatus.reason === "missing_fields");
    }
  }

  async function runAuthCheckTick(options) {
    const opts = options && typeof options === "object" ? options : {};
    const force = !!opts.force;
    if (authCheckInFlight) return;
    if (force && Date.now() - authCheckLastRanAt < AUTH_CHECK_FORCE_GAP_MS) {
      scheduleNextAuthCheck();
      return;
    }
    authCheckInFlight = true;
    authCheckLastRanAt = Date.now();
    try {
      const me = await sendToZendeskTab({ action: "getMe" });
      const hasUser = hasZendeskSessionUser(me);
      if (state.user) {
        if (shouldTreatMeResponseAsLoggedOut(me)) {
          handleZendeskLoggedOut();
        }
        return;
      }
      if (hasUser) {
        setStatus("Log-in detected. Loading…", false);
        await refreshAll();
      }
    } catch (err) {
      if (state.user && isSessionErrorMessage(err && err.message)) {
        handleZendeskLoggedOut();
      }
    } finally {
      authCheckInFlight = false;
      scheduleNextAuthCheck();
    }
  }

  function startAuthCheckPolling() {
    authCheckPollingEnabled = true;
    stopAuthCheckPolling();
    authCheckPollingEnabled = true;
    scheduleNextAuthCheck(800);
  }

  function triggerAuthCheckNow() {
    sendBackgroundRequest("ZIP_FORCE_CHECK", { reason: "sidepanel_trigger" }).catch(() => {});
    runAuthCheckTick({ force: true }).catch(() => {});
  }

  const $ = (id) => document.getElementById(id);
  const els = {
    status: $("zipStatus"),
    topAvatarWrap: $("zipTopAvatarWrap"),
    topAvatar: $("zipTopAvatar"),
    topAvatarFallback: $("zipTopAvatarFallback"),
    loginScreen: $("zipLoginScreen"),
    appDescription: $("zipAppDescription"),
    appScreen: $("zipAppScreen"),
    configGate: $("zipConfigGate"),
    configGateMessage: $("zipConfigGateMessage"),
    configGateMeta: $("zipConfigGateMeta"),
    configDropZone: $("zipConfigDropZone"),
    configDropAction: $("zipConfigDropAction"),
    configFileInput: $("zipConfigFileInput"),
    loginBtn: $("zipLoginBtn"),
    docsMenu: $("zipDocsMenu"),
    appVersionLink: $("zipAppVersionLink"),
    appVersion: $("zipAppVersion"),
    loginAppVersion: $("zipLoginAppVersion"),
    contextMenuBackdrop: $("zipContextMenuBackdrop"),
    ticketNetworkIndicator: $("zipTicketNetworkIndicator"),
    ticketNetworkLabel: $("zipTicketNetworkLabel"),
    contextMenu: $("zipContextMenu"),
    contextMenuBuild: $("zipContextMenuBuild"),
    contextMenuToggleZdApi: $("zipContextMenuToggleZdApi"),
    contextMenuToggleSide: $("zipContextMenuToggleSide"),
    contextMenuAskEric: $("zipContextMenuAskEric"),
    contextMenuClearKey: $("zipContextMenuClearKey"),
    contextMenuGetLatest: $("zipContextMenuGetLatest"),
    contextMenuAppearanceRow: $("zipContextMenuAppearanceRow"),
    contextMenuThemeStopToggle: $("zipContextMenuThemeStopToggle"),
    contextMenuThemeColorToggle: $("zipContextMenuThemeColorToggle"),
    contextMenuToggleZdApiLabel: $("zipContextMenuToggleZdApiLabel"),
    contextMenuThemeFlyout: $("zipContextMenuThemeFlyout"),
    rawTitle: $("zipRawTitle"),
    rawThead: $("zipRawThead"),
    rawBody: $("zipRawBody"),
    rawDownload: $("zipRawDownload"),
    toast: $("zipToast"),
    passAiCtaZone: $("zipPassAiCtaZone"),
    passAiSubmitWrap: $("zipPassAiSubmitWrap"),
    passAiSubmitHint: $("zipPassAiSubmitHint"),
    slacktivatedBtn: $("zipSlacktivatedBtn"),
    slacktivatedIcon: $("zipSlacktivatedIcon"),
    passAiToggleBtn: $("zipTogglePassAiBtn"),
    passAiToggleIcon: $("zipTogglePassAiIcon"),
    askPassAiBtn: $("zipAskPassAiBtn"),
    passAiInlineStatus: $("zipPassAiInlineStatus"),
    passAiResultsBox: $("zipPassAiResultsBox"),
    passAiError: $("zipPassAiError"),
    passAiQuestionLabel: $("zipPassAiQuestionLabel"),
    passAiQuestion: $("zipPassAiQuestion"),
    passAiAnswerBlock: $("zipPassAiAnswerBlock"),
    passAiAnswerPlaceholder: $("zipPassAiAnswerPlaceholder"),
    passAiDynamicReplyHost: $("zipPassAiDynamicReplyHost"),
    ticketSearch: $("zipTicketSearch"),
    statusFilter: $("zipStatusFilter"),
    reloadTicketsBtn: $("zipReloadTicketsBtn"),
    slackItToMeBtn: $("zipSlackItToMeBtn"),
    exportCsvBtn: $("zipExportCsvBtn"),
    ticketHead: $("zipTicketHead"),
    ticketBody: $("zipTicketBody"),
    ticketTableWrap: $("zipTicketTableWrap"),
    assignedTicketsLink: $("zipAssignedTicketsLink"),
    orgSelect: $("zipOrgSelect"),
    viewSelect: $("zipViewSelect"),
    groupMemberSelect: $("zipGroupMemberSelect"),
    apiPathSelect: $("zipApiPathSelect"),
    apiParams: $("zipApiParams"),
    apiRunBtn: $("zipApiRunBtn"),
    apiGetSection: $("zipApiGetSection"),
    apiResultsSection: $("zipApiResultsSection")
  };

  function getActiveTabId() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "ZIP_GET_ACTIVE_TAB" }, (r) => resolve(r?.tabId ?? null));
    });
  }

  function queryZendeskTabsFromSidepanel() {
    return new Promise((resolve) => {
      try {
        if (!chrome || !chrome.tabs || typeof chrome.tabs.query !== "function") {
          resolve([]);
          return;
        }
        chrome.tabs.query({ url: ZENDESK_TAB_QUERY }, (tabs) => {
          void chrome.runtime.lastError;
          resolve(Array.isArray(tabs) ? tabs : []);
        });
      } catch (_) {
        resolve([]);
      }
    });
  }

  function focusZendeskTabFromSidepanel(tab) {
    return new Promise((resolve) => {
      if (!tab || tab.id == null) {
        resolve({ ok: false });
        return;
      }
      try {
        chrome.tabs.update(tab.id, { active: true, url: ZENDESK_LOGIN_WITH_RETURN_URL }, () => {
          void chrome.runtime.lastError;
          if (tab.windowId != null && chrome.windows && typeof chrome.windows.update === "function") {
            chrome.windows.update(tab.windowId, { focused: true }, () => {
              void chrome.runtime.lastError;
              resolve({ ok: true, tabId: tab.id, openedNewTab: false });
            });
            return;
          }
          resolve({ ok: true, tabId: tab.id, openedNewTab: false });
        });
      } catch (_) {
        resolve({ ok: false });
      }
    });
  }

  function openZendeskTabFromSidepanel() {
    return new Promise((resolve) => {
      try {
        if (!chrome || !chrome.tabs || typeof chrome.tabs.create !== "function") {
          resolve({ ok: false });
          return;
        }
        chrome.tabs.create({ url: ZENDESK_LOGIN_WITH_RETURN_URL }, (tab) => {
          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message || "Unable to open Zendesk tab." });
            return;
          }
          resolve({
            ok: true,
            tabId: tab && tab.id != null ? tab.id : null,
            openedNewTab: true
          });
        });
      } catch (err) {
        resolve({ ok: false, error: err && err.message ? err.message : "Unable to open Zendesk tab." });
      }
    });
  }

  function getSlackTabId() {
    return new Promise((resolve) => {
      if (!chrome || !chrome.runtime || typeof chrome.runtime.sendMessage !== "function") {
        resolve(null);
        return;
      }
      chrome.runtime.sendMessage({ type: "ZIP_GET_SLACK_TAB" }, (r) => resolve(r?.tabId ?? null));
    });
  }

  function parseSlackTabUrl(urlValue) {
    try {
      return new URL(String(urlValue || ""));
    } catch (_) {
      return null;
    }
  }

  function isSlackWorkspaceTabUrl(urlValue) {
    const parsed = parseSlackTabUrl(urlValue);
    if (!parsed) return false;
    const host = String(parsed.hostname || "").toLowerCase();
    return host.endsWith(".slack.com");
  }

  function normalizeSlackWorkspaceOriginForTabs(value) {
    const raw = String(value || "").trim();
    if (!raw) return PASS_AI_SLACK_WORKSPACE_ORIGIN;
    try {
      const parsed = new URL(raw);
      const host = String(parsed.hostname || "").toLowerCase();
      if (!host.endsWith(".slack.com")) return PASS_AI_SLACK_WORKSPACE_ORIGIN;
      return parsed.origin;
    } catch (_) {
      return PASS_AI_SLACK_WORKSPACE_ORIGIN;
    }
  }

  function getSlackWorkspaceHostForTabs(value) {
    const origin = normalizeSlackWorkspaceOriginForTabs(value);
    try {
      return String(new URL(origin).hostname || "").toLowerCase();
    } catch (_) {
      return "";
    }
  }

  function isAllowedSlackWorkspaceHost(host, workspaceHost) {
    const normalizedHost = String(host || "").toLowerCase();
    if (!normalizedHost || !normalizedHost.endsWith(".slack.com")) return false;
    if (!workspaceHost) return true;
    if (normalizedHost === workspaceHost) return true;
    // Slack frequently routes workspace sessions to app.slack.com/client/*.
    if (normalizedHost === "app.slack.com") return true;
    return false;
  }

  function isSlackAuthLikePathname(pathname) {
    const path = String(pathname || "").toLowerCase();
    if (!path) return false;
    return (
      path.startsWith("/signin")
      || path.startsWith("/openid/")
      || path.startsWith("/oauth/")
      || path.includes("/ssb/redirect")
    );
  }

  function isInjectableSlackTabUrl(urlValue) {
    const parsed = parseSlackTabUrl(urlValue);
    if (!parsed) return false;
    if (!isSlackWorkspaceTabUrl(parsed.toString())) return false;
    if (isSlackAuthLikePathname(parsed.pathname || "")) return false;
    return true;
  }

  function scoreSlackTabCandidateForPanel(tab, currentWindowId, injectableOnly, workspaceHost) {
    if (!tab || tab.id == null) return Number.NEGATIVE_INFINITY;
    const parsed = parseSlackTabUrl(tab.url);
    if (!parsed || !isSlackWorkspaceTabUrl(parsed.toString())) return Number.NEGATIVE_INFINITY;
    const host = String(parsed.hostname || "").toLowerCase();
    if (!isAllowedSlackWorkspaceHost(host, workspaceHost)) return Number.NEGATIVE_INFINITY;
    if (injectableOnly && !isInjectableSlackTabUrl(parsed.toString())) return Number.NEGATIVE_INFINITY;

    const full = parsed.toString();
    const path = String(parsed.pathname || "").toLowerCase();
    let score = 0;

    if (tab.active) score += 2200;
    if (currentWindowId != null && tab.windowId === currentWindowId) score += 1100;

    if (host === "adobedx.slack.com") score += 1200;
    if (full.startsWith(PASS_AI_SLACK_WORKSPACE_ORIGIN + "/client/")) score += 1400;
    else if (full.startsWith("https://app.slack.com/client/")) score += 1300;
    else if (full.startsWith(PASS_AI_SLACK_WORKSPACE_ORIGIN + "/")) score += 900;
    else score += 600;

    if (isSlackAuthLikePathname(path)) score -= 5000;
    if (path.includes("/signout")) score -= 800;

    const lastAccessed = Number(tab.lastAccessed || 0);
    if (Number.isFinite(lastAccessed) && lastAccessed > 0) {
      score += Math.min(Math.trunc(lastAccessed / 1000), 400);
    }
    return score;
  }

  function querySlackTabsFromSidepanel(options) {
    const opts = options && typeof options === "object" ? options : {};
    const injectableOnly = opts.injectableOnly !== false;
    const workspaceHost = getSlackWorkspaceHostForTabs(opts.workspaceOrigin || PASS_AI_SLACK_WORKSPACE_ORIGIN);
    return new Promise((resolve) => {
      if (!chrome || !chrome.tabs || typeof chrome.tabs.query !== "function") {
        resolve([]);
        return;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
        void chrome.runtime.lastError;
        const activeTab = Array.isArray(activeTabs) && activeTabs[0] ? activeTabs[0] : null;
        const currentWindowId = activeTab && activeTab.windowId != null ? activeTab.windowId : null;

        chrome.tabs.query({ url: SLACK_TAB_QUERY }, (tabs) => {
          void chrome.runtime.lastError;
          const pool = Array.isArray(tabs) ? tabs : [];
          const ranked = pool
            .map((tab) => ({
              tab,
              score: scoreSlackTabCandidateForPanel(tab, currentWindowId, injectableOnly, workspaceHost)
            }))
            .filter((entry) => Number.isFinite(entry.score))
            .sort((a, b) => b.score - a.score)
            .map((entry) => entry.tab);
          resolve(ranked);
        });
      });
    });
  }

  function getTabById(tabId) {
    const numericTabId = Number(tabId);
    if (!Number.isFinite(numericTabId) || numericTabId <= 0) return Promise.resolve(null);
    return new Promise((resolve) => {
      if (!chrome || !chrome.tabs || typeof chrome.tabs.get !== "function") {
        resolve(null);
        return;
      }
      chrome.tabs.get(numericTabId, (tab) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(tab && typeof tab === "object" ? tab : null);
      });
    });
  }

  async function filterSlackTabIdsByWorkspace(tabIds, workspaceOrigin, injectableOnly) {
    const ids = Array.isArray(tabIds) ? tabIds : [];
    if (!ids.length) return [];
    const workspaceHost = getSlackWorkspaceHostForTabs(workspaceOrigin || PASS_AI_SLACK_WORKSPACE_ORIGIN);
    const filtered = [];
    for (let i = 0; i < ids.length; i += 1) {
      const numericId = Number(ids[i]);
      if (!Number.isFinite(numericId) || numericId <= 0) continue;
      const tab = await getTabById(numericId);
      if (!tab || !tab.url) continue;
      const parsed = parseSlackTabUrl(tab.url);
      if (!parsed) continue;
      const host = String(parsed.hostname || "").toLowerCase();
      if (!isAllowedSlackWorkspaceHost(host, workspaceHost)) continue;
      if (injectableOnly && !isInjectableSlackTabUrl(parsed.toString())) continue;
      if (!filtered.includes(numericId)) filtered.push(numericId);
    }
    return filtered;
  }

  async function getSlackTabCandidates(options) {
    const opts = options && typeof options === "object" ? options : {};
    const injectableOnly = opts.injectableOnly !== false;
    const includeBackground = opts.includeBackground !== false;
    const workspaceOrigin = normalizeSlackWorkspaceOriginForTabs(opts.workspaceOrigin || PASS_AI_SLACK_WORKSPACE_ORIGIN);
    const orderedIds = [];
    const pushId = (value) => {
      const numericId = Number(value);
      if (!Number.isFinite(numericId) || numericId <= 0) return;
      if (!orderedIds.includes(numericId)) orderedIds.push(numericId);
    };

    if (state.slackTabId != null) pushId(state.slackTabId);
    if (includeBackground) {
      const backgroundSlackTabId = await getSlackTabId().catch(() => null);
      pushId(backgroundSlackTabId);
    }
    const localSlackTabs = await querySlackTabsFromSidepanel({ injectableOnly, workspaceOrigin }).catch(() => []);
    for (let i = 0; i < localSlackTabs.length; i += 1) {
      pushId(localSlackTabs[i] && localSlackTabs[i].id);
    }
    return filterSlackTabIdsByWorkspace(orderedIds, workspaceOrigin, injectableOnly);
  }

  function openExternalUrl(url) {
    const safeUrl = String(url || "").trim();
    if (!safeUrl) return;
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: safeUrl }, () => {});
    } else {
      window.open(safeUrl, "_blank", "noopener");
    }
  }

  function sendBackgroundRequest(type, payload) {
    const body = payload && typeof payload === "object" ? payload : {};
    return new Promise((resolve, reject) => {
      if (!chrome || !chrome.runtime || typeof chrome.runtime.sendMessage !== "function") {
        reject(new Error("Extension runtime is unavailable."));
        return;
      }
      chrome.runtime.sendMessage({ type, ...body }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || "Extension request failed."));
          return;
        }
        resolve(response || {});
      });
    });
  }

  function openSlackWorkspaceTab(url, options) {
    const safeUrl = String(url || "").trim();
    if (!safeUrl) {
      return Promise.reject(new Error("Slack workspace URL is missing."));
    }
    const active = !!(options && options.active);
    return new Promise((resolve, reject) => {
      if (!chrome || !chrome.tabs || typeof chrome.tabs.create !== "function") {
        reject(new Error("Unable to open Slack tab in this browser context."));
        return;
      }
      chrome.tabs.create({ url: safeUrl, active }, (tab) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || "Unable to open Slack tab."));
          return;
        }
        resolve({
          tabId: tab && tab.id != null ? tab.id : null,
          windowId: tab && tab.windowId != null ? tab.windowId : null
        });
      });
    });
  }

  function closeSlackWorkspaceTab(tabId) {
    const numericTabId = Number(tabId);
    if (!Number.isFinite(numericTabId) || numericTabId <= 0) {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      if (!chrome || !chrome.tabs || typeof chrome.tabs.remove !== "function") {
        resolve(false);
        return;
      }
      chrome.tabs.remove(numericTabId, () => {
        void chrome.runtime.lastError;
        resolve(true);
      });
    });
  }

  function focusSlackWorkspaceTab(tabId, url) {
    const numericTabId = Number(tabId);
    if (!Number.isFinite(numericTabId) || numericTabId <= 0) {
      return Promise.reject(new Error("Slack tab id is invalid."));
    }
    const safeUrl = String(url || "").trim();
    return new Promise((resolve, reject) => {
      if (!chrome || !chrome.tabs || typeof chrome.tabs.update !== "function") {
        reject(new Error("Unable to focus Slack tab in this browser context."));
        return;
      }
      const updateInfo = { active: true };
      if (safeUrl) updateInfo.url = safeUrl;
      chrome.tabs.update(numericTabId, updateInfo, (tab) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || "Unable to focus Slack tab."));
          return;
        }
        const resolvedTabId = tab && tab.id != null ? tab.id : numericTabId;
        const windowId = tab && tab.windowId != null ? tab.windowId : null;
        if (windowId != null && chrome.windows && typeof chrome.windows.update === "function") {
          chrome.windows.update(windowId, { focused: true }, () => {
            void chrome.runtime.lastError;
            resolve({
              tabId: resolvedTabId,
              windowId,
              openedNewTab: false
            });
          });
          return;
        }
        resolve({
          tabId: resolvedTabId,
          windowId,
          openedNewTab: false
        });
      });
    });
  }

  function readZdApiVisibilityPreference() {
    try {
      const raw = window.localStorage.getItem(ZD_API_VISIBILITY_STORAGE_KEY);
      return raw === "1";
    } catch (_) {
      return false;
    }
  }

  function writeZdApiVisibilityPreference(show) {
    try {
      window.localStorage.setItem(ZD_API_VISIBILITY_STORAGE_KEY, show ? "1" : "0");
    } catch (_) {}
  }

  function getZdApiToggleLabel(show) {
    return show ? CONTEXT_MENU_ZD_API_HIDE_LABEL : CONTEXT_MENU_ZD_API_SHOW_LABEL;
  }

  function syncContextMenuZdApiToggleLabel() {
    if (!els.contextMenuToggleZdApi) return;
    const label = getZdApiToggleLabel(state.showZdApiContainers);
    if (els.contextMenuToggleZdApiLabel) {
      els.contextMenuToggleZdApiLabel.textContent = label;
      return;
    }
    els.contextMenuToggleZdApi.textContent = label;
  }

  function syncContextMenuAuthVisibility() {
    const loggedIn = !!state.user;
    if (!els.contextMenuToggleZdApi) return;
    els.contextMenuToggleZdApi.classList.toggle("hidden", !loggedIn);
    els.contextMenuToggleZdApi.disabled = !loggedIn;
    els.contextMenuToggleZdApi.setAttribute("aria-hidden", loggedIn ? "false" : "true");
  }

  function applyZdApiContainerVisibility(show, persist) {
    const next = !!show;
    state.showZdApiContainers = next;
    [els.apiGetSection, els.apiResultsSection].forEach((sectionEl) => {
      if (!sectionEl) return;
      sectionEl.classList.toggle("hidden", !next);
      sectionEl.setAttribute("aria-hidden", next ? "false" : "true");
    });
    syncContextMenuZdApiToggleLabel();
    if (persist) writeZdApiVisibilityPreference(next);
  }

  function initializeZdApiContainerVisibility() {
    applyZdApiContainerVisibility(readZdApiVisibilityPreference(), false);
  }

  function toggleZdApiContainerVisibility() {
    applyZdApiContainerVisibility(!state.showZdApiContainers, true);
  }

  function applySidePanelContext(context) {
    const side = context && (context.layout === "left" || context.layout === "right") ? context.layout : "unknown";
    state.sidePanelLayout = side;
    document.body.dataset.sidepanelSide = side;
    document.body.dataset.sidepanelLayoutSupported = context && context.capabilities && context.capabilities.getLayout ? "1" : "0";
  }

  function loadSidePanelContext() {
    return new Promise((resolve) => {
      if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
        resolve(null);
        return;
      }
      chrome.runtime.sendMessage({ type: "ZIP_GET_SIDEPANEL_CONTEXT" }, (context) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        applySidePanelContext(context || null);
        resolve(context || null);
      });
    });
  }

  function setContextMenuBuildLabel() {
    if (!els.contextMenuBuild) return;
    try {
      const manifest = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getManifest ? chrome.runtime.getManifest() : null;
      const version = manifest && manifest.version ? String(manifest.version) : "";
      els.contextMenuBuild.textContent = version ? "ZIP v" + version : "ZIP";
    } catch (_) {
      els.contextMenuBuild.textContent = "ZIP";
    }
  }

  function getFallbackThemeOptionById(themeId) {
    const normalized = String(themeId || "").trim().toLowerCase();
    return FALLBACK_THEME_OPTION_BY_ID[normalized] || null;
  }

  function normalizeThemeColorStop(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "dark" || normalized === "light") {
      return normalized;
    }
    if (normalized === "darkest") return "dark";
    if (normalized === "wireframe") return "light";
    return "dark";
  }

  function normalizeSpectrumColorStop(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "darkest") return "dark";
    return SPECTRUM_COLORSTOP_CLASS_BY_NAME[normalized] ? normalized : "dark";
  }

  function normalizePaletteSet(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "light" || normalized === "dark") {
      return normalized;
    }
    if (normalized === "wireframe") return "light";
    return "dark";
  }

  function normalizeAccentFamily(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return ACCENT_PALETTE_RGB[normalized] ? normalized : DEFAULT_THEME_ACCENT_ID;
  }

  function getAccentFamilyMeta(accentFamily) {
    const key = normalizeAccentFamily(accentFamily);
    return THEME_ACCENT_FAMILY_BY_ID[key] || THEME_ACCENT_FAMILY_BY_ID[DEFAULT_THEME_ACCENT_ID] || null;
  }

  function getAccentFamilyLabel(accentFamily) {
    const meta = getAccentFamilyMeta(accentFamily);
    return meta && meta.name ? String(meta.name) : "Color";
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
    return getFallbackThemeOptionById(mapped) ? mapped : DEFAULT_THEME_ID;
  }

  function normalizeThemeOption(option) {
    const normalizedId = normalizeThemeId(option && option.id);
    const fallback = getFallbackThemeOptionById(normalizedId) || getFallbackThemeOptionById(DEFAULT_THEME_ID) || {};
    return {
      id: normalizedId,
      label: String((option && option.label) || fallback.label || "Spectrum 2 Theme"),
      spectrumColorStop: normalizeSpectrumColorStop((option && option.spectrumColorStop) || fallback.spectrumColorStop),
      themeColorStop: normalizeThemeColorStop((option && option.themeColorStop) || fallback.themeColorStop),
      paletteSet: normalizePaletteSet((option && option.paletteSet) || fallback.paletteSet),
      accentFamily: normalizeAccentFamily((option && option.accentFamily) || fallback.accentFamily)
    };
  }

  function getFallbackThemeOptions() {
    return FALLBACK_THEME_OPTIONS.map((option) => normalizeThemeOption(option));
  }

  function getThemeOptions() {
    if (Array.isArray(state.themeOptions) && state.themeOptions.length) {
      return state.themeOptions.map((option) => normalizeThemeOption(option));
    }
    return getFallbackThemeOptions();
  }

  function getThemeOptionById(themeId, options) {
    const normalizedId = normalizeThemeId(themeId);
    const pool = Array.isArray(options) && options.length ? options : getThemeOptions();
    const match = pool.find((option) => normalizeThemeId(option && option.id) === normalizedId);
    if (match) return normalizeThemeOption(match);
    const fallback = getFallbackThemeOptionById(normalizedId) || getFallbackThemeOptionById(DEFAULT_THEME_ID);
    return normalizeThemeOption(fallback || { id: DEFAULT_THEME_ID });
  }

  function getThemeOptionByStopAndAccent(themeColorStop, accentFamily, options) {
    const stop = normalizeThemeColorStop(themeColorStop);
    const accent = normalizeAccentFamily(accentFamily);
    const pool = Array.isArray(options) && options.length ? options.map((option) => normalizeThemeOption(option)) : getThemeOptions();
    const direct = pool.find((option) => option.themeColorStop === stop && option.accentFamily === accent);
    if (direct) return normalizeThemeOption(direct);
    const fallbackId = "s2-" + stop + "-" + accent;
    const fallback = getFallbackThemeOptionById(fallbackId);
    if (fallback) return normalizeThemeOption(fallback);
    return getThemeOptionById(DEFAULT_THEME_ID, pool);
  }

  function getAccentPaletteValue(accentFamily, paletteSet, toneKey) {
    const familyKey = normalizeAccentFamily(accentFamily);
    const setKey = normalizePaletteSet(paletteSet);
    const paletteByFamily = ACCENT_PALETTE_RGB[familyKey] || ACCENT_PALETTE_RGB[DEFAULT_THEME_ACCENT_ID];
    const paletteBySet = (paletteByFamily && paletteByFamily[setKey]) || (paletteByFamily && paletteByFamily.dark) || {};
    const requested = String(toneKey || "").trim();
    if (requested && paletteBySet[requested]) return paletteBySet[requested];
    if (paletteBySet["900"]) return paletteBySet["900"];
    const defaultDark = ACCENT_PALETTE_RGB[DEFAULT_THEME_ACCENT_ID] && ACCENT_PALETTE_RGB[DEFAULT_THEME_ACCENT_ID].dark;
    return (defaultDark && (defaultDark["900"] || defaultDark["800"])) || "0, 120, 212";
  }

  function parseRgbTriplet(value) {
    const parts = String(value || "").split(",").map((part) => Number.parseInt(String(part || "").trim(), 10));
    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
      return [0, 120, 212];
    }
    return parts.map((part) => Math.max(0, Math.min(255, part)));
  }

  function relativeChannel(value) {
    const normalized = Math.max(0, Math.min(255, Number(value) || 0)) / 255;
    if (normalized <= 0.03928) return normalized / 12.92;
    return Math.pow((normalized + 0.055) / 1.055, 2.4);
  }

  function getAccessibleOnPrimaryRgb(primaryRgb) {
    const [r, g, b] = parseRgbTriplet(primaryRgb);
    const luminance = 0.2126 * relativeChannel(r) + 0.7152 * relativeChannel(g) + 0.0722 * relativeChannel(b);
    const contrastWithWhite = 1.05 / (luminance + 0.05);
    const contrastWithBlack = (luminance + 0.05) / 0.05;
    return contrastWithBlack > contrastWithWhite ? "0, 0, 0" : "255, 255, 255";
  }

  function getThemeToneDefinition(themeColorStop) {
    const stop = normalizeThemeColorStop(themeColorStop);
    return THEME_TONE_BY_COLOR_STOP[stop] || THEME_TONE_BY_COLOR_STOP.dark;
  }

  function buildThemeVibeDefinition(accentFamily, themeColorStop) {
    const stop = normalizeThemeColorStop(themeColorStop);
    const baseRgb = parseRgbTriplet(getAccentPaletteValue(accentFamily, "dark", "800"));
    const [hue, saturation, lightness] = rgbTripletToHsl(baseRgb);
    const chroma = saturation * (1 - Math.abs((2 * lightness) - 1));
    const neutrality = clampNumber(1 - saturation, 0, 1);
    const hueWaveA = (Math.sin(degreesToRadians(hue + 22)) + 1) / 2;
    const hueWaveB = (Math.cos(degreesToRadians(hue - 33)) + 1) / 2;
    const hueWaveC = (Math.sin(degreesToRadians((hue * 2) + 11)) + 1) / 2;
    const warmth = (Math.cos(degreesToRadians(hue - 38)) + 1) / 2;
    const coolness = (Math.cos(degreesToRadians(hue - 218)) + 1) / 2;
    const thermalShift = (warmth - coolness) * 0.5;
    const vivid = clampNumber(0.74 + (saturation * 0.54) + (chroma * 0.30), 0.72, 1.4);
    const distinction = clampNumber(0.88 + (hueWaveA * 0.22) + (hueWaveB * 0.14) + (hueWaveC * 0.08), 0.84, 1.32);
    const neutralAttenuation = 1 - (neutrality * 0.34);
    const energy = clampNumber(vivid * distinction * neutralAttenuation, 0.72, 1.42);

    if (stop === "light") {
      const shellMix = clampNumber(23 + (energy * 8.5) + (hueWaveA * 6.5) - (neutrality * 4.5), 22, 43);
      const bodyStartMix = clampNumber(shellMix + 5 + (hueWaveB * 6), 26, 50);
      const bodyEndMix = clampNumber((shellMix * 0.68) + 5 + (hueWaveC * 3.5), 16, 34);
      const borderMix = clampNumber(31 + (energy * 10) + (hueWaveB * 5.5), 30, 52);
      const topbarAAlpha = clampNumber(0.11 + (energy * 0.05), 0.11, 0.24);
      const topbarBAlpha = clampNumber((topbarAAlpha * 0.57) + (hueWaveA * 0.018), 0.06, 0.15);
      const footerAAlpha = clampNumber((topbarAAlpha * 0.74) + (hueWaveC * 0.012), 0.07, 0.20);
      const topbarCMix = clampNumber(18 + (energy * 8.5) + (hueWaveC * 5) + (thermalShift * 3.5), 16, 39);
      const footerBMix = clampNumber(15 + (energy * 7.5) + (hueWaveA * 4) + (thermalShift * 2.8), 14, 34);
      const menuAMix = clampNumber(12 + (energy * 6) + (hueWaveB * 4), 11, 28);
      const menuBMix = clampNumber(8 + (energy * 4.5) + (hueWaveC * 3), 7, 21);
      const loginAAlpha = clampNumber(0.11 + (energy * 0.045), 0.11, 0.23);
      const loginCAlpha = clampNumber(0.08 + (energy * 0.032), 0.08, 0.18);
      const sectionAMix = clampNumber(15 + (energy * 7.5) + (hueWaveA * 4) + (thermalShift * 2.5), 14, 34);
      const sectionBMix = clampNumber(20 + (energy * 9.5) + (hueWaveB * 5) + (thermalShift * 3.2), 20, 41);
      const headerAAlpha = clampNumber(topbarAAlpha + 0.012, 0.12, 0.26);
      const selectionAAlpha = clampNumber(0.17 + (energy * 0.045), 0.17, 0.28);
      const selectionBAlpha = clampNumber(0.11 + (energy * 0.03), 0.11, 0.19);
      const focusAlpha = clampNumber(0.17 + (energy * 0.05), 0.17, 0.29);
      const surfaceSoftAlpha = clampNumber(0.075 + (energy * 0.027), 0.07, 0.17);
      const surfaceMidAlpha = clampNumber(surfaceSoftAlpha + 0.042 + (hueWaveB * 0.012), 0.11, 0.22);
      const surfaceStrongAlpha = clampNumber(surfaceMidAlpha + 0.065 + (hueWaveC * 0.02), 0.18, 0.34);
      const menuSurfaceMix = clampNumber(11 + (energy * 5) + (hueWaveA * 3), 10, 24);
      const glowAlpha = clampNumber(0.14 + (energy * 0.045), 0.14, 0.24);
      const feedbackBgAlpha = clampNumber(0.12 + (energy * 0.032), 0.12, 0.21);
      const feedbackBorderAlpha = clampNumber(0.30 + (energy * 0.065), 0.30, 0.48);
      const zebraContrast = clampNumber(12 + (energy * 2.6) + (hueWaveA * 1.2) - (neutrality * 1.4), 11.5, 18.5);
      const zebraHoverBoost = clampNumber(7 + (energy * 1) + (hueWaveC * 0.8), 7, 10.8);
      return {
        "--zip-theme-vibe-body-radial-alpha": formatCssAlpha(topbarAAlpha + 0.01),
        "--zip-theme-vibe-body-start-mix": formatCssPercent(bodyStartMix),
        "--zip-theme-vibe-body-end-mix": formatCssPercent(bodyEndMix),
        "--zip-theme-vibe-shell-mix": formatCssPercent(shellMix),
        "--zip-theme-vibe-border-mix": formatCssPercent(borderMix),
        "--zip-theme-vibe-topbar-a-alpha": formatCssAlpha(topbarAAlpha),
        "--zip-theme-vibe-topbar-b-alpha": formatCssAlpha(topbarBAlpha),
        "--zip-theme-vibe-topbar-c-mix": formatCssPercent(topbarCMix),
        "--zip-theme-vibe-footer-a-alpha": formatCssAlpha(footerAAlpha),
        "--zip-theme-vibe-footer-b-mix": formatCssPercent(footerBMix),
        "--zip-theme-vibe-menu-a-mix": formatCssPercent(menuAMix),
        "--zip-theme-vibe-menu-b-mix": formatCssPercent(menuBMix),
        "--zip-theme-vibe-login-a-alpha": formatCssAlpha(loginAAlpha),
        "--zip-theme-vibe-login-c-alpha": formatCssAlpha(loginCAlpha),
        "--zip-theme-vibe-section-a-mix": formatCssPercent(sectionAMix),
        "--zip-theme-vibe-section-b-mix": formatCssPercent(sectionBMix),
        "--zip-theme-vibe-header-a-alpha": formatCssAlpha(headerAAlpha),
        "--zip-theme-vibe-selection-a-alpha": formatCssAlpha(selectionAAlpha),
        "--zip-theme-vibe-selection-b-alpha": formatCssAlpha(selectionBAlpha),
        "--zip-theme-vibe-focus-alpha": formatCssAlpha(focusAlpha),
        "--zip-theme-vibe-surface-soft-alpha": formatCssAlpha(surfaceSoftAlpha),
        "--zip-theme-vibe-surface-mid-alpha": formatCssAlpha(surfaceMidAlpha),
        "--zip-theme-vibe-surface-strong-alpha": formatCssAlpha(surfaceStrongAlpha),
        "--zip-theme-vibe-menu-surface-mix": formatCssPercent(menuSurfaceMix),
        "--zip-theme-vibe-glow-alpha": formatCssAlpha(glowAlpha),
        "--zip-theme-vibe-feedback-bg-alpha": formatCssAlpha(feedbackBgAlpha),
        "--zip-theme-vibe-feedback-border-alpha": formatCssAlpha(feedbackBorderAlpha),
        "--zip-theme-vibe-zebra-contrast": formatCssPercent(zebraContrast),
        "--zip-theme-vibe-zebra-hover": formatCssPercent(zebraHoverBoost)
      };
    }

    const shellMix = clampNumber(30 + (energy * 10) + (hueWaveA * 7) - (neutrality * 2.5), 29, 58);
    const bodyStartMix = clampNumber(shellMix + 8 + (hueWaveB * 6) + (thermalShift * 3), 34, 62);
    const bodyEndMix = clampNumber((shellMix * 0.76) + 7 + (hueWaveC * 4) + (thermalShift * 2.5), 30, 50);
    const borderMix = clampNumber(34 + (energy * 11) + (hueWaveB * 6), 34, 58);
    const topbarAAlpha = clampNumber(0.19 + (energy * 0.07), 0.19, 0.33);
    const topbarBAlpha = clampNumber((topbarAAlpha * 0.58) + (hueWaveA * 0.02), 0.11, 0.2);
    const footerAAlpha = clampNumber((topbarAAlpha * 0.8) + (hueWaveC * 0.015), 0.15, 0.27);
    const topbarCMix = clampNumber(21 + (energy * 8) + (hueWaveC * 5) + (thermalShift * 3.5), 20, 44);
    const footerBMix = clampNumber(18 + (energy * 8) + (hueWaveA * 5) + (thermalShift * 3.2), 17, 40);
    const menuAMix = clampNumber(14 + (energy * 7) + (hueWaveB * 4), 14, 30);
    const menuBMix = clampNumber(10 + (energy * 6) + (hueWaveC * 3), 10, 24);
    const loginAAlpha = clampNumber(0.16 + (energy * 0.055), 0.16, 0.29);
    const loginCAlpha = clampNumber(0.11 + (energy * 0.04), 0.11, 0.21);
    const sectionAMix = clampNumber(22 + (energy * 10) + (hueWaveA * 4) + (thermalShift * 3.5), 22, 48);
    const sectionBMix = clampNumber(26 + (energy * 11) + (hueWaveB * 5) + (thermalShift * 3.8), 26, 52);
    const headerAAlpha = clampNumber(0.19 + (energy * 0.055), 0.19, 0.31);
    const selectionAAlpha = clampNumber(0.24 + (energy * 0.06), 0.24, 0.36);
    const selectionBAlpha = clampNumber(0.14 + (energy * 0.04), 0.14, 0.24);
    const focusAlpha = clampNumber(0.22 + (energy * 0.055), 0.22, 0.34);
    const surfaceSoftAlpha = clampNumber(0.14 + (energy * 0.05), 0.14, 0.27);
    const surfaceMidAlpha = clampNumber(surfaceSoftAlpha + 0.085 + (hueWaveB * 0.015), 0.23, 0.36);
    const surfaceStrongAlpha = clampNumber(surfaceMidAlpha + 0.11 + (hueWaveC * 0.025), 0.34, 0.52);
    const menuSurfaceMix = clampNumber(13 + (energy * 6) + (hueWaveA * 3), 13, 29);
    const glowAlpha = clampNumber(0.20 + (energy * 0.06), 0.20, 0.34);
    const feedbackBgAlpha = clampNumber(0.16 + (energy * 0.04), 0.16, 0.27);
    const feedbackBorderAlpha = clampNumber(0.36 + (energy * 0.07), 0.36, 0.58);
    const zebraContrast = clampNumber(13.5 + (energy * 2.8) + (hueWaveA * 1.4) - (neutrality * 1.2), 13, 20);
    const zebraHoverBoost = clampNumber(8 + (energy * 1.2) + (hueWaveC * 0.8), 8, 12);
    return {
      "--zip-theme-vibe-body-radial-alpha": formatCssAlpha(topbarAAlpha + 0.03),
      "--zip-theme-vibe-body-start-mix": formatCssPercent(bodyStartMix),
      "--zip-theme-vibe-body-end-mix": formatCssPercent(bodyEndMix),
      "--zip-theme-vibe-shell-mix": formatCssPercent(shellMix),
      "--zip-theme-vibe-border-mix": formatCssPercent(borderMix),
      "--zip-theme-vibe-topbar-a-alpha": formatCssAlpha(topbarAAlpha),
      "--zip-theme-vibe-topbar-b-alpha": formatCssAlpha(topbarBAlpha),
      "--zip-theme-vibe-topbar-c-mix": formatCssPercent(topbarCMix),
      "--zip-theme-vibe-footer-a-alpha": formatCssAlpha(footerAAlpha),
      "--zip-theme-vibe-footer-b-mix": formatCssPercent(footerBMix),
      "--zip-theme-vibe-menu-a-mix": formatCssPercent(menuAMix),
      "--zip-theme-vibe-menu-b-mix": formatCssPercent(menuBMix),
      "--zip-theme-vibe-login-a-alpha": formatCssAlpha(loginAAlpha),
      "--zip-theme-vibe-login-c-alpha": formatCssAlpha(loginCAlpha),
      "--zip-theme-vibe-section-a-mix": formatCssPercent(sectionAMix),
      "--zip-theme-vibe-section-b-mix": formatCssPercent(sectionBMix),
      "--zip-theme-vibe-header-a-alpha": formatCssAlpha(headerAAlpha),
      "--zip-theme-vibe-selection-a-alpha": formatCssAlpha(selectionAAlpha),
      "--zip-theme-vibe-selection-b-alpha": formatCssAlpha(selectionBAlpha),
      "--zip-theme-vibe-focus-alpha": formatCssAlpha(focusAlpha),
      "--zip-theme-vibe-surface-soft-alpha": formatCssAlpha(surfaceSoftAlpha),
      "--zip-theme-vibe-surface-mid-alpha": formatCssAlpha(surfaceMidAlpha),
      "--zip-theme-vibe-surface-strong-alpha": formatCssAlpha(surfaceStrongAlpha),
      "--zip-theme-vibe-menu-surface-mix": formatCssPercent(menuSurfaceMix),
      "--zip-theme-vibe-glow-alpha": formatCssAlpha(glowAlpha),
      "--zip-theme-vibe-feedback-bg-alpha": formatCssAlpha(feedbackBgAlpha),
      "--zip-theme-vibe-feedback-border-alpha": formatCssAlpha(feedbackBorderAlpha),
      "--zip-theme-vibe-zebra-contrast": formatCssPercent(zebraContrast),
      "--zip-theme-vibe-zebra-hover": formatCssPercent(zebraHoverBoost)
    };
  }

  function applyThemeVibeVariables(themeOption) {
    if (!document.body || !document.body.style) return;
    const option = normalizeThemeOption(themeOption || getThemeOptionById(state.themeId));
    const vibeVars = buildThemeVibeDefinition(option.accentFamily, option.themeColorStop);
    Object.entries(vibeVars).forEach(([name, value]) => {
      document.body.style.setProperty(name, String(value));
    });
  }

  function applyThemeAccentVariables(themeOption) {
    const option = normalizeThemeOption(themeOption || getThemeOptionById(state.themeId));
    const tone = getThemeToneDefinition(option.themeColorStop);
    const tone500 = getAccentPaletteValue(option.accentFamily, option.paletteSet, "500");
    const downRgb = getAccentPaletteValue(option.accentFamily, option.paletteSet, tone.down);
    const hoverRgb = getAccentPaletteValue(option.accentFamily, option.paletteSet, tone.hover);
    const primaryRgb = getAccentPaletteValue(option.accentFamily, option.paletteSet, tone.primary);
    const linkRgb = getAccentPaletteValue(option.accentFamily, option.paletteSet, tone.link);
    const tone1000 = getAccentPaletteValue(option.accentFamily, option.paletteSet, "1000");
    const tone1100 = getAccentPaletteValue(option.accentFamily, option.paletteSet, "1100");
    const focusRgb = getAccentPaletteValue(option.accentFamily, option.paletteSet, tone.focus);
    const onPrimaryRgb = getAccessibleOnPrimaryRgb(primaryRgb);
    if (!document.body || !document.body.style) return;
    document.body.style.setProperty("--zip-accent-500", tone500);
    document.body.style.setProperty("--zip-accent-600", downRgb);
    document.body.style.setProperty("--zip-accent-700", hoverRgb);
    document.body.style.setProperty("--zip-accent-800", primaryRgb);
    document.body.style.setProperty("--zip-accent-900", linkRgb);
    document.body.style.setProperty("--zip-accent-1000", tone1000);
    document.body.style.setProperty("--zip-accent-1100", tone1100);
    document.body.style.setProperty("--zip-accent-focus", focusRgb);
    document.body.style.setProperty("--zip-accent-on-primary", onPrimaryRgb);
    applyThemeVibeVariables(option);

    /* Feed official Spectrum accent and focus tokens from the ZIP accent picker. */
    document.body.style.setProperty("--spectrum-accent-color-500", "rgb(" + tone500 + ")");
    document.body.style.setProperty("--spectrum-accent-color-600", "rgb(" + downRgb + ")");
    document.body.style.setProperty("--spectrum-accent-color-700", "rgb(" + hoverRgb + ")");
    document.body.style.setProperty("--spectrum-accent-color-800", "rgb(" + primaryRgb + ")");
    document.body.style.setProperty("--spectrum-accent-color-900", "rgb(" + linkRgb + ")");
    document.body.style.setProperty("--spectrum-accent-color-1000", "rgb(" + tone1000 + ")");
    document.body.style.setProperty("--spectrum-accent-color-1100", "rgb(" + tone1100 + ")");
    document.body.style.setProperty("--spectrum-focus-indicator-color", "rgb(" + focusRgb + ")");
  }

  function getThemeSwatchRgb(themeOption) {
    const option = normalizeThemeOption(themeOption);
    const paletteSet = normalizePaletteSet(option.paletteSet);
    const tone = getThemeToneDefinition(option.themeColorStop);
    return getAccentPaletteValue(option.accentFamily, paletteSet, tone.primary);
  }

  function applySpectrumColorStopClass(themeColorStop) {
    const nextStop = normalizeThemeColorStop(themeColorStop);
    const nextColorStopClass = SPECTRUM_COLORSTOP_CLASS_BY_NAME[nextStop] || SPECTRUM_COLORSTOP_CLASS_BY_NAME.dark;
    const themeRoots = [document.documentElement, document.body].filter(Boolean);
    themeRoots.forEach((rootEl) => {
      ALL_SPECTRUM_COLORSTOP_CLASSES.forEach((cls) => rootEl.classList.remove(cls));
      if (nextColorStopClass) rootEl.classList.add(nextColorStopClass);
      rootEl.dataset.zipThemeColorstop = nextStop;
      rootEl.style.colorScheme = nextStop;
    });
    if (document.body) {
      document.body.classList.remove("zip-theme-dark", "zip-theme-light");
      document.body.classList.add("zip-theme-" + nextStop);
    }
  }

  function getThemeColorStopMeta(themeColorStop) {
    const stopId = normalizeThemeColorStop(themeColorStop);
    const match = THEME_COLOR_STOPS.find((stop) => normalizeThemeColorStop(stop.id) === stopId);
    return match || { id: stopId, label: stopId };
  }

  function applyThemeSwatchStyles(targetEl, themeOption) {
    if (!targetEl) return;
    const option = normalizeThemeOption(themeOption);
    const accentMeta = getAccentFamilyMeta(option.accentFamily);
    const recommendedForeground = accentMeta ? String(accentMeta.recommendedForeground || "").trim().toLowerCase() : "";
    const usesDarkForeground = recommendedForeground === "#111111";
    const swatchRgb = getThemeSwatchRgb(option);
    const paletteSet = normalizePaletteSet(option.paletteSet);
    targetEl.style.setProperty("--zip-theme-swatch", "rgb(" + swatchRgb + ")");
    if (paletteSet !== "dark" || usesDarkForeground) {
      targetEl.style.setProperty("--zip-theme-swatch-border", "var(--border-default)");
      targetEl.style.setProperty("--zip-theme-swatch-ring", "var(--zip-theme-swatch-ring-muted)");
      return;
    }
    targetEl.style.removeProperty("--zip-theme-swatch-border");
    targetEl.style.removeProperty("--zip-theme-swatch-ring");
  }

  function updateThemeFlyoutParentState() {
    const flyoutVisible = !!(els.contextMenuThemeFlyout && !els.contextMenuThemeFlyout.classList.contains("hidden"));
    const isOpen = flyoutVisible && !!state.themeFlyoutStop;
    if (els.contextMenuThemeColorToggle) {
      els.contextMenuThemeColorToggle.classList.toggle("is-open", isOpen);
      els.contextMenuThemeColorToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      const openStop = isOpen ? getThemeColorStopMeta(state.themeFlyoutStop).label : "";
      const title = isOpen
        ? ("Hide Spectrum 2 " + openStop + " colors")
        : "Show Spectrum 2 color picker";
      els.contextMenuThemeColorToggle.title = title;
    }
  }

  function hideThemeFlyout(options) {
    const keepStop = !!(options && options.keepStop);
    if (!keepStop) state.themeFlyoutStop = "";
    if (els.contextMenuThemeFlyout) {
      els.contextMenuThemeFlyout.classList.add("hidden");
      els.contextMenuThemeFlyout.innerHTML = "";
      els.contextMenuThemeFlyout.removeAttribute("data-theme-stop");
      els.contextMenuThemeFlyout.style.removeProperty("width");
      els.contextMenuThemeFlyout.style.removeProperty("maxWidth");
      els.contextMenuThemeFlyout.style.removeProperty("maxHeight");
    }
    updateThemeFlyoutParentState();
  }

  function positionThemeFlyout(anchorEl) {
    if (!anchorEl || !els.contextMenuThemeFlyout || els.contextMenuThemeFlyout.classList.contains("hidden")) return;
    const flyout = els.contextMenuThemeFlyout;
    const pad = 4;
    const gap = 6;
    const viewportWidth = Math.max(240, window.innerWidth || 0);
    const viewportHeight = Math.max(240, window.innerHeight || 0);
    const maxWidth = Math.max(220, viewportWidth - (pad * 2));
    const maxHeight = Math.max(220, viewportHeight - (pad * 2));
    const targetWidth = Math.min(400, maxWidth);
    flyout.style.width = targetWidth + "px";
    flyout.style.maxWidth = targetWidth + "px";
    flyout.style.maxHeight = Math.min(500, maxHeight) + "px";
    flyout.style.left = pad + "px";
    flyout.style.top = pad + "px";

    const anchorRect = anchorEl.getBoundingClientRect();
    const flyoutRect = flyout.getBoundingClientRect();
    const spaceRight = viewportWidth - anchorRect.right - gap - pad;
    const spaceLeft = anchorRect.left - gap - pad;

    let left = (spaceRight >= flyoutRect.width || spaceRight >= spaceLeft)
      ? (anchorRect.right + gap)
      : (anchorRect.left - gap - flyoutRect.width);
    let top = anchorRect.top;

    if (top + flyoutRect.height + pad > viewportHeight) {
      top = viewportHeight - flyoutRect.height - pad;
    }
    if (top < pad) top = pad;
    if (left + flyoutRect.width + pad > viewportWidth) {
      left = viewportWidth - flyoutRect.width - pad;
    }
    if (left < pad) left = pad;

    flyout.style.left = Math.round(left) + "px";
    flyout.style.top = Math.round(top) + "px";
  }

  function renderThemeFlyout(themeColorStop, anchorEl) {
    if (!els.contextMenuThemeFlyout || !anchorEl) {
      hideThemeFlyout();
      return;
    }

    const stopId = normalizeThemeColorStop(themeColorStop);
    const stopMeta = getThemeColorStopMeta(stopId);
    const options = getThemeOptions();
    const activeTheme = getThemeOptionById(state.themeId, options);
    const activeThemeId = normalizeThemeId(activeTheme.id);
    const flyout = els.contextMenuThemeFlyout;
    flyout.innerHTML = "";

    const header = document.createElement("div");
    header.className = "zip-context-menu-theme-flyout-header";
    const title = document.createElement("div");
    title.className = "zip-context-menu-theme-flyout-title";
    title.textContent = "Spectrum 2 " + stopMeta.label + " Colors";
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "zip-context-menu-theme-flyout-close";
    closeBtn.setAttribute("aria-label", "Close color picker");
    closeBtn.textContent = "\u00D7";
    closeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      hideThemeFlyout();
    });
    header.appendChild(title);
    header.appendChild(closeBtn);
    flyout.appendChild(header);

    const list = document.createElement("div");
    list.className = "zip-context-menu-theme-flyout-list";
    list.setAttribute("role", "group");
    list.setAttribute("aria-label", "Spectrum 2 " + stopMeta.label + " accent colors");

    const orderedColorIds = [];
    const seenColorIds = new Set();
    const groups = Array.isArray(THEME_ACCENT_GROUPS) && THEME_ACCENT_GROUPS.length
      ? THEME_ACCENT_GROUPS
      : [{ id: "all-colors", colorIds: THEME_ACCENT_FAMILIES.map((accent) => accent.id) }];
    groups.forEach((group) => {
      const colorIds = Array.isArray(group && group.colorIds) ? group.colorIds : [];
      colorIds.forEach((colorId) => {
        const normalizedId = normalizeAccentFamily(colorId);
        if (!normalizedId || seenColorIds.has(normalizedId)) return;
        seenColorIds.add(normalizedId);
        orderedColorIds.push(normalizedId);
      });
    });
    if (!orderedColorIds.length) {
      THEME_ACCENT_FAMILIES.forEach((accent) => {
        const accentId = normalizeAccentFamily(accent.id);
        if (!accentId || seenColorIds.has(accentId)) return;
        seenColorIds.add(accentId);
        orderedColorIds.push(accentId);
      });
    }

    const grid = document.createElement("div");
    grid.className = "zip-context-menu-theme-grid";
    orderedColorIds.forEach((colorId) => {
      const accentMeta = getAccentFamilyMeta(colorId);
      if (!accentMeta) return;
      const accentId = normalizeAccentFamily(accentMeta.id);
      const accentTheme = getThemeOptionByStopAndAccent(stopId, accentId, options);
      const accentThemeId = normalizeThemeId(accentTheme.id);
      const swatchTheme = {
        id: accentThemeId,
        label: accentTheme.label,
        spectrumColorStop: stopMeta.spectrumColorStop,
        themeColorStop: stopId,
        paletteSet: stopMeta.paletteSet,
        accentFamily: accentId
      };
      const colorBtn = document.createElement("button");
      colorBtn.type = "button";
      colorBtn.className = "zip-context-menu-theme-color";
      colorBtn.setAttribute("role", "menuitemradio");
      colorBtn.setAttribute("data-theme-id", accentThemeId);
      colorBtn.dataset.spectrumToken = String(accentMeta.spectrumToken || "");
      colorBtn.dataset.recommendedForeground = String(accentMeta.recommendedForeground || "");
      colorBtn.dataset.themeColorId = accentId;
      const isSelected = accentThemeId === activeThemeId;
      colorBtn.classList.toggle("is-selected", isSelected);
      colorBtn.setAttribute("aria-checked", isSelected ? "true" : "false");
      const titleParts = [String(accentMeta.name || accentMeta.label || accentId)];
      if (accentMeta.spectrumToken) titleParts.push(String(accentMeta.spectrumToken));
      if (accentMeta.notes) titleParts.push(String(accentMeta.notes));
      colorBtn.title = titleParts.join(" • ");
      colorBtn.setAttribute(
        "aria-label",
        String(accentMeta.name || accentId) + (isSelected ? " (active)" : "")
      );
      applyThemeSwatchStyles(colorBtn, swatchTheme);

      const swatchChip = document.createElement("span");
      swatchChip.className = "zip-context-menu-theme-chip";
      swatchChip.setAttribute("aria-hidden", "true");
      const nameEl = document.createElement("span");
      nameEl.className = "zip-context-menu-theme-color-name";
      nameEl.textContent = String(accentMeta.name || accentMeta.label || accentId);
      colorBtn.appendChild(swatchChip);
      colorBtn.appendChild(nameEl);

      colorBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const requestedThemeId = normalizeThemeId(accentThemeId);
        setThemeViaBackground(requestedThemeId).catch((err) => {
          setStatus("Theme update failed: " + (err && err.message ? err.message : "Unknown error"), true);
        });
      });
      grid.appendChild(colorBtn);
    });
    list.appendChild(grid);

    flyout.appendChild(list);
    flyout.classList.remove("hidden");
    flyout.setAttribute("data-theme-stop", stopId);
    state.themeFlyoutStop = stopId;
    updateThemeFlyoutParentState();
    requestAnimationFrame(() => {
      positionThemeFlyout(anchorEl);
    });
  }

  function toggleThemeFlyout(themeColorStop, anchorEl) {
    const stopId = normalizeThemeColorStop(themeColorStop);
    const isOpen = !!(els.contextMenuThemeFlyout
      && !els.contextMenuThemeFlyout.classList.contains("hidden")
      && normalizeThemeColorStop(state.themeFlyoutStop) === stopId);
    if (isOpen) {
      hideThemeFlyout();
      return;
    }
    renderThemeFlyout(stopId, anchorEl);
  }

  function refreshThemeFlyoutPosition() {
    if (!els.contextMenuThemeFlyout || els.contextMenuThemeFlyout.classList.contains("hidden")) return;
    const stopId = normalizeThemeColorStop(state.themeFlyoutStop);
    if (!stopId || !els.contextMenuThemeColorToggle) {
      hideThemeFlyout();
      return;
    }
    positionThemeFlyout(els.contextMenuThemeColorToggle);
  }

  function renderContextMenuThemePicker() {
    const options = getThemeOptions();
    const activeTheme = getThemeOptionById(state.themeId, options);
    const activeStop = getThemeColorStopMeta(activeTheme.themeColorStop);
    const activeAccent = normalizeAccentFamily(activeTheme.accentFamily);
    const openStopRaw = String(state.themeFlyoutStop || "").trim().toLowerCase();
    const openStop = openStopRaw ? normalizeThemeColorStop(openStopRaw) : "";

    if (els.contextMenuThemeStopToggle) {
      els.contextMenuThemeStopToggle.textContent = activeStop.label;
      els.contextMenuThemeStopToggle.title = "Toggle light/dark theme (currently " + activeStop.label + ")";
    }
    if (els.contextMenuThemeColorToggle) {
      const accentLabel = getAccentFamilyLabel(activeAccent);
      els.contextMenuThemeColorToggle.textContent = accentLabel;
      applyThemeSwatchStyles(els.contextMenuThemeColorToggle, activeTheme);
    }

    if (openStop && els.contextMenuThemeColorToggle) {
      renderThemeFlyout(openStop, els.contextMenuThemeColorToggle);
      return;
    }
    hideThemeFlyout();
  }

  function toggleContextMenuThemeStop() {
    const options = getThemeOptions();
    const activeTheme = getThemeOptionById(state.themeId, options);
    const currentStop = normalizeThemeColorStop(activeTheme.themeColorStop);
    const nextStop = currentStop === "dark" ? "light" : "dark";
    const nextTheme = getThemeOptionByStopAndAccent(nextStop, normalizeAccentFamily(activeTheme.accentFamily), options);
    const keepFlyoutOpen = !!(els.contextMenuThemeFlyout && !els.contextMenuThemeFlyout.classList.contains("hidden"));
    state.themeFlyoutStop = keepFlyoutOpen ? nextStop : "";
    setThemeViaBackground(nextTheme.id).catch((err) => {
      setStatus("Theme update failed: " + (err && err.message ? err.message : "Unknown error"), true);
    });
  }

  function toggleContextMenuThemeColorFlyout() {
    const options = getThemeOptions();
    const activeTheme = getThemeOptionById(state.themeId, options);
    const stopId = normalizeThemeColorStop(activeTheme.themeColorStop);
    if (!els.contextMenuThemeColorToggle) return;
    toggleThemeFlyout(stopId, els.contextMenuThemeColorToggle);
  }

  function applyThemeState(themePayload) {
    const payload = themePayload && typeof themePayload === "object" ? themePayload : {};
    state.themeId = normalizeThemeId(payload.themeId || state.themeId);
    if (Array.isArray(payload.options) && payload.options.length) {
      state.themeOptions = payload.options.map((option) => normalizeThemeOption(option));
    }
    const activeTheme = getThemeOptionById(state.themeId);
    document.body.dataset.zipTheme = state.themeId;
    document.body.dataset.zipThemeAccent = activeTheme.accentFamily;
    if (document.documentElement) {
      document.documentElement.dataset.zipTheme = state.themeId;
      document.documentElement.dataset.zipThemeAccent = activeTheme.accentFamily;
    }
    applySpectrumColorStopClass(activeTheme.themeColorStop);
    applyThemeAccentVariables(activeTheme);
    renderContextMenuThemePicker();
  }

  function loadThemeState() {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
        applyThemeState({ themeId: DEFAULT_THEME_ID, options: getFallbackThemeOptions() });
        resolve({ themeId: DEFAULT_THEME_ID, options: getFallbackThemeOptions() });
        return;
      }
      chrome.runtime.sendMessage({ type: "ZIP_GET_THEME" }, (response) => {
        if (chrome.runtime.lastError) {
          applyThemeState({ themeId: DEFAULT_THEME_ID, options: getFallbackThemeOptions() });
          resolve({ themeId: DEFAULT_THEME_ID, options: getFallbackThemeOptions() });
          return;
        }
        const payload = response && typeof response === "object" ? response : {};
        applyThemeState(payload);
        resolve(payload);
      });
    });
  }

  function setThemeViaBackground(themeId) {
    return new Promise((resolve, reject) => {
      if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
        reject(new Error("Runtime unavailable"));
        return;
      }
      chrome.runtime.sendMessage({ type: "ZIP_SET_THEME", themeId: normalizeThemeId(themeId) }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || "Theme update failed"));
          return;
        }
        if (response && response.ok === false) {
          reject(new Error(response.error || "Theme update failed"));
          return;
        }
        applyThemeState(response || { themeId: normalizeThemeId(themeId) });
        setStatus("Theme updated to " + getThemeLabelById(normalizeThemeId(themeId)) + ".", false);
        resolve(response || {});
      });
    });
  }

  function getThemeLabelById(themeId) {
    const normalized = normalizeThemeId(themeId);
    const options = getThemeOptions();
    const match = options.find((option) => option.id === normalized);
    return match ? match.label : "Spectrum 2 Theme";
  }

  function setContextMenuBackdropVisible(visible) {
    if (!els.contextMenuBackdrop) return;
    const show = !!visible;
    els.contextMenuBackdrop.classList.toggle("hidden", !show);
    els.contextMenuBackdrop.setAttribute("aria-hidden", show ? "false" : "true");
  }

  function hideContextMenu() {
    hideThemeFlyout();
    setContextMenuBackdropVisible(false);
    if (!els.contextMenu) return;
    els.contextMenu.classList.add("hidden");
  }

  function applyContextMenuUpdateState(updateInfo) {
    if (!els.contextMenuGetLatest) return;
    const showGetLatest = !!(updateInfo && updateInfo.updateAvailable);
    els.contextMenuGetLatest.classList.toggle("hidden", !showGetLatest);
  }

  function loadContextMenuUpdateState(force) {
    return new Promise((resolve) => {
      if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
        applyContextMenuUpdateState(null);
        resolve(null);
        return;
      }
      chrome.runtime.sendMessage({ type: "ZIP_GET_UPDATE_STATE", force: !!force }, (response) => {
        if (chrome.runtime.lastError) {
          applyContextMenuUpdateState(null);
          resolve(null);
          return;
        }
        const info = response || null;
        applyContextMenuUpdateState(info);
        resolve(info);
      });
    });
  }

  function showContextMenuAt(clientX, clientY) {
    if (!els.contextMenu) return;
    if (!state.user) return;
    const menu = els.contextMenu;
    hideThemeFlyout();
    renderContextMenuThemePicker();
    syncContextMenuAuthVisibility();
    syncContextMenuZdApiToggleLabel();
    menu.classList.remove("hidden");
    setContextMenuBackdropVisible(true);
    function placeMenu() {
      menu.style.left = "0px";
      menu.style.top = "0px";
      const rect = menu.getBoundingClientRect();
      const pad = 6;
      const maxLeft = Math.max(pad, window.innerWidth - rect.width - pad);
      const maxTop = Math.max(pad, window.innerHeight - rect.height - pad);
      const left = Math.min(Math.max(clientX, pad), maxLeft);
      const top = Math.min(Math.max(clientY, pad), maxTop);
      menu.style.left = left + "px";
      menu.style.top = top + "px";
    }
    placeMenu();
    loadContextMenuUpdateState(false)
      .then(() => {
        if (els.contextMenu && !els.contextMenu.classList.contains("hidden")) placeMenu();
      })
      .catch(() => {});
  }

  function sendContextMenuAction(action) {
    return new Promise((resolve, reject) => {
      if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
        reject(new Error("Runtime unavailable"));
        return;
      }
      chrome.runtime.sendMessage({ type: "ZIP_CONTEXT_MENU_ACTION", action }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || "Action failed"));
          return;
        }
        resolve(response || {});
      });
    });
  }

  async function runContextMenuAction(action) {
    hideContextMenu();
    try {
      const response = await sendContextMenuAction(action);
      if (action === "toggleSide") {
        await loadSidePanelContext();
        if (response && response.needsManualSideChange) {
          setStatus(response.error || "Switch side in Chrome settings, then retry.", false);
          return;
        }
        if (response && response.error) {
          setStatus("Side panel action failed: " + response.error, true);
          return;
        }
        if (response && response.closed) {
          setStatus("ZIP side panel closed.", false);
          return;
        }
        setStatus("ZIP side panel updated.", false);
        return;
      }
      if (action === "askEric") {
        if (response && response.ok === false) {
          setStatus("Ask Eric failed: " + (response.error || "Unknown error"), true);
          return;
        }
        setStatus("Opening Ask Eric email draft…", false);
        return;
      }
      if (action === "getLatest") {
        if (response && response.ok === false) {
          setStatus("Get Latest failed: " + (response.error || "Unknown error"), true);
          return;
        }
        setStatus("Opening latest ZIP package and chrome://extensions…", false);
        return;
      }
      if (action === "clearZipKey") {
        if (response && response.ok === false) {
          setStatus("Clear ZIP.KEY failed: " + (response.error || "Unknown error"), true);
          return;
        }
        await refreshZipSecretConfigFromStorage().catch(() => {});
        showLogin();
        return;
      }
    } catch (err) {
      setStatus("Context menu action failed: " + (err && err.message ? err.message : "Unknown error"), true);
    }
  }

  function sendToZendeskTab(inner) {
    const collectZendeskTabCandidates = async () => {
      const orderedIds = [];
      const pushId = (value) => {
        const numericId = Number(value);
        if (!Number.isFinite(numericId) || numericId <= 0) return;
        if (!orderedIds.includes(numericId)) orderedIds.push(numericId);
      };
      if (state.zendeskTabId != null) pushId(state.zendeskTabId);
      const activeTabId = await getActiveTabId().catch(() => null);
      if (activeTabId != null) pushId(activeTabId);
      const zendeskTabs = await queryZendeskTabsFromSidepanel().catch(() => []);
      if (Array.isArray(zendeskTabs)) {
        for (let i = 0; i < zendeskTabs.length; i += 1) {
          pushId(zendeskTabs[i] && zendeskTabs[i].id);
        }
      }
      return orderedIds;
    };

    const sendOnce = (tabId) => new Promise((resolve, reject) => {
      if (!tabId) {
        reject(new Error("No active tab"));
        return;
      }
      const requestId = "r" + Date.now() + "_" + Math.random().toString(36).slice(2);
      chrome.runtime.sendMessage(
        { type: "ZIP_REQUEST", tabId, requestId, inner },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message || "Extension error"));
            return;
          }
          if (response && response.error) {
            reject(new Error(response.error));
            return;
          }
          if (response && response.result !== undefined) resolve(response.result);
          else if (response && response.type === "ZIP_RESPONSE" && response.result !== undefined) resolve(response.result);
          else resolve(response);
        }
      );
    });

    return (async () => {
      let lastError = null;
      for (let attempt = 1; attempt <= ZENDESK_TAB_RETRY_MAX_ATTEMPTS; attempt += 1) {
        const candidateIds = await collectZendeskTabCandidates();
        if (!candidateIds.length) {
          throw new Error("No active tab");
        }

        for (const candidateId of candidateIds) {
          try {
            const result = await sendOnce(candidateId);
            state.zendeskTabId = candidateId;
            return result;
          } catch (err) {
            lastError = err || null;
            if (state.zendeskTabId === candidateId) state.zendeskTabId = null;
          }
        }

        const message = lastError && lastError.message ? lastError.message : "";
        const canRetry = attempt < ZENDESK_TAB_RETRY_MAX_ATTEMPTS && isTransientZendeskTabErrorMessage(message);
        if (!canRetry) throw lastError || new Error("Unable to reach Zendesk tab");
        await wait(ZENDESK_TAB_RETRY_BASE_DELAY_MS * attempt);
      }
      throw lastError || new Error("Unable to reach Zendesk tab");
    })();
  }

  function sendToSlackTab(inner) {
    const shouldTryNextSlackTabCandidate = (result) => {
      if (!result || typeof result !== "object") return false;
      if (result.ok !== false) return false;
      const message = normalizePassAiCommentBody(result.error || result.message).toLowerCase();
      if (!message) return false;
      if (message.includes("not a slack tab")) return true;
      if (message.includes("session token not found")) return true;
      if (message.includes("no slack web session token")) return true;
      if (message.includes("complete login first")) return true;
      if (message.includes("login first")) return true;
      if (String(inner && inner.action || "") === "slackAuthTest" && message.includes("slack session unavailable")) {
        return true;
      }
      return false;
    };

    const workspaceOrigin = normalizeSlackWorkspaceOriginForTabs(inner && inner.workspaceOrigin);

    const sendOnce = (tabId) => new Promise((resolve, reject) => {
      if (!tabId) {
        reject(new Error("No Slack tab available"));
        return;
      }
      const requestId = "s" + Date.now() + "_" + Math.random().toString(36).slice(2);
      chrome.runtime.sendMessage(
        { type: "ZIP_REQUEST", tabId, requestId, inner },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message || "Extension error"));
            return;
          }
          if (response && response.error) {
            reject(new Error(response.error));
            return;
          }
          if (response && response.result !== undefined) resolve(response.result);
          else if (response && response.type === "ZIP_RESPONSE" && response.result !== undefined) resolve(response.result);
          else resolve(response);
        }
      );
    });

    return (async () => {
      let lastError = null;
      for (let attempt = 1; attempt <= SLACK_TAB_RETRY_MAX_ATTEMPTS; attempt += 1) {
        let candidateIds = await getSlackTabCandidates({
          injectableOnly: true,
          includeBackground: true,
          workspaceOrigin
        }).catch(() => []);
        if (!candidateIds.length && String(inner && inner.action || "") === "slackAuthTest") {
          candidateIds = await getSlackTabCandidates({
            injectableOnly: false,
            includeBackground: true,
            workspaceOrigin
          }).catch(() => []);
        }
        if (!candidateIds.length) {
          throw new Error("No Slack tab available. Click the Slack indicator to sign in first.");
        }

        for (const candidateId of candidateIds) {
          try {
            const result = await sendOnce(candidateId);
            if (shouldTryNextSlackTabCandidate(result)) {
              const retryMessage = String(result.error || result.message || "").trim();
              lastError = new Error(retryMessage || "Slack tab is not ready yet.");
              if (state.slackTabId === candidateId) state.slackTabId = null;
              continue;
            }
            state.slackTabId = candidateId;
            return result;
          } catch (err) {
            lastError = err || null;
            if (state.slackTabId === candidateId) state.slackTabId = null;
          }
        }

        if (attempt >= SLACK_TAB_RETRY_MAX_ATTEMPTS) break;
        await wait(SLACK_TAB_RETRY_BASE_DELAY_MS * attempt);
      }
      throw lastError || new Error("Unable to reach Slack tab.");
    })();
  }

  function isSlackWebBootstrapErrorMessage(message) {
    const text = String(message || "").toLowerCase();
    if (!text) return false;
    if (text.includes("no slack tab available")) return true;
    if (text.includes("not a slack tab")) return true;
    if (text.includes("could not establish connection")) return true;
    if (text.includes("receiving end does not exist")) return true;
    if (text.includes("session token not found")) return true;
    if (text.includes("no slack web session token")) return true;
    if (text.includes("slack session unavailable")) return true;
    if (text.includes("complete login first")) return true;
    if (text.includes("login first")) return true;
    return false;
  }

  function isTransientSlackAuthProbeFailureMessage(message) {
    const text = String(message || "").toLowerCase();
    if (!text) return false;
    if (isSlackWebBootstrapErrorMessage(text)) return true;
    return (
      text.includes("waiting for web token capture")
      || text.includes("slack tab is not ready yet")
    );
  }

  function isSlackApiTokenInvalidationCode(code) {
    const normalized = String(code || "").trim().toLowerCase();
    if (!normalized) return false;
    return normalized === "account_inactive"
      || normalized === "invalid_auth"
      || normalized === "token_revoked"
      || normalized === "not_authed";
  }

  async function enrichPassAiSlackIdentityFromExistingTab(options) {
    const opts = options && typeof options === "object" ? options : {};
    const force = !!opts.force;
    const nowMs = Date.now();
    if (!force && nowMs - Number(slackIdentityEnrichmentLastAt || 0) < SLACK_IDENTITY_ENRICH_MIN_GAP_MS) {
      return null;
    }
    slackIdentityEnrichmentLastAt = nowMs;
    try {
      const response = await sendToSlackTab({
        action: "slackAuthTest",
        workspaceOrigin: PASS_AI_SLACK_WORKSPACE_ORIGIN
      });
      const ready = !!(
        response
        && response.ok === true
        && (
          response.ready === true
          || response.ready == null
        )
      );
      if (!ready) return null;
      return {
        userId: String(response.user_id || response.userId || "").trim(),
        userName: String(response.user_name || response.userName || response.display_name || response.displayName || "").trim(),
        avatarUrl: normalizePassAiSlackAvatarUrl(response.avatar_url || response.avatarUrl || ""),
        teamId: String(response.team_id || response.teamId || "").trim(),
        enterpriseId: String(response.enterprise_id || response.enterpriseId || "").trim(),
        userToken: normalizePassAiSlackApiToken(
          response.session_token
          || response.web_token
          || response.user_token
          || response.token
          || ""
        )
      };
    } catch (_) {
      return null;
    }
  }

  async function bootstrapSlackWorkspaceForMessaging(options) {
    const opts = options && typeof options === "object" ? options : {};
    const allowCreateTab = opts.allowCreateTab !== false;
    const workspaceOrigin = normalizeSlackWorkspaceOriginForTabs(PASS_AI_SLACK_WORKSPACE_ORIGIN);
    const landingUrl = workspaceOrigin + "/";
    const findInjectableTab = async () => {
      const injectableTabs = await querySlackTabsFromSidepanel({
        injectableOnly: true,
        workspaceOrigin
      }).catch(() => []);
      if (!Array.isArray(injectableTabs) || !injectableTabs.length) return null;
      const candidateId = Number(injectableTabs[0] && injectableTabs[0].id);
      if (!Number.isFinite(candidateId) || candidateId <= 0) return null;
      return candidateId;
    };

    const existingInjectableId = await findInjectableTab();
    if (existingInjectableId != null) {
      state.slackTabId = existingInjectableId;
      return true;
    }

    let candidateTabId = null;
    const workspaceTabs = await querySlackTabsFromSidepanel({
      injectableOnly: false,
      workspaceOrigin
    }).catch(() => []);
    if (Array.isArray(workspaceTabs) && workspaceTabs.length > 0 && workspaceTabs[0] && workspaceTabs[0].id != null) {
      candidateTabId = Number(workspaceTabs[0].id);
      if (Number.isFinite(candidateTabId) && candidateTabId > 0) {
        try {
          await new Promise((resolve) => {
            if (!chrome || !chrome.tabs || typeof chrome.tabs.update !== "function") {
              resolve();
              return;
            }
            chrome.tabs.update(candidateTabId, { url: landingUrl, active: false }, () => {
              void chrome.runtime.lastError;
              resolve();
            });
          });
        } catch (_) {}
      }
    } else if (allowCreateTab) {
      const opened = await openSlackWorkspaceTab(landingUrl, { active: false }).catch(() => null);
      const openedTabId = Number(opened && opened.tabId);
      if (Number.isFinite(openedTabId) && openedTabId > 0) {
        candidateTabId = openedTabId;
      }
    } else {
      return false;
    }

    if (!Number.isFinite(candidateTabId) || candidateTabId <= 0) {
      return false;
    }
    state.slackTabId = candidateTabId;

    const deadlineMs = Date.now() + 8000;
    while (Date.now() < deadlineMs) {
      await wait(350);
      const readyTabId = await findInjectableTab();
      if (readyTabId != null) {
        state.slackTabId = readyTabId;
        return true;
      }
    }
    return false;
  }

  async function sendToSlackTabWithAutoBootstrap(inner, options) {
    const opts = options && typeof options === "object" ? options : {};
    const canBootstrap = opts.bootstrap !== false;
    const bootstrapAllowCreateTab = opts.allowCreateTab !== false;
    const onBootstrap = typeof opts.onBootstrap === "function" ? opts.onBootstrap : null;
    let bootstrapAttempted = false;
    const tryBootstrap = async () => {
      if (!canBootstrap || bootstrapAttempted) return false;
      if (slackBootstrapInFlight) return false;
      const nowMs = Date.now();
      if (nowMs - Number(slackBootstrapLastAt || 0) < SLACK_BOOTSTRAP_MIN_GAP_MS) return false;
      bootstrapAttempted = true;
      slackBootstrapInFlight = true;
      slackBootstrapLastAt = nowMs;
      if (onBootstrap) {
        try { onBootstrap(); } catch (_) {}
      }
      try {
        return await bootstrapSlackWorkspaceForMessaging({ allowCreateTab: bootstrapAllowCreateTab });
      } finally {
        slackBootstrapInFlight = false;
      }
    };

    let response = null;
    try {
      response = await sendToSlackTab(inner);
    } catch (err) {
      const message = normalizePassAiCommentBody(err && err.message);
      if (!isSlackWebBootstrapErrorMessage(message) || !(await tryBootstrap())) {
        throw err;
      }
      response = await sendToSlackTab(inner);
    }

    const responseMessage = normalizePassAiCommentBody(response && (response.error || response.message));
    if ((!response || response.ok !== true) && isSlackWebBootstrapErrorMessage(responseMessage)) {
      const bootstrapped = await tryBootstrap();
      if (bootstrapped) {
        response = await sendToSlackTab(inner);
      }
    }
    return response;
  }

  function ensureAssignedFilterTabOpen() {
    return new Promise((resolve, reject) => {
      if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
        reject(new Error("Runtime unavailable"));
        return;
      }
      chrome.runtime.sendMessage(
        { type: "ZIP_ENSURE_ASSIGNED_FILTER_TAB", url: ASSIGNED_FILTER_URL },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message || "Unable to open assigned filter"));
            return;
          }
          if (response && response.ok === false) {
            reject(new Error(response.error || "Unable to open assigned filter"));
            return;
          }
          resolve(response || { ok: true });
        }
      );
    });
  }

  function updateTicketNetworkIndicator() {
    if (!els.ticketNetworkIndicator) return;
    const activeLoads = [];
    if (state.ticketTableLoading) activeLoads.push("Tickets");
    if (state.groupSelectLoading) activeLoads.push("By Group");
    if (state.viewSelectLoading) activeLoads.push("By View");
    if (state.orgSelectLoading) activeLoads.push("By Org");
    const isLoading = activeLoads.length > 0;
    els.ticketNetworkIndicator.classList.toggle("hidden", !isLoading);
    if (els.ticketNetworkLabel && isLoading) {
      els.ticketNetworkLabel.textContent = "Loading " + activeLoads.join(" + ");
    }
  }

  function isZendeskActivityLoading() {
    return !!(
      state.busy
      || state.ticketTableLoading
      || state.orgSelectLoading
      || state.viewSelectLoading
      || state.groupSelectLoading
    );
  }

  function isSlackActivityLoading() {
    return !!(
      state.passAiLoading
      || state.passAiConversationInFlight
      || state.passAiSlackAuthPolling
      || state.passAiDeleteInFlight
      || state.slackItToMeLoading
      || slackAuthCheckInFlight
    );
  }

  function isUiActionLoading() {
    return !!(
      isZendeskActivityLoading()
      || isSlackActivityLoading()
    );
  }

  function applyGlobalBusyUi() {
    const isLoading = isUiActionLoading();
    const zendeskLoading = isZendeskActivityLoading();
    const slackLoading = isSlackActivityLoading();
    if (document && document.body && document.body.classList) {
      document.body.classList.toggle("zip-busy-cursor", isLoading);
    }
    if (els.topAvatarWrap) {
      els.topAvatarWrap.classList.toggle("loading", zendeskLoading);
      els.topAvatarWrap.title = zendeskLoading
        ? "Zendesk activity in progress…"
        : (els.topAvatarWrap.dataset.idleTitle || "Not logged in");
    }
    if (els.slacktivatedBtn) {
      const showSlackSpinner = !!(state.user && slackLoading);
      els.slacktivatedBtn.classList.toggle("is-network-loading", showSlackSpinner);
      els.slacktivatedBtn.setAttribute("aria-busy", showSlackSpinner ? "true" : "false");
    }
    if (els.status) {
      const shouldShowLoading = isLoading && !els.status.classList.contains("error");
      els.status.classList.toggle("loading", shouldShowLoading);
      if (shouldShowLoading) els.status.classList.remove("notice");
    }
  }

  function applyTicketTableLoadingUi() {
    const isLoading = !!state.ticketTableLoading;
    if (els.ticketTableWrap) {
      els.ticketTableWrap.classList.toggle("ticket-table-loading", isLoading);
      els.ticketTableWrap.setAttribute("aria-busy", isLoading ? "true" : "false");
    }
  }

  function setTicketTableLoading(on) {
    const isLoading = !!on;
    if (state.ticketTableLoading === isLoading) return;
    state.ticketTableLoading = isLoading;
    applyTicketTableLoadingUi();
    updateTicketNetworkIndicator();
    applyGlobalBusyUi();
    if (!state.filteredTickets.length) renderTicketRows();
  }

  function setBusy(on) {
    state.busy = !!on;
    if (els.apiRunBtn) els.apiRunBtn.disabled = state.busy;
    applyGlobalBusyUi();
  }

  function setOrgSelectLoading(on) {
    const isLoading = !!on;
    state.orgSelectLoading = isLoading;
    if (els.orgSelect) {
      els.orgSelect.setAttribute("aria-busy", isLoading ? "true" : "false");
      els.orgSelect.disabled = isLoading;
    }
    updateTicketNetworkIndicator();
    applyGlobalBusyUi();
  }

  function setViewSelectLoading(on) {
    const isLoading = !!on;
    state.viewSelectLoading = isLoading;
    if (els.viewSelect) {
      els.viewSelect.setAttribute("aria-busy", isLoading ? "true" : "false");
      els.viewSelect.disabled = isLoading;
    }
    updateTicketNetworkIndicator();
    applyGlobalBusyUi();
  }

  function setGroupSelectLoading(on) {
    const isLoading = !!on;
    state.groupSelectLoading = isLoading;
    if (els.groupMemberSelect) {
      els.groupMemberSelect.setAttribute("aria-busy", isLoading ? "true" : "false");
      els.groupMemberSelect.disabled = isLoading;
    }
    updateTicketNetworkIndicator();
    applyGlobalBusyUi();
  }

  function setStatus(msg, isError) {
    if (!els.status) return;
    els.status.textContent = msg || DEFAULT_FOOTER_HINT;
    els.status.classList.toggle("error", !!isError);
    if (isError) {
      els.status.classList.remove("loading");
      els.status.classList.remove("notice");
      return;
    }
    const text = String(msg || "").trim().toLowerCase();
    const isNotice = text.includes("temporarily unavailable")
      || text.includes("switch side")
      || text.includes("opening login")
      || text.includes("opening latest");
    els.status.classList.toggle("notice", isNotice);
    const stillLoading = !!(state.busy || state.ticketTableLoading || state.orgSelectLoading || state.viewSelectLoading || state.groupSelectLoading);
    if (!stillLoading) els.status.classList.remove("loading");
  }

  function hideToast() {
    if (!els.toast) return;
    els.toast.classList.add("hidden");
    els.toast.textContent = "";
    if (toastHideTimerId != null) {
      window.clearTimeout(toastHideTimerId);
      toastHideTimerId = null;
    }
  }

  function showToast(message, durationMs) {
    if (!els.toast) return;
    const text = String(message || "").trim();
    if (!text) return;
    if (toastHideTimerId != null) {
      window.clearTimeout(toastHideTimerId);
      toastHideTimerId = null;
    }
    els.toast.textContent = text;
    els.toast.classList.remove("hidden");
    const delay = Math.max(300, Number(durationMs) || 2000);
    toastHideTimerId = window.setTimeout(() => {
      hideToast();
    }, delay);
  }

  function setRawTitle(path) {
    state.lastApiPath = path || state.lastApiPath;
    if (els.rawTitle) els.rawTitle.textContent = "GET " + (state.lastApiPath || "/api/v2/users/me");
    updateRawDownloadLink();
  }

  function getDownloadFilename() {
    const request = state.lastApiRequest && typeof state.lastApiRequest === "object" ? state.lastApiRequest : null;
    const callPath = request && request.specPath
      ? String(request.specPath)
      : String(state.lastApiPath || "response");
    const pathPart = sanitizeFilenamePart(callPath.replace(/^\//, "").replace(/\//g, "-").replace(/[{}]/g, ""), 80) || "response";
    const parts = ["zdapi", pathPart];
    if (request && Array.isArray(request.params) && request.params.length) {
      const paramParts = request.params
        .map((param) => {
          const name = sanitizeFilenamePart(param && param.name ? param.name : "", 24);
          if (!name) return "";
          const rawValue = param && param.value != null ? String(param.value).trim() : "";
          const value = sanitizeFilenamePart(rawValue || "blank", 60);
          return name + "-" + value;
        })
        .filter(Boolean)
        .slice(0, 8);
      if (paramParts.length) parts.push(paramParts.join("_"));
    }
    const stem = parts.join("_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
    const boundedStem = stem.length > 220 ? stem.slice(0, 220).replace(/[_-]+$/g, "") : stem;
    return boundedStem + ".json";
  }

  function updateRawDownloadLink() {
    if (!els.rawDownload) return;
    const hasPayload = state.lastApiPayloadString != null && state.lastApiPayloadString !== "";
    els.rawDownload.style.visibility = hasPayload ? "visible" : "hidden";
    els.rawDownload.download = getDownloadFilename();
  }

  function renderPassAiSlackAuthStatus() {
    // Legacy no-op: old in-panel Slack login status UI was removed in favor of SLACKTIVATED.
  }

  function hasPassAiRenderedAnswer() {
    return !!(
      els.passAiDynamicReplyHost
      && !els.passAiDynamicReplyHost.classList.contains("hidden")
      && String(els.passAiDynamicReplyHost.textContent || "").trim()
    );
  }

  function updatePassAiAnswerPlaceholder() {
    if (!els.passAiAnswerPlaceholder) return;
    const hasRenderedAnswer = hasPassAiRenderedAnswer();
    const showInline = !!(els.passAiInlineStatus && !els.passAiInlineStatus.classList.contains("hidden"));
    const shouldShow = !hasRenderedAnswer && !showInline;
    els.passAiAnswerPlaceholder.classList.toggle("hidden", !shouldShow);
  }

  function ensurePassAiActionLayout() {
    if (!els.passAiResultsBox || !els.passAiQuestion) return;

    if (!els.askPassAiBtn) els.askPassAiBtn = $("zipAskPassAiBtn");
    if (!els.passAiSubmitHint) els.passAiSubmitHint = $("zipPassAiSubmitHint");
    if (!els.passAiCtaZone) els.passAiCtaZone = $("zipPassAiCtaZone");
    if (!els.passAiSubmitWrap) els.passAiSubmitWrap = $("zipPassAiSubmitWrap");
    if (!els.passAiQuestionLabel) els.passAiQuestionLabel = $("zipPassAiQuestionLabel");
    if (!els.passAiError) els.passAiError = $("zipPassAiError");
    if (!els.passAiAnswerBlock) els.passAiAnswerBlock = $("zipPassAiAnswerBlock");
    if (!els.passAiAnswerPlaceholder) els.passAiAnswerPlaceholder = $("zipPassAiAnswerPlaceholder");
    if (!els.passAiDynamicReplyHost) els.passAiDynamicReplyHost = $("zipPassAiDynamicReplyHost");
    if (!els.passAiInlineStatus) els.passAiInlineStatus = $("zipPassAiInlineStatus");

    if (els.passAiSubmitWrap && els.askPassAiBtn && els.askPassAiBtn.parentElement !== els.passAiSubmitWrap) {
      els.passAiSubmitWrap.appendChild(els.askPassAiBtn);
    }
    if (els.passAiCtaZone && els.passAiSubmitHint && els.passAiSubmitHint.parentElement !== els.passAiCtaZone) {
      els.passAiCtaZone.appendChild(els.passAiSubmitHint);
    }

    if (els.passAiAnswerBlock && els.passAiDynamicReplyHost && els.passAiDynamicReplyHost.parentElement !== els.passAiAnswerBlock) {
      els.passAiAnswerBlock.appendChild(els.passAiDynamicReplyHost);
    }
    if (els.passAiAnswerBlock && els.passAiInlineStatus && els.passAiInlineStatus.parentElement !== els.passAiAnswerBlock) {
      els.passAiAnswerBlock.appendChild(els.passAiInlineStatus);
    }

    renderPassAiSlackAuthStatus();
    updatePassAiAnswerPlaceholder();
  }

  function isPassAiSlacktivated() {
    return !!(state.passAiSlackReady && state.passAiSlackWebReady);
  }

  async function openPassAiPanelForSelectedTicket() {
    if (!isPassAiSlacktivated()) {
      setStatus(SLACKTIVATED_LOGIN_TOOLTIP, true);
      updateTicketActionButtons();
      return;
    }
    const selectedTicketId = getSelectedPassAiTicketId();
    if (selectedTicketId == null) {
      setStatus("Select a ticket first, then open Q and AI.", true);
      return;
    }
    state.passAiPanelVisible = true;
    updateTicketActionButtons();
    try {
      await loadLatestQuestionForTicket(selectedTicketId, { silentError: false });
    } catch (_) {}
    updateTicketActionButtons();
  }

  function closePassAiPanel() {
    state.passAiPanelVisible = false;
    clearPassAiResultsDisplay();
    updateTicketActionButtons();
  }

  async function togglePassAiPanelForSelectedTicket() {
    if (state.passAiPanelVisible) {
      closePassAiPanel();
      return;
    }
    if (!isPassAiSlacktivated()) {
      setStatus(SLACKTIVATED_LOGIN_TOOLTIP, true);
      updateTicketActionButtons();
      return;
    }
    await openPassAiPanelForSelectedTicket();
  }

  function getSlacktivatedDisplayName() {
    const bySlack = String(state.passAiSlackUserName || "").trim();
    if (bySlack) return bySlack;
    const byZendesk = String(state.user && state.user.name || "").trim();
    if (byZendesk) return byZendesk;
    const byEmail = String(state.user && state.user.email || "").trim();
    return byEmail || "there";
  }

  function syncSlacktivatedIndicator() {
    if (els.slacktivatedIcon) {
      const defaultSrc = String(
        (els.slacktivatedIcon.dataset && els.slacktivatedIcon.dataset.defaultSrc)
        || els.slacktivatedIcon.getAttribute("src")
        || SLACKTIVATED_PENDING_ICON_URL
      ).trim() || SLACKTIVATED_PENDING_ICON_URL;
      const avatar = String(state.passAiSlackAvatarUrl || "").trim();
      const useAvatar = !!(isPassAiSlacktivated() && avatar);
      els.slacktivatedIcon.src = useAvatar ? avatar : defaultSrc;
      els.slacktivatedIcon.alt = useAvatar
        ? ("Slack avatar for " + getSlacktivatedDisplayName())
        : "ZIP Slack app status";
    }
    if (els.slacktivatedBtn) {
      const ready = isPassAiSlacktivated();
      els.slacktivatedBtn.classList.toggle("is-slacktivated", ready);
      els.slacktivatedBtn.classList.toggle("is-slack-pending", !ready);
      const title = ready
        ? ("Hey " + getSlacktivatedDisplayName() + ", ZIP is SLACKTIVATED!!!")
        : SLACKTIVATED_LOGIN_TOOLTIP;
      els.slacktivatedBtn.title = title;
      els.slacktivatedBtn.setAttribute("aria-label", title);
      els.slacktivatedBtn.disabled = !state.user;
    }
  }

  function updateTicketActionButtons() {
    ensurePassAiActionLayout();

    const hasRows = Array.isArray(state.filteredTickets) && state.filteredTickets.length > 0;
    if (els.exportCsvBtn) els.exportCsvBtn.disabled = !hasRows;
    const selectedTicketId = getSelectedPassAiTicketId();
    const hasSelectedTicket = selectedTicketId != null;
    const slackReady = isPassAiSlacktivated();
    syncSlacktivatedIndicator();

    if (els.slackItToMeBtn) {
      const canUseSlackItToMe = slackReady
        && !state.passAiSlackAuthPolling
        && !state.slackItToMeLoading;
      const slackItToMeTitle = slackReady ? "SLACK IT TO ME" : SLACKTIVATED_LOGIN_TOOLTIP;
      els.slackItToMeBtn.classList.remove("hidden");
      els.slackItToMeBtn.disabled = !canUseSlackItToMe;
      els.slackItToMeBtn.title = slackItToMeTitle;
      els.slackItToMeBtn.setAttribute("aria-label", slackItToMeTitle);
    }

    if (!slackReady && state.passAiPanelVisible && !state.passAiLoading) {
      state.passAiPanelVisible = false;
      clearPassAiResultsDisplay();
    }

    const showPassAiForm = slackReady && hasSelectedTicket && !!state.passAiPanelVisible;
    const showQuestionEditor = showPassAiForm;
    const showAnswerBlock = showQuestionEditor && hasPassAiRenderedAnswer();
    const showSubmitWrap = showPassAiForm;
    const showAskPassAi = showPassAiForm;

    if (!hasSelectedTicket && !state.passAiLoading) {
      state.passAiTicketId = null;
      state.passAiPanelVisible = false;
      clearPassAiResultsDisplay();
    } else if (
      hasSelectedTicket
      && normalizeTicketIdValue(state.passAiTicketId) !== normalizeTicketIdValue(selectedTicketId)
      && !state.passAiLoading
    ) {
      state.passAiTicketId = selectedTicketId;
      clearPassAiResultsDisplay();
    } else if (hasSelectedTicket && state.passAiTicketId == null) {
      state.passAiTicketId = selectedTicketId;
    }

    if (els.passAiToggleBtn) {
      const canUsePassAiToggle = hasSelectedTicket
        && slackReady
        && !state.passAiLoading
        && !state.passAiSlackAuthPolling
        && !state.slackItToMeLoading;
      const passAiTitle = showPassAiForm
        ? "Close Q and AI panel"
        : (
          !slackReady
            ? SLACKTIVATED_LOGIN_TOOLTIP
            : (hasSelectedTicket ? "Open Q and AI panel" : "Select a ticket row to open Q and AI.")
        );
      els.passAiToggleBtn.classList.toggle("hidden", !hasSelectedTicket);
      els.passAiToggleBtn.disabled = !canUsePassAiToggle;
      els.passAiToggleBtn.classList.toggle("is-active", showPassAiForm);
      els.passAiToggleBtn.title = passAiTitle;
      els.passAiToggleBtn.setAttribute("aria-label", passAiTitle);
    }

    if (els.passAiResultsBox) {
      els.passAiResultsBox.classList.toggle("hidden", !showPassAiForm);
    }
    if (els.passAiAnswerBlock) {
      els.passAiAnswerBlock.classList.toggle("hidden", !showAnswerBlock);
    }

    if (showPassAiForm) {
      setPassAiQuestionLabel(selectedTicketId);
    }
    if (els.passAiQuestionLabel) {
      els.passAiQuestionLabel.classList.toggle("hidden", !showQuestionEditor);
    }
    if (els.passAiQuestion) {
      els.passAiQuestion.classList.toggle("hidden", !showQuestionEditor);
    }

    if (els.passAiSubmitWrap) {
      els.passAiSubmitWrap.classList.toggle("hidden", !showSubmitWrap);
    }
    if (els.passAiCtaZone) {
      els.passAiCtaZone.classList.toggle("hidden", !showSubmitWrap);
    }
    if (els.passAiSubmitHint) {
      els.passAiSubmitHint.classList.toggle("hidden", !showAskPassAi);
    }
    if (els.askPassAiBtn) {
      els.askPassAiBtn.classList.toggle("hidden", !showAskPassAi);
      els.askPassAiBtn.disabled = !showAskPassAi || state.passAiLoading;
    }
    renderPassAiSlackAuthStatus();
    if (els.passAiInlineStatus) {
      const showInline = showQuestionEditor && hasSelectedTicket && state.passAiLoading;
      els.passAiInlineStatus.classList.toggle("hidden", !showInline);
    }
    updatePassAiAnswerPlaceholder();
    applyGlobalBusyUi();
  }

  function sanitizeFilenamePart(value, maxLength) {
    const limit = Number(maxLength);
    const maxLen = Number.isFinite(limit) && limit > 0 ? Math.trunc(limit) : 40;
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, maxLen);
  }

  function getSelectedText(selectEl) {
    if (!selectEl || !selectEl.selectedOptions || !selectEl.selectedOptions.length) return "";
    return String(selectEl.selectedOptions[0].textContent || "").trim();
  }

  function normalizeTicketSourceLabel(label, fallback) {
    const fallbackLabel = String(fallback || "").trim();
    const raw = String(label || "").replace(/\s+/g, " ").trim();
    if (!raw) return fallbackLabel;
    if (/^by\s+(view|organization|group\s*\/\s*agent)$/i.test(raw)) return fallbackLabel;
    if (/^(active|inactive)\s*\(/i.test(raw)) return fallbackLabel;
    if (/^[\s\-─]+$/.test(raw)) return fallbackLabel;
    const trimmedCount = raw.replace(/\s+\[\s*\d+\s*\]\s*$/g, "").trim();
    return trimmedCount || fallbackLabel;
  }

  function getActiveTicketSourceContext() {
    const selectedViewId = String(state.selectedViewId || "").trim();
    const selectedOrgId = String(state.selectedOrgId || "").trim();
    const selectedByGroupValue = String(state.selectedByGroupValue || "").trim();
    const currentSource = String(state.ticketSource || "").trim();

    const buildViewContext = () => ({
      kind: "view",
      id: selectedViewId,
      label: normalizeTicketSourceLabel(getSelectedText(els.viewSelect), "View " + selectedViewId),
      filenamePrefix: "view"
    });
    const buildOrgContext = () => ({
      kind: "org",
      id: selectedOrgId,
      label: normalizeTicketSourceLabel(getSelectedText(els.orgSelect), "Organization " + selectedOrgId),
      filenamePrefix: "org"
    });
    const buildGroupContext = () => {
      const parsed = parseGroupFilterValue(selectedByGroupValue);
      const fallbackId = parsed.kind === "group"
        ? parsed.groupId
        : (parsed.kind === "agent" ? parsed.userId : selectedByGroupValue);
      const fallbackLabel = parsed.kind === "group"
        ? ("Group " + (parsed.groupId || selectedByGroupValue))
        : (parsed.kind === "agent" ? ("Agent " + (parsed.userId || selectedByGroupValue)) : selectedByGroupValue);
      return {
        kind: "groupMember",
        id: selectedByGroupValue,
        label: normalizeTicketSourceLabel(getSelectedText(els.groupMemberSelect), fallbackLabel),
        filenamePrefix: parsed.kind === "group" ? "group" : "agent",
        fallbackId
      };
    };

    if (currentSource === "view" && selectedViewId) return buildViewContext();
    if (currentSource === "org" && selectedOrgId) return buildOrgContext();
    if (currentSource === "groupMember" && selectedByGroupValue) return buildGroupContext();
    if (selectedViewId) return buildViewContext();
    if (selectedOrgId) return buildOrgContext();
    if (selectedByGroupValue) return buildGroupContext();
    return {
      kind: "assigned",
      id: "",
      label: "Assigned Tickets",
      filenamePrefix: "assigned"
    };
  }

  function getTicketSourceFilenamePart() {
    const source = getActiveTicketSourceContext();
    if (source.kind === "view") {
      return "view-" + (sanitizeFilenamePart(source.label) || sanitizeFilenamePart(source.id) || "view");
    }
    if (source.kind === "org") {
      return "org-" + (sanitizeFilenamePart(source.label) || sanitizeFilenamePart(source.id) || "organization");
    }
    if (source.kind === "groupMember") {
      const prefix = sanitizeFilenamePart(source.filenamePrefix || "agent") || "agent";
      const sourceId = sanitizeFilenamePart(source.id || source.fallbackId || "");
      return prefix + "-" + (sanitizeFilenamePart(source.label) || sourceId || prefix);
    }
    if (state.user && state.user.email) {
      return "assigned-" + sanitizeFilenamePart(state.user.email.split("@")[0] || state.user.email);
    }
    return "assigned";
  }

  function getTimestampForFilename(includeMs) {
    const d = new Date();
    const p2 = (n) => String(n).padStart(2, "0");
    const core = String(d.getFullYear()) + p2(d.getMonth() + 1) + p2(d.getDate()) + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds());
    if (!includeMs) return core;
    return core + String(d.getMilliseconds()).padStart(3, "0");
  }

  function getTicketCsvFilename() {
    const parts = [
      "zip",
      "tickets",
      getTicketSourceFilenamePart()
    ];
    if (state.statusFilter && state.statusFilter !== "all") parts.push("status-" + sanitizeFilenamePart(state.statusFilter));
    parts.push(getTimestampForFilename());
    return parts.join("_") + ".csv";
  }

  function csvEscape(value) {
    const s = value == null ? "" : String(value);
    return /[",\r\n]/.test(s) ? "\"" + s.replace(/"/g, "\"\"") + "\"" : s;
  }

  function buildVisibleTicketsCsvExportData() {
    const rows = Array.isArray(state.filteredTickets) ? state.filteredTickets.slice() : [];
    const header = ["Ticket", "Ticket URL", "Subject", "Status", "Priority", "Created", "Updated"];
    const csvRows = rows.map((row) => {
      const rowId = row && row.id != null ? row.id : "";
      const rowUrl = (row && row.url && String(row.url).trim()) || (rowId !== "" ? TICKET_URL_PREFIX + rowId : "");
      return [
        rowId !== "" ? "#" + rowId : "",
        rowUrl,
        row && row.subject != null ? row.subject : "",
        row && row.status != null ? row.status : "",
        row && row.priority != null ? row.priority : "",
        row && row.created_at != null ? row.created_at : "",
        row && row.updated_at != null ? row.updated_at : ""
      ];
    });
    const csvString = [header, ...csvRows].map((cols) => cols.map(csvEscape).join(",")).join("\r\n");
    return {
      rows,
      csvString,
      filename: getTicketCsvFilename()
    };
  }

  function exportVisibleTicketsToCsv() {
    const exportData = buildVisibleTicketsCsvExportData();
    const rows = exportData.rows;
    if (!rows.length) {
      setStatus("No tickets are currently visible to export.", false);
      return;
    }
    const csvString = exportData.csvString;
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportData.filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus("CSV exported. " + rows.length + " rows downloaded.", false);
  }

  function escapeSlackMrkdwn(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function sanitizeSlackLinkTarget(value) {
    return String(value == null ? "" : value)
      .trim()
      .replaceAll("<", "%3C")
      .replaceAll(">", "%3E")
      .replaceAll("|", "%7C")
      .replaceAll(" ", "%20");
  }

  function getSlackTicketSourceLabel() {
    const source = getActiveTicketSourceContext();
    return String(source && source.label || "").trim() || "Assigned Tickets";
  }

  function shortenSlackSubject(value, maxLen) {
    const normalized = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    const limit = Number(maxLen) > 0 ? Number(maxLen) : 120;
    if (!normalized) return "(no subject)";
    if (normalized.length <= limit) return normalized;
    return normalized.slice(0, Math.max(8, limit - 1)).trimEnd() + "…";
  }

  function getSlackTicketOwnerLabel(row) {
    const source = row && typeof row === "object" ? row : {};
    const nestedAssignee = source.assignee && typeof source.assignee === "object" ? source.assignee : null;
    const candidates = [
      source.assignee_name,
      source.assigneeName,
      source.owner_name,
      source.ownerName,
      nestedAssignee && nestedAssignee.name,
      nestedAssignee && nestedAssignee.display_name
    ];
    for (let i = 0; i < candidates.length; i += 1) {
      const value = String(candidates[i] == null ? "" : candidates[i]).replace(/\s+/g, " ").trim();
      if (value) return value;
    }
    return "";
  }

  function getSlackTicketEmailAddress(row) {
    const source = row && typeof row === "object" ? row : {};
    const ticketId = source && source.id != null ? String(source.id).trim() : "";
    const cachedEmailResult = ticketId ? getCachedTicketEmailCopyResult(ticketId) : null;
    if (cachedEmailResult && Array.isArray(cachedEmailResult.emails) && cachedEmailResult.emails.length) {
      const cachedExternal = cachedEmailResult.emails.find((entry) => !isAdobeEmailAddress(entry));
      const cachedPrimary = normalizeEmailAddress(cachedExternal || cachedEmailResult.emails[0] || "");
      if (cachedPrimary) return cachedPrimary;
    }
    const nestedRequester = source.requester && typeof source.requester === "object" ? source.requester : null;
    const nestedVia = source.via && typeof source.via === "object" ? source.via : null;
    const viaSource = nestedVia && nestedVia.source && typeof nestedVia.source === "object" ? nestedVia.source : null;
    const viaFrom = viaSource && viaSource.from && typeof viaSource.from === "object" ? viaSource.from : null;
    const candidates = [
      source.requester_email,
      source.requesterEmail,
      source.email,
      source.email_address,
      source.recipient_email,
      source.recipient,
      source.via_email,
      nestedRequester && nestedRequester.email,
      nestedRequester && nestedRequester.primary_email,
      viaFrom && viaFrom.address,
      viaFrom && viaFrom.email
    ];
    for (let i = 0; i < candidates.length; i += 1) {
      const value = normalizeEmailAddress(candidates[i]);
      if (value) return value;
    }
    return "";
  }

  function formatSlackStatusIndicator(value) {
    const normalized = String(value == null ? "" : value).trim().toLowerCase() || "none";
    return "`[" + escapeSlackMrkdwn(normalized) + "]`";
  }

  function buildSlackItToMeMarkdown(rows) {
    const ticketRows = Array.isArray(rows) ? rows : [];
    const cappedRows = ticketRows.slice(0, SLACK_IT_TO_ME_MAX_ROWS);
    const sourceLabel = getSlackTicketSourceLabel();
    const statusLabel = (state.statusFilter && state.statusFilter !== STATUS_FILTER_ALL_VALUE)
      ? state.statusFilter
      : STATUS_FILTER_ALL_LABEL;
    const heading = statusLabel !== STATUS_FILTER_ALL_LABEL
      ? (sourceLabel + " CASES (" + statusLabel + ")")
      : (sourceLabel + " CASES");
    const headerLines = [
      "*" + escapeSlackMrkdwn(heading) + "*",
      ""
    ];
    const signatureLine = "// <https://tve.zendesk.com/hc/en-us/articles/46503360732436-ZIP-TOOL-beta|via ZipTool>";

    const rowLines = cappedRows.map((row) => {
      const ticketId = row && row.id != null ? String(row.id).trim() : "";
      const ticketUrl = (row && row.url && String(row.url).trim()) || (ticketId ? (TICKET_URL_PREFIX + ticketId) : "");
      const ticketLabel = ticketId ? ("#" + ticketId) : "#ticket";
      const safeTicketUrl = sanitizeSlackLinkTarget(ticketUrl);
      const ticketRef = (ticketId && safeTicketUrl)
        ? ("<" + safeTicketUrl + "|" + escapeSlackMrkdwn(ticketLabel) + ">")
        : escapeSlackMrkdwn(ticketLabel);
      const subject = escapeSlackMrkdwn(shortenSlackSubject(row && row.subject, 120));
      const status = formatSlackStatusIndicator(row && row.status);
      const requesterEmail = getSlackTicketEmailAddress(row);
      const emailRef = requesterEmail
        ? ("<" + sanitizeSlackLinkTarget("mailto:" + requesterEmail) + "|" + escapeSlackMrkdwn(requesterEmail) + ">")
        : "";
      const owner = escapeSlackMrkdwn(getSlackTicketOwnerLabel(row));
      const parts = [ticketRef, subject, status];
      if (emailRef) parts.push(emailRef);
      if (owner) parts.push("[" + owner + "]");
      return "• " + parts.join(" ");
    });

    if (ticketRows.length > cappedRows.length) {
      rowLines.push("_" + String(ticketRows.length - cappedRows.length) + " additional visible tickets omitted (ZIP cap " + String(SLACK_IT_TO_ME_MAX_ROWS) + ")._");
    }

    if (!rowLines.length) {
      rowLines.push("_No visible tickets._");
    }

    const allLines = headerLines.concat(rowLines, ["", signatureLine]);
    let markdownText = allLines.join("\n").trim();
    if (markdownText.length <= SLACK_IT_TO_ME_MAX_MESSAGE_CHARS) {
      return markdownText;
    }

    const trimmedLines = rowLines.slice();
    while (trimmedLines.length > 1) {
      trimmedLines.pop();
      const candidate = headerLines.concat(trimmedLines, ["", signatureLine]);
      candidate.push("_Output truncated to fit Slack message length limits._");
      const nextText = candidate.join("\n").trim();
      if (nextText.length <= SLACK_IT_TO_ME_MAX_MESSAGE_CHARS) {
        return nextText;
      }
    }

    const fallback = headerLines.concat([
      "_Visible ticket list is too large for one message._",
      "_Apply filters and retry SLACK_IT_TO_ME._"
    ]).join("\n").trim();
    return fallback.slice(0, SLACK_IT_TO_ME_MAX_MESSAGE_CHARS);
  }

  async function slackVisibleTicketsToMe() {
    if (state.slackItToMeLoading) return;
    const exportData = buildVisibleTicketsCsvExportData();
    const rows = exportData.rows;
    if (!rows.length) {
      setStatus("No tickets are currently visible to send.", false);
      return;
    }

    const ready = await refreshSlacktivatedState({
      force: true,
      silent: true,
      allowOpenIdSilentProbe: true,
      allowSlackTabBootstrap: true,
      allowSlackTabBootstrapCreate: false
    }).catch(() => false);
    if (!ready || !isPassAiSlacktivated()) {
      setStatus(SLACKTIVATED_LOGIN_TOOLTIP, true);
      updateTicketActionButtons();
      return;
    }

    state.slackItToMeLoading = true;
    applyGlobalBusyUi();
    updateTicketActionButtons();
    setStatus("Sending visible ticket list to @ME in Slack…", false);
    try {
      const markdownText = buildSlackItToMeMarkdown(rows);
      const slackApiTokens = getPassAiSlackApiTokenConfig();
      await persistPassAiSlackApiTokenConfig(slackApiTokens).catch(() => {});
      const sendPayload = {
        workspaceOrigin: PASS_AI_SLACK_WORKSPACE_ORIGIN,
        userId: state.passAiSlackUserId || "",
        userName: state.passAiSlackUserName || "",
        avatarUrl: state.passAiSlackAvatarUrl || "",
        markdownText,
        userToken: slackApiTokens.userToken || "",
        autoBootstrapSlackTab: false
      };

      setStatus("Sending visible ticket list to @ME via Slack API…", false);
      const response = await sendBackgroundRequest("ZIP_SLACK_API_SEND_TO_SELF", sendPayload);

      if (!response || response.ok !== true) {
        const responseMessage = normalizePassAiCommentBody(response && (response.error || response.message)) || "Slack send failed.";
        throw new Error(responseMessage);
      }

      setPassAiSlackAuthState({
        ready: true,
        mode: "api",
        webReady: true,
        userId: response.user_id || response.userId || state.passAiSlackUserId || "",
        userName: response.user_name || response.userName || state.passAiSlackUserName || "",
        avatarUrl: response.avatar_url || response.avatarUrl || state.passAiSlackAvatarUrl || "",
        teamId: response.team_id || response.teamId || "",
        enterpriseId: response.enterprise_id || response.enterpriseId || ""
      });

      const sentRows = Math.min(rows.length, SLACK_IT_TO_ME_MAX_ROWS);
      const summarySuffix = rows.length > sentRows ? (" (first " + sentRows + " rows)") : "";
      const unreadSuffix = response.unread_marked === true ? " Marked as new in Slack." : "";
      setStatus("SLACK_IT_TO_ME delivered to @" + getSlacktivatedDisplayName() + summarySuffix + "." + unreadSuffix, false);
    } catch (err) {
      const message = normalizePassAiCommentBody(err && err.message) || "Unable to send visible ticket list.";
      setStatus("SLACK_IT_TO_ME failed: " + message, true);
    } finally {
      state.slackItToMeLoading = false;
      applyGlobalBusyUi();
      updateTicketActionButtons();
    }
  }

  const MAX_API_VALUE_RENDER_DEPTH = 10;
  const MAX_INLINE_OBJECT_KEYS = 8;
  const MAX_API_DEPTH_CLASS = 6;
  const LONG_SCALAR_TEXT_THRESHOLD = 140;
  const ROOT_KV_KEY_COLUMN_MIN_CH = 18;
  const ROOT_KV_KEY_COLUMN_MAX_CH = 48;
  const NESTED_KV_KEY_COLUMN_MIN_CH = 14;
  const NESTED_KV_KEY_COLUMN_MAX_CH = 36;

  function cellDisplayValue(val) {
    if (val === null) return "null";
    if (val === undefined) return "";
    if (Array.isArray(val)) return "[Array of " + val.length + " items]";
    if (typeof val === "object") return "[Object]";
    return String(val);
  }

  function createSpectrumTableRow(extraClass) {
    const tr = document.createElement("tr");
    tr.className = extraClass ? ("spectrum-Table-row " + extraClass) : "spectrum-Table-row";
    return tr;
  }

  function createSpectrumHeadCell(label, extraClass) {
    const th = document.createElement("th");
    th.className = extraClass
      ? ("spectrum-Table-headCell " + extraClass)
      : "spectrum-Table-headCell";
    th.setAttribute("scope", "col");
    if (label != null) th.textContent = String(label);
    return th;
  }

  function createSpectrumTableCell(extraClass) {
    const td = document.createElement("td");
    td.className = extraClass ? ("spectrum-Table-cell " + extraClass) : "spectrum-Table-cell";
    return td;
  }

  function getRawResultTableEl() {
    if (!els.rawTableWrap) return null;
    return els.rawTableWrap.querySelector("table");
  }

  function removeRawResultTableColgroups() {
    const table = getRawResultTableEl();
    if (!table) return;
    table.querySelectorAll("colgroup.raw-kv-colgroup").forEach((node) => node.remove());
  }

  function ensureRawResultKvColgroup() {
    const table = getRawResultTableEl();
    if (!table) return;
    removeRawResultTableColgroups();
    const colgroup = document.createElement("colgroup");
    colgroup.className = "raw-kv-colgroup";
    const keyCol = document.createElement("col");
    keyCol.className = "raw-kv-col-key";
    const valueCol = document.createElement("col");
    valueCol.className = "raw-kv-col-value";
    colgroup.appendChild(keyCol);
    colgroup.appendChild(valueCol);
    const head = table.querySelector("thead");
    if (head) table.insertBefore(colgroup, head);
    else table.appendChild(colgroup);
  }

  function setRawResultTableMode(mode) {
    const table = getRawResultTableEl();
    if (!table) return;
    table.classList.remove("raw-table-mode-kv", "raw-table-mode-grid", "raw-table-mode-single");
    removeRawResultTableColgroups();
    table.style.removeProperty("min-width");
    table.style.removeProperty("width");
    table.style.removeProperty("--zip-api-kv-key-col-ch");
    if (mode === "kv") {
      table.classList.add("raw-table-mode-kv");
      ensureRawResultKvColgroup();
      return;
    }
    if (mode === "single") {
      table.classList.add("raw-table-mode-single");
      return;
    }
    table.classList.add("raw-table-mode-grid");
  }

  function getReadableGridMinWidth(columnCount, base, perColumn, maxWidth) {
    const safeCount = Math.max(1, Number(columnCount) || 1);
    const calculated = Math.max(base, safeCount * perColumn);
    return Math.min(maxWidth, calculated);
  }

  function computeReadableKeyColumnCh(keys, minCh, maxCh) {
    const safeMin = Math.max(8, Number(minCh) || 8);
    const safeMax = Math.max(safeMin, Number(maxCh) || safeMin);
    const keyList = Array.isArray(keys) ? keys : [];
    let longest = 0;
    keyList.forEach((key) => {
      const text = String(key == null ? "" : key).trim();
      if (!text) return;
      longest = Math.max(longest, text.length);
    });
    const padded = Math.ceil(longest * 1.05) + 3;
    return Math.max(safeMin, Math.min(safeMax, padded));
  }

  function applyRawResultGridSizing(columnCount) {
    const table = getRawResultTableEl();
    if (!table) return;
    const minWidth = getReadableGridMinWidth(columnCount, 960, 180, 7200);
    table.style.minWidth = minWidth + "px";
    table.style.width = "max(100%, " + minWidth + "px)";
  }

  function toApiDepthLevel(depth) {
    const safeDepth = Number(depth) || 0;
    return Math.max(1, Math.min(MAX_API_DEPTH_CLASS, safeDepth));
  }

  function createNestedScrollFrame(kind, depth) {
    const frame = document.createElement("div");
    frame.className = kind
      ? ("raw-nested-scroll raw-nested-scroll-" + kind)
      : "raw-nested-scroll";
    const depthLevel = toApiDepthLevel(depth);
    frame.classList.add("raw-depth-" + depthLevel);
    frame.dataset.rawDepth = String(depthLevel);
    return frame;
  }

  function isScalarValue(val) {
    return val == null || typeof val === "string" || typeof val === "number" || typeof val === "boolean";
  }

  function createScalarValueNode(val) {
    const span = document.createElement("span");
    span.className = "raw-scalar-value";
    if (val === null) {
      span.classList.add("is-null");
      span.textContent = "null";
      return span;
    }
    if (val === undefined) {
      span.classList.add("is-empty");
      span.textContent = "";
      return span;
    }
    if (typeof val === "boolean") {
      span.classList.add("is-boolean");
      span.textContent = val ? "true" : "false";
      return span;
    }
    if (typeof val === "number") {
      span.classList.add("is-number");
      span.textContent = String(val);
      return span;
    }
    if (typeof val === "string" && val.length === 0) {
      span.classList.add("is-empty");
      span.textContent = "\"\"";
      return span;
    }
    if (typeof val === "string") {
      span.classList.add("is-string");
      if (val.length >= LONG_SCALAR_TEXT_THRESHOLD) span.classList.add("is-long");
      if (val.indexOf("\n") !== -1) span.classList.add("is-multiline");
      if (/^https?:\/\/\S+$/i.test(val)) span.classList.add("is-url");
    }
    span.textContent = String(val);
    return span;
  }

  function isInlineObjectCandidate(val) {
    if (!val || typeof val !== "object" || Array.isArray(val)) return false;
    const keys = Object.keys(val);
    if (!keys.length || keys.length > MAX_INLINE_OBJECT_KEYS) return false;
    return keys.every((key) => isScalarValue(val[key]));
  }

  function createInlineObjectNode(obj) {
    const wrap = document.createElement("div");
    wrap.className = "raw-inline-object";
    const keys = Object.keys(obj || {});
    if (!keys.length) {
      wrap.appendChild(createScalarValueNode("{}"));
      return wrap;
    }
    keys.forEach((key) => {
      const pair = document.createElement("span");
      pair.className = "raw-inline-pair";
      const keyEl = document.createElement("span");
      keyEl.className = "raw-inline-key";
      keyEl.textContent = key;
      const sep = document.createElement("span");
      sep.className = "raw-inline-sep";
      sep.textContent = ":";
      const valueEl = createScalarValueNode(obj[key]);
      valueEl.classList.add("raw-inline-value");
      pair.appendChild(keyEl);
      pair.appendChild(sep);
      pair.appendChild(valueEl);
      wrap.appendChild(pair);
    });
    return wrap;
  }

  function fillCellWithValue(td, val, depth) {
    const currentDepth = Number(depth) || 0;
    td.textContent = "";
    td.classList.add("raw-value-cell");
    td.dataset.rawDepth = String(currentDepth);
    td.classList.remove(
      "raw-value-type-scalar",
      "raw-value-type-array",
      "raw-value-type-object",
      "raw-value-type-empty",
      "raw-value-type-truncated"
    );
    if (currentDepth > MAX_API_VALUE_RENDER_DEPTH) {
      td.classList.add("raw-value-type-truncated");
      td.appendChild(createScalarValueNode("[Depth limit reached]"));
      return;
    }
    if (isScalarValue(val)) {
      td.classList.add(val === undefined || val === null || val === "" ? "raw-value-type-empty" : "raw-value-type-scalar");
      td.appendChild(createScalarValueNode(val));
      return;
    }
    if (Array.isArray(val)) {
      td.classList.add("raw-value-type-array");
      if (val.length === 0) {
        td.appendChild(createScalarValueNode("[]"));
        return;
      }
      const allPlainObjects = val.every((item) => item != null && typeof item === "object" && !Array.isArray(item));
      const nest = document.createElement("table");
      nest.className = "raw-nested-table " + (allPlainObjects ? "raw-nested-table-grid" : "raw-nested-table-list") + " spectrum-Table spectrum-Table--sizeS";
      if (allPlainObjects) {
        const keySet = new Set();
        val.forEach((item) => {
          Object.keys(item || {}).forEach((k) => keySet.add(k));
        });
        const cols = [...keySet];
        if (!cols.length) {
          td.appendChild(createScalarValueNode("[Array of empty objects]"));
          return;
        }
        const minWidth = getReadableGridMinWidth(cols.length + 1, 760, 170, 6400);
        nest.style.minWidth = minWidth + "px";
        nest.style.width = "max-content";
        const thead = document.createElement("thead");
        thead.className = "spectrum-Table-head";
        const headerTr = createSpectrumTableRow();
        headerTr.appendChild(createSpectrumHeadCell("#", "raw-grid-index-head"));
        cols.forEach((k) => headerTr.appendChild(createSpectrumHeadCell(k)));
        thead.appendChild(headerTr);
        nest.appendChild(thead);
        const tbody = document.createElement("tbody");
        tbody.className = "spectrum-Table-body";
        val.forEach((row, rowIndex) => {
          const tr = createSpectrumTableRow();
          const indexCell = createSpectrumTableCell("raw-grid-index-cell");
          indexCell.textContent = String(rowIndex + 1);
          tr.appendChild(indexCell);
          cols.forEach((col) => {
            const cell = createSpectrumTableCell("raw-nested-grid-cell");
            const cellValue = row && Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null;
            if (isInlineObjectCandidate(cellValue)) {
              cell.appendChild(createInlineObjectNode(cellValue));
            } else {
              fillCellWithValue(cell, cellValue, currentDepth + 1);
            }
            tr.appendChild(cell);
          });
          tbody.appendChild(tr);
        });
        nest.appendChild(tbody);
        const frame = createNestedScrollFrame("grid", currentDepth + 1);
        frame.appendChild(nest);
        td.appendChild(frame);
        return;
      }
      nest.style.minWidth = "480px";
      nest.style.width = "max-content";
      const thead = document.createElement("thead");
      thead.className = "spectrum-Table-head";
      const headerRow = createSpectrumTableRow();
      const th0 = createSpectrumHeadCell("#", "raw-list-index-head");
      const th1 = createSpectrumHeadCell("Value", "raw-list-value-head");
      headerRow.appendChild(th0);
      headerRow.appendChild(th1);
      thead.appendChild(headerRow);
      nest.appendChild(thead);
      const tbody = document.createElement("tbody");
      tbody.className = "spectrum-Table-body";
      val.forEach((item, i) => {
        const tr = createSpectrumTableRow();
        const td0 = createSpectrumTableCell("raw-list-index-cell");
        td0.textContent = String(i + 1);
        const td1 = createSpectrumTableCell("raw-list-value-cell");
        if (isInlineObjectCandidate(item)) {
          td1.appendChild(createInlineObjectNode(item));
        } else {
          fillCellWithValue(td1, item, currentDepth + 1);
        }
        tr.appendChild(td0);
        tr.appendChild(td1);
        tbody.appendChild(tr);
      });
      nest.appendChild(tbody);
      const frame = createNestedScrollFrame("list", currentDepth + 1);
      frame.appendChild(nest);
      td.appendChild(frame);
      return;
    }
    if (typeof val === "object") {
      td.classList.add("raw-value-type-object");
      if (isInlineObjectCandidate(val)) {
        td.appendChild(createInlineObjectNode(val));
        return;
      }
      const keys = Object.keys(val);
      if (!keys.length) {
        td.appendChild(createScalarValueNode("{}"));
        return;
      }
      const nest = document.createElement("table");
      nest.className = "raw-nested-table raw-nested-table-kv spectrum-Table spectrum-Table--sizeS";
      const nestedKeyColumnCh = computeReadableKeyColumnCh(
        keys,
        NESTED_KV_KEY_COLUMN_MIN_CH,
        NESTED_KV_KEY_COLUMN_MAX_CH
      );
      nest.style.setProperty("--zip-nested-kv-key-col-ch", nestedKeyColumnCh + "ch");
      const minWidth = getReadableGridMinWidth(
        2,
        Math.max(560, nestedKeyColumnCh * 18),
        220,
        2200
      );
      nest.style.minWidth = minWidth + "px";
      nest.style.width = "max-content";
      const colgroup = document.createElement("colgroup");
      colgroup.className = "raw-nested-kv-colgroup";
      const keyCol = document.createElement("col");
      keyCol.className = "raw-nested-kv-col-key";
      const valueCol = document.createElement("col");
      valueCol.className = "raw-nested-kv-col-value";
      colgroup.appendChild(keyCol);
      colgroup.appendChild(valueCol);
      nest.appendChild(colgroup);
      const thead = document.createElement("thead");
      thead.className = "spectrum-Table-head";
      const headRow = createSpectrumTableRow();
      headRow.appendChild(createSpectrumHeadCell("Key", "raw-nested-kv-key-head"));
      headRow.appendChild(createSpectrumHeadCell("Value", "raw-nested-kv-value-head"));
      thead.appendChild(headRow);
      nest.appendChild(thead);
      const tbody = document.createElement("tbody");
      tbody.className = "spectrum-Table-body";
      keys.forEach((k) => {
        const tr = createSpectrumTableRow();
        const tdK = createSpectrumTableCell("raw-nested-kv-key-cell");
        const keyLabel = document.createElement("span");
        keyLabel.className = "raw-kv-key-label";
        keyLabel.textContent = k;
        keyLabel.title = String(k);
        tdK.appendChild(keyLabel);
        const tdV = createSpectrumTableCell("raw-nested-kv-value-cell");
        fillCellWithValue(tdV, val[k], currentDepth + 1);
        tr.appendChild(tdK);
        tr.appendChild(tdV);
        tbody.appendChild(tr);
      });
      nest.appendChild(tbody);
      const frame = createNestedScrollFrame("kv", currentDepth + 1);
      frame.appendChild(nest);
      td.appendChild(frame);
      return;
    }
    td.appendChild(createScalarValueNode(cellDisplayValue(val)));
  }

  function renderApiResultTable(payload) {
    els.rawThead.innerHTML = "";
    els.rawBody.innerHTML = "";
    setRawResultTableMode("grid");
    if (payload == null || payload === "") {
      setRawResultTableMode("single");
      const tr = createSpectrumTableRow();
      const td = createSpectrumTableCell();
      td.colSpan = 2;
      td.textContent = "No data. Run a GET request above.";
      tr.appendChild(td);
      els.rawBody.appendChild(tr);
      return;
    }
    if (typeof payload === "string") {
      setRawResultTableMode("single");
      const th = createSpectrumHeadCell("Response");
      els.rawThead.appendChild(th);
      const tr = createSpectrumTableRow();
      const td = createSpectrumTableCell(); td.textContent = payload;
      tr.appendChild(td);
      els.rawBody.appendChild(tr);
      return;
    }
    if (Array.isArray(payload)) {
      if (payload.length === 0) {
        setRawResultTableMode("single");
        const tr = createSpectrumTableRow();
        const td = createSpectrumTableCell(); td.textContent = "Empty array";
        tr.appendChild(td);
        els.rawBody.appendChild(tr);
        return;
      }
      const first = payload[0];
      if (first != null && typeof first === "object" && !Array.isArray(first)) {
        const keySet = new Set();
        payload.forEach((item) => {
          if (item && typeof item === "object") Object.keys(item).forEach((k) => keySet.add(k));
        });
        const cols = [...keySet];
        if (!cols.length) {
          setRawResultTableMode("single");
          const tr = createSpectrumTableRow();
          const td = createSpectrumTableCell();
          td.textContent = "Array of empty objects";
          tr.appendChild(td);
          els.rawBody.appendChild(tr);
          return;
        }
        applyRawResultGridSizing(cols.length + 1);
        els.rawThead.appendChild(createSpectrumHeadCell("#", "raw-grid-index-head"));
        cols.forEach((k) => els.rawThead.appendChild(createSpectrumHeadCell(k)));
        payload.forEach((row, rowIndex) => {
          const tr = createSpectrumTableRow();
          const indexCell = createSpectrumTableCell("raw-grid-index-cell");
          indexCell.textContent = String(rowIndex + 1);
          tr.appendChild(indexCell);
          cols.forEach((col) => {
            const td = createSpectrumTableCell("raw-grid-value-cell");
            fillCellWithValue(td, row && row[col], 0);
            tr.appendChild(td);
          });
          els.rawBody.appendChild(tr);
        });
        return;
      }
      applyRawResultGridSizing(2);
      els.rawThead.appendChild(createSpectrumHeadCell("#", "raw-list-index-head"));
      els.rawThead.appendChild(createSpectrumHeadCell("Value", "raw-list-value-head"));
      payload.forEach((item, itemIndex) => {
        const tr = createSpectrumTableRow();
        const tdIndex = createSpectrumTableCell("raw-list-index-cell");
        tdIndex.textContent = String(itemIndex + 1);
        const tdValue = createSpectrumTableCell("raw-list-value-cell");
        fillCellWithValue(tdValue, item, 0);
        tr.appendChild(tdIndex);
        tr.appendChild(tdValue);
        els.rawBody.appendChild(tr);
      });
      return;
    }
    if (typeof payload === "object") {
      const keys = Object.keys(payload);
      if (keys.length === 1) {
        const singleVal = payload[keys[0]];
        if (Array.isArray(singleVal) && singleVal.length > 0 && singleVal[0] != null && typeof singleVal[0] === "object" && !Array.isArray(singleVal[0])) {
          renderApiResultTable(singleVal);
          return;
        }
      }
      setRawResultTableMode("kv");
      const table = getRawResultTableEl();
      if (table) {
        const rootKeyColumnCh = computeReadableKeyColumnCh(
          keys,
          ROOT_KV_KEY_COLUMN_MIN_CH,
          ROOT_KV_KEY_COLUMN_MAX_CH
        );
        table.style.setProperty("--zip-api-kv-key-col-ch", rootKeyColumnCh + "ch");
        const rootMinWidth = getReadableGridMinWidth(
          2,
          Math.max(860, rootKeyColumnCh * 22),
          280,
          2800
        );
        table.style.minWidth = rootMinWidth + "px";
        table.style.width = "max(100%, " + rootMinWidth + "px)";
      }
      const thKey = createSpectrumHeadCell("Key");
      thKey.classList.add("raw-kv-key-head");
      const thVal = createSpectrumHeadCell("Value");
      thVal.classList.add("raw-kv-value-head");
      els.rawThead.appendChild(thKey); els.rawThead.appendChild(thVal);
      Object.keys(payload).forEach((key) => {
        const tr = createSpectrumTableRow();
        const tdKey = createSpectrumTableCell("raw-kv-key-cell");
        const keyLabel = document.createElement("span");
        keyLabel.className = "raw-kv-key-label";
        keyLabel.textContent = key;
        keyLabel.title = String(key);
        tdKey.appendChild(keyLabel);
        const tdVal = createSpectrumTableCell("raw-kv-value-cell");
        fillCellWithValue(tdVal, payload[key], 0);
        tr.appendChild(tdKey); tr.appendChild(tdVal);
        els.rawBody.appendChild(tr);
      });
    }
  }

  function setRawFromPayload(payload) {
    if (payload == null) {
      state.lastApiPayload = null;
      state.lastApiPayloadString = "";
    } else if (typeof payload === "string") {
      state.lastApiPayload = payload;
      state.lastApiPayloadString = payload;
    } else {
      state.lastApiPayload = payload;
      state.lastApiPayloadString = JSON.stringify(payload, null, 2);
    }
    renderApiResultTable(state.lastApiPayload);
    updateRawDownloadLink();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function setTopIdentityFromUser(user) {
    if (!user) return;
    const name = user.name || user.email || "Agent";
    const email = user.email || "";
    const avatarUrl = user.photo && (user.photo.content_url || user.photo.url || user.photo.mapped_content_url);
    if (els.topAvatarFallback) {
      const fallbackInitial = (String(name).trim().charAt(0) || "?").toUpperCase();
      els.topAvatarFallback.textContent = fallbackInitial;
    }
    if (avatarUrl && els.topAvatar) {
      els.topAvatar.src = avatarUrl;
      els.topAvatar.classList.remove("hidden");
      if (els.topAvatarFallback) els.topAvatarFallback.classList.add("hidden");
    } else if (els.topAvatar && els.topAvatarFallback) {
      els.topAvatar.classList.add("hidden");
      els.topAvatarFallback.classList.remove("hidden");
    }
    if (els.topAvatarWrap) {
      const idleTitle = name + (email ? " · " + email : "");
      els.topAvatarWrap.title = isZendeskActivityLoading() ? "Zendesk activity in progress…" : idleTitle;
      els.topAvatarWrap.dataset.idleTitle = idleTitle;
    }
  }

  function resetTopIdentity() {
    if (els.topAvatar) els.topAvatar.classList.add("hidden");
    if (els.topAvatarFallback) { els.topAvatarFallback.textContent = "?"; els.topAvatarFallback.classList.remove("hidden"); }
    if (els.topAvatarWrap) {
      els.topAvatarWrap.title = "Not logged in";
      els.topAvatarWrap.dataset.idleTitle = "Not logged in";
    }
  }

  function resetTopFilterMenuCatalogState() {
    state.organizations = [];
    state.orgCountsById = Object.create(null);
    state.orgCountLoadSeq += 1;
    state.orgLabelPadLength = 0;
    state.views = [];
    state.viewCountsById = Object.create(null);
    state.viewCountLoadSeq += 1;
    state.viewLabelPadLength = 0;
    state.ticketSource = "assigned";
    state.selectedOrgId = "";
    state.selectedViewId = "";
    state.selectedByGroupValue = "";
    state.groupsWithMembers = [];
    state.groupOptions = [];
    state.groupCountsByValue = Object.create(null);
    state.groupLabelPadLength = 0;
    state.groupLoadSeq += 1;
    if (els.orgSelect) els.orgSelect.value = "";
    if (els.viewSelect) els.viewSelect.value = "";
    if (els.groupMemberSelect) els.groupMemberSelect.value = "";
    setOrgSelectLoading(false);
    setViewSelectLoading(false);
    setGroupSelectLoading(false);
    renderOrgSelectLoadingPlaceholder();
    renderViewSelectLoadingPlaceholder();
    renderGroupSelectLoadingPlaceholder();
    clearFilterCountCaches();
  }

  function showTopFilterMenusLoadingState() {
    setOrgSelectLoading(true);
    setViewSelectLoading(true);
    setGroupSelectLoading(true);
    renderOrgSelectLoadingPlaceholder();
    renderViewSelectLoadingPlaceholder();
    renderGroupSelectLoadingPlaceholder();
  }

  function showLogin() {
    stopPassAiSlackAuthPolling();
    hideToast();
    slackIdentityEnrichmentLastAt = 0;
    slackSessionCacheHydrated = false;
    state.user = null;
    state.zendeskTabId = null;
    state.slackTabId = null;
    stopAuthCheckPolling();
    state.userProfile = null;
    state.mePayload = null;
    state.tickets = [];
    state.filteredTickets = [];
    state.statusFilter = STATUS_FILTER_ALL_VALUE;
    resetTopFilterMenuCatalogState();
    state.ticketTableLoading = false;
    applyTicketTableLoadingUi();
    resetTopIdentity();
    state.lastApiPayload = null;
    state.lastApiPayloadString = "";
    state.lastApiRequest = null;
    state.passAiLoading = false;
    state.passAiConversationInFlight = false;
    state.passAiTicketId = null;
    state.passAiActiveClientId = "";
    state.passAiSlackReady = false;
    state.passAiSlackUserId = "";
    state.passAiSlackUserName = "";
    state.passAiSlackAvatarUrl = "";
    state.passAiSlackWebReady = false;
    state.passAiSlackAuthError = "";
    state.passAiPanelVisible = false;
    state.slackItToMeLoading = false;
    state.ticketEmailUserEmailCacheById = Object.create(null);
    state.ticketEmailRequesterByTicketId = Object.create(null);
    state.ticketEmailCopyCacheByTicketId = Object.create(null);
    clearPassAiResultsDisplay();
    renderApiResultTable(null);
    if (els.rawTitle) els.rawTitle.textContent = "GET /api/v2/users/me";
    updateRawDownloadLink();
    if (els.ticketBody) els.ticketBody.innerHTML = "";
    updateTicketActionButtons();
    syncStatusFilterOptions();
    els.loginScreen.classList.remove("hidden");
    els.appScreen.classList.add("hidden");
    document.body.classList.add("zip-logged-out");
    syncContextMenuAuthVisibility();
    const gateStatus = enforceZipConfigGate({ reportStatus: false });
    if (gateStatus.ready) {
      setStatus("", false);
      startAuthCheckPolling();
    } else {
      setStatus(getZipConfigGateMessage(gateStatus), gateStatus.reason === "missing_fields");
    }
  }

  function showApp() {
    stopAuthCheckPolling();
    document.body.classList.remove("zip-logged-out");
    els.loginScreen.classList.add("hidden");
    els.appScreen.classList.remove("hidden");
    syncContextMenuAuthVisibility();
  }

  function formatDateTime(v) {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  }

  function compareByColumn(a, b, col) {
    let av = a[col.key], bv = b[col.key];
    if (col.type === "date") {
      av = new Date(av).getTime();
      bv = new Date(bv).getTime();
      av = Number.isNaN(av) ? 0 : av;
      bv = Number.isNaN(bv) ? 0 : bv;
    } else if (col.type === "number") {
      av = Number(av) || 0;
      bv = Number(bv) || 0;
    } else {
      av = String(av || "").toLowerCase();
      bv = String(bv || "").toLowerCase();
    }
    if (av < bv) return state.sortDir === "asc" ? -1 : 1;
    if (av > bv) return state.sortDir === "asc" ? 1 : -1;
    return 0;
  }

  function normalizeTicketIdValue(value) {
    if (value == null) return null;
    const normalized = String(value).trim();
    return normalized ? normalized : null;
  }

  function toEpochMs(value) {
    const parsed = Date.parse(String(value || ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function normalizeZendeskTicketId(value) {
    const normalized = normalizeTicketIdValue(value);
    if (normalized == null) return null;
    const stripped = normalized.replace(/^ZD-/i, "").trim();
    if (!/^\d+$/.test(stripped)) return null;
    return stripped;
  }

  function normalizeTicketContextId(value) {
    const normalized = normalizeZendeskTicketId(value);
    if (normalized == null) return "";
    return "ZD-" + normalized;
  }

  function normalizeEmailAddress(value) {
    const raw = String(value == null ? "" : value).trim();
    if (!raw) return "";
    const match = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return match ? String(match[0]).toLowerCase() : "";
  }

  function isAdobeEmailAddress(email) {
    const normalized = normalizeEmailAddress(email);
    return normalized.endsWith("@adobe.com");
  }

  function dedupeEmailAddresses(values) {
    const rows = Array.isArray(values) ? values : [];
    const out = [];
    const seen = new Set();
    rows.forEach((value) => {
      const normalized = normalizeEmailAddress(value);
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      out.push(normalized);
    });
    return out;
  }

  function getZendeskApiErrorMessage(payload, fallback) {
    const apiError = payload && typeof payload === "object"
      ? (
        payload.error
        || payload.description
        || payload.message
        || payload.details
      )
      : "";
    const normalized = normalizePassAiCommentBody(apiError);
    if (normalized) return normalized;
    return String(fallback || "Zendesk API request failed.");
  }

  async function fetchZendeskJson(url, label) {
    const endpoint = String(url || "").trim();
    const contextLabel = String(label || "Zendesk request");
    if (!endpoint) {
      throw new Error(contextLabel + " URL is empty.");
    }
    const result = await sendToZendeskTab({ action: "fetch", url: endpoint });
    const ok = !!(result && result.ok);
    const status = Number(result && result.status);
    const payload = result && typeof result === "object" ? result.payload : null;
    if (!ok) {
      const detail = getZendeskApiErrorMessage(payload, contextLabel + " failed.");
      throw new Error(
        contextLabel
        + (Number.isFinite(status) ? " (HTTP " + status + "). " : ". ")
        + detail
      );
    }
    if (!payload || typeof payload !== "object") {
      throw new Error(contextLabel + " returned an invalid response.");
    }
    return payload;
  }

  function extractRequesterIdFromTicketPayload(payload) {
    const root = payload && typeof payload === "object" ? payload : {};
    const ticket = root.ticket && typeof root.ticket === "object" ? root.ticket : root;
    const requesterId = ticket.requester_id ?? ticket.requesterId;
    if (requesterId == null) return "";
    return String(requesterId).trim();
  }

  function getCachedRequesterIdForTicket(ticketId) {
    const normalizedTicketId = normalizeZendeskTicketId(ticketId);
    if (normalizedTicketId == null) return "";
    const cache = state.ticketEmailRequesterByTicketId || Object.create(null);
    const requesterId = String(cache[normalizedTicketId] || "").trim();
    return requesterId;
  }

  function cacheRequesterIdForTicket(ticketId, requesterId) {
    const normalizedTicketId = normalizeZendeskTicketId(ticketId);
    if (normalizedTicketId == null) return "";
    const normalizedRequesterId = String(requesterId == null ? "" : requesterId).trim();
    if (!normalizedRequesterId) return "";
    if (!state.ticketEmailRequesterByTicketId || typeof state.ticketEmailRequesterByTicketId !== "object") {
      state.ticketEmailRequesterByTicketId = Object.create(null);
    }
    state.ticketEmailRequesterByTicketId[normalizedTicketId] = normalizedRequesterId;
    return normalizedRequesterId;
  }

  function getCachedTicketEmailCopyResult(ticketId) {
    const normalizedTicketId = normalizeZendeskTicketId(ticketId);
    if (normalizedTicketId == null) return null;
    const cache = state.ticketEmailCopyCacheByTicketId || Object.create(null);
    const entry = cache[normalizedTicketId];
    if (!entry || typeof entry !== "object") return null;
    const cachedAtMs = Number(entry.cachedAtMs);
    if (!Number.isFinite(cachedAtMs) || Date.now() - cachedAtMs > TICKET_EMAIL_COPY_CACHE_TTL_MS) {
      delete cache[normalizedTicketId];
      return null;
    }
    const emails = dedupeEmailAddresses(Array.isArray(entry.emails) ? entry.emails : []);
    const clipboardText = String(entry.clipboardText || "").trim();
    if (!emails.length || !clipboardText) {
      delete cache[normalizedTicketId];
      return null;
    }
    return {
      ticketId: normalizedTicketId,
      emails: emails.slice(),
      clipboardText,
      fromCache: true
    };
  }

  function cacheTicketEmailCopyResult(result) {
    const normalizedTicketId = normalizeZendeskTicketId(result && result.ticketId);
    if (normalizedTicketId == null) return null;
    const emails = dedupeEmailAddresses(result && result.emails);
    const clipboardText = emails.join(", ");
    if (!emails.length || !clipboardText) return null;
    if (!state.ticketEmailCopyCacheByTicketId || typeof state.ticketEmailCopyCacheByTicketId !== "object") {
      state.ticketEmailCopyCacheByTicketId = Object.create(null);
    }
    const entry = {
      emails: emails.slice(),
      clipboardText,
      cachedAtMs: Date.now()
    };
    state.ticketEmailCopyCacheByTicketId[normalizedTicketId] = entry;
    return {
      ticketId: normalizedTicketId,
      emails: emails.slice(),
      clipboardText
    };
  }

  function extractEmailFromUserPayload(payload) {
    const root = payload && typeof payload === "object" ? payload : {};
    const user = root.user && typeof root.user === "object" ? root.user : root;
    return normalizeEmailAddress(
      user.email
      || user.primary_email
      || user.default_email
      || user.user_email
    );
  }

  function extractEmailFromIdentityPayload(payload) {
    const root = payload && typeof payload === "object" ? payload : {};
    const identities = []
      .concat(Array.isArray(root.identities) ? root.identities : [])
      .concat(Array.isArray(root.user_identities) ? root.user_identities : [])
      .concat(root.identity && typeof root.identity === "object" ? [root.identity] : []);
    for (let i = 0; i < identities.length; i += 1) {
      const identity = identities[i];
      if (!identity || typeof identity !== "object") continue;
      const type = String(identity.type || identity.identity_type || "").trim().toLowerCase();
      const candidate = normalizeEmailAddress(
        identity.value
        || identity.email
        || identity.address
        || identity.user_email
      );
      if (!candidate) continue;
      if (type && type !== "email") continue;
      return candidate;
    }
    return "";
  }

  async function fetchZendeskUserEmailsByIds(userIds) {
    const ids = Array.from(new Set((Array.isArray(userIds) ? userIds : [])
      .map((id) => String(id == null ? "" : id).trim())
      .filter(Boolean)));
    const emptyResult = { emails: [], emailsById: Object.create(null) };
    if (!ids.length) return emptyResult;

    const emails = [];
    const emailsById = Object.create(null);
    const cachedById = state.ticketEmailUserEmailCacheById || Object.create(null);
    const addEmail = (userId, value) => {
      const email = normalizeEmailAddress(value);
      if (!email) return;
      emails.push(email);
      if (userId) {
        emailsById[userId] = email;
        cachedById[userId] = email;
      }
      return email;
    };
    const readUsersFromPayload = (payload) => {
      const root = payload && typeof payload === "object" ? payload : {};
      const rows = Array.isArray(root.users)
        ? root.users
        : (root.user && typeof root.user === "object")
          ? [root.user]
          : [];
      rows.forEach((user) => {
        if (!user || typeof user !== "object") return;
        const userId = user.id != null ? String(user.id).trim() : "";
        addEmail(
          userId,
          user.email
          || user.primary_email
          || user.default_email
          || user.user_email
          || (user.primary_identity && user.primary_identity.value)
        );
      });
    };

    ids.forEach((id) => {
      const cachedEmail = normalizeEmailAddress(cachedById[id] || "");
      if (cachedEmail) addEmail(id, cachedEmail);
    });

    let unresolved = ids.filter((id) => !emailsById[id]);
    if (unresolved.length) {
      try {
        const payload = await fetchZendeskJson(
          BASE + "/api/v2/users/show_many.json?ids=" + encodeURIComponent(unresolved.join(",")),
          "Ticket CC user lookup"
        );
        readUsersFromPayload(payload);
      } catch (_) {}
    }
    unresolved = ids.filter((id) => !emailsById[id]);

    if (unresolved.length) {
      await Promise.all(unresolved.map(async (id) => {
        try {
          const payload = await fetchZendeskJson(
            BASE + "/api/v2/users/" + encodeURIComponent(id) + ".json",
            "Ticket CC user lookup"
          );
          readUsersFromPayload(payload);
        } catch (_) {}
      }));
    }
    unresolved = ids.filter((id) => !emailsById[id]);

    if (unresolved.length) {
      await Promise.all(unresolved.map(async (id) => {
        try {
          const payload = await fetchZendeskJson(
            BASE + "/api/v2/users/" + encodeURIComponent(id) + "/identities.json",
            "Ticket CC user identity lookup"
          );
          const identityEmail = extractEmailFromIdentityPayload(payload);
          if (identityEmail) addEmail(id, identityEmail);
        } catch (_) {}
      }));
    }

    return {
      emails: dedupeEmailAddresses(emails),
      emailsById
    };
  }

  function extractExternalCcEmailsFromPayload(payload, options) {
    const opts = options && typeof options === "object" ? options : {};
    const unresolvedUserIds = opts.unresolvedUserIds instanceof Set ? opts.unresolvedUserIds : null;
    const root = payload && typeof payload === "object" ? payload : {};
    const users = Array.isArray(root.users) ? root.users : [];
    const usersById = Object.create(null);
    const seenObjects = typeof WeakSet !== "undefined" ? new WeakSet() : null;
    const candidates = [];
    users.forEach((user) => {
      if (!user || typeof user !== "object" || user.id == null) return;
      const email = normalizeEmailAddress(user.email || user.primary_email || user.default_email);
      if (!email) return;
      usersById[String(user.id)] = email;
      candidates.push(email);
    });

    const addUserId = (value) => {
      if (value == null) return;
      const normalizedUserId = String(value).trim();
      if (!normalizedUserId) return;
      const mappedEmail = usersById[normalizedUserId];
      if (mappedEmail) candidates.push(mappedEmail);
      else if (unresolvedUserIds) unresolvedUserIds.add(normalizedUserId);
    };

    const collectEntry = (entry, depth) => {
      if (depth > 5 || entry == null) return;
      if (typeof entry === "string") {
        candidates.push(entry);
        return;
      }
      if (Array.isArray(entry)) {
        entry.forEach((row) => collectEntry(row, depth + 1));
        return;
      }
      if (typeof entry !== "object") return;
      if (seenObjects) {
        if (seenObjects.has(entry)) return;
        seenObjects.add(entry);
      }

      candidates.push(entry.email);
      candidates.push(entry.email_cc);
      candidates.push(entry.emailCc);
      candidates.push(entry.user_email);
      candidates.push(entry.address);
      candidates.push(entry.email_address);
      candidates.push(entry.value);
      candidates.push(entry.recipient);
      candidates.push(entry.recipient_email);
      candidates.push(entry.requester_email);

      const nestedUser = entry.user && typeof entry.user === "object" ? entry.user : null;
      if (nestedUser) {
        candidates.push(nestedUser.email);
        candidates.push(nestedUser.primary_email);
        addUserId(nestedUser.id);
      }

      addUserId(entry.user_id ?? entry.userId);
      addUserId(entry.recipient_id ?? entry.recipientId);
      addUserId(entry.requester_id ?? entry.requesterId);

      if (entry.email_cc && typeof entry.email_cc === "object") collectEntry(entry.email_cc, depth + 1);
      if (entry.ticket_email_cc && typeof entry.ticket_email_cc === "object") collectEntry(entry.ticket_email_cc, depth + 1);
      if (entry.ticketEmailCc && typeof entry.ticketEmailCc === "object") collectEntry(entry.ticketEmailCc, depth + 1);
      if (Array.isArray(entry.email_ccs)) collectEntry(entry.email_ccs, depth + 1);
      if (Array.isArray(entry.ticket_email_ccs)) collectEntry(entry.ticket_email_ccs, depth + 1);
      if (Array.isArray(entry.ticketEmailCcs)) collectEntry(entry.ticketEmailCcs, depth + 1);
      if (Array.isArray(entry.recipients)) collectEntry(entry.recipients, depth + 1);
      if (Array.isArray(entry.users)) collectEntry(entry.users, depth + 1);
    };

    collectEntry(root.email_ccs, 0);
    collectEntry(root.emailCcs, 0);
    collectEntry(root.email_cc, 0);
    collectEntry(root.emailCc, 0);
    collectEntry(root.ticket_email_ccs, 0);
    collectEntry(root.ticketEmailCcs, 0);
    collectEntry(root.ticket_email_cc, 0);
    collectEntry(root.ticketEmailCc, 0);

    const unique = dedupeEmailAddresses(candidates);
    return unique.filter((email) => !isAdobeEmailAddress(email));
  }

  async function copyTextToClipboard(value) {
    const text = String(value == null ? "" : value);
    if (!text) throw new Error("Clipboard text is empty.");
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "true");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    textArea.style.pointerEvents = "none";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textArea);
    if (!copied) {
      throw new Error("Clipboard API unavailable.");
    }
  }

  async function buildTicketEmailClipboardString(ticketId, options) {
    const normalizedTicketId = normalizeZendeskTicketId(ticketId);
    if (normalizedTicketId == null) {
      throw new Error("Ticket ID is required.");
    }
    const opts = options && typeof options === "object" ? options : {};
    const allowCache = opts.allowCache !== false;
    if (allowCache) {
      const cachedResult = getCachedTicketEmailCopyResult(normalizedTicketId);
      if (cachedResult) return cachedResult;
    }
    const seededRequesterId = String(opts.requesterId == null ? "" : opts.requesterId).trim();
    let requesterId = seededRequesterId || getCachedRequesterIdForTicket(normalizedTicketId);

    const ccUrl = BASE + "/api/v2/tickets/" + encodeURIComponent(normalizedTicketId) + "/email_ccs.json";
    let ticketPayload = null;
    const ccPayloadPromise = fetchZendeskJson(ccUrl, "Ticket email CC lookup");
    if (!requesterId) {
      ticketPayload = await fetchZendeskJson(
        BASE + "/api/v2/tickets/" + encodeURIComponent(normalizedTicketId) + ".json",
        "Ticket lookup"
      );
      requesterId = extractRequesterIdFromTicketPayload(ticketPayload);
    }
    const ccPayload = await ccPayloadPromise;
    if (!requesterId) {
      throw new Error("Requester ID not found for ticket " + normalizedTicketId + ".");
    }
    cacheRequesterIdForTicket(normalizedTicketId, requesterId);

    const unresolvedCcUserIds = new Set();
    const externalCcEmails = extractExternalCcEmailsFromPayload(ccPayload, {
      unresolvedUserIds: unresolvedCcUserIds
    });

    const idsToResolve = new Set(Array.from(unresolvedCcUserIds));
    idsToResolve.add(requesterId);
    const resolvedUsers = await fetchZendeskUserEmailsByIds(Array.from(idsToResolve));
    let requesterEmail = normalizeEmailAddress(resolvedUsers.emailsById[requesterId] || "");
    if (!requesterEmail) {
      const requesterPayload = await fetchZendeskJson(
        BASE + "/api/v2/users/" + encodeURIComponent(requesterId) + ".json",
        "Requester lookup"
      );
      requesterEmail = extractEmailFromUserPayload(requesterPayload);
    }
    if (!requesterEmail) {
      throw new Error("Requester email not found for ticket " + normalizedTicketId + ".");
    }

    const resolvedCcEmails = dedupeEmailAddresses(
      externalCcEmails
        .concat(Array.isArray(resolvedUsers.emails) ? resolvedUsers.emails : [])
        .filter((email) => !isAdobeEmailAddress(email))
    );

    const combined = dedupeEmailAddresses([requesterEmail].concat(resolvedCcEmails));
    if (!combined.length) {
      throw new Error("No ticket emails available for clipboard copy.");
    }
    return cacheTicketEmailCopyResult({
      ticketId: normalizedTicketId,
      emails: combined.slice(),
      clipboardText: combined.join(", ")
    }) || {
      ticketId: normalizedTicketId,
      emails: combined.slice(),
      clipboardText: combined.join(", ")
    };
  }

  function normalizePassProduct(value) {
    const normalized = String(value || "").trim().toUpperCase();
    return normalized === "PASS_CM" ? "PASS_CM" : "PASS_AUTH";
  }

  function normalizePassAiCommentType(value) {
    return String(value || "").trim().toLowerCase() === "internal" ? "internal" : "public";
  }

  function normalizePassAiCommentBody(value) {
    if (value == null) return "";
    const raw = typeof value === "string" ? value : String(value);
    const withoutTags = raw.includes("<") && raw.includes(">")
      ? raw.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ")
      : raw;
    return withoutTags
      .replace(/\r\n?/g, "\n")
      .replace(/&nbsp;/gi, " ")
      .replace(/[ \t\f\v]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function normalizePassAiAnswerBody(value) {
    if (value == null) return "";
    return String(value)
      .replace(/\r\n?/g, "\n")
      .replace(/\t/g, "  ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{4,}/g, "\n\n\n")
      .trim();
  }

  function hasPassAiSourcesFooter(value) {
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

  function hasPassAiCompletionFooter(value) {
    const text = String(value || "").replace(/\r\n?/g, "\n").trim().toLowerCase();
    if (!text) return false;
    if (text.includes("if you have any more questions, just tag me in this thread")) return true;
    if (text.includes("ai generated content. check important info for mistakes")) return true;
    if (text.includes("how helpful was this answer")) return true;
    return hasPassAiSourcesFooter(text);
  }

  function normalizePassAiSlackTeamId(value) {
    const teamId = String(value || "").trim().toUpperCase();
    return /^[TE][A-Z0-9]{8,}$/.test(teamId) ? teamId : "";
  }

  function normalizePassAiSlackAvatarUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      const parsed = new URL(raw);
      const hostname = String(parsed.hostname || "").toLowerCase();
      if (
        hostname === "slack-edge.com"
        || hostname.endsWith(".slack-edge.com")
        || hostname === "slack.com"
        || hostname.endsWith(".slack.com")
      ) {
        return parsed.toString();
      }
    } catch (_) {}
    return "";
  }

  function normalizePassAiSlackChannelId(value) {
    const channelId = String(value || "").trim().toUpperCase();
    return /^[CGD][A-Z0-9]{8,}$/.test(channelId) ? channelId : "";
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

  function normalizeZipConfigMetaShape(input) {
    const payload = input && typeof input === "object" ? input : {};
    const services = normalizeZipConfigServices(
      payload.services || payload.service || payload.features
    );
    return {
      services,
      keyVersion: String(payload.keyVersion || "").trim(),
      importedAt: String(payload.importedAt || "").trim(),
      importedBuild: String(payload.importedBuild || "").trim(),
      source: String(payload.source || "").trim() || "zip-key"
    };
  }

  function readZipConfigMeta() {
    const fromState = state && state.zipSecretConfig && state.zipSecretConfig.meta;
    if (fromState && typeof fromState === "object") {
      return normalizeZipConfigMetaShape(fromState);
    }
    const globalMeta = typeof window !== "undefined"
      ? (window.ZIP_CONFIG_META || null)
      : null;
    if (!globalMeta || typeof globalMeta !== "object") return null;
    return normalizeZipConfigMetaShape(globalMeta);
  }

  function writeZipConfigMeta(meta) {
    const payload = meta && typeof meta === "object" ? meta : {};
    const next = normalizeZipConfigMetaShape({
      ...payload,
      services: normalizeZipConfigServices(payload.services).length
        ? payload.services
        : [ZIP_SLACKTIVATION_SERVICE_KEY],
      importedAt: String(payload.importedAt || "").trim() || new Date().toISOString()
    });
    if (typeof window !== "undefined") {
      window.ZIP_CONFIG_META = { ...next };
    }
    if (state && state.zipSecretConfig && typeof state.zipSecretConfig === "object") {
      state.zipSecretConfig.meta = { ...next };
    }
    return true;
  }

  function getCurrentZipBuildVersion() {
    try {
      const manifest = (typeof chrome !== "undefined" && chrome.runtime && typeof chrome.runtime.getManifest === "function")
        ? chrome.runtime.getManifest()
        : null;
      return String((manifest && manifest.version) || "").trim();
    } catch (_) {
      return "";
    }
  }

  function getZipKeyValueByPath(payload, pathExpr) {
    if (!payload || typeof payload !== "object") return undefined;
    const expr = String(pathExpr || "").trim();
    if (!expr) return undefined;
    if (Object.prototype.hasOwnProperty.call(payload, expr)) {
      return payload[expr];
    }
    const parts = expr.split(".").map((part) => part.trim()).filter(Boolean);
    if (!parts.length) return undefined;
    let node = payload;
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      if (!node || typeof node !== "object" || !Object.prototype.hasOwnProperty.call(node, part)) {
        return undefined;
      }
      node = node[part];
    }
    return node;
  }

  function readZipKeyValue(payload, candidates) {
    const list = Array.isArray(candidates) ? candidates : [];
    for (let i = 0; i < list.length; i += 1) {
      const value = getZipKeyValueByPath(payload, list[i]);
      if (value == null) continue;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed) return trimmed;
        continue;
      }
      if (typeof value === "number" && Number.isFinite(value)) return String(value);
      if (typeof value === "boolean") return value ? "true" : "false";
    }
    return "";
  }

  function parseZipKeyValueText(rawText) {
    const payload = {};
    const rows = String(rawText || "").split(/\r?\n/);
    for (let i = 0; i < rows.length; i += 1) {
      const line = rows[i];
      const match = line.match(/^\s*([^=:\s]+)\s*[:=]\s*(.+)\s*$/);
      if (!match) continue;
      payload[String(match[1] || "").trim()] = String(match[2] || "").trim();
    }
    return payload;
  }

  function normalizeZipKeyRedirectPath(value) {
    const raw = String(value || "").trim().replace(/^\/+/, "");
    if (!raw) return PASS_AI_SLACK_OIDC_DEFAULT_REDIRECT_PATH;
    const normalized = raw.replace(/[^a-zA-Z0-9._/-]/g, "");
    if (!normalized || normalized.includes("..")) return PASS_AI_SLACK_OIDC_DEFAULT_REDIRECT_PATH;
    return normalized;
  }

  function normalizeZipKeyRedirectUri(value) {
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

  function decodeZipKeyPayloadBase64(value) {
    const compact = String(value || "")
      .replace(/\s+/g, "")
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    if (!compact) return "";
    const remainder = compact.length % 4;
    const padded = remainder === 0 ? compact : (compact + "=".repeat(4 - remainder));
    const binary = atob(padded);
    try {
      const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch (_) {
      return binary;
    }
  }

  function parseZipKeyPayload(rawText) {
    const raw = String(rawText || "").trim();
    if (!raw) {
      throw new Error("ZIP.KEY file is empty.");
    }
    let payloadBody = raw;
    if (raw.slice(0, ZIP_KEY_FILE_PREFIX.length).toUpperCase() === ZIP_KEY_FILE_PREFIX) {
      payloadBody = raw.slice(ZIP_KEY_FILE_PREFIX.length).trim();
    }
    if (!payloadBody) {
      throw new Error("ZIP.KEY payload is empty.");
    }
    let jsonText = payloadBody;
    let decodedPayload = "";
    if (!payloadBody.startsWith("{")) {
      try {
        decodedPayload = decodeZipKeyPayloadBase64(payloadBody).trim();
      } catch (_) {
        decodedPayload = "";
      }
      if (decodedPayload.startsWith("{")) {
        jsonText = decodedPayload;
      } else {
        const keyValuePayload = parseZipKeyValueText(payloadBody);
        if (Object.keys(keyValuePayload).length) return keyValuePayload;
        const decodedKeyValuePayload = parseZipKeyValueText(decodedPayload);
        if (Object.keys(decodedKeyValuePayload).length) return decodedKeyValuePayload;
      }
    }
    if (!jsonText.startsWith("{")) {
      throw new Error("ZIP.KEY payload format is invalid.");
    }
    let parsed = null;
    try {
      parsed = JSON.parse(jsonText);
    } catch (_) {
      parsed = null;
    }
    if (!parsed || typeof parsed !== "object") {
      const fallbackKeyValuePayload = parseZipKeyValueText(decodedPayload || payloadBody);
      if (Object.keys(fallbackKeyValuePayload).length) return fallbackKeyValuePayload;
      throw new Error("ZIP.KEY payload is not valid JSON.");
    }
    return parsed;
  }

  function normalizeZipKeyConfig(rawConfig) {
    const payload = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
    const declaredServices = normalizeZipConfigServices(
      getZipKeyValueByPath(payload, "services")
      || getZipKeyValueByPath(payload, "meta.services")
      || getZipKeyValueByPath(payload, "service")
      || null
    );
    const clientId = readZipKeyValue(payload, [
      "services.slacktivation.client_id",
      "services.slacktivation.clientId",
      "services.slacktivation.oidc.client_id",
      "services.slacktivation.oidc.clientId",
      "slacktivation.client_id",
      "slacktivation.clientId",
      "slacktivation.oidc.client_id",
      "slacktivation.oidc.clientId",
      "slack.oidc.clientId",
      "slackOidc.clientId",
      ZIP_SLACK_CLIENT_ID_STORAGE_KEY,
      PASS_AI_SLACK_OIDC_CLIENT_ID_STORAGE_KEY,
      "ZIP_PASS_AI_SLACK_OIDC_CLIENT_ID",
      "client_id",
      "clientId"
    ]);
    const clientSecret = readZipKeyValue(payload, [
      "services.slacktivation.client_secret",
      "services.slacktivation.clientSecret",
      "services.slacktivation.oidc.client_secret",
      "services.slacktivation.oidc.clientSecret",
      "slacktivation.client_secret",
      "slacktivation.clientSecret",
      "slacktivation.oidc.client_secret",
      "slacktivation.oidc.clientSecret",
      "slack.oidc.clientSecret",
      "slackOidc.clientSecret",
      ZIP_SLACK_CLIENT_SECRET_STORAGE_KEY,
      PASS_AI_SLACK_OIDC_CLIENT_SECRET_STORAGE_KEY,
      "ZIP_PASS_AI_SLACK_OIDC_CLIENT_SECRET",
      "client_secret",
      "clientSecret"
    ]);
    const scope = normalizePassAiSlackOpenIdScope(readZipKeyValue(payload, [
      "services.slacktivation.scope",
      "services.slacktivation.oidc.scope",
      "slacktivation.scope",
      "slacktivation.oidc.scope",
      "slack.oidc.scope",
      "slackOidc.scope",
      ZIP_SLACK_SCOPE_STORAGE_KEY,
      PASS_AI_SLACK_OIDC_SCOPE_STORAGE_KEY,
      "ZIP_PASS_AI_SLACK_OIDC_SCOPE",
      "scope"
    ]));
    const redirectPath = normalizeZipKeyRedirectPath(readZipKeyValue(payload, [
      "services.slacktivation.redirect_path",
      "services.slacktivation.redirectPath",
      "services.slacktivation.oidc.redirect_path",
      "services.slacktivation.oidc.redirectPath",
      "slacktivation.redirect_path",
      "slacktivation.redirectPath",
      "slacktivation.oidc.redirect_path",
      "slacktivation.oidc.redirectPath",
      "slack.oidc.redirectPath",
      "slackOidc.redirectPath",
      ZIP_SLACK_REDIRECT_PATH_STORAGE_KEY,
      PASS_AI_SLACK_OIDC_REDIRECT_PATH_STORAGE_KEY,
      "ZIP_PASS_AI_SLACK_OIDC_REDIRECT_PATH",
      "redirect_path",
      "redirectPath"
    ]));
    const redirectUri = normalizeZipKeyRedirectUri(readZipKeyValue(payload, [
      "services.slacktivation.redirect_uri",
      "services.slacktivation.redirectUri",
      "services.slacktivation.oidc.redirect_uri",
      "services.slacktivation.oidc.redirectUri",
      "slacktivation.redirect_uri",
      "slacktivation.redirectUri",
      "slacktivation.oidc.redirect_uri",
      "slacktivation.oidc.redirectUri",
      "slack.oidc.redirectUri",
      "slackOidc.redirectUri",
      ZIP_SLACK_REDIRECT_URI_STORAGE_KEY,
      PASS_AI_SLACK_OIDC_REDIRECT_URI_STORAGE_KEY,
      "ZIP_PASS_AI_SLACK_OIDC_REDIRECT_URI",
      "redirect_uri",
      "redirectUri"
    ]));
    const userToken = normalizePassAiSlackApiToken(readZipKeyValue(payload, [
      "services.slacktivation.user_token",
      "services.slacktivation.userToken",
      "services.slacktivation.api.user_token",
      "services.slacktivation.api.userToken",
      "slacktivation.user_token",
      "slacktivation.userToken",
      "slacktivation.api.user_token",
      "slacktivation.api.userToken",
      "slack.api.userToken",
      "slackApi.userToken",
      ZIP_SLACK_USER_TOKEN_STORAGE_KEY,
      ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY,
      PASS_AI_SLACK_API_USER_TOKEN_STORAGE_KEY,
      "oauth_token",
      "user_token",
      "userToken"
    ]));
    const singularityChannelId = normalizePassAiSlackChannelId(readZipKeyValue(payload, [
      "services.slacktivation.singularity_channel_id",
      "services.slacktivation.singularityChannelId",
      "slacktivation.singularity_channel_id",
      "slacktivation.singularityChannelId",
      "slack.singularity.channelId",
      "singularity.channelId",
      ZIP_SINGULARITY_CHANNEL_ID_STORAGE_KEY,
      PASS_AI_SLACK_CHANNEL_STORAGE_KEY,
      "singularity_channel_id",
      "singularityChannelId"
    ]));
    const singularityMention = String(readZipKeyValue(payload, [
      "services.slacktivation.singularity_mention",
      "services.slacktivation.singularityMention",
      "slacktivation.singularity_mention",
      "slacktivation.singularityMention",
      "slack.singularity.mention",
      "singularity.mention",
      ZIP_SINGULARITY_MENTION_STORAGE_KEY,
      PASS_AI_SINGULARITY_MENTION_STORAGE_KEY,
      "singularity_mention",
      "singularityMention"
    ]) || "").trim();

    const missingFields = [];
    if (!clientId) missingFields.push("slacktivation.client_id");
    if (!clientSecret) missingFields.push("slacktivation.client_secret");
    if (!userToken) missingFields.push("slacktivation.user_token");
    if (missingFields.length) {
      throw new Error("ZIP.KEY is missing required SLACKTIVATION fields: " + missingFields.join(", ") + ".");
    }

    return {
      keyVersion: String(readZipKeyValue(payload, ["keyVersion", "version", "meta.version"]) || "").trim(),
      services: declaredServices.length
        ? declaredServices
        : [ZIP_SLACKTIVATION_SERVICE_KEY],
      oidc: {
        clientId,
        clientSecret,
        scope,
        redirectPath,
        redirectUri
      },
      api: {
        userToken
      },
      singularity: {
        channelId: singularityChannelId,
        mention: singularityMention
      }
    };
  }

  function getZipSecretStorageReadKeys() {
    return [
      ZIP_SLACK_CLIENT_ID_STORAGE_KEY,
      ZIP_SLACK_CLIENT_SECRET_STORAGE_KEY,
      ZIP_SLACK_SCOPE_STORAGE_KEY,
      ZIP_SLACK_REDIRECT_PATH_STORAGE_KEY,
      ZIP_SLACK_REDIRECT_URI_STORAGE_KEY,
      ZIP_SLACK_USER_TOKEN_STORAGE_KEY,
      ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY,
      ZIP_SLACK_KEY_LOADED_STORAGE_KEY,
      ZIP_SLACK_KEY_META_STORAGE_KEY,
      ZIP_SINGULARITY_CHANNEL_ID_STORAGE_KEY,
      ZIP_SINGULARITY_MENTION_STORAGE_KEY,
      PASS_AI_SLACK_OIDC_CLIENT_ID_STORAGE_KEY,
      PASS_AI_SLACK_OIDC_CLIENT_SECRET_STORAGE_KEY,
      PASS_AI_SLACK_OIDC_SCOPE_STORAGE_KEY,
      PASS_AI_SLACK_OIDC_REDIRECT_PATH_STORAGE_KEY,
      PASS_AI_SLACK_OIDC_REDIRECT_URI_STORAGE_KEY,
      PASS_AI_SLACK_API_USER_TOKEN_STORAGE_KEY,
      PASS_AI_SLACK_CHANNEL_STORAGE_KEY,
      PASS_AI_SINGULARITY_MENTION_STORAGE_KEY,
      ZIP_CONFIG_META_STORAGE_KEY
    ];
  }

  function normalizeZipSecretConfigShape(storedValues) {
    const stored = storedValues && typeof storedValues === "object" ? storedValues : {};
    const clientId = String(
      stored[ZIP_SLACK_CLIENT_ID_STORAGE_KEY]
      || stored[PASS_AI_SLACK_OIDC_CLIENT_ID_STORAGE_KEY]
      || ""
    ).trim();
    const clientSecret = String(
      stored[ZIP_SLACK_CLIENT_SECRET_STORAGE_KEY]
      || stored[PASS_AI_SLACK_OIDC_CLIENT_SECRET_STORAGE_KEY]
      || ""
    ).trim();
    const scope = normalizePassAiSlackOpenIdScope(
      stored[ZIP_SLACK_SCOPE_STORAGE_KEY]
      || stored[PASS_AI_SLACK_OIDC_SCOPE_STORAGE_KEY]
      || PASS_AI_SLACK_OIDC_DEFAULT_SCOPE
    );
    const redirectPath = normalizeZipKeyRedirectPath(
      stored[ZIP_SLACK_REDIRECT_PATH_STORAGE_KEY]
      || stored[PASS_AI_SLACK_OIDC_REDIRECT_PATH_STORAGE_KEY]
      || PASS_AI_SLACK_OIDC_DEFAULT_REDIRECT_PATH
    );
    const redirectUri = normalizeZipKeyRedirectUri(
      stored[ZIP_SLACK_REDIRECT_URI_STORAGE_KEY]
      || stored[PASS_AI_SLACK_OIDC_REDIRECT_URI_STORAGE_KEY]
      || ""
    );
    const userToken = normalizePassAiSlackApiToken(
      stored[ZIP_SLACK_USER_TOKEN_STORAGE_KEY]
      || stored[PASS_AI_SLACK_API_USER_TOKEN_STORAGE_KEY]
      || ""
    );
    const oauthToken = normalizePassAiSlackApiToken(
      stored[ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY]
      || userToken
      || ""
    );
    const singularityChannelId = normalizePassAiSlackChannelId(
      stored[ZIP_SINGULARITY_CHANNEL_ID_STORAGE_KEY]
      || stored[PASS_AI_SLACK_CHANNEL_STORAGE_KEY]
      || PASS_AI_SLACK_CHANNEL_DEFAULT
    ) || normalizePassAiSlackChannelId(PASS_AI_SLACK_CHANNEL_DEFAULT);
    const singularityMention = (function normalizeMention(value) {
      const raw = String(value || "").trim();
      if (!raw) return PASS_AI_SINGULARITY_MENTION_DEFAULT;
      if (/^<@[UW][A-Z0-9]{8,}>$/i.test(raw)) return raw;
      const plain = raw.startsWith("@") ? raw.slice(1).trim() : raw;
      if (!plain) return PASS_AI_SINGULARITY_MENTION_DEFAULT;
      if (plain.toLowerCase() === "singularity") return PASS_AI_SINGULARITY_MENTION_DEFAULT;
      return "@" + plain;
    })(
      stored[ZIP_SINGULARITY_MENTION_STORAGE_KEY]
      || stored[PASS_AI_SINGULARITY_MENTION_STORAGE_KEY]
      || PASS_AI_SINGULARITY_MENTION_DEFAULT
    );
    const hasRequired = !!(clientId && clientSecret && oauthToken);
    const keyLoaded = stored[ZIP_SLACK_KEY_LOADED_STORAGE_KEY] === true
      || (
        stored[ZIP_SLACK_KEY_LOADED_STORAGE_KEY] == null
        && hasRequired
      );
    const rawMeta = (
      stored[ZIP_SLACK_KEY_META_STORAGE_KEY]
      || stored[ZIP_CONFIG_META_STORAGE_KEY]
      || (typeof window !== "undefined" ? window.ZIP_CONFIG_META : null)
      || null
    );
    const meta = rawMeta && typeof rawMeta === "object"
      ? normalizeZipConfigMetaShape(rawMeta)
      : (
        hasRequired
          ? normalizeZipConfigMetaShape({ services: [ZIP_SLACKTIVATION_SERVICE_KEY] })
          : null
      );

    return {
      keyLoaded,
      clientId,
      clientSecret,
      scope,
      redirectPath,
      redirectUri,
      userToken,
      oauthToken,
      singularityChannelId,
      singularityMention,
      meta
    };
  }

  function getChromeStorageLocal(keys) {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local || typeof chrome.storage.local.get !== "function") {
        resolve({});
        return;
      }
      chrome.storage.local.get(keys, (items) => {
        void chrome.runtime.lastError;
        resolve(items && typeof items === "object" ? items : {});
      });
    });
  }

  function setChromeStorageLocal(values) {
    const payload = values && typeof values === "object" ? values : {};
    const keys = Object.keys(payload);
    if (!keys.length) return Promise.resolve();
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local || typeof chrome.storage.local.set !== "function") {
        resolve();
        return;
      }
      chrome.storage.local.set(payload, () => {
        void chrome.runtime.lastError;
        resolve();
      });
    });
  }

  function removeChromeStorageLocal(keys) {
    const list = Array.isArray(keys) ? keys.filter(Boolean) : [];
    if (!list.length) return Promise.resolve();
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local || typeof chrome.storage.local.remove !== "function") {
        resolve();
        return;
      }
      chrome.storage.local.remove(list, () => {
        void chrome.runtime.lastError;
        resolve();
      });
    });
  }

  function normalizePassAiSlacktivatedSessionCache(input) {
    const raw = input && typeof input === "object" ? input : null;
    if (!raw) return null;
    const workspaceOrigin = normalizeSlackWorkspaceOriginForTabs(
      raw.workspaceOrigin || PASS_AI_SLACK_WORKSPACE_ORIGIN
    );
    const workspaceHost = getSlackWorkspaceHostForTabs(PASS_AI_SLACK_WORKSPACE_ORIGIN);
    const parsedWorkspace = parseSlackTabUrl(workspaceOrigin);
    const host = parsedWorkspace ? String(parsedWorkspace.hostname || "").toLowerCase() : "";
    if (!isAllowedSlackWorkspaceHost(host, workspaceHost)) return null;

    const verifiedAtMs = Number(raw.verifiedAtMs || raw.verifiedAt || raw.cachedAtMs || 0);
    return {
      version: Number(raw.version || SLACKTIVATED_SESSION_CACHE_VERSION),
      mode: String(raw.mode || "").trim().toLowerCase() || "cached",
      workspaceOrigin,
      webReady: raw.webReady !== false,
      userId: String(raw.userId || raw.user_id || "").trim(),
      userName: String(raw.userName || raw.user_name || "").trim(),
      avatarUrl: normalizePassAiSlackAvatarUrl(raw.avatarUrl || raw.avatar_url || ""),
      teamId: String(raw.teamId || raw.team_id || "").trim().toUpperCase(),
      enterpriseId: String(raw.enterpriseId || raw.enterprise_id || "").trim().toUpperCase(),
      verifiedAtMs: Number.isFinite(verifiedAtMs) && verifiedAtMs > 0 ? verifiedAtMs : Date.now()
    };
  }

  async function readPassAiSlacktivatedSessionCache() {
    const stored = await getChromeStorageLocal([ZIP_SLACK_SESSION_CACHE_STORAGE_KEY]);
    return normalizePassAiSlacktivatedSessionCache(stored && stored[ZIP_SLACK_SESSION_CACHE_STORAGE_KEY]);
  }

  async function writePassAiSlacktivatedSessionCache(input) {
    const normalized = normalizePassAiSlacktivatedSessionCache(input);
    if (!normalized) return false;
    const payload = {
      ...normalized,
      version: SLACKTIVATED_SESSION_CACHE_VERSION,
      cachedAtMs: Date.now(),
      cachedAt: new Date().toISOString()
    };
    await setChromeStorageLocal({ [ZIP_SLACK_SESSION_CACHE_STORAGE_KEY]: payload });
    return true;
  }

  async function clearPassAiSlacktivatedSessionCache() {
    await removeChromeStorageLocal([ZIP_SLACK_SESSION_CACHE_STORAGE_KEY]);
  }

  async function hydratePassAiSlacktivatedStateFromCache(options) {
    const opts = options && typeof options === "object" ? options : {};
    if (!state.user) return false;
    if (!opts.force && slackSessionCacheHydrated) return isPassAiSlacktivated();
    const cached = await readPassAiSlacktivatedSessionCache().catch(() => null);
    slackSessionCacheHydrated = true;
    if (!cached) return false;
    setPassAiSlackAuthState({
      ready: true,
      mode: cached.mode || "cached",
      webReady: cached.webReady !== false,
      userId: cached.userId || "",
      userName: cached.userName || "",
      avatarUrl: cached.avatarUrl || "",
      teamId: cached.teamId || "",
      enterpriseId: cached.enterpriseId || "",
      skipPersist: true
    });
    return isPassAiSlacktivated();
  }

  async function refreshZipSecretConfigFromStorage() {
    const stored = await getChromeStorageLocal(getZipSecretStorageReadKeys());
    const normalized = normalizeZipSecretConfigShape(stored);
    state.zipSecretConfig = normalized;
    state.zipSecretConfigLoaded = true;
    if (typeof window !== "undefined") {
      window.ZIP_CONFIG_META = normalized.meta ? { ...normalized.meta } : null;
    }
    return normalized;
  }

  function collectLegacyZipLocalStorageValues() {
    const out = {};
    if (typeof window === "undefined" || !window.localStorage) return out;
    ZIP_LOCALSTORAGE_MIGRATION_SOURCE_KEYS.forEach((key) => {
      try {
        const value = String(window.localStorage.getItem(key) || "").trim();
        if (value) out[key] = value;
      } catch (_) {}
    });
    return out;
  }

  function clearLegacyZipLocalStorageKeys(keys) {
    const rows = Array.isArray(keys) && keys.length
      ? keys
      : ZIP_LOCALSTORAGE_MIGRATION_SOURCE_KEYS;
    if (typeof window === "undefined" || !window.localStorage) return;
    rows.forEach((key) => {
      try { window.localStorage.removeItem(String(key || "")); } catch (_) {}
    });
  }

  async function runZipLocalStorageMigration() {
    const legacy = collectLegacyZipLocalStorageValues();
    let response = null;
    try {
      response = await sendBackgroundRequest("ZIP_RUN_LOCALSTORAGE_MIGRATION", { legacy });
    } catch (_) {
      response = null;
    }
    const clearKeys = Array.isArray(response && response.clearLocalStorageKeys)
      ? response.clearLocalStorageKeys
      : ZIP_LOCALSTORAGE_MIGRATION_SOURCE_KEYS;
    clearLegacyZipLocalStorageKeys(clearKeys);
    return response;
  }

  async function persistZipKeyConfig(config) {
    const normalized = config && typeof config === "object" ? config : null;
    if (!normalized) throw new Error("ZIP.KEY configuration payload is invalid.");

    const services = normalizeZipConfigServices(
      normalized.services || (normalized.meta && normalized.meta.services) || null
    );
    const meta = normalizeZipConfigMetaShape({
      keyVersion: normalized.keyVersion || "",
      services: services.length ? services : [ZIP_SLACKTIVATION_SERVICE_KEY],
      importedAt: new Date().toISOString(),
      importedBuild: getCurrentZipBuildVersion(),
      source: "zip-key"
    });
    const payload = {
      oidc: {
        clientId: String(normalized.oidc && normalized.oidc.clientId || "").trim(),
        clientSecret: String(normalized.oidc && normalized.oidc.clientSecret || "").trim(),
        scope: normalizePassAiSlackOpenIdScope(normalized.oidc && normalized.oidc.scope),
        redirectPath: normalizeZipKeyRedirectPath(normalized.oidc && normalized.oidc.redirectPath),
        redirectUri: normalizeZipKeyRedirectUri(normalized.oidc && normalized.oidc.redirectUri)
      },
      api: {
        userToken: normalizePassAiSlackApiToken(normalized.api && normalized.api.userToken)
      },
      singularity: {
        channelId: normalizePassAiSlackChannelId(normalized.singularity && normalized.singularity.channelId),
        mention: String(normalized.singularity && normalized.singularity.mention || "").trim()
      },
      meta
    };
    const response = await sendBackgroundRequest("ZIP_IMPORT_KEY_PAYLOAD", { config: payload });
    if (!response || response.ok !== true) {
      throw new Error(String(response && response.error || "Unable to persist ZIP.KEY secrets."));
    }
    writeZipConfigMeta(meta);
    await refreshZipSecretConfigFromStorage();
  }

  function getZipConfigGateStatus() {
    const meta = readZipConfigMeta();
    const secretConfig = state && state.zipSecretConfig ? state.zipSecretConfig : null;
    const openIdConfig = getPassAiSlackOpenIdConfig();
    const requiredFieldState = {
      "slacktivation.client_id": !!String(openIdConfig.clientId || "").trim(),
      "slacktivation.client_secret": !!String(openIdConfig.clientSecret || "").trim(),
      "slacktivation.user_token": !!String(getPassAiSlackApiTokenConfig().userToken || "").trim()
    };
    const missingFields = ZIP_REQUIRED_CONFIG_FIELDS.filter((field) => !requiredFieldState[field]);

    let reason = "";
    if (!secretConfig || secretConfig.keyLoaded !== true) reason = "missing_meta";
    else if (missingFields.length) reason = "missing_fields";

    return {
      ready: !reason,
      reason,
      missingFields,
      meta
    };
  }

  function getZipConfigGateMessage(status) {
    const gateStatus = status && typeof status === "object" ? status : getZipConfigGateStatus();
    if (gateStatus.reason === "missing_fields") {
      return "ZIP.KEY is missing required SLACKTIVATION settings. Please drop an updated ZIP.KEY to activate ZIP.";
    }
    if (gateStatus.ready) {
      return "ZIP.KEY loaded. You can now sign in with Zendesk.";
    }
    return "Please drop ZIP.KEY to activate ZIP.";
  }

  function getZipConfigGateMetaText(status) {
    const gateStatus = status && typeof status === "object" ? status : getZipConfigGateStatus();
    if (gateStatus.reason === "missing_fields" && gateStatus.missingFields.length) {
      return "Missing: " + gateStatus.missingFields.join(", ");
    }
    const importedAt = String(gateStatus.meta && gateStatus.meta.importedAt || "").trim();
    const services = normalizeZipConfigServices(gateStatus.meta && gateStatus.meta.services);
    if (gateStatus.ready && importedAt) {
      return services.length
        ? ("Loaded " + importedAt + ". Services: " + services.join(", ") + ".")
        : ("Loaded " + importedAt + ".");
    }
    return "Supports ZIPKEY1 files (JSON or KEY=VALUE).";
  }

  function applyZipConfigGate(status) {
    const gateStatus = status && typeof status === "object" ? status : getZipConfigGateStatus();
    state.zipConfigReady = !!gateStatus.ready;
    state.zipConfigReason = gateStatus.reason || "";
    state.zipConfigMissingFields = Array.isArray(gateStatus.missingFields)
      ? gateStatus.missingFields.slice()
      : [];
    document.body.classList.toggle("zip-config-locked", !gateStatus.ready);
    if (els.loginBtn) {
      els.loginBtn.disabled = !gateStatus.ready;
      els.loginBtn.classList.toggle("hidden", !gateStatus.ready);
    }
    if (els.configGate) {
      els.configGate.classList.toggle("hidden", gateStatus.ready);
    }
    if (els.configGateMessage) {
      els.configGateMessage.textContent = getZipConfigGateMessage(gateStatus);
    }
    if (els.configGateMeta) {
      els.configGateMeta.textContent = getZipConfigGateMetaText(gateStatus);
      els.configGateMeta.classList.toggle("is-error", !gateStatus.ready && gateStatus.reason !== "missing_meta");
    }
    return gateStatus;
  }

  function enforceZipConfigGate(options) {
    const opts = options && typeof options === "object" ? options : {};
    const status = applyZipConfigGate(getZipConfigGateStatus());
    if (!status.ready && opts.reportStatus !== false) {
      setStatus(getZipConfigGateMessage(status), status.reason === "missing_fields");
    }
    return status;
  }

  function applyZipConfigAfterStorageRefresh(options) {
    const status = enforceZipConfigGate(options && typeof options === "object"
      ? options
      : { reportStatus: false });
    if (!status.ready && state.user) {
      showLogin();
    }
    return status;
  }

  function setZipConfigDropBusy(on) {
    const busy = !!on;
    if (els.configDropZone) {
      els.configDropZone.disabled = busy;
      els.configDropZone.classList.toggle("is-processing", busy);
    }
    if (els.configDropAction) {
      els.configDropAction.textContent = busy
        ? "Importing ZIP.KEY…"
        : "DROP ZIP.KEY TO ACTIVATE";
    }
  }

  function pickZipConfigFile(fileList) {
    if (!fileList || typeof fileList.length !== "number") return null;
    for (let i = 0; i < fileList.length; i += 1) {
      const file = fileList[i];
      if (file && typeof file.text === "function") return file;
    }
    return null;
  }

  async function importZipKeyFromFile(file) {
    if (!file || typeof file.text !== "function") {
      throw new Error("No ZIP.KEY file was provided.");
    }
    setZipConfigDropBusy(true);
    try {
      const fileText = await file.text();
      const parsed = parseZipKeyPayload(fileText);
      const normalized = normalizeZipKeyConfig(parsed);
      await persistZipKeyConfig(normalized);
      const gateStatus = enforceZipConfigGate({ reportStatus: false });
      if (!gateStatus.ready) {
        throw new Error("ZIP.KEY loaded, but required ZIP configuration is still incomplete.");
      }
      setStatus("ZIP.KEY loaded. Checking Zendesk session…", false);
      await hydrateAuthStateFromBackground({
        forceCheck: true,
        reason: "zip_key_import",
        reportLockedStatus: false
      });
    } catch (err) {
      const message = String((err && err.message) || "Unable to import ZIP.KEY.").trim() || "Unable to import ZIP.KEY.";
      enforceZipConfigGate({ reportStatus: false });
      if (els.configGateMeta) {
        els.configGateMeta.textContent = message;
        els.configGateMeta.classList.add("is-error");
      }
      setStatus(message, true);
      throw err;
    } finally {
      setZipConfigDropBusy(false);
      if (els.configFileInput) els.configFileInput.value = "";
    }
  }

  function normalizePassAiSlackOpenIdScope(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return PASS_AI_SLACK_OIDC_DEFAULT_SCOPE;
    const parts = raw.split(/[\s,]+/).map((part) => part.trim()).filter(Boolean);
    const allowed = new Set(["openid", "profile", "email"]);
    const unique = [];
    for (let i = 0; i < parts.length; i += 1) {
      const scope = parts[i];
      if (!allowed.has(scope)) continue;
      if (!unique.includes(scope)) unique.push(scope);
    }
    if (!unique.includes("openid")) unique.unshift("openid");
    return unique.length ? unique.join(" ") : PASS_AI_SLACK_OIDC_DEFAULT_SCOPE;
  }

  function getOfficialSlackRedirectUriForRuntime() {
    const runtimeId = String(
      typeof chrome !== "undefined"
      && chrome.runtime
      && typeof chrome.runtime.id === "string"
        ? chrome.runtime.id
        : ""
    ).trim();
    if (!runtimeId) return "";
    if (runtimeId === ZIP_OFFICIAL_EXTENSION_ID) return ZIP_OFFICIAL_SLACK_REDIRECT_URI;
    return "";
  }

  function getPassAiSlackOpenIdConfig() {
    const secretConfig = state && state.zipSecretConfig && typeof state.zipSecretConfig === "object"
      ? state.zipSecretConfig
      : null;
    const clientId = String(secretConfig && secretConfig.clientId || "").trim();
    const clientSecret = String(secretConfig && secretConfig.clientSecret || "").trim();
    const scope = normalizePassAiSlackOpenIdScope(secretConfig && secretConfig.scope);
    const redirectPath = normalizeZipKeyRedirectPath(
      secretConfig && secretConfig.redirectPath
    );
    const officialRedirectUri = getOfficialSlackRedirectUriForRuntime();
    const redirectUri = officialRedirectUri || normalizeZipKeyRedirectUri(
      secretConfig && secretConfig.redirectUri
    );
    return {
      clientId,
      clientSecret,
      scope,
      redirectPath,
      redirectUri
    };
  }

  function hasPassAiSlackOpenIdConfig(config) {
    const cfg = config && typeof config === "object" ? config : getPassAiSlackOpenIdConfig();
    return !!(
      String(cfg.clientId || "").trim()
      && String(cfg.clientSecret || "").trim()
      && String(cfg.redirectUri || "").trim()
    );
  }

  function normalizePassAiSlackApiToken(value) {
    const token = String(value || "").trim();
    if (!token) return "";
    const tokenLooksValid = /^(xox[a-z]-|xoxe\.xox[a-z]-)/i.test(token);
    return tokenLooksValid ? token : "";
  }

  function getPassAiSlackApiTokenConfig() {
    const secretConfig = state && state.zipSecretConfig && typeof state.zipSecretConfig === "object"
      ? state.zipSecretConfig
      : null;
    const userToken = normalizePassAiSlackApiToken(
      (secretConfig && (secretConfig.userToken || secretConfig.oauthToken)) || ""
    );
    return { userToken };
  }

  function hasPassAiSlackApiTokenConfig(config) {
    const cfg = config && typeof config === "object" ? config : getPassAiSlackApiTokenConfig();
    return !!cfg.userToken;
  }

  function persistPassAiSlackApiTokenConfig(config) {
    const cfg = config && typeof config === "object" ? config : getPassAiSlackApiTokenConfig();
    const updates = {};
    const removals = [
      PASS_AI_SLACK_API_BOT_TOKEN_STORAGE_KEY,
      PASS_AI_SLACK_API_USER_TOKEN_STORAGE_KEY,
      "zip.passAi.slackBotToken",
      "zip.passAi.slackUserToken"
    ];
    const userToken = normalizePassAiSlackApiToken(cfg.userToken);
    removals.push(ZIP_SLACK_BOT_TOKEN_STORAGE_KEY);
    if (userToken) {
      updates[ZIP_SLACK_USER_TOKEN_STORAGE_KEY] = userToken;
      updates[ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY] = userToken;
    } else {
      removals.push(ZIP_SLACK_USER_TOKEN_STORAGE_KEY);
      removals.push(ZIP_SLACK_OAUTH_TOKEN_STORAGE_KEY);
    }
    return Promise.all([
      setChromeStorageLocal(updates),
      removeChromeStorageLocal(removals)
    ]).then(() => refreshZipSecretConfigFromStorage().then(() => true).catch(() => true));
  }

  function normalizePassAiSlackOpenIdAuthResponse(response) {
    const payload = response && typeof response === "object" ? response : {};
    if (!payload || payload.ok !== true) return null;
    return {
      ready: true,
      mode: "openid",
      webReady: true,
      userId: payload.user_id || payload.userId || "",
      userName: payload.user_name || payload.userName || payload.display_name || payload.displayName || "",
      avatarUrl: payload.avatar_url || payload.avatarUrl || "",
      teamId: payload.team_id || payload.teamId || ""
    };
  }

  async function refreshPassAiSlackOpenIdStatus(options) {
    const opts = options && typeof options === "object" ? options : {};
    const silent = !!opts.silent;
    const config = getPassAiSlackOpenIdConfig();
    if (!hasPassAiSlackOpenIdConfig(config)) return false;
    try {
      const response = await sendBackgroundRequest("ZIP_SLACK_OPENID_STATUS", {});
      const nextState = normalizePassAiSlackOpenIdAuthResponse(response);
      if (!nextState) return false;
      setPassAiSlackAuthState(nextState);
      if (!silent) setStatus("ZIP is now SLACKTIVATED.", false);
      return true;
    } catch (_) {
      return false;
    }
  }

  async function runPassAiSlackOpenIdAuth(options) {
    const opts = options && typeof options === "object" ? options : {};
    const interactive = opts.interactive !== false;
    const config = getPassAiSlackOpenIdConfig();
    if (!hasPassAiSlackOpenIdConfig(config)) {
      return { ok: false, error: "Slack OpenID client credentials are not configured." };
    }
    const response = await sendBackgroundRequest("ZIP_SLACK_OPENID_AUTH", {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      scope: config.scope,
      redirectPath: config.redirectPath,
      redirectUri: config.redirectUri,
      interactive
    });
    const nextState = normalizePassAiSlackOpenIdAuthResponse(response);
    if (nextState) {
      setPassAiSlackAuthState(nextState);
    }
    return response && typeof response === "object"
      ? response
      : { ok: false, error: "Slack OpenID authentication did not return a response." };
  }

  function buildPassAiSlackWorkspaceLandingUrl() {
    // Use workspace root to let Slack resolve the active account/team automatically.
    return PASS_AI_SLACK_WORKSPACE_ORIGIN + "/";
  }

  function normalizeExistingTicketComments(comments) {
    const rows = Array.isArray(comments) ? comments : [];
    const normalizedRows = rows.map((comment) => ({
      type: normalizePassAiCommentType(comment && comment.type),
      author: String((comment && comment.author) || "").trim(),
      body: normalizePassAiCommentBody(comment && comment.body),
      createdAt: String((comment && comment.createdAt) || "").trim()
    })).filter((comment) => comment.body);
    normalizedRows.sort((a, b) => toEpochMs(a.createdAt) - toEpochMs(b.createdAt));
    return normalizedRows;
  }

  function getCurrentTicketContext() {
    if (typeof window === "undefined") return null;
    const current = window.currentTicket;
    if (!current || typeof current !== "object") return null;
    return current;
  }

  function syncCurrentTicketContextFromSelection(ticketId) {
    const current = getCurrentTicketContext() || {};
    const synced = {
      ...current,
      id: normalizeTicketContextId(ticketId || current.id || ""),
      product: normalizePassProduct(current.product),
      agentEmail: String((current && current.agentEmail) || (state.user && state.user.email) || "").trim(),
      comments: normalizeExistingTicketComments(current.comments)
    };
    if (typeof window !== "undefined") {
      window.currentTicket = synced;
    }
    return synced;
  }

  function getSelectedPassAiTicketId() {
    const selectedTicketId = normalizeZendeskTicketId(state.selectedTicketId);
    return selectedTicketId != null ? selectedTicketId : null;
  }

  function setPassAiLastThreadContext(context) {
    if (!context || typeof context !== "object") {
      state.passAiLastThreadContext = null;
      state.passAiDeleteInFlight = false;
      return;
    }
    const channelId = normalizePassAiSlackChannelId(context.channelId || context.channel_id || "");
    const parentTs = normalizePassAiCommentBody(context.parentTs || context.parent_ts || context.threadTs || context.thread_ts);
    if (!channelId || !parentTs) {
      state.passAiLastThreadContext = null;
      state.passAiDeleteInFlight = false;
      return;
    }
    state.passAiLastThreadContext = {
      channelId,
      parentTs,
      workspaceOrigin: String(context.workspaceOrigin || PASS_AI_SLACK_WORKSPACE_ORIGIN).trim() || PASS_AI_SLACK_WORKSPACE_ORIGIN
    };
    state.passAiDeleteInFlight = false;
  }

  function getPassAiLastThreadContext() {
    const context = state.passAiLastThreadContext;
    if (!context || typeof context !== "object") return null;
    const channelId = normalizePassAiSlackChannelId(context.channelId || "");
    const parentTs = normalizePassAiCommentBody(context.parentTs || "");
    if (!channelId || !parentTs) return null;
    return {
      channelId,
      parentTs,
      workspaceOrigin: String(context.workspaceOrigin || PASS_AI_SLACK_WORKSPACE_ORIGIN).trim() || PASS_AI_SLACK_WORKSPACE_ORIGIN
    };
  }

  function clearPassAiResultsDisplay(options) {
    const keepPanelVisible = !!(options && options.keepPanelVisible);
    const resetQuestion = !(options && options.resetQuestion === false);
    const keepThreadContext = !!(options && options.keepThreadContext);
    if (!keepThreadContext) {
      setPassAiLastThreadContext(null);
    }
    if (els.passAiError) {
      els.passAiError.textContent = "";
      els.passAiError.classList.add("hidden");
    }
    if (els.passAiQuestionLabel && resetQuestion) els.passAiQuestionLabel.classList.add("hidden");
    if (els.passAiQuestion) {
      if (resetQuestion) {
        els.passAiQuestion.value = "";
        els.passAiQuestion.classList.add("hidden");
      } else {
        els.passAiQuestion.classList.remove("hidden");
      }
    }
    if (els.passAiDynamicReplyHost) {
      els.passAiDynamicReplyHost.innerHTML = "";
      els.passAiDynamicReplyHost.classList.add("hidden");
    }
    if (els.passAiInlineStatus) {
      els.passAiInlineStatus.classList.add("hidden");
    }
    if (els.passAiAnswerBlock && !keepPanelVisible) {
      els.passAiAnswerBlock.classList.add("hidden");
    }
    if (els.passAiResultsBox && !keepPanelVisible) {
      els.passAiResultsBox.classList.add("hidden");
    }
    updatePassAiAnswerPlaceholder();
  }

  function setPassAiQuestionLabel(ticketId) {
    const normalizedTicketId = normalizeZendeskTicketId(ticketId) || getSelectedPassAiTicketId();
    const labelText = normalizedTicketId != null
      ? ("ZD #" + normalizedTicketId + " says:")
      : "ZD #{ticket_id} says:";
    if (!els.passAiQuestionLabel) return;
    els.passAiQuestionLabel.textContent = labelText;
    els.passAiQuestionLabel.classList.remove("hidden");
  }

  function setPassAiLoading(on) {
    state.passAiLoading = !!on;
    applyGlobalBusyUi();
    updateTicketActionButtons();
  }

  function setPassAiConversationInFlight(on) {
    const next = !!on;
    if (state.passAiConversationInFlight === next) return;
    state.passAiConversationInFlight = next;
    applyGlobalBusyUi();
    updateTicketActionButtons();
  }

  function stopPassAiSlackAuthPolling() {
    if (passAiSlackAuthPollTimerId != null) {
      window.clearTimeout(passAiSlackAuthPollTimerId);
      passAiSlackAuthPollTimerId = null;
    }
    passAiSlackAuthPollAttempt = 0;
    if (state.passAiSlackAuthPolling) {
      state.passAiSlackAuthPolling = false;
      applyGlobalBusyUi();
      updateTicketActionButtons();
    }
  }

  function setPassAiSlackAuthState(nextState) {
    const ready = !!(nextState && nextState.ready);
    const requestedMode = String(nextState && nextState.mode || "").trim().toLowerCase();
    const skipPersist = !!(nextState && nextState.skipPersist);
    const clearPersisted = !!(nextState && nextState.clearPersisted);
    const priorUserId = String(state.passAiSlackUserId || "").trim();
    const priorUserName = String(state.passAiSlackUserName || "").trim();
    const priorAvatarUrl = normalizePassAiSlackAvatarUrl(state.passAiSlackAvatarUrl || "");
    const requestedUserId = String((nextState && nextState.userId) || "").trim();
    const requestedUserName = String(
      (nextState && (nextState.userName || nextState.user_name || nextState.displayName || nextState.display_name))
      || ""
    ).trim();
    const requestedAvatarUrl = normalizePassAiSlackAvatarUrl(nextState && (nextState.avatarUrl || nextState.avatar_url || ""));
    const preservePreviousIdentity = !requestedUserId || !priorUserId || requestedUserId === priorUserId;
    const hasRequestedWebReady = !!(
      nextState
      && Object.prototype.hasOwnProperty.call(nextState, "webReady")
    );
    const requestedWebReady = hasRequestedWebReady
      ? !!(nextState && nextState.webReady)
      : (requestedMode ? requestedMode === "web" : ready);
    state.passAiSlackReady = ready;
    state.passAiSlackWebReady = state.passAiSlackReady && !!requestedWebReady;
    state.passAiSlackUserId = state.passAiSlackReady
      ? (requestedUserId || priorUserId)
      : "";
    state.passAiSlackUserName = state.passAiSlackReady
      ? (requestedUserName || (preservePreviousIdentity ? priorUserName : ""))
      : "";
    state.passAiSlackAvatarUrl = state.passAiSlackReady
      ? (requestedAvatarUrl || (preservePreviousIdentity ? priorAvatarUrl : ""))
      : "";
    if (state.passAiSlackReady) {
      state.passAiSlackAuthError = "";
    } else {
      state.passAiSlackAuthError = String((nextState && nextState.error) || "").trim();
    }
    updateTicketActionButtons();

    if (clearPersisted) {
      slackSessionCacheHydrated = true;
      clearPassAiSlacktivatedSessionCache().catch(() => {});
      return;
    }
    if (!state.passAiSlackReady || skipPersist) return;

    slackSessionCacheHydrated = true;
    writePassAiSlacktivatedSessionCache({
      version: SLACKTIVATED_SESSION_CACHE_VERSION,
      mode: requestedMode || "api",
      workspaceOrigin: PASS_AI_SLACK_WORKSPACE_ORIGIN,
      webReady: state.passAiSlackWebReady,
      userId: state.passAiSlackUserId || "",
      userName: state.passAiSlackUserName || "",
      avatarUrl: state.passAiSlackAvatarUrl || "",
      teamId: String((nextState && (nextState.teamId || nextState.team_id)) || "").trim().toUpperCase(),
      enterpriseId: String((nextState && (nextState.enterpriseId || nextState.enterprise_id)) || "").trim().toUpperCase(),
      verifiedAtMs: Date.now()
    }).catch(() => {});
  }

  async function refreshPassAiSlackAuth(options) {
    const opts = options && typeof options === "object" ? options : {};
    const silent = !!opts.silent;
    const allowOpenIdSilentProbe = opts.allowOpenIdSilentProbe !== false;
    const allowSlackTabBootstrap = opts.allowSlackTabBootstrap === true;
    const allowSlackTabBootstrapCreate = opts.allowSlackTabBootstrapCreate !== false;
    const openIdConfig = getPassAiSlackOpenIdConfig();
    const openIdEnabled = hasPassAiSlackOpenIdConfig(openIdConfig);
    if (openIdEnabled) {
      const openIdReady = await refreshPassAiSlackOpenIdStatus({ silent: true }).catch(() => false);
      if (openIdReady) {
        if (!silent) setStatus("ZIP is now SLACKTIVATED.", false);
        return true;
      }
    }

    if (allowOpenIdSilentProbe && openIdEnabled) {
      const nowMs = Date.now();
      if (nowMs - Number(slackOpenIdSilentProbeLastAt || 0) >= SLACK_OPENID_SILENT_PROBE_MIN_GAP_MS) {
        slackOpenIdSilentProbeLastAt = nowMs;
        const silentOpenId = await runPassAiSlackOpenIdAuth({ interactive: false }).catch(() => null);
        if (silentOpenId && silentOpenId.ok === true && isPassAiSlacktivated()) {
          if (!silent) setStatus("ZIP is now SLACKTIVATED.", false);
          return true;
        }
      }
    }

    await hydratePassAiSlacktivatedStateFromCache({ force: false }).catch(() => false);

    // API-level token validation supports auto-SLACKTIVATION without requiring an open Slack tab.
    let apiFailureCode = "";
    let apiFailureMessage = "";
    try {
      const apiStatus = await sendBackgroundRequest("ZIP_SLACK_API_AUTH_TEST", {
        workspaceOrigin: PASS_AI_SLACK_WORKSPACE_ORIGIN,
        userId: state.passAiSlackUserId || "",
        userName: state.passAiSlackUserName || "",
        avatarUrl: state.passAiSlackAvatarUrl || "",
        userToken: getPassAiSlackApiTokenConfig().userToken || ""
      });
      if (apiStatus && apiStatus.ok === true) {
        let apiUserId = String(apiStatus.user_id || apiStatus.userId || state.passAiSlackUserId || "").trim();
        let apiUserName = String(apiStatus.user_name || apiStatus.userName || state.passAiSlackUserName || "").trim();
        let apiAvatarUrl = normalizePassAiSlackAvatarUrl(
          apiStatus.avatar_url || apiStatus.avatarUrl || state.passAiSlackAvatarUrl || ""
        );
        let apiTeamId = String(apiStatus.team_id || apiStatus.teamId || "").trim();
        let apiEnterpriseId = String(apiStatus.enterprise_id || apiStatus.enterpriseId || "").trim();

        if (!apiAvatarUrl || !apiUserName) {
          const identityFromTab = await enrichPassAiSlackIdentityFromExistingTab({ force: false });
          if (identityFromTab) {
            if (!apiUserId) apiUserId = String(identityFromTab.userId || "").trim();
            if (!apiUserName) apiUserName = String(identityFromTab.userName || "").trim();
            if (!apiAvatarUrl) apiAvatarUrl = normalizePassAiSlackAvatarUrl(identityFromTab.avatarUrl || "");
            if (!apiTeamId) apiTeamId = String(identityFromTab.teamId || "").trim();
            if (!apiEnterpriseId) apiEnterpriseId = String(identityFromTab.enterpriseId || "").trim();
            if (identityFromTab.userToken) {
              await persistPassAiSlackApiTokenConfig({
                userToken: identityFromTab.userToken
              }).catch(() => {});
            }
          }
        }
        setPassAiSlackAuthState({
          ready: true,
          mode: "api",
          webReady: true,
          userId: apiUserId,
          userName: apiUserName,
          avatarUrl: apiAvatarUrl,
          teamId: apiTeamId,
          enterpriseId: apiEnterpriseId
        });
        if (!silent) setStatus("ZIP is now SLACKTIVATED.", false);
        return true;
      }
      apiFailureCode = String(apiStatus && apiStatus.code || "").trim().toLowerCase();
      apiFailureMessage = normalizePassAiCommentBody(apiStatus && (apiStatus.error || apiStatus.message));
    } catch (_) {}
    if (isSlackApiTokenInvalidationCode(apiFailureCode)) {
      setPassAiSlackAuthState({
        ready: false,
        error: apiFailureMessage || "Slack session expired. Click the Slack indicator to sign in again.",
        clearPersisted: true
      });
    }

    const requestSlackAuthTest = async () => {
      const response = await sendToSlackTabWithAutoBootstrap({
        action: "slackAuthTest",
        workspaceOrigin: PASS_AI_SLACK_WORKSPACE_ORIGIN
      }, {
        bootstrap: allowSlackTabBootstrap,
        allowCreateTab: allowSlackTabBootstrapCreate,
        onBootstrap: () => {
          if (!silent) {
            setStatus("Preparing adobedx.slack.com web session for Slack auth…", false);
          }
        }
      });
      const ready = !!(
        response
        && response.ok === true
        && (
          response.ready === true
          || response.ready == null
        )
      );
      if (!ready) {
        throw new Error(
          normalizePassAiCommentBody(response && (response.error || response.message))
            || "Slack web session is unavailable."
        );
      }
      return response;
    };

    try {
      const response = await requestSlackAuthTest();
      const capturedWebToken = normalizePassAiSlackApiToken(
        response && (
          response.session_token
          || response.web_token
          || response.user_token
          || response.token
        )
      );
      if (capturedWebToken) {
        await persistPassAiSlackApiTokenConfig({
          userToken: capturedWebToken
        }).catch(() => {});
      }
      setPassAiSlackAuthState({
        ready: true,
        mode: "web",
        webReady: true,
        userId: response.user_id || response.userId || "",
        userName: response.user_name || response.userName || response.display_name || response.displayName || "",
        avatarUrl: response.avatar_url || response.avatarUrl || "",
        teamId: response.team_id || response.teamId || "",
        enterpriseId: response.enterprise_id || response.enterpriseId || ""
      });
      if (!state.passAiSlackReady) {
        const message = state.passAiSlackAuthError || "Slack sign-in is required.";
        if (!silent) setStatus(message, true);
        return false;
      }
      if (!silent) setStatus("ZIP is now SLACKTIVATED.", false);
      return true;
    } catch (tabErr) {
      const wasReady = isPassAiSlacktivated();
      const message = normalizePassAiCommentBody(tabErr && tabErr.message) || "Slack sign-in is required.";
      if (wasReady && isTransientSlackAuthProbeFailureMessage(message)) {
        return true;
      }
      setPassAiSlackAuthState({ ready: false, error: message });
      if (!silent) {
        setStatus(SLACKTIVATED_LOGIN_TOOLTIP, true);
      }
      return false;
    }
  }

  async function refreshSlacktivatedState(options) {
    const opts = options && typeof options === "object" ? options : {};
    if (!state.user) {
      setPassAiSlackAuthState({ ready: false, error: "" });
      return false;
    }
    const force = !!opts.force;
    const nowMs = Date.now();
    if (!force && slackAuthCheckInFlight) {
      return isPassAiSlacktivated();
    }
    if (!force && nowMs - Number(slackAuthCheckLastAt || 0) < SLACK_AUTH_AUTO_REFRESH_MIN_GAP_MS) {
      return isPassAiSlacktivated();
    }

    slackAuthCheckInFlight = true;
    applyGlobalBusyUi();
    slackAuthCheckLastAt = nowMs;
    try {
      return await refreshPassAiSlackAuth({
        silent: opts.silent !== false,
        allowOpenIdSilentProbe: opts.allowOpenIdSilentProbe !== false,
        allowSlackTabBootstrap: opts.allowSlackTabBootstrap === true,
        allowSlackTabBootstrapCreate: opts.allowSlackTabBootstrapCreate !== false
      });
    } finally {
      slackAuthCheckInFlight = false;
      applyGlobalBusyUi();
    }
  }

  function startPassAiSlackAuthPolling(options) {
    const opts = options && typeof options === "object" ? options : {};
    void opts;
    stopPassAiSlackAuthPolling();
    state.passAiSlackAuthPolling = true;
    applyGlobalBusyUi();
    passAiSlackAuthPollAttempt = 0;
    // After a user-initiated Slack login click, allow an immediate silent OpenID probe.
    slackOpenIdSilentProbeLastAt = 0;
    updateTicketActionButtons();

    const poll = () => {
      passAiSlackAuthPollAttempt += 1;
      refreshPassAiSlackAuth({ silent: true, allowOpenIdSilentProbe: false, allowSlackTabBootstrap: true })
        .then((ready) => {
          if (ready) {
            stopPassAiSlackAuthPolling();
            setStatus("Slack sign-in detected. ZIP is now SLACKTIVATED.", false);
            return;
          }
          if (passAiSlackAuthPollAttempt >= PASS_AI_SLACK_AUTH_POLL_MAX_ATTEMPTS) {
            stopPassAiSlackAuthPolling();
            setStatus("Slack sign-in not detected yet. Retry the SLACKTIVATED login.", true);
            return;
          }
          passAiSlackAuthPollTimerId = window.setTimeout(poll, PASS_AI_SLACK_AUTH_POLL_INTERVAL_MS);
        })
        .catch(() => {
          if (passAiSlackAuthPollAttempt >= PASS_AI_SLACK_AUTH_POLL_MAX_ATTEMPTS) {
            stopPassAiSlackAuthPolling();
            setStatus("Slack sign-in not detected yet. Retry the SLACKTIVATED login.", true);
            return;
          }
          passAiSlackAuthPollTimerId = window.setTimeout(poll, PASS_AI_SLACK_AUTH_POLL_INTERVAL_MS);
        });
    };

    passAiSlackAuthPollTimerId = window.setTimeout(poll, PASS_AI_SLACK_AUTH_POLL_INTERVAL_MS);
  }

  async function beginSlackLoginFlow() {
    stopPassAiSlackAuthPolling();
    state.passAiSlackAuthError = "";
    updateTicketActionButtons();
    setStatus("Checking adobedx.slack.com session…", false);
    try {
      const alreadyReady = await refreshPassAiSlackAuth({ silent: true, allowOpenIdSilentProbe: false });
      if (alreadyReady && state.passAiSlackReady) {
        setStatus("ZIP is now SLACKTIVATED.", false);
        return;
      }

      const openIdConfig = getPassAiSlackOpenIdConfig();
      if (hasPassAiSlackOpenIdConfig(openIdConfig)) {
        const interactiveOpenId = await runPassAiSlackOpenIdAuth({ interactive: true }).catch(() => null);
        if (interactiveOpenId && interactiveOpenId.ok === true) {
          setStatus("ZIP is now SLACKTIVATED.", false);
          return;
        }
      }

      const loginUrl = buildPassAiSlackLoginUrl();
      let opened = null;
      let existingSlackTabs = await querySlackTabsFromSidepanel({ injectableOnly: true }).catch(() => []);
      if (!Array.isArray(existingSlackTabs) || !existingSlackTabs.length) {
        existingSlackTabs = await querySlackTabsFromSidepanel({ injectableOnly: false }).catch(() => []);
      }
      if (Array.isArray(existingSlackTabs) && existingSlackTabs.length > 0 && existingSlackTabs[0] && existingSlackTabs[0].id != null) {
        opened = await focusSlackWorkspaceTab(existingSlackTabs[0].id, loginUrl);
      } else {
        opened = await openSlackWorkspaceTab(loginUrl, { active: true });
      }
      const openedTabId = Number(opened && opened.tabId);
      if (Number.isFinite(openedTabId) && openedTabId > 0) {
        state.slackTabId = openedTabId;
      }
      await wait(450);
      // Re-arm silent probe after opening/focusing Slack so auto-login can be picked up immediately.
      slackOpenIdSilentProbeLastAt = 0;
      const readyNow = await refreshPassAiSlackAuth({ silent: true, allowOpenIdSilentProbe: false, allowSlackTabBootstrap: false });
      if (readyNow) {
        setStatus("ZIP is now SLACKTIVATED.", false);
        return;
      }

      startPassAiSlackAuthPolling();
      setStatus("Complete Slack sign-in in the adobedx.slack.com tab.", false);
    } catch (err) {
      const message = normalizePassAiCommentBody(err && err.message) || "Slack sign-in failed.";
      setPassAiSlackAuthState({ ready: false, error: message });
      setStatus("Slack sign-in failed: " + message, true);
      state.passAiSlackAuthPolling = false;
      applyGlobalBusyUi();
      updateTicketActionButtons();
    }
  }

  async function ensurePassAiSlackSession() {
    if (isPassAiSlacktivated()) return true;
    throw new Error("Slack sign-in is required. Click the Slack indicator and complete login at adobedx.slack.com.");
  }

  function renderPassAiError(message) {
    const text = message || "PASS AI is unavailable right now. Please try again.";
    if (els.passAiError) {
      els.passAiError.textContent = text;
      els.passAiError.classList.remove("hidden");
    }
    renderPassAiAnswer(text, {
      error: true,
      showCopy: false,
      showDelete: !!getPassAiLastThreadContext(),
      title: "AI Error"
    });
  }

  function getPassAiDynamicReplyHost() {
    if (els.passAiDynamicReplyHost) return els.passAiDynamicReplyHost;
    if (!els.passAiResultsBox || !els.passAiResultsBox.parentNode) return null;
    const host = document.createElement("div");
    host.id = "zipPassAiDynamicReplyHost";
    host.className = "zip-pass-ai-dynamic-host";
    host.setAttribute("aria-live", "polite");
    const answerBlock = els.passAiAnswerBlock || $("zipPassAiAnswerBlock");
    const inlineStatus = els.passAiInlineStatus || $("zipPassAiInlineStatus");
    if (answerBlock && answerBlock.parentNode) {
      if (inlineStatus && inlineStatus.parentNode === answerBlock) {
        inlineStatus.insertAdjacentElement("beforebegin", host);
      } else {
        answerBlock.appendChild(host);
      }
    } else if (els.passAiResultsBox && els.passAiResultsBox.parentNode) {
      els.passAiResultsBox.appendChild(host);
    }
    els.passAiDynamicReplyHost = host;
    return host;
  }

  async function copyPassAiReplyToClipboard(text, triggerButton) {
    const value = String(text || "");
    if (!value) return;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(value);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      if (triggerButton) {
        const original = triggerButton.textContent;
        triggerButton.textContent = "Copied";
        window.setTimeout(() => {
          triggerButton.textContent = original;
        }, 1500);
      }
      setStatus("AI response copied to clipboard.", false);
    } catch (err) {
      setStatus("Unable to copy AI response: " + (err && err.message ? err.message : "Unknown error"), true);
    }
  }

  function escapePassAiHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizePassAiMarkdownRefKey(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function isPassAiHttpUrl(value) {
    return /^https?:\/\//i.test(String(value || "").trim());
  }

  function buildPassAiMarkdownLinkHtml(label, url) {
    const href = String(url || "").trim();
    if (!isPassAiHttpUrl(href)) return escapePassAiHtml(label || href);
    const safeHref = escapePassAiHtml(href);
    const safeLabel = escapePassAiHtml(label || href);
    return '<a href="' + safeHref + '" target="_blank" rel="noopener noreferrer">' + safeLabel + "</a>";
  }

  function normalizePassAiSourceLineForLinks(value) {
    return String(value == null ? "" : value)
      .replace(/^[-*+]\s+/, "")
      .replace(/:(https?:\/\/)/gi, ": $1")
      .trim();
  }

  function parsePassAiMarkdownReferences(value) {
    const references = Object.create(null);
    const bodyLines = [];
    const lines = String(value == null ? "" : value).replace(/\r\n?/g, "\n").split("\n");
    lines.forEach((line) => {
      const match = String(line || "").match(/^\s{0,3}\[([^\]]+)\]:\s*(<?https?:\/\/\S+>?)(?:\s+["'(].*["')])?\s*$/i);
      if (!match) {
        bodyLines.push(line);
        return;
      }
      const key = normalizePassAiMarkdownRefKey(match[1]);
      let url = String(match[2] || "").trim();
      if (url.startsWith("<") && url.endsWith(">")) {
        url = url.slice(1, -1).trim();
      }
      if (key && isPassAiHttpUrl(url)) {
        references[key] = url;
      } else {
        bodyLines.push(line);
      }
    });
    return {
      body: bodyLines.join("\n"),
      references
    };
  }

  function renderPassAiInlineMarkdown(value, referenceMap) {
    const placeholders = [];
    const refs = referenceMap && typeof referenceMap === "object" ? referenceMap : Object.create(null);
    let html = escapePassAiHtml(value);

    html = html.replace(/`([^`\n]+)`/g, (_match, codeText) => {
      const token = "%%ZIP_PASS_AI_CODE_" + String(placeholders.length) + "%%";
      placeholders.push("<code>" + escapePassAiHtml(codeText) + "</code>");
      return token;
    });

    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    html = html.replace(/(^|[\s(])\*([^*\n][^*\n]*?)\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
    html = html.replace(/(^|[\s(])_([^_\n][^_\n]*?)_(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
    html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");

    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi, (_match, label, url) => {
      return buildPassAiMarkdownLinkHtml(label, url);
    });

    html = html.replace(/\[([^\]]+)\]\[([^\]]*)\]/g, (_match, label, refIdRaw) => {
      const refId = normalizePassAiMarkdownRefKey(refIdRaw || label);
      const href = refs[refId];
      if (!href) return _match;
      return buildPassAiMarkdownLinkHtml(label, href);
    });

    html = html.replace(/&lt;(https?:\/\/[^|&<>\s]+)\|([^&<>]+)&gt;/gi, (_match, url, label) => {
      return buildPassAiMarkdownLinkHtml(label, url);
    });

    html = html.replace(/&lt;(https?:\/\/[^&<>\s]+)&gt;/gi, (_match, url) => {
      return buildPassAiMarkdownLinkHtml(url, url);
    });

    html = html.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)(?=$|[\s),.!?:;\]])/g, (_match, prefix, url) => {
      return prefix + buildPassAiMarkdownLinkHtml(url, url);
    });

    for (let i = 0; i < placeholders.length; i += 1) {
      const token = "%%ZIP_PASS_AI_CODE_" + String(i) + "%%";
      html = html.split(token).join(placeholders[i]);
    }
    return html;
  }

  function parsePassAiMarkdownTableRow(line) {
    const text = String(line || "").trim();
    if (!text || text.indexOf("|") === -1) return null;
    let row = text;
    if (row.startsWith("|")) row = row.slice(1);
    if (row.endsWith("|")) row = row.slice(0, -1);
    const cells = row.split("|").map((cell) => String(cell || "").trim());
    if (cells.length < 2) return null;
    return cells;
  }

  function isPassAiMarkdownTableDivider(line) {
    const cells = parsePassAiMarkdownTableRow(line);
    if (!cells) return false;
    return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
  }

  function renderPassAiMarkdownTable(headerCells, bodyRows, referenceMap) {
    const header = Array.isArray(headerCells) ? headerCells : [];
    if (!header.length) return "";
    const rows = Array.isArray(bodyRows) ? bodyRows : [];
    const thead = "<thead><tr>" + header.map((cell) => "<th>" + renderPassAiInlineMarkdown(cell, referenceMap) + "</th>").join("") + "</tr></thead>";
    const tbodyRows = rows.map((row) => {
      const normalizedRow = Array.isArray(row) ? row : [];
      const padded = header.map((_cell, idx) => normalizedRow[idx] != null ? normalizedRow[idx] : "");
      return "<tr>" + padded.map((cell) => "<td>" + renderPassAiInlineMarkdown(cell, referenceMap) + "</td>").join("") + "</tr>";
    }).join("");
    const tbody = "<tbody>" + tbodyRows + "</tbody>";
    return '<div class="zip-pass-ai-markdown-table-wrap"><table class="zip-pass-ai-markdown-table">' + thead + tbody + "</table></div>";
  }

  function renderPassAiMarkdownToHtml(value) {
    const parsed = parsePassAiMarkdownReferences(value);
    const normalized = String(parsed.body == null ? "" : parsed.body).replace(/\r\n?/g, "\n");
    const refs = parsed.references || Object.create(null);
    if (!normalized.trim()) return "";

    const lines = normalized.split("\n");
    const parts = [];
    let listType = "";
    let inCode = false;
    let codeLines = [];
    let inSources = false;
    let sourceItems = [];

    const closeList = () => {
      if (!listType) return;
      parts.push("</" + listType + ">");
      listType = "";
    };
    const flushSources = () => {
      if (!inSources && !sourceItems.length) return;
      if (sourceItems.length) {
        parts.push('<ul class="zip-pass-ai-sources-list">');
        sourceItems.forEach((itemHtml) => {
          parts.push("<li>" + itemHtml + "</li>");
        });
        parts.push("</ul>");
      }
      inSources = false;
      sourceItems = [];
    };
    const flushCode = () => {
      if (!inCode) return;
      parts.push("<pre><code>" + escapePassAiHtml(codeLines.join("\n")) + "</code></pre>");
      inCode = false;
      codeLines = [];
    };

    for (let i = 0; i < lines.length; i += 1) {
      const rawLine = String(lines[i] || "");
      const trimmed = rawLine.trim();

      if (/^```/.test(trimmed)) {
        flushSources();
        closeList();
        if (!inCode) {
          inCode = true;
          codeLines = [];
        } else {
          flushCode();
        }
        continue;
      }
      if (inCode) {
        codeLines.push(rawLine);
        continue;
      }
      if (!trimmed) {
        flushSources();
        closeList();
        continue;
      }
      if (inSources) {
        const sourceLine = normalizePassAiSourceLineForLinks(trimmed);
        if (sourceLine) {
          sourceItems.push(renderPassAiInlineMarkdown(sourceLine, refs));
        }
        continue;
      }

      const sourcesHeaderMatch = trimmed.match(/^sources:\s*(.*)$/i);
      if (sourcesHeaderMatch) {
        closeList();
        parts.push("<h4>Sources</h4>");
        inSources = true;
        const rest = normalizePassAiSourceLineForLinks(sourcesHeaderMatch[1] || "");
        if (rest) {
          sourceItems.push(renderPassAiInlineMarkdown(rest, refs));
        }
        continue;
      }

      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        flushSources();
        closeList();
        const level = Math.min(6, headingMatch[1].length);
        parts.push("<h" + String(level) + ">" + renderPassAiInlineMarkdown(headingMatch[2], refs) + "</h" + String(level) + ">");
        continue;
      }

      const blockquoteMatch = trimmed.match(/^>\s?(.*)$/);
      if (blockquoteMatch) {
        flushSources();
        closeList();
        parts.push("<blockquote>" + renderPassAiInlineMarkdown(blockquoteMatch[1], refs) + "</blockquote>");
        continue;
      }

      const tableHeader = parsePassAiMarkdownTableRow(trimmed);
      if (tableHeader && i + 1 < lines.length && isPassAiMarkdownTableDivider(lines[i + 1])) {
        flushSources();
        closeList();
        const tableRows = [];
        let cursor = i + 2;
        while (cursor < lines.length) {
          const nextRow = parsePassAiMarkdownTableRow(lines[cursor]);
          if (!nextRow) break;
          tableRows.push(nextRow);
          cursor += 1;
        }
        parts.push(renderPassAiMarkdownTable(tableHeader, tableRows, refs));
        i = cursor - 1;
        continue;
      }

      const ulMatch = trimmed.match(/^[-*+]\s+(.*)$/);
      if (ulMatch) {
        if (listType !== "ul") {
          closeList();
          parts.push("<ul>");
          listType = "ul";
        }
        parts.push("<li>" + renderPassAiInlineMarkdown(ulMatch[1], refs) + "</li>");
        continue;
      }

      const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
      if (olMatch) {
        if (listType !== "ol") {
          closeList();
          parts.push("<ol>");
          listType = "ol";
        }
        parts.push("<li>" + renderPassAiInlineMarkdown(olMatch[1], refs) + "</li>");
        continue;
      }

      closeList();
      parts.push("<p>" + renderPassAiInlineMarkdown(trimmed, refs) + "</p>");
    }

    flushSources();
    closeList();
    flushCode();
    return parts.join("");
  }

  async function deletePassAiSlackThread(triggerButton) {
    const context = getPassAiLastThreadContext();
    if (!context) {
      setStatus("No Slack thread is available to delete.", true);
      return;
    }
    if (state.passAiDeleteInFlight) return;

    const confirmed = typeof window !== "undefined" && typeof window.confirm === "function"
      ? window.confirm("Delete this Slack thread from channel " + context.channelId + "? This cannot be undone.")
      : true;
    if (!confirmed) return;

    state.passAiDeleteInFlight = true;
    applyGlobalBusyUi();
    if (triggerButton) triggerButton.disabled = true;

    try {
      const response = await sendToSlackTabWithAutoBootstrap({
        action: "slackDeleteSingularityThread",
        workspaceOrigin: context.workspaceOrigin || PASS_AI_SLACK_WORKSPACE_ORIGIN,
        channelId: context.channelId,
        parentTs: context.parentTs,
        limit: 200
      }, {
        onBootstrap: () => {
          setStatus("Preparing adobedx.slack.com web session for Slack delete…", false);
        }
      });
      if (!response || response.ok !== true) {
        throw buildPassAiSlackRequestError(response, "Unable to delete Slack thread.");
      }

      const deletedCount = Number(response.deletedCount || response.deleted_count || 0);
      const failedCount = Number(response.failedCount || response.failed_count || 0);
      const totalMessages = Number(response.totalMessages || response.total_messages || 0);
      const total = Number.isFinite(totalMessages) && totalMessages > 0 ? totalMessages : (deletedCount + failedCount);
      if (failedCount > 0) {
        setStatus("Slack delete partially completed: " + deletedCount + "/" + total + " removed.", true);
      } else {
        setStatus("Slack thread deleted (" + deletedCount + " messages).", false);
      }

      setPassAiLastThreadContext(null);
      if (triggerButton) {
        triggerButton.disabled = true;
        triggerButton.innerHTML = '<span class="spectrum-Button-label">Deleted</span>';
      }
    } catch (err) {
      setStatus("Slack delete failed: " + (err && err.message ? err.message : "Unknown error"), true);
    } finally {
      state.passAiDeleteInFlight = false;
      applyGlobalBusyUi();
    }
  }

  function renderPassAiReplyCard(replyText, options) {
    const host = getPassAiDynamicReplyHost();
    if (!host) return;
    const pending = !!(options && options.pending);
    const error = !!(options && options.error);
    const statusText = String((options && options.statusText) || "");
    const text = String(replyText || "");
    const hasReplyText = !!text.trim();
    if (!hasReplyText && !error) return;
    const showCopy = options && Object.prototype.hasOwnProperty.call(options, "showCopy")
      ? !!options.showCopy
      : !pending && !error && !!text;
    const showDelete = options && Object.prototype.hasOwnProperty.call(options, "showDelete")
      ? !!options.showDelete
      : !pending && !!text && !!getPassAiLastThreadContext();

    const previousBody = host.querySelector(".zip-pass-ai-reply-body");
    const previousScroll = previousBody
      ? {
          top: previousBody.scrollTop,
          height: previousBody.scrollHeight,
          atBottom: (previousBody.scrollHeight - previousBody.scrollTop - previousBody.clientHeight) <= 24
        }
      : null;

    host.classList.remove("hidden");
    host.innerHTML = "";

    const card = document.createElement("div");
    card.className = "zip-pass-ai-reply-card";
    if (pending) card.classList.add("pending");
    if (error) card.classList.add("error");

    if (statusText) {
      const head = document.createElement("div");
      head.className = "zip-pass-ai-reply-head";
      const meta = document.createElement("span");
      meta.className = "zip-pass-ai-reply-meta";
      const statusLabel = document.createElement("span");
      statusLabel.textContent = statusText;
      meta.appendChild(statusLabel);
      head.appendChild(meta);
      card.appendChild(head);
    }

    const body = document.createElement("div");
    body.className = "zip-pass-ai-box zip-pass-ai-answer zip-pass-ai-reply-body zip-pass-ai-reply-body-markdown spectrum-Textfield-input";
    body.tabIndex = 0;
    body.innerHTML = renderPassAiMarkdownToHtml(text);

    card.appendChild(body);

    const actions = document.createElement("div");
    actions.className = "zip-pass-ai-reply-actions";
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "btn spectrum-Button spectrum-Button--outline spectrum-Button--sizeS";
    copyBtn.innerHTML = '<span class="spectrum-Button-label">Copy</span>';
    copyBtn.disabled = !showCopy;
    copyBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      copyPassAiReplyToClipboard(text, copyBtn).catch(() => {});
    });
    actions.appendChild(copyBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn spectrum-Button spectrum-Button--outline spectrum-Button--sizeS";
    deleteBtn.innerHTML = '<span class="spectrum-Button-label">Delete</span>';
    deleteBtn.disabled = !showDelete || state.passAiDeleteInFlight;
    deleteBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      deletePassAiSlackThread(deleteBtn).catch(() => {});
    });
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    host.appendChild(card);

    if (previousScroll) {
      if (previousScroll.atBottom) {
        body.scrollTop = body.scrollHeight;
      } else {
        const maxScrollTop = Math.max(0, body.scrollHeight - body.clientHeight);
        body.scrollTop = Math.min(maxScrollTop, previousScroll.top);
      }
    }
    if (els.passAiAnswerBlock) {
      els.passAiAnswerBlock.classList.remove("hidden");
    }
    updatePassAiAnswerPlaceholder();
  }

  function renderPassAiQuestionDraft(questionText, options) {
    const keepAnswer = !!(options && options.keepAnswer);
    const ticketId = options && options.ticketId;
    if (els.passAiResultsBox) els.passAiResultsBox.classList.remove("hidden");
    if (els.passAiError) {
      els.passAiError.textContent = "";
      els.passAiError.classList.add("hidden");
    }
    setPassAiQuestionLabel(ticketId);
    if (els.passAiQuestion) {
      els.passAiQuestion.classList.remove("hidden");
      els.passAiQuestion.value = questionText || "";
    }
    if (!keepAnswer && els.passAiDynamicReplyHost) {
      els.passAiDynamicReplyHost.innerHTML = "";
      els.passAiDynamicReplyHost.classList.add("hidden");
    }
    updatePassAiAnswerPlaceholder();
  }

  function getPassAiQuestionDraft() {
    return normalizePassAiCommentBody(els.passAiQuestion && els.passAiQuestion.value);
  }

  function renderPassAiAnswer(answerText, options) {
    if (els.passAiResultsBox) els.passAiResultsBox.classList.remove("hidden");
    if (els.passAiError) {
      els.passAiError.textContent = "";
      els.passAiError.classList.add("hidden");
    }
    renderPassAiReplyCard(answerText, options);
  }

  function getPassAiServiceId(product) {
    return normalizePassProduct(product) === "PASS_CM" ? "pass-cm" : "pass-auth";
  }

  function appendPassAiDebugLine(debugLines, line) {
    if (!Array.isArray(debugLines)) return;
    debugLines.push(String(line == null ? "" : line));
  }

  function formatPassAiResponseForDisplay(result) {
    const finalText = normalizePassAiAnswerBody(result && (result.finalText || result.answer));
    if (finalText) return finalText;
    if (result && result.payload && typeof result.payload === "object") {
      try {
        return JSON.stringify(result.payload, null, 2);
      } catch (_) {}
    }
    const rawText = result && result.rawText != null ? String(result.rawText) : "";
    if (rawText.trim()) return rawText.trim();
    return "PASS Singularity returned no response body.";
  }

  function getPassAiSingularityChannelId() {
    const locked = normalizePassAiSlackChannelId(PASS_AI_SLACK_CHANNEL_DEFAULT);
    if (!locked) return "";
    const secretConfig = state && state.zipSecretConfig && typeof state.zipSecretConfig === "object"
      ? state.zipSecretConfig
      : null;
    const configured = normalizePassAiSlackChannelId(
      secretConfig && secretConfig.singularityChannelId
    );
    if (configured && configured !== locked) {
      return locked;
    }
    return locked;
  }

  function buildPassAiSlackLoginUrl() {
    return buildPassAiSlackWorkspaceLandingUrl();
  }

  function getPassAiSingularityMention() {
    const canonicalize = (value) => {
      const raw = String(value || "").trim();
      if (!raw) return PASS_AI_SINGULARITY_MENTION_DEFAULT;
      if (/^<@[UW][A-Z0-9]{8,}>$/i.test(raw)) return raw;
      const plain = raw.startsWith("@") ? raw.slice(1).trim() : raw;
      if (!plain) return PASS_AI_SINGULARITY_MENTION_DEFAULT;
      if (plain.toLowerCase() === "singularity") return PASS_AI_SINGULARITY_MENTION_DEFAULT;
      return "@" + plain;
    };

    let configured = "";
    const secretConfig = state && state.zipSecretConfig && typeof state.zipSecretConfig === "object"
      ? state.zipSecretConfig
      : null;
    configured = String(secretConfig && secretConfig.singularityMention || "").trim();
    const normalized = canonicalize(configured || PASS_AI_SINGULARITY_MENTION_DEFAULT);
    return normalized;
  }

  function getPassAiSlackError(payload, fallback) {
    const diagnostics = payload && payload.diagnostics && typeof payload.diagnostics === "object"
      ? payload.diagnostics
      : null;
    const diagnosticsText = diagnostics
      ? (
        "\nDiagnostic\n"
        + "phase: " + String(diagnostics.phase || "unknown") + "\n"
        + "classification: " + String(diagnostics.classification || "unknown") + "\n"
        + "issueSource: " + String(diagnostics.issueSource || "unknown") + "\n"
        + "actualTeam: " + String(diagnostics.actualTeamId || "") + "\n"
        + "enterprise: " + String(diagnostics.actualEnterpriseId || "") + "\n"
        + "channel: " + String(diagnostics.channelId || "") + "\n"
        + "parentTs: " + String(diagnostics.parentTs || "") + "\n"
        + "errorCode: " + String(diagnostics.errorCode || "") + "\n"
        + "httpStatus: " + String(diagnostics.httpStatus || 0) + "\n"
        + "scope: " + String(diagnostics.scope || "") + "\n"
        + "action: " + String(diagnostics.recommendedAction || "")
      )
      : "";
    const message = normalizePassAiCommentBody(
      payload && (
        payload.error
        || payload.message
        || payload.details
        || payload.warning
        || (payload.meta && payload.meta.error)
        || (payload.slack && payload.slack.error)
      )
    );
    if (message) return (message + diagnosticsText).trim();
    const base = String(fallback || "Slack request failed.");
    return (base + diagnosticsText).trim();
  }

  function buildPassAiSlackRequestError(payload, fallback) {
    const message = getPassAiSlackError(payload, fallback);
    const error = new Error(message);
    const diagnostics = payload && payload.diagnostics && typeof payload.diagnostics === "object"
      ? payload.diagnostics
      : null;
    error.passAiIssueSource = diagnostics ? String(diagnostics.issueSource || "").trim().toLowerCase() : "";
    error.passAiClassification = diagnostics ? String(diagnostics.classification || "").trim().toLowerCase() : "";
    error.passAiErrorCode = diagnostics ? String(diagnostics.errorCode || "").trim().toLowerCase() : "";
    return error;
  }

  function isHandledPassAiSlackConfigError(err) {
    if (!err) return false;
    const issueSource = String(err.passAiIssueSource || "").trim().toLowerCase();
    if (issueSource === "slack_config") return true;

    const classification = String(err.passAiClassification || "").trim().toLowerCase();
    if (
      classification === "slack_scope_config"
      || classification === "slack_workspace_config"
      || classification === "slack_auth_config"
      || classification === "slack_channel_access"
    ) {
      return true;
    }

    const errorCode = String(err.passAiErrorCode || "").trim().toLowerCase();
    if (
      errorCode === "missing_scope"
      || errorCode === "channel_not_found"
      || errorCode === "not_in_channel"
      || errorCode === "workspace_mismatch"
      || errorCode === "not_authed"
      || errorCode === "invalid_auth"
    ) {
      return true;
    }

    const message = String(err && err.message || "").trim().toLowerCase();
    if (!message) return false;
    return (
      message.includes("classification: slack_scope_config")
      || message.includes("classification: slack_workspace_config")
      || message.includes("classification: slack_auth_config")
      || message.includes("classification: slack_channel_access")
      || message.includes("errorcode: missing_scope")
      || message.includes("errorcode: workspace_mismatch")
      || message.includes("errorcode: channel_not_found")
      || message.includes("slack sign-in is required")
    );
  }

  function logPassAiRequestFailure(err) {
    const debugEnabled = typeof window !== "undefined" && window.ZIP_DEBUG_PASS_AI === true;
    if (isHandledPassAiSlackConfigError(err)) {
      if (debugEnabled) console.warn("PASS AI handled Slack config issue:", err);
      return;
    }
    if (debugEnabled) console.error("PASS AI request failed:", err);
  }

  function generatePassAiClientId() {
    try {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
      }
    } catch (_) {}
    return "zip-pass-ai-client-" + String(Date.now()) + "-" + String(Math.floor(Math.random() * 1000000));
  }

  async function requestPassAiConversation(ticketContext, questionText, debugLines) {
    const question = normalizePassAiCommentBody(questionText);
    if (!question) throw new Error("Latest customer question is empty.");

    const ticketId = normalizeTicketContextId(ticketContext && ticketContext.id);
    if (!ticketId) throw new Error("Ticket ID is unavailable.");

    const frontendClientId = generatePassAiClientId();
    state.passAiActiveClientId = frontendClientId;
    const channelId = getPassAiSingularityChannelId();
    if (!channelId) throw new Error("Singularity channel ID is not configured.");
    const mention = getPassAiSingularityMention();
    const messageText = (mention + " " + question).trim();

    appendPassAiDebugLine(debugLines, "ticketId=" + ticketId);
    appendPassAiDebugLine(debugLines, "frontendClientId=" + frontendClientId);
    appendPassAiDebugLine(debugLines, "serviceId=" + getPassAiServiceId(ticketContext && ticketContext.product));
    appendPassAiDebugLine(debugLines, "workspaceOrigin=" + PASS_AI_SLACK_WORKSPACE_ORIGIN);
    appendPassAiDebugLine(debugLines, "slackAppId=" + PASS_AI_SLACK_APP_ID);
    appendPassAiDebugLine(debugLines, "channelId=" + channelId);
    appendPassAiDebugLine(debugLines, "POST " + PASS_AI_SLACK_API_ENDPOINT + "/chat.postMessage");

    const sendPayload = await sendToSlackTabWithAutoBootstrap({
      action: "slackSendToSingularity",
      workspaceOrigin: PASS_AI_SLACK_WORKSPACE_ORIGIN,
      channelId,
      ticketId,
      question,
      messageText,
      frontendClientId,
      singularityUserId: PASS_AI_SLACK_SINGULARITY_USER_ID,
      mention
    }, {
      onBootstrap: () => {
        setStatus("Preparing adobedx.slack.com web session for Q&AI…", false);
      }
    });
    if (!sendPayload || sendPayload.ok !== true) {
      throw buildPassAiSlackRequestError(sendPayload, "Unable to post message to Singularity.");
    }

    const parentTs = normalizePassAiCommentBody(
      sendPayload.parent_ts
      || sendPayload.thread_ts
      || sendPayload.ts
      || sendPayload.message_ts
      || (sendPayload.message && sendPayload.message.ts)
    );
    const postedChannel = normalizePassAiCommentBody(sendPayload.channel || channelId);
    if (!parentTs) {
      throw new Error("Slack post response did not include a parent thread timestamp.");
    }
    appendPassAiDebugLine(debugLines, "parent_ts=" + parentTs);
    setPassAiLastThreadContext({
      channelId: postedChannel || channelId,
      parentTs,
      workspaceOrigin: PASS_AI_SLACK_WORKSPACE_ORIGIN
    });

    let finalPayload = null;
    let lastPollPayload = null;
    let latestReplyTs = "";
    let latestReplyText = "";
    let lastReplyAtMs = 0;
    let pollCachedLatestUpdates = null;
    let lastObservedReplySignature = "";

    for (let attempt = 1; attempt <= PASS_AI_POLL_MAX_ATTEMPTS; attempt += 1) {
      if (state.passAiActiveClientId !== frontendClientId) {
        throw new Error("Superseded by a newer AI request.");
      }

      appendPassAiDebugLine(debugLines, "Poll attempt " + String(attempt) + ": " + PASS_AI_SLACK_API_ENDPOINT + "/conversations.replies");
      const pollPayload = await sendToSlackTabWithAutoBootstrap({
        action: "slackPollSingularityThread",
        workspaceOrigin: PASS_AI_SLACK_WORKSPACE_ORIGIN,
        channelId: postedChannel,
        parentTs,
        singularityUserId: PASS_AI_SLACK_SINGULARITY_USER_ID,
        singularityNamePattern: PASS_AI_SINGULARITY_NAME_PATTERN,
        finalMarkerRegex: "FINAL_RESPONSE",
        frontendClientId,
        ticketId,
        limit: 40,
        cached_latest_updates: pollCachedLatestUpdates
      }, {
        onBootstrap: () => {
          setStatus("Preparing adobedx.slack.com web session for Q&AI replies…", false);
        }
      });
      lastPollPayload = pollPayload && typeof pollPayload === "object" ? pollPayload : null;
      if (!pollPayload || pollPayload.ok !== true) {
        throw buildPassAiSlackRequestError(pollPayload, "Unable to fetch thread replies.");
      }
      const pollCachedCandidate = pollPayload && (
        pollPayload.cachedLatestUpdates
        || pollPayload.cached_latest_updates
      );
      if (pollCachedCandidate && typeof pollCachedCandidate === "object") {
        pollCachedLatestUpdates = { ...pollCachedCandidate };
      }

      const pollStatus = String((pollPayload && pollPayload.status) || "").trim().toLowerCase();
      const pollReplyTs = normalizePassAiCommentBody(
        pollPayload && (
          pollPayload.latestReplyTs
          || pollPayload.finalReplyTs
          || pollPayload.replyTs
          || pollPayload.latest_reply_ts
          || pollPayload.final_reply_ts
          || pollPayload.reply_ts
          || pollPayload.ts
        )
      );
      const pollReplyText = normalizePassAiAnswerBody(
        pollPayload && (
          pollPayload.latestReplyText
          || pollPayload.finalText
          || pollPayload.partialText
          || pollPayload.text
          ||
          pollPayload.latest_reply_text
          || pollPayload.final_text
          || pollPayload.answer
        )
      );
      const pollCombinedText = normalizePassAiAnswerBody(
        pollPayload && (
          pollPayload.combinedReplyText
          || pollPayload.combined_reply_text
          || (Array.isArray(pollPayload.allReplyTexts) ? pollPayload.allReplyTexts.join("\n\n") : "")
        )
      );
      const markerFinal = !!(
        pollPayload && (
          pollPayload.hasFinalMarker
          || pollPayload.final === true
          || pollPayload.status === "final"
          ||
          pollPayload.has_final_marker
          || pollStatus === "final"
        )
      );
      const pollAckOnly = !!(
        pollPayload && (
          pollPayload.ackOnly === true
          || pollPayload.ack_only === true
        )
      );
      const pollHasCompletionFooter = !!(
        pollPayload && (
          pollPayload.hasCompletionFooter === true
          || pollPayload.has_completion_footer === true
          || pollPayload.hasSourcesFooter === true
          || pollPayload.has_sources_footer === true
        )
      );
      const pollReplyCount = Number(
        pollPayload && (
          pollPayload.singularityRepliesCount
          || pollPayload.singularity_replies_count
          || pollPayload.repliesCount
          || pollPayload.replyCount
          || (Array.isArray(pollPayload.allReplies) ? pollPayload.allReplies.length : 0)
        )
      );
      const hasMinimumReplies = Number.isFinite(pollReplyCount) && pollReplyCount >= PASS_AI_MIN_SINGULARITY_REPLIES;

      if (pollCombinedText) {
        const nextTs = pollReplyTs || latestReplyTs;
        const nextText = pollCombinedText;
        const nextSignature = String(nextTs || "") + "::" + nextText;
        const changed = nextSignature !== lastObservedReplySignature;
        if (changed) {
          lastReplyAtMs = Date.now();
          lastObservedReplySignature = nextSignature;
        }
        if (nextTs) latestReplyTs = nextTs;
        latestReplyText = nextText;
      } else if (pollReplyTs && pollReplyTs !== latestReplyTs) {
        latestReplyTs = pollReplyTs;
        latestReplyText = pollReplyText || latestReplyText;
        lastReplyAtMs = Date.now();
        lastObservedReplySignature = String(latestReplyTs || "") + "::" + String(latestReplyText || "");
      } else if (pollReplyText && !latestReplyText) {
        latestReplyText = pollReplyText;
        lastReplyAtMs = Date.now();
        lastObservedReplySignature = String(latestReplyTs || "") + "::" + String(latestReplyText || "");
      }

      const partial = pollCombinedText || pollReplyText || latestReplyText;
      const partialHasCompletionFooter = hasPassAiCompletionFooter(partial);
      const hasCompletionSignal = markerFinal || pollHasCompletionFooter || partialHasCompletionFooter;
      const canFinalize = !pollAckOnly && (hasMinimumReplies || pollHasCompletionFooter || partialHasCompletionFooter);
      if (state.passAiActiveClientId === frontendClientId && partial) {
        const statusMessage = canFinalize
          ? "Receiving updates..."
          : "Received ACK. Waiting for full answer...";
        renderPassAiAnswer(partial, {
          pending: true,
          statusText: statusMessage,
          title: "Singularity Reply",
          showCopy: false,
          showDelete: false
        });
      }

      if (canFinalize && hasCompletionSignal && (pollCombinedText || pollReplyText || latestReplyText)) {
        finalPayload = {
          ...(pollPayload || {}),
          finalText: pollCombinedText || pollReplyText || latestReplyText
        };
        break;
      }

      if (canFinalize && latestReplyText && lastReplyAtMs && Date.now() - lastReplyAtMs >= PASS_AI_INACTIVITY_FINAL_MS) {
        finalPayload = {
          ...(pollPayload || {}),
          finalText: pollCombinedText || pollReplyText || latestReplyText
        };
        break;
      }

      await wait(PASS_AI_POLL_INTERVAL_MS);
    }

    if (!finalPayload) {
      const fallbackTs = normalizePassAiCommentBody(
        latestReplyTs
        || (lastPollPayload && (
          lastPollPayload.latestReplyTs
          || lastPollPayload.finalReplyTs
          || lastPollPayload.replyTs
          || lastPollPayload.latest_reply_ts
          || lastPollPayload.final_reply_ts
          || lastPollPayload.reply_ts
          || lastPollPayload.ts
        ))
      );
      const fallbackText = normalizePassAiAnswerBody(
        latestReplyText
        || (lastPollPayload && (
          lastPollPayload.combinedReplyText
          || lastPollPayload.combined_reply_text
          || (Array.isArray(lastPollPayload.allReplyTexts) ? lastPollPayload.allReplyTexts.join("\n\n") : "")
          || lastPollPayload.latestReplyText
          || lastPollPayload.finalText
          || lastPollPayload.partialText
          || lastPollPayload.text
          || lastPollPayload.answer
          || lastPollPayload.latest_reply_text
          || lastPollPayload.final_text
        ))
      );
      const fallbackReplyCount = Number(lastPollPayload && (
        lastPollPayload.singularityRepliesCount
        || lastPollPayload.singularity_replies_count
        || lastPollPayload.repliesCount
        || lastPollPayload.replyCount
        || 0
      ));
      const fallbackAckOnly = !!(lastPollPayload && (
        lastPollPayload.ackOnly === true
        || lastPollPayload.ack_only === true
      ));
      const fallbackHasCompletionFooter = !!(lastPollPayload && (
        lastPollPayload.hasCompletionFooter === true
        || lastPollPayload.has_completion_footer === true
        || lastPollPayload.hasSourcesFooter === true
        || lastPollPayload.has_sources_footer === true
      ));
      const fallbackHasSourcesFooter = hasPassAiSourcesFooter(fallbackText);
      const fallbackCanFinalize = !fallbackAckOnly && (
        (Number.isFinite(fallbackReplyCount) && fallbackReplyCount >= PASS_AI_MIN_SINGULARITY_REPLIES)
        || fallbackHasCompletionFooter
        || fallbackHasSourcesFooter
      );
      const fallbackNonSingularityReplyCount = Number(lastPollPayload && (
        lastPollPayload.nonSingularityRepliesCount
        || lastPollPayload.non_singularity_replies_count
        || 0
      ));
      if (
        fallbackCanFinalize
        && (
          fallbackText
          || fallbackTs
        )
      ) {
        finalPayload = {
          ...(lastPollPayload || {}),
          finalText: fallbackText || "Singularity replied without a FINAL marker."
        };
      } else if ((fallbackAckOnly || (Number.isFinite(fallbackReplyCount) && fallbackReplyCount === 1)) && latestReplyText) {
        throw new Error("Only the initial ACK was received from @Singularity before timeout.");
      } else if (Number.isFinite(fallbackNonSingularityReplyCount) && fallbackNonSingularityReplyCount > 0) {
        throw new Error("Thread activity was detected, but @Singularity has not replied yet.");
      }
    }

    if (!finalPayload) {
      throw new Error("No @Singularity reply was received before timeout.");
    }

    const finalText = normalizePassAiAnswerBody(
      finalPayload && (
        finalPayload.finalText
        || finalPayload.combinedReplyText
        || finalPayload.combined_reply_text
        || (Array.isArray(finalPayload.allReplyTexts) ? finalPayload.allReplyTexts.join("\n\n") : "")
        || finalPayload.final_text
        || finalPayload.latest_reply_text
        || finalPayload.text
        || finalPayload.answer
      )
    );
    if (!finalText) {
      throw new Error("Singularity returned an empty final response.");
    }

    return {
      answer: finalText,
      finalText,
      payload: finalPayload,
      rawText: finalText,
      channelId: postedChannel || channelId,
      parentTs,
      workspaceOrigin: PASS_AI_SLACK_WORKSPACE_ORIGIN,
      endpoint: PASS_AI_SLACK_API_ENDPOINT,
      attempt: "slack_web_session_token"
    };
  }

  function parseAuditsToTicketComments(auditsPayload) {
    const audits = Array.isArray(auditsPayload && auditsPayload.audits) ? auditsPayload.audits : [];
    const comments = [];
    audits.forEach((audit) => {
      const auditCreatedAt = String((audit && audit.created_at) || "").trim();
      const auditAuthor = String((audit && audit.author_id) || "").trim();
      const events = Array.isArray(audit && audit.events) ? audit.events : [];
      events.forEach((event) => {
        const eventType = String((event && event.type) || "").trim().toLowerCase();
        if (eventType !== "comment") return;
        const body = normalizePassAiCommentBody(
          event && event.plain_body != null
            ? event.plain_body
            : event && event.body != null
              ? event.body
              : event && event.html_body != null
                ? event.html_body
                : ""
        );
        if (!body) return;
        comments.push({
          type: event && event.public === false ? "internal" : "public",
          author: String((event && event.author_id) || auditAuthor || "").trim(),
          body,
          createdAt: String((event && event.created_at) || auditCreatedAt || "").trim()
        });
      });
    });
    comments.sort((a, b) => toEpochMs(a.createdAt) - toEpochMs(b.createdAt));
    return comments;
  }

  function getDescriptionFallbackFromComments(comments) {
    const rows = normalizeExistingTicketComments(comments);
    for (let i = 0; i < rows.length; i += 1) {
      if (rows[i].type === "public" && rows[i].body) return rows[i].body;
    }
    return "";
  }

  /**
   * @param {{ comments?: Array<{type?: string, author?: string, body?: string, createdAt?: string}>, description?: string, originalDescription?: string } | null | undefined} ticket
   * @returns {string}
   */
  function getLatestPublicUpdate(ticket) {
    const comments = normalizeExistingTicketComments(ticket && ticket.comments);
    for (let i = comments.length - 1; i >= 0; i -= 1) {
      const comment = comments[i];
      if (comment.type !== "public") continue;
      if (comment.body) return comment.body;
    }
    const description = normalizePassAiCommentBody(ticket && (ticket.description || ticket.originalDescription));
    if (description) return description;
    return "";
  }

  function getLatestIncomingCustomerQuestion(ticket) {
    const comments = normalizeExistingTicketComments(ticket && ticket.comments);
    const agentId = state.user && state.user.id != null ? String(state.user.id).trim() : "";
    for (let i = comments.length - 1; i >= 0; i -= 1) {
      const comment = comments[i];
      if (comment.type !== "public") continue;
      const authorId = String(comment.author || "").trim();
      if (agentId && authorId && authorId === agentId) continue;
      if (comment.body) return comment.body;
    }
    return getLatestPublicUpdate(ticket);
  }

  async function fetchZendeskTicketAudits(ticketId) {
    const normalizedTicketId = normalizeZendeskTicketId(ticketId);
    if (normalizedTicketId == null) throw new Error("Select a ticket before asking PASS AI.");
    const auditsUrl = BASE + "/api/v2/tickets/" + encodeURIComponent(normalizedTicketId) + "/audits.json";
    const result = await sendToZendeskTab({ action: "fetch", url: auditsUrl });
    const payload = result && typeof result === "object" ? result.payload : null;
    const ok = !!(result && result.ok);
    const status = Number(result && result.status);
    if (!ok) {
      const apiMessage = normalizePassAiCommentBody(
        payload && (payload.error || payload.description || payload.message || payload.details)
      );
      throw new Error(
        "Zendesk audits request failed"
          + (Number.isFinite(status) ? " (HTTP " + status + ")." : ".")
          + (apiMessage ? " " + apiMessage : "")
      );
    }
    if (!payload || typeof payload !== "object") {
      throw new Error("Zendesk audits returned an invalid response.");
    }
    return payload;
  }

  function buildTicketContextFromAudits(ticketId, auditsPayload) {
    const currentTicket = syncCurrentTicketContextFromSelection(ticketId);
    const auditComments = parseAuditsToTicketComments(auditsPayload);
    const fallbackComments = normalizeExistingTicketComments(currentTicket.comments);
    const comments = auditComments.length ? auditComments : fallbackComments;
    const description = normalizePassAiCommentBody(
      (currentTicket && (currentTicket.description || currentTicket.originalDescription))
      || getDescriptionFallbackFromComments(comments)
    );
    const ticketContext = {
      id: normalizeTicketContextId((currentTicket && currentTicket.id) || ticketId),
      product: normalizePassProduct(currentTicket && currentTicket.product),
      agentEmail: String((currentTicket && currentTicket.agentEmail) || (state.user && state.user.email) || "").trim(),
      comments
    };
    if (description) ticketContext.description = description;
    if (typeof window !== "undefined") {
      window.currentTicket = { ...currentTicket, ...ticketContext };
    }
    return ticketContext;
  }

  async function loadLatestQuestionForTicket(ticketId, options) {
    const normalizedTicketId = normalizeZendeskTicketId(ticketId);
    if (normalizedTicketId == null) return "";
    const selectedTicketId = normalizeZendeskTicketId(state.selectedTicketId);
    if (selectedTicketId != null && selectedTicketId !== normalizedTicketId) return "";

    try {
      const auditsPayload = await fetchZendeskTicketAudits(normalizedTicketId);
      const ticketContext = buildTicketContextFromAudits(normalizedTicketId, auditsPayload);
      const latestQuestion = getLatestIncomingCustomerQuestion(ticketContext);
      if (!latestQuestion) {
        throw new Error("No latest public customer comment found.");
      }
      renderPassAiQuestionDraft(latestQuestion, { ticketId: normalizedTicketId });
      return latestQuestion;
    } catch (err) {
      const fallbackContext = syncCurrentTicketContextFromSelection(normalizedTicketId);
      const fallbackQuestion = getLatestIncomingCustomerQuestion(fallbackContext);
      if (fallbackQuestion) {
        renderPassAiQuestionDraft(fallbackQuestion, { ticketId: normalizedTicketId });
        return fallbackQuestion;
      }
      if (!(options && options.silentError)) {
        setStatus("Unable to load latest ticket comment. " + (err && err.message ? err.message : ""), true);
      }
      throw err;
    }
  }

  async function askPassAiForSelectedTicket() {
    const selectedTicketId = getSelectedPassAiTicketId();
    const debugLines = [];
    if (selectedTicketId == null) {
      appendPassAiDebugLine(debugLines, "No selected Zendesk ticket.");
      renderPassAiAnswer("Select a ticket first, then ask PASS AI.", {
        error: true,
        title: "AI Error",
        showCopy: false
      });
      setStatus("PASS AI request blocked: no ticket selected.", true);
      return;
    }
    state.passAiTicketId = selectedTicketId;
    state.passAiActiveClientId = "";
    setPassAiLastThreadContext(null);
    setPassAiConversationInFlight(true);
    setPassAiLoading(true);
    setStatus("Sending question to PASS Singularity…", false);
    try {
      await ensurePassAiSlackSession();
      let ticketContext = syncCurrentTicketContextFromSelection(selectedTicketId);
      let questionDraft = getPassAiQuestionDraft();
      if (!questionDraft) {
        questionDraft = await loadLatestQuestionForTicket(selectedTicketId, { silentError: true });
      } else {
        renderPassAiQuestionDraft(questionDraft, { ticketId: selectedTicketId });
      }
      ticketContext = getCurrentTicketContext() || ticketContext;
      if (!questionDraft) {
        throw new Error("No latest public customer comment was found on this ticket.");
      }

      appendPassAiDebugLine(debugLines, "ticketId=" + normalizeTicketContextId(selectedTicketId));
      appendPassAiDebugLine(debugLines, "product=" + normalizePassProduct(ticketContext && ticketContext.product));
      appendPassAiDebugLine(debugLines, "serviceId=" + getPassAiServiceId(ticketContext && ticketContext.product));
      appendPassAiDebugLine(debugLines, "agentEmail=" + String(ticketContext && ticketContext.agentEmail || "(missing)"));
      appendPassAiDebugLine(debugLines, "questionChars=" + String(questionDraft.length));
      appendPassAiDebugLine(debugLines, "questionText:");
      appendPassAiDebugLine(debugLines, questionDraft);

      renderPassAiQuestionDraft(questionDraft, { ticketId: selectedTicketId, keepAnswer: true });
      const aiResult = await requestPassAiConversation(ticketContext, questionDraft, debugLines);
      setPassAiLastThreadContext({
        channelId: aiResult && aiResult.channelId,
        parentTs: aiResult && aiResult.parentTs,
        workspaceOrigin: aiResult && aiResult.workspaceOrigin
      });
      const finalReplyText = formatPassAiResponseForDisplay(aiResult);
      renderPassAiAnswer(finalReplyText, {
        title: "Singularity Final Reply",
        statusText: "Complete",
        showCopy: true,
        showDelete: true
      });
      setStatus("Singularity reply ready for " + normalizeTicketContextId(selectedTicketId) + ".", false);
    } catch (err) {
      logPassAiRequestFailure(err);
      const message = err && err.message ? err.message : "Unknown error";
      appendPassAiDebugLine(debugLines, "Final error: " + message);
      const hasExistingAnswer = hasPassAiRenderedAnswer();
      if (hasExistingAnswer) {
        if (els.passAiError) {
          els.passAiError.textContent = "Polling stopped: " + message;
          els.passAiError.classList.remove("hidden");
        }
      } else {
        renderPassAiAnswer("Unable to get a PASS Singularity response right now. " + message, {
          error: true,
          title: "AI Error",
          showCopy: false,
          showDelete: !!getPassAiLastThreadContext()
        });
      }
      setStatus("PASS Singularity request failed: " + message, true);
    } finally {
      state.passAiActiveClientId = "";
      setPassAiConversationInFlight(false);
      setPassAiLoading(false);
    }
  }

  /** Clear ticket data and selection, then re-render table (e.g. before loading a new source). */
  function clearTicketTable(options) {
    const showLoading = !!(options && options.loading);
    setTicketTableLoading(showLoading);
    state.tickets = [];
    state.filteredTickets = [];
    state.selectedTicketId = null;
    applyFiltersAndRender();
  }

  function resetStatusFilterSelection() {
    state.statusFilter = STATUS_FILTER_ALL_VALUE;
    if (els.statusFilter) {
      els.statusFilter.value = STATUS_FILTER_ALL_VALUE;
    }
  }

  function applyFiltersAndRender() {
    syncStatusFilterOptions();
    const text = String(state.textFilter || "").trim().toLowerCase();
    const status = normalizeStatusValue(state.statusFilter) || STATUS_FILTER_ALL_VALUE;
    const rows = state.tickets.filter((row) => {
      const rowStatus = normalizeStatusValue(row && row.status);
      if (status !== STATUS_FILTER_ALL_VALUE && rowStatus !== status) return false;
      if (!text) return true;
      const blob = [row.id, row.subject, row.status, row.priority, row.created_at, row.updated_at].join(" ").toLowerCase();
      return blob.includes(text);
    });
    const col = TICKET_COLUMNS.find((c) => c.key === state.sortKey) || TICKET_COLUMNS[0];
    rows.sort((a, b) => compareByColumn(a, b, col));
    state.filteredTickets = rows;
    const sid = normalizeZendeskTicketId(state.selectedTicketId);
    if (sid != null && !rows.some((r) => normalizeZendeskTicketId(r && r.id) === sid)) state.selectedTicketId = null;
    renderTicketRows();
  }

  function renderTicketHeaders() {
    els.ticketHead.innerHTML = "";
    TICKET_COLUMNS.forEach((col) => {
      const th = document.createElement("th");
      const isSortable = col.sortable !== false;
      th.className = "spectrum-Table-headCell ticket-col-header";
      if (!isSortable) th.classList.add("ticket-col-header-static");
      const isActiveSort = isSortable && state.sortKey === col.key;
      const sortDirection = isActiveSort ? state.sortDir : "none";
      th.classList.toggle("is-active", isActiveSort);
      th.setAttribute("aria-sort", isSortable
        ? (sortDirection === "asc" ? "ascending" : (sortDirection === "desc" ? "descending" : "none"))
        : "none");
      if (isSortable) {
        th.setAttribute("role", "button");
        th.tabIndex = 0;
        th.title = "Sort by " + col.label + (isActiveSort ? (" (" + (sortDirection === "asc" ? "ascending" : "descending") + ")") : "");
        th.removeAttribute("aria-label");
      } else {
        th.removeAttribute("role");
        th.tabIndex = -1;
        th.title = "Ticket email actions";
        th.setAttribute("aria-label", "Ticket email actions");
      }

      const label = document.createElement("span");
      label.className = "ticket-col-header-label";
      label.textContent = col.label;
      th.appendChild(label);

      if (isSortable) {
        const indicator = document.createElement("span");
        indicator.className = "ticket-col-header-indicator";
        indicator.setAttribute("aria-hidden", "true");
        indicator.textContent = sortDirection === "asc" ? "\u25B2" : (sortDirection === "desc" ? "\u25BC" : "\u2195");
        th.appendChild(indicator);
      }

      const triggerSort = () => {
        if (!isSortable) return;
        if (state.sortKey === col.key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        else { state.sortKey = col.key; state.sortDir = col.type === "string" ? "asc" : "desc"; }
        renderTicketHeaders();
        applyFiltersAndRender();
      };

      if (isSortable) {
        th.addEventListener("click", triggerSort);
        th.addEventListener("keydown", (event) => {
          if (!event) return;
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          triggerSort();
        });
      }
      els.ticketHead.appendChild(th);
    });
  }

  function selectTicketRow(ticketId) {
    const id = normalizeZendeskTicketId(ticketId);
    state.selectedTicketId = id;
    if (id != null) {
      syncCurrentTicketContextFromSelection(id);
    }
    if (els.ticketBody) {
      els.ticketBody.querySelectorAll("tr.ticket-row").forEach((r) => r.classList.remove("ticket-row-selected"));
      if (id != null) {
        const selectedRow = els.ticketBody.querySelector(`tr.ticket-row[data-ticket-id="${String(id)}"]`);
        if (selectedRow) selectedRow.classList.add("ticket-row-selected");
      }
    }
    updateTicketActionButtons();
    return id;
  }

  function setTicketEmailCopyButtonBusy(button, isBusy) {
    if (!button) return;
    button.disabled = !!isBusy;
    button.classList.toggle("is-busy", !!isBusy);
    button.setAttribute("aria-busy", isBusy ? "true" : "false");
  }

  async function handleCopyTicketEmails(ticketId, triggerButton, options) {
    const normalizedTicketId = normalizeZendeskTicketId(ticketId);
    if (normalizedTicketId == null) {
      setStatus("Unable to copy ticket emails: missing ticket ID.", true);
      return;
    }
    const opts = options && typeof options === "object" ? options : {};
    const rowUrl = String(opts.rowUrl || "").trim();
    const selectedTicketId = normalizeZendeskTicketId(state.selectedTicketId);
    let showTicketPromise = null;
    if (selectedTicketId !== normalizedTicketId) {
      const ticketUrl = rowUrl || (TICKET_URL_PREFIX + normalizedTicketId);
      openTicketInMainTab(ticketUrl, normalizedTicketId);
      showTicketPromise = runShowTicketApiForTicket(normalizedTicketId).catch(() => null);
    } else {
      selectTicketRow(normalizedTicketId);
    }
    if (state.ticketEmailCopyBusyById[normalizedTicketId]) return;
    state.ticketEmailCopyBusyById[normalizedTicketId] = true;
    setTicketEmailCopyButtonBusy(triggerButton, true);
    setStatus("Collecting ticket emails for ZD #" + normalizedTicketId + "...", false);
    try {
      const cachedCopyResult = getCachedTicketEmailCopyResult(normalizedTicketId);
      if (cachedCopyResult) {
        await copyTextToClipboard(cachedCopyResult.clipboardText);
        const cachedMessage = "copied " + String(cachedCopyResult.emails.length) + " emails from ZD" + normalizedTicketId;
        showToast(cachedMessage, 2000);
        setStatus(cachedMessage, false);
        return;
      }
      let requesterId = getCachedRequesterIdForTicket(normalizedTicketId);
      if (!requesterId && showTicketPromise) {
        const showTicketResult = await showTicketPromise;
        requesterId = String(showTicketResult && showTicketResult.requesterId || "").trim();
      }
      const copyResult = await buildTicketEmailClipboardString(normalizedTicketId, { requesterId });
      const clipboardValue = copyResult && copyResult.clipboardText ? String(copyResult.clipboardText) : "";
      const emailCount = Array.isArray(copyResult && copyResult.emails) ? copyResult.emails.length : 0;
      await copyTextToClipboard(clipboardValue);
      const copiedMessage = "copied " + String(emailCount) + " emails from ZD" + normalizedTicketId;
      showToast(copiedMessage, 2000);
      setStatus(copiedMessage, false);
    } catch (err) {
      const message = err && err.message ? err.message : "Unknown error";
      setStatus("Unable to copy ticket emails: " + message, true);
    } finally {
      delete state.ticketEmailCopyBusyById[normalizedTicketId];
      setTicketEmailCopyButtonBusy(triggerButton, false);
    }
  }

  /** Navigate main ZD tab to ticket URL, update selected state, and sync row highlight. Single source of truth for "open ticket". */
  function openTicketInMainTab(url, ticketId) {
    const id = selectTicketRow(ticketId);
    const ticketUrl = (url && String(url).trim()) || (id != null ? TICKET_URL_PREFIX + id : "");
    if (ticketUrl) {
      getActiveTabId().then((tabId) => {
        if (tabId) chrome.runtime.sendMessage({ type: "ZIP_NAVIGATE", tabId, url: ticketUrl }, () => {});
      });
    }
    if (id != null && state.passAiPanelVisible) {
      loadLatestQuestionForTicket(id, { silentError: false }).catch((err) => {
        console.error("Failed to load latest ticket question:", err);
      }).finally(() => {
        updateTicketActionButtons();
      });
    }
  }

  function openUrlInNewTab(url) {
    const href = String(url || "").trim();
    if (!href) return;
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: href }, () => {});
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }

  async function runShowTicketApiForTicket(ticketId) {
    const normalizedTicketId = normalizeZendeskTicketId(ticketId);
    if (normalizedTicketId == null || !els.apiPathSelect) return { requesterId: "" };
    const hasShowTicketPath = Array.from(els.apiPathSelect.options || []).some((opt) => opt.value === SHOW_TICKET_API_PATH);
    if (!hasShowTicketPath) return { requesterId: "" };
    if (els.apiPathSelect.value !== SHOW_TICKET_API_PATH) {
      els.apiPathSelect.value = SHOW_TICKET_API_PATH;
    }
    renderApiParams();
    const input = document.getElementById("zipApiParam_ticket_id");
    if (input) input.value = normalizedTicketId;
    const result = await runZdGet();
    const payload = result && typeof result === "object" ? result.payload : null;
    const requesterId = cacheRequesterIdForTicket(
      normalizedTicketId,
      extractRequesterIdFromTicketPayload(payload)
    );
    return { requesterId };
  }

  function renderTicketRows() {
    els.ticketBody.innerHTML = "";
    if (!state.filteredTickets.length) {
      const tr = document.createElement("tr");
      tr.className = "spectrum-Table-row";
      const td = document.createElement("td");
      td.className = "spectrum-Table-cell";
      td.colSpan = TICKET_COLUMNS.length;
      td.classList.add("ticket-empty-state");
      if (state.ticketTableLoading) {
        td.classList.add("ticket-empty-state-loading");
        const hint = document.createElement("span");
        hint.className = "ticket-loading-hint";
        const spinner = document.createElement("span");
        spinner.className = "inline-spinner ticket-inline-spinner";
        spinner.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.textContent = "Loading tickets…";
        hint.appendChild(spinner);
        hint.appendChild(label);
        td.appendChild(hint);
      } else {
        td.textContent = "No tickets found.";
      }
      tr.appendChild(td);
      els.ticketBody.appendChild(tr);
      updateTicketActionButtons();
      return;
    }
    state.filteredTickets.forEach((row) => {
      const tr = document.createElement("tr");
      tr.className = "spectrum-Table-row ticket-row";
      const rowId = normalizeZendeskTicketId(row && row.id);
      const rowUrl = (row.url && String(row.url).trim()) || (rowId != null ? TICKET_URL_PREFIX + rowId : "");
      tr.dataset.ticketId = rowId || "";
      tr.dataset.ticketUrl = rowUrl;
      if (normalizeZendeskTicketId(state.selectedTicketId) != null && normalizeZendeskTicketId(state.selectedTicketId) === rowId) tr.classList.add("ticket-row-selected");
      tr.addEventListener("click", (e) => {
        const tid = tr.dataset.ticketId;
        const turl = tr.dataset.ticketUrl;
        if (tid && turl) {
          openTicketInMainTab(turl, tid);
          runShowTicketApiForTicket(tid).catch(() => {});
        }
      });
      TICKET_COLUMNS.forEach((col) => {
        const td = document.createElement("td");
        td.className = "spectrum-Table-cell";
        if (col.key === "__ticket_email_actions") {
          td.classList.add("ticket-email-action-cell");
          const copyBtn = document.createElement("button");
          copyBtn.type = "button";
          copyBtn.className = "ticket-email-copy-btn spectrum-ActionButton spectrum-ActionButton--sizeS";
          copyBtn.setAttribute("aria-label", rowId != null
            ? ("Copy requestor and external CC emails for ticket " + rowId)
            : "Copy requestor and external CC emails");
          copyBtn.title = "Copy requestor + external CC emails";
          const btnLabel = document.createElement("span");
          btnLabel.className = "spectrum-ActionButton-label";
          const btnIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          btnIcon.setAttribute("viewBox", "0 0 20 20");
          btnIcon.setAttribute("aria-hidden", "true");
          btnIcon.classList.add("ticket-email-copy-icon");
          const backSheetPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
          backSheetPath.setAttribute("d", "M8 2.5h6.5a2 2 0 0 1 2 2V11a.75.75 0 0 1-1.5 0V4.5a.5.5 0 0 0-.5-.5H8a.75.75 0 0 1 0-1.5Z");
          const envelopePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
          envelopePath.setAttribute("d", "M3.5 6.5A2.5 2.5 0 0 1 6 4h7a2.5 2.5 0 0 1 2.5 2.5v6A2.5 2.5 0 0 1 13 15H6a2.5 2.5 0 0 1-2.5-2.5v-6Zm2.5-1a1 1 0 0 0-1 1v.22l4.03 2.69a.85.85 0 0 0 .94 0L14 6.72V6.5a1 1 0 0 0-1-1H6Zm8 3.02-3.2 2.13a2.35 2.35 0 0 1-2.6 0L5 8.52v3.98a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V8.52Z");
          btnIcon.append(backSheetPath, envelopePath);
          btnLabel.appendChild(btnIcon);
          copyBtn.appendChild(btnLabel);
          setTicketEmailCopyButtonBusy(copyBtn, rowId != null && !!state.ticketEmailCopyBusyById[rowId]);
          copyBtn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            handleCopyTicketEmails(rowId, copyBtn, { rowUrl }).catch((err) => {
              console.error("Ticket email copy failed:", err);
            });
          });
          td.appendChild(copyBtn);
        } else if (col.key === "id" && rowId != null) {
          const a = document.createElement("a");
          a.href = rowUrl || "#";
          a.rel = "noopener";
          a.textContent = "#" + rowId;
          a.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            openTicketInMainTab(rowUrl, rowId);
            runShowTicketApiForTicket(rowId).catch(() => {});
          });
          td.appendChild(a);
        } else if (col.key === "subject") {
          const wrap = document.createElement("span");
          wrap.className = "ticket-subject-wrap";
          const subjectText = document.createElement("span");
          subjectText.className = "ticket-subject-text";
          subjectText.textContent = String(row[col.key] == null ? "" : row[col.key]);
          wrap.appendChild(subjectText);
          const jiraUrl = row && row.jira_url ? String(row.jira_url).trim() : "";
          if (jiraUrl) {
            const jiraKey = row && row.jira_issue_key ? String(row.jira_issue_key).trim() : "";
            const jiraLink = document.createElement("a");
            jiraLink.href = jiraUrl;
            jiraLink.target = "_blank";
            jiraLink.rel = "noopener noreferrer";
            jiraLink.className = "jira-indicator-link";
            jiraLink.title = jiraKey ? ("Open JIRA " + jiraKey) : "Open linked JIRA issue";
            jiraLink.setAttribute("aria-label", jiraKey ? ("Open JIRA issue " + jiraKey) : "Open linked JIRA issue");
            const jiraIcon = document.createElement("span");
            jiraIcon.className = "jira-indicator-icon";
            jiraIcon.setAttribute("aria-hidden", "true");
            jiraIcon.textContent = "J";
            jiraLink.appendChild(jiraIcon);
            jiraLink.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              openUrlInNewTab(jiraUrl);
            });
            wrap.appendChild(jiraLink);
          }
          td.appendChild(wrap);
        } else if (col.type === "date") {
          td.textContent = formatDateTime(row[col.key]);
        } else {
          td.textContent = String(row[col.key] == null ? "" : row[col.key]);
        }
        tr.appendChild(td);
      });
      els.ticketBody.appendChild(tr);
    });
    updateTicketActionButtons();
  }

  function populateApiPathSelect() {
    if (!els.apiPathSelect) return;
    els.apiPathSelect.innerHTML = "";
    ZD_GET_PATHS.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.path;
      opt.textContent = p.path + " – " + p.summary;
      els.apiPathSelect.appendChild(opt);
    });
  }

  function getSelectedPathSpec() {
    const path = els.apiPathSelect && els.apiPathSelect.value;
    return ZD_GET_PATHS.find((p) => p.path === path) || ZD_GET_PATHS[0];
  }

  function getActiveTicketIdForApiParam() {
    const selectedTicketId = normalizeZendeskTicketId(state.selectedTicketId);
    if (selectedTicketId != null) return selectedTicketId;
    const currentTicket = getCurrentTicketContext();
    const currentTicketId = normalizeZendeskTicketId(currentTicket && currentTicket.id);
    if (currentTicketId != null) return currentTicketId;
    const passAiTicketId = normalizeZendeskTicketId(state.passAiTicketId);
    if (passAiTicketId != null) return passAiTicketId;
    return "";
  }

  function getDefaultParamValue(param) {
    const key = String(param || "").trim().toLowerCase();
    const p = state.userProfile || {};
    if (key === "ticket_id") return getActiveTicketIdForApiParam();
    if (key === "userid" || key === "user_id") return p.user_id != null || p.id != null ? String(p.user_id ?? p.id) : "";
    if (key === "group_id") return p.default_group_id != null || p.group_id != null ? String(p.default_group_id ?? p.group_id) : "";
    if (key === "organization_id") return p.organization_id != null ? String(p.organization_id) : "";
    return "";
  }

  function renderApiParams() {
    const spec = getSelectedPathSpec();
    els.apiParams.innerHTML = "";
    spec.params.forEach((param) => {
      const row = document.createElement("div");
      row.className = "param-row";
      const defaultValue = getDefaultParamValue(param);
      row.innerHTML = `<label for="zipApiParam_${param}">${param}</label><input class="zip-text-input spectrum-Textfield-input" type="text" id="zipApiParam_${param}" value="${escapeHtml(defaultValue)}" placeholder="${escapeHtml(param)}" />`;
      els.apiParams.appendChild(row);
    });
  }

  function buildApiUrl() {
    return buildApiRequestContext().url;
  }

  function buildApiRequestContext() {
    const spec = getSelectedPathSpec();
    let resolvedPath = spec.path;
    let encodedPath = spec.path;
    const params = [];
    (spec.params || []).forEach((param) => {
      const input = document.getElementById("zipApiParam_" + param);
      const typedValue = (input && input.value && input.value.trim()) || "";
      const defaultValue = getDefaultParamValue(param);
      const value = typedValue || defaultValue || "";
      params.push({ name: param, value });
      resolvedPath = resolvedPath.replace("{" + param + "}", value || "blank");
      encodedPath = encodedPath.replace("{" + param + "}", encodeURIComponent(value));
    });
    const url = BASE + encodedPath + (encodedPath.indexOf("/api/") !== -1 && !encodedPath.endsWith(".json") ? ".json" : "");
    return {
      specPath: spec.path,
      resolvedPath,
      url,
      params
    };
  }

  async function runZdGet() {
    const requestContext = buildApiRequestContext();
    const url = requestContext.url;
    state.lastApiRequest = requestContext;
    setBusy(true);
    setStatus("Calling " + url + "...", false);
    try {
      const result = await sendToZendeskTab({ action: "fetch", url });
      setRawFromPayload(result.payload != null ? result.payload : (result.text || ""));
      setRawTitle(requestContext.specPath);
      setStatus(result.ok ? "GET succeeded." : "GET returned " + result.status + ".", !result.ok);
      return result;
    } catch (err) {
      setStatus("API call failed: " + (err && err.message ? err.message : "Unknown error"), true);
      setRawFromPayload(null);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function loadTickets(userId) {
    setTicketTableLoading(true);
    try {
      const result = await sendToZendeskTab({ action: "loadTickets", userId: String(userId || "") });
      state.tickets = result.tickets || [];
      if (result.error) throw new Error(result.error);
      applyFiltersAndRender();
    } catch (err) {
      state.tickets = [];
      state.filteredTickets = [];
      applyFiltersAndRender();
      throw err;
    } finally {
      setTicketTableLoading(false);
    }
  }

  function getAssignedUserId() {
    if (!state.user || state.user.id == null) return "";
    return String(state.user.id);
  }

  function loadAssignedTickets() {
    return loadTickets(getAssignedUserId());
  }

  async function loadTicketsByOrg(orgId) {
    setTicketTableLoading(true);
    try {
      const result = await sendToZendeskTab({ action: "loadTicketsByOrg", orgId: String(orgId || "") });
      state.tickets = result.tickets || [];
      if (result.error) throw new Error(result.error);
      applyFiltersAndRender();
    } catch (err) {
      state.tickets = [];
      state.filteredTickets = [];
      applyFiltersAndRender();
      throw err;
    } finally {
      setTicketTableLoading(false);
    }
  }

  async function loadTicketsByView(viewId) {
    setTicketTableLoading(true);
    try {
      const result = await sendToZendeskTab({ action: "loadTicketsByView", viewId: String(viewId || "") });
      state.tickets = result.tickets || [];
      if (result.error) throw new Error(result.error);
      applyFiltersAndRender();
    } catch (err) {
      state.tickets = [];
      state.filteredTickets = [];
      applyFiltersAndRender();
      throw err;
    } finally {
      setTicketTableLoading(false);
    }
  }

  async function loadTicketsByAssigneeId(userId) {
    setTicketTableLoading(true);
    try {
      const result = await sendToZendeskTab({ action: "loadTicketsByAssigneeId", userId: String(userId || "") });
      state.tickets = result.tickets || [];
      if (result.error) throw new Error(result.error);
      applyFiltersAndRender();
    } catch (err) {
      state.tickets = [];
      state.filteredTickets = [];
      applyFiltersAndRender();
      throw err;
    } finally {
      setTicketTableLoading(false);
    }
  }

  function normalizeTicketCount(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.trunc(num));
  }

  function clearFilterCountCaches() {
    try { window.localStorage.removeItem(VIEW_COUNT_CACHE_KEY); } catch (_) {}
    try { window.localStorage.removeItem(ORG_COUNT_CACHE_KEY); } catch (_) {}
    try { window.localStorage.removeItem(GROUP_COUNT_CACHE_KEY); } catch (_) {}
  }

  function splitAndSortByTicketCount(items, getBaseLabel, getCount) {
    const active = [];
    const inactive = [];
    (Array.isArray(items) ? items : []).forEach((item) => {
      const baseLabel = getBaseLabel(item);
      const count = normalizeTicketCount(getCount(item));
      const row = { item, baseLabel, count };
      if (count > 0) active.push(row);
      else inactive.push(row);
    });
    const sorter = (a, b) => String(a.baseLabel).localeCompare(String(b.baseLabel), undefined, { sensitivity: "base" });
    active.sort(sorter);
    inactive.sort(sorter);
    return { active, inactive };
  }

  function appendSplitCountOptions(selectEl, splitRows, getValue, getLabel) {
    const appendRows = (rows, disableRows) => {
      rows.forEach((row) => {
        const opt = document.createElement("option");
        opt.value = getValue(row.item);
        opt.disabled = !!disableRows;
        opt.textContent = getLabel(row.item, row.count);
        selectEl.appendChild(opt);
      });
    };
    const appendHeading = (text) => {
      const opt = document.createElement("option");
      opt.value = "";
      opt.disabled = true;
      opt.textContent = text;
      selectEl.appendChild(opt);
    };

    const disableInactiveRows = splitRows.active.length > 0;
    if (splitRows.active.length) {
      appendHeading("ACTIVE (>0 tickets)");
      appendRows(splitRows.active, false);
    }
    if (splitRows.active.length && splitRows.inactive.length) {
      const sep = document.createElement("option");
      sep.value = "";
      sep.disabled = true;
      sep.textContent = "────────────────────────";
      selectEl.appendChild(sep);
    }
    if (splitRows.inactive.length) {
      appendHeading("INACTIVE (0 tickets)");
      appendRows(splitRows.inactive, disableInactiveRows);
    }
  }

  function renderSelectLoadingPlaceholder(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "";
    selectEl.appendChild(opt);
    selectEl.value = "";
  }

  function getOrgBaseLabel(org) {
    return (org && org.name ? String(org.name).trim() : "") || ("Org " + (org && org.id != null ? org.id : ""));
  }

  function renderOrgSelectLoadingPlaceholder() {
    renderSelectLoadingPlaceholder(els.orgSelect);
  }

  function getOrgLabel(org, countOverride) {
    const id = org && org.id != null ? String(org.id) : "";
    const base = getOrgBaseLabel(org);
    const count = countOverride != null ? countOverride : state.orgCountsById[id];
    const countText = String(normalizeTicketCount(count));
    const basePadded = state.orgLabelPadLength > 0 ? base.padEnd(state.orgLabelPadLength, " ") : base;
    return basePadded + "  [ " + countText + " ]";
  }

  async function loadOrgCountsForSelect(loadSeq, orgsSnapshot) {
    const list = Array.isArray(orgsSnapshot) ? orgsSnapshot : [];
    const countsById = Object.create(null);
    if (!list.length) return countsById;
    const maxConcurrent = 12;
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < list.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        const org = list[currentIndex];
        if (!org || org.id == null) continue;
        const orgId = String(org.id);
        countsById[orgId] = 0;
        if (loadSeq !== state.orgCountLoadSeq) return;
        try {
          const result = await sendToZendeskTab({ action: "loadOrganizationCount", orgId });
          if (loadSeq !== state.orgCountLoadSeq) return;
          if (!result || result.error || result.count == null) continue;
          countsById[orgId] = normalizeTicketCount(result.count);
        } catch (_) {}
      }
    };

    const workers = [];
    const workerCount = Math.min(maxConcurrent, list.length);
    for (let i = 0; i < workerCount; i += 1) workers.push(worker());
    await Promise.all(workers);
    return countsById;
  }

  async function loadOrganizations() {
    const loadSeq = state.orgCountLoadSeq + 1;
    state.orgCountLoadSeq = loadSeq;
    state.orgCountsById = Object.create(null);
    state.orgLabelPadLength = 0;
    setOrgSelectLoading(true);
    renderOrgSelectLoadingPlaceholder();
    try {
      const result = await sendToZendeskTab({ action: "loadOrganizations" });
      state.organizations = result.organizations || [];
      if (result.error) throw new Error(result.error);
      state.orgLabelPadLength = (state.organizations || []).reduce((max, org) => Math.max(max, getOrgBaseLabel(org).length), 0);
      state.orgCountsById = await loadOrgCountsForSelect(loadSeq, state.organizations.slice());
      if (loadSeq !== state.orgCountLoadSeq) return;
      populateOrgSelect();
      return { ok: true, count: (state.organizations || []).length };
    } catch (_) {
      if (loadSeq !== state.orgCountLoadSeq) return;
      state.organizations = [];
      state.orgCountsById = Object.create(null);
      state.orgLabelPadLength = 0;
      populateOrgSelect();
      return { ok: false, error: new Error("Unable to load organizations"), count: 0 };
    } finally {
      if (loadSeq === state.orgCountLoadSeq) setOrgSelectLoading(false);
    }
  }

  function populateOrgSelect() {
    if (!els.orgSelect) return;
    const selected = state.selectedOrgId || "";
    els.orgSelect.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "By Organization";
    els.orgSelect.appendChild(opt0);

    const splitRows = splitAndSortByTicketCount(
      state.organizations,
      getOrgBaseLabel,
      (org) => state.orgCountsById[String(org && org.id != null ? org.id : "")]
    );
    appendSplitCountOptions(
      els.orgSelect,
      splitRows,
      (org) => String(org.id),
      (org, count) => getOrgLabel(org, count)
    );
    els.orgSelect.value = selected;
  }

  async function loadViews() {
    const loadSeq = state.viewCountLoadSeq + 1;
    state.viewCountLoadSeq = loadSeq;
    state.viewCountsById = Object.create(null);
    state.viewLabelPadLength = 0;
    setViewSelectLoading(true);
    renderViewSelectLoadingPlaceholder();
    try {
      const result = await sendToZendeskTab({ action: "loadViews" });
      state.views = result.views || [];
      if (result.error) throw new Error(result.error);
      state.viewLabelPadLength = (state.views || []).reduce((max, view) => Math.max(max, getViewBaseLabel(view).length), 0);
      state.viewCountsById = await loadViewCountsForSelect(loadSeq, state.views.slice());
      if (loadSeq !== state.viewCountLoadSeq) return;
      populateViewSelect();
      return { ok: true, count: (state.views || []).length };
    } catch (_) {
      if (loadSeq !== state.viewCountLoadSeq) return;
      state.views = [];
      state.viewCountsById = Object.create(null);
      state.viewLabelPadLength = 0;
      populateViewSelect();
      return { ok: false, error: new Error("Unable to load views"), count: 0 };
    } finally {
      if (loadSeq === state.viewCountLoadSeq) setViewSelectLoading(false);
    }
  }

  function parseGroupFilterValue(value) {
    const raw = String(value || "").trim();
    if (!raw) return { kind: "", groupId: "", userId: "", lookupKey: "" };
    if (raw.startsWith("g-")) {
      const groupId = raw.slice(2).trim();
      return {
        kind: groupId ? "group" : "",
        groupId,
        userId: "",
        lookupKey: groupId ? ("g:" + groupId) : ""
      };
    }
    if (raw.startsWith("u-")) {
      const payload = raw.slice(2);
      const marker = "|g-";
      const markerIndex = payload.indexOf(marker);
      const userId = (markerIndex >= 0 ? payload.slice(0, markerIndex) : payload).trim();
      const groupId = (markerIndex >= 0 ? payload.slice(markerIndex + marker.length) : "").trim();
      return {
        kind: userId ? "agent" : "",
        groupId,
        userId,
        lookupKey: userId ? ("u:" + userId) : ""
      };
    }
    return { kind: "", groupId: "", userId: "", lookupKey: "" };
  }

  function buildGroupFilterOptions(groupsWithMembers) {
    const list = [];
    const groups = (Array.isArray(groupsWithMembers) ? groupsWithMembers : []).slice();
    groups.sort((a, b) => {
      const an = (a && a.group && a.group.name ? String(a.group.name).trim() : "") || "";
      const bn = (b && b.group && b.group.name ? String(b.group.name).trim() : "") || "";
      return an.localeCompare(bn, undefined, { sensitivity: "base" });
    });
    const seenGroupValues = new Set();
    const seenMembershipValues = new Set();
    groups.forEach(({ group, agents }) => {
      if (!group || group.id == null) return;
      const groupId = String(group.id);
      const groupName = (group.name || "").trim() || ("Group " + groupId);
      const groupValue = "g-" + groupId;
      if (!seenGroupValues.has(groupValue)) {
        seenGroupValues.add(groupValue);
        list.push({
          value: groupValue,
          kind: "group",
          groupId,
          groupName,
          name: groupName
        });
      }
      const sortedAgents = (Array.isArray(agents) ? agents : []).slice().sort((a, b) => {
        const an = (a && a.name ? String(a.name).trim() : "") || "";
        const bn = (b && b.name ? String(b.name).trim() : "") || "";
        return an.localeCompare(bn, undefined, { sensitivity: "base" });
      });
      const seenAgentsInGroup = new Set();
      sortedAgents.forEach((agent) => {
        if (!agent || agent.id == null) return;
        const agentId = String(agent.id);
        if (seenAgentsInGroup.has(agentId)) return;
        seenAgentsInGroup.add(agentId);
        const membershipValue = "u-" + agentId + "|g-" + groupId;
        if (seenMembershipValues.has(membershipValue)) return;
        seenMembershipValues.add(membershipValue);
        list.push({
          value: membershipValue,
          kind: "agent",
          groupId,
          groupName,
          name: (agent.name || "").trim() || ("Agent " + agentId)
        });
      });
    });
    return list;
  }

  function getGroupBaseLabel(option) {
    return (option && option.name ? String(option.name).trim() : "") || (option && option.kind === "group" ? "Group" : "Agent");
  }

  function getGroupDisplayBaseLabel(option) {
    const base = getGroupBaseLabel(option);
    return option && option.kind === "agent" ? ("    " + base) : base;
  }

  function renderGroupSelectLoadingPlaceholder() {
    renderSelectLoadingPlaceholder(els.groupMemberSelect);
  }

  function getGroupLabel(option, countOverride, countPadLengthOverride) {
    const key = String(option && option.value ? option.value : "");
    const base = getGroupDisplayBaseLabel(option);
    const count = countOverride != null ? countOverride : state.groupCountsByValue[key];
    const countText = String(normalizeTicketCount(count));
    const countWidth = Number(countPadLengthOverride) > 0 ? Number(countPadLengthOverride) : countText.length;
    const countPadded = countText.padStart(countWidth, " ");
    const basePadded = state.groupLabelPadLength > 0 ? base.padEnd(state.groupLabelPadLength, " ") : base;
    if (option && option.kind === "agent") return basePadded + "  [ " + countPadded + " ]";
    return basePadded + " - [ " + countPadded + " ]";
  }

  async function loadGroupCountsForSelect(loadSeq, optionsSnapshot) {
    const list = Array.isArray(optionsSnapshot) ? optionsSnapshot : [];
    const countsByValue = Object.create(null);
    if (!list.length) return countsByValue;
    const maxConcurrent = 12;
    const pendingCountByLookup = Object.create(null);
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < list.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        const option = list[currentIndex];
        const value = option && option.value ? String(option.value) : "";
        if (!value) continue;
        countsByValue[value] = 0;
        if (loadSeq !== state.groupLoadSeq) return;
        const parsed = parseGroupFilterValue(value);
        const lookupKey = parsed.lookupKey;
        try {
          if (!lookupKey) continue;
          if (!pendingCountByLookup[lookupKey]) {
            pendingCountByLookup[lookupKey] = (async () => {
              let result = null;
              if (parsed.kind === "group" && parsed.groupId) {
                result = await sendToZendeskTab({ action: "loadGroupTicketCount", groupId: parsed.groupId });
              } else if (parsed.kind === "agent" && parsed.userId) {
                result = await sendToZendeskTab({ action: "loadAssigneeTicketCount", userId: parsed.userId });
              }
              if (!result || result.error || result.count == null) return 0;
              return normalizeTicketCount(result.count);
            })();
          }
          countsByValue[value] = await pendingCountByLookup[lookupKey];
          if (loadSeq !== state.groupLoadSeq) return;
        } catch (_) {}
      }
    };

    const workers = [];
    const workerCount = Math.min(maxConcurrent, list.length);
    for (let i = 0; i < workerCount; i += 1) workers.push(worker());
    await Promise.all(workers);
    return countsByValue;
  }

  async function loadAllGroupsWithMembers() {
    const loadSeq = state.groupLoadSeq + 1;
    state.groupLoadSeq = loadSeq;
    state.groupsWithMembers = [];
    state.groupOptions = [];
    state.groupCountsByValue = Object.create(null);
    state.groupLabelPadLength = 0;
    setGroupSelectLoading(true);
    renderGroupSelectLoadingPlaceholder();
    try {
      const result = await sendToZendeskTab({ action: "loadAllGroupsWithMembers" });
      if (loadSeq !== state.groupLoadSeq) return;
      state.groupsWithMembers = result.groupsWithMembers || [];
      if (result.error) state.groupsWithMembers = [];
      state.groupOptions = buildGroupFilterOptions(state.groupsWithMembers);
      state.groupLabelPadLength = (state.groupOptions || []).reduce((max, option) => Math.max(max, getGroupDisplayBaseLabel(option).length), 0);
      state.groupCountsByValue = await loadGroupCountsForSelect(loadSeq, state.groupOptions.slice());
      if (loadSeq !== state.groupLoadSeq) return;
      populateGroupMemberSelect();
      return { ok: true, count: (state.groupOptions || []).length };
    } catch (_) {
      if (loadSeq !== state.groupLoadSeq) return;
      state.groupsWithMembers = [];
      state.groupOptions = [];
      state.groupCountsByValue = Object.create(null);
      state.groupLabelPadLength = 0;
      populateGroupMemberSelect();
      return { ok: false, error: new Error("Unable to load groups/agents"), count: 0 };
    } finally {
      if (loadSeq === state.groupLoadSeq) setGroupSelectLoading(false);
    }
  }

  function populateGroupMemberSelect() {
    if (!els.groupMemberSelect) return;
    const selected = state.selectedByGroupValue || "";
    els.groupMemberSelect.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "By Group / Agent";
    els.groupMemberSelect.appendChild(opt0);

    const buildGroupOptionBlocks = () => {
      const blocksById = Object.create(null);
      const blocks = [];
      (Array.isArray(state.groupOptions) ? state.groupOptions : []).forEach((option) => {
        if (!option || !option.groupId) return;
        const groupId = String(option.groupId);
        let block = blocksById[groupId];
        if (!block) {
          block = {
            groupId,
            groupName: (option.groupName || "").trim() || ("Group " + groupId),
            groupOption: null,
            agents: []
          };
          blocksById[groupId] = block;
          blocks.push(block);
        }
        if (option.kind === "group") block.groupOption = option;
        else if (option.kind === "agent") block.agents.push(option);
      });

      blocks.forEach((block) => {
        if (!block.groupOption) {
          block.groupOption = {
            value: "g-" + block.groupId,
            kind: "group",
            groupId: block.groupId,
            groupName: block.groupName,
            name: block.groupName
          };
        }
        block.agents.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" }));
      });

      blocks.sort((a, b) => String(a.groupName || "").localeCompare(String(b.groupName || ""), undefined, { sensitivity: "base" }));
      return blocks;
    };

    const buildRowsForSection = (groupBlocks, includeActive, disableRows) => {
      const rows = [];
      const matchesSection = (count) => includeActive ? count > 0 : count === 0;
      const sectionDisabled = !!disableRows;
      groupBlocks.forEach((block) => {
        const groupValue = String(block.groupOption && block.groupOption.value ? block.groupOption.value : "");
        const groupCount = normalizeTicketCount(state.groupCountsByValue[groupValue]);
        const groupMatches = matchesSection(groupCount);

        const agentRows = [];
        block.agents.forEach((agentOption) => {
          const agentValue = String(agentOption && agentOption.value ? agentOption.value : "");
          const agentCount = normalizeTicketCount(state.groupCountsByValue[agentValue]);
          if (!matchesSection(agentCount)) return;
          agentRows.push({ option: agentOption, count: agentCount, disabled: sectionDisabled });
        });

        if (!groupMatches && !agentRows.length) return;
        rows.push({ option: block.groupOption, count: groupCount, disabled: sectionDisabled || !groupMatches });
        agentRows.forEach((agentRow) => rows.push(agentRow));
      });
      return rows;
    };

    const appendRows = (rows) => {
      let groupCount = 0;
      const countPadLength = (Array.isArray(state.groupOptions) ? state.groupOptions : []).reduce((max, option) => {
        const value = String(option && option.value ? option.value : "");
        const len = String(normalizeTicketCount(state.groupCountsByValue[value])).length;
        return len > max ? len : max;
      }, 1);
      rows.forEach((row) => {
        if (row && row.option && row.option.kind === "group") {
          if (groupCount > 0) {
            const groupSep = document.createElement("option");
            groupSep.value = "";
            groupSep.disabled = true;
            groupSep.textContent = "────────────";
            els.groupMemberSelect.appendChild(groupSep);
          }
          groupCount += 1;
        }
        const opt = document.createElement("option");
        opt.value = row.disabled ? "" : String(row.option.value || "");
        opt.disabled = !!row.disabled;
        opt.textContent = getGroupLabel(row.option, row.count, countPadLength);
        els.groupMemberSelect.appendChild(opt);
      });
    };

    const groupBlocks = buildGroupOptionBlocks();
    const activeRows = buildRowsForSection(groupBlocks, true, false);
    const inactiveRows = buildRowsForSection(groupBlocks, false, activeRows.length > 0);

    if (activeRows.length) {
      const heading = document.createElement("option");
      heading.value = "";
      heading.disabled = true;
      heading.textContent = "ACTIVE (>0 tickets)";
      els.groupMemberSelect.appendChild(heading);
      appendRows(activeRows);
    }
    if (activeRows.length && inactiveRows.length) {
      const sep = document.createElement("option");
      sep.value = "";
      sep.disabled = true;
      sep.textContent = "────────────────────────";
      els.groupMemberSelect.appendChild(sep);
    }
    if (inactiveRows.length) {
      const heading = document.createElement("option");
      heading.value = "";
      heading.disabled = true;
      heading.textContent = "INACTIVE (0 tickets)";
      els.groupMemberSelect.appendChild(heading);
      appendRows(inactiveRows);
    }

    els.groupMemberSelect.value = selected;
  }

  async function loadTicketsByGroupId(groupId) {
    setTicketTableLoading(true);
    try {
      const result = await sendToZendeskTab({ action: "loadTicketsByGroupId", groupId: String(groupId || "") });
      state.tickets = result.tickets || [];
      if (result.error) throw new Error(result.error);
      applyFiltersAndRender();
    } catch (err) {
      state.tickets = [];
      state.filteredTickets = [];
      applyFiltersAndRender();
      throw err;
    } finally {
      setTicketTableLoading(false);
    }
  }

  function loadTicketsByGroupSelectionValue(value) {
    const parsed = parseGroupFilterValue(value);
    if (parsed.kind === "group" && parsed.groupId) return loadTicketsByGroupId(parsed.groupId);
    if (parsed.kind === "agent" && parsed.userId) return loadTicketsByAssigneeId(parsed.userId);
    return Promise.resolve();
  }

  function getViewBaseLabel(view) {
    return (view && view.title ? String(view.title).trim() : "") || ("View " + (view && view.id != null ? view.id : ""));
  }

  function renderViewSelectLoadingPlaceholder() {
    renderSelectLoadingPlaceholder(els.viewSelect);
  }

  function getViewLabel(view, countOverride) {
    const id = view && view.id != null ? String(view.id) : "";
    const base = getViewBaseLabel(view);
    const count = countOverride != null ? countOverride : state.viewCountsById[id];
    const countText = String(normalizeTicketCount(count));
    const basePadded = state.viewLabelPadLength > 0 ? base.padEnd(state.viewLabelPadLength, " ") : base;
    return basePadded + "  [ " + countText + " ]";
  }

  async function loadViewCountsForSelect(loadSeq, viewsSnapshot) {
    const list = Array.isArray(viewsSnapshot) ? viewsSnapshot : [];
    const countsById = Object.create(null);
    if (!list.length) return countsById;
    const ids = [];
    list.forEach((view) => {
      if (!view || view.id == null) return;
      const viewId = String(view.id);
      countsById[viewId] = 0;
      ids.push(viewId);
    });
    if (!ids.length) return countsById;

    const maxConcurrent = 12;
    let nextIndex = 0;
    const worker = async () => {
      while (nextIndex < ids.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        const viewId = ids[currentIndex];
        if (!viewId) continue;
        if (loadSeq !== state.viewCountLoadSeq) return;
        try {
          const result = await sendToZendeskTab({ action: "loadViewCount", viewId });
          if (loadSeq !== state.viewCountLoadSeq) return;
          if (!result || result.error || result.count == null) continue;
          countsById[viewId] = normalizeTicketCount(result.count);
        } catch (_) {}
      }
    };
    const workers = [];
    for (let i = 0; i < Math.min(maxConcurrent, ids.length); i += 1) workers.push(worker());
    await Promise.all(workers);
    return countsById;
  }

  function populateViewSelect() {
    if (!els.viewSelect) return;
    const selected = state.selectedViewId || "";
    els.viewSelect.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "By View";
    els.viewSelect.appendChild(opt0);

    const splitRows = splitAndSortByTicketCount(
      state.views,
      getViewBaseLabel,
      (view) => state.viewCountsById[String(view && view.id != null ? view.id : "")]
    );
    appendSplitCountOptions(
      els.viewSelect,
      splitRows,
      (view) => String(view.id),
      (view, count) => getViewLabel(view, count)
    );
    els.viewSelect.value = selected;
  }

  /** Run the same "assigned to logged-in user" ticket query used after login. */
  function runAssignedTicketsQuery() {
    if (!state.user || state.user.id == null) return;
    state.ticketSource = "assigned";
    state.selectedOrgId = "";
    state.selectedViewId = "";
    state.selectedByGroupValue = "";
    if (els.orgSelect) els.orgSelect.value = "";
    if (els.viewSelect) els.viewSelect.value = "";
    if (els.groupMemberSelect) els.groupMemberSelect.value = "";
    return loadAssignedTickets();
  }

  function formatErrorMessage(err, fallback) {
    return err && err.message ? err.message : fallback;
  }

  async function loadFilterCatalogWithRetry(label, loadFn) {
    let lastError = null;
    for (let attempt = 1; attempt <= FILTER_CATALOG_RETRY_ATTEMPTS; attempt += 1) {
      if (!state.user) {
        return { ok: false, label, error: new Error("Session ended"), attempts: attempt - 1 };
      }
      try {
        const result = await loadFn();
        if (result && result.ok) {
          return { ok: true, label, attempts: attempt };
        }
        lastError = result && result.error ? result.error : new Error("Unknown error");
      } catch (err) {
        lastError = err || new Error("Unknown error");
      }
      if (attempt < FILTER_CATALOG_RETRY_ATTEMPTS) {
        await wait(FILTER_CATALOG_RETRY_BASE_DELAY_MS * attempt);
      }
    }
    return {
      ok: false,
      label,
      error: lastError || new Error("Unknown error"),
      attempts: FILTER_CATALOG_RETRY_ATTEMPTS
    };
  }

  function setAssignedTicketsLoadStatus(navError) {
    if (navError) {
      setStatus(
        "Assigned tickets loaded. " + state.filteredTickets.length + " rows shown. Could not open main filter tab: " + formatErrorMessage(navError, "Unknown error"),
        true
      );
      return;
    }
    setStatus("Assigned tickets loaded. " + state.filteredTickets.length + " rows shown.", false);
  }

  function retryCatalogLoadOnSelectFocus() {
    if (els.viewSelect) {
      els.viewSelect.addEventListener("focus", () => {
        if (!state.user || state.viewSelectLoading || (state.views || []).length > 0) return;
        loadFilterCatalogWithRetry("By View", loadViews)
          .then((result) => {
            if (!result || !result.ok) {
              setStatus("By View filter failed to load. Please retry.", true);
            }
          })
          .catch(() => {});
      });
    }
    if (els.orgSelect) {
      els.orgSelect.addEventListener("focus", () => {
        if (!state.user || state.orgSelectLoading || (state.organizations || []).length > 0) return;
        loadFilterCatalogWithRetry("By Organization", loadOrganizations)
          .then((result) => {
            if (!result || !result.ok) {
              setStatus("By Organization filter failed to load. Please retry.", true);
            }
          })
          .catch(() => {});
      });
    }
    if (els.groupMemberSelect) {
      els.groupMemberSelect.addEventListener("focus", () => {
        if (!state.user || state.groupSelectLoading || (state.groupOptions || []).length > 0) return;
        loadFilterCatalogWithRetry("By Group / Agent", loadAllGroupsWithMembers)
          .then((result) => {
            if (!result || !result.ok) {
              setStatus("By Group / Agent filter failed to load. Please retry.", true);
            }
          })
          .catch(() => {});
      });
    }
  }

  function runAssignedTicketsQueryWithMainFilter() {
    return runAssignedTicketsQuery().then(async () => {
      try {
        const navResult = await ensureAssignedFilterTabOpen();
        if (navResult && navResult.tabId != null) state.zendeskTabId = navResult.tabId;
        if (navResult && navResult.navigated) {
          await waitForZendeskSessionReady(12000);
        }
        return { navError: null };
      } catch (err) {
        return { navError: err || new Error("Unknown error") };
      }
    });
  }

  async function startLogin() {
    const gateStatus = enforceZipConfigGate({ reportStatus: true });
    if (!gateStatus.ready) return;
    setStatus("Opening Zendesk in main browser tab…", false);
    try {
      // Strict policy: login only in the Zendesk main tab. No popup/OAuth flows in ZIP sidepanel.
      let result = null;
      let openedByBackground = false;
      try {
        result = await sendBackgroundRequest("LOGIN_CLICKED");
        openedByBackground = !!(result && result.ok === true);
      } catch (_) {
        openedByBackground = false;
      }

      if (!openedByBackground) {
        const tabs = await queryZendeskTabsFromSidepanel();
        if (tabs && tabs.length > 0) {
          result = await focusZendeskTabFromSidepanel(tabs[0]);
        } else {
          result = await openZendeskTabFromSidepanel();
        }
      }

      if (!result || result.ok !== true) {
        throw new Error((result && result.error) || "Unable to focus or open the Zendesk tab.");
      }
      setStatus("Focus moved to Zendesk. Sign in there; ZIP will auto-resume from sidepanel events.", false);
    } catch (err) {
      try {
        const fallbackFn = typeof window !== "undefined" ? window.ZIP_LOGIN_FALLBACK_OPEN : null;
        if (typeof fallbackFn === "function") {
          const fallbackResult = await fallbackFn();
          if (fallbackResult && fallbackResult.ok) {
            setStatus("Fallback opened Zendesk tab. Sign in there; ZIP will auto-resume.", false);
            return;
          }
        }
      } catch (_) {}
      setStatus("Unable to open Zendesk tab: " + (err && err.message ? err.message : "Unknown error"), true);
    }
  }

  /** Build a stable profile from GET /api/v2/users/me for API param defaults. */
  function parseUserProfile(mePayload) {
    const user = mePayload && mePayload.user && typeof mePayload.user === "object" ? mePayload.user : null;
    if (!user) return null;
    const profile = {
      user_id: user.id,
      id: user.id,
      default_group_id: user.default_group_id,
      group_id: user.default_group_id,
      organization_id: user.organization_id
    };
    return profile;
  }

  async function applySession(me) {
    const isFirstLogin = !state.user;
    let assignedFilterNavError = null;
    let assignedFilterNavResult = null;
    state.user = me.user;
    state.mePayload = me.payload;
    state.userProfile = parseUserProfile(me.payload);
    resetTopFilterMenuCatalogState();
    showTopFilterMenusLoadingState();
    setTopIdentityFromUser(me.user);
    showApp();
    state.lastApiRequest = {
      specPath: "/api/v2/users/me",
      resolvedPath: "/api/v2/users/me",
      url: BASE + "/api/v2/users/me.json",
      params: []
    };
    setRawFromPayload(me.payload);
    setRawTitle("/api/v2/users/me");
    renderApiParams();
    setStatus("Hello " + (me.user.name || me.user.email || "agent") + ". Loading assigned tickets...", false);
    await loadTickets(me.user && me.user.id != null ? String(me.user.id) : "");
    refreshSlacktivatedState({
      force: true,
      silent: true,
      allowOpenIdSilentProbe: true,
      allowSlackTabBootstrap: true,
      allowSlackTabBootstrapCreate: false
    }).catch(() => {});
    setStatus(
      "Assigned tickets loaded. " + state.filteredTickets.length + " rows shown. Loading filter menus…",
      false
    );
    if (isFirstLogin) {
      try {
        assignedFilterNavResult = await ensureAssignedFilterTabOpen();
        if (assignedFilterNavResult && assignedFilterNavResult.tabId != null) {
          state.zendeskTabId = assignedFilterNavResult.tabId;
        }
        if (assignedFilterNavResult && assignedFilterNavResult.navigated) {
          await waitForZendeskSessionReady(12000);
        }
      } catch (err) {
        assignedFilterNavError = err || new Error("Unknown error");
      }
    }
    (async () => {
      const orgResult = await loadFilterCatalogWithRetry("By Organization", loadOrganizations);
      const viewResult = await loadFilterCatalogWithRetry("By View", loadViews);
      const groupResult = await loadFilterCatalogWithRetry("By Group / Agent", loadAllGroupsWithMembers);
      return [orgResult, viewResult, groupResult];
    })().then((catalogResults) => {
      if (!state.user) return;
      const failedCatalogs = (Array.isArray(catalogResults) ? catalogResults : [])
        .filter((result) => !result || !result.ok)
        .map((result) => String(result && result.label ? result.label : "Filter"));
      if (assignedFilterNavError) {
        setStatus(
          "Ready. " + state.filteredTickets.length + " tickets shown. Could not open main filter tab: " + formatErrorMessage(assignedFilterNavError, "Unknown error"),
          true
        );
        return;
      }
      if (failedCatalogs.length) {
        setStatus(
          "Ready. " + state.filteredTickets.length + " tickets shown. Some filters failed to load: " + failedCatalogs.join(", "),
          true
        );
        return;
      }
      setStatus("Ready. " + state.filteredTickets.length + " tickets shown.", false);
    });
  }

  async function refreshAll() {
    const gateStatus = enforceZipConfigGate({ reportStatus: false });
    if (!gateStatus.ready) {
      showLogin();
      return;
    }
    setBusy(true);
    try {
      const me = await sendToZendeskTab({ action: "getMe" });
      if (!hasZendeskSessionUser(me)) {
        const status = Number(me && me.status);
        if (shouldTreatMeResponseAsLoggedOut(me)) {
          handleZendeskLoggedOut();
          return;
        }
        if (!state.user) {
          showLogin();
          return;
        }
        setStatus("Session check temporarily unavailable" + (Number.isFinite(status) ? " (HTTP " + status + ")" : "") + ".", true);
        return;
      }
      await applySession(me);
    } catch (err) {
      if (isSessionErrorMessage(err && err.message)) {
        handleZendeskLoggedOut();
      } else if (state.user) {
        setStatus("Refresh failed: " + (err && err.message ? err.message : "Unknown error"), true);
      } else {
        showLogin();
      }
    } finally {
      setBusy(false);
    }
  }

  function refreshFromAuthenticatedEvent(reason) {
    const gateStatus = enforceZipConfigGate({ reportStatus: false });
    if (!gateStatus.ready) {
      showLogin();
      return;
    }
    if (authRefreshInFlight) return;
    authRefreshInFlight = true;
    setStatus("Zendesk session detected. Loading…", false);
    refreshAll()
      .catch((err) => {
        setStatus("Refresh failed: " + (err && err.message ? err.message : "Unknown error"), true);
      })
      .finally(() => {
        authRefreshInFlight = false;
      });
  }

  function handleAuthMessage(msg) {
    if (!msg || typeof msg !== "object") return false;
    const payload = msg.payload && typeof msg.payload === "object" ? msg.payload : {};
    if (msg.type === "AUTHENTICATED") {
      if (!state.user) {
        refreshFromAuthenticatedEvent(payload.reason || "background_authenticated");
      }
      return true;
    }
    if (msg.type === "LOGGED_OUT") {
      handleZendeskLoggedOut();
      return true;
    }
    if (msg.type === "ABOUT_TO_EXPIRE") {
      if (state.user) {
        setStatus("Zendesk session is about to expire. Refresh activity in Zendesk to stay signed in.", false);
      }
      return true;
    }
    if (msg.type === "ZIP_KEY_CLEARED") {
      refreshZipSecretConfigFromStorage()
        .catch(() => {})
        .then(() => {
          showLogin();
        });
      return true;
    }
    return false;
  }

  async function hydrateAuthStateFromBackground(options) {
    const opts = options && typeof options === "object" ? options : {};
    const gateStatus = enforceZipConfigGate({ reportStatus: opts.reportLockedStatus !== false });
    if (!gateStatus.ready) {
      showLogin();
      return;
    }
    if (authHydrationInFlight) return;
    authHydrationInFlight = true;
    try {
      const auth = await sendBackgroundRequest("ZIP_GET_AUTH_STATE");
      if (auth && auth.loggedIn) {
        if (!state.user) {
          refreshFromAuthenticatedEvent("hydrate_logged_in");
        }
        return;
      }
      showLogin();
      if (opts.forceCheck) {
        const forced = await sendBackgroundRequest("ZIP_FORCE_CHECK", {
          reason: opts.reason || "sidepanel_hydrate"
        }).catch(() => {});
        const forcedPayload = forced && forced.payload && typeof forced.payload === "object"
          ? forced.payload
          : null;
        if ((forced && forced.ok) || (forcedPayload && forcedPayload.loggedIn)) {
          if (!state.user) {
            refreshFromAuthenticatedEvent("hydrate_force_check");
          }
          return;
        }
      }
      await runAuthCheckTick({ force: true }).catch(() => {});
      if (state.user) return;
      setStatus("Login with Zendesk to continue.", false);
    } catch (_) {
      showLogin();
      setStatus("Login with Zendesk to continue.", false);
    } finally {
      authHydrationInFlight = false;
    }
  }

  function wireEvents() {
    if (eventsWired) return;
    eventsWired = true;
    if (typeof window !== "undefined") window.__ZIP_LOGIN_HANDLER_READY__ = true;
    retryCatalogLoadOnSelectFocus();
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage && chrome.runtime.onMessage.addListener) {
      chrome.runtime.onMessage.addListener((msg) => {
        if (!msg || typeof msg !== "object") return;
        if (msg.type === "ZIP_THEME_CHANGED") {
          applyThemeState(msg);
          return;
        }
        handleAuthMessage(msg);
      });
    }
    if (typeof window !== "undefined") {
      window.addEventListener("focus", () => {
        refreshZipSecretConfigFromStorage()
          .then(() => applyZipConfigAfterStorageRefresh({ reportStatus: false }))
          .catch(() => {});
        loadSidePanelContext();
        loadContextMenuUpdateState(false).catch(() => {});
        loadThemeState().catch(() => {});
        if (state.user) refreshSlacktivatedState({ silent: true, allowOpenIdSilentProbe: true }).catch(() => {});
        if (state.zipConfigReady) triggerAuthCheckNow();
      });
      window.addEventListener("resize", () => {
        refreshThemeFlyoutPosition();
      });
      window.addEventListener("blur", () => { hideContextMenu(); });
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          refreshZipSecretConfigFromStorage()
            .then(() => applyZipConfigAfterStorageRefresh({ reportStatus: false }))
            .catch(() => {});
          loadSidePanelContext();
          loadContextMenuUpdateState(false).catch(() => {});
          loadThemeState().catch(() => {});
          if (state.user) refreshSlacktivatedState({ silent: true, allowOpenIdSilentProbe: true }).catch(() => {});
          if (state.zipConfigReady) triggerAuthCheckNow();
        }
      });
    }
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      hideContextMenu();
    });
    document.addEventListener("scroll", (e) => {
      if (!els.contextMenu || els.contextMenu.classList.contains("hidden")) return;
      const target = e && e.target;
      const scrolledMenu = !!(target && els.contextMenu.contains(target));
      const scrolledFlyout = !!(target
        && els.contextMenuThemeFlyout
        && !els.contextMenuThemeFlyout.classList.contains("hidden")
        && els.contextMenuThemeFlyout.contains(target));
      if (!scrolledMenu && !scrolledFlyout) hideContextMenu();
    }, true);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideContextMenu();
    });
    if (els.contextMenuBackdrop) {
      els.contextMenuBackdrop.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideContextMenu();
      });
    }
    if (els.contextMenuToggleSide) {
      els.contextMenuToggleSide.addEventListener("click", () => {
        runContextMenuAction("toggleSide");
      });
    }
    if (els.contextMenuToggleZdApi) {
      els.contextMenuToggleZdApi.addEventListener("click", () => {
        hideContextMenu();
        toggleZdApiContainerVisibility();
        setStatus(state.showZdApiContainers ? "ZD API panels shown." : "ZD API panels hidden.", false);
      });
    }
    if (els.contextMenuAskEric) {
      els.contextMenuAskEric.addEventListener("click", () => {
        runContextMenuAction("askEric");
      });
    }
    if (els.contextMenuGetLatest) {
      els.contextMenuGetLatest.addEventListener("click", () => {
        runContextMenuAction("getLatest");
      });
    }
    if (els.contextMenuClearKey) {
      els.contextMenuClearKey.addEventListener("click", () => {
        runContextMenuAction("clearZipKey");
      });
    }
    if (els.contextMenuThemeStopToggle) {
      els.contextMenuThemeStopToggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleContextMenuThemeStop();
      });
    }
    if (els.contextMenuThemeColorToggle) {
      els.contextMenuThemeColorToggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleContextMenuThemeColorFlyout();
      });
    }
    if (els.docsMenu) {
      els.docsMenu.addEventListener("change", (e) => {
        const target = e && e.target;
        const value = target && typeof target.value === "string" ? target.value.trim() : "";
        if (!value) return;
        const url = value;
        openExternalUrl(url);
        target.value = "";
      });
    }
    if (els.configDropZone && els.configFileInput) {
      const pickFile = () => {
        if (!state.zipConfigReady) els.configFileInput.click();
      };
      const preventDefault = (event) => {
        event.preventDefault();
        event.stopPropagation();
      };
      const setDragOver = (on) => {
        els.configDropZone.classList.toggle("is-dragover", !!on);
      };
      els.configDropZone.addEventListener("click", (event) => {
        event.preventDefault();
        pickFile();
      });
      els.configDropZone.addEventListener("dragenter", (event) => {
        if (state.zipConfigReady) return;
        preventDefault(event);
        setDragOver(true);
      });
      els.configDropZone.addEventListener("dragover", (event) => {
        if (state.zipConfigReady) return;
        preventDefault(event);
        if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
        setDragOver(true);
      });
      els.configDropZone.addEventListener("dragleave", (event) => {
        if (state.zipConfigReady) return;
        preventDefault(event);
        setDragOver(false);
      });
      els.configDropZone.addEventListener("drop", (event) => {
        if (state.zipConfigReady) return;
        preventDefault(event);
        setDragOver(false);
        const file = pickZipConfigFile(event.dataTransfer && event.dataTransfer.files);
        if (!file) {
          setStatus("No ZIP.KEY file detected in drop payload.", true);
          return;
        }
        importZipKeyFromFile(file).catch(() => {});
      });
      els.configFileInput.addEventListener("change", (event) => {
        const target = event && event.target;
        const file = pickZipConfigFile(target && target.files);
        if (!file) return;
        importZipKeyFromFile(file).catch(() => {});
      });
    }
    if (els.loginBtn) els.loginBtn.addEventListener("click", (e) => { e.preventDefault(); startLogin(); });
    if (els.appVersionLink) {
      els.appVersionLink.addEventListener("click", (e) => {
        e.preventDefault();
        refreshAll();
      });
    }
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getManifest) {
      try {
        const manifest = chrome.runtime.getManifest();
        const version = (manifest && manifest.version) || "?";
        if (els.appVersion) els.appVersion.textContent = version;
        if (els.loginAppVersion) els.loginAppVersion.textContent = version;
      } catch (_) {}
    }
    setContextMenuBuildLabel();
    loadContextMenuUpdateState(false).catch(() => {});
    if (els.topAvatarWrap) {
      els.topAvatarWrap.addEventListener("click", (e) => {
        if (!state.user) return;
        e.preventDefault();
        e.stopPropagation();
        if (els.contextMenu && !els.contextMenu.classList.contains("hidden")) {
          hideContextMenu();
          return;
        }
        const rect = els.topAvatarWrap.getBoundingClientRect();
        const menuX = Math.round(rect.left);
        const menuY = Math.round(rect.bottom + 6);
        showContextMenuAt(menuX, menuY);
      });
    }
    els.apiPathSelect.addEventListener("change", renderApiParams);
    els.apiRunBtn.addEventListener("click", runZdGet);
    els.rawDownload.addEventListener("click", (e) => {
      e.preventDefault();
      const str = state.lastApiPayloadString;
      if (str == null || str === "") return;
      const blob = new Blob([str], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getDownloadFilename();
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    if (els.passAiToggleBtn) {
      els.passAiToggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (state.passAiLoading || state.passAiSlackAuthPolling || state.slackItToMeLoading) return;
        togglePassAiPanelForSelectedTicket().catch(() => {});
      });
    }
    if (els.slacktivatedBtn) {
      els.slacktivatedBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!state.user) return;
        if (state.passAiSlackAuthPolling) {
          stopPassAiSlackAuthPolling();
        }
        if (isPassAiSlacktivated()) {
          refreshSlacktivatedState({ force: true, silent: true, allowOpenIdSilentProbe: false }).catch(() => {});
          setStatus("Hey " + getSlacktivatedDisplayName() + ", ZIP is SLACKTIVATED!!!", false);
          return;
        }
        (async () => {
          const ready = await refreshSlacktivatedState({ force: true, silent: true, allowOpenIdSilentProbe: false }).catch(() => false);
          if (ready && isPassAiSlacktivated()) {
            setStatus("Hey " + getSlacktivatedDisplayName() + ", ZIP is SLACKTIVATED!!!", false);
            return;
          }
          beginSlackLoginFlow().catch((err) => {
            const message = normalizePassAiCommentBody(err && err.message) || "Slack sign-in failed.";
            setPassAiSlackAuthState({ ready: false, error: message });
            setStatus("Slack sign-in failed: " + message, true);
          });
        })();
      });
    }
    if (els.askPassAiBtn) {
      els.askPassAiBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (state.passAiLoading) return;
        askPassAiForSelectedTicket();
      });
    }
    if (els.slackItToMeBtn) {
      els.slackItToMeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (state.slackItToMeLoading) return;
        slackVisibleTicketsToMe().catch((err) => {
          const message = normalizePassAiCommentBody(err && err.message) || "Slack send failed.";
          setStatus("SLACK_IT_TO_ME failed: " + message, true);
        });
      });
    }
    els.reloadTicketsBtn.addEventListener("click", async () => {
      if (!state.user) return;
      setBusy(true);
      try {
        if (state.ticketSource === "view" && state.selectedViewId) {
          await loadTicketsByView(state.selectedViewId);
        } else if (state.ticketSource === "org" && state.selectedOrgId) {
          await loadTicketsByOrg(state.selectedOrgId);
        } else if (state.ticketSource === "groupMember" && state.selectedByGroupValue) {
          await loadTicketsByGroupSelectionValue(state.selectedByGroupValue);
        } else {
          await loadAssignedTickets();
        }
        setStatus("Tickets refreshed. " + state.filteredTickets.length + " rows shown.", false);
      } catch (err) {
        setStatus("Ticket refresh failed: " + (err && err.message ? err.message : "Unknown error"), true);
      } finally {
        setBusy(false);
      }
    });
    if (els.exportCsvBtn) {
      els.exportCsvBtn.addEventListener("click", (e) => {
        e.preventDefault();
        exportVisibleTicketsToCsv();
      });
    }
    if (els.assignedTicketsLink) {
      els.assignedTicketsLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (!state.user || state.user.id == null) return;
        resetStatusFilterSelection();
        setBusy(true);
        runAssignedTicketsQueryWithMainFilter()
          .then((result) => setAssignedTicketsLoadStatus(result.navError))
          .catch((err) => setStatus("Tickets failed: " + formatErrorMessage(err, "Unknown error"), true))
          .finally(() => setBusy(false));
      });
    }
    if (els.orgSelect) {
      els.orgSelect.addEventListener("change", () => {
        const val = (els.orgSelect.value || "").trim();
        if (!state.user) return;
        state.selectedViewId = "";
        state.selectedByGroupValue = "";
        if (els.viewSelect) els.viewSelect.value = "";
        if (els.groupMemberSelect) els.groupMemberSelect.value = "";
        clearTicketTable({ loading: true });
        setBusy(true);
        if (!val) {
          state.ticketSource = "assigned";
          state.selectedOrgId = "";
          runAssignedTicketsQuery()
            .then(() => setAssignedTicketsLoadStatus(null))
            .catch((err) => setStatus("Tickets failed: " + formatErrorMessage(err, "Unknown error"), true))
            .finally(() => setBusy(false));
          return;
        }
        state.ticketSource = "org";
        state.selectedOrgId = val;
        loadTicketsByOrg(val)
          .then(() => setStatus("Org tickets loaded. " + state.filteredTickets.length + " rows shown.", false))
          .catch((err) => setStatus("Tickets failed: " + (err && err.message ? err.message : "Unknown error"), true))
          .finally(() => setBusy(false));
      });
    }
    if (els.viewSelect) {
      els.viewSelect.addEventListener("change", () => {
        const val = (els.viewSelect.value || "").trim();
        if (!state.user) return;
        state.selectedOrgId = "";
        state.selectedByGroupValue = "";
        if (els.orgSelect) els.orgSelect.value = "";
        if (els.groupMemberSelect) els.groupMemberSelect.value = "";
        clearTicketTable({ loading: true });
        setBusy(true);
        if (!val) {
          state.ticketSource = "assigned";
          state.selectedViewId = "";
          runAssignedTicketsQuery()
            .then(() => setAssignedTicketsLoadStatus(null))
            .catch((err) => setStatus("Tickets failed: " + formatErrorMessage(err, "Unknown error"), true))
            .finally(() => setBusy(false));
          return;
        }
        state.ticketSource = "view";
        state.selectedViewId = val;
        loadTicketsByView(val)
          .then(() => setStatus("View tickets loaded. " + state.filteredTickets.length + " rows shown.", false))
          .catch((err) => setStatus("Tickets failed: " + (err && err.message ? err.message : "Unknown error"), true))
          .finally(() => setBusy(false));
      });
    }
    if (els.groupMemberSelect) {
      els.groupMemberSelect.addEventListener("change", () => {
        const val = (els.groupMemberSelect.value || "").trim();
        if (!state.user) return;
        state.selectedOrgId = "";
        state.selectedViewId = "";
        if (els.orgSelect) els.orgSelect.value = "";
        if (els.viewSelect) els.viewSelect.value = "";
        if (!val) {
          state.ticketSource = "assigned";
          state.selectedByGroupValue = "";
          clearTicketTable({ loading: true });
          setBusy(true);
          runAssignedTicketsQuery()
            .then(() => setAssignedTicketsLoadStatus(null))
            .catch((err) => setStatus("Tickets failed: " + formatErrorMessage(err, "Unknown error"), true))
            .finally(() => setBusy(false));
          return;
        }
        state.ticketSource = "groupMember";
        state.selectedByGroupValue = val;
        clearTicketTable({ loading: true });
        setStatus("Loading tickets…", false);
        setBusy(true);
        const loadPromise = loadTicketsByGroupSelectionValue(val);
        loadPromise
          .then(() => setStatus("Tickets loaded. " + state.filteredTickets.length + " rows shown.", false))
          .catch((err) => setStatus("Tickets failed: " + (err && err.message ? err.message : "Unknown error"), true))
          .finally(() => setBusy(false));
      });
    }
    els.ticketSearch.addEventListener("input", () => {
      state.textFilter = els.ticketSearch.value || "";
      applyFiltersAndRender();
    });
    els.statusFilter.addEventListener("change", () => {
      state.statusFilter = normalizeStatusValue(els.statusFilter.value) || STATUS_FILTER_ALL_VALUE;
      applyFiltersAndRender();
    });
    els.topAvatar.addEventListener("error", () => {
      els.topAvatar.classList.add("hidden");
      els.topAvatarFallback.classList.remove("hidden");
    });
  }

  function populateAppDescription() {
    if (!els.appDescription) return;
    try {
      const manifest = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getManifest ? chrome.runtime.getManifest() : null;
      const desc = (manifest && manifest.description) ? String(manifest.description) : "";
      els.appDescription.textContent = desc || "ZIP — Zeek Info Peek.";
    } catch (_) {
      els.appDescription.textContent = "ZIP — Zeek Info Peek.";
    }
  }

  async function init() {
    if (IS_WORKSPACE_MODE) document.body.classList.add("zip-workspace");
    document.body.classList.add("zip-logged-out");
    if (els.status) els.status.title = FOOTER_HINT_TOOLTIP;
    wireEvents();
    await runZipLocalStorageMigration().catch(() => {});
    await refreshZipSecretConfigFromStorage().catch(() => {});
    await loadThemeState().catch(() => {});
    await loadSidePanelContext().catch(() => {});
    initializeZdApiContainerVisibility();
    populateAppDescription();
    populateApiPathSelect();
    renderApiParams();
    renderTicketHeaders();
    updateTicketActionButtons();
    resetTopIdentity();
    setStatus("", false);
    const gateStatus = enforceZipConfigGate({ reportStatus: false });
    if (!gateStatus.ready) {
      showLogin();
      return;
    }
    await hydrateAuthStateFromBackground({ forceCheck: true, reason: "sidepanel_init" });
  }

  init();
})();
