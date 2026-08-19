import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  asOrderStatus,
  asPaymentStatus,
  orderStatusBadge,
  paymentStatusBadge,
} from "@/lib/order-status";

type Props = {
  status: string;
  className?: string;
};

export function OrderStatusBadge({ status, className }: Props): React.ReactElement {
  const key = asOrderStatus(status);
  return <Badge className={cn(orderStatusBadge({ status: key }), className)}>{ORDER_STATUS_LABELS[key]}</Badge>;
}

export function PaymentStatusBadge({ status, className }: Props): React.ReactElement {
  const key = asPaymentStatus(status);
  return <Badge className={cn(paymentStatusBadge({ status: key }), className)}>{PAYMENT_STATUS_LABELS[key]}</Badge>;
}
