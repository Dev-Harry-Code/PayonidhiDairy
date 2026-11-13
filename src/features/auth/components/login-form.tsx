"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/features/auth/actions";

export function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await loginAction({ phone, pin });
    setPending(false);
    if (!result.ok) {
      setError(result.error.code === "LOCKED" ? "Your account is temporarily locked." : "Wrong phone or PIN.");
      return;
    }
    router.replace(result.data.role === "admin" ? "/admin" : "/hawker/today");
    router.refresh();
  }

  return (
    <Card className="w-full border-border/80 shadow-[0_20px_60px_rgba(23,53,45,0.10)]">
      <CardHeader className="border-b border-border/70 bg-card px-6 py-6">
        <CardTitle className="text-2xl tracking-tight">Welcome back</CardTitle>
        <p className="text-sm text-muted-foreground">Sign in to manage today’s milk deliveries.</p>
      </CardHeader>
      <CardContent className="px-6 py-6">
        <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input id="pin" type="password" inputMode="numeric" autoComplete="current-password" minLength={4} maxLength={8} value={pin} onChange={(event) => setPin(event.target.value)} required />
          </div>
          {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
          <Button className="min-h-12 w-full" type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
