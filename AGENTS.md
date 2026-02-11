# ZIP Project Rules

## Mandatory Version Bump Rule
- After any edit to ZIP application files (`zip-chrome-extension/*`, `zip.html`, `zip-chrome-install.html`), bump build version before finishing work.
- Use: `zip-chrome-extension/scripts/auto_bump_manifest_version.sh`
- Never deliver ZIP edits with an unchanged `zip-chrome-extension/manifest.json` version.

## Commit-Time Automation
- This repo also enforces automatic patch version bump during commit via `.githooks/pre-commit`.
- One-time hook setup command: `zip-chrome-extension/scripts/install_git_hooks.sh`
