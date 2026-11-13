import { requireRole } from "@/lib/dal";
import { formatDateLabel, isValidDateKey, todayKey } from "@/lib/dates";
import { getTodaySheet } from "@/features/deliveries/queries";
import { TodaySheet } from "@/features/deliveries/components/today-sheet";
import { NewCustomerInquiryForm } from "@/features/inquiries/components/new-customer-inquiry-form";
import { getHawkerLeaves } from "@/features/leave/queries";
import { LeaveRequestForm } from "@/features/leave/components/leave-request-form";

export default async function HawkerTodayPage({ searchParams }: { searchParams: Promise<{ shift?: string; date?: string }> }) {
  await requireRole(["hawker"]);
  const params = await searchParams;
  const today = todayKey();
  const dateKey = params.date && isValidDateKey(params.date) && params.date <= today ? params.date : today;
  const shift = params.shift === "evening" ? "evening" : "morning";
  const sheet = await getTodaySheet({ dateKey, shift });
  const leaves = await getHawkerLeaves();
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Today’s route</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">{formatDateLabel(dateKey)}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Mark each delivery as you go. You can correct today and the previous two days.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><form action="/hawker/today" className="flex flex-wrap gap-2"><input type="date" name="date" max={today} defaultValue={dateKey} className="rounded-lg border bg-card px-3 py-2 text-sm" /><input type="hidden" name="shift" value={shift} /><button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Load date</button></form><div className="flex w-fit gap-1 rounded-xl bg-muted p-1"><a href={`/hawker/today?date=${dateKey}`} className={`rounded-lg px-4 py-2 text-sm font-medium ${shift === "morning" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Morning</a><a href={`/hawker/today?date=${dateKey}&shift=evening`} className={`rounded-lg px-4 py-2 text-sm font-medium ${shift === "evening" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Evening</a></div></div>
      <TodaySheet dateKey={dateKey} shift={shift} rows={sheet.rows} progress={sheet.progress} />
      <NewCustomerInquiryForm />
      <LeaveRequestForm leaves={leaves} />
    </section>
  );
}
