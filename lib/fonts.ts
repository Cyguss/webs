export interface StorefrontFontOption {
  value: string;
  label: string;
  family: string;
  googleQuery: string;
  category: string;
  sampleText?: string;
}

export const STOREFRONT_FONT_OPTIONS: StorefrontFontOption[] = [
  {
    value: "inter",
    label: "Inter",
    category: "Modern Clean",
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    googleQuery: "family=Inter:wght@400;500;600;700;800;900",
    sampleText: "Aa Bb Gg 123 • $49.99 Instant Key",
  },
  {
    value: "outfit",
    label: "Outfit",
    category: "Geometric & Tech",
    family: "'Outfit', -apple-system, sans-serif",
    googleQuery: "family=Outfit:wght@400;500;600;700;800;900",
    sampleText: "Aa Bb Gg 123 • $49.99 Instant Key",
  },
  {
    value: "space-grotesk",
    label: "Space Grotesk",
    category: "Cyber Tactical",
    family: "'Space Grotesk', -apple-system, sans-serif",
    googleQuery: "family=Space+Grotesk:wght@400;500;600;700",
    sampleText: "Aa Bb Gg 123 • $49.99 Instant Key",
  },
  {
    value: "plus-jakarta",
    label: "Plus Jakarta Sans",
    category: "Sleek UI",
    family: "'Plus Jakarta Sans', -apple-system, sans-serif",
    googleQuery: "family=Plus+Jakarta+Sans:wght@400;500;600;700;800",
    sampleText: "Aa Bb Gg 123 • $49.99 Instant Key",
  },
  {
    value: "dm-sans",
    label: "DM Sans",
    category: "Minimalist Clean",
    family: "'DM Sans', -apple-system, sans-serif",
    googleQuery: "family=DM+Sans:wght@400;500;700;800",
    sampleText: "Aa Bb Gg 123 • $49.99 Instant Key",
  },
  {
    value: "orbitron",
    label: "Orbitron",
    category: "Futuristic Cyber HUD",
    family: "'Orbitron', -apple-system, sans-serif",
    googleQuery: "family=Orbitron:wght@400;600;800;900",
    sampleText: "Aa Bb Gg 123 • $49.99 Instant Key",
  },
  {
    value: "rajdhani",
    label: "Rajdhani",
    category: "Military Cyberpunk",
    family: "'Rajdhani', -apple-system, sans-serif",
    googleQuery: "family=Rajdhani:wght@500;600;700",
    sampleText: "Aa Bb Gg 123 • $49.99 Instant Key",
  },
  {
    value: "syne",
    label: "Syne",
    category: "Avant-Garde Luxury",
    family: "'Syne', -apple-system, sans-serif",
    googleQuery: "family=Syne:wght@500;700;800",
    sampleText: "Aa Bb Gg 123 • $49.99 Instant Key",
  },
  {
    value: "jetbrains-mono",
    label: "JetBrains Mono",
    category: "Hacker Terminal",
    family: "'JetBrains Mono', 'SF Mono', monospace",
    googleQuery: "family=JetBrains+Mono:wght@400;600;700",
    sampleText: "Aa Bb Gg 123 • $49.99 Instant Key",
  },
  {
    value: "poppins",
    label: "Poppins",
    category: "Rounded & Impact",
    family: "'Poppins', -apple-system, sans-serif",
    googleQuery: "family=Poppins:wght@400;600;700;800",
    sampleText: "Aa Bb Gg 123 • $49.99 Instant Key",
  },
];

export const ALL_PRESET_FONTS_STYLESHEET = `https://fonts.googleapis.com/css2?${STOREFRONT_FONT_OPTIONS.map(
  (f) => f.googleQuery
).join("&")}&display=swap`;

export interface ResolvedStorefrontFont {
  fontFamily: string;
  stylesheetUrl: string | null;
  fontName: string;
  isCustom: boolean;
}

/**
 * Extracts a CSS font-family name from a Google Fonts URL or webfont URL
 */
export function extractFontFamilyFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const clean = url.trim();

  // Match Google Fonts family param: e.g. family=Cinzel:wght@... or family=Playfair+Display
  const match = clean.match(/[?&]family=([^:&]+)/i);
  if (match && match[1]) {
    const rawName = decodeURIComponent(match[1].replace(/\+/g, " "));
    return `'${rawName}', sans-serif`;
  }

  // Generic fallback if url contains font name before .css or in path
  const nameMatch = clean.match(/\/([a-zA-Z0-9_-]+)\.css/i);
  if (nameMatch && nameMatch[1]) {
    const name = nameMatch[1].replace(/-/g, " ");
    return `'${name}', sans-serif`;
  }

  return null;
}

/**
 * Resolves font-family and stylesheet URL for storefronts and live editor preview
 */
export function resolveStorefrontFont(
  fontStyle?: string | null,
  customFontUrl?: string | null
): ResolvedStorefrontFont {
  // 1. Custom Font URL has top priority
  if (customFontUrl && customFontUrl.trim().length > 0) {
    const cleanUrl = customFontUrl.trim();
    const extractedFamily = extractFontFamilyFromUrl(cleanUrl);
    const family = extractedFamily || "'CustomFont', sans-serif";
    const name = extractedFamily ? extractedFamily.replace(/['",]|sans-serif/g, "").trim() : "Custom Font";

    return {
      fontFamily: family,
      stylesheetUrl: cleanUrl,
      fontName: name,
      isCustom: true,
    };
  }

  // 2. Preset Font Option
  const cleanKey = (fontStyle || "inter").toLowerCase().trim();
  const preset =
    STOREFRONT_FONT_OPTIONS.find((f) => f.value === cleanKey) ||
    STOREFRONT_FONT_OPTIONS[0]; // defaults to Inter

  return {
    fontFamily: preset.family,
    stylesheetUrl: `https://fonts.googleapis.com/css2?${preset.googleQuery}&display=swap`,
    fontName: preset.label.split(" ")[0],
    isCustom: false,
  };
}
