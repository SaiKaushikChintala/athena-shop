export default function AuthLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex w-36 select-none flex-col items-center">
        <span className="font-mono text-[0.6rem] font-medium uppercase tracking-[0.5em] text-muted-foreground/60">
          ATHENA
        </span>
        <div className="my-1.5 h-px w-full bg-border" />
        <span className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-primary">STORE</span>
      </div>
      {children}
    </div>
  );
}
