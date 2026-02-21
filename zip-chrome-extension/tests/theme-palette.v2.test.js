const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const PALETTE_PATH = path.resolve(__dirname, "..", "theme-palette-data.js");
const palette = require(PALETTE_PATH);

function hexToRgb(hexValue) {
  const raw = String(hexValue || "").trim();
  const normalized = raw.startsWith("#") ? raw.slice(1) : raw;
  assert.match(normalized, /^[0-9a-fA-F]{6}$/, "invalid hex color: " + hexValue);
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16)
  ];
}

function srgbToLinear(channel) {
  const v = Math.max(0, Math.min(255, Number(channel) || 0)) / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(linear) {
  const v = Math.max(0, Math.min(1, Number(linear) || 0));
  if (v <= 0.0031308) return v * 12.92;
  return (1.055 * Math.pow(v, 1 / 2.4)) - 0.055;
}

function rgbToXyz(rgb) {
  const [r, g, b] = rgb.map(srgbToLinear);
  const x = (r * 0.4124564) + (g * 0.3575761) + (b * 0.1804375);
  const y = (r * 0.2126729) + (g * 0.7151522) + (b * 0.0721750);
  const z = (r * 0.0193339) + (g * 0.1191920) + (b * 0.9503041);
  return [x, y, z];
}

function xyzToLab(xyz) {
  const [x, y, z] = xyz;
  const refX = 0.95047;
  const refY = 1.00000;
  const refZ = 1.08883;

  const fx = labPivot(x / refX);
  const fy = labPivot(y / refY);
  const fz = labPivot(z / refZ);

  return [
    (116 * fy) - 16,
    500 * (fx - fy),
    200 * (fy - fz)
  ];
}

function labPivot(value) {
  const epsilon = 216 / 24389;
  const kappa = 24389 / 27;
  if (value > epsilon) return Math.cbrt(value);
  return ((kappa * value) + 16) / 116;
}

function hexToLab(hexValue) {
  return xyzToLab(rgbToXyz(hexToRgb(hexValue)));
}

function radiansToDegrees(value) {
  return (180 / Math.PI) * value;
}

function degreesToRadians(value) {
  return (Math.PI / 180) * value;
}

// CIEDE2000 implementation for perceptual distance checks.
function deltaE2000(lab1, lab2) {
  const [l1, a1, b1] = lab1;
  const [l2, a2, b2] = lab2;

  const avgLp = (l1 + l2) / 2;
  const c1 = Math.sqrt((a1 * a1) + (b1 * b1));
  const c2 = Math.sqrt((a2 * a2) + (b2 * b2));
  const avgC = (c1 + c2) / 2;

  const g = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));
  const a1p = (1 + g) * a1;
  const a2p = (1 + g) * a2;
  const c1p = Math.sqrt((a1p * a1p) + (b1 * b1));
  const c2p = Math.sqrt((a2p * a2p) + (b2 * b2));
  const avgCp = (c1p + c2p) / 2;

  const h1p = hueAngleDegrees(a1p, b1);
  const h2p = hueAngleDegrees(a2p, b2);
  const avgHp = averageHueDegrees(h1p, h2p, c1p, c2p);

  const t = 1
    - (0.17 * Math.cos(degreesToRadians(avgHp - 30)))
    + (0.24 * Math.cos(degreesToRadians(2 * avgHp)))
    + (0.32 * Math.cos(degreesToRadians((3 * avgHp) + 6)))
    - (0.20 * Math.cos(degreesToRadians((4 * avgHp) - 63)));

  const deltaHp = deltaHueDegrees(h1p, h2p, c1p, c2p);
  const deltaLp = l2 - l1;
  const deltaCp = c2p - c1p;
  const deltaBigHp = 2 * Math.sqrt(c1p * c2p) * Math.sin(degreesToRadians(deltaHp) / 2);

  const sl = 1 + ((0.015 * Math.pow(avgLp - 50, 2)) / Math.sqrt(20 + Math.pow(avgLp - 50, 2)));
  const sc = 1 + (0.045 * avgCp);
  const sh = 1 + (0.015 * avgCp * t);

  const deltaTheta = 30 * Math.exp(-Math.pow((avgHp - 275) / 25, 2));
  const rc = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
  const rt = -Math.sin(degreesToRadians(2 * deltaTheta)) * rc;

  const kl = 1;
  const kc = 1;
  const kh = 1;

  const lTerm = deltaLp / (kl * sl);
  const cTerm = deltaCp / (kc * sc);
  const hTerm = deltaBigHp / (kh * sh);

  return Math.sqrt(
    (lTerm * lTerm)
      + (cTerm * cTerm)
      + (hTerm * hTerm)
      + (rt * cTerm * hTerm)
  );
}

