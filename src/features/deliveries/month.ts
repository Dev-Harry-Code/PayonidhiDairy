import "server-only";

import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/dal";
import { getSettings } from "@/features/settings/queries";
import { CustomerModel, DeliveryEntryModel } from "@/models";
import { addDaysKey, monthDays } from "@/lib/dates";
import { resolveCell } from "@/features/deliveries/expected";
import { amountPaise, effectiveRatePaise } from "@/lib/units";

export async function getCustomerMonth(customerId: string, monthKey: string) {
  const session = await requireRole(["admin", "hawker"]);
  await connectDB();
  if (!Types.ObjectId.isValid(customerId)) throw new Error("NOT_FOUND");
  const customer = await CustomerModel.findById(customerId).lean();
  if (!customer || (session.role === "hawker" && customer.hawkerId.toString() !== session.userId)) throw new Error("FORBIDDEN");
  const days = monthDays(monthKey);
  const entries = await DeliveryEntryModel.find({ customerId: customer._id, dateKey: { $in: days } }).lean();
  const byKey = new Map(entries.map((entry) => [`${entry.dateKey}:${entry.shift}`, entry]));
  const cells = days.map((dateKey) => {
    const morning = resolveCell(customer, dateKey, "morning", byKey.get(`${dateKey}:morning`));
    const evening = resolveCell(customer, dateKey, "evening", byKey.get(`${dateKey}:evening`));
    return { dateKey, morning: { state: morning.state, qtyMl: morning.qtyMl, markedAt: morning.entry?.markedAt?.toISOString() ?? null }, evening: { state: evening.state, qtyMl: evening.qtyMl, markedAt: evening.entry?.markedAt?.toISOString() ?? null } };
  });
  const settings = await getSettings();
  const delivered = entries.filter((entry) => entry.status === "delivered");
  const currentRatePaise = effectiveRatePaise(customer.ratePaise, settings.defaultRatePaise);
  const totals = { daysDelivered: new Set(delivered.map((entry) => entry.dateKey)).size, deliveriesCount: delivered.length, notDeliveredCount: entries.filter((entry) => entry.status === "not_delivered").length, unmarkedCount: cells.flatMap((day) => [day.morning, day.evening]).filter((cell) => cell.state === "unmarked").length, pausedCount: 0, totalMl: delivered.reduce((sum, entry) => sum + entry.quantityMl, 0), lastActivityAt: entries.reduce<Date | null>((latest, entry) => !latest || entry.markedAt > latest ? entry.markedAt : latest, null), referenceAmountPaise: session.role === "admin" || settings.showAmountToHawkers ? delivered.reduce((sum, entry) => sum + amountPaise(entry.quantityMl, currentRatePaise), 0) : undefined };
  return { customer: { id: customer._id.toString(), name: customer.name, phone: customer.phone, address: customer.address, area: customer.area, notes: customer.notes, hawkerId: customer.hawkerId.toString(), morningQtyMl: customer.morningQtyMl, eveningQtyMl: customer.eveningQtyMl, ratePaise: customer.ratePaise, startDate: customer.startDate, endDate: customer.endDate, active: customer.active }, days: cells, totals };
}

export async function getCustomerDateRange(customerId: string, fromDate: string, toDate: string) {
  const session = await requireRole(["admin", "hawker"]);
  await connectDB();
  if (!Types.ObjectId.isValid(customerId) || toDate < fromDate) throw new Error("NOT_FOUND");
  const customer = await CustomerModel.findById(customerId).lean();
  if (!customer || (session.role === "hawker" && customer.hawkerId.toString() !== session.userId)) throw new Error("FORBIDDEN");
  const periodFrom = customer.startDate > fromDate ? customer.startDate : fromDate;
  const periodTo = customer.endDate && customer.endDate < toDate ? customer.endDate : toDate;
  const hasActivePeriod = periodFrom <= periodTo;
  const entries = await DeliveryEntryModel.find({ customerId: customer._id, dateKey: hasActivePeriod ? { $gte: periodFrom, $lte: periodTo } : { $in: [] } }).sort({ dateKey: 1, shift: 1 }).lean();
  const settings = await getSettings();
  const delivered = entries.filter((entry) => entry.status === "delivered");
  const ratePaise = effectiveRatePaise(customer.ratePaise, settings.defaultRatePaise);
  const entryByShift = new Map(entries.map((entry) => [`${entry.dateKey}:${entry.shift}`, entry]));
  const activeDays = hasActivePeriod ? Math.floor((new Date(`${periodTo}T00:00:00Z`).getTime() - new Date(`${periodFrom}T00:00:00Z`).getTime()) / 86400000) + 1 : 0;
  const reportEntries = hasActivePeriod ? Array.from({ length: activeDays }, (_, index) => addDaysKey(periodFrom, index)).flatMap((dateKey) => (["morning", "evening"] as const).flatMap((shift) => { const scheduledQtyMl = shift === "morning" ? customer.morningQtyMl : customer.eveningQtyMl; if (scheduledQtyMl <= 0) return []; const entry = entryByShift.get(`${dateKey}:${shift}`); return [{ dateKey, shift, status: entry?.status ?? "unmarked" as const, quantityMl: entry?.quantityMl ?? 0, markedAt: entry?.markedAt?.toISOString() ?? null, amountPaise: entry?.status === "delivered" ? amountPaise(entry.quantityMl, ratePaise) : 0 }]; })) : [];
  const demandedBottles = ((customer.morningQtyMl + customer.eveningQtyMl) * activeDays) / 1000;
  return { customer: { id: customer._id.toString(), name: customer.name, phone: customer.phone, hawkerId: customer.hawkerId.toString(), morningQtyMl: customer.morningQtyMl, eveningQtyMl: customer.eveningQtyMl, ratePaise }, fromDate: hasActivePeriod ? periodFrom : fromDate, toDate: hasActivePeriod ? periodTo : toDate, entries: reportEntries, totals: { deliveredMl: delivered.reduce((sum, entry) => sum + entry.quantityMl, 0), deliveredBottles: delivered.reduce((sum, entry) => sum + entry.quantityMl, 0) / 1000, demandedBottles, deliveredCount: delivered.length, notDeliveredCount: entries.filter((entry) => entry.status === "not_delivered").length, unmarkedCount: Math.max(0, demandedBottles - entries.length), amountPaise: delivered.reduce((sum, entry) => sum + amountPaise(entry.quantityMl, ratePaise), 0) } };
}
