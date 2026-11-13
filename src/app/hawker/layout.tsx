import type { ReactNode } from "react";
import { requireRole } from "@/lib/dal";
import { LogoutButton } from "@/components/shared/logout-button";
import Link from "next/link";

export default async function HawkerLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(["hawker"]);
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-card/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-[4.5rem] max-w-3xl flex-wrap items-center justify-between gap-3 px-3 py-2 sm:flex-nowrap sm:gap-4 sm:px-4 sm:py-0">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="brand-mark">P</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight sm:text-base">Payonidhi Dairy</p>
              <p className="hidden text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground sm:block">Delivery route</p>
            </div>
            <nav className="ml-1 flex shrink-0 items-center gap-0.5 rounded-xl bg-muted/70 p-1 text-xs sm:ml-3 sm:gap-1 sm:text-sm">
              <Link className="rounded-lg px-2.5 py-2 font-medium text-muted-foreground hover:bg-card hover:text-foreground sm:px-3" href="/hawker/today">Today</Link><Link className="rounded-lg px-2.5 py-2 font-medium text-muted-foreground hover:bg-card hover:text-foreground sm:px-3" href="/hawker/customers">Customers</Link>
            </nav>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3"><span className="hidden max-w-28 truncate text-sm text-muted-foreground sm:inline">{session.name}</span><LogoutButton /></div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-7 md:py-10">{children}</main>
    </div>
  );
}
