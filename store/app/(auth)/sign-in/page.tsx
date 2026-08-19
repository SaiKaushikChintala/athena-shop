"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useStore } from "@tanstack/react-form";
import { z } from "zod";

import { AuthCard } from "@/components/auth-card";
import { TextField } from "@/components/text-field";
import { fromSchema } from "@/lib/validators";

const emailSchema = z.email({ error: "Enter a valid email address." });
const passwordSchema = z.string().min(1, { error: "Password is required." });

export default function SignInPage(): React.ReactElement {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const res = await fetch("/api/sign-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
        });
        if (res.ok) {
          router.push("/");
          router.refresh();
          return;
        }
        setServerError(res.status === 401 ? "Email or password is incorrect." : "Something went wrong. Try again.");
      } catch {
        setServerError("Could not reach the server.");
      }
    },
  });

  const { canSubmit, isSubmitting } = useStore(form.store, (s) => ({
    canSubmit: s.canSubmit,
    isSubmitting: s.isSubmitting,
  }));

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back to your seller portal."
      error={serverError}
      submitLabel="Sign in"
      pendingLabel="Signing in…"
      pending={isSubmitting}
      disabled={!canSubmit}
      footer={{ prompt: "No account?", href: "/sign-up", label: "Create one" }}
      onSubmit={form.handleSubmit}
    >
      <form.Field name="email" validators={{ onBlur: fromSchema(emailSchema) }}>
        {(field) => (
          <TextField field={field} label="Email" type="email" autoComplete="email" placeholder="you@example.com" />
        )}
      </form.Field>

      <form.Field name="password" validators={{ onBlur: fromSchema(passwordSchema) }}>
        {(field) => <TextField field={field} label="Password" type="password" autoComplete="current-password" />}
      </form.Field>
    </AuthCard>
  );
}
