import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <p className="text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">
        404
      </p>
      <h1 className="mt-3 font-heading text-4xl tracking-tight">
        This piece isn’t here
      </h1>
      <p className="mt-3 text-muted-foreground">
        It may be unpublished, or the link might be wrong.
      </p>
      <Button className="mt-8" nativeButton={false} render={<Link href="/" />}>
        Back to feed
      </Button>
    </div>
  );
}
