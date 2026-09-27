import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(typeof amount === "string" ? parseFloat(amount) : amount);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function generateId() {
  return crypto.randomUUID();
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculatePlatformFee(amount: number): {
  feeAmount: number;
  amountSent: number;
} {
  const feePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || "5") / 100;
  const feeAmount = parseFloat((amount * feePercent).toFixed(2));
  const amountSent = parseFloat((amount - feeAmount).toFixed(2));
  return { feeAmount, amountSent };
}

export function getHoldReleaseDate(): Date {
  const days = parseInt(process.env.PAYOUT_HOLD_DAYS || "14");
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
