import Link from "next/link";
import { listCustomers } from "@/features/customers/queries";

export default async function HawkerCustomersPage() {
  const customers = await listCustomers();
  return <section className="space-y-6"><div><p className="text-sm font-medium text-primary">Route</p><h1 className="text-3xl font-semibold tracking-tight">My customers</h1></div><div className="space-y-3">{customers.map((customer, index) => <Link href={`/hawker/customers/${customer.id}`} key={customer.id} className="block rounded-lg border bg-card p-4 hover:bg-muted/40"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{index + 1}. {customer.name}</p><p className="text-sm text-muted-foreground">{customer.address}</p></div><p className="text-right text-sm">{customer.morningQtyMl + customer.eveningQtyMl} ml/day</p></div>{customer.phone && <p className="mt-2 text-sm text-muted-foreground">{customer.phone}</p>}<p className="mt-2 text-sm text-primary">View month →</p></Link>)}{customers.length === 0 && <p className="rounded-lg border p-4 text-sm text-muted-foreground">No active customers assigned.</p>}</div></section>;
}
