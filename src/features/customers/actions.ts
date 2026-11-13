"use server";

import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/dal";
import { fail, ok, validationError, type ActionResult } from "@/lib/result";
import { normalisePhone } from "@/lib/phone";
import { CustomerModel, UserModel } from "@/models";
import { customerInputSchema, deactivateCustomerSchema, updateCustomerSchema } from "@/features/customers/schemas";
import { writeAudit } from "@/lib/audit";

export async function createCustomerAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const actor = await requireRole(["admin"]);
  const parsed = customerInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const data = await prepareCustomer(parsed.data);
  if (!data) return fail("VALIDATION", "errors.invalidPhone");
  await connectDB();
  const hawker = await UserModel.findOne({ _id: data.hawkerId, role: "hawker", active: true });
  if (!hawker) return fail("VALIDATION", "errors.invalidHawker");
  const last = await CustomerModel.findOne({ hawkerId: data.hawkerId }).sort({ routeOrder: -1 }).lean();
  const customer = await CustomerModel.create({ ...data, routeOrder: (last?.routeOrder ?? 0) + 10, createdBy: new Types.ObjectId(actor.userId) });
  await writeAudit({ actor: { id: actor.userId, role: actor.role }, action: "customer.create", entity: "Customer", entityId: customer._id, summary: `Created customer ${customer.name}` });
  return ok({ id: customer._id.toString() });
}

export async function updateCustomerAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const actor = await requireRole(["admin"]);
  const parsed = updateCustomerSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const { id, ...customerInput } = parsed.data;
  const data = await prepareCustomer(customerInput);
  if (!data) return fail("VALIDATION", "errors.invalidPhone");
  await connectDB();
  const existing = await CustomerModel.findById(id);
  if (!existing) return fail("NOT_FOUND", "errors.notFound");
  if (!(await UserModel.exists({ _id: data.hawkerId, role: "hawker", active: true }))) return fail("VALIDATION", "errors.invalidHawker");
  existing.set(data);
  await existing.save();
  await writeAudit({ actor: { id: actor.userId, role: actor.role }, action: "customer.update", entity: "Customer", entityId: existing._id, summary: `Updated customer ${existing.name}` });
  return ok({ id: existing._id.toString() });
}

export async function deactivateCustomerAction(input: unknown): Promise<ActionResult> {
  const actor = await requireRole(["admin"]);
  const parsed = deactivateCustomerSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  await connectDB();
  const customer = await CustomerModel.findByIdAndUpdate(parsed.data.id, { active: false, endDate: parsed.data.endDate }, { new: true });
  if (!customer) return fail("NOT_FOUND", "errors.notFound");
  await writeAudit({ actor: { id: actor.userId, role: actor.role }, action: "customer.deactivate", entity: "Customer", entityId: customer._id, summary: `Deactivated customer ${customer.name}` });
  return ok(undefined);
}

async function prepareCustomer(input: Record<string, unknown>) {
  const phoneValue = typeof input.phone === "string" && input.phone ? normalisePhone(input.phone) : null;
  if (input.phone && !phoneValue) return null;
  let hawkerId: Types.ObjectId;
  try {
    hawkerId = new Types.ObjectId(String(input.hawkerId));
  } catch {
    return null;
  }
  return {
    name: String(input.name), phone: phoneValue, address: String(input.address), area: input.area ? String(input.area) : null,
    notes: input.notes ? String(input.notes) : null, hawkerId,
    morningQtyMl: Number(input.morningQtyMl), eveningQtyMl: Number(input.eveningQtyMl),
    ratePaise: input.ratePaise === "" || input.ratePaise === undefined ? null : Number(input.ratePaise),
    startDate: String(input.startDate), endDate: null, active: true,
  };
}
