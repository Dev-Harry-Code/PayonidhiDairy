import mongoose, { type HydratedDocument, type Model, Schema, Types } from "mongoose";

export type InquiryStatus = "pending" | "approved" | "denied";

export interface CustomerInquiry {
  name: string;
  phone: string | null;
  address: string;
  area: string | null;
  notes: string | null;
  hawkerId: Types.ObjectId;
  morningQtyMl: number;
  eveningQtyMl: number;
  status: InquiryStatus;
  reviewedBy: Types.ObjectId | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerInquiryDocument = HydratedDocument<CustomerInquiry>;

const inquirySchema = new Schema<CustomerInquiry>({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, default: null },
  address: { type: String, required: true, trim: true, maxlength: 200 },
  area: { type: String, default: null, trim: true, maxlength: 80 },
  notes: { type: String, default: null, trim: true, maxlength: 300 },
  hawkerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  morningQtyMl: { type: Number, required: true, min: 0 },
  eveningQtyMl: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, default: null, maxlength: 300 },
}, { timestamps: true });

inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ hawkerId: 1, createdAt: -1 });

export const CustomerInquiryModel: Model<CustomerInquiry> =
  (mongoose.models.CustomerInquiry as Model<CustomerInquiry> | undefined) ?? mongoose.model<CustomerInquiry>("CustomerInquiry", inquirySchema);
