import { z } from "zod";

export const inquiryInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().min(1).max(200),
  area: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
  morningQtyMl: z.coerce.number().int().min(0),
  eveningQtyMl: z.coerce.number().int().min(0),
}).refine((value) => value.morningQtyMl > 0 || value.eveningQtyMl > 0, { path: ["morningQtyMl"], message: "At least one shift is required" });

export const reviewInquirySchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["approve", "deny"]),
  rateRupees: z.coerce.number().min(0).optional().or(z.literal("")),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reviewNote: z.string().trim().max(300).optional().or(z.literal("")),
});

export const removeCustomerSchema = z.object({ id: z.string().min(1) });
export const deleteCustomerRecordsSchema = z.object({ id: z.string().min(1) });
