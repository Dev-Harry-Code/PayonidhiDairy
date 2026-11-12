import { Types } from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { DELIVERY_STATUSES } from "@/lib/constants";
import { CustomerModel, DeliveryEntryModel, UserModel } from "@/models";
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from "./setup";

describe("MVP database models", () => {
  let userId: Types.ObjectId;

  beforeAll(async () => {
    await startTestDatabase();
    await Promise.all([UserModel.init(), CustomerModel.init(), DeliveryEntryModel.init()]);
  });

  beforeEach(async () => {
    await clearTestDatabase();
    const user = await UserModel.create({
      name: "Owner",
      phone: "9000000001",
      pinHash: "hash",
      role: "admin",
      preferredLanguage: "en",
    });
    userId = user._id;
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it("enforces valid customer quantities and dates", async () => {
    const invalid = new CustomerModel({
      name: "Test Customer",
      address: "1 Main Road",
      hawkerId: userId,
      routeOrder: 10,
      morningQtyMl: 750,
      eveningQtyMl: 0,
      startDate: "2026-11-01",
      createdBy: userId,
    });
    await expect(invalid.validate()).rejects.toThrow();

    invalid.morningQtyMl = 0;
    invalid.eveningQtyMl = 0;
    await expect(invalid.validate()).rejects.toThrow(/shift/i);
  });

  it("enforces delivery status rules", async () => {
    const customer = await CustomerModel.create({
      name: "Test Customer",
      address: "1 Main Road",
      hawkerId: userId,
      routeOrder: 10,
      morningQtyMl: 1_000,
      eveningQtyMl: 0,
      startDate: "2026-11-01",
      createdBy: userId,
    });
    const invalid = new DeliveryEntryModel({
      customerId: customer._id,
      dateKey: "2026-11-12",
      shift: "morning",
      status: DELIVERY_STATUSES[0],
      quantityMl: 750,
      defaultQtyMl: 1_000,
      ratePaise: 6_000,
      hawkerId: userId,
      markedBy: userId,
      markedAt: new Date(),
    });
    await expect(invalid.validate()).rejects.toThrow(/quantity/i);
  });

  it("prevents duplicate entries for one customer, date, and shift", async () => {
    const customer = await CustomerModel.create({
      name: "Test Customer",
      address: "1 Main Road",
      hawkerId: userId,
      routeOrder: 10,
      morningQtyMl: 1_000,
      eveningQtyMl: 0,
      startDate: "2026-11-01",
      createdBy: userId,
    });
    const entry = {
      customerId: customer._id,
      dateKey: "2026-11-12",
      shift: "morning" as const,
      status: "delivered" as const,
      quantityMl: 1_000,
      reason: null,
      defaultQtyMl: 1_000,
      ratePaise: 6_000,
      hawkerId: userId,
      markedBy: userId,
      markedAt: new Date(),
    };
    await DeliveryEntryModel.create(entry);
    await expect(DeliveryEntryModel.create(entry)).rejects.toMatchObject({ code: 11000 });
  });

  it("enforces unique user phones", async () => {
    await expect(
      UserModel.create({
        name: "Another Owner",
        phone: "9000000001",
        pinHash: "hash",
        role: "admin",
      }),
    ).rejects.toMatchObject({ code: 11000 });
  });
});
