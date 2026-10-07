import { db } from "@/lib/db";
import { platformSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface PlatformConfig {
  allow_store_creation: boolean;
  allow_user_registration: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  platform_fee_percent: number;
  enable_crypto_payments: boolean;
  enable_stripe_payments: boolean;
  nowpayments_sandbox_mode: boolean;
  cryptomus_sandbox_mode?: boolean;
  announcement_banner_active: boolean;
  announcement_banner_text: string;
  announcement_banner_type: "info" | "warning" | "alert" | "promo";
  announcement_banner_target: "all" | "platform" | "home" | "dashboard" | "storefronts";
  announcement_banner_link_url: string;
  announcement_banner_link_text: string;
  announcement_banner_dismissible: boolean;
  block_all_admins: boolean;
  max_shops_per_user: number;
  payout_hold_days: number;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  allow_store_creation: true,
  allow_user_registration: true,
  maintenance_mode: false,
  maintenance_message: "KRYPT protocol is undergoing node upgrades. Services will resume shortly.",
  platform_fee_percent: 5.0,
  enable_crypto_payments: true,
  enable_stripe_payments: true,
  nowpayments_sandbox_mode: true,
  cryptomus_sandbox_mode: true,
  announcement_banner_active: false,
  announcement_banner_text: "",
  announcement_banner_type: "info",
  announcement_banner_target: "all",
  announcement_banner_link_url: "",
  announcement_banner_link_text: "",
  announcement_banner_dismissible: true,
  block_all_admins: false,
  max_shops_per_user: 10,
  payout_hold_days: 14,
};

export async function getPlatformSettingsMap(): Promise<Record<string, string>> {
  try {
    const rows = await db.query.platformSettings.findMany();
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.settingKey] = row.settingValue;
    }
    return map;
  } catch (err) {
    console.error("[Platform Settings] Failed to load settings from db:", err);
    return {};
  }
}

export async function getPlatformConfig(): Promise<PlatformConfig> {
  const map = await getPlatformSettingsMap();

  return {
    allow_store_creation: map.allow_store_creation !== undefined ? map.allow_store_creation === "true" : DEFAULT_PLATFORM_CONFIG.allow_store_creation,
    allow_user_registration: map.allow_user_registration !== undefined ? map.allow_user_registration === "true" : DEFAULT_PLATFORM_CONFIG.allow_user_registration,
    maintenance_mode: map.maintenance_mode !== undefined ? map.maintenance_mode === "true" : DEFAULT_PLATFORM_CONFIG.maintenance_mode,
    maintenance_message: map.maintenance_message || DEFAULT_PLATFORM_CONFIG.maintenance_message,
    platform_fee_percent: map.platform_fee_percent !== undefined ? parseFloat(map.platform_fee_percent) || 5.0 : DEFAULT_PLATFORM_CONFIG.platform_fee_percent,
    enable_crypto_payments: map.enable_crypto_payments !== undefined ? map.enable_crypto_payments === "true" : DEFAULT_PLATFORM_CONFIG.enable_crypto_payments,
    enable_stripe_payments: map.enable_stripe_payments !== undefined ? map.enable_stripe_payments === "true" : DEFAULT_PLATFORM_CONFIG.enable_stripe_payments,
    nowpayments_sandbox_mode:
      map.nowpayments_sandbox_mode !== undefined
        ? map.nowpayments_sandbox_mode === "true"
        : map.cryptomus_sandbox_mode !== undefined
        ? map.cryptomus_sandbox_mode === "true"
        : DEFAULT_PLATFORM_CONFIG.nowpayments_sandbox_mode,
    cryptomus_sandbox_mode:
      map.nowpayments_sandbox_mode !== undefined
        ? map.nowpayments_sandbox_mode === "true"
        : map.cryptomus_sandbox_mode !== undefined
        ? map.cryptomus_sandbox_mode === "true"
        : true,
    announcement_banner_active: map.announcement_banner_active === "true",
    announcement_banner_text: map.announcement_banner_text || "",
    announcement_banner_type: (map.announcement_banner_type as any) || "info",
    announcement_banner_target: (map.announcement_banner_target as any) || "all",
    announcement_banner_link_url: map.announcement_banner_link_url || "",
    announcement_banner_link_text: map.announcement_banner_link_text || "",
    announcement_banner_dismissible: map.announcement_banner_dismissible !== undefined ? map.announcement_banner_dismissible === "true" : true,
    block_all_admins: map.block_all_admins === "true",
    max_shops_per_user: map.max_shops_per_user ? parseInt(map.max_shops_per_user, 10) || 10 : 10,
    payout_hold_days: map.payout_hold_days !== undefined ? parseInt(map.payout_hold_days, 10) || 14 : DEFAULT_PLATFORM_CONFIG.payout_hold_days,
  };
}

export async function getPlatformSetting(key: string, fallback: string = ""): Promise<string> {
  try {
    const row = await db.query.platformSettings.findFirst({
      where: eq(platformSettings.settingKey, key),
    });
    return row ? row.settingValue : fallback;
  } catch (err) {
    console.error(`[Platform Settings] Failed to get setting ${key}:`, err);
    return fallback;
  }
}

export async function setPlatformSetting(key: string, value: string): Promise<void> {
  try {
    const existing = await db.query.platformSettings.findFirst({
      where: eq(platformSettings.settingKey, key),
    });

    if (existing) {
      await db
        .update(platformSettings)
        .set({ settingValue: value, updatedAt: new Date() })
        .where(eq(platformSettings.settingKey, key));
    } else {
      await db.insert(platformSettings).values({
        settingKey: key,
        settingValue: value,
      });
    }
  } catch (err) {
    console.error(`[Platform Settings] Failed to set setting ${key}:`, err);
    throw err;
  }
}

export async function isStoreCreationAllowed(): Promise<boolean> {
  const val = await getPlatformSetting("allow_store_creation", "true");
  return val === "true";
}

export async function isRegistrationAllowed(): Promise<boolean> {
  const val = await getPlatformSetting("allow_user_registration", "true");
  return val === "true";
}

export async function getPlatformFeePercent(): Promise<number> {
  const val = await getPlatformSetting("platform_fee_percent", "5");
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 5.0 : Math.max(0, Math.min(100, parsed));
}

export async function getPayoutHoldDays(): Promise<number> {
  const envVal = process.env.PAYOUT_HOLD_DAYS;
  const fallback = envVal ? parseInt(envVal, 10) : 14;
  const val = await getPlatformSetting("payout_hold_days", String(isNaN(fallback) ? 14 : fallback));
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 14 : Math.max(0, parsed);
}

export async function isPlatformInMaintenance(): Promise<{ inMaintenance: boolean; message: string }> {
  const config = await getPlatformConfig();
  return {
    inMaintenance: config.maintenance_mode,
    message: config.maintenance_message,
  };
}

