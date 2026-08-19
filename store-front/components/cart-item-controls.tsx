"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Minus, Plus, X } from "lucide-react";

import { formatMoney } from "@/lib/format";

type CartItem = {
  variantId: string;
  quantity: number;
  price: number;
  discount: number | null;
  coverImage: string;
  productName: string;
  productSlug: string;
  variantLabel: string;
};

const stepButton =
  "flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50";

export function CartItemControls({ item }: { item: CartItem }): React.ReactElement {
  const router = useRouter();
  const [busy, setBusy] = useState<boolean>(false);
  const unitPrice = item.discount ?? item.price;

  async function update(quantity: number): Promise<void> {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/cart/items/${item.variantId}`,
        quantity === 0
          ? { method: "DELETE" }
          : {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ quantity }),
            },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(data.message ?? "Could not update your cart.");
        return;
      }
      if (quantity === 0) toast.success(`Removed ${item.productName}`);
      router.refresh();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
      <Link href={`/products/${item.productSlug}`} className="shrink-0">
        <div className="relative size-20 overflow-hidden rounded-lg bg-muted sm:size-24">
          <Image src={item.coverImage} alt={item.productName} fill sizes="96px" className="object-cover" />
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/products/${item.productSlug}`}
            className="block truncate text-sm font-medium text-foreground hover:underline"
          >
            {item.productName}
          </Link>
          {item.variantLabel && <p className="mt-1 text-xs text-muted-foreground">{item.variantLabel}</p>}
        </div>

        <div className="flex w-fit items-center rounded-lg border">
          <button
            onClick={() => update(item.quantity - 1)}
            disabled={busy}
            className={stepButton}
            aria-label="Decrease quantity"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
          <button
            onClick={() => update(item.quantity + 1)}
            disabled={busy}
            className={stepButton}
            aria-label="Increase quantity"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between">
        <button
          onClick={() => update(0)}
          disabled={busy}
          className="-mr-1.5 -mt-1.5 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-50"
          aria-label="Remove item"
        >
          <X className="size-4" />
        </button>

        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {formatMoney(unitPrice * item.quantity)}
          </p>
          {item.discount !== null && (
            <p className="text-xs tabular-nums text-muted-foreground line-through">
              {formatMoney(item.price * item.quantity)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
