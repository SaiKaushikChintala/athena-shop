import { AlertCircle } from "lucide-react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function FormError({ children, className }: Props): React.ReactElement {
  return (
    <Alert variant="destructive" className={cn("border-destructive/25 bg-destructive/5", className)}>
      <AlertCircle />
      <AlertTitle>{children}</AlertTitle>
    </Alert>
  );
}
