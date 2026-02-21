# ZIP Chrome Extension (No 3P Dependencies)

**ZIP = Zeek Info Peek** — ZIP into INFO from the Zendesk API.

## NO POPUPS OR NEW AUTH FLOWS

**Critical policy:** ZIP does not introduce popup login, OAuth login, token exchange, or any alternate Zendesk auth UX.

- `Login with Zendesk` in the sidepanel only does one of two things:
- Focus an existing Zendesk tab (`https://{subdomain}.zendesk.com/*`) in the main browser context.
- Open a normal browser tab to `https://{subdomain}.zendesk.com/access/login?return_to=<encoded https://{subdomain}.zendesk.com/agent/dashboard?brand_id=2379046>` when no Zendesk tab exists.
- ZIP has no local `Sign out` control. Session state is fully synchronized to Zendesk session state.
- Session authority is `GET /api/v2/users/me/session` from the Zendesk content script, with background fallback only when the content script is unavailable.

## SLACKTIVATED Flow

- ZIP now performs no-touch Slack session detection for `https://adobedx.slack.com/`.
- ZIP supports optional **official Slack OpenID Connect Sign in with Slack** flow (via `chrome.identity.launchWebAuthFlow`) when app credentials are configured.
- The SLACKTIVATED indicator lives in the app header (to the right of the Zendesk avatar) and has two states:
- `NOT_SLACKTIVATED`: disabled-looking Slack app icon with tooltip `ZIP is not SLACKTIVATED - Click to login into https://adobedx.slack.com/`.
- `SLACKTIVATED`: current Slack user avatar with tooltip `Hey {logged in user}, ZIP is SLACKTIVATED!!!`.
- Clicking the indicator while `NOT_SLACKTIVATED` focuses an existing Slack workspace tab or opens a standard Slack tab. ZIP waits for Slack web session confirmation and then flips to `SLACKTIVATED`.
- When Slack OpenID credentials are present, ZIP attempts non-interactive OpenID auth first (no-touch if session is already valid), then interactive OpenID auth, then falls back to workspace tab detection.
- Q&AI (Singularity button) and `@ME` are shown for ticket-selected workflows and stay disabled until SLACKTIVATED.
- `@ME` (`SLACK_IT_TO_ME`) sends the visible ticket table as Markdown to the logged-in Slack user via DM.
- `@ME` now uses strict background Slack API delivery only (no Slack tab relay). End users should only see the resulting DM arrive in Slack.
- Git-tracked source keeps sensitive Slack values empty. ZIP.KEY secrets are stored in `chrome.storage.local` only.

Slack ZIP.KEY config keys (`chrome.storage.local`):
- `zip_slack_client_id`
- `zip_slack_client_secret`
- `zip_slack_oauth_token` (required user token)
- `zip_slack_scope` (default `openid profile email`)
- `zip_slack_redirect_path` (default `slack-user`)
- `zip_slack_redirect_uri` (optional explicit `https://<extension-id>.chromiumapp.org/...` override)
- `zip_slack_user_token`
- `zip_slack_key_loaded` (required gate flag)

Legacy `localStorage` Slack keys are migrated to `chrome.storage.local` and removed.

## ZIP.KEY Unlock Flow

ZIP sidepanel now requires a one-time `ZIP.KEY` import before showing `Sign in with Zendesk`.

Key envelope format:
- Prefix: `ZIPKEY1:`
- Payload: base64-encoded JSON

Required fields in payload:
- `slacktivation.client_id`
- `slacktivation.client_secret`
- `slacktivation.user_token`

Optional payload fields (only if you need overrides):
- `slacktivation.scope`
- `slacktivation.redirect_path`
- `slacktivation.redirect_uri`
- `slacktivation.singularity_channel_id`
- `slacktivation.singularity_mention`

