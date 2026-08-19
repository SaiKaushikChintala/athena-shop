"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Home, Package, PanelLeft, RotateCcw, ShoppingBag, Star, Tag } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LogOutButton } from "@/components/log-out-button";
import { cn } from "@/lib/utils";

type Props = {
  sellerName: string;
  children: React.ReactNode;
};

const NAV = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/products", icon: Package, label: "Products" },
  { href: "/orders", icon: ShoppingBag, label: "Orders" },
  { href: "/returns", icon: RotateCcw, label: "Returns" },
  { href: "/reviews", icon: Star, label: "Reviews" },
  { href: "/coupons", icon: Tag, label: "Coupons" },
  { href: "/analytics", icon: BarChart2, label: "Analytics" },
];

function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function RailLabel({ expanded, children }: { expanded: boolean; children: React.ReactNode }): React.ReactElement {
  return (
    <span
      className={cn(
        "whitespace-nowrap text-sm font-medium transition-opacity duration-150",
        expanded ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      {children}
    </span>
  );
}

export function DashboardShell({ sellerName, children }: Props): React.ReactElement {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-svh flex-col gap-2 bg-background p-2 sm:gap-3 sm:p-3">
        <header className="flex items-center justify-between rounded-2xl border bg-card px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex shrink-0 select-none flex-col">
              <span className="font-mono text-[0.5rem] font-medium uppercase leading-none tracking-[0.5em] text-muted-foreground/60">
                ATHENA
              </span>
              <span className="font-mono text-xs font-bold uppercase leading-tight tracking-[0.25em] text-primary">
                SELLER
              </span>
            </Link>
            <Separator orientation="vertical" className="h-5" />
            <span className="truncate text-sm font-semibold text-foreground">{sellerName}</span>
          </div>
          <LogOutButton />
        </header>

        <nav
          aria-label="Sections"
          className="-mx-2 flex gap-1 overflow-x-auto px-2 scrollbar-none sm:-mx-3 sm:px-3 md:hidden"
        >
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex min-h-0 flex-1 gap-2 sm:gap-3">
          <nav
            className={cn(
              "hidden shrink-0 flex-col gap-1 overflow-hidden rounded-2xl border bg-card p-2 transition-[width] duration-200 ease-out md:flex",
              expanded ? "w-48" : "w-14",
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setExpanded((v) => !v)}
                  aria-label={expanded ? "Collapse menu" : "Expand menu"}
                  aria-expanded={expanded}
                  className="flex h-10 w-full shrink-0 items-center gap-3 rounded-xl px-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <PanelLeft className="size-5 shrink-0" />
                  <RailLabel expanded={expanded}>Collapse</RailLabel>
                </button>
              </TooltipTrigger>
              {!expanded && <TooltipContent side="right">Expand menu</TooltipContent>}
            </Tooltip>

            <Separator className="my-1" />

            {NAV.map(({ href, icon: Icon, label }) => {
              const active = isActivePath(pathname, href);
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-10 shrink-0 items-center gap-3 rounded-xl px-2.5 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="size-5 shrink-0" />
                      <RailLabel expanded={expanded}>{label}</RailLabel>
                    </Link>
                  </TooltipTrigger>
                  {!expanded && <TooltipContent side="right">{label}</TooltipContent>}
                </Tooltip>
              );
            })}
          </nav>

          <main className="min-w-0 flex-1 overflow-auto rounded-2xl border bg-card">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
