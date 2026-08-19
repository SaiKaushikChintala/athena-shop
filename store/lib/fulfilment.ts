import { type OrderStatus } from "@/types";

const STAGES: OrderStatus[] = ["ORDERED", "SHIPPED", "OUTFORDELIVERY", "DELIVERED"];

function rank(status: OrderStatus): number {
  return STAGES.indexOf(status);
}

export function isFinal(status: OrderStatus): boolean {
  return status === "DELIVERED" || status === "CANCELLED";
}

export function canMove(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to || isFinal(from)) return false;
  return to === "CANCELLED" || rank(to) > rank(from);
}

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return [...STAGES, "CANCELLED" as const].filter((to) => canMove(from, to));
}

export function deriveStatus(lines: OrderStatus[]): OrderStatus {
  const live = lines.filter((status) => status !== "CANCELLED");
  if (live.length === 0) return "CANCELLED";
  return live.reduce((least, status) => (rank(status) < rank(least) ? status : least));
}
