export const ROLES = ["admin", "hawker"] as const;
export type Role = (typeof ROLES)[number];

export const SHIFTS = ["morning", "evening"] as const;
export type Shift = (typeof SHIFTS)[number];

export const SHIFT_SCOPES = ["both", "morning", "evening"] as const;
export type ShiftScope = (typeof SHIFT_SCOPES)[number];

export const DELIVERY_STATUSES = ["delivered", "not_delivered"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const NOT_DELIVERED_REASONS = [
  "customer_away",
  "customer_refused",
  "skip_requested",
  "stock_short",
  "other",
] as const;
export type NotDeliveredReason = (typeof NOT_DELIVERED_REASONS)[number];

export const CELL_STATES = [
  "delivered",
  "not_delivered",
  "unmarked",
  "paused",
  "not_scheduled",
  "future",
] as const;
export type CellState = (typeof CELL_STATES)[number];

export const QTY_STEP_ML = 500;
export const MAX_QTY_ML = 20_000;
export const DEFAULT_RATE_PAISE = 6_000;
export const DEFAULT_HAWKER_EDIT_DAYS = 1;
export const DEFAULT_EVENING_STARTS_AT = "14:00";
export const BUSINESS_TZ = "Asia/Kolkata";
export const MAX_SUBSTITUTION_DAYS = 31;

export const LANGUAGES = ["en", "hi"] as const;
export type Language = (typeof LANGUAGES)[number];
