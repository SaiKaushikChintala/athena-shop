import Link from "next/link";
import { Package, Search, ShoppingBag } from "lucide-react";

type Props = {
  initials: string;
  cartCount: number;
};

function SearchForm({ className }: { className?: string }): React.ReactElement {
  return (
    <form action="/products" role="search" className={className}>
      <label className="relative block">
        <span className="sr-only">Search products</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          name="q"
          placeholder="Search products…"
          className="h-10 w-full rounded-full border bg-card pl-9 pr-4 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </label>
    </form>
  );
}

export function SiteHeader({ initials, cartCount }: Props): React.ReactElement {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:gap-6 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 select-none flex-col" aria-label="Athena Store home">
          <span className="font-mono text-[0.5rem] font-medium uppercase leading-none tracking-[0.5em] text-muted-foreground/60">
            ATHENA
          </span>
          <span className="font-mono text-sm font-bold uppercase leading-tight tracking-[0.25em] text-primary">
            STORE
          </span>
        </Link>

        <SearchForm className="hidden flex-1 md:block md:max-w-md lg:max-w-lg" />

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/products"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:block"
          >
            Shop
          </Link>
          <Link
            href="/orders"
            aria-label="My orders"
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Package className="size-5" />
            <span className="hidden lg:inline">Orders</span>
          </Link>
          <Link
            href="/cart"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
            className="relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <span className="relative">
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary font-mono text-[0.6rem] font-bold text-primary-foreground ring-2 ring-background">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </span>
            <span className="hidden lg:inline">Cart</span>
          </Link>
          <Link
            href="/account"
            aria-label="Account"
            className="ml-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-chart-5 font-mono text-xs font-black text-primary-foreground shadow-sm ring-2 ring-background transition-transform hover:scale-105"
          >
            {initials}
          </Link>
        </nav>
      </div>

      <div className="border-t px-4 py-2 md:hidden">
        <SearchForm />
      </div>
    </header>
  );
}
