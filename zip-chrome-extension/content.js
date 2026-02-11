(function () {
  "use strict";

  if (window.__ZIP_CONTENT_LOADED__) return;
  window.__ZIP_CONTENT_LOADED__ = true;

  const BASE = "https://adobeprimetime.zendesk.com";
  const ME_URL = BASE + "/api/v2/users/me.json";
  const LOGOUT_URL = BASE + "/access/logout?return_to=" + encodeURIComponent(BASE + "/agent/dashboard");
  const TICKET_URL_PREFIX = BASE + "/agent/tickets/";

  async function fetchJson(url) {
    const res = await fetch(url, {
      method: "GET",
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

  function normalizeTicket(row) {
    const id = row && row.id != null ? row.id : "";
    return {
      id,
      subject: (row && row.subject) || "",
      status: (row && row.status) || "",
      priority: (row && row.priority) || "",
      created_at: (row && row.created_at) || "",
      updated_at: (row && row.updated_at) || "",
      url: id ? TICKET_URL_PREFIX + id : ""
    };
  }

  /** Exclude solved and closed in all ticket APIs. Search uses this in the query; list endpoints filter client-side. */
  const NOT_SOLVED_STATUS_QUERY = " status:open status:pending status:hold";
  const EXCLUDED_STATUSES = ["solved", "closed"];

  function isExcludedStatus(status) {
    const s = String(status || "").toLowerCase().trim();
    return EXCLUDED_STATUSES.includes(s);
  }

  function includeTicketByStatus(row) {
    const status = (row && row.status != null) ? row.status : "";
    return !isExcludedStatus(status);
  }

  async function loadTickets(email) {
    if (!email) return { tickets: [] };
    const query = "type:ticket assignee:" + email + NOT_SOLVED_STATUS_QUERY;
    return searchTickets(query);
  }

  async function loadTicketsByOrg(orgId) {
    if (!orgId) return { tickets: [] };
    const query = "type:ticket organization_id:" + orgId + NOT_SOLVED_STATUS_QUERY;
    return searchTickets(query);
  }

  async function searchTickets(query) {
    let nextUrl = BASE + "/api/v2/search.json?query=" + encodeURIComponent(query);
    const all = [];
    let pages = 0;
    const maxPages = 6;
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
        if ((!type || type === "ticket") && includeTicketByStatus(raw)) all.push(normalizeTicket(raw || {}));
      });
      nextUrl = res.payload.next_page || null;
    }
    return { tickets: all };
  }

  async function loadOrganizations() {
    const list = [];
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
        if (o && o.id != null) list.push({ id: o.id, name: (o.name || "").trim() || "Org " + o.id });
      });
      nextUrl = res.payload.next_page || null;
    }
    list.sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" }));
    return { organizations: list };
  }

  async function loadViews() {
    const list = [];
    let nextUrl = BASE + "/api/v2/views.json";
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
        if (v && v.id != null) list.push({ id: v.id, title: (v.title || "").trim() || "View " + v.id });
      });
      nextUrl = res.payload.next_page || null;
    }
    list.sort((a, b) => String(a.title).localeCompare(String(b.title), undefined, { sensitivity: "base" }));
    return { views: list };
  }

  async function loadTicketsByView(viewId) {
    if (!viewId) return { tickets: [] };
    const all = [];
    let nextUrl = BASE + "/api/v2/views/" + encodeURIComponent(viewId) + "/tickets.json";
    let pages = 0;
    const maxPages = 10;
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
        if (includeTicketByStatus(row)) all.push(normalizeTicket(row || {}));
      });
      nextUrl = res.payload.next_page || null;
    }
    return { tickets: all };
  }

  /** GET /api/v2/groups/assignable – list all assignable groups (for By Group dropdown). */
  async function loadAssignableGroups() {
    const list = [];
    let nextUrl = BASE + "/api/v2/groups/assignable.json";
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
        if (g && g.id != null) list.push({ id: g.id, name: (g.name || "").trim() || "Group " + g.id });
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
    list.forEach((a) => {
      if (!a) return;
      const id = a.id ?? a.user_id ?? a.agent_id;
      if (id == null) return;
      const name = (a.name || a.display_name || (a.user && a.user.name) || "").trim() || "Agent " + id;
      agents.push({ id: String(id), name });
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
    const groupsWithMembers = [];
    for (const group of groupsRes.groups) {
      const agentsRes = await loadGroupAgents(group.id);
      const agents = agentsRes.agents || [];
      groupsWithMembers.push({ group: { id: group.id, name: group.name }, agents });
    }
    return { groupsWithMembers };
  }

  /** Search API: tickets in group (assignee group). Excludes solved/closed. */
  async function loadTicketsByGroupId(groupId) {
    if (!groupId) return { tickets: [] };
    const query = "type:ticket group_id:" + String(groupId) + NOT_SOLVED_STATUS_QUERY;
    return searchTickets(query);
  }

  /** Search API: tickets by assignee_id (accurate, status-filtered). Replaces /users/{id}/tickets/assigned. */
  async function loadTicketsByAssigneeId(userId) {
    if (!userId) return { tickets: [] };
    const query = "type:ticket assignee_id:" + String(userId) + NOT_SOLVED_STATUS_QUERY;
    return searchTickets(query);
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
          const result = await loadTickets(inner.email || "");
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
        if (inner.action === "loadTicketsByAssigneeId") {
          const result = await loadTicketsByAssigneeId(inner.userId || "");
          return { type: "ZIP_RESPONSE", requestId, result };
        }
        if (inner.action === "logout") {
          window.location.href = LOGOUT_URL;
          return { type: "ZIP_RESPONSE", requestId };
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
