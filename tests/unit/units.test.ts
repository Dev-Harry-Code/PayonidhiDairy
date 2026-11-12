import { describe, expect, it } from "vitest";
import {
  amountPaise,
  formatLitres,
  formatRupees,
  isValidQtyMl,
  litresToMl,
  mlToLitres,
} from "@/lib/units";

describe("units", () => {
  it("converts and formats litres", () => {
    expect(mlToLitres(1500)).toBe(1.5);
    expect(litresToMl(1.5)).toBe(1500);
    expect(formatLitres(1500)).toBe("1.5 L");
    expect(formatLitres(2000)).toBe("2 L");
    expect(formatLitres(500)).toBe("0.5 L");
  });

  it("formats Indian rupees and calculates reference amounts", () => {
    expect(formatRupees(285000)).toBe("₹2,850");
    expect(formatRupees(12500000)).toBe("₹1,25,000");
    expect(amountPaise(1500, 6000)).toBe(9000);
    expect(amountPaise(1500, 6333)).toBe(9500);
  });

  it("accepts only positive 500 ml steps by default", () => {
    expect(isValidQtyMl(1000)).toBe(true);
    expect(isValidQtyMl(750)).toBe(false);
    expect(isValidQtyMl(0)).toBe(false);
    expect(isValidQtyMl(0, true)).toBe(true);
    expect(isValidQtyMl(20_500)).toBe(false);
  });
});
