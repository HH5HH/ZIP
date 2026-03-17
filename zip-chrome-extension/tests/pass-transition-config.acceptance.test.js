const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const BACKGROUND_PATH = path.join(ROOT, "background.js");
const SIDEPANEL_PATH = path.join(ROOT, "sidepanel.js");
const OPTIONS_PATH = path.join(ROOT, "options.js");
const ZIP_KEY_TEMPLATE_PATH = path.join(ROOT, "ZIP.KEY.template");

test("ZIP.KEY template documents optional PASS-TRANSITION hydration fields", () => {
  const template = fs.readFileSync(ZIP_KEY_TEMPLATE_PATH, "utf8");

  assert.match(template, /User-scoped Slack auth never belongs in ZIP\.KEY/);
  assert.doesNotMatch(template, /slacktivation\.user_token=/);
  assert.match(template, /slacktivation\.bot_token=/);
  assert.match(template, /PASS-TRANSITION \/ Blondie support \(required for Shift\+Click handoff testing\):/);
  assert.match(template, /slacktivation\.pass_transition_channel_id=/);
  assert.match(template, /slacktivation\.pass_transition_channel_name=/);
  assert.match(template, /slacktivation\.pass_transition_member_ids=/);
  assert.match(template, /slacktivation\.pass_transition_members_synced_at=/);
});

test("sidepanel and options preserve PASS-TRANSITION ZIP.KEY fields during import", () => {
  const sidepanel = fs.readFileSync(SIDEPANEL_PATH, "utf8");
  const options = fs.readFileSync(OPTIONS_PATH, "utf8");

  assert.match(sidepanel, /ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY/);
  assert.match(sidepanel, /ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY/);
  assert.match(sidepanel, /ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY/);
  assert.match(sidepanel, /ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY/);
  assert.match(sidepanel, /pass_transition_channel_id/);
  assert.match(sidepanel, /pass_transition_member_ids/);
  assert.match(sidepanel, /passTransition:\s*\{/);
  assert.match(sidepanel, /async function persistZipKeyConfig\(config\)[\s\S]*passTransition:\s*buildPassTransitionConfigShape\(normalized\.passTransition\)/);

  assert.match(options, /pass_transition_channel_id/);
  assert.match(options, /pass_transition_channel_name/);
  assert.match(options, /pass_transition_member_ids/);
  assert.match(options, /pass_transition_members_synced_at/);
  assert.match(options, /passTransition:\s*\{/);
});

test("background supports cached PASS-TRANSITION member hydration", () => {
  const background = fs.readFileSync(BACKGROUND_PATH, "utf8");

  assert.match(background, /ZIP_PASS_TRANSITION_CHANNEL_ID_STORAGE_KEY/);
  assert.match(background, /ZIP_PASS_TRANSITION_CHANNEL_NAME_STORAGE_KEY/);
  assert.match(background, /ZIP_PASS_TRANSITION_MEMBER_IDS_STORAGE_KEY/);
  assert.match(background, /ZIP_PASS_TRANSITION_MEMBERS_SYNCED_AT_STORAGE_KEY/);
  assert.match(background, /async function fetchSlackConversationMembersViaApi/);
  assert.match(background, /\/api\/conversations\.members/);
  assert.match(background, /async function getPassTransitionMembers/);
  assert.match(background, /async function getPassTransitionRecipients/);
  assert.match(background, /ZIP_GET_PASS_TRANSITION_MEMBERS/);
  assert.match(background, /ZIP_GET_PASS_TRANSITION_RECIPIENTS/);
  assert.match(background, /ZIP_REHYDRATE_PASS_TRANSITION_MEMBERS/);
  assert.match(background, /ZIP_GET_PASS_TRANSITION_CONFIG/);
  assert.match(background, /ZIP_SLACK_API_SEND_TO_USER/);
});
