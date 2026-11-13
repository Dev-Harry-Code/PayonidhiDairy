import { describe, expect, it } from "vitest";
import { resolveCell } from "@/features/deliveries/expected";

const customer = { active: true, startDate: "2026-11-01", endDate: null, morningQtyMl: 1500, eveningQtyMl: 0 };

describe("delivery expected state", () => {
  it("distinguishes unmarked, future, and unscheduled cells", () => {
    expect(resolveCell(customer, "2026-11-12", "morning").state).toBe("unmarked");
    expect(resolveCell(customer, "2999-01-01", "morning").state).toBe("future");
    expect(resolveCell(customer, "2026-11-12", "evening").state).toBe("not_scheduled");
    expect(resolveCell({ ...customer, startDate: "2026-11-20" }, "2026-11-12", "morning").state).toBe("not_scheduled");
  });

  it("lets an existing entry win over the expected state", () => {
    expect(resolveCell(customer, "2026-11-12", "morning", { status: "delivered", quantityMl: 2000, reason: null, note: null }).qtyMl).toBe(2000);
    expect(resolveCell(customer, "2026-11-12", "morning", { status: "not_delivered", quantityMl: 0, reason: "customer_away", note: null }).state).toBe("not_delivered");
  });
});
