const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const {
  createTranslationCache,
  createTranslatorAdapter,
  enrichTicketsWithRequestorOrg
} = require(path.join(ROOT, "ticket-enrichment.js"));

function buildIdsFromUrl(url) {
  const parsed = new URL(url);
  const rawIds = String(parsed.searchParams.get("ids") || "").trim();
  if (!rawIds) return [];
  return rawIds.split(",").map((value) => value.trim()).filter(Boolean);
}

test("performance simulation: 10k-ticket enrichment keeps Zendesk and translation calls bounded", async () => {
  const ticketCount = 10_000;
  const uniqueUsers = 240;
  const uniqueOrganizations = 130;

  const tickets = [];
  for (let i = 0; i < ticketCount; i += 1) {
    tickets.push({
      id: String(900_000 + i),
      requester_id: String((i % uniqueUsers) + 1),
      organization_id: String((i % uniqueOrganizations) + 1),
      created_at: "2026-02-01T00:00:00Z",
      updated_at: "2026-02-02T00:00:00Z"
    });
  }

  const usersById = Object.create(null);
  for (let i = 1; i <= uniqueUsers; i += 1) {
    usersById[String(i)] = {
      id: String(i),
      name: "User " + i,
      email: "user" + i + "@example.com"
    };
  }
  const organizationsById = Object.create(null);
  for (let i = 1; i <= uniqueOrganizations; i += 1) {
    organizationsById[String(i)] = {
      id: String(i),
      name: "Org " + i
    };
  }

  const calls = {
    users: 0,
    organizations: 0,
    translation: 0
  };
  const fetchJson = async (url) => {
    if (url.includes("/api/v2/users/show_many.json")) {
      calls.users += 1;
      const ids = buildIdsFromUrl(url);
      return {
        ok: true,
        status: 200,
        payload: {
          users: ids.map((id) => usersById[id]).filter(Boolean)
        }
      };
    }
    if (url.includes("/api/v2/organizations/show_many.json")) {
      calls.organizations += 1;
      const ids = buildIdsFromUrl(url);
      return {
        ok: true,
        status: 200,
        payload: {
          organizations: ids.map((id) => organizationsById[id]).filter(Boolean)
        }
      };
    }
    return { ok: false, status: 404, payload: {} };
  };

  const translator = createTranslatorAdapter({
    translateBatch: async (sourceStrings) => {
      calls.translation += 1;
      return sourceStrings.map((value) => "pt:" + value);
    }
  });

  const result = await enrichTicketsWithRequestorOrg(tickets, {
    baseUrl: "https://example.zendesk.com",
    fetchJson,
    targetLocale: "pt-BR",
    chunkSize: 100,
    translationCache: createTranslationCache({ ttlMs: 60_000 }),
    translator
  });

  assert.equal(result.tickets.length, ticketCount);
  assert.equal(calls.users, Math.ceil(uniqueUsers / 100));
  assert.equal(calls.organizations, Math.ceil(uniqueOrganizations / 100));
  assert.equal(calls.translation, 1, "all unique names should be translated in one batch");
  assert.ok(result.metrics.translationRequestedStrings <= (uniqueUsers + uniqueOrganizations));

  const first = result.tickets[0];
  const last = result.tickets[result.tickets.length - 1];
  assert.match(first.requestor, /^<a href="mailto:/);
  assert.ok(first.organization.startsWith("pt:"));
  assert.match(last.requestor, /^<a href="mailto:/);
  assert.ok(last.organization.startsWith("pt:"));
});
