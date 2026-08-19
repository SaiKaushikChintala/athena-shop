"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function SignOutButton(): React.ReactElement {
  const router = useRouter();

  async function signOut(): Promise<void> {
    await fetch("/api/sign-out", { method: "POST" });
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" className="w-full" onClick={signOut}>
      Sign out
    </Button>
  );
}
