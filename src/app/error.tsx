"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-background p-6"><div className="max-w-md space-y-4 text-center"><p className="text-sm font-medium text-primary">Payonidhi Dairy</p><h1 className="text-2xl font-semibold">Something went wrong</h1><p className="text-sm text-muted-foreground">Please try again. If the problem continues, contact the administrator.</p><button onClick={() => reset()} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Try again</button></div></main>;
}
