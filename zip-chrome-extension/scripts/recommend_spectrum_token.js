#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const CATALOG_PATH = path.resolve(
  __dirname,
  "..",
  "data",
  "spectrum-color-token-catalog.json",
);

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
const tokenNames = Array.isArray(catalog.tokenNames) ? catalog.tokenNames : [];
const tokenMap = catalog.tokens && typeof catalog.tokens === "object" ? catalog.tokens : {};

const rawQuery = process.argv.slice(2).join(" ").trim();
if (!rawQuery) {
  console.error("Usage: node scripts/recommend_spectrum_token.js \"<use case or color query>\"");
  console.error("Example: node scripts/recommend_spectrum_token.js \"primary button blue\"");
  process.exit(1);
}

function normalizeWords(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word === "grey") return "gray";
      if (word === "teal") return "seafoam";
      if (word === "neutral") return "gray";
      if (word === "brand") return "blue";
      return word;
    });
}

function scoreToken(tokenName, words) {
  let score = 0;
  const normalized = tokenName.toLowerCase();
  words.forEach((word) => {
    if (normalized === word) score += 80;
    if (normalized.startsWith(word + "-")) score += 60;
    if (normalized.includes(word)) score += 20;
  });

  if (words.includes("primary") && normalized.startsWith("blue-")) score += 15;
  if (words.includes("success") && (normalized.startsWith("green-") || normalized.startsWith("seafoam-"))) score += 15;
  if (words.includes("error") && normalized.startsWith("red-")) score += 15;
  if (words.includes("warning") && (normalized.startsWith("orange-") || normalized.startsWith("yellow-") || normalized.startsWith("chartreuse-"))) score += 15;

  return score;
}

function tokenPreview(tokenName) {
  const entry = tokenMap[tokenName];
  if (!entry || typeof entry !== "object") return "n/a";
  if (typeof entry.value === "string") return entry.value;
  if (entry.sets && typeof entry.sets === "object") {
    const light = entry.sets.light || "";
    const dark = entry.sets.dark || "";
    if (light || dark) return "light=" + light + " dark=" + dark;
  }
  return "n/a";
}

const queryWords = normalizeWords(rawQuery);
const ranked = tokenNames
  .map((tokenName) => ({ tokenName, score: scoreToken(tokenName, queryWords) }))
  .filter((entry) => entry.score > 0)
  .sort((a, b) => b.score - a.score || a.tokenName.localeCompare(b.tokenName))
  .slice(0, 12);

if (ranked.length === 0) {
  console.log("No direct matches. Try simpler terms like: blue, red, success, warning, neutral.");
  process.exit(0);
}

console.log("Top Spectrum color token matches for query: \"" + rawQuery + "\"");
ranked.forEach((entry, index) => {
  const preview = tokenPreview(entry.tokenName);
  console.log(String(index + 1).padStart(2, " ") + ". spectrum-" + entry.tokenName + "  (" + preview + ")");
});
