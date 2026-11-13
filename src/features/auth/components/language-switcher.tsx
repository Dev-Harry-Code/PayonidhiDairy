"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLanguageAction } from "@/features/auth/actions";
import type { Language } from "@/lib/i18n";

export function LanguageSwitcher({ language }: { language: Language }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function select(lang: Language) { if (lang === language) return; startTransition(async () => { await setLanguageAction({ lang }); router.refresh(); }); }
  return <div className="flex items-center rounded-lg border bg-card p-0.5 text-xs" aria-label="Language"><button type="button" disabled={pending} onClick={() => select("en")} className={`rounded-md px-2 py-1 ${language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>English</button><button type="button" disabled={pending} onClick={() => select("hi")} className={`rounded-md px-2 py-1 ${language === "hi" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>हिन्दी</button></div>;
}
