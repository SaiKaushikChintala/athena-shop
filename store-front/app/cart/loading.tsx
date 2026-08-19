import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton } from "@/components/header-skeleton";

export default function CartLoading(): React.ReactElement {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <HeaderSkeleton />

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="divide-y rounded-xl border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 sm:gap-5 sm:p-5">
              <Skeleton className="size-20 shrink-0 rounded-lg sm:size-24" />
              <div className="flex flex-1 flex-col justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
              <Skeleton className="h-5 w-16 self-end" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </main>
    </div>
  );
}
