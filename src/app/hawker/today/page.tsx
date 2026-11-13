import { requireRole } from "@/lib/dal";
import { formatDateLabel, todayKey } from "@/lib/dates";
import { getTodaySheet } from "@/features/deliveries/queries";
import { TodaySheet } from "@/features/deliveries/components/today-sheet";

export default async function HawkerTodayPage({ searchParams }: { searchParams: Promise<{ shift?: string }> }) {
  await requireRole(["hawker"]);
  const dateKey = todayKey();
  const shift = (await searchParams).shift === "evening" ? "evening" : "morning";
  const sheet = await getTodaySheet({ dateKey, shift });
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Today</p>
        <h1 className="text-3xl font-semibold tracking-tight">{formatDateLabel(dateKey)}</h1>
      </div>
      <div className="flex gap-2"><a href="/hawker/today" className={`rounded-md px-3 py-2 text-sm ${shift === "morning" ? "bg-primary text-primary-foreground" : "border"}`}>Morning</a><a href="/hawker/today?shift=evening" className={`rounded-md px-3 py-2 text-sm ${shift === "evening" ? "bg-primary text-primary-foreground" : "border"}`}>Evening</a></div>
      <TodaySheet dateKey={dateKey} shift={shift} rows={sheet.rows} progress={sheet.progress} />
    </section>
  );
}
