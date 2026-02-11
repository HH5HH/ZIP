# ZIP User UAT Test Cases

Version under test: `1.0.21`

## Quick Start (Urgent Line Paged)
If the team needs to get running immediately:
1. Open `chrome://extensions` and enable Developer mode.
2. Load unpacked: `/Users/minnick/Documents/PASS/ZIP/zip-chrome-extension`.
3. Open `https://adobeprimetime.zendesk.com/agent/dashboard`.
4. Open ZIP and sign in if prompted.
5. Execute triage from `Assigned Tickets`, then run the full UAT matrix below.

## Test Execution Notes
- Execute on latest Chrome stable available to team.
- Capture screenshot for each failed case.
- Record environment: OS, Chrome version, Zendesk role.

## UAT Matrix

| ID | Scenario | Preconditions | Steps | Expected Result |
|---|---|---|---|---|
| UAT-001 | Load extension | ZIP folder available | 1. Open `chrome://extensions` 2. Load unpacked ZIP folder | Extension loads without manifest errors |
| UAT-002 | Action click opens panel | Zendesk tab open | 1. Activate Zendesk tab 2. Click ZIP icon | ZIP side panel opens |
| UAT-003 | Action click from non-Zendesk | Non-Zendesk tab active | 1. Activate non-Zendesk tab 2. Click ZIP icon | Side panel remains domain-aware; use context menu/shortcut behavior per policy |
| UAT-004 | Context menu open panel | ZIP installed | 1. Right-click extension icon 2. Click `Open ZIP Side Panel` | ZIP side panel opens |
| UAT-005 | Context menu horizontal workspace | ZIP installed | 1. Right-click extension icon 2. Click `Open ZIP Workspace Tab (Horizontal)` | New full tab opens with ZIP workspace layout |
| UAT-006 | Keyboard shortcut open/close (Win/Linux) | Shortcut available | 1. Press `Ctrl+Shift+Y` on Zendesk tab 2. Press again | Opens ZIP panel, then closes/toggles where supported |
| UAT-007 | Keyboard shortcut open/close (macOS) | Shortcut available | 1. Press `Command+Shift+Y` on Zendesk tab 2. Press again | Opens ZIP panel, then closes/toggles where supported |
| UAT-008 | Login button flow | User not logged into Zendesk | 1. Open ZIP 2. Click `Login with Zendesk` | Browser opens Zendesk sign-in page |
| UAT-009 | Session auto-detect after login | Logged out at start | 1. Log in through Zendesk 2. Return to ZIP | ZIP auto-detects session and loads data |
| UAT-010 | Sign out flow | Logged in user | 1. Click `Sign out` | ZIP returns to login mode |
| UAT-011 | Assigned tickets default load | Logged in user with tickets | 1. Open ZIP 2. Click `Assigned Tickets` | Active ticket rows appear |
| UAT-012 | By Group load | Group data available | 1. Select group from By Group | Group ticket list loads |
| UAT-013 | By Group member load | Group member available | 1. Select agent from By Group | Agent-assigned ticket list loads |
| UAT-014 | By View load | Views available | 1. Select Zendesk view | View ticket list loads |
| UAT-015 | By Org load | Orgs available | 1. Select organization | Org ticket list loads |
| UAT-016 | Reset source back to Assigned | Other source selected | 1. Clear selector (set to `—`) | Assigned tickets reload |
| UAT-017 | Ticket search filter | Ticket rows loaded | 1. Enter known ticket term in search | Visible rows match term |
| UAT-018 | Status filter | Ticket rows loaded | 1. Change status filter (`open`, `pending`, `hold`) | Visible rows match selected status |
| UAT-019 | Column sort | Ticket rows loaded | 1. Click `Updated` header 2. Click again | Sort toggles direction |
| UAT-020 | Open ticket by row click | Ticket rows loaded | 1. Click row | Main Zendesk tab navigates to ticket |
| UAT-021 | Open ticket by ID click | Ticket rows loaded | 1. Click ticket ID link | Main Zendesk tab navigates to ticket |
| UAT-022 | Refresh current source | Any source active | 1. Click refresh icon | Same source reloads and status message updates |
| UAT-023 | CSV export enabled state | No rows then rows | 1. Observe CSV disabled with no rows 2. Load rows | CSV button enables when rows exist |
| UAT-024 | CSV exactness | Known visible subset (e.g., 10 rows) | 1. Apply sort/filter 2. Export CSV | CSV has same rows, same order, includes ticket URL |
| UAT-025 | CSV filename context | Rows loaded | 1. Export CSV 2. Inspect filename | Filename includes source/row count/sort/timestamp |
| UAT-026 | API GET run | Logged in session | 1. Select path 2. Set params 3. Click `Run GET` | Response table renders and status indicates HTTP result |
| UAT-027 | Raw.JSON download | API response present | 1. Click `Raw.JSON` | JSON file downloads |
| UAT-028 | Side panel left/right adaptation | Chrome supports side panel side switch | 1. Dock side panel left, then right | ZIP header side accent updates accordingly |
| UAT-029 | Narrow-width dropdown containment | Side panel resizable | 1. Resize panel very narrow 2. Open By Group/View/Org | Menus stay inside app shell (no overflow) |
| UAT-030 | Non-Zendesk scope protection | Open non-Zendesk page | 1. Switch tabs between Zendesk and non-Zendesk | ZIP remains focused on Zendesk context |
| UAT-031 | Master icon branding | ZIP installed | 1. Open extension manager and toolbar icon 2. Compare icon glyph | Icon matches latest master media kit |
| UAT-032 | Branded login presentation | User logged out | 1. Open ZIP side panel | Login view shows approved mark/splash and readable mission text |
| UAT-033 | Branded documentation output | PDF package generated | 1. Open manager handout/training PDFs 2. Review first page | PDFs show polished Spectrum 2 branded styling with media kit assets |

## Required Evidence per Test Run
For each failed case, capture:
- Screenshot/video.
- Exact timestamp.
- ZIP version.
- Active URL.
- Status message text from ZIP footer.
- Reproduction consistency (`Always`, `Intermittent`, `One-off`).

## Pass Criteria for Training Launch
- All launch/access tests (UAT-001 through UAT-007) pass.
- All ticket workflow tests (UAT-011 through UAT-022) pass.
- Export correctness tests (UAT-023 through UAT-025) pass.
- Layout and containment tests (UAT-028 and UAT-029) pass.

## Defect Severity Guidance
- P1: Cannot open ZIP or cannot load tickets.
- P2: Wrong dataset, wrong navigation target, broken CSV fidelity.
- P3: Visual/layout issue with workaround.
- P4: Cosmetic text/spacing issue.
