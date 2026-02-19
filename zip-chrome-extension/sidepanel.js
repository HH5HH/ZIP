(function () {
  "use strict";

  const BASE = "https://adobeprimetime.zendesk.com";
  const ASSIGNED_FILTER_PATH = "/agent/filters/36464467";
  const ASSIGNED_FILTER_URL = BASE + ASSIGNED_FILTER_PATH;
  const LOGIN_URL = BASE + "/auth/v3/signin?return_to=" + encodeURIComponent(ASSIGNED_FILTER_URL);
  const TICKET_URL_PREFIX = BASE + "/agent/tickets/";
  const SHOW_TICKET_API_PATH = "/api/v2/tickets/{ticket_id}";
  const PASS_AI_SLACK_WORKSPACE_ORIGIN = "https://adobedx.slack.com";
  const PASS_AI_SLACK_API_ENDPOINT = PASS_AI_SLACK_WORKSPACE_ORIGIN + "/api";
  const PASS_AI_SLACK_APP_ID = "A0AGPACM3UG";
  const PASS_AI_SLACK_SINGULARITY_USER_ID = "U05PQCUFN0H";
  const PASS_AI_SLACK_TEAM_ID = "T02CAQ0B2";
  const PASS_AI_SLACK_TEAM_STORAGE_KEY = "zip.passAi.expectedSlackTeamId";
  const PASS_AI_SLACK_LOGIN_URL = PASS_AI_SLACK_WORKSPACE_ORIGIN + "/signin";
  const PASS_AI_SLACK_CHANNEL_STORAGE_KEY = "zip.passAi.singularityChannelId";
  const PASS_AI_SLACK_CHANNEL_DEFAULT = "C08SX9ZR891";
  const PASS_AI_SINGULARITY_MENTION_STORAGE_KEY = "zip.passAi.singularityMention";
  const PASS_AI_SINGULARITY_MENTION_DEFAULT = "@Singularity";
  const PASS_AI_SINGULARITY_NAME_PATTERN = "singularity";
  const PASS_AI_POLL_INTERVAL_MS = 1500;
  const PASS_AI_POLL_MAX_ATTEMPTS = 48;
  const PASS_AI_INACTIVITY_FINAL_MS = 6000;
  const PASS_AI_MIN_SINGULARITY_REPLIES = 2;
  const PASS_AI_SLACK_AUTH_POLL_INTERVAL_MS = 2500;
  const PASS_AI_SLACK_AUTH_POLL_MAX_ATTEMPTS = 36;
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
    manualZipSignout: false,
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
    slackLoginWindowId: null,
    slackAuthTabBootstrapAt: 0,
    passAiLoading: false,
    passAiTicketId: null,
    passAiActiveClientId: "",
    passAiSlackReady: false,
    passAiSlackAuthPolling: false,
    passAiSlackUserId: "",
    passAiSlackTeamId: getExpectedPassAiSlackTeamId() || PASS_AI_SLACK_TEAM_ID,
    passAiSlackAuthError: "",
    passAiSlackAuthBootstrapCount: 0,
    passAiLastThreadContext: null,
    passAiDeleteInFlight: false,
    ticketEmailCopyBusyById: Object.create(null),
    ticketEmailUserEmailCacheById: Object.create(null),
    ticketEmailRequesterByTicketId: Object.create(null),
    ticketEmailCopyCacheByTicketId: Object.create(null),
    themeId: "s2-dark-blue",
    themeOptions: [],
    themeFlyoutStop: ""
  };

  let authCheckIntervalId = null;
  let authCheckInFlight = false;
  let passAiSlackAuthPollTimerId = null;
  let passAiSlackAuthPollAttempt = 0;
  let toastHideTimerId = null;
  const AUTH_CHECK_INTERVAL_MS = 5000;
  const VIEW_COUNT_CACHE_KEY = "zip.filter.viewCounts.v1";
  const ORG_COUNT_CACHE_KEY = "zip.filter.orgCounts.v1";
  const GROUP_COUNT_CACHE_KEY = "zip.filter.groupCounts.v1";
  const ZENDESK_TAB_RETRY_MAX_ATTEMPTS = 6;
  const ZENDESK_TAB_RETRY_BASE_DELAY_MS = 150;
  const SLACK_TAB_RETRY_MAX_ATTEMPTS = 6;
  const SLACK_TAB_RETRY_BASE_DELAY_MS = 150;
  const FILTER_CATALOG_RETRY_ATTEMPTS = 3;
  const FILTER_CATALOG_RETRY_BASE_DELAY_MS = 500;
  const TICKET_EMAIL_COPY_CACHE_TTL_MS = 5 * 60 * 1000;
  const STATUS_FILTER_ALL_VALUE = "all";
  const STATUS_FILTER_ALL_LABEL = "all";
  const PREFERRED_STATUS_ORDER = ["new", "open", "pending", "hold", "solved", "closed"];
  const ZD_API_VISIBILITY_STORAGE_KEY = "zip.ui.showZdApiContainers.v1";
  const CONTEXT_MENU_ZD_API_SHOW_LABEL = "Show ZD API";
  const CONTEXT_MENU_ZD_API_HIDE_LABEL = "Hide ZD API";
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

  const FALLBACK_THEME_OPTIONS = buildThemeOptions();
  const FALLBACK_THEME_OPTION_BY_ID = Object.fromEntries(FALLBACK_THEME_OPTIONS.map((option) => [option.id, option]));
  const DEFAULT_THEME_ID = "s2-dark-blue";
  const SPECTRUM_COLORSTOP_CLASS_BY_NAME = {
    light: "spectrum--light",
    dark: "spectrum--dark"
  };
  const THEME_TONE_BY_COLOR_STOP = {
    dark: { primary: "800", hover: "700", down: "600", link: "900", focus: "800" },
    light: { primary: "900", hover: "1000", down: "1000", link: "900", focus: "800" }
  };
  const ACCENT_PALETTE_RGB = {
    blue: {
      light: { "500": "142, 185, 252", "600": "114, 158, 253", "700": "93, 137, 255", "800": "75, 117, 255", "900": "59, 99, 251", "1000": "39, 77, 234", "1100": "29, 62, 207" },
      dark: { "500": "26, 58, 195", "600": "37, 73, 229", "700": "52, 91, 248", "800": "64, 105, 253", "900": "86, 129, 255", "1000": "105, 149, 254", "1100": "124, 169, 252" }
    },
    indigo: {
      light: { "500": "167, 178, 255", "600": "145, 151, 254", "700": "132, 128, 254", "800": "122, 106, 253", "900": "113, 85, 250", "1000": "99, 56, 238", "1100": "84, 36, 219" },
      dark: { "500": "79, 30, 209", "600": "95, 52, 235", "700": "109, 75, 248", "800": "116, 91, 252", "900": "128, 119, 254", "1000": "139, 141, 254", "1100": "153, 161, 255" }
    },
    purple: {
      light: { "500": "208, 167, 243", "600": "191, 138, 238", "700": "178, 114, 235", "800": "166, 92, 231", "900": "154, 71, 226", "1000": "134, 40, 217", "1100": "115, 13, 204" },
      dark: { "500": "107, 6, 195", "600": "130, 34, 215", "700": "148, 62, 224", "800": "157, 78, 228", "900": "173, 105, 233", "1000": "186, 127, 237", "1100": "197, 149, 240" }
    },
    fuchsia: {
      light: { "500": "243, 147, 255", "600": "236, 105, 255", "700": "223, 77, 245", "800": "200, 68, 220", "900": "181, 57, 200", "1000": "156, 40, 175", "1100": "135, 27, 154" },
      dark: { "500": "127, 23, 146", "600": "151, 38, 170", "700": "173, 51, 192", "800": "186, 60, 206", "900": "213, 73, 235", "1000": "232, 91, 253", "1100": "240, 122, 255" }
    },
    magenta: {
      light: { "500": "255, 152, 187", "600": "255, 112, 159", "700": "255, 72, 133", "800": "240, 45, 110", "900": "217, 35, 97", "1000": "186, 22, 80", "1100": "163, 5, 62" },
      dark: { "500": "152, 7, 60", "600": "181, 19, 76", "700": "207, 31, 92", "800": "224, 38, 101", "900": "255, 51, 119", "1000": "255, 96, 149", "1100": "255, 128, 171" }
    },
    pink: {
      light: { "500": "255, 148, 219", "600": "255, 103, 204", "700": "242, 76, 184", "800": "228, 52, 163", "900": "206, 42, 146", "1000": "176, 31, 123", "1100": "152, 22, 104" },
      dark: { "500": "143, 18, 97", "600": "171, 29, 119", "700": "196, 39, 138", "800": "213, 45, 151", "900": "236, 67, 175", "1000": "251, 90, 196", "1100": "255, 122, 210" }
    },
    red: {
      light: { "500": "255, 157, 145", "600": "255, 118, 101", "700": "255, 81, 61", "800": "240, 56, 35", "900": "215, 50, 32", "1000": "183, 40, 24", "1100": "156, 33, 19" },
      dark: { "500": "147, 31, 17", "600": "177, 38, 23", "700": "205, 46, 29", "800": "223, 52, 34", "900": "252, 67, 46", "1000": "255, 103, 86", "1100": "255, 134, 120" }
    },
    orange: {
      light: { "500": "255, 162, 19", "600": "252, 125, 0", "700": "232, 106, 0", "800": "212, 91, 0", "900": "194, 78, 0", "1000": "167, 62, 0", "1100": "144, 51, 0" },
      dark: { "500": "135, 47, 0", "600": "162, 59, 0", "700": "185, 73, 0", "800": "199, 82, 0", "900": "224, 100, 0", "1000": "243, 117, 0", "1100": "255, 137, 0" }
    },
    yellow: {
      light: { "500": "230, 175, 0", "600": "210, 149, 0", "700": "193, 131, 0", "800": "175, 116, 0", "900": "158, 102, 0", "1000": "134, 85, 0", "1100": "114, 72, 0" },
      dark: { "500": "107, 67, 0", "600": "130, 82, 0", "700": "151, 97, 0", "800": "164, 106, 0", "900": "186, 124, 0", "1000": "203, 141, 0", "1100": "218, 159, 0" }
    },
    chartreuse: {
      light: { "500": "163, 196, 0", "600": "143, 172, 0", "700": "128, 153, 0", "800": "114, 137, 0", "900": "102, 122, 0", "1000": "86, 103, 0", "1100": "73, 87, 0" },
      dark: { "500": "68, 82, 0", "600": "83, 100, 0", "700": "97, 116, 0", "800": "106, 127, 0", "900": "122, 147, 0", "1000": "136, 164, 0", "1100": "151, 181, 0" }
    },
    celery: {
      light: { "500": "110, 206, 42", "600": "93, 180, 31", "700": "82, 161, 25", "800": "72, 144, 20", "900": "64, 129, 17", "1000": "52, 109, 12", "1100": "44, 92, 9" },
      dark: { "500": "41, 86, 8", "600": "50, 105, 11", "700": "60, 122, 15", "800": "66, 134, 18", "900": "78, 154, 23", "1000": "88, 172, 28", "1100": "100, 190, 35" }
    },
    green: {
      light: { "500": "43, 209, 125", "600": "18, 184, 103", "700": "11, 164, 93", "800": "7, 147, 85", "900": "5, 131, 78", "1000": "3, 110, 69", "1100": "2, 93, 60" },
      dark: { "500": "2, 87, 58", "600": "3, 106, 67", "700": "4, 124, 75", "800": "6, 136, 80", "900": "9, 157, 89", "1000": "14, 175, 98", "1100": "24, 193, 110" }
    },
    seafoam: {
      light: { "500": "16, 207, 169", "600": "13, 181, 149", "700": "11, 162, 134", "800": "9, 144, 120", "900": "7, 129, 109", "1000": "5, 108, 92", "1100": "3, 92, 80" },
      dark: { "500": "2, 86, 75", "600": "4, 105, 89", "700": "6, 122, 103", "800": "8, 134, 112", "900": "10, 154, 128", "1000": "12, 173, 142", "1100": "14, 190, 156" }
    },
    cyan: {
      light: { "500": "92, 192, 255", "600": "48, 167, 254", "700": "29, 149, 231", "800": "18, 134, 205", "900": "11, 120, 179", "1000": "4, 102, 145", "1100": "0, 87, 121" },
      dark: { "500": "0, 82, 113", "600": "3, 99, 140", "700": "8, 115, 168", "800": "13, 125, 186", "900": "24, 142, 220", "1000": "38, 159, 244", "1100": "63, 177, 255" }
    },
    turquoise: {
      light: { "500": "39, 202, 216", "600": "15, 177, 192", "700": "12, 158, 171", "800": "10, 141, 153", "900": "8, 126, 137", "1000": "5, 107, 116", "1100": "3, 90, 98" },
      dark: { "500": "3, 84, 92", "600": "5, 103, 112", "700": "7, 120, 131", "800": "9, 131, 142", "900": "11, 151, 164", "1000": "13, 168, 182", "1100": "16, 186, 202" }
    },
    cinnamon: {
      light: { "500": "229, 170, 136", "600": "212, 145, 108", "700": "198, 126, 88", "800": "184, 109, 70", "900": "170, 94, 56", "1000": "147, 77, 43", "1100": "128, 62, 32" },
      dark: { "500": "122, 57, 28", "600": "143, 74, 40", "700": "163, 88, 52", "800": "176, 98, 59", "900": "192, 119, 80", "1000": "206, 136, 99", "1100": "220, 154, 118" }
    },
    brown: {
      light: { "500": "214, 177, 123", "600": "190, 155, 104", "700": "171, 138, 90", "800": "154, 123, 77", "900": "139, 109, 66", "1000": "119, 91, 50", "1100": "103, 76, 35" },
      dark: { "500": "98, 71, 30", "600": "115, 88, 47", "700": "132, 104, 61", "800": "143, 114, 69", "900": "163, 132, 84", "1000": "181, 147, 98", "1100": "199, 163, 112" }
    },
    silver: {
      light: { "500": "183, 183, 183", "600": "160, 160, 160", "700": "143, 143, 143", "800": "128, 128, 128", "900": "114, 114, 114", "1000": "96, 96, 96", "1100": "81, 81, 81" },
      dark: { "500": "76, 76, 76", "600": "92, 92, 92", "700": "108, 108, 108", "800": "118, 118, 118", "900": "137, 137, 137", "1000": "152, 152, 152", "1100": "169, 169, 169" }
    },
    gray: {
      light: { "500": "143, 143, 143", "600": "113, 113, 113", "700": "80, 80, 80", "800": "41, 41, 41", "900": "19, 19, 19", "1000": "0, 0, 0" },
      dark: { "500": "109, 109, 109", "600": "138, 138, 138", "700": "175, 175, 175", "800": "219, 219, 219", "900": "242, 242, 242", "1000": "255, 255, 255" }
    }
  };
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
  }

  function stopAuthCheckPolling() {
    if (authCheckIntervalId != null) {
      clearInterval(authCheckIntervalId);
      authCheckIntervalId = null;
    }
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
    signout({ manual: false });
    setStatus("User is logged out of Zendesk. Please sign in.", true);
  }

  async function runAuthCheckTick() {
    if (authCheckInFlight) return;
    if (!state.user && state.manualZipSignout) return;
    authCheckInFlight = true;
    try {
      const me = await sendToZendeskTab({ action: "getMe" });
      const hasUser = hasZendeskSessionUser(me);
      if (state.user) {
        if (shouldTreatMeResponseAsLoggedOut(me)) {
          handleZendeskLoggedOut();
        }
        return;
      }
      if (!state.manualZipSignout && hasUser) {
        setStatus("Log-in detected. Loading…", false);
        await refreshAll();
      }
    } catch (err) {
      if (state.user && isSessionErrorMessage(err && err.message)) {
        handleZendeskLoggedOut();
      }
    } finally {
      authCheckInFlight = false;
    }
  }

  function startAuthCheckPolling() {
    stopAuthCheckPolling();
    authCheckIntervalId = setInterval(() => {
      runAuthCheckTick().catch(() => {});
    }, AUTH_CHECK_INTERVAL_MS);
    runAuthCheckTick().catch(() => {});
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
    loginBtn: $("zipLoginBtn"),
    docsMenu: $("zipDocsMenu"),
    signoutBtn: $("zipSignoutBtn"),
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
    contextMenuGetLatest: $("zipContextMenuGetLatest"),
    contextMenuThemeLabel: $("zipContextMenuThemeLabel"),
    contextMenuThemePicker: $("zipContextMenuThemePicker"),
    contextMenuThemeFlyout: $("zipContextMenuThemeFlyout"),
    rawTitle: $("zipRawTitle"),
    rawThead: $("zipRawThead"),
    rawBody: $("zipRawBody"),
    rawDownload: $("zipRawDownload"),
    toast: $("zipToast"),
    slackLoginBtn: $("zipSlackLoginBtn"),
    passAiCtaZone: $("zipPassAiCtaZone"),
    passAiSubmitWrap: $("zipPassAiSubmitWrap"),
    passAiSubmitHint: $("zipPassAiSubmitHint"),
    askPassAiBtn: $("zipAskPassAiBtn"),
    passAiSlackAuthStatus: $("zipPassAiSlackAuthStatus"),
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

  function getSlackTabId() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "ZIP_GET_SLACK_TAB" }, (r) => resolve(r?.tabId ?? null));
    });
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

  function openSlackLoginDialog(url) {
    const safeUrl = String(url || "").trim();
    if (!safeUrl) {
      return Promise.reject(new Error("Slack login URL is missing."));
    }
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "ZIP_OPEN_SLACK_LOGIN", url: safeUrl }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || "Unable to open Slack login dialog."));
          return;
        }
        if (response && response.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response || { windowId: null, tabId: null });
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

  function closeSlackLoginDialog(windowId) {
    const numericId = Number(windowId);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return Promise.resolve({ ok: false, error: "Invalid Slack login window id." });
    }
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "ZIP_CLOSE_WINDOW", windowId: numericId }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message || "Unable to close Slack login dialog." });
          return;
        }
        resolve(response || { ok: true });
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
    els.contextMenuToggleZdApi.textContent = getZdApiToggleLabel(state.showZdApiContainers);
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
    return ACCENT_PALETTE_RGB[normalized] ? normalized : "blue";
  }

  function getAccentFamilyLabel(accentFamily) {
    const key = normalizeAccentFamily(accentFamily);
    const match = THEME_ACCENT_FAMILIES.find((accent) => accent.id === key);
    return match ? match.label : "Blue";
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
    const paletteByFamily = ACCENT_PALETTE_RGB[familyKey] || ACCENT_PALETTE_RGB.blue;
    const paletteBySet = (paletteByFamily && paletteByFamily[setKey]) || (paletteByFamily && paletteByFamily.dark) || {};
    const requested = String(toneKey || "").trim();
    if (requested && paletteBySet[requested]) return paletteBySet[requested];
    if (paletteBySet["900"]) return paletteBySet["900"];
    const blueDark = ACCENT_PALETTE_RGB.blue && ACCENT_PALETTE_RGB.blue.dark;
    return (blueDark && (blueDark["900"] || blueDark["800"])) || "64, 105, 253";
  }

  function parseRgbTriplet(value) {
    const parts = String(value || "").split(",").map((part) => Number.parseInt(String(part || "").trim(), 10));
    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
      return [64, 105, 253];
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
    const swatchRgb = getThemeSwatchRgb(option);
    const paletteSet = normalizePaletteSet(option.paletteSet);
    targetEl.style.setProperty("--zip-theme-swatch", "rgb(" + swatchRgb + ")");
    if (paletteSet !== "dark" || option.accentFamily === "silver" || option.accentFamily === "gray") {
      targetEl.style.setProperty("--zip-theme-swatch-border", "var(--border-default)");
      targetEl.style.setProperty("--zip-theme-swatch-ring", "var(--zip-theme-swatch-ring-muted)");
      return;
    }
    targetEl.style.removeProperty("--zip-theme-swatch-border");
    targetEl.style.removeProperty("--zip-theme-swatch-ring");
  }

  function updateThemeFlyoutParentState() {
    if (!els.contextMenuThemePicker) return;
    const flyoutVisible = !!(els.contextMenuThemeFlyout && !els.contextMenuThemeFlyout.classList.contains("hidden"));
    const openStop = flyoutVisible ? normalizeThemeColorStop(state.themeFlyoutStop) : "";
    const parentButtons = els.contextMenuThemePicker.querySelectorAll(".zip-context-menu-theme-parent[data-theme-stop]");
    parentButtons.forEach((parentBtn) => {
      const stopId = normalizeThemeColorStop(parentBtn.getAttribute("data-theme-stop"));
      const isOpen = !!openStop && stopId === openStop;
      parentBtn.classList.toggle("is-open", isOpen);
      parentBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      parentBtn.title = (isOpen ? "Hide" : "Show") + " Spectrum 2 " + getThemeColorStopMeta(stopId).label + " colors";
    });
  }

  function hideThemeFlyout(options) {
    const keepStop = !!(options && options.keepStop);
    if (!keepStop) state.themeFlyoutStop = "";
    if (els.contextMenuThemeFlyout) {
      els.contextMenuThemeFlyout.classList.add("hidden");
      els.contextMenuThemeFlyout.innerHTML = "";
      els.contextMenuThemeFlyout.removeAttribute("data-theme-stop");
    }
    updateThemeFlyoutParentState();
  }

  function positionThemeFlyout(anchorEl) {
    if (!anchorEl || !els.contextMenuThemeFlyout || els.contextMenuThemeFlyout.classList.contains("hidden")) return;
    const flyout = els.contextMenuThemeFlyout;
    const pad = 6;
    const gap = 8;
    const maxWidth = Math.max(160, window.innerWidth - (pad * 2));
    const maxHeight = Math.max(160, window.innerHeight - (pad * 2));
    flyout.style.maxWidth = Math.min(320, maxWidth) + "px";
    flyout.style.maxHeight = Math.min(520, maxHeight) + "px";
    flyout.style.left = pad + "px";
    flyout.style.top = pad + "px";

    const anchorRect = anchorEl.getBoundingClientRect();
    const flyoutRect = flyout.getBoundingClientRect();
    const spaceRight = window.innerWidth - anchorRect.right - gap - pad;
    const spaceLeft = anchorRect.left - gap - pad;

    let left = (spaceRight >= flyoutRect.width || spaceRight >= spaceLeft)
      ? (anchorRect.right + gap)
      : (anchorRect.left - gap - flyoutRect.width);
    let top = anchorRect.top;

    if (top + flyoutRect.height + pad > window.innerHeight) {
      top = window.innerHeight - flyoutRect.height - pad;
    }
    if (top < pad) top = pad;
    if (left + flyoutRect.width + pad > window.innerWidth) {
      left = window.innerWidth - flyoutRect.width - pad;
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
    closeBtn.textContent = "x";
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

    THEME_ACCENT_FAMILIES.forEach((accent) => {
      const accentTheme = getThemeOptionByStopAndAccent(stopId, accent.id, options);
      const accentThemeId = normalizeThemeId(accentTheme.id);
      const swatchTheme = {
        id: accentThemeId,
        label: accentTheme.label,
        spectrumColorStop: stopMeta.spectrumColorStop,
        themeColorStop: stopId,
        paletteSet: stopMeta.paletteSet,
        accentFamily: accent.id
      };
      const colorBtn = document.createElement("button");
      colorBtn.type = "button";
      colorBtn.className = "zip-context-menu-theme-color";
      colorBtn.setAttribute("role", "menuitemradio");
      colorBtn.setAttribute("data-theme-id", accentThemeId);
      const isSelected = accentThemeId === activeThemeId;
      colorBtn.classList.toggle("is-selected", isSelected);
      colorBtn.setAttribute("aria-checked", isSelected ? "true" : "false");
      applyThemeSwatchStyles(colorBtn, swatchTheme);
      colorBtn.innerHTML = ""
        + "<span class=\"zip-context-menu-theme-dot\" aria-hidden=\"true\"></span>"
        + "<span class=\"zip-context-menu-theme-color-name\">" + escapeHtml(accent.label) + "</span>"
        + "<span class=\"zip-context-menu-theme-color-state\" aria-hidden=\"true\">Active</span>";
      colorBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const requestedThemeId = normalizeThemeId(accentThemeId);
        hideContextMenu();
        setThemeViaBackground(requestedThemeId).catch((err) => {
          setStatus("Theme update failed: " + (err && err.message ? err.message : "Unknown error"), true);
        });
      });
      list.appendChild(colorBtn);
    });

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
    if (!stopId || !els.contextMenuThemePicker) {
      hideThemeFlyout();
      return;
    }
    const anchor = els.contextMenuThemePicker.querySelector(".zip-context-menu-theme-parent[data-theme-stop=\"" + stopId + "\"]");
    if (!anchor) {
      hideThemeFlyout();
      return;
    }
    positionThemeFlyout(anchor);
  }

  function renderContextMenuThemePicker() {
    if (!els.contextMenuThemePicker) return;
    const options = getThemeOptions();
    const activeTheme = getThemeOptionById(state.themeId, options);
    const activeStop = normalizeThemeColorStop(activeTheme.themeColorStop);
    const activeAccent = normalizeAccentFamily(activeTheme.accentFamily);
    const openStopRaw = String(state.themeFlyoutStop || "").trim().toLowerCase();
    const openStop = openStopRaw ? normalizeThemeColorStop(openStopRaw) : "";
    let anchorForOpenStop = null;

    els.contextMenuThemePicker.innerHTML = "";
    THEME_COLOR_STOPS.forEach((stop) => {
      const stopId = normalizeThemeColorStop(stop.id);
      const group = document.createElement("div");
      group.className = "zip-context-menu-theme-group";
      group.setAttribute("data-theme-stop", stopId);

      const row = document.createElement("div");
      row.className = "zip-context-menu-theme-row";

      const parentTheme = getThemeOptionByStopAndAccent(stopId, activeAccent, options);
      const parentBtn = document.createElement("button");
      parentBtn.type = "button";
      parentBtn.className = "zip-context-menu-theme-parent";
      parentBtn.setAttribute("role", "menuitem");
      parentBtn.setAttribute("data-theme-stop", stopId);
      parentBtn.setAttribute("aria-haspopup", "true");
      parentBtn.setAttribute("aria-expanded", openStop === stopId ? "true" : "false");
      const parentSelected = activeStop === stopId;
      if (parentSelected) parentBtn.classList.add("is-selected");
      parentBtn.setAttribute("aria-current", parentSelected ? "true" : "false");
      if (openStop === stopId) parentBtn.classList.add("is-open");
      applyThemeSwatchStyles(parentBtn, parentTheme);
      parentBtn.innerHTML = ""
        + "<span class=\"zip-context-menu-theme-dot\" aria-hidden=\"true\"></span>"
        + "<span class=\"zip-context-menu-theme-parent-title\">" + escapeHtml(stop.label) + "</span>"
        + "<span class=\"zip-context-menu-theme-parent-state\" aria-hidden=\"true\">"
        + (parentSelected ? "Active" : "")
        + "</span>";
      const openThemeStopFlyout = (event) => {
        if (!event) return;
        if (event.type === "click" && event.button !== 0) return;
        if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        toggleThemeFlyout(stopId, parentBtn);
      };
      parentBtn.addEventListener("click", openThemeStopFlyout);
      parentBtn.addEventListener("keydown", openThemeStopFlyout);

      if (openStop === stopId) anchorForOpenStop = parentBtn;

      row.appendChild(parentBtn);
      group.appendChild(row);
      els.contextMenuThemePicker.appendChild(group);
    });

    if (openStop && anchorForOpenStop) {
      renderThemeFlyout(openStop, anchorForOpenStop);
      return;
    }
    hideThemeFlyout();
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
    if (els.contextMenuThemeLabel) {
      const activeThemeLabel = getThemeColorStopMeta(activeTheme.themeColorStop).label || "Dark";
      const activeColorLabel = getAccentFamilyLabel(activeTheme.accentFamily);
      els.contextMenuThemeLabel.textContent = "Appearance : " + activeThemeLabel + " x " + activeColorLabel;
    }
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
    } catch (err) {
      setStatus("Context menu action failed: " + (err && err.message ? err.message : "Unknown error"), true);
    }
  }

  function sendToZendeskTab(inner) {
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
        const activeTabId = await getActiveTabId();
        const candidateIds = [];
        if (state.zendeskTabId != null) candidateIds.push(state.zendeskTabId);
        if (activeTabId != null && !candidateIds.includes(activeTabId)) candidateIds.push(activeTabId);
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
        const slackTabId = await getSlackTabId();
        const candidateIds = [];
        if (state.slackTabId != null) candidateIds.push(state.slackTabId);
        if (slackTabId != null && !candidateIds.includes(slackTabId)) candidateIds.push(slackTabId);
        if (!candidateIds.length) {
          throw new Error("No Slack tab available. Click Sign in with Slack first.");
        }

        for (const candidateId of candidateIds) {
          try {
            const result = await sendOnce(candidateId);
            if (shouldTryNextSlackTabCandidate(result)) {
              lastError = new Error(result.error || "Slack tab is not ready yet.");
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

  function applyGlobalBusyUi() {
    const isLoading = !!(state.busy || state.ticketTableLoading || state.orgSelectLoading || state.viewSelectLoading || state.groupSelectLoading);
    if (els.topAvatarWrap) {
      els.topAvatarWrap.classList.toggle("loading", isLoading);
      els.topAvatarWrap.title = isLoading ? "Loading…" : (els.topAvatarWrap.dataset.idleTitle || "Not logged in");
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
    if (!els.passAiSlackAuthStatus) return;
    els.passAiSlackAuthStatus.textContent = "";
    els.passAiSlackAuthStatus.classList.add("hidden");
    els.passAiSlackAuthStatus.classList.remove("ready");
    els.passAiSlackAuthStatus.classList.remove("error");
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

    if (!els.slackLoginBtn) els.slackLoginBtn = $("zipSlackLoginBtn");
    if (!els.askPassAiBtn) els.askPassAiBtn = $("zipAskPassAiBtn");
    if (!els.passAiSlackAuthStatus) els.passAiSlackAuthStatus = $("zipPassAiSlackAuthStatus");
    if (!els.passAiSubmitHint) els.passAiSubmitHint = $("zipPassAiSubmitHint");
    if (!els.passAiCtaZone) els.passAiCtaZone = $("zipPassAiCtaZone");
    if (!els.passAiSubmitWrap) els.passAiSubmitWrap = $("zipPassAiSubmitWrap");
    if (!els.passAiQuestionLabel) els.passAiQuestionLabel = $("zipPassAiQuestionLabel");
    if (!els.passAiError) els.passAiError = $("zipPassAiError");
    if (!els.passAiAnswerBlock) els.passAiAnswerBlock = $("zipPassAiAnswerBlock");
    if (!els.passAiAnswerPlaceholder) els.passAiAnswerPlaceholder = $("zipPassAiAnswerPlaceholder");
    if (!els.passAiDynamicReplyHost) els.passAiDynamicReplyHost = $("zipPassAiDynamicReplyHost");
    if (!els.passAiInlineStatus) els.passAiInlineStatus = $("zipPassAiInlineStatus");

    if (els.passAiSubmitWrap && els.slackLoginBtn && els.slackLoginBtn.parentElement !== els.passAiSubmitWrap) {
      els.passAiSubmitWrap.appendChild(els.slackLoginBtn);
    }
    if (els.passAiSubmitWrap && els.askPassAiBtn && els.askPassAiBtn.parentElement !== els.passAiSubmitWrap) {
      els.passAiSubmitWrap.appendChild(els.askPassAiBtn);
    }
    if (els.passAiCtaZone && els.passAiSubmitHint && els.passAiSubmitHint.parentElement !== els.passAiCtaZone) {
      els.passAiCtaZone.appendChild(els.passAiSubmitHint);
    }
    if (els.passAiCtaZone && els.passAiSlackAuthStatus && els.passAiSlackAuthStatus.parentElement !== els.passAiCtaZone) {
      els.passAiCtaZone.appendChild(els.passAiSlackAuthStatus);
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

  function updateTicketActionButtons() {
    ensurePassAiActionLayout();

    const hasRows = Array.isArray(state.filteredTickets) && state.filteredTickets.length > 0;
    if (els.exportCsvBtn) els.exportCsvBtn.disabled = !hasRows;
    const selectedTicketId = getSelectedPassAiTicketId();
    const hasSelectedTicket = selectedTicketId != null;
    const passAiActionMode = !hasSelectedTicket
      ? "none"
      : (state.passAiSlackReady ? "slack_ready" : "needs_slack_auth");
    const showPassAiForm = hasSelectedTicket;
    const showAnswerBlock = hasSelectedTicket && hasPassAiRenderedAnswer();
    const showSubmitWrap = hasSelectedTicket;
    const showAskPassAi = passAiActionMode === "slack_ready";
    const showSlackLogin = passAiActionMode === "needs_slack_auth";

    if (!hasSelectedTicket && !state.passAiLoading) {
      state.passAiTicketId = null;
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

    if (els.passAiResultsBox) {
      els.passAiResultsBox.classList.toggle("hidden", !showPassAiForm);
    }
    if (els.passAiAnswerBlock) {
      els.passAiAnswerBlock.classList.toggle("hidden", !showAnswerBlock);
    }

    if (showPassAiForm) {
      setPassAiQuestionLabel(selectedTicketId);
      if (els.passAiQuestion) {
        els.passAiQuestion.classList.remove("hidden");
      }
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
    if (els.slackLoginBtn) {
      els.slackLoginBtn.classList.toggle("hidden", !showSlackLogin);
      els.slackLoginBtn.disabled = !showSlackLogin || state.passAiLoading || state.passAiSlackAuthPolling;
    }
    renderPassAiSlackAuthStatus();
    if (els.passAiInlineStatus) {
      const showInline = hasSelectedTicket && state.passAiLoading;
      els.passAiInlineStatus.classList.toggle("hidden", !showInline);
    }
    updatePassAiAnswerPlaceholder();
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

  function getTicketSourceFilenamePart() {
    if (state.ticketSource === "view" && state.selectedViewId) {
      return "view-" + (sanitizeFilenamePart(getSelectedText(els.viewSelect)) || sanitizeFilenamePart(state.selectedViewId));
    }
    if (state.ticketSource === "org" && state.selectedOrgId) {
      return "org-" + (sanitizeFilenamePart(getSelectedText(els.orgSelect)) || sanitizeFilenamePart(state.selectedOrgId));
    }
    if (state.ticketSource === "groupMember" && state.selectedByGroupValue) {
      const raw = String(state.selectedByGroupValue);
      const prefix = raw.startsWith("g-") ? "group" : "agent";
      return prefix + "-" + (sanitizeFilenamePart(getSelectedText(els.groupMemberSelect)) || sanitizeFilenamePart(raw));
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

  function exportVisibleTicketsToCsv() {
    const rows = state.filteredTickets || [];
    if (!rows.length) {
      setStatus("No tickets are currently visible to export.", false);
      return;
    }
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
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getTicketCsvFilename();
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus("CSV exported. " + rows.length + " rows downloaded.", false);
  }

  const MAX_API_VALUE_RENDER_DEPTH = 10;
  const MAX_INLINE_OBJECT_KEYS = 8;

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

  function createSpectrumHeadCell(label) {
    const th = document.createElement("th");
    th.className = "spectrum-Table-headCell";
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

  function applyRawResultGridSizing(columnCount) {
    const table = getRawResultTableEl();
    if (!table) return;
    const minWidth = getReadableGridMinWidth(columnCount, 960, 180, 7200);
    table.style.minWidth = minWidth + "px";
    table.style.width = "max(100%, " + minWidth + "px)";
  }

  function createNestedScrollFrame(kind) {
    const frame = document.createElement("div");
    frame.className = kind
      ? ("raw-nested-scroll raw-nested-scroll-" + kind)
      : "raw-nested-scroll";
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
    if (currentDepth > MAX_API_VALUE_RENDER_DEPTH) {
      td.appendChild(createScalarValueNode("[Depth limit reached]"));
      return;
    }
    if (isScalarValue(val)) {
      td.appendChild(createScalarValueNode(val));
      return;
    }
    if (Array.isArray(val)) {
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
        const minWidth = getReadableGridMinWidth(cols.length, 760, 170, 6400);
        nest.style.minWidth = minWidth + "px";
        nest.style.width = "max-content";
        const thead = document.createElement("thead");
        thead.className = "spectrum-Table-head";
        const headerTr = createSpectrumTableRow();
        cols.forEach((k) => headerTr.appendChild(createSpectrumHeadCell(k)));
        thead.appendChild(headerTr);
        nest.appendChild(thead);
        const tbody = document.createElement("tbody");
        tbody.className = "spectrum-Table-body";
        val.forEach((row) => {
          const tr = createSpectrumTableRow();
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
        const frame = createNestedScrollFrame("grid");
        frame.appendChild(nest);
        td.appendChild(frame);
        return;
      }
      nest.style.minWidth = "480px";
      nest.style.width = "max-content";
      const thead = document.createElement("thead");
      thead.className = "spectrum-Table-head";
      const headerRow = createSpectrumTableRow();
      const th0 = createSpectrumHeadCell("#");
      const th1 = createSpectrumHeadCell("Value");
      headerRow.appendChild(th0);
      headerRow.appendChild(th1);
      thead.appendChild(headerRow);
      nest.appendChild(thead);
      const tbody = document.createElement("tbody");
      tbody.className = "spectrum-Table-body";
      val.forEach((item, i) => {
        const tr = createSpectrumTableRow();
        const td0 = createSpectrumTableCell();
        td0.textContent = String(i);
        const td1 = createSpectrumTableCell();
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
      const frame = createNestedScrollFrame("list");
      frame.appendChild(nest);
      td.appendChild(frame);
      return;
    }
    if (typeof val === "object") {
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
      const minWidth = getReadableGridMinWidth(2, 560, 220, 1800);
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
      const tbody = document.createElement("tbody");
      tbody.className = "spectrum-Table-body";
      keys.forEach((k) => {
        const tr = createSpectrumTableRow();
        const tdK = createSpectrumTableCell("raw-nested-kv-key-cell");
        const keyLabel = document.createElement("span");
        keyLabel.className = "raw-kv-key-label";
        keyLabel.textContent = k;
        tdK.appendChild(keyLabel);
        const tdV = createSpectrumTableCell("raw-nested-kv-value-cell");
        fillCellWithValue(tdV, val[k], currentDepth + 1);
        tr.appendChild(tdK);
        tr.appendChild(tdV);
        tbody.appendChild(tr);
      });
      nest.appendChild(tbody);
      const frame = createNestedScrollFrame("kv");
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
        applyRawResultGridSizing(cols.length);
        cols.forEach((k) => els.rawThead.appendChild(createSpectrumHeadCell(k)));
        payload.forEach((row) => {
          const tr = createSpectrumTableRow();
          cols.forEach((col) => {
            const td = createSpectrumTableCell();
            fillCellWithValue(td, row && row[col], 0);
            tr.appendChild(td);
          });
          els.rawBody.appendChild(tr);
        });
        return;
      }
      const th = createSpectrumHeadCell("Value");
      els.rawThead.appendChild(th);
      payload.forEach((item) => {
        const tr = createSpectrumTableRow();
        const td = createSpectrumTableCell();
        fillCellWithValue(td, item, 0);
        tr.appendChild(td);
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
      els.topAvatarWrap.title = state.busy ? "Loading…" : idleTitle;
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
    if (state.slackLoginWindowId != null) {
      closeSlackLoginDialog(state.slackLoginWindowId).catch(() => {});
      state.slackLoginWindowId = null;
    }
    state.user = null;
    state.zendeskTabId = null;
    state.slackTabId = null;
    if (state.manualZipSignout) stopAuthCheckPolling();
    else startAuthCheckPolling();
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
    state.passAiTicketId = null;
    state.passAiActiveClientId = "";
    state.passAiSlackReady = false;
    state.passAiSlackUserId = "";
    state.passAiSlackTeamId = getExpectedPassAiSlackTeamId() || PASS_AI_SLACK_TEAM_ID;
    state.passAiSlackAuthError = "";
    state.passAiSlackAuthBootstrapCount = 0;
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
    setStatus("", false);
  }

  function showApp() {
    startAuthCheckPolling();
    document.body.classList.remove("zip-logged-out");
    els.loginScreen.classList.add("hidden");
    els.appScreen.classList.remove("hidden");
    syncContextMenuAuthVisibility();
    refreshPassAiSlackAuth({ silent: true }).catch(() => {});
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

  function normalizePassAiSlackChannelId(value) {
    const channelId = String(value || "").trim().toUpperCase();
    return /^[CGD][A-Z0-9]{8,}$/.test(channelId) ? channelId : "";
  }

  function getExpectedPassAiSlackTeamId() {
    let configured = "";
    try {
      configured = String(window.localStorage.getItem(PASS_AI_SLACK_TEAM_STORAGE_KEY) || "").trim();
    } catch (_) {}
    if (!configured && typeof window !== "undefined") {
      configured = String(
        window.ZIP_PASS_AI_EXPECTED_SLACK_TEAM_ID
        || window.ZIP_PASS_AI_EXPECTED_TEAM_ID
        || window.ZIP_PASS_AI_SLACK_TEAM_ID
        || ""
      ).trim();
    }
    return normalizePassAiSlackTeamId(configured || PASS_AI_SLACK_TEAM_ID);
  }

  function getPassAiWorkspaceTeamIdForUrls() {
    const expected = getExpectedPassAiSlackTeamId();
    if (expected && expected.startsWith("T")) return expected;
    const fallback = normalizePassAiSlackTeamId(PASS_AI_SLACK_TEAM_ID);
    return fallback && fallback.startsWith("T") ? fallback : "";
  }

  function buildPassAiSlackWorkspaceLandingUrl() {
    const channelId = getPassAiSingularityChannelId() || PASS_AI_SLACK_CHANNEL_DEFAULT;
    const workspaceTeamId = getPassAiWorkspaceTeamIdForUrls();
    if (workspaceTeamId && channelId) {
      return PASS_AI_SLACK_WORKSPACE_ORIGIN + "/client/" + encodeURIComponent(workspaceTeamId) + "/" + encodeURIComponent(channelId);
    }
    if (channelId) {
      return PASS_AI_SLACK_WORKSPACE_ORIGIN + "/archives/" + encodeURIComponent(channelId);
    }
    return PASS_AI_SLACK_WORKSPACE_ORIGIN + "/";
  }

  function buildPassAiSlackTeamMismatchError(actualTeamId, actualEnterpriseId) {
    const expectedTeamId = getExpectedPassAiSlackTeamId();
    const actual = normalizePassAiSlackTeamId(actualTeamId);
    const enterprise = normalizePassAiSlackTeamId(actualEnterpriseId);
    if (!expectedTeamId) {
      return "Slack workspace validation is not configured.";
    }
    if (!actual && !enterprise) {
      return "Slack workspace could not be verified. Expected workspace/team " + expectedTeamId + ".";
    }
    if (actual && enterprise) {
      return "Slack workspace mismatch. Connected team " + actual + " (enterprise " + enterprise + "), expected team " + expectedTeamId + ".";
    }
    if (actual) {
      return "Slack workspace mismatch. Connected team " + actual + ", expected team " + expectedTeamId + ".";
    }
    return "Slack workspace mismatch. Connected enterprise " + enterprise + ", expected team " + expectedTeamId + ".";
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
    updateTicketActionButtons();
  }

  function stopPassAiSlackAuthPolling() {
    if (passAiSlackAuthPollTimerId != null) {
      window.clearTimeout(passAiSlackAuthPollTimerId);
      passAiSlackAuthPollTimerId = null;
    }
    passAiSlackAuthPollAttempt = 0;
    state.passAiSlackAuthBootstrapCount = 0;
    if (state.passAiSlackAuthPolling) {
      state.passAiSlackAuthPolling = false;
      updateTicketActionButtons();
    }
  }

  function setPassAiSlackAuthState(nextState) {
    const ready = !!(nextState && nextState.ready);
    const expectedTeamId = getExpectedPassAiSlackTeamId();
    const reportedTeamId = normalizePassAiSlackTeamId(nextState && nextState.teamId);
    const reportedEnterpriseId = normalizePassAiSlackTeamId(nextState && nextState.enterpriseId);
    const hasExpectedTeam = !!expectedTeamId;
    const hasObservedTeam = !!(reportedTeamId || reportedEnterpriseId);
    const teamMatchesExpected = !hasExpectedTeam
      || !hasObservedTeam
      || reportedTeamId === expectedTeamId
      || reportedEnterpriseId === expectedTeamId;
    const teamMismatch = !!(ready && !teamMatchesExpected);

    state.passAiSlackReady = ready && !teamMismatch;
    state.passAiSlackUserId = state.passAiSlackReady ? String((nextState && nextState.userId) || "").trim() : "";
    state.passAiSlackTeamId = reportedEnterpriseId || reportedTeamId || expectedTeamId || "";
    if (state.passAiSlackReady) {
      state.passAiSlackAuthError = "";
    } else if (teamMismatch) {
      state.passAiSlackAuthError = buildPassAiSlackTeamMismatchError(reportedTeamId, reportedEnterpriseId);
    } else {
      state.passAiSlackAuthError = String((nextState && nextState.error) || "").trim();
    }
    updateTicketActionButtons();
  }

  function shouldBootstrapSlackAuthTab(errorMessage) {
    const message = String(errorMessage || "").trim().toLowerCase();
    if (!message) return false;
    return (
      message.includes("no slack tab available")
      || message.includes("unable to reach slack tab")
      || message.includes("could not establish connection")
      || message.includes("receiving end does not exist")
      || message.includes("extension context invalidated")
      || message.includes("not a slack tab")
    );
  }

  async function refreshPassAiSlackAuth(options) {
    const silent = !!(options && options.silent);
    const allowTabBootstrap = !(options && options.allowTabBootstrap === false);
    const expectedTeamId = getExpectedPassAiSlackTeamId();
    const requestSlackAuthTest = async () => {
      const response = await sendToSlackTab({
        action: "slackAuthTest",
        workspaceOrigin: PASS_AI_SLACK_WORKSPACE_ORIGIN,
        expectedTeamId
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
      setPassAiSlackAuthState({
        ready: true,
        userId: response.user_id || response.userId || "",
        teamId: response.team_id || response.teamId || "",
        enterpriseId: response.enterprise_id || response.enterpriseId || ""
      });
      if (!state.passAiSlackReady) {
        const message = state.passAiSlackAuthError || "Slack workspace mismatch.";
        if (!silent) setStatus(message, true);
        return false;
      }
      if (!silent) setStatus("Slack connected for PASS AI.", false);
      return true;
    } catch (tabErr) {
      let tabMessage = normalizePassAiCommentBody(tabErr && tabErr.message);
      const nowMs = Date.now();
      const canBootstrapTab = allowTabBootstrap
        && shouldBootstrapSlackAuthTab(tabMessage)
        && Number(state.passAiSlackAuthBootstrapCount || 0) < 1
        && (nowMs - Number(state.slackAuthTabBootstrapAt || 0) > 1000);

      if (canBootstrapTab) {
        state.slackAuthTabBootstrapAt = nowMs;
        state.passAiSlackAuthBootstrapCount = Number(state.passAiSlackAuthBootstrapCount || 0) + 1;
        try {
          const existingSlackTabId = await getSlackTabId();
          if (existingSlackTabId) {
            state.slackTabId = existingSlackTabId;
          } else {
            const opened = await openSlackWorkspaceTab(buildPassAiSlackWorkspaceLandingUrl(), { active: false });
            const openedTabId = Number(opened && opened.tabId);
            if (Number.isFinite(openedTabId) && openedTabId > 0) {
              state.slackTabId = openedTabId;
            }
          }
          await wait(900);
          const retry = await requestSlackAuthTest();
          setPassAiSlackAuthState({
            ready: true,
            userId: retry.user_id || retry.userId || "",
            teamId: retry.team_id || retry.teamId || "",
            enterpriseId: retry.enterprise_id || retry.enterpriseId || ""
          });
          if (!state.passAiSlackReady) {
            const message = state.passAiSlackAuthError || "Slack workspace mismatch.";
            if (!silent) setStatus(message, true);
            return false;
          }
          if (!silent) setStatus("Slack connected for PASS AI.", false);
          return true;
        } catch (retryErr) {
          const retryMessage = normalizePassAiCommentBody(retryErr && retryErr.message);
          if (retryMessage) tabMessage = retryMessage;
        }
      }

      let oauthMessage = "";
      try {
        const oauthStatus = await sendBackgroundRequest("ZIP_SLACK_OAUTH_STATUS", {
          expectedTeamId
        });
        if (oauthStatus && oauthStatus.ok === true && oauthStatus.ready) {
          oauthMessage = "Slack OAuth is ready, but Slack web is not signed in on an open Slack tab.";
        } else {
          oauthMessage = normalizePassAiCommentBody(oauthStatus && (oauthStatus.error || oauthStatus.message));
        }
      } catch (_) {}

      const message = tabMessage || oauthMessage || "Slack sign-in is required.";
      setPassAiSlackAuthState({ ready: false, error: message });
      if (!silent) {
        setStatus("Slack sign-in required. Click Sign in with Slack.", true);
      }
      return false;
    }
  }

  function startPassAiSlackAuthPolling() {
    stopPassAiSlackAuthPolling();
    state.passAiSlackAuthPolling = true;
    passAiSlackAuthPollAttempt = 0;
    updateTicketActionButtons();

    const poll = () => {
      passAiSlackAuthPollAttempt += 1;
      refreshPassAiSlackAuth({ silent: true })
        .then((ready) => {
          if (ready) {
            stopPassAiSlackAuthPolling();
            if (state.slackLoginWindowId != null) {
              const windowId = state.slackLoginWindowId;
              state.slackLoginWindowId = null;
              closeSlackLoginDialog(windowId).catch(() => {});
            }
            setStatus("Slack sign-in detected. AI? is now enabled.", false);
            return;
          }
          if (passAiSlackAuthPollAttempt >= PASS_AI_SLACK_AUTH_POLL_MAX_ATTEMPTS) {
            stopPassAiSlackAuthPolling();
            setStatus("Slack sign-in not detected yet. Retry Sign in with Slack.", true);
            return;
          }
          passAiSlackAuthPollTimerId = window.setTimeout(poll, PASS_AI_SLACK_AUTH_POLL_INTERVAL_MS);
        })
        .catch(() => {
          if (passAiSlackAuthPollAttempt >= PASS_AI_SLACK_AUTH_POLL_MAX_ATTEMPTS) {
            stopPassAiSlackAuthPolling();
            setStatus("Slack sign-in not detected yet. Retry Sign in with Slack.", true);
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
    state.slackAuthTabBootstrapAt = 0;
    state.passAiSlackAuthBootstrapCount = 0;
    updateTicketActionButtons();
    setStatus("Opening Sign in with Slack…", false);
    try {
      if (state.slackLoginWindowId != null) {
        const windowId = state.slackLoginWindowId;
        state.slackLoginWindowId = null;
        closeSlackLoginDialog(windowId).catch(() => {});
      }

      const loginUrl = buildPassAiSlackLoginUrl();
      const opened = await openSlackLoginDialog(loginUrl);
      const openedWindowId = Number(opened && opened.windowId);
      state.slackLoginWindowId = Number.isFinite(openedWindowId) && openedWindowId > 0 ? openedWindowId : null;
      const openedTabId = Number(opened && opened.tabId);
      if (Number.isFinite(openedTabId) && openedTabId > 0) {
        state.slackTabId = openedTabId;
      }

      const readyNow = await refreshPassAiSlackAuth({ silent: true });
      if (readyNow) {
        if (state.slackLoginWindowId != null) {
          const windowId = state.slackLoginWindowId;
          state.slackLoginWindowId = null;
          closeSlackLoginDialog(windowId).catch(() => {});
        }
        setStatus("Slack connected for PASS AI.", false);
        return;
      }

      startPassAiSlackAuthPolling();
      setStatus("Complete Slack sign-in in the popup window.", false);
    } catch (err) {
      const message = normalizePassAiCommentBody(err && err.message) || "Slack sign-in failed.";
      setPassAiSlackAuthState({ ready: false, error: message });
      setStatus("Slack sign-in failed: " + message, true);
      state.passAiSlackAuthPolling = false;
      updateTicketActionButtons();
    }
  }

  async function ensurePassAiSlackSession() {
    if (state.passAiSlackReady) return true;
    const ready = await refreshPassAiSlackAuth({ silent: true });
    if (!ready) {
      throw new Error("Slack sign-in is required. Click Sign in with Slack and complete login in Slack web.");
    }
    return true;
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
    if (triggerButton) triggerButton.disabled = true;

    try {
      const response = await sendToSlackTab({
        action: "slackDeleteSingularityThread",
        workspaceOrigin: context.workspaceOrigin || PASS_AI_SLACK_WORKSPACE_ORIGIN,
        channelId: context.channelId,
        parentTs: context.parentTs,
        limit: 200
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
    try {
      const configured = normalizePassAiSlackChannelId(window.localStorage.getItem(PASS_AI_SLACK_CHANNEL_STORAGE_KEY) || "");
      if (configured && configured !== locked) {
        window.localStorage.setItem(PASS_AI_SLACK_CHANNEL_STORAGE_KEY, locked);
      }
    } catch (_) {}
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
    try {
      configured = String(window.localStorage.getItem(PASS_AI_SINGULARITY_MENTION_STORAGE_KEY) || "").trim();
    } catch (_) {}
    if (!configured && typeof window !== "undefined") {
      configured = String(window.ZIP_PASS_AI_SINGULARITY_MENTION || "").trim();
    }
    const normalized = canonicalize(configured || PASS_AI_SINGULARITY_MENTION_DEFAULT);
    try {
      if (configured && configured !== normalized) {
        window.localStorage.setItem(PASS_AI_SINGULARITY_MENTION_STORAGE_KEY, normalized);
      }
    } catch (_) {}
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
        + "expectedTeam: " + String(diagnostics.expectedTeamId || "") + "\n"
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
    const expectedTeamId = getExpectedPassAiSlackTeamId();
    if (!channelId) throw new Error("Singularity channel ID is not configured.");
    const mention = getPassAiSingularityMention();
    const messageText = (mention + " " + question).trim();

    appendPassAiDebugLine(debugLines, "ticketId=" + ticketId);
    appendPassAiDebugLine(debugLines, "frontendClientId=" + frontendClientId);
    appendPassAiDebugLine(debugLines, "serviceId=" + getPassAiServiceId(ticketContext && ticketContext.product));
    appendPassAiDebugLine(debugLines, "workspaceOrigin=" + PASS_AI_SLACK_WORKSPACE_ORIGIN);
    appendPassAiDebugLine(debugLines, "slackAppId=" + PASS_AI_SLACK_APP_ID);
    appendPassAiDebugLine(debugLines, "teamId=" + (expectedTeamId || "(unset)"));
    appendPassAiDebugLine(debugLines, "channelId=" + channelId);
    appendPassAiDebugLine(debugLines, "POST " + PASS_AI_SLACK_API_ENDPOINT + "/chat.postMessage");

    const sendPayload = await sendToSlackTab({
      action: "slackSendToSingularity",
      workspaceOrigin: PASS_AI_SLACK_WORKSPACE_ORIGIN,
      channelId,
      expectedTeamId,
      ticketId,
      question,
      messageText,
      frontendClientId,
      singularityUserId: PASS_AI_SLACK_SINGULARITY_USER_ID,
      mention
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
      const pollPayload = await sendToSlackTab({
        action: "slackPollSingularityThread",
        workspaceOrigin: PASS_AI_SLACK_WORKSPACE_ORIGIN,
        channelId: postedChannel,
        expectedTeamId,
        parentTs,
        singularityUserId: PASS_AI_SLACK_SINGULARITY_USER_ID,
        singularityNamePattern: PASS_AI_SINGULARITY_NAME_PATTERN,
        finalMarkerRegex: "FINAL_RESPONSE",
        frontendClientId,
        ticketId,
        limit: 40,
        cached_latest_updates: pollCachedLatestUpdates
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
    if (id != null) {
      loadLatestQuestionForTicket(id, { silentError: false }).catch((err) => {
        console.error("Failed to load latest ticket question:", err);
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
          btnLabel.textContent = "@";
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
    state.manualZipSignout = false;
    try {
      const me = await sendToZendeskTab({ action: "getMe" });
      if (me && me.user) {
        await applySession(me);
        setStatus("Session restored.", false);
        return;
      }
    } catch (_) {}
    const tabId = await getActiveTabId();
    if (tabId) {
      chrome.runtime.sendMessage({ type: "ZIP_NAVIGATE", tabId, url: LOGIN_URL });
      startAuthCheckPolling();
      setStatus("Opening login in tab… Sign in there, then switch back and click ZIP to refresh.", false);
      return;
    }
    chrome.runtime.sendMessage({ type: "ZIP_OPEN_LOGIN", url: LOGIN_URL }, () => {
      startAuthCheckPolling();
      setStatus("Opening login in new tab… Sign in there, then switch back and click ZIP to refresh.", false);
    });
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
    state.manualZipSignout = false;
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
    setStatus("Ready. " + state.filteredTickets.length + " tickets shown.", false);
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

  function signout(options) {
    const manual = !(options && options.manual === false);
    state.manualZipSignout = manual;
    if (manual) {
      sendBackgroundRequest("ZIP_SLACK_OAUTH_SIGN_OUT").catch(() => {});
    }
    clearFilterCountCaches();
    showLogin();
  }

  function wireEvents() {
    retryCatalogLoadOnSelectFocus();
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage && chrome.runtime.onMessage.addListener) {
      chrome.runtime.onMessage.addListener((msg) => {
        if (!msg || msg.type !== "ZIP_THEME_CHANGED") return;
        applyThemeState(msg);
      });
    }
    if (typeof window !== "undefined") {
      window.addEventListener("focus", () => {
        loadSidePanelContext();
        loadContextMenuUpdateState(false).catch(() => {});
        loadThemeState().catch(() => {});
      });
      window.addEventListener("resize", () => {
        refreshThemeFlyoutPosition();
      });
      window.addEventListener("blur", () => { hideContextMenu(); });
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          loadSidePanelContext();
          loadContextMenuUpdateState(false).catch(() => {});
          loadThemeState().catch(() => {});
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
    if (els.signoutBtn) els.signoutBtn.addEventListener("click", signout);
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
    if (els.askPassAiBtn) {
      els.askPassAiBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (state.passAiLoading) return;
        askPassAiForSelectedTicket();
      });
    }
    if (els.slackLoginBtn) {
      els.slackLoginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (state.passAiLoading) return;
        beginSlackLoginFlow().catch((err) => {
          const message = normalizePassAiCommentBody(err && err.message) || "Slack sign-in failed.";
          setPassAiSlackAuthState({ ready: false, error: message });
          setStatus("Slack sign-in failed: " + message, true);
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
    await loadThemeState();
    await loadSidePanelContext();
    initializeZdApiContainerVisibility();
    wireEvents();
    populateAppDescription();
    populateApiPathSelect();
    renderApiParams();
    renderTicketHeaders();
    updateTicketActionButtons();
    resetTopIdentity();
    setStatus("", false);
    await refreshAll();
  }

  init();
})();
