import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton } from "@/components/header-skeleton";

export default function CheckoutLoading(): React.ReactElement {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <HeaderSkeleton />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>

        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          <div className="flex flex-1 flex-col gap-8">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-3 w-36" />
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-3 w-36" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          <div className="flex w-full flex-col gap-4 rounded-xl border p-5 lg:w-80 lg:shrink-0">
            <Skeleton className="h-3 w-28" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-16 shrink-0 rounded-lg" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
            <Skeleton className="h-px w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
