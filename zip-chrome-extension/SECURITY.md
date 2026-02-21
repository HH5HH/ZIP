# ZIP Security Notes

## Secrets Handling

- Never commit `ZIP.KEY` or Slack app secrets/tokens to git.
- ZIP stores Slack ZIP.KEY values in `chrome.storage.local` only.
- ZIP does not store Slack ZIP.KEY values in `window.localStorage`.
- ZIP.KEY should namespace values by service (for current Slack flow use `slacktivation.*` keys).
- ZIP Slack OAuth/OpenID exchanges are handled by the background service worker.
- Content scripts must not access ZIP.KEY app secrets.

## Rotation Procedure

1. Generate a new ZIP.KEY payload with rotated Slack app credentials.
2. Publish the new ZIP.KEY file on the internal auth-gated ZIP Tool Beta page.
3. Users run `Get Latest`, then use `Clear ZIP.KEY`.
4. Users import the new ZIP.KEY (sidepanel drop zone or options page).
5. Verify `SLACKTIVATED` and `@ME` are restored.

## Emergency Revocation

1. Revoke compromised Slack credentials in Slack app/admin settings.
2. Distribute rotated ZIP.KEY immediately.
3. Instruct users to run `Clear ZIP.KEY` and import the new key.
4. Confirm old tokens fail and new token flows succeed.

## Storage Checklist

- `zip_slack_client_id`
- `zip_slack_client_secret`
- `zip_slack_oauth_token` (required)
- `zip_slack_scope`
- `zip_slack_redirect_path`
- `zip_slack_redirect_uri`
- `zip_slack_user_token`
- `zip_slack_key_loaded`

## Additional Guidance

- Prefer short-lived tokens where possible.
- Avoid logging sensitive values.
- If server hosting is available later, move secret exchanges server-side and keep the extension on short-lived credentials only.
