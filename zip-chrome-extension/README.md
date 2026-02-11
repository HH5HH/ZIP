# ZIP Chrome Extension (No 3P Dependencies)

**ZIP = Zeek Info Peek** — ZIP into INFO from the Zendesk API.

**Mission:** Ship secure, scalable automations that connect our tools and help customers as fast as technology allows. When gatekeeping or "no shared token" roadblocks show up, we treat them as the yin to our yang—fuel for reflection, smarter design, and relentless follow‑through—letting results rise on their own while we stay focused on the work, not the doubters.

ZIP is now distributed as a pure Chrome Manifest V3 extension.

- No Tampermonkey
- No hosted SPA required
- No OAuth client-id prompt in local HTML

**Versioning:** Increment the `version` in `manifest.json` on every revision so all employees stay in sync with the latest build.

After one-time install, runtime flow is:

1. Open Zendesk page
2. Click the ZIP bubble
3. If logged out, click Login with Zendesk
4. After sign-in, ZIP loads profile + assigned tickets automatically

Logged-out behavior:

- ZIP collapses to the floating ZIP button by default.

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

## Enterprise Option

If teammates cannot use "Load unpacked", your Chrome admin can deploy this extension via managed policy.
