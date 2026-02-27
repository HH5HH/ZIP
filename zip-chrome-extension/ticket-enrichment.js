(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.ZipTicketEnrichment = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DEFAULT_SHOW_MANY_CHUNK_SIZE = 100;
  const DEFAULT_MAX_RETRIES = 3;
  const DEFAULT_INITIAL_BACKOFF_MS = 250;
  const DEFAULT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

  function toSafeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeEntityId(value) {
    if (value == null) return "";
    const id = String(value).trim();
    return id;
  }

  function normalizeEmailAddress(value) {
    const raw = toSafeString(value).toLowerCase();
    if (!raw) return "";
    const match = raw.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
    return match ? String(match[0]).toLowerCase() : "";
  }

  function coalesceText(candidates) {
    const values = Array.isArray(candidates) ? candidates : [];
    for (let i = 0; i < values.length; i += 1) {
      const text = toSafeString(values[i]).replace(/\s+/g, " ");
      if (text) return text;
    }
    return "";
  }

  function chunkArray(values, chunkSize) {
    const list = Array.isArray(values) ? values : [];
    if (!list.length) return [];
    const normalizedChunkSize = Math.max(1, Math.trunc(Number(chunkSize) || DEFAULT_SHOW_MANY_CHUNK_SIZE));
    const chunks = [];
    for (let i = 0; i < list.length; i += normalizedChunkSize) {
      chunks.push(list.slice(i, i + normalizedChunkSize));
    }
    return chunks;
  }

  function delay(ms) {
    const timeoutMs = Math.max(0, Math.trunc(Number(ms) || 0));
    return new Promise((resolve) => {
      setTimeout(resolve, timeoutMs);
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");
  }

  function translationCacheKey(source, locale) {
    return String(locale || "en").toLowerCase() + "::" + String(source || "");
  }

  function createTranslationCache(options) {
    const opts = options && typeof options === "object" ? options : {};
    const ttlMs = Math.max(0, Math.trunc(Number(opts.ttlMs) || DEFAULT_CACHE_TTL_MS));
    const now = opts.now && typeof opts.now === "function"
      ? opts.now
      : () => Date.now();
    const store = new Map();
    const stats = {
      hits: 0,
      misses: 0,
      writes: 0
    };

    const removeExpired = (key, entry, nowMs) => {
      if (!entry || typeof entry !== "object") return true;
      if (entry.expiresAt == null) return false;
      if (entry.expiresAt > nowMs) return false;
      store.delete(key);
      return true;
    };

    return {
      get(key) {
        const normalizedKey = String(key || "");
        if (!normalizedKey) return undefined;
        const entry = store.get(normalizedKey);
        const nowMs = now();
        if (!entry || removeExpired(normalizedKey, entry, nowMs)) {
          stats.misses += 1;
          return undefined;
        }
        stats.hits += 1;
        return entry.value;
      },
      set(key, value, customTtlMs) {
        const normalizedKey = String(key || "");
        if (!normalizedKey) return;
        const ttlOverride = Number(customTtlMs);
        const entryTtlMs = Number.isFinite(ttlOverride) && ttlOverride >= 0
          ? Math.trunc(ttlOverride)
          : ttlMs;
        const expiresAt = entryTtlMs > 0 ? now() + entryTtlMs : null;
        store.set(normalizedKey, { value, expiresAt });
        stats.writes += 1;
      },
      size() {
        return store.size;
      },
      stats() {
        return {
          hits: stats.hits,
          misses: stats.misses,
          writes: stats.writes,
          entries: store.size
        };
      }
    };
  }

  function mapBatchTranslations(sourceStrings, payload) {
    const map = new Map();
    const sources = Array.isArray(sourceStrings) ? sourceStrings : [];
    if (!sources.length) return map;
    if (Array.isArray(payload)) {
      for (let i = 0; i < sources.length; i += 1) {
        const translated = toSafeString(payload[i]);
        if (translated) map.set(sources[i], translated);
      }
      return map;
    }
    if (payload && typeof payload === "object") {
      for (let i = 0; i < sources.length; i += 1) {
        const source = sources[i];
        const translated = toSafeString(payload[source]);
        if (translated) map.set(source, translated);
      }
    }
    return map;
  }

  function createTranslatorAdapter(options) {
    const opts = options && typeof options === "object" ? options : {};
    const customTranslateBatch = typeof opts.translateBatch === "function"
      ? opts.translateBatch
      : null;
    return {
      async translateBatch(sourceStrings, translationOptions) {
        const input = (Array.isArray(sourceStrings) ? sourceStrings : [])
          .map((value) => toSafeString(value))
          .filter(Boolean);
        if (!input.length) return new Map();
        if (!customTranslateBatch) {
          const identity = new Map();
          input.forEach((value) => identity.set(value, value));
          return identity;
        }
        const optsForCall = translationOptions && typeof translationOptions === "object"
          ? translationOptions
          : {};
        const payload = await customTranslateBatch(input, optsForCall);
        return mapBatchTranslations(input, payload);
      }
    };
  }

  async function fetchShowManyEntities(options) {
    const opts = options && typeof options === "object" ? options : {};
    const ids = (Array.isArray(opts.ids) ? opts.ids : [])
      .map((value) => normalizeEntityId(value))
      .filter(Boolean);
    const fetchJson = typeof opts.fetchJson === "function" ? opts.fetchJson : null;
    const baseUrl = toSafeString(opts.baseUrl);
    const endpointPath = toSafeString(opts.endpointPath);
    const responseKey = toSafeString(opts.responseKey);
    const metrics = opts.metrics && typeof opts.metrics === "object" ? opts.metrics : {};

    if (!ids.length || !fetchJson || !baseUrl || !endpointPath || !responseKey) {
      return new Map();
    }

    const chunkSize = Math.max(1, Math.trunc(Number(opts.chunkSize) || DEFAULT_SHOW_MANY_CHUNK_SIZE));
    const maxRetries = Math.max(0, Math.trunc(Number(opts.maxRetries) || DEFAULT_MAX_RETRIES));
    const initialBackoffMs = Math.max(0, Math.trunc(Number(opts.initialBackoffMs) || DEFAULT_INITIAL_BACKOFF_MS));
    const chunks = chunkArray(Array.from(new Set(ids)), chunkSize);
    const out = new Map();

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      const chunk = chunks[chunkIndex];
      const chunkIds = chunk.join(",");
      const separator = endpointPath.includes("?") ? "&" : "?";
      const url = baseUrl + endpointPath + separator + "ids=" + encodeURIComponent(chunkIds);
      let success = false;
      let lastResponse = null;

      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        const result = await fetchJson(url);
        lastResponse = result || null;
        if (result && result.ok) {
          success = true;
          break;
        }
        const status = Number(result && result.status) || 0;
        const isRetryable = status === 429 || status === 503 || status === 502 || status === 500 || status === 504;
        if (!isRetryable || attempt >= maxRetries) break;
        if (metrics) {
          metrics.zendeskRateLimitRetries = Number(metrics.zendeskRateLimitRetries || 0) + 1;
        }
        const retryAfterMs = Number(result && result.retryAfterMs);
        const backoffMs = Number.isFinite(retryAfterMs) && retryAfterMs > 0
          ? retryAfterMs
          : initialBackoffMs * Math.pow(2, attempt);
        await delay(backoffMs);
      }

      if (!success) {
        if (metrics) {
          metrics.zendeskCallFailures = Number(metrics.zendeskCallFailures || 0) + 1;
        }
        continue;
      }

      const payload = lastResponse && typeof lastResponse.payload === "object" ? lastResponse.payload : {};
      const rows = Array.isArray(payload[responseKey]) ? payload[responseKey] : [];
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        const row = rows[rowIndex];
        if (!row || typeof row !== "object") continue;
        const id = normalizeEntityId(row.id);
        if (!id) continue;
        out.set(id, row);
      }
    }

    return out;
  }

  function buildTicketRequestorId(row) {
    const source = row && typeof row === "object" ? row : {};
    return normalizeEntityId(
      source.requester_id
      || source.requesterId
      || source.requestor_id
      || source.requestorId
      || (source.requester && source.requester.id)
      || (source.requestor && source.requestor.id)
    );
  }

  function buildTicketOrganizationId(row) {
    const source = row && typeof row === "object" ? row : {};
    return normalizeEntityId(
      source.organization_id
      || source.organizationId
      || (source.organization && source.organization.id)
    );
  }

  function buildRequestorName(ticket, user) {
    return coalesceText([
      user && user.name,
      user && user.display_name,
      user && user.alias,
      ticket && ticket.requestor_name_translated,
      ticket && ticket.requestor_name,
      ticket && ticket.requester_name,
      ticket && ticket.requesterName,
      ticket && ticket.requestorName,
      ticket && ticket.requester
    ]);
  }

  function buildRequestorEmail(ticket, user) {
    return normalizeEmailAddress(
      coalesceText([
        user && user.email,
        user && user.primary_email,
        ticket && ticket.requestor_email,
        ticket && ticket.requester_email,
        ticket && ticket.requesterEmail,
        ticket && ticket.requestorEmail
      ])
    );
  }

  function buildOrganizationName(ticket, organization) {
    return coalesceText([
      organization && organization.name,
      ticket && ticket.organization_name_translated,
      ticket && ticket.organization_name,
      ticket && ticket.organizationName,
      ticket && ticket.organization
    ]);
  }

  function buildRequestorAnchor(email, name) {
    const safeName = escapeHtml(name || "");
    const safeEmail = escapeHtml(email || "");
    if (!safeName && !safeEmail) return "";
    const label = safeName || safeEmail;
    if (!safeEmail) return label;
    return "<a href=\"mailto:" + safeEmail + "\">" + label + "</a>";
  }

  async function translateFields(rows, options) {
    const opts = options && typeof options === "object" ? options : {};
    const targetLocale = toSafeString(opts.targetLocale || "en-US");
    const translator = opts.translator && typeof opts.translator.translateBatch === "function"
      ? opts.translator
      : createTranslatorAdapter({});
    const cache = opts.translationCache && typeof opts.translationCache.get === "function" && typeof opts.translationCache.set === "function"
      ? opts.translationCache
      : createTranslationCache();
    const metrics = opts.metrics && typeof opts.metrics === "object" ? opts.metrics : {};

    const values = Array.isArray(rows) ? rows : [];
    const uniqueSources = [];
    const seenSources = new Set();
    for (let i = 0; i < values.length; i += 1) {
      const row = values[i];
      if (!row || typeof row !== "object") continue;
      const requestorName = toSafeString(row.requestorNameSource);
      const orgName = toSafeString(row.organizationNameSource);
      if (requestorName && !seenSources.has(requestorName)) {
        seenSources.add(requestorName);
        uniqueSources.push(requestorName);
      }
      if (orgName && !seenSources.has(orgName)) {
        seenSources.add(orgName);
        uniqueSources.push(orgName);
      }
    }

    const translated = new Map();
    const misses = [];
    for (let i = 0; i < uniqueSources.length; i += 1) {
      const source = uniqueSources[i];
      const cacheKey = translationCacheKey(source, targetLocale);
      const cached = cache.get(cacheKey);
      if (cached != null && String(cached).length > 0) {
        translated.set(source, String(cached));
        metrics.translationCacheHits = Number(metrics.translationCacheHits || 0) + 1;
      } else {
        misses.push(source);
        metrics.translationCacheMisses = Number(metrics.translationCacheMisses || 0) + 1;
      }
    }

    metrics.translationRequestedStrings = Number(metrics.translationRequestedStrings || 0) + misses.length;

    if (misses.length) {
      let translatedBatch = null;
      try {
        translatedBatch = await translator.translateBatch(misses, {
          targetLocale
        });
        metrics.translationBatchCalls = Number(metrics.translationBatchCalls || 0) + 1;
      } catch (_) {
        translatedBatch = null;
        metrics.translationFailures = Number(metrics.translationFailures || 0) + 1;
      }
      for (let i = 0; i < misses.length; i += 1) {
        const source = misses[i];
        const translatedValue = toSafeString(translatedBatch && translatedBatch.get && translatedBatch.get(source));
        const finalValue = translatedValue || source;
        translated.set(source, finalValue);
        cache.set(translationCacheKey(source, targetLocale), finalValue);
        if (translatedValue) {
          metrics.translationTranslatedStrings = Number(metrics.translationTranslatedStrings || 0) + 1;
        }
      }
    }

    return translated;
  }

  async function enrichTicketsWithRequestorOrg(inputTickets, options) {
    const startMs = Date.now();
    const opts = options && typeof options === "object" ? options : {};
    const tickets = Array.isArray(inputTickets) ? inputTickets : [];
    const metrics = {
      ticketCount: tickets.length,
      uniqueRequesterIds: 0,
      uniqueOrganizationIds: 0,
      zendeskUserShowManyCalls: 0,
      zendeskOrganizationShowManyCalls: 0,
      zendeskRateLimitRetries: 0,
      zendeskCallFailures: 0,
      translationCacheHits: 0,
      translationCacheMisses: 0,
      translationBatchCalls: 0,
      translationRequestedStrings: 0,
      translationTranslatedStrings: 0,
      translationFailures: 0,
      durationMs: 0
    };

    if (!tickets.length) {
      metrics.durationMs = Date.now() - startMs;
      return { tickets: [], metrics };
    }

    const baseUrl = toSafeString(opts.baseUrl);
    const fetchJson = typeof opts.fetchJson === "function" ? opts.fetchJson : null;
    const chunkSize = Math.max(1, Math.trunc(Number(opts.chunkSize) || DEFAULT_SHOW_MANY_CHUNK_SIZE));
    const maxRetries = Math.max(0, Math.trunc(Number(opts.maxRetries) || DEFAULT_MAX_RETRIES));
    const initialBackoffMs = Math.max(0, Math.trunc(Number(opts.initialBackoffMs) || DEFAULT_INITIAL_BACKOFF_MS));
    const targetLocale = toSafeString(opts.targetLocale || "en-US");
    const translationCache = opts.translationCache;
    const translator = opts.translator && typeof opts.translator.translateBatch === "function"
      ? opts.translator
      : createTranslatorAdapter({});

    const requesterIds = [];
    const organizationIds = [];
    const requesterSeen = new Set();
    const orgSeen = new Set();
    for (let i = 0; i < tickets.length; i += 1) {
      const ticket = tickets[i];
      const requesterId = buildTicketRequestorId(ticket);
      if (requesterId && !requesterSeen.has(requesterId)) {
        requesterSeen.add(requesterId);
        requesterIds.push(requesterId);
      }
      const organizationId = buildTicketOrganizationId(ticket);
      if (organizationId && !orgSeen.has(organizationId)) {
        orgSeen.add(organizationId);
        organizationIds.push(organizationId);
      }
    }

    metrics.uniqueRequesterIds = requesterIds.length;
    metrics.uniqueOrganizationIds = organizationIds.length;

    let usersById = new Map();
    let organizationsById = new Map();

    if (baseUrl && fetchJson && requesterIds.length) {
      metrics.zendeskUserShowManyCalls = chunkArray(requesterIds, chunkSize).length;
      usersById = await fetchShowManyEntities({
        ids: requesterIds,
        baseUrl,
        endpointPath: "/api/v2/users/show_many.json",
        responseKey: "users",
        chunkSize,
        maxRetries,
        initialBackoffMs,
        fetchJson,
        metrics
      });
    }
    if (baseUrl && fetchJson && organizationIds.length) {
      metrics.zendeskOrganizationShowManyCalls = chunkArray(organizationIds, chunkSize).length;
      organizationsById = await fetchShowManyEntities({
        ids: organizationIds,
        baseUrl,
        endpointPath: "/api/v2/organizations/show_many.json",
        responseKey: "organizations",
        chunkSize,
        maxRetries,
        initialBackoffMs,
        fetchJson,
        metrics
      });
    }

    const prepared = tickets.map((ticket) => {
      const requesterId = buildTicketRequestorId(ticket);
      const organizationId = buildTicketOrganizationId(ticket);
      const requestorUser = requesterId ? usersById.get(requesterId) : null;
      const organization = organizationId ? organizationsById.get(organizationId) : null;
      return {
        ticket,
        requesterId,
        organizationId,
        requestorEmailSource: buildRequestorEmail(ticket, requestorUser),
        requestorNameSource: buildRequestorName(ticket, requestorUser),
        organizationNameSource: buildOrganizationName(ticket, organization)
      };
    });

    const translated = await translateFields(prepared, {
      targetLocale,
      translator,
      translationCache,
      metrics
    });

    const out = prepared.map((row) => {
      const translatedRequestorName = toSafeString(translated.get(row.requestorNameSource) || row.requestorNameSource);
      const translatedOrganizationName = toSafeString(translated.get(row.organizationNameSource) || row.organizationNameSource);
      const requestorEmail = normalizeEmailAddress(row.requestorEmailSource);
      const requestorAnchor = buildRequestorAnchor(requestorEmail, translatedRequestorName);
      return {
        ...row.ticket,
        requestor: requestorAnchor,
        requestor_name: translatedRequestorName,
        requestor_name_translated: translatedRequestorName,
        requestor_email: requestorEmail,
        requester_name: translatedRequestorName || toSafeString(row.ticket && row.ticket.requester_name),
        requester_email: requestorEmail || toSafeString(row.ticket && row.ticket.requester_email),
        organization: translatedOrganizationName,
        organization_name: translatedOrganizationName,
        organization_name_translated: translatedOrganizationName
      };
    });

    metrics.durationMs = Date.now() - startMs;
    return {
      tickets: out,
      metrics
    };
  }

  return {
    createTranslationCache,
    createTranslatorAdapter,
    enrichTicketsWithRequestorOrg
  };
});
