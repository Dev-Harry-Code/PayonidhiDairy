import Link from "next/link";
import { listHawkers } from "@/features/users/queries";
import { CreateHawkerForm } from "@/features/users/components/create-hawker-form";

export default async function HawkersPage() {
  const hawkers = await listHawkers(true);
  return <section className="space-y-6"><div><p className="text-sm font-medium text-primary">Management</p><h1 className="text-3xl font-semibold tracking-tight">Hawkers</h1></div><CreateHawkerForm /><div className="overflow-hidden rounded-lg border bg-card"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40"><tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Status</th></tr></thead><tbody>{hawkers.map((hawker) => <tr key={hawker.id} className="border-b last:border-0"><td className="p-3 font-medium">{hawker.name}</td><td className="p-3">{hawker.phone}</td><td className="p-3">{hawker.active ? "Active" : "Inactive"}</td></tr>)}</tbody></table>{hawkers.length === 0 && <p className="p-4 text-sm text-muted-foreground">No hawkers yet.</p>}</div><Link className="text-sm text-primary underline" href="/admin/customers">Manage customers →</Link></section>;
}
