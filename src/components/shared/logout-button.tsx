"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await logoutAction();
        router.replace("/login");
        router.refresh();
      }}
    >
      Log out
    </Button>
  );
}
