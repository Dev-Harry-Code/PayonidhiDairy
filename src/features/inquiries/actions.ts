"use server";

import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/dal";
import { fail, ok, validationError, type ActionResult } from "@/lib/result";
import { normalisePhone } from "@/lib/phone";
import { todayKey } from "@/lib/dates";
import { CustomerInquiryModel, CustomerModel, UserModel } from "@/models";
import { getSettings } from "@/features/settings/queries";
import { writeAudit } from "@/lib/audit";
import { inquiryInputSchema, reviewInquirySchema } from "@/features/inquiries/schemas";

export async function createCustomerInquiryAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const actor = await requireRole(["hawker"]);
  const parsed = inquiryInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const phone = parsed.data.phone ? normalisePhone(parsed.data.phone) : null;
  if (parsed.data.phone && !phone) return fail("VALIDATION", "errors.invalidPhone");
  await connectDB();
  const hawker = await UserModel.findOne({ _id: actor.userId, role: "hawker", active: true });
  if (!hawker) return fail("FORBIDDEN", "errors.forbidden");
  const inquiry = await CustomerInquiryModel.create({ ...parsed.data, morningQtyMl: parsed.data.morningQtyMl * 1000, eveningQtyMl: parsed.data.eveningQtyMl * 1000, phone, area: parsed.data.area || null, notes: parsed.data.notes || null, hawkerId: hawker._id, status: "pending", reviewedBy: null, reviewedAt: null, reviewNote: null });
  await writeAudit({ actor: { id: actor.userId, role: actor.role }, action: "customer.inquiry_create", entity: "CustomerInquiry", entityId: inquiry._id, summary: `Submitted customer inquiry for ${inquiry.name}` });
  return ok({ id: inquiry._id.toString() });
}

export async function reviewCustomerInquiryAction(input: unknown): Promise<ActionResult<{ customerId?: string }>> {
  const actor = await requireRole(["admin"]);
  const parsed = reviewInquirySchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  await connectDB();
  const inquiry = await CustomerInquiryModel.findOne({ _id: parsed.data.id, status: "pending" });
  if (!inquiry) return fail("NOT_FOUND", "errors.notFound");
  const reviewed = { reviewedBy: new Types.ObjectId(actor.userId), reviewedAt: new Date(), reviewNote: parsed.data.reviewNote || null };
  if (parsed.data.decision === "deny") {
    inquiry.set({ ...reviewed, status: "denied" });
    await inquiry.save();
    await writeAudit({ actor: { id: actor.userId, role: actor.role }, action: "customer.inquiry_deny", entity: "CustomerInquiry", entityId: inquiry._id, summary: `Denied customer inquiry for ${inquiry.name}` });
    return ok({});
  }
  const hawker = await UserModel.findOne({ _id: inquiry.hawkerId, role: "hawker", active: true });
  if (!hawker) return fail("VALIDATION", "errors.invalidHawker");
  const last = await CustomerModel.findOne({ hawkerId: inquiry.hawkerId }).sort({ routeOrder: -1 }).lean();
  const settings = await getSettings();
  const ratePaise = parsed.data.rateRupees === "" || parsed.data.rateRupees === undefined ? settings.defaultRatePaise : Math.round(Number(parsed.data.rateRupees) * 100);
  const approvalDate = todayKey();
  const customer = await CustomerModel.create({ name: inquiry.name, phone: inquiry.phone, address: inquiry.address, area: inquiry.area, notes: inquiry.notes, hawkerId: inquiry.hawkerId, routeOrder: (last?.routeOrder ?? 0) + 10, morningQtyMl: inquiry.morningQtyMl, eveningQtyMl: inquiry.eveningQtyMl, ratePaise, startDate: approvalDate, endDate: null, active: true, createdBy: new Types.ObjectId(actor.userId) });
  inquiry.set({ ...reviewed, status: "approved" });
  await inquiry.save();
  await writeAudit({ actor: { id: actor.userId, role: actor.role }, action: "customer.inquiry_approve", entity: "CustomerInquiry", entityId: inquiry._id, summary: `Approved customer inquiry for ${customer.name}` });
  return ok({ customerId: customer._id.toString() });
}
