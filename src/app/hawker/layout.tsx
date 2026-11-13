import type { ReactNode } from "react";
import { requireRole } from "@/lib/dal";
import { LogoutButton } from "@/components/shared/logout-button";
import Link from "next/link";

export default async function HawkerLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(["hawker"]);
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-card/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-[4.5rem] max-w-3xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <span className="brand-mark">P</span>
            <div>
              <p className="font-semibold tracking-tight">Payonidhi Dairy</p>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Delivery route</p>
            </div>
            <nav className="ml-3 flex items-center gap-1 rounded-xl bg-muted/70 p-1 text-sm">
              <Link className="rounded-lg px-3 py-2 font-medium text-muted-foreground hover:bg-card hover:text-foreground" href="/hawker/today">Today</Link><Link className="rounded-lg px-3 py-2 font-medium text-muted-foreground hover:bg-card hover:text-foreground" href="/hawker/customers">Customers</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-muted-foreground sm:inline">{session.name}</span><LogoutButton /></div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-7 md:py-10">{children}</main>
    </div>
  );
}
