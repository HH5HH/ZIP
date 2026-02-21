(function (root, factory) {
  const payload = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = payload;
  }
  if (root && typeof root === "object") {
    root.ZIP_THEME_PALETTE_V2 = payload;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const colors = [
    { id: "azure-blue", name: "Azure Blue", hex: "#0078D4", spectrumToken: "spectrum-blue-600", recommendedForeground: "#ffffff", notes: "Primary accent; good for links/CTAs" },
    { id: "indigo", name: "Indigo", hex: "#4338CA", spectrumToken: "spectrum-indigo-600", recommendedForeground: "#ffffff", notes: "Strong accent; headings/badges" },
    { id: "violet", name: "Violet", hex: "#8A3FFC", spectrumToken: "spectrum-purple-600", recommendedForeground: "#ffffff", notes: "Creative accent" },
    { id: "fuchsia", name: "Fuchsia", hex: "#EB3FA9", spectrumToken: "spectrum-magenta-500", recommendedForeground: "#111111", notes: "Bright accent; use with dark text on light surfaces" },
    { id: "magenta", name: "Magenta", hex: "#C2185B", spectrumToken: "spectrum-magenta-600", recommendedForeground: "#ffffff", notes: "CTA variant" },
    { id: "petrus-red", name: "P\u00e9trus Red", hex: "#8B0000", spectrumToken: "spectrum-red-900", recommendedForeground: "#ffffff", notes: "Executive special - deep wine red" },
    { id: "carmine", name: "Carmine", hex: "#D4433A", spectrumToken: "spectrum-red-600", recommendedForeground: "#ffffff", notes: "Error/destructive accent" },
    { id: "pumpkin", name: "Pumpkin", hex: "#D6702A", spectrumToken: "spectrum-orange-600", recommendedForeground: "#111111", notes: "Warm accent; prefer dark foreground" },
    { id: "amber", name: "Amber", hex: "#C68500", spectrumToken: "spectrum-yellow-700", recommendedForeground: "#111111", notes: "Use on dark panels; not for white labels on light" },
    { id: "sunflower", name: "Sunflower", hex: "#FFC20E", spectrumToken: "spectrum-yellow-400", recommendedForeground: "#111111", notes: "Icon/badge on dark only" },
    { id: "chartreuse", name: "Chartreuse", hex: "#8DB600", spectrumToken: "spectrum-chartreuse-600", recommendedForeground: "#111111", notes: "Status/alert on dark surfaces" },
    { id: "emerald", name: "Emerald", hex: "#009B77", spectrumToken: "spectrum-green-600", recommendedForeground: "#111111", notes: "Success accent" },
    { id: "teal", name: "Teal", hex: "#007B7F", spectrumToken: "spectrum-teal-600", recommendedForeground: "#ffffff", notes: "Stable accent" },
    { id: "turquoise", name: "Turquoise", hex: "#00B7C4", spectrumToken: "spectrum-teal-500", recommendedForeground: "#111111", notes: "Secondary accent" },
    { id: "cyan", name: "Cyan", hex: "#00A3E0", spectrumToken: "spectrum-cyan-600", recommendedForeground: "#111111", notes: "Bright accent for dark UI" },
    { id: "cinnamon", name: "Cinnamon", hex: "#B66A50", spectrumToken: "spectrum-orange-800", recommendedForeground: "#111111", notes: "Earthy accent" },
    { id: "bronze", name: "Bronze", hex: "#8C6A3A", spectrumToken: "spectrum-brown-600", recommendedForeground: "#ffffff", notes: "Warm neutral accent" },
    { id: "silver", name: "Silver", hex: "#9EA3A8", spectrumToken: "spectrum-gray-400", recommendedForeground: "#111111", notes: "Neutral/border/disabled" },
    { id: "slate-gray", name: "Slate Gray", hex: "#6B7280", spectrumToken: "spectrum-gray-600", recommendedForeground: "#ffffff", notes: "Secondary UI neutral" },
    { id: "charcoal", name: "Charcoal", hex: "#222222", spectrumToken: "spectrum-gray-900", recommendedForeground: "#ffffff", notes: "Dark neutral / used for dark surfaces" }
  ];

  const groups = [
    { id: "blues-purples", name: "Blues & Purples", colorIds: ["azure-blue", "indigo", "violet"] },
    { id: "pinks-magentas", name: "Pinks & Magentas", colorIds: ["fuchsia", "magenta"] },
    { id: "reds", name: "Reds", colorIds: ["petrus-red", "carmine"] },
    { id: "oranges-ambers", name: "Oranges & Ambers", colorIds: ["pumpkin", "amber", "sunflower"] },
    { id: "greens", name: "Greens", colorIds: ["chartreuse", "emerald", "teal", "turquoise", "cyan"] },
    { id: "earth-tones", name: "Earth Tones", colorIds: ["cinnamon", "bronze"] },
    { id: "neutrals", name: "Neutrals", colorIds: ["silver", "slate-gray", "charcoal"] }
  ];

  const legacyAccentMap = {
    blue: "azure-blue",
    indigo: "indigo",
    purple: "violet",
    fuchsia: "fuchsia",
    magenta: "magenta",
    pink: "fuchsia",
    red: "carmine",
    orange: "pumpkin",
    yellow: "amber",
    chartreuse: "chartreuse",
    celery: "emerald",
    green: "emerald",
    seafoam: "turquoise",
    cyan: "cyan",
    turquoise: "teal",
    cinnamon: "cinnamon",
    brown: "bronze",
    silver: "silver",
    gray: "slate-gray"
  };

  return {
    version: "v2",
    defaultAccentId: "azure-blue",
    defaultThemeId: "s2-dark-azure-blue",
    colors,
    groups,
    legacyAccentMap
  };
});