function hueAngleDegrees(ap, b) {
  if (ap === 0 && b === 0) return 0;
  const angle = radiansToDegrees(Math.atan2(b, ap));
  return angle >= 0 ? angle : angle + 360;
}

function averageHueDegrees(h1, h2, c1, c2) {
  if (c1 === 0 || c2 === 0) return h1 + h2;
  const diff = Math.abs(h1 - h2);
  if (diff <= 180) return (h1 + h2) / 2;
  if ((h1 + h2) < 360) return (h1 + h2 + 360) / 2;
  return (h1 + h2 - 360) / 2;
}

function deltaHueDegrees(h1, h2, c1, c2) {
  if (c1 === 0 || c2 === 0) return 0;
  const diff = h2 - h1;
  if (Math.abs(diff) <= 180) return diff;
  if (diff > 180) return diff - 360;
  return diff + 360;
}

function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map(srgbToLinear);
  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

function contrastRatio(hexBackground, hexForeground) {
  const bgLum = relativeLuminance(hexToRgb(hexBackground));
  const fgLum = relativeLuminance(hexToRgb(hexForeground));
  const lighter = Math.max(bgLum, fgLum);
  const darker = Math.min(bgLum, fgLum);
  return (lighter + 0.05) / (darker + 0.05);
}

function simulateColorBlindness(rgb, matrix) {
  const [r, g, b] = rgb.map(srgbToLinear);
  const rL = (matrix[0][0] * r) + (matrix[0][1] * g) + (matrix[0][2] * b);
  const gL = (matrix[1][0] * r) + (matrix[1][1] * g) + (matrix[1][2] * b);
  const bL = (matrix[2][0] * r) + (matrix[2][1] * g) + (matrix[2][2] * b);
  return [
    Math.round(linearToSrgb(rL) * 255),
    Math.round(linearToSrgb(gL) * 255),
    Math.round(linearToSrgb(bL) * 255)
  ];
}

function rgbToLab(rgb) {
  return xyzToLab(rgbToXyz(rgb));
}

function pairwiseMinimumDelta(labs) {
  let min = Number.POSITIVE_INFINITY;
  let pair = null;
  for (let i = 0; i < labs.length; i += 1) {
    for (let j = i + 1; j < labs.length; j += 1) {
      const delta = deltaE2000(labs[i], labs[j]);
      if (delta < min) {
        min = delta;
        pair = [i, j];
      }
    }
  }
  return { min, pair };
}

function pairwiseSeparationRatio(labs, threshold) {
  let separated = 0;
  let total = 0;
  for (let i = 0; i < labs.length; i += 1) {
    for (let j = i + 1; j < labs.length; j += 1) {
      total += 1;
      if (deltaE2000(labs[i], labs[j]) >= threshold) separated += 1;
    }
  }
  return total > 0 ? (separated / total) : 1;
}

