(function () {
  "use strict";

  if (window.__ZIP_CONTENT_LOADED__) return;
  window.__ZIP_CONTENT_LOADED__ = true;

  const BASE = "https://adobeprimetime.zendesk.com";
  const ME_URL = BASE + "/api/v2/users/me.json";
  const TICKET_URL_PREFIX = BASE + "/agent/tickets/";
  const JIRA_ENG_TICKET_FIELD_ID = "22790243";
  const JIRA_BROWSE_URL_PREFIX = "https://jira.corp.adobe.com/browse/";

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

  function normalizeTicket(row) {
    const id = row && row.id != null ? row.id : "";
    const jiraIssueKey = extractJiraIssueKey(row);
    return {
      id,
      subject: (row && row.subject) || "",
      status: (row && row.status) || "",
      priority: (row && row.priority) || "",
      created_at: (row && row.created_at) || "",
      updated_at: (row && row.updated_at) || "",
      url: id ? TICKET_URL_PREFIX + id : "",
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

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type !== "ZIP_FROM_BACKGROUND") return;
    const { requestId, inner } = msg;
    if (!inner || !requestId) {
      sendResponse({ type: "ZIP_RESPONSE", requestId, error: "Invalid message" });
      return;
    }
    const run = async () => {
      try {
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
