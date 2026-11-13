import "server-only";

import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/dal";
import { CustomerModel, DeliveryEntryModel, UserModel } from "@/models";
import { monthDays } from "@/lib/dates";
import { getCustomerMonth } from "@/features/deliveries/month";
import { getSettings } from "@/features/settings/queries";
import { amountPaise } from "@/lib/units";

export async function getDashboard(dateKey: string) {
  await requireRole(["admin"]); await connectDB();
  const monthKey = dateKey.slice(0, 7);
  const monthDateKeys = monthDays(monthKey);
  const [hawkers, customers, entries, settings] = await Promise.all([
    UserModel.find({ role: "hawker", active: true }).sort({ name: 1 }).lean(),
    CustomerModel.find({ active: true }).lean(),
    DeliveryEntryModel.find({ dateKey }).lean(),
    getSettings(),
  ]);
  const todayDelivered = entries.filter((entry) => entry.status === "delivered");
  const hawkerProgress = hawkers.map((hawker) => {
    const ids = new Set(customers.filter((customer) => customer.hawkerId.toString() === hawker._id.toString()).map((customer) => customer._id.toString()));
    const own = entries.filter((entry) => ids.has(entry.customerId.toString()));
    const progress = (shift: "morning" | "evening") => ({ total: customers.filter((customer) => ids.has(customer._id.toString()) && (shift === "morning" ? customer.morningQtyMl : customer.eveningQtyMl) > 0).length, delivered: own.filter((entry) => entry.shift === shift && entry.status === "delivered").length, notDelivered: own.filter((entry) => entry.shift === shift && entry.status === "not_delivered").length, pending: customers.filter((customer) => ids.has(customer._id.toString()) && (shift === "morning" ? customer.morningQtyMl : customer.eveningQtyMl) > 0).length - own.filter((entry) => entry.shift === shift).length });
    return { id: hawker._id.toString(), name: hawker.name, morning: progress("morning"), evening: progress("evening") };
  });
  const customerById = new Map(customers.map((customer) => [customer._id.toString(), customer]));
  const rateFor = (customerId: string, storedRate?: number) => storedRate ?? customerById.get(customerId)?.ratePaise ?? settings.defaultRatePaise;
  const todayDemandMl = customers.reduce((sum, customer) => sum + customer.morningQtyMl + customer.eveningQtyMl, 0);
  const todayAmountPaise = todayDelivered.reduce((sum, entry) => sum + amountPaise(entry.quantityMl, rateFor(entry.customerId.toString(), entry.ratePaise)), 0);
  const todayDemandAmountPaise = customers.reduce((sum, customer) => sum + amountPaise(customer.morningQtyMl + customer.eveningQtyMl, customer.ratePaise ?? settings.defaultRatePaise), 0);
  const todayCustomers = customers.map((customer) => {
    const ownEntries = entries.filter((entry) => entry.customerId.toString() === customer._id.toString());
    const delivered = ownEntries.filter((entry) => entry.status === "delivered");
    const demandMl = customer.morningQtyMl + customer.eveningQtyMl;
    const deliveredMl = delivered.reduce((sum, entry) => sum + entry.quantityMl, 0);
    const deliveredAmountPaise = delivered.reduce((sum, entry) => sum + amountPaise(entry.quantityMl, rateFor(customer._id.toString(), entry.ratePaise)), 0);
    return { id: customer._id.toString(), name: customer.name, hawkerName: hawkers.find((hawker) => hawker._id.toString() === customer.hawkerId.toString())?.name ?? "—", demandMl, deliveredMl, completionPercent: demandMl ? Math.round((deliveredMl / demandMl) * 100) : 0, deliveredAmountPaise, ratePaise: customer.ratePaise ?? settings.defaultRatePaise, morning: { demandMl: customer.morningQtyMl, deliveredMl: delivered.find((entry) => entry.shift === "morning")?.quantityMl ?? 0 }, evening: { demandMl: customer.eveningQtyMl, deliveredMl: delivered.find((entry) => entry.shift === "evening")?.quantityMl ?? 0 } };
  }).sort((a, b) => a.name.localeCompare(b.name));
  const monthEntries = await DeliveryEntryModel.find({ dateKey: { $in: monthDateKeys }, status: "delivered" }).lean();
  const calendar = monthDateKeys.map((key) => {
    const dayEntries = monthEntries.filter((entry) => entry.dateKey === key);
    return { dateKey: key, totalMl: dayEntries.reduce((sum, entry) => sum + entry.quantityMl, 0), amountPaise: dayEntries.reduce((sum, entry) => sum + amountPaise(entry.quantityMl, rateFor(entry.customerId.toString(), entry.ratePaise)), 0), deliveries: dayEntries.length };
  });
  return { today: { morningMl: todayDelivered.filter((entry) => entry.shift === "morning").reduce((sum, entry) => sum + entry.quantityMl, 0), eveningMl: todayDelivered.filter((entry) => entry.shift === "evening").reduce((sum, entry) => sum + entry.quantityMl, 0), totalMl: todayDelivered.reduce((sum, entry) => sum + entry.quantityMl, 0), demandMl: todayDemandMl, completionPercent: todayDemandMl ? Math.round((todayDelivered.reduce((sum, entry) => sum + entry.quantityMl, 0) / todayDemandMl) * 100) : 0, amountPaise: todayAmountPaise, demandAmountPaise: todayDemandAmountPaise }, hawkers: hawkerProgress, activeCustomers: customers.length, todayCustomers, calendar, monthKey, last30Days: [] as Array<{ dateKey: string; totalMl: number }>, unmarkedYesterday: [] as Array<{ customerId: string; name: string; hawkerName: string; shift: "morning" | "evening" }> };
}

