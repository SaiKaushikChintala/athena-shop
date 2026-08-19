import Link from "next/link";
import { MessageSquare, Star } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PageBody, PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { getSeller } from "@/lib/dal";
import { cn } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function Stars({ value }: { value: number }): React.ReactElement {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={cn("size-3.5", i < Math.round(value) ? "fill-current text-rating" : "text-muted-foreground/25")}
        />
      ))}
    </div>
  );
}

export default async function ReviewsPage(): Promise<React.ReactElement> {
  const seller = await getSeller();
  const mine = { product: { sellerId: seller.id } };

  const [reviews, agg] = await Promise.all([
    db.review.findMany({
      where: mine,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        review: true,
        rating: true,
        createdAt: true,
        customer: { select: { firstName: true, lastName: true } },
        product: { select: { id: true, name: true } },
      },
    }),
    db.review.aggregate({ where: mine, _avg: { rating: true }, _count: { rating: true } }),
  ]);

  const count = agg._count.rating;
  const avg = agg._avg.rating?.toNumber() ?? null;

  return (
    <>
      <PageHeader
        title="Reviews"
        description={count > 0 ? `${count} review${count !== 1 ? "s" : ""} across your products` : undefined}
      />

      <PageBody>
        {reviews.length === 0 ? (
          <Empty className="border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquare />
              </EmptyMedia>
              <EmptyTitle>No reviews yet</EmptyTitle>
              <EmptyDescription>Customers can review a product once their order has been delivered.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {avg !== null && (
              <Card size="sm" className="gap-2">
                <CardHeader>
                  <p className="eyebrow">Average rating</p>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <p className="font-heading text-3xl font-bold tracking-tight tabular-nums text-foreground">
                    {avg.toFixed(1)}
                  </p>
                  <Stars value={avg} />
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col gap-3">
              {reviews.map((r) => (
                <div key={r.id} className="flex flex-col gap-2 rounded-xl border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <Stars value={r.rating.toNumber()} />
                      <p className="font-medium text-foreground">{r.title}</p>
                    </div>
                    <Link
                      href={`/products/${r.product.id}`}
                      className="shrink-0 text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                    >
                      {r.product.name}
                    </Link>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">{r.review}</p>

                  <p className="eyebrow">
                    {r.customer.firstName} {r.customer.lastName} · {dateFormat.format(r.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </PageBody>
    </>
  );
}
