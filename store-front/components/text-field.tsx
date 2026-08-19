"use client";

import { type AnyFieldApi } from "@tanstack/react-form";

import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

type Props = Omit<React.ComponentProps<typeof Input>, "id" | "value" | "onChange" | "onBlur"> & {
  field: AnyFieldApi;
  label: string;
};

export function TextField({ field, label, className, ...inputProps }: Props): React.ReactElement {
  const invalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;

  return (
    <Field className={className} data-invalid={invalid ? true : undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={invalid}
        {...inputProps}
      />
      {invalid && <FieldError>{field.state.meta.errors[0]}</FieldError>}
    </Field>
  );
}
