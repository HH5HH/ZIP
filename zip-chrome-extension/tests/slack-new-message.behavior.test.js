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
  assert.match(source, /function extractConfirmedSlackDelivery\(source,\s*fallbackChannelId,\s*fallbackDirectChannelId\)/);
  assert.match(source, /async function slackSendMarkdownToSelfViaBotApi\(input,\s*resolvedTokens\)/);
  assert.match(source, /delete source\.thread_ts;/);
  assert.match(source, /delete source\.reply_broadcast;/);
  assert.match(source, /forceNewMessage:\s*true/);
  assert.match(source, /mrkdwn:\s*true,/);
  assert.match(source, /parse:\s*"none"/);
  assert.match(source, /postSlackApiWithBearerToken\(webApiOrigin,\s*"\/api\/chat\.postMessage",\s*postFields,\s*attemptToken\)/);
  assert.match(source, /slack_delivery_unconfirmed/);
  assert.match(source, /delivery_mode:\s*"bot_direct_channel"/);
});

test("background uses Slack web-session transport for xoxc\/xoxd tokens", () => {
  const source = fs.readFileSync(BACKGROUND_JS_PATH, "utf8");
  assert.match(source, /function isSlackWebSessionToken\(value\)/);
  assert.match(source, /function buildSlackWebSessionRequestFields\(fields,\s*token\)/);
  assert.match(source, /const useWebSessionTransport = isSlackWebSessionToken\(authToken\);/);
  assert.match(source, /payload\._x_mode = "online";/);
  assert.match(source, /payload\._x_sonic = true;/);
  assert.match(source, /payload\._x_app_name = "client";/);
  assert.match(source, /credentials:\s*useWebSessionTransport \? "include" : "omit"/);
  assert.match(source, /cache:\s*useWebSessionTransport \? "no-store" : "default"/);
});

