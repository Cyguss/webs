import { parseDiscordInput } from "@/lib/social";

export interface WorkingHoursConfig {
  enabled: boolean;
  from: string;
  to: string;
  timezone: string;
  days: string;
}

export interface ParsedSupportDetails {
  email: string | null;
  discord: {
    value: string;
    type: "server" | "user";
    isUrl: boolean;
    href: string | null;
    handle: string | null;
    label: string;
    buttonText: string;
  } | null;
  telegram: {
    value: string;
    isUrl: boolean;
    href: string | null;
    handle: string | null;
  } | null;
  workingHours: {
    from: string;
    to: string;
    timezone: string;
    days: string;
    display: string;
  } | null;
  instructions: string | null;
  hasAnySupport: boolean;
}

export function parseMerchantSupport(shop?: {
  supportEmail?: string | null;
  discordUrl?: string | null;
  telegramUrl?: string | null;
  contactInfo?: string | null;
} | null): ParsedSupportDetails {
  if (!shop) {
    return {
      email: null,
      discord: null,
      telegram: null,
      workingHours: null,
      instructions: null,
      hasAnySupport: false,
    };
  }

  let email = shop.supportEmail?.trim() || null;
  let discordRaw = shop.discordUrl?.trim() || null;
  let telegramRaw = shop.telegramUrl?.trim() || null;
  let instructions: string | null = null;
  let workingHours: {
    from: string;
    to: string;
    timezone: string;
    days: string;
    display: string;
  } | null = null;

  const rawContact = shop.contactInfo?.trim() || "";

  if (rawContact) {
    if (rawContact.startsWith("{") && rawContact.endsWith("}")) {
      try {
        const parsed = JSON.parse(rawContact);
        // ONLY activate working hours if hoursEnabled is explicitly true
        if (parsed.hoursEnabled === true) {
          const from = parsed.hoursFrom?.trim() || "00:00";
          const to = parsed.hoursTo?.trim() || "24:00";
          const timezone = parsed.timezone?.trim() || "UTC";
          const days = parsed.days?.trim() || "Mon - Sun";
          const is247 = (from === "00:00" && to === "24:00") || parsed.is247;
          
          workingHours = {
            from,
            to,
            timezone,
            days,
            display: is247 ? `24/7 Support (${days})` : `${from} - ${to} ${timezone} • ${days}`,
          };
        }

        if (parsed.instructions?.trim()) {
          instructions = parsed.instructions.trim();
        }

        if (!email && parsed.email?.trim()) {
          email = parsed.email.trim();
        }
        if (!discordRaw && parsed.discord?.trim()) {
          discordRaw = parsed.discord.trim();
        }
        if (!telegramRaw && parsed.telegram?.trim()) {
          telegramRaw = parsed.telegram.trim();
        }
      } catch (e) {
        // Fall back to line parsing if JSON fails
      }
    }

    // Line-by-line fallback if not parsed JSON
    if (!instructions && !workingHours) {
      const lines = rawContact.split("\n");
      const unhandledLines: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (!discordRaw && /^discord\s*[:=]\s*(.+)$/i.test(trimmed)) {
          discordRaw = trimmed.replace(/^discord\s*[:=]\s*/i, "").trim();
        } else if (!telegramRaw && /^telegram\s*[:=]\s*(.+)$/i.test(trimmed)) {
          telegramRaw = trimmed.replace(/^telegram\s*[:=]\s*/i, "").trim();
        } else if (!email && /^(?:email|mail)\s*[:=]\s*(.+)$/i.test(trimmed)) {
          email = trimmed.replace(/^(?:email|mail)\s*[:=]\s*/i, "").trim();
        } else if (/^(?:hours|working hours|support hours)\s*[:=]\s*(.+)$/i.test(trimmed)) {
          const hoursText = trimmed.replace(/^(?:hours|working hours|support hours)\s*[:=]\s*/i, "").trim();
          workingHours = {
            from: "",
            to: "",
            timezone: "",
            days: "",
            display: hoursText,
          };
        } else {
          unhandledLines.push(trimmed);
        }
      }

      if (unhandledLines.length > 0) {
        instructions = unhandledLines.join("\n");
      }
    }
  }

  // Parse Discord format with server vs user detection
  let discord: ParsedSupportDetails["discord"] = null;
  if (discordRaw) {
    const parsedDiscord = parseDiscordInput(discordRaw);
    discord = {
      value: discordRaw,
      type: parsedDiscord.type,
      isUrl: parsedDiscord.isUrl,
      href: parsedDiscord.href,
      handle: parsedDiscord.handle,
      label: parsedDiscord.label,
      buttonText: parsedDiscord.buttonText,
    };
  }

  // Parse Telegram format
  let telegram: ParsedSupportDetails["telegram"] = null;
  if (telegramRaw) {
    const isUrl = telegramRaw.startsWith("http://") || telegramRaw.startsWith("https://") || telegramRaw.startsWith("t.me/");
    const cleanHandle = telegramRaw.replace(/^https?:\/\/t\.me\//i, "").replace(/^t\.me\//i, "").replace(/^@/, "");
    const href = isUrl
      ? (telegramRaw.startsWith("t.me/") ? `https://${telegramRaw}` : telegramRaw)
      : cleanHandle ? `https://t.me/${cleanHandle}` : null;
    telegram = {
      value: telegramRaw,
      isUrl,
      href,
      handle: cleanHandle ? `@${cleanHandle}` : telegramRaw,
    };
  }

  const hasAnySupport = Boolean(
    email ||
    discord ||
    telegram ||
    workingHours ||
    (instructions && instructions.trim().length > 0)
  );

  return {
    email,
    discord,
    telegram,
    workingHours,
    instructions,
    hasAnySupport,
  };
}
