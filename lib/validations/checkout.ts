import { z } from "zod";

export const checkoutSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  buyerEmail: z.string().email("Invalid email address"),
  paymentMethod: z.enum(["stripe", "card", "crypto"]),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(100, "Quantity cannot exceed 100").default(1),
  couponId: z.string().optional().nullable(),
  variantId: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

