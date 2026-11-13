import Link from "next/link";
import { listHawkers } from "@/features/users/queries";
import { CreateHawkerForm } from "@/features/users/components/create-hawker-form";
import { EditHawkerForm } from "@/features/users/components/edit-hawker-form";

export default async function HawkersPage() {
  const hawkers = await listHawkers(true);
  return <section className="space-y-6"><div><p className="text-sm font-medium text-primary">Management</p><h1 className="text-3xl font-semibold tracking-tight">Hawkers</h1><p className="mt-2 text-sm text-muted-foreground">Edit contact details and control route access for every hawker.</p></div><CreateHawkerForm /><div className="space-y-3">{hawkers.map((hawker) => <div key={hawker.id} className="rounded-xl border bg-card p-4"><div className="mb-3 flex items-center justify-between"><div><p className="font-medium">{hawker.name}</p><p className="text-sm text-muted-foreground">{hawker.phone}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${hawker.active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>{hawker.active ? "Active" : "Inactive"}</span></div><EditHawkerForm hawker={hawker} /></div>)}{hawkers.length === 0 && <p className="rounded-lg border p-4 text-sm text-muted-foreground">No hawkers yet.</p>}</div><Link className="text-sm text-primary underline" href="/admin/customers">Manage customers →</Link></section>;
}
