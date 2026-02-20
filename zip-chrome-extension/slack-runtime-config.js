"use strict";

(function installZipSlackRuntimeConfig() {
  if (typeof window === "undefined") return;

  // Bundled defaults so packaged ZIP builds do not depend on local-only files.
  if (!window.ZIP_PASS_AI_SLACK_APP_ID) {
    window.ZIP_PASS_AI_SLACK_APP_ID = "A0AGPACM3UG";
  }
  if (!window.ZIP_PASS_AI_EXPECTED_SLACK_TEAM_ID) {
    window.ZIP_PASS_AI_EXPECTED_SLACK_TEAM_ID = "T02CAQ0B2";
  }
  if (!window.ZIP_PASS_AI_SLACK_OIDC_CLIENT_ID) {
    window.ZIP_PASS_AI_SLACK_OIDC_CLIENT_ID = "2418816376.10567352717968";
  }
  if (!window.ZIP_PASS_AI_SLACK_OIDC_CLIENT_SECRET) {
    window.ZIP_PASS_AI_SLACK_OIDC_CLIENT_SECRET = "31520173933cb712899d53c26e36a936";
  }
  if (!window.ZIP_PASS_AI_SLACK_OIDC_SCOPE) {
    window.ZIP_PASS_AI_SLACK_OIDC_SCOPE = "openid profile email";
  }
  if (!window.ZIP_PASS_AI_SLACK_OIDC_REDIRECT_PATH) {
    window.ZIP_PASS_AI_SLACK_OIDC_REDIRECT_PATH = "slack-openid";
  }
  // Tokens are intentionally not hardcoded; provide via runtime/localStorage secrets.
})();
