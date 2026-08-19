import { DashboardShell } from "@/components/dashboard-shell";
import { getSeller } from "@/lib/dal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const seller = await getSeller();
  return <DashboardShell sellerName={seller.businessName}>{children}</DashboardShell>;
}
