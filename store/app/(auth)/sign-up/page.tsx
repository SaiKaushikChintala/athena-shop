"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useStore } from "@tanstack/react-form";
import { z } from "zod";

import { AuthCard } from "@/components/auth-card";
import { TextField } from "@/components/text-field";
import { fromSchema } from "@/lib/validators";

const usernameSchema = z
  .string()
  .min(3, { error: "At least 3 characters." })
  .max(30, { error: "At most 30 characters." })
  .regex(/^[a-z0-9_-]+$/, { error: "Lowercase letters, numbers, hyphens, underscores only." });

const businessNameSchema = z
  .string()
  .trim()
  .min(2, { error: "At least 2 characters." })
  .max(100, { error: "At most 100 characters." });

const emailSchema = z.email({ error: "Enter a valid email address." });

const passwordSchema = z
  .string()
  .min(8, { error: "At least 8 characters." })
  .regex(/[a-zA-Z]/, { error: "Include at least one letter." })
  .regex(/[0-9]/, { error: "Include at least one number." });

function toLower(value: string): string {
  return value.toLowerCase();
}

export default function SignUpPage(): React.ReactElement {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { username: "", businessName: "", email: "", password: "" },
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
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setServerError(data.message ?? "Something went wrong. Try again.");
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
      title="Create seller account"
      description="Start selling on ATHENA."
      error={serverError}
      submitLabel="Create account"
      pendingLabel="Creating account…"
      pending={isSubmitting}
      disabled={!canSubmit}
      footer={{ prompt: "Already have an account?", href: "/sign-in", label: "Sign in" }}
      onSubmit={form.handleSubmit}
    >
      <form.Field name="username" validators={{ onBlur: fromSchema(usernameSchema) }}>
        {(field) => (
          <TextField field={field} label="Username" autoComplete="username" placeholder="my-shop" format={toLower} />
        )}
      </form.Field>

      <form.Field name="businessName" validators={{ onBlur: fromSchema(businessNameSchema) }}>
        {(field) => <TextField field={field} label="Business name" autoComplete="organization" placeholder="Acme Co." />}
      </form.Field>

      <form.Field name="email" validators={{ onBlur: fromSchema(emailSchema) }}>
        {(field) => (
          <TextField field={field} label="Email" type="email" autoComplete="email" placeholder="you@example.com" />
        )}
      </form.Field>

      <form.Field name="password" validators={{ onBlur: fromSchema(passwordSchema) }}>
        {(field) => <TextField field={field} label="Password" type="password" autoComplete="new-password" />}
      </form.Field>
    </AuthCard>
  );
}