Example payload JSON:
```json
{
  "services": {
    "slacktivation": {
      "client_id": "YOUR_CLIENT_ID",
      "client_secret": "YOUR_CLIENT_SECRET",
      "user_token": "xoxp-REQUIRED_USER_TOKEN"
    }
  }
}
```

Create `ZIP.KEY` from payload JSON:
```bash
printf 'ZIPKEY1:%s\n' "$(base64 < zip-key-payload.json | tr -d '\n')" > ZIP.KEY
```

Minimal `KEY=VALUE` format (recommended) is also supported:
```ini
slacktivation.client_id=YOUR_SLACK_OIDC_CLIENT_ID
slacktivation.client_secret=YOUR_SLACK_OIDC_CLIENT_SECRET
slacktivation.user_token=xoxp-YOUR_REQUIRED_USER_TOKEN
```

Optional override keys are still supported if needed:
- `slacktivation.scope`
- `slacktivation.redirect_path`
- `slacktivation.redirect_uri`
- `slacktivation.singularity_channel_id`
- `slacktivation.singularity_mention`

Template file:
- `zip-chrome-extension/ZIP.KEY.template`

Admin and developer controls:
- Sidepanel unlock card supports drag-and-drop `ZIP.KEY` import.
- Extension settings page (`options.html`) supports file import, paste import, and one-click `Clear ZIP.KEY`.
- Clear/reset is available from both menus:
  - Chrome action context menu: `Clear ZIP.KEY`
  - ZIP in-app avatar menu: `Clear ZIP.KEY`

## Quick Start (Urgent Line Paged)

If the urgent line just paged, do this now:
1. Open `chrome://extensions`.
2. Toggle **Developer mode** ON.
3. Click **Load unpacked**.
4. Select `/Users/minnick/Documents/PASS/ZIP/zip-chrome-extension`.
5. Open `https://adobeprimetime.zendesk.com/agent/dashboard?brand_id=2379046`.
6. Click ZIP, drop `ZIP.KEY` on the unlock card, then click `Login with Zendesk` if prompted.
7. Click `Assigned Tickets` and start triage.

![ZIP Master Brand Preview](docs/assets/brand/zeek-info-peek-master-preview-1024.png)

**Mission:** Ship secure, scalable automations that connect our tools and help customers as fast as technology allows. Don't get stuck wasting cycles on blockers. If ZIP can make your job faster, better, or more enjoyable, please share feedback.

ZIP is now distributed as a pure Chrome Manifest V3 extension.

- No Tampermonkey
- No hosted SPA required
- No OAuth client-id prompt in local HTML

**Versioning (Automated):** This repo now auto-increments `manifest.json` on commit when ZIP app files are staged.

- Hook: `.githooks/pre-commit`
- Bump script: `scripts/auto_bump_manifest_version.sh`
- One-time setup (already run in this repo): `scripts/install_git_hooks.sh`

Result: every ZIP code/content commit bumps patch version (`x.y.z` -> `x.y.(z+1)`) automatically.

## Spectrum 2 MCP Power Tools

Use these commands when you want ZIP work to stay tightly aligned with official Spectrum 2 data.

1. Patch cached `spectrum-design-data-mcp` loader paths (stops empty token/schema responses caused by bad fallback paths):
   - `scripts/patch_spectrum_mcp_paths.sh`
2. Sync MCP data sources (refreshes docs and fallback mirrors):
   - `scripts/sync_spectrum_mcp_data.sh`
3. Recommend closest Spectrum color tokens for a use case:
   - `node scripts/recommend_spectrum_token.js "primary button blue"`
4. Enforce palette token drift guardrails in tests:
   - `node --test tests/spectrum-token.guardrails.test.js`

Notes:
- The sync script mirrors token/schema data into the current npx MCP cache and refreshes `~/Spectrum/spectrum-design-data/docs/s2-docs`.
- This does not modify ZIP auth/session behavior.
- If your assistant reports MCP `Transport closed`, restart the assistant session after running the patch/sync commands.

After one-time install, runtime flow is:

