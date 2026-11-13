import Link from "next/link";
import { listHawkers } from "@/features/users/queries";
import { CreateHawkerForm } from "@/features/users/components/create-hawker-form";
import { EditHawkerForm } from "@/features/users/components/edit-hawker-form";

export default async function HawkersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim().toLowerCase() ?? "";
  const hawkers = (await listHawkers(true)).filter((hawker) => !query || `${hawker.name} ${hawker.phone}`.toLowerCase().includes(query));
  return <section className="space-y-6"><div><p className="text-sm font-medium text-primary">Management</p><h1 className="text-3xl font-semibold tracking-tight">Hawkers</h1><p className="mt-2 text-sm text-muted-foreground">View hawker details and edit them only when needed.</p></div><form action="/admin/hawkers" className="flex flex-col gap-2 rounded-2xl border bg-card p-4 sm:flex-row"><input name="q" defaultValue={query} placeholder="Search hawkers by name or phone" className="min-w-0 flex-1 rounded-lg border px-3 py-2" /><button className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground">Search hawkers</button>{query && <Link href="/admin/hawkers" className="rounded-lg border px-4 py-2 text-center font-semibold">Clear</Link>}</form><CreateHawkerForm /><div className="space-y-3">{hawkers.map((hawker) => <div key={hawker.id} className="rounded-xl border bg-card p-4"><EditHawkerForm hawker={hawker} /></div>)}{hawkers.length === 0 && <p className="rounded-lg border p-4 text-sm text-muted-foreground">No hawkers found.</p>}</div><Link className="text-sm text-primary underline" href="/admin/customers">Manage customers →</Link></section>;
}
