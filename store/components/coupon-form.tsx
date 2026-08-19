"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { TextField } from "@/components/text-field";
import { toDayKey } from "@/lib/dates";
import { inRange, optionalInRange, required } from "@/lib/validators";
import { type CouponDraft } from "@/types";

function endOfDay(dayKey: string): string | null {
  return dayKey ? new Date(`${dayKey}T23:59:59.999`).toISOString() : null;
}

function toUpper(value: string): string {
  return value.toUpperCase();
}

export function CouponForm({ coupon }: { coupon?: CouponDraft }): React.ReactElement {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const editing = coupon !== undefined;

  const form = useForm({
    defaultValues: {
      code: coupon?.code ?? "",
      percentage: coupon ? String(coupon.percentage) : "",
      minAmount: coupon?.minAmount != null ? String(coupon.minAmount) : "",
      maxUses: coupon?.maxUses != null ? String(coupon.maxUses) : "",
      expiresAt: coupon?.expiresAt ? toDayKey(new Date(coupon.expiresAt)) : "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const res = await fetch(editing ? `/api/coupons/${coupon.id}` : "/api/coupons", {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: value.code.trim(),
            percentage: Number(value.percentage),
            minAmount: value.minAmount ? Number(value.minAmount) : null,
            maxUses: value.maxUses ? Number(value.maxUses) : null,
            expiresAt: endOfDay(value.expiresAt),
          }),
        });
        if (res.ok) {
          router.push("/coupons");
          router.refresh();
          return;
        }
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setServerError(data.message ?? "Something went wrong");
      } catch {
        setServerError("Could not reach the server.");
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex flex-col gap-8"
    >
      <FieldGroup>
        <form.Field name="code" validators={{ onChange: ({ value }) => required(value) }}>
          {(field) => (
            <TextField
              field={field}
              label="Coupon code"
              format={toUpper}
              placeholder="SUMMER20"
              className="font-mono uppercase tracking-wider"
            />
          )}
        </form.Field>

        <form.Field
          name="percentage"
          validators={{ onChange: ({ value }) => required(value) ?? inRange(1, 100)(value) }}
        >
          {(field) => <TextField field={field} label="Discount (%)" type="number" min={1} max={100} placeholder="20" />}
        </form.Field>

        <form.Field name="minAmount" validators={{ onChange: ({ value }) => optionalInRange(0, 999999)(value) }}>
          {(field) => (
            <TextField
              field={field}
              label="Minimum order amount"
              hint="optional"
              type="number"
              min={0}
              step="0.01"
              placeholder="50.00"
            />
          )}
        </form.Field>

        <form.Field name="maxUses" validators={{ onChange: ({ value }) => optionalInRange(1, 999999)(value) }}>
          {(field) => (
            <TextField
              field={field}
              label="Maximum uses"
              hint="optional — leave blank for unlimited"
              type="number"
              min={1}
              step={1}
              placeholder="100"
            />
          )}
        </form.Field>

        <form.Field name="expiresAt">
          {(field) => (
            <TextField
              field={field}
              label="Expiry date"
              hint="optional — valid through the end of this day"
              type="date"
              min={toDayKey(new Date())}
            />
          )}
        </form.Field>
      </FieldGroup>

      {serverError && <FormError>{serverError}</FormError>}

      <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
        {({ canSubmit, isSubmitting }) => (
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {editing ? (isSubmitting ? "Saving…" : "Save changes") : isSubmitting ? "Creating…" : "Create coupon"}
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/coupons">Cancel</Link>
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
