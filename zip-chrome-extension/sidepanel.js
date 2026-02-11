(function () {
  "use strict";

  const BASE = "https://adobeprimetime.zendesk.com";
  const LOGIN_URL = BASE + "/auth/v3/signin?return_to=" + encodeURIComponent(BASE + "/agent/dashboard");
  const TICKET_URL_PREFIX = BASE + "/agent/tickets/";

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
    organizations: [],
    views: [],
    ticketSource: "assigned",
    selectedOrgId: "",
    selectedViewId: "",
    selectedByGroupValue: "",
    selectedTicketId: null,
    groupsWithMembers: []
  };

  let authCheckIntervalId = null;
  const AUTH_CHECK_INTERVAL_MS = 2500;

  function stopAuthCheckPolling() {
    if (authCheckIntervalId != null) {
      clearInterval(authCheckIntervalId);
      authCheckIntervalId = null;
    }
  }

  function startAuthCheckPolling() {
    stopAuthCheckPolling();
    authCheckIntervalId = setInterval(async () => {
      if (state.user) return;
      try {
        const me = await sendToZendeskTab({ action: "getMe" });
        if (me && me.user) {
          stopAuthCheckPolling();
          setStatus("Log-in detected. Loading…", false);
          await refreshAll();
        }
      } catch (_) {}
    }, AUTH_CHECK_INTERVAL_MS);
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
    signoutBtn: $("zipSignoutBtn"),
    appVersionLink: $("zipAppVersionLink"),
    appVersion: $("zipAppVersion"),
    rawTitle: $("zipRawTitle"),
    rawThead: $("zipRawThead"),
    rawBody: $("zipRawBody"),
    rawDownload: $("zipRawDownload"),
    ticketSearch: $("zipTicketSearch"),
    statusFilter: $("zipStatusFilter"),
    reloadTicketsBtn: $("zipReloadTicketsBtn"),
    ticketHead: $("zipTicketHead"),
    ticketBody: $("zipTicketBody"),
    assignedTicketsLink: $("zipAssignedTicketsLink"),
    orgSelect: $("zipOrgSelect"),
    viewSelect: $("zipViewSelect"),
    groupMemberSelect: $("zipGroupMemberSelect"),
    apiPathSelect: $("zipApiPathSelect"),
    apiParams: $("zipApiParams"),
    apiRunBtn: $("zipApiRunBtn")
  };

  function getActiveTabId() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "ZIP_GET_ACTIVE_TAB" }, (r) => resolve(r?.tabId ?? null));
    });
  }

  function sendToZendeskTab(inner) {
    return new Promise((resolve, reject) => {
      getActiveTabId().then((tabId) => {
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
    });
  }

  function setBusy(on) {
    state.busy = !!on;
    if (els.apiRunBtn) els.apiRunBtn.disabled = state.busy;
    if (els.topAvatarWrap) {
      els.topAvatarWrap.classList.toggle("loading", state.busy);
      els.topAvatarWrap.title = state.busy ? "Loading…" : (els.topAvatarWrap.dataset.idleTitle || "Not logged in");
    }
  }

  function setStatus(msg, isError) {
    if (!els.status) return;
    els.status.textContent = msg || "";
    els.status.classList.toggle("error", !!isError);
  }

  function setRawTitle(path) {
    state.lastApiPath = path || state.lastApiPath;
    if (els.rawTitle) els.rawTitle.textContent = "GET " + (state.lastApiPath || "/api/v2/users/me");
  }

  function getDownloadFilename() {
    const path = (state.lastApiPath || "response").replace(/^\//, "").replace(/\//g, "-");
    const base = path || "response";
    return (base.endsWith(".json") ? base : base + ".json").replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  function updateRawDownloadLink() {
    if (!els.rawDownload) return;
    const hasPayload = state.lastApiPayloadString != null && state.lastApiPayloadString !== "";
    els.rawDownload.style.visibility = hasPayload ? "visible" : "hidden";
    els.rawDownload.download = getDownloadFilename();
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

  function showLogin() {
    state.user = null;
    startAuthCheckPolling();
    state.userProfile = null;
    state.mePayload = null;
    state.tickets = [];
    state.filteredTickets = [];
    state.organizations = [];
    state.views = [];
    state.ticketSource = "assigned";
    state.selectedOrgId = "";
    state.selectedViewId = "";
    state.selectedByGroupValue = "";
    state.groupsWithMembers = [];
    resetTopIdentity();
    state.lastApiPayload = null;
    state.lastApiPayloadString = "";
    renderApiResultTable(null);
    if (els.rawTitle) els.rawTitle.textContent = "GET /api/v2/users/me";
    updateRawDownloadLink();
    if (els.ticketBody) els.ticketBody.innerHTML = "";
    populateOrgSelect();
    populateViewSelect();
    populateGroupMemberSelect();
    els.loginScreen.classList.remove("hidden");
    els.appScreen.classList.add("hidden");
    document.body.classList.add("zip-logged-out");
    setStatus("", false);
  }

  function showApp() {
    stopAuthCheckPolling();
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
  function clearTicketTable() {
    state.tickets = [];
    state.filteredTickets = [];
    state.selectedTicketId = null;
    renderTicketRows();
  }

  function applyFiltersAndRender() {
    const text = String(state.textFilter || "").trim().toLowerCase();
    const status = state.statusFilter || "all";
    const rows = state.tickets.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
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

  function renderTicketRows() {
    els.ticketBody.innerHTML = "";
    if (!state.filteredTickets.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = TICKET_COLUMNS.length;
      td.textContent = "No tickets found.";
      tr.appendChild(td);
      els.ticketBody.appendChild(tr);
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
        if (tid && turl) openTicketInMainTab(turl, tid);
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
          });
          td.appendChild(a);
        } else if (col.type === "date") {
          td.textContent = formatDateTime(row[col.key]);
        } else {
          td.textContent = String(row[col.key] == null ? "" : row[col.key]);
        }
        tr.appendChild(td);
      });
      els.ticketBody.appendChild(tr);
    });
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
    const spec = getSelectedPathSpec();
    let url = spec.path;
    spec.params.forEach((param) => {
      const input = document.getElementById("zipApiParam_" + param);
      let value = (input && input.value && input.value.trim()) || "";
      if (!value) value = getDefaultParamValue(param);
      url = url.replace("{" + param + "}", encodeURIComponent(value));
    });
    return BASE + url + (url.indexOf("/api/") !== -1 && !url.endsWith(".json") ? ".json" : "");
  }

  async function runZdGet() {
    const url = buildApiUrl();
    setBusy(true);
    setStatus("Calling " + url + "...", false);
    try {
      const result = await sendToZendeskTab({ action: "fetch", url });
      setRawFromPayload(result.payload != null ? result.payload : (result.text || ""));
      setRawTitle(getSelectedPathSpec().path);
      setStatus(result.ok ? "GET succeeded." : "GET returned " + result.status + ".", !result.ok);
    } catch (err) {
      setStatus("API call failed: " + (err && err.message ? err.message : "Unknown error"), true);
      setRawFromPayload(null);
    } finally {
      setBusy(false);
    }
  }

  async function loadTickets(email) {
    try {
      const result = await sendToZendeskTab({ action: "loadTickets", email: email || "" });
      state.tickets = result.tickets || [];
      if (result.error) throw new Error(result.error);
      applyFiltersAndRender();
    } catch (err) {
      state.tickets = [];
      state.filteredTickets = [];
      renderTicketRows();
      throw err;
    }
  }

  async function loadTicketsByOrg(orgId) {
    try {
      const result = await sendToZendeskTab({ action: "loadTicketsByOrg", orgId: String(orgId || "") });
      state.tickets = result.tickets || [];
      if (result.error) throw new Error(result.error);
      applyFiltersAndRender();
    } catch (err) {
      state.tickets = [];
      state.filteredTickets = [];
      renderTicketRows();
      throw err;
    }
  }

  async function loadTicketsByView(viewId) {
    try {
      const result = await sendToZendeskTab({ action: "loadTicketsByView", viewId: String(viewId || "") });
      state.tickets = result.tickets || [];
      if (result.error) throw new Error(result.error);
      applyFiltersAndRender();
    } catch (err) {
      state.tickets = [];
      state.filteredTickets = [];
      renderTicketRows();
      throw err;
    }
  }

  async function loadTicketsByAssigneeId(userId) {
    try {
      const result = await sendToZendeskTab({ action: "loadTicketsByAssigneeId", userId: String(userId || "") });
      state.tickets = result.tickets || [];
      if (result.error) throw new Error(result.error);
      applyFiltersAndRender();
    } catch (err) {
      state.tickets = [];
      state.filteredTickets = [];
      renderTicketRows();
      throw err;
    }
  }

  async function loadOrganizations() {
    try {
      const result = await sendToZendeskTab({ action: "loadOrganizations" });
      state.organizations = result.organizations || [];
      if (result.error) throw new Error(result.error);
      populateOrgSelect();
    } catch (_) {
      state.organizations = [];
      populateOrgSelect();
    }
  }

  function populateOrgSelect() {
    if (!els.orgSelect) return;
    const selected = state.selectedOrgId || "";
    els.orgSelect.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "—";
    els.orgSelect.appendChild(opt0);
    (state.organizations || []).forEach((org) => {
      const opt = document.createElement("option");
      opt.value = String(org.id);
      opt.textContent = org.name || "Org " + org.id;
      els.orgSelect.appendChild(opt);
    });
    els.orgSelect.value = selected;
  }

  async function loadViews() {
    try {
      const result = await sendToZendeskTab({ action: "loadViews" });
      state.views = result.views || [];
      if (result.error) throw new Error(result.error);
      populateViewSelect();
    } catch (_) {
      state.views = [];
      populateViewSelect();
    }
  }

  async function loadAllGroupsWithMembers() {
    state.groupsWithMembers = [];
    populateGroupMemberSelect();
    try {
      const result = await sendToZendeskTab({ action: "loadAllGroupsWithMembers" });
      state.groupsWithMembers = result.groupsWithMembers || [];
      if (result.error) state.groupsWithMembers = [];
      populateGroupMemberSelect();
    } catch (_) {
      state.groupsWithMembers = [];
      populateGroupMemberSelect();
    }
  }

  function populateGroupMemberSelect() {
    if (!els.groupMemberSelect) return;
    const selected = state.selectedByGroupValue || "";
    els.groupMemberSelect.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "—";
    els.groupMemberSelect.appendChild(opt0);
    (state.groupsWithMembers || []).forEach(({ group, agents }) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group.name || "Group " + group.id;
      const groupOpt = document.createElement("option");
      groupOpt.value = "g-" + group.id;
      groupOpt.textContent = group.name || "Group " + group.id;
      optgroup.appendChild(groupOpt);
      (agents || []).forEach((agent) => {
        const opt = document.createElement("option");
        opt.value = "u-" + (agent.id || "");
        opt.textContent = agent.name || "Agent " + (agent.id || "");
        optgroup.appendChild(opt);
      });
      els.groupMemberSelect.appendChild(optgroup);
    });
    els.groupMemberSelect.value = selected;
  }

  async function loadTicketsByGroupId(groupId) {
    try {
      const result = await sendToZendeskTab({ action: "loadTicketsByGroupId", groupId: String(groupId || "") });
      state.tickets = result.tickets || [];
      if (result.error) throw new Error(result.error);
      applyFiltersAndRender();
    } catch (err) {
      state.tickets = [];
      state.filteredTickets = [];
      renderTicketRows();
      throw err;
    }
  }

  function populateViewSelect() {
    if (!els.viewSelect) return;
    const selected = state.selectedViewId || "";
    els.viewSelect.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "—";
    els.viewSelect.appendChild(opt0);
    (state.views || []).forEach((v) => {
      const opt = document.createElement("option");
      opt.value = String(v.id);
      opt.textContent = (v.title || "").trim() || "View " + v.id;
      els.viewSelect.appendChild(opt);
    });
    els.viewSelect.value = selected;
  }

  /** Run the same "assigned to logged-in email" active-tickets query used after login. */
  function runAssignedTicketsQuery() {
    if (!state.user || !state.user.email) return;
    state.ticketSource = "assigned";
    state.selectedOrgId = "";
    state.selectedViewId = "";
    state.selectedByGroupValue = "";
    if (els.orgSelect) els.orgSelect.value = "";
    if (els.viewSelect) els.viewSelect.value = "";
    if (els.groupMemberSelect) els.groupMemberSelect.value = "";
    return loadTickets(state.user.email);
  }

  function startLogin() {
    getActiveTabId().then((tabId) => {
      if (tabId) {
        chrome.runtime.sendMessage({ type: "ZIP_NAVIGATE", tabId, url: LOGIN_URL });
        setStatus("Opening login in tab… Sign in there, then switch back and click ZIP to refresh.", false);
      } else {
        chrome.runtime.sendMessage({ type: "ZIP_OPEN_LOGIN", url: LOGIN_URL }, () => {
          setStatus("Opening login in new tab… Sign in there, then switch back and click ZIP to refresh.", false);
        });
      }
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
    state.user = me.user;
    state.mePayload = me.payload;
    state.userProfile = parseUserProfile(me.payload);
    setTopIdentityFromUser(me.user);
    showApp();
    setRawFromPayload(me.payload);
    setRawTitle("/api/v2/users/me");
    renderApiParams();
    setStatus("Hello " + (me.user.name || me.user.email || "agent") + ". Loading tickets...", false);
    await loadTickets(me.user.email || "");
    await loadOrganizations();
    await loadViews();
    await loadAllGroupsWithMembers();
    setStatus("Ready. " + state.filteredTickets.length + " tickets shown.", false);
  }

  async function refreshAll() {
    setBusy(true);
    try {
      const me = await sendToZendeskTab({ action: "getMe" });
      if (!me || !me.user) {
        showLogin();
        return;
      }
      await applySession(me);
    } catch (err) {
      showLogin();
    } finally {
      setBusy(false);
    }
  }

  function signout() {
    sendToZendeskTab({ action: "logout" }).catch(() => {});
    showLogin();
  }

  function wireEvents() {
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
          const v = state.selectedByGroupValue;
          if (v.startsWith("g-")) await loadTicketsByGroupId(v.slice(2));
          else if (v.startsWith("u-")) await loadTicketsByAssigneeId(v.slice(2));
        } else {
          await loadTickets(state.user.email || "");
        }
        setStatus("Tickets refreshed. " + state.filteredTickets.length + " rows shown.", false);
      } catch (err) {
        setStatus("Ticket refresh failed: " + (err && err.message ? err.message : "Unknown error"), true);
      } finally {
        setBusy(false);
      }
    });
    if (els.assignedTicketsLink) {
      els.assignedTicketsLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (!state.user || !state.user.email) return;
        setBusy(true);
        runAssignedTicketsQuery()
          .then(() => setStatus("Assigned tickets loaded. " + state.filteredTickets.length + " rows shown.", false))
          .catch((err) => setStatus("Tickets failed: " + (err && err.message ? err.message : "Unknown error"), true))
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
        clearTicketTable();
        setBusy(true);
        if (!val) {
          state.ticketSource = "assigned";
          state.selectedOrgId = "";
          loadTickets(state.user.email || "")
            .then(() => setStatus("Assigned tickets loaded. " + state.filteredTickets.length + " rows shown.", false))
            .catch((err) => setStatus("Tickets failed: " + (err && err.message ? err.message : "Unknown error"), true))
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
        clearTicketTable();
        setBusy(true);
        if (!val) {
          state.ticketSource = "assigned";
          state.selectedViewId = "";
          loadTickets(state.user.email || "")
            .then(() => setStatus("Assigned tickets loaded. " + state.filteredTickets.length + " rows shown.", false))
            .catch((err) => setStatus("Tickets failed: " + (err && err.message ? err.message : "Unknown error"), true))
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
          clearTicketTable();
          setBusy(true);
          loadTickets(state.user.email || "")
            .then(() => setStatus("Assigned tickets loaded. " + state.filteredTickets.length + " rows shown.", false))
            .catch((err) => setStatus("Tickets failed: " + (err && err.message ? err.message : "Unknown error"), true))
            .finally(() => setBusy(false));
          return;
        }
        state.ticketSource = "groupMember";
        state.selectedByGroupValue = val;
        clearTicketTable();
        setStatus("Loading tickets…", false);
        setBusy(true);
        const loadPromise = val.startsWith("g-")
          ? loadTicketsByGroupId(val.slice(2))
          : val.startsWith("u-")
            ? loadTicketsByAssigneeId(val.slice(2))
            : Promise.resolve();
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
      state.statusFilter = els.statusFilter.value || "all";
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
    document.body.classList.add("zip-logged-out");
    wireEvents();
    populateAppDescription();
    populateApiPathSelect();
    renderApiParams();
    renderTicketHeaders();
    resetTopIdentity();
    setStatus("", false);
    await refreshAll();
  }

  init();
})();
