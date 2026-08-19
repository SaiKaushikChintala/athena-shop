import { notFound } from "next/navigation";

import { PageBody, PageHeader } from "@/components/page-header";
import { EditProductForm } from "@/components/edit-product-form";
import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { type EditableProduct } from "@/types";

type Props = { params: Promise<{ id: string }> };

type OptionPosition = { optionValue: { value: string; position: number; option: { position: number } } };

function byOption(a: OptionPosition, b: OptionPosition): number {
  return a.optionValue.option.position - b.optionValue.option.position;
}

function compareVariants(a: OptionPosition[], b: OptionPosition[]): number {
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    const diff = (a[i]?.optionValue.position ?? 0) - (b[i]?.optionValue.position ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function swatch(meta: unknown): string | null {
  const hex = (meta as { hex?: unknown } | null)?.hex;
  return typeof hex === "string" ? hex : null;
}

export default async function EditProductPage({ params }: Props): Promise<React.ReactElement> {
  const { id } = await params;
  const [seller, categories] = await Promise.all([
    getSeller(),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const raw = await db.product.findUnique({
    where: { id, sellerId: seller.id, deletedAt: null },
    select: {
      id: true,
      name: true,
      brand: true,
      slug: true,
      description: true,
      coverImage: true,
      images: true,
      defaultVariantId: true,
      categories: { take: 1, select: { categoryId: true } },
      options: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          values: { orderBy: { position: "asc" }, select: { id: true, value: true, meta: true } },
        },
      },
      variants: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          price: true,
          discount: true,
          quantity: true,
          sku: true,
          coverImage: true,
          images: true,
          deletedAt: true,
          optionValues: {
            select: { optionValue: { select: { value: true, position: true, option: { select: { position: true } } } } },
          },
        },
      },
    },
  });
  if (!raw) notFound();

  const variants = raw.variants
    .map((v) => ({ ...v, optionValues: [...v.optionValues].sort(byOption) }))
    .sort((a, b) => compareVariants(a.optionValues, b.optionValues));

  const product: EditableProduct = {
    id: raw.id,
    name: raw.name,
    brand: raw.brand,
    slug: raw.slug,
    description: raw.description,
    coverImage: raw.coverImage,
    images: raw.images,
    categoryId: raw.categories[0]?.categoryId ?? "",
    defaultVariantId: raw.defaultVariantId ?? variants[0]?.id ?? "",
    options: raw.options.map((o) => ({
      id: o.id,
      name: o.name,
      values: o.values.map((v) => ({ id: v.id, value: v.value, hex: swatch(v.meta) })),
    })),
    variants: variants.map((v) => ({
      id: v.id,
      label: v.optionValues.map((ov) => ov.optionValue.value).join(" / ") || "Single variant",
      price: v.price.toNumber(),
      discount: v.discount?.toNumber() ?? null,
      quantity: v.quantity,
      sku: v.sku,
      coverImage: v.coverImage,
      images: v.images,
      archived: v.deletedAt !== null,
    })),
  };

  return (
    <>
      <PageHeader title={product.name} description="Edit product" back={{ href: "/products", label: "Products" }} />

      <PageBody>
        <EditProductForm product={product} categories={categories} />
      </PageBody>
    </>
  );
}
