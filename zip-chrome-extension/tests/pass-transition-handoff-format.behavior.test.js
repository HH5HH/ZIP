const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SIDEPANEL_JS_PATH = path.join(ROOT, "sidepanel.js");

test("PASS-TRANSITION share markdown separates the handoff note from the ticket list with a divider", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");

  assert.match(source, /const PASS_TRANSITION_SECTION_DIVIDER = "-{20,}";/);
  assert.ok(
    source.includes(
      'const senderLabel = "*Note from @" + escapeSlackMrkdwn(senderName.replace(/^@+/, "").trim()) + ":*";'
    )
  );
  assert.match(
    source,
    /sections\.push\(\s*senderLabel,\s*handoffNote,\s*"",\s*PASS_TRANSITION_SECTION_DIVIDER,\s*""\s*\);/
  );
  assert.doesNotMatch(source, /\*PASS-TRANSITION HANDOFF\*/);
  assert.doesNotMatch(source, /_Recipient:_/);
  assert.doesNotMatch(source, /\*USER MESSAGE\*/);
  assert.doesNotMatch(source, /\*ZIP-ZAP REPORT\*/);
});
