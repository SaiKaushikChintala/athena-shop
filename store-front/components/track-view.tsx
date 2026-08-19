"use client";

import { useEffect, useRef } from "react";

export function TrackView({ productId }: { productId: string }): React.ReactNode {
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (sent.current === productId) return;
    sent.current = productId;

    fetch("/api/recently-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    }).catch(() => undefined);
  }, [productId]);

  return null;
}
