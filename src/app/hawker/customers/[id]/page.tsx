import Link from "next/link";
import { getCustomerMonth } from "@/features/deliveries/month";
import { CustomerMonth } from "@/features/deliveries/components/customer-month";
import { monthKeyOf, todayKey } from "@/lib/dates";

export default async function HawkerCustomerMonthPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string }> }) {
  const { id } = await params; const requested = (await searchParams).month; const monthKey = requested && /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) ? requested : monthKeyOf(todayKey());
  const data = await getCustomerMonth(id, monthKey);
  return <><Link href="/hawker/customers" className="mb-4 inline-block text-sm text-primary underline">← My customers</Link><CustomerMonth data={data} monthKey={monthKey} /></>;
}
