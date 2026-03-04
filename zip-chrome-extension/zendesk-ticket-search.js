(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module && module.exports) {
    module.exports = api;
  }
  if (root && typeof root === "object") {
    root.ZIP_ZENDESK_TICKET_SEARCH = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : (typeof self !== "undefined" ? self : this), function () {
  "use strict";

  const DEFAULT_PAGE_SIZE = 100;
  const MAX_PAGE_SIZE = 100;
  const DEFAULT_MAX_RESULTS = 100;
  const DEFAULT_CACHE_TTL_SECONDS = 30;
  const DEFAULT_CONCURRENCY = 4;
  const DEFAULT_MAX_RETRIES = 3;
  const DEFAULT_BASE_BACKOFF_MS = 150;
  const DEFAULT_MAX_BACKOFF_MS = 4000;
  const DEFAULT_QUERY_DATE_RANGE_DAYS = 90;
  const DEFAULT_INCREMENTAL_SYNC_THRESHOLD = 10000;
  const DEFAULT_SLOW_PAGE_THRESHOLD_MS = 1500;
  const DEFAULT_STATUS_FILTERS = ["new", "open", "pending", "hold", "solved"];
  const DEFAULT_FIELDS_NEEDED = [
    "id",
    "result_type",
    "subject",
    "status",
    "priority",
    "created_at",
    "updated_at",
    "assignee_id",
    "assignee",
    "requester_id",
    "requester",
    "organization_id",
    "organization",
    "organization_name",
    "custom_fields",
    "tags",
    "via"
  ];
  const REQUIRED_ENRICHMENT_FIELDS = [
    "requester_id",
    "organization_id",
    "requester",
    "organization",
    "requester_name",
    "organization_name",
    "requester_email"
  ];
  const HEAVY_FIELDS = new Set(["comments", "comment_count", "audit", "audits", "events"]);
  const CACHE_NAMESPACE = "zip:zendesk:tickets:";

  function clampInt(value, fallback, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    const whole = Math.trunc(numeric);
    if (Number.isFinite(min) && whole < min) return min;
    if (Number.isFinite(max) && whole > max) return max;
    return whole;
  }

  function normalizeWhitespace(value) {
    return String(value == null ? "" : value)
      .replace(/\s+/g, " ")
      .trim();
  }

  function nowMs() {
    return Date.now();
  }

  function waitMs(delayMs) {
    const timeout = Math.max(0, Math.trunc(Number(delayMs) || 0));
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  }

  function toIsoDateDaysAgo(days, nowOverrideMs) {
    const dateRangeDays = clampInt(days, DEFAULT_QUERY_DATE_RANGE_DAYS, 1, 3650);
    const now = Number.isFinite(Number(nowOverrideMs)) ? Number(nowOverrideMs) : nowMs();
    const since = new Date(now - (dateRangeDays * 24 * 60 * 60 * 1000));
    const year = since.getUTCFullYear();
    const month = String(since.getUTCMonth() + 1).padStart(2, "0");
    const day = String(since.getUTCDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function hasToken(query, pattern) {
    return pattern.test(String(query || ""));
  }

  function hasTypeTicket(query) {
    return hasToken(query, /\btype\s*:\s*ticket\b/i);
  }

  function hasStatusConstraint(query) {
    return hasToken(query, /\bstatus\s*:\s*[\w-]+\b/i);
  }

  function hasDateConstraint(query) {
    return hasToken(query, /\b(?:updated|created)\s*(?:>=|<=|>|<|:)\s*[\w\-:TZ]+\b/i);
  }

  function hasTagConstraint(query) {
    return hasToken(query, /\btags?\s*:\s*[\w-]+\b/i);
  }

  function containsWildcard(value) {
    return /[*?]/.test(String(value || ""));
  }

  function isBroadWildcardQuery(rawQuery) {
    const normalized = String(rawQuery == null ? "" : rawQuery)
      .replace(/["']/g, "")
      .replace(/\s+/g, "")
      .trim();
    if (!normalized) return false;
    const stripped = normalized.replace(/[*?:()|&!~+-]/g, "");
    return stripped.length === 0;
  }

  function normalizeStatusFilters(value) {
    const input = Array.isArray(value) ? value : DEFAULT_STATUS_FILTERS;
    const filtered = input
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean);
    return filtered.length ? Array.from(new Set(filtered)) : DEFAULT_STATUS_FILTERS.slice();
  }

  function normalizeFieldsNeeded(fieldsNeeded, fallbackFields) {
    const fallback = Array.isArray(fallbackFields) && fallbackFields.length
      ? fallbackFields
      : DEFAULT_FIELDS_NEEDED;
    const input = Array.isArray(fieldsNeeded) && fieldsNeeded.length
      ? fieldsNeeded
      : fallback;
    const unique = [];
    const seen = new Set();
    for (let i = 0; i < input.length; i += 1) {
      const key = String(input[i] || "").trim();
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(key);
    }
    if (!seen.has("id")) unique.unshift("id");
    if (!seen.has("result_type")) unique.push("result_type");
    for (let i = 0; i < REQUIRED_ENRICHMENT_FIELDS.length; i += 1) {
      const required = REQUIRED_ENRICHMENT_FIELDS[i];
      if (seen.has(required)) continue;
      seen.add(required);
      unique.push(required);
    }
    return unique;
  }

  function tightenTicketSearchQuery(rawQuery, options) {
    const opts = options && typeof options === "object" ? options : {};
    const reasons = [];
    const requireWildcardOptIn = !!opts.requireWildcardOptIn;
    const allowBroadWildcard = !!opts.allowBroadWildcard;
    const defaultDateRangeDays = clampInt(opts.defaultDateRangeDays, DEFAULT_QUERY_DATE_RANGE_DAYS, 1, 3650);
    const statusFilters = normalizeStatusFilters(opts.statusFilters);
    const requiredTags = Array.isArray(opts.requiredTags)
      ? opts.requiredTags.map((tag) => String(tag || "").trim()).filter(Boolean)
      : [];

    const original = normalizeWhitespace(rawQuery);
    let query = original;
    const wildcardDetected = containsWildcard(query);
    const broadWildcard = wildcardDetected && isBroadWildcardQuery(query);
    let wildcardBlocked = false;

    if (wildcardDetected) {
      if (requireWildcardOptIn && broadWildcard && !allowBroadWildcard) {
        wildcardBlocked = true;
        reasons.push("wildcard_blocked");
      } else {
        query = normalizeWhitespace(query.replace(/[*?]+/g, " "));
        reasons.push("wildcards_stripped");
      }
    }

    if (!query) {
      query = "";
      reasons.push("empty_query_defaulted");
    }

    if (!hasTypeTicket(query)) {
      query = normalizeWhitespace("type:ticket " + query);
      reasons.push("type_ticket_added");
    }

    if (!hasStatusConstraint(query)) {
      query = normalizeWhitespace(query + " " + statusFilters.map((status) => "status:" + status).join(" "));
      reasons.push("status_constraints_added");
    }

    if (!hasDateConstraint(query)) {
      const dateValue = toIsoDateDaysAgo(defaultDateRangeDays, opts.nowMs);
      query = normalizeWhitespace(query + " updated>=" + dateValue);
      reasons.push("date_constraint_added");
    }

    if (requiredTags.length && !hasTagConstraint(query)) {
      query = normalizeWhitespace(query + " " + requiredTags.map((tag) => "tags:" + tag).join(" "));
      reasons.push("required_tags_added");
    }

    return {
      query,
      applied: reasons.length > 0,
      reasons,
      wildcardDetected,
      wildcardBlocked,
      broadWildcard
    };
  }

  function stableStringify(value) {
    if (value == null) return "null";
    const valueType = typeof value;
    if (valueType === "string") return JSON.stringify(value);
    if (valueType === "number" || valueType === "boolean") return String(value);
    if (Array.isArray(value)) {
      return "[" + value.map((item) => stableStringify(item)).join(",") + "]";
    }
    const keys = Object.keys(value).sort();
    return "{" + keys.map((key) => JSON.stringify(key) + ":" + stableStringify(value[key])).join(",") + "}";
  }

  function parseRetryAfterMs(headers) {
    if (!headers || typeof headers.get !== "function") return 0;
    const raw = String(headers.get("Retry-After") || "").trim();
    if (!raw) return 0;
    const asNumber = Number(raw);
    if (Number.isFinite(asNumber) && asNumber >= 0) {
      return Math.trunc(asNumber * 1000);
    }
    const asDate = Date.parse(raw);
    if (!Number.isFinite(asDate)) return 0;
    return Math.max(0, Math.trunc(asDate - nowMs()));
  }

  function parseRateLimitState(headers) {
    if (!headers || typeof headers.get !== "function") {
      return { limit: null, remaining: null, resetAtMs: null };
    }
    const limitRaw = Number(headers.get("X-Rate-Limit"));
    const remainingRaw = Number(headers.get("X-Rate-Limit-Remaining"));
    const resetRaw = Number(headers.get("X-Rate-Limit-Reset"));
    return {
      limit: Number.isFinite(limitRaw) ? Math.trunc(limitRaw) : null,
      remaining: Number.isFinite(remainingRaw) ? Math.trunc(remainingRaw) : null,
      resetAtMs: Number.isFinite(resetRaw) ? Math.trunc(resetRaw * 1000) : null
    };
  }

  function computeBackoffMs(attempt, options) {
    const opts = options && typeof options === "object" ? options : {};
    const base = clampInt(opts.baseBackoffMs, DEFAULT_BASE_BACKOFF_MS, 25, DEFAULT_MAX_BACKOFF_MS);
    const maxBackoffMs = clampInt(opts.maxBackoffMs, DEFAULT_MAX_BACKOFF_MS, base, 60 * 1000);
    const randomFn = typeof opts.randomFn === "function" ? opts.randomFn : Math.random;
    const exponential = Math.min(maxBackoffMs, base * Math.pow(2, Math.max(0, attempt - 1)));
    const jitter = Math.trunc((Math.max(0, randomFn()) % 1) * (base * 0.8));
    return Math.min(maxBackoffMs, exponential + jitter);
  }

  function isTransientStatus(status) {
    const code = Number(status) || 0;
    return code === 429 || code === 500 || code === 502 || code === 503 || code === 504;
  }

  function isIdempotentMethod(method) {
    const normalized = String(method || "GET").toUpperCase();
    return normalized === "GET" || normalized === "HEAD" || normalized === "OPTIONS";
  }

  class RequestLimiter {
    constructor(concurrency) {
      this.concurrency = clampInt(concurrency, DEFAULT_CONCURRENCY, 1, 64);
      this.activeCount = 0;
      this.queue = [];
    }

    run(task) {
      return new Promise((resolve, reject) => {
        this.queue.push({ task, resolve, reject });
        this._drain();
      });
    }

    _drain() {
      while (this.activeCount < this.concurrency && this.queue.length) {
        const item = this.queue.shift();
        this.activeCount += 1;
        Promise.resolve()
          .then(() => item.task())
          .then((value) => item.resolve(value))
          .catch((error) => item.reject(error))
          .finally(() => {
            this.activeCount -= 1;
            this._drain();
          });
      }
    }
  }

  class InMemoryLruCache {
    constructor(options) {
      const opts = options && typeof options === "object" ? options : {};
      this.maxEntries = clampInt(opts.maxEntries, 256, 8, 5000);
      this.store = new Map();
    }

    get(key) {
      const entry = this.store.get(key);
      if (!entry) return null;
      if (entry.expiresAtMs <= nowMs()) {
        this.store.delete(key);
        return null;
      }
      this.store.delete(key);
      this.store.set(key, entry);
      return entry.value;
    }

    set(key, value, ttlMs) {
      const ttl = Math.max(0, Math.trunc(Number(ttlMs) || 0));
      if (!ttl) return;
      if (this.store.has(key)) {
        this.store.delete(key);
      }
      this.store.set(key, {
        value,
        expiresAtMs: nowMs() + ttl
      });
      this._evict();
    }

    _evict() {
      while (this.store.size > this.maxEntries) {
        const oldest = this.store.keys().next();
        if (oldest && !oldest.done) {
          this.store.delete(oldest.value);
        } else {
          break;
        }
      }
    }
  }

  function createInMemoryLruCache(options) {
    return new InMemoryLruCache(options);
  }

  function createCacheAdapter(options) {
    const opts = options && typeof options === "object" ? options : {};
    const redis = opts.redisClient && typeof opts.redisClient === "object" ? opts.redisClient : null;
    if (redis && typeof redis.get === "function") {
      return {
        async get(key) {
          try {
            const raw = await redis.get(key);
            if (!raw) return null;
            return JSON.parse(raw);
          } catch (_) {
            return null;
          }
        },
        async set(key, value, ttlMs) {
          const ttlSeconds = Math.max(1, Math.ceil(Math.max(0, Number(ttlMs) || 0) / 1000));
          try {
            const payload = JSON.stringify(value);
            if (typeof redis.setEx === "function") {
              await redis.setEx(key, ttlSeconds, payload);
              return;
            }
            if (typeof redis.setex === "function") {
              await redis.setex(key, ttlSeconds, payload);
              return;
            }
            if (typeof redis.set === "function") {
              await redis.set(key, payload, { EX: ttlSeconds });
            }
          } catch (_) {}
        }
      };
    }

    const memory = opts.memoryCache instanceof InMemoryLruCache
      ? opts.memoryCache
      : new InMemoryLruCache({ maxEntries: opts.cacheMaxEntries });
    return {
      async get(key) {
        return memory.get(key);
      },
      async set(key, value, ttlMs) {
        memory.set(key, value, ttlMs);
      }
    };
  }

  class ZendeskHttpClient {
    constructor(config) {
      const cfg = config && typeof config === "object" ? config : {};
      this.fetchImpl = typeof cfg.fetchImpl === "function" ? cfg.fetchImpl : null;
      if (!this.fetchImpl) {
        throw new Error("ZendeskHttpClient requires fetchImpl.");
      }
      this.maxRetries = clampInt(cfg.maxRetries, DEFAULT_MAX_RETRIES, 0, 10);
      this.baseBackoffMs = clampInt(cfg.baseBackoffMs, DEFAULT_BASE_BACKOFF_MS, 25, 5000);
      this.maxBackoffMs = clampInt(cfg.maxBackoffMs, DEFAULT_MAX_BACKOFF_MS, this.baseBackoffMs, 60000);
      this.randomFn = typeof cfg.randomFn === "function" ? cfg.randomFn : Math.random;
      this.logger = typeof cfg.logger === "function" ? cfg.logger : null;
      this.limiter = new RequestLimiter(cfg.concurrency);
    }

    async requestJson(url, options) {
      return this.limiter.run(() => this._requestJsonInternal(url, options));
    }

    async _requestJsonInternal(url, options) {
      const opts = options && typeof options === "object" ? options : {};
      const method = String(opts.method || "GET").toUpperCase();
      const idempotent = Object.prototype.hasOwnProperty.call(opts, "idempotent")
        ? !!opts.idempotent
        : isIdempotentMethod(method);
      const maxRetries = clampInt(opts.maxRetries, this.maxRetries, 0, 10);
      const headers = {
        Accept: "application/json",
        ...(opts.headers && typeof opts.headers === "object" ? opts.headers : {})
      };

      let attempt = 0;
      let retryCount = 0;
      while (attempt <= maxRetries) {
        attempt += 1;
        const startedAt = nowMs();
        try {
          const response = await this.fetchImpl(url, {
            method,
            cache: "no-store",
            credentials: "include",
            headers,
            signal: opts.signal
          });
          const endedAt = nowMs();
          const durationMs = Math.max(0, endedAt - startedAt);
          const status = Number(response && response.status) || 0;
          const retryAfterMs = parseRetryAfterMs(response && response.headers);
          const rateLimit = parseRateLimitState(response && response.headers);
          const ok = !!(response && response.ok);

          let payload = null;
          let text = "";
          try {
            if (response && typeof response.text === "function") {
              text = String(await response.text() || "");
              if (text) {
                try {
                  payload = JSON.parse(text);
                } catch (_) {}
              }
            }
          } catch (_) {}

          if (isTransientStatus(status) && idempotent && attempt <= maxRetries) {
            retryCount += 1;
            const waitForMs = retryAfterMs > 0
              ? retryAfterMs
              : computeBackoffMs(attempt, {
                baseBackoffMs: this.baseBackoffMs,
                maxBackoffMs: this.maxBackoffMs,
                randomFn: this.randomFn
              });
            if (this.logger) {
              this.logger({
                type: "zendesk_retry",
                url,
                status,
                attempt,
                waitForMs,
                retryAfterMs,
                rateLimit
              });
            }
            await waitMs(waitForMs);
            continue;
          }

          return {
            ok,
            status,
            payload,
            text,
            durationMs,
            retryAfterMs,
            rateLimit,
            attempt,
            retries: retryCount
          };
        } catch (error) {
          const endedAt = nowMs();
          const durationMs = Math.max(0, endedAt - startedAt);
          if (!idempotent || attempt > maxRetries) {
            return {
              ok: false,
              status: 0,
              payload: null,
              text: "",
              durationMs,
              retryAfterMs: 0,
              rateLimit: { limit: null, remaining: null, resetAtMs: null },
              attempt,
              retries: retryCount,
              error: error instanceof Error ? error : new Error("Request failed")
            };
          }
          retryCount += 1;
          const waitForMs = computeBackoffMs(attempt, {
            baseBackoffMs: this.baseBackoffMs,
            maxBackoffMs: this.maxBackoffMs,
            randomFn: this.randomFn
          });
          if (this.logger) {
            this.logger({
              type: "zendesk_retry",
              url,
              status: 0,
              attempt,
              waitForMs,
              error: error && error.message ? error.message : "network_error"
            });
          }
          await waitMs(waitForMs);
        }
      }

      return {
        ok: false,
        status: 0,
        payload: null,
        text: "",
        durationMs: 0,
        retryAfterMs: 0,
        rateLimit: { limit: null, remaining: null, resetAtMs: null },
        attempt,
        retries: retryCount,
        error: new Error("Request retries exhausted")
      };
    }
  }

  function normalizeBaseUrl(baseUrl) {
    const raw = String(baseUrl || "").trim();
    if (!raw) throw new Error("Zendesk baseUrl is required.");
    return raw.replace(/\/+$/, "");
  }

  function toAbsoluteUrl(urlValue, baseUrl) {
    const raw = String(urlValue || "").trim();
    if (!raw) return "";
    try {
      return new URL(raw, baseUrl).toString();
    } catch (_) {
      return raw;
    }
  }

  function parseCursorFromPayload(payload) {
    if (!payload || typeof payload !== "object") return "";
    const meta = payload.meta && typeof payload.meta === "object" ? payload.meta : null;
    if (meta && meta.after_cursor) return String(meta.after_cursor);
    if (payload.after_cursor) return String(payload.after_cursor);
    if (payload.response_metadata && payload.response_metadata.next_cursor) {
      return String(payload.response_metadata.next_cursor);
    }
    return "";
  }

  function hasMoreInPayload(payload) {
    if (!payload || typeof payload !== "object") return false;
    const meta = payload.meta && typeof payload.meta === "object" ? payload.meta : null;
    if (meta && typeof meta.has_more === "boolean") return meta.has_more;
    if (typeof payload.has_more === "boolean") return payload.has_more;
    if (typeof payload.end_of_stream === "boolean") return !payload.end_of_stream;
    if (typeof payload.next_page === "string" && payload.next_page.trim()) return true;
    if (payload.links && typeof payload.links === "object" && typeof payload.links.next === "string" && payload.links.next.trim()) return true;
    if (typeof payload.after_url === "string" && payload.after_url.trim()) return true;
    return false;
  }

  function extractNextCursorUrl(payload, currentUrl, options) {
    const opts = options && typeof options === "object" ? options : {};
    const baseUrl = normalizeBaseUrl(opts.baseUrl || "");
    if (!payload || typeof payload !== "object") return "";

    const direct = [
      payload.links && payload.links.next,
      payload.next_page,
      payload.after_url,
      payload.next
    ].find((value) => typeof value === "string" && value.trim());
    if (direct) {
      return toAbsoluteUrl(direct, baseUrl);
    }

    const cursor = parseCursorFromPayload(payload);
    if (!cursor || !hasMoreInPayload(payload)) return "";

    const sourceUrl = String(currentUrl || "").trim() || (baseUrl + "/api/v2/search/export.json");
    try {
      const parsed = new URL(sourceUrl, baseUrl);
      if (parsed.pathname.includes("/incremental/")) {
        parsed.searchParams.set("cursor", cursor);
      } else {
        parsed.searchParams.set("page[after]", cursor);
      }
      return parsed.toString();
    } catch (_) {
      return "";
    }
  }

  function pickTicketFields(ticket, fieldsNeededSet) {
    if (!ticket || typeof ticket !== "object") return null;
    if (!fieldsNeededSet || !fieldsNeededSet.size) return ticket;
    const out = {};
    fieldsNeededSet.forEach((fieldName) => {
      if (Object.prototype.hasOwnProperty.call(ticket, fieldName)) {
        out[fieldName] = ticket[fieldName];
      }
    });
    if (!Object.prototype.hasOwnProperty.call(out, "id") && Object.prototype.hasOwnProperty.call(ticket, "id")) {
      out.id = ticket.id;
    }
    if (!Object.prototype.hasOwnProperty.call(out, "result_type") && Object.prototype.hasOwnProperty.call(ticket, "result_type")) {
      out.result_type = ticket.result_type;
    }
    return out;
  }

  function trimHeavyFields(ticket, fieldsNeededSet) {
    if (!ticket || typeof ticket !== "object") return ticket;
    if (!fieldsNeededSet || !fieldsNeededSet.size) return ticket;
    const trimmed = { ...ticket };
    HEAVY_FIELDS.forEach((fieldName) => {
      if (!fieldsNeededSet.has(fieldName) && Object.prototype.hasOwnProperty.call(trimmed, fieldName)) {
        delete trimmed[fieldName];
      }
    });
    return trimmed;
  }

  function shouldIncludeTicketByType(ticket) {
    if (!ticket || typeof ticket !== "object") return false;
    const resultType = String(ticket.result_type || "ticket").toLowerCase();
    return !resultType || resultType === "ticket";
  }

  function buildSearchExportUrl(baseUrl, query, options) {
    const opts = options && typeof options === "object" ? options : {};
    const url = new URL(baseUrl + "/api/v2/search/export.json");
    const pageSize = clampInt(opts.pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
    url.searchParams.set("query", query);
    url.searchParams.set("filter[type]", "ticket");
    url.searchParams.set("page[size]", String(pageSize));
    if (Array.isArray(opts.fieldsNeeded) && opts.fieldsNeeded.length) {
      url.searchParams.set("fields", opts.fieldsNeeded.join(","));
    }
    if (opts.sortBy) {
      url.searchParams.set("sort_by", String(opts.sortBy));
    }
    if (opts.sortOrder) {
      url.searchParams.set("sort_order", String(opts.sortOrder));
    }
    return url.toString();
  }

  function resolveIncrementalStartTimeSeconds(options) {
    const opts = options && typeof options === "object" ? options : {};
    const explicit = Number(opts.incrementalStartTime || opts.startTime || 0);
    if (Number.isFinite(explicit) && explicit > 0) {
      return Math.max(1, Math.trunc(explicit));
    }
    const days = clampInt(opts.defaultDateRangeDays, DEFAULT_QUERY_DATE_RANGE_DAYS, 1, 3650);
    const secondsAgo = days * 24 * 60 * 60;
    const unixNow = Math.floor(nowMs() / 1000);
    return Math.max(1, unixNow - secondsAgo);
  }

  function buildIncrementalUrl(baseUrl, options) {
    const opts = options && typeof options === "object" ? options : {};
    if (opts.resumeUrl) return toAbsoluteUrl(opts.resumeUrl, baseUrl);

    const url = new URL(baseUrl + "/api/v2/incremental/tickets/cursor.json");
    const pageSize = clampInt(opts.pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
    const cursor = String(opts.resumeCursor || "").trim();
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    } else {
      const startTime = resolveIncrementalStartTimeSeconds(opts);
      url.searchParams.set("start_time", String(startTime));
    }
    url.searchParams.set("page[size]", String(pageSize));
    if (Array.isArray(opts.fieldsNeeded) && opts.fieldsNeeded.length) {
      url.searchParams.set("fields", opts.fieldsNeeded.join(","));
    }
    return url.toString();
  }

  function parseQueryFilterSpec(query) {
    const normalized = normalizeWhitespace(query).toLowerCase();
    const tokens = normalized ? normalized.split(" ").filter(Boolean) : [];
    const statuses = [];
    const exact = Object.create(null);
    const freeText = [];

    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      if (token.startsWith("status:")) {
        const value = token.slice("status:".length).trim();
        if (value) statuses.push(value);
        continue;
      }
      if (token.startsWith("assignee_id:")) {
        exact.assignee_id = token.slice("assignee_id:".length).trim();
        continue;
      }
      if (token.startsWith("organization_id:")) {
        exact.organization_id = token.slice("organization_id:".length).trim();
        continue;
      }
      if (token.startsWith("group_id:")) {
        exact.group_id = token.slice("group_id:".length).trim();
        continue;
      }
      if (token.startsWith("type:")) continue;
      if (token.startsWith("updated") || token.startsWith("created")) continue;
      if (token.startsWith("tags:")) continue;
      freeText.push(token);
    }

    return {
      statuses: Array.from(new Set(statuses)),
      exact,
      freeText
    };
  }

  function ticketMatchesFilterSpec(ticket, filterSpec) {
    if (!ticket || typeof ticket !== "object") return false;
    const spec = filterSpec && typeof filterSpec === "object" ? filterSpec : { statuses: [], exact: {}, freeText: [] };

    if (Array.isArray(spec.statuses) && spec.statuses.length) {
      const status = String(ticket.status || "").trim().toLowerCase();
      if (!status || !spec.statuses.includes(status)) return false;
    }

    const exact = spec.exact && typeof spec.exact === "object" ? spec.exact : {};
    const exactKeys = Object.keys(exact);
    for (let i = 0; i < exactKeys.length; i += 1) {
      const key = exactKeys[i];
      const expected = String(exact[key] || "").trim();
      if (!expected) continue;
      const actual = String(ticket[key] == null ? "" : ticket[key]).trim();
      if (actual !== expected) return false;
    }

    if (Array.isArray(spec.freeText) && spec.freeText.length) {
      const haystack = (
        String(ticket.subject || "") + " "
        + String(ticket.description || "") + " "
        + String(ticket.status || "")
      ).toLowerCase();
      for (let i = 0; i < spec.freeText.length; i += 1) {
        if (!haystack.includes(spec.freeText[i])) return false;
      }
    }

    return true;
  }

  function normalizeMetrics(result, debugEnabled) {
    const metrics = {
      totalSearchMs: Math.max(0, Math.trunc(result.totalSearchMs || 0)),
      zendeskMs: Math.max(0, Math.trunc(result.zendeskMs || 0)),
      pagesFetched: Math.max(0, Math.trunc(result.pagesFetched || 0)),
      itemsReturned: Math.max(0, Math.trunc(result.itemsReturned || 0)),
      retryCount: Math.max(0, Math.trunc(result.retryCount || 0)),
      cacheHit: !!result.cacheHit,
      cacheLayer: String(result.cacheLayer || "none"),
      queryTightened: !!result.queryTightened,
      usedIncremental: !!result.usedIncremental
    };
    if (debugEnabled) {
      metrics.debug = {
        pages: Array.isArray(result.debugPages) ? result.debugPages : [],
        tightenedReasons: Array.isArray(result.tightenedReasons) ? result.tightenedReasons : [],
        recommendation: result.recommendation || "",
        query: String(result.query || "")
      };
    }
    return metrics;
  }

  class ZendeskTicketSearchService {
    constructor(config) {
      const cfg = config && typeof config === "object" ? config : {};
      this.baseUrl = normalizeBaseUrl(cfg.baseUrl);
      this.authScope = String(cfg.authScope || this.baseUrl);
      this.logger = typeof cfg.logger === "function" ? cfg.logger : null;
      this.defaultFields = normalizeFieldsNeeded(cfg.defaultFields, DEFAULT_FIELDS_NEEDED);
      this.cacheAdapter = createCacheAdapter({
        redisClient: cfg.redisClient,
        memoryCache: cfg.memoryCache,
        cacheMaxEntries: cfg.cacheMaxEntries
      });
      this.httpClient = new ZendeskHttpClient({
        fetchImpl: cfg.fetchImpl,
        concurrency: clampInt(cfg.concurrency, DEFAULT_CONCURRENCY, 1, 64),
        maxRetries: clampInt(cfg.maxRetries, DEFAULT_MAX_RETRIES, 0, 10),
        baseBackoffMs: clampInt(cfg.baseBackoffMs, DEFAULT_BASE_BACKOFF_MS, 25, 10000),
        maxBackoffMs: clampInt(cfg.maxBackoffMs, DEFAULT_MAX_BACKOFF_MS, 100, 60000),
        randomFn: cfg.randomFn,
        logger: this.logger
      });
      this.incrementalSyncThreshold = clampInt(cfg.incrementalSyncThreshold, DEFAULT_INCREMENTAL_SYNC_THRESHOLD, 1000, 500000);
      this.defaultDateRangeDays = clampInt(cfg.defaultDateRangeDays, DEFAULT_QUERY_DATE_RANGE_DAYS, 1, 3650);
    }

    tightenQuery(rawQuery, options) {
      return tightenTicketSearchQuery(rawQuery, {
        ...(options && typeof options === "object" ? options : {}),
        defaultDateRangeDays: options && options.defaultDateRangeDays != null
          ? options.defaultDateRangeDays
          : this.defaultDateRangeDays
      });
    }

    async searchTickets(rawQuery, options) {
      const opts = options && typeof options === "object" ? options : {};
      const debug = !!opts.debug;
      const startedAt = nowMs();
      const maxResults = clampInt(
        Object.prototype.hasOwnProperty.call(opts, "maxResults") ? opts.maxResults : opts.limit,
        DEFAULT_MAX_RESULTS,
        1,
        100000
      );
      const pageSize = clampInt(opts.pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
      const fieldsNeeded = normalizeFieldsNeeded(opts.fieldsNeeded, this.defaultFields);
      const fieldsSet = new Set(fieldsNeeded);
      const cacheTTLSeconds = clampInt(opts.cacheTTL, DEFAULT_CACHE_TTL_SECONDS, 0, 3600);
      const cacheTTLms = cacheTTLSeconds * 1000;
      const fallbackThresholdMs = clampInt(opts.fallbackThreshold, DEFAULT_SLOW_PAGE_THRESHOLD_MS, 1, 60000);
      const useIncremental = !!opts.useIncremental
        || !!opts.sync
        || maxResults > clampInt(opts.syncThreshold, this.incrementalSyncThreshold, 1000, 500000);

      const tightened = this.tightenQuery(rawQuery, {
        requireWildcardOptIn: !!opts.requireWildcardOptIn,
        allowBroadWildcard: !!opts.allowBroadWildcard,
        defaultDateRangeDays: opts.defaultDateRangeDays,
        statusFilters: opts.statusFilters,
        requiredTags: opts.requiredTags,
        nowMs: opts.nowMs
      });

      if (tightened.wildcardBlocked) {
        const blockedResult = {
          tickets: [],
          totalSearchMs: nowMs() - startedAt,
          zendeskMs: 0,
          pagesFetched: 0,
          itemsReturned: 0,
          retryCount: 0,
          cacheHit: false,
          cacheLayer: "none",
          queryTightened: tightened.applied,
          usedIncremental: false,
          tightenedReasons: tightened.reasons,
          query: tightened.query
        };
        if (this.logger) {
          this.logger({
            type: "ticket_search_blocked",
            reason: "wildcard_opt_in_required",
            query: String(rawQuery || "")
          });
        }
        return {
          error: "Broad wildcard searches require explicit opt-in.",
          tickets: [],
          metrics: normalizeMetrics(blockedResult, debug)
        };
      }

      const baseCachePayload = {
        query: tightened.query,
        pageSize,
        fieldsNeeded,
        authScope: String(opts.authScope || this.authScope),
        useIncremental
      };
      const fullCacheKey = CACHE_NAMESPACE + "full:" + stableStringify({ ...baseCachePayload, maxResults });
      const firstPageCacheKey = CACHE_NAMESPACE + "first:" + stableStringify(baseCachePayload);

      if (cacheTTLms > 0) {
        const cachedFull = await this.cacheAdapter.get(fullCacheKey);
        if (cachedFull && Array.isArray(cachedFull.tickets)) {
          const cacheTickets = cachedFull.tickets.slice(0, maxResults);
          const cacheResult = {
            tickets: cacheTickets,
            totalSearchMs: nowMs() - startedAt,
            zendeskMs: 0,
            pagesFetched: 0,
            itemsReturned: cacheTickets.length,
            retryCount: 0,
            cacheHit: true,
            cacheLayer: "full",
            queryTightened: tightened.applied,
            usedIncremental: !!cachedFull.usedIncremental,
            tightenedReasons: tightened.reasons,
            query: tightened.query
          };
          return {
            tickets: cacheTickets,
            metrics: normalizeMetrics(cacheResult, debug)
          };
        }

        if (maxResults <= pageSize) {
          const cachedFirst = await this.cacheAdapter.get(firstPageCacheKey);
          if (cachedFirst && Array.isArray(cachedFirst.tickets) && cachedFirst.tickets.length) {
            const firstTickets = cachedFirst.tickets.slice(0, maxResults);
            const cacheResult = {
              tickets: firstTickets,
              totalSearchMs: nowMs() - startedAt,
              zendeskMs: 0,
              pagesFetched: 0,
              itemsReturned: firstTickets.length,
              retryCount: 0,
              cacheHit: true,
              cacheLayer: "first_page",
              queryTightened: tightened.applied,
              usedIncremental: false,
              tightenedReasons: tightened.reasons,
              query: tightened.query
            };
            return {
              tickets: firstTickets,
              metrics: normalizeMetrics(cacheResult, debug)
            };
          }
        }
      }

      const pagesDebug = [];
      let zendeskMs = 0;
      let retryCount = 0;
      let pagesFetched = 0;
      let recommendation = "";
      let resume = null;
      const seenTicketIds = new Set();
      const tickets = [];

      const collectTicket = (rawTicket) => {
        if (!shouldIncludeTicketByType(rawTicket)) return;
        const ticketId = String(rawTicket && rawTicket.id != null ? rawTicket.id : "").trim();
        if (!ticketId || seenTicketIds.has(ticketId)) return;
        seenTicketIds.add(ticketId);
        const strippedHeavy = trimHeavyFields(rawTicket, fieldsSet);
        const selected = pickTicketFields(strippedHeavy, fieldsSet);
        if (!selected) return;
        tickets.push(selected);
      };

      if (useIncremental) {
        const filterSpec = parseQueryFilterSpec(tightened.query);
        let nextUrl = buildIncrementalUrl(this.baseUrl, {
          resumeUrl: opts.resumeUrl,
          resumeCursor: opts.resumeCursor,
          incrementalStartTime: opts.incrementalStartTime,
          defaultDateRangeDays: opts.defaultDateRangeDays,
          pageSize,
          fieldsNeeded
        });

        while (nextUrl && tickets.length < maxResults) {
          const response = await this.httpClient.requestJson(nextUrl, {
            method: "GET",
            idempotent: true
          });
          zendeskMs += response.durationMs;
          retryCount += response.retries || 0;
          pagesFetched += 1;
          if (debug) {
            pagesDebug.push({
              url: nextUrl,
              status: response.status,
              durationMs: response.durationMs,
              retries: response.retries || 0,
              rows: Array.isArray(response.payload && response.payload.tickets) ? response.payload.tickets.length : 0
            });
          }

          if (pagesFetched === 1 && response.durationMs > fallbackThresholdMs) {
            recommendation = "First incremental page is slow; consider resume-based sync windows.";
            if (this.logger) {
              this.logger({
                type: "ticket_search_recommend_incremental",
                strategy: "incremental",
                durationMs: response.durationMs,
                thresholdMs: fallbackThresholdMs,
                query: tightened.query
              });
            }
          }

          if (response.status === 401 || response.status === 403) {
            return {
              error: "Session expired",
              tickets: [],
              metrics: normalizeMetrics({
                totalSearchMs: nowMs() - startedAt,
                zendeskMs,
                pagesFetched,
                itemsReturned: 0,
                retryCount,
                cacheHit: false,
                cacheLayer: "none",
                queryTightened: tightened.applied,
                usedIncremental: true,
                tightenedReasons: tightened.reasons,
                query: tightened.query,
                debugPages: pagesDebug,
                recommendation
              }, debug)
            };
          }

          if (!response.ok || !response.payload) {
            return {
              error: "Incremental ticket sync failed (HTTP " + response.status + ")",
              tickets: [],
              metrics: normalizeMetrics({
                totalSearchMs: nowMs() - startedAt,
                zendeskMs,
                pagesFetched,
                itemsReturned: 0,
                retryCount,
                cacheHit: false,
                cacheLayer: "none",
                queryTightened: tightened.applied,
                usedIncremental: true,
                tightenedReasons: tightened.reasons,
                query: tightened.query,
                debugPages: pagesDebug,
                recommendation
              }, debug)
            };
          }

          const rows = Array.isArray(response.payload.tickets) ? response.payload.tickets : [];
          for (let i = 0; i < rows.length; i += 1) {
            if (!ticketMatchesFilterSpec(rows[i], filterSpec)) continue;
            collectTicket(rows[i]);
            if (tickets.length >= maxResults) break;
          }

          if (tickets.length >= maxResults) {
            const afterCursor = parseCursorFromPayload(response.payload);
            const nextCursorUrl = extractNextCursorUrl(response.payload, nextUrl, { baseUrl: this.baseUrl });
            resume = {
              cursor: afterCursor || "",
              nextUrl: nextCursorUrl || "",
              startTime: resolveIncrementalStartTimeSeconds(opts)
            };
            break;
          }

          nextUrl = extractNextCursorUrl(response.payload, nextUrl, { baseUrl: this.baseUrl });
          if (!nextUrl) {
            const afterCursor = parseCursorFromPayload(response.payload);
            if (afterCursor) {
              resume = {
                cursor: afterCursor,
                nextUrl: "",
                startTime: resolveIncrementalStartTimeSeconds(opts)
              };
            }
          }
        }
      } else {
        let nextUrl = buildSearchExportUrl(this.baseUrl, tightened.query, {
          pageSize,
          fieldsNeeded,
          sortBy: opts.sortBy,
          sortOrder: opts.sortOrder
        });

        while (nextUrl && tickets.length < maxResults) {
          const response = await this.httpClient.requestJson(nextUrl, {
            method: "GET",
            idempotent: true
          });
          zendeskMs += response.durationMs;
          retryCount += response.retries || 0;
          pagesFetched += 1;
          const rows = Array.isArray(response.payload && response.payload.results)
            ? response.payload.results
            : Array.isArray(response.payload && response.payload.tickets)
              ? response.payload.tickets
              : [];

          if (debug) {
            pagesDebug.push({
              url: nextUrl,
              status: response.status,
              durationMs: response.durationMs,
              retries: response.retries || 0,
              rows: rows.length
            });
          }

          if (pagesFetched === 1 && response.durationMs > fallbackThresholdMs) {
            recommendation = "First search page is slow; consider incremental sync for large workloads.";
            if (this.logger) {
              this.logger({
                type: "ticket_search_recommend_incremental",
                strategy: "search_export",
                durationMs: response.durationMs,
                thresholdMs: fallbackThresholdMs,
                query: tightened.query
              });
            }
          }

          if (response.status === 401 || response.status === 403) {
            return {
              error: "Session expired",
              tickets: [],
              metrics: normalizeMetrics({
                totalSearchMs: nowMs() - startedAt,
                zendeskMs,
                pagesFetched,
                itemsReturned: 0,
                retryCount,
                cacheHit: false,
                cacheLayer: "none",
                queryTightened: tightened.applied,
                usedIncremental: false,
                tightenedReasons: tightened.reasons,
                query: tightened.query,
                debugPages: pagesDebug,
                recommendation
              }, debug)
            };
          }

          if (!response.ok || !response.payload) {
            return {
              error: "Ticket search failed (HTTP " + response.status + ")",
              tickets: [],
              metrics: normalizeMetrics({
                totalSearchMs: nowMs() - startedAt,
                zendeskMs,
                pagesFetched,
                itemsReturned: 0,
                retryCount,
                cacheHit: false,
                cacheLayer: "none",
                queryTightened: tightened.applied,
                usedIncremental: false,
                tightenedReasons: tightened.reasons,
                query: tightened.query,
                debugPages: pagesDebug,
                recommendation
              }, debug)
            };
          }

          for (let i = 0; i < rows.length; i += 1) {
            collectTicket(rows[i]);
            if (tickets.length >= maxResults) break;
          }

          if (tickets.length >= maxResults) break;

          nextUrl = extractNextCursorUrl(response.payload, nextUrl, { baseUrl: this.baseUrl });
        }
      }

      const outputTickets = tickets.slice(0, maxResults);
      const totalSearchMs = Math.max(0, nowMs() - startedAt);

      if (cacheTTLms > 0 && outputTickets.length) {
        await this.cacheAdapter.set(fullCacheKey, {
          tickets: outputTickets,
          usedIncremental: useIncremental
        }, cacheTTLms);
        if (!useIncremental && outputTickets.length <= pageSize) {
          await this.cacheAdapter.set(firstPageCacheKey, {
            tickets: outputTickets
          }, cacheTTLms);
        }
      }

      if (this.logger) {
        this.logger({
          type: "ticket_search_complete",
          query: tightened.query,
          queryTightened: tightened.applied,
          usedIncremental: useIncremental,
          pagesFetched,
          itemsReturned: outputTickets.length,
          totalSearchMs,
          zendeskMs,
          retryCount,
          cacheHit: false,
          recommendation
        });
      }

      const metrics = normalizeMetrics({
        totalSearchMs,
        zendeskMs,
        pagesFetched,
        itemsReturned: outputTickets.length,
        retryCount,
        cacheHit: false,
        cacheLayer: "none",
        queryTightened: tightened.applied,
        usedIncremental: useIncremental,
        debugPages: pagesDebug,
        tightenedReasons: tightened.reasons,
        query: tightened.query,
        recommendation
      }, debug);

      const response = {
        tickets: outputTickets,
        metrics,
        query: tightened.query,
        tightened
      };
      if (resume) response.resume = resume;
      return response;
    }
  }

  function createZendeskTicketSearchService(config) {
    return new ZendeskTicketSearchService(config);
  }

  return {
    DEFAULT_FIELDS_NEEDED,
    DEFAULT_PAGE_SIZE,
    DEFAULT_MAX_RESULTS,
    DEFAULT_CACHE_TTL_SECONDS,
    DEFAULT_CONCURRENCY,
    DEFAULT_INCREMENTAL_SYNC_THRESHOLD,
    DEFAULT_QUERY_DATE_RANGE_DAYS,
    DEFAULT_SLOW_PAGE_THRESHOLD_MS,
    InMemoryLruCache,
    createInMemoryLruCache,
    createZendeskTicketSearchService,
    tightenTicketSearchQuery
  };
});
