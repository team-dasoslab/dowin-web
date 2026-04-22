import { z } from "zod";

export const billingCheckoutHeaderSchema = z.object({
  idempotencyKey: z.string().trim().min(1).max(255),
});

export const billingCheckoutBodySchema = z.object({
  locale: z.enum(["ko", "en"]),
});
