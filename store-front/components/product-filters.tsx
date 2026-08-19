"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type SortKey } from "@/types";

type Category = { id: string; name: string; slug: string };

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

type Props = {
  categories: Category[];
  currentQ: string;
  currentCategory: string;
  currentSort: SortKey;
  currentMin: string;
  currentMax: string;
};

export function ProductFilters({
  categories,
  currentQ,
  currentCategory,
  currentSort,
  currentMin,
  currentMax,
}: Props): React.ReactElement {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const minInput = useRef<HTMLInputElement>(null);
  const maxInput = useRef<HTMLInputElement>(null);

  function buildUrl(category: string, sort: SortKey): string {
    const q = searchInput.current?.value.trim() ?? currentQ;
    const min = minInput.current?.value ?? currentMin;
    const max = maxInput.current?.value ?? currentMax;

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (sort !== "newest") params.set("sort", sort);
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  }

  function applyTextFiltersAfter(delay: number): void {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => router.replace(buildUrl(currentCategory, currentSort)), delay);
  }

  function handleCategory(slug: string): void {
    router.replace(buildUrl(currentCategory === slug ? "" : slug, currentSort));
  }

  function handleSort(value: string): void {
    router.replace(buildUrl(currentCategory, value as SortKey));
  }

  function handleClear(): void {
    for (const input of [searchInput, minInput, maxInput]) {
      if (input.current) input.current.value = "";
    }
    router.replace("/products");
  }

  const hasFilters =
    currentQ || currentCategory || currentSort !== "newest" || currentMin || currentMax;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInput}
            type="search"
            defaultValue={currentQ}
            placeholder="Search products…"
            onChange={() => applyTextFiltersAfter(300)}
            className="h-9 w-full rounded-lg border bg-transparent pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <Select value={currentSort} onValueChange={handleSort}>
          <SelectTrigger aria-label="Sort products" className="h-9 sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="eyebrow shrink-0">Price</span>
        <input
          ref={minInput}
          type="number"
          min={0}
          inputMode="numeric"
          defaultValue={currentMin}
          placeholder="Min"
          aria-label="Minimum price"
          onChange={() => applyTextFiltersAfter(500)}
          className="h-8 w-24 rounded-lg border bg-transparent px-2.5 text-sm tabular-nums placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <span className="text-muted-foreground">–</span>
        <input
          ref={maxInput}
          type="number"
          min={0}
          inputMode="numeric"
          defaultValue={currentMax}
          placeholder="Max"
          aria-label="Maximum price"
          onChange={() => applyTextFiltersAfter(500)}
          className="h-8 w-24 rounded-lg border bg-transparent px-2.5 text-sm tabular-nums placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCategory(c.slug)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                currentCategory === c.slug
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground",
              )}
            >
              {c.name}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-3" />
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
