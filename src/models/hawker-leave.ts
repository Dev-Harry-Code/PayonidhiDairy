import mongoose, { type HydratedDocument, type Model, Schema, Types } from "mongoose";

export type LeaveStatus = "pending" | "approved" | "denied";
export interface HawkerLeave { hawkerId: Types.ObjectId; fromDate: string; toDate: string; reason: string; status: LeaveStatus; reviewedBy: Types.ObjectId | null; reviewedAt: Date | null; reviewNote: string | null; replacementHawkerId: Types.ObjectId | null; createdAt: Date; updatedAt: Date; }
export type HawkerLeaveDocument = HydratedDocument<HawkerLeave>;
const schema = new Schema<HawkerLeave>({ hawkerId: { type: Schema.Types.ObjectId, ref: "User", required: true }, fromDate: { type: String, required: true }, toDate: { type: String, required: true }, reason: { type: String, required: true, trim: true, maxlength: 300 }, status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" }, reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null }, reviewedAt: { type: Date, default: null }, reviewNote: { type: String, default: null, maxlength: 300 }, replacementHawkerId: { type: Schema.Types.ObjectId, ref: "User", default: null } }, { timestamps: true });
schema.index({ hawkerId: 1, fromDate: -1 }); schema.index({ status: 1, fromDate: 1 });
export const HawkerLeaveModel: Model<HawkerLeave> = (mongoose.models.HawkerLeave as Model<HawkerLeave> | undefined) ?? mongoose.model<HawkerLeave>("HawkerLeave", schema);
