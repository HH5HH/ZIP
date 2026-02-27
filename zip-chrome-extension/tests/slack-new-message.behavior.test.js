const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const BACKGROUND_JS_PATH = path.join(ROOT, "background.js");
const CONTENT_JS_PATH = path.join(ROOT, "content.js");
const SIDEPANEL_JS_PATH = path.join(ROOT, "sidepanel.js");

test("runtime Slack paths avoid chat.update for ticket notifications", () => {
  const source = [
    fs.readFileSync(BACKGROUND_JS_PATH, "utf8"),
    fs.readFileSync(CONTENT_JS_PATH, "utf8"),
    fs.readFileSync(SIDEPANEL_JS_PATH, "utf8")
  ].join("\n");
  assert.doesNotMatch(source, /chat\.update/);
});

test("background sanitizes Slack self-DM payloads to always send new messages", () => {
  const source = fs.readFileSync(BACKGROUND_JS_PATH, "utf8");
  assert.match(source, /function buildSlackNewMessageFields\(fields\)/);
  assert.match(source, /async function slackSendMarkdownToSelfViaBotApi\(input,\s*resolvedTokens\)/);
  assert.match(source, /delete source\.thread_ts;/);
  assert.match(source, /delete source\.reply_broadcast;/);
  assert.match(source, /forceNewMessage:\s*true/);
  assert.match(source, /postSlackApiWithBearerToken\(webApiOrigin,\s*"\/api\/chat\.postMessage",\s*postFields,\s*attemptToken\)/);
  assert.match(source, /delivery_mode:\s*"bot_direct_channel"/);
});

test("content self-DM action strips thread fields before chat.postMessage", () => {
  const source = fs.readFileSync(CONTENT_JS_PATH, "utf8");
  assert.match(source, /async function slackSendMarkdownToSelfAction\(inner\)/);
  assert.match(source, /delete postFields\.thread_ts;/);
  assert.match(source, /delete postFields\.reply_broadcast;/);
  assert.match(source, /postSlackApi\(workspaceOrigin,\s*"\/api\/chat\.postMessage",\s*postFields\)/);
});

test("sidepanel explicitly requests new-message delivery for SLACK_IT_TO_ME", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  assert.match(source, /const sendPayload = \{[\s\S]*forceNewMessage:\s*true[\s\S]*\};/);
  assert.match(source, /const sendPayload = \{[\s\S]*requireNativeNewMessage:\s*false[\s\S]*\};/);
  assert.match(source, /const sendPayload = \{[\s\S]*allowBotDelivery:\s*true[\s\S]*\};/);
  assert.match(source, /const sendPayload = \{[\s\S]*skipUnreadMark:\s*true[\s\S]*\};/);
  assert.match(source, /const sendPayload = \{[\s\S]*botToken:\s*slackApiTokens\.botToken \|\| ""[\s\S]*\};/);
});
