export type KeyDurationType =
  | "daily"
  | "weekly"
  | "monthly"
  | "3month"
  | "6month"
  | "year"
  | "lifetime"
  | "custom";

export interface KeyDurationMeta {
  id: KeyDurationType;
  label: string;
  shortLabel: string;
  days: number; // 0 = permanent/lifetime
  badgeColor: string;
  description: string;
}

export const DURATION_OPTIONS: KeyDurationMeta[] = [
  {
    id: "daily",
    label: "1 Day (Daily)",
    shortLabel: "Daily",
    days: 1,
    badgeColor: "#38bdf8",
    description: "Valid for 24 hours from activation",
  },
  {
    id: "weekly",
    label: "7 Days (Weekly)",
    shortLabel: "Weekly",
    days: 7,
    badgeColor: "#818cf8",
    description: "Valid for 7 days from activation",
  },
  {
    id: "monthly",
    label: "30 Days (Monthly)",
    shortLabel: "Monthly",
    days: 30,
    badgeColor: "#a855f7",
    description: "Valid for 30 days from activation",
  },
  {
    id: "3month",
    label: "3 Months (90 Days)",
    shortLabel: "3 Months",
    days: 90,
    badgeColor: "#ec4899",
    description: "Valid for 90 days from activation",
  },
  {
    id: "6month",
    label: "6 Months (180 Days)",
    shortLabel: "6 Months",
    days: 180,
    badgeColor: "#f97316",
    description: "Valid for 180 days from activation",
  },
  {
    id: "year",
    label: "1 Year (365 Days)",
    shortLabel: "1 Year",
    days: 365,
    badgeColor: "#eab308",
    description: "Valid for 365 days from activation",
  },
  {
    id: "lifetime",
    label: "Lifetime Access",
    shortLabel: "Lifetime",
    days: 0,
    badgeColor: "#10b981",
    description: "Permanent license, never expires",
  },
  {
    id: "custom",
    label: "Custom Period",
    shortLabel: "Custom",
    days: 0,
    badgeColor: "#06b6d4",
    description: "Custom duration set by merchant",
  },
];

export function getKeyDurationDisplay(
  type?: string | null,
  customDays?: number | null,
  customLabel?: string | null
): { label: string; shortLabel: string; days: number; badgeColor: string; isLifetime: boolean } {
  const norm = (type?.toLowerCase().trim() || "lifetime") as KeyDurationType;

  if (norm === "custom") {
    const days = typeof customDays === "number" && customDays > 0 ? customDays : 0;
    const label = customLabel?.trim() || (days > 0 ? `${days} Days Access` : "Custom Access");
    return {
      label,
      shortLabel: customLabel?.trim() || (days > 0 ? `${days}d` : "Custom"),
      days,
      badgeColor: "#06b6d4",
      isLifetime: days === 0 && !customLabel,
    };
  }

  const found = DURATION_OPTIONS.find((opt) => opt.id === norm) || DURATION_OPTIONS.find((o) => o.id === "lifetime")!;
  return {
    label: found.label,
    shortLabel: found.shortLabel,
    days: found.days,
    badgeColor: found.badgeColor,
    isLifetime: found.days === 0,
  };
}

export function calculateExpirationDate(
  startDate: Date | string | number = new Date(),
  duration?: string | null,
  customDays?: number | null
): Date | null {
  const norm = (duration?.toLowerCase().trim() || "lifetime") as KeyDurationType;
  if (norm === "lifetime") return null;

  let days = 0;
  if (norm === "custom") {
    days = typeof customDays === "number" && customDays > 0 ? customDays : 0;
  } else {
    const found = DURATION_OPTIONS.find((opt) => opt.id === norm);
    days = found ? found.days : 0;
  }

  if (days <= 0) return null;

  const start = new Date(startDate);
  const expiration = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  return expiration;
}

export function isKeyExpired(expiresAt: Date | string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

export function formatExpirationRemaining(expiresAt: Date | string | null | undefined): string {
  if (!expiresAt) return "Permanent (Never expires)";
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "License Expired";
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 1) return `Expires in ${days} days`;
  if (days === 1) return `Expires in 1 day, ${hours}h`;
  if (hours > 0) return `Expires in ${hours} hour${hours > 1 ? "s" : ""}`;
  const minutes = Math.max(1, Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000)));
  return `Expires in ${minutes} minute${minutes > 1 ? "s" : ""}`;
}

