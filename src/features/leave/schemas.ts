import { z } from "zod";
import { isValidDateKey } from "@/lib/dates";
const date = z.string().refine(isValidDateKey, "Invalid date");
export const leaveRequestSchema = z.object({ fromDate: date, toDate: date, reason: z.string().trim().min(3).max(300) }).refine((value) => value.toDate >= value.fromDate, { path: ["toDate"], message: "End date must be on or after start date" });
export const leaveReviewSchema = z.object({ id: z.string().min(1), decision: z.enum(["approve", "deny"]), replacementHawkerId: z.string().optional().or(z.literal("")), reviewNote: z.string().trim().max(300).optional().or(z.literal("")) });
export const leaveReassignSchema = z.object({ id: z.string().min(1), replacementHawkerId: z.string().min(1) });
