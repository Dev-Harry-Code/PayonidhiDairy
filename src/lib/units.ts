import { QTY_STEP_ML, MAX_QTY_ML } from "@/lib/constants";

export function mlToLitres(quantityMl: number): number {
  return quantityMl / 1000;
}

export function litresToMl(litres: number): number {
  return Math.round(litres * 1000);
}

export function formatLitres(quantityMl: number, locale: "en" | "hi" = "en"): string {
  const value = new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    maximumFractionDigits: 2,
  }).format(mlToLitres(quantityMl));
  return `${value} ${locale === "hi" ? "ली" : "L"}`;
}

export function formatRupees(amountPaiseValue: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountPaiseValue / 100);
}

export function amountPaise(quantityMl: number, ratePaise: number): number {
  return Math.round((quantityMl * ratePaise) / 1000);
}

/** Handles old records created when the form incorrectly stored rupees as paise. */
export function effectiveRatePaise(ratePaise: number | null | undefined, fallbackPaise: number): number {
  if (ratePaise === null || ratePaise === undefined) return fallbackPaise;
  return ratePaise > 0 && ratePaise < 1_000 ? ratePaise * 100 : ratePaise;
}

export function isValidQtyMl(quantityMl: number, allowZero = false): boolean {
  if (!Number.isInteger(quantityMl)) return false;
  if (quantityMl === 0) return allowZero;
  return quantityMl > 0 && quantityMl <= MAX_QTY_ML && quantityMl % QTY_STEP_ML === 0;
}