1. Open Zendesk page
2. Click the ZIP bubble
3. Import `ZIP.KEY` on the login card (one-time per required service settings)
4. If logged out, click Login with Zendesk
5. After sign-in, ZIP loads profile + assigned tickets automatically

Logged-out behavior:

- ZIP shows a branded login card and opens Zendesk authentication from the `Login with Zendesk` button.

## Brand System (Master Kit)

This build is aligned to the latest approved media assets:
- Core media kit: `/Users/minnick/Downloads/ZEEKINFOPEEK_ZIP_V5_FULL_DELIVERY.zip`
- Current app icon pack: `/Users/minnick/Downloads/ZIP_APP_ICON_PACK_round.zip`

Integrated assets now live in:
- `assets/brand/icons`
- `assets/brand/source`
- `assets/brand/splash`
- `docs/assets/brand`

Current release:
- `manifest.json` version: use current value in `zip-chrome-extension/manifest.json`

## Quick Start

1. Open Chrome and go to `chrome://extensions`.
2. Toggle **Developer mode** ON.
3. Click **Load unpacked**.
4. Select this folder:
   - `/Users/minnick/Documents/PASS/ZIP/zip-chrome-extension`
5. Open Zendesk:
   - `https://adobeprimetime.zendesk.com/agent/dashboard?brand_id=2379046`
6. ZIP opens and checks session automatically (floating panel button is available if collapsed).

## Team Handoff

You can hand off either of these:

1. Folder: `/Users/minnick/Documents/PASS/ZIP/zip-chrome-extension`
2. Zip: `/Users/minnick/Documents/PASS/ZIP/zip-chrome-extension.zip`

Also available:

- Install helper page: `/Users/minnick/Documents/PASS/ZIP/zip.html`

## Runtime Behavior

Runs on:

- `https://*.zendesk.com/*`
- `https://*.slack.com/*`

Uses active logged-in Zendesk browser session to call:

- `/api/v2/users/me.json`
- `/api/v2/search.json?query=type:ticket assignee:{email} status:open status:pending status:hold`

## Auth QA Checklist (Sidepanel)

- Open ZIP sidepanel with a valid Zendesk tab/session:
- Sidepanel should transition to authenticated UI quickly (content script auth event first, fallback check second).
- No popup windows should appear.
- Open ZIP sidepanel while logged out:
- Sidepanel shows login UI.
- Clicking `Login with Zendesk` must focus/open a standard Zendesk tab only.
- No `window.open`, no `chrome.windows.create({ type: "popup" })`, and no OAuth/token-exchange login endpoints for Zendesk should be invoked.
- Trigger Zendesk logout in a Zendesk tab:
- Content script should emit immediate logout and sidepanel should return to login UI.
- Confirm no local `Sign out` control exists in the sidepanel UI.
- Confirm no `DELETE /api/v2/users/me/logout` request is sent by ZIP.

## Side Panel Controls

- Action click opens ZIP side panel (`openPanelOnActionClick: true`)
- Context menu:
  - `⚙ > Side panel position`
  - `Ask Eric`
  - `Spectrum 2 Theme` (Light, Dark, Darkest, Indigo, Blue)
- Keyboard shortcut command:
  - `Open or close ZIP side panel` (default `Ctrl+Shift+Y` / `Command+Shift+Y`)

ZIP is tab-scoped for Zendesk URLs and disabled on irrelevant domains to avoid workspace clutter.

### Left/Right Positioning Note

Chrome Side Panel supports left/right docking only (not top/bottom).
ZIP reads current side via `chrome.sidePanel.getLayout()` and keeps UI/context menu state in sync.
If Chrome exposes a programmatic setter in the running browser (`setLayout`/`setSide`), ZIP will use it.
When no setter is available, side placement remains controlled by Chrome/browser settings and ZIP opens side panel settings as fallback.

## Enterprise Option

If teammates cannot use "Load unpacked", your Chrome admin can deploy this extension via managed policy.
