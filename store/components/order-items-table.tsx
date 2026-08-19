"use client";

import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { ItemStatusEditor } from "@/components/item-status-editor";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { type SellerOrderItem } from "@/types";

const columns: ColumnDef<SellerOrderItem, unknown>[] = [
  {
    id: "product",
    header: "Product",
    enableSorting: false,
    cell: ({ row }) => (
      <div className={cn(row.original.status === "CANCELLED" && "opacity-60")}>
        <p className="font-medium text-foreground">{row.original.productName}</p>
        {row.original.variantLabel && <p className="text-xs text-muted-foreground">{row.original.variantLabel}</p>}
      </div>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    meta: { className: "hidden sm:table-cell" },
    cell: ({ row }) => <span className="tabular-nums">{row.original.quantity}</span>,
  },
  {
    id: "unitPrice",
    header: "Unit price",
    enableSorting: false,
    meta: { className: "hidden sm:table-cell" },
    cell: ({ row }) => (
      <div>
        <span className="tabular-nums">{formatMoney(row.original.discount ?? row.original.price)}</span>
        {row.original.discount !== null && (
          <span className="ml-2 text-xs text-muted-foreground line-through">{formatMoney(row.original.price)}</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "subtotal",
    header: "Subtotal",
    cell: ({ row }) => (
      <span
        className={cn(
          "font-semibold tabular-nums",
          row.original.status === "CANCELLED" && "text-muted-foreground line-through",
        )}
      >
        {formatMoney(row.original.subtotal)}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => (
      <ItemStatusEditor orderId={row.original.orderId} itemId={row.original.id} current={row.original.status} />
    ),
  },
];

export function OrderItemsTable({ items }: { items: SellerOrderItem[] }): React.ReactElement {
  return <DataTable columns={columns} data={items} />;
}
