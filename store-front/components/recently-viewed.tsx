import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/page-shell";
import { CARD_SELECT, toCardData } from "@/lib/product";

type Props = {
  customerId: string;
  excludeProductId?: string;
  limit?: number;
};

export async function RecentlyViewed({ customerId, excludeProductId, limit = 4 }: Props): Promise<React.ReactNode> {
  const rows = await db.recentlyViewed.findMany({
    where: {
      customerId,
      product: { deletedAt: null },
      ...(excludeProductId ? { NOT: { productId: excludeProductId } } : {}),
    },
    orderBy: { viewedAt: "desc" },
    take: limit,
    select: { id: true, product: { select: CARD_SELECT } },
  });

  if (rows.length === 0) return null;

  return (
    <section className="flex flex-col gap-5">
      <SectionHeading title="Recently viewed" />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
        {rows.map((row) => (
          <ProductCard key={row.id} product={toCardData(row.product)} />
        ))}
      </div>
    </section>
  );
}
