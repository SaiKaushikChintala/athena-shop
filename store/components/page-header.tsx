import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  action?: React.ReactNode;
};

type PageBodyProps = {
  children: React.ReactNode;
  width?: "full" | "form";
};

type SectionLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, back, action }: PageHeaderProps): React.ReactElement {
  return (
    <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b bg-card/85 px-4 py-4 backdrop-blur-sm sm:px-6">
      <div className="flex min-w-0 flex-col gap-1">
        {back && (
          <Link
            href={back.href}
            className="eyebrow inline-flex w-fit items-center gap-1 transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3" />
            {back.label}
          </Link>
        )}
        <h1 className="truncate font-heading text-lg font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function PageBody({ children, width = "full" }: PageBodyProps): React.ReactElement {
  return (
    <div className={cn("flex flex-col gap-8 px-4 py-5 sm:px-6 sm:py-6", width === "form" && "max-w-xl")}>
      {children}
    </div>
  );
}

export function SectionLabel({ children, className }: SectionLabelProps): React.ReactElement {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}
