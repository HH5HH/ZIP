const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const SIDEPANEL_JS_PATH = path.join(ROOT, "sidepanel.js");

function extractFunctionSource(source, functionName) {
  const marker = "function " + functionName + "(";
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, "Unable to locate " + functionName + " in sidepanel.js");
  const bodyStart = source.indexOf("{", start);
  assert.notEqual(bodyStart, -1, "Unable to locate body for " + functionName);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }
  throw new Error("Unterminated function: " + functionName);
}

function loadPassTransitionRecipientHelpers() {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  const script = [
    extractFunctionSource(source, "normalizePassAiSlackUserId"),
    extractFunctionSource(source, "normalizePassAiSlackDisplayName"),
    extractFunctionSource(source, "normalizePassAiSlackAvatarUrl"),
    extractFunctionSource(source, "normalizePassAiSlackStatusIconName"),
    extractFunctionSource(source, "normalizePassAiSlackStatusIcon"),
    extractFunctionSource(source, "normalizePassAiSlackStatusMessage"),
    extractFunctionSource(source, "normalizePassTransitionRecipientShape"),
    "module.exports = { normalizePassTransitionRecipientShape };"
  ].join("\n\n");
  const context = {
    module: { exports: {} },
    exports: {},
    URL
  };
  vm.runInNewContext(script, context, { filename: SIDEPANEL_JS_PATH });
  return context.module.exports;
}

test("sidepanel preserves PASS-TRANSITION label text separately from the raw user name", () => {
  const { normalizePassTransitionRecipientShape } = loadPassTransitionRecipientHelpers();
  const recipient = normalizePassTransitionRecipientShape({
    userId: "U111111111",
    userName: "Alice Example",
    label: "Alice Example (@alice)",
    avatarUrl: "https://example.com/alice.png"
  });

  assert.equal(recipient && recipient.userId, "U111111111");
  assert.equal(recipient && recipient.userName, "Alice Example");
  assert.equal(recipient && recipient.label, "Alice Example (@alice)");
});

test("sidepanel uses PASS-TRANSITION labels for the selected recipient UI and markdown", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");

  assert.match(
    source,
    /const displayName = transitionRecipient[\s\S]*transitionRecipient\.label \|\| transitionRecipient\.userName \|\| transitionRecipient\.userId/
  );
  assert.ok(
    source.includes(
      'const senderLabel = "*Note from @" + escapeSlackMrkdwn(senderName.replace(/^@+/, "").trim()) + ":*";'
    )
  );
  assert.match(source, /const recipientLabel = deliveredRecipient\.label \|\| deliveredRecipient\.userName \|\| deliveredRecipient\.userId;/);
  assert.doesNotMatch(source, /let deliveryRecipient = recipient;[\s\S]*const recipient = deliveryRecipient;/);
});

test("transition dialog uses the cached roster and never warms Slack auth on login", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  const openDialogSource = extractFunctionSource(source, "openSlackMeDialog");

  assert.ok(
    openDialogSource.indexOf('els.slackMeDialogBackdrop.classList.remove("hidden");')
      < openDialogSource.indexOf('loadPassTransitionRecipients({'),
    "SHIFT+CLICK dialog should reveal immediately and then read the cached PASS-TRANSITION roster."
  );
  assert.doesNotMatch(source, /prefetchPassTransitionRecipients\(\{ force: false \}\)\.catch\(\(\) => \{\}\);/);
  assert.match(source, /const PASS_TRANSITION_CACHE_MISSING_MESSAGE = "No PASS-TRANSITION roster is cached yet\. RE-SLACKTIVATE to load members\.";/);
});
