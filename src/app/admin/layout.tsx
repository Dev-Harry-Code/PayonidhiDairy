import type { ReactNode } from "react";
import { requireRole } from "@/lib/dal";
import { LogoutButton } from "@/components/shared/logout-button";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(["admin"]);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
            <div>
            <p className="font-semibold">Payonidhi Dairy</p>
            <p className="text-sm text-muted-foreground">Admin · {session.name}</p>
            </div>
            <nav className="hidden gap-3 text-sm md:flex"><Link href="/admin">Overview</Link><Link href="/admin/hawkers">Hawkers</Link><Link href="/admin/customers">Customers</Link></nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
    </div>
  );
}
