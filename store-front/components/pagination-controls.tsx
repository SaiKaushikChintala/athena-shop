import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  prevUrl: string | null;
  nextUrl: string | null;
};

export function PaginationControls({ page, totalPages, prevUrl, nextUrl }: Props): React.ReactNode {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      {prevUrl ? (
        <Link
          href={prevUrl}
          className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Previous
        </Link>
      ) : (
        <span className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground/30 cursor-not-allowed select-none">
          <ChevronLeft className="size-4" />
          Previous
        </span>
      )}

      <span className="font-mono text-xs text-muted-foreground">
        {page} / {totalPages}
      </span>

      {nextUrl ? (
        <Link
          href={nextUrl}
          className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          Next
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground/30 cursor-not-allowed select-none">
          Next
          <ChevronRight className="size-4" />
        </span>
      )}
    </div>
  );
}
