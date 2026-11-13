import "server-only";

import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/dal";
import { getSettings } from "@/features/settings/queries";
import { CustomerModel, DeliveryEntryModel } from "@/models";
import { monthDays } from "@/lib/dates";
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
    return { dateKey, morning: { state: morning.state, qtyMl: morning.qtyMl }, evening: { state: evening.state, qtyMl: evening.qtyMl } };
  });
  const settings = await getSettings();
  const delivered = entries.filter((entry) => entry.status === "delivered");
  const currentRatePaise = effectiveRatePaise(customer.ratePaise, settings.defaultRatePaise);
  const totals = { daysDelivered: new Set(delivered.map((entry) => entry.dateKey)).size, deliveriesCount: delivered.length, notDeliveredCount: entries.filter((entry) => entry.status === "not_delivered").length, unmarkedCount: cells.flatMap((day) => [day.morning, day.evening]).filter((cell) => cell.state === "unmarked").length, pausedCount: 0, totalMl: delivered.reduce((sum, entry) => sum + entry.quantityMl, 0), referenceAmountPaise: session.role === "admin" || settings.showAmountToHawkers ? delivered.reduce((sum, entry) => sum + amountPaise(entry.quantityMl, currentRatePaise), 0) : undefined };
  return { customer: { id: customer._id.toString(), name: customer.name, phone: customer.phone, address: customer.address, area: customer.area, notes: customer.notes, hawkerId: customer.hawkerId.toString(), morningQtyMl: customer.morningQtyMl, eveningQtyMl: customer.eveningQtyMl, ratePaise: customer.ratePaise, startDate: customer.startDate, endDate: customer.endDate, active: customer.active }, days: cells, totals };
}
