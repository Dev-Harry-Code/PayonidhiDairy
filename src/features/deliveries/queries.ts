import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/dal";
import { CustomerModel, DeliveryEntryModel } from "@/models";
import { resolveCell } from "@/features/deliveries/expected";
import type { Shift } from "@/lib/constants";

export async function getTodaySheet({ dateKey, shift }: { dateKey: string; shift: Shift }) {
  const session = await requireRole(["hawker", "admin"]);
  await connectDB();
  const customers = await CustomerModel.find({ hawkerId: new Types.ObjectId(session.userId), active: true }).sort({ routeOrder: 1, name: 1 }).lean();
  const entries = await DeliveryEntryModel.find({ dateKey, shift, customerId: { $in: customers.map((c) => c._id) } }).lean();
  const morningEntries = shift === "evening" ? await DeliveryEntryModel.find({ dateKey, shift: "morning", customerId: { $in: customers.map((c) => c._id) } }).lean() : [];
  const byCustomer = new Map(entries.map((entry) => [entry.customerId.toString(), entry]));
  const morningByCustomer = new Map(morningEntries.map((entry) => [entry.customerId.toString(), entry]));
  const rows = customers.map((customer) => {
    const cell = resolveCell(customer, dateKey, shift, byCustomer.get(customer._id.toString()));
    const morning = morningByCustomer.get(customer._id.toString());
    return { customerId: customer._id.toString(), name: customer.name, address: customer.address, area: customer.area, defaultQtyMl: cell.qtyMl, state: cell.state, morningQtyMl: customer.morningQtyMl, morningState: morning?.status ?? (customer.morningQtyMl > 0 ? "unmarked" : "not_scheduled"), morningMarkedAt: morning?.markedAt?.toISOString() ?? null, entry: cell.entry ? { id: cell.entry._id?.toString(), status: cell.entry.status, quantityMl: cell.entry.quantityMl, reason: cell.entry.reason, note: cell.entry.note, markedAt: cell.entry.markedAt?.toISOString() ?? null } : null };
  });
  return { dateKey, shift, rows, progress: { total: rows.filter((r) => r.state !== "not_scheduled" && r.state !== "future").length, done: rows.filter((r) => r.state === "delivered" || r.state === "not_delivered").length, delivered: rows.filter((r) => r.state === "delivered").length, notDelivered: rows.filter((r) => r.state === "not_delivered").length, pending: rows.filter((r) => r.state === "unmarked").length, totalMl: rows.filter((r) => r.state === "delivered").reduce((sum, r) => sum + (r.entry?.quantityMl ?? 0), 0) } };
}
