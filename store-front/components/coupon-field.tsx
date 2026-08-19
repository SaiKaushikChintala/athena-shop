"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { formatMoney } from "@/lib/format";
import { type AppliedCoupon } from "@/types";

type Props = {
  applied: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
};

export function CouponField({ applied, onApply, onRemove }: Props): React.ReactElement {
  const [code, setCode] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function apply(): Promise<void> {
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter a code");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<AppliedCoupon> & { message?: string };

      if (!res.ok || !data.code || data.discount === undefined || data.percentage === undefined) {
        setError(data.message ?? "That code could not be applied.");
        return;
      }

      onApply({ code: data.code, percentage: data.percentage, discount: data.discount });
      toast.success(`${data.code} applied — you saved ${formatMoney(data.discount)}`);
      setCode("");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2">
        <span className="flex min-w-0 items-center gap-2">
          <Tag className="size-3.5 shrink-0 text-success" />
          <span className="truncate font-mono text-sm font-semibold tracking-wider text-success">
            {applied.code}
          </span>
          <span className="shrink-0 text-xs text-success/80">−{applied.percentage}%</span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={`Remove coupon ${applied.code}`}
          className="size-7 shrink-0 p-0 text-success hover:bg-success/15 hover:text-success"
        >
          <X />
        </Button>
      </div>
    );
  }

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor="coupon-code" className="eyebrow">
        Discount code
      </FieldLabel>
      <div className="flex items-start gap-2">
        <Input
          id="coupon-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void apply();
            }
          }}
          placeholder="SUMMER20"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          className="font-mono uppercase tracking-wider"
        />
        <Button type="button" variant="outline" onClick={apply} disabled={busy}>
          {busy && <Spinner data-icon="inline-start" />}
          Apply
        </Button>
      </div>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
