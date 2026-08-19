"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatusBadge } from "@/components/status-badge";
import { ORDER_STATUS_LABELS, asOrderStatus } from "@/lib/order-status";
import { isFinal, nextStatuses } from "@/lib/fulfilment";
import { type OrderStatus } from "@/types";

type Props = {
  orderId: string;
  itemId: string;
  current: OrderStatus;
};

function buttonLabel(busy: boolean, status: OrderStatus): string {
  if (busy) return "Saving";
  return status === "CANCELLED" ? "Cancel item" : "Update";
}

export function ItemStatusEditor({ orderId, itemId, current }: Props): React.ReactElement {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(current);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (isFinal(current)) return <OrderStatusBadge status={current} />;

  async function save(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setError(data.message ?? "Could not update this item. Try again.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={(value) => setStatus(asOrderStatus(value))} disabled={busy}>
          <SelectTrigger aria-label="Item status" size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {[current, ...nextStatuses(current)].map((value) => (
                <SelectItem key={value} value={value}>
                  {ORDER_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {status !== current && (
          <Button size="sm" onClick={save} disabled={busy}>
            {busy && <Spinner data-icon="inline-start" />}
            {buttonLabel(busy, status)}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
