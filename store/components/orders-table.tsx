"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badge";
import { PAYMENT_METHOD_LABELS } from "@/lib/order-status";
import { formatMoney } from "@/lib/format";
import { type SellerOrder } from "@/types";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

const columns: ColumnDef<SellerOrder, unknown>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => (
      <Link
        href={`/orders/${row.original.id}`}
        className="font-mono text-xs font-bold text-foreground underline-offset-4 hover:text-primary hover:underline sm:text-sm"
      >
        #{row.original.orderNumber}
      </Link>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    meta: { className: "hidden sm:table-cell" },
    cell: ({ row }) => (
      <span className="whitespace-nowrap tabular-nums text-muted-foreground">
        {dateFormat.format(new Date(row.original.createdAt))}
      </span>
    ),
  },
  {
    id: "customer",
    accessorFn: (row) => `${row.customer.firstName} ${row.customer.lastName}`,
    header: "Customer",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-foreground">
          {row.original.customer.firstName} {row.original.customer.lastName}
        </p>
        <p className="hidden max-w-56 truncate text-xs text-muted-foreground sm:block">{row.original.customer.email}</p>
      </div>
    ),
  },
  {
    accessorKey: "itemCount",
    header: "Items",
    meta: { className: "hidden md:table-cell" },
    cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.itemCount}</span>,
  },
  {
    accessorKey: "sellerTotal",
    header: "Revenue",
    cell: ({ row }) => (
      <span className="font-semibold tabular-nums text-foreground">{formatMoney(row.original.sellerTotal)}</span>
    ),
  },
  {
    accessorKey: "paymentMethod",
    header: "Payment",
    meta: { className: "hidden lg:table-cell" },
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-muted-foreground">
        {PAYMENT_METHOD_LABELS[row.original.paymentMethod] ?? row.original.paymentMethod}
      </span>
    ),
  },
  {
    accessorKey: "paymentStatus",
    header: "Paid",
    meta: { className: "hidden md:table-cell" },
    cell: ({ row }) => <PaymentStatusBadge status={row.original.paymentStatus} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    enableSorting: false,
    header: "",
    meta: { className: "hidden sm:table-cell" },
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
        <Link href={`/orders/${row.original.id}`}>
          <ExternalLink data-icon="inline-start" />
          View
        </Link>
      </Button>
    ),
  },
];

export function OrdersTable({ orders }: { orders: SellerOrder[] }): React.ReactElement {
  return (
    <DataTable
      columns={columns}
      data={orders}
      filterColumn="customer"
      filterPlaceholder="Search by customer name…"
      emptyMessage="No orders yet. When customers purchase your products they'll appear here."
      defaultSorting={[{ id: "createdAt", desc: true }]}
    />
  );
}
