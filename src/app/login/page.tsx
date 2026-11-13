import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-5 md:p-8">
      <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-[-10rem] right-[-5rem] h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="mb-7 text-center"><span className="brand-mark mx-auto mb-4">P</span><p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Fresh routes. Reliable records.</p></div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-muted-foreground">A simple daily register for your dairy team.</p>
      </div>
    </main>
  );
}
