import { describe, expect, it } from "vitest";
import { isValidPhone, normalisePhone } from "@/lib/phone";

describe("phone", () => {
  it("normalises common Indian phone formats", () => {
    expect(normalisePhone("+91 98765-43210")).toBe("9876543210");
    expect(normalisePhone("98765 43210")).toBe("9876543210");
  });

  it("rejects invalid phone numbers", () => {
    expect(normalisePhone("12345")).toBeNull();
    expect(isValidPhone("5876543210")).toBe(false);
    expect(isValidPhone("9876543210")).toBe(true);
  });
});
