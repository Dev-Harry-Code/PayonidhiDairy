import Link from "next/link";
import { getCustomerMonth } from "@/features/deliveries/month";
import { CustomerMonth } from "@/features/deliveries/components/customer-month";
import { monthKeyOf, todayKey } from "@/lib/dates";
import { listHawkers } from "@/features/users/queries";
import { EditCustomerForm } from "@/features/customers/components/edit-customer-form";
import { AdminCustomerDangerZone } from "@/features/customers/components/admin-customer-danger-zone";
import { ExportButtons } from "@/features/reports/components/export-buttons";

export default async function AdminCustomerMonthPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string }> }) {
  const { id } = await params; const requested = (await searchParams).month; const monthKey = requested && /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) ? requested : monthKeyOf(todayKey());
  const data = await getCustomerMonth(id, monthKey);
  const hawkers = await listHawkers(true);
  const accountRows = data.days.map((day) => ({ Date: day.dateKey, Morning: day.morning.state === "delivered" ? `${day.morning.qtyMl / 1000} L` : day.morning.state, Evening: day.evening.state === "delivered" ? `${day.evening.qtyMl / 1000} L` : day.evening.state, "Total (L)": (day.morning.qtyMl + day.evening.qtyMl) / 1000 }));
  return <><Link href="/admin/customers" className="mb-4 inline-block text-sm text-primary underline">← Customers</Link><section className="mb-6 space-y-3"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Admin controls</p><h2 className="text-xl font-semibold">Edit customer</h2><p className="text-sm text-muted-foreground">Update contact details, route, demand, rate, dates, notes, or active status.</p></div><ExportButtons title={`${data.customer.name} account · ${monthKey}`} filename={`customer-${data.customer.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${monthKey}`} rows={accountRows} /></div><EditCustomerForm customer={data.customer} hawkers={hawkers.map(({ id, name }) => ({ id, name }))} /></section><div className="mb-6"><AdminCustomerDangerZone customerId={data.customer.id} customerName={data.customer.name} /></div><CustomerMonth data={data} monthKey={monthKey} /></>;
}
