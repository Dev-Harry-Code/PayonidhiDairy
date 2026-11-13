import { z } from "zod";
import { isValidDateKey } from "@/lib/dates";
import { isValidQtyMl } from "@/lib/units";

const dateKey = z.string().refine(isValidDateKey, "Invalid date");
export const markDeliverySchema = z.object({
  customerId: z.string().min(1), dateKey, shift: z.enum(["morning", "evening"]),
  status: z.enum(["delivered", "not_delivered"]), quantityMl: z.coerce.number().int().optional(),
  reason: z.enum(["customer_away", "customer_refused", "skip_requested", "stock_short", "other"]).optional(), note: z.string().trim().max(200).optional(), includeMorning: z.coerce.boolean().optional(),
});
export const unmarkDeliverySchema = z.object({ customerId: z.string().min(1), dateKey, shift: z.enum(["morning", "evening"]) });
export const markAllRemainingSchema = z.object({ dateKey, shift: z.enum(["morning", "evening"]) });
export function validDeliveredQty(value: number): boolean { return isValidQtyMl(value); }
