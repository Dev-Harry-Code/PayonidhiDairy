import { describe, expect, it } from "vitest";
import {
  addDaysKey,
  currentShift,
  formatDateLabel,
  formatMonthLabel,
  formatTime,
  isValidDateKey,
  monthDays,
  toDateKey,
  todayKey,
} from "@/lib/dates";

describe("dates", () => {
  it("converts moments to business dates in Asia/Kolkata", () => {
    expect(todayKey(new Date("2026-11-11T19:00:00Z"))).toBe("2026-11-12");
    expect(todayKey(new Date("2026-11-11T18:00:00Z"))).toBe("2026-11-11");
    expect(toDateKey(new Date("2026-11-11T18:30:00Z"))).toBe("2026-11-12");
  });

  it("handles date arithmetic and month boundaries", () => {
    expect(addDaysKey("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDaysKey("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDaysKey("2028-02-29", 1)).toBe("2028-03-01");
    expect(monthDays("2026-11")).toHaveLength(30);
    expect(monthDays("2028-02")).toHaveLength(29);
  });

  it("validates date keys and chooses shifts in business time", () => {
    expect(isValidDateKey("2026-02-28")).toBe(true);
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(currentShift("14:00", new Date("2026-11-12T08:29:00Z"))).toBe("morning");
    expect(currentShift("14:00", new Date("2026-11-12T08:30:00Z"))).toBe("evening");
  });

  it("formats dates, months, and times", () => {
    expect(formatDateLabel("2026-11-12")).toBe("Thu, 12 Nov");
    expect(formatMonthLabel("2026-11")).toBe("November 2026");
    expect(formatTime(new Date("2026-11-12T13:12:00Z"))).toBe("6:42 PM");
  });
});
