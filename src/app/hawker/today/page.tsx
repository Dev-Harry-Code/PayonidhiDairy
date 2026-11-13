import { requireRole } from "@/lib/dal";
import { formatDateLabel, todayKey } from "@/lib/dates";
import { getTodaySheet } from "@/features/deliveries/queries";
import { TodaySheet } from "@/features/deliveries/components/today-sheet";
import { NewCustomerInquiryForm } from "@/features/inquiries/components/new-customer-inquiry-form";
import { getHawkerLeaves } from "@/features/leave/queries";
import { LeaveRequestForm } from "@/features/leave/components/leave-request-form";

export default async function HawkerTodayPage({ searchParams }: { searchParams: Promise<{ shift?: string }> }) {
  await requireRole(["hawker"]);
  const dateKey = todayKey();
  const shift = (await searchParams).shift === "evening" ? "evening" : "morning";
  const sheet = await getTodaySheet({ dateKey, shift });
  const leaves = await getHawkerLeaves();
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Today’s route</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">{formatDateLabel(dateKey)}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Mark each delivery as you go. Your progress is saved instantly.</p>
      </div>
      <div className="flex w-fit gap-1 rounded-xl bg-muted p-1"><a href="/hawker/today" className={`rounded-lg px-4 py-2 text-sm font-medium ${shift === "morning" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Morning</a><a href="/hawker/today?shift=evening" className={`rounded-lg px-4 py-2 text-sm font-medium ${shift === "evening" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Evening</a></div>
      <TodaySheet dateKey={dateKey} shift={shift} rows={sheet.rows} progress={sheet.progress} />
      <NewCustomerInquiryForm />
      <LeaveRequestForm leaves={leaves} />
    </section>
  );
}
