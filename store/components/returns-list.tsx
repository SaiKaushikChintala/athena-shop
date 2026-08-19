"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { FormError } from "@/components/form-error";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { type ReturnStatus, type SellerReturn } from "@/types";

type Decision = Exclude<ReturnStatus, "PENDING">;

const STATUS_LABEL: Record<ReturnStatus, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REFUNDED: "Refunded",
};

const STATUS_CLASS: Record<ReturnStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  APPROVED: "bg-info/10 text-info",
  REJECTED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-success/12 text-success",
};

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

type ActionButtonProps = {
  disabled: boolean;
  working: boolean;
  onClick: () => void;
};

function ActionButton({
  disabled,
  working,
  onClick,
  variant,
  children,
}: ActionButtonProps & { variant?: "outline"; children: React.ReactNode }): React.ReactElement {
  return (
    <Button variant={variant} size="sm" disabled={disabled} onClick={onClick}>
      {working && <Spinner data-icon="inline-start" />}
      {children}
    </Button>
  );
}

export function ReturnsList({ returns }: { returns: SellerReturn[] }): React.ReactElement {
  const router = useRouter();
  const [busy, setBusy] = useState<{ id: string; status: Decision } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, status: Decision): Promise<void> {
    setBusy({ id, status });
    setError(null);
    try {
      const res = await fetch(`/api/returns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setError(data.message ?? "Could not update that return.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  function actionProps(id: string, status: Decision): ActionButtonProps {
    return {
      disabled: busy !== null,
      working: busy?.id === id && busy.status === status,
      onClick: () => act(id, status),
    };
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <FormError>{error}</FormError>}

      {returns.map((r) => (
        <div key={r.id} className="flex flex-col gap-4 rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-foreground">#{r.orderNumber}</span>
                <Badge className={cn("border-transparent", STATUS_CLASS[r.status])}>{STATUS_LABEL[r.status]}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {r.customerName} · {dateFormat.format(new Date(r.createdAt))}
              </p>
            </div>

            <Button variant="ghost" size="sm" asChild className="shrink-0 text-muted-foreground hover:text-foreground">
              <Link href={`/orders/${r.orderId}`}>
                <ExternalLink data-icon="inline-start" />
                Order
              </Link>
            </Button>
          </div>

          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="eyebrow mb-1">Reason</p>
            <p className="text-sm text-foreground">{r.reason}</p>
          </div>

          <div className="flex flex-col gap-1">
            {r.items.map((item) => (
              <div key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-foreground">
                  {item.productName}
                  {item.variantLabel && <span className="ml-1.5 text-xs text-muted-foreground">{item.variantLabel}</span>}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">×{item.quantity}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <span className="text-muted-foreground">{r.status === "REFUNDED" ? "Refunded" : "Full refund"}</span>{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {formatMoney(r.refundAmount ?? r.eligibleTotal)}
              </span>
            </div>

            {r.status === "PENDING" && (
              <div className="flex items-center gap-2">
                <ActionButton {...actionProps(r.id, "REJECTED")} variant="outline">
                  Reject
                </ActionButton>
                <ActionButton {...actionProps(r.id, "APPROVED")}>Approve</ActionButton>
              </div>
            )}

            {r.status === "APPROVED" && (
              <ActionButton {...actionProps(r.id, "REFUNDED")}>Mark refunded</ActionButton>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
