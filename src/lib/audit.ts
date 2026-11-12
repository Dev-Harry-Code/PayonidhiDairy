import "server-only";

import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { AuditLogModel } from "@/models";
import type { Role } from "@/lib/constants";

export type AuditActor = { id: Types.ObjectId | string; role: Role };

export type WriteAuditInput = {
  actor: AuditActor;
  action: string;
  entity: string;
  entityId?: Types.ObjectId | string | null;
  summary: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
};

export async function writeAudit(input: WriteAuditInput) {
  await connectDB();
  return AuditLogModel.create({
    actorId: toObjectId(input.actor.id),
    actorRole: input.actor.role,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ? toObjectId(input.entityId) : null,
    summary: input.summary,
    before: input.before ?? null,
    after: input.after ?? null,
    reason: input.reason ?? null,
  });
}

export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  keys: string[],
): { before: Record<string, unknown>; after: Record<string, unknown> } {
  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};

  for (const key of keys) {
    if (!Object.is(before[key], after[key])) {
      changedBefore[key] = before[key];
      changedAfter[key] = after[key];
    }
  }

  return { before: changedBefore, after: changedAfter };
}

function toObjectId(value: Types.ObjectId | string): Types.ObjectId {
  return value instanceof Types.ObjectId ? value : new Types.ObjectId(value);
}
