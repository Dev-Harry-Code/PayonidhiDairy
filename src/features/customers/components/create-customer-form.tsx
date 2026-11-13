"use client";

import { useState } from "react";
import { createCustomerAction } from "@/features/customers/actions";

export function CreateCustomerForm({ hawkers }: { hawkers: Array<{ id: string; name: string }> }) {
  const [message, setMessage] = useState(""); const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    values.morningQtyMl = String(Number(values.morningQtyMl) * 1000);
    values.eveningQtyMl = String(Number(values.eveningQtyMl) * 1000);
    const result = await createCustomerAction(values);
    setPending(false); setMessage(result.ok ? "Customer created." : result.error.message);
    if (result.ok) event.currentTarget.reset();
  }
  return <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-2">
    <input name="name" required placeholder="Customer name" className="rounded-md border px-3 py-2" />
    <input name="nameHi" placeholder="Customer name in Hindi (optional)" className="rounded-md border px-3 py-2" />
    <input name="phone" placeholder="Phone (optional)" className="rounded-md border px-3 py-2" />
    <input name="address" required placeholder="Address" className="rounded-md border px-3 py-2 md:col-span-2" />
    <input name="area" placeholder="Area (optional)" className="rounded-md border px-3 py-2" />
    <select name="hawkerId" required className="rounded-md border px-3 py-2"><option value="">Assign hawker</option>{hawkers.map((hawker) => <option key={hawker.id} value={hawker.id}>{hawker.name}</option>)}</select>
    <label className="text-sm">Morning bottles (1 L each)<input name="morningQtyMl" type="number" min="0" defaultValue="0" required placeholder="Morning bottles" className="mt-1 w-full rounded-md border px-3 py-2" /></label>
    <label className="text-sm">Evening bottles (1 L each)<input name="eveningQtyMl" type="number" min="0" defaultValue="0" required placeholder="Evening bottles" className="mt-1 w-full rounded-md border px-3 py-2" /></label>
    <input name="rateRupees" type="number" min="0" step="0.01" placeholder="Rate per litre (default ₹65)" className="rounded-md border px-3 py-2" />
    <input name="startDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-md border px-3 py-2" />
    <button disabled={pending} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60 md:col-span-2">{pending ? "Saving…" : "Add customer"}</button>
    {message && <p className="text-sm text-muted-foreground md:col-span-2">{message}</p>}
  </form>;
}
