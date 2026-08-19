import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton } from "@/components/header-skeleton";

export default function ProductLoading(): React.ReactElement {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <HeaderSkeleton />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Skeleton className="h-4 w-48" />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-14">
          <div className="flex flex-col gap-3">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="size-16 shrink-0 rounded-lg" />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-4 w-28" />
            </div>

            <Skeleton className="h-16 w-full rounded-2xl" />

            <div className="flex flex-col gap-5">
              {[4, 5].map((count) => (
                <div key={count} className="flex flex-col gap-2">
                  <Skeleton className="h-2.5 w-12" />
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: count }).map((_, j) => (
                      <Skeleton key={j} className="h-8 w-12 rounded-md" />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-11 w-full rounded-md" />

            <div className="flex flex-col gap-2 border-t pt-6">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
