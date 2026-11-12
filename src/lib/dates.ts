import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getHours,
  getMinutes,
  isValid,
  startOfMonth,
} from "date-fns";
import { hi } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { BUSINESS_TZ } from "@/lib/constants";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidDateKey(dateKey: string): boolean {
  if (!DATE_KEY_PATTERN.test(dateKey)) return false;
  const date = parseDateKey(dateKey);
  return isValid(date) && format(date, "yyyy-MM-dd") === dateKey;
}

export function isValidMonthKey(monthKey: string): boolean {
  return MONTH_KEY_PATTERN.test(monthKey);
}

export function parseDateKey(dateKey: string): TZDate {
  if (!isValidDateKeyShape(dateKey)) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }
  return new TZDate(`${dateKey}T00:00:00`, BUSINESS_TZ);
}

export function toDateKey(date: Date): string {
  return format(new TZDate(date, BUSINESS_TZ), "yyyy-MM-dd");
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

export function addDaysKey(dateKey: string, days: number): string {
  return toDateKey(addDays(parseDateKey(dateKey), days));
}

export function diffDaysKey(from: string, to: string): number {
  return differenceInCalendarDays(parseDateKey(to), parseDateKey(from));
}

export function monthKeyOf(dateKey: string): string {
  return format(parseDateKey(dateKey), "yyyy-MM");
}

export function monthDays(monthKey: string): string[] {
  if (!isValidMonthKey(monthKey)) throw new Error(`Invalid month key: ${monthKey}`);
  const first = parseDateKey(`${monthKey}-01`);
  const last = endOfMonth(first);
  return eachDayOfInterval({ start: startOfMonth(first), end: last }).map(toDateKey);
}

export function currentShift(
  eveningStartsAt: string,
  now: Date = new Date(),
): "morning" | "evening" {
  const [hoursText, minutesText] = eveningStartsAt.split(":");
  const startMinutes = Number(hoursText) * 60 + Number(minutesText);
  const localNow = new TZDate(now, BUSINESS_TZ);
  const nowMinutes = getHours(localNow) * 60 + getMinutes(localNow);
  return nowMinutes >= startMinutes ? "evening" : "morning";
}

export function formatDateLabel(dateKey: string, locale: "en" | "hi" = "en"): string {
  return format(parseDateKey(dateKey), "EEE, d MMM", {
    locale: locale === "hi" ? hi : undefined,
  });
}

export function formatMonthLabel(monthKey: string, locale: "en" | "hi" = "en"): string {
  return format(parseDateKey(`${monthKey}-01`), "LLLL yyyy", {
    locale: locale === "hi" ? hi : undefined,
  });
}

export function formatTime(date: Date, locale: "en" | "hi" = "en"): string {
  const value = format(new TZDate(date, BUSINESS_TZ), "h:mm a", {
    locale: locale === "hi" ? hi : undefined,
  });
  return locale === "en" ? value.toUpperCase() : value;
}

function isValidDateKeyShape(dateKey: string): boolean {
  return DATE_KEY_PATTERN.test(dateKey);
}
