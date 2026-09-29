/**
 * Global Site & Business Configuration
 * Safe for use in both Server and Client Components.
 */

export const siteConfig = {
  name: "KRYPT MARKET",
  tagline: "Automated Black Market & Digital Key Protocol",
  description:
    "Next-generation digital marketplace protocol. Automated key delivery, crypto and card payments, and encrypted merchant storefronts.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000",

  // Platform Business Rules
  business: {
    platformFeePercent: 5, // 5% fee on sales
    payoutHoldDays: 14, // 14-day security hold before balance is withdrawable
    minimumPayoutUsd: 10.0, // Minimum payout request amount
    defaultCurrency: "USD",
    maxShopsPerUser: 1, // Store limit per user
  },

  // Social & Community Links
  links: {
    twitter: "https://x.com/kryptmarket",
    discord: "https://discord.gg/krypt",
    telegram: "https://t.me/kryptmarket",
    github: "https://github.com",
    supportEmail: "support@krypt.market",
  },

  // Storefront Themes
  theme: {
    defaultAccent: "rgb(55, 44, 102)",
    defaultBackground: "#030305",
    defaultFontStyle: "jetbrains",
  },
};

export type SiteConfig = typeof siteConfig;
export const MAX_SHOPS_PER_USER = siteConfig.business.maxShopsPerUser;
