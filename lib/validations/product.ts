import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title is too long"),
  description: z.string().max(2000, "Description is too long").optional().nullable(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  currency: z.string().min(1).max(10).default("USD"),
  keys: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url("Invalid image URL").optional().nullable().or(z.literal("")),
  images: z.array(z.string()).max(5, "Maximum 5 images allowed").optional(),
  receiptNote: z.string().max(2000, "Receipt note is too long").optional().nullable().or(z.literal("")),
});

export const updateProductSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
  title: z.string().min(1, "Title cannot be empty").max(120, "Title is too long").optional(),
  description: z.string().max(2000, "Description is too long").optional().nullable(),
  price: z.coerce.number().positive("Price must be greater than 0").optional(),
  thumbnailUrl: z.string().url("Invalid image URL").optional().nullable().or(z.literal("")),
  images: z.array(z.string()).max(5, "Maximum 5 images allowed").optional(),
  receiptNote: z.string().max(2000, "Receipt note is too long").optional().nullable().or(z.literal("")),
  isActive: z.boolean().optional(),
  newKeys: z.array(z.string()).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
