import { db } from "@/lib/db";
import { CARD_SELECT } from "@/lib/product";

const CO_PURCHASE_SCAN_LIMIT = 500;

export async function coPurchasedIds(productId: string, limit: number): Promise<string[]> {
  const orders = await db.orderItem.findMany({
    where: { variant: { productId } },
    select: { orderId: true },
    take: CO_PURCHASE_SCAN_LIMIT,
    orderBy: { order: { createdAt: "desc" } },
  });

  const orderIds = [...new Set<string>(orders.map((o) => o.orderId))];
  if (orderIds.length === 0) return [];

  const siblings = await db.orderItem.findMany({
    where: {
      orderId: { in: orderIds },
      NOT: { variant: { productId } },
      variant: { product: { deletedAt: null } },
    },
    select: { variant: { select: { productId: true } } },
    take: CO_PURCHASE_SCAN_LIMIT,
  });

  const counts = new Map<string, number>();
  for (const s of siblings) {
    const id = s.variant.productId;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

async function relatedProductIds(productId: string, limit: number): Promise<string[]> {
  const picked: string[] = [];
  const seen = new Set<string>([productId]);

  const add = (ids: string[]): void => {
    for (const id of ids) {
      if (picked.length >= limit) return;
      if (seen.has(id)) continue;
      seen.add(id);
      picked.push(id);
    }
  };

  add(await coPurchasedIds(productId, limit));
  if (picked.length >= limit) return picked;

  const self = await db.product.findUnique({
    where: { id: productId },
    select: {
      brand: true,
      categories: { select: { categoryId: true } },
    },
  });
  if (!self) return picked;

  const categoryIds = self.categories.map((c) => c.categoryId);

  if (categoryIds.length > 0) {
    const sameCategory = await db.product.findMany({
      where: {
        deletedAt: null,
        id: { notIn: [...seen] },
        categories: { some: { categoryId: { in: categoryIds } } },
      },
      orderBy: [{ rating: "desc" }, { reviewsCount: "desc" }],
      take: limit,
      select: { id: true },
    });
    add(sameCategory.map((p) => p.id));
    if (picked.length >= limit) return picked;
  }

  const sameBrand = await db.product.findMany({
    where: { deletedAt: null, brand: self.brand, id: { notIn: [...seen] } },
    orderBy: [{ rating: "desc" }, { reviewsCount: "desc" }],
    take: limit,
    select: { id: true },
  });
  add(sameBrand.map((p) => p.id));
  if (picked.length >= limit) return picked;

  const topRated = await db.product.findMany({
    where: { deletedAt: null, id: { notIn: [...seen] }, reviewsCount: { gt: 0 } },
    orderBy: [{ rating: "desc" }, { reviewsCount: "desc" }],
    take: limit,
    select: { id: true },
  });
  add(topRated.map((p) => p.id));

  return picked;
}

async function cardsFor(ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await db.product.findMany({
    where: { id: { in: ids } },
    select: CARD_SELECT,
  });
  const byId = new Map<string, (typeof rows)[number]>(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter((p) => p !== undefined);
}

export async function getBoughtTogether(productId: string, limit = 4) {
  return cardsFor(await coPurchasedIds(productId, limit));
}

export async function getRelatedProducts(
  productId: string,
  limit = 4,
  exclude: string[] = [],
) {
  const ids = (await relatedProductIds(productId, limit + exclude.length))
    .filter((id) => !exclude.includes(id))
    .slice(0, limit);
  return cardsFor(ids);
}
