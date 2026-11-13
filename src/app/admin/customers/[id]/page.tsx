import Link from "next/link";
import { getCustomerDateRange, getCustomerMonth } from "@/features/deliveries/month";
import { CustomerMonth } from "@/features/deliveries/components/customer-month";
import { monthDays, monthKeyOf, todayKey } from "@/lib/dates";
import { listHawkers } from "@/features/users/queries";
import { EditCustomerForm } from "@/features/customers/components/edit-customer-form";
import { AdminCustomerDangerZone } from "@/features/customers/components/admin-customer-danger-zone";
import { CustomerDateReport } from "@/features/reports/components/customer-date-report";
import { CustomerStatement } from "@/features/reports/components/customer-statement";

export default async function AdminCustomerMonthPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string; from?: string; to?: string }> }) {
  const { id } = await params; const paramsData = await searchParams; const requested = paramsData.month; const monthKey = requested && /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) ? requested : monthKeyOf(todayKey()); const defaultDays = monthDays(monthKey); const fromDate = paramsData.from && /^\d{4}-\d{2}-\d{2}$/.test(paramsData.from) ? paramsData.from : defaultDays[0]; const toDate = paramsData.to && /^\d{4}-\d{2}-\d{2}$/.test(paramsData.to) ? paramsData.to : defaultDays[defaultDays.length - 1];
  const [data, rangeData] = await Promise.all([getCustomerMonth(id, monthKey), getCustomerDateRange(id, fromDate, toDate)]);
  const hawkers = await listHawkers(true);
  const hawkerName = hawkers.find((hawker) => hawker.id === data.customer.hawkerId)?.name ?? "—";
  return <><Link href="/admin/customers" className="mb-4 inline-block text-sm text-primary underline">← Customers</Link><section className="mb-6 space-y-3"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Admin controls</p><h2 className="text-xl font-semibold">Edit customer</h2><p className="text-sm text-muted-foreground">Update contact details, route, demand, rate, dates, notes, or active status.</p></div></div><EditCustomerForm customer={data.customer} hawkers={hawkers.map(({ id, name }) => ({ id, name }))} /></section><div className="mb-6"><AdminCustomerDangerZone customerId={data.customer.id} customerName={data.customer.name} /></div><div className="mb-6"><CustomerDateReport customerId={id} fromDate={fromDate} toDate={toDate} /></div><div className="mb-6"><CustomerStatement data={rangeData} hawkerName={hawkerName} /></div><form action={`/admin/customers/${id}`} className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border bg-card p-4"><div><label htmlFor="month" className="block text-sm font-medium">Delivery month</label><input id="month" name="month" type="month" defaultValue={monthKey} className="mt-1 rounded-lg border px-3 py-2" /></div><input type="hidden" name="from" value={fromDate} /><input type="hidden" name="to" value={toDate} /><button className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground">Load month</button></form><CustomerMonth data={data} monthKey={monthKey} editable /></>;
}
