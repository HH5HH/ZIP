const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const SIDEPANEL_JS_PATH = path.join(ROOT, "sidepanel.js");

function extractFunctionSource(source, functionName) {
  const marker = "function " + functionName + "(";
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, "Unable to locate " + functionName + " in sidepanel.js");
  const bodyStart = source.indexOf("{", start);
  assert.notEqual(bodyStart, -1, "Unable to locate body for " + functionName);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }
  throw new Error("Unterminated function: " + functionName);
}

function loadPassAiMarkdownHelpers() {
  const source = fs.readFileSync(SIDEPANEL_JS_PATH, "utf8");
  const script = [
    'const ZIP_TOOL_DEEPLINK_LINK_LABEL = "in ZipTool";',
    extractFunctionSource(source, "escapePassAiHtml"),
    extractFunctionSource(source, "normalizePassAiMarkdownRefKey"),
    extractFunctionSource(source, "isPassAiHttpUrl"),
    extractFunctionSource(source, "decodePassAiHtmlEntities"),
    extractFunctionSource(source, "isPassAiUnderParUrl"),
    extractFunctionSource(source, "shouldStripPassAiUnderParContextParam"),
    extractFunctionSource(source, "stripPassAiUnderParContextParams"),
    extractFunctionSource(source, "sanitizePassAiUnderParHash"),
    extractFunctionSource(source, "sanitizePassAiMarkdownHref"),
    extractFunctionSource(source, "isPassAiZipClientShortcutLabel"),
    extractFunctionSource(source, "buildPassAiZipClientShortcutHtml"),
    extractFunctionSource(source, "buildPassAiMarkdownLinkHtml"),
    extractFunctionSource(source, "replacePassAiMarkdownInlineLinks"),
    extractFunctionSource(source, "renderPassAiInlineMarkdown"),
    "module.exports = { renderPassAiInlineMarkdown };"
  ].join("\n\n");
  const context = {
    module: { exports: {} },
    exports: {},
    URL,
    URLSearchParams,
    decodeURIComponent
  };
  vm.runInNewContext(script, context, { filename: SIDEPANEL_JS_PATH });
  return context.module.exports;
}

function extractHref(html) {
  const match = String(html || "").match(/href="([^"]+)"/);
  assert.ok(match, "Expected rendered HTML to include an href.");
  return match[1].replace(/&amp;/g, "&");
}

test("renderPassAiInlineMarkdown rewrites in UnderPAR shortcuts back to the ZIP client", () => {
  const { renderPassAiInlineMarkdown } = loadPassAiMarkdownHelpers();
  const url = "https://underpar.example/search?workspace=cmu&query=(status:open%20AND%20service:cmu)";
  const html = renderPassAiInlineMarkdown("[in UnderPAR](" + url + ")", {});

  assert.match(html, /href="#"/);
  assert.match(html, /data-zip-main-client="true"/);
  assert.match(html, />in ZipTool<\/a>/);
});

test("renderPassAiInlineMarkdown rewrites context-heavy in UnderPAR shortcuts back to the ZIP client", () => {
  const { renderPassAiInlineMarkdown } = loadPassAiMarkdownHelpers();
  const url = "https://underpar.example/search?workspace=cmu&query=(status:open%20AND%20service:cmu)&globalContext=%7B%22env%22%3A%22ENV3%22%7D&environment=ENV3&mediaCompany=MediaCompany4";
  const html = renderPassAiInlineMarkdown("[in UnderPAR](" + url + ")", {});

  assert.match(html, /href="#"/);
  assert.match(html, /data-zip-main-client="true"/);
  assert.match(html, />in ZipTool<\/a>/);
});

test("renderPassAiInlineMarkdown strips UnderPAR global context query params for non-shortcut links", () => {
  const { renderPassAiInlineMarkdown } = loadPassAiMarkdownHelpers();
  const url = "https://underpar.example/search?workspace=cmu&query=(status:open%20AND%20service:cmu)&globalContext=%7B%22env%22%3A%22ENV3%22%7D&environment=ENV3&mediaCompany=MediaCompany4";
  const html = renderPassAiInlineMarkdown("[UnderPAR search](" + url + ")", {});
  const href = extractHref(html);
  const parsed = new URL(href);

  assert.equal(parsed.origin + parsed.pathname, "https://underpar.example/search");
  assert.equal(parsed.searchParams.get("workspace"), "cmu");
  assert.equal(parsed.searchParams.get("query"), "(status:open AND service:cmu)");
  assert.equal(parsed.searchParams.get("globalContext"), null);
  assert.equal(parsed.searchParams.get("environment"), null);
  assert.equal(parsed.searchParams.get("mediaCompany"), null);
  assert.doesNotMatch(html, /globalContext|environment=|mediaCompany=/);
});

test("renderPassAiInlineMarkdown strips UnderPAR hash-route global context params for non-shortcut links", () => {
  const { renderPassAiInlineMarkdown } = loadPassAiMarkdownHelpers();
  const url = "https://underpar.example/#/cm-workspace?workspace=cmu&selectedEnv=ENV4&selectedMediaCompany=MediaCompany3&query=service:cmu";
  const html = renderPassAiInlineMarkdown("[UnderPAR search](" + url + ")", {});
  const href = extractHref(html);
  const parsed = new URL(href);
  const hashQuery = parsed.hash.split("?")[1] || "";
  const hashParams = new URLSearchParams(hashQuery);

  assert.equal(parsed.origin + parsed.pathname, "https://underpar.example/");
  assert.ok(parsed.hash.startsWith("#/cm-workspace?"), "Expected the CM workspace hash route to be preserved.");
  assert.equal(hashParams.get("workspace"), "cmu");
  assert.equal(hashParams.get("query"), "service:cmu");
  assert.equal(hashParams.get("selectedEnv"), null);
  assert.equal(hashParams.get("selectedMediaCompany"), null);
  assert.doesNotMatch(html, /selectedEnv|selectedMediaCompany/);
});

test("renderPassAiInlineMarkdown preserves non-UnderPAR query context", () => {
  const { renderPassAiInlineMarkdown } = loadPassAiMarkdownHelpers();
  const url = "https://example.com/search?workspace=cmu&environment=ENV3";
  const html = renderPassAiInlineMarkdown("[external](" + url + ")", {});

  assert.ok(
    html.includes('href="https://example.com/search?workspace=cmu&amp;environment=ENV3"'),
    "Expected non-UnderPAR links to remain unchanged."
  );
});
