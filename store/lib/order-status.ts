import { cva } from "class-variance-authority";

import { type OrderStatus } from "@/types";

type PaymentStatus = "PENDING" | "SUCCESSFUL" | "FAILED";

export const ORDER_STATUSES = [
  "ORDERED",
  "SHIPPED",
  "OUTFORDELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const satisfies readonly OrderStatus[];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  ORDERED: "Ordered",
  SHIPPED: "Shipped",
  OUTFORDELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const orderStatusBadge = cva("border-transparent", {
  variants: {
    status: {
      ORDERED: "bg-muted text-muted-foreground",
      SHIPPED: "bg-info/10 text-info",
      OUTFORDELIVERY: "bg-warning/12 text-warning",
      DELIVERED: "bg-success/12 text-success",
      CANCELLED: "bg-destructive/10 text-destructive",
    },
  },
  defaultVariants: { status: "ORDERED" },
});

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  SUCCESSFUL: "Paid",
  FAILED: "Failed",
};

export const paymentStatusBadge = cva("border-transparent", {
  variants: {
    status: {
      PENDING: "bg-muted text-muted-foreground",
      SUCCESSFUL: "bg-success/12 text-success",
      FAILED: "bg-destructive/10 text-destructive",
    },
  },
  defaultVariants: { status: "PENDING" },
});

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  UPI: "UPI",
  DEBIT_CARD: "Debit card",
  CREDIT_CARD: "Credit card",
  PAY_ON_DELIVERY: "Pay on delivery",
};

export function asOrderStatus(value: string): OrderStatus {
  return ORDER_STATUSES.find((status) => status === value) ?? "ORDERED";
}

export function asPaymentStatus(value: string): PaymentStatus {
  return value === "SUCCESSFUL" || value === "FAILED" ? value : "PENDING";
}
