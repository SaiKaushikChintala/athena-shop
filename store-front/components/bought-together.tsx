import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/page-shell";
import { getBoughtTogether } from "@/lib/recommendations";
import { toCardData } from "@/lib/product";

type Props = {
  productId: string;
  limit?: number;
};

export async function BoughtTogether({ productId, limit = 4 }: Props): Promise<React.ReactNode> {
  const products = await getBoughtTogether(productId, limit);
  if (products.length === 0) return null;

  return (
    <section className="flex flex-col gap-5">
      <SectionHeading title="Frequently bought together" />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={toCardData(product)} />
        ))}
      </div>
    </section>
  );
}
