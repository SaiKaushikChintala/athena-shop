import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton } from "@/components/header-skeleton";

function ProductCardSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="flex flex-col gap-1.5 px-0.5">
        <Skeleton className="h-2.5 w-12" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
    </div>
  );
}

export default function ProductsLoading(): React.ReactElement {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <HeaderSkeleton />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-56 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
