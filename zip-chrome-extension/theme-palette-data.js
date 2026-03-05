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
    {
      id: "porcelain",
      name: "Porcelain",
      lightThemeName: "Porcelain",
      darkThemeName: "Porcelain",
      hex: "#F7F5EE",
      spectrumToken: "spectrum-gray-50",
      recommendedForeground: "#111111",
      notes: "Soft white anchor that starts the light-to-dark crawl."
    },
    {
      id: "cardinal",
      name: "Cardinal",
      lightThemeName: "Cardinal",
      darkThemeName: "Cardinal",
      hex: "#D7263D",
      spectrumToken: "spectrum-red-700",
      recommendedForeground: "#ffffff",
      notes: "Punchy red with strong contrast and clear urgency."
    },
    {
      id: "razzmatazz",
      name: "Razzmatazz",
      lightThemeName: "Razzmatazz",
      darkThemeName: "Razzmatazz",
      hex: "#AD1457",
      spectrumToken: "spectrum-fuchsia-800",
      recommendedForeground: "#ffffff",
      notes: "Distinct magenta-rose that avoids blending with adjacent reds."
    },
    {
      id: "tangelo",
      name: "Tangelo",
      lightThemeName: "Tangelo",
      darkThemeName: "Tangelo",
      hex: "#FF6F00",
      spectrumToken: "spectrum-orange-600",
      recommendedForeground: "#111111",
      notes: "Vivid orange that reads cleanly in both light and dark variants."
    },
    {
      id: "amber",
      name: "Amber",
      lightThemeName: "Amber",
      darkThemeName: "Amber",
      hex: "#FFB300",
      spectrumToken: "spectrum-orange-500",
      recommendedForeground: "#111111",
      notes: "Bold golden-orange with high warmth and visibility."
    },
    {
      id: "aureolin",
      name: "Aureolin",
      lightThemeName: "Aureolin",
      darkThemeName: "Aureolin",
      hex: "#FDEE00",
      spectrumToken: "spectrum-yellow-300",
      recommendedForeground: "#111111",
      notes: "High-key yellow that stays readable and unmistakable."
    },
    {
      id: "chartreuse",
      name: "Chartreuse",
      lightThemeName: "Chartreuse",
      darkThemeName: "Chartreuse",
      hex: "#7FFF00",
      spectrumToken: "spectrum-chartreuse-400",
      recommendedForeground: "#111111",
      notes: "Electric lime-green with unmistakable energy."
    },
    {
      id: "kelly-green",
      name: "Kelly Green",
      lightThemeName: "Kelly Green",
      darkThemeName: "Kelly Green",
      hex: "#3FAE2A",
      spectrumToken: "spectrum-green-700",
      recommendedForeground: "#111111",
      notes: "Saturated true green tuned to separate from chartreuse and jade."
    },
    {
      id: "jade",
      name: "Jade",
      lightThemeName: "Jade",
      darkThemeName: "Jade",
      hex: "#007A55",
      spectrumToken: "spectrum-green-800",
      recommendedForeground: "#ffffff",
      notes: "Deep gemstone green for a grounded but vivid midpoint."
    },
    {
      id: "teal",
      name: "Teal",
      lightThemeName: "Teal",
      darkThemeName: "Teal",
      hex: "#008B8B",
      spectrumToken: "spectrum-cyan-800",
      recommendedForeground: "#111111",
      notes: "Balanced blue-green with crisp identity against jade and turquoise."
    },
    {
      id: "turquoise",
      name: "Turquoise",
      lightThemeName: "Turquoise",
      darkThemeName: "Turquoise",
      hex: "#00C7BE",
      spectrumToken: "spectrum-cyan-500",
      recommendedForeground: "#111111",
      notes: "Bright aquatic cyan-green with excellent visual pop."
    },
    {
      id: "capri",
      name: "Capri",
      lightThemeName: "Capri",
      darkThemeName: "Capri",
      hex: "#00A3E0",
      spectrumToken: "spectrum-cyan-600",
      recommendedForeground: "#111111",
      notes: "Cool neon-leaning cyan with strong digital character."
    },
    {
      id: "cerulean",
      name: "Cerulean",
      lightThemeName: "Cerulean",
      darkThemeName: "Cerulean",
      hex: "#006E90",
      spectrumToken: "spectrum-blue-700",
      recommendedForeground: "#ffffff",
      notes: "Clean blue with professional readability and strong depth."
    },
    {
      id: "zaffre",
      name: "Zaffre",
      lightThemeName: "Zaffre",
      darkThemeName: "Zaffre",
      hex: "#0047AB",
      spectrumToken: "spectrum-blue-900",
      recommendedForeground: "#ffffff",
      notes: "Deep cobalt-style blue with high contrast and clear separation."
    },
    {
      id: "indigo",
      name: "Indigo",
      lightThemeName: "Indigo",
      darkThemeName: "Indigo",
      hex: "#4B0082",
      spectrumToken: "spectrum-indigo-900",
      recommendedForeground: "#ffffff",
      notes: "Classic dark indigo tuned for immersive dark variants."
    },
    {
      id: "electric-violet",
      name: "Electric Violet",
      lightThemeName: "Electric Violet",
      darkThemeName: "Electric Violet",
      hex: "#8F00FF",
      spectrumToken: "spectrum-purple-700",
      recommendedForeground: "#ffffff",
      notes: "High-energy violet that stays distinct from indigo and fuchsia."
    },
    {
      id: "fuchsia",
      name: "Fuchsia",
      lightThemeName: "Fuchsia",
      darkThemeName: "Fuchsia",
      hex: "#FF00A8",
      spectrumToken: "spectrum-fuchsia-600",
      recommendedForeground: "#111111",
      notes: "Neon magenta endpoint for the violet/pink edge of the spectrum."
    },
    {
      id: "burnt-sienna",
      name: "Burnt Sienna",
      lightThemeName: "Burnt Sienna",
      darkThemeName: "Burnt Sienna",
      hex: "#8B4513",
      spectrumToken: "spectrum-brown-700",
      recommendedForeground: "#ffffff",
      notes: "Earthy brown-orange accent that adds warm depth without overlap."
    },
    {
      id: "payne-gray",
      name: "Payne Gray",
      lightThemeName: "Payne Gray",
      darkThemeName: "Payne Gray",
      hex: "#5C677D",
      spectrumToken: "spectrum-gray-700",
      recommendedForeground: "#ffffff",
      notes: "Cool storm gray that bridges chroma themes to the dark anchor."
    },
    {
      id: "obsidian",
      name: "Obsidian",
      lightThemeName: "Obsidian",
      darkThemeName: "Obsidian",
      hex: "#0B0B0B",
      spectrumToken: "spectrum-gray-900",
      recommendedForeground: "#ffffff",
      notes: "True near-black anchor that cleanly closes the spectrum crawl."
    }
  ];

  const groups = [
    {
      id: "roygbiv-a",
      name: "ROYGBIV A",
      colorIds: ["porcelain", "cardinal", "razzmatazz", "tangelo"]
    },
    {
      id: "roygbiv-b",
      name: "ROYGBIV B",
      colorIds: ["amber", "aureolin", "chartreuse", "kelly-green"]
    },
    {
      id: "roygbiv-c",
      name: "ROYGBIV C",
      colorIds: ["jade", "teal", "turquoise", "capri"]
    },
    {
      id: "roygbiv-d",
      name: "ROYGBIV D",
      colorIds: ["cerulean", "zaffre", "indigo", "electric-violet"]
    },
    {
      id: "roygbiv-e",
      name: "ROYGBIV E",
      colorIds: ["fuchsia", "burnt-sienna", "payne-gray", "obsidian"]
    }
  ];

  const legacyAccentMap = {
    blue: "cerulean",
    azure: "capri",
    "azure-blue": "capri",
    cornflower: "capri",
    cerulean: "cerulean",
    indigo: "indigo",
    "midnight-blue": "payne-gray",
    violet: "electric-violet",
    wisteria: "electric-violet",
    purple: "indigo",
    "vivid-violet": "electric-violet",
    "royal-purple": "indigo",
    pink: "fuchsia",
    "wild-strawberry": "fuchsia",
    bubblegum: "fuchsia",
    heliotrope: "electric-violet",
    dewberry: "indigo",
    fuchsia: "fuchsia",
    magenta: "fuchsia",
    "razzle-dazzle": "razzmatazz",
    red: "cardinal",
    "barn-red": "cardinal",
    rouge: "cardinal",
    wine: "razzmatazz",
    "petrus-red": "cardinal",
    carmine: "cardinal",
    scarlet: "cardinal",
    orange: "tangelo",
    "orioles-orange": "tangelo",
    "sunset-orange": "tangelo",
    pumpkin: "tangelo",
    "macaroni-and-cheese": "amber",
    yellow: "aureolin",
    "canary-yellow": "aureolin",
    goldenrod: "amber",
    "lemon-chiffon": "porcelain",
    dandelion: "aureolin",
    chartreuse: "chartreuse",
    "electric-lime": "chartreuse",
    celery: "kelly-green",
    "granny-smith": "kelly-green",
    green: "kelly-green",
    "kelly-green": "kelly-green",
    shamrock: "jade",
    "forest-green": "jade",
    emerald: "jade",
    seafoam: "turquoise",
    cyan: "capri",
    aqua: "capri",
    "robins-egg-blue": "turquoise",
    turquoise: "turquoise",
    teal: "teal",
    cinnamon: "burnt-sienna",
    sienna: "burnt-sienna",
    "burnt-sienna": "burnt-sienna",
    bronze: "burnt-sienna",
    brown: "burnt-sienna",
    redwood: "cardinal",
    salmon: "razzmatazz",
    blush: "fuchsia",
    pistachio: "kelly-green",
    "carrot-orange": "tangelo",
    "powder-blue": "capri",
    silver: "payne-gray",
    "davy's-gray": "payne-gray",
    "davys-gray": "payne-gray",
    "ash-gray": "payne-gray",
    steel: "payne-gray",
    almond: "porcelain",
    "slate-gray": "payne-gray",
    gray: "payne-gray",
    arsenic: "obsidian",
    charcoal: "obsidian",
    obsidian: "obsidian"
  };

  return {
    version: "v2",
    defaultAccentId: "cerulean",
    defaultThemeId: "s2-dark-cerulean",
    colors,
    groups,
    legacyAccentMap
  };
});
