"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ItemReturn = {
  id: string;
  reason: string;
  status: string;
  quantity: number;
  createdAt: string;
};

type ReturnItem = {
  id: string;
  status: string;
  quantity: number;
  returnable: number;
  name: string;
  slug: string;
  image: string;
  label: string;
  returns: ItemReturn[];
};

type Props = {
  orderId: string;
  items: ReturnItem[];
};

type RowProps = {
  orderId: string;
  item: ReturnItem;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const MIN_REASON = 10;

const RETURN_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REFUNDED: "Refunded",
};

const RETURN_STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  APPROVED: "bg-info/10 text-info",
  REJECTED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-success/12 text-success",
};

const stepButton =
  "flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function ReturnRequestSection({ orderId, items }: Props): React.ReactNode {
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const delivered = items.filter((item) => item.status === "DELIVERED");
  if (delivered.length === 0) return null;

  return (
    <div className="rounded-xl border p-5">
      <p className="eyebrow mb-1">Returns</p>
      <p className="mb-4 text-sm text-muted-foreground">
        Return any item on its own. Pick how many units and tell us why.
      </p>

      <div className="flex flex-col divide-y">
        {delivered.map((item) => (
          <ReturnItemRow
            key={item.id}
            orderId={orderId}
            item={item}
            open={openItemId === item.id}
            onOpen={() => setOpenItemId(item.id)}
            onClose={() => setOpenItemId(null)}
          />
        ))}
      </div>
    </div>
  );
}

function ReturnItemRow({ orderId, item, open, onOpen, onClose }: RowProps): React.ReactElement {
  const router = useRouter();
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const reasonLength = reason.trim().length;
  const fieldId = `return-reason-${item.id}`;

  function close(): void {
    setError(null);
    setReason("");
    setQuantity(1);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (reasonLength < MIN_REASON) {
      setError(`Please describe the reason (at least ${MIN_REASON} characters).`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderItemId: item.id, quantity, reason: reason.trim() }),
      });

      if (res.ok) {
        close();
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setError(data.message ?? "Something went wrong.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <Link
            href={`/products/${item.slug}`}
            className="block truncate text-sm font-medium text-foreground hover:underline"
          >
            {item.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {item.label ? `${item.label} · ` : ""}Qty {item.quantity}
          </p>
        </div>

        {item.returnable === 0 ? (
          <span className="shrink-0 text-xs text-muted-foreground">Returned</span>
        ) : (
          !open && (
            <Button variant="outline" size="sm" className="shrink-0" onClick={onOpen}>
              Return
            </Button>
          )
        )}
      </div>

      {item.returns.length > 0 && (
        <ul className="flex flex-col gap-2">
          {item.returns.map((r) => (
            <li key={r.id} className="rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {r.quantity} unit{r.quantity === 1 ? "" : "s"} · {dateFormat.format(new Date(r.createdAt))}
                </p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    RETURN_STATUS_CLASS[r.status] ?? RETURN_STATUS_CLASS.PENDING,
                  )}
                >
                  {RETURN_STATUS_LABEL[r.status] ?? r.status}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-foreground">{r.reason}</p>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border p-4">
          {item.returnable > 1 && (
            <Field orientation="horizontal" className="items-center justify-between">
              <FieldLabel>Units to return</FieldLabel>
              <div className="flex items-center rounded-lg border">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className={stepButton}
                  aria-label="Fewer units"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(item.returnable, q + 1))}
                  disabled={quantity >= item.returnable}
                  className={stepButton}
                  aria-label="More units"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </Field>
          )}

          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor={fieldId}>Reason for return</FieldLabel>
            <textarea
              id={fieldId}
              rows={3}
              placeholder="What's wrong with this item?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-invalid={Boolean(error)}
              className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring aria-invalid:border-destructive"
            />
            {error ? (
              <FieldError>{error}</FieldError>
            ) : (
              <p className="text-xs tabular-nums text-muted-foreground">
                {reasonLength < MIN_REASON
                  ? `At least ${MIN_REASON} characters (${reasonLength}/${MIN_REASON})`
                  : "Looks good."}
              </p>
            )}
          </Field>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting || reasonLength < MIN_REASON}>
              {submitting && <Spinner data-icon="inline-start" />}
              {submitting ? "Submitting" : "Submit return"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={close}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
