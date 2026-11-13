"use client";

import { useState } from "react";
import { updateHawkerAction } from "@/features/users/actions";

export function EditHawkerForm({ hawker }: { hawker: { id: string; name: string; phone: string; active: boolean } }) {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const result = await updateHawkerAction(Object.fromEntries(new FormData(event.currentTarget).entries()));
    setPending(false);
    if (result.ok) {
      setEditing(false);
      setMessage("Saved");
      window.location.reload();
    } else {
      setMessage(result.error.message);
    }
  }

  return <>
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-3"><div><p className="font-medium">{hawker.name}</p><p className="text-sm text-muted-foreground">{hawker.phone}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${hawker.active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>{hawker.active ? "Active" : "Inactive"}</span><button type="button" onClick={() => setEditing((value) => !value)} className="rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">{editing ? "Cancel" : "Edit"}</button></div></div>
    {editing && <form onSubmit={save} className="mt-2 grid gap-2 rounded-lg bg-muted/30 p-3 md:grid-cols-[1fr_1fr_auto]"><input type="hidden" name="id" value={hawker.id} /><input name="name" required defaultValue={hawker.name} className="rounded-md border bg-card px-3 py-2" /><input name="phone" required defaultValue={hawker.phone} className="rounded-md border bg-card px-3 py-2" /><button disabled={pending} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60">{pending ? "Saving…" : "Save changes"}</button>{message && <p className="text-xs text-muted-foreground md:col-span-3">{message}</p>}</form>}
  </>;
}
