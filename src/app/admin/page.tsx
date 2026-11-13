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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Admin workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Today overview</h1><p className="mt-2 text-sm text-muted-foreground">Keep every route moving and every litre accounted for.</p></div>
        <span className="w-fit rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">Live register</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary text-primary-foreground shadow-lg shadow-primary/10"><CardHeader><CardTitle className="text-primary-foreground/75">Milk delivered</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{formatLitres(dashboard.today.totalMl)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-muted-foreground">Active customers</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{dashboard.activeCustomers}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-muted-foreground">Hawkers on route</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{dashboard.hawkers.length}</CardContent></Card>
      </div>
      <Card><CardHeader className="border-b border-border/70"><CardTitle>Today by hawker</CardTitle><p className="text-sm text-muted-foreground">Route progress across the team</p></CardHeader><CardContent className="pt-4"><div className="space-y-1">{dashboard.hawkers.map((hawker) => <div key={hawker.id} className="flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-muted/60"><div><p className="font-medium">{hawker.name}</p><p className="text-sm text-muted-foreground">Morning {hawker.morning.delivered}/{hawker.morning.total} · Evening {hawker.evening.delivered}/{hawker.evening.total}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${hawker.morning.pending + hawker.evening.pending ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{hawker.morning.pending + hawker.evening.pending ? `${hawker.morning.pending + hawker.evening.pending} pending` : "Complete"}</span></div>)}</div></CardContent></Card>
    </section>
  );
}
