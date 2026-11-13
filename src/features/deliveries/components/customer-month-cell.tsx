"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markDeliveryAction, unmarkDeliveryAction } from "@/features/deliveries/actions";
import { formatTime12 } from "@/lib/dates";
import { formatLitres } from "@/lib/units";

export function CustomerMonthCell({ customerId, dateKey, shift, state, qtyMl, markedAt, className }: { customerId: string; dateKey: string; shift: "morning" | "evening"; state: string; qtyMl: number; markedAt: string | null; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const scheduled = state !== "not_scheduled" && state !== "future";
  const save = (status: "delivered" | "not_delivered") => startTransition(async () => { const result = await markDeliveryAction({ customerId, dateKey, shift, status, quantityMl: status === "delivered" ? qtyMl : 0, ...(status === "not_delivered" ? { reason: "other", note: "Admin correction" } : {}) }); if (result.ok) router.refresh(); });
  const undo = () => startTransition(async () => { const result = await unmarkDeliveryAction({ customerId, dateKey, shift }); if (result.ok) router.refresh(); });
  if (!scheduled) return <span title={`${state} · ${formatLitres(qtyMl)}`} className={className}>—</span>;
  return <span className={`inline-flex items-center gap-1 ${className ?? ""}`}><button type="button" disabled={pending} onClick={() => save("delivered")} title="Mark delivered" className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-semibold transition-colors disabled:opacity-50 ${state === "delivered" ? "bg-green-100 text-green-800 ring-2 ring-green-300" : "bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-800"}`}>✓</button><button type="button" disabled={pending} onClick={() => save("not_delivered")} title="Mark not delivered" className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-semibold transition-colors disabled:opacity-50 ${state === "not_delivered" ? "bg-red-100 text-red-800 ring-2 ring-red-300" : "bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-800"}`}>×</button>{state !== "unmarked" && <button type="button" disabled={pending} onClick={undo} title="Undo mark" className="text-xs text-muted-foreground underline">Undo</button>}{markedAt && <small className="ml-1 text-xs text-muted-foreground">{formatTime12(markedAt)}</small>}</span>;
}
