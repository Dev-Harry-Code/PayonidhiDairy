"use client";

import { useState } from "react";
import { setHawkerActiveAction, updateHawkerAction } from "@/features/users/actions";

export function EditHawkerForm({ hawker }: { hawker: { id: string; name: string; phone: string; active: boolean } }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const result = await updateHawkerAction(Object.fromEntries(new FormData(event.currentTarget).entries()));
    setPending(false); setMessage(result.ok ? "Saved" : result.error.message);
  }
  async function toggle() {
    setPending(true); setMessage("");
    const result = await setHawkerActiveAction({ id: hawker.id, active: !hawker.active });
    setPending(false); setMessage(result.ok ? (hawker.active ? "Hawker deactivated" : "Hawker activated") : result.error.message);
    if (result.ok) window.location.reload();
  }
  return <form onSubmit={save} className="grid gap-2 rounded-lg bg-muted/30 p-3 md:grid-cols-[1fr_1fr_auto_auto]"><input type="hidden" name="id" value={hawker.id} /><input name="name" required defaultValue={hawker.name} className="rounded-md border bg-card px-3 py-2" /><input name="phone" required defaultValue={hawker.phone} className="rounded-md border bg-card px-3 py-2" /><button disabled={pending} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60">{pending ? "Saving…" : "Save"}</button><button type="button" disabled={pending} onClick={toggle} className="rounded-md border px-4 py-2 disabled:opacity-60">{hawker.active ? "Deactivate" : "Activate"}</button>{message && <p className="text-xs text-muted-foreground md:col-span-4">{message}</p>}</form>;
}