test("background targeted recipient send requires the requested Slack user", () => {
  const source = fs.readFileSync(BACKGROUND_JS_PATH, "utf8");
  assert.match(source, /async function slackSendMarkdownToUserViaApi\(input\)/);
  assert.match(source, /preferApiFirst:\s*false/);
  assert.match(source, /preferRequestedUser:\s*true/);
  assert.match(source, /requireRequestedUser:\s*true/);
  assert.match(source, /const preferBotDmDelivery = body\.preferBotDmDelivery === true;/);
  assert.match(source, /const requireBotDelivery = body\.requireBotDelivery === true;/);
  assert.match(source, /const allowBotDelivery = body\.allowBotDelivery === true \|\| requireBotDelivery;/);
  assert.match(source, /msg\.type === "ZIP_SLACK_API_SEND_TO_USER"/);
  assert.match(source, /if \(requireRequestedUser\) \{\s*pushUserIdCandidate\(requestedUserId\);/);
});

test("content self-DM action strips thread fields before chat.postMessage", () => {
  const source = fs.readFileSync(CONTENT_JS_PATH, "utf8");
  assert.match(source, /async function slackSendMarkdownToSelfAction\(inner\)/);
  assert.match(source, /delete postFields\.thread_ts;/);
  assert.match(source, /delete postFields\.reply_broadcast;/);
  assert.match(source, /mrkdwn:\s*true,/);
  assert.match(source, /parse:\s*"none"/);
  assert.match(source, /postSlackApi\(workspaceOrigin,\s*"\/api\/chat\.postMessage",\s*postFields\)/);
  assert.match(source, /code:\s*"slack_delivery_unconfirmed"/);
});

test("sidepanel explicitly routes SLACK_IT_TO_ME to the logged-in user's Slack DM", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  assert.match(source, /let slackItToMeRequestInFlight = null;/);
  assert.match(source, /async function ensurePassAiSlackIdentityVerifiedForDelivery\(\)/);
  assert.doesNotMatch(source, /if \(authMode && authMode !== "cached"\) \{\s*return true;\s*\}/);
  assert.match(source, /if \(state\.slackItToMeLoading \|\| state\.slackItToMeButtonState === "ack" \|\| slackItToMeRequestInFlight\) \{/);
  assert.match(source, /slackItToMeRequestInFlight = \(async \(\) => \{/);
  assert.match(source, /if \(!isPassAiSlacktivated\(\)\) \{[\s\S]*setStatus\(SLACKTIVATED_LOGIN_TOOLTIP,\s*true\);/);
  assert.match(source, /await ensurePassAiSlackIdentityVerifiedForDelivery\(\);[\s\S]*const markdownText = buildSlackItToMeMarkdown\(rows\);/);
  assert.match(source, /const sendPayload = \{[\s\S]*forceNewMessage:\s*true[\s\S]*\};/);
  assert.match(source, /const sendPayload = \{[\s\S]*requireNativeNewMessage:\s*false[\s\S]*\};/);
  assert.match(source, /const sendPayload = \{[\s\S]*authorUserId:\s*normalizePassAiSlackUserId\(state\.passAiSlackUserId \|\| ""\)[\s\S]*\};/);
  assert.match(source, /const sendPayload = \{[\s\S]*authorUserName:\s*normalizePassAiSlackDisplayName\(state\.passAiSlackUserName \|\| ""\)[\s\S]*\};/);
  assert.match(source, /const sendPayload = \{[\s\S]*authorEmail:\s*normalizeEmailAddress\(state\.user && state\.user\.email \|\| ""\)[\s\S]*\};/);
  assert.match(source, /const sendPayload = \{[\s\S]*authorAvatarUrl:\s*state\.passAiSlackAvatarUrl \|\| ""[\s\S]*\};/);
  assert.match(source, /setStatus\("Sending visible ticket list to your Slack DM…",\s*false\);/);
  assert.match(source, /setStatus\("Sending visible ticket list to your Slack DM via Slack API…",\s*false\);/);
  assert.match(source, /setStatus\("SLACK_IT_TO_ME delivered to your Slack DM"/);
  assert.match(source, /const sendPayload = \{[\s\S]*preferBotDmDelivery:\s*true[\s\S]*\};/);
  assert.match(source, /const sendPayload = \{[\s\S]*requireBotDelivery:\s*false[\s\S]*\};/);
  assert.match(source, /const sendPayload = \{[\s\S]*allowBotDelivery:\s*true[\s\S]*\};/);
  assert.match(source, /const sendPayload = \{[\s\S]*skipUnreadMark:\s*true[\s\S]*\};/);
  assert.match(source, /const sendPayload = \{[\s\S]*directChannelId:\s*normalizePassAiSlackDirectChannelId\(state\.passAiSlackDirectChannelId \|\| ""\)[\s\S]*\};/);
  assert.match(source, /const sendPayload = \{[\s\S]*botToken:\s*slackApiTokens\.botToken \|\| ""[\s\S]*\};/);
  assert.match(source, /const sendPayload = \{[\s\S]*autoBootstrapSlackTab:\s*false[\s\S]*\};/);
  assert.match(source, /setPassAiSlackAuthState\(\{[\s\S]*userId:\s*state\.passAiSlackUserId \|\| response\.user_id \|\| response\.userId \|\| ""[\s\S]*userName:\s*state\.passAiSlackUserName \|\| response\.user_name \|\| response\.userName \|\| ""[\s\S]*avatarUrl:\s*state\.passAiSlackAvatarUrl \|\| response\.avatar_url \|\| response\.avatarUrl \|\| ""[\s\S]*directChannelId:\s*confirmedDelivery\.directChannelId \|\| state\.passAiSlackDirectChannelId \|\| ""[\s\S]*\}\);/);
});

test("sidepanel routes @SLACK ME through the logged-in user's Slack DM path", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  assert.match(source, /sendBackgroundRequest\("ZIP_SLACK_API_SEND_TO_SELF",\s*\{[\s\S]*userEmail:\s*normalizeEmailAddress\(state\.user && state\.user\.email \|\| ""\)[\s\S]*authorEmail:\s*normalizeEmailAddress\(state\.user && state\.user\.email \|\| ""\)[\s\S]*markdownText:\s*buildSlackMeNoteMarkdown\(noteText\)[\s\S]*preferBotDmDelivery:\s*true[\s\S]*requireBotDelivery:\s*false[\s\S]*allowBotDelivery:\s*true[\s\S]*\}\)/);
});

test("sidepanel routes Shift+Click through PASS-TRANSITION recipient delivery", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  assert.match(source, /if \(e\.shiftKey\) \{[\s\S]*openSlackMeDialog\(\{ mode: "transition" \}\)/);
  assert.match(source, /sendBackgroundRequest\("ZIP_GET_PASS_TRANSITION_RECIPIENTS", \{\}\)/);
  assert.match(source, /async function refreshPassTransitionRecipientAfterUserNotFound\(referenceRecipient\)/);
  assert.match(source, /function isPassTransitionRecipientCurrentSlackUser\(recipient\)/);
  assert.match(source, /openSlackMeDialog\(\{\s*mode: "transition",\s*selectedRecipientId\s*\}\);/);
  assert.match(source, /sendBackgroundRequest\("ZIP_REHYDRATE_PASS_TRANSITION_MEMBERS", \{\s*force: true,\s*allowCreateTab: true\s*\}\)/);
  assert.match(source, /if \(sendingToSelf\) \{[\s\S]*sendBackgroundRequest\("ZIP_SLACK_API_SEND_TO_SELF"/);
  assert.match(source, /if \(\(!response \|\| response\.ok !== true\) && !sendingToSelf && responseCode === "user_not_found"\) \{/);
  assert.match(source, /await ensurePassAiSlackIdentityVerifiedForDelivery\(\);[\s\S]*sendBackgroundRequest\("ZIP_SLACK_API_SEND_TO_USER"/);
  assert.match(source, /await ensurePassAiSlackIdentityVerifiedForDelivery\(\);[\s\S]*sendBackgroundRequest\("ZIP_SLACK_API_SEND_TO_SELF"/);
  assert.match(
    source,
    /if \(sendingToSelf\) \{[\s\S]*sendBackgroundRequest\("ZIP_SLACK_API_SEND_TO_SELF",\s*\{[\s\S]*preferBotDmDelivery:\s*true[\s\S]*requireBotDelivery:\s*false[\s\S]*allowBotDelivery:\s*true[\s\S]*\}\);/
  );
  assert.match(
    source,
    /const sendingToSelf = isPassTransitionRecipientCurrentSlackUser\(targetRecipient\);[\s\S]*sendBackgroundRequest\("ZIP_SLACK_API_SEND_TO_USER",\s*\{[\s\S]*botToken:\s*slackApiTokens\.botToken \|\| ""[\s\S]*preferBotDmDelivery:\s*false[\s\S]*requireBotDelivery:\s*true[\s\S]*allowBotDelivery:\s*true[\s\S]*\}\);/
  );
  assert.match(source, /PASS-TRANSITION self-share sent to your Slack DM/);
});

test("sidepanel routes RE-SLACKTIVATE through the shared context-menu Slacktivation action", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  assert.match(source, /async function refreshContextMenuSlacktivationState\(\)/);
  assert.match(source, /async function performContextMenuSlacktivateAction\(action,\s*detail,\s*messages\)/);
  assert.match(source, /sendBackgroundRequest\("ZIP_REHYDRATE_PASS_TRANSITION_MEMBERS", \{\s*force: true,\s*allowCreateTab: true\s*\}\)/);
  assert.match(source, /performContextMenuSlacktivateAction\(\s*"refresh"/);
  assert.doesNotMatch(source, /async function rehydrateZipRuntime\(\)/);
});

test("background can fall back to the live Slack tab session for PASS-TRANSITION hydration", () => {
  const source = fs.readFileSync(BACKGROUND_JS_PATH, "utf8");
  assert.match(source, /async function postSlackApiViaWorkspaceSession\(input\)/);
  assert.match(source, /action:\s*"slackApiProxy"/);
  assert.match(source, /async function hydratePassTransitionRecipientsViaWorkspaceSession\(options\)/);
  assert.match(source, /callSlackApiProxy\(tabId,\s*"\/api\/conversations\.members"/);
  assert.match(source, /callSlackApiProxy\(tabId,\s*"\/api\/users\.info"/);
});

test("workspace deeplinks route through the redirect URL back into the Zendesk-hosted ZIP client", () => {
  const background = fs.readFileSync(BACKGROUND_JS_PATH, "utf8");
  const sidepanel = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");

  assert.match(background, /const ZIP_WORKSPACE_DEEPLINK_QUERY_PARAM = "zipdeeplink";/);
  assert.match(background, /const ZIP_APPLY_WORKSPACE_DEEPLINK_MESSAGE_TYPE = "ZIP_APPLY_WORKSPACE_DEEPLINK";/);
  assert.match(background, /function parseZipWorkspaceDeeplinkUrl\(value\)/);
  assert.match(background, /async function deliverZipWorkspaceDeeplinkToOpenClient\(encodedPayload,\s*sourceTabId\)/);
  assert.match(background, /async function routeZipWorkspaceDeeplinkToZendeskClient\(encodedPayload,\s*sourceTabId\)/);
  assert.match(background, /chrome\.runtime\.sendMessage\(\{\s*type:\s*ZIP_APPLY_WORKSPACE_DEEPLINK_MESSAGE_TYPE,/);
  assert.match(background, /await closeZipWorkspaceDeeplinkSourceTab\(sourceTabId\);/);
  assert.match(background, /function maybeRouteZipWorkspaceDeeplinkTab\(tabId,\s*url\)/);
  assert.match(background, /chrome\.tabs\.onUpdated\.addListener\(\(tabId,\s*(?:_info|info),\s*tab\) => \{[\s\S]*if \(maybeRouteZipWorkspaceDeeplinkTab\(tabId,\s*tab\.url\)\) return;/);
  assert.match(background, /await routeZipWorkspaceDeeplinkToZendeskClient\(parsed\.payload,\s*numericTabId\);/);
  assert.doesNotMatch(background, /chrome\.tabs\.update\(numericTabId,\s*\{\s*url:\s*workspaceUrl\s*\}/);

  assert.match(sidepanel, /function loadSingleTicketById\(ticketId\)/);
  assert.match(sidepanel, /function applyPendingWorkspaceDeeplink\(\)/);
  assert.match(sidepanel, /const ZIP_APPLY_WORKSPACE_DEEPLINK_MESSAGE_TYPE = "ZIP_APPLY_WORKSPACE_DEEPLINK";/);
  assert.match(sidepanel, /function getCurrentZipWorkspaceClientTabId\(\)/);
  assert.match(sidepanel, /function handleRuntimeWorkspaceDeeplinkMessage\(messagePayload\)/);
  assert.match(sidepanel, /if \(msg\.type === ZIP_APPLY_WORKSPACE_DEEPLINK_MESSAGE_TYPE\) \{[\s\S]*sendResponse\(\{ ok: true, accepted \}\);/);
  assert.match(sidepanel, /state\.pendingWorkspaceDeeplink = readZipWorkspaceDeeplinkFromLocation\(\);/);
  assert.match(sidepanel, /await openTicketFromWorkspaceDeeplink\(TICKET_URL_PREFIX \+ ticketId,\s*ticketId\);/);
});
