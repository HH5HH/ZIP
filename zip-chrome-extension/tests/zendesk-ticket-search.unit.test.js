const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const MODULE_PATH = path.resolve(__dirname, "..", "zendesk-ticket-search.js");
const {
  createZendeskTicketSearchService,
  tightenTicketSearchQuery
} = require(MODULE_PATH);

function buildHeaders(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    get(name) {
      const key = Object.keys(source).find((entry) => String(entry).toLowerCase() === String(name).toLowerCase());
      return key ? source[key] : null;
    }
  };
}

function buildJsonResponse(status, payload, headers) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: buildHeaders(headers),
    async text() {
      return payload == null ? "" : JSON.stringify(payload);
    }
  };
}

function makeTicketRows(startId, count) {
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const id = startId + i;
    rows.push({
      id,
      result_type: "ticket",
      subject: "Ticket " + id,
      status: "open",
      priority: "normal",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
      requester_id: 1000 + id,
      organization_id: 2000 + id
    });
  }
  return rows;
}

function createServiceWithQueue(queue, options) {
  const calls = [];
  const service = createZendeskTicketSearchService({
    baseUrl: "https://example.zendesk.com",
    fetchImpl: async (url) => {
      calls.push(String(url));
      const next = queue.shift();
      if (!next) {
        throw new Error("Unexpected fetch call: " + url);
      }
      if (next.delayMs) {
        await new Promise((resolve) => setTimeout(resolve, next.delayMs));
      }
      return buildJsonResponse(next.status, next.payload, next.headers);
    },
    randomFn: () => 0,
    maxRetries: 3,
    baseBackoffMs: 1,
    maxBackoffMs: 2,
    ...(options && typeof options === "object" ? options : {})
  });
  return { service, calls };
}

test("maxResults=50 fetches one cursor page with page[size]=100", async () => {
  const page = {
    results: makeTicketRows(1, 120),
    meta: { has_more: true, after_cursor: "cursor-1" },
    links: { next: "https://example.zendesk.com/api/v2/search/export.json?page%5Bafter%5D=cursor-1" }
  };
  const { service, calls } = createServiceWithQueue([
    { status: 200, payload: page }
  ]);

  const result = await service.searchTickets("error", {
    maxResults: 50,
    cacheTTL: 0,
    debug: true
  });

  assert.equal(result.error, undefined);
  assert.equal(result.tickets.length, 50);
  assert.equal(result.metrics.pagesFetched, 1);
  assert.equal(calls.length, 1);
  assert.match(calls[0], /page%5Bsize%5D=100/);
});

test("maxResults=250 paginates with cursor links and stops at requested limit", async () => {
  const page1Url = "https://example.zendesk.com/api/v2/search/export.json?page%5Bafter%5D=cursor-1";
  const page2Url = "https://example.zendesk.com/api/v2/search/export.json?page%5Bafter%5D=cursor-2";
  const { service, calls } = createServiceWithQueue([
    {
      status: 200,
      payload: {
        results: makeTicketRows(1, 100),
        meta: { has_more: true, after_cursor: "cursor-1" },
        links: { next: page1Url }
      }
    },
    {
      status: 200,
      payload: {
        results: makeTicketRows(101, 100),
        meta: { has_more: true, after_cursor: "cursor-2" },
        links: { next: page2Url }
      }
    },
    {
      status: 200,
      payload: {
        results: makeTicketRows(201, 100),
        meta: { has_more: false, after_cursor: "cursor-3" },
        links: { next: "" }
      }
    }
  ]);

  const result = await service.searchTickets("incident", {
    maxResults: 250,
    cacheTTL: 0
  });

  assert.equal(result.tickets.length, 250);
  assert.equal(result.metrics.pagesFetched, 3);
  assert.equal(calls.length, 3);
  assert.equal(result.tickets[0].id, 1);
  assert.equal(result.tickets[249].id, 250);
});

test("tightenTicketSearchQuery adds type/status/date for broad query", () => {
  const tightened = tightenTicketSearchQuery("error", {
    nowMs: Date.UTC(2026, 2, 4),
    defaultDateRangeDays: 90
  });

  assert.equal(tightened.query.includes("type:ticket"), true);
  assert.equal(tightened.query.includes("status:open"), true);
  assert.match(tightened.query, /updated>=\d{4}-\d{2}-\d{2}/);
  assert.equal(tightened.applied, true);
});

test("tightenTicketSearchQuery can skip default date constraint when disabled", () => {
  const tightened = tightenTicketSearchQuery("assignee_id:44 status:open", {
    nowMs: Date.UTC(2026, 2, 4),
    defaultDateRangeDays: 0
  });

  assert.equal(tightened.query.includes("updated>="), false);
  assert.equal(tightened.query.includes("type:ticket"), true);
});

test("search logs tightening and applies tightened query to outbound request", async () => {
  const logs = [];
  const { service, calls } = createServiceWithQueue([
    {
      status: 200,
      payload: {
        results: makeTicketRows(1, 5),
        meta: { has_more: false },
        links: { next: "" }
      }
    }
  ], {
    logger: (entry) => logs.push(entry)
  });

  const result = await service.searchTickets("error", {
    maxResults: 5,
    cacheTTL: 0
  });

  assert.equal(result.tickets.length, 5);
  assert.equal(result.metrics.queryTightened, true);
  const requestedUrl = new URL(calls[0]);
  const queryValue = requestedUrl.searchParams.get("query") || "";
  assert.match(queryValue, /type:ticket/);
  assert.match(queryValue, /updated>=/);
  assert.ok(logs.some((entry) => entry && entry.type === "ticket_search_complete"));
});

