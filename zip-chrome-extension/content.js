(function () {
  "use strict";

  if (window.__ZIP_CONTENT_LOADED__) return;
  window.__ZIP_CONTENT_LOADED__ = true;

  const BASE = "https://adobeprimetime.zendesk.com";
  const ME_URL = BASE + "/api/v2/users/me.json";
  const SESSION_URL = (typeof window !== "undefined" && window.location && window.location.origin
    ? window.location.origin
    : BASE) + "/api/v2/users/me/session";
  const SESSION_PATH = "/api/v2/users/me/session";
  const TICKET_URL_PREFIX = BASE + "/agent/tickets/";
  const JIRA_ENG_TICKET_FIELD_ID = "22790243";
  const JIRA_BROWSE_URL_PREFIX = "https://jira.corp.adobe.com/browse/";
  const SLACK_DEFAULT_WORKSPACE_ORIGIN = "https://adobedx.slack.com";
  const SLACK_DEFAULT_FINAL_MARKER_REGEX = "FINAL_RESPONSE";
  const SLACK_BRIDGE_EVENT_NAME = "zip-slack-token";
  const SLACK_BRIDGE_MESSAGE_TYPE = "ZIP_SLACK_TOKEN_BRIDGE";
  const SLACK_TOKEN_BRIDGE_SCRIPT_ID = "zip-slack-token-bridge-script";
  const SLACK_TOKEN_BRIDGE_SCRIPT_PATH = "slack-token-bridge.js";
  const ZIP_KEY_BANNER_ID = "zip-key-required-banner";

  let slackTokenBridgeInstalled = false;
  let slackTokenBridgeListenerInstalled = false;
  let slackCapturedToken = "";
  let zendeskObserversInstalled = false;
  let zendeskNetworkHooksInstalled = false;
  let zendeskDomObserverInstalled = false;
  let zendeskSessionProbeTimerId = null;
  let zendeskSessionProbeInFlight = false;
  let lastZendeskSessionSignalKey = "";
  let lastZendeskSessionSignalAt = 0;
  let lastZendeskSessionProbeAt = 0;
  let lastZendeskSessionStatus = 0;
  const ZENDESK_SESSION_SIGNAL_DEDUPE_MS = 1500;
  const ZENDESK_PROBE_MIN_INTERVAL_MS = 1500;
  const ZENDESK_LOGGED_OUT_PROBE_COOLDOWN_MS = 12000;

  function waitMs(delayMs) {
    const timeout = Math.max(0, Math.trunc(Number(delayMs) || 0));
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  }

  async function fetchJson(url) {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" }
    });
    let payload = null;
    let text = "";
    try {
      payload = await res.json();
    } catch (_) {
      try {
        text = await res.text();
      } catch (_) {}
    }
    return { ok: res.ok, status: res.status, payload, text };
  }

  function extractUser(payload) {
    if (!payload || typeof payload !== "object") return null;
    if (payload.user && payload.user.id != null) return payload.user;
    if (payload.id != null) return payload;
    return null;
  }

  async function getMe() {
    const res = await fetchJson(ME_URL);
    if (!res.ok) return { user: null, payload: res.payload, status: res.status };
    const user = extractUser(res.payload);
    return { user: user || null, payload: res.payload, status: res.status };
  }

  function isZendeskHost(hostname) {
    const normalized = String(hostname || "").trim().toLowerCase();
    return normalized === "zendesk.com" || normalized.endsWith(".zendesk.com");
  }

  function isZendeskPage() {
    return typeof window !== "undefined"
      && window.location
      && isZendeskHost(window.location.hostname);
  }

  function parseUrlPath(input) {
    const raw = String(input || "").trim();
    if (!raw) return "";
    try {
      const parsed = new URL(raw, window.location && window.location.origin ? window.location.origin : BASE);
      return String(parsed.pathname || "").toLowerCase();
    } catch (_) {
      return "";
    }
  }

  function isSessionPath(pathname) {
    return String(pathname || "").toLowerCase().startsWith(SESSION_PATH);
  }

  function isLikelyLogoutPath(pathname) {
    const path = String(pathname || "").toLowerCase();
    if (!path) return false;
    return path.includes("/logout")
      || path.includes("/access/unauthenticated")
      || path.includes("/access/login")
      || path.includes("/signin");
  }

  function shouldEmitZendeskSessionSignal(signalKey) {
    const now = Date.now();
    if (!signalKey) return false;
    if (signalKey !== lastZendeskSessionSignalKey) {
      lastZendeskSessionSignalKey = signalKey;
      lastZendeskSessionSignalAt = now;
      return true;
    }
    if (now - lastZendeskSessionSignalAt > ZENDESK_SESSION_SIGNAL_DEDUPE_MS) {
      lastZendeskSessionSignalAt = now;
      return true;
    }
    return false;
  }

  function isAuthFailureStatus(status) {
    const numeric = Number(status) || 0;
    return numeric === 401 || numeric === 403;
  }

  function isPriorityZendeskProbeReason(reason) {
    const text = String(reason || "").toLowerCase();
    if (!text) return false;
    return text.includes("zip_session_probe")
      || text.includes("background")
      || text.includes("focus")
      || text.includes("pageshow")
      || text.includes("visibility")
      || text.includes("hashchange")
      || text.includes("popstate")
      || text.includes("login");
  }

  function getZendeskProbeDelay(reason, requestedDelayMs) {
    const now = Date.now();
    const requested = Math.max(0, Number(requestedDelayMs) || 0);
    let nextDelay = requested;
    if (lastZendeskSessionProbeAt > 0) {
      const minIntervalRemaining = (lastZendeskSessionProbeAt + ZENDESK_PROBE_MIN_INTERVAL_MS) - now;
      if (minIntervalRemaining > nextDelay) nextDelay = minIntervalRemaining;
    }
    if (isAuthFailureStatus(lastZendeskSessionStatus) && !isPriorityZendeskProbeReason(reason)) {
      const cooldownRemaining = (lastZendeskSessionProbeAt + ZENDESK_LOGGED_OUT_PROBE_COOLDOWN_MS) - now;
      if (cooldownRemaining > nextDelay) nextDelay = cooldownRemaining;
    }
    return Math.max(0, Math.trunc(nextDelay));
  }

  function emitZendeskSessionOk(payload, reason, status) {
    if (!isZendeskPage()) return;
    const responseStatus = Number(status) || 200;
    const signalKey = "ok:" + String(responseStatus) + ":" + String(reason || "session_ok");
    if (!shouldEmitZendeskSessionSignal(signalKey)) return;
    chrome.runtime.sendMessage({
      type: "ZD_SESSION_OK",
      status: responseStatus,
      reason: String(reason || "session_ok"),
      payload: payload && typeof payload === "object" ? payload : null
    }, () => {
      void chrome.runtime.lastError;
    });
  }

  function emitZendeskLogout(reason, status) {
    if (!isZendeskPage()) return;
    const responseStatus = Number(status) || 401;
    const signalKey = "logout:" + String(responseStatus) + ":" + String(reason || "logout_detected");
    if (!shouldEmitZendeskSessionSignal(signalKey)) return;
    chrome.runtime.sendMessage({
      type: "ZD_LOGOUT",
      status: responseStatus,
      reason: String(reason || "logout_detected")
    }, () => {
      void chrome.runtime.lastError;
    });
  }

  async function probeZendeskSession(options) {
    const opts = options && typeof options === "object" ? options : {};
    if (!isZendeskPage()) {
      return { ok: false, status: 0, payload: null, error: "Not a Zendesk tab." };
    }
    const url = String(opts.url || SESSION_URL);
    const result = await fetchJson(url);
    const status = Number(result.status) || 0;
    lastZendeskSessionProbeAt = Date.now();
    lastZendeskSessionStatus = status;
    if (status === 200) {
      emitZendeskSessionOk(result.payload, opts.reason || "session_probe_200", status);
    } else if (status === 401 || status === 403) {
      emitZendeskLogout(opts.reason || "session_probe_unauthorized", status);
    }
    return {
      ok: status === 200,
      status,
      payload: result.payload || null
    };
  }

  function scheduleZendeskSessionProbe(reason, delayMs) {
    if (!isZendeskPage()) return;
    if (zendeskSessionProbeTimerId != null) {
      clearTimeout(zendeskSessionProbeTimerId);
      zendeskSessionProbeTimerId = null;
    }
    const delay = getZendeskProbeDelay(reason, delayMs);
    zendeskSessionProbeTimerId = setTimeout(() => {
      zendeskSessionProbeTimerId = null;
      if (zendeskSessionProbeInFlight) return;
      zendeskSessionProbeInFlight = true;
      probeZendeskSession({ reason: reason || "scheduled_probe" })
        .catch(() => {})
        .finally(() => {
          zendeskSessionProbeInFlight = false;
        });
    }, delay);
  }

  function inspectZendeskAuthResponse(urlValue, status, payload, reason) {
    if (!isZendeskPage()) return;
    const path = parseUrlPath(urlValue);
    if (!path) return;
    const normalizedStatus = Number(status) || 0;
    if (normalizedStatus > 0) {
      lastZendeskSessionProbeAt = Date.now();
      lastZendeskSessionStatus = normalizedStatus;
    }
    if (isSessionPath(path)) {
      if (normalizedStatus === 200) {
        emitZendeskSessionOk(payload && typeof payload === "object" ? payload : null, reason || "session_endpoint_200", normalizedStatus);
      } else if (normalizedStatus === 401 || normalizedStatus === 403) {
        emitZendeskLogout(reason || "session_endpoint_unauthorized", normalizedStatus);
      }
      return;
    }
    if (isLikelyLogoutPath(path)) {
      if ((normalizedStatus >= 200 && normalizedStatus < 400) || normalizedStatus === 401 || normalizedStatus === 403) {
        emitZendeskLogout(reason || "logout_path_detected", normalizedStatus || 401);
      }
    }
  }

  function installZendeskNetworkHooks() {
    if (!isZendeskPage() || zendeskNetworkHooksInstalled) return;
    zendeskNetworkHooksInstalled = true;

    try {
      if (typeof window.fetch === "function") {
        const originalFetch = window.fetch.bind(window);
        window.fetch = async function patchedZipFetch(input, init) {
          const response = await originalFetch(input, init);
          try {
            const url = typeof input === "string"
              ? input
              : input && typeof input === "object" && "url" in input
                ? input.url
                : "";
            const status = Number(response && response.status) || 0;
            const path = parseUrlPath(url);
            if (isSessionPath(path) && status === 200) {
              response.clone().json()
                .then((jsonPayload) => {
                  inspectZendeskAuthResponse(url, status, jsonPayload, "fetch_session_200");
                })
                .catch(() => {
                  inspectZendeskAuthResponse(url, status, null, "fetch_session_200");
                });
            } else {
              inspectZendeskAuthResponse(url, status, null, "fetch_observed");
            }
          } catch (_) {}
          return response;
        };
      }
    } catch (_) {}

    try {
      if (typeof XMLHttpRequest !== "undefined" && XMLHttpRequest.prototype) {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function patchedZipXhrOpen(method, url) {
          this.__zipAuthUrl = url;
          this.__zipAuthMethod = method;
          return originalOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function patchedZipXhrSend(body) {
          if (!this.__zipAuthListenerInstalled) {
            this.__zipAuthListenerInstalled = true;
            this.addEventListener("loadend", () => {
              try {
                const status = Number(this.status) || 0;
                const url = this.__zipAuthUrl || "";
                let payload = null;
                const path = parseUrlPath(url);
                if (isSessionPath(path)) {
                  payload = parseJsonMaybe(this.responseText || "");
                }
                inspectZendeskAuthResponse(url, status, payload, "xhr_observed");
              } catch (_) {}
            });
          }
          return originalSend.apply(this, [body]);
        };
      }
    } catch (_) {}
  }

  function hasZendeskLoginDomMarkers() {
    if (!isZendeskPage() || typeof document === "undefined") return false;
    const selectors = [
      "form[action*='/access/login']",
      "form[action*='/signin']",
      "input[name='user[email]']",
      "input[name='user[password]']"
    ];
    return selectors.some((selector) => {
      try {
        return !!document.querySelector(selector);
      } catch (_) {
        return false;
      }
    });
  }

  function installZendeskDomObserver() {
    if (!isZendeskPage() || zendeskDomObserverInstalled) return;
    zendeskDomObserverInstalled = true;
    if (typeof MutationObserver !== "function" || typeof document === "undefined") return;
    const root = document.documentElement || document.body;
    if (!root) return;
    const observer = new MutationObserver(() => {
      const path = String(window.location && window.location.pathname ? window.location.pathname : "").toLowerCase();
      if (isLikelyLogoutPath(path) || hasZendeskLoginDomMarkers()) {
        emitZendeskLogout("dom_logout_marker", 401);
        return;
      }
      scheduleZendeskSessionProbe("dom_observer", 350);
    });
    observer.observe(root, { subtree: true, childList: true, attributes: true });
  }

  function installZendeskSessionObservers() {
    if (!isZendeskPage() || zendeskObserversInstalled) return;
    zendeskObserversInstalled = true;
    installZendeskNetworkHooks();
    installZendeskDomObserver();

    const probeIfActive = (reason) => {
      const path = String(window.location && window.location.pathname ? window.location.pathname : "").toLowerCase();
      if (isLikelyLogoutPath(path) || hasZendeskLoginDomMarkers()) {
        emitZendeskLogout(reason || "logout_path_detected", 401);
        return;
      }
      scheduleZendeskSessionProbe(reason || "observer_probe", 50);
    };

    window.addEventListener("focus", () => probeIfActive("focus_probe"));
    window.addEventListener("pageshow", () => probeIfActive("pageshow_probe"));
    window.addEventListener("popstate", () => probeIfActive("popstate_probe"));
    window.addEventListener("hashchange", () => probeIfActive("hashchange_probe"));
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) probeIfActive("visibility_probe");
    });
    probeIfActive("bootstrap_probe");
  }

  function normalizeCustomFieldValue(value) {
    if (value == null) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
    return "";
  }

  function findCustomFieldValue(customFields, fieldId) {
    const target = String(fieldId || "");
    if (!target) return "";
    if (!Array.isArray(customFields)) return "";
    for (const field of customFields) {
      if (!field || typeof field !== "object") continue;
      const id = field.id ?? field.field_id ?? field.custom_field_id;
      if (id == null) continue;
      if (String(id) !== target) continue;
      const value = normalizeCustomFieldValue(field.value ?? field.raw_value ?? field.default_value);
      if (value) return value;
    }
    return "";
  }

  function extractJiraIssueKey(row) {
    if (!row || typeof row !== "object") return "";
    const fromCustomFields = findCustomFieldValue(row.custom_fields, JIRA_ENG_TICKET_FIELD_ID);
    if (fromCustomFields) return fromCustomFields;
    const fields = row.fields;
    if (fields && typeof fields === "object") {
      const direct = fields[JIRA_ENG_TICKET_FIELD_ID] ?? fields[Number(JIRA_ENG_TICKET_FIELD_ID)];
      return normalizeCustomFieldValue(direct);
    }
    return "";
  }

  function buildJiraIssueUrl(issueKey) {
    const key = normalizeCustomFieldValue(issueKey);
    if (!key) return "";
    if (/^https?:\/\//i.test(key)) return key;
    return JIRA_BROWSE_URL_PREFIX + encodeURIComponent(key);
  }

  function normalizeEmailAddress(value) {
    const raw = String(value == null ? "" : value).trim();
    if (!raw) return "";
    const match = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return match ? String(match[0]).toLowerCase() : "";
  }

  function extractTicketAssigneeName(row) {
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

  function extractTicketRequesterName(row) {
    const source = row && typeof row === "object" ? row : {};
    const nestedRequester = source.requester && typeof source.requester === "object" ? source.requester : null;
    const candidates = [
      source.requester_name,
      source.requesterName,
      nestedRequester && nestedRequester.name,
      nestedRequester && nestedRequester.display_name
    ];
    for (let i = 0; i < candidates.length; i += 1) {
      const value = String(candidates[i] == null ? "" : candidates[i]).replace(/\s+/g, " ").trim();
      if (value) return value;
    }
    return "";
  }

  function extractTicketRequesterEmail(row) {
    const source = row && typeof row === "object" ? row : {};
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

  function normalizeTicket(row) {
    const id = row && row.id != null ? row.id : "";
    const jiraIssueKey = extractJiraIssueKey(row);
    const assigneeName = extractTicketAssigneeName(row);
    const requesterName = extractTicketRequesterName(row);
    const requesterEmail = extractTicketRequesterEmail(row);
    return {
      id,
      subject: (row && row.subject) || "",
      status: (row && row.status) || "",
      priority: (row && row.priority) || "",
      created_at: (row && row.created_at) || "",
      updated_at: (row && row.updated_at) || "",
      url: id ? TICKET_URL_PREFIX + id : "",
      assignee_name: assigneeName,
      owner_name: assigneeName,
      requester_name: requesterName,
      requester_email: requesterEmail,
      jira_issue_key: jiraIssueKey,
      jira_url: buildJiraIssueUrl(jiraIssueKey)
    };
  }

  /** Keep active + solved tickets, but never include closed tickets anywhere in ZIP. */
  const NON_CLOSED_STATUS_QUERY = " status:new status:open status:pending status:hold status:solved";
  const MAX_SEARCH_TICKET_PAGES = 10;
  const MAX_VIEW_TICKET_PAGES = 10;

  function isClosedStatus(status) {
    return String(status || "").trim().toLowerCase() === "closed";
  }

  function includeTicketByStatus(row) {
    const status = row && row.status != null ? row.status : "";
    return !isClosedStatus(status);
  }

  function normalizeTicketId(value) {
    if (value == null) return "";
    return String(value).trim();
  }

  function isInactiveOrHiddenEntity(entity) {
    if (!entity || typeof entity !== "object") return false;
    if (entity.active === false || entity.is_active === false) return true;
    if (entity.deleted === true || entity.is_deleted === true) return true;
    if (entity.suspended === true || entity.is_suspended === true) return true;
    if (entity.hidden === true || entity.is_hidden === true) return true;
    if (entity.deleted_at != null) return true;
    return false;
  }

  async function loadTickets(userId) {
    const assigneeId = String(userId || "").trim();
    if (!assigneeId) return { tickets: [] };
    return loadTicketsByAssigneeId(assigneeId);
  }

  async function loadTicketsByOrg(orgId) {
    if (!orgId) return { tickets: [] };
    const query = "type:ticket organization_id:" + orgId + NON_CLOSED_STATUS_QUERY;
    return searchTickets(query);
  }

  async function searchTickets(query) {
    let nextUrl = BASE + "/api/v2/search.json?query=" + encodeURIComponent(query);
    const all = [];
    const seenTicketIds = new Set();
    let pages = 0;
    const maxPages = MAX_SEARCH_TICKET_PAGES;
    while (nextUrl && pages < maxPages) {
      pages += 1;
      const res = await fetchJson(nextUrl);
      if (res.status === 401 || res.status === 403) {
        return { error: "Session expired", tickets: [] };
      }
      if (!res.ok || !res.payload) {
        return { error: "Ticket search failed (HTTP " + res.status + ")", tickets: [] };
      }
      const rows = Array.isArray(res.payload.results) ? res.payload.results : [];
      rows.forEach((raw) => {
        const type = String((raw && raw.result_type) || "").toLowerCase();
        if (type && type !== "ticket") return;
        if (!includeTicketByStatus(raw)) return;
        const normalized = normalizeTicket(raw || {});
        const ticketId = normalizeTicketId(normalized.id);
        if (!ticketId || seenTicketIds.has(ticketId)) return;
        seenTicketIds.add(ticketId);
        all.push(normalized);
      });
      nextUrl = res.payload.next_page || null;
    }
    return { tickets: all };
  }

  function parseSearchCount(payload) {
    if (!payload || typeof payload !== "object") return null;
    const container = (payload.count && typeof payload.count === "object")
      ? payload.count
      : payload;
    const raw = container.value != null
      ? container.value
      : container.count != null
        ? container.count
        : container.total;
    if (raw == null) return null;
    const num = Number(raw);
    if (!Number.isFinite(num)) return null;
    return Math.max(0, Math.trunc(num));
  }

  async function searchTicketsCount(query) {
    const url = BASE + "/api/v2/search/count.json?query=" + encodeURIComponent(query);
    const res = await fetchJson(url);
    if (res.status === 401 || res.status === 403) {
      return { error: "Session expired", count: 0 };
    }
    if (!res.ok || !res.payload) {
      return { error: "Search count failed (HTTP " + res.status + ")", count: 0 };
    }
    const count = parseSearchCount(res.payload);
    return { count: count == null ? 0 : count };
  }

  async function loadOrganizations() {
    const list = [];
    const seen = new Set();
    let nextUrl = BASE + "/api/v2/organizations.json";
    let pages = 0;
    const maxPages = 10;
    while (nextUrl && pages < maxPages) {
      pages += 1;
      const res = await fetchJson(nextUrl);
      if (res.status === 401 || res.status === 403) {
        return { error: "Session expired", organizations: [] };
      }
      if (!res.ok || !res.payload) {
        return { error: "Organizations failed (HTTP " + res.status + ")", organizations: [] };
      }
      const orgs = Array.isArray(res.payload.organizations) ? res.payload.organizations : [];
      orgs.forEach((o) => {
        if (!o || o.id == null || isInactiveOrHiddenEntity(o)) return;
        const id = String(o.id);
        if (seen.has(id)) return;
        seen.add(id);
        list.push({ id, name: (o.name || "").trim() || "Org " + o.id });
      });
      nextUrl = res.payload.next_page || null;
    }
    list.sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" }));
    return { organizations: list };
  }

  async function loadViews() {
    const list = [];
    const seen = new Set();
    let nextUrl = BASE + "/api/v2/views.json?active=true";
    let pages = 0;
    const maxPages = 15;
    while (nextUrl && pages < maxPages) {
      pages += 1;
      const res = await fetchJson(nextUrl);
      if (res.status === 401 || res.status === 403) {
        return { error: "Session expired", views: [] };
      }
      if (!res.ok || !res.payload) {
        return { error: "Views failed (HTTP " + res.status + ")", views: [] };
      }
      const views = Array.isArray(res.payload.views) ? res.payload.views : [];
      views.forEach((v) => {
        if (!v || v.id == null || isInactiveOrHiddenEntity(v)) return;
        const id = String(v.id);
        if (seen.has(id)) return;
        seen.add(id);
        list.push({ id, title: (v.title || "").trim() || "View " + v.id });
      });
      nextUrl = res.payload.next_page || null;
    }
    list.sort((a, b) => String(a.title).localeCompare(String(b.title), undefined, { sensitivity: "base" }));
    return { views: list };
  }

  function parseViewCount(payload) {
    if (!payload || typeof payload !== "object") return null;
    const container = (payload.view_count && typeof payload.view_count === "object")
      ? payload.view_count
      : payload;
    const raw = container.value != null ? container.value : container.count;
    if (raw == null) return null;
    const num = Number(raw);
    if (!Number.isFinite(num)) return null;
    return Math.max(0, Math.trunc(num));
  }

  function parseViewCountsMany(payload) {
    const countsById = Object.create(null);
    if (!payload || typeof payload !== "object") return countsById;
    const rows = Array.isArray(payload.view_counts)
      ? payload.view_counts
      : Array.isArray(payload.counts)
        ? payload.counts
        : Array.isArray(payload.views)
          ? payload.views
          : [];
    rows.forEach((row) => {
      if (!row || typeof row !== "object") return;
      const idRaw = row.id ?? row.view_id ?? (row.view && row.view.id);
      if (idRaw == null) return;
      const id = String(idRaw);
      const raw = row.value != null
        ? row.value
        : row.count != null
          ? row.count
          : row.ticket_count != null
            ? row.ticket_count
            : row.total;
      const count = Number(raw);
      if (!Number.isFinite(count)) return;
      countsById[id] = Math.max(0, Math.trunc(count));
    });
    return countsById;
  }

  async function loadViewCount(viewId) {
    if (!viewId) return { viewId: "", count: null };
    const id = String(viewId);
    const url = BASE + "/api/v2/views/" + encodeURIComponent(id) + "/count.json";
    const res = await fetchJson(url);
    if (res.status === 401 || res.status === 403) {
      return { viewId: id, error: "Session expired", count: null };
    }
    if (!res.ok || !res.payload) {
      return { viewId: id, error: "View count failed (HTTP " + res.status + ")", count: null };
    }
    return { viewId: id, count: parseViewCount(res.payload) };
  }

  async function loadViewCountsMany(viewIds) {
    const ids = (Array.isArray(viewIds) ? viewIds : [])
      .map((id) => String(id || "").trim())
      .filter(Boolean);
    if (!ids.length) return { countsById: {} };
    const uniqueIds = Array.from(new Set(ids));
    const chunkSize = 100;
    const allCounts = Object.create(null);
    for (let i = 0; i < uniqueIds.length; i += chunkSize) {
      const chunk = uniqueIds.slice(i, i + chunkSize);
      const url = BASE + "/api/v2/views/count_many.json?ids=" + encodeURIComponent(chunk.join(","));
      const res = await fetchJson(url);
      if (res.status === 401 || res.status === 403) {
        return { error: "Session expired", countsById: allCounts };
      }
      if (!res.ok || !res.payload) {
        return { error: "View counts failed (HTTP " + res.status + ")", countsById: allCounts };
      }
      const parsed = parseViewCountsMany(res.payload);
      chunk.forEach((id) => {
        allCounts[id] = parsed[id] != null ? parsed[id] : 0;
      });
    }
    return { countsById: allCounts };
  }

  async function loadOrganizationCount(orgId) {
    if (!orgId) return { orgId: "", count: null };
    const id = String(orgId);
    const query = "type:ticket organization_id:" + id + NON_CLOSED_STATUS_QUERY;
    const result = await searchTicketsCount(query);
    return { orgId: id, count: result.count || 0, error: result.error };
  }

  async function loadTicketsByView(viewId) {
    if (!viewId) return { tickets: [] };
    const all = [];
    const seenTicketIds = new Set();
    let nextUrl = BASE + "/api/v2/views/" + encodeURIComponent(viewId) + "/tickets.json";
    let pages = 0;
    const maxPages = MAX_VIEW_TICKET_PAGES;
    while (nextUrl && pages < maxPages) {
      pages += 1;
      const res = await fetchJson(nextUrl);
      if (res.status === 401 || res.status === 403) {
        return { error: "Session expired", tickets: [] };
      }
      if (!res.ok || !res.payload) {
        return { error: "View tickets failed (HTTP " + res.status + ")", tickets: [] };
      }
      const rows = Array.isArray(res.payload.tickets) ? res.payload.tickets : [];
      rows.forEach((row) => {
        if (!includeTicketByStatus(row)) return;
        const normalized = normalizeTicket(row || {});
        const ticketId = normalizeTicketId(normalized.id);
        if (!ticketId || seenTicketIds.has(ticketId)) return;
        seenTicketIds.add(ticketId);
        all.push(normalized);
      });
      nextUrl = res.payload.next_page || null;
    }
    return { tickets: all };
  }

  /** GET /api/v2/groups/assignable – list all assignable groups (for By Group dropdown). */
  async function loadAssignableGroups() {
    const list = [];
    const seen = new Set();
    let nextUrl = BASE + "/api/v2/groups/assignable.json?exclude_deleted=true";
    let pages = 0;
    const maxPages = 20;
    while (nextUrl && pages < maxPages) {
      pages += 1;
      const res = await fetchJson(nextUrl);
      if (res.status === 401 || res.status === 403) {
        return { error: "Session expired", groups: [] };
      }
      if (!res.ok || !res.payload) {
        return { error: "Assignable groups failed (HTTP " + res.status + ")", groups: [] };
      }
      const raw = res.payload.groups || [];
      (Array.isArray(raw) ? raw : []).forEach((g) => {
        if (!g || g.id == null || isInactiveOrHiddenEntity(g)) return;
        const id = String(g.id);
        if (seen.has(id)) return;
        seen.add(id);
        list.push({ id, name: (g.name || "").trim() || "Group " + g.id });
      });
      nextUrl = res.payload.next_page || null;
    }
    list.sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" }));
    return { groups: list };
  }

  /** GET /api/lotus/assignables/groups/{group_id}/agents.json – agents in one group. */
  async function loadGroupAgents(groupId) {
    if (!groupId) return { agents: [] };
    const url = BASE + "/api/lotus/assignables/groups/" + encodeURIComponent(String(groupId)) + "/agents.json";
    const res = await fetchJson(url);
    if (res.status === 401 || res.status === 403) {
      return { error: "Session expired", agents: [] };
    }
    if (!res.ok || !res.payload) {
      return { error: "Group agents failed (HTTP " + res.status + ")", agents: [] };
    }
    const raw = res.payload.agents || res.payload.assignable_agents || res.payload.users || [];
    const list = Array.isArray(raw) ? raw : [];
    const agents = [];
    const seen = new Set();
    list.forEach((a) => {
      if (!a) return;
      const id = a.id ?? a.user_id ?? a.agent_id;
      if (id == null) return;
      const user = a.user && typeof a.user === "object" ? a.user : null;
      if (isInactiveOrHiddenEntity(a) || isInactiveOrHiddenEntity(user)) return;
      const sid = String(id);
      if (seen.has(sid)) return;
      seen.add(sid);
      const name = (a.name || a.display_name || (a.user && a.user.name) || "").trim() || "Agent " + id;
      agents.push({ id: sid, name });
    });
    agents.sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" }));
    return { agents };
  }

  /** All assignable groups + members for each. Dataset 1: groups. Dataset 2: agents per group. */
  async function loadAllGroupsWithMembers() {
    const groupsRes = await loadAssignableGroups();
    if (groupsRes.error || !groupsRes.groups || !groupsRes.groups.length) {
      return { error: groupsRes.error || "No groups", groupsWithMembers: [] };
    }
    const groups = groupsRes.groups.slice();
    const groupsWithMembers = new Array(groups.length);
    const maxConcurrent = 8;
    let nextIndex = 0;
    const worker = async () => {
      while (nextIndex < groups.length) {
        const idx = nextIndex;
        nextIndex += 1;
        const group = groups[idx];
        const agentsRes = await loadGroupAgents(group.id);
        const agents = agentsRes.agents || [];
        groupsWithMembers[idx] = { group: { id: group.id, name: group.name }, agents };
      }
    };
    const workers = [];
    for (let i = 0; i < Math.min(maxConcurrent, groups.length); i += 1) workers.push(worker());
    await Promise.all(workers);
    return { groupsWithMembers };
  }

  /** Search API: tickets in group (assignee group), with closed excluded. */
  async function loadTicketsByGroupId(groupId) {
    if (!groupId) return { tickets: [] };
    const query = "type:ticket group_id:" + String(groupId) + NON_CLOSED_STATUS_QUERY;
    return searchTickets(query);
  }

  async function loadGroupTicketCount(groupId) {
    if (!groupId) return { groupId: "", count: 0 };
    const id = String(groupId);
    const query = "type:ticket group_id:" + id + NON_CLOSED_STATUS_QUERY;
    const result = await searchTicketsCount(query);
    return { groupId: id, count: result.count || 0, error: result.error };
  }

  /** Search API: tickets by assignee_id (closed excluded). Replaces /users/{id}/tickets/assigned. */
  async function loadTicketsByAssigneeId(userId) {
    if (!userId) return { tickets: [] };
    const query = "type:ticket assignee_id:" + String(userId) + NON_CLOSED_STATUS_QUERY;
    return searchTickets(query);
  }

  async function loadAssigneeTicketCount(userId) {
    if (!userId) return { userId: "", count: 0 };
    const id = String(userId);
    const query = "type:ticket assignee_id:" + id + NON_CLOSED_STATUS_QUERY;
    const result = await searchTicketsCount(query);
    return { userId: id, count: result.count || 0, error: result.error };
  }

  function isSlackHostname(hostname) {
    const value = String(hostname || "").trim().toLowerCase();
    return value === "slack.com" || value.endsWith(".slack.com");
  }

  function isSlackWorkspaceHostname(hostname) {
    const value = String(hostname || "").trim().toLowerCase();
    return value.endsWith(".slack.com");
  }

  function isSlackAuthPath(pathname) {
    const path = String(pathname || "").trim().toLowerCase();
    if (!path) return false;
    return path.startsWith("/openid/")
      || path.startsWith("/signin")
      || path.startsWith("/oauth/")
      || path.startsWith("/auth/")
      || path.includes("/ssb/redirect");
  }

  function isSlackPage() {
    return typeof window !== "undefined"
      && window.location
      && isSlackWorkspaceHostname(window.location.hostname)
      && !isSlackAuthPath(window.location.pathname);
  }

  function normalizeSlackWorkspaceOrigin(value) {
    const raw = String(value || "").trim();
    if (raw) {
      try {
        const parsed = new URL(raw);
        if (parsed.protocol === "https:" && isSlackWorkspaceHostname(parsed.hostname)) {
          return parsed.origin;
        }
      } catch (_) {}
    }
    if (typeof window !== "undefined" && window.location && isSlackWorkspaceHostname(window.location.hostname)) {
      return window.location.origin;
    }
    return SLACK_DEFAULT_WORKSPACE_ORIGIN;
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

  function extractXoxcToken(value) {
    const text = String(value == null ? "" : value);
    const match = text.match(/xox[a-z]-[A-Za-z0-9-]+/i);
    return match ? match[0] : "";
  }

  function cacheSlackCapturedToken(token) {
    const normalized = extractXoxcToken(token);
    if (!normalized) return "";
    slackCapturedToken = normalized;
    return normalized;
  }

  function readCapturedSlackToken() {
    const cached = extractXoxcToken(slackCapturedToken);
    if (cached) {
      slackCapturedToken = cached;
      return cached;
    }
    return "";
  }

  function installSlackTokenBridgeListener() {
    if (slackTokenBridgeListenerInstalled || typeof window === "undefined") return;
    slackTokenBridgeListenerInstalled = true;

    window.addEventListener("message", (event) => {
      try {
        if (!event || event.source !== window) return;
        const data = event.data;
        if (!data || typeof data !== "object" || data.type !== SLACK_BRIDGE_MESSAGE_TYPE) return;
        cacheSlackCapturedToken(data.token || data.value || "");
      } catch (_) {}
    });

    window.addEventListener(SLACK_BRIDGE_EVENT_NAME, (event) => {
      try {
        const detail = event && event.detail && typeof event.detail === "object" ? event.detail : null;
        if (!detail) return;
        cacheSlackCapturedToken(detail.token || detail.value || "");
      } catch (_) {}
    });
  }

  function ensureSlackTokenBridgeInstalled() {
    if (!isSlackPage()) return;
    installSlackTokenBridgeListener();
    if (slackTokenBridgeInstalled) return;

    try {
      const existingScript = document.getElementById(SLACK_TOKEN_BRIDGE_SCRIPT_ID);
      if (existingScript) {
        slackTokenBridgeInstalled = true;
        return;
      }

      const script = document.createElement("script");
      script.id = SLACK_TOKEN_BRIDGE_SCRIPT_ID;
      script.src = chrome.runtime.getURL(SLACK_TOKEN_BRIDGE_SCRIPT_PATH);
      script.async = false;
      script.dataset.eventName = SLACK_BRIDGE_EVENT_NAME;
      script.dataset.messageType = SLACK_BRIDGE_MESSAGE_TYPE;
      script.onload = () => {
        slackTokenBridgeInstalled = true;
        script.dataset.loaded = "true";
      };
      script.onerror = () => {
        slackTokenBridgeInstalled = false;
        try { script.remove(); } catch (_) {}
      };

      const parent = document.documentElement || document.head || document.body;
      if (!parent) throw new Error("Missing document root");
      parent.appendChild(script);
      slackTokenBridgeInstalled = true;
    } catch (_) {
      slackTokenBridgeInstalled = false;
    }
  }

  function parseJsonMaybe(value) {
    if (value == null) return null;
    if (typeof value === "object") return value;
    const text = String(value || "").trim();
    if (!text) return null;
    if (text[0] !== "{" && text[0] !== "[") return null;
    try {
      return JSON.parse(text);
    } catch (_) {
      return null;
    }
  }

  function findSlackTokenInValue(value, depth, seen) {
    if (depth > 4 || value == null) return "";
    if (typeof value === "string") {
      const direct = extractXoxcToken(value);
      if (direct) return direct;
      const parsed = parseJsonMaybe(value);
      if (parsed && typeof parsed === "object") {
        return findSlackTokenInValue(parsed, depth + 1, seen);
      }
      return "";
    }
    if (typeof value !== "object") return "";
    if (seen.has(value)) return "";
    seen.add(value);

    if (Array.isArray(value)) {
      const limit = Math.min(value.length, 60);
      for (let i = 0; i < limit; i += 1) {
        const token = findSlackTokenInValue(value[i], depth + 1, seen);
        if (token) return token;
      }
      return "";
    }

    const keyPriority = ["api_token", "token", "enterprise_token", "xoxc", "xoxc_token", "user_token"];
    for (let i = 0; i < keyPriority.length; i += 1) {
      const key = keyPriority[i];
      if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
      const token = findSlackTokenInValue(value[key], depth + 1, seen);
      if (token) return token;
    }

    const keys = Object.keys(value);
    const limit = Math.min(keys.length, 80);
    for (let i = 0; i < limit; i += 1) {
      const key = keys[i];
      const token = findSlackTokenInValue(value[key], depth + 1, seen);
      if (token) return token;
    }
    return "";
  }

  function findSlackTokenInGlobals() {
    if (typeof window === "undefined") return "";
    const globals = [];
    try { globals.push(window.boot_data); } catch (_) {}
    try { globals.push(window.__BOOT_DATA__); } catch (_) {}
    try { globals.push(window.TS); } catch (_) {}
    try { globals.push(window.TS && window.TS.boot_data); } catch (_) {}
    try { globals.push(window.TS && window.TS.model); } catch (_) {}
    try { globals.push(window.__INITIAL_STATE__); } catch (_) {}
    try { globals.push(window.__STATE__); } catch (_) {}

    for (let i = 0; i < globals.length; i += 1) {
      const token = findSlackTokenInValue(globals[i], 0, new WeakSet());
      if (token) return token;
    }
    return "";
  }

  function scoreStorageKey(key) {
    const value = String(key || "").toLowerCase();
    if (!value) return 0;
    if (value.includes("api_token")) return 10;
    if (value.includes("token")) return 8;
    if (value.includes("localconfig")) return 7;
    if (value.includes("boot")) return 5;
    if (value.includes("auth")) return 4;
    return 1;
  }

  function findSlackTokenInStorage(storage) {
    if (!storage || typeof storage.length !== "number") return "";
    const keys = [];
    const count = Math.min(storage.length, 250);
    for (let i = 0; i < count; i += 1) {
      try {
        const key = storage.key(i);
        if (key) keys.push(String(key));
      } catch (_) {}
    }
    keys.sort((a, b) => scoreStorageKey(b) - scoreStorageKey(a));
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      let raw = "";
      try {
        raw = String(storage.getItem(key) || "");
      } catch (_) {
        continue;
      }
      const token = findSlackTokenInValue(raw, 0, new WeakSet());
      if (token) return token;
    }
    return "";
  }

  function resolveSlackApiToken() {
    ensureSlackTokenBridgeInstalled();

    const captured = readCapturedSlackToken();
    if (captured) return captured;

    const fromGlobals = findSlackTokenInGlobals();
    if (fromGlobals) return cacheSlackCapturedToken(fromGlobals);
    try {
      const fromLocalStorage = findSlackTokenInStorage(window.localStorage);
      if (fromLocalStorage) return cacheSlackCapturedToken(fromLocalStorage);
    } catch (_) {}
    try {
      const fromSessionStorage = findSlackTokenInStorage(window.sessionStorage);
      if (fromSessionStorage) return cacheSlackCapturedToken(fromSessionStorage);
    } catch (_) {}
    return "";
  }

  function appendSlackFormField(formData, key, value) {
    if (!formData || !key) return;
    if (value == null) return;
    if (typeof value === "string") {
      formData.append(key, value);
      return;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      formData.append(key, String(value));
      return;
    }
    try {
      formData.append(key, JSON.stringify(value));
    } catch (_) {
      formData.append(key, String(value));
    }
  }

  async function parseSlackApiResponse(response) {
    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch (_) {}
    return { text, payload };
  }

  function getSlackApiError(payload, text, fallback) {
    const message = payload && typeof payload === "object"
      ? (payload.error || payload.message || payload.detail || payload.warning || "")
      : "";
    const normalized = String(message || text || fallback || "Slack API request failed").trim();
    return normalized || "Slack API request failed";
  }

  async function postSlackApi(workspaceOrigin, endpointPath, fields) {
    const origin = normalizeSlackWorkspaceOrigin(workspaceOrigin);
    if (!origin) {
      return { ok: false, error: "Invalid Slack workspace origin." };
    }
    let parsedOrigin = null;
    try {
      parsedOrigin = new URL(origin);
    } catch (_) {
      return { ok: false, error: "Invalid Slack workspace origin." };
    }
    if (!isSlackWorkspaceHostname(parsedOrigin.hostname)) {
      return { ok: false, error: "Invalid Slack workspace origin." };
    }

    const token = resolveSlackApiToken();
    if (!token) {
      return { ok: false, error: "No Slack web session token found. Open Slack and complete login first." };
    }
    cacheSlackCapturedToken(token);

    const path = String(endpointPath || "").startsWith("/") ? String(endpointPath) : ("/" + String(endpointPath || ""));
    const body = fields && typeof fields === "object" ? fields : {};
    const buildFormData = () => {
      const formData = new FormData();
      appendSlackFormField(formData, "token", token);
      const keys = Object.keys(body);
      for (let i = 0; i < keys.length; i += 1) {
        appendSlackFormField(formData, keys[i], body[keys[i]]);
      }
      if (!Object.prototype.hasOwnProperty.call(body, "_x_mode")) {
        appendSlackFormField(formData, "_x_mode", "online");
      }
      if (!Object.prototype.hasOwnProperty.call(body, "_x_sonic")) {
        appendSlackFormField(formData, "_x_sonic", "true");
      }
      if (!Object.prototype.hasOwnProperty.call(body, "_x_app_name")) {
        appendSlackFormField(formData, "_x_app_name", "client");
      }
      return formData;
    };

    const candidateOrigins = [];
    const pushOrigin = (value) => {
      const normalized = normalizeSlackWorkspaceOrigin(value);
      if (!normalized) return;
      if (!candidateOrigins.includes(normalized)) candidateOrigins.push(normalized);
    };
    pushOrigin(origin);
    if (typeof window !== "undefined" && window.location && window.location.origin) {
      pushOrigin(window.location.origin);
    }

    let lastFailure = null;
    for (let i = 0; i < candidateOrigins.length; i += 1) {
      const candidateOrigin = candidateOrigins[i];
      const url = new URL(path, candidateOrigin).toString();
      try {
        const response = await fetch(url, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
          body: buildFormData()
        });

        const parsed = await parseSlackApiResponse(response);
        const payload = parsed.payload && typeof parsed.payload === "object" ? parsed.payload : null;
        const payloadOk = payload ? payload.ok !== false : false;
        if (response.ok && payloadOk) {
          return {
            ok: true,
            status: response.status,
            payload,
            rawText: parsed.text
          };
        }

        lastFailure = {
          ok: false,
          status: response.status,
          error: getSlackApiError(payload, parsed.text, "Slack API request failed."),
          payload: payload || {},
          rawText: parsed.text
        };
      } catch (err) {
        lastFailure = {
          ok: false,
          error: err && err.message ? err.message : "Slack API request failed."
        };
      }
      if (i < candidateOrigins.length - 1) continue;
    }

    return lastFailure || { ok: false, error: "Slack API request failed." };
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
      if (Array.isArray(node.elements)) {
        extractRichTextElementsPlain(node.elements, out);
      }
      if (Array.isArray(node.items)) {
        extractRichTextElementsPlain(node.items, out);
      }
    }
    return out;
  }

  function extractSlackBlocksText(blocks) {
    const rows = Array.isArray(blocks) ? blocks : [];
    const parts = [];
    for (let i = 0; i < rows.length; i += 1) {
      const block = rows[i];
      if (!block || typeof block !== "object") continue;
      if (Array.isArray(block.elements)) {
        extractRichTextElementsPlain(block.elements, parts);
      }
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
      parts.push(url ? (name + ": " + url) : name);
    }

    return parts.join("\n\n").trim();
  }

  function isSingularityMessage(message, options) {
    if (!message || typeof message !== "object") return false;
    const opts = options && typeof options === "object" ? options : {};
    const singularityUserId = String(opts.singularityUserId || "").trim();
    const messageUserId = String(message.user || "").trim();
    if (singularityUserId && messageUserId && messageUserId === singularityUserId) return true;

    const singularityNamePattern = String(opts.singularityNamePattern || "singularity").trim().toLowerCase();
    const botProfile = message.bot_profile && typeof message.bot_profile === "object" ? message.bot_profile : null;
    const profile = message.user_profile && typeof message.user_profile === "object" ? message.user_profile : null;
    const identityBlob = [
      message.username,
      botProfile && botProfile.name,
      botProfile && botProfile.app_name,
      profile && profile.display_name,
      profile && profile.real_name
    ].map((value) => String(value || "").trim().toLowerCase()).join(" ");
    if (!identityBlob) return false;
    if (!singularityNamePattern) return false;
    return identityBlob.includes(singularityNamePattern);
  }

  function hasSlackFinalMarker(message, markerRegexText) {
    const markerSource = String(markerRegexText || SLACK_DEFAULT_FINAL_MARKER_REGEX).trim();
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

  function hasSingularityCompletionFooterText(value) {
    const text = String(value || "").replace(/\r\n?/g, "\n").trim().toLowerCase();
    if (!text) return false;
    if (text.includes("how helpful was this answer")) return true;
    if (text.includes("ai generated content. check important info for mistakes")) return true;
    if (text.includes("if you have any more questions, just tag me in this thread")) return true;
    if (text.includes("sources:")) return true;
    return false;
  }

  function hasSlackSourcesFooterText(value) {
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

  function normalizeSlackTextForDedup(value) {
    return String(value || "")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .toLowerCase();
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

  function isSingularityAckMessageText(value) {
    const text = normalizeSlackTextForDedup(value);
    if (!text) return false;
    if (text.length > 420) return false;
    const ackHints = [
      "processing your request",
      "working on your request",
      "just a moment",
      "please wait",
      "i'm thinking",
      "im thinking",
      "thinking..."
    ];
    for (let i = 0; i < ackHints.length; i += 1) {
      if (text.includes(ackHints[i])) return true;
    }
    return false;
  }

  async function slackConversationsMark(workspaceOrigin, channelId, ts, reason) {
    if (!channelId || !ts) return { ok: false };
    return postSlackApi(workspaceOrigin, "/api/conversations.mark", {
      channel: channelId,
      ts,
      _x_reason: reason || "viewed"
    });
  }

  async function slackThreadMark(workspaceOrigin, channelId, threadTs, ts, read) {
    if (!channelId || !threadTs || !ts) return { ok: false };
    return postSlackApi(workspaceOrigin, "/api/subscriptions.thread.mark", {
      channel: channelId,
      thread_ts: threadTs,
      ts,
      read: read ? "true" : "false",
      _x_reason: "marking-thread"
    });
  }

  async function markSlackMessageUnread(workspaceOrigin, channelId, messageTs, reasonPrefix) {
    const targetChannel = String(channelId || "").trim();
    const targetTs = String(messageTs || "").trim();
    if (!targetChannel || !targetTs) return false;

    const reasonBase = String(reasonPrefix || "zip-slack-mark-unread").trim() || "zip-slack-mark-unread";
    const delays = [0, 260, 840];
    for (let pass = 0; pass < delays.length; pass += 1) {
      if (delays[pass] > 0) await waitMs(delays[pass]);
      const priorTs = toPriorSlackTs(targetTs);
      const attempts = [];
      attempts.push(() => slackConversationsMark(
        workspaceOrigin,
        targetChannel,
        priorTs,
        reasonBase + "-mark-prior"
      ));
      if (priorTs !== "0.000000") {
        attempts.push(() => slackConversationsMark(
          workspaceOrigin,
          targetChannel,
          "0.000000",
          reasonBase + "-mark-zero"
        ));
      }
      attempts.push(() => slackThreadMark(
        workspaceOrigin,
        targetChannel,
        targetTs,
        targetTs,
        false
      ));

      for (let i = 0; i < attempts.length; i += 1) {
        try {
          const result = await attempts[i]();
          if (result && result.ok) return true;
        } catch (_) {}
      }
    }
    return false;
  }

  function normalizeSlackTeamId(value) {
    const id = String(value || "").trim();
    if (!id) return "";
    return /^[TE][A-Z0-9]{8,}$/i.test(id) ? id : "";
  }

  function normalizeSlackUserId(value) {
    const id = String(value || "").trim();
    if (!id) return "";
    return /^[UW][A-Z0-9]{8,}$/i.test(id) ? id : "";
  }

  function normalizeSlackAvatarUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      const parsed = new URL(raw, String(window.location && window.location.origin || ""));
      const host = String(parsed.hostname || "").toLowerCase();
      if (
        host === "slack-edge.com"
        || host.endsWith(".slack-edge.com")
        || host === "slack.com"
        || host.endsWith(".slack.com")
      ) {
        return parsed.toString();
      }
    } catch (_) {}
    return "";
  }

  function pickSlackSessionUserName(candidate) {
    if (!candidate || typeof candidate !== "object") return "";
    const user = candidate.user && typeof candidate.user === "object" ? candidate.user : null;
    const profile = user && user.profile && typeof user.profile === "object" ? user.profile : null;
    const directProfile = candidate.profile && typeof candidate.profile === "object" ? candidate.profile : null;
    const values = [
      candidate.user_name,
      candidate.username,
      candidate.real_name,
      candidate.display_name,
      user && user.real_name,
      user && user.name,
      user && user.display_name,
      profile && profile.display_name_normalized,
      profile && profile.display_name,
      profile && profile.real_name_normalized,
      profile && profile.real_name,
      directProfile && directProfile.display_name_normalized,
      directProfile && directProfile.display_name,
      directProfile && directProfile.real_name_normalized,
      directProfile && directProfile.real_name
    ];
    for (let i = 0; i < values.length; i += 1) {
      const name = String(values[i] || "").trim();
      if (name) return name;
    }
    return "";
  }

  function pickSlackSessionAvatarUrl(candidate) {
    if (!candidate || typeof candidate !== "object") return "";
    const user = candidate.user && typeof candidate.user === "object" ? candidate.user : null;
    const profile = user && user.profile && typeof user.profile === "object" ? user.profile : null;
    const directProfile = candidate.profile && typeof candidate.profile === "object" ? candidate.profile : null;
    const values = [
      candidate.avatar_url,
      candidate.image_192,
      candidate.image_72,
      user && user.image_192,
      user && user.image_72,
      profile && profile.image_192,
      profile && profile.image_72,
      profile && profile.image_48,
      directProfile && directProfile.image_192,
      directProfile && directProfile.image_72,
      directProfile && directProfile.image_48
    ];
    for (let i = 0; i < values.length; i += 1) {
      const url = normalizeSlackAvatarUrl(values[i]);
      if (url) return url;
    }
    return "";
  }

  function extractSlackSessionIdentity() {
    let teamId = "";
    let userId = "";
    let userName = "";
    let avatarUrl = "";
    const assign = (candidate) => {
      if (!candidate || typeof candidate !== "object") return;
      if (!teamId) {
        teamId = normalizeSlackTeamId(
          candidate.team_id
          || candidate.teamId
          || (candidate.team && candidate.team.id)
          || (candidate.team && candidate.team.team_id)
          || candidate.enterprise_id
        );
      }
      if (!userId) {
        userId = normalizeSlackUserId(
          candidate.user_id
          || candidate.userId
          || (candidate.user && candidate.user.id)
          || (candidate.user && candidate.user.user_id)
          || candidate.id
        );
      }
      if (!userName) {
        userName = pickSlackSessionUserName(candidate);
      }
      if (!avatarUrl) {
        avatarUrl = pickSlackSessionAvatarUrl(candidate);
      }
    };

    try {
      const pathParts = String(window.location && window.location.pathname || "")
        .split("/")
        .filter(Boolean);
      if (!teamId && pathParts[0] === "client" && pathParts[1]) {
        teamId = normalizeSlackTeamId(pathParts[1]);
      }
    } catch (_) {}

    const candidates = [];
    try { candidates.push(window.boot_data); } catch (_) {}
    try { candidates.push(window.__BOOT_DATA__); } catch (_) {}
    try { candidates.push(window.TS); } catch (_) {}
    try { candidates.push(window.TS && window.TS.boot_data); } catch (_) {}
    try { candidates.push(window.TS && window.TS.model); } catch (_) {}
    try { candidates.push(window.__INITIAL_STATE__); } catch (_) {}
    for (let i = 0; i < candidates.length; i += 1) {
      assign(candidates[i]);
      if (teamId && userId) break;
    }

    return { teamId, userId, userName, avatarUrl };
  }

  function getSlackUserDisplayName(userPayload) {
    const user = userPayload && typeof userPayload === "object" ? userPayload : null;
    if (!user) return "";
    const profile = user.profile && typeof user.profile === "object" ? user.profile : null;
    const values = [
      profile && profile.display_name_normalized,
      profile && profile.display_name,
      profile && profile.real_name_normalized,
      profile && profile.real_name,
      user.real_name,
      user.name
    ];
    for (let i = 0; i < values.length; i += 1) {
      const name = String(values[i] || "").trim();
      if (name) return name;
    }
    return "";
  }

  function getSlackUserAvatar(userPayload) {
    const user = userPayload && typeof userPayload === "object" ? userPayload : null;
    if (!user) return "";
    const profile = user.profile && typeof user.profile === "object" ? user.profile : null;
    const values = [
      user.image_512,
      user.image_192,
      user.image_72,
      profile && profile.image_512,
      profile && profile.image_192,
      profile && profile.image_72,
      profile && profile.image_48
    ];
    for (let i = 0; i < values.length; i += 1) {
      const url = normalizeSlackAvatarUrl(values[i]);
      if (url) return url;
    }
    return "";
  }

  async function getSlackUserProfile(workspaceOrigin, userId) {
    const normalizedUserId = normalizeSlackUserId(userId);
    if (!normalizedUserId) return null;
    const info = await postSlackApi(workspaceOrigin, "/api/users.info", {
      user: normalizedUserId,
      _x_reason: "zip-auth-profile"
    });
    if (!info || !info.ok) return null;
    const payload = info.payload && typeof info.payload === "object" ? info.payload : null;
    const user = payload && payload.user && typeof payload.user === "object" ? payload.user : null;
    if (!user) return null;
    return {
      userName: getSlackUserDisplayName(user),
      avatarUrl: getSlackUserAvatar(user)
    };
  }

  async function slackAuthTestAction(inner) {
    if (!isSlackPage()) {
      return { ok: false, error: "Not a Slack tab. Open Slack login first." };
    }
    ensureSlackTokenBridgeInstalled();
    const workspaceOrigin = normalizeSlackWorkspaceOrigin(inner && inner.workspaceOrigin);
    const session = extractSlackSessionIdentity();
    const pathname = String(window.location && window.location.pathname || "").toLowerCase();
    const looksSignedIn = pathname.indexOf("/signin") === -1;
    const hasSessionSignals = !!(
      session.userId
      || session.teamId
      || (
        typeof window !== "undefined"
        && (
          window.boot_data
          || window.__BOOT_DATA__
          || (window.TS && (window.TS.boot_data || window.TS.model))
          || window.__INITIAL_STATE__
        )
      )
    );
    const token = resolveSlackApiToken();
    if (!token) {
      if (looksSignedIn && hasSessionSignals) {
        return {
          ok: true,
          ready: true,
          user_id: session.userId || "",
          team_id: session.teamId || "",
          user_name: session.userName || "",
          avatar_url: session.avatarUrl || "",
          workspace_origin: workspaceOrigin,
          session_only: true,
          warning: "Slack session detected; waiting for web token capture."
        };
      }
      return { ok: false, error: "Slack session token not found yet. Finish login in the adobedx.slack.com tab." };
    }
    const auth = await postSlackApi(workspaceOrigin, "/api/auth.test", {
      _x_reason: "zip-auth-test"
    });
    if (!auth.ok) {
      if (looksSignedIn && hasSessionSignals) {
        return {
          ok: true,
          ready: true,
          user_id: session.userId || "",
          team_id: session.teamId || "",
          user_name: session.userName || "",
          avatar_url: session.avatarUrl || "",
          workspace_origin: workspaceOrigin,
          session_token: token || "",
          warning: auth.error || "auth.test failed but Slack web session appears active."
        };
      }
      return auth;
    }
    const payload = auth.payload || {};
    const userId = String(payload.user_id || payload.user || session.userId || "").trim();
    const teamId = String(payload.team_id || payload.team || session.teamId || "").trim();
    let userName = String(session.userName || "").trim();
    let avatarUrl = String(session.avatarUrl || "").trim();
    const profile = await getSlackUserProfile(workspaceOrigin, userId).catch(() => null);
    if (profile) {
      if (!userName) userName = String(profile.userName || "").trim();
      if (!avatarUrl) avatarUrl = String(profile.avatarUrl || "").trim();
    }
    return {
      ok: true,
      user_id: userId,
      team_id: teamId,
      user_name: userName,
      avatar_url: avatarUrl,
      workspace_origin: workspaceOrigin,
      session_token: token || ""
    };
  }

  async function slackSendMarkdownToSelfAction(inner) {
    if (!isSlackPage()) {
      return { ok: false, error: "Not a Slack tab. Open Slack login first." };
    }
    ensureSlackTokenBridgeInstalled();
    const workspaceOrigin = normalizeSlackWorkspaceOrigin(inner && inner.workspaceOrigin);
    const markdownText = String((inner && (inner.markdownText || inner.text || inner.messageText)) || "").trim();
    if (!markdownText) {
      return { ok: false, error: "Slack message body is empty." };
    }
    const session = extractSlackSessionIdentity();
    let userId = normalizeSlackUserId((inner && (inner.userId || inner.user_id)) || session.userId);
    let teamId = normalizeSlackTeamId(session.teamId);
    let userName = String(session.userName || "").trim();
    let avatarUrl = String(session.avatarUrl || "").trim();

    const auth = await postSlackApi(workspaceOrigin, "/api/auth.test", {
      _x_reason: "zip-slack-it-to-me-auth"
    });
    if (!auth || !auth.ok) {
      return {
        ok: false,
        error: String((auth && auth.error) || "Slack session unavailable.")
      };
    }
    const authPayload = auth.payload && typeof auth.payload === "object" ? auth.payload : {};
    if (!userId) {
      userId = normalizeSlackUserId(authPayload.user_id || authPayload.user);
    }
    if (!teamId) {
      teamId = normalizeSlackTeamId(authPayload.team_id || authPayload.team);
    }
    if (!userId) {
      return { ok: false, error: "Unable to resolve Slack user identity for @ME delivery." };
    }

    const profile = await getSlackUserProfile(workspaceOrigin, userId).catch(() => null);
    if (profile) {
      if (!userName) userName = String(profile.userName || "").trim();
      if (!avatarUrl) avatarUrl = String(profile.avatarUrl || "").trim();
    }

    const dmOpen = await postSlackApi(workspaceOrigin, "/api/conversations.open", {
      users: userId,
      return_im: "true",
      _x_reason: "zip-open-self-dm"
    });
    if (!dmOpen || !dmOpen.ok) {
      return {
        ok: false,
        error: String((dmOpen && dmOpen.error) || "Unable to open Slack DM channel.")
      };
    }
    const dmPayload = dmOpen.payload && typeof dmOpen.payload === "object" ? dmOpen.payload : {};
    const dmChannel = dmPayload.channel && typeof dmPayload.channel === "object" ? dmPayload.channel : {};
    const channelId = String(dmChannel.id || dmPayload.channel_id || dmPayload.channel || "").trim();
    if (!channelId) {
      return { ok: false, error: "Unable to resolve Slack DM channel." };
    }

    const post = await postSlackApi(workspaceOrigin, "/api/chat.postMessage", {
      channel: channelId,
      text: markdownText,
      mrkdwn: "true",
      unfurl_links: "false",
      unfurl_media: "false",
      _x_reason: "zip-slack-it-to-me"
    });
    if (!post || !post.ok) {
      return {
        ok: false,
        error: String((post && post.error) || "Unable to send Slack DM.")
      };
    }
    const postPayload = post.payload && typeof post.payload === "object" ? post.payload : {};
    const postedTs = String(postPayload.ts || (postPayload.message && postPayload.message.ts) || "").trim();
    const unreadMarked = await markSlackMessageUnread(
      workspaceOrigin,
      channelId,
      postedTs,
      "zip-slack-it-to-me"
    );
    return {
      ok: true,
      channel: String(postPayload.channel || channelId || userId).trim(),
      ts: postedTs,
      user_id: userId,
      team_id: teamId,
      user_name: userName,
      avatar_url: avatarUrl,
      unread_marked: unreadMarked
    };
  }

  async function slackMarkUnreadAction(inner) {
    if (!isSlackPage()) {
      return { ok: false, error: "Not a Slack tab. Open Slack login first." };
    }
    ensureSlackTokenBridgeInstalled();
    const workspaceOrigin = normalizeSlackWorkspaceOrigin(inner && inner.workspaceOrigin);
    const channelId = String((inner && (inner.channelId || inner.channel_id || inner.channel)) || "").trim();
    const messageTs = String((inner && (inner.ts || inner.messageTs || inner.message_ts)) || "").trim();
    if (!channelId || !messageTs) {
      return { ok: false, error: "Slack unread marker requires channel and ts." };
    }
    const unreadMarked = await markSlackMessageUnread(
      workspaceOrigin,
      channelId,
      messageTs,
      "zip-slack-it-to-me-bg-fallback"
    );
    if (!unreadMarked) {
      return { ok: false, error: "Unable to mark Slack DM as unread." };
    }
    return {
      ok: true,
      channel: channelId,
      ts: messageTs,
      unread_marked: true
    };
  }

  async function slackSendToSingularityAction(inner) {
    if (!isSlackPage()) {
      return { ok: false, error: "Not a Slack tab. Open Slack login first." };
    }
    ensureSlackTokenBridgeInstalled();
    const workspaceOrigin = normalizeSlackWorkspaceOrigin(inner && inner.workspaceOrigin);
    const channelId = String((inner && (inner.channelId || inner.channel_id)) || "").trim();
    if (!channelId) {
      return { ok: false, error: "Slack channel ID is required." };
    }

    const singularityUserId = String((inner && inner.singularityUserId) || "").trim();
    const fallbackMention = String((inner && inner.mention) || "").trim();
    const question = String((inner && (inner.messageText || inner.text || inner.question)) || "").trim();
    if (!question) {
      return { ok: false, error: "Question text is empty." };
    }

    let bodyText = question;
    const singularityTag = singularityUserId ? ("<@" + singularityUserId + ">") : "";
    if (singularityTag && bodyText.startsWith(singularityTag)) {
      bodyText = bodyText.slice(singularityTag.length).trim();
    }
    if (fallbackMention && bodyText.startsWith(fallbackMention)) {
      bodyText = bodyText.slice(fallbackMention.length).trim();
    }
    const mentionPrefix = singularityTag || fallbackMention;
    const text = mentionPrefix ? (mentionPrefix + " " + bodyText).trim() : bodyText;
    const session = extractSlackSessionIdentity();
    const clientContextTeamId = normalizeSlackTeamId(
      (inner && (inner.teamId || inner.team_id))
      || session.teamId
    );
    const urlsForUnfurl = extractUrlsFromText(bodyText);
    const richTextBlocks = buildSingularityRichTextBlocks(singularityUserId, bodyText);
    const fields = {
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
    if (clientContextTeamId) fields.client_context_team_id = clientContextTeamId;
    if (richTextBlocks.length) fields.blocks = richTextBlocks;
    if (!richTextBlocks.length && text) fields.text = text;
    if (urlsForUnfurl.length) fields.unfurl = urlsForUnfurl.map((url) => ({ url }));

    const payload = await postSlackApi(workspaceOrigin, "/api/chat.postMessage", fields);
    if (!payload.ok) return payload;

    const slack = payload.payload || {};
    const messageTs = String(slack.ts || (slack.message && slack.message.ts) || "").trim();
    const postedChannel = String(slack.channel || channelId).trim();
    if (postedChannel && messageTs) {
      await slackConversationsMark(workspaceOrigin, postedChannel, messageTs, "viewed").catch(() => {});
    }

    return {
      ok: true,
      channel: postedChannel,
      ts: messageTs,
      parent_ts: messageTs,
      thread_ts: messageTs,
      message: slack.message || null
    };
  }

  async function slackPollSingularityThreadAction(inner) {
    if (!isSlackPage()) {
      return { ok: false, error: "Not a Slack tab. Open Slack login first." };
    }
    ensureSlackTokenBridgeInstalled();
    const workspaceOrigin = normalizeSlackWorkspaceOrigin(inner && inner.workspaceOrigin);
    const channelId = String((inner && (inner.channelId || inner.channel_id)) || "").trim();
    const parentTs = String((inner && (inner.parentTs || inner.parent_ts || inner.threadTs || inner.thread_ts)) || "").trim();
    if (!channelId || !parentTs) {
      return { ok: false, error: "Slack channel/thread metadata is required." };
    }

    const limitRaw = Number(inner && inner.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.trunc(limitRaw), 200) : 40;
    const cachedLatestUpdates = inner && inner.cached_latest_updates && typeof inner.cached_latest_updates === "object"
      ? inner.cached_latest_updates
      : inner && inner.cachedLatestUpdates && typeof inner.cachedLatestUpdates === "object"
        ? inner.cachedLatestUpdates
        : null;
    const repliesFields = {
      channel: channelId,
      ts: parentTs,
      inclusive: "true",
      oldest: parentTs,
      limit,
      _x_reason: "history-api/fetchReplies"
    };
    if (cachedLatestUpdates && Object.keys(cachedLatestUpdates).length) {
      repliesFields.cached_latest_updates = cachedLatestUpdates;
    }
    const repliesResponse = await postSlackApi(workspaceOrigin, "/api/conversations.replies", repliesFields);
    if (!repliesResponse.ok) return repliesResponse;

    const payload = repliesResponse.payload || {};
    const messages = Array.isArray(payload.messages) ? payload.messages.slice() : [];
    messages.sort((a, b) => slackTsToEpochMs(a && a.ts) - slackTsToEpochMs(b && b.ts));

    const singularityOptions = {
      singularityUserId: inner && inner.singularityUserId,
      singularityNamePattern: inner && inner.singularityNamePattern
    };
    const session = extractSlackSessionIdentity();
    const postingUserId = normalizeSlackUserId(session.userId);
    const explicitSingularityTarget = !!(
      normalizeSlackUserId(singularityOptions && singularityOptions.singularityUserId)
      || String(singularityOptions && singularityOptions.singularityNamePattern || "").trim()
    );
    const preferredReplies = [];
    const fallbackReplies = [];
    const nonSingularityMessages = [];
    for (let i = 0; i < messages.length; i += 1) {
      const message = messages[i];
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
        preferredReplies.push(message);
        continue;
      }
      if (fromPostingUser) continue;
      nonSingularityMessages.push(message);
      if (!explicitSingularityTarget) fallbackReplies.push(message);
    }
    const replyMessages = preferredReplies.length ? preferredReplies : fallbackReplies;

    const latestReply = replyMessages.length ? replyMessages[replyMessages.length - 1] : null;
    const finalMarkerRegex = String((inner && inner.finalMarkerRegex) || SLACK_DEFAULT_FINAL_MARKER_REGEX).trim();
    let finalReply = null;
    for (let i = replyMessages.length - 1; i >= 0; i -= 1) {
      const message = replyMessages[i];
      const messageText = extractSlackMessageText(message);
      if (
        hasSlackFinalMarker(message, finalMarkerRegex)
        || hasSingularityCompletionFooterText(messageText)
      ) {
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
      hasFinalMarker: hasSlackFinalMarker(message, finalMarkerRegex),
      hasCompletionFooter: hasSingularityCompletionFooterText(extractSlackMessageText(message)),
      isAck: isSingularityAckMessageText(extractSlackMessageText(message))
    })).filter((row) => row.ts || row.text);

    const dedupedReplyRows = [];
    const seenReplyNorms = new Set();
    for (let i = 0; i < allReplies.length; i += 1) {
      const row = allReplies[i];
      const text = String((row && row.text) || "").trim();
      if (!text) continue;
      const norm = normalizeSlackTextForDedup(text);
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

      dedupedReplyRows.push({
        text,
        norm,
        isAck: !!(row && row.isAck)
      });
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
    const hasSourcesFooter = allReplyTexts.some((text) => hasSlackSourcesFooterText(text));
    const ackOnly = dedupedReplyRows.length === 1 && !!(dedupedReplyRows[0] && dedupedReplyRows[0].isAck);
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

    if (latestReplyTs) {
      await slackThreadMark(workspaceOrigin, channelId, parentTs, latestReplyTs, false).catch(() => {});
      await slackConversationsMark(workspaceOrigin, channelId, latestReplyTs, "viewed").catch(() => {});
    }

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
      cachedLatestUpdates: cachedLatestUpdatesOut,
      messageCount: messages.length
    };
  }

  async function slackDeleteMessage(workspaceOrigin, channelId, ts) {
    if (!channelId || !ts) return { ok: false, error: "Slack delete metadata is missing." };
    return postSlackApi(workspaceOrigin, "/api/chat.delete", {
      channel: channelId,
      ts,
      _x_reason: "zip-thread-delete"
    });
  }

  async function slackDeleteSingularityThreadAction(inner) {
    if (!isSlackPage()) {
      return { ok: false, error: "Not a Slack tab. Open Slack login first." };
    }
    ensureSlackTokenBridgeInstalled();
    const workspaceOrigin = normalizeSlackWorkspaceOrigin(inner && inner.workspaceOrigin);
    const channelId = String((inner && (inner.channelId || inner.channel_id)) || "").trim();
    const parentTs = String((inner && (inner.parentTs || inner.parent_ts || inner.threadTs || inner.thread_ts)) || "").trim();
    if (!channelId || !parentTs) {
      return { ok: false, error: "Slack channel/thread metadata is required." };
    }

    const limitRaw = Number(inner && inner.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.trunc(limitRaw), 200) : 120;
    const repliesResponse = await postSlackApi(workspaceOrigin, "/api/conversations.replies", {
      channel: channelId,
      ts: parentTs,
      inclusive: "true",
      oldest: parentTs,
      limit,
      _x_reason: "history-api/fetchReplies"
    });
    if (!repliesResponse.ok) return repliesResponse;

    const payload = repliesResponse.payload || {};
    const rows = Array.isArray(payload.messages) ? payload.messages.slice() : [];
    const threadMessages = rows
      .filter((message) => {
        if (!message || typeof message !== "object") return false;
        const ts = String(message.ts || "").trim();
        if (!ts) return false;
        if (ts === parentTs) return true;
        const threadTs = String(message.thread_ts || "").trim();
        return !threadTs || threadTs === parentTs;
      })
      .map((message) => String((message && message.ts) || "").trim())
      .filter(Boolean);

    if (!threadMessages.length) threadMessages.push(parentTs);

    // Delete newest first to reduce orphaning if deletion partially fails.
    threadMessages.sort((a, b) => slackTsToEpochMs(b) - slackTsToEpochMs(a));

    const deletedTs = [];
    const failedDeletes = [];
    for (let i = 0; i < threadMessages.length; i += 1) {
      const ts = threadMessages[i];
      const deletion = await slackDeleteMessage(workspaceOrigin, channelId, ts);
      if (deletion && deletion.ok) {
        deletedTs.push(ts);
      } else {
        failedDeletes.push({
          ts,
          error: String((deletion && (deletion.error || deletion.message)) || "Unable to delete message.")
        });
      }
    }

    return {
      ok: failedDeletes.length === 0 || deletedTs.length > 0,
      channel: channelId,
      parent_ts: parentTs,
      deletedCount: deletedTs.length,
      failedCount: failedDeletes.length,
      totalMessages: threadMessages.length,
      deletedTs,
      failedDeletes
    };
  }

  function openZipOptionsFromContent() {
    try {
      chrome.runtime.sendMessage({ type: "ZIP_OPEN_OPTIONS" }, () => {
        void chrome.runtime.lastError;
      });
    } catch (_) {}
  }

  function removeZipKeyBanner() {
    const existing = document.getElementById(ZIP_KEY_BANNER_ID);
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }

  function ensureZipKeyBanner() {
    if (document.getElementById(ZIP_KEY_BANNER_ID)) return;
    if (!document || !document.body) return;

    const banner = document.createElement("div");
    banner.id = ZIP_KEY_BANNER_ID;
    banner.setAttribute("role", "status");
    banner.style.position = "fixed";
    banner.style.top = "12px";
    banner.style.right = "12px";
    banner.style.zIndex = "2147483647";
    banner.style.background = "#f5f5f5";
    banner.style.color = "#202020";
    banner.style.border = "1px solid #b8b8b8";
    banner.style.borderRadius = "8px";
    banner.style.boxShadow = "0 6px 20px rgba(0,0,0,0.18)";
    banner.style.fontFamily = "Adobe Clean, Segoe UI, system-ui, sans-serif";
    banner.style.fontSize = "12px";
    banner.style.lineHeight = "1.35";
    banner.style.maxWidth = "320px";
    banner.style.padding = "10px 12px";
    banner.style.display = "flex";
    banner.style.alignItems = "center";
    banner.style.gap = "8px";

    const text = document.createElement("button");
    text.type = "button";
    text.style.all = "unset";
    text.style.cursor = "pointer";
    text.style.color = "#1473e6";
    text.style.textDecoration = "underline";
    text.textContent = "ZipTool: Please drop ZIP.KEY - click to configure";
    text.addEventListener("click", () => openZipOptionsFromContent());

    const close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Dismiss ZIP.KEY banner");
    close.style.border = "none";
    close.style.background = "transparent";
    close.style.color = "#505050";
    close.style.cursor = "pointer";
    close.style.fontSize = "14px";
    close.style.lineHeight = "1";
    close.textContent = "x";
    close.addEventListener("click", () => removeZipKeyBanner());

    banner.appendChild(text);
    banner.appendChild(close);
    document.body.appendChild(banner);
  }

  function syncZipKeyBanner() {
    if (!isZendeskPage()) return;
    try {
      chrome.runtime.sendMessage({ type: "ZIP_CHECK_SECRETS" }, (response) => {
        if (chrome.runtime.lastError) {
          ensureZipKeyBanner();
          return;
        }
        const ok = !!(response && response.ok);
        if (ok) removeZipKeyBanner();
        else ensureZipKeyBanner();
      });
    } catch (_) {
      ensureZipKeyBanner();
    }
  }

  if (isSlackPage()) {
    // Defer bridge injection until a Slack action requires API access.
    readCapturedSlackToken();
  }

  if (isZendeskPage()) {
    installZendeskSessionObservers();
    syncZipKeyBanner();
    window.addEventListener("focus", () => syncZipKeyBanner());
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) syncZipKeyBanner();
    });
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "ZIP_KEY_CLEARED") {
      syncZipKeyBanner();
      return;
    }
    if (msg && msg.type === "ZIP_SESSION_PROBE") {
      // Authoritative Zendesk auth probe used by background/sidepanel coordination.
      probeZendeskSession({
        url: msg.url || SESSION_URL,
        reason: msg.source || "zip_session_probe"
      })
        .then((result) => sendResponse({
          ok: !!(result && result.ok),
          status: Number(result && result.status) || 0,
          payload: result && result.payload ? result.payload : null,
          error: result && result.error ? result.error : ""
        }))
        .catch((err) => sendResponse({
          ok: false,
          status: 0,
          payload: null,
          error: err && err.message ? err.message : "Zendesk session probe failed."
        }));
      return true;
    }
    if (!msg || msg.type !== "ZIP_FROM_BACKGROUND") return;
    const { requestId, inner } = msg;
    if (!inner || !requestId) {
      sendResponse({ type: "ZIP_RESPONSE", requestId, error: "Invalid message" });
      return;
    }
    const run = async () => {
      try {
        if (inner.action === "slackAuthTest") {
          const result = await slackAuthTestAction(inner);
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "slackSendMarkdownToSelf") {
          const result = await slackSendMarkdownToSelfAction(inner);
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "slackMarkUnread") {
          const result = await slackMarkUnreadAction(inner);
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "slackSendToSingularity") {
          const result = await slackSendToSingularityAction(inner);
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "slackPollSingularityThread") {
          const result = await slackPollSingularityThreadAction(inner);
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "slackDeleteSingularityThread") {
          const result = await slackDeleteSingularityThreadAction(inner);
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "fetch") {
          const result = await fetchJson(inner.url);
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "getMe") {
          const result = await getMe();
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "loadTickets") {
          const result = await loadTickets(inner.userId || inner.user_id || "");
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "loadTicketsByOrg") {
          const result = await loadTicketsByOrg(inner.orgId || "");
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "loadOrganizations") {
          const result = await loadOrganizations();
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "loadViews") {
          const result = await loadViews();
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "loadViewCount") {
          const result = await loadViewCount(inner.viewId || "");
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "loadViewCountsMany") {
          const result = await loadViewCountsMany(inner.viewIds || []);
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "loadOrganizationCount") {
          const result = await loadOrganizationCount(inner.orgId || "");
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "loadTicketsByView") {
          const result = await loadTicketsByView(inner.viewId || "");
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "loadGroupAgents") {
          const result = await loadGroupAgents(inner.groupId || "");
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "loadAllGroupsWithMembers") {
          const result = await loadAllGroupsWithMembers();
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "loadTicketsByGroupId") {
          const result = await loadTicketsByGroupId(inner.groupId || "");
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "loadGroupTicketCount") {
          const result = await loadGroupTicketCount(inner.groupId || "");
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "loadTicketsByAssigneeId") {
          const result = await loadTicketsByAssigneeId(inner.userId || "");
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "loadAssigneeTicketCount") {
          const result = await loadAssigneeTicketCount(inner.userId || "");
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "logout") {
          return { type: "ZIP_RESPONSE", requestId, result: { ok: true } };
        }
        return { type: "ZIP_RESPONSE", requestId, error: "Unknown action" };
      } catch (err) {
        return { type: "ZIP_RESPONSE", requestId, error: (err && err.message) || "Unknown error" };
      }
    };
    run().then(sendResponse);
    return true;
  });
})();
