import "server-only";
import { connectDB } from "@/lib/db";
import { requireRole } from "@/lib/dal";
import { CustomerInquiryModel, UserModel } from "@/models";

export async function listPendingInquiries() {
  await requireRole(["admin"]); await connectDB();
  const inquiries = await CustomerInquiryModel.find({ status: "pending" }).sort({ createdAt: -1 }).lean();
  const hawkers = await UserModel.find({ _id: { $in: inquiries.map((item) => item.hawkerId) } }).select({ name: 1 }).lean();
  const names = new Map(hawkers.map((hawker) => [hawker._id.toString(), hawker.name]));
  return inquiries.map((item) => ({ id: item._id.toString(), name: item.name, phone: item.phone, address: item.address, area: item.area, notes: item.notes, morningQtyMl: item.morningQtyMl, eveningQtyMl: item.eveningQtyMl, hawkerName: names.get(item.hawkerId.toString()) ?? "Unknown hawker", createdAt: item.createdAt.toISOString() }));
}
