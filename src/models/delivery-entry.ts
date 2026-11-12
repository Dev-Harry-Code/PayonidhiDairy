import mongoose, { type HydratedDocument, type Model, Schema, Types } from "mongoose";
import {
  DELIVERY_STATUSES,
  NOT_DELIVERED_REASONS,
  SHIFTS,
  type DeliveryStatus,
  type NotDeliveredReason,
  type Shift,
} from "@/lib/constants";
import { isValidDateKey } from "@/lib/dates";
import { isValidQtyMl } from "@/lib/units";

export interface DeliveryEntry {
  customerId: Types.ObjectId;
  dateKey: string;
  shift: Shift;
  status: DeliveryStatus;
  quantityMl: number;
  reason: NotDeliveredReason | null;
  note: string | null;
  defaultQtyMl: number;
  ratePaise: number;
  hawkerId: Types.ObjectId;
  markedBy: Types.ObjectId;
  markedAt: Date;
  updatedBy: Types.ObjectId | null;
  editCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DeliveryEntryDocument = HydratedDocument<DeliveryEntry>;

const deliveryEntrySchema = new Schema<DeliveryEntry>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    dateKey: { type: String, required: true, validate: { validator: isValidDateKey } },
    shift: { type: String, enum: SHIFTS, required: true },
    status: { type: String, enum: DELIVERY_STATUSES, required: true },
    quantityMl: { type: Number, required: true, min: 0, validate: Number.isInteger },
    reason: { type: String, enum: [...NOT_DELIVERED_REASONS, null], default: null },
    note: { type: String, default: null, maxlength: 200 },
    defaultQtyMl: { type: Number, required: true, min: 0, validate: Number.isInteger },
    ratePaise: { type: Number, required: true, min: 0, validate: Number.isInteger },
    hawkerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    markedAt: { type: Date, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    editCount: { type: Number, default: 0, min: 0, validate: Number.isInteger },
  },
  { timestamps: true },
);

deliveryEntrySchema.pre("validate", function validateEntry() {
  if (this.status === "delivered") {
    if (!isValidQtyMl(this.quantityMl)) this.invalidate("quantityMl", "Invalid delivered quantity");
    if (this.reason !== null) this.invalidate("reason", "Delivered entries cannot have a reason");
  } else {
    if (this.quantityMl !== 0) this.invalidate("quantityMl", "Not delivered quantity must be zero");
    if (!this.reason) this.invalidate("reason", "A not-delivered reason is required");
    if (this.reason === "other" && !this.note?.trim()) this.invalidate("note", "A note is required for other");
  }
});

deliveryEntrySchema.index({ customerId: 1, dateKey: 1, shift: 1 }, { unique: true });
deliveryEntrySchema.index({ dateKey: 1, hawkerId: 1, shift: 1 });
deliveryEntrySchema.index({ customerId: 1, dateKey: 1 });
deliveryEntrySchema.index({ dateKey: 1 });

export const DeliveryEntryModel: Model<DeliveryEntry> =
  (mongoose.models.DeliveryEntry as Model<DeliveryEntry> | undefined) ??
  mongoose.model<DeliveryEntry>("DeliveryEntry", deliveryEntrySchema);
