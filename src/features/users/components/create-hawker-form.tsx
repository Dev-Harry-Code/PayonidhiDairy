"use client";

import { useState } from "react";
import { createHawkerAction } from "@/features/users/actions";

export function CreateHawkerForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const result = await createHawkerAction(Object.fromEntries(new FormData(event.currentTarget).entries()));
    setPending(false);
    setMessage(result.ok ? "Hawker created." : result.error.message);
    if (result.ok) event.currentTarget.reset();
  }
  return <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4">
    <input name="name" required minLength={2} placeholder="Name" className="rounded-md border px-3 py-2" />
    <input name="phone" required placeholder="Phone" className="rounded-md border px-3 py-2" />
    <input name="pin" required minLength={6} maxLength={8} pattern="[0-9]{6,8}" inputMode="numeric" placeholder="PIN (6–8 digits)" className="rounded-md border px-3 py-2" />
    <button disabled={pending} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60">{pending ? "Saving…" : "Add hawker"}</button>
    {message && <p className="text-sm text-muted-foreground md:col-span-4">{message}</p>}
  </form>;
}
