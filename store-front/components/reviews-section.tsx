import { Separator } from "@/components/ui/separator";
import { Stars } from "@/components/stars";
import { MyReview } from "@/components/my-review";
import { type OwnReview, type Review } from "@/types";

type Props = {
  productId: string;
  deliveredVariantId: string | null;
  reviews: Review[];
  myReview: OwnReview | null;
};

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function RatingSummary({ reviews }: { reviews: Review[] }): React.ReactElement {
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="flex shrink-0 flex-col gap-4 sm:w-52">
      <div>
        <p className="text-5xl font-bold tracking-tight text-foreground tabular-nums">{average.toFixed(1)}</p>
        <Stars rating={Math.round(average)} size="md" />
        <p className="mt-1 text-xs text-muted-foreground">
          {reviews.length} rating{reviews.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const pct = (reviews.filter((r) => Math.round(r.rating) === star).length / reviews.length) * 100;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="w-3 text-right text-xs tabular-nums text-muted-foreground">{star}</span>
              <span className="text-xs text-muted-foreground">★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-rating transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-7 text-right text-xs tabular-nums text-muted-foreground">
                {Math.round(pct)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewsSection({ productId, deliveredVariantId, reviews, myReview }: Props): React.ReactElement {
  const showOwnCard = myReview !== null && deliveredVariantId !== null;
  const others = showOwnCard
    ? reviews.filter((r) => r.id !== myReview.id)
    : [...reviews].sort((a, b) => Number(b.id === myReview?.id) - Number(a.id === myReview?.id));

  return (
    <div id="reviews" className="flex flex-col gap-10">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">Customer reviews</h2>

      {showOwnCard && (
        <MyReview productId={productId} variantId={deliveredVariantId} review={myReview} variant="full" />
      )}

      {reviews.length > 0 ? (
        <div className="flex flex-col gap-10 sm:flex-row sm:gap-16">
          <RatingSummary reviews={reviews} />

          <div className="flex flex-1 flex-col divide-y">
            {others.map((r) => (
              <div key={r.id} className="flex flex-col gap-1.5 py-5 first:pt-0">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-foreground">
                    {r.customer.firstName} {r.customer.lastName[0]}.
                  </span>
                  <span className="text-xs text-muted-foreground">{dateFormat.format(new Date(r.createdAt))}</span>
                </div>
                <Stars rating={r.rating} size="sm" />
                <p className="text-sm font-semibold text-foreground">{r.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{r.review}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>
      )}

      {!myReview && (
        <>
          <Separator />
          {deliveredVariantId ? (
            <div className="flex max-w-lg flex-col gap-3">
              <h3 className="text-base font-semibold tracking-tight text-foreground">Review this product</h3>
              <MyReview productId={productId} variantId={deliveredVariantId} review={null} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Reviews open once this product has been delivered to you.</p>
          )}
        </>
      )}
    </div>
  );
}
