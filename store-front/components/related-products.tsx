import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/page-shell";
import { getRelatedProducts } from "@/lib/recommendations";
import { toCardData } from "@/lib/product";

type Props = {
  productId: string;
  limit?: number;
  exclude?: string[];
};

export async function RelatedProducts({ productId, limit = 4, exclude = [] }: Props): Promise<React.ReactNode> {
  const products = await getRelatedProducts(productId, limit, exclude);
  if (products.length === 0) return null;

  return (
    <section className="flex flex-col gap-5">
      <SectionHeading title="You might also like" />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={toCardData(product)} />
        ))}
      </div>
    </section>
  );
}
