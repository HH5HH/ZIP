# Changelog

## 2026-03-04

### Zendesk Ticket Search Refactor

- Replaced legacy offset-based ticket search flow with a centralized Zendesk search client.
- Added cursor-pagination search via `/api/v2/search/export.json` with `page[size]=100` and next-cursor link following.
- Added automatic incremental-export fallback for bulk/sync workloads (`/api/v2/incremental/tickets/cursor.json`) with resume cursor support.
- Added query tightening and safe defaults (`type:ticket`, non-closed statuses, default `updated>=90d`) plus wildcard opt-in guard.
- Added configurable sparse field selection (`fieldsNeeded`) and heavy-field trimming by default.
- Added centralized retry/backoff/rate-limit logic for idempotent requests with concurrency limiting and `Retry-After` handling.
- Added optional TTL caching (in-memory LRU by default, Redis-compatible adapter if provided) with first-page cache optimization.
- Added timing instrumentation and debug metrics (`totalSearchMs`, `zendeskMs`, `pagesFetched`, `itemsReturned`, retries, cache hit).

### Compatibility

- Existing callers using `searchTickets(query, { limit, perPage, ... })` remain supported through adapter mapping to `maxResults`/`pageSize`.
- Existing content-script actions (`loadTickets`, `loadTicketsByOrg`, `loadTicketsBySearchQuery`, etc.) continue to return the same payload shape.
