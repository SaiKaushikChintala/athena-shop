"use client";

import Link from "next/link";
import { type AnyFieldApi } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
import { GalleryUpload } from "@/components/gallery-upload";
import { cn } from "@/lib/utils";
import { type Category } from "@/types";

function isInvalid(field: AnyFieldApi): boolean {
  return field.state.meta.isTouched && field.state.meta.errors.length > 0;
}

function ErrorText({ field }: { field: AnyFieldApi }): React.ReactNode {
  return isInvalid(field) ? <FieldError>{String(field.state.meta.errors[0])}</FieldError> : null;
}

export function FormSection({
  title,
  note,
  children,
}: {
  title: React.ReactNode;
  note?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="eyebrow">
        {title}
        {note && (
          <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/50">— {note}</span>
        )}
      </h2>
      <Separator className="mb-4" />
      {children}
    </section>
  );
}

export function TextAreaField({ field, label, placeholder }: { field: AnyFieldApi; label: string; placeholder?: string }): React.ReactElement {
  return (
    <Field data-invalid={isInvalid(field) ? true : undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Textarea
        id={field.name}
        rows={3}
        placeholder={placeholder}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid(field)}
      />
      <ErrorText field={field} />
    </Field>
  );
}

export function CoverImageField({ field }: { field: AnyFieldApi }): React.ReactElement {
  return (
    <Field className="flex-1" data-invalid={isInvalid(field) ? true : undefined}>
      <FieldLabel htmlFor={field.name}>Cover image</FieldLabel>
      <ImageUpload
        id={field.name}
        value={field.state.value}
        onChange={(url) => {
          field.handleChange(url);
          field.handleBlur();
        }}
        invalid={isInvalid(field)}
      />
      <ErrorText field={field} />
    </Field>
  );
}

export function GalleryField({ field }: { field: AnyFieldApi }): React.ReactElement {
  return (
    <Field>
      <FieldLabel>
        Gallery
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
      </FieldLabel>
      <GalleryUpload value={field.state.value} onChange={(urls) => field.handleChange(urls)} />
    </Field>
  );
}

export function CategoryField({ field, categories }: { field: AnyFieldApi; categories: Category[] }): React.ReactNode {
  if (categories.length === 0) return null;

  return (
    <Field className="w-48">
      <FieldLabel htmlFor={field.name}>Category</FieldLabel>
      <select
        id={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}
      >
        <option value="">None</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function SubmitBar({
  label,
  pendingLabel,
  pending,
  disabled,
}: {
  label: string;
  pendingLabel: string;
  pending: boolean;
  disabled: boolean;
}): React.ReactElement {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex gap-3 border-t bg-card/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-card/80 sm:-mx-6 sm:px-6">
      <Button type="submit" disabled={disabled || pending}>
        {pending ? pendingLabel : label}
      </Button>
      <Button variant="outline" asChild>
        <Link href="/products">Cancel</Link>
      </Button>
    </div>
  );
}