export async function getMonthlyReport(monthKey: string) {
  await requireRole(["admin"]); await connectDB();
  const [customers, hawkers] = await Promise.all([CustomerModel.find().sort({ name: 1 }).lean(), UserModel.find({ role: "hawker" }).lean()]);
  const hawkerNames = new Map(hawkers.map((hawker) => [hawker._id.toString(), hawker.name]));
  const rows = await Promise.all(customers.map(async (customer) => { const report = await getCustomerMonth(customer._id.toString(), monthKey); return { id: report.customer.id, name: report.customer.name, hawkerName: hawkerNames.get(customer.hawkerId.toString()) ?? "—", ...report.totals, ratePaise: customer.ratePaise }; }));
  const days = monthDays(monthKey).map((dateKey) => ({ dateKey, totalMl: 0 }));
  const entries = await DeliveryEntryModel.find({ dateKey: { $in: days.map((day) => day.dateKey) }, status: "delivered" }).lean();
  const totalsByDay = new Map<string, number>(); entries.forEach((entry) => totalsByDay.set(entry.dateKey, (totalsByDay.get(entry.dateKey) ?? 0) + entry.quantityMl));
  days.forEach((day) => { day.totalMl = totalsByDay.get(day.dateKey) ?? 0; });
  return { customers: rows, hawkers: hawkers.map((hawker) => { const own = rows.filter((row) => row.hawkerName === hawker.name); return { id: hawker._id.toString(), name: hawker.name, deliveries: own.reduce((sum, row) => sum + row.deliveriesCount, 0), totalMl: own.reduce((sum, row) => sum + row.totalMl, 0), notDelivered: own.reduce((sum, row) => sum + row.notDeliveredCount, 0), unmarked: own.reduce((sum, row) => sum + row.unmarkedCount, 0) }; }), days, grand: { totalMl: rows.reduce((sum, row) => sum + row.totalMl, 0), referenceAmountPaise: rows.reduce((sum, row) => sum + (row.referenceAmountPaise ?? 0), 0), deliveries: rows.reduce((sum, row) => sum + row.deliveriesCount, 0) } };
}
