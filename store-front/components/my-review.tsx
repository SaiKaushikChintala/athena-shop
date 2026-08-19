"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Stars } from "@/components/stars";
import { ReviewForm } from "@/components/review-form";
import { type OwnReview } from "@/types";

type Props = {
  productId: string;
  variantId: string;
  review: OwnReview | null;
  variant?: "compact" | "full";
};

export function MyReview({
  productId,
  variantId,
  review,
  variant = "compact",
}: Props): React.ReactElement {
  const router = useRouter();
  const [editing, setEditing] = useState<boolean>(false);
  const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  async function handleDelete(): Promise<void> {
    if (!review) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not delete your review.");
        return;
      }
      toast.success("Review deleted");
      setConfirmingDelete(false);
      router.refresh();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-lg border p-4">
        <ReviewForm
          productId={productId}
          variantId={variantId}
          existing={review ?? undefined}
          onCancel={() => setEditing(false)}
          onDone={() => {
            setEditing(false);
            toast.success(review ? "Review updated" : "Thanks for your review!");
            router.refresh();
          }}
        />
      </div>
    );
  }

  if (!review) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setEditing(true)}
      >
        <Star data-icon="inline-start" />
        Write a review
      </Button>
    );
  }

  return (
    <div
      className={
        variant === "full"
          ? "flex flex-col gap-2 rounded-xl border bg-accent/30 p-4"
          : "flex flex-col gap-1.5 rounded-lg border bg-muted/20 p-3"
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="eyebrow">Your review</span>
          <Stars rating={review.rating} size="sm" />
        </div>
        <div className="flex items-center gap-1">
          {confirmingDelete ? (
            <>
              <span className="mr-1 text-xs text-muted-foreground">Delete?</span>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? "Deleting" : "Delete"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={deleting}
                onClick={() => setConfirmingDelete(false)}
              >
                Keep
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit review"
                onClick={() => setEditing(true)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete review"
                className="hover:text-destructive"
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground">{review.title}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{review.review}</p>
    </div>
  );
}
