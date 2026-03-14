const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SIDEPANEL_JS_PATH = path.join(ROOT, "sidepanel.js");

test("PASS-TRANSITION share markdown separates the handoff note from the ZIP-ZAP report", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");

  assert.match(source, /const PASS_TRANSITION_USER_MESSAGE_LABEL = "\*USER MESSAGE\*";/);
  assert.match(source, /const PASS_TRANSITION_REPORT_LABEL = "\*ZIP-ZAP REPORT\*";/);
  assert.match(source, /const PASS_TRANSITION_SECTION_DIVIDER = "-{20,}";/);
  assert.match(
    source,
    /sections\.push\(\s*PASS_TRANSITION_USER_MESSAGE_LABEL,\s*handoffNote,\s*"",\s*PASS_TRANSITION_SECTION_DIVIDER,\s*"",\s*PASS_TRANSITION_REPORT_LABEL\s*\);/
  );
  assert.match(source, /\} else \{\s*sections\.push\(PASS_TRANSITION_REPORT_LABEL\);\s*\}/);
});
