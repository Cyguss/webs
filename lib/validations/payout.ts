import { z } from "zod";

export const createPayoutSchema = z.object({
  amount: z.coerce.number().min(10, "Minimum payout amount is $10.00"),
  method: z.enum(["crypto", "stripe", "bank"]),
  destinationAddress: z.string().min(1, "Destination address or account identifier is required").max(200),
  cryptoCurrency: z.string().max(20).optional().nullable(),
});

export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;
