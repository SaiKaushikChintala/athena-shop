"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table";
import { FormError } from "@/components/form-error";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { type SellerCoupon } from "@/types";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function statusTooltip(expired: boolean, live: boolean): string {
  if (expired) return "Past its expiry date — edit the date to reuse it";
  return live ? "Deactivate this coupon" : "Activate this coupon";
}

export function CouponsTable({ coupons }: { coupons: SellerCoupon[] }): React.ReactElement {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SellerCoupon | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function send(id: string, init: RequestInit): Promise<string | null> {
    setBusy(id);
    try {
      const res = await fetch(`/api/coupons/${id}`, init);
      if (res.ok) {
        router.refresh();
        return null;
      }
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      return data.message ?? "Something went wrong";
    } catch {
      return "Could not reach the server.";
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive(coupon: SellerCoupon): Promise<void> {
    setError(null);
    setError(
      await send(coupon.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      }),
    );
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) return;
    setDeleteError(null);
    const message = await send(deleteTarget.id, { method: "DELETE" });
    if (message) setDeleteError(message);
    else setDeleteTarget(null);
  }

  const columns: ColumnDef<SellerCoupon, unknown>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono font-bold tracking-wider text-foreground">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "percentage",
      header: "Discount",
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums text-foreground">{row.original.percentage}% off</span>
      ),
    },
    {
      accessorKey: "minAmount",
      header: "Min order",
      meta: { className: "hidden md:table-cell" },
      cell: ({ row }) =>
        row.original.minAmount !== null ? (
          <span className="tabular-nums text-muted-foreground">{formatMoney(row.original.minAmount)}</span>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        ),
    },
    {
      id: "usage",
      header: "Usage",
      meta: { className: "hidden sm:table-cell" },
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {row.original.usedCount} / {row.original.maxUses ?? "∞"}
        </span>
      ),
    },
    {
      accessorKey: "expiresAt",
      header: "Expires",
      meta: { className: "hidden lg:table-cell" },
      cell: ({ row }) =>
        row.original.expiresAt ? (
          <span className="tabular-nums text-muted-foreground">
            {dateFormat.format(new Date(row.original.expiresAt))}
          </span>
        ) : (
          <span className="text-muted-foreground/50">Never</span>
        ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const coupon = row.original;
        const expired = coupon.expiresAt !== null && new Date(coupon.expiresAt) < new Date();
        const live = coupon.isActive && !expired;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => toggleActive(coupon)}
                disabled={busy === coupon.id || expired}
                aria-pressed={live}
                className="rounded-4xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Badge
                  className={cn(
                    "select-none border-transparent",
                    expired && "bg-destructive/10 text-destructive",
                    !expired && "cursor-pointer",
                    !expired && (live ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"),
                  )}
                >
                  {expired ? "Expired" : live ? "Active" : "Inactive"}
                </Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent>{statusTooltip(expired, live)}</TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: "actions",
      enableSorting: false,
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                asChild
                aria-label={`Edit ${row.original.code}`}
                className="size-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <Link href={`/coupons/${row.original.id}`}>
                  <Pencil />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={busy === row.original.id}
                aria-label={`Delete ${row.original.code}`}
                onClick={() => {
                  setDeleteError(null);
                  setDeleteTarget(row.original);
                }}
                className="size-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

  const deleting = deleteTarget !== null && busy === deleteTarget.id;

  return (
    <>
      {error && <FormError>{error}</FormError>}

      <DataTable
        columns={columns}
        data={coupons}
        filterColumn="code"
        filterPlaceholder="Search by code…"
        emptyMessage="No coupons yet. Create one to offer discounts to your customers."
      />

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-mono font-semibold text-foreground">{deleteTarget?.code}</span>? This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && <FormError>{deleteError}</FormError>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Spinner data-icon="inline-start" />}
              {deleting ? "Deleting" : "Delete coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
