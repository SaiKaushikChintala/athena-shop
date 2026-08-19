import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  width = "wide",
  className,
}: {
  children: React.ReactNode;
  width?: "wide" | "narrow";
  className?: string;
}): React.ReactElement {
  return (
    <>
      <main
        className={cn(
          "mx-auto flex w-full flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8",
          width === "wide" ? "max-w-7xl" : "max-w-3xl",
          className,
        )}
      >
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = "View all",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}): React.ReactElement {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-accent"
        >
          {linkLabel}
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return <h2 className={cn("eyebrow", className)}>{children}</h2>;
}
