import bcrypt from "bcryptjs";
import { addDaysKey, todayKey } from "@/lib/dates";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/features/settings/service";
import { CustomerModel, DeliveryEntryModel, UserModel } from "@/models";

if (process.env.NODE_ENV === "production" || process.env.MONGODB_URI?.includes("prod")) {
  throw new Error("Refusing to seed a production database");
}

await connectDB();
process.stderr.write("This will wipe development collections. Continuing in 3 seconds...\n");
await new Promise((resolve) => setTimeout(resolve, 3_000));

await Promise.all([
  UserModel.deleteMany({}),
  CustomerModel.deleteMany({}),
  DeliveryEntryModel.deleteMany({}),
]);

const passwordHashes = await Promise.all(["123456", "1111", "2222", "3333"].map((pin) => bcrypt.hash(pin, 10)));
const users = await UserModel.create([
  { name: "Owner", phone: "9000000001", pinHash: passwordHashes[0], role: "admin", preferredLanguage: "en" },
  { name: "Ramesh", phone: "9000000002", pinHash: passwordHashes[1], role: "hawker", preferredLanguage: "hi" },
  { name: "Suresh", phone: "9000000003", pinHash: passwordHashes[2], role: "hawker", preferredLanguage: "hi" },
  { name: "Mahesh", phone: "9000000004", pinHash: passwordHashes[3], role: "hawker", preferredLanguage: "hi" },
]);
const admin = users[0];
const hawkers = users.slice(1);
const names = [
  "Sharma ji", "Gupta ji", "Mehta ji", "Jain ji", "Verma ji", "Khan sahab", "Patel ji", "Singh ji", "Joshi ji", "Agarwal ji",
  "सीमा देवी", "मोहन लाल", "सुनीता जी", "रवि कुमार", "पूजा देवी", "अशोक जी", "गीता देवी", "दिनेश जी", "कविता जी", "नरेश जी",
  "Bansal ji", "Choudhary ji", "Bhati ji", "Purohit ji", "Soni ji", "Bohra sahab", "Mali ji", "Rathore ji", "Kumawat ji", "Solanki ji",
];
const today = todayKey();
const startDate = addDaysKey(today, -44);
const customers = await CustomerModel.create(
  names.map((name, index) => ({
    name,
    phone: `98765${String(43210 + index).padStart(5, "0")}`,
    address: `${index + 1}, Shastri Nagar, Jodhpur`,
    area: index % 2 === 0 ? "Shastri Nagar" : "Paota",
    notes: index % 5 === 0 ? "Ring bell twice" : null,
    hawkerId: hawkers[index % hawkers.length]._id,
    routeOrder: (Math.floor(index / hawkers.length) + 1) * 10,
    morningQtyMl: index % 4 === 0 ? 1_000 : 1_500,
    eveningQtyMl: index % 3 === 0 ? 0 : 500,
    ratePaise: index % 10 === 0 ? 6_400 : null,
    startDate,
    endDate: null,
    active: true,
    createdBy: admin._id,
  })),
);

await getSettings();
const entryOperations = [];
for (let dayOffset = 0; dayOffset < 45; dayOffset += 1) {
  const dateKey = addDaysKey(startDate, dayOffset);
  for (const customer of customers) {
    for (const shift of ["morning", "evening"] as const) {
      const defaultQtyMl = shift === "morning" ? customer.morningQtyMl : customer.eveningQtyMl;
      if (defaultQtyMl === 0 || (dayOffset % 17 === 0 && customer._id.toString().endsWith("0"))) continue;
      const notDelivered = dayOffset % 19 === 0 && customer._id.toString().charCodeAt(0) % 3 === 0;
      const quantityMl = notDelivered ? 0 : dayOffset % 11 === 0 ? defaultQtyMl + 500 : defaultQtyMl;
      entryOperations.push({
        insertOne: {
          document: {
            customerId: customer._id,
            dateKey,
            shift,
            status: notDelivered ? "not_delivered" : "delivered",
            quantityMl,
            reason: notDelivered ? "customer_away" : null,
            note: null,
            defaultQtyMl,
            ratePaise: customer.ratePaise ?? 6_000,
            hawkerId: customer.hawkerId,
            markedBy: hawkers.find((hawker) => hawker._id.equals(customer.hawkerId))?._id ?? customer.hawkerId,
            markedAt: new Date(`${dateKey}T06:30:00+05:30`),
            updatedBy: null,
            editCount: 0,
          },
        },
      });
    }
  }
}
if (entryOperations.length) await DeliveryEntryModel.bulkWrite(entryOperations, { ordered: false });

process.stdout.write(`Seeded ${users.length} users, ${customers.length} customers, and ${entryOperations.length} delivery entries.\n`);
