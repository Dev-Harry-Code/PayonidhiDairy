import mongoose, { type HydratedDocument, type Model, Schema } from "mongoose";
import { LANGUAGES, ROLES, type Language, type Role } from "@/lib/constants";
import { isValidPhone } from "@/lib/phone";

export interface User {
  name: string;
  phone: string;
  pinHash: string;
  role: Role;
  active: boolean;
  preferredLanguage: Language;
  sessionVersion: number;
  failedLoginCount: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 60, trim: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      validate: { validator: isValidPhone, message: "Invalid phone number" },
    },
    pinHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    active: { type: Boolean, default: true },
    preferredLanguage: { type: String, enum: LANGUAGES, default: "hi" },
    sessionVersion: { type: Number, default: 1, min: 1, validate: Number.isInteger },
    failedLoginCount: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, active: 1 });

export const UserModel: Model<User> =
  (mongoose.models.User as Model<User> | undefined) ?? mongoose.model<User>("User", userSchema);
