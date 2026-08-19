"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function LogOutButton(): React.ReactElement {
  const router = useRouter();
  const [busy, setBusy] = useState<boolean>(false);

  async function handleSignOut(): Promise<void> {
    setBusy(true);
    try {
      await fetch("/api/sign-out", { method: "POST" });
      router.push("/sign-in");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={busy}
          aria-label="Sign out"
          className="size-8 p-0"
        >
          {busy ? <Spinner /> : <LogOut />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Sign out</TooltipContent>
    </Tooltip>
  );
}
