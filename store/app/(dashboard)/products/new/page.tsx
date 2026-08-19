import { PageBody, PageHeader } from "@/components/page-header";
import { CreateProductForm } from "@/components/create-product-form";
import { db } from "@/lib/db";

export default async function NewProductPage(): Promise<React.ReactElement> {
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <>
      <PageHeader
        title="New product"
        description="Add the details, options, and variants buyers will see."
        back={{ href: "/products", label: "Products" }}
      />

      <PageBody>
        <CreateProductForm categories={categories} />
      </PageBody>
    </>
  );
}
