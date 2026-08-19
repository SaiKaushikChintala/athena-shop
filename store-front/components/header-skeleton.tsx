import { Skeleton } from "@/components/ui/skeleton";

export function HeaderSkeleton(): React.ReactElement {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-2 w-10" />
          <Skeleton className="h-3 w-14" />
        </div>
        <Skeleton className="hidden h-10 max-w-lg flex-1 rounded-full md:block" />
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
    </header>
  );
}
