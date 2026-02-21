"use strict";

(function installZipSlackRuntimeLocalSecrets() {
  if (typeof window === "undefined") return;

  // Copy this file to slack-runtime-config.local.js (git-ignored),
  // then replace placeholders with internal Slack OpenID values.
  if (!window.ZIP_PASS_AI_SLACK_APP_ID) {
    window.ZIP_PASS_AI_SLACK_APP_ID = "A0XXXXXXX";
  }
  if (!window.ZIP_PASS_AI_EXPECTED_SLACK_TEAM_ID) {
    window.ZIP_PASS_AI_EXPECTED_SLACK_TEAM_ID = "TXXXXXXXX";
  }
  if (!window.ZIP_PASS_AI_SLACK_OIDC_CLIENT_ID) {
    window.ZIP_PASS_AI_SLACK_OIDC_CLIENT_ID = "YOUR_CLIENT_ID";
  }
  if (!window.ZIP_PASS_AI_SLACK_OIDC_CLIENT_SECRET) {
    window.ZIP_PASS_AI_SLACK_OIDC_CLIENT_SECRET = "YOUR_CLIENT_SECRET";
  }
  if (!window.ZIP_PASS_AI_SLACK_OIDC_SCOPE) {
    window.ZIP_PASS_AI_SLACK_OIDC_SCOPE = "openid profile email";
  }
  if (!window.ZIP_PASS_AI_SLACK_OIDC_REDIRECT_PATH) {
    window.ZIP_PASS_AI_SLACK_OIDC_REDIRECT_PATH = "slack-user";
  }
  if (!window.ZIP_PASS_AI_SLACK_OIDC_REDIRECT_URI) {
    window.ZIP_PASS_AI_SLACK_OIDC_REDIRECT_URI = "";
  }
  // Slack API user token is now loaded from ZIP.KEY into chrome.storage.local.
})();
