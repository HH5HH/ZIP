const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const RUNTIME_SLACK_PATHS = [
  path.join(ROOT, "sidepanel.js"),
  path.join(ROOT, "background.js"),
  path.join(ROOT, "content.js")
];

test("runtime Slack delivery paths do not include debug hardcoded payload markers", () => {
  const joined = RUNTIME_SLACK_PATHS
    .map((filePath) => fs.readFileSync(filePath, "utf8"))
    .join("\n");

  // Guard against accidental reintroduction of manual debugging payloads.
  assert.doesNotMatch(joined, /zip_test/i);
  assert.doesNotMatch(joined, /Ticket,Subject\s*\r?\n\s*1,Test/i);
  assert.doesNotMatch(joined, /row\s*\t\s*value/i);
  assert.doesNotMatch(joined, /initial_comment\s*:\s*["']\s*test\b/i);
});

