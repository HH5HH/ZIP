# Paste this into Cursor User Rules (applies to all projects)

**How to add:** Cursor → **Settings** → **Cursor Settings** → **Rules for AI** → **User Rules** (or "Global rules"). Add a new rule and paste the content below.

---

## Rule: Auto-increment build number after every change

After every single update, change, or refactoring, increment the project's version / build number in the same response.

- **Chrome / Web extensions:** Bump `"version"` in `manifest.json` (e.g. `1.0.5` → `1.0.6`).
- **Node / npm:** Bump `"version"` in `package.json` (e.g. `1.0.5` → `1.0.6`), or run `npm version patch`.
- **Other:** If the project has a version field (e.g. `pyproject.toml`, `Cargo.toml`, `build.gradle`), increment it.

Do the version bump in the same set of changes that modified the code—do not leave it for "later."
