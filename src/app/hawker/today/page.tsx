import { requireRole } from "@/lib/dal";
import { formatDateLabel, isValidDateKey, todayKey } from "@/lib/dates";
import { getTodaySheet } from "@/features/deliveries/queries";
import { TodaySheet } from "@/features/deliveries/components/today-sheet";
import { NewCustomerInquiryForm } from "@/features/inquiries/components/new-customer-inquiry-form";
import { getHawkerLeaves } from "@/features/leave/queries";
import { LeaveRequestForm } from "@/features/leave/components/leave-request-form";
import { t, type Language } from "@/lib/i18n";

export default async function HawkerTodayPage({ searchParams }: { searchParams: Promise<{ shift?: string; date?: string }> }) {
  const session = await requireRole(["hawker"]);
  const language: Language = session.preferredLanguage === "hi" ? "hi" : "en";
  const params = await searchParams;
  const today = todayKey();
  const dateKey = params.date && isValidDateKey(params.date) && params.date <= today ? params.date : today;
  const shift = params.shift === "evening" ? "evening" : "morning";
  const sheet = await getTodaySheet({ dateKey, shift });
  const leaves = await getHawkerLeaves();
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t(language, "todaysRoute")}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">{formatDateLabel(dateKey)}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t(language, "markAsYouGo")}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><form action="/hawker/today" className="flex flex-wrap gap-2"><input type="date" name="date" max={today} defaultValue={dateKey} className="rounded-lg border bg-card px-3 py-2 text-sm" /><input type="hidden" name="shift" value={shift} /><button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">{t(language, "loadDate")}</button></form><div className="flex w-fit gap-1 rounded-xl bg-muted p-1"><a href={`/hawker/today?date=${dateKey}`} className={`rounded-lg px-4 py-2 text-sm font-medium ${shift === "morning" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{t(language, "morning")}</a><a href={`/hawker/today?date=${dateKey}&shift=evening`} className={`rounded-lg px-4 py-2 text-sm font-medium ${shift === "evening" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{t(language, "evening")}</a></div></div>
      <TodaySheet dateKey={dateKey} shift={shift} rows={sheet.rows} progress={sheet.progress} language={language} />
      <NewCustomerInquiryForm language={language} />
      <LeaveRequestForm leaves={leaves} language={language} />
    </section>
  );
}
