import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageBody, PageHeader } from "@/components/page-header";
import { ProductsList } from "@/components/products-list";
import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { type SellerProduct } from "@/types";

export default async function ProductsPage(): Promise<React.ReactElement> {
  const seller = await getSeller();

  const raw = await db.product.findMany({
    where: { sellerId: seller.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      brand: true,
      coverImage: true,
      categories: { take: 1, select: { category: { select: { name: true } } } },
      variants: { where: { deletedAt: null }, select: { price: true, discount: true, quantity: true } },
      options: { orderBy: { position: "asc" }, select: { name: true, _count: { select: { values: true } } } },
      Featured: { select: { id: true } },
    },
  });

  const products: SellerProduct[] = raw.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    coverImage: p.coverImage,
    category: p.categories[0]?.category.name ?? null,
    featured: p.Featured !== null,
    options: p.options.map((o) => ({ name: o.name, valueCount: o._count.values })),
    variants: p.variants.map((v) => ({
      price: v.price.toNumber(),
      discount: v.discount?.toNumber() ?? null,
      quantity: v.quantity,
    })),
  }));

  return (
    <>
      <PageHeader
        title="Products"
        description={
          products.length > 0 ? `${products.length} live product${products.length !== 1 ? "s" : ""}` : undefined
        }
        action={
          <Button asChild size="sm">
            <Link href="/products/new">
              <Plus data-icon="inline-start" />
              New product
            </Link>
          </Button>
        }
      />

      <PageBody>
        <ProductsList products={products} />
      </PageBody>
    </>
  );
}
