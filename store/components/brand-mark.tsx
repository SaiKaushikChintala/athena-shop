import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }): React.ReactElement {
  return (
    <div className={cn("flex select-none flex-col items-center", className)}>
      <span className="font-mono text-[0.6rem] font-medium uppercase tracking-[0.5em] text-muted-foreground/60">
        ATHENA
      </span>
      <div className="my-1.5 h-px w-full bg-border" />
      <span className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-primary">SELLER</span>
    </div>
  );
}
