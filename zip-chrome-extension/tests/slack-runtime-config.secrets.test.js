const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const RUNTIME_CONFIG_PATH = path.join(ROOT, "zip-chrome-extension", "slack-runtime-config.js");
const RUNTIME_ROOT = path.join(ROOT, "zip-chrome-extension");
const ARCHIVE_PATH = path.join(ROOT, "ziptool_distro.zip");
const ARCHIVE_ROOT_DIR = "ziptool_distro";
const ARCHIVE_RUNTIME_CONFIG_ENTRY = ARCHIVE_ROOT_DIR + "/slack-runtime-config.js";

const SLACK_TOKEN_PATTERN = /xox(?:b|p|a|r|s)-[0-9]{6,}-[0-9]{6,}-[A-Za-z0-9-]{10,}|xoxe\.xox(?:b|p|a|r|s)-[0-9]{6,}-[0-9]{6,}-[A-Za-z0-9-]{10,}/i;
const TOKEN_ASSIGNMENT_PATTERN = /ZIP_PASS_AI_SLACK_(BOT|USER)_TOKEN\s*=\s*"[^"]+"/;
const CLIENT_SECRET_ASSIGNMENT_PATTERN = /ZIP_PASS_AI_SLACK_OIDC_CLIENT_SECRET\s*=\s*"[^"]+"/;

function collectRuntimeTreeFiles(rootDir) {
  const results = [];
  const walk = (currentDir, relativeDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    entries.forEach((entry) => {
      const relativePath = relativeDir ? path.join(relativeDir, entry.name) : entry.name;
      if (entry.isDirectory()) {
        if (relativePath === "docs" || relativePath === "scripts" || relativePath === "tests") return;
        walk(path.join(currentDir, entry.name), relativePath);
        return;
      }
      if (relativePath === "README.md") return;
      if (entry.name === ".DS_Store") return;
      if (/\.zip$/i.test(entry.name)) return;
      results.push(relativePath.split(path.sep).join("/"));
    });
  };
  walk(rootDir, "");
  return results.sort();
}

test("git-tracked runtime config never hardcodes Slack tokens or client secrets", () => {
  const source = fs.readFileSync(RUNTIME_CONFIG_PATH, "utf8");
  assert.doesNotMatch(source, SLACK_TOKEN_PATTERN);
  assert.doesNotMatch(source, TOKEN_ASSIGNMENT_PATTERN);
  assert.doesNotMatch(source, CLIENT_SECRET_ASSIGNMENT_PATTERN);
});

test("packaged archive never includes local Slack secret material", (t) => {
  if (!fs.existsSync(ARCHIVE_PATH)) {
    t.skip("ziptool_distro.zip is not present in this workspace");
    return;
  }

  let archiveConfig = "";

  try {
    archiveConfig = execFileSync("unzip", ["-p", ARCHIVE_PATH, ARCHIVE_RUNTIME_CONFIG_ENTRY], { encoding: "utf8" });
  } catch (_error) {
    t.skip("unzip is unavailable or archive is unreadable in this environment");
    return;
  }

  assert.doesNotMatch(archiveConfig, SLACK_TOKEN_PATTERN);
  assert.doesNotMatch(archiveConfig, TOKEN_ASSIGNMENT_PATTERN);
  assert.doesNotMatch(archiveConfig, CLIENT_SECRET_ASSIGNMENT_PATTERN);
});

test("packaged archive extracts to the canonical ziptool_distro folder", (t) => {
  if (!fs.existsSync(ARCHIVE_PATH)) {
    t.skip("ziptool_distro.zip is not present in this workspace");
    return;
  }

  let archiveEntries = [];

  try {
    archiveEntries = execFileSync("unzip", ["-Z1", ARCHIVE_PATH], { encoding: "utf8" })
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  } catch (_error) {
    t.skip("unzip is unavailable or archive is unreadable in this environment");
    return;
  }

  assert.ok(archiveEntries.length > 0, "archive should contain packaged files");
  assert.ok(
    archiveEntries.every((entry) => entry === ARCHIVE_ROOT_DIR + "/" || entry.startsWith(ARCHIVE_ROOT_DIR + "/")),
    "archive should extract into the canonical ziptool_distro folder"
  );
  assert.equal(archiveEntries.includes("ziptool_distro/manifest.json"), true, "archive should include manifest.json inside ziptool_distro/");
  assert.equal(
    archiveEntries.includes(ARCHIVE_RUNTIME_CONFIG_ENTRY),
    true,
    "archive should include runtime config inside ziptool_distro/"
  );
  assert.equal(archiveEntries.includes("zip-chrome-extension/manifest.json"), false, "archive should not nest the extension under zip-chrome-extension/");
  assert.equal(archiveEntries.includes("package.json"), false, "repo-root package.json should not ship in the distro");
  assert.equal(archiveEntries.includes("zip.html"), false, "repo-root install helper should not ship in the distro");
  assert.equal(archiveEntries.includes("zip-chrome-install.html"), false, "repo-root install page should not ship in the distro");
});

test("packaged archive stays byte-synced with the current runtime tree", (t) => {
  if (!fs.existsSync(ARCHIVE_PATH)) {
    t.skip("ziptool_distro.zip is not present in this workspace");
    return;
  }

  const runtimeFiles = collectRuntimeTreeFiles(RUNTIME_ROOT);
  let archiveEntries = [];

  try {
    archiveEntries = execFileSync("unzip", ["-Z1", ARCHIVE_PATH], { encoding: "utf8" })
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .filter((entry) => entry !== ARCHIVE_ROOT_DIR + "/")
      .filter((entry) => !entry.endsWith("/"))
      .map((entry) => entry.replace(new RegExp("^" + ARCHIVE_ROOT_DIR + "/"), ""))
      .sort();
  } catch (_error) {
    t.skip("unzip is unavailable or archive is unreadable in this environment");
    return;
  }

  assert.deepEqual(archiveEntries, runtimeFiles);

  runtimeFiles.forEach((relativePath) => {
    const sourcePath = path.join(RUNTIME_ROOT, relativePath);
    const archivedSource = execFileSync("unzip", ["-p", ARCHIVE_PATH, ARCHIVE_ROOT_DIR + "/" + relativePath], { encoding: "utf8" });
    const source = fs.readFileSync(sourcePath, "utf8");
    assert.equal(archivedSource, source, "archive content drifted for " + relativePath);
  });
});
