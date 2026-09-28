import { z } from "zod";
 
export const productVariantSchema = z.object({
  id: z.string(),
  label: z.string(),
  duration: z.string(),
  durationDays: z.coerce.number().default(0),
  price: z.coerce.number().positive("Variant price must be greater than 0"),
  customDurationLabel: z.string().optional().nullable(),
});

export const keyItemSchema = z.object({
  keyValue: z.string().min(1),
  duration: z.string().default("lifetime"),
  durationDays: z.coerce.number().default(0),
  variantId: z.string().optional().nullable(),
});

export const createProductSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title is too long"),
  description: z.string().max(2000, "Description is too long").optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  currency: z.string().min(1).max(10).default("USD"),
  keys: z.array(z.string()).optional(),
  structuredKeys: z.array(keyItemSchema).optional(),
  categorizedKeys: z.record(z.string(), z.array(z.string())).optional(),
  thumbnailUrl: z.string().url("Invalid image URL").optional().nullable().or(z.literal("")),
  images: z.array(z.string()).max(5, "Maximum 5 images allowed").optional(),
  receiptNote: z.string().max(2000, "Receipt note is too long").optional().nullable().or(z.literal("")),
  duration: z.enum(["daily", "weekly", "monthly", "3month", "6month", "year", "lifetime", "custom"]).default("lifetime").optional(),
  durationDays: z.coerce.number().int().min(0).max(36500).default(0).optional(),
  customDurationLabel: z.string().max(100).optional().nullable(),
  variants: z.array(productVariantSchema).optional().nullable(),
});

export const updateProductSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
  title: z.string().min(1, "Title cannot be empty").max(120, "Title is too long").optional(),
  description: z.string().max(2000, "Description is too long").optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  price: z.coerce.number().positive("Price must be greater than 0").optional(),
  thumbnailUrl: z.string().url("Invalid image URL").optional().nullable().or(z.literal("")),
  images: z.array(z.string()).max(5, "Maximum 5 images allowed").optional(),
  receiptNote: z.string().max(2000, "Receipt note is too long").optional().nullable().or(z.literal("")),
  duration: z.enum(["daily", "weekly", "monthly", "3month", "6month", "year", "lifetime", "custom"]).optional(),
  durationDays: z.coerce.number().int().min(0).max(36500).optional(),
  customDurationLabel: z.string().max(100).optional().nullable(),
  variants: z.array(productVariantSchema).optional().nullable(),
  isActive: z.boolean().optional(),
  newKeys: z.array(z.string()).optional(),
  structuredKeys: z.array(keyItemSchema).optional(),
  categorizedKeys: z.record(z.string(), z.array(z.string())).optional(),
});

export type ProductVariant = z.infer<typeof productVariantSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

