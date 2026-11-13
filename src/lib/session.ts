import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { Types } from "mongoose";
import { cache } from "react";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models";
import type { Role } from "@/lib/constants";

export const SESSION_COOKIE = "pd_session";

export type SessionUser = {
  userId: string;
  role: Role;
  sessionVersion: number;
  name: string;
  preferredLanguage: "en" | "hi";
};

type SessionPayload = JWTPayload & {
  userId: string;
  role: Role;
  sv: number;
};

export const readSession = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecret());
    if (!payload.userId || !payload.role || typeof payload.sv !== "number") return null;
    await connectDB();
    const user = await UserModel.findById(payload.userId).lean();
    if (!user || !user.active || user.sessionVersion !== payload.sv || user.role !== payload.role) {
      return null;
    }
    return {
      userId: user._id.toString(),
      role: user.role,
      sessionVersion: user.sessionVersion,
      name: user.name,
      preferredLanguage: user.preferredLanguage,
    };
  } catch {
    return null;
  }
});

export async function createSession(user: {
  _id: Types.ObjectId;
  role: Role;
  sessionVersion: number;
}): Promise<void> {
  const maxAge = user.role === "admin" ? 7 * 24 * 60 * 60 : 30 * 24 * 60 * 60;
  const token = await new SignJWT({
    userId: user._id.toString(),
    role: user.role,
    sv: user.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${user.role === "admin" ? 7 : 30}d`)
    .sign(getSecret());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

function getSecret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(value);
}
