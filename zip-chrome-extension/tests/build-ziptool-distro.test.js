const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const SCRIPT_PATH = path.join(ROOT, "scripts", "build_ziptool_distro.sh");

function runCommand(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("distribution build excludes docs tests scripts and README from the runtime archive", (t) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ziptool-distro-test-"));
  const repoDir = path.join(tempRoot, "repo");
  const packageDir = path.join(repoDir, "zip-chrome-extension");
  const docsDir = path.join(packageDir, "docs");
  const testsDir = path.join(packageDir, "tests");
  const packageScriptsDir = path.join(packageDir, "scripts");
  const repoScriptsDir = path.join(repoDir, "scripts");
  const artifactPath = path.join(repoDir, "ziptool_distro.zip");

  t.after(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  fs.mkdirSync(docsDir, { recursive: true });
  fs.mkdirSync(testsDir, { recursive: true });
  fs.mkdirSync(packageScriptsDir, { recursive: true });
  fs.mkdirSync(repoScriptsDir, { recursive: true });
  fs.copyFileSync(SCRIPT_PATH, path.join(repoScriptsDir, "build_ziptool_distro.sh"));
  fs.chmodSync(path.join(repoScriptsDir, "build_ziptool_distro.sh"), 0o755);

  fs.writeFileSync(path.join(packageDir, "manifest.json"), '{ "version": "1.0.0" }\n');
  fs.writeFileSync(path.join(packageDir, "background.js"), 'console.log("zip");\n');
  fs.writeFileSync(path.join(packageDir, "README.md"), "# ZIP\n");
  fs.writeFileSync(path.join(docsDir, "guide.md"), "# docs\n");
  fs.writeFileSync(path.join(testsDir, "noop.test.js"), 'console.log("noop");\n');
  fs.writeFileSync(path.join(packageScriptsDir, "helper.sh"), "#!/usr/bin/env bash\n");
  fs.writeFileSync(path.join(repoDir, ".DS_Store"), "ignore\n");
  fs.writeFileSync(path.join(repoDir, "stale.zip"), "legacy\n");
  fs.writeFileSync(artifactPath, "stale\n");

  runCommand("git", ["init", "--quiet"], repoDir);
  runCommand(
    "git",
    [
      "add",
      "scripts/build_ziptool_distro.sh",
      "zip-chrome-extension/manifest.json",
      "zip-chrome-extension/background.js",
      "zip-chrome-extension/README.md",
      "zip-chrome-extension/docs/guide.md",
      "zip-chrome-extension/tests/noop.test.js",
      "zip-chrome-extension/scripts/helper.sh",
    ],
    repoDir
  );

  const outputPath = runCommand("bash", ["scripts/build_ziptool_distro.sh"], repoDir).trim();
  const archiveEntries = runCommand("unzip", ["-Z1", artifactPath], repoDir)
    .trim()
    .split(/\n+/)
    .filter(Boolean);

  assert.equal(fs.realpathSync(outputPath), fs.realpathSync(artifactPath));
  assert.equal(fs.existsSync(path.join(repoDir, "stale.zip")), false);
  assert.ok(archiveEntries.length > 0);
  assert.ok(
    archiveEntries.every((entry) => entry === "ziptool_distro/" || entry.startsWith("ziptool_distro/"))
  );
  assert.ok(archiveEntries.includes("ziptool_distro/manifest.json"));
  assert.ok(archiveEntries.includes("ziptool_distro/background.js"));
  assert.ok(!archiveEntries.includes("ziptool_distro/README.md"));
  assert.ok(!archiveEntries.includes("ziptool_distro/docs/guide.md"));
  assert.ok(!archiveEntries.includes("ziptool_distro/tests/noop.test.js"));
  assert.ok(!archiveEntries.includes("ziptool_distro/scripts/helper.sh"));
});

test("distribution build prefers current tracked worktree files over older staged content", (t) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ziptool-distro-worktree-test-"));
  const repoDir = path.join(tempRoot, "repo");
  const packageDir = path.join(repoDir, "zip-chrome-extension");
  const repoScriptsDir = path.join(repoDir, "scripts");
  const artifactPath = path.join(repoDir, "ziptool_distro.zip");

  t.after(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  fs.mkdirSync(packageDir, { recursive: true });
  fs.mkdirSync(repoScriptsDir, { recursive: true });
  fs.copyFileSync(SCRIPT_PATH, path.join(repoScriptsDir, "build_ziptool_distro.sh"));
  fs.chmodSync(path.join(repoScriptsDir, "build_ziptool_distro.sh"), 0o755);

  fs.writeFileSync(path.join(packageDir, "manifest.json"), '{ "version": "1.0.0" }\n');
  fs.writeFileSync(path.join(packageDir, "background.js"), 'console.log("staged");\n');

  runCommand("git", ["init", "--quiet"], repoDir);
  runCommand(
    "git",
    [
      "add",
      "scripts/build_ziptool_distro.sh",
      "zip-chrome-extension/manifest.json",
      "zip-chrome-extension/background.js",
    ],
    repoDir
  );

  fs.writeFileSync(path.join(packageDir, "manifest.json"), '{ "version": "1.0.1" }\n');
  fs.writeFileSync(path.join(packageDir, "background.js"), 'console.log("worktree");\n');

  runCommand("bash", ["scripts/build_ziptool_distro.sh"], repoDir);
  const manifestSource = runCommand("unzip", ["-p", artifactPath, "ziptool_distro/manifest.json"], repoDir);
  const backgroundSource = runCommand("unzip", ["-p", artifactPath, "ziptool_distro/background.js"], repoDir);

  assert.match(manifestSource, /"version": "1\.0\.1"/);
  assert.equal(backgroundSource, 'console.log("worktree");\n');
});

test("distribution build packages staged tracked files even when the worktree copy is missing", (t) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ziptool-distro-dirty-test-"));
  const repoDir = path.join(tempRoot, "repo");
  const packageDir = path.join(repoDir, "zip-chrome-extension");
  const repoScriptsDir = path.join(repoDir, "scripts");
  const artifactPath = path.join(repoDir, "ziptool_distro.zip");

  t.after(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  fs.mkdirSync(packageDir, { recursive: true });
  fs.mkdirSync(repoScriptsDir, { recursive: true });
  fs.copyFileSync(SCRIPT_PATH, path.join(repoScriptsDir, "build_ziptool_distro.sh"));
  fs.chmodSync(path.join(repoScriptsDir, "build_ziptool_distro.sh"), 0o755);

  fs.writeFileSync(path.join(packageDir, "manifest.json"), '{ "version": "1.0.0" }\n');
  fs.writeFileSync(path.join(packageDir, "background.js"), 'console.log("zip");\n');

  runCommand("git", ["init", "--quiet"], repoDir);
  runCommand(
    "git",
    [
      "add",
      "scripts/build_ziptool_distro.sh",
      "zip-chrome-extension/manifest.json",
      "zip-chrome-extension/background.js",
    ],
    repoDir
  );

  fs.rmSync(path.join(packageDir, "background.js"));

  runCommand("bash", ["scripts/build_ziptool_distro.sh"], repoDir);
  const archiveEntries = runCommand("unzip", ["-Z1", artifactPath], repoDir)
    .trim()
    .split(/\n+/)
    .filter(Boolean);
  const backgroundSource = runCommand("unzip", ["-p", artifactPath, "ziptool_distro/background.js"], repoDir);

  assert.ok(archiveEntries.includes("ziptool_distro/background.js"));
  assert.equal(backgroundSource, 'console.log("zip");\n');
});
