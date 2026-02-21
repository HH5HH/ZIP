const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const PALETTE_PATH = path.resolve(__dirname, "..", "theme-palette-data.js");
const TOKEN_CATALOG_PATH = path.resolve(
  __dirname,
  "..",
  "data",
  "spectrum-color-token-catalog.json",
);

const palette = require(PALETTE_PATH);
const tokenCatalog = require(TOKEN_CATALOG_PATH);

function canonicalTokenName(tokenName) {
  let normalized = String(tokenName || "").trim().toLowerCase();
  normalized = normalized.replace(/^spectrum-/, "");
  if (normalized.startsWith("teal-")) {
    // Spectrum's public token family name for teal hues is seafoam.
    normalized = "seafoam-" + normalized.slice("teal-".length);
  }
  return normalized;
}

test("spectrum token catalog is populated from official color-palette data", () => {
  assert.ok(tokenCatalog && typeof tokenCatalog === "object");
  assert.ok(Array.isArray(tokenCatalog.tokenNames), "tokenNames must be an array");
  assert.ok(tokenCatalog.tokenNames.length >= 300, "catalog should include full Spectrum color token set");
  assert.ok(tokenCatalog.tokens && typeof tokenCatalog.tokens === "object", "tokens map is required");
});

test("theme palette swatches resolve to known Spectrum color tokens", () => {
  const colors = Array.isArray(palette.colors) ? palette.colors : [];
  const knownTokens = new Set(tokenCatalog.tokenNames || []);
  const unresolved = [];

  colors.forEach((entry) => {
    const rawToken = String(entry && entry.spectrumToken || "").trim();
    assert.ok(rawToken.length > 0, "spectrumToken is required for " + String(entry && entry.id || "unknown"));
    const canonical = canonicalTokenName(rawToken);
    if (!knownTokens.has(canonical)) {
      unresolved.push({
        id: String(entry && entry.id || ""),
        token: rawToken,
        canonical
      });
    }
  });

  assert.deepEqual(unresolved, [], "unresolved Spectrum tokens: " + JSON.stringify(unresolved));
});

