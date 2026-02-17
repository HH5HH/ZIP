(function () {
  "use strict";

  const BASE = "https://adobeprimetime.zendesk.com";
  const ASSIGNED_FILTER_PATH = "/agent/filters/36464467";
  const ASSIGNED_FILTER_URL = BASE + ASSIGNED_FILTER_PATH;
  const LOGIN_URL = BASE + "/auth/v3/signin?return_to=" + encodeURIComponent(ASSIGNED_FILTER_URL);
  const TICKET_URL_PREFIX = BASE + "/agent/tickets/";
  const SHOW_TICKET_API_PATH = "/api/v2/tickets/{ticket_id}";
  const IS_WORKSPACE_MODE = new URLSearchParams(window.location.search || "").get("mode") === "workspace";
  const DEFAULT_FOOTER_HINT = "Tip: Right-click ZIP panel for ZIP menu actions";
  const FOOTER_HINT_TOOLTIP = "Right-click anywhere in ZIP to open the ZIP context menu.";

  const TICKET_COLUMNS = [
    { key: "id", label: "Ticket", type: "number" },
    { key: "subject", label: "Subject", type: "string" },
    { key: "status", label: "Status", type: "string" },
    { key: "priority", label: "Priority", type: "string" },
    { key: "created_at", label: "Created", type: "date" },
    { key: "updated_at", label: "Updated", type: "date" }
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
    zendeskTabId: null
  };

  let authCheckIntervalId = null;
  let authCheckInFlight = false;
  const AUTH_CHECK_INTERVAL_MS = 5000;
  const VIEW_COUNT_CACHE_KEY = "zip.filter.viewCounts.v1";
  const ORG_COUNT_CACHE_KEY = "zip.filter.orgCounts.v1";
  const GROUP_COUNT_CACHE_KEY = "zip.filter.groupCounts.v1";
  const ZENDESK_TAB_RETRY_MAX_ATTEMPTS = 6;
  const ZENDESK_TAB_RETRY_BASE_DELAY_MS = 150;
  const FILTER_CATALOG_RETRY_ATTEMPTS = 3;
  const FILTER_CATALOG_RETRY_BASE_DELAY_MS = 500;
  const STATUS_FILTER_ALL_VALUE = "all";
  const STATUS_FILTER_ALL_LABEL = "All Statuses";
  const PREFERRED_STATUS_ORDER = ["new", "open", "pending", "hold", "solved", "closed"];
  const ZD_API_VISIBILITY_STORAGE_KEY = "zip.ui.showZdApiContainers.v1";
  const DOCS_MENU_ZD_API_TOGGLE_VALUE = "__toggle_zd_api__";
  const DOCS_MENU_ZD_API_SHOW_LABEL = "GET zd api";
  const DOCS_MENU_ZD_API_HIDE_LABEL = "HIDE zd api";

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
    topIdentity: $("zipTopIdentity"),
    topIdentityName: $("zipTopIdentityName"),
    topIdentityTz: $("zipTopIdentityTz"),
    topIdentityEmail: $("zipTopIdentityEmail"),
    loginScreen: $("zipLoginScreen"),
    appDescription: $("zipAppDescription"),
    appScreen: $("zipAppScreen"),
    loginBtn: $("zipLoginBtn"),
    docsMenu: $("zipDocsMenu"),
    docsApiToggleOption: $("zipDocsApiToggleOption"),
    signoutBtn: $("zipSignoutBtn"),
    appVersionLink: $("zipAppVersionLink"),
    appVersion: $("zipAppVersion"),
    ticketNetworkIndicator: $("zipTicketNetworkIndicator"),
    ticketNetworkLabel: $("zipTicketNetworkLabel"),
    contextMenu: $("zipContextMenu"),
    contextMenuBuild: $("zipContextMenuBuild"),
    contextMenuToggleSide: $("zipContextMenuToggleSide"),
    contextMenuAskEric: $("zipContextMenuAskEric"),
    contextMenuGetLatest: $("zipContextMenuGetLatest"),
    rawTitle: $("zipRawTitle"),
    rawThead: $("zipRawThead"),
    rawBody: $("zipRawBody"),
    rawDownload: $("zipRawDownload"),
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

  function openExternalUrl(url) {
    const safeUrl = String(url || "").trim();
    if (!safeUrl) return;
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: safeUrl }, () => {});
    } else {
      window.open(safeUrl, "_blank", "noopener");
    }
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

  function getDocsApiToggleLabel(show) {
    return show ? DOCS_MENU_ZD_API_HIDE_LABEL : DOCS_MENU_ZD_API_SHOW_LABEL;
  }

  function syncDocsApiToggleOptionLabel() {
    if (!els.docsApiToggleOption) return;
    els.docsApiToggleOption.textContent = getDocsApiToggleLabel(state.showZdApiContainers);
  }

  function applyZdApiContainerVisibility(show, persist) {
    const next = !!show;
    state.showZdApiContainers = next;
    [els.apiGetSection, els.apiResultsSection].forEach((sectionEl) => {
      if (!sectionEl) return;
      sectionEl.classList.toggle("hidden", !next);
      sectionEl.setAttribute("aria-hidden", next ? "false" : "true");
    });
    syncDocsApiToggleOptionLabel();
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

  function hideContextMenu() {
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
    const menu = els.contextMenu;
    menu.classList.remove("hidden");
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
        if (els.contextMenu && !els.contextMenu.classList.contains("hidden")) {
          placeMenu();
        }
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

  function updateTicketActionButtons() {
    const hasRows = Array.isArray(state.filteredTickets) && state.filteredTickets.length > 0;
    if (els.exportCsvBtn) els.exportCsvBtn.disabled = !hasRows;
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

  function cellDisplayValue(val) {
    if (val == null) return "";
    if (Array.isArray(val)) return "[Array of " + val.length + " items]";
    if (typeof val === "object") return "[Object]";
    return String(val);
  }

  function fillCellWithValue(td, val) {
    if (val == null) { td.textContent = ""; return; }
    if (Array.isArray(val)) {
      if (val.length === 0) { td.textContent = "Empty array"; return; }
      const nest = document.createElement("table");
      nest.className = "raw-nested-table";
      const first = val[0];
      if (first != null && typeof first === "object" && !Array.isArray(first)) {
        const keySet = new Set();
        val.forEach((item) => {
          if (item && typeof item === "object") Object.keys(item).forEach((k) => keySet.add(k));
        });
        const cols = [...keySet];
        const thead = document.createElement("thead");
        const headerTr = document.createElement("tr");
        cols.forEach((k) => { const th = document.createElement("th"); th.textContent = k; headerTr.appendChild(th); });
        thead.appendChild(headerTr);
        nest.appendChild(thead);
        const tbody = document.createElement("tbody");
        val.forEach((row) => {
          const tr = document.createElement("tr");
          cols.forEach((col) => {
            const cell = document.createElement("td");
            fillCellWithValue(cell, row && row[col]);
            tr.appendChild(cell);
          });
          tbody.appendChild(tr);
        });
        nest.appendChild(tbody);
      } else {
        const headerRow = document.createElement("tr");
        const th0 = document.createElement("th"); th0.textContent = "#";
        const th1 = document.createElement("th"); th1.textContent = "Value";
        headerRow.appendChild(th0); headerRow.appendChild(th1);
        nest.appendChild(headerRow);
        val.forEach((item, i) => {
          const tr = document.createElement("tr");
          const td0 = document.createElement("td"); td0.textContent = String(i);
          const td1 = document.createElement("td"); td1.textContent = item == null ? "" : String(item);
          tr.appendChild(td0); tr.appendChild(td1);
          nest.appendChild(tr);
        });
      }
      td.appendChild(nest);
      return;
    }
    if (typeof val === "object") {
      const nest = document.createElement("table");
      nest.className = "raw-nested-table";
      Object.keys(val).forEach((k) => {
        const tr = document.createElement("tr");
        const tdK = document.createElement("td"); tdK.textContent = k;
        const tdV = document.createElement("td");
        fillCellWithValue(tdV, val[k]);
        tr.appendChild(tdK); tr.appendChild(tdV);
        nest.appendChild(tr);
      });
      td.appendChild(nest);
      return;
    }
    td.textContent = String(val);
  }

  function renderApiResultTable(payload) {
    els.rawThead.innerHTML = "";
    els.rawBody.innerHTML = "";
    if (payload == null || payload === "") {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 2;
      td.textContent = "No data. Run a GET request above.";
      tr.appendChild(td);
      els.rawBody.appendChild(tr);
      return;
    }
    if (typeof payload === "string") {
      const th = document.createElement("th"); th.textContent = "Response";
      els.rawThead.appendChild(th);
      const tr = document.createElement("tr");
      const td = document.createElement("td"); td.textContent = payload;
      tr.appendChild(td);
      els.rawBody.appendChild(tr);
      return;
    }
    if (Array.isArray(payload)) {
      if (payload.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td"); td.textContent = "Empty array";
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
        cols.forEach((k) => { const th = document.createElement("th"); th.textContent = k; els.rawThead.appendChild(th); });
        payload.forEach((row) => {
          const tr = document.createElement("tr");
          cols.forEach((col) => {
            const td = document.createElement("td");
            fillCellWithValue(td, row && row[col]);
            tr.appendChild(td);
          });
          els.rawBody.appendChild(tr);
        });
        return;
      }
      const th = document.createElement("th"); th.textContent = "Value";
      els.rawThead.appendChild(th);
      payload.forEach((item) => {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.textContent = cellDisplayValue(item);
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
      const thKey = document.createElement("th"); thKey.textContent = "Key";
      const thVal = document.createElement("th"); thVal.textContent = "Value";
      els.rawThead.appendChild(thKey); els.rawThead.appendChild(thVal);
      Object.keys(payload).forEach((key) => {
        const tr = document.createElement("tr");
        const tdKey = document.createElement("td"); tdKey.textContent = key;
        const tdVal = document.createElement("td");
        fillCellWithValue(tdVal, payload[key]);
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
    const timeZone = user.time_zone || "";
    const email = user.email || "";
    if (els.topIdentityName) els.topIdentityName.textContent = name;
    if (els.topIdentityTz) els.topIdentityTz.textContent = timeZone;
    if (els.topIdentityEmail) {
      els.topIdentityEmail.textContent = email || " ";
      els.topIdentityEmail.href = email ? "mailto:" + email : "#";
      els.topIdentityEmail.style.display = email ? "" : "none";
    }
    const avatarUrl = user.photo && (user.photo.content_url || user.photo.url);
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
    if (els.topIdentityName) els.topIdentityName.textContent = "Not logged in";
    if (els.topIdentityTz) els.topIdentityTz.textContent = "";
    if (els.topIdentityEmail) {
      els.topIdentityEmail.textContent = " ";
      els.topIdentityEmail.href = "#";
      els.topIdentityEmail.style.display = "none";
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
    state.user = null;
    state.zendeskTabId = null;
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
    renderApiResultTable(null);
    if (els.rawTitle) els.rawTitle.textContent = "GET /api/v2/users/me";
    updateRawDownloadLink();
    if (els.ticketBody) els.ticketBody.innerHTML = "";
    updateTicketActionButtons();
    syncStatusFilterOptions();
    els.loginScreen.classList.remove("hidden");
    els.appScreen.classList.add("hidden");
    document.body.classList.add("zip-logged-out");
    setStatus("", false);
  }

  function showApp() {
    startAuthCheckPolling();
    document.body.classList.remove("zip-logged-out");
    els.loginScreen.classList.add("hidden");
    els.appScreen.classList.remove("hidden");
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

  /** Clear ticket data and selection, then re-render table (e.g. before loading a new source). */
  function clearTicketTable(options) {
    const showLoading = !!(options && options.loading);
    setTicketTableLoading(showLoading);
    state.tickets = [];
    state.filteredTickets = [];
    state.selectedTicketId = null;
    applyFiltersAndRender();
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
    const sid = state.selectedTicketId;
    if (sid != null && !rows.some((r) => r.id === sid || r.id === Number(sid))) state.selectedTicketId = null;
    renderTicketRows();
  }

  function renderTicketHeaders() {
    els.ticketHead.innerHTML = "";
    TICKET_COLUMNS.forEach((col) => {
      const th = document.createElement("th");
      const arrow = state.sortKey === col.key ? (state.sortDir === "asc" ? " ^" : " v") : "";
      th.textContent = col.label + arrow;
      th.addEventListener("click", () => {
        if (state.sortKey === col.key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        else { state.sortKey = col.key; state.sortDir = col.type === "string" ? "asc" : "desc"; }
        renderTicketHeaders();
        applyFiltersAndRender();
      });
      els.ticketHead.appendChild(th);
    });
  }

  /** Navigate main ZD tab to ticket URL, update selected state, and sync row highlight. Single source of truth for "open ticket". */
  function openTicketInMainTab(url, ticketId) {
    const id = ticketId != null ? ticketId : null;
    const ticketUrl = (url && String(url).trim()) || (id != null ? TICKET_URL_PREFIX + id : "");
    if (ticketUrl) {
      getActiveTabId().then((tabId) => {
        if (tabId) chrome.runtime.sendMessage({ type: "ZIP_NAVIGATE", tabId, url: ticketUrl }, () => {});
      });
    }
    state.selectedTicketId = id;
    if (!els.ticketBody) return;
    els.ticketBody.querySelectorAll("tr.ticket-row").forEach((r) => r.classList.remove("ticket-row-selected"));
    if (id != null) {
      const sel = els.ticketBody.querySelector(`tr.ticket-row[data-ticket-id="${String(id)}"]`);
      if (sel) sel.classList.add("ticket-row-selected");
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
    const normalizedTicketId = String(ticketId == null ? "" : ticketId).trim();
    if (!normalizedTicketId || !els.apiPathSelect) return;
    const hasShowTicketPath = Array.from(els.apiPathSelect.options || []).some((opt) => opt.value === SHOW_TICKET_API_PATH);
    if (!hasShowTicketPath) return;
    if (els.apiPathSelect.value !== SHOW_TICKET_API_PATH) {
      els.apiPathSelect.value = SHOW_TICKET_API_PATH;
    }
    renderApiParams();
    const input = document.getElementById("zipApiParam_ticket_id");
    if (input) input.value = normalizedTicketId;
    await runZdGet();
  }

  function renderTicketRows() {
    els.ticketBody.innerHTML = "";
    if (!state.filteredTickets.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = TICKET_COLUMNS.length;
      td.className = "ticket-empty-state";
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
      tr.className = "ticket-row";
      const rowId = row.id;
      const rowUrl = (row.url && String(row.url).trim()) || (rowId != null ? TICKET_URL_PREFIX + rowId : "");
      tr.dataset.ticketId = String(rowId);
      tr.dataset.ticketUrl = rowUrl;
      if (state.selectedTicketId != null && state.selectedTicketId === rowId) tr.classList.add("ticket-row-selected");
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
        if (col.key === "id" && rowId != null) {
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

  function getDefaultParamValue(param) {
    const p = state.userProfile || {};
    if (param === "userId" || param === "user_id") return p.user_id != null || p.id != null ? String(p.user_id ?? p.id) : "";
    if (param === "group_id") return p.default_group_id != null || p.group_id != null ? String(p.default_group_id ?? p.group_id) : "";
    if (param === "organization_id") return p.organization_id != null ? String(p.organization_id) : "";
    return "";
  }

  function renderApiParams() {
    const spec = getSelectedPathSpec();
    els.apiParams.innerHTML = "";
    spec.params.forEach((param) => {
      const row = document.createElement("div");
      row.className = "param-row";
      const defaultValue = getDefaultParamValue(param);
      row.innerHTML = `<label for="zipApiParam_${param}">${param}</label><input type="text" id="zipApiParam_${param}" value="${escapeHtml(defaultValue)}" placeholder="${escapeHtml(param)}" />`;
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
    } catch (err) {
      setStatus("API call failed: " + (err && err.message ? err.message : "Unknown error"), true);
      setRawFromPayload(null);
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
    clearFilterCountCaches();
    showLogin();
  }

  function wireEvents() {
    retryCatalogLoadOnSelectFocus();
    if (typeof window !== "undefined") {
      window.addEventListener("focus", () => {
        loadSidePanelContext();
        loadContextMenuUpdateState(false).catch(() => {});
      });
      window.addEventListener("blur", () => { hideContextMenu(); });
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          loadSidePanelContext();
          loadContextMenuUpdateState(false).catch(() => {});
        }
      });
    }
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showContextMenuAt(e.clientX, e.clientY);
    });
    document.addEventListener("click", (e) => {
      if (!els.contextMenu || els.contextMenu.classList.contains("hidden")) return;
      if (!els.contextMenu.contains(e.target)) hideContextMenu();
    });
    document.addEventListener("scroll", () => { hideContextMenu(); }, true);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideContextMenu();
    });
    if (els.contextMenuToggleSide) {
      els.contextMenuToggleSide.addEventListener("click", () => {
        runContextMenuAction("toggleSide");
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
        if (value === DOCS_MENU_ZD_API_TOGGLE_VALUE) {
          toggleZdApiContainerVisibility();
          target.value = "";
          return;
        }
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
    if (els.appVersion && typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getManifest) {
      try {
        const manifest = chrome.runtime.getManifest();
        els.appVersion.textContent = (manifest && manifest.version) || "?";
      } catch (_) {}
    }
    setContextMenuBuildLabel();
    loadContextMenuUpdateState(false).catch(() => {});
    if (els.signoutBtn) els.signoutBtn.addEventListener("click", signout);
    if (els.topIdentityEmail) {
      els.topIdentityEmail.addEventListener("click", (e) => {
        const href = (els.topIdentityEmail.getAttribute("href") || "").trim();
        if (href && href.toLowerCase().startsWith("mailto:")) {
          e.preventDefault();
          if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
            chrome.tabs.create({ url: href }, () => {});
          } else {
            window.open(href, "_blank", "noopener");
          }
        }
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
