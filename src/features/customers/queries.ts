import "server-only";

import { requireRole } from "@/lib/dal";
import { CustomerModel } from "@/models";

export type CustomerListParams = { q?: string; hawkerId?: string; includeInactive?: boolean };

export async function listCustomers(params: CustomerListParams = {}) {
  const session = await requireRole(["admin", "hawker"]);
  const filter: Record<string, unknown> = {};
  if (session.role === "hawker") filter.hawkerId = session.userId;
  else if (params.hawkerId) filter.hawkerId = params.hawkerId;
  if (!params.includeInactive) filter.active = true;
  if (params.q?.trim()) filter.$or = [{ name: { $regex: params.q.trim(), $options: "i" } }, { address: { $regex: params.q.trim(), $options: "i" } }, { phone: { $regex: params.q.trim(), $options: "i" } }];
  const rows = await CustomerModel.find(filter).sort({ routeOrder: 1, name: 1 }).lean();
  return rows.map((customer) => ({
    id: customer._id.toString(),
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    area: customer.area,
    notes: customer.notes,
    hawkerId: customer.hawkerId.toString(),
    routeOrder: customer.routeOrder,
    morningQtyMl: customer.morningQtyMl,
    eveningQtyMl: customer.eveningQtyMl,
    ratePaise: customer.ratePaise,
    startDate: customer.startDate,
    endDate: customer.endDate,
    active: customer.active,
  }));
}