test("429 retry honors Retry-After and succeeds", async () => {
  const { service, calls } = createServiceWithQueue([
    {
      status: 429,
      payload: { error: "rate_limited" },
      headers: { "Retry-After": "0" }
    },
    {
      status: 200,
      payload: {
        results: makeTicketRows(1, 10),
        meta: { has_more: false },
        links: { next: "" }
      }
    }
  ]);

  const result = await service.searchTickets("error", {
    maxResults: 10,
    cacheTTL: 0
  });

  assert.equal(result.error, undefined);
  assert.equal(result.tickets.length, 10);
  assert.equal(calls.length, 2);
  assert.ok(result.metrics.retryCount >= 1);
});

test("cache returns hit on repeated query", async () => {
  const { service, calls } = createServiceWithQueue([
    {
      status: 200,
      payload: {
        results: makeTicketRows(1, 20),
        meta: { has_more: false },
        links: { next: "" }
      }
    }
  ]);

  const first = await service.searchTickets("cache me", {
    maxResults: 20,
    cacheTTL: 30
  });
  const second = await service.searchTickets("cache me", {
    maxResults: 20,
    cacheTTL: 30
  });

  assert.equal(first.metrics.cacheHit, false);
  assert.equal(second.metrics.cacheHit, true);
  assert.equal(second.metrics.cacheLayer, "full");
  assert.equal(calls.length, 1);
});

test("custom sparse fields are applied client-side by default and keep enrichment fields", async () => {
  const { service, calls } = createServiceWithQueue([
    {
      status: 200,
      payload: {
        results: makeTicketRows(1, 5),
        meta: { has_more: false },
        links: { next: "" }
      }
    }
  ]);

  const result = await service.searchTickets("error", {
    maxResults: 5,
    cacheTTL: 0,
    fieldsNeeded: ["id", "subject"]
  });

  assert.equal(result.error, undefined);
  assert.equal(result.tickets.length, 5);
  const requestedUrl = new URL(calls[0]);
  assert.equal(requestedUrl.searchParams.has("fields"), false);
  const firstTicket = result.tickets[0] || {};
  assert.ok(Object.prototype.hasOwnProperty.call(firstTicket, "id"));
  assert.ok(Object.prototype.hasOwnProperty.call(firstTicket, "subject"));
  assert.ok(Object.prototype.hasOwnProperty.call(firstTicket, "requester_id"));
  assert.ok(Object.prototype.hasOwnProperty.call(firstTicket, "organization_id"));
});

test("server sparse fields can be explicitly enabled", async () => {
  const { service, calls } = createServiceWithQueue([
    {
      status: 200,
      payload: {
        results: makeTicketRows(1, 1),
        meta: { has_more: false },
        links: { next: "" }
      }
    }
  ]);

  const result = await service.searchTickets("error", {
    maxResults: 1,
    cacheTTL: 0,
    fieldsNeeded: ["id", "subject"],
    useServerSparseFields: true
  });

  assert.equal(result.error, undefined);
  const requestedUrl = new URL(calls[0]);
  const fields = String(requestedUrl.searchParams.get("fields") || "").split(",").filter(Boolean);
  assert.ok(fields.includes("id"));
  assert.ok(fields.includes("subject"));
  assert.ok(fields.includes("requester_id"));
  assert.ok(fields.includes("organization_id"));
});

test("requestor aliases are preserved when present in payload", async () => {
  const { service } = createServiceWithQueue([
    {
      status: 200,
      payload: {
        results: [
          {
            id: 1,
            result_type: "ticket",
            subject: "Alias row",
            status: "open",
            requestor_id: 999,
            requestor_name: "Alias Requestor",
            requestor_email: "alias@example.com",
            organization_name: "Alias Org"
          }
        ],
        meta: { has_more: false },
        links: { next: "" }
      }
    }
  ]);

  const result = await service.searchTickets("error", {
    maxResults: 1,
    cacheTTL: 0
  });

  assert.equal(result.error, undefined);
  assert.equal(result.tickets.length, 1);
  assert.equal(result.tickets[0].requestor_name, "Alias Requestor");
  assert.equal(result.tickets[0].requestor_email, "alias@example.com");
  assert.equal(result.tickets[0].organization_name, "Alias Org");
});

test("maxResults above threshold switches to incremental export endpoint", async () => {
  const { service, calls } = createServiceWithQueue([
    {
      status: 200,
      payload: {
        tickets: makeTicketRows(1, 40),
        end_of_stream: true,
        after_cursor: "next-cursor"
      }
    }
  ]);

  const result = await service.searchTickets("assignee_id:44", {
    maxResults: 12001,
    cacheTTL: 0,
    syncThreshold: 10000
  });

  assert.equal(result.metrics.usedIncremental, true);
  assert.equal(calls.length, 1);
  assert.match(calls[0], /\/incremental\/tickets\/cursor\.json/);
});

test("slow first page emits incremental recommendation in debug metrics", async () => {
  const logs = [];
  const { service } = createServiceWithQueue([
    {
      status: 200,
      payload: {
        results: makeTicketRows(1, 10),
        meta: { has_more: false },
        links: { next: "" }
      },
      delayMs: 25
    }
  ], {
    logger: (entry) => logs.push(entry)
  });

  const result = await service.searchTickets("error", {
    maxResults: 10,
    cacheTTL: 0,
    fallbackThreshold: 5,
    debug: true
  });

  assert.equal(result.tickets.length, 10);
  assert.ok(result.metrics.debug);
  assert.match(String(result.metrics.debug.recommendation || ""), /incremental/i);
  assert.ok(logs.some((entry) => entry && entry.type === "ticket_search_recommend_incremental"));
});
