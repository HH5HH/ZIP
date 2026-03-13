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
    extractFunctionSource(source, "escapePassAiHtml"),
    extractFunctionSource(source, "normalizePassAiMarkdownRefKey"),
    extractFunctionSource(source, "isPassAiHttpUrl"),
    extractFunctionSource(source, "decodePassAiHtmlEntities"),
    extractFunctionSource(source, "buildPassAiMarkdownLinkHtml"),
    extractFunctionSource(source, "replacePassAiMarkdownInlineLinks"),
    extractFunctionSource(source, "renderPassAiInlineMarkdown"),
    "module.exports = { renderPassAiInlineMarkdown };"
  ].join("\n\n");
  const context = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(script, context, { filename: SIDEPANEL_JS_PATH });
  return context.module.exports;
}

test("renderPassAiInlineMarkdown preserves full UnderPAR-style query links", () => {
  const { renderPassAiInlineMarkdown } = loadPassAiMarkdownHelpers();
  const url = "https://underpar.example/search?workspace=cmu&query=(status:open%20AND%20service:cmu)";
  const html = renderPassAiInlineMarkdown("[in UnderPAR](" + url + ")", {});

  assert.ok(
    html.includes('href="https://underpar.example/search?workspace=cmu&amp;query=(status:open%20AND%20service:cmu)"'),
    "Expected the rendered href to preserve the full query URL."
  );
  assert.doesNotMatch(html, /&amp;amp;/);
  assert.match(html, />in UnderPAR<\/a>/);
});