test("theme palette v2 has 20 unique swatches with required fields", () => {
  const colors = Array.isArray(palette.colors) ? palette.colors : [];
  assert.equal(colors.length, 20, "palette must contain exactly 20 colors");
  colors.forEach((entry) => {
    assert.ok(entry && typeof entry === "object", "color entry must be object");
    assert.match(String(entry.id || ""), /^[a-z0-9-]+$/, "id must be kebab-case");
    assert.ok(String(entry.name || "").trim().length > 0, "name is required");
    assert.match(String(entry.hex || ""), /^#[0-9a-fA-F]{6}$/, "hex must be #RRGGBB");
    assert.ok(String(entry.spectrumToken || "").trim().length > 0, "spectrumToken is required");
    assert.ok(entry.recommendedForeground === "#ffffff" || entry.recommendedForeground === "#111111", "recommendedForeground must be #ffffff or #111111");
  });
  const uniqueHexes = new Set(colors.map((entry) => String(entry.hex).toLowerCase()));
  assert.equal(uniqueHexes.size, colors.length, "hex values must be unique");
});

test("theme palette v2 group ordering matches required hue flow", () => {
  const expectedOrder = [
    "azure-blue", "indigo", "violet",
    "fuchsia", "magenta",
    "petrus-red", "carmine",
    "pumpkin", "amber", "sunflower",
    "chartreuse", "emerald", "teal", "turquoise", "cyan",
    "cinnamon", "bronze",
    "silver", "slate-gray", "charcoal"
  ];
  const groups = Array.isArray(palette.groups) ? palette.groups : [];
  const ordered = groups.flatMap((group) => (Array.isArray(group.colorIds) ? group.colorIds : []));
  assert.deepEqual(ordered, expectedOrder, "palette order must follow requested grouped flow");
  assert.equal(new Set(ordered).size, 20, "grouped order must include each swatch once");
});

test("theme palette v2 has perceptual separation in Lab space", () => {
  const colors = palette.colors || [];
  const labs = colors.map((entry) => hexToLab(entry.hex));
  const { min, pair } = pairwiseMinimumDelta(labs);
  const pairLabel = pair
    ? (String(colors[pair[0]].name) + " vs " + String(colors[pair[1]].name))
    : "n/a";
  assert.ok(min >= 10, "minimum \u0394E00 must be >= 10, got " + min.toFixed(2) + " for " + pairLabel);
});

test("theme palette v2 recommended foreground meets contrast policy", () => {
  const colors = palette.colors || [];
  colors.forEach((entry) => {
    const contrastRecommended = contrastRatio(entry.hex, entry.recommendedForeground);
    const contrastWhite = contrastRatio(entry.hex, "#ffffff");
    const contrastDark = contrastRatio(entry.hex, "#111111");
    const best = Math.max(contrastWhite, contrastDark);
    if (contrastRecommended >= 4.5) return;
    if (best >= 4.5) {
      assert.fail(
        "recommendedForeground contrast < 4.5 for " + entry.name
          + " (recommended " + contrastRecommended.toFixed(2) + ", best " + best.toFixed(2) + ")"
      );
    }
    assert.match(
      String(entry.notes || ""),
      /use on dark surfaces only/i,
      "if neither foreground passes 4.5, notes must include usage warning for " + entry.name
    );
  });
});

test("theme palette v2 remains largely separable under color-blind simulation", () => {
  const colors = palette.colors || [];
  const baseRgb = colors.map((entry) => hexToRgb(entry.hex));
  const matrices = {
    protanopia: [
      [0.56667, 0.43333, 0.00000],
      [0.55833, 0.44167, 0.00000],
      [0.00000, 0.24167, 0.75833]
    ],
    deuteranopia: [
      [0.62500, 0.37500, 0.00000],
      [0.70000, 0.30000, 0.00000],
      [0.00000, 0.30000, 0.70000]
    ],
    tritanopia: [
      [0.95000, 0.05000, 0.00000],
      [0.00000, 0.43333, 0.56667],
      [0.00000, 0.47500, 0.52500]
    ]
  };
  Object.entries(matrices).forEach(([mode, matrix]) => {
    const labs = baseRgb
      .map((rgb) => simulateColorBlindness(rgb, matrix))
      .map((rgb) => rgbToLab(rgb));
    const ratio = pairwiseSeparationRatio(labs, 8);
    assert.ok(
      ratio >= 0.85,
      mode + " separability ratio must be >= 0.85, got " + ratio.toFixed(3)
    );
  });
});
