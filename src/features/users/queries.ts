import "server-only";

import { requireRole } from "@/lib/dal";
import { UserModel } from "@/models";

export async function listHawkers(includeInactive = false) {
  await requireRole(["admin"]);
  const filter = includeInactive ? { role: "hawker" as const } : { role: "hawker" as const, active: true };
  const users = await UserModel.find(filter).sort({ name: 1 }).lean();
  return users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    active: user.active,
    lastLoginAt: user.lastLoginAt,
  }));
}
