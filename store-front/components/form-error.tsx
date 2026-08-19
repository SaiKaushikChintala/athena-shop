import { AlertCircle } from "lucide-react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function FormError({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <Alert
      variant="destructive"
      className={cn("border-destructive/25 bg-destructive/5", className)}
    >
      <AlertCircle />
      <AlertTitle>{children}</AlertTitle>
    </Alert>
  );
}
