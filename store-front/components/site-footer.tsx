import Link from "next/link";

const YEAR = new Date().getFullYear();

const LINKS = [
  { href: "/products", label: "Shop all" },
  { href: "/orders", label: "Orders" },
  { href: "/cart", label: "Cart" },
  { href: "/account", label: "Account" },
];

export function SiteFooter(): React.ReactElement {
  return (
    <footer className="mt-auto border-t bg-card/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-primary">
            Athena Store
          </span>
          <p className="text-sm text-muted-foreground">
            Independent makers, one checkout. Free shipping on every order.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          © {YEAR} Athena. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
