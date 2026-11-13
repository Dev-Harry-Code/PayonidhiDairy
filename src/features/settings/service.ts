import "server-only";

import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { SettingsModel, type Settings } from "@/models";

const DEFAULT_SETTINGS = {
  key: "app" as const,
  businessName: "Payonidhi Dairy",
  defaultRatePaise: 6_500,
  hawkerEditDays: 1,
  hawkerMaxPauseDays: 3,
  showAmountToHawkers: false,
  eveningStartsAt: "14:00",
  updatedBy: null,
};

export async function getSettings(): Promise<Settings> {
  await connectDB();
  const settings = await SettingsModel.findOneAndUpdate(
    { key: "app" },
    { $setOnInsert: DEFAULT_SETTINGS },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean<Settings>();

  if (!settings) throw new Error("Unable to load application settings");
  if (settings.defaultRatePaise === 6_000) {
    const migrated = await SettingsModel.findOneAndUpdate({ key: "app", defaultRatePaise: 6_000 }, { $set: { defaultRatePaise: 6_500 } }, { new: true }).lean<Settings>();
    if (migrated) return migrated;
  }
  return settings;
}

export type SettingsUpdate = Partial<
  Pick<
    Settings,
    | "businessName"
    | "defaultRatePaise"
    | "hawkerEditDays"
    | "hawkerMaxPauseDays"
    | "showAmountToHawkers"
    | "eveningStartsAt"
  >
> & { updatedBy?: Types.ObjectId | string | null };

export async function updateSettings(update: SettingsUpdate): Promise<Settings> {
  await connectDB();
  const { updatedBy, ...values } = update;
  const settings = await SettingsModel.findOneAndUpdate(
    { key: "app" },
    { $set: { ...values, updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : null } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  ).lean<Settings>();

  if (!settings) throw new Error("Unable to update application settings");
  return settings;
}
