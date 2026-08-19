import { z } from "zod";

export const couponFields = {
  code: z.string().trim().toUpperCase().min(1, { error: "Required" }).max(50),
  percentage: z.number().min(1, { error: "Must be at least 1" }).max(100, { error: "Cannot exceed 100" }),
  minAmount: z.number().min(0).nullable(),
  maxUses: z.number().int().min(1).nullable(),
  expiresAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), { error: "Invalid date" })
    .nullable(),
  isActive: z.boolean(),
};

export function toExpiry(value: string | null): Date | null {
  return value ? new Date(value) : null;
}
