import { z } from "zod";

export const updateStorefrontSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters").optional(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug cannot exceed 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  backgroundColor: z.string().max(30).optional().nullable(),
  accentColor: z.string().max(30).optional().nullable(),
  textColor: z.string().max(30).optional().nullable(),
  mutedTextColor: z.string().max(30).optional().nullable(),
  cardColor: z.string().max(30).optional().nullable(),
  borderColor: z.string().max(30).optional().nullable(),
  themeMode: z.enum(["dark", "light"]).optional(),
  fontStyle: z.string().max(50).optional().nullable(),
  customFontUrl: z
    .string()
    .refine((val) => !val || /^https:\/\/[^\s$.?#].[^\s]*$/i.test(val.trim()), {
      message: "Custom font URL must be a valid public HTTPS link (e.g. Google Fonts or CDN)",
    })
    .optional()
    .nullable(),
  twitterUrl: z
    .string()
    .refine((val) => !val || !val.trim() || /^https?:\/\//i.test(val.trim()) || /^@?[a-zA-Z0-9_]+$/.test(val.trim()), {
      message: "Twitter URL must be a valid web link or handle",
    })
    .optional()
    .nullable(),
  discordUrl: z
    .string()
    .max(500)
    .optional()
    .nullable(),
  youtubeUrl: z
    .string()
    .refine((val) => !val || !val.trim() || /^https?:\/\//i.test(val.trim()) || /^@?[a-zA-Z0-9_.-]+$/.test(val.trim()), {
      message: "YouTube URL must be a valid web link or channel handle",
    })
    .optional()
    .nullable(),
  trustpilotUrl: z
    .string()
    .max(500)
    .optional()
    .nullable(),
  telegramUrl: z
    .string()
    .max(500)
    .optional()
    .nullable(),
  discordWebhookUrl: z
    .string()
    .refine((val) => !val || !val.trim() || /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/i.test(val.trim()), {
      message: "Discord webhook URL must be a genuine discord.com HTTPS webhook endpoint",
    })
    .optional()
    .nullable(),
  metaTitle: z.string().max(100, "Meta title too long").optional().nullable(),
  metaDescription: z.string().max(250, "Meta description too long").optional().nullable(),
  customDomain: z.string().max(100, "Custom domain too long").optional().nullable(),
  supportEmail: z.string().max(255).optional().nullable(),
  contactInfo: z.string().max(3000).optional().nullable(),
  termsOfService: z.string().max(20000).optional().nullable(),
});

export type UpdateStorefrontInput = z.infer<typeof updateStorefrontSchema>;
