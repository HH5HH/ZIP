# ZIP Project Rules

## Mandatory Version Bump Rule
- After any edit to ZIP application files (`zip-chrome-extension/*`, `zip.html`, `zip-chrome-install.html`), bump build version before finishing work.
- Use: `zip-chrome-extension/scripts/auto_bump_manifest_version.sh`
- Never deliver ZIP edits with an unchanged `zip-chrome-extension/manifest.json` version.

## Commit-Time Automation
- This repo also enforces automatic patch version bump during commit via `.githooks/pre-commit`.
- One-time hook setup command: `zip-chrome-extension/scripts/install_git_hooks.sh`

## Design System Lock
- Active design system for ZIP is Spectrum CSS.
- For any request that changes ZIP UI, HTML, CSS, theming, layout, typography, spacing, or component styling, always load and apply the `spectrum-css-core` skill at `/Users/minnick/.codex/skills/spectrum-css-core/SKILL.md`.
- Scope for this lock includes `zip-chrome-extension/*`, `zip.html`, and `zip-chrome-install.html`.
- Do not introduce alternate design systems, legacy Spectrum modes, or non-Spectrum UI patterns unless the user explicitly approves a design-system change.
- This lock remains in effect until the user explicitly replaces it.
