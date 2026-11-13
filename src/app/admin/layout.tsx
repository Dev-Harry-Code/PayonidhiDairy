import type { ReactNode } from "react";
import { requireRole } from "@/lib/dal";
import { LogoutButton } from "@/components/shared/logout-button";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(["admin"]);
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-card/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="brand-mark">P</span>
            <div>
              <p className="font-semibold tracking-tight">Payonidhi Dairy</p>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Admin workspace</p>
            </div>
            <nav className="ml-5 hidden items-center gap-1 rounded-xl bg-muted/70 p-1 text-sm md:flex">
              <Link className="rounded-lg px-3 py-2 font-medium text-muted-foreground hover:bg-card hover:text-foreground" href="/admin">Overview</Link>
              <Link className="rounded-lg px-3 py-2 font-medium text-muted-foreground hover:bg-card hover:text-foreground" href="/admin/hawkers">Hawkers</Link>
              <Link className="rounded-lg px-3 py-2 font-medium text-muted-foreground hover:bg-card hover:text-foreground" href="/admin/customers">Customers</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-muted-foreground sm:inline">Hi, {session.name}</span><LogoutButton /></div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-7 md:px-6 md:py-10">{children}</main>
    </div>
  );
}
