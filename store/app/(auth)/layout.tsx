import { BrandMark } from "@/components/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
      <BrandMark className="mb-8 w-36" />
      {children}
    </div>
  );
}
