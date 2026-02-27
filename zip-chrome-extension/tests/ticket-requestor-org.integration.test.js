const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SIDEPANEL_JS_PATH = path.join(ROOT, "sidepanel.js");
const CONTENT_JS_PATH = path.join(ROOT, "content.js");
const MANIFEST_JSON_PATH = path.join(ROOT, "manifest.json");

test("ticket table column order includes Requestor and Organization before Updated (without Status/Created)", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  assert.match(
    source,
    /const TICKET_COLUMNS = \[[\s\S]*\{ key: "priority"[\s\S]*\{ key: "requestor"[\s\S]*\{ key: "organization"[\s\S]*\{ key: "updated_at"/
  );
  assert.doesNotMatch(source, /\{ key: "status", label: "Status"/);
  assert.doesNotMatch(source, /\{ key: "created_at", label: "Created"/);
});

test("CSV export order includes Requestor and Organization between Created and Updated", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  assert.match(
    source,
    /const header = \[\s*"Ticket"[\s\S]*"Created"[\s\S]*"Requestor"[\s\S]*"Organization"[\s\S]*"Updated"[\s\S]*\];/
  );
});

test("sidepanel renders requestor mailto links and organization text cells", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  assert.match(source, /else if \(col\.key === "requestor"\)/);
  assert.match(source, /link\.href = "mailto:" \+ requestorEmail;/);
  assert.match(source, /else if \(col\.key === "organization"\)/);
  assert.match(source, /td\.textContent = getTicketOrganizationName\(row\);/);
});

test("content runtime defines enrichTicketsWithRequestorOrg and applies it to search and view ticket loaders", () => {
  const source = fs.readFileSync(CONTENT_JS_PATH, "utf8");
  assert.match(source, /async function enrichTicketsWithRequestorOrg\(tickets, options\)/);
  assert.match(source, /source:\s*"searchTickets"/);
  assert.match(source, /source:\s*"loadTicketsByView"/);
  assert.match(source, /moduleApi\.enrichTicketsWithRequestorOrg\(rows,/);
});

test("sidepanel forwards agent locale into all ticket-loading actions", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  assert.match(source, /action:\s*"loadTickets"[\s\S]*locale:\s*getPreferredTicketLocale\(\)/);
  assert.match(source, /action:\s*"loadTicketsByOrg"[\s\S]*locale:\s*getPreferredTicketLocale\(\)/);
  assert.match(source, /action:\s*"loadTicketsByView"[\s\S]*locale:\s*getPreferredTicketLocale\(\)/);
  assert.match(source, /action:\s*"loadTicketsByGroupId"[\s\S]*locale:\s*getPreferredTicketLocale\(\)/);
  assert.match(source, /action:\s*"loadTicketsByAssigneeId"[\s\S]*locale:\s*getPreferredTicketLocale\(\)/);
});

test("manifest loads ticket-enrichment.js before content.js for Zendesk/Slack content scripts", () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_JSON_PATH, "utf8"));
  const contentScript = Array.isArray(manifest.content_scripts) ? manifest.content_scripts[0] : null;
  assert.ok(contentScript && Array.isArray(contentScript.js), "content_scripts[0].js should exist");
  const scriptList = contentScript.js.join(" ");
  assert.match(scriptList, /ticket-enrichment\.js/);
  assert.match(scriptList, /ticket-enrichment\.js\s+content\.js/);
});
