"use client";

import { type AnyFieldApi } from "@tanstack/react-form";

import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

type Props = Omit<React.ComponentProps<typeof Input>, "id" | "value" | "onChange" | "onBlur"> & {
  field: AnyFieldApi;
  label: React.ReactNode;
  hint?: string;
  format?: (value: string) => string;
  onValueChange?: (value: string) => void;
};

export function TextField({ field, label, hint, format, onValueChange, ...inputProps }: Props): React.ReactElement {
  const invalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;

  return (
    <Field data-invalid={invalid ? true : undefined}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {hint && <span className="ml-1.5 text-xs font-normal text-muted-foreground">({hint})</span>}
      </FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => {
          const value = format ? format(e.target.value) : e.target.value;
          field.handleChange(value);
          onValueChange?.(value);
        }}
        aria-invalid={invalid}
        {...inputProps}
      />
      {invalid && <FieldError>{String(field.state.meta.errors[0])}</FieldError>}
    </Field>
  );
}
