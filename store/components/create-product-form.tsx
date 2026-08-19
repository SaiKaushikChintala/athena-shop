"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useStore } from "@tanstack/react-form";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { TextField } from "@/components/text-field";
import { OptionEditor } from "@/components/option-editor";
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
import { emptyDraft, payloadError, toPayload, toSlug } from "@/lib/product-draft";
import { productValidators } from "@/lib/product-validators";
import { type Category, type OptionDraft, type VariantDraft } from "@/types";

type Combination = Record<string, string>;

function filledOptions(options: OptionDraft[]): OptionDraft[] {
  return options
    .map((o) => ({ ...o, name: o.name.trim() }))
    .filter((o) => o.name !== "" && o.values.length > 0);
}

function combinationsOf(options: OptionDraft[]): Combination[] {
  return options.reduce<Combination[]>(
    (combos, option) => combos.flatMap((combo) => option.values.map((v) => ({ ...combo, [option.name]: v.value }))),
    [{}],
  );
}

function comboKey(combo: Combination): string {
  return Object.entries(combo)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}::${value}`)
    .join("||");
}

export function CreateProductForm({ categories }: { categories: Category[] }): React.ReactElement {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState<boolean>(false);
  const [options, setOptions] = useState<OptionDraft[]>([]);
  const [drafts, setDrafts] = useState<Record<string, VariantDraft>>({});
  const [defaultKey, setDefaultKey] = useState<string>("");

  const activeOptions = useMemo<OptionDraft[]>(() => filledOptions(options), [options]);
  const combinations = useMemo<Combination[]>(() => combinationsOf(activeOptions), [activeOptions]);
  const keys = useMemo<string[]>(() => combinations.map(comboKey), [combinations]);
  const effectiveDefault = keys.includes(defaultKey) ? defaultKey : (keys[0] ?? "");
  const optionNames = activeOptions.map((o) => o.name);

  function draftFor(key: string): VariantDraft {
    return drafts[key] ?? emptyDraft();
  }

  function updateDraft(key: string, patch: Partial<VariantDraft>): void {
    setDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] ?? emptyDraft()), ...patch } }));
  }

  const form = useForm({
    defaultValues: {
      name: "",
      brand: "",
      slug: "",
      description: "",
      coverImage: "",
      images: [] as string[],
      categoryId: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      const variants = combinations.map((combo, index) => ({
        ...toPayload(draftFor(keys[index])),
        optionValues: combo,
        isDefault: keys[index] === effectiveDefault,
      }));

      const problem = payloadError(variants);
      if (problem) {
        setServerError(problem);
        return;
      }

      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...value,
            options: activeOptions.map((o) => ({
              name: o.name,
              values: o.values.map((v) => ({ value: v.value, hex: o.hasColor ? v.hex || "#000000" : undefined })),
            })),
            variants,
          }),
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
              {(field) => (
                <TextField
                  field={field}
                  label="Product name"
                  placeholder="Classic Cotton Tee"
                  onValueChange={(value) => {
                    if (!slugEdited) form.setFieldValue("slug", toSlug(value));
                  }}
                />
              )}
            </form.Field>

            <form.Field name="brand" validators={{ onBlur: productValidators.brand }}>
              {(field) => <TextField field={field} label="Brand" placeholder="Basics Co." />}
            </form.Field>
          </div>

          <form.Field name="slug" validators={{ onBlur: productValidators.slug }}>
            {(field) => (
              <TextField
                field={field}
                label="Slug"
                placeholder="classic-cotton-tee"
                onValueChange={() => setSlugEdited(true)}
              />
            )}
          </form.Field>

          <form.Field name="description" validators={{ onBlur: productValidators.description }}>
            {(field) => (
              <TextAreaField
                field={field}
                label="Description"
                placeholder="A short product description shown to customers…"
              />
            )}
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

      <FormSection title="Options" note="leave empty for products with no options (e.g. a wallet)">
        <div className="flex flex-col gap-6">
          {options.map((option) => (
            <OptionEditor
              key={option.id}
              option={option}
              onChange={(next) => setOptions((prev) => prev.map((o) => (o.id === option.id ? next : o)))}
              onRemove={() => setOptions((prev) => prev.filter((o) => o.id !== option.id))}
            />
          ))}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setOptions((prev) => [...prev, { id: crypto.randomUUID(), name: "", hasColor: false, values: [] }])
              }
            >
              <Plus data-icon="inline-start" />
              Add option
            </Button>
          </div>
        </div>
      </FormSection>

      <FormSection
        title={
          <>
            Variants
            <span className="ml-2 font-medium text-muted-foreground/60">
              {optionNames.length === 0 ? "1 (no options)" : combinations.length}
            </span>
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {[...optionNames, ...VARIANT_COLUMNS, "Default"].map((heading) => (
                  <th key={heading} className="eyebrow-tight pb-2 pr-4 text-left">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {combinations.map((combo, index) => {
                const key = keys[index];
                const label = Object.values(combo).join(" / ") || "this variant";
                return (
                  <tr key={key} className={cn(key === effectiveDefault && "bg-muted/30")}>
                    {optionNames.map((name) => (
                      <td key={name} className="whitespace-nowrap py-2 pr-4 font-medium text-foreground">
                        {combo[name]}
                      </td>
                    ))}
                    <VariantCells label={label} draft={draftFor(key)} onChange={(patch) => updateDraft(key, patch)} />
                    <td className="py-2">
                      <input
                        type="radio"
                        name="default-variant"
                        aria-label={`Make ${label} the default`}
                        checked={key === effectiveDefault}
                        onChange={() => setDefaultKey(key)}
                        className="accent-primary"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </FormSection>

      {serverError && <FormError>{serverError}</FormError>}

      <SubmitBar label="Create product" pendingLabel="Creating…" pending={isSubmitting} disabled={!canSubmit} />
    </form>
  );
}
