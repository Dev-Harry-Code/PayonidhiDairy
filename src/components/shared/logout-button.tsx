"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

export function LogoutButton({ label = "Log out" }: { label?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await logoutAction();
        router.replace("/login");
        router.refresh();
      }}
    >
      {label}
    </Button>
  );
}
