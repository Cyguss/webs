import { z } from "zod";

export const updateStorefrontSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters").optional(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug cannot exceed 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional().nullable(),
  logoUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  bannerUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  backgroundColor: z.string().max(30).optional().nullable(),
  accentColor: z.string().max(30).optional().nullable(),
  textColor: z.string().max(30).optional().nullable(),
  mutedTextColor: z.string().max(30).optional().nullable(),
  cardColor: z.string().max(30).optional().nullable(),
  borderColor: z.string().max(30).optional().nullable(),
  themeMode: z.enum(["dark", "light"]).optional(),
  fontStyle: z.string().max(50).optional().nullable(),
  customFontUrl: z.string().url("Invalid font URL").optional().nullable().or(z.literal("")),
  twitterUrl: z.string().url("Invalid Twitter URL").optional().nullable().or(z.literal("")),
  discordUrl: z.string().url("Invalid Discord URL").optional().nullable().or(z.literal("")),
  youtubeUrl: z.string().url("Invalid YouTube URL").optional().nullable().or(z.literal("")),
  trustpilotUrl: z.string().url("Invalid Trustpilot URL").optional().nullable().or(z.literal("")),
  telegramUrl: z.string().url("Invalid Telegram URL").optional().nullable().or(z.literal("")),
  discordWebhookUrl: z.string().url("Invalid Discord Webhook URL").optional().nullable().or(z.literal("")),
  metaTitle: z.string().max(100, "Meta title too long").optional().nullable(),
  metaDescription: z.string().max(250, "Meta description too long").optional().nullable(),
  customDomain: z.string().max(100, "Custom domain too long").optional().nullable(),
});

export type UpdateStorefrontInput = z.infer<typeof updateStorefrontSchema>;
