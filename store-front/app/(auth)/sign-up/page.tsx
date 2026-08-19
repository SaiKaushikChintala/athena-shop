"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { TextField } from "@/components/text-field";

const nameSchema = z.string().min(1, { error: "Required." });
const emailSchema = z.email({ error: "Enter a valid email address." });

function validatePassword(value: string): string | undefined {
  if (value.length < 8) return "At least 8 characters.";
  if (!/[a-zA-Z]/.test(value)) return "Include at least one letter.";
  if (!/[0-9]/.test(value)) return "Include at least one number.";
  return undefined;
}

export default function SignUpPage(): React.ReactElement {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const res = await fetch("/api/sign-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
        });
        if (res.ok) {
          router.push("/");
          router.refresh();
          return;
        }
        setServerError(
          res.status === 409 ? "An account with that email already exists." : "Something went wrong. Try again.",
        );
      } catch {
        setServerError("Could not reach the server. Check your connection and try again.");
      }
    },
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Join ATHENA STORE.</CardDescription>
      </CardHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <CardContent>
          <FieldGroup>
            <div className="flex gap-3">
              <form.Field
                name="firstName"
                validators={{ onBlur: ({ value }) => nameSchema.safeParse(value).error?.issues[0]?.message }}
              >
                {(field) => (
                  <TextField field={field} label="First name" autoComplete="given-name" className="flex-1" />
                )}
              </form.Field>

              <form.Field
                name="lastName"
                validators={{ onBlur: ({ value }) => nameSchema.safeParse(value).error?.issues[0]?.message }}
              >
                {(field) => (
                  <TextField field={field} label="Last name" autoComplete="family-name" className="flex-1" />
                )}
              </form.Field>
            </div>

            <form.Field
              name="email"
              validators={{ onBlur: ({ value }) => emailSchema.safeParse(value).error?.issues[0]?.message }}
            >
              {(field) => (
                <TextField
                  field={field}
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              )}
            </form.Field>

            <form.Field name="password" validators={{ onBlur: ({ value }) => validatePassword(value) }}>
              {(field) => <TextField field={field} label="Password" type="password" autoComplete="new-password" />}
            </form.Field>

            {serverError && <FormError>{serverError}</FormError>}
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
            {({ canSubmit, isSubmitting }) => (
              <Button type="submit" className="w-full" disabled={!canSubmit}>
                {isSubmitting && <Spinner data-icon="inline-start" />}
                {isSubmitting ? "Creating account" : "Create account"}
              </Button>
            )}
          </form.Subscribe>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-foreground underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
