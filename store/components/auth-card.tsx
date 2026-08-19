import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { FormError } from "@/components/form-error";

type Props = {
  title: string;
  description: string;
  error: string | null;
  submitLabel: string;
  pendingLabel: string;
  pending: boolean;
  disabled: boolean;
  footer: { prompt: string; href: string; label: string };
  onSubmit: () => void;
  children: React.ReactNode;
};

export function AuthCard({
  title,
  description,
  error,
  submitLabel,
  pendingLabel,
  pending,
  disabled,
  footer,
  onSubmit,
  children,
}: Props): React.ReactElement {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSubmit();
        }}
      >
        <CardContent>
          <FieldGroup>
            {children}
            {error && <FormError>{error}</FormError>}
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={disabled || pending}>
            {pending ? pendingLabel : submitLabel}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {footer.prompt}{" "}
            <Link href={footer.href} className="text-foreground underline underline-offset-4">
              {footer.label}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
