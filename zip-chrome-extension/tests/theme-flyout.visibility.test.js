const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SIDEPANEL_JS_PATH = path.join(ROOT, "sidepanel.js");
const SIDEPANEL_CSS_PATH = path.join(ROOT, "sidepanel.css");

test("theme color flyout renders a flat ordered grid in the classic two-column style", () => {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  assert.match(source, /const orderedColorIds = \[\];/);
  assert.match(source, /const grid = document\.createElement\("div"\);[\s\S]*grid\.className = "zip-context-menu-theme-grid";/);
  assert.match(source, /colorBtn\.appendChild\(swatchChip\);[\s\S]*colorBtn\.appendChild\(nameEl\);/);
  assert.doesNotMatch(source, /zip-context-menu-theme-group-title/);
});

test("theme color flyout CSS supports classic light/dark card styling with two-column swatch grid", () => {
  const css = fs.readFileSync(SIDEPANEL_CSS_PATH, "utf8");
  assert.match(css, /\.zip-context-menu-theme-flyout\[data-theme-stop="light"\]\s*\{/);
  assert.match(css, /\.zip-context-menu-theme-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/);
  assert.match(css, /\.zip-context-menu-theme-color\s*\{[\s\S]*grid-template-columns:\s*auto minmax\(0,\s*1fr\);/);
  assert.match(css, /\.zip-context-menu-theme-color\.is-selected \.zip-context-menu-theme-color-name::after\s*\{/);
  assert.match(css, /\.zip-context-menu-theme-group-title\s*\{[\s\S]*display:\s*none;/);
});
