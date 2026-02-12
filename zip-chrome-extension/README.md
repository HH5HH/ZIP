# ZIP Chrome Extension (No 3P Dependencies)

**ZIP = Zeek Info Peek** — ZIP into INFO from the Zendesk API.

## Quick Start (Urgent Line Paged)

If the urgent line just paged, do this now:
1. Open `chrome://extensions`.
2. Toggle **Developer mode** ON.
3. Click **Load unpacked**.
4. Select `/Users/minnick/Documents/PASS/ZIP/zip-chrome-extension`.
5. Open `https://adobeprimetime.zendesk.com/agent/dashboard`.
6. Click ZIP, then click `Login with Zendesk` if prompted.
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

After one-time install, runtime flow is:

1. Open Zendesk page
2. Click the ZIP bubble
3. If logged out, click Login with Zendesk
4. After sign-in, ZIP loads profile + assigned tickets automatically

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
   - `https://adobeprimetime.zendesk.com/agent/dashboard`
6. ZIP opens and checks session automatically (floating panel button is available if collapsed).

## Team Handoff

You can hand off either of these:

1. Folder: `/Users/minnick/Documents/PASS/ZIP/zip-chrome-extension`
2. Zip: `/Users/minnick/Documents/PASS/ZIP/zip-chrome-extension.zip`

Also available:

- Install helper page: `/Users/minnick/Documents/PASS/ZIP/zip.html`

## Runtime Behavior

Runs only on:

- `https://adobeprimetime.zendesk.com/*`

Uses active logged-in Zendesk browser session to call:

- `/api/v2/users/me.json`
- `/api/v2/search.json?query=type:ticket assignee:{email} status:open status:pending status:hold`

## Side Panel Controls

- Action click opens ZIP side panel (`openPanelOnActionClick: true`)
- Context menu:
  - `⚙ > Side panel position`
  - `Ask Eric`
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
