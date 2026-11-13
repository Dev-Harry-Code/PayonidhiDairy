import Link from "next/link";
import { listCustomers } from "@/features/customers/queries";
import { listHawkers } from "@/features/users/queries";
import { CreateCustomerForm } from "@/features/customers/components/create-customer-form";

export default async function CustomersPage() {
  const [customers, hawkers] = await Promise.all([listCustomers({ includeInactive: true }), listHawkers()]);
  const names = new Map(hawkers.map((hawker) => [hawker.id, hawker.name]));
  return <section className="space-y-6"><div><p className="text-sm font-medium text-primary">Management</p><h1 className="text-3xl font-semibold tracking-tight">Customers</h1></div><CreateCustomerForm hawkers={hawkers.map(({ id, name }) => ({ id, name }))} /><div className="overflow-hidden rounded-lg border bg-card"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40"><tr><th className="p-3">Customer</th><th className="p-3">Hawker</th><th className="p-3">Quantity</th><th className="p-3">Status</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id} className="border-b last:border-0"><td className="p-3"><Link href={`/admin/customers/${customer.id}`} className="p-3 font-medium text-primary underline">{customer.name}</Link><div className="px-3 text-muted-foreground">{customer.address}</div></td><td className="p-3">{names.get(customer.hawkerId) ?? "—"}</td><td className="p-3">{customer.morningQtyMl} ml AM · {customer.eveningQtyMl} ml PM</td><td className="p-3">{customer.active ? "Active" : "Inactive"}</td></tr>)}</tbody></table>{customers.length === 0 && <p className="p-4 text-sm text-muted-foreground">No customers yet.</p>}</div></section>;
}
