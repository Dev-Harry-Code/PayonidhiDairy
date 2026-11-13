import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { getSettings } from "@/features/settings/queries";
import { todayKey, diffDaysKey } from "@/lib/dates";
import type { Role } from "@/lib/constants";
import { readSession, type SessionUser } from "@/lib/session";

export const getSession = cache(readSession);

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const session = await requireUser();
  if (!roles.includes(session.role)) {
    redirect(session.role === "admin" ? "/admin" : "/hawker/today");
  }
  return session;
}

export async function assertDateEditable(session: SessionUser, dateKey: string): Promise<void> {
  const today = todayKey();
  if (dateKey > today) throw new Error("FUTURE_DATE");
  if (session.role === "admin") return;
  const settings = await getSettings();
  if (diffDaysKey(dateKey, today) > settings.hawkerEditDays) throw new Error("OUTSIDE_EDIT_WINDOW");
}
