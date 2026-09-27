/**
 * Global Site & Business Configuration
 * Safe for use in both Server and Client Components.
 */

export const siteConfig = {
  name: "Vaultly",
  tagline: "Sell Digital Products Instantly",
  description:
    "Next-generation digital marketplace platform inspired by SellAuth & Billgang. Automated key delivery, crypto and card payments, and instant storefronts.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000",

  // Platform Business Rules
  business: {
    platformFeePercent: 5, // 5% fee on sales
    payoutHoldDays: 7, // 7-day security hold before balance is withdrawable
    minimumPayoutUsd: 10.0, // Minimum payout request amount
    defaultCurrency: "USD",
    maxShopsPerUser: 1, // Store limit per user
  },

  // Social & Community Links
  links: {
    twitter: "https://x.com/vaultly",
    discord: "https://discord.gg/vaultly",
    telegram: "https://t.me/vaultly",
    github: "https://github.com",
    supportEmail: "support@vaultly.com",
  },

  // Storefront Themes
  theme: {
    defaultAccent: "#6366f1",
    defaultBackground: "#0f0f0f",
    defaultFontStyle: "inter",
  },
};

export type SiteConfig = typeof siteConfig;
export const MAX_SHOPS_PER_USER = siteConfig.business.maxShopsPerUser;
