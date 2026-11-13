"use server";

import { connectDB } from "@/lib/db";
import { requireRole, assertDateEditable } from "@/lib/dal";
import { fail, ok, validationError, type ActionResult } from "@/lib/result";
import { getSettings } from "@/features/settings/queries";
import { CustomerModel, DeliveryEntryModel } from "@/models";
import { writeAudit } from "@/lib/audit";
import { markAllRemainingSchema, markDeliverySchema, unmarkDeliverySchema, validDeliveredQty } from "@/features/deliveries/schemas";

export async function markDeliveryAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole(["hawker", "admin"]); const parsed = markDeliverySchema.safeParse(input); if (!parsed.success) return validationError(parsed.error);
  try { await assertDateEditable(session, parsed.data.dateKey); } catch (error) { return fail(error instanceof Error && error.message === "FUTURE_DATE" ? "FUTURE_DATE" : "OUTSIDE_EDIT_WINDOW", error instanceof Error ? `errors.${error.message === "FUTURE_DATE" ? "futureDate" : "outsideEditWindow"}` : "errors.outsideEditWindow"); }
  await connectDB(); const customer = await CustomerModel.findOne({ _id: parsed.data.customerId, hawkerId: session.userId, active: true }); if (!customer) return fail("FORBIDDEN", "errors.forbidden");
  const settings = await getSettings(); const quantityMl = parsed.data.status === "delivered" ? (parsed.data.quantityMl ?? (parsed.data.shift === "morning" ? customer.morningQtyMl : customer.eveningQtyMl)) : 0;
  if (parsed.data.status === "delivered" && !validDeliveredQty(quantityMl)) return fail("VALIDATION", "errors.invalidQuantity");
  if (parsed.data.status === "not_delivered" && !parsed.data.reason) return fail("VALIDATION", "errors.reasonRequired");
  if (parsed.data.reason === "other" && !parsed.data.note?.trim()) return fail("VALIDATION", "errors.noteRequired");
  const filter = { customerId: customer._id, dateKey: parsed.data.dateKey, shift: parsed.data.shift };
  const before = await DeliveryEntryModel.findOne(filter).lean();
  const entry = await DeliveryEntryModel.findOneAndUpdate(filter, { $set: { status: parsed.data.status, quantityMl, reason: parsed.data.status === "delivered" ? null : parsed.data.reason, note: parsed.data.note ?? null, defaultQtyMl: parsed.data.shift === "morning" ? customer.morningQtyMl : customer.eveningQtyMl, ratePaise: customer.ratePaise ?? settings.defaultRatePaise, hawkerId: customer.hawkerId, markedBy: session.userId, markedAt: new Date(), updatedBy: before ? session.userId : null }, ...(before ? { $inc: { editCount: 1 } } : { $setOnInsert: { editCount: 0 } }) }, { upsert: true, new: true, setDefaultsOnInsert: true });
  await writeAudit({ actor: { id: session.userId, role: session.role }, action: before ? "delivery.edit" : "delivery.mark", entity: "DeliveryEntry", entityId: entry._id, summary: `${before ? "Updated" : "Marked"} ${customer.name} ${parsed.data.shift}`, before: before ? { status: before.status, quantityMl: before.quantityMl } : null, after: { status: entry.status, quantityMl: entry.quantityMl } });
  return ok({ id: entry._id.toString() });
}

export async function unmarkDeliveryAction(input: unknown): Promise<ActionResult> {
  const session = await requireRole(["hawker", "admin"]); const parsed = unmarkDeliverySchema.safeParse(input); if (!parsed.success) return validationError(parsed.error); try { await assertDateEditable(session, parsed.data.dateKey); } catch { return fail("OUTSIDE_EDIT_WINDOW", "errors.outsideEditWindow"); }
  await connectDB(); const customer = await CustomerModel.findOne({ _id: parsed.data.customerId, hawkerId: session.userId, active: true }); if (!customer) return fail("FORBIDDEN", "errors.forbidden"); const entry = await DeliveryEntryModel.findOneAndDelete({ customerId: customer._id, dateKey: parsed.data.dateKey, shift: parsed.data.shift }); if (entry) await writeAudit({ actor: { id: session.userId, role: session.role }, action: "delivery.unmark", entity: "DeliveryEntry", entityId: entry._id, summary: `Unmarked ${customer.name} ${parsed.data.shift}`, before: { status: entry.status, quantityMl: entry.quantityMl } }); return ok(undefined);
}

export async function markAllRemainingAction(input: unknown): Promise<ActionResult<{ count: number }>> {
  const session = await requireRole(["hawker", "admin"]); const parsed = markAllRemainingSchema.safeParse(input); if (!parsed.success) return validationError(parsed.error); try { await assertDateEditable(session, parsed.data.dateKey); } catch { return fail("OUTSIDE_EDIT_WINDOW", "errors.outsideEditWindow"); }
  await connectDB(); const settings = await getSettings(); const customers = await CustomerModel.find({ hawkerId: session.userId, active: true, ...(parsed.data.shift === "morning" ? { morningQtyMl: { $gt: 0 } } : { eveningQtyMl: { $gt: 0 } }) }).sort({ routeOrder: 1 }).lean(); const existing = await DeliveryEntryModel.find({ dateKey: parsed.data.dateKey, shift: parsed.data.shift, customerId: { $in: customers.map((c) => c._id) } }).select({ customerId: 1 }).lean(); const done = new Set(existing.map((e) => e.customerId.toString())); const pending = customers.filter((c) => !done.has(c._id.toString())); if (pending.length) await DeliveryEntryModel.bulkWrite(pending.map((c) => ({ updateOne: { filter: { customerId: c._id, dateKey: parsed.data.dateKey, shift: parsed.data.shift }, update: { $setOnInsert: { status: "delivered", quantityMl: parsed.data.shift === "morning" ? c.morningQtyMl : c.eveningQtyMl, reason: null, note: null, defaultQtyMl: parsed.data.shift === "morning" ? c.morningQtyMl : c.eveningQtyMl, ratePaise: c.ratePaise ?? settings.defaultRatePaise, hawkerId: c.hawkerId, markedBy: session.userId, markedAt: new Date(), editCount: 0 } }, upsert: true } }))); await writeAudit({ actor: { id: session.userId, role: session.role }, action: "delivery.bulk_mark", entity: "DeliveryEntry", summary: `Bulk marked ${pending.length} ${parsed.data.shift} deliveries` }); return ok({ count: pending.length });
}
