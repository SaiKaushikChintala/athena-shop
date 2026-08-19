import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  asOrderStatus,
  orderStatusBadge,
} from "@/lib/order-status";

export function OrderStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}): React.ReactElement {
  const key = asOrderStatus(status);
  return (
    <Badge className={cn(orderStatusBadge({ status: key }), className)}>
      {ORDER_STATUS_LABELS[key]}
    </Badge>
  );
}
