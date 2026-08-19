"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useStore } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { TextField } from "@/components/text-field";
import { VARIANT_COLUMNS, VariantCells } from "@/components/variant-cells";
import {
  CategoryField,
  CoverImageField,
  FormSection,
  GalleryField,
  SubmitBar,
  TextAreaField,
} from "@/components/product-fields";
import { cn } from "@/lib/utils";
import { payloadError, toPayload } from "@/lib/product-draft";
import { productValidators } from "@/lib/product-validators";
import { type Category, type EditableProduct, type VariantDraft } from "@/types";

type VariantEdit = VariantDraft & { archived: boolean };

type Props = {
  product: EditableProduct;
  categories: Category[];
};

const DANGER_BUTTON = "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground";

function initialEdits(product: EditableProduct): Record<string, VariantEdit> {
  return Object.fromEntries(
    product.variants.map((v) => [
      v.id,
      {
        price: v.price.toFixed(2),
        discount: v.discount !== null ? v.discount.toFixed(2) : "",
        quantity: String(v.quantity),
        sku: v.sku ?? "",
        coverImage: v.coverImage ?? "",
        images: v.images,
        archived: v.archived,
      },
    ]),
  );
}

export function EditProductForm({ product, categories }: Props): React.ReactElement {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [edits, setEdits] = useState<Record<string, VariantEdit>>(() => initialEdits(product));
  const [defaultVariantId, setDefaultVariantId] = useState<string>(product.defaultVariantId);

  function updateEdit(id: string, patch: Partial<VariantEdit>): void {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  const form = useForm({
    defaultValues: {
      name: product.name,
      brand: product.brand,
      slug: product.slug,
      description: product.description,
      coverImage: product.coverImage,
      images: product.images,
      categoryId: product.categoryId,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      const variants = product.variants.map((v) => ({
        id: v.id,
        ...toPayload(edits[v.id]),
        archived: edits[v.id].archived,
      }));

      const problem = payloadError(variants);
      if (problem) {
        setServerError(problem);
        return;
      }

      try {
        const res = await fetch(`/api/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...value, categoryId: value.categoryId || null, defaultVariantId, variants }),
        });
        if (res.ok) {
          router.push("/products");
          router.refresh();
          return;
        }
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setServerError(data.message ?? "Something went wrong.");
      } catch {
        setServerError("Could not reach the server.");
      }
    },
  });

  const { canSubmit, isSubmitting } = useStore(form.store, (s) => ({
    canSubmit: s.canSubmit,
    isSubmitting: s.isSubmitting,
  }));

  async function handleDelete(): Promise<void> {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/products");
        router.refresh();
        return;
      }
      setServerError("Failed to delete product.");
    } catch {
      setServerError("Could not reach the server.");
    }
    setDeleting(false);
  }

  const hasOptions = product.options.length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex flex-col gap-10"
    >
      <FormSection title="Basic info">
        <FieldGroup>
          <div className="flex flex-col gap-4 sm:flex-row">
            <form.Field name="name" validators={{ onBlur: productValidators.name }}>
              {(field) => <TextField field={field} label="Product name" />}
            </form.Field>
            <form.Field name="brand" validators={{ onBlur: productValidators.brand }}>
              {(field) => <TextField field={field} label="Brand" />}
            </form.Field>
          </div>

          <form.Field name="slug" validators={{ onBlur: productValidators.slug }}>
            {(field) => (
              <TextField field={field} label="Slug" hint="changing it breaks existing links to this product" />
            )}
          </form.Field>

          <form.Field name="description" validators={{ onBlur: productValidators.description }}>
            {(field) => <TextAreaField field={field} label="Description" />}
          </form.Field>

          <div className="flex flex-col gap-4 sm:flex-row">
            <form.Field name="coverImage" validators={{ onBlur: productValidators.coverImage }}>
              {(field) => <CoverImageField field={field} />}
            </form.Field>
            <form.Field name="images">{(field) => <GalleryField field={field} />}</form.Field>
            <form.Field name="categoryId">{(field) => <CategoryField field={field} categories={categories} />}</form.Field>
          </div>
        </FieldGroup>
      </FormSection>

      {hasOptions && (
        <FormSection title="Options" note="read-only after creation">
          <div className="flex flex-col gap-3">
            {product.options.map((option) => (
              <div key={option.id} className="flex items-start gap-3">
                <p className="w-24 shrink-0 pt-1 font-mono text-xs font-medium text-foreground">{option.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {option.values.map((v) => (
                    <span
                      key={v.id}
                      className="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-0.5 text-xs font-medium"
                    >
                      {v.hex && (
                        <span className="inline-block size-3 rounded-full border" style={{ backgroundColor: v.hex }} />
                      )}
                      {v.value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </FormSection>
      )}

      <FormSection
        title={
          <>
            Variants
            <span className="ml-2 font-medium text-muted-foreground/60">{product.variants.length}</span>
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {[...(hasOptions ? ["Variant"] : []), ...VARIANT_COLUMNS, "Default", "Status"].map((heading) => (
                  <th key={heading} className="eyebrow-tight pb-2 pr-4 text-left">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {product.variants.map((variant) => {
                const edit = edits[variant.id];
                const isDefault = variant.id === defaultVariantId;

                return (
                  <tr key={variant.id} className={cn(isDefault && "bg-muted/30", edit.archived && "opacity-50")}>
                    {hasOptions && (
                      <td className="whitespace-nowrap py-2 pr-4 font-medium text-foreground">{variant.label}</td>
                    )}
                    <VariantCells
                      label={variant.label}
                      draft={edit}
                      disabled={edit.archived}
                      onChange={(patch) => updateEdit(variant.id, patch)}
                    />
                    <td className="py-2 pr-4">
                      <input
                        type="radio"
                        name="default-variant"
                        aria-label={`Make ${variant.label} the default`}
                        checked={isDefault}
                        onChange={() => setDefaultVariantId(variant.id)}
                        disabled={edit.archived}
                        className="accent-primary"
                      />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => updateEdit(variant.id, { archived: !edit.archived })}
                        disabled={isDefault && !edit.archived}
                        title={isDefault && !edit.archived ? "Pick another default before archiving" : undefined}
                        className={cn(
                          "text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                          edit.archived
                            ? "text-primary hover:text-primary/80"
                            : "text-muted-foreground hover:text-destructive",
                        )}
                      >
                        {edit.archived ? "Restore" : "Archive"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </FormSection>

      {serverError && <FormError>{serverError}</FormError>}

      <SubmitBar label="Save changes" pendingLabel="Saving…" pending={isSubmitting} disabled={!canSubmit} />

      <section className="flex flex-col gap-1">
        <h2 className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.28em] text-destructive">Danger zone</h2>
        <div className="mb-4 h-px bg-border" />
        <div className="flex flex-wrap items-center gap-4">
          {confirmingDelete ? (
            <>
              <p className="text-sm text-muted-foreground">This will hide the product from the storefront. Are you sure?</p>
              <Button type="button" variant="outline" className={DANGER_BUTTON} disabled={deleting} onClick={handleDelete}>
                {deleting ? "Deleting…" : "Yes, delete"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" className={DANGER_BUTTON} onClick={() => setConfirmingDelete(true)}>
              Delete product
            </Button>
          )}
        </div>
      </section>
    </form>
  );
}
