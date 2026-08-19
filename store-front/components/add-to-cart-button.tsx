"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  variantId: string;
  inStock: boolean;
};

export function AddToCartButton({ variantId, inStock }: Props): React.ReactElement {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "added">("idle");

  async function addToCart(): Promise<void> {
    setState("loading");
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity: 1 }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(data.message ?? "Could not add that to your cart.");
        setState("idle");
        return;
      }

      setState("added");
      toast.success("Added to cart", {
        action: { label: "View cart", onClick: () => router.push("/cart") },
      });
      router.refresh();
      setTimeout(() => setState("idle"), 1800);
    } catch {
      toast.error("Something went wrong. Try again.");
      setState("idle");
    }
  }

  if (!inStock) {
    return (
      <Button disabled size="lg" className="h-12 w-full rounded-full text-base">
        Out of stock
      </Button>
    );
  }

  return (
    <Button
      onClick={addToCart}
      disabled={state !== "idle"}
      size="lg"
      className="h-12 w-full rounded-full text-base shadow-lg shadow-primary/20"
    >
      {state === "loading" && <Spinner data-icon="inline-start" />}
      {state === "added" && <ShoppingBag data-icon="inline-start" />}
      {state === "loading" ? "Adding…" : state === "added" ? "Added to cart" : "Add to cart"}
    </Button>
  );
}
