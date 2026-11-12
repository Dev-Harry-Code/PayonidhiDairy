import mongoose, { type HydratedDocument, type Model, Schema, Types } from "mongoose";

export interface Settings {
  key: "app";
  businessName: string;
  defaultRatePaise: number;
  hawkerEditDays: number;
  hawkerMaxPauseDays: number;
  showAmountToHawkers: boolean;
  eveningStartsAt: string;
  updatedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SettingsDocument = HydratedDocument<Settings>;

const settingsSchema = new Schema<Settings>(
  {
    key: { type: String, enum: ["app"], unique: true, default: "app" },
    businessName: { type: String, required: true, default: "Payonidhi Dairy", maxlength: 100, trim: true },
    defaultRatePaise: { type: Number, required: true, default: 6_000, min: 0, validate: Number.isInteger },
    hawkerEditDays: { type: Number, required: true, default: 1, min: 0, max: 7, validate: Number.isInteger },
    hawkerMaxPauseDays: { type: Number, required: true, default: 3, min: 1, max: 7, validate: Number.isInteger },
    showAmountToHawkers: { type: Boolean, required: true, default: false },
    eveningStartsAt: { type: String, required: true, default: "14:00", match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export const SettingsModel: Model<Settings> =
  (mongoose.models.Settings as Model<Settings> | undefined) ??
  mongoose.model<Settings>("Settings", settingsSchema);
