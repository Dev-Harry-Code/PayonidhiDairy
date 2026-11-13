"use server";

import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { fail, ok, validationError, type ActionResult } from "@/lib/result";
import { createSession, deleteSession } from "@/lib/session";
import { normalisePhone } from "@/lib/phone";
import { getSession } from "@/lib/dal";
import { UserModel } from "@/models";
import { changePinSchema, languageSchema, loginSchema } from "@/features/auth/schemas";
import { writeAudit } from "@/lib/audit";

export async function loginAction(input: unknown): Promise<ActionResult<{ role: "admin" | "hawker" }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const phone = normalisePhone(parsed.data.phone);
  if (!phone) return fail("UNAUTHENTICATED", "errors.invalidCredentials");

  await connectDB();
  const user = await UserModel.findOne({ phone }).select("+pinHash");
  const now = new Date();
  if (!user || !user.active) return fail("UNAUTHENTICATED", "errors.invalidCredentials");
  if (user.lockedUntil && user.lockedUntil > now) return fail("LOCKED", "errors.locked");

  const matches = await bcrypt.compare(parsed.data.pin, user.pinHash);
  if (!matches) {
    const failedLoginCount = user.failedLoginCount + 1;
    user.failedLoginCount = failedLoginCount;
    if (failedLoginCount >= 5) {
      user.lockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
      await user.save();
      return fail("LOCKED", "errors.locked");
    }
    await user.save();
    return fail("UNAUTHENTICATED", "errors.invalidCredentials");
  }

  user.failedLoginCount = 0;
  user.lockedUntil = null;
  user.lastLoginAt = now;
  await user.save();
  await createSession(user);
  await writeAudit({ actor: { id: user._id, role: user.role }, action: "auth.login", entity: "User", entityId: user._id, summary: "Successful login" });
  return ok({ role: user.role });
}

export async function logoutAction(): Promise<ActionResult> {
  await deleteSession();
  return ok(undefined);
}

export async function changeOwnPinAction(input: unknown): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("UNAUTHENTICATED", "errors.unauthenticated");
  const parsed = changePinSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  await connectDB();
  const user = await UserModel.findById(session.userId).select("+pinHash");
  if (!user) return fail("UNAUTHENTICATED", "errors.unauthenticated");
  if (!(await bcrypt.compare(parsed.data.currentPin, user.pinHash))) return fail("VALIDATION", "errors.currentPin");
  user.pinHash = await bcrypt.hash(parsed.data.newPin, 10);
  user.sessionVersion += 1;
  await user.save();
  await deleteSession();
  return ok(undefined);
}

export async function setLanguageAction(input: unknown): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("UNAUTHENTICATED", "errors.unauthenticated");
  const parsed = languageSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  await connectDB();
  await UserModel.findByIdAndUpdate(session.userId, { preferredLanguage: parsed.data.lang });
  return ok(undefined);
}
