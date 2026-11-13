import { z } from "zod";
import { isValidDateKey } from "@/lib/dates";

const optionalText = z.string().trim().max(300).optional().or(z.literal(""));

export const customerInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().min(1).max(200),
  area: optionalText,
  notes: optionalText,
  hawkerId: z.string().min(1),
  morningQtyMl: z.coerce.number().int().min(0),
  eveningQtyMl: z.coerce.number().int().min(0),
  ratePaise: z.coerce.number().int().min(0).optional().or(z.literal("")),
  startDate: z.string().refine(isValidDateKey, "Invalid date"),
}).refine((value) => value.morningQtyMl > 0 || value.eveningQtyMl > 0, {
  path: ["morningQtyMl"],
  message: "At least one shift is required",
});

export const updateCustomerSchema = customerInputSchema.extend({ id: z.string().min(1) });

export const deactivateCustomerSchema = z.object({ id: z.string().min(1), endDate: z.string().refine(isValidDateKey, "Invalid date") });
