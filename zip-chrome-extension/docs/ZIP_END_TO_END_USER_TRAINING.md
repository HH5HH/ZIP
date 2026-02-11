# ZIP End-to-End User Training

Congratulations, your PASS Zendesk life is no longer being throttled.

## Quick Start (Urgent Line Paged)
1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked and choose `/Users/minnick/Documents/PASS/ZIP/zip-chrome-extension`.
4. Open `https://adobeprimetime.zendesk.com/agent/dashboard`.
5. Open ZIP, authenticate with `Login with Zendesk` if prompted.
6. Work from `Assigned Tickets`, then pivot by Group/View/Org as needed.

![ZIP Master Brand Preview](assets/brand/zeek-info-peek-master-preview-1024.png)

## App Mission
ZIP = Zeek Info Peek. ZIP into INFO from the Zendesk API.

Mission: Ship secure, scalable automations that connect our tools and help customers as fast as technology allows. When gatekeeping or "no shared token" roadblocks show up, we treat them as the yin to our yang - fuel for reflection, smarter design, and relentless follow-through - letting results rise on their own while we stay focused on the work, not the doubters.

## What ZIP Is
ZIP is a Chrome extension side panel companion for `https://adobeprimetime.zendesk.com/*`.

Branding in this release is synced to the approved ZEEK INFO PEEK master media kit and is consistent across:
- Extension iconography
- Side panel shell and login card
- Install pages
- Training PDFs and binder

It gives agents and managers:
- Fast ticket visibility and filtering.
- Team-level pivots (By Group, By View, By Org).
- One-click refresh of the active ticket source.
- CSV export of exactly what is on screen.
- A GET API runner for Zendesk endpoints.
- Raw JSON inspection and download.

## Permissions and Trust Model
ZIP currently uses:
- `sidePanel`
- `tabs`
- `contextMenus`
- Host permission only for `https://adobeprimetime.zendesk.com/*`

Practical user impact:
- ZIP does not request blanket all-sites access.
- ZIP operates against the active authenticated Zendesk browser session.
- ZIP performs read operations (GET) in the UI workflows.

## Day 1 Setup
1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select folder: `/Users/minnick/Documents/PASS/ZIP/zip-chrome-extension`.
5. Open Zendesk dashboard: `https://adobeprimetime.zendesk.com/agent/dashboard`.
6. Open ZIP with one of the methods below.

## Opening ZIP (All Supported Methods)
### Method A: Action click
1. Go to a Zendesk tab.
2. Click the ZIP extension icon.
3. ZIP side panel opens.

### Method B: Context menu
1. Right-click the ZIP extension icon (or page context menu where available).
2. Choose `Open ZIP Side Panel`.

### Method C: Keyboard shortcut
1. Default shortcut:
- Windows/Linux: `Ctrl+Shift+Y`
- macOS: `Command+Shift+Y`
2. Press shortcut on active tab.
3. ZIP side panel opens or closes (toggle behavior where supported).

### Method D: Horizontal workspace tab
If your manager prefers a horizontal workspace experience:
1. Open context menu.
2. Choose `Open ZIP Workspace Tab (Horizontal)`.
3. ZIP opens in a full browser tab with wider layout.

## First Login and Session Behavior
1. If not signed in, ZIP shows login screen.
2. Click `Login with Zendesk`.
3. Sign in on Zendesk.
4. Return to ZIP panel.
5. ZIP auto-detects login and loads:
- Profile
- Assigned ticket queue
- Organization list
- View list
- Group/member list

Sign out behavior:
- `Sign out` button triggers Zendesk logout and returns ZIP to login mode.

## User Interface Tour
### Top Bar
- Agent avatar (or fallback indicator)
- Name, timezone, and email
- Sign out button

### Ticket Section
- Primary entry point: `Assigned Tickets`
- Scope selectors:
- By Group
- By View
- By Org
- Table columns:
- Ticket
- Subject
- Status
- Priority
- Created
- Updated

### Ticket Footer Controls
- Search field
- Status filter (`all`, `open`, `pending`, `hold`)
- Refresh button (icon)
- CSV export button

### API Section
- Dropdown of Zendesk GET endpoints
- Dynamic parameter fields
- `Run GET` button

### Raw Result Section
- Structured result table
- `Raw.JSON` download link

## Core Daily Workflows
### Workflow 1: Triage assigned queue
1. Open ZIP.
2. Click `Assigned Tickets`.
3. Sort by `Updated` descending.
4. Click a ticket row or ticket ID.
5. Zendesk main tab navigates directly to that ticket.

### Workflow 2: Team queue by group
1. Use `By Group` selector.
2. Choose a group or a group member.
3. ZIP loads corresponding tickets.
4. Apply Search and Status filters as needed.

### Workflow 3: Team queue by view
1. Use `By View` selector.
2. Select the desired Zendesk view.
3. ZIP loads view tickets.

### Workflow 4: Account queue by organization
1. Use `By Org` selector.
2. Select organization.
3. ZIP loads org tickets.

### Workflow 5: Refresh current source
1. Keep current source selected (Assigned/View/Org/Group).
2. Click Refresh icon.
3. ZIP reloads that same source and reports row count.

### Workflow 6: Export manager-ready CSV
1. Filter/sort table to your exact desired state.
2. Click CSV.
3. ZIP downloads CSV of exactly visible rows and order.
4. Filename includes context (source, row count, sort, timestamp).

### Workflow 7: Run an ad hoc Zendesk GET
1. Open `ZD API - GET` section.
2. Choose endpoint.
3. Fill parameters (defaults are prefilled where possible from your profile).
4. Click `Run GET`.
5. Inspect rendered result table.
6. Click `Raw.JSON` to download payload.

## How ZIP Filters Ticket Statuses
Default ticket loads exclude `solved` and `closed` statuses.

Practically, ZIP is optimized for active work queues.

## What Managers Should Know
- CSV export is WYSIWYG for the active table view.
- Horizontal workspace tab is available for broader layouts.
- ZIP can be used as a lightweight operations cockpit during standups.

## Troubleshooting
### ZIP panel does not open
- Confirm extension is loaded in `chrome://extensions`.
- Ensure current tab is Zendesk for side-panel mode.
- Try context menu `Open ZIP Workspace Tab (Horizontal)` as fallback.

### Login loop or session expired
- Click `Login with Zendesk`.
- Complete Zendesk auth in browser.
- Return to ZIP and click version link (`ZIP v...`) to refresh if needed.

### No tickets shown
- Clear Search text.
- Set Status filter to `All statuses`.
- Re-select source (Assigned/View/Org/Group).
- Click Refresh.

### CSV button disabled
- ZIP enables CSV only when at least one ticket row is visible.

## Recommended Training Runbook (45 minutes)
1. Mission + value framing (5 min)
2. Install and launch methods (5 min)
3. Ticket workflows (Assigned/Group/View/Org) (15 min)
4. CSV manager export drill (5 min)
5. API GET and Raw.JSON basics (10 min)
6. Troubleshooting and support process (5 min)

## Support Escalation Data to Capture
When reporting a ZIP issue, include:
- ZIP version (footer)
- Browser version
- Active Zendesk URL
- Selected source (Assigned/View/Org/Group)
- Screenshot of status message
- Whether issue reproduces in workspace tab mode
