const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const {
  createTranslationCache,
  createTranslatorAdapter,
  enrichTicketsWithRequestorOrg
} = require(path.join(ROOT, "ticket-enrichment.js"));

function parseIds(url) {
  const parsed = new URL(url);
  const idsRaw = String(parsed.searchParams.get("ids") || "").trim();
  if (!idsRaw) return [];
  return idsRaw.split(",").map((value) => value.trim()).filter(Boolean);
}

function buildZendeskFetchMock(data) {
  const usersById = data && data.usersById ? data.usersById : {};
  const organizationsById = data && data.organizationsById ? data.organizationsById : {};
  const calls = {
    users: 0,
    organizations: 0
  };
  return {
    calls,
    fetchJson: async (url) => {
      if (url.includes("/api/v2/users/show_many.json")) {
        calls.users += 1;
        const ids = parseIds(url);
        return {
          ok: true,
          status: 200,
          payload: {
            users: ids
              .map((id) => usersById[id])
              .filter(Boolean)
              .map((row) => ({ ...row }))
          }
        };
      }
      if (url.includes("/api/v2/organizations/show_many.json")) {
        calls.organizations += 1;
        const ids = parseIds(url);
        return {
          ok: true,
          status: 200,
          payload: {
            organizations: ids
              .map((id) => organizationsById[id])
              .filter(Boolean)
              .map((row) => ({ ...row }))
          }
        };
      }
      return {
        ok: false,
        status: 404,
        payload: {}
      };
    }
  };
}

test("enrichTicketsWithRequestorOrg adds requestor and organization with batched show_many lookups", async () => {
  const tickets = [
    { id: "101", requester_id: "1", organization_id: "10", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" },
    { id: "102", requester_id: "2", organization_id: "10", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-03T00:00:00Z" },
    { id: "103", requester_id: "1", organization_id: "11", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-04T00:00:00Z" }
  ];
  const mock = buildZendeskFetchMock({
    usersById: {
      "1": { id: "1", name: "Alice Jones", email: "alice@example.com" },
      "2": { id: "2", name: "Bob Smith", email: "bob@example.com" }
    },
    organizationsById: {
      "10": { id: "10", name: "Acme Media" },
      "11": { id: "11", name: "Northwind" }
    }
  });

  const translationCalls = [];
  const translator = createTranslatorAdapter({
    translateBatch: async (sourceStrings, translationOptions) => {
      translationCalls.push({
        sourceStrings: sourceStrings.slice(),
        targetLocale: translationOptions && translationOptions.targetLocale
      });
      return sourceStrings.map((value) => "fr:" + value);
    }
  });

  const result = await enrichTicketsWithRequestorOrg(tickets, {
    baseUrl: "https://example.zendesk.com",
    fetchJson: mock.fetchJson,
    targetLocale: "fr-FR",
    translator,
    translationCache: createTranslationCache({ ttlMs: 10_000 })
  });

  assert.equal(mock.calls.users, 1, "users/show_many should be called once for deduped IDs");
  assert.equal(mock.calls.organizations, 1, "organizations/show_many should be called once for deduped IDs");
  assert.equal(translationCalls.length, 1, "translations should be batched in a single call");

  const first = result.tickets[0];
  assert.equal(first.requestor_name_translated, "fr:Alice Jones");
  assert.equal(first.organization_name_translated, "fr:Acme Media");
  assert.equal(first.requestor, "<a href=\"mailto:alice@example.com\">fr:Alice Jones</a>");
  assert.equal(first.organization, "fr:Acme Media");

  assert.equal(result.metrics.uniqueRequesterIds, 2);
  assert.equal(result.metrics.uniqueOrganizationIds, 2);
  assert.equal(result.metrics.translationBatchCalls, 1);
});

test("translation cache is reused across repeated enrichment calls", async () => {
  const tickets = [
    { id: "201", requester_id: "1", organization_id: "50" }
  ];
  const mock = buildZendeskFetchMock({
    usersById: {
      "1": { id: "1", name: "Casey Rivera", email: "casey@example.com" }
    },
    organizationsById: {
      "50": { id: "50", name: "Contoso" }
    }
  });

  let translationCallCount = 0;
  const translator = createTranslatorAdapter({
    translateBatch: async (sourceStrings) => {
      translationCallCount += 1;
      return sourceStrings.map((value) => "es:" + value);
    }
  });
  const cache = createTranslationCache({ ttlMs: 60_000 });

  const first = await enrichTicketsWithRequestorOrg(tickets, {
    baseUrl: "https://example.zendesk.com",
    fetchJson: mock.fetchJson,
    targetLocale: "es-ES",
    translator,
    translationCache: cache
  });
  const second = await enrichTicketsWithRequestorOrg(tickets, {
    baseUrl: "https://example.zendesk.com",
    fetchJson: mock.fetchJson,
    targetLocale: "es-ES",
    translator,
    translationCache: cache
  });

  assert.equal(translationCallCount, 1, "second call should be served entirely from translation cache");
  assert.equal(first.tickets[0].requestor_name_translated, "es:Casey Rivera");
  assert.equal(second.tickets[0].requestor_name_translated, "es:Casey Rivera");
  assert.equal(second.metrics.translationBatchCalls, 0);
  assert.ok(second.metrics.translationCacheHits >= 2);
});

test("translation provider failures fall back to original strings", async () => {
  const tickets = [
    { id: "301", requester_id: "8", organization_id: "80" }
  ];
  const mock = buildZendeskFetchMock({
    usersById: {
      "8": { id: "8", name: "Morgan Lee", email: "morgan@example.com" }
    },
    organizationsById: {
      "80": { id: "80", name: "Fabrikam" }
    }
  });
  const translator = createTranslatorAdapter({
    translateBatch: async () => {
      throw new Error("provider_down");
    }
  });

  const result = await enrichTicketsWithRequestorOrg(tickets, {
    baseUrl: "https://example.zendesk.com",
    fetchJson: mock.fetchJson,
    targetLocale: "de-DE",
    translator,
    translationCache: createTranslationCache({ ttlMs: 1_000 })
  });

  assert.equal(result.tickets[0].requestor_name_translated, "Morgan Lee");
  assert.equal(result.tickets[0].organization_name_translated, "Fabrikam");
  assert.equal(result.metrics.translationFailures, 1);
});
