import { cva } from "class-variance-authority";

const ORDER_STATUSES = ["ORDERED", "SHIPPED", "OUTFORDELIVERY", "DELIVERED", "CANCELLED"] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<string, string> = {
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

export function asOrderStatus(value: string): OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value) ? (value as OrderStatus) : "ORDERED";
}
