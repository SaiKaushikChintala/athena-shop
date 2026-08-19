"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Stars } from "@/components/stars";
import { ReviewFields } from "@/lib/review-schema";
import { type OwnReview } from "@/types";

type Props = {
  productId: string;
  variantId: string;
  existing?: OwnReview;
  onDone: () => void;
  onCancel: () => void;
};

export function ReviewForm({
  productId,
  variantId,
  existing,
  onDone,
  onCancel,
}: Props): React.ReactElement {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      rating: existing?.rating ?? 0,
      title: existing?.title ?? "",
      review: existing?.review ?? "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      try {
        const res = existing
          ? await fetch(`/api/reviews/${existing.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(value),
            })
          : await fetch("/api/reviews", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId, variantId, ...value }),
            });

        if (res.ok) {
          onDone();
          return;
        }
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setServerError(data.message ?? "Something went wrong.");
      } catch {
        setServerError("Could not reach the server. Check your connection and try again.");
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
      className="flex flex-col gap-4"
    >
      <form.Field
        name="rating"
        validators={{
          onSubmit: ({ value }) => ReviewFields.rating.safeParse(value).error?.issues[0]?.message,
        }}
      >
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0 ? true : undefined}>
            <FieldLabel>Your rating</FieldLabel>
            <Stars
              rating={field.state.value}
              interactive
              size="lg"
              onChange={(r) => field.handleChange(r)}
            />
            {field.state.meta.errors.length > 0 && (
              <FieldError>{field.state.meta.errors[0]}</FieldError>
            )}
          </Field>
        )}
      </form.Field>

      <FieldGroup>
        <form.Field
          name="title"
          validators={{
            onBlur: ({ value }) => ReviewFields.title.safeParse(value).error?.issues[0]?.message,
          }}
        >
          {(field) => {
            const invalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
            const id = `review-title-${productId}`;
            return (
              <Field data-invalid={invalid ? true : undefined}>
                <FieldLabel htmlFor={id}>Title</FieldLabel>
                <Input
                  id={id}
                  placeholder="Summarise your experience"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={invalid}
                  maxLength={120}
                />
                {invalid && <FieldError>{field.state.meta.errors[0]}</FieldError>}
              </Field>
            );
          }}
        </form.Field>

        <form.Field
          name="review"
          validators={{
            onBlur: ({ value }) => ReviewFields.review.safeParse(value).error?.issues[0]?.message,
          }}
        >
          {(field) => {
            const invalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
            const id = `review-body-${productId}`;
            return (
              <Field data-invalid={invalid ? true : undefined}>
                <FieldLabel htmlFor={id}>Review</FieldLabel>
                <textarea
                  id={id}
                  rows={4}
                  placeholder="What did you like or dislike?"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={invalid}
                  maxLength={2000}
                  className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring aria-invalid:border-destructive"
                />
                {invalid && <FieldError>{field.state.meta.errors[0]}</FieldError>}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              {existing ? "Save changes" : "Submit review"}
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
