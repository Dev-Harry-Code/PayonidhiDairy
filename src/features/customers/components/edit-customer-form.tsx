"use client";

import { useState } from "react";
import { updateCustomerAction } from "@/features/customers/actions";
import { effectiveRatePaise } from "@/lib/units";

type Customer = { id: string; name: string; phone: string | null; address: string; area: string | null; notes: string | null; hawkerId: string; morningQtyMl: number; eveningQtyMl: number; ratePaise: number | null; startDate: string; endDate: string | null; active: boolean };

export function EditCustomerForm({ customer, hawkers }: { customer: Customer; hawkers: Array<{ id: string; name: string }> }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const result = await updateCustomerAction(Object.fromEntries(new FormData(event.currentTarget).entries()));
    setPending(false);
    setMessage(result.ok ? "Customer details saved." : result.error.message);
    if (result.ok) window.location.reload();
  }

  return <form onSubmit={submit} className="grid gap-3 rounded-xl border bg-card p-5 shadow-sm md:grid-cols-2">
    <input type="hidden" name="id" value={customer.id} />
    <input type="hidden" name="active" value="false" />
    <div><label className="mb-1 block text-sm font-medium">Customer name</label><input name="name" required defaultValue={customer.name} className="w-full rounded-md border px-3 py-2" /></div>
    <div><label className="mb-1 block text-sm font-medium">Phone</label><input name="phone" defaultValue={customer.phone ?? ""} className="w-full rounded-md border px-3 py-2" /></div>
    <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium">Address</label><input name="address" required defaultValue={customer.address} className="w-full rounded-md border px-3 py-2" /></div>
    <div><label className="mb-1 block text-sm font-medium">Area</label><input name="area" defaultValue={customer.area ?? ""} className="w-full rounded-md border px-3 py-2" /></div>
    <div><label className="mb-1 block text-sm font-medium">Hawker</label><select name="hawkerId" required defaultValue={customer.hawkerId} className="w-full rounded-md border px-3 py-2">{hawkers.map((hawker) => <option key={hawker.id} value={hawker.id}>{hawker.name}</option>)}</select></div>
    <div><label className="mb-1 block text-sm font-medium">Morning demand (ml)</label><input name="morningQtyMl" type="number" min="0" required defaultValue={customer.morningQtyMl} className="w-full rounded-md border px-3 py-2" /></div>
    <div><label className="mb-1 block text-sm font-medium">Evening demand (ml)</label><input name="eveningQtyMl" type="number" min="0" required defaultValue={customer.eveningQtyMl} className="w-full rounded-md border px-3 py-2" /></div>
    <div><label className="mb-1 block text-sm font-medium">Rate per litre (₹)</label><input name="rateRupees" type="number" min="0" step="0.01" defaultValue={customer.ratePaise === null ? "" : effectiveRatePaise(customer.ratePaise, 0) / 100} className="w-full rounded-md border px-3 py-2" /><p className="mt-1 text-xs text-muted-foreground">Enter the price for 1 litre. New accounts default to ₹65.</p></div>
    <div><label className="mb-1 block text-sm font-medium">Start date</label><input name="startDate" type="date" required defaultValue={customer.startDate} className="w-full rounded-md border px-3 py-2" /></div>
    <div><label className="mb-1 block text-sm font-medium">End date</label><input name="endDate" type="date" defaultValue={customer.endDate ?? ""} className="w-full rounded-md border px-3 py-2" /></div>
    <div className="flex items-center gap-2 self-end rounded-md border px-3 py-2"><input id="customer-active" name="active" type="checkbox" value="true" defaultChecked={customer.active} className="h-4 w-4" /><label htmlFor="customer-active" className="text-sm font-medium">Active customer</label></div>
    <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium">Notes</label><textarea name="notes" defaultValue={customer.notes ?? ""} rows={3} className="w-full rounded-md border px-3 py-2" /></div>
    <button disabled={pending} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60 md:col-span-2">{pending ? "Saving…" : "Save customer details"}</button>
    {message && <p className="text-sm text-muted-foreground md:col-span-2">{message}</p>}
  </form>;
}
