const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const MODULE_PATH = path.resolve(__dirname, "..", "zendesk-ticket-search.js");
const { createZendeskTicketSearchService } = require(MODULE_PATH);

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
      updated_at: "2026-03-01T00:00:00Z"
    });
  }
  return rows;
}

test("mock integration: cursor pagination + 429 retry + slow first page metrics", async () => {
  const calls = [];
  const logs = [];
  const queue = [
    {
      status: 429,
      payload: { error: "rate_limit" },
      headers: { "Retry-After": "0" }
    },
    {
      status: 200,
      delayMs: 20,
      payload: {
        results: makeTicketRows(1, 100),
        meta: { has_more: true, after_cursor: "cursor-1" },
        links: {
          next: "https://example.zendesk.com/api/v2/search/export.json?page%5Bafter%5D=cursor-1&page%5Bsize%5D=100"
        }
      }
    },
    {
      status: 200,
      payload: {
        results: makeTicketRows(101, 100),
        meta: { has_more: true, after_cursor: "cursor-2" },
        links: {
          next: "https://example.zendesk.com/api/v2/search/export.json?page%5Bafter%5D=cursor-2&page%5Bsize%5D=100"
        }
      }
    },
    {
      status: 200,
      payload: {
        results: makeTicketRows(201, 100),
        meta: { has_more: false },
        links: { next: "" }
      }
    }
  ];

  const service = createZendeskTicketSearchService({
    baseUrl: "https://example.zendesk.com",
    fetchImpl: async (url) => {
      calls.push(String(url));
      const next = queue.shift();
      if (!next) throw new Error("Unexpected call " + url);
      if (next.delayMs) {
        await new Promise((resolve) => setTimeout(resolve, next.delayMs));
      }
      return buildJsonResponse(next.status, next.payload, next.headers);
    },
    logger: (entry) => logs.push(entry),
    randomFn: () => 0,
    baseBackoffMs: 1,
    maxBackoffMs: 2,
    maxRetries: 3
  });

  const result = await service.searchTickets("error", {
    maxResults: 250,
    cacheTTL: 0,
    fallbackThreshold: 5,
    debug: true
  });

  assert.equal(result.error, undefined);
  assert.equal(result.tickets.length, 250);
  assert.equal(result.metrics.pagesFetched, 3);
  assert.ok(result.metrics.retryCount >= 1);
  assert.ok(result.metrics.zendeskMs >= 20);
  assert.ok(result.metrics.debug);
  assert.match(String(result.metrics.debug.recommendation || ""), /incremental/i);

  assert.equal(calls.length, 4, "includes one retry attempt before first successful page");
  assert.match(calls[0], /search\/export\.json/);
  assert.ok(logs.some((entry) => entry && entry.type === "ticket_search_recommend_incremental"));
  assert.ok(logs.some((entry) => entry && entry.type === "ticket_search_complete"));
});
