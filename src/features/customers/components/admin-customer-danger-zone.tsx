"use client";
import { useState } from "react";
import { deleteCustomerRecordsAction, removeCustomerAction } from "@/features/customers/actions";

export function AdminCustomerDangerZone({ customerId, customerName }: { customerId: string; customerName: string }) {
  const [message, setMessage] = useState("");
  return <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5"><h2 className="font-semibold text-red-900">Admin-only removal controls</h2><p className="mt-1 text-sm text-red-800/80">These actions are permanent for delivery history. Customer removal keeps the profile for reference.</p><div className="mt-4 flex flex-wrap gap-3"><button onClick={async () => { if (!window.confirm(`Remove ${customerName} from active customers?`)) return; const result = await removeCustomerAction({ id: customerId }); setMessage(result.ok ? "Customer removed." : "Could not remove customer."); }} className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700">Remove customer</button><button onClick={async () => { if (!window.confirm(`Delete every delivery record for ${customerName}? This cannot be undone.`)) return; const result = await deleteCustomerRecordsAction({ id: customerId }); setMessage(result.ok ? `${result.data.count} delivery records deleted.` : "Could not delete records."); }} className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white">Delete delivery records</button></div>{message && <p className="mt-3 text-sm font-medium text-red-800">{message}</p>}</section>;
}
