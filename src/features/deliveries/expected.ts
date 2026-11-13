import type { CellState, Shift } from "@/lib/constants";
import { todayKey } from "@/lib/dates";

export type ExpectedCustomer = { active: boolean; startDate: string; endDate: string | null; morningQtyMl: number; eveningQtyMl: number };
export type DeliveryLike = { status: "delivered" | "not_delivered"; quantityMl: number; reason: string | null; note: string | null; _id?: { toString(): string } | string; markedAt?: Date; };

export function scheduledQtyMl(customer: ExpectedCustomer, shift: Shift): number {
  return shift === "morning" ? customer.morningQtyMl : customer.eveningQtyMl;
}

export function resolveCell(customer: ExpectedCustomer, dateKey: string, shift: Shift, entry?: DeliveryLike | null): { state: CellState; qtyMl: number; entry?: DeliveryLike } {
  const qtyMl = scheduledQtyMl(customer, shift);
  if (entry) return { state: entry.status, qtyMl: entry.quantityMl, entry };
  if (!customer.active || dateKey < customer.startDate || (customer.endDate !== null && dateKey > customer.endDate)) return { state: "not_scheduled", qtyMl };
  if (qtyMl === 0) return { state: "not_scheduled", qtyMl };
  return { state: dateKey > todayKey() ? "future" : "unmarked", qtyMl };
}
