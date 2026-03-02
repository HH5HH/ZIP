const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const RUNTIME_CONFIG_PATH = path.join(ROOT, "zip-chrome-extension", "slack-runtime-config.js");
const ARCHIVE_PATH = path.join(ROOT, "zip-chrome-extension.zip");

const SLACK_TOKEN_PATTERN = /xox(?:b|p|a|r|s)-[0-9]{6,}-[0-9]{6,}-[A-Za-z0-9-]{10,}|xoxe\.xox(?:b|p|a|r|s)-[0-9]{6,}-[0-9]{6,}-[A-Za-z0-9-]{10,}/i;
const TOKEN_ASSIGNMENT_PATTERN = /ZIP_PASS_AI_SLACK_(BOT|USER)_TOKEN\s*=\s*"[^"]+"/;
const CLIENT_SECRET_ASSIGNMENT_PATTERN = /ZIP_PASS_AI_SLACK_OIDC_CLIENT_SECRET\s*=\s*"[^"]+"/;

test("git-tracked runtime config never hardcodes Slack tokens or client secrets", () => {
  const source = fs.readFileSync(RUNTIME_CONFIG_PATH, "utf8");
  assert.doesNotMatch(source, SLACK_TOKEN_PATTERN);
  assert.doesNotMatch(source, TOKEN_ASSIGNMENT_PATTERN);
  assert.doesNotMatch(source, CLIENT_SECRET_ASSIGNMENT_PATTERN);
});

test("packaged archive never includes local Slack secret material", (t) => {
  if (!fs.existsSync(ARCHIVE_PATH)) {
    t.skip("zip-chrome-extension.zip is not present in this workspace");
    return;
  }

  let listing = "";
  let archiveConfig = "";

  try {
    listing = execFileSync("unzip", ["-l", ARCHIVE_PATH], { encoding: "utf8" });
    archiveConfig = execFileSync("unzip", ["-p", ARCHIVE_PATH, "slack-runtime-config.js"], { encoding: "utf8" });
  } catch (_error) {
    t.skip("unzip is unavailable or archive is unreadable in this environment");
    return;
  }

  assert.doesNotMatch(
    listing,
    /slack-runtime-config\.local(?:\.example)?\.js|slack-oidc\.local\.js/
  );
  assert.doesNotMatch(archiveConfig, SLACK_TOKEN_PATTERN);
  assert.doesNotMatch(archiveConfig, TOKEN_ASSIGNMENT_PATTERN);
  assert.doesNotMatch(archiveConfig, CLIENT_SECRET_ASSIGNMENT_PATTERN);
});
