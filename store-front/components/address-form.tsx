"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { FormError } from "@/components/form-error";
import { AddressFields } from "@/lib/address-schema";
import { type SavedAddress } from "@/types";

type TextField = keyof typeof AddressFields;

type Props = {
  existing?: SavedAddress;
  defaultFirstName: string;
  defaultLastName: string;
  showDefaultToggle: boolean;
  onDone: () => void;
  onCancel: () => void;
};

export function AddressForm({
  existing,
  defaultFirstName,
  defaultLastName,
  showDefaultToggle,
  onDone,
  onCancel,
}: Props): React.ReactElement {
  const [serverError, setServerError] = useState<string | null>(null);
  const idPrefix = existing ? `addr-${existing.id}` : "addr-new";

  const form = useForm({
    defaultValues: {
      label: existing?.label ?? "",
      firstName: existing?.firstName ?? defaultFirstName,
      lastName: existing?.lastName ?? defaultLastName,
      phone: existing?.phone ?? "",
      street: existing?.street ?? "",
      city: existing?.city ?? "",
      state: existing?.state ?? "",
      zipCode: existing?.zipCode ?? "",
      country: existing?.country ?? "India",
      isPrimary: existing?.isPrimary ?? false,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const { isPrimary, ...fields } = value;
      const body = isPrimary ? { ...fields, isPrimary: true } : fields;

      try {
        const res = await fetch(existing ? `/api/addresses/${existing.id}` : "/api/addresses", {
          method: existing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          onDone();
          return;
        }
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setServerError(data.message ?? "Could not save that address.");
      } catch {
        setServerError("Could not reach the server. Check your connection and try again.");
      }
    },
  });

  function textField(
    name: TextField,
    label: string,
    extra?: { autoComplete?: string; placeholder?: string; inputMode?: "tel" | "numeric" },
  ): React.ReactElement {
    return (
      <form.Field
        name={name}
        validators={{
          onChange: ({ value }) => AddressFields[name].safeParse(value).error?.issues[0]?.message,
        }}
      >
        {(field) => {
          const invalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
          const id = `${idPrefix}-${name}`;
          return (
            <Field data-invalid={invalid ? true : undefined}>
              <FieldLabel htmlFor={id}>{label}</FieldLabel>
              <Input
                id={id}
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
      className="flex flex-col gap-4 rounded-xl border p-4"
    >
      <FieldGroup>
        {textField("label", "Address name", { placeholder: "Home, Work…" })}

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

        {showDefaultToggle && !existing?.isPrimary && (
          <form.Field name="isPrimary">
            {(field) => (
              <Field orientation="horizontal">
                <Checkbox
                  id={`${idPrefix}-primary`}
                  checked={field.state.value}
                  onCheckedChange={(v) => field.handleChange(v === true)}
                />
                <FieldLabel htmlFor={`${idPrefix}-primary`} className="font-normal">
                  Make this my default address
                </FieldLabel>
              </Field>
            )}
          </form.Field>
        )}
      </FieldGroup>

      {serverError && <FormError>{serverError}</FormError>}

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              {existing ? "Save changes" : "Save address"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
