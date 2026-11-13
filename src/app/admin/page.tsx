import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/dal";
import { getDashboard } from "@/features/reports/queries";
import { todayKey } from "@/lib/dates";
import { formatLitres } from "@/lib/units";

export default async function AdminPage() {
  await requireRole(["admin"]);
  const dashboard = await getDashboard(todayKey());
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Admin workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">Today overview</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Milk delivered</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatLitres(dashboard.today.totalMl)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Active customers</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{dashboard.activeCustomers}</CardContent></Card>
        <Card><CardHeader><CardTitle>Hawkers</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{dashboard.hawkers.length}</CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Today by hawker</CardTitle></CardHeader><CardContent><div className="space-y-3">{dashboard.hawkers.map((hawker) => <div key={hawker.id} className="flex items-center justify-between border-b pb-3 last:border-0"><div><p className="font-medium">{hawker.name}</p><p className="text-sm text-muted-foreground">Morning {hawker.morning.delivered}/{hawker.morning.total} · Evening {hawker.evening.delivered}/{hawker.evening.total}</p></div><span className="text-sm">{hawker.morning.pending + hawker.evening.pending} pending</span></div>)}</div></CardContent></Card>
    </section>
  );
}
