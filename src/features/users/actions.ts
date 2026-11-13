"use server";

import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/dal";
import { fail, ok, validationError, type ActionResult } from "@/lib/result";
import { normalisePhone } from "@/lib/phone";
import { CustomerModel, UserModel } from "@/models";
import { createHawkerSchema, setHawkerActiveSchema, updateHawkerSchema } from "@/features/users/schemas";
import { writeAudit } from "@/lib/audit";

export async function createHawkerAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const actor = await requireRole(["admin"]);
  const parsed = createHawkerSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const phone = normalisePhone(parsed.data.phone);
  if (!phone) return fail("VALIDATION", "errors.invalidPhone");
  await connectDB();
  if (await UserModel.exists({ phone })) return fail("CONFLICT", "errors.phoneInUse");
  const user = await UserModel.create({ name: parsed.data.name, phone, pinHash: await bcrypt.hash(parsed.data.pin, 10), role: "hawker", preferredLanguage: "hi" });
  await writeAudit({ actor: { id: actor.userId, role: actor.role }, action: "user.create", entity: "User", entityId: user._id, summary: `Created hawker ${user.name}` });
  return ok({ id: user._id.toString() });
}

export async function updateHawkerAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const actor = await requireRole(["admin"]);
  const parsed = updateHawkerSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const phone = normalisePhone(parsed.data.phone);
  if (!phone) return fail("VALIDATION", "errors.invalidPhone");
  await connectDB();
  const duplicate = await UserModel.exists({ phone, _id: { $ne: parsed.data.id } });
  if (duplicate) return fail("CONFLICT", "errors.phoneInUse");
  const update = { name: parsed.data.name, phone, ...(parsed.data.pin ? { pinHash: await bcrypt.hash(parsed.data.pin, 10), $inc: { sessionVersion: 1 } } : {}) };
  const user = await UserModel.findOneAndUpdate({ _id: parsed.data.id, role: "hawker" }, update, { new: true, runValidators: true });
  if (!user) return fail("NOT_FOUND", "errors.notFound");
  await writeAudit({ actor: { id: actor.userId, role: actor.role }, action: "user.update", entity: "User", entityId: user._id, summary: `Updated hawker ${user.name}${parsed.data.pin ? " and changed PIN" : ""}` });
  return ok({ id: user._id.toString() });
}

export async function setHawkerActiveAction(input: unknown): Promise<ActionResult> {
  const actor = await requireRole(["admin"]);
  const parsed = setHawkerActiveSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  await connectDB();
  if (!parsed.data.active && (await CustomerModel.countDocuments({ hawkerId: parsed.data.id, active: true })) > 0) return fail("CONFLICT", "errors.hawkerHasCustomers");
  const user = await UserModel.findOneAndUpdate({ _id: parsed.data.id, role: "hawker" }, { $set: { active: parsed.data.active }, $inc: { sessionVersion: 1 } }, { new: true });
  if (!user) return fail("NOT_FOUND", "errors.notFound");
  await writeAudit({ actor: { id: actor.userId, role: actor.role }, action: parsed.data.active ? "user.activate" : "user.deactivate", entity: "User", entityId: user._id, summary: `${parsed.data.active ? "Activated" : "Deactivated"} hawker ${user.name}` });
  return ok(undefined);
}
