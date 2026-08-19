"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { AddressPicker, NEW_ADDRESS } from "@/components/address-picker";
import { FormError } from "@/components/form-error";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { type SavedAddress } from "@/types";

const required = z.string().min(1, { error: "Required" });

const PAYMENT_METHODS = [
  { value: "PAY_ON_DELIVERY", label: "Pay on delivery", hint: "Pay in cash when it arrives" },
  { value: "UPI", label: "UPI", hint: "Pay from any UPI app" },
  { value: "DEBIT_CARD", label: "Debit card", hint: "Visa, Mastercard, RuPay" },
  { value: "CREDIT_CARD", label: "Credit card", hint: "Visa, Mastercard, Amex" },
] as const;

const ADDRESS_FIELDS = ["firstName", "lastName", "phone", "street", "city", "state", "zipCode", "country"] as const;

type AddressField = (typeof ADDRESS_FIELDS)[number];

type Props = {
  defaultFirstName: string;
  defaultLastName: string;
  addresses: SavedAddress[];
  total: number;
  couponCode: string | null;
  onCouponRejected: () => void;
};

function pickShipping(source: Record<AddressField, string>): Record<AddressField, string> {
  return Object.fromEntries(ADDRESS_FIELDS.map((key) => [key, source[key]])) as Record<AddressField, string>;
}

export function CheckoutForm({
  defaultFirstName,
  defaultLastName,
  addresses,
  total,
  couponCode,
  onCouponRejected,
}: Props): React.ReactElement {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [addressId, setAddressId] = useState<string>(
    addresses.find((a) => a.isPrimary)?.id ?? addresses[0]?.id ?? NEW_ADDRESS,
  );
  const [saveAddress, setSaveAddress] = useState<boolean>(false);
  const [saveLabel, setSaveLabel] = useState<string>("");

  const usingNew = addressId === NEW_ADDRESS;

  const form = useForm({
    defaultValues: {
      firstName: defaultFirstName,
      lastName: defaultLastName,
      phone: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
      paymentMethod: "PAY_ON_DELIVERY" as string,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const chosen = addresses.find((a) => a.id === addressId);

      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...pickShipping(chosen ?? value),
            paymentMethod: value.paymentMethod,
            couponCode,
            saveAddressAs: !chosen && saveAddress && saveLabel.trim() ? saveLabel.trim() : null,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          id?: string;
          message?: string;
          couponRejected?: boolean;
        };

        if (res.ok && data.id) {
          router.push(`/orders/${data.id}?placed=1`);
          router.refresh();
          return;
        }

        if (data.couponRejected) {
          onCouponRejected();
          setServerError(`${data.message ?? "That coupon is no longer valid."} The code has been removed — review the total and try again.`);
          return;
        }

        setServerError(data.message ?? "We could not place the order. Try again.");
      } catch {
        setServerError("Could not reach the server. Check your connection and try again.");
      }
    },
  });

  function textField(
    name: AddressField,
    label: string,
    extra?: { autoComplete?: string; placeholder?: string; inputMode?: "tel" | "numeric" },
  ): React.ReactElement {
    return (
      <form.Field
        name={name}
        validators={{
          onChange: ({ value }) => (usingNew ? required.safeParse(value).error?.issues[0]?.message : undefined),
        }}
      >
        {(field) => {
          const invalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
          return (
            <Field data-invalid={invalid ? true : undefined}>
              <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={invalid}
                {...extra}
              />
              {invalid && <FieldError>{field.state.meta.errors[0]}</FieldError>}
            </Field>
          );
        }}
      </form.Field>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex flex-col gap-8"
    >
      <FieldSet>
        <FieldLegend className="eyebrow">Shipping address</FieldLegend>

        {addresses.length > 0 && (
          <div className="mb-4">
            <AddressPicker addresses={addresses} value={addressId} onChange={setAddressId} />
          </div>
        )}

        <FieldGroup className={usingNew ? undefined : "hidden"}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {textField("firstName", "First name", { autoComplete: "given-name" })}
            {textField("lastName", "Last name", { autoComplete: "family-name" })}
          </div>

          {textField("phone", "Phone number", {
            autoComplete: "tel",
            inputMode: "tel",
            placeholder: "+91 98765 43210",
          })}

          {textField("street", "Street address", {
            autoComplete: "street-address",
            placeholder: "Flat, building, street",
          })}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {textField("city", "City", { autoComplete: "address-level2" })}
            {textField("state", "State", { autoComplete: "address-level1" })}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {textField("zipCode", "ZIP code", { autoComplete: "postal-code", inputMode: "numeric" })}
            {textField("country", "Country", { autoComplete: "country-name" })}
          </div>

          <Field orientation="horizontal">
            <Checkbox
              id="save-address"
              checked={saveAddress}
              onCheckedChange={(checked) => setSaveAddress(checked === true)}
            />
            <FieldLabel htmlFor="save-address" className="font-normal">
              Save this address for next time
            </FieldLabel>
          </Field>

          {saveAddress && (
            <Field>
              <FieldLabel htmlFor="save-label">Name this address</FieldLabel>
              <Input
                id="save-label"
                value={saveLabel}
                onChange={(e) => setSaveLabel(e.target.value)}
                placeholder="Home"
                maxLength={40}
              />
            </Field>
          )}
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend className="eyebrow">Payment method</FieldLegend>
        <form.Field name="paymentMethod">
          {(field) => (
            <RadioGroup value={field.state.value} onValueChange={field.handleChange} className="gap-2">
              {PAYMENT_METHODS.map((method) => (
                <FieldLabel
                  key={method.value}
                  htmlFor={`pay-${method.value}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    field.state.value === method.value ? "border-ring bg-accent/50" : "hover:bg-accent/30",
                  )}
                >
                  <RadioGroupItem id={`pay-${method.value}`} value={method.value} className="mt-0.5" />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{method.label}</span>
                    <span className="text-xs font-normal text-muted-foreground">{method.hint}</span>
                  </span>
                </FieldLabel>
              ))}
            </RadioGroup>
          )}
        </form.Field>
      </FieldSet>

      {serverError && <FormError>{serverError}</FormError>}

      <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
        {({ canSubmit, isSubmitting }) => (
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || (usingNew && !canSubmit)}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            {isSubmitting ? "Placing order" : `Place order · ${formatMoney(total)}`}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
