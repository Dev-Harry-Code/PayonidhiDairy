import mongoose, { type HydratedDocument, type Model, Schema, Types } from "mongoose";
import { QTY_STEP_ML } from "@/lib/constants";
import { isValidDateKey } from "@/lib/dates";
import { isValidPhone } from "@/lib/phone";

export interface Customer {
  name: string;
  phone: string | null;
  address: string;
  area: string | null;
  notes: string | null;
  hawkerId: Types.ObjectId;
  routeOrder: number;
  morningQtyMl: number;
  eveningQtyMl: number;
  ratePaise: number | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerDocument = HydratedDocument<Customer>;

const qtyValidator = {
  validator: (value: number) => Number.isInteger(value) && value >= 0 && value % QTY_STEP_ML === 0,
  message: `Quantity must be a multiple of ${QTY_STEP_ML} ml`,
};

const customerSchema = new Schema<Customer>(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 80, trim: true },
    phone: {
      type: String,
      default: null,
      validate: { validator: (value: string | null) => value === null || isValidPhone(value) },
    },
    address: { type: String, required: true, maxlength: 200, trim: true },
    area: { type: String, default: null, maxlength: 80, trim: true },
    notes: { type: String, default: null, maxlength: 300, trim: true },
    hawkerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    routeOrder: { type: Number, required: true, min: 0, validate: Number.isInteger },
    morningQtyMl: { type: Number, required: true, min: 0, validate: qtyValidator },
    eveningQtyMl: { type: Number, required: true, min: 0, validate: qtyValidator },
    ratePaise: {
      type: Number,
      default: null,
      validate: { validator: (value: number | null) => value === null || (Number.isInteger(value) && value >= 0) },
    },
    startDate: { type: String, required: true, validate: { validator: isValidDateKey } },
    endDate: { type: String, default: null, validate: { validator: (value: string | null) => value === null || isValidDateKey(value) } },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

customerSchema.pre("validate", function validateQuantities() {
  if (this.morningQtyMl === 0 && this.eveningQtyMl === 0) {
    this.invalidate("morningQtyMl", "At least one delivery shift is required");
  }
  if (this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "endDate must not be before startDate");
  }
});

customerSchema.index({ hawkerId: 1, active: 1, routeOrder: 1 });
customerSchema.index({ active: 1, name: 1 });
customerSchema.index({ name: "text", address: "text", area: "text", phone: "text" });

export const CustomerModel: Model<Customer> =
  (mongoose.models.Customer as Model<Customer> | undefined) ??
  mongoose.model<Customer>("Customer", customerSchema);
