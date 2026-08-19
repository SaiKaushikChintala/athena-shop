"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  rating: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASS = { sm: "text-sm", md: "text-base", lg: "text-2xl" } as const;

export function Stars({ rating, interactive = false, onChange, size = "md" }: Props): React.ReactElement {
  const [hovered, setHovered] = useState<number>(0);
  const shown = interactive ? hovered || rating : rating;

  return (
    <div
      className="flex gap-0.5"
      role={interactive ? undefined : "img"}
      aria-label={interactive ? undefined : `${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type={interactive ? "button" : undefined}
          onClick={interactive && onChange ? () => onChange(n) : undefined}
          onMouseEnter={interactive ? () => setHovered(n) : undefined}
          onMouseLeave={interactive ? () => setHovered(0) : undefined}
          className={interactive ? "focus:outline-none" : "pointer-events-none"}
          aria-label={interactive ? `${n} star${n !== 1 ? "s" : ""}` : undefined}
          aria-hidden={interactive ? undefined : true}
          tabIndex={interactive ? undefined : -1}
        >
          <span
            className={cn(
              "leading-none",
              SIZE_CLASS[size],
              n <= shown ? "text-rating drop-shadow-[0_1px_0_rgb(0_0_0/0.08)]" : "text-muted-foreground/25",
            )}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}
