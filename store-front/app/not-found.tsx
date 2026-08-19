import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function NotFound(): React.ReactElement {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Compass />
          </EmptyMedia>
          <EmptyTitle>We could not find that page</EmptyTitle>
          <EmptyDescription>
            The link may be out of date, or the product may no longer be listed.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/">Back to the store</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
